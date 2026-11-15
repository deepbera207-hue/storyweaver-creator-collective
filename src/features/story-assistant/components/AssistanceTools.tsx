import React from 'react';
import {
  Lightbulb,
  MessageSquareQuote,
  LayoutList,
  Globe2,
  Clapperboard,
  ShieldCheck,
  Wand2,
  GitBranch,
  PenLine,
  Sparkles,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import { ASSISTANCE_TOOLS, DIALOGUE_TONES } from '../genreThemes';
import { AssistantToolId, DialogueTone } from '../types';

interface AssistanceToolsProps {
  selectedTool: AssistantToolId;
  onSelectTool: (toolId: AssistantToolId) => void;
  characterFocus: string;
  onCharacterFocusChange: (value: string) => void;
  dialogueTone: DialogueTone;
  onDialogueToneChange: (tone: DialogueTone) => void;
  extraInstruction: string;
  onExtraInstructionChange: (value: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  canGenerate: boolean;
}

function ToolGlyph({ toolId }: { toolId: AssistantToolId }) {
  switch (toolId) {
    case 'idea':
      return <Lightbulb className="w-4 h-4" />;
    case 'character':
      return <UserRound className="w-4 h-4" />;
    case 'plot':
      return <TrendingUp className="w-4 h-4" />;
    case 'dialogue':
      return <MessageSquareQuote className="w-4 h-4" />;
    case 'structure':
      return <LayoutList className="w-4 h-4" />;
    case 'worldbuilding':
      return <Globe2 className="w-4 h-4" />;
    case 'scene':
      return <Clapperboard className="w-4 h-4" />;
    case 'consistency':
      return <ShieldCheck className="w-4 h-4" />;
    case 'block':
      return <Wand2 className="w-4 h-4" />;
    case 'alternatives':
      return <GitBranch className="w-4 h-4" />;
    case 'feedback':
    default:
      return <PenLine className="w-4 h-4" />;
  }
}

export function AssistanceTools({
  selectedTool,
  onSelectTool,
  characterFocus,
  onCharacterFocusChange,
  dialogueTone,
  onDialogueToneChange,
  extraInstruction,
  onExtraInstructionChange,
  onGenerate,
  isLoading,
  canGenerate,
}: AssistanceToolsProps) {
  const activeTool =
    ASSISTANCE_TOOLS.find((t) => t.id === selectedTool) || ASSISTANCE_TOOLS[0];

  return (
    <aside
      aria-label="AI creative partner tools"
      className="rounded-2xl border bg-white/90 backdrop-blur-md p-5 sm:p-6 flex flex-col gap-4 transition-colors duration-500"
      style={{
        borderColor: 'var(--sa-border)',
        boxShadow: '0 10px 30px rgba(24, 32, 48, 0.05)',
      }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2
          className="text-base font-semibold tracking-tight text-slate-900"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          3. AI Creative Partner
        </h2>
        <span className="text-xs text-slate-500">Choose one focus</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[460px] overflow-y-auto pr-1">
        {ASSISTANCE_TOOLS.map((tool) => {
          const isActive = tool.id === selectedTool;
          return (
            <button
              key={tool.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelectTool(tool.id)}
              className="flex items-start gap-3 w-full text-left px-3.5 py-3 rounded-xl border transition-all duration-200 cursor-pointer focus-visible:outline-none hover:-translate-y-0.5"
              style={{
                borderColor: isActive ? 'var(--sa-accent)' : 'var(--sa-border)',
                background: isActive
                  ? 'linear-gradient(135deg, var(--sa-tint) 0%, #ffffff 100%)'
                  : '#ffffff',
              }}
            >
              <span
                className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-300"
                style={{
                  backgroundColor: 'var(--sa-accent-soft)',
                  color: 'var(--sa-accent-text)',
                }}
              >
                <ToolGlyph toolId={tool.id} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900">
                  {tool.title}
                </span>
                <span className="block text-xs text-slate-600 leading-relaxed mt-0.5">
                  {tool.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="pt-3 border-t border-dashed flex flex-col gap-3"
        style={{ borderColor: 'var(--sa-border)' }}
      >
        {selectedTool === 'character' && (
          <div>
            <label
              htmlFor="sa-character-focus"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Character to Focus On (optional)
            </label>
            <input
              id="sa-character-focus"
              type="text"
              value={characterFocus}
              onChange={(e) => onCharacterFocusChange(e.target.value)}
              placeholder="e.g., Clara — careful, guarded, loyal"
              className="w-full px-3 py-2 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus-visible:outline-none transition-colors"
              style={{ borderColor: 'var(--sa-border)' }}
            />
          </div>
        )}

        {selectedTool === 'dialogue' && (
          <div>
            <label
              htmlFor="sa-dialogue-tone"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Emotional Tone for Dialogue
            </label>
            <select
              id="sa-dialogue-tone"
              value={dialogueTone}
              onChange={(e) =>
                onDialogueToneChange(e.target.value as DialogueTone)
              }
              className="w-full px-3 py-2 text-sm rounded-xl border bg-white text-slate-900 focus-visible:outline-none transition-colors"
              style={{ borderColor: 'var(--sa-border)' }}
            >
              {DIALOGUE_TONES.map((tone) => (
                <option key={tone} value={tone}>
                  {tone}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label
            htmlFor="sa-extra-note"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            Specific Question for Your Assistant (optional)
          </label>
          <input
            id="sa-extra-note"
            type="text"
            value={extraInstruction}
            onChange={(e) => onExtraInstructionChange(e.target.value)}
            placeholder="e.g., Does the turning point feel earned?"
            className="w-full px-3 py-2 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus-visible:outline-none transition-colors"
            style={{ borderColor: 'var(--sa-border)' }}
          />
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate || isLoading}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap focus-visible:outline-none hover:-translate-y-0.5"
          style={{
            backgroundColor: 'var(--sa-accent)',
            boxShadow: canGenerate && !isLoading
              ? '0 6px 18px var(--sa-focus-ring)'
              : 'none',
          }}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>
            {isLoading ? 'Thinking alongside you...' : activeTool.actionLabel}
          </span>
        </button>
      </div>
    </aside>
  );
}
