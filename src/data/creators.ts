/**
 * DEMO DATA. Sample creators for the discovery experience.
 * Replace with a database-backed source when accounts are added.
 */
import romance from "@/assets/work-romance.jpg";
import peaceful from "@/assets/work-peaceful.jpg";
import adventure from "@/assets/work-adventure.jpg";
import thriller from "@/assets/work-thriller.jpg";
import moral from "@/assets/work-moral.jpg";
import animation from "@/assets/work-animation.jpg";
import music from "@/assets/work-music.jpg";
import video from "@/assets/work-video.jpg";

import type { Availability, CategoryKey, CollabPref, Experience } from "@/lib/categories";
import type { GenreKey } from "@/lib/genres";

export type PortfolioItem = { title: string; kind: string; image: string; description: string };
export type PastProject = { title: string; year: number; role: string; summary: string };

export type Creator = {
  id: string;
  name: string;
  location: string;
  category: CategoryKey;
  genres: GenreKey[];
  tagline: string;
  bio: string;
  skills: string[];
  interests: string[];
  experience: Experience;
  years: number;
  availability: Availability;
  collabPrefs: CollabPref[];
  lookingFor: CategoryKey[];
  portfolio: PortfolioItem[];
  projects: PastProject[];
  featured?: boolean;
};

export const IMAGES = { romance, peaceful, adventure, thriller, moral, animation, music, video };

