import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import type { Creator, PortfolioItem } from "@/data/creators";
import { CATEGORIES } from "@/lib/categories";
import { GENRES, genreStyle } from "@/lib/genres";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { fadeUp, stagger } from "@/components/motion";
import { AvailabilityBadge, CategoryLabel, CreatorAvatar, GenreChip, SkillChip } from "./bits";

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <motion.section variants={fadeUp} className="rounded-3xl border border-border bg-card/80 p-6 shadow-soft backdrop-blur">
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</h2>
      <div className="mt-4">{children}</div>
    </motion.section>
  );
}

export function ProfileView({ creator, actions }: { creator: Creator; actions: ReactNode }) {
  const [open, setOpen] = useState<PortfolioItem | null>(null);
  const cat = CATEGORIES[creator.category];

  return (
    <div style={genreStyle(creator.genres)} className="relative">
      {/* genre atmosphere bleeding behind the page */}
      <div className="genre-atmosphere pointer-events-none absolute -inset-x-8 -top-10 h-[520px] rounded-b-[3rem] md:-inset-x-16" />

      <motion.div initial="hidden" animate="show" variants={stagger} className="relative space-y-6">
        <motion.header variants={fadeUp} className="genre-glass rounded-[2rem] p-6 shadow-soft md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <CreatorAvatar creator={creator} size="xl" />
            <div className="min-w-0 flex-1">
              <CategoryLabel category={creator.category} className="text-g-ink" />
              <h1 className="mt-1 font-display text-5xl leading-none text-foreground md:text-6xl">{creator.name}</h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">{creator.tagline}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" /> {creator.location}
                </span>
                <span>
                  {creator.experience} · {creator.years} years
                </span>
                <AvailabilityBadge value={creator.availability} className="text-sm" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 md:flex-col">{actions}</div>
          </div>
        </motion.header>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <Block title="About">
              <p className="text-[15px] leading-relaxed text-foreground">{creator.bio}</p>
            </Block>

            <Block title="Portfolio">
              <div className="grid gap-4 sm:grid-cols-2">
                {creator.portfolio.map((p) => (
                  <motion.button
                    key={p.title}
                    whileHover={{ y: -3 }}
                    onClick={() => setOpen(p)}
                    className="group overflow-hidden rounded-2xl border border-border bg-card text-left shadow-soft transition-shadow hover:shadow-lift"
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={p.image} alt={p.title} loading="lazy" width={1024} height={768} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-medium text-g-ink">{p.kind}</p>
                      <p className="mt-0.5 font-semibold text-foreground">{p.title}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </Block>

            <Block title="Previous projects">
              <ol className="relative space-y-6 border-l border-g-accent/50 pl-6">
                {creator.projects.map((p) => (
                  <li key={p.title} className="relative">
                    <span className="absolute -left-[29px] top-1.5 size-2.5 rounded-full border-2 border-card bg-g-accent" />
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <p className="font-semibold text-foreground">{p.title}</p>
                      <span className="text-xs text-muted-foreground">
                        {p.year} · {p.role}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{p.summary}</p>
                  </li>
                ))}
              </ol>
            </Block>
          </div>

          <div className="space-y-6">
            <Block title="Genre preferences">
              <div className="flex flex-wrap gap-1.5">
                {creator.genres.map((g, i) => (
                  <GenreChip key={g} genre={g} primary={i === 0} className="px-3 py-1 text-sm" />
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Primary: {creator.genres[0] ? GENRES[creator.genres[0]].label : "—"}
              </p>
            </Block>
            <Block title="Skills">
              <div className="flex flex-wrap gap-1.5">
                {creator.skills.map((s) => (
                  <SkillChip key={s}>{s}</SkillChip>
                ))}
              </div>
            </Block>
            <Block title="Creative interests">
              <div className="flex flex-wrap gap-1.5">
                {creator.interests.map((s) => (
                  <span key={s} className="genre-chip rounded-full px-2.5 py-0.5 text-xs">
                    {s}
                  </span>
                ))}
              </div>
            </Block>
            <Block title="Collaboration">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Availability</dt>
                  <dd>
                    <AvailabilityBadge value={creator.availability} />
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Prefers</dt>
                  <dd className="text-right">{creator.collabPrefs.join(", ")}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Looking for</dt>
                  <dd className="text-right">{creator.lookingFor.map((c) => CATEGORIES[c].plural).join(", ")}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Focus</dt>
                  <dd className="text-right">{cat.focus.slice(0, 3).join(", ")}</dd>
                </div>
              </dl>
            </Block>
          </div>
        </div>
      </motion.div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent style={genreStyle(creator.genres)} className="overflow-hidden rounded-3xl p-0 sm:max-w-3xl">
          {open && (
            <>
              <img src={open.image} alt={open.title} width={1024} height={768} className="aspect-[4/3] w-full object-cover" />
              <div className="genre-wash p-6">
                <p className="text-xs font-medium text-g-ink">{open.kind}</p>
                <DialogTitle className="mt-1 font-display text-3xl font-normal">{open.title}</DialogTitle>
                <DialogDescription className="mt-2 text-sm">{open.description}</DialogDescription>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
