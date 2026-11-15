import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * AI Story Assistant backend. Ported from the original Express + Gemini route
 * to the Lovable AI Gateway. Prompts are kept from the original module.
 */

const GENRE_MOODS: Record<
  string,
  { label: string; mood: string; atmosphere: string; conflict: string; voice: string }
> = {
  romance: {
    label: "Romance & Love",
    mood: "Intimate, Tender & Emotionally Charged",
    atmosphere: "Warm vulnerability, lingering glances, quiet emotional tension",
    conflict: "Emotional risk, unspoken devotion, closeness vs. fear of loss",
    voice: "Sensory intimacy and layered romantic subtext",
  },
  calm: {
    label: "Calm & Comfort",
    mood: "Gentle, Grounded & Restorative",
    atmosphere: "Soft daylight, unhurried stillness, small everyday mercies",
    conflict: "Letting go of exhaustion, quiet healing, finding belonging",
    voice: "Tactile warmth and reassuring clarity",
  },
  moral: {
    label: "Moral & Social",
    mood: "Reflective, Conscience-Driven & Human",
    atmosphere: "Civic tension, ethical weight, quiet courage in ordinary rooms",
    conflict: "Personal safety vs. collective fairness, truth vs. complicity",
    voice: "Clear-eyed realism and nuanced human empathy",
  },
  adventure: {
    label: "Adventure & Exploration",
    mood: "Kinetic, Bold & Discovery-Led",
    atmosphere: "Wide horizons, ticking clocks, tactile danger and wonder",
    conflict: "Unforgiving terrain, rival seekers, courage under uncertainty",
    voice: "Active sensory motion and high physical stakes",
  },
  thriller: {
    label: "Thriller & Dark Society",
    mood: "Tense, Unsettling & Psychologically Sharp",
    atmosphere: "Claustrophobic suspicion, double meanings, watchful shadows",
    conflict: "Hidden motives, unreliable appearances, narrowing exits",
    voice: "Taut sentences and razor-edged psychological tension",
  },
};

const TOOL_FOCUS: Record<string, string> = {
  idea: "Story idea development: expand the premise, sharpen the central conflict, explore directions.",
  character: "Character development: motivations, arcs, backstory, flaws, out-of-character moments.",
  plot: "Plot development: plot holes, pacing, cause and effect, earned twists and endings.",
  dialogue: "Dialogue improvement: natural rhythm, subtext, distinct voices, emotional tone.",
  structure: "Story structure: acts, beats, midpoint, turning points, climax and resolution.",
  worldbuilding: "World-building: settings, cultures, rules, history, and how the world pressures characters.",
  scene: "Scene development: scene goal, conflict, sensory grounding, and a strong exit beat.",
  consistency: "Story consistency: continuity, timeline, character voice and established rules.",
  block: "Creative block help: gentle questions, small next steps and prompts to restart momentum.",
  alternatives: "Alternative creative possibilities: distinct 'what if' branches the writer can choose from.",
  feedback: "Creative feedback: what works, what could be clearer, without rewriting the writer's voice.",
};

type Suggestion = { category: string; title: string; guidance: string; draftSnippet: string };

type AssistantInput =
  | {
      action: "generate_suggestions";
      title: string;
      storyText: string;
      genreId: string;
      toolId: string;
      characterFocus?: string | undefined;
      dialogueTone?: string | undefined;
      extraInstruction?: string | undefined;
      generationRound: number;
      seenTitles: string[];
      rejectedTitles: string[];
      projectContext?: string | undefined;
    }
  | {
      action: "revise_suggestion";
      title: string;
      storyText: string;
      genreId: string;
      toolId: string;
      suggestion: { category?: string | undefined; title?: string | undefined; guidance?: string | undefined; draftSnippet?: string | undefined };
      editInstruction: string;
      projectContext?: string | undefined;
    }
  | {
      action: "merge_story";
      title: string;
      storyText: string;
      genreId: string;
      format: "prose" | "script";
      acceptedSuggestions: { title?: string | undefined; guidance?: string | undefined; draftSnippet?: string | undefined }[];
      projectContext?: string | undefined;
    };

const SUGGESTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    category: { type: "string" },
    title: { type: "string" },
    guidance: { type: "string" },
    draftSnippet: { type: "string", description: "Optional short prose/dialogue line. Empty string if none." },
  },
  required: ["category", "title", "guidance", "draftSnippet"],
} as const;

function clip(v: unknown, n: number) {
  return String(v ?? "").slice(0, n);
}

async function callModel(system: string, prompt: string, name: string, schema: Record<string, unknown>) {
  const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
  try {
    const res = await generateResponse({
      model: "openai/gpt-6-astra",
      instructions: system,
      input: [{ role: "user", content: `${prompt}\n\nReturn JSON.` }],
      text: { format: { type: "json_schema", name, schema, strict: true } },
    });
    const out = (res as { output?: { type: string | undefined; content?: { type: string | undefined; text?: string | undefined }[] }[] }).output ?? [];
    const text = out
      .flatMap((o) => (o.type === "message" ? (o.content ?? []) : []))
      .filter((c) => c.type === "output_text")
      .map((c) => c.text ?? "")
      .join("");
    return JSON.parse(text || "{}") as Record<string, unknown>;
  } catch (err) {
    if (err instanceof GatewayError) {
      console.error("AI gateway error", err.code, err.httpStatus);
      if (err.httpStatus === 429) throw new Error("The AI assistant is busy right now. Please wait a moment and try again.");
      if (err.httpStatus === 402) throw new Error("AI credits are used up for this workspace. Add credits to keep using the assistant.");
      throw new Error("The AI assistant could not respond. Please try again.");
    }
    console.error("AI parse error", err);
    throw new Error("The AI assistant returned an unexpected answer. Please try again.");
  }
}

