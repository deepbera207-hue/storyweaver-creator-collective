/**
 * Creator model used by discovery, feed and profiles. Creators come from real
 * Crea-Link profiles stored in Lovable Cloud (see src/lib/store.tsx).
 */
import romance from "@/assets/work-romance.jpg";
import peaceful from "@/assets/work-peaceful.jpg";
import adventure from "@/assets/work-adventure.jpg";
import thriller from "@/assets/work-thriller.jpg";
import moral from "@/assets/work-moral.jpg";
import animation from "@/assets/work-animation.jpg";
import music from "@/assets/work-music.jpg";
import video from "@/assets/work-video.jpg";

import type { Availability, CategoryKey, CollabPref, Experience } from "@/lib/categories";
import type { GenreKey } from "@/lib/genres";

export type PortfolioItem = { title: string; kind: string; image: string; description: string };
export type PastProject = { title: string; year: number; role: string; summary: string };

export type Creator = {
  id: string;
  name: string;
  username?: string | null;
  avatarUrl?: string;
  onboarded?: boolean;
  location: string;
  category: CategoryKey;
  genres: GenreKey[];
  tagline: string;
  bio: string;
  skills: string[];
  interests: string[];
  experience: Experience;
  years: number;
  availability: Availability;
  collabPrefs: CollabPref[];
  lookingFor: CategoryKey[];
  portfolio: PortfolioItem[];
  projects: PastProject[];
  featured?: boolean;
};

/** Genre-matched artwork used as soft cover imagery (not sample people). */
export const GENRE_COVERS = { romance, peaceful, adventure, dark: thriller, moral } as const;
export const CATEGORY_COVERS = { animation, music, video } as const;
