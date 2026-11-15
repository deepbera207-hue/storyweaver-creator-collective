/**
 * Rule-based compatibility scoring used for the DEMO matchmaking experience.
 * It is not AI: swap `rankMatches` for a model-backed call when one is connected.
 */
import type { Creator } from "@/data/creators";
import { CATEGORIES, EXPERIENCE_LEVELS, type CategoryKey, type CollabPref, type Experience } from "./categories";
import { GENRES, type GenreKey } from "./genres";

export type MatchBrief = {
  seeking: CategoryKey | "any";
  genres: GenreKey[];
  skills: string[];
  experience: Experience | "any";
  preferences: CollabPref[];
};

export type MatchResult = { creator: Creator; score: number; reasons: string[] };

const norm = (s: string) => s.toLowerCase().trim();

export function scoreMatch(brief: MatchBrief, creator: Creator): MatchResult {
  const reasons: string[] = [];
  let score = 0;

  // Category fit (25)
  if (brief.seeking === "any" || creator.category === brief.seeking) score += 25;

  // Genre compatibility (35)
  const shared = brief.genres.filter((g) => creator.genres.includes(g));
  if (brief.genres.length > 0) {
    const primaryHit = brief.genres[0] && creator.genres[0] === brief.genres[0];
    score += Math.round((shared.length / brief.genres.length) * 28) + (primaryHit ? 7 : 0);
    const firstShared = shared[0];
    if (firstShared) {
      const themes = GENRES[firstShared].themes.slice(0, 2).join(" and ");
      reasons.push(
        `Shares your love of ${shared.map((g) => GENRES[g].short.toLowerCase()).join(" & ")} — drawn to ${themes}.`,
      );
    }
  } else {
    score += 18;
  }

  // Skills & creative interests (20)
  const pool = [...creator.skills, ...creator.interests].map(norm);
  const hits = brief.skills.filter((s) => pool.some((p) => p.includes(norm(s)) || norm(s).includes(p)));
  if (brief.skills.length > 0) {
    score += Math.round((hits.length / brief.skills.length) * 20);
    if (hits.length > 0) reasons.push(`Brings the ${hits.slice(0, 3).join(", ").toLowerCase()} you asked for.`);
  } else {
    score += 12;
    const top = creator.skills.slice(0, 2).join(" and ").toLowerCase();
    reasons.push(`Strong in ${top}.`);
  }

  // Experience (10)
  if (brief.experience === "any") {
    score += 7;
  } else {
    const gap = Math.abs(EXPERIENCE_LEVELS.indexOf(brief.experience) - EXPERIENCE_LEVELS.indexOf(creator.experience));
    score += Math.max(0, 10 - gap * 4);
    if (gap === 0) reasons.push(`${creator.experience} level, exactly what you're after.`);
  }

  // Collaboration preferences (7)
  const prefHits = brief.preferences.filter((p) => creator.collabPrefs.includes(p));
  if (brief.preferences.length > 0) {
    score += Math.round((prefHits.length / brief.preferences.length) * 7);
    if (prefHits.length > 0) reasons.push(`Also open to ${prefHits.map((p) => p.toLowerCase()).join(", ")} work.`);
  } else score += 4;

  // Availability (3)
  if (creator.availability === "open") score += 3;
  else if (creator.availability === "limited") score += 1;

  if (brief.seeking !== "any" && creator.category === brief.seeking && creator.lookingFor.length) {
    const wants = creator.lookingFor.map((c) => CATEGORIES[c].plural.toLowerCase());
    if (wants.length) reasons.push(`Looking to team up with ${wants.join(" and ")}.`);
  }

  return { creator, score: Math.min(99, Math.max(0, score)), reasons: reasons.slice(0, 3) };
}

export function rankMatches(brief: MatchBrief, creators: Creator[], limit = 6): MatchResult[] {
  return creators
    .filter((c) => brief.seeking === "any" || c.category === brief.seeking)
    .map((c) => scoreMatch(brief, c))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function briefFromProfile(me: Creator): MatchBrief {
  return {
    seeking: me.lookingFor[0] ?? "any",
    genres: me.genres,
    skills: [],
    experience: "any",
    preferences: me.collabPrefs,
  };
}
