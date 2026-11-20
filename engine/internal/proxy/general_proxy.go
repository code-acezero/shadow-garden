package proxy

import (
	"bufio"
	"context"
	"crypto/tls"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"
)

// Resilient Cloudflare Public DNS Resolver (immune to local ISP UDP/DNS poisoning)
var customResolver = &net.Resolver{
	PreferGo: true,
	Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
		d := net.Dialer{Timeout: 3 * time.Second}
		// Primary: Cloudflare DNS (1.1.1.1:53), Fallback: Google DNS (8.8.8.8:53)
		conn, err := d.DialContext(ctx, "udp", "1.1.1.1:53")
		if err == nil {
			return conn, nil
		}
		return d.DialContext(ctx, "udp", "8.8.8.8:53")
	},
}

var customTransport = &http.Transport{
	TLSClientConfig:     &tls.Config{InsecureSkipVerify: true},
	MaxIdleConns:        200,
	MaxIdleConnsPerHost: 50,
	IdleConnTimeout:     90 * time.Second,
	DialContext: (&net.Dialer{
		Timeout:   8 * time.Second,
		KeepAlive: 30 * time.Second,
		Resolver:  customResolver,
	}).DialContext,
}

var customClient = &http.Client{
	Timeout:   25 * time.Second,
	Transport: customTransport,
}

// Tactical Referer Domain Mapping (matches Kagemi Next.js proxy exactly)
var refererMap = map[string]string{
	// Video Hubs
	"megacloud":    "https://megacloud.blog/",
	"rapid-cloud":  "https://megacloud.blog/",
	"rabbitstream": "https://megacloud.blog/",
	"kwik":         "https://kwik.cx/",
	"uwucdn":       "https://kwik.cx/",
	"animepahe":    "https://animepahe.ru/",

	// ZokoAnime CDNs (JP Sub & EN Dub streams)
	"dramahot":    "https://zokoanime.video/",
	"drama1":      "https://zokoanime.video/",
	"zokoanime":   "https://zokoanime.video/",
	"otakustream": "https://zokoanime.video/",

	// MegaPlay / Anikoto CDNs (EN Dub streams)
	"nexabloom":     "https://megaplay.buzz/",
	"shiora":        "https://megaplay.buzz/",
	"silentvoyage":  "https://megaplay.buzz/",
	"broforgotsave": "https://megaplay.buzz/",
	"megaplay":      "https://megaplay.buzz/",
	"megap":         "https://megaplay.buzz/",
	"tcdn":          "https://megaplay.buzz/",
	"anikoto":       "https://anikoto.net/",

	// Blakite / Rumble Cloud
	"blakite": "https://blakiteapi.xyz/",
	"rumble":  "https://blakiteapi.xyz/",

	// Hindi & TMDB
	"watchanimeworld": "https://watchanimeworld.net/",
	"tmdb":            "https://www.themoviedb.org/",
	"image.tmdb":      "https://www.themoviedb.org/",
	"themoviedb":      "https://www.themoviedb.org/",

	// Manga & Comic Hubs
	"mangadex":    "https://mangadex.org/",
	"anilist":     "https://anilist.co/",
	"alphacoders": "https://alphacoders.com/",

	// Shorts & Vertical Drama CDNs
	"volcengine":      "https://hepdrama.com/",
	"shorttv":         "https://hepdrama.com/",
	"hepdrama":        "https://hepdrama.com/",
	"dramabox":        "https://hepdrama.com/",
	"dramaboxdb":      "https://hepdrama.com/",
	"hwztvideo":       "https://hepdrama.com/",
	"goodshort":       "https://hepdrama.com/",
	"goodbos":         "https://hepdrama.com/",
	"reelshort":       "https://hepdrama.com/",
	"moboreels":       "https://hepdrama.com/",
	"kalostv":         "https://hepdrama.com/",
	"topshort":        "https://hepdrama.com/",
	"netshort":        "https://hepdrama.com/",
	"narto":           "https://narto-drama.com/",
	"nartodrama":      "https://narto-drama.com/",
	"cdn.narto-drama": "https://narto-drama.com/",
	"voddrama":        "https://narto-drama.com/",
	"videoint":        "https://narto-drama.com/",
	"dramadunyam":     "https://dramadunyam.com/",
	"dramaflix":       "https://dramadunyam.com/",
}

func getTacticalReferer(targetURL, explicitReferer string) string {
	if explicitReferer != "" {
		return explicitReferer
	}
	lower := strings.ToLower(targetURL)
	for key, mapped := range refererMap {
		if strings.Contains(lower, key) {
			return mapped
		}
	}
	return ""
}

