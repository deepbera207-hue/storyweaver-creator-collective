import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, RotateCcw, Sparkles, X } from "lucide-react";
import { CREATORS } from "@/data/creators";
import {
  CATEGORIES,
  CATEGORY_KEYS,
  COLLAB_PREFS,
  EXPERIENCE_LEVELS,
  type CategoryKey,
  type CollabPref,
  type Experience,
} from "@/lib/categories";
import { GENRE_KEYS, GENRES, genreStyle, type GenreKey } from "@/lib/genres";
import { briefFromProfile, rankMatches, type MatchBrief } from "@/lib/matchmaking";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DemoBadge, PageHeader } from "@/components/motion";
import { MatchCard } from "@/components/match/MatchCard";

export const Route = createFileRoute("/match")({
  head: () => ({
    meta: [
      { title: "Creative matchmaking — Ensemble" },
      { name: "description", content: "Describe your project and see collaborators ranked by genre, skills, experience and preferences." },
      { property: "og:title", content: "Creative matchmaking — Ensemble" },
      { property: "og:description", content: "Describe your project and see collaborators ranked by genre, skills, experience and preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MatchPage,
});

const SKILL_SUGGESTIONS = [
  "Character animation",
  "Storyboarding",
  "Film scoring",
  "Worldbuilding",
  "Video editing",
  "Motion graphics",
  "Screenwriting",
  "Sound design",
];

function Toggle({
  on,
  onClick,
  children,
  genre,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
  genre?: GenreKey;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      style={genre ? genreStyle([genre]) : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all active:scale-95",
        on
          ? genre
            ? "genre-chip ring-2 ring-g-accent/40"
            : "border-match-ink/30 bg-card text-match-ink shadow-soft"
          : "border-border bg-card/60 text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function MatchPage() {
  const { me, hydrated } = useStore();
  const [brief, setBrief] = useState<MatchBrief>(() => briefFromProfile(me));
  const [skillText, setSkillText] = useState("");
  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    if (hydrated) setBrief(briefFromProfile(me));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const key = JSON.stringify(brief);
  useEffect(() => {
    setThinking(true);
    const t = setTimeout(() => setThinking(false), 450);
    return () => clearTimeout(t);
  }, [key]);

  const results = useMemo(() => rankMatches(brief, CREATORS, 6), [brief]);

  const toggleIn = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const addSkill = (s: string) => {
    const v = s.trim();
    if (v && !brief.skills.includes(v)) setBrief((b) => ({ ...b, skills: [...b.skills, v] }));
    setSkillText("");
  };

  const seekingLabel = brief.seeking === "any" ? "collaborators" : CATEGORIES[brief.seeking].plural.toLowerCase();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="AI-assisted matchmaking"
        title={
          <>
            Find your <span className="match-gradient-text italic">creative match</span>
          </>
        }
        description="Describe your project and we'll rank compatible creators by genre, interests, skills, experience and how they like to work."
      >
        <DemoBadge label="Demo · rule-based, not live AI" />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <motion.aside
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="match-wash h-fit space-y-6 rounded-3xl border border-match-b p-6 lg:sticky lg:top-32"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Your project</h2>
            <Button variant="ghost" size="sm" onClick={() => setBrief(briefFromProfile(me))}>
              <RotateCcw /> From my profile
            </Button>
          </div>

          <Field label="I'm looking for">
            <Toggle on={brief.seeking === "any"} onClick={() => setBrief((b) => ({ ...b, seeking: "any" }))}>
              Anyone
            </Toggle>
            {CATEGORY_KEYS.map((k) => {
              const Icon = CATEGORIES[k].icon;
              return (
                <Toggle key={k} on={brief.seeking === k} onClick={() => setBrief((b) => ({ ...b, seeking: k as CategoryKey }))}>
                  <Icon className="size-3.5" /> {CATEGORIES[k].label}
                </Toggle>
              );
            })}
          </Field>

          <Field label="Genres (first = primary)">
            {GENRE_KEYS.map((g) => (
              <Toggle key={g} genre={g} on={brief.genres.includes(g)} onClick={() => setBrief((b) => ({ ...b, genres: toggleIn(b.genres, g) }))}>
                {brief.genres[0] === g && <span className="size-1.5 rounded-full bg-g-ink/70" />}
                {GENRES[g].short}
              </Toggle>
            ))}
          </Field>

          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Skills you need</p>
            <div className="flex flex-wrap gap-1.5">
              <AnimatePresence initial={false}>
                {brief.skills.map((s) => (
                  <motion.button
                    key={s}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => setBrief((b) => ({ ...b, skills: b.skills.filter((x) => x !== s) }))}
                    className="inline-flex items-center gap-1 rounded-full border border-match-ink/30 bg-card px-3 py-1.5 text-xs font-medium text-match-ink"
                  >
                    {s} <X className="size-3" />
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addSkill(skillText);
              }}
              className="flex gap-2"
            >
              <input
                value={skillText}
                onChange={(e) => setSkillText(e.target.value)}
                placeholder="e.g. watercolour"
                aria-label="Add a skill"
                className="h-9 flex-1 rounded-full border border-border bg-card px-4 text-sm outline-none focus:border-ring"
              />
              <Button type="submit" size="icon" variant="outline" aria-label="Add skill">
                <Plus />
              </Button>
            </form>
            <div className="flex flex-wrap gap-1">
              {SKILL_SUGGESTIONS.filter((s) => !brief.skills.includes(s))
                .slice(0, 5)
                .map((s) => (
                  <button key={s} onClick={() => addSkill(s)} className="rounded-full px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-card hover:text-foreground">
                    + {s}
                  </button>
                ))}
            </div>
          </div>

          <Field label="Experience">
            <Toggle on={brief.experience === "any"} onClick={() => setBrief((b) => ({ ...b, experience: "any" }))}>
              Any
            </Toggle>
            {EXPERIENCE_LEVELS.map((e) => (
              <Toggle key={e} on={brief.experience === e} onClick={() => setBrief((b) => ({ ...b, experience: e as Experience }))}>
                {e}
              </Toggle>
            ))}
          </Field>

          <Field label="How you like to work">
            {COLLAB_PREFS.map((p) => (
              <Toggle key={p} on={brief.preferences.includes(p)} onClick={() => setBrief((b) => ({ ...b, preferences: toggleIn(b.preferences, p as CollabPref) }))}>
                {p}
              </Toggle>
            ))}
          </Field>
        </motion.aside>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground" aria-live="polite">
            <span className={cn("match-shimmer flex size-7 items-center justify-center rounded-lg", thinking && "animate-pulse")}>
              <Sparkles className="size-3.5 text-match-ink" />
            </span>
            {thinking ? (
              <span>Finding compatible {seekingLabel}…</span>
            ) : (
              <span>
                Top {results.length} {seekingLabel} for your project
              </span>
            )}
          </div>
          {thinking ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="match-wash h-56 animate-pulse rounded-3xl border border-match-b/60" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="surface rounded-3xl p-10 text-center text-sm text-muted-foreground">
              No creators in that craft yet. Try “Anyone”.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {results.map((m, i) => (
                <MatchCard key={m.creator.id} match={m} index={i} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
