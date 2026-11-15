import { AssistanceTool, DialogueTone, GenreId, GenreTheme } from './types';

export const GENRE_THEMES: Record<GenreId, GenreTheme> = {
  romance: {
    id: 'romance',
    label: 'Romance & Love',
    subtitle: 'Pastel pink, blush & soft lavender',
    swatchPrimary: '#F7D4E3',
    swatchSecondary: '#E7DDF9',
    mood: {
      moodTag: 'Intimate, Tender & Emotionally Charged',
      atmosphere: 'Warm vulnerability, lingering glances, quiet emotional tension',
      conflictLens: 'Emotional risk, unspoken devotion, closeness vs. fear of loss',
      pacing: 'Unhurried emotional beats with meaningful pauses',
      voiceStyle: 'Sensory intimacy and layered romantic subtext',
    },
    cssVars: {
      '--sa-tint': '#FDF4F8',
      '--sa-tint-secondary': '#F8F4FD',
      '--sa-surface-glass': 'rgba(253, 244, 248, 0.78)',
      '--sa-border': '#EED5E1',
      '--sa-border-strong': '#DFB6CA',
      '--sa-accent': '#9E4B71',
      '--sa-accent-hover': '#883D60',
      '--sa-accent-soft': '#FCEAF2',
      '--sa-accent-text': '#7E3557',
      '--sa-orb-1': 'rgba(248, 206, 226, 0.48)',
      '--sa-orb-2': 'rgba(225, 214, 250, 0.44)',
      '--sa-focus-ring': 'rgba(158, 75, 113, 0.22)',
    },
  },
  calm: {
    id: 'calm',
    label: 'Calm & Comfort',
    subtitle: 'Pale sky blue, powder blue & white',
    swatchPrimary: '#D5E9FA',
    swatchSecondary: '#ECF5FD',
    mood: {
      moodTag: 'Gentle, Grounded & Restorative',
      atmosphere: 'Soft daylight, unhurried stillness, small everyday mercies',
      conflictLens: 'Letting go of exhaustion, quiet healing, finding belonging',
      pacing: 'Gentle contemplative rhythm with breathing room',
      voiceStyle: 'Tactile warmth and reassuring clarity',
    },
    cssVars: {
      '--sa-tint': '#F3F8FD',
      '--sa-tint-secondary': '#F8FBFF',
      '--sa-surface-glass': 'rgba(243, 248, 253, 0.80)',
      '--sa-border': '#D4E6F4',
      '--sa-border-strong': '#B2D0E8',
      '--sa-accent': '#3E719B',
      '--sa-accent-hover': '#315F85',
      '--sa-accent-soft': '#E6F2FC',
      '--sa-accent-text': '#2A557A',
      '--sa-orb-1': 'rgba(196, 226, 252, 0.46)',
      '--sa-orb-2': 'rgba(222, 239, 253, 0.50)',
      '--sa-focus-ring': 'rgba(62, 113, 155, 0.22)',
    },
  },
  moral: {
    id: 'moral',
    label: 'Moral & Social',
    subtitle: 'Soft sage green & gentle mint',
    swatchPrimary: '#D4EBDF',
    swatchSecondary: '#E8F6EE',
    mood: {
      moodTag: 'Reflective, Conscience-Driven & Human',
      atmosphere: 'Civic tension, ethical weight, quiet courage in ordinary rooms',
      conflictLens: 'Personal safety vs. collective fairness, truth vs. complicity',
      pacing: 'Deliberate moral escalation through everyday choices',
      voiceStyle: 'Clear-eyed realism and nuanced human empathy',
    },
    cssVars: {
      '--sa-tint': '#F3FAF6',
      '--sa-tint-secondary': '#EEF8F2',
      '--sa-surface-glass': 'rgba(243, 250, 246, 0.80)',
      '--sa-border': '#CFE6DA',
      '--sa-border-strong': '#AFD4C0',
      '--sa-accent': '#3A7659',
      '--sa-accent-hover': '#2E6249',
      '--sa-accent-soft': '#E4F4EB',
      '--sa-accent-text': '#26573F',
      '--sa-orb-1': 'rgba(196, 231, 211, 0.45)',
      '--sa-orb-2': 'rgba(218, 243, 230, 0.48)',
      '--sa-focus-ring': 'rgba(58, 118, 89, 0.22)',
    },
  },
  adventure: {
    id: 'adventure',
    label: 'Adventure & Exploration',
    subtitle: 'Pale orange, peach & warm cream',
    swatchPrimary: '#FADBC0',
    swatchSecondary: '#FEF1E2',
    mood: {
      moodTag: 'Kinetic, Bold & Discovery-Led',
      atmosphere: 'Wide horizons, ticking clocks, tactile danger and wonder',
      conflictLens: 'Unforgiving terrain, rival seekers, courage under uncertainty',
      pacing: 'Brisk forward momentum punctuated by awe and obstacles',
      voiceStyle: 'Active sensory motion and high physical stakes',
    },
    cssVars: {
      '--sa-tint': '#FFF8F1',
      '--sa-tint-secondary': '#FFFBF6',
      '--sa-surface-glass': 'rgba(255, 248, 241, 0.80)',
      '--sa-border': '#F3DCC8',
      '--sa-border-strong': '#E5BE9C',
      '--sa-accent': '#AE5C2E',
      '--sa-accent-hover': '#954B22',
      '--sa-accent-soft': '#FDECD9',
      '--sa-accent-text': '#89431C',
      '--sa-orb-1': 'rgba(252, 218, 185, 0.46)',
      '--sa-orb-2': 'rgba(255, 237, 214, 0.50)',
      '--sa-focus-ring': 'rgba(174, 92, 46, 0.22)',
    },
  },
  thriller: {
    id: 'thriller',
    label: 'Thriller & Dark Society',
    subtitle: 'Pale rose red & very light crimson',
    swatchPrimary: '#F3CDD3',
    swatchSecondary: '#F9E4E7',
    mood: {
      moodTag: 'Tense, Unsettling & Psychologically Sharp',
      atmosphere: 'Claustrophobic suspicion, double meanings, watchful shadows',
      conflictLens: 'Hidden motives, unreliable appearances, narrowing exits',
      pacing: 'Tight, escalating dread with sharp reversals',
      voiceStyle: 'Taut sentences and razor-edged psychological tension',
    },
    cssVars: {
      '--sa-tint': '#FDF4F5',
      '--sa-tint-secondary': '#FAF0F2',
      '--sa-surface-glass': 'rgba(253, 244, 245, 0.80)',
      '--sa-border': '#ECD0D5',
      '--sa-border-strong': '#DDB0B8',
      '--sa-accent': '#9E4351',
      '--sa-accent-hover': '#863542',
      '--sa-accent-soft': '#FAE4E7',
      '--sa-accent-text': '#7E2E3B',
      '--sa-orb-1': 'rgba(242, 200, 207, 0.45)',
      '--sa-orb-2': 'rgba(235, 208, 217, 0.42)',
      '--sa-focus-ring': 'rgba(158, 67, 81, 0.22)',
    },
  },
};

