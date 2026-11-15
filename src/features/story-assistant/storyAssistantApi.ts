import { GENRE_THEMES } from './genreThemes';
import {
  AssistantResponse,
  MergeStoryRequest,
  RecreatedStoryResult,
  ReviseSuggestionRequest,
  StoryAssistantRequest,
  StorySuggestion,
} from './types';

function createId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function extractFirstSentence(text: string): string {
  const cleaned = text.trim().replace(/\s+/g, ' ');
  if (!cleaned) return 'your story premise';
  const match = cleaned.match(/^[^.!?]+[.!?]?/);
  const sentence = match ? match[0] : cleaned.slice(0, 100);
  return sentence.length > 100 ? `${sentence.slice(0, 97)}...` : sentence;
}

function extractLikelyNames(text: string): string[] {
  const ignored = new Set([
    'Every',
    'When',
    'After',
    'Before',
    'Until',
    'Halfway',
    'Slowly',
    'The',
    'And',
    'But',
    'She',
    'He',
    'They',
    'There',
    'This',
    'That',
    'Because',
    'Armed',
    'Only',
  ]);
  const matches = text.match(/\b[A-Z][a-z]{2,14}\b/g) || [];
  const unique: string[] = [];
  for (const word of matches) {
    if (!ignored.has(word) && !unique.includes(word)) {
      unique.push(word);
    }
    if (unique.length >= 3) break;
  }
  return unique;
}

