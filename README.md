# 👁️ Shadow Garden v2 — Otakuverse Liquid Glass Hub

[![Next.js 15](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v3.4-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Mobile_Native-5A0FC8?style=for-the-badge&logo=pwa)](https://web.dev/progressive-web-apps/)

**Shadow Garden v2** is an ultra-premium, dark-mode streaming, social, and anime ecosystem built with **Antigravity Spatial Design** and **Liquid Glassmorphism**. It combines high-performance multi-provider video playback across Anime, Donghua, Hindi Dubs, Asian Drama, and Movies with a real-time social universe (OtakuVerse), AI autonomous agents, clan guilds, and real-time watchlist tracking.

---

## 🎯 Design Architecture & UI/UX Principles

Built under the **Antigravity Design Engine**, Shadow Garden v2 enforces a spatial, weightless, and dark glass aesthetic:

- **Liquid Glassmorphism**: Translucent frosted panels (`backdrop-blur-3xl`, `bg-white/[0.04]`), specular glass highlight reflections, and subtle metallic borders (`border-white/20`).
- **Spatial Weightlessness**: Layered Z-axis depth using soft diffused drop-shadows (`shadow-[0_12px_40px_0_rgba(0,0,0,0.5)]`), floating islands, and parallax ambience.
- **Fluid Player Responsiveness**: Custom HLS & HTML5 video players featuring auto-scaling control overlays, responsive settings menus (`max-h-[60%] sm:max-h-[75%]`), and fluid Play/Pause buttons (`clamp(2rem, 10vw, 4rem)`).
- **Pulsing Profile Avatar Frames**: Realtime online status communicated via glowing emerald edge rings (`ring-2 ring-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.9)] animate-pulse`) bounded tightly inside custom tier frames (Iron, Bronze, Silver, Crimson, Emerald, Golden, Shadow, Divine).

---

## 📚 A-Z Feature Guide

### 🅰️ **A — Alpha AI Autonomous Agent**
Integrated AI companion operating 24/7. Alpha moderates discourse, responds to `@alpha` mentions across social posts and comments, and dynamically interacts with clan members.

### 🅱️ **B — Background Buffering & Loaders**
- **Initial Stream Loading**: Uses the Liquid Wave Glass Loader (`MagicalWaveParticlesPlayerLoader`) with frosted glass shimmer on Drama & Movie streams.
- **Network Buffering**: Displays the GIF loader (`RunHappyPlayerLoader`) on a completely transparent background (`bg-transparent backdrop-blur-none`) over active playback so the video stream remains visible.

### 🅾️ **C — Clans & Guild System**
Create, join, and manage OtakuVerse clans. Clans feature custom banners, level progression, custom member titles, private clan chat channels, and automated entry review by Alpha AI.

### 🇩 **D — Donghua & Drama Dedicated Hubs**
Specialized streaming portals tailored for Chinese Animation (Donghua) and Asian Dramas with episode selectors, server fallback switches, subtitle tracks, and resume-playback state persistence.

### 🇪 **E — Episode Trackers & Resume Playback**
Remembers exact timestamp positions for watched episodes across devices, rendering progress indicators on media cards and enabling one-tap resume.

### 🇫 **F — Fantasy Profile Frames & Tier Badges**
Level-based and exclusive profile frames (Iron to Divine Archon) with dynamic level colors, custom titles, and active status edge rings.

### 🇬 **G — Gesture & Hotkey Controls**
- **Double Tap / Swipe**: Double-tap left/right to skip 10s, vertical swipe for volume/brightness control, horizontal swipe for episode navigation.
- **Keyboard Shortcuts**: Space (Play/Pause), F (Fullscreen), M (Mute), Arrow keys (Seek / Volume).

### 🇭 **H — Hindi Dubbed Anime & Movies**
Dedicated hub for Hindi dubbed & subbed anime series and blockbuster movies with multi-server mirrors and quality resolution pickers (360p to 1080p).

### 🇮 **I — In-App Notifications & Whisper Island**
Dynamic top navigation notification bell with real-time unread badges, floating toast banners (`shadow-whisper`), and auto-dismissal timers.

### 🇲 **M — Messages & Real-Time Messaging Inbox**
Full-featured direct messaging system with:
- Instant message delivery via Supabase Realtime Channels.
- Unread message counter filtering out self-sent messages (`.neq('sender_id', user.id)`).
- Automatic `last_read_at` updating on chat view.
- Smart notification suppression when actively viewing the `/messages` inbox page.

### 🇳 **N — Native Push Notifications**
Supports native browser system notifications (`Notification.requestPermission()`) for watchlist update alerts and incoming direct messages.

### 🇴 **O — Oracle Background Watchlist Engine**
Periodic server-side runner (`oracle-runner.ts`) that checks user watchlists against provider APIs, updates stored `total_episodes`, and broadcasts `EPISODE_ALERT` notifications when new episodes release.

### 🇵 **P — PWA & Android APK Pipeline**
- **PWA Ready**: Service worker registration with `beforeinstallprompt` overlay suppression to prevent obtrusive installation popups.
- **Automated APK Builds**: GitHub Actions CI/CD workflow (`build-apk.yml`) building native Android APK binaries via Capacitor on code push.

### 🇷 **R — Responsive Schedule Grid**
Interactive weekly anime release schedule featuring clean sequential card ordering across desktop, tablet, and mobile screens.

### 🇸 **S — Server Fallback & Safe Embed**
Multi-server selection (Vidstreaming, Streamwish, Mp4upload, Dailymotion, Filemoon) with automatic ad-shield protection (`IframeAdShield.tsx`).

### 🇼 **W — Watchlist Sync & Categorization**
Bookmark titles into Watching, Completed, On Hold, Dropped, or Planning To Watch lists. Automatically saves total episode counts and media types (`anime`, `hindi`, `donghua`, `movie`, `drama`).

---

## 🛠️ Technology Stack

```
├── Framework       : Next.js 15.0 (App Router) + React 19
├── Language        : TypeScript 5.x
├── Styling         : Tailwind CSS v3.4 + Custom CSS Glassmorphism
├── Database & Auth : Supabase (PostgreSQL + Auth + Realtime Subscriptions)
├── Video Engine    : HLS.js + HTML5 Custom Video Controls + SafeEmbed
├── Icons           : Lucide React Icons
├── Mobile & Native : Capacitor 6 + PWA Service Workers + GitHub Actions CI/CD
```

---

## ⚡ Quick Start & Setup

### Prerequisites

- Node.js 18.x or 20.x
- `pnpm` or `npm`
- A Supabase project with database & auth enabled

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/code-acezero/shadow-garden.git
cd shadow-garden-v2
pnpm install
```

### 2. Environment Variables Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Verify TypeScript & Build

```bash
# Type-check without emitting files
npx tsc --noEmit

# Production Build
pnpm build
```

---

## 📱 Android APK Automated Build

This repository includes a GitHub Actions CI/CD pipeline (`.github/workflows/build-apk.yml`) that automatically compiles an Android APK whenever code is pushed:

```yaml
name: Build Android APK
on:
  push:
    branches: [ main ]
```

The compiled APK binary is stored directly under GitHub Workflow Artifacts for instant download and testing on Android devices.

---

## 📁 Directory Architecture

```
shadow-garden-v2/
├── .github/workflows/     # CI/CD Workflows (Android APK Build)
├── public/                # Static assets & PWA manifest (/run-happy.gif, favicons)
├── src/
│   ├── app/               # Next.js App Router (watch, social, messages, search, profile)
│   ├── components/
│   │   ├── AI/            # Alpha AI Agent Widget & Directives
│   │   ├── Anime/         # Anime Cards, Spotlight, Notifications, Footer
│   │   ├── Player/        # AnimePlayer, HindiPlayer, DramaPlayer, IframeAdShield
│   │   ├── Portal/        # Portal Sequence Components
│   │   ├── PWA/           # PWAInstaller & Liquid Glass Splash Screen
│   │   ├── Schedule/      # Weekly Release Schedule Grid
│   │   ├── Social/        # OtakuVerse Feed, Chats, Clans, Post Composers
│   │   ├── UIx/           # Skeleton Loaders & Whisper Island Banner
│   │   ├── User/          # ProfileAvatar, FantasyFrame, Avatar Pickers
│   │   └── Watch/         # LiquidWatchLoaders & WatchListButton
│   ├── context/           # AuthContext & Global App State
│   ├── hooks/             # Custom Hooks (useSettings, useTravellerProfile)
│   └── lib/               # API clients, Supabase SDK, Oracle Runner
├── .env.local             # Environment secrets
├── capacitor.config.json  # Native Capacitor configuration
├── next.config.js         # Next.js configuration
└── tailwind.config.ts     # Design tokens & color system
```

---

## 📜 License & Credits

Designed & Built with ❤️ for the Otaku Community. Powered by **Shadow Garden Protocol**.