export const GENRE_LIST: GenreTheme[] = Object.values(GENRE_THEMES);

export const ASSISTANCE_TOOLS: AssistanceTool[] = [
  {
    id: 'idea',
    title: 'Story Idea Development',
    description:
      'Expand a seed premise, sharpen the central conflict, and explore fresh directions.',
    actionLabel: 'Develop Story Idea',
    placeholderHint:
      'Enter a basic premise, a "what if" question, or a short opening scene.',
  },
  {
    id: 'character',
    title: 'Character Development',
    description:
      'Build backgrounds, motivations, arcs, and catch out-of-character behavior.',
    actionLabel: 'Explore Character Depth',
    placeholderHint:
      'Include a scene with your character or describe their dilemma and relationships.',
  },
  {
    id: 'plot',
    title: 'Plot Improvement',
    description:
      'Spot plot holes and pacing gaps while brainstorming earned twists and endings.',
    actionLabel: 'Analyze Plot & Pacing',
    placeholderHint:
      'Paste your chapter outline, sequence of events, or full scene draft.',
  },
  {
    id: 'dialogue',
    title: 'Dialogue Assistant',
    description:
      'Polish spoken lines for natural rhythm, subtext, and a chosen emotional tone.',
    actionLabel: 'Refine Dialogue',
    placeholderHint:
      'Include lines of dialogue (in quotes or script format) to polish rhythm and tone.',
  },
  {
    id: 'feedback',
    title: 'Creative Feedback',
    description:
      'Receive thoughtful editorial guidance while keeping every word under your control.',
    actionLabel: 'Get Editorial Feedback',
    placeholderHint:
      'Share any passage you want constructive, non-intrusive feedback on.',
  },
];

export const DIALOGUE_TONES: DialogueTone[] = [
  'Natural & Grounded',
  'Tender & Vulnerable',
  'Tense & Subtext-Heavy',
  'Witty & Sharp',
  'Guarded & Distant',
  'Confrontational',
];

export const SAMPLE_PROMPTS: Record<GenreId, { title: string; text: string }> = {
  romance: {
    title: 'Letters Left at Platform Four',
    text: `Every Tuesday for three years, Clara leaves a paperback on the bench at Platform Four with penciled margin notes inside. She assumes the quiet station archivist, Julian, only shelves lost property—until she finds a book returned to her coat pocket with replies written in neat blue ink.\n\n"You kept the page folded," Julian said when the rain forced them under the same awning.\n"I didn't think anyone actually read the margins," Clara replied, looking away.`,
  },
  calm: {
    title: 'The Winter Greenhouse',
    text: `After leaving her city job, Maya inherits her grandmother's glasshouse overlooking a quiet cove. The glass is fogged with salt and condensation, and the neighborhood baker keeps dropping off loaves of warm rye without asking why she arrived mid-winter. Slowly, tending dormant citrus trees teaches her how to breathe without a schedule.`,
  },
  moral: {
    title: 'The Water Meter Ledger',
    text: `When a municipal clerk discovers that two neighboring districts are billed at vastly different rates due to an outdated zoning map, fixing the error means exposing the town council's biggest donor—and risking the clinic funding his sister depends on.`,
  },
  adventure: {
    title: 'Beyond the Red Salt Flats',
    text: `Armed with an inherited brass astrolabe that refuses to point north, courier-cartographer Asha crosses the seasonal salt flats before the monsoon floods the basin. Halfway across, she realizes the astrolabe isn't broken—it's tracking something moving beneath the crust.`,
  },
  thriller: {
    title: 'The Alibi Club',
    text: `Nina runs a discreet concierge service that writes airtight travel itineraries for wealthy clients who need to appear somewhere else. When one client is found dead inside the exact hotel room Nina booked for his fake trip, she realizes someone used her own ledger to frame her.\n\n"You told me no one checks the luggage tags," Detective Vance said softly.\n"No one usually has a reason to," Nina answered.`,
  },
};