function buildDemoSuggestionBank(req: StoryAssistantRequest): StorySuggestion[] {
  const theme = GENRE_THEMES[req.genreId];
  const mood = theme.mood;
  const lead = extractFirstSentence(req.storyText);
  const names = extractLikelyNames(req.storyText);
  const c1 = req.characterFocus?.trim() || names[0] || 'your protagonist';
  const c2 = names[1] || 'their closest counterpart';
  const tone = req.dialogueTone || 'Natural & Grounded';
  const round = req.generationRound;

  const genreSnippets: Record<
    StoryAssistantRequest['genreId'],
    { a: string; b: string; c: string; dial: string }
  > = {
    romance: {
      a: `${c1} lingered a second longer than necessary, close enough to notice the faint ink stain on ${c2}'s cuff—realizing the distance between them had always been protective, not indifferent.`,
      b: `The silence stretched warm and fragile between them, carrying everything neither had dared put onto paper.`,
      c: `Before turning away, ${c1} tucked the folded note inside the inside pocket closest to the heart—where pride could no longer reach it.`,
      dial: `"You kept it all this time," ${c1} murmured, eyes dropping to the worn crease.\n"Only because you wrote it like you hoped I'd look twice," ${c2} answered softly.`,
    },
    calm: {
      a: `Early light settled across the quiet table, and for the first time in months, ${c1} let the kettle finish humming without reaching for a clock.`,
      b: `Nothing dramatic announced the change—only an unlatched window, salt air drifting inward, and the sudden permission to stay.`,
      c: `${c1} set two cups side by side, noticing how steadiness arrived not in grand answers, but in small routines kept gently.`,
      dial: `"Stay until the rain clears," ${c1} offered, warming both hands around the mug.\n"Actually," ${c2} smiled faintly, "I'm not in any hurry to leave."`,
    },
    moral: {
      a: `${c1} traced the column of numbers twice, knowing that correcting a single line on paper would upend two neighborhoods that trusted the silence.`,
      b: `The convenient path already bore three signatures; only the honest choice waited alone without an ally.`,
      c: `Every person in the room wanted peace, yet peace built on an unequal ledger would fracture the moment someone spoke plainly.`,
      dial: `"If we file this quietly, someone else absorbs the cost next winter," ${c1} said.\n"And if we release it tonight, we lose the support keeping the doors open," ${c2} replied.`,
    },
    adventure: {
      a: `Wind swept red dust over the ridge, giving ${c1} less than ten minutes to reach the marker before the basin flooded shut.`,
      b: `Every map ended at the canyon rim, meaning whatever waited beyond the ridge belonged solely to whoever risked the descent first.`,
      c: `${c1} checked the compass needle spinning wild—not broken, just answering a pull buried deep beneath the salt crust.`,
      dial: `"The lower crossing's gone!" ${c1} shouted over the rising gale.\n"Then we take the high ledge before dark—nobody else has the nerve to follow," ${c2} called back.`,
    },
    thriller: {
      a: `${c1} turned the deadbolt twice and studied the hallway reflection in the dark glass; whoever left the keycard had been inside within the hour.`,
      b: `Every piece of evidence aligned with reassuring precision—which was exactly how ${c1} knew the narrative had been engineered.`,
      c: `Smiling politely for the cameras, ${c1} memorized the exit routes first and the alibis second.`,
      dial: `"You seem remarkably calm about where you were at midnight," ${c1} said evenly.\n"Only because I know whose handwriting forged my pass," ${c2} answered without blinking.`,
    },
  };

  const snip = genreSnippets[req.genreId];

  const banks: Record<StoryAssistantRequest['toolId'], Array<Omit<StorySuggestion, 'id' | 'status'>>> = {
    idea: [
      {
        category: `${theme.label} · Core Conflict`,
        title: 'Raise the personal cost of staying silent',
        guidance: `Inside a ${mood.moodTag.toLowerCase()} story, clarify what ${c1} risks losing internally if they step back from "${lead}". Tying external events to ${mood.conflictLens.toLowerCase()} makes the premise urgent.`,
        draftSnippet: snip.a,
      },
      {
        category: `${theme.label} · Direction`,
        title: 'Flip who already suspects the truth',
        guidance: `Instead of keeping the discovery one-sided, test letting ${c2} already know part of the secret—responding through ${mood.voiceStyle.toLowerCase()}.`,
        draftSnippet: snip.b,
      },
      {
        category: `${theme.label} · Turning Point`,
        title: 'Anchor Act II with a mood-driven shift',
        guidance: `Introduce a concrete turning point shaped by ${mood.atmosphere.toLowerCase()} that pushes ${c1} out of observation and into a visible decision.`,
      },
      {
        category: `${theme.label} · Motif`,
        title: 'Turn a small everyday object into an emotional compass',
        guidance: `Let one recurring object from your opening carry shifting meaning across scenes so the reader feels ${mood.pacing.toLowerCase()}.`,
        draftSnippet: snip.c,
      },
      {
        category: `${theme.label} · Alternative Angle`,
        title: 'Pair two characters with incompatible motives',
        guidance: `Bring ${c2} into the scene wanting the exact same outcome as ${c1}, but for a conflicting personal reason—creating natural friction.`,
      },
      {
        category: `${theme.label} · Opening Hook`,
        title: 'Plant the central emotional question in paragraph one',
        guidance: `Reframe the first beat so the promise of ${mood.conflictLens.toLowerCase()} is felt immediately without giving away the ending.`,
      },
      {
        category: `${theme.label} · Escalation`,
        title: 'Remove the safest backup plan early',
        guidance: `Take away ${c1}'s easiest fallback option halfway through Act I so every choice afterward carries genuine weight.`,
      },
      {
        category: `${theme.label} · Subtext`,
        title: 'Contrast public composure against private urgency',
        guidance: `Show ${c1} maintaining calm routine on the outside while an internal clock ticks underneath.`,
      },
    ],
    character: [
      {
        category: `${theme.label} · Inner Armor`,
        title: `Define the protective habit ${c1} hides behind`,
        guidance: `Give ${c1} a trait that looks admirable on the surface (precision, generosity, composure) that actually shields them from ${mood.conflictLens.toLowerCase()}.`,
        draftSnippet: snip.a,
      },
      {
        category: `${theme.label} · Consistency Check`,
        title: 'Ensure bold decisions grow from prior pressure',
        guidance: `Review ${c1}'s turning point: if they begin guarded or hesitant, precede any daring action with a clear emotional trigger rather than convenience.`,
      },
      {
        category: `${theme.label} · Relationship Dynamic`,
        title: `Build misread intentions between ${c1} and ${c2}`,
        guidance: `Have ${c2} misinterpret ${c1}'s restraint through the lens of ${mood.atmosphere.toLowerCase()}, sparking honest friction.`,
        draftSnippet: snip.dial,
      },
      {
        category: `${theme.label} · Character Arc`,
        title: 'Mirror an opening habit at the climax—changed',
        guidance: `Establish a tiny physical ritual for ${c1} in Scene 1, then show them breaking or transforming that ritual when the climax arrives.`,
      },
      {
        category: `${theme.label} · Contradiction`,
        title: 'Reveal a tender or flawed detail in private',
        guidance: `Let the reader catch ${c1} doing one unexpected small thing when nobody else is watching—humanizing their arc.`,
      },
      {
        category: `${theme.label} · Backstory Echo`,
        title: 'Turn past regret into present hesitation',
        guidance: `Instead of explaining backstory in a paragraph, show how a past mistake shapes ${c1}'s blind spot right now.`,
      },
      {
        category: `${theme.label} · Agency`,
        title: 'Let the character cause the complication',
        guidance: `Make sure the central turn isn't purely accidental—let one flawed, understandable decision by ${c1} set things in motion.`,
      },
    ],
    plot: [
      {
        category: `${theme.label} · Plot Hole Check`,
        title: 'Justify why the inciting discovery happens tonight',
        guidance: `Readers ask why "${lead}" unfolds right now instead of weeks earlier. Add one catalyst or changed condition to make the timing feel inevitable.`,
      },
      {
        category: `${theme.label} · Earned Twist`,
        title: 'Reverse the meaning of a casual early detail',
        guidance: `Pick an overlooked line or prop from your opening and reveal in Act III that it pointed in the opposite direction all along.`,
        draftSnippet: snip.b,
      },
      {
        category: `${theme.label} · Midpoint Shift`,
        title: 'Move from reaction to commitment at 50%',
        guidance: `At the story's midpoint, shift ${c1} from trying to avoid trouble to making an active commitment shaped by ${mood.conflictLens.toLowerCase()}.`,
      },
      {
        category: `${theme.label} · Pacing`,
        title: 'Insert a brief quiet breath before the climax',
        guidance: `Use ${mood.atmosphere.toLowerCase()} for half a page before the final confrontation so the emotional impact lands twice as hard.`,
        draftSnippet: snip.c,
      },
      {
        category: `${theme.label} · Ending Option`,
        title: 'Echo the opening setting with transformed stakes',
        guidance: `Bring the final scene back to where the story started so ${c1}'s internal shift speaks visually without over-explaining.`,
      },
      {
        category: `${theme.label} · Cause & Effect`,
        title: 'Tighten the bridge between clue and confrontation',
        guidance: `Ensure each scene ends with a clear consequence ("therefore" or "but") rather than a disconnected episode.`,
      },
      {
        category: `${theme.label} · Climax Stakes`,
        title: 'Force a choice between two genuine values',
        guidance: `Instead of right vs. wrong, pit two things ${c1} cares about against each other in the final act.`,
      },
    ],
    dialogue: [
      {
        category: `${theme.label} · ${tone}`,
        title: 'Let speakers answer the unspoken worry',
        guidance: `Write this exchange in a ${tone.toLowerCase()} register while preserving ${mood.voiceStyle.toLowerCase()}. Characters feel lifelike when they dodge the literal question.`,
        draftSnippet: snip.dial,
      },
      {
        category: `${theme.label} · Action Beats`,
        title: 'Replace explanatory adverbs with physical gesture',
        guidance: `Swap tags like "said softly" or "answered nervously" for small actions tied to ${mood.atmosphere.toLowerCase()}.`,
      },
      {
        category: `${theme.label} · Subtext`,
        title: 'Hide emotion inside an ordinary topic',
        guidance: `Let ${c1} and ${c2} argue or negotiate over a mundane object while actually talking about trust, loss, or loyalty.`,
      },
      {
        category: `${theme.label} · Voice Contrast`,
        title: 'Differentiate sentence length between speakers',
        guidance: `Give one speaker measured, complete thoughts and the other shorter interruptions or deflections so their voices never blur.`,
      },
      {
        category: `${theme.label} · Pacing`,
        title: 'Enter the conversation two lines later',
        guidance: `Cut the opening greetings and start straight on the line where emotional tension first sparks.`,
      },
      {
        category: `${theme.label} · Power Shift`,
        title: 'End the exchange with a changed balance',
        guidance: `Make the final spoken line subtly reverse who holds certainty or leverage in the scene.`,
      },
      {
        category: `${theme.label} · Silence`,
        title: 'Let one deliberate pause speak louder than a line',
        guidance: `Remove one explanatory reply and replace it with a beat of stillness so the reader leans into the subtext.`,
      },
    ],
    feedback: [
      {
        category: `${theme.label} · What Works`,
        title: 'Immediate situational grounding',
        guidance: `Opening with "${lead}" drops the reader into a concrete moment rather than vague summary—a strong foundation for ${mood.moodTag.toLowerCase()} fiction.`,
      },
      {
        category: `${theme.label} · Sensory Craft`,
        title: 'Add one tactile cue right before an emotional turn',
        guidance: `One crisp detail of temperature, light, or sound aligned with ${mood.atmosphere.toLowerCase()} will deepen immersion without slowing pace.`,
        draftSnippet: snip.a,
      },
      {
        category: `${theme.label} · Emotional Core`,
        title: 'Clarify what the protagonist secretly hopes happens',
        guidance: `Surface ${c1}'s unspoken desire slightly earlier so every obstacle feels personally charged.`,
      },
      {
        category: `${theme.label} · Rhythm`,
        title: 'Vary sentence cadence around the turning beat',
        guidance: `Following two longer descriptive lines with one short declarative sentence gives key realizations natural punch.`,
      },
      {
        category: `${theme.label} · Perspective`,
        title: 'Filter description through character mood',
        guidance: `Describe the setting using words ${c1} would notice right now under ${mood.conflictLens.toLowerCase()}.`,
      },
      {
        category: `${theme.label} · Clarity`,
        title: 'Trim one over-explained transition',
        guidance: `Trust your reader to connect cause and emotional effect—letting one implication remain unspoken adds resonance.`,
      },
      {
        category: `${theme.label} · Voice`,
        title: 'Protect your natural sentence melody',
        guidance: `Your opening already carries an authentic cadence; refine only the moments where clarity blurs rather than flattening your voice.`,
      },
    ],
  };

  const bank = banks[req.toolId];
  const rejectedSet = new Set(req.rejectedTitles);
  const seenSet = new Set(req.seenTitles);

  // Filter out anything rejected; prefer unseen items first, then cycle unseen variants if bank exhausted
  const notRejected = bank.filter((item) => !rejectedSet.has(item.title));
  const unseen = notRejected.filter((item) => !seenSet.has(item.title));

  let picked = unseen.slice(0, 4);
  if (picked.length < 4 && notRejected.length > 0) {
    const remaining = notRejected
      .filter((item) => !picked.some((p) => p.title === item.title))
      .map((item) => ({
        ...item,
        title: `${item.title} (Variation ${round})`,
        guidance: `${item.guidance} [Fresh angle for round ${round}: lean deeper into ${mood.voiceStyle.toLowerCase()}.]`,
      }));
    picked = [...picked, ...remaining].slice(0, 4);
  }

  // Fallback if user rejected almost everything
  if (picked.length === 0) {
    picked = [
      {
        category: `${theme.label} · Fresh Angle (Round ${round})`,
        title: `New ${theme.label} Exploration #${round}`,
        guidance: `Test shifting the scene's perspective to ${c2} for one beat, highlighting ${mood.atmosphere.toLowerCase()} and ${mood.conflictLens.toLowerCase()}.`,
        draftSnippet: snip.b,
      },
      {
        category: `${theme.label} · Scene Momentum #${round}`,
        title: `Unexpected Catalyst for ${c1}`,
        guidance: `Introduce an unscheduled interruption that forces ${c1} to reveal what matters most in this moment.`,
        draftSnippet: snip.c,
      },
    ];
  }

  return picked.map((item) => ({
    ...item,
    id: createId('sug'),
    status: 'pending' as const,
  }));
}

