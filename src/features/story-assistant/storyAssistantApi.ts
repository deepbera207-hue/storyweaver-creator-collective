import { GENRE_THEMES } from './genreThemes';
import { runStoryAssistant } from './storyAssistant.functions';
import type {
  AssistantResponse,
  MergeStoryRequest,
  RecreatedStoryResult,
  ReviseSuggestionRequest,
  StoryAssistantRequest,
  StorySuggestion,
} from './types';

/**
 * Client API for the AI Story Assistant. Calls the authenticated server
 * function backed by the Lovable AI Gateway. There is no silent demo
 * fallback: failures surface to the writer as errors.
 */

function createId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export async function generateStoryAssistance(request: StoryAssistantRequest): Promise<AssistantResponse> {
  const data = (await runStoryAssistant({ data: request })) as {
    summary?: string;
    suggestions?: Partial<StorySuggestion>[];
  };
  const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
  if (suggestions.length === 0) {
    throw new Error('The assistant did not return any suggestions. Try adding more of your draft.');
  }
  return {
    id: createId('res'),
    toolId: request.toolId,
    genreId: request.genreId,
    mode: 'live',
    round: request.generationRound,
    summary: data.summary || 'Suggestions tailored to your story mood and draft.',
    suggestions: suggestions.map((item) => ({
      id: createId('sug'),
      category: item.category || GENRE_THEMES[request.genreId].label,
      title: item.title || 'Creative Idea',
      guidance: item.guidance || '',
      draftSnippet: item.draftSnippet?.trim() ? item.draftSnippet : undefined,
      status: 'pending',
    })),
    createdAt: new Date().toISOString(),
  };
}

export async function reviseSuggestionWithChat(
  request: ReviseSuggestionRequest
): Promise<{ mode: 'live' | 'demo'; suggestion: StorySuggestion }> {
  const data = (await runStoryAssistant({ data: request })) as { suggestion?: Partial<StorySuggestion> };
  const s = data.suggestion ?? {};
  return {
    mode: 'live',
    suggestion: {
      ...request.suggestion,
      category: s.category || request.suggestion.category,
      title: s.title || request.suggestion.title,
      guidance: s.guidance || request.suggestion.guidance,
      draftSnippet: s.draftSnippet?.trim() ? s.draftSnippet : request.suggestion.draftSnippet,
      status: 'pending',
      edited: true,
      lastEditPrompt: request.editInstruction,
    },
  };
}

export async function mergeStoryWithSuggestions(request: MergeStoryRequest): Promise<RecreatedStoryResult> {
  const data = (await runStoryAssistant({ data: request })) as { content?: string };
  if (!data.content?.trim()) throw new Error('The assistant returned an empty draft. Please try again.');
  return {
    id: createId('merged'),
    title: request.title.trim() || 'Untitled Story',
    format: request.format,
    genreId: request.genreId,
    mode: 'live',
    content: data.content,
    incorporatedTitles: request.acceptedSuggestions.map((s) => s.title),
    createdAt: new Date().toISOString(),
  };
}
