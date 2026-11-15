import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { Creator } from "@/data/creators";
import { genreStyle } from "@/lib/genres";
import { Button } from "@/components/ui/button";
import { ease } from "@/components/motion";
import { AvailabilityBadge, CategoryLabel, ConnectButton, CreatorAvatar, GenreChip, SkillChip } from "./bits";

export function CreatorCard({ creator, index = 0 }: { creator: Creator; index?: number }) {
  const cover = creator.portfolio[0];
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.45, delay: index * 0.05, ease } }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2 } }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      style={genreStyle(creator.genres)}
      className="genre-wash group flex flex-col overflow-hidden rounded-3xl border border-border shadow-soft transition-shadow duration-300 hover:shadow-lift"
    >
      {cover && (
        <Link to="/creators/$creatorId" params={{ creatorId: creator.id }} className="block p-2 pb-0">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[1.25rem]">
            <img
              src={cover.image}
              alt={`${cover.title} by ${creator.name}`}
              loading="lazy"
              width={1024}
              height={768}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <span className="genre-glass absolute bottom-2 left-2 rounded-full px-2.5 py-1 text-[11px] font-medium text-foreground">
              {cover.kind}
            </span>
          </div>
        </Link>
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start gap-3">
          <CreatorAvatar creator={creator} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-semibold text-foreground">{creator.name}</h3>
            <CategoryLabel category={creator.category} />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {creator.genres.map((g, i) => (
            <GenreChip key={g} genre={g} primary={i === 0} />
          ))}
        </div>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{creator.tagline || creator.bio}</p>
        <div className="flex flex-wrap gap-1.5">
          {creator.skills.slice(0, 3).map((s) => (
            <SkillChip key={s}>{s}</SkillChip>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <span>
            {creator.experience}{creator.years ? ` · ${creator.years} yrs` : ""}
          </span>
          <AvailabilityBadge value={creator.availability} />
        </div>
        <div className="flex gap-2">
          <Button asChild variant="glass" size="sm" className="flex-1">
            <Link to="/creators/$creatorId" params={{ creatorId: creator.id }}>
              View profile
            </Link>
          </Button>
          <ConnectButton creator={creator} className="flex-1" />
        </div>
      </div>
    </motion.article>
  );
}

export function CreatorCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card p-2">
      <div className="aspect-[16/10] animate-pulse rounded-[1.25rem] bg-muted" />
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-3">
          <div className="size-11 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted" />
            <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
        <div className="h-2.5 w-full animate-pulse rounded-full bg-muted" />
        <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-muted" />
        <div className="h-8 w-full animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}