export const runStoryAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: AssistantInput) => {
    if (!input || typeof input !== "object") throw new Error("Invalid request");
    if (!["generate_suggestions", "revise_suggestion", "merge_story"].includes(input.action)) {
      throw new Error("Unknown action");
    }
    return input;
  })
  .handler(async ({ data: body }) => {
    const genre = (GENRE_MOODS[body.genreId] ?? GENRE_MOODS['calm'])!;
    const ctx = body.projectContext ? `Project Context (from the writer's Crea-Link project):\n${clip(body.projectContext, 2000)}` : null;

    if (body.action === "revise_suggestion") {
      const s = body.suggestion || {};
      const prompt = [
        `You are a collaborative creative writing partner helping a writer refine a single suggestion without rewriting their full manuscript.`,
        `Genre & Mood: ${genre.label} — ${genre.mood}. Atmosphere: ${genre.atmosphere}. Voice: ${genre.voice}.`,
        ctx,
        `Story Title: ${clip(body.title, 200) || "Untitled"}`,
        `Writer's Story Context:\n${clip(body.storyText, 3500)}`,
        `Original Suggestion Title: ${clip(s.title, 300)}`,
        `Original Suggestion Guidance: ${clip(s.guidance, 1500)}`,
        `Original Optional Draft Snippet: ${clip(s.draftSnippet, 1500) || "(none)"}`,
        `Writer's Edit Request: "${clip(body.editInstruction, 800)}"`,
        `Recreate this suggestion so it directly fulfills the writer's edit request while matching the ${genre.label} story mood.`,
      ]
        .filter(Boolean)
        .join("\n\n");
      const parsed = (await callModel(
        "Act as a supportive literary editor. Return concise, high-craft JSON matching the requested schema.",
        prompt,
        "revised_suggestion",
        SUGGESTION_SCHEMA as unknown as Record<string, unknown>,
      )) as Suggestion;
      return { mode: "live" as const, suggestion: parsed };
    }

    if (body.action === "merge_story") {
      const format = body.format === "script" ? "script" : "prose";
      const accepted = Array.isArray(body.acceptedSuggestions) ? body.acceptedSuggestions.slice(0, 20) : [];
      const notes = accepted
        .map((s, i) => `${i + 1}. ${clip(s.title, 200) || "Note"}: ${clip(s.guidance, 800)}${s.draftSnippet ? `\n   Snippet: ${clip(s.draftSnippet, 800)}` : ""}`)
        .join("\n");
      const prompt = [
        `Weave the writer's original story draft together with all of their accepted creative suggestions into a cohesive, readable ${
          format === "script"
            ? "screenplay script (with sluglines like INT./EXT., action lines, uppercase character cues, and dialogue)"
            : "literary prose draft"
        }.`,
        `Honor the writer's original premise, characters, and voice while infusing the ${genre.label} mood (${genre.mood}; Atmosphere: ${genre.atmosphere}; Voice: ${genre.voice}).`,
        ctx,
        `Title: ${clip(body.title, 200) || "Untitled Story"}`,
        `Original Draft:\n${clip(body.storyText, 6000)}`,
        `Accepted Suggestions to Weave In:\n${notes}`,
      ]
        .filter(Boolean)
        .join("\n\n");
      const parsed = await callModel(
        "You are a skilled novelist and screenwriter assembling a unified readable draft from the author's own plot and accepted notes. Return clean JSON.",
        prompt,
        "merged_story",
        {
          type: "object",
          additionalProperties: false,
          properties: { content: { type: "string" } },
          required: ["content"],
        },
      );
      return { mode: "live" as const, content: String(parsed['content'] ?? "") };
    }

    const seen = (Array.isArray(body.seenTitles) ? body.seenTitles : []).slice(-40).map((t) => clip(t, 200));
    const rejected = (Array.isArray(body.rejectedTitles) ? body.rejectedTitles : []).slice(-40).map((t) => clip(t, 200));
    const prompt = [
      `You are an AI Story Assistant acting as a thoughtful creative partner. Help the writer improve their own ideas—never take over their authorship.`,
      `Selected Genre & Story Mood: ${genre.label} (${genre.mood}).`,
      `Atmosphere: ${genre.atmosphere}. Conflict Lens: ${genre.conflict}. Prose Voice: ${genre.voice}.`,
      `Assistance focus: ${TOOL_FOCUS[body.toolId] ?? TOOL_FOCUS['idea']}`,
      ctx,
      body.characterFocus ? `Character Focus: ${clip(body.characterFocus, 200)}` : null,
      body.dialogueTone ? `Requested Dialogue Emotional Tone: ${clip(body.dialogueTone, 100)}` : null,
      body.extraInstruction ? `Writer's Specific Question: ${clip(body.extraInstruction, 1000)}` : null,
      `Generation Round: #${Number(body.generationRound || 1)}. Provide 4 distinct, fresh, specific suggestions.`,
      rejected.length ? `STRICTLY EXCLUDE these rejected concepts/titles: ${rejected.join(" | ")}` : null,
      seen.length ? `DO NOT repeat these previously shown angles: ${seen.join(" | ")}` : null,
      `Story Title: ${clip(body.title, 200) || "Untitled Draft"}`,
      `Writer's Draft:\n${clip(body.storyText, 6000)}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const parsed = await callModel(
      "Provide constructive, genre-authentic editorial suggestions tailored closely to the writer's text. Include short draftSnippet prose/dialogue lines on 2-3 suggestions when helpful; otherwise use an empty string.",
      prompt,
      "story_suggestions",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          summary: { type: "string" },
          suggestions: { type: "array", items: SUGGESTION_SCHEMA },
        },
        required: ["summary", "suggestions"],
      },
    );
    return {
      mode: "live" as const,
      summary: String(parsed['summary'] ?? ""),
      suggestions: (Array.isArray(parsed['suggestions']) ? parsed['suggestions'] : []) as Suggestion[],
    };
  });
