package sources

import (
	"crypto/rand"
	"encoding/hex"
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

const nartoBase = "https://narto-drama.com"

var (
	nartoFeedCache   = make(map[string]cacheEntry)
	nartoDetailCache = make(map[string]detailCacheEntry)
	nartoMu          sync.RWMutex

	reEpisodeRaw = regexp.MustCompile(`const\s+episodeItemsRaw\s*=\s*(\[[\s\S]*?\]);`)
	reSlugTitle  = regexp.MustCompile(`[^a-z0-9]+`)
)

func freshNartoCookie() string {
	b := make([]byte, 4)
	rand.Read(b)
	return strconv.FormatInt(time.Now().UnixNano(), 36) + hex.EncodeToString(b)
}

// FetchNartoFeed retrieves multi-studio sections from Narto Drama
func FetchNartoFeed(sectionKey string, page int) ([]models.ShortDramaItem, error) {
	cacheKey := sectionKey
	if cacheKey == "" {
		cacheKey = "all"
	}

	nartoMu.RLock()
	if c, ok := nartoFeedCache[cacheKey]; ok && time.Now().Before(c.exp) {
		nartoMu.RUnlock()
		return c.items, nil
	}
	nartoMu.RUnlock()

	reqURL := fmt.Sprintf("%s/home/providers/sections", nartoBase)
	req, err := http.NewRequest("GET", reqURL, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
	req.Header.Set("Cookie", fmt.Sprintf("nd_ck=%s", freshNartoCookie()))
	req.Header.Set("Accept", "application/json, text/javascript, */*; q=0.01")
	req.Header.Set("X-Requested-With", "XMLHttpRequest")
	req.Header.Set("Referer", nartoBase+"/")

	resp, err := client().Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var data struct {
		Sections []struct {
			TabKey   string `json:"tab_key"`
			TabLabel string `json:"tab_label"`
			Items    []struct {
				BookID       string   `json:"book_id"`
				Title        string   `json:"title"`
				Description  string   `json:"description"`
				PosterURL    string   `json:"poster_url"`
				WatchURL     string   `json:"watch_url"`
				CategoryName string   `json:"category_name"`
				TagNames     []string `json:"tag_names"`
			} `json:"items"`
		} `json:"sections"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	var items []models.ShortDramaItem
	seen := make(map[string]bool)

	for _, sec := range data.Sections {
		if sectionKey != "" && !strings.Contains(strings.ToLower(sec.TabLabel), strings.ToLower(sectionKey)) {
			continue
		}

		for _, it := range sec.Items {
			title := strings.TrimSpace(it.Title)
			if title == "" || seen[strings.ToLower(title)] {
				continue
			}
			seen[strings.ToLower(title)] = true

			slug := ""
			if it.WatchURL != "" {
				if parts := strings.Split(it.WatchURL, "/detail/watch/"); len(parts) > 1 {
					slug = strings.Split(parts[1], "?")[0]
				}
			}
			if slug == "" {
				slug = strings.Trim(reSlugTitle.ReplaceAllString(strings.ToLower(title), "-"), "-")
			}

			poster := it.PosterURL
			if !strings.HasPrefix(poster, "http") {
				poster = nartoBase + poster
			}

			studio := it.CategoryName
			if studio == "" {
				studio = "Narto Drama"
			}

			tags := append([]string{studio, "Narto Drama"}, it.TagNames...)

			items = append(items, models.ShortDramaItem{
				ID:                 "narto_" + slug,
				Source:             "narto",
				SourceName:         studio,
				Title:              title,
				Cover:              poster,
				Poster:             poster,
				Banner:             poster,
				Description:        it.Description,
				TotalEpisodes:      60,
				Language:           "English Dub",
				Tags:               tags,
				Status:             "Completed",
				IsUnlocked:         true,
				FirstEpisodeStream: fmt.Sprintf("/api/shorts/stream?source=narto&seriesSlug=%s&epNum=1", url.QueryEscape(slug)),
			})
		}
	}

	nartoMu.Lock()
	nartoFeedCache[cacheKey] = cacheEntry{
		items: items,
		exp:   time.Now().Add(30 * time.Minute),
	}
	nartoMu.Unlock()

	return items, nil
}

// SearchNarto queries Narto Drama
func SearchNarto(q string) ([]models.ShortDramaItem, error) {
	q = strings.TrimSpace(q)
	if q == "" {
		return nil, nil
	}

	reqURL := fmt.Sprintf("%s/search?q=%s&lang=en-US", nartoBase, url.QueryEscape(q))
	req, err := http.NewRequest("GET", reqURL, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("User-Agent", "Mozilla/5.0")
	req.Header.Set("Cookie", fmt.Sprintf("nd_ck=%s", freshNartoCookie()))

	resp, err := client().Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	reLink := regexp.MustCompile(`https://narto-drama\.com/detail/watch/([^"'\/?&]+)`)
	matches := reLink.FindAllStringSubmatch(string(body), -1)

	var items []models.ShortDramaItem
	seen := make(map[string]bool)

	for _, m := range matches {
		if len(m) < 2 {
			continue
		}
		slug := m[1]
		if seen[slug] {
			continue
		}
		seen[slug] = true

		title := strings.Title(strings.ReplaceAll(slug, "-", " "))
		poster := "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600"

		items = append(items, models.ShortDramaItem{
			ID:                 "narto_" + slug,
			Source:             "narto",
			SourceName:         "Narto Drama",
			Title:              title,
			Cover:              poster,
			Poster:             poster,
			Banner:             poster,
			Description:        fmt.Sprintf("Stream %s with full unlocked vertical episodes.", title),
			TotalEpisodes:      60,
			Language:           "English Dub",
			Tags:               []string{"Narto Drama", "English Dub"},
			Status:             "Completed",
			IsUnlocked:         true,
			FirstEpisodeStream: fmt.Sprintf("/api/shorts/stream?source=narto&seriesSlug=%s&epNum=1", url.QueryEscape(slug)),
		})
	}

	return items, nil
}

// FetchNartoDetail loads full series detail and all direct HLS episodes from Narto Drama
func FetchNartoDetail(idOrSlug string) (*models.ShortDramaDetail, error) {
	slug := strings.TrimPrefix(idOrSlug, "narto_")

	nartoMu.RLock()
	if c, ok := nartoDetailCache[slug]; ok && time.Now().Before(c.exp) {
		nartoMu.RUnlock()
		return c.detail, nil
	}
	nartoMu.RUnlock()

	reqURL := fmt.Sprintf("%s/detail/watch/%s/1?lang=en-US", nartoBase, slug)
	req, err := http.NewRequest("GET", reqURL, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("User-Agent", "Mozilla/5.0")
	req.Header.Set("Cookie", fmt.Sprintf("nd_ck=%s", freshNartoCookie()))

	resp, err := client().Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	rawMatch := reEpisodeRaw.FindStringSubmatch(string(body))
	var episodes []models.ShortDramaEpisode

	if len(rawMatch) > 1 {
		var rawList []struct {
			Number    int    `json:"number"`
			RouteNum  int    `json:"route_episode_number"`
			Title     string `json:"title"`
			PlayURL   string `json:"play_url"`
			ThumbURL  string `json:"thumb_url"`
		}
		if err := json.Unmarshal([]byte(rawMatch[1]), &rawList); err == nil {
			for _, ep := range rawList {
				num := ep.Number
				if num == 0 {
					num = ep.RouteNum
				}
				thumb := ep.ThumbURL
				if !strings.HasPrefix(thumb, "http") && thumb != "" {
					thumb = nartoBase + thumb
				}
				episodes = append(episodes, models.ShortDramaEpisode{
					EpisodeNumber: num,
					Title:         ep.Title,
					StreamURL:     ep.PlayURL,
					Type:          "hls",
					Thumbnail:     thumb,
					Source:        "narto",
				})
			}
		}
	}

	title := strings.Title(strings.ReplaceAll(slug, "-", " "))
	reTitle := regexp.MustCompile(`<title>(.*?)</title>`)
	if tm := reTitle.FindStringSubmatch(string(body)); len(tm) > 1 {
		title = strings.TrimSpace(strings.ReplaceAll(tm[1], "- Free Streaming", ""))
	}

	cover := ""
	if len(episodes) > 0 {
		cover = episodes[0].Thumbnail
	}

	detail := &models.ShortDramaDetail{
		ShortDramaItem: models.ShortDramaItem{
			ID:                 "narto_" + slug,
			Source:             "narto",
			SourceName:         "Narto Drama",
			Title:              title,
			Cover:              cover,
			Poster:             cover,
			Banner:             cover,
			Description:        fmt.Sprintf("Watch all %d full episodes of %s in HD.", len(episodes), title),
			TotalEpisodes:      len(episodes),
			Language:           "English Dub",
			Tags:               []string{"Narto Drama", "Shorts", "English Dub"},
			Status:             "Completed",
			IsUnlocked:         true,
			FirstEpisodeStream: "",
		},
		Episodes: episodes,
	}

	if len(episodes) > 0 {
		detail.FirstEpisodeStream = episodes[0].StreamURL
	}

	nartoMu.Lock()
	nartoDetailCache[slug] = detailCacheEntry{
		detail: detail,
		exp:    time.Now().Add(1 * time.Hour),
	}
	nartoMu.Unlock()

	return detail, nil
}

// ResolveNartoStream fetches the direct playable media stream URL from Narto's Edge router
func ResolveNartoStream(idOrSlug string, epNum int) (string, error) {
	slug := strings.TrimPrefix(idOrSlug, "narto_")
	if epNum < 1 {
		epNum = 1
	}

	edgeURL := fmt.Sprintf("https://nartodrama.com/e/rs/detail/watch/%s/%d/refresh-source?force=1", slug, epNum)
	req, err := http.NewRequest("GET", edgeURL, nil)
	if err != nil {
		return "", err
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
	req.Header.Set("Referer", fmt.Sprintf("https://narto-drama.com/detail/watch/%s/%d?lang=en-US", slug, epNum))

	resp, err := client().Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var data struct {
		OK            bool   `json:"ok"`
		PlayURL       string `json:"play_url"`
		DirectPlayURL string `json:"direct_play_url"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return "", err
	}

	streamURL := data.DirectPlayURL
	if streamURL == "" {
		streamURL = data.PlayURL
	}

	if streamURL == "" {
		return "", fmt.Errorf("no stream URL found in edge response")
	}

	return streamURL, nil
}
