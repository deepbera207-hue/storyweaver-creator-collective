import React from 'react';
import { Trash2 } from 'lucide-react';
import { GENRE_THEMES } from '../genreThemes';
import { SavedSession, StorySuggestion } from '../types';

interface SavedSessionsPanelProps {
  savedSuggestions: StorySuggestion[];
  sessions: SavedSession[];
  onRemoveSuggestion: (id: string) => void;
  onRestoreSession: (session: SavedSession) => void;
  onDeleteSession: (id: string) => void;
}

export function SavedSessionsPanel({
  savedSuggestions,
  sessions,
  onRemoveSuggestion,
  onRestoreSession,
  onDeleteSession,
}: SavedSessionsPanelProps) {
  return (
    <section
      aria-label="Saved suggestions and previous sessions"
      className="rounded-2xl border bg-white/90 backdrop-blur-md p-5 sm:p-6 transition-colors duration-500"
      style={{
        borderColor: 'var(--sa-border)',
        boxShadow: '0 10px 30px rgba(24, 32, 48, 0.05)',
      }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <h2
          className="text-base font-semibold tracking-tight text-slate-900"
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        >
          5. Saved Suggestions &amp; Previous Sessions
        </h2>
        <span className="text-xs sm:text-sm text-slate-500">
          Accepted ideas stay here and feed into the Recreated Story / Script Studio below
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3 tabular-nums">
            Accepted Notes ({savedSuggestions.length})
          </h3>
          {savedSuggestions.length === 0 ? (
            <p className="text-sm text-slate-500">
              Click <strong>Accept</strong> on any suggestion above to keep it here and weave it into your recreated story.
            </p>
          ) : (
            <div className="space-y-2.5">
              {savedSuggestions.map((note) => (
                <div
                  key={note.id}
                  className="rounded-xl border bg-white p-3.5 space-y-1.5"
                  style={{ borderColor: 'var(--sa-border)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div
                        className="text-xs font-medium"
                        style={{ color: 'var(--sa-accent-text)' }}
                      >
                        {note.category}
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {note.title}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveSuggestion(note.id)}
                      aria-label={`Remove ${note.title}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border bg-white text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer whitespace-nowrap shrink-0"
                      style={{ borderColor: 'var(--sa-border)' }}
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {note.guidance}
                  </p>
                  {note.draftSnippet && (
                    <div
                      className="mt-2 rounded-lg border p-2.5 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap"
                      style={{
                        borderColor: 'var(--sa-border)',
                        backgroundColor: 'var(--sa-tint-secondary)',
                      }}
                    >
                      {note.draftSnippet}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3 tabular-nums">
            Saved Sessions ({sessions.length})
          </h3>
          {sessions.length === 0 ? (
            <p className="text-sm text-slate-500">
              Click <strong>Save Session</strong> in your story editor to bookmark a draft snapshot.
            </p>
          ) : (
            <div className="space-y-2.5">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-xl border bg-white p-3.5 space-y-2"
                  style={{ borderColor: 'var(--sa-border)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {session.title}
                      </p>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <span>
                          {GENRE_THEMES[session.genreId]?.label || session.genreId}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {new Date(session.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onRestoreSession(session)}
                        className="px-3 py-1 rounded-lg border text-xs font-semibold cursor-pointer whitespace-nowrap"
                        style={{
                          backgroundColor: 'var(--sa-accent-soft)',
                          color: 'var(--sa-accent-text)',
                          borderColor: 'var(--sa-border)',
                        }}
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteSession(session.id)}
                        className="px-2.5 py-1 rounded-lg border bg-white text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer whitespace-nowrap"
                        style={{ borderColor: 'var(--sa-border)' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">
                    {session.storyExcerpt}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
