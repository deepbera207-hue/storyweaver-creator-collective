import type { CSSProperties } from 'react';
import type { Genre, ProjectStatus } from '../types/studio';

export type PaletteFamily = 'romance' | 'calm' | 'social' | 'adventure' | 'thriller';

export interface GenreThemeTokens {
  family: PaletteFamily;
  familyLabel: string;
  canvasBg: string;
  glassBg: string;
  tintPrimary: string;
  tintSecondary: string;
  softGradient: string;
  cardHeaderGradient: string;
  borderSubtle: string;
  borderStrong: string;
  accent: string;
  accentHover: string;
  accentSoft: string;
  accentText: string;
  ink: string;
  mutedInk: string;
  progressTrack: string;
  progressFill: string;
  bubbleSelfBg: string;
  bubbleSelfBorder: string;
}

export const PALETTES: Record<PaletteFamily, GenreThemeTokens> = {
  romance: {
    family: 'romance',
    familyLabel: 'Blush Rose & Lavender Glass',
    canvasBg: '#FFFDFD',
    glassBg: 'rgba(255, 255, 255, 0.84)',
    tintPrimary: '#FDF2F5',
    tintSecondary: '#F6F2FD',
    softGradient:
      'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(253,242,245,0.92) 52%, rgba(245,240,255,0.90) 100%)',
    cardHeaderGradient:
      'linear-gradient(120deg, rgba(252,231,238,0.65) 0%, rgba(243,235,255,0.55) 100%)',
    borderSubtle: 'rgba(190, 91, 117, 0.14)',
    borderStrong: 'rgba(190, 91, 117, 0.28)',
    accent: '#B55873',
    accentHover: '#9E4660',
    accentSoft: '#FCEEF2',
    accentText: '#8A3851',
    ink: '#351D26',
    mutedInk: '#6E505B',
    progressTrack: '#F6E4EA',
    progressFill: '#C7718A',
    bubbleSelfBg: '#FDF0F4',
    bubbleSelfBorder: 'rgba(181, 88, 115, 0.22)',
  },
  calm: {
    family: 'calm',
    familyLabel: 'Powder Sky & Mist Glass',
    canvasBg: '#FCFEFF',
    glassBg: 'rgba(255, 255, 255, 0.85)',
    tintPrimary: '#F1F7FC',
    tintSecondary: '#F3F6FA',
    softGradient:
      'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(241,247,252,0.92) 52%, rgba(235,243,250,0.90) 100%)',
    cardHeaderGradient:
      'linear-gradient(120deg, rgba(226,240,251,0.65) 0%, rgba(238,243,248,0.60) 100%)',
    borderSubtle: 'rgba(71, 116, 158, 0.14)',
    borderStrong: 'rgba(71, 116, 158, 0.28)',
    accent: '#46749E',
    accentHover: '#375F84',
    accentSoft: '#EAF3FA',
    accentText: '#2D5275',
    ink: '#1A2B3C',
    mutedInk: '#55697D',
    progressTrack: '#E3EEF7',
    progressFill: '#5B8BB6',
    bubbleSelfBg: '#EDF5FC',
    bubbleSelfBorder: 'rgba(70, 116, 158, 0.22)',
  },
  social: {
    family: 'social',
    familyLabel: 'Sage Mint & Linen Glass',
    canvasBg: '#FCFDFC',
    glassBg: 'rgba(255, 255, 255, 0.85)',
    tintPrimary: '#F1F7F3',
    tintSecondary: '#F4F6EE',
    softGradient:
      'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(241,247,243,0.92) 52%, rgba(243,246,236,0.90) 100%)',
    cardHeaderGradient:
      'linear-gradient(120deg, rgba(231,244,235,0.65) 0%, rgba(240,244,230,0.58) 100%)',
    borderSubtle: 'rgba(74, 122, 93, 0.14)',
    borderStrong: 'rgba(74, 122, 93, 0.28)',
    accent: '#487A5C',
    accentHover: '#39634A',
    accentSoft: '#EBF5EE',
    accentText: '#2F573F',
    ink: '#1E2F24',
    mutedInk: '#556A5D',
    progressTrack: '#E2EFE6',
    progressFill: '#5C9170',
    bubbleSelfBg: '#EEF7F1',
    bubbleSelfBorder: 'rgba(72, 122, 92, 0.22)',
  },
  adventure: {
    family: 'adventure',
    familyLabel: 'Warm Peach & Amber Glass',
    canvasBg: '#FFFEFC',
    glassBg: 'rgba(255, 255, 255, 0.85)',
    tintPrimary: '#FFF6EE',
    tintSecondary: '#FEF7E8',
    softGradient:
      'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(255,245,236,0.92) 52%, rgba(254,246,230,0.90) 100%)',
    cardHeaderGradient:
      'linear-gradient(120deg, rgba(255,235,219,0.65) 0%, rgba(254,243,219,0.58) 100%)',
    borderSubtle: 'rgba(186, 102, 48, 0.15)',
    borderStrong: 'rgba(186, 102, 48, 0.28)',
    accent: '#BA6630',
    accentHover: '#9D5323',
    accentSoft: '#FFF0E3',
    accentText: '#87441A',
    ink: '#362317',
    mutedInk: '#725B4D',
    progressTrack: '#FBE8D8',
    progressFill: '#CF7E48',
    bubbleSelfBg: '#FFF3E8',
    bubbleSelfBorder: 'rgba(186, 102, 48, 0.22)',
  },
  thriller: {
    family: 'thriller',
    familyLabel: 'Dusty Crimson & Rose White',
    canvasBg: '#FFFCFC',
    glassBg: 'rgba(255, 255, 255, 0.85)',
    tintPrimary: '#FDF2F3',
    tintSecondary: '#FBF0F2',
    softGradient:
      'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(253,241,243,0.92) 52%, rgba(249,233,236,0.90) 100%)',
    cardHeaderGradient:
      'linear-gradient(120deg, rgba(252,231,234,0.65) 0%, rgba(247,229,233,0.58) 100%)',
    borderSubtle: 'rgba(166, 68, 82, 0.15)',
    borderStrong: 'rgba(166, 68, 82, 0.28)',
    accent: '#A64452',
    accentHover: '#8C3542',
    accentSoft: '#FCECEF',
    accentText: '#7D2C38',
    ink: '#361A1F',
    mutedInk: '#704E54',
    progressTrack: '#F6E1E5',
    progressFill: '#BC5A68',
    bubbleSelfBg: '#FDF0F2',
    bubbleSelfBorder: 'rgba(166, 68, 82, 0.22)',
  },
};

