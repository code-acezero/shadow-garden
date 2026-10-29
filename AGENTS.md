# Agent Rules & UI Architectural Directives

These directives are mandatory for all AI agents working in this repository. Follow them strictly across all pages, components, and refactors.

---

## 1. Icon Selection & Uniqueness Rules
- **NEVER use sparkle icons (`Sparkles`, `Sparkle`)**:
  - The `Sparkles` icon from `lucide-react` (or any equivalent star-burst sparkle icon) is strictly prohibited across all UI components, dropdowns, buttons, badges, modals, and toolbars.
- **Use suitable, contextual icons**:
  - **Genres / Tags**: Use `Tag`, `Layers`, or `Shapes`.
  - **Recently Added**: Use `PlusCircle` or `CalendarPlus`.
  - **Best Match / Recommended**: Use `BadgeCheck` or `ThumbsUp`.
  - **Default / Controls**: Use `SlidersHorizontal` or `Compass`.
  - **Latest Updated / Timeline**: Use `Clock`.
  - **Top Rated / Score**: Use `Star`.
  - **Popular / Most Viewed**: Use `Flame`.
  - **Release Date**: Use `Calendar`.
  - **Alphabetical (A-Z)**: Use `ArrowUpDown` or `ArrowDownAZ`.
- **Never duplicate icons for different options**:
  - Every distinct menu item, filter option, or sort order MUST have a unique, distinct icon. Never use the same icon for two different options in the same list or dropdown (e.g. do NOT use `Clock` for both "Default" and "Latest Updated").

---

## 2. No Breathing Dots
- **NEVER use breathing or pulsing indicator dots**:
  - Do NOT use `<span className="... rounded-full animate-pulse" />` or `animate-ping` dots (such as green/emerald/purple pulsing dots beside title counters, status labels, or live indicators).
  - Use clean typographic counts (e.g. `24+ titles available`), static pill badges, or crisp static icons instead.

---

## 3. Strict Page Width Alignment with Top Nav
- **All page content must match the Top Navigation width**:
  - The top navbar (`WhisperIsland`) is fixed edge-to-edge with `w-full px-2 sm:px-4`.
  - Every page hero header, dropdown toolbar, filter chip container, content card grid, and pagination bar MUST match this width: `w-full px-2 sm:px-4` (or `w-full px-2 sm:px-4 md:px-6`).
  - **NEVER constrain page content to artificial narrow boxes** (e.g., `max-w-6xl mx-auto` or `max-w-7xl mx-auto`) that leave empty side gutters on wide desktop displays (>1280px / 1440p / 1080p).
  - The content grid's leftmost card must align directly under the Top Nav logo, and the rightmost card must align under the user profile button.

---

## 4. No Random Green Dots or Any Indicator Dots Anywhere
- **NEVER use random green dots or any decorative status dots**:
  - Do NOT place green dots, emerald dots, colored status dots, or indicator dots anywhere in badges, cards, footers, headers, navbars, or buttons (e.g. `<span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />`).
  - Never use random colored dots to simulate live status, active indicators, or operational health.
  - Use clean typographic labels, icons, or subtle borders instead.

---

## 5. Design Grounding & Anti-AI-Slop Directive
- **Always ground designs in real-world professional references**:
  - Never generate arbitrary, uninspired "vibe-coded" UI elements or AI slop without clear design vision.
  - Before designing or redesigning components, pages, or layouts, always look up and draw inspiration from the internet, leading media platforms (e.g., Netflix, Crunchyroll, Steam, Linear, Apple HIG, One UI 8), GitHub repositories, and top-tier Figma design systems.
  - Ensure every component has intentional visual hierarchy, purposeful spacing, refined typography, and cohesive aesthetic value.

---

## 6. Anti-Container & Minimal Enclosure Directive (No Unnecessary Boxes)
- **Do NOT wrap every text, label, tag, or option into its own heavy bordered container or boxed pill**:
  - Boxing every single element into individual bordered rectangles/cards creates visual clutter and unmistakable "AI slop".
  - Use clean typography, deliberate whitespace, subtle color distinctions, or minimalistic divider lines instead of nested sub-boxes and excessive borders.
  - Keep suggestion rows, chips, and metadata sleek, airy, and restrained (e.g. max 5-6 clean, lightweight items instead of long endless rows of enclosed boxes).

