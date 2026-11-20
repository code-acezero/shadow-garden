package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/signal"
	"runtime"
	"strconv"
	"strings"
	"syscall"
	"time"

	"kagemi-go/internal/aggregator"
	"kagemi-go/internal/proxy"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8085"
	}

	nextURLStr := os.Getenv("NEXT_URL")
	if nextURLStr == "" {
		nextURLStr = "http://127.0.0.1:3000"
	}

	nextURL, err := url.Parse(nextURLStr)
	if err != nil {
		log.Fatalf("Fatal: Invalid NEXT_URL: %v", err)
	}

	mux := http.NewServeMux()

	// ----------------------------------------------------
	// 1. NATIVE GO HIGH-PERFORMANCE APIS (Handled in Go)
	// ----------------------------------------------------
	// Health & Diagnostics
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		var mem runtime.MemStats
		runtime.ReadMemStats(&mem)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"status":      "healthy",
			"engine":      "Kagemi Hybrid Gateway (Go + Next.js)",
			"version":     "4.0.0-shadow-garden",
			"timestamp":   time.Now().UTC().Format(time.RFC3339),
			"memory_mb":   fmt.Sprintf("%.2f MB", float64(mem.Alloc)/1024/1024),
			"sys_mb":      fmt.Sprintf("%.2f MB", float64(mem.Sys)/1024/1024),
			"goroutines":  runtime.NumGoroutine(),
			"upstream_ui": nextURLStr,
		})
	})

	// Tactical Zero-Alloc HLS Video Streaming & Referer Proxy
	mux.HandleFunc("/api/proxy", proxy.HandleGeneralProxy)

	// Unified Shorts Drama Feeds
	mux.HandleFunc("GET /api/shorts/feed", func(w http.ResponseWriter, r *http.Request) {
		cat := r.URL.Query().Get("category")
		pageStr := r.URL.Query().Get("page")
		page := 1
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
		items, err := aggregator.GetUnifiedFeed(cat, page)
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error":"%v"}`, err), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"page":    page,
			"count":   len(items),
			"total":   len(items),
			"hasMore": len(items) > 0,
			"items":   items,
		})
	})

	mux.HandleFunc("GET /api/shorts/search", func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query().Get("q")
		if q == "" {
			http.Error(w, `{"error":"Query parameter 'q' is required"}`, http.StatusBadRequest)
			return
		}
		items, err := aggregator.SearchUnified(q)
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error":"%v"}`, err), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"query":   q,
			"count":   len(items),
			"total":   len(items),
			"items":   items,
		})
	})

	mux.HandleFunc("GET /api/shorts/sources", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"sources": []map[string]any{
				{"name": "HepDrama", "status": "active", "types": []string{"feed", "search", "detail", "stream"}},
				{"name": "Narto", "status": "active", "types": []string{"feed", "search", "detail", "stream"}},
				{"name": "DramaDunyam", "status": "active", "types": []string{"feed", "search", "detail"}},
			},
		})
	})

	mux.HandleFunc("GET /api/shorts/stream", proxy.HandleStream)
	mux.HandleFunc("OPTIONS /api/shorts/stream", proxy.HandleStream)

	mux.HandleFunc("GET /api/shorts/{id}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		if id == "" {
			http.Error(w, `{"error":"Missing series id"}`, http.StatusBadRequest)
			return
		}
		detail, err := aggregator.GetUnifiedDetail(id)
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error":"%v"}`, err), http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"drama":   detail,
		})
	})

	// ----------------------------------------------------
	// 2. REVERSE PROXY TO NEXT.JS (Full UI, SSR, RSC, Blakite, Donghua)
	// ----------------------------------------------------
	nextProxy := httputil.NewSingleHostReverseProxy(nextURL)
	originalDirector := nextProxy.Director
	nextProxy.Director = func(req *http.Request) {
		originalDirector(req)
		req.Host = nextURL.Host
		if req.Header.Get("X-Forwarded-Proto") == "" {
			req.Header.Set("X-Forwarded-Proto", "http")
		}
	}

	// Custom error handler for when Next.js is starting up
	nextProxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		log.Printf("[Proxy Error] Next.js upstream unreachable at %s: %v", nextURLStr, err)
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusBadGateway)
		fmt.Fprintf(w, `<!DOCTYPE html><html><head><title>Kagemi Loading...</title><meta http-equiv="refresh" content="3"><style>body{background:#03040c;color:#e8ecff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;}</style></head><body><h2>Kagemi is starting up...</h2><p>Syncing UI components. Auto-refreshing in 3 seconds...</p></body></html>`)
	}

	// Catch-all handler: forward all other requests (HTML, JS chunks, RSC, Next.js APIs) to Next.js
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Log requests for visibility
		if strings.HasPrefix(r.URL.Path, "/api/") {
			log.Printf("[Proxy -> Next.js API] %s %s", r.Method, r.URL.Path)
		}
		nextProxy.ServeHTTP(w, r)
	})

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      mux,
		ReadTimeout:  120 * time.Second,
		WriteTimeout: 120 * time.Second,
		IdleTimeout:  180 * time.Second,
	}

	stopChan := make(chan os.Signal, 1)
	signal.Notify(stopChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("======================================================================")
		log.Printf("  KAGEMI HYBRID GATEWAY (Go + Next.js)")
		log.Printf("  Gateway Port   : http://localhost:%s", port)
		log.Printf("  Next.js Target : %s", nextURLStr)
		log.Printf("  Native Go APIs : /api/proxy (HLS Video), /api/shorts/* (Parallel Engine)")
		log.Printf("  Forwarded to UI: /, /home, /shorts, /watch/*, /api/blakite, /api/donghua")
		log.Printf("======================================================================")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server Listen error: %v", err)
		}
	}()

	<-stopChan
	log.Println("Shutting down Kagemi Gateway gracefully...")
}
