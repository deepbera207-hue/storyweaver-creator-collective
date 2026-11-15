import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { FeedProject } from "@/lib/store";
import { useStore } from "@/lib/store";
import { genreStyle } from "@/lib/genres";
import { GENRE_COVERS } from "@/data/creators";
import { ease } from "@/components/motion";
import { CreatorAvatar } from "@/components/creator/bits";

export function ProjectFeedCard({ project, index = 0 }: { project: FeedProject; index?: number }) {
  const { getPerson, user } = useStore();
  const owner = getPerson(project.ownerId);
  const isMember = project.ownerId === user?.id || project.memberIds.includes(user?.id ?? "");
  const cover = project.coverImage ?? GENRE_COVERS[project.genreKeys[0] ?? "peaceful"];
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.45, delay: index * 0.05, ease } }}
      whileHover={{ y: -4 }}
      style={genreStyle(project.genreKeys)}
      className="genre-wash group flex flex-col overflow-hidden rounded-3xl border border-border shadow-soft transition-shadow duration-300 hover:shadow-lift"
    >
      <Link to="/studio/$projectId" params={{ projectId: project.id }} className="block p-2 pb-0">
        <div className="relative aspect-[16/9] overflow-hidden rounded-[1.25rem]">
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-[1.04]"
          />
          <span className="genre-glass absolute left-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-medium text-foreground">
            {project.primaryGenre}
          </span>
          <span className="genre-glass absolute right-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-medium text-g-ink">
            {project.status}
          </span>
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-display text-2xl leading-tight text-foreground">{project.title}</h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {project.description || "No description yet."}
        </p>
        {project.requiredRoles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.requiredRoles.slice(0, 3).map((r) => (
              <span key={r} className="genre-chip rounded-full px-2.5 py-0.5 text-xs">
                {r}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-4">
          <div className="flex min-w-0 items-center gap-2">
            {owner && <CreatorAvatar creator={owner} size="sm" />}
            <div className="min-w-0 text-xs">
              <p className="truncate font-medium text-foreground">{owner?.name ?? project.ownerName}</p>
              <p className="text-muted-foreground">
                <Users className="mr-1 inline size-3" />
                {project.memberIds.length} · {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <Link
            to="/studio/$projectId"
            params={{ projectId: project.id }}
            className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1.5 text-xs font-medium text-g-ink shadow-soft transition-colors hover:bg-g-soft"
          >
            {isMember ? "Open studio" : "View & join"} <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
