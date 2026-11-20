package sources

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"kagemi-go/internal/models"
)

const hepdramaBase = "https://hepdrama.com"

var (
	hepFeedCache   = make(map[string]cacheEntry)
	hepDetailCache = make(map[string]detailCacheEntry)
	hepStreamCache = make(map[string]streamCacheEntry)
	hepMu          sync.RWMutex

	reSeriesRSC = regexp.MustCompile(`"slug":"([^"]+)","title":"([^"]+)"[\s\S]*?"synopsis":(".*?"|null)[\s\S]*?"posterUrl":"([^"]+)"[\s\S]*?"episodeCount":(\d+)`)
	reEpisode   = regexp.MustCompile(`\{"id":"([0-9a-fA-F-]+)","number":(\d+)[^{}]*?"thumbnailUrl":(".*?"|null)[^{}]*?\}`)
)

type cacheEntry struct {
	items []models.ShortDramaItem
	exp   time.Time
}

type detailCacheEntry struct {
	detail *models.ShortDramaDetail
	exp    time.Time
}

type streamCacheEntry struct {
	url string
	exp time.Time
}

func client() *http.Client {
	return &http.Client{
		Timeout: 10 * time.Second,
	}
}

func detectHepStudio(title, synopsis string) string {
	combined := strings.ToLower(title + " " + synopsis)
	if strings.Contains(combined, "goodshort") || strings.Contains(combined, "goodbos") {
		return "GoodShort"
	}
	if strings.Contains(combined, "shorttv") || strings.Contains(combined, "volcengine") {
		return "ShortTV"
	}
	if strings.Contains(combined, "reelshort") || strings.Contains(combined, "crazymaple") {
		return "ReelShort"
	}
	if strings.Contains(combined, "moboreels") || strings.Contains(combined, "mobo") {
		return "MoboReels"
	}
	if strings.Contains(combined, "kalostv") || strings.Contains(combined, "kalos") {
		return "Kalos TV"
	}
	if strings.Contains(combined, "topshort") {
		return "TopShort"
	}
	if strings.Contains(combined, "netshort") {
		return "NetShort"
	}
	if strings.Contains(combined, "meloshort") || strings.Contains(combined, "melolo") {
		return "MeloShort"
	}
	if strings.Contains(combined, "flickreel") {
		return "FlickReels"
	}
	if strings.Contains(combined, "anyreel") {
		return "AnyReel"
	}
	if strings.Contains(combined, "sereal") {
		return "Sereal"
	}
	return "DramaBox"
}

