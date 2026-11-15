/**
 * Crea-Link app data: the signed-in user, their profile, other creators,
 * collaboration requests (connections) and public projects for the feed.
 * Everything is read from Lovable Cloud and kept fresh with realtime updates.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Creator, PastProject, PortfolioItem } from "@/data/creators";
import { GENRE_COVERS } from "@/data/creators";
import { resolveStorageUrls } from "@/lib/storage-urls";
import { genreKeysForProject } from "@/lib/genre-theme";
import type { Availability, CategoryKey, CollabPref, Experience } from "./categories";
import { GENRE_KEYS, type GenreKey } from "./genres";

export type RequestStatus = "pending" | "accepted" | "declined";

export type CollabRequest = {
  id: string;
  fromId: string;
  toId: string;
  projectTitle: string;
  description: string;
  skills: string[];
  genre: GenreKey;
  createdAt: string;
  status: RequestStatus;
};

export type FeedProject = {
  id: string;
  title: string;
  description: string;
  genres: string[];
  primaryGenre: string;
  genreKeys: GenreKey[];
  status: string;
  ownerId: string;
  ownerName: string;
  requiredRoles: string[];
  memberIds: string[];
  updatedAt: string;
  createdAt: string;
  coverImage?: string;
};

type ProfileRow = {
  id: string;
  username: string | null;
  full_name: string;
  avatar_url: string;
  bio: string;
  tagline: string;
  location: string;
  creator_type: string;
  genres: string[];
  skills: string[];
  interests: string[];
  experience: string;
  years: number;
  availability: string;
  collab_prefs: string[];
  looking_for: string[];
  studio_role: string;
  onboarded: boolean;
};

export type ProfilePatch = Partial<{
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  tagline: string;
  location: string;
  creator_type: CategoryKey;
  genres: GenreKey[];
  skills: string[];
  interests: string[];
  experience: Experience;
  years: number;
  availability: Availability;
  collab_prefs: CollabPref[];
  looking_for: CategoryKey[];
  studio_role: string;
  onboarded: boolean;
}>;

function toCreator(r: ProfileRow, avatarUrl: string, projects: FeedProject[]): Creator {
  const genres = (r.genres ?? []).filter((g): g is GenreKey => (GENRE_KEYS as string[]).includes(g));
  const mine = projects.filter((p) => p.ownerId === r.id || p.memberIds.includes(r.id));
  const portfolio: PortfolioItem[] = mine.slice(0, 4).map((p) => ({
    title: p.title,
    kind: p.primaryGenre,
    image: p.coverImage ?? GENRE_COVERS[p.genreKeys[0] ?? "peaceful"],
    description: p.description,
  }));
  const pastProjects: PastProject[] = mine.map((p) => ({
    title: p.title,
    year: new Date(p.createdAt).getFullYear(),
    role: p.ownerId === r.id ? "Project lead" : "Collaborator",
    summary: p.description,
  }));
  return {
    id: r.id,
    name: r.full_name || r.username || "New creator",
    username: r.username,
    avatarUrl,
    onboarded: r.onboarded,
    location: r.location || "Remote",
    category: (r.creator_type as CategoryKey) || "storyteller",
    genres: genres.length ? genres : ["peaceful"],
    tagline: r.tagline || "",
    bio: r.bio || "",
    skills: r.skills ?? [],
    interests: r.interests ?? [],
    experience: (r.experience as Experience) || "Emerging",
    years: r.years ?? 0,
    availability: (r.availability as Availability) || "open",
    collabPrefs: (r.collab_prefs ?? []) as CollabPref[],
    lookingFor: (r.looking_for ?? []) as CategoryKey[],
    portfolio,
    projects: pastProjects,
  };
}

type StoreValue = {
  user: User | null;
  authReady: boolean;
  /** true once the signed-in user's profile and lists have loaded */
  hydrated: boolean;
  me: Creator | null;
  myProfile: ProfileRow | null;
  creators: Creator[];
  projects: FeedProject[];
  requests: CollabRequest[];
  updateMe: (patch: ProfilePatch) => Promise<void>;
  sendRequest: (input: Omit<CollabRequest, "id" | "fromId" | "createdAt" | "status">) => Promise<void>;
  respond: (id: string, status: RequestStatus) => Promise<void>;
  withdraw: (id: string) => Promise<void>;
  getPerson: (id: string) => Creator | undefined;
  refresh: () => Promise<void>;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [avatars, setAvatars] = useState<Map<string, string>>(new Map());
  const [projects, setProjects] = useState<FeedProject[]>([]);
  const [requests, setRequests] = useState<CollabRequest[]>([]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = user?.id;

  const refresh = useCallback(async () => {
    if (!userId) {
      setProfiles([]);
      setProjects([]);
      setRequests([]);
      setHydrated(false);
      return;
    }
    const [profRes, projRes, memRes, connRes] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase
        .from("projects")
        .select("id, title, description, genres, primary_genre, status, owner_id, owner_name, required_roles, portfolio, is_draft, created_at, updated_at")
        .order("updated_at", { ascending: false })
        .limit(200),
      supabase.from("project_members").select("project_id, user_id"),
      supabase.from("connections").select("*").order("created_at", { ascending: false }),
    ]);
    const rows = (profRes.data ?? []) as ProfileRow[];
    const members = memRes.data ?? [];
    const coverRefs: string[] = [];
    const projList: FeedProject[] = (projRes.data ?? []).map((p) => {
      const firstImage = ((p.portfolio as { previewImageUrl?: string }[]) ?? []).find((i) => i.previewImageUrl)?.previewImageUrl;
      if (firstImage) coverRefs.push(firstImage);
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        genres: p.genres ?? [],
        primaryGenre: p.primary_genre,
        genreKeys: genreKeysForProject(p.primary_genre, p.genres ?? []),
        status: p.status,
        ownerId: p.owner_id,
        ownerName: p.owner_name,
        requiredRoles: p.required_roles ?? [],
        memberIds: members.filter((m) => m.project_id === p.id).map((m) => m.user_id),
        updatedAt: p.updated_at,
        createdAt: p.created_at,
        coverImage: firstImage,
      };
    });
    const urls = await resolveStorageUrls([...rows.map((r) => r.avatar_url), ...coverRefs]);
    for (const p of projList) if (p.coverImage) p.coverImage = urls.get(p.coverImage);
    setAvatars(urls);
    setProfiles(rows);
    setProjects(projList);
    setRequests(
      (connRes.data ?? []).map((c) => ({
        id: c.id,
        fromId: c.from_id,
        toId: c.to_id,
        projectTitle: c.project_title || "Collaboration",
        description: c.description || c.note || "",
        skills: c.skills ?? [],
        genre: ((GENRE_KEYS as string[]).includes(c.genre) ? c.genre : "peaceful") as GenreKey,
        createdAt: c.created_at,
        status: c.status as RequestStatus,
      })),
    );
    setHydrated(true);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      void refresh();
      return;
    }
    let timer: ReturnType<typeof setTimeout> | null = null;
    const queue = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void refresh(), 250);
    };
    const channel = supabase
      .channel(`app-store-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, queue)
      .on("postgres_changes", { event: "*", schema: "public", table: "connections" }, queue)
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, queue)
      .on("postgres_changes", { event: "*", schema: "public", table: "project_members" }, queue)
      .subscribe();
    void refresh();
    return () => {
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  const allCreators = useMemo(
    () => profiles.map((r) => toCreator(r, avatars.get(r.avatar_url) ?? "", projects)),
    [profiles, avatars, projects],
  );
  const me = useMemo(() => allCreators.find((c) => c.id === userId) ?? null, [allCreators, userId]);
  const myProfile = useMemo(() => profiles.find((p) => p.id === userId) ?? null, [profiles, userId]);
  const creators = useMemo(() => allCreators.filter((c) => c.id !== userId && c.onboarded), [allCreators, userId]);

  const updateMe = useCallback<StoreValue["updateMe"]>(
    async (patch) => {
      if (!userId) throw new Error("Please sign in first.");
      const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
      if (error) {
        if (error.code === "23505") throw new Error("That username is already taken.");
        throw new Error(error.message);
      }
      await refresh();
    },
    [userId, refresh],
  );

  const sendRequest = useCallback<StoreValue["sendRequest"]>(
    async (input) => {
      if (!userId) throw new Error("Please sign in first.");
      const { error } = await supabase.from("connections").insert({
        from_id: userId,
        to_id: input.toId,
        project_title: input.projectTitle.slice(0, 140),
        description: input.description.slice(0, 1000),
        skills: input.skills.slice(0, 10),
        genre: input.genre,
      });
      if (error) throw new Error(error.message);
      await refresh();
    },
    [userId, refresh],
  );

  const respond = useCallback<StoreValue["respond"]>(
    async (id, status) => {
      const { error } = await supabase.from("connections").update({ status }).eq("id", id);
      if (error) throw new Error(error.message);
      await refresh();
    },
    [refresh],
  );

  const withdraw = useCallback<StoreValue["withdraw"]>(
    async (id) => {
      const { error } = await supabase.from("connections").delete().eq("id", id);
      if (error) throw new Error(error.message);
      await refresh();
    },
    [refresh],
  );

  const getPerson = useCallback((id: string) => allCreators.find((c) => c.id === id), [allCreators]);

  const value = useMemo<StoreValue>(
    () => ({
      user,
      authReady,
      hydrated,
      me,
      myProfile,
      creators,
      projects,
      requests,
      updateMe,
      sendRequest,
      respond,
      withdraw,
      getPerson,
      refresh,
    }),
    [user, authReady, hydrated, me, myProfile, creators, projects, requests, updateMe, sendRequest, respond, withdraw, getPerson, refresh],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

/** Relationship between the current user and another creator. */
export function useConnection(creatorId: string) {
  const { requests, user } = useStore();
  const myId = user?.id;
  const related = requests.filter(
    (r) => (r.fromId === myId && r.toId === creatorId) || (r.toId === myId && r.fromId === creatorId),
  );
  if (related.some((r) => r.status === "accepted")) return "collaborating" as const;
  if (related.some((r) => r.status === "pending" && r.fromId === myId)) return "requested" as const;
  if (related.some((r) => r.status === "pending" && r.toId === myId)) return "incoming" as const;
  return "none" as const;
}

const EMPTY_ME: Creator = {
  id: "",
  name: "You",
  location: "",
  category: "storyteller",
  genres: ["peaceful"],
  tagline: "",
  bio: "",
  skills: [],
  interests: [],
  experience: "Emerging",
  years: 0,
  availability: "open",
  collabPrefs: [],
  lookingFor: [],
  portfolio: [],
  projects: [],
};

/** The signed-in creator (never null inside the authenticated app shell). */
export function useMe(): Creator {
  return useStore().me ?? EMPTY_ME;
}
