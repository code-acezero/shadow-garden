package aggregator

import (
	"regexp"
	"strings"
	"sync"

	"kagemi-go/internal/models"
	"kagemi-go/internal/sources"
)

var (
	rePunct = regexp.MustCompile(`[-_.:,!?;/\\|()[\]{}'’"“”]`)
	reWords = regexp.MustCompile(`\b(hindi|english|dub|sub|episode|ep|full|series|season|s\d+|unlocked|hd|4k)\b`)
	reSpace = regexp.MustCompile(`\s+`)
)

// NormalizeTitle strips punctuation and suffixes for cross-source matching
func NormalizeTitle(title string) string {
	s := strings.ToLower(title)
	s = rePunct.ReplaceAllString(s, " ")
	s = reWords.ReplaceAllString(s, " ")
	s = reSpace.ReplaceAllString(s, " ")
	return strings.TrimSpace(s)
}

// Deduplicate merges items sharing the same normalized title
func Deduplicate(items []models.ShortDramaItem) []models.ShortDramaItem {
	m := make(map[string]models.ShortDramaItem)

	for _, it := range items {
		norm := NormalizeTitle(it.Title)
		if norm == "" {
			norm = it.ID
		}

		if existing, ok := m[norm]; ok {
			// Merge sources
			sources := append(existing.Sources, models.SourceRef{
				Source:        it.Source,
				SourceName:    it.SourceName,
				ID:            it.ID,
				Title:         it.Title,
				TotalEpisodes: it.TotalEpisodes,
				StreamURL:     it.FirstEpisodeStream,
			})
			existing.Sources = sources

			// Pick higher episode count
			if it.TotalEpisodes > existing.TotalEpisodes {
				existing.TotalEpisodes = it.TotalEpisodes
			}
			// Pick longer description
			if len(it.Description) > len(existing.Description) {
				existing.Description = it.Description
			}
			m[norm] = existing
		} else {
			it.Sources = []models.SourceRef{
				{
					Source:        it.Source,
					SourceName:    it.SourceName,
					ID:            it.ID,
					Title:         it.Title,
					TotalEpisodes: it.TotalEpisodes,
					StreamURL:     it.FirstEpisodeStream,
				},
			}
			m[norm] = it
		}
	}

	var result []models.ShortDramaItem
	for _, it := range m {
		result = append(result, it)
	}
	return result
}

// GetUnifiedFeed queries HepDrama, Narto Drama, and DramaDünyam concurrently with Goroutines
func GetUnifiedFeed(category string, page int) ([]models.ShortDramaItem, error) {
	var wg sync.WaitGroup
	var mu sync.Mutex
	var allItems []models.ShortDramaItem

	// 1. HepDrama Goroutine
	wg.Add(1)
	go func() {
		defer wg.Done()
		cat := "billionaire-ceo"
		if category == "revenge" || page%2 == 0 {
			cat = "revenge"
		}
		if items, err := sources.FetchHepDramaFeed(cat, page); err == nil {
			mu.Lock()
			allItems = append(allItems, items...)
			mu.Unlock()
		}
	}()

	// 2. Narto Drama Goroutine
	wg.Add(1)
	go func() {
		defer wg.Done()
		sec := "hot"
		if category == "romance" {
			sec = "romance"
		}
		if items, err := sources.FetchNartoFeed(sec, page); err == nil {
			mu.Lock()
			allItems = append(allItems, items...)
			mu.Unlock()
		}
	}()

	// 3. DramaDünyam Goroutine
	wg.Add(1)
	go func() {
		defer wg.Done()
		if items, err := sources.FetchDramaDunyamFeed(page); err == nil {
			mu.Lock()
			allItems = append(allItems, items...)
			mu.Unlock()
		}
	}()

	// Wait for all 3 scrapers to finish in parallel!
	wg.Wait()

	return Deduplicate(allItems), nil
}

// SearchUnified runs parallel searches across all sources
func SearchUnified(query string) ([]models.ShortDramaItem, error) {
	var wg sync.WaitGroup
	var mu sync.Mutex
	var allItems []models.ShortDramaItem

	wg.Add(1)
	go func() {
		defer wg.Done()
		if items, err := sources.SearchHepDrama(query); err == nil {
			mu.Lock()
			allItems = append(allItems, items...)
			mu.Unlock()
		}
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		if items, err := sources.SearchNarto(query); err == nil {
			mu.Lock()
			allItems = append(allItems, items...)
			mu.Unlock()
		}
	}()

	wg.Wait()
	return Deduplicate(allItems), nil
}

// GetUnifiedDetail loads series detail
func GetUnifiedDetail(id string) (*models.ShortDramaDetail, error) {
	if strings.HasPrefix(id, "hep_") {
		return sources.FetchHepDramaDetail(id)
	}
	if strings.HasPrefix(id, "narto_") {
		return sources.FetchNartoDetail(id)
	}
	if strings.HasPrefix(id, "dd_") {
		slug := strings.TrimPrefix(id, "dd_")
		clean := strings.ReplaceAll(slug, "-", " ")
		if nartoMatches, err := sources.SearchNarto(clean); err == nil && len(nartoMatches) > 0 {
			targetID := nartoMatches[0].ID
			return sources.FetchNartoDetail(targetID)
		}
	}
	return nil, nil
}
