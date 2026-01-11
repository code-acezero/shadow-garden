import { ANIME } from "@consumet/extensions";

// THIS IS THE SERVER-ONLY INSTANCE
// Use this in src/app/home/page.tsx or API routes.
// NEVER use this in AnimeCard.tsx or SpotlightSlider.tsx
export const consumetClient = new ANIME.Hianime();