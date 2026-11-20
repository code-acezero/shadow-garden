# Kagemi - Pure Go Single Binary Deployment (Embedded Frontend + Native Backend)

A complete standalone version of **Kagemi** compiled into a **single binary executable**.

---

## Architecture Overview

```
       +-----------------------------------------------------------------------+
       |               KAGEMI SINGLE DEPLOYABLE BINARY                         |
       |               (kagemi-server.exe / kagemi-server-linux)               |
       |                                                                       |
       |  +------------------------------+  +-------------------------------+  |
       |  |  EMBEDDED STATIC FRONTEND    |  |  NATIVE GO BACKEND ENGINE     |  |
       |  |  (//go:embed all:dist)       |  |  (Goroutines + io.Copy)       |  |
       |  |                              |  |                               |  |
       |  |  * Landing Page (/)          |  |  * /api/shorts/feed (Parallel)|  |
       |  |  * Home Page (/home)         |  |  * /api/shorts/search         |  |
       |  |  * Shorts Hub (/shorts)      |  |  * /api/shorts/stream         |  |
       |  |  * Cinema Hub (/cinema)      |  |  * /api/shorts/{id}           |  |
       |  |  * Donghua & Drama Hubs      |  |  * /api/proxy (HLS / Referer) |  |
       |  |  * 3D Island Assets & BGM    |  |  * /api/health (RAM < 5MB)    |  |
       |  |  * All Next.js JS/CSS Chunks |  |  * Gzip Compression & CORS   |  |
       |  +------------------------------+  +-------------------------------+  |
       |                                                                       |
       |                  Listening on Single Port (:8085 / :80)               |
       +-----------------------------------------------------------------------+
```

---

## Key Benefits

1. **Zero External Dependencies**:
   - No Node.js runtime required.
   - No `npm`, `pnpm`, or `node_modules` on the server.
   - No Docker or Coolify required (optional if desired).
2. **Ultra-Low Resource Consumption**:
   - RAM: **~3 MB - 10 MB** (vs 1.5 GB in Node.js Next.js dev/server).
   - Instant startup time: **~0.01 seconds**.
3. **Built-in HLS Streaming Proxy**:
   - Socket-to-socket piping with zero allocation (`io.Copy`).
   - Dynamic tactical referer rewriting for video hosts (`megacloud`, `zokoanime`, `megaplay`, `blakite`, `mangadex`).
4. **Single File Deployment**:
   - Just upload **one file** (`kagemi-server-linux`) to your VPS.

---

## How to Run on Windows (Local Testing)

Double click `kagemi-server.exe` or run in terminal:
```powershell
.\kagemi-server.exe
```
Open your browser at:
- `http://localhost:8085/` (Landing Page)
- `http://localhost:8085/home` (Home Dashboard)
- `http://localhost:8085/shorts` (Short Drama Hub)
- `http://localhost:8085/api/health` (Live Diagnostics)

---

## How to Deploy to Linux VPS (Hostnin / Hostinger / Hetzner)

### Step 1: Upload the Linux Binary
Upload `kagemi-server-linux` to `/var/www/kagemi/` on your server:
```bash
mkdir -p /var/www/kagemi
scp kagemi-server-linux root@YOUR_SERVER_IP:/var/www/kagemi/
```

### Step 2: Make It Executable
```bash
chmod +x /var/www/kagemi/kagemi-server-linux
```

### Step 3: Set Up a Systemd Service (Autostart & Crash Recovery)
Create `/etc/systemd/system/kagemi.service`:
```ini
[Unit]
Description=Kagemi Go Single Binary Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/kagemi
ExecStart=/var/www/kagemi/kagemi-server-linux
Restart=always
RestartSec=3
Environment=PORT=8085

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now kagemi
sudo systemctl status kagemi
```

### Step 4: Reverse Proxy with Caddy (Automatic Free SSL)
Install Caddy:
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

Edit `/etc/caddy/Caddyfile`:
```caddyfile
yourdomain.com {
    reverse_proxy localhost:8085
}
```
Reload Caddy:
```bash
sudo systemctl reload caddy
```
Done! Your entire Kagemi app is live with HTTPS and auto-renewing SSL!

---

## Rebuilding the Binaries

If you update frontend or backend code:
```powershell
# Windows binary:
go build -ldflags="-s -w" -o kagemi-server.exe .

# Linux VPS binary:
$env:GOOS="linux"; $env:GOARCH="amd64"; go build -ldflags="-s -w" -o kagemi-server-linux .
```