// FetchFeed returns categorized series from HepDrama
func FetchHepDramaFeed(category string, page int) ([]models.ShortDramaItem, error) {
	if category == "" {
		if page%2 == 0 {
			category = "revenge"
		} else {
			category = "billionaire-ceo"
		}
	}

	hepMu.RLock()
	if c, ok := hepFeedCache[category]; ok && time.Now().Before(c.exp) {
		hepMu.RUnlock()
		return c.items, nil
	}
	hepMu.RUnlock()

	req, err := http.NewRequest("GET", fmt.Sprintf("%s/en/category/%s", hepdramaBase, category), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

	resp, err := client().Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	unescaped := strings.ReplaceAll(string(body), `\"`, `"`)
	matches := reSeriesRSC.FindAllStringSubmatch(unescaped, -1)

	var items []models.ShortDramaItem
	seen := make(map[string]bool)

	for _, m := range matches {
		if len(m) < 6 {
			continue
		}
		slug := m[1]
		if seen[slug] {
			continue
		}
		seen[slug] = true

		title := m[2]
		synopsis := m[3]
		if synopsis != "null" {
			synopsis = strings.Trim(synopsis, `"`)
		} else {
			synopsis = ""
		}

		poster := m[4]
		if !strings.HasPrefix(poster, "http") {
			poster = hepdramaBase + poster
		}

		epCount, _ := strconv.Atoi(m[5])
		if epCount <= 0 {
			epCount = 40
		}

		studio := detectHepStudio(title, synopsis)
		item := models.ShortDramaItem{
			ID:                 "hep_" + slug,
			Source:             "hepdrama",
			SourceName:         studio,
			Title:              title,
			Cover:              poster,
			Poster:             poster,
			Banner:             poster,
			Description:        synopsis,
			TotalEpisodes:      epCount,
			Language:           "English Dub",
			Tags:               []string{studio, strings.ReplaceAll(category, "-", " "), "Western CEO"},
			Status:             "Completed",
			IsUnlocked:         true,
			FirstEpisodeStream: fmt.Sprintf("/api/shorts/stream?source=hepdrama&seriesSlug=%s&epNum=1", url.QueryEscape(slug)),
		}
		items = append(items, item)
	}

	hepMu.Lock()
	hepFeedCache[category] = cacheEntry{
		items: items,
		exp:   time.Now().Add(30 * time.Minute),
	}
	hepMu.Unlock()

	return items, nil
}

// Search queries HepDrama API
func SearchHepDrama(q string) ([]models.ShortDramaItem, error) {
	q = strings.TrimSpace(q)
	if q == "" {
		return nil, nil
	}

	reqURL := fmt.Sprintf("%s/api/search?q=%s&lang=en", hepdramaBase, url.QueryEscape(q))
	req, err := http.NewRequest("GET", reqURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0")
	req.Header.Set("Accept", "application/json")

	resp, err := client().Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result struct {
		Items []struct {
			ID           string `json:"id"`
			Slug         string `json:"slug"`
			Title        string `json:"title"`
			PosterURL    string `json:"posterUrl"`
			EpisodeCount int    `json:"episodeCount"`
		} `json:"items"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	var items []models.ShortDramaItem
	for _, it := range result.Items {
		poster := it.PosterURL
		if !strings.HasPrefix(poster, "http") {
			poster = hepdramaBase + poster
		}
		studio := detectHepStudio(it.Title, "")
		items = append(items, models.ShortDramaItem{
			ID:                 "hep_" + it.Slug,
			Source:             "hepdrama",
			SourceName:         studio,
			Title:              it.Title,
			Cover:              poster,
			Poster:             poster,
			Banner:             poster,
			Description:        fmt.Sprintf("Watch %s with all %d episodes unlocked.", it.Title, it.EpisodeCount),
			TotalEpisodes:      it.EpisodeCount,
			Language:           "English Dub",
			Tags:               []string{studio, "Shorts", "Full Series"},
			Status:             "Completed",
			IsUnlocked:         true,
			FirstEpisodeStream: fmt.Sprintf("/api/shorts/stream?source=hepdrama&seriesSlug=%s&epNum=1", url.QueryEscape(it.Slug)),
		})
	}
	return items, nil
}

// FetchDetail extracts series metadata and all episode objects
func FetchHepDramaDetail(idOrSlug string) (*models.ShortDramaDetail, error) {
	slug := strings.TrimPrefix(idOrSlug, "hep_")

	hepMu.RLock()
	if c, ok := hepDetailCache[slug]; ok && time.Now().Before(c.exp) {
		hepMu.RUnlock()
		return c.detail, nil
	}
	hepMu.RUnlock()

	reqURL := fmt.Sprintf("%s/en/series/%s", hepdramaBase, slug)
	req, err := http.NewRequest("GET", reqURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0")

	resp, err := client().Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	unescaped := strings.ReplaceAll(string(body), `\"`, `"`)

	// Extract title
	title := strings.ReplaceAll(slug, "-", " ")
	reTitle := regexp.MustCompile(`<h1[^>]*>([^<]+)</h1>`)
	if tm := reTitle.FindStringSubmatch(string(body)); len(tm) > 1 {
		title = strings.TrimSpace(tm[1])
	}

	// Extract episodes
	epMatches := reEpisode.FindAllStringSubmatch(unescaped, -1)
	epMap := make(map[int]models.ShortDramaEpisode)

	var firstEpID string
	for _, em := range epMatches {
		if len(em) < 4 {
			continue
		}
		epID := em[1]
		epNum, _ := strconv.Atoi(em[2])
		if _, exists := epMap[epNum]; exists {
			continue
		}

		if epNum == 1 && firstEpID == "" {
			firstEpID = epID
		}

		thumb := strings.Trim(em[3], `"`)
		if thumb == "null" {
			thumb = ""
		}

		epMap[epNum] = models.ShortDramaEpisode{
			EpisodeNumber: epNum,
			Title:         fmt.Sprintf("Episode %d", epNum),
			StreamURL:     fmt.Sprintf("/api/shorts/stream?source=hepdrama&epId=%s&seriesSlug=%s&epNum=%d", epID, url.QueryEscape(slug), epNum),
			Type:          "hls",
			Thumbnail:     thumb,
			Source:        "hepdrama",
		}
	}

	var episodes []models.ShortDramaEpisode
	for i := 1; i <= len(epMap); i++ {
		if ep, ok := epMap[i]; ok {
			episodes = append(episodes, ep)
		}
	}

	studio := detectHepStudio(title, "")
	// Resolve episode 1 directly for immediate playback
	if len(episodes) > 0 && firstEpID != "" {
		if direct, err := ResolveHepDramaStream(firstEpID); err == nil && direct != "" {
			episodes[0].StreamURL = direct
			lowerDirect := strings.ToLower(direct)
			if strings.Contains(lowerDirect, "goodshort") || strings.Contains(lowerDirect, "goodbos") {
				studio = "GoodShort"
			} else if strings.Contains(lowerDirect, "shorttv") || strings.Contains(lowerDirect, "volcengine") {
				studio = "ShortTV"
			} else if strings.Contains(lowerDirect, "dramabox") || strings.Contains(lowerDirect, "hwztvideo") {
				studio = "DramaBox"
			} else if strings.Contains(lowerDirect, "reelshort") {
				studio = "ReelShort"
			}
		}
	}

	cover := fmt.Sprintf("https://cdn.hepdrama.com/posters/en-%s/poster.webp", slug)
	firstStream := ""
	if len(episodes) > 0 {
		firstStream = episodes[0].StreamURL
	}

	detail := &models.ShortDramaDetail{
		ShortDramaItem: models.ShortDramaItem{
			ID:                 "hep_" + slug,
			Source:             "hepdrama",
			SourceName:         studio,
			Title:              title,
			Cover:              cover,
			Poster:             cover,
			Banner:             cover,
			Description:        fmt.Sprintf("Watch all %d full episodes of %s in HD.", len(episodes), title),
			TotalEpisodes:      len(episodes),
			Language:           "English Dub",
			Tags:               []string{studio, "Romance", "Billionaire CEO", "Full Series"},
			Status:             "Completed",
			IsUnlocked:         true,
			FirstEpisodeStream: firstStream,
		},
		Episodes: episodes,
	}

	hepMu.Lock()
	hepDetailCache[slug] = detailCacheEntry{
		detail: detail,
		exp:    time.Now().Add(1 * time.Hour),
	}
	hepMu.Unlock()

	return detail, nil
}

// ResolveHepDramaStream queries the play API and follows 302 to the CDN HLS stream
func ResolveHepDramaStream(episodeID string) (string, error) {
	if episodeID == "" {
		return "", fmt.Errorf("empty episode ID")
	}

	hepMu.RLock()
	if c, ok := hepStreamCache[episodeID]; ok && time.Now().Before(c.exp) {
		hepMu.RUnlock()
		return c.url, nil
	}
	hepMu.RUnlock()

	playURL := fmt.Sprintf("%s/api/play/%s", hepdramaBase, episodeID)
	req, err := http.NewRequest("GET", playURL, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0")
	req.Header.Set("Referer", "https://hepdrama.com/")
	req.Header.Set("Accept", "application/json")

	resp, err := client().Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var playData struct {
		Sources []struct {
			URL string `json:"url"`
		} `json:"sources"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&playData); err != nil {
		return "", err
	}

	if len(playData.Sources) == 0 || playData.Sources[0].URL == "" {
		return "", fmt.Errorf("no stream source available")
	}

	relURL := playData.Sources[0].URL
	streamAPIURL := relURL
	if !strings.HasPrefix(streamAPIURL, "http") {
		streamAPIURL = hepdramaBase + relURL
	}

	// Follow 302 manually to obtain the direct CDN URL
	noFollowClient := &http.Client{
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		},
		Timeout: 5 * time.Second,
	}

	sReq, _ := http.NewRequest("GET", streamAPIURL, nil)
	sReq.Header.Set("User-Agent", "Mozilla/5.0")
	sReq.Header.Set("Referer", "https://hepdrama.com/")
	sResp, err := noFollowClient.Do(sReq)
	if err == nil {
		defer sResp.Body.Close()
		if loc := sResp.Header.Get("Location"); loc != "" {
			hepMu.Lock()
			hepStreamCache[episodeID] = streamCacheEntry{
				url: loc,
				exp: time.Now().Add(15 * time.Minute),
			}
			hepMu.Unlock()
			return loc, nil
		}
	}

	return streamAPIURL, nil
}