function buildDemoRevision(req: ReviseSuggestionRequest): StorySuggestion {
  const theme = GENRE_THEMES[req.genreId];
  const instr = req.editInstruction.trim();
  const lower = instr.toLowerCase();
  const base = req.suggestion;

  let toneNote = `Refined for ${theme.label} (${theme.mood.moodTag.toLowerCase()})`;
  let newGuidance = base.guidance;
  let newSnippet = base.draftSnippet;

  if (lower.includes('short') || lower.includes('concise') || lower.includes('punch')) {
    newGuidance = `${base.guidance.split('.')[0]}. Keep it brisk and sharply focused on "${instr}".`;
    if (newSnippet) {
      const firstLine = newSnippet.split('\n')[0];
      newSnippet = firstLine.length > 95 ? `${firstLine.slice(0, 92)}...` : firstLine;
    }
  } else if (lower.includes('dialog') || lower.includes('talk') || lower.includes('conversation')) {
    newGuidance = `${base.guidance} Reworked to surface through spoken exchange as requested ("${instr}").`;
    newSnippet = `"Wait—did you actually mean that?"\n"Look at what I didn't say," came the quiet answer, carrying the full weight of the moment.`;
  } else if (lower.includes('dark') || lower.includes('tense') || lower.includes('suspense')) {
    newGuidance = `${base.guidance} Heightened with sharper psychological tension and an uneasy undercurrent ("${instr}").`;
    newSnippet = newSnippet
      ? `${newSnippet}\nYet the quiet felt less like relief and more like someone waiting behind a closed door.`
      : `Even in the stillness, something didn't add up—and whoever had arranged the pieces was still watching.`;
  } else if (lower.includes('sad') || lower.includes('emotional') || lower.includes('soft') || lower.includes('tender')) {
    newGuidance = `${base.guidance} Softened and deepened emotionally to honor your note ("${instr}").`;
    newSnippet = newSnippet
      ? `${newSnippet}\nFor a fleeting second, neither pretended the loss hadn't changed them.`
      : `It hurt precisely because they both still cared enough to hesitate.`;
  } else {
    newGuidance = `${base.guidance} Updated directly for your edit request ("${instr}") while staying true to ${theme.mood.atmosphere.toLowerCase()}.`;
    newSnippet = newSnippet
      ? `${newSnippet}\n(${instr.charAt(0).toUpperCase() + instr.slice(1)}.)`
      : `Adjusted beat incorporating your direction: ${instr}.`;
  }

  return {
    ...base,
    id: base.id,
    category: `${base.category.split('·')[0].trim()} · Revised`,
    title: `${base.title}`,
    guidance: `${newGuidance} [${toneNote}]`,
    draftSnippet: newSnippet,
    status: 'pending',
    edited: true,
    lastEditPrompt: instr,
  };
}

