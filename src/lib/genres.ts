export type GenreVars = { [key: `--${string}`]: string };

export type GenreKey = "romance" | "peaceful" | "moral" | "adventure" | "dark";

export const GENRE_KEYS: GenreKey[] = ["romance", "peaceful", "moral", "adventure", "dark"];

export const GENRES: Record<GenreKey, { label: string; short: string; themes: string[] }> = {
  romance: {
    label: "Romance & Relationships",
    short: "Romance",
    themes: ["love", "relationships", "emotional storytelling", "longing"],
  },
  peaceful: {
    label: "Peaceful & Comfort",
    short: "Comfort",
    themes: ["slice of life", "healing", "cozy", "soothing"],
  },
  moral: {
    label: "Moral, Society & Humanity",
    short: "Humanity",
    themes: ["society", "ethics", "community", "coming of age"],
  },
  adventure: {
    label: "Adventure & Fantasy",
    short: "Adventure",
    themes: ["fantasy", "action", "exploration", "worldbuilding"],
  },
  dark: {
    label: "Thriller & Dark Society",
    short: "Thriller",
    themes: ["revenge", "psychological", "horror", "dark society"],
  },
};

/**
 * Turns a creator's genres into CSS variables for genre-scoped utilities
 * (genre-wash, genre-chip, text-g-ink...). The first genre is primary; a
 * second genre is blended subtly into the companion wash.
 */
export function genreStyle(genres: GenreKey[]): GenreVars {
  const [primary, secondary] = genres;
  if (!primary) return {};
  const soft2 = secondary
    ? `color-mix(in oklab, var(--${secondary}-soft) 65%, var(--${primary}-soft2))`
    : `var(--${primary}-soft2)`;
  return {
    "--g-soft": `var(--${primary}-soft)`,
    "--g-soft2": soft2,
    "--g-accent": `var(--${primary}-accent)`,
    "--g-ink": `var(--${primary}-ink)`,
  };
}

/** Style for a single genre chip, independent of the surrounding theme. */
export function genreChipStyle(genre: GenreKey): GenreVars {
  return genreStyle([genre]);
}
