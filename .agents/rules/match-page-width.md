# Rule: Match Page Width with Top Nav

## Directive
- **Every page layout must strictly match the width of the top navigation bar (`WhisperIsland`)**.
- The top navigation bar spans edge-to-edge with `w-full px-2 sm:px-4`.
- All page content containers (Hero headers, dropdown toolbars, active filters, media card grids, and pagination bars) must use `w-full px-2 sm:px-4` (or `w-full px-2 sm:px-4 md:px-6`).
- **NEVER use artificial narrow wrappers** (such as `max-w-6xl mx-auto` or `max-w-7xl mx-auto`) that constrain content into a smaller central column and leave unsightly empty margins on screens wider than 1280px.
- The leftmost card in grids must align with the top nav logo, and the rightmost card must align with the top nav profile/action button.
