import { Brush, Clapperboard, Film, Microscope, Music2, Palette, PenLine, Sparkles, type LucideIcon } from "lucide-react";
import type { GenreKey } from "./genres";

export type CategoryKey = "storyteller" | "animator" | "filmmaker" | "designer" | "artist" | "music" | "researcher" | "content";

export const CATEGORY_KEYS: CategoryKey[] = ["storyteller", "animator", "filmmaker", "designer", "artist", "music", "researcher", "content"];

export const CATEGORIES: Record<
  CategoryKey,
  { label: string; plural: string; icon: LucideIcon; focus: string[]; tone: GenreKey; blurb: string }
> = {
  storyteller: {
    label: "Writer / Storyteller",
    plural: "Writers",
    icon: PenLine,
    focus: ["Scripts", "Plots", "Characters", "Fictional worlds", "Story development"],
    tone: "adventure",
    blurb: "Writers who build worlds, characters and the plots that hold them together.",
  },
  animator: {
    label: "Animator",
    plural: "Animators",
    icon: Sparkles,
    focus: ["Animation", "Illustration", "Motion graphics", "Visual storytelling"],
    tone: "romance",
    blurb: "Artists who give stories movement, faces and light.",
  },
  filmmaker: {
    label: "Filmmaker",
    plural: "Filmmakers",
    icon: Film,
    focus: ["Directing", "Cinematography", "Short films", "Screen storytelling"],
    tone: "adventure",
    blurb: "Directors and crews who bring scripts to the screen.",
  },
  designer: {
    label: "Designer",
    plural: "Designers",
    icon: Palette,
    focus: ["Character design", "Visual development", "Posters", "UI & graphics"],
    tone: "romance",
    blurb: "Designers who shape the look and identity of a story.",
  },
  artist: {
    label: "Artist",
    plural: "Artists",
    icon: Brush,
    focus: ["Illustration", "Concept art", "Comics", "Painting"],
    tone: "peaceful",
    blurb: "Illustrators and painters who give stories their images.",
  },
  researcher: {
    label: "Researcher",
    plural: "Researchers",
    icon: Microscope,
    focus: ["Historical research", "Fact-checking", "Cultural consulting", "Science advice"],
    tone: "moral",
    blurb: "Researchers who keep worlds grounded and authentic.",
  },
  music: {
    label: "Music Producer",
    plural: "Music Producers",
    icon: Music2,
    focus: ["Soundtracks", "Beats", "Background scores", "Audio production"],
    tone: "peaceful",
    blurb: "Composers and producers who score the feeling of a scene.",
  },
  content: {
    label: "Content Creator",
    plural: "Content Creators",
    icon: Clapperboard,
    focus: ["Video editing", "Storytelling", "Digital content", "Visual production"],
    tone: "moral",
    blurb: "Editors and filmmakers who shape stories for the screen.",
  },
};

export type Experience = "Emerging" | "Intermediate" | "Professional" | "Veteran";
export const EXPERIENCE_LEVELS: Experience[] = ["Emerging", "Intermediate", "Professional", "Veteran"];

export type Availability = "open" | "limited" | "booked";
export const AVAILABILITY: Record<Availability, { label: string; short: string }> = {
  open: { label: "Open to collaborate", short: "Open" },
  limited: { label: "Limited availability", short: "Limited" },
  booked: { label: "Currently booked", short: "Booked" },
};

export type CollabPref = "Long-term" | "Short project" | "Remote" | "Paid" | "Passion project";
export const COLLAB_PREFS: CollabPref[] = [
  "Long-term",
  "Short project",
  "Remote",
  "Paid",
  "Passion project",
];
