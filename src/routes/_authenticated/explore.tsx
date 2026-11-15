import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { CREATORS } from "@/data/creators";
import {
  AVAILABILITY,
  CATEGORIES,
  CATEGORY_KEYS,
  EXPERIENCE_LEVELS,
  type Availability,
  type CategoryKey,
  type Experience,
} from "@/lib/categories";
import { GENRE_KEYS, GENRES, genreStyle, type GenreKey } from "@/lib/genres";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/motion";
import { CreatorCard, CreatorCardSkeleton } from "@/components/creator/CreatorCard";

type ExploreSearch = {
  q?: string | undefined;
  category?: CategoryKey | undefined;
  genre?: GenreKey | undefined;
  experience?: Experience | undefined;
  availability?: Availability | undefined;
};

const pick = <T extends string>(v: unknown, list: readonly T[]) =>
  typeof v === "string" && (list as readonly string[]).includes(v) ? (v as T) : undefined;

export const Route = createFileRoute("/explore")({
  validateSearch: (s: Record<string, unknown>): ExploreSearch => ({
    q: typeof s["q"] === "string" && s["q"] ? s["q"] : undefined,
    category: pick(s["category"], CATEGORY_KEYS),
    genre: pick(s["genre"], GENRE_KEYS),
    experience: pick(s["experience"], EXPERIENCE_LEVELS),
    availability: pick(s["availability"], Object.keys(AVAILABILITY) as Availability[]),
  }),
  head: () => ({
    meta: [
      { title: "Explore creators — Ensemble" },
      { name: "description", content: "Search and filter creators by name, genre, skills, experience, craft and availability." },
      { property: "og:title", content: "Explore creators — Ensemble" },
      { property: "og:description", content: "Search and filter creators by name, genre, skills, experience, craft and availability." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Explore,
});

function matchesQuery(q: string, c: (typeof CREATORS)[number]) {
  const hay = [
    c.name,
    c.tagline,
    c.bio,
    CATEGORIES[c.category].label,
    CATEGORIES[c.category].plural,
    c.experience,
    ...c.skills,
    ...c.interests,
    ...c.genres.flatMap((g) => [GENRES[g].label, GENRES[g].short, ...GENRES[g].themes]),
  ]
    .join(" ")
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => hay.includes(word));
}

function Explore() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/explore" });
  const [text, setText] = useState(search.q ?? "");
  const [updating, setUpdating] = useState(true);

  const set = (patch: Partial<ExploreSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true, resetScroll: false });

  // keep input in sync with back/forward and header search
  useEffect(() => setText(search.q ?? ""), [search.q]);

  // debounce typing into the URL
  useEffect(() => {
    const t = setTimeout(() => {
      if ((search.q ?? "") !== text.trim()) set({ q: text.trim() || undefined });
    }, 220);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  // brief skeleton when results change
  const key = JSON.stringify(search);
  useEffect(() => {
    setUpdating(true);
    const t = setTimeout(() => setUpdating(false), 260);
    return () => clearTimeout(t);
  }, [key]);

  const results = useMemo(
    () =>
      CREATORS.filter(
        (c) =>
          (!search.q || matchesQuery(search.q, c)) &&
          (!search.category || c.category === search.category) &&
          (!search.genre || c.genres.includes(search.genre)) &&
          (!search.experience || c.experience === search.experience) &&
          (!search.availability || c.availability === search.availability),
      ),
    [search],
  );

  const active = [search.q, search.category, search.genre, search.experience, search.availability].filter(Boolean).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Explore Creators"
        title="Everyone, in one place."
        description="Search by name, genre, skill or feeling. Results update as you type."
      />

      <div className="surface z-30 space-y-4 rounded-3xl p-4 md:sticky md:top-[7.25rem] md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Search names, skills, genres…"
              aria-label="Search creators"
              className="h-11 w-full rounded-full border border-border bg-background pl-11 pr-10 text-sm outline-none transition-all focus:border-ring focus:bg-card"
            />
            {text && (
              <button aria-label="Clear search" onClick={() => setText("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted">
                <X className="size-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterSelect
              placeholder="Experience"
              value={search.experience}
              options={EXPERIENCE_LEVELS.map((e) => ({ value: e, label: e }))}
              onChange={(v) => set({ experience: v as Experience | undefined })}
            />
            <FilterSelect
              placeholder="Availability"
              value={search.availability}
              options={(Object.keys(AVAILABILITY) as Availability[]).map((a) => ({ value: a, label: AVAILABILITY[a].label }))}
              onChange={(v) => set({ availability: v as Availability | undefined })}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="mr-1 size-4 text-muted-foreground" />
          {CATEGORY_KEYS.map((k) => {
            const Icon = CATEGORIES[k].icon;
            const on = search.category === k;
            return (
              <Chip key={k} on={on} onClick={() => set({ category: on ? undefined : k })}>
                <Icon className="size-3.5" /> {CATEGORIES[k].plural}
              </Chip>
            );
          })}
          <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
          {GENRE_KEYS.map((g) => {
            const on = search.genre === g;
            return (
              <Chip key={g} on={on} genre={g} onClick={() => set({ genre: on ? undefined : g })}>
                {GENRES[g].short}
              </Chip>
            );
          })}
          <AnimatePresence>
            {active > 0 && (
              <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setText("");
                    navigate({ search: {}, replace: true });
                  }}
                >
                  <X /> Clear all
                </Button>
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {results.length} {results.length === 1 ? "creator" : "creators"}
        {search.q && (
          <>
            {" "}
            for “<span className="text-foreground">{search.q}</span>”
          </>
        )}
      </p>

      {updating ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: Math.max(3, Math.min(6, results.length)) }).map((_, i) => (
            <CreatorCardSkeleton key={i} />
          ))}
        </div>
      ) : results.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="surface rounded-3xl p-12 text-center">
          <p className="font-display text-3xl">No one matches that yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">Try fewer filters or a broader word like “fantasy” or “editing”.</p>
          <Button className="mt-6" variant="outline" onClick={() => (setText(""), navigate({ search: {}, replace: true }))}>
            Reset filters
          </Button>
        </motion.div>
      ) : (
        <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {results.map((c, i) => (
              <CreatorCard key={c.id} creator={c} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

function Chip({
  on,
  genre,
  onClick,
  children,
}: {
  on: boolean;
  genre?: GenreKey;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      style={genre ? genreStyle([genre]) : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95",
        on
          ? genre
            ? "genre-chip shadow-soft ring-2 ring-g-accent/40"
            : "border-primary bg-primary text-primary-foreground"
          : genre
            ? "border-border bg-card text-g-ink hover:bg-g-soft"
            : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function FilterSelect({
  placeholder,
  value,
  options,
  onChange,
}: {
  placeholder: string;
  value?: string | undefined;
  options: { value: string; label: string }[];
  onChange: (v: string | undefined) => void;
}) {
  return (
    <Select value={value ?? "all"} onValueChange={(v) => onChange(v === "all" ? undefined : v)}>
      <SelectTrigger aria-label={placeholder} className={cn("h-11 w-[170px] rounded-full bg-background", value && "border-ring bg-card")}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-2xl">
        <SelectItem value="all">Any {placeholder.toLowerCase()}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
