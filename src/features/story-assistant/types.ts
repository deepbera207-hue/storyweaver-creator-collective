export type GenreId = 'romance' | 'calm' | 'moral' | 'adventure' | 'thriller';

export type AssistantToolId =
  | 'idea'
  | 'character'
  | 'plot'
  | 'dialogue'
  | 'structure'
  | 'worldbuilding'
  | 'scene'
  | 'consistency'
  | 'block'
  | 'alternatives'
  | 'feedback';

export type DialogueTone =
  | 'Natural & Grounded'
  | 'Tender & Vulnerable'
  | 'Tense & Subtext-Heavy'
  | 'Witty & Sharp'
  | 'Guarded & Distant'
  | 'Confrontational';

export type SuggestionStatus = 'pending' | 'accepted' | 'rejected';

export type RecreateFormat = 'prose' | 'script';

export interface GenreMoodProfile {
  moodTag: string;
  atmosphere: string;
  conflictLens: string;
  pacing: string;
  voiceStyle: string;
}

export interface GenreTheme {
  id: GenreId;
  label: string;
  subtitle: string;
  swatchPrimary: string;
  swatchSecondary: string;
  mood: GenreMoodProfile;
  cssVars: Record<string, string>;
}

export interface AssistanceTool {
  id: AssistantToolId;
  title: string;
  description: string;
  actionLabel: string;
  placeholderHint: string;
}

export interface StorySuggestion {
  id: string;
  category: string;
  title: string;
  guidance: string;
  draftSnippet?: string | undefined;
  status: SuggestionStatus;
  edited?: boolean | undefined;
  lastEditPrompt?: string | undefined;
}

export interface AssistantResponse {
  id: string;
  toolId: AssistantToolId;
  genreId: GenreId;
  mode: 'live' | 'demo';
  round: number;
  summary: string;
  suggestions: StorySuggestion[];
  createdAt: string;
}

export interface RecreatedStoryResult {
  id: string;
  title: string;
  format: RecreateFormat;
  genreId: GenreId;
  mode: 'live' | 'demo';
  content: string;
  incorporatedTitles: string[];
  createdAt: string;
}

export interface SavedSession {
  id: string;
  title: string;
  genreId: GenreId;
  toolId: AssistantToolId;
  storyExcerpt: string;
  fullStory: string;
  acceptedSuggestions: StorySuggestion[];
  updatedAt: string;
}

export interface StoryAssistantRequest {
  action: 'generate_suggestions';
  projectContext?: string | undefined;
  title: string;
  storyText: string;
  genreId: GenreId;
  toolId: AssistantToolId;
  characterFocus?: string | undefined;
  dialogueTone?: DialogueTone | undefined;
  extraInstruction?: string | undefined;
  generationRound: number;
  seenTitles: string[];
  rejectedTitles: string[];
}

export interface ReviseSuggestionRequest {
  action: 'revise_suggestion';
  projectContext?: string | undefined;
  title: string;
  storyText: string;
  genreId: GenreId;
  toolId: AssistantToolId;
  suggestion: StorySuggestion;
  editInstruction: string;
}

export interface MergeStoryRequest {
  action: 'merge_story';
  projectContext?: string | undefined;
  title: string;
  storyText: string;
  genreId: GenreId;
  format: RecreateFormat;
  acceptedSuggestions: StorySuggestion[];
}

export interface StoryAssistantPageProps {
  /** Backend API endpoint (defaults to "/api/story-assistant"). Never pass API keys to the frontend. */
  apiEndpoint?: string | undefined;
  /** Optional initial document title when embedded in an existing platform */
  initialTitle?: string | undefined;
  /** Optional initial draft text when embedded in an existing platform */
  initialStory?: string | undefined;
  /** Optional callback when the user updates their draft or applies recreated text */
  onDraftChange?: ((title: string, content: string) => void) | undefined;
  /** Optional callback when a suggestion is accepted into notes */
  onSaveSuggestion?: ((suggestion: StorySuggestion) => void) | undefined;
  /** Optional localStorage namespace key to avoid collisions across projects */
  storageKey?: string | undefined;
  /** Initial story mood (derived from a project's primary genre) */
  initialGenreId?: GenreId | undefined;
  /** Project context passed to the AI so suggestions stay consistent with the project */
  projectContext?: string | undefined;
  /** Render inside another page (no full-screen backdrop) */
  embedded?: boolean | undefined;
}
