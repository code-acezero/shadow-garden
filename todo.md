Shadow Garden - Advanced Anime Streaming Web App MVP
Core Files to Create/Modify (Max 8 files limit - MVP focus)
1. src/pages/Index.tsx - Main Homepage
Animated hero section with top 5 trending anime slider (parallax effect)
Continue watching section (if user has watch history)
Latest episodes section
Anime schedule section
Three columns: Latest completed, New animes, Top animes
Upcoming animes section
2. src/components/Layout/Navigation.tsx - Top & Bottom Navigation
Top: Animated logo, search bar with filters, AI chat icon, notifications, profile menu
Bottom: Home, Schedule, Trending, Upcoming, OtakuVerse, Menu (settings/themes)
3. src/components/Anime/AnimeCard.tsx - Reusable Anime Card Component
Fluid glass morphism design
Hover animations
Watchlist integration (+/- buttons)
Rating display
4. src/components/Auth/AuthModal.tsx - Login/Registration Modal
Dark themed auth forms
Social login options
Registration with profile setup
5. src/components/Player/AnimePlayer.tsx - Advanced Video Player
Custom controls with skip intro/outro
Server switching (Zoro.to primary, GogoAnime fallback)
Episode navigation
Continue watching tracking
6. src/components/Social/OtakuVerse.tsx - Social Media Section
Post creation (text/images)
Feed display
User interactions (like, comment, follow)
Watchlist sharing
7. src/lib/api.ts - API Integration Layer
Jikan API integration
Zoro.to and GogoAnime data fetching
Error handling and fallback logic
Supabase integration for user data
8. src/components/Theme/ThemeProvider.tsx - Advanced Theme System
Multiple anime themes (Death Note, Dragon Ball, etc.)
Custom cursor options
Fluid animations per theme
Theme persistence
Key Features for MVP:
✅ Basic anime browsing with Jikan API
✅ User authentication (Supabase)
✅ Watchlist functionality
✅ Dark/red/gothic default theme
✅ Responsive bottom navigation
✅ Basic anime player
✅ Continue watching tracking
✅ Social posts (basic text/image)
Advanced Features (Future iterations):
AI image search
Advanced themes with animations
Loading screen animations
Direct messaging
Import/export watchlists
Advanced player controls
Notification system
Tech Stack:
React + TypeScript + Vite
Shadcn/ui + Tailwind CSS
Consumet API for anime data
Supabase for backend/auth
Framer Motion for animations