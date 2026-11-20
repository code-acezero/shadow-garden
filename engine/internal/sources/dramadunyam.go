package sources

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"kagemi-go/internal/models"
)

const ddBase = "https://dramadunyam.com"

var (
	ddFeedCache = make(map[int]cacheEntry)
	ddMu        sync.RWMutex
)

// FetchDramaDunyamFeed retrieves the public /api/akis feed
func FetchDramaDunyamFeed(page int) ([]models.ShortDramaItem, error) {
	ddMu.RLock()
	if c, ok := ddFeedCache[page]; ok && time.Now().Before(c.exp) {
		ddMu.RUnlock()
		return c.items, nil
	}
	ddMu.RUnlock()

	req, err := http.NewRequest("GET", fmt.Sprintf("%s/api/akis", ddBase), nil)
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

	var data struct {
		Items []struct {
			ID                string `json:"id"`
			Slug              string `json:"slug"`
			Title             string `json:"title"`
			Cover             string `json:"cover"`
			AvailableEpisodes int    `json:"available_episodes"`
			Platform          string `json:"platform"`
			Dublaj            bool   `json:"dublaj"`
		} `json:"items"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	var items []models.ShortDramaItem
	for _, it := range data.Items {
		slug := it.Slug
		if slug == "" {
			slug = it.ID
		}
		lang := "English Sub"
		if it.Dublaj {
			lang = "English Dub"
		}

		platform := it.Platform
		if platform == "" {
			platform = "DramaDünyam"
		}

		items = append(items, models.ShortDramaItem{
			ID:            "dd_" + slug,
			Source:        "dramadunyam",
			SourceName:    platform,
			Title:         it.Title,
			Cover:         it.Cover,
			Poster:        it.Cover,
			Banner:        it.Cover,
			Description:   fmt.Sprintf("Watch %s on %s with %d unlocked episodes.", it.Title, platform, it.AvailableEpisodes),
			TotalEpisodes: it.AvailableEpisodes,
			Language:      lang,
			Tags:          []string{platform, "DramaDünyam", "Mini-Series"},
			Status:        "Completed",
			IsUnlocked:    true,
		})
	}

	ddMu.Lock()
	ddFeedCache[page] = cacheEntry{
		items: items,
		exp:   time.Now().Add(30 * time.Minute),
	}
	ddMu.Unlock()

	return items, nil
}
