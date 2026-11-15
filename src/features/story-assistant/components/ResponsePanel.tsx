import React, { useState } from 'react';
import {
  Check,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Send,
  X,
} from 'lucide-react';
import { AssistantResponse, StorySuggestion } from '../types';

interface ResponsePanelProps {
  response: AssistantResponse | null;
  isLoading: boolean;
  revisingId: string | null;
  rejectedCount: number;
  onAccept: (suggestion: StorySuggestion) => void;
  onInsertSnippet: (snippet: string, suggestionTitle: string) => void;
  onReject: (suggestionId: string) => void;
  onSubmitEditChat: (suggestion: StorySuggestion, editInstruction: string) => Promise<void>;
  onRegenerate: () => void;
}

const QUICK_EDIT_PROMPTS = [
  'Make it more subtle',
  'Raise emotional stakes',
  'Focus on dialogue',
  'Shorter & punchier',
];

export function ResponsePanel({
  response,
  isLoading,
  revisingId,
  rejectedCount,
  onAccept,
  onInsertSnippet,
  onReject,
  onSubmitEditChat,
  onRegenerate,
}: ResponsePanelProps) {
  const [activeEditId, setActiveEditId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');

  const openEditChat = (suggestion: StorySuggestion) => {
    setActiveEditId(suggestion.id);
    setEditPrompt('');
  };

  const closeEditChat = () => {
    setActiveEditId(null);
    setEditPrompt('');
  };

  const handleEditSubmit = async (
    e: React.FormEvent,
    suggestion: StorySuggestion
  ) => {
    e.preventDefault();
    const trimmed = editPrompt.trim();
    if (!trimmed) return;
    await onSubmitEditChat(suggestion, trimmed);
    setActiveEditId(null);
    setEditPrompt('');
  };

  const visibleSuggestions =
    response?.suggestions.filter((s) => s.status !== 'rejected') || [];

  return (
    <section
      aria-live="polite"
      aria-label="Creative suggestions panel"
      className="rounded-2xl border p-5 sm:p-6 transition-colors duration-500 backdrop-blur-md"
      style={{
        borderColor: 'var(--sa-border)',
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, var(--sa-tint-secondary) 100%)',
        boxShadow: '0 10px 30px rgba(24, 32, 48, 0.05)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2
            className="text-base font-semibold tracking-tight text-slate-900"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            4. Creative Suggestions
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Your draft stays untouched · Accept, refine via chat, reject, or regenerate brand-new ideas anytime
          </p>
        </div>

        {response && !isLoading && (
          <button
            type="button"
            onClick={onRegenerate}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none"
            style={{
              backgroundColor: 'var(--sa-accent-soft)',
              color: 'var(--sa-accent-text)',
              borderColor: 'var(--sa-border)',
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate Fresh Ideas</span>
          </button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-4 py-2">
          <div
            className="flex items-center gap-2.5 text-sm font-medium"
            style={{ color: 'var(--sa-accent-text)' }}
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Reading your story mood and crafting fresh suggestions...</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="h-36 rounded-2xl border animate-pulse"
                style={{
                  borderColor: 'var(--sa-border)',
                  background:
                    'linear-gradient(90deg, #ffffff 15%, var(--sa-tint) 50%, #ffffff 85%)',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {!isLoading && !response && (
        <div className="py-8 text-center text-sm text-slate-500">
          Write or load a sample draft above, choose your genre mood and assistant tool, then generate suggestions.
        </div>
      )}

      {!isLoading && response && (
        <>
          {response.mode === 'demo' && (
            <div
              className="mb-4 rounded-xl border px-4 py-2.5 text-xs sm:text-sm flex flex-wrap items-center justify-between gap-2"
              style={{
                backgroundColor: 'var(--sa-tint)',
                borderColor: 'var(--sa-border-strong)',
                color: 'var(--sa-accent-text)',
              }}
            >
              <span>
                <strong>Demonstration Mode:</strong> Context-aware sample suggestions are active because a live Gemini API key is not currently configured on the server.
              </span>
              <span className="text-xs opacity-80 tabular-nums">
                Batch #{response.round}
                {rejectedCount > 0 ? ` · ${rejectedCount} rejected excluded` : ''}
              </span>
            </div>
          )}

          {response.mode === 'live' && (
            <div className="mb-3 text-xs text-slate-500 flex items-center gap-2 tabular-nums">
              <span>Live Gemini AI</span>
              <span aria-hidden="true">·</span>
              <span>Batch #{response.round}</span>
              {rejectedCount > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{rejectedCount} rejected idea(s) permanently excluded</span>
                </>
              )}
            </div>
          )}

          <p
            className="mb-4 rounded-xl border bg-white px-4 py-3 text-sm text-slate-700"
            style={{ borderColor: 'var(--sa-border)' }}
          >
            {response.summary}
          </p>

          {visibleSuggestions.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-600">
              All suggestions in this batch were rejected. Click{' '}
              <strong>Regenerate Fresh Ideas</strong> for completely new directions.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleSuggestions.map((item) => {
                const isEditing = activeEditId === item.id;
                const isRevising = revisingId === item.id;
                const isAccepted = item.status === 'accepted';

                return (
                  <article
                    key={item.id}
                    className="flex flex-col justify-between gap-3.5 rounded-2xl border p-4 sm:p-5 transition-all duration-200"
                    style={{
                      borderColor: isAccepted
                        ? 'var(--sa-accent)'
                        : 'var(--sa-border)',
                      background: isAccepted
                        ? 'linear-gradient(180deg, #ffffff 0%, var(--sa-tint) 100%)'
                        : '#ffffff',
                      boxShadow: '0 2px 10px rgba(24, 32, 48, 0.035)',
                    }}
                  >
                    <div>
                      {/* Clean unboxed metadata per design constitution */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: 'var(--sa-accent-text)' }}>
                        <span>{item.category}</span>
                        {item.edited && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Refined by you</span>
                          </>
                        )}
                      </div>

                      <h3 className="text-base font-semibold text-slate-900 mb-1.5">
                        {item.title}
                      </h3>

                      {isRevising ? (
                        <div
                          className="my-3 rounded-xl border p-3.5 flex items-center gap-2.5 text-sm"
                          style={{
                            borderColor: 'var(--sa-border)',
                            backgroundColor: 'var(--sa-tint)',
                            color: 'var(--sa-accent-text)',
                          }}
                        >
                          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                          <span>Rewriting suggestion based on your feedback...</span>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {item.guidance}
                          </p>

                          {item.draftSnippet && (
                            <div
                              className="mt-3 rounded-xl border p-3 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed"
                              style={{
                                borderColor: 'var(--sa-border)',
                                backgroundColor: 'var(--sa-tint-secondary)',
                              }}
                            >
                              {item.draftSnippet}
                            </div>
                          )}

                          {item.lastEditPrompt && (
                            <p className="mt-2.5 text-xs text-slate-500">
                              Updated from request: “{item.lastEditPrompt}”
                            </p>
                          )}
                        </>
                      )}

                      {/* Conversational Edit Chat inside card */}
                      {isEditing && !isRevising && (
                        <form
                          onSubmit={(e) => handleEditSubmit(e, item)}
                          className="mt-3.5 rounded-xl border p-3.5 space-y-2.5"
                          style={{
                            borderColor: 'var(--sa-border-strong)',
                            backgroundColor: 'var(--sa-tint)',
                          }}
                        >
                          <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-800 bg-white rounded-lg border px-3 py-2" style={{ borderColor: 'var(--sa-border)' }}>
                            <MessageSquareText
                              className="w-4 h-4 shrink-0 mt-0.5"
                              style={{ color: 'var(--sa-accent)' }}
                            />
                            <span>
                              <strong>What would you like to edit or change</strong> in “{item.title}”?
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {QUICK_EDIT_PROMPTS.map((chip) => (
                              <button
                                key={chip}
                                type="button"
                                onClick={() => setEditPrompt(chip)}
                                className="px-2.5 py-1 rounded-lg border bg-white text-xs font-medium transition-colors cursor-pointer hover:bg-slate-50"
                                style={{
                                  borderColor: 'var(--sa-border-strong)',
                                  color: 'var(--sa-accent-text)',
                                }}
                              >
                                {chip}
                              </button>
                            ))}
                          </div>

                          <textarea
                            rows={2}
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            placeholder="Explain what to change (e.g., 'Make the confrontation quieter and set it in rain')..."
                            className="w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none resize-none"
                            style={{ borderColor: 'var(--sa-border-strong)' }}
                          />

                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={closeEditChat}
                              className="px-3 py-1.5 rounded-lg border bg-white text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer whitespace-nowrap"
                              style={{ borderColor: 'var(--sa-border)' }}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={!editPrompt.trim()}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                              style={{ backgroundColor: 'var(--sa-accent)' }}
                            >
                              <Send className="w-3 h-3" />
                              <span>Submit Edit</span>
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    {!isEditing && !isRevising && (
                      <div
                        className="flex flex-wrap items-center gap-2 pt-3 border-t"
                        style={{ borderColor: 'var(--sa-tint)' }}
                      >
                        {isAccepted ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-semibold mr-1"
                            style={{ color: 'var(--sa-accent-text)' }}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accepted &amp; Saved</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onAccept(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap"
                            style={{
                              backgroundColor: 'var(--sa-accent-soft)',
                              color: 'var(--sa-accent-text)',
                              borderColor: 'var(--sa-border)',
                            }}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                        )}

                        {item.draftSnippet && (
                          <button
                            type="button"
                            onClick={() =>
                              onInsertSnippet(item.draftSnippet!, item.title)
                            }
                            className="px-3 py-1.5 rounded-lg border bg-white text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap"
                            style={{ borderColor: 'var(--sa-border)' }}
                          >
                            Append to Draft
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => openEditChat(item)}
                          className="px-3 py-1.5 rounded-lg border bg-white text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap"
                          style={{ borderColor: 'var(--sa-border)' }}
                        >
                          Edit
                        </button>

                        {!isAccepted && (
                          <button
                            type="button"
                            onClick={() => onReject(item.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border bg-white text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                            style={{ borderColor: 'var(--sa-border)' }}
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
