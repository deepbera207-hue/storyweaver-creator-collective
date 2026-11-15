import type { GenreKey } from "./genres";
import type { GenreId } from "@/features/story-assistant/types";

/**
 * One genre → palette mapping for all of Crea-Link. Project genres (from the
 * studio's genre list) resolve to one of five frosted pastel palettes, which
 * drive the discovery cards (--g-*), the studio workspace (--studio-*) and the
 * story assistant (--sa-*). The first (primary) genre decides the palette.
 */
const KEYWORDS: [GenreKey, RegExp][] = [
  ["dark", /revenge|thriller|horror|psycholog|mystery|crime|dark|cruel/i],
  ["romance", /romance|love|relationship|drama/i],
  ["adventure", /adventure|action|fantasy|science fiction|sci-fi|battle|epic|explor/i],
  ["moral", /social|moral|humanity|coming of age|documentary|society/i],
  ["peaceful", /slice of life|healing|comfort|calm|peace|animation|comedy|other/i],
];

export function paletteForGenre(genre?: string | null): GenreKey {
  if (!genre) return "peaceful";
  for (const [key, re] of KEYWORDS) if (re.test(genre)) return key;
  return "peaceful";
}

const STORY_GENRE: Record<GenreKey, GenreId> = {
  romance: "romance",
  peaceful: "calm",
  moral: "moral",
  adventure: "adventure",
  dark: "thriller",
};

export function storyGenreForProject(genre?: string | null): GenreId {
  return STORY_GENRE[paletteForGenre(genre)];
}

export function genreKeysForProject(primary: string, genres: string[]): GenreKey[] {
  return [...new Set([primary, ...genres].map(paletteForGenre))];
}
