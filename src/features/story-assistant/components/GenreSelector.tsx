import React from 'react';
import { GENRE_LIST, GENRE_THEMES } from '../genreThemes';
import { GenreId } from '../types';

interface GenreSelectorProps {
  selectedGenre: GenreId;
  onSelectGenre: (genreId: GenreId) => void;
}

export function GenreSelector({
  selectedGenre,
  onSelectGenre,
}: GenreSelectorProps) {
  const activeTheme = GENRE_THEMES[selectedGenre];

  return (
    <section
      aria-label="Story mood and genre selector"
      className="rounded-2xl border p-5 sm:p-6 transition-colors duration-500 backdrop-blur-md"
      style={{
        borderColor: 'var(--sa-border)',
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.94) 0%, var(--sa-surface-glass) 100%)',
        boxShadow: '0 10px 30px rgba(24, 32, 48, 0.05)',
      }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <h2
          className="text-base font-semibold tracking-tight text-slate-900"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          1. Story Mood &amp; Genre
        </h2>
        <span className="text-xs sm:text-sm text-slate-600">
          Shifts the studio palette and reshapes the story’s mood, conflict lens, and AI guidance
        </span>
      </div>

      <div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5"
        role="radiogroup"
        aria-label="Story genres"
      >
        {GENRE_LIST.map((genre) => {
          const isActive = genre.id === selectedGenre;
          return (
            <button
              key={genre.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onSelectGenre(genre.id)}
              className="group flex items-center gap-3 w-full text-left px-3.5 py-3 rounded-xl border transition-all duration-200 cursor-pointer focus-visible:outline-none"
              style={{
                backgroundColor: isActive ? 'var(--sa-tint)' : '#ffffff',
                borderColor: isActive ? 'var(--sa-accent)' : 'var(--sa-border)',
                boxShadow: isActive
                  ? '0 4px 14px var(--sa-focus-ring)'
                  : '0 1px 4px rgba(15,23,42,0.03)',
              }}
            >
              <span
                className="shrink-0 w-6 h-6 rounded-full border border-black/10 transition-transform duration-200 group-hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${genre.swatchPrimary}, ${genre.swatchSecondary})`,
                }}
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900 truncate">
                  {genre.label}
                </span>
                <span className="block text-xs text-slate-500 truncate">
                  {genre.subtitle}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Live Story Mood Profile — proves genre actively directs writing mood */}
      <div
        className="mt-4 rounded-xl border bg-white/90 px-4 py-3 text-xs sm:text-sm text-slate-600 flex flex-wrap gap-x-5 gap-y-1.5 transition-colors duration-300"
        style={{ borderColor: 'var(--sa-border)' }}
      >
        <span>
          <strong style={{ color: 'var(--sa-accent-text)' }}>Active Mood:</strong>{' '}
          {activeTheme.mood.moodTag}
        </span>
        <span aria-hidden="true" className="text-slate-300 hidden sm:inline">
          ·
        </span>
        <span>
          <strong style={{ color: 'var(--sa-accent-text)' }}>Atmosphere:</strong>{' '}
          {activeTheme.mood.atmosphere}
        </span>
        <span aria-hidden="true" className="text-slate-300 hidden sm:inline">
          ·
        </span>
        <span>
          <strong style={{ color: 'var(--sa-accent-text)' }}>Conflict Lens:</strong>{' '}
          {activeTheme.mood.conflictLens}
        </span>
      </div>
    </section>
  );
}
