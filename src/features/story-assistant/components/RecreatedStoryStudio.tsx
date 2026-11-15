import React, { useState } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  Download,
  FileText,
  Film,
  Loader2,
  Wand2,
} from 'lucide-react';
import { GENRE_THEMES } from '../genreThemes';
import {
  GenreId,
  RecreatedStoryResult,
  RecreateFormat,
  StorySuggestion,
} from '../types';

interface RecreatedStoryStudioProps {
  genreId: GenreId;
  storyText: string;
  savedSuggestions: StorySuggestion[];
  format: RecreateFormat;
  onFormatChange: (fmt: RecreateFormat) => void;
  isMerging: boolean;
  mergedResult: RecreatedStoryResult | null;
  onMerge: () => void;
  onApplyToDraft: (content: string) => void;
}

export function RecreatedStoryStudio({
  genreId,
  storyText,
  savedSuggestions,
  format,
  onFormatChange,
  isMerging,
  mergedResult,
  onMerge,
  onApplyToDraft,
}: RecreatedStoryStudioProps) {
  const [copied, setCopied] = useState(false);

  const canMerge =
    storyText.trim().length > 0 && savedSuggestions.length > 0 && !isMerging;
  const theme = GENRE_THEMES[genreId];

  const handleCopy = async () => {
    if (!mergedResult) return;
    try {
      await navigator.clipboard.writeText(mergedResult.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked in restricted frame
    }
  };

  const handleDownload = () => {
    if (!mergedResult) return;
    const blob = new Blob([mergedResult.content], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = (mergedResult.title || 'story')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    link.href = url;
    link.download = `${safeName}-${mergedResult.format}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      aria-label="Recreated story and script reader"
      className="rounded-2xl border p-5 sm:p-6 transition-colors duration-500 backdrop-blur-md"
      style={{
        borderColor: 'var(--sa-border)',
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, var(--sa-surface-glass) 100%)',
        boxShadow: '0 10px 30px rgba(24, 32, 48, 0.05)',
      }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <div>
          <h2
            className="text-base font-semibold tracking-tight text-slate-900 flex items-center gap-2"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            <BookOpen className="w-4 h-4" style={{ color: 'var(--sa-accent)' }} />
            <span>6. Recreated Story / Script Reader</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Merges your original plot, active {theme.label} mood, and all accepted suggestions into a cohesive piece to read
          </p>
        </div>
      </div>

      <div
        className="rounded-xl border bg-white p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 mb-4"
        style={{ borderColor: 'var(--sa-border)' }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-600">Output Format</span>
          <div
            className="inline-flex items-center p-1 rounded-lg border"
            style={{
              backgroundColor: 'var(--sa-tint-secondary)',
              borderColor: 'var(--sa-border)',
            }}
          >
            <button
              type="button"
              onClick={() => onFormatChange('prose')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: format === 'prose' ? '#ffffff' : 'transparent',
                color:
                  format === 'prose'
                    ? 'var(--sa-accent-text)'
                    : '#475569',
                boxShadow:
                  format === 'prose' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Story Prose</span>
            </button>
            <button
              type="button"
              onClick={() => onFormatChange('script')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: format === 'script' ? '#ffffff' : 'transparent',
                color:
                  format === 'script'
                    ? 'var(--sa-accent-text)'
                    : '#475569',
                boxShadow:
                  format === 'script' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Script / Screenplay</span>
            </button>
          </div>

          <span className="text-xs text-slate-500">
            {savedSuggestions.length === 0
              ? 'Accept at least 1 suggestion above to enable merging'
              : `Ready to weave ${savedSuggestions.length} accepted note(s) into your plot`}
          </span>
        </div>

        <button
          type="button"
          onClick={onMerge}
          disabled={!canMerge}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
          style={{
            backgroundColor: 'var(--sa-accent)',
            boxShadow: canMerge ? '0 5px 14px var(--sa-focus-ring)' : 'none',
          }}
        >
          {isMerging ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
          <span>
            {isMerging ? 'Weaving your manuscript...' : 'Merge & Recreate Draft'}
          </span>
        </button>
      </div>

      {isMerging && (
        <div
          className="rounded-2xl border bg-white p-6 space-y-3"
          style={{ borderColor: 'var(--sa-border)' }}
        >
          <div
            className="text-sm font-medium flex items-center gap-2"
            style={{ color: 'var(--sa-accent-text)' }}
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>
              Blending your original plot with {savedSuggestions.length} accepted suggestion(s) in {theme.label} mood...
            </span>
          </div>
          <div className="h-32 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--sa-tint)' }} />
        </div>
      )}

      {!isMerging && mergedResult && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-slate-600 flex flex-wrap items-center gap-1.5">
              <span className="font-semibold" style={{ color: 'var(--sa-accent-text)' }}>
                {mergedResult.format === 'script'
                  ? 'Screenplay Draft'
                  : 'Prose Story Draft'}
              </span>
              <span aria-hidden="true">·</span>
              <span>{GENRE_THEMES[mergedResult.genreId].label}</span>
              <span aria-hidden="true">·</span>
              <span>
                {mergedResult.incorporatedTitles.length} suggestion(s) woven in
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {mergedResult.mode === 'demo' ? 'Demonstration Mode' : 'Live Gemini AI'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-white text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer whitespace-nowrap"
                style={{ borderColor: 'var(--sa-border)' }}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-white text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer whitespace-nowrap"
                style={{ borderColor: 'var(--sa-border)' }}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .txt</span>
              </button>

              <button
                type="button"
                onClick={() => onApplyToDraft(mergedResult.content)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer whitespace-nowrap"
                style={{
                  backgroundColor: 'var(--sa-accent-soft)',
                  color: 'var(--sa-accent-text)',
                  borderColor: 'var(--sa-border)',
                }}
              >
                <span>Use as My Draft (Undo-safe)</span>
              </button>
            </div>
          </div>

          <div
            className="rounded-2xl border bg-white p-5 sm:p-7 whitespace-pre-wrap text-slate-800 leading-relaxed"
            style={{
              borderColor: 'var(--sa-border)',
              boxShadow: '0 2px 10px rgba(24, 32, 48, 0.03)',
              fontFamily:
                mergedResult.format === 'script'
                  ? "'JetBrains Mono', ui-monospace, monospace"
                  : "'Plus Jakarta Sans', sans-serif",
              fontSize: mergedResult.format === 'script' ? '0.88rem' : '0.98rem',
            }}
          >
            {mergedResult.content}
          </div>
        </div>
      )}
    </section>
  );
}
