import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookMarked, RotateCcw, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { AssistanceTools } from './components/AssistanceTools';
import { GenreSelector } from './components/GenreSelector';
import { RecreatedStoryStudio } from './components/RecreatedStoryStudio';
import { ResponsePanel } from './components/ResponsePanel';
import { SavedSessionsPanel } from './components/SavedSessionsPanel';
import {
  ASSISTANCE_TOOLS,
  GENRE_THEMES,
  SAMPLE_PROMPTS,
} from './genreThemes';
import {
  generateStoryAssistance,
  mergeStoryWithSuggestions,
  reviseSuggestionWithChat,
} from './storyAssistantApi';
import {
  AssistantResponse,
  AssistantToolId,
  DialogueTone,
  GenreId,
  RecreatedStoryResult,
  RecreateFormat,
  SavedSession,
  StoryAssistantPageProps,
  StorySuggestion,
} from './types';

export function StoryAssistantPage({
  initialTitle = '',
  initialGenreId = 'calm',
  projectContext,
  embedded = false,
  initialStory = '',
  onDraftChange,
  onSaveSuggestion,
  storageKey = 'creative_platform_story_assistant_v2',
}: StoryAssistantPageProps) {
  const [genreId, setGenreId] = useState<GenreId>(initialGenreId);
  const [toolId, setToolId] = useState<AssistantToolId>('idea');

  const [storyTitle, setStoryTitle] = useState(initialTitle);
  const [storyText, setStoryText] = useState(initialStory);
  const [previousStorySnapshot, setPreviousStorySnapshot] = useState<
    string | null
  >(null);

  const [characterFocus, setCharacterFocus] = useState('');
  const [dialogueTone, setDialogueTone] =
    useState<DialogueTone>('Natural & Grounded');
  const [extraInstruction, setExtraInstruction] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [revisingId, setRevisingId] = useState<string | null>(null);
  const [response, setResponse] = useState<AssistantResponse | null>(null);

  const [generationRound, setGenerationRound] = useState(1);
  const [seenTitles, setSeenTitles] = useState<string[]>([]);
  const [rejectedTitles, setRejectedTitles] = useState<string[]>([]);

  const [savedSuggestions, setSavedSuggestions] = useState<StorySuggestion[]>([]);
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [editorNotice, setEditorNotice] = useState<string | null>(null);

  const [recreateFormat, setRecreateFormat] = useState<RecreateFormat>('prose');
  const [isMerging, setIsMerging] = useState(false);
  const [mergedResult, setMergedResult] =
    useState<RecreatedStoryResult | null>(null);

  const noticeTimerRef = useRef<number | null>(null);

  const activeTheme = GENRE_THEMES[genreId];
  const activeTool = useMemo(
    () => ASSISTANCE_TOOLS.find((t) => t.id === toolId) || ASSISTANCE_TOOLS[0],
    [toolId]
  );

  // Hydrate saved notes & sessions safely
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.savedSuggestions)) {
        setSavedSuggestions(parsed.savedSuggestions);
      }
      if (Array.isArray(parsed.sessions)) {
        setSessions(parsed.sessions);
      }
    } catch {
      // Ignore malformed storage
    }
  }, [storageKey]);

  const persistWorkspace = (
    nextSuggestions: StorySuggestion[],
    nextSessions: SavedSession[]
  ) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          savedSuggestions: nextSuggestions,
          sessions: nextSessions,
        })
      );
    } catch {
      // Ignore quota errors
    }
  };

  const showNotice = (msg: string) => {
    setEditorNotice(msg);
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = window.setTimeout(() => {
      setEditorNotice(null);
    }, 3800);
  };

  const handleStoryUpdate = (nextTitle: string, nextText: string) => {
    setStoryTitle(nextTitle);
    setStoryText(nextText);
    onDraftChange?.(nextTitle, nextText);
  };

  const wordCount = useMemo(() => {
    const trimmed = storyText.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [storyText]);

  const runGeneration = async (
    targetGenre: GenreId = genreId,
    targetTool: AssistantToolId = toolId,
    nextRound?: number,
    overrideText?: string,
    overrideTitle?: string
  ) => {
    const textToUse = overrideText ?? storyText;
    const titleToUse = overrideTitle ?? storyTitle;
    if (!textToUse.trim()) return;

    const roundToUse = nextRound ?? generationRound;
    setIsLoading(true);
    try {
      const result = await generateStoryAssistance(
        {
          action: 'generate_suggestions',
          title: titleToUse.trim() || 'Untitled Draft',
          storyText: textToUse,
          genreId: targetGenre,
          toolId: targetTool,
          characterFocus:
            targetTool === 'character' ? characterFocus : undefined,
          dialogueTone: targetTool === 'dialogue' ? dialogueTone : undefined,
          extraInstruction: extraInstruction.trim() || undefined,
          generationRound: roundToUse,
          seenTitles,
          rejectedTitles,
          projectContext,
        }
      );
      setResponse(result);
      setGenerationRound(roundToUse + 1);
      setSeenTitles((prev) => {
        const merged = new Set([
          ...prev,
          ...result.suggestions.map((s) => s.title),
        ]);
        return Array.from(merged).slice(-40);
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'The AI assistant could not respond.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectGenre = (nextGenre: GenreId) => {
    if (nextGenre === genreId) return;
    const prevSample = SAMPLE_PROMPTS[genreId];
    const nextSample = SAMPLE_PROMPTS[nextGenre];
    const nextTheme = GENRE_THEMES[nextGenre];

    let updatedTitle = storyTitle;
    let updatedText = storyText;

    // If an unmodified sample draft is currently open, swap to the new genre's sample too
    if (storyText === prevSample.text && storyTitle === prevSample.title) {
      updatedTitle = nextSample.title;
      updatedText = nextSample.text;
      handleStoryUpdate(updatedTitle, updatedText);
    }

    setGenreId(nextGenre);

    if (response && updatedText.trim()) {
      showNotice(
        `Story mood shifted to ${nextTheme.label} (${nextTheme.mood.moodTag}) — refreshing suggestions.`
      );
      void runGeneration(
        nextGenre,
        toolId,
        generationRound,
        updatedText,
        updatedTitle
      );
    } else {
      showNotice(
        `Story mood set to ${nextTheme.label}: ${nextTheme.mood.moodTag}.`
      );
    }
  };

  const handleLoadSample = () => {
    const sample = SAMPLE_PROMPTS[genreId];
    setPreviousStorySnapshot(storyText);
    handleStoryUpdate(sample.title, sample.text);
    showNotice(`Loaded a ${activeTheme.label} sample draft.`);
  };

  const handleAcceptSuggestion = (suggestion: StorySuggestion) => {
    setResponse((prev) =>
      prev
        ? {
            ...prev,
            suggestions: prev.suggestions.map((s) =>
              s.id === suggestion.id ? { ...s, status: 'accepted' } : s
            ),
          }
        : null
    );

    const acceptedItem: StorySuggestion = { ...suggestion, status: 'accepted' };
    const exists = savedSuggestions.some((s) => s.id === suggestion.id);
    const nextSaved = exists
      ? savedSuggestions.map((s) => (s.id === suggestion.id ? acceptedItem : s))
      : [acceptedItem, ...savedSuggestions];

    setSavedSuggestions(nextSaved);
    persistWorkspace(nextSaved, sessions);
    onSaveSuggestion?.(acceptedItem);
    showNotice(`Saved "${suggestion.title}" to Accepted Notes.`);
  };

  const handleInsertSnippet = (snippet: string, suggestionTitle: string) => {
    setPreviousStorySnapshot(storyText);
    const separator = storyText.trim().length > 0 ? '\n\n' : '';
    handleStoryUpdate(
      storyTitle,
      `${storyText.trimEnd()}${separator}${snippet}`
    );
    showNotice(
      `Appended snippet from "${suggestionTitle}". Click Undo Last Change to revert.`
    );
  };

  const handleUndoDraft = () => {
    if (previousStorySnapshot === null) return;
    handleStoryUpdate(storyTitle, previousStorySnapshot);
    setPreviousStorySnapshot(null);
    showNotice('Restored your previous draft.');
  };

  const handleRejectSuggestion = (suggestionId: string) => {
    const target = response?.suggestions.find((s) => s.id === suggestionId);
    if (target) {
      setRejectedTitles((prev) =>
        prev.includes(target.title) ? prev : [...prev, target.title]
      );
    }
    setResponse((prev) =>
      prev
        ? {
            ...prev,
            suggestions: prev.suggestions.map((s) =>
              s.id === suggestionId ? { ...s, status: 'rejected' } : s
            ),
          }
        : null
    );
  };

  const handleSubmitEditChat = async (
    suggestion: StorySuggestion,
    editInstruction: string
  ) => {
    setRevisingId(suggestion.id);
    try {
      const revised = await reviseSuggestionWithChat(
        {
          action: 'revise_suggestion',
          title: storyTitle.trim() || 'Untitled Draft',
          storyText,
          genreId,
          toolId,
          suggestion,
          editInstruction,
          projectContext,
        }
      );

      setResponse((prev) =>
        prev
          ? {
              ...prev,
              suggestions: prev.suggestions.map((s) =>
                s.id === suggestion.id ? revised.suggestion : s
              ),
            }
          : null
      );
      showNotice(`Rewrote "${suggestion.title}" using your feedback.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not revise that suggestion.');
    } finally {
      setRevisingId(null);
    }
  };

  const handleMergeStory = async () => {
    if (!storyText.trim() || savedSuggestions.length === 0) return;
    setIsMerging(true);
    try {
      const result = await mergeStoryWithSuggestions(
        {
          action: 'merge_story',
          title: storyTitle.trim() || 'Untitled Story',
          storyText,
          genreId,
          format: recreateFormat,
          acceptedSuggestions: savedSuggestions,
          projectContext,
        }
      );
      setMergedResult(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not recreate the story.');
    } finally {
      setIsMerging(false);
    }
  };

  const handleApplyMergedToDraft = (content: string) => {
    setPreviousStorySnapshot(storyText);
    handleStoryUpdate(storyTitle, content);
    showNotice(
      'Applied recreated draft to your editor. Click Undo Last Change anytime to restore your original.'
    );
  };

  const handleSaveSession = () => {
    if (!storyText.trim()) return;
    const newSession: SavedSession = {
      id: `sess_${Date.now().toString(36)}`,
      title: storyTitle.trim() || 'Untitled Draft',
      genreId,
      toolId,
      storyExcerpt: storyText.trim().slice(0, 160),
      fullStory: storyText,
      acceptedSuggestions: savedSuggestions.slice(0, 8),
      updatedAt: new Date().toISOString(),
    };
    const nextSessions = [newSession, ...sessions].slice(0, 12);
    setSessions(nextSessions);
    persistWorkspace(savedSuggestions, nextSessions);
    showNotice(`Saved session "${newSession.title}".`);
  };

  const handleRestoreSession = (session: SavedSession) => {
    setPreviousStorySnapshot(storyText);
    setGenreId(session.genreId);
    setToolId(session.toolId);
    handleStoryUpdate(session.title, session.fullStory);
    showNotice(`Loaded session "${session.title}".`);
  };

  const handleDeleteSession = (id: string) => {
    const nextSessions = sessions.filter((s) => s.id !== id);
    setSessions(nextSessions);
    persistWorkspace(savedSuggestions, nextSessions);
  };

  const handleRemoveSavedSuggestion = (id: string) => {
    const nextSaved = savedSuggestions.filter((s) => s.id !== id);
    setSavedSuggestions(nextSaved);
    persistWorkspace(nextSaved, sessions);
  };

  const activeModeLabel = projectContext ? 'Live AI · using this project\'s context' : 'Live AI creative partner';

  return (
    <div
      className={`relative ${embedded ? 'rounded-3xl' : 'min-h-screen rounded-[2rem]'} bg-white text-slate-900 overflow-hidden transition-colors duration-500`}
      style={activeTheme.cssVars as React.CSSProperties}
    >
      {/* Gentle frosted-glass pastel ambient wash & animated orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div
          className="absolute inset-0 transition-all duration-700"
          style={{
            background:
              'linear-gradient(180deg, var(--sa-tint) 0%, rgba(255,255,255,0.94) 38%, #ffffff 100%)',
          }}
        />
        <motion.div
          animate={{ x: [0, 18, 0], y: [0, 14, 0], scale: [1, 1.04, 1] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-28 -right-20 w-[440px] h-[440px] rounded-full blur-[75px] opacity-75 transition-colors duration-700"
          style={{ backgroundColor: 'var(--sa-orb-1)' }}
        />
        <motion.div
          animate={{ x: [0, -14, 0], y: [0, 18, 0], scale: [1, 1.03, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-56 -left-32 w-[380px] h-[380px] rounded-full blur-[75px] opacity-70 transition-colors duration-700"
          style={{ backgroundColor: 'var(--sa-orb-2)' }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        {/* 1. Editorial Header */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div
              className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide mb-2"
              style={{ color: 'var(--sa-accent-text)' }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Creative Writing Studio</span>
            </div>
            <h1
              className="font-display text-4xl sm:text-5xl font-normal tracking-tight text-slate-900"
              style={{ textWrap: 'balance' }}
            >
              AI Story Assistant
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
              Your creative partner for developing ideas, deepening characters, tightening plot, and weaving accepted suggestions into a full story or script—while keeping every word in your hands.
            </p>
          </div>

          <div
            className="rounded-xl border bg-white/90 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-600 shrink-0"
            style={{
              borderColor: 'var(--sa-border)',
              boxShadow: '0 2px 10px rgba(24, 32, 48, 0.04)',
            }}
          >
            {activeModeLabel}
          </div>
        </header>

        {/* 2. Genre & Story Mood Selector */}
        <GenreSelector
          selectedGenre={genreId}
          onSelectGenre={handleSelectGenre}
        />

        {/* 3. Main Editor + AI Creative Partner Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section
            aria-label="Story draft editor"
            className="lg:col-span-7 rounded-2xl border bg-white/90 backdrop-blur-md p-5 sm:p-6 flex flex-col gap-3.5 transition-colors duration-500"
            style={{
              borderColor: 'var(--sa-border)',
              boxShadow: '0 10px 30px rgba(24, 32, 48, 0.05)',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2
                className="text-base font-semibold tracking-tight text-slate-900"
                
              >
                2. Your Story Draft
              </h2>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="px-3 py-1.5 rounded-lg border bg-white text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap"
                  style={{ borderColor: 'var(--sa-border)' }}
                >
                  Try Sample Draft
                </button>

                {previousStorySnapshot !== null && (
                  <button
                    type="button"
                    onClick={handleUndoDraft}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border bg-white text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap"
                    style={{ borderColor: 'var(--sa-border)' }}
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Undo Last Change</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveSession}
                  disabled={!storyText.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  style={{
                    backgroundColor: 'var(--sa-accent-soft)',
                    color: 'var(--sa-accent-text)',
                    borderColor: 'var(--sa-border)',
                  }}
                >
                  <BookMarked className="w-3.5 h-3.5" />
                  <span>Save Session</span>
                </button>
              </div>
            </div>

            {editorNotice && (
              <div
                role="status"
                className="rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium"
                style={{
                  backgroundColor: 'var(--sa-accent-soft)',
                  color: 'var(--sa-accent-text)',
                }}
              >
                {editorNotice}
              </div>
            )}

            <input
              type="text"
              aria-label="Story title"
              value={storyTitle}
              onChange={(e) => handleStoryUpdate(e.target.value, storyText)}
              placeholder="Working title (optional)..."
              className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-base font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus-visible:outline-none transition-colors"
              style={{ borderColor: 'var(--sa-border)' }}
            />

            <textarea
              aria-label="Story idea or draft text"
              value={storyText}
              onChange={(e) => handleStoryUpdate(storyTitle, e.target.value)}
              placeholder={activeTool.placeholderHint}
              className="w-full min-h-[320px] px-4 py-3.5 rounded-xl border text-sm sm:text-base text-slate-800 placeholder:text-slate-400 leading-relaxed resize-y focus-visible:outline-none transition-colors"
              style={{
                borderColor: 'var(--sa-border)',
                background:
                  'linear-gradient(180deg, #ffffff 0%, var(--sa-tint-secondary) 100%)',
              }}
            />

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 tabular-nums">
              <div className="flex items-center gap-3">
                <span>{wordCount} words</span>
                <span aria-hidden="true">·</span>
                <span>{storyText.length} characters</span>
              </div>
              <span>
                Mood:{' '}
                <strong style={{ color: 'var(--sa-accent-text)' }}>
                  {activeTheme.label} ({activeTheme.mood.moodTag})
                </strong>
              </span>
            </div>
          </section>

          <div className="lg:col-span-5">
            <AssistanceTools
              selectedTool={toolId}
              onSelectTool={setToolId}
              characterFocus={characterFocus}
              onCharacterFocusChange={setCharacterFocus}
              dialogueTone={dialogueTone}
              onDialogueToneChange={setDialogueTone}
              extraInstruction={extraInstruction}
              onExtraInstructionChange={setExtraInstruction}
              onGenerate={() =>
                void runGeneration(genreId, toolId, generationRound)
              }
              isLoading={isLoading}
              canGenerate={storyText.trim().length > 0}
            />
          </div>
        </div>

        {/* 4. AI Response Panel */}
        <ResponsePanel
          response={response}
          isLoading={isLoading}
          revisingId={revisingId}
          rejectedCount={rejectedTitles.length}
          onAccept={handleAcceptSuggestion}
          onInsertSnippet={handleInsertSnippet}
          onReject={handleRejectSuggestion}
          onSubmitEditChat={handleSubmitEditChat}
          onRegenerate={() =>
            void runGeneration(genreId, toolId, generationRound)
          }
        />

        {/* 5. Saved Suggestions & Previous Sessions */}
        <SavedSessionsPanel
          savedSuggestions={savedSuggestions}
          sessions={sessions}
          onRemoveSuggestion={handleRemoveSavedSuggestion}
          onRestoreSession={handleRestoreSession}
          onDeleteSession={handleDeleteSession}
        />

        {/* 6. Recreated Story / Script Reader */}
        <RecreatedStoryStudio
          genreId={genreId}
          storyText={storyText}
          savedSuggestions={savedSuggestions}
          format={recreateFormat}
          onFormatChange={setRecreateFormat}
          isMerging={isMerging}
          mergedResult={mergedResult}
          onMerge={() => void handleMergeStory()}
          onApplyToDraft={handleApplyMergedToDraft}
        />
      </div>
    </div>
  );
}

export default StoryAssistantPage;
