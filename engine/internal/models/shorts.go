package models

type SourceRef struct {
	Source        string `json:"source"`
	SourceName    string `json:"sourceName"`
	ID            string `json:"id"`
	Title         string `json:"title"`
	TotalEpisodes int    `json:"totalEpisodes,omitempty"`
	StreamURL     string `json:"streamUrl,omitempty"`
}

type ShortDramaItem struct {
	ID                 string      `json:"id"`
	Source             string      `json:"source"`
	SourceName         string      `json:"sourceName,omitempty"`
	Title              string      `json:"title"`
	Cover              string      `json:"cover"`
	Poster             string      `json:"poster,omitempty"`
	Banner             string      `json:"banner,omitempty"`
	Description        string      `json:"description"`
	TotalEpisodes      int         `json:"totalEpisodes"`
	Language           string      `json:"language"`
	Tags               []string    `json:"tags"`
	Status             string      `json:"status"`
	IsUnlocked         bool        `json:"isUnlocked"`
	FirstEpisodeStream string      `json:"firstEpisodeStream,omitempty"`
	Sources            []SourceRef `json:"sources,omitempty"`
}

type ShortDramaEpisode struct {
	EpisodeNumber int    `json:"episodeNumber"`
	Title         string `json:"title"`
	StreamURL     string `json:"streamUrl"`
	Type          string `json:"type"`
	Thumbnail     string `json:"thumbnail,omitempty"`
	Source        string `json:"source,omitempty"`
}

type ShortDramaDetail struct {
	ShortDramaItem
	Episodes        []ShortDramaEpisode `json:"episodes"`
	Recommendations []ShortDramaItem    `json:"recommendations"`
}

type FeedResponse struct {
	Success  bool             `json:"success"`
	Category string           `json:"category"`
	Items    []ShortDramaItem `json:"items"`
	Total    int              `json:"total"`
	HasMore  bool             `json:"hasMore"`
	Page     int              `json:"page"`
}

type SearchResponse struct {
	Success bool             `json:"success"`
	Query   string           `json:"query"`
	Items   []ShortDramaItem `json:"items"`
	Total   int              `json:"total"`
}

type DetailResponse struct {
	Success bool              `json:"success"`
	Drama   *ShortDramaDetail `json:"drama,omitempty"`
	Error   string            `json:"error,omitempty"`
}
