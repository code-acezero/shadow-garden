package proxy

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"kagemi-go/internal/sources"
)

// HandleStream handles /api/shorts/stream
func HandleStream(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	q := r.URL.Query()
	source := q.Get("source")
	epID := q.Get("epId")
	seriesSlug := q.Get("seriesSlug")
	epNumStr := q.Get("epNum")
	epNum, _ := strconv.Atoi(epNumStr)
	if epNum == 0 {
		epNum = 1
	}

	if source == "hepdrama" {
		targetEpID := epID

		// If no epId passed, resolve from seriesSlug
		if targetEpID == "" && seriesSlug != "" {
			if detail, err := sources.FetchHepDramaDetail(seriesSlug); err == nil {
				for _, ep := range detail.Episodes {
					if ep.EpisodeNumber == epNum {
						if ep.StreamURL != "" && len(ep.StreamURL) >= 4 && ep.StreamURL[:4] == "http" {
							proxied := fmt.Sprintf("/api/proxy?url=%s&referer=%s", url.QueryEscape(ep.StreamURL), url.QueryEscape("https://hepdrama.com/"))
							http.Redirect(w, r, proxied, http.StatusFound)
							return
						}
						if parts := strings.Split(ep.StreamURL, "epId="); len(parts) > 1 {
							targetEpID = strings.Split(parts[1], "&")[0]
						}
						break
					}
				}
			}
		}

		if targetEpID != "" {
			if directURL, err := sources.ResolveHepDramaStream(targetEpID); err == nil && directURL != "" {
				proxied := fmt.Sprintf("/api/proxy?url=%s&referer=%s", url.QueryEscape(directURL), url.QueryEscape("https://hepdrama.com/"))
				http.Redirect(w, r, proxied, http.StatusFound)
				return
			}
		}
	}

	if source == "narto" && seriesSlug != "" {
		if directURL, err := sources.ResolveNartoStream(seriesSlug, epNum); err == nil && directURL != "" {
			proxied := fmt.Sprintf("/api/proxy?url=%s&referer=%s", url.QueryEscape(directURL), url.QueryEscape("https://narto-drama.com/"))
			http.Redirect(w, r, proxied, http.StatusFound)
			return
		}
		if detail, err := sources.FetchNartoDetail(seriesSlug); err == nil {
			for _, ep := range detail.Episodes {
				if ep.EpisodeNumber == epNum && ep.StreamURL != "" {
					proxied := fmt.Sprintf("/api/proxy?url=%s&referer=%s", url.QueryEscape(ep.StreamURL), url.QueryEscape("https://narto-drama.com/"))
					http.Redirect(w, r, proxied, http.StatusFound)
					return
				}
			}
		}
	}

	if source == "dramadunyam" && seriesSlug != "" {
		// Attempt Narto cross-reference
		cleanTitle := strings.ReplaceAll(seriesSlug, "-", " ")
		if nartoItems, err := sources.SearchNarto(cleanTitle); err == nil && len(nartoItems) > 0 {
			targetSlug := strings.TrimPrefix(nartoItems[0].ID, "narto_")
			if directURL, err := sources.ResolveNartoStream(targetSlug, epNum); err == nil && directURL != "" {
				proxied := fmt.Sprintf("/api/proxy?url=%s&referer=%s", url.QueryEscape(directURL), url.QueryEscape("https://narto-drama.com/"))
				http.Redirect(w, r, proxied, http.StatusFound)
				return
			}
		}
	}

	http.Error(w, "Stream not found", http.StatusNotFound)
}

// HandleProxy handles high-speed binary chunk and playlist proxying
func HandleProxy(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	targetURL := r.URL.Query().Get("url")
	if targetURL == "" {
		http.Error(w, "Missing url parameter", http.StatusBadRequest)
		return
	}

	parsed, err := url.Parse(targetURL)
	if err != nil {
		http.Error(w, "Invalid url", http.StatusBadRequest)
		return
	}

	req, err := http.NewRequestWithContext(r.Context(), "GET", parsed.String(), nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
	req.Header.Set("Referer", fmt.Sprintf("%s://%s/", parsed.Scheme, parsed.Host))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// Copy headers
	for k, v := range resp.Header {
		w.Header()[k] = v
	}
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(resp.StatusCode)

	// Stream chunks directly from socket to socket with zero allocation!
	io.Copy(w, resp.Body)
}
