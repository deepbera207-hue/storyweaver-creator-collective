import { useMemo, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, FolderPlus, Search, Sparkles, Wand2, BookOpenText, Users } from "lucide-react";
import { CATEGORIES, CATEGORY_KEYS } from "@/lib/categories";
import { GENRE_KEYS, GENRES, genreStyle } from "@/lib/genres";
import { briefFromProfile, rankMatches } from "@/lib/matchmaking";
import { useMe, useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { fadeUp, stagger } from "@/components/motion";
import { CreatorCard, CreatorCardSkeleton } from "@/components/creator/CreatorCard";
import { MatchCard } from "@/components/match/MatchCard";
import { ProjectFeedCard } from "@/components/feed/ProjectFeedCard";

export const Route = createFileRoute("/_authenticated/feed")({
  head: () => ({
    meta: [
      { title: "Your feed — Crea-Link" },
      { name: "description", content: "Discover creators, shared projects and collaborators who share your genres on Crea-Link." },
      { property: "og:title", content: "Your feed — Crea-Link" },
      { property: "og:description", content: "Discover creators, shared projects and collaborators who share your genres on Crea-Link." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Feed,
});

function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="font-display text-3xl text-foreground md:text-4xl">{title}</h2>
      {action}
    </div>
  );
}

function Welcome() {
  const me = useMe();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  return (
    <section style={genreStyle(me.genres)} className="relative overflow-hidden rounded-[2rem] border border-border bg-card px-6 py-10 md:px-12 md:py-14">
      <div className="hero-atmosphere pointer-events-none absolute inset-0 opacity-80" />
      <motion.div initial="hidden" animate="show" variants={stagger} className="relative">
        <motion.p variants={fadeUp} className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Welcome back
        </motion.p>
        <motion.h1 variants={fadeUp} className="mt-3 font-display text-5xl leading-[1] text-foreground md:text-6xl">
          Hello, {me.name.split(" ")[0]}. <em className="italic text-muted-foreground">What will you create today?</em>
        </motion.h1>
        <motion.form
          variants={fadeUp}
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/explore", search: q.trim() ? { q: q.trim() } : {} });
          }}
          className="genre-glass mt-7 flex max-w-xl items-center gap-2 rounded-full p-1.5 shadow-soft"
        >
          <Search className="ml-3 size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search creators or projects — “romance animator”, “fantasy”…"
            aria-label="Search creators and projects"
            className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button type="submit">Search</Button>
        </motion.form>
        <motion.div variants={fadeUp} className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { to: "/projects" as const, icon: FolderPlus, label: "Start or join a project", tone: "adventure" as const },
            { to: "/studio" as const, icon: Users, label: "Open my studio", tone: "peaceful" as const },
            { to: "/assistant" as const, icon: Wand2, label: "Ask the AI Story Assistant", tone: "romance" as const },
            { to: "/research" as const, icon: BookOpenText, label: "Research for my story", tone: "moral" as const },
          ].map((a) => (
            <Link
              key={a.to}
              to={a.to}
              style={genreStyle([a.tone])}
              className="genre-glass group flex items-center gap-3 rounded-2xl p-3.5 text-sm font-medium text-foreground transition-all hover:-translate-y-0.5 hover:shadow-soft"
            >
              <span className="genre-chip flex size-9 items-center justify-center rounded-xl">
                <a.icon className="size-4" />
              </span>
              {a.label}
              <ArrowRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

function Feed() {
  const { creators, projects, hydrated, user } = useStore();
  const me = useMe();
  const matches = useMemo(() => rankMatches(briefFromProfile(me), creators, 3), [me, creators]);
  const sharedGenre = useMemo(
    () => creators.filter((c) => c.genres.some((g) => me.genres.includes(g))).slice(0, 6),
    [creators, me.genres],
  );
  const fresh = creators.slice(0, 6);
  const publicProjects = projects.slice(0, 6);
  const myProjects = projects.filter((p) => p.ownerId === user?.id || p.memberIds.includes(user?.id ?? ""));

  return (
    <div className="space-y-14 md:space-y-16">
      <Welcome />

      <section>
        <SectionTitle
          title="Shared projects"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/projects">
                All projects <ArrowRight />
              </Link>
            </Button>
          }
        />
        {!hydrated ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <CreatorCardSkeleton key={i} />
            ))}
          </div>
        ) : publicProjects.length === 0 ? (
          <EmptyCard
            title="No projects yet"
            text="Be the first to start a story project — others will see it here and can ask to join."
            cta={{ to: "/projects", label: "Create a project" }}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {publicProjects.map((p, i) => (
              <ProjectFeedCard key={p.id} project={p} index={i} />
            ))}
          </div>
        )}
        {myProjects.length > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            You're part of {myProjects.length} project{myProjects.length > 1 ? "s" : ""}.{" "}
            <Link to="/studio" className="font-medium text-foreground underline-offset-4 hover:underline">
              Open your studio
            </Link>
          </p>
        )}
      </section>

      {matches.length > 0 && (
        <section className="match-wash relative overflow-hidden rounded-[2rem] border border-match-b p-6 md:p-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <span className="match-shimmer flex size-8 items-center justify-center rounded-xl">
                <Sparkles className="size-4 text-match-ink" />
              </span>
              <h2 className="mt-4 font-display text-4xl text-foreground md:text-5xl">
                Matched to <span className="match-gradient-text italic">your story</span>
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Ranked from your genres, interests and who you're looking for, using transparent matching rules.
              </p>
            </div>
            <Button asChild>
              <Link to="/match">
                Refine my matches <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {matches.map((m, i) => (
              <MatchCard key={m.creator.id} match={m} compact index={i} />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle
          title={sharedGenre.length ? "People who share your genres" : "Creators on Crea-Link"}
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/explore">
                Discover everyone <ArrowRight />
              </Link>
            </Button>
          }
        />
        {hydrated && creators.length === 0 ? (
          <EmptyCard
            title="You're one of the first creators here"
            text="Crea-Link only shows real people. As friends and collaborators sign up, they'll appear in your feed."
            cta={{ to: "/projects", label: "Start a project meanwhile" }}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(sharedGenre.length ? sharedGenre : fresh).map((c, i) => (
              <CreatorCard key={c.id} creator={c} index={i} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle title="Browse by craft" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORY_KEYS.map((k) => {
            const cat = CATEGORIES[k];
            const Icon = cat.icon;
            const count = creators.filter((c) => c.category === k).length;
            return (
              <motion.div key={k} whileHover={{ y: -4 }}>
                <Link
                  to="/explore"
                  search={{ category: k }}
                  style={genreStyle([cat.tone])}
                  className="genre-wash group flex h-full flex-col rounded-3xl border border-border p-5 shadow-soft transition-shadow hover:shadow-lift"
                >
                  <span className="genre-chip flex size-10 items-center justify-center rounded-2xl">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-display text-2xl text-foreground">{cat.plural}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{cat.blurb}</p>
                  <span className="mt-auto flex items-center gap-1 pt-4 text-sm font-medium text-foreground">
                    {count} {count === 1 ? "creator" : "creators"}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {GENRE_KEYS.map((g) => (
            <Link
              key={g}
              to="/explore"
              search={{ genre: g }}
              style={genreStyle([g])}
              className="genre-chip rounded-full px-3 py-1 text-xs font-medium transition-transform hover:-translate-y-0.5"
            >
              {GENRES[g].label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function EmptyCard({ title, text, cta }: { title: string; text: string; cta: { to: "/projects"; label: string } }) {
  return (
    <div className="surface rounded-3xl p-10 text-center">
      <p className="font-display text-3xl">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{text}</p>
      <Button asChild className="mt-6">
        <Link to={cta.to}>{cta.label}</Link>
      </Button>
    </div>
  );
}