function buildDemoMergedStory(req: MergeStoryRequest): RecreatedStoryResult {
  const theme = GENRE_THEMES[req.genreId];
  const title = req.title.trim() || 'Untitled Story';
  const original = req.storyText.trim();
  const names = extractLikelyNames(original);
  const c1 = (names[0] || 'PROTAGONIST').toUpperCase();
  const c2 = (names[1] || 'COUNTERPART').toUpperCase();
  const accepted = req.acceptedSuggestions;
  const snippets = accepted.map((s) => s.draftSnippet).filter(Boolean) as string[];
  const incorporatedTitles = accepted.map((s) => s.title);

  if (req.format === 'script') {
    const beatsBlock = accepted
      .map(
        (s, idx) =>
          `[BEAT ${idx + 1} — ${s.title.toUpperCase()}]\n(${s.guidance.slice(0, 140)}${
            s.guidance.length > 140 ? '...' : ''
          })\n${s.draftSnippet ? `\n${s.draftSnippet}\n` : ''}`
      )
      .join('\n');

    const scriptContent = [
      `TITLE: ${title.toUpperCase()}`,
      `GENRE & MOOD: ${theme.label} — ${theme.mood.moodTag}`,
      `ATMOSPHERE NOTE: ${theme.mood.atmosphere}`,
      `============================================================`,
      ``,
      `INT./EXT. OPENING SETTING - CONTINUOUS`,
      ``,
      original,
      ``,
      `--- WEAVING ACCEPTED STORY BEATS ---`,
      ``,
      beatsBlock || `${c1}\n(hesitates, weighing what comes next)`,
      `EXT. TURNING POINT - LATER`,
      ``,
      `${c1} takes one deliberate breath, shaped by ${theme.mood.conflictLens.toLowerCase()}.`,
      ``,
      `          ${c1}`,
      `     We don't walk away from this unchanged.`,
      ``,
      `          ${c2}`,
      `     (quietly)`,
      `     Then let's decide what comes after.`,
      ``,
      `FADE OUT.`,
    ].join('\n');

    return {
      id: createId('merged'),
      title,
      format: 'script',
      genreId: req.genreId,
      mode: 'demo',
      content: scriptContent,
      incorporatedTitles,
      createdAt: new Date().toISOString(),
    };
  }

  // Prose format
  const paragraphs = original.split(/\n\s*\n/);
  const opening = paragraphs[0] || original;
  const remainder = paragraphs.slice(1).join('\n\n');

  const wovenMiddle = accepted
    .map((s) =>
      s.draftSnippet
        ? s.draftSnippet
        : `Guided by ${s.title.toLowerCase()}, the scene deepened—${s.guidance.charAt(0).toLowerCase() + s.guidance.slice(1)}`
    )
    .join('\n\n');

  const closingBridge =
    snippets.length > 0
      ? `Everything that followed carried the quiet imprint of ${theme.mood.moodTag.toLowerCase()} stakes, turning an uncertain moment into an unforgettable choice.`
      : `Under the weight of ${theme.mood.atmosphere.toLowerCase()}, the story moved toward its turning point without losing its original voice.`;

  const proseContent = [
    `${title}`,
    `Mood: ${theme.label} (${theme.mood.moodTag})`,
    ``,
    opening,
    remainder,
    wovenMiddle,
    closingBridge,
  ]
    .filter((block, idx) => idx < 2 || block.trim().length > 0)
    .join('\n\n');

  return {
    id: createId('merged'),
    title,
    format: 'prose',
    genreId: req.genreId,
    mode: 'demo',
    content: proseContent,
    incorporatedTitles,
    createdAt: new Date().toISOString(),
  };
}

