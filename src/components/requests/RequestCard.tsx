import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Check, Clock, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { ME_ID } from "@/data/creators";
import { genreStyle } from "@/lib/genres";
import { useStore, type CollabRequest, type RequestStatus } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { fadeUp } from "@/components/motion";
import { CategoryLabel, CreatorAvatar, GenreChip, SkillChip } from "@/components/creator/bits";

export function StatusBadge({ status }: { status: RequestStatus }) {
  const map = {
    pending: { cls: "bg-status-pending text-status-pending-ink", icon: Clock, label: "Pending" },
    accepted: { cls: "bg-status-accepted text-status-accepted-ink", icon: Check, label: "Accepted" },
    declined: { cls: "bg-status-declined text-status-declined-ink", icon: X, label: "Declined" },
  }[status];
  const Icon = map.icon;
  return (
    <motion.span
      key={status}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", map.cls)}
    >
      <Icon className="size-3" /> {map.label}
    </motion.span>
  );
}

export function RequestCard({ request }: { request: CollabRequest }) {
  const { getPerson, respond, withdraw } = useStore();
  const incoming = request.toId === ME_ID;
  const other = getPerson(incoming ? request.fromId : request.toId);
  if (!other) return null;

  return (
    <motion.article
      layout
      variants={fadeUp}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, x: -12, transition: { duration: 0.2 } }}
      style={genreStyle(other.genres)}
      className="genre-wash rounded-3xl border border-border p-5 shadow-soft md:p-6"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <Link to="/creators/$creatorId" params={{ creatorId: other.id }} className="flex items-center gap-3 md:w-56 md:shrink-0">
          <CreatorAvatar creator={other} />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{incoming ? "From" : "To"}</p>
            <p className="truncate font-semibold text-foreground hover:underline">{other.name}</p>
            <CategoryLabel category={other.category} />
          </div>
        </Link>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">{request.projectTitle}</h3>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{request.description}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <GenreChip genre={request.genre} />
            {request.skills.map((s) => (
              <SkillChip key={s}>{s}</SkillChip>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{format(new Date(request.createdAt), "d MMM yyyy · h:mm a")}</p>
        </div>
        <div className="flex gap-2 md:flex-col">
          {incoming && request.status === "pending" && (
            <>
              <Button
                size="sm"
                onClick={() => {
                  respond(request.id, "accepted");
                  toast.success(`You're now collaborating with ${other.name}`);
                }}
              >
                <Check /> Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  respond(request.id, "declined");
                  toast(`Declined ${other.name.split(" ")[0]}'s request`, {
                    action: { label: "Undo", onClick: () => respond(request.id, "pending") },
                  });
                }}
              >
                <X /> Decline
              </Button>
            </>
          )}
          {!incoming && request.status === "pending" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                withdraw(request.id);
                toast("Request withdrawn");
              }}
            >
              <Undo2 /> Withdraw
            </Button>
          )}
          {request.status === "accepted" && (
            <Button asChild size="sm" variant="soft">
              <Link to="/collaborations">Open collaboration</Link>
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
