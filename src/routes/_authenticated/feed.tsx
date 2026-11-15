import { useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { CREATORS } from "@/data/creators";
import { CATEGORIES, CATEGORY_KEYS } from "@/lib/categories";
import { GENRE_KEYS, GENRES, genreStyle } from "@/lib/genres";
import { briefFromProfile, rankMatches } from "@/lib/matchmaking";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { fadeUp, stagger } from "@/components/motion";
import { CreatorCard } from "@/components/creator/CreatorCard";
import { AvailabilityBadge, CategoryLabel, ConnectButton, CreatorAvatar, GenreChip } from "@/components/creator/bits";
import { MatchCard } from "@/components/match/MatchCard";

export const Route = createFileRoute("/_authenticated/_authenticated/feed")({
  head: () => ({
    meta: [
      { title: "Discover creators — Crea-Link" },
      {
        name: "description",
        content: "Discover storytellers, animators, music producers and content creators, and find your next creative partner.",
      },
      { property: "og:title", content: "Discover creators — Crea-Link" },
      {
        property: "og:description",
        content: "Discover storytellers, animators, music producers and content creators, and find your next creative partner.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Discover,
});

function Hero() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card px-6 py-14 md:px-14 md:py-20">
      <div className="hero-atmosphere pointer-events-none absolute inset-0 opacity-90" />
      <motion.div initial="hidden" animate="show" variants={stagger} className="relative max-w-3xl">
        <motion.p variants={fadeUp} className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Creator Discovery & Matchmaking
        </motion.p>
        <motion.h1 variants={fadeUp} className="mt-4 font-display text-5xl leading-[0.98] text-foreground md:text-7xl">
          Find the people your story <em className="italic text-muted-foreground">has been waiting for.</em>
        </motion.h1>
        <motion.p variants={fadeUp} className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
          Storytellers, animators, music producers and content creators — discover each other, share your work and start
          something together.
        </motion.p>
        <motion.form
          variants={fadeUp}
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/explore", search: q.trim() ? { q: q.trim() } : {} });
          }}
          className="genre-glass mt-8 flex max-w-xl items-center gap-2 rounded-full p-1.5 shadow-soft"
        >
          <Search className="ml-3 size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Try “romance animator” or “orchestral”"
            aria-label="Search creators"
            className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button type="submit">Search</Button>
        </motion.form>
        <motion.div variants={fadeUp} className="mt-5 flex flex-wrap gap-2">
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
        </motion.div>
      </motion.div>
    </section>
  );
}

function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="font-display text-3xl text-foreground md:text-4xl">{title}</h2>
      {action}
    </div>
  );
}

function Featured() {
  const featured = CREATORS.filter((c) => c.featured);
  return (
    <section>
      <SectionTitle
        title="Featured creators"
        action={
          <Button asChild variant="ghost" size="sm">
            <Link to="/explore">
              See everyone <ArrowRight />
            </Link>
          </Button>
        }
      />
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        variants={stagger}
        className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 md:-mx-8 md:px-8 [scrollbar-width:none]"
      >
        {featured.map((c) => (
          <motion.article
            key={c.id}
            variants={fadeUp}
            whileHover={{ y: -4 }}
            style={genreStyle(c.genres)}
            className="group relative w-[300px] shrink-0 snap-start overflow-hidden rounded-[1.75rem] border border-border shadow-soft transition-shadow hover:shadow-lift md:w-[340px]"
          >
            <Link to="/creators/$creatorId" params={{ creatorId: c.id }} className="block aspect-[4/5]">
              <img
                src={c.portfolio[0]?.image}
                alt={c.portfolio[0]?.title ?? c.name}
                loading="lazy"
                width={1024}
                height={768}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
              />
            </Link>
            <div className="genre-glass absolute inset-x-3 bottom-3 rounded-[1.25rem] p-4">
              <div className="flex items-center gap-3">
                <CreatorAvatar creator={c} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
                  <CategoryLabel category={c.category} />
                </div>
                {c.genres[0] && <GenreChip genre={c.genres[0]} />}
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{c.tagline}</p>
              <div className="mt-3 flex items-center justify-between">
                <AvailabilityBadge value={c.availability} />
                <ConnectButton creator={c} />
              </div>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}

function Categories() {
  return (
    <section>
      <SectionTitle title="Browse by craft" />
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        variants={stagger}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {CATEGORY_KEYS.map((k) => {
          const cat = CATEGORIES[k];
          const Icon = cat.icon;
          const count = CREATORS.filter((c) => c.category === k).length;
          return (
            <motion.div key={k} variants={fadeUp} whileHover={{ y: -4 }}>
              <Link
                to="/explore"
                search={{ category: k }}
                style={genreStyle([cat.tone])}
                className="genre-wash group flex h-full flex-col rounded-3xl border border-border p-6 shadow-soft transition-shadow hover:shadow-lift"
              >
                <span className="genre-chip flex size-11 items-center justify-center rounded-2xl">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 font-display text-2xl text-foreground">{cat.plural}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{cat.blurb}</p>
                <div className="mt-4 flex flex-wrap gap-1">
                  {cat.focus.map((f) => (
                    <span key={f} className="text-xs text-g-ink after:ml-1 after:text-muted-foreground after:content-['·'] last:after:content-['']">
                      {f}
                    </span>
                  ))}
                </div>
                <span className="mt-auto flex items-center gap-1 pt-5 text-sm font-medium text-foreground">
                  {count} creators <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}

function MatchTeaser() {
  const { me } = useStore();
  const matches = rankMatches(briefFromProfile(me), CREATORS, 3);
  return (
    <section className="match-wash relative overflow-hidden rounded-[2rem] border border-match-b p-6 md:p-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <div className="flex items-center gap-2">
            <span className="match-shimmer flex size-8 items-center justify-center rounded-xl">
              <Sparkles className="size-4 text-match-ink" />
            </span>
          </div>
          <h2 className="mt-4 font-display text-4xl text-foreground md:text-5xl">
            Matched to <span className="match-gradient-text italic">your story</span>
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Based on your genres, interests and what you're looking for. Scores come from simple rules on sample data — not a
            live AI yet.
          </p>
        </div>
        <Button asChild variant="default">
          <Link to="/match">
            Refine my matches <ArrowRight />
          </Link>
        </Button>
      </div>
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={stagger}
        className="mt-8 grid gap-4 md:grid-cols-3"
      >
        {matches.map((m, i) => (
          <MatchCard key={m.creator.id} match={m} compact index={i} />
        ))}
      </motion.div>
    </section>
  );
}

function Discover() {
  const fresh = CREATORS.filter((c) => !c.featured).slice(0, 6);
  return (
    <div className="space-y-16 md:space-y-20">
      <Hero />
      <Featured />
      <MatchTeaser />
      <Categories />
      <section>
        <SectionTitle
          title="New to the ensemble"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/explore">
                Explore all <ArrowRight />
              </Link>
            </Button>
          }
        />
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {fresh.map((c, i) => (
            <CreatorCard key={c.id} creator={c} index={i} />
          ))}
        </motion.div>
      </section>
    </div>
  );
}