export const CREATORS: Creator[] = [
  {
    id: "mira-okafor",
    name: "Mira Okafor",
    location: "Lagos · Remote",
    category: "animator",
    genres: ["romance", "peaceful"],
    tagline: "Hand-drawn animation for tender, character-led stories.",
    bio: "I animate quiet moments — the glance before a confession, the walk home after. Watercolour textures, expressive faces and slow, breathing timing.",
    skills: ["Character animation", "Storyboarding", "Watercolour", "2D animation", "Character design"],
    interests: ["emotional storytelling", "character development", "love stories"],
    experience: "Professional",
    years: 7,
    availability: "open",
    collabPrefs: ["Long-term", "Remote", "Passion project"],
    lookingFor: ["storyteller", "music"],
    featured: true,
    portfolio: [
      { title: "Under the Same Umbrella", kind: "Animated short", image: romance, description: "A four-minute short about two strangers sharing a rainy walk." },
      { title: "Hinoko — character sheet", kind: "Character design", image: animation, description: "Turnarounds and expressions for a fox-spirit companion." },
    ],
    projects: [
      { title: "Letters in Spring", year: 2025, role: "Lead animator", summary: "Festival-selected romance short, 2D hand-drawn." },
      { title: "Small Hours", year: 2023, role: "Storyboard artist", summary: "Web series about a late-night bakery romance." },
    ],
  },
  {
    id: "elias-brandt",
    name: "Elias Brandt",
    location: "Berlin",
    category: "storyteller",
    genres: ["dark", "moral"],
    tagline: "Psychological thrillers about people who almost do the right thing.",
    bio: "Screenwriter and novelist. I write slow-burn revenge stories, unreliable narrators and cities that keep secrets.",
    skills: ["Screenwriting", "Plot structure", "Dialogue", "Character arcs", "Series bible"],
    interests: ["psychological", "revenge", "dark society", "moral ambiguity"],
    experience: "Veteran",
    years: 12,
    availability: "limited",
    collabPrefs: ["Long-term", "Paid"],
    lookingFor: ["animator", "content"],
    featured: true,
    portfolio: [
      { title: "The Red Thread", kind: "Limited series script", image: thriller, description: "Six episodes. A courier follows a thread through a city's lies." },
    ],
    projects: [
      { title: "Glass Corridor", year: 2024, role: "Writer", summary: "Award-shortlisted audio drama, 8 episodes." },
      { title: "Debt of Winter", year: 2021, role: "Co-writer", summary: "Feature thriller in development with a Berlin studio." },
    ],
  },
  {
    id: "noor-haddad",
    name: "Noor Haddad",
    location: "Amman · Remote",
    category: "music",
    genres: ["peaceful", "romance"],
    tagline: "Gentle scores, lo-fi textures and themes that stay with you.",
    bio: "Composer for animation and games. I love piano, field recordings and soundtracks that feel like a warm room.",
    skills: ["Film scoring", "Piano", "Sound design", "Mixing", "Lo-fi production"],
    interests: ["healing", "cozy", "emotional storytelling"],
    experience: "Professional",
    years: 6,
    availability: "open",
    collabPrefs: ["Remote", "Short project", "Passion project"],
    lookingFor: ["animator", "storyteller"],
    featured: true,
    portfolio: [
      { title: "Lighthouse Mornings", kind: "Original score", image: peaceful, description: "A 12-track ambient score for a slice-of-life game." },
      { title: "Studio Sessions", kind: "Beat tape", image: music, description: "Soft beats recorded across one winter." },
    ],
    projects: [
      { title: "Tidewater", year: 2025, role: "Composer", summary: "Score for a cozy indie game, 40k players." },
      { title: "Window Seat", year: 2022, role: "Producer", summary: "Lo-fi EP licensed to three animated shorts." },
    ],
  },
  {
    id: "kenji-arakawa",
    name: "Kenji Arakawa",
    location: "Osaka",
    category: "animator",
    genres: ["adventure"],
    tagline: "Big skies, floating cities and kinetic action animation.",
    bio: "Background painter turned director. I build fantasy worlds and the camera moves that make you want to step inside.",
    skills: ["Background painting", "3D layout", "Action animation", "Worldbuilding", "Compositing"],
    interests: ["fantasy", "exploration", "worldbuilding"],
    experience: "Veteran",
    years: 14,
    availability: "limited",
    collabPrefs: ["Long-term", "Paid"],
    lookingFor: ["storyteller", "music"],
    featured: true,
    portfolio: [
      { title: "Skyward Isles", kind: "Concept & key art", image: adventure, description: "Worldbuilding package for an animated feature pitch." },
    ],
    projects: [
      { title: "The Ninth Wind", year: 2024, role: "Art director", summary: "Fantasy anime pilot, 22 minutes." },
      { title: "Cartographer", year: 2020, role: "Background lead", summary: "Animated adventure series, season one." },
    ],
  },
  {
    id: "ana-ruiz",
    name: "Ana Ruiz",
    location: "Mexico City",
    category: "content",
    genres: ["moral", "peaceful"],
    tagline: "Documentary-style edits about communities and small acts.",
    bio: "Video editor and short-form storyteller. I cut stories about neighbourhoods, makers and people doing quiet good.",
    skills: ["Video editing", "Colour grading", "Documentary", "Short-form", "Interview direction"],
    interests: ["community", "society", "humanity"],
    experience: "Intermediate",
    years: 4,
    availability: "open",
    collabPrefs: ["Short project", "Remote", "Paid"],
    lookingFor: ["music", "storyteller"],
    portfolio: [
      { title: "The Square", kind: "Short documentary", image: moral, description: "A village plants a tree for every child born this year." },
      { title: "Studio days", kind: "Reel", image: video, description: "Editing reel 2025." },
    ],
    projects: [
      { title: "Hands of the City", year: 2025, role: "Editor", summary: "Series of 10 vertical documentaries, 2M views." },
    ],
  },
  {
    id: "leo-marchetti",
    name: "Leo Marchetti",
    location: "Turin · Remote",
    category: "storyteller",
    genres: ["adventure", "moral"],
    tagline: "Quest stories with heart — for young readers and old ones.",
    bio: "Middle-grade fantasy author. I outline like an engineer and write like it's a campfire.",
    skills: ["Worldbuilding", "Plot structure", "Middle-grade fiction", "Story development", "Pitch decks"],
    interests: ["fantasy", "exploration", "coming of age"],
    experience: "Professional",
    years: 8,
    availability: "open",
    collabPrefs: ["Long-term", "Passion project", "Remote"],
    lookingFor: ["animator"],
    portfolio: [
      { title: "The Island Atlas", kind: "Series bible", image: adventure, description: "A five-book quest across floating archipelagos." },
    ],
    projects: [
      { title: "Lanterns of Vell", year: 2023, role: "Author", summary: "Published middle-grade fantasy novel." },
    ],
  },
  {
    id: "priya-nair",
    name: "Priya Nair",
    location: "Kochi",
    category: "storyteller",
    genres: ["romance", "moral"],
    tagline: "Romance with roots — families, food and second chances.",
    bio: "I write romantic dramas set in real kitchens and crowded houses. Love stories that also argue about who washes the dishes.",
    skills: ["Screenwriting", "Character arcs", "Dialogue", "Story development", "Webtoon scripting"],
    interests: ["relationships", "emotional storytelling", "family"],
    experience: "Intermediate",
    years: 5,
    availability: "open",
    collabPrefs: ["Long-term", "Remote", "Passion project"],
    lookingFor: ["animator", "music"],
    featured: true,
    portfolio: [
      { title: "Second Monsoon", kind: "Webtoon script", image: romance, description: "48-episode romance about two estranged chefs." },
    ],
    projects: [
      { title: "Cardamom Letters", year: 2024, role: "Writer", summary: "Romance webtoon, 120k subscribers." },
    ],
  },
  {
    id: "sam-whitlock",
    name: "Sam Whitlock",
    location: "Manchester",
    category: "music",
    genres: ["dark", "adventure"],
    tagline: "Tension, pulse and dread — scores for thrillers and chases.",
    bio: "Synth-heavy composer for thrillers, horror podcasts and trailers. I make silence feel loud.",
    skills: ["Film scoring", "Synth design", "Trailer music", "Sound design", "Mixing"],
    interests: ["psychological", "horror", "action"],
    experience: "Professional",
    years: 9,
    availability: "open",
    collabPrefs: ["Paid", "Short project", "Remote"],
    lookingFor: ["storyteller", "content"],
    portfolio: [
      { title: "Pulse Archive", kind: "Score suite", image: music, description: "Cues from three thriller podcasts." },
    ],
    projects: [
      { title: "Night Shift", year: 2025, role: "Composer", summary: "Horror podcast score, 14 episodes." },
    ],
  },
  {
    id: "yuna-park",
    name: "Yuna Park",
    location: "Seoul",
    category: "animator",
    genres: ["romance", "dark"],
    tagline: "Motion graphics and illustration for bittersweet stories.",
    bio: "Illustrator and motion designer. I like stories where love and revenge share the same room.",
    skills: ["Motion graphics", "Illustration", "Character design", "After Effects", "Storyboarding"],
    interests: ["love stories", "revenge", "emotional storytelling"],
    experience: "Intermediate",
    years: 4,
    availability: "limited",
    collabPrefs: ["Short project", "Paid", "Remote"],
    lookingFor: ["storyteller"],
    portfolio: [
      { title: "Crimson Promise", kind: "Motion comic", image: thriller, description: "A motion comic about a wedding that becomes a reckoning." },
      { title: "Blossom loop", kind: "Illustration", image: romance, description: "Looping title card." },
    ],
    projects: [
      { title: "Velvet Knife", year: 2024, role: "Motion designer", summary: "Opening titles for a K-drama thriller." },
    ],
  },
  {
    id: "tomas-lindqvist",
    name: "Tomas Lindqvist",
    location: "Gothenburg · Remote",
    category: "content",
    genres: ["adventure", "peaceful"],
    tagline: "Travel films and outdoor stories, edited with patience.",
    bio: "Filmmaker who edits long walks into short films. Slow pacing, natural light, and maps.",
    skills: ["Video editing", "Cinematography", "Drone footage", "Colour grading", "Narration"],
    interests: ["exploration", "nature", "slice of life"],
    experience: "Professional",
    years: 7,
    availability: "booked",
    collabPrefs: ["Paid", "Short project"],
    lookingFor: ["music"],
    portfolio: [
      { title: "North Light", kind: "Travel film", image: peaceful, description: "Twelve minutes on a coastal path in winter." },
    ],
    projects: [
      { title: "Fjord Sessions", year: 2025, role: "Director & editor", summary: "Five-part YouTube series, 900k views." },
    ],
  },
  {
    id: "amara-diallo",
    name: "Amara Diallo",
    location: "Dakar",
    category: "storyteller",
    genres: ["peaceful", "moral"],
    tagline: "Bedtime stories and gentle fables for anxious grown-ups.",
    bio: "Children's author and podcast writer. I write comfort — stories with no villains, just weather.",
    skills: ["Picture book writing", "Audio scripts", "Story development", "Characters", "Editing"],
    interests: ["healing", "cozy", "community"],
    experience: "Emerging",
    years: 2,
    availability: "open",
    collabPrefs: ["Passion project", "Remote", "Short project"],
    lookingFor: ["animator", "music"],
    portfolio: [
      { title: "The Lighthouse Keeper's Cat", kind: "Picture book draft", image: peaceful, description: "A cat keeps the light on while the keeper sleeps." },
    ],
    projects: [
      { title: "Slow Stories", year: 2025, role: "Writer", summary: "Sleep-story podcast, 30 episodes." },
    ],
  },
  {
    id: "dev-malhotra",
    name: "Dev Malhotra",
    location: "Mumbai",
    category: "content",
    genres: ["romance", "adventure"],
    tagline: "Cinematic short-form edits that feel like trailers for your life.",
    bio: "Editor and creator. I turn scripts into vertical mini-films with real cinematic grammar.",
    skills: ["Video editing", "Short-form", "Motion graphics", "Sound design", "Storytelling"],
    interests: ["love stories", "action", "digital content"],
    experience: "Intermediate",
    years: 3,
    availability: "open",
    collabPrefs: ["Short project", "Paid", "Remote"],
    lookingFor: ["storyteller", "music"],
    portfolio: [
      { title: "Monsoon Minutes", kind: "Vertical series", image: video, description: "60-second romances shot in one evening each." },
    ],
    projects: [
      { title: "One Train", year: 2025, role: "Editor", summary: "Viral micro-drama, 4M views." },
    ],
  },
  {
    id: "hana-sato",
    name: "Hana Sato",
    location: "Kyoto · Remote",
    category: "animator",
    genres: ["peaceful", "moral"],
    tagline: "Cozy stop-motion and paper animation.",
    bio: "I build tiny paper worlds and animate them frame by frame. Gentle stories about care.",
    skills: ["Stop-motion", "Paper craft", "Character animation", "Set design", "Illustration"],
    interests: ["cozy", "healing", "community"],
    experience: "Emerging",
    years: 2,
    availability: "open",
    collabPrefs: ["Passion project", "Short project", "Remote"],
    lookingFor: ["storyteller", "music"],
    portfolio: [
      { title: "Paper Harbour", kind: "Stop-motion short", image: peaceful, description: "A paper boat finds its way home." },
    ],
    projects: [
      { title: "Fold", year: 2025, role: "Animator", summary: "Student short, festival screening." },
    ],
  },
  {
    id: "rafael-costa",
    name: "Rafael Costa",
    location: "Lisbon",
    category: "music",
    genres: ["adventure", "romance"],
    tagline: "Orchestral themes for heroes, journeys and reunions.",
    bio: "Orchestral composer. Big brass, soaring strings, and themes you can hum after one listen.",
    skills: ["Orchestration", "Film scoring", "Theme writing", "Mixing", "Background scores"],
    interests: ["fantasy", "exploration", "love stories"],
    experience: "Veteran",
    years: 15,
    availability: "limited",
    collabPrefs: ["Long-term", "Paid"],
    lookingFor: ["animator", "storyteller"],
    portfolio: [
      { title: "Isles Suite", kind: "Orchestral score", image: adventure, description: "Main theme and cues for a fantasy feature pitch." },
    ],
    projects: [
      { title: "Harbour of Kings", year: 2023, role: "Composer", summary: "Score for an animated fantasy feature." },
    ],
  },
];

export const ME_ID = "me";

export const DEFAULT_ME: Creator = {
  id: ME_ID,
  name: "Ira Mukherjee",
  location: "Kolkata · Remote",
  category: "storyteller",
  genres: ["romance", "peaceful"],
  tagline: "Soft romances about people finding their way back to each other.",
  bio: "I write slow, tender love stories and comfort fiction. Currently developing an animated romance short and looking for an animator and a composer.",
  skills: ["Screenwriting", "Characters", "Story development", "Dialogue"],
  interests: ["emotional storytelling", "character development", "love stories"],
  experience: "Intermediate",
  years: 4,
  availability: "open",
  collabPrefs: ["Long-term", "Remote", "Passion project"],
  lookingFor: ["animator", "music"],
  portfolio: [
    { title: "The Last Tram Home", kind: "Short film script", image: romance, description: "Two strangers miss the same tram every night for a year." },
  ],
  projects: [
    { title: "Paper Moons", year: 2025, role: "Writer", summary: "Romance anthology, three stories published online." },
  ],
};

export function findCreator(id: string): Creator | undefined {
  return CREATORS.find((c) => c.id === id);
}