const GENRE_TO_PALETTE: Record<Genre, PaletteFamily> = {
  'Love / Romance': 'romance',
  Drama: 'romance',
  'Slice of Life': 'calm',
  'Healing / Comfort': 'calm',
  Animation: 'calm',
  '2D Animation': 'calm',
  '3D Animation': 'calm',
  Documentary: 'social',
  Mystery: 'thriller',
  Comedy: 'calm',
  Other: 'calm',
  'Social Awareness': 'social',
  'Humanity / Morality': 'social',
  'Coming of Age': 'social',
  Fantasy: 'adventure',
  Action: 'adventure',
  Adventure: 'adventure',
  'Science Fiction': 'adventure',
  Revenge: 'thriller',
  'Psychological Thriller': 'thriller',
  Horror: 'thriller',
};

export function getGenreTheme(genre?: Genre): GenreThemeTokens {
  if (!genre) return PALETTES.calm;
  return PALETTES[GENRE_TO_PALETTE[genre] ?? 'calm'];
}

export function getThemeCssVars(genre?: Genre): CSSProperties {
  const t = getGenreTheme(genre);
  return {
    '--studio-canvas': t.canvasBg,
    '--studio-glass': t.glassBg,
    '--studio-tint': t.tintPrimary,
    '--studio-tint-alt': t.tintSecondary,
    '--studio-gradient': t.softGradient,
    '--studio-border': t.borderSubtle,
    '--studio-border-strong': t.borderStrong,
    '--studio-accent': t.accent,
    '--studio-accent-hover': t.accentHover,
    '--studio-accent-soft': t.accentSoft,
    '--studio-accent-text': t.accentText,
    '--studio-ink': t.ink,
    '--studio-muted': t.mutedInk,
  } as CSSProperties;
}

export const STATUS_STYLES: Record<
  ProjectStatus,
  { bg: string; border: string; text: string; label: string }
> = {
  Planning: {
    bg: '#F3F6FA',
    border: 'rgba(71, 102, 138, 0.20)',
    text: '#395575',
    label: 'Planning',
  },
  Recruiting: {
    bg: '#FFF3E8',
    border: 'rgba(186, 102, 48, 0.22)',
    text: '#8D491D',
    label: 'Recruiting',
  },
  Developing: {
    bg: '#F2EFFB',
    border: 'rgba(110, 86, 166, 0.20)',
    text: '#543D8A',
    label: 'Developing',
  },
  Complete: {
    bg: '#EBF5EE',
    border: 'rgba(65, 120, 86, 0.22)',
    text: '#2E5E40',
    label: 'Complete',
  },
};
