import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { MatchResult } from "@/lib/matchmaking";
import { genreStyle } from "@/lib/genres";
import { Button } from "@/components/ui/button";
import { ease } from "@/components/motion";
import { CategoryLabel, ConnectButton, CreatorAvatar, GenreChip } from "@/components/creator/bits";

export function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  const id = `ring-${size}`;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--peaceful-accent)" />
            <stop offset="100%" stopColor="var(--romance-accent)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--match-a)" strokeWidth={5} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - score / 100) }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-match-ink">
        {score}%
      </span>
    </div>
  );
}

export function MatchCard({ match, compact, index = 0 }: { match: MatchResult; compact?: boolean; index?: number }) {
  const { creator, score, reasons } = match;
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.45, delay: index * 0.05, ease } }}
      whileHover={{ y: -3 }}
      className="relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-match-b/70 bg-card/85 p-5 shadow-soft backdrop-blur transition-shadow hover:shadow-lift"
    >
      <div style={genreStyle(creator.genres)} className="genre-wash pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative flex items-start gap-3">
        <CreatorAvatar creator={creator} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-foreground">{creator.name}</h3>
          <CategoryLabel category={creator.category} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {creator.genres.map((g, i) => (
              <GenreChip key={g} genre={g} primary={i === 0} />
            ))}
          </div>
        </div>
        <ScoreRing score={score} />
      </div>
      <div className="relative">
        <p className="match-gradient-text flex items-center gap-1.5 text-sm font-semibold">
          <Sparkles className="size-3.5 text-match-ink" /> {score}% Creative Match
        </p>
        {!compact && (
          <ul className="mt-2 space-y-1.5">
            {reasons.map((r) => (
              <li key={r} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-match-ink/50" />
                {r}
              </li>
            ))}
          </ul>
        )}
        {compact && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{reasons[0]}</p>}
      </div>
      <div className="relative mt-auto flex gap-2">
        <Button asChild size="sm" variant="glass" className="flex-1">
          <Link to="/creators/$creatorId" params={{ creatorId: creator.id }}>
            View profile
          </Link>
        </Button>
        <ConnectButton creator={creator} className="flex-1" />
      </div>
    </motion.article>
  );
}
