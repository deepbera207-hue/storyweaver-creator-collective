import { Link } from "@tanstack/react-router";
import { Check, MessageCircleHeart, Send } from "lucide-react";
import type { Creator } from "@/data/creators";
import { AVAILABILITY, CATEGORIES, type Availability, type CategoryKey } from "@/lib/categories";
import { GENRES, genreChipStyle, genreStyle, type GenreKey } from "@/lib/genres";
import { useConnection } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";
import { RequestDialog } from "@/components/requests/RequestDialog";

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function CreatorAvatar({
  creator,
  size = "md",
  className,
}: {
  creator: Pick<Creator, "name" | "genres"> & { avatarUrl?: string | undefined };
  size?: "sm" | "md" | "lg" | "xl" | undefined;
  className?: string | undefined;
}) {
  const dims = { sm: "size-8 text-sm", md: "size-11 text-base", lg: "size-16 text-2xl", xl: "size-28 text-5xl" }[size];
  return (
    <div style={genreStyle(creator.genres)} className={cn("genre-ring shrink-0 rounded-full p-[2px]", className)}>
      {creator.avatarUrl ? (
        <img src={creator.avatarUrl} alt={creator.name} className={cn("rounded-full bg-card object-cover", dims)} />
      ) : (
        <div className={cn("flex items-center justify-center rounded-full bg-card font-display text-g-ink", dims)}>
          {initials(creator.name)}
        </div>
      )}
    </div>
  );
}

export function GenreChip({ genre, primary, className }: { genre: GenreKey; primary?: boolean | undefined; className?: string | undefined }) {
  return (
    <span
      style={genreChipStyle(genre)}
      className={cn("genre-chip inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", className)}
    >
      {primary && <span className="size-1.5 rounded-full bg-g-ink/70" />}
      {GENRES[genre].short}
    </span>
  );
}

export function SkillChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-border bg-card/70 px-2.5 py-0.5 text-xs text-secondary-foreground">
      {children}
    </span>
  );
}

export function AvailabilityBadge({ value, className }: { value: Availability; className?: string | undefined }) {
  const dot = { open: "bg-status-accepted-ink", limited: "bg-status-pending-ink", booked: "bg-muted-foreground/50" }[value];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <span className={cn("size-1.5 rounded-full", dot, value === "open" && "notify-dot")} />
      {AVAILABILITY[value].label}
    </span>
  );
}

export function CategoryLabel({ category, className }: { category: CategoryKey; className?: string | undefined }) {
  const { icon: Icon, label } = CATEGORIES[category];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground", className)}>
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}

export function ConnectButton({ creator, size = "sm", className }: { creator: Creator; size?: ButtonProps["size"] | undefined; className?: string | undefined }) {
  const status = useConnection(creator.id);
  if (status === "collaborating")
    return (
      <Button asChild size={size} variant="soft" className={className}>
        <Link to="/collaborations">
          <Check /> Collaborating
        </Link>
      </Button>
    );
  if (status === "requested")
    return (
      <Button asChild size={size} variant="outline" className={className}>
        <Link to="/requests" search={{ tab: "sent" }}>
          <Send /> Requested
        </Link>
      </Button>
    );
  if (status === "incoming")
    return (
      <Button asChild size={size} variant="soft" className={className}>
        <Link to="/requests" search={{ tab: "received" }}>
          <MessageCircleHeart /> Respond
        </Link>
      </Button>
    );
  return (
    <RequestDialog creator={creator}>
      <Button size={size} className={className}>
        Connect
      </Button>
    </RequestDialog>
  );
}