export async function generateStoryAssistance(
  request: StoryAssistantRequest,
  apiEndpoint = '/api/story-assistant'
): Promise<AssistantResponse> {
  if (apiEndpoint.trim()) {
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          return {
            id: createId('res'),
            toolId: request.toolId,
            genreId: request.genreId,
            mode: data.mode === 'demo' ? 'demo' : 'live',
            round: request.generationRound,
            summary:
              typeof data.summary === 'string'
                ? data.summary
                : 'Suggestions tailored to your story mood and draft.',
            suggestions: data.suggestions.map((item: Partial<StorySuggestion>) => ({
              id: item.id || createId('sug'),
              category: item.category || GENRE_THEMES[request.genreId].label,
              title: item.title || 'Creative Idea',
              guidance: item.guidance || '',
              draftSnippet: item.draftSnippet || undefined,
              status: 'pending',
            })),
            createdAt: new Date().toISOString(),
          };
        }
      }
    } catch {
      // Transparently fall through to Demonstration Mode
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 650));

  const theme = GENRE_THEMES[request.genreId];
  const suggestions = buildDemoSuggestionBank(request);
  return {
    id: createId('res'),
    toolId: request.toolId,
    genreId: request.genreId,
    mode: 'demo',
    round: request.generationRound,
    summary: `Demo batch #${request.generationRound} shaped for "${
      request.title || 'Untitled Draft'
    }" in ${theme.label} mood (${theme.mood.moodTag}). Rejected or previously shown suggestions are excluded.`,
    suggestions,
    createdAt: new Date().toISOString(),
  };
}