// HandleGeneralProxy handles /api/proxy?url=...&referer=...
func HandleGeneralProxy(w http.ResponseWriter, r *http.Request) {
	// CORS Headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Range, Authorization, Content-Type, Origin, Accept")
	w.Header().Set("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	targetURL := r.URL.Query().Get("url")
	if targetURL == "" {
		http.Error(w, `{"error":"Missing 'url' query param"}`, http.StatusBadRequest)
		return
	}

	explicitReferer := r.URL.Query().Get("referer")
	effectiveReferer := getTacticalReferer(targetURL, explicitReferer)

	req, err := http.NewRequestWithContext(r.Context(), r.Method, targetURL, nil)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"Invalid URL: %v"}`, err), http.StatusBadRequest)
		return
	}

	// User-Agent and tactical headers
	isMangaDex := strings.Contains(targetURL, "mangadex.org") || strings.Contains(effectiveReferer, "mangadex.org")
	if isMangaDex {
		req.Header.Set("User-Agent", "Kagemi/4.0")
	} else {
		req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	}

	req.Header.Set("Accept", "*/*")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")

	if effectiveReferer != "" {
		req.Header.Set("Referer", effectiveReferer)
		if u, err := url.Parse(effectiveReferer); err == nil && !isMangaDex {
			req.Header.Set("Origin", fmt.Sprintf("%s://%s", u.Scheme, u.Host))
		}
	}

	// Forward Range header for video seeking
	if rangeHeader := r.Header.Get("Range"); rangeHeader != "" {
		req.Header.Set("Range", rangeHeader)
	}

	resp, err := customClient.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"Upstream connection error: %v"}`, err), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	contentType := resp.Header.Get("Content-Type")
	isHLS := strings.Contains(contentType, "mpegurl") ||
		strings.Contains(targetURL, ".m3u8") ||
		strings.Contains(contentType, "application/x-mpegURL") ||
		strings.Contains(contentType, "vnd.apple.mpegurl")

	// If HLS Playlist, rewrite URLs so chunks/keys point back through Go /api/proxy
	if isHLS && (resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusPartialContent) {
		bodyBytes, err := io.ReadAll(resp.Body)
		if err != nil {
			http.Error(w, `{"error":"Failed to read playlist"}`, http.StatusInternalServerError)
			return
		}

		rewritten := rewritePlaylist(string(bodyBytes), targetURL, effectiveReferer)
		w.Header().Set("Content-Type", "application/vnd.apple.mpegurl")
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.WriteHeader(resp.StatusCode)
		w.Write([]byte(rewritten))
		return
	}

	// Forward headers for binary streams (TS segments, MP4, WebP, Images)
	if contentType != "" {
		w.Header().Set("Content-Type", contentType)
	}
	// Cache images aggressively so posters and covers load with zero latency
	if strings.HasPrefix(contentType, "image/") || strings.Contains(targetURL, ".jpg") || strings.Contains(targetURL, ".png") || strings.Contains(targetURL, ".webp") {
		w.Header().Set("Cache-Control", "public, max-age=604800, immutable")
	}
	if cr := resp.Header.Get("Content-Range"); cr != "" {
		w.Header().Set("Content-Range", cr)
	}
	if ar := resp.Header.Get("Accept-Ranges"); ar != "" {
		w.Header().Set("Accept-Ranges", ar)
	}
	if cl := resp.Header.Get("Content-Length"); cl != "" {
		w.Header().Set("Content-Length", cl)
	}

	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

var uriAttrRegex = regexp.MustCompile(`URI="([^"]+)"`)

func rewritePlaylist(playlistText, baseURL, referer string) string {
	base, err := url.Parse(baseURL)
	if err != nil {
		return playlistText
	}

	refererSuffix := ""
	if referer != "" {
		refererSuffix = "&referer=" + url.QueryEscape(referer)
	}

	var sb strings.Builder
	scanner := bufio.NewScanner(strings.NewReader(playlistText))

	for scanner.Scan() {
		line := scanner.Text()
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			sb.WriteString(line + "\n")
			continue
		}

		// Handle tags with URI attributes (#EXT-X-KEY, #EXT-X-MEDIA, #EXT-X-MAP)
		if strings.HasPrefix(trimmed, "#") && strings.Contains(trimmed, "URI=") {
			replaced := uriAttrRegex.ReplaceAllStringFunc(trimmed, func(match string) string {
				submatches := uriAttrRegex.FindStringSubmatch(match)
				if len(submatches) > 1 {
					uriVal := submatches[1]
					if relURL, err := base.Parse(uriVal); err == nil {
						return fmt.Sprintf(`URI="/api/proxy?url=%s%s"`, url.QueryEscape(relURL.String()), refererSuffix)
					}
				}
				return match
			})
			sb.WriteString(replaced + "\n")
			continue
		}

		// Comments / tags without URIs
		if strings.HasPrefix(trimmed, "#") {
			sb.WriteString(line + "\n")
			continue
		}

		// Avoid double proxying
		if strings.Contains(trimmed, "/api/proxy") {
			sb.WriteString(line + "\n")
			continue
		}

		// Video Segment URI
		if relURL, err := base.Parse(trimmed); err == nil {
			sb.WriteString(fmt.Sprintf("/api/proxy?url=%s%s\n", url.QueryEscape(relURL.String()), refererSuffix))
		} else {
			sb.WriteString(line + "\n")
		}
	}

	return sb.String()
}
