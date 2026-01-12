import 'server-only'; // 🛡️ Forces a build error if a client component tries to import this
import { ANIME } from "@consumet/extensions";

// THIS IS THE SERVER-ONLY INSTANCE
// Safe to use in Server Components and API Routes.
export const consumetClient = new ANIME.Hianime();