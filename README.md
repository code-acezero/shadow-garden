# 👁️ Shadow Garden v2 — Ultimate Project Documentation & Architecture Guide

[![Next.js 15](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v3.4-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android_Native-119EFF?style=for-the-badge&logo=capacitor)](https://capacitorjs.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Mobile_Native-5A0FC8?style=for-the-badge&logo=pwa)](https://web.dev/progressive-web-apps/)

---

## 📖 Executive Summary & Project Vision

**Shadow Garden v2** is an ultra-premium, dark-mode streaming, social networking, and gaming-tier anime hub. Built with **Antigravity Spatial Design** and **Liquid Glassmorphism**, it bridges multi-category video playback (Anime, Donghua, Hindi Dubs, Asian Drama, Blockbuster Movies) with an immersive social universe known as **OtakuVerse**.

The application combines real-time database synchronization via Supabase, autonomous AI agents (Alpha Protocol), guild/clan systems, native mobile integration (PWA + Capacitor Android APKs), and a custom HLS.js streaming player.

---

## ⚙️ Complete Technology Stack & Ecosystem

### 🌐 Core Web & Application Framework
- **Next.js 15.0 (App Router)**: Hybrid Server & Client Component architecture with dynamic routes, API endpoints, and streaming SSR.
- **React 19**: Modern concurrent React hooks (`useCallback`, `useMemo`, `useRef`, `useImperativeHandle`).
- **TypeScript 5.x**: Strict type checking with 0-tolerance runtime error handling.

### 🎨 Styling, Motion & Design Engine
- **Tailwind CSS v3.4**: Responsive utility foundation paired with dynamic HSL color tokens.
- **Custom Liquid Glassmorphism**: Translucent frosted panels (`backdrop-blur-3xl`, `bg-white/[0.04]`), glass highlight reflections, and subtle metallic borders (`border-white/20`).
- **Framer Motion**: Smooth entry animations, gesture overlays, and floating layout transitions.
- **Lucide Icons**: Semantic UI icon kit.

### 📼 Video Engine & Streaming Infrastructure
- **Custom HLS.js Player Engine**: Native HLS stream parsing (`.m3u8`), resolution quality switching (360p to 1080p), playback speed tuning, audio track selection, and sub-second buffering handling.
- **SafeEmbed & Ad Shield Protection**: `IframeAdShield.tsx` layer wrapping third-party embeds (Dailymotion, Mp4upload, Filemoon, Streamwish) to block malicious popups and redirect scripts.
- **Custom Subtitle Renderer**: Customizable captions with configurable font sizes, background overlays, text colors, and opacity adjustments.

### 🗄️ Database, Authentication & Realtime Subsystem
- **Supabase PostgreSQL**: Managed cloud relational database with Row Level Security (RLS).
- **Supabase Realtime**: Instant WebSocket channels for direct messages, post comments, notifications, and presence tracking.
- **Supabase Auth**: Authentication handling with persistent sessions and profile syncing.

### 🤖 AI Autonomous Agent Subsystem
- **Alpha Protocol**: Autonomous AI agent operating 24/7. Alpha moderates posts, responds to `@alpha` mentions across social feeds/comments, manages clan entry requests, and acts as the First Shadow of OtakuVerse.

### 📱 Mobile, PWA & CI/CD Pipelines
- **Capacitor 6**: Native wrapper bridging web assets into Android APK binaries.
- **Service Worker (`sw.js`)**: Offline caching, PWA installation lifecycle, and native background sync.
- **GitHub Actions CI/CD (`build-apk.yml`)**: Automated headless Gradle build pipeline compiling Android APK binaries on repository push.

---

## 🌟 Major Subsystems & Features Guide

### 1. 🎬 Multi-Category Streaming Engine
- **Anime Hub**: Subbed and dubbed Japanese anime series with episode selection grids, server switching, auto-next playback, and skip intro/outro capabilities.
- **Donghua Hub**: Specialized Chinese animation streaming interface sharing the full `AnimePlayer` engine with dedicated provider mirrors.
- **Hindi Dubbed Portal**: Subbed & Hindi dubbed anime series and movies with dedicated audio stream switching.
- **Asian Drama Portal**: Korean, Japanese, and Chinese dramas with episode trackers and custom subtitles.
- **Movies Portal**: Full-length blockbuster feature films with server fallback mirrors.

### 2. ⏳ Player Loading & Buffering States
- **Initial Stream Loading**: Displays the **Liquid Wave Glass Loader** (`MagicalWaveParticlesPlayerLoader`) featuring frosted glass shimmer and animated gradient wave particles.
- **Network Buffering**: Displays the **Run Happy GIF Loader** (`RunHappyPlayerLoader`) on a **completely transparent background** (`bg-transparent backdrop-blur-none`) overlay directly over active video playback.
- **Glowing Red Text Styling**: Loading messages (`LOADING REALITY...` / `LOADING CRYSTALS...`) styled in glowing red typography (`text-red-500` with `drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]`).

### 3. 💬 Messages & Direct Messaging System
- **Real-Time 1-on-1 & Clan Chats**: Instant message delivery powered by Supabase Realtime Channels.
- **Self-Message Unread Filtering**: Unread message queries explicitly exclude user's own sent messages (`.neq('sender_id', user.id)`).
- **Automatic Read Status**: Opening a chat or sending a message automatically updates `participant_last_read` in local state and database.
- **Smart Notification Suppression**: Real-time whisper banners for incoming messages are automatically suppressed when the user is actively viewing the `/messages` inbox page.

### 4. 🔔 Watchlist, Oracle Engine & Notifications
- **Watchlist Sync**: Save titles to Watching, Completed, On Hold, Dropped, or Planning To Watch. Automatically records `total_episodes` and `type`.
- **Oracle Runner (`oracle-runner.ts`)**: Background runner that periodically checks user watchlists against provider APIs, updates stored `total_episodes` in Supabase, and broadcasts `EPISODE_ALERT` notifications when new episodes release.
- **Top Nav Bell Icon**: Displays real-time unread badge counts for alerts and messages.
- **Native Browser Push Notifications**: Native system notification prompts (`Notification.requestPermission()`) for episode drops and direct messages.

### 5. 🛡️ OtakuVerse Social Universe & Clans System
- **Global Social Feed**: Share posts, images, polls, and quizzes. Supports mentions (`@user`, `@alpha`), hashtag discovery, and comment threads.
- **Clans & Guilds**: Form guilds with custom banners, level progression, role hierarchies (Leader, Co-Leader, Elder, Member), private clan chatrooms, and custom Alpha AI moderation directives.
- **Profile Frames & Avatar Edge Ring**: Level progression (F-Novice to SSS-Overlord), fantasy profile frames (Iron to Divine Archon), and a thin glowing emerald edge ring (`ring-2 ring-emerald-500 animate-pulse`) attached directly to the circular profile picture (`img`) inside `FantasyFrame` for active/online users and Alpha (active 24/7).

### 6. 📅 Interactive Weekly Schedule
- **Responsive Release Grid**: Weekly release schedule displaying upcoming anime episodes. Uses a responsive grid layout (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) ensuring rank cards flow sequentially without early wrapping on mobile devices.

### 7. 📲 PWA & Native Android Support
- **PWA Installation**: Service worker registration with `beforeinstallprompt` overlay suppression to prevent intrusive browser installation popups.
- **Capacitor Mobile Native**: Full touch optimization, back button handling, and native Android status bar styling.

---

## 🗄️ Supabase Database Schema Overview

| Table Name | Primary Purpose | Key Columns |
| :--- | :--- | :--- |
| `profiles` | User accounts & progression | `id`, `username`, `avatar_url`, `role`, `level`, `xp`, `frame_id`, `admin_title`, `title`, `updated_at` |
| `watchlist` | Saved media titles | `id`, `user_id`, `anime_id`, `status`, `last_episode_number`, `total_episodes`, `type`, `media_type` |
| `notifications` | System & episode alerts | `id`, `user_id`, `type`, `title`, `content`, `link`, `is_read`, `created_at` |
| `chat_conversations` | DMs & Clan Chat channels | `id`, `type`, `clan_id`, `created_at`, `updated_at` |
| `chat_participants` | Conversation members | `id`, `conversation_id`, `user_id`, `last_read_at` |
| `chat_messages` | Chat messages | `id`, `conversation_id`, `sender_id`, `content`, `image_url`, `audio_url`, `gif_url`, `created_at` |
| `posts` | OtakuVerse social posts | `id`, `user_id`, `content`, `images`, `poll`, `likes_count`, `comments_count`, `created_at` |
| `comments` | Post comment threads | `id`, `post_id`, `user_id`, `content`, `parent_id`, `likes_count`, `created_at` |
| `clans` | Guilds & clans | `id`, `name`, `tag`, `avatar_url`, `banner_url`, `level`, `alpha_settings`, `leader_id` |
| `clan_members` | Guild membership | `id`, `clan_id`, `user_id`, `role`, `joined_at` |

---

## ⚡ Quick Start & Development Setup

### Prerequisites
- **Node.js**: v18.x or v20.x
- **Package Manager**: `pnpm` (recommended) or `npm`
- **Supabase**: Active Supabase project with database & auth configured

### 1. Installation

```bash
git clone https://github.com/code-acezero/shadow-garden.git
cd shadow-garden-v2
pnpm install
```

### 2. Environment Variables Setup

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Running Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` in your browser.

### 4. Verification & Production Build

```bash
# Type check without emitting
npx tsc --noEmit

# Compile production build
pnpm build
```

---

## 📱 Android APK Build Pipeline

This repository features an automated GitHub Actions CI/CD workflow (`.github/workflows/build-apk.yml`):

1. **Trigger**: Automatically runs on every push to the `main` branch.
2. **Steps**:
   - Checks out repository and sets up Java JDK 17 & Node 20.
   - Runs `pnpm install` and compiles Next.js static exports (`pnpm build`).
   - Copies web assets to Capacitor Android platform (`npx cap copy android`).
   - Compiles native APK via Gradle (`./gradlew assembleDebug`).
3. **Artifact**: The resulting APK file (`app-debug.apk`) is published under GitHub Workflow Actions Artifacts for instant download and testing.

---

## 📁 Repository Directory Architecture

```
shadow-garden-v2/
├── .github/
│   └── workflows/          # GitHub Actions CI/CD (build-apk.yml)
├── public/                 # Static assets (/run-happy.gif, favicons, audio)
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (watch)/        # Watch portals (/watch, /hindi-watch, /donghua-watch, /drama-watch, /movies-watch)
│   │   ├── messages/       # Realtime Direct Messaging Inbox
│   │   ├── social/         # OtakuVerse Social Portal
│   │   ├── watchlist/      # User Watchlist Page
│   │   ├── schedule/       # Release Schedule Page
│   │   ├── profile/        # User Profile & Fantasy Frames Manager
│   │   └── api/            # API Endpoints (/api/oracle, /api/alpha/agent, /api/proxy)
│   ├── components/
│   │   ├── AI/             # Alpha AI Agent Floating Widget
│   │   ├── Anime/          # Anime Cards, Spotlight, Notifications, Footer
│   │   ├── Player/         # AnimePlayer, HindiPlayer, DramaPlayer, IframeAdShield
│   │   ├── Portal/         # Portal Sequence Components
│   │   ├── PWA/            # PWAInstaller & Liquid Glass Splash Screen
│   │   ├── Schedule/       # Responsive Weekly Release Grid
│   │   ├── Social/         # OtakuVerse Feed, Chats, Clans, Post Composers
│   │   ├── UIx/            # SkeletonLoaders & WhisperIsland Banner
│   │   ├── User/           # ProfileAvatar, FantasyFrame, UserTitleBadge
│   │   └── Watch/          # LiquidWatchLoaders & WatchListButton
│   ├── context/            # AuthContext & Global State
│   ├── hooks/              # Custom React Hooks (useSettings, useTravellerProfile)
│   └── lib/                # API Helpers, Supabase SDK, Oracle Runner
├── .env.local              # Local environment variables
├── capacitor.config.json   # Capacitor mobile config
├── next.config.js          # Next.js config
├── tailwind.config.ts      # Tailwind design system tokens
└── tsconfig.json           # TypeScript configuration
```

---

## 📜 License & Credits

Built with ❤️ for the Otaku & Streaming Community.
**Shadow Garden Protocol © 2026**. All rights reserved.