export async function reviseSuggestionWithChat(
  request: ReviseSuggestionRequest,
  apiEndpoint = '/api/story-assistant'
): Promise<{ mode: 'live' | 'demo'; suggestion: StorySuggestion }> {
  if (apiEndpoint.trim()) {
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.suggestion) {
          return {
            mode: data.mode === 'demo' ? 'demo' : 'live',
            suggestion: {
              ...request.suggestion,
              category: data.suggestion.category || request.suggestion.category,
              title: data.suggestion.title || request.suggestion.title,
              guidance: data.suggestion.guidance || request.suggestion.guidance,
              draftSnippet:
                data.suggestion.draftSnippet !== undefined
                  ? data.suggestion.draftSnippet
                  : request.suggestion.draftSnippet,
              status: 'pending',
              edited: true,
              lastEditPrompt: request.editInstruction,
            },
          };
        }
      }
    } catch {
      // Fall through to Demonstration Mode
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 550));
  return {
    mode: 'demo',
    suggestion: buildDemoRevision(request),
  };
}

export async function mergeStoryWithSuggestions(
  request: MergeStoryRequest,
  apiEndpoint = '/api/story-assistant'
): Promise<RecreatedStoryResult> {
  if (apiEndpoint.trim()) {
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && typeof data.content === 'string' && data.content.trim()) {
          return {
            id: createId('merged'),
            title: request.title.trim() || 'Untitled Story',
            format: request.format,
            genreId: request.genreId,
            mode: data.mode === 'demo' ? 'demo' : 'live',
            content: data.content,
            incorporatedTitles: request.acceptedSuggestions.map((s) => s.title),
            createdAt: new Date().toISOString(),
          };
        }
      }
    } catch {
      // Fall through to Demonstration Mode
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 750));
  return buildDemoMergedStory(request);
}
