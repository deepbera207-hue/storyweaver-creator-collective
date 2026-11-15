import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ArrowRight, Handshake } from "lucide-react";
import { ME_ID } from "@/data/creators";
import { genreStyle } from "@/lib/genres";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/motion";
import { CategoryLabel, CreatorAvatar, GenreChip, SkillChip } from "@/components/creator/bits";

export const Route = createFileRoute("/_authenticated/_authenticated/collaborations")({
  head: () => ({
    meta: [
      { title: "My collaborations — Crea-Link" },
      { name: "description", content: "Every project you're building with other creators, in one calm place." },
      { property: "og:title", content: "My collaborations — Crea-Link" },
      { property: "og:description", content: "Every project you're building with other creators, in one calm place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Collaborations,
});

function Collaborations() {
  const { requests, getPerson, me, hydrated } = useStore();
  const active = requests
    .filter((r) => r.status === "accepted" && (r.fromId === ME_ID || r.toId === ME_ID))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pendingIncoming = requests.filter((r) => r.toId === ME_ID && r.status === "pending").length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="My Collaborations"
        title="What you're making together."
        description="Projects where both sides said yes."
      >
      </PageHeader>

      {hydrated && pendingIncoming > 0 && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="match-wash flex flex-col gap-3 rounded-3xl border border-match-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            You have <span className="font-semibold">{pendingIncoming} new invitation{pendingIncoming > 1 ? "s" : ""}</span> waiting for a reply.
          </p>
          <Button asChild size="sm">
            <Link to="/requests" search={{ tab: "received", status: "pending" }}>
              Review requests <ArrowRight />
            </Link>
          </Button>
        </motion.div>
      )}

      {!hydrated ? (
        <div className="grid gap-5 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-3xl border border-border bg-muted/60" />
          ))}
        </div>
      ) : active.length === 0 ? (
        <div className="surface rounded-3xl p-12 text-center">
          <Handshake className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-4 font-display text-3xl">No collaborations yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">Accept a request or invite someone to get started.</p>
          <Button asChild className="mt-6">
            <Link to="/match">Find a match</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {active.map((r, i) => {
            const partner = getPerson(r.fromId === ME_ID ? r.toId : r.fromId);
            if (!partner) return null;
            return (
              <motion.article
                key={r.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.06 } }}
                whileHover={{ y: -3 }}
                style={genreStyle([r.genre, ...partner.genres])}
                className="genre-wash flex flex-col rounded-3xl border border-border p-6 shadow-soft transition-shadow hover:shadow-lift"
              >
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-3">
                    <CreatorAvatar creator={me} />
                    <CreatorAvatar creator={partner} />
                  </div>
                  <span className="rounded-full bg-status-accepted px-2.5 py-1 text-xs font-semibold text-status-accepted-ink">In progress</span>
                </div>
                <h3 className="mt-5 font-display text-3xl leading-tight text-foreground">{r.projectTitle}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.description}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <GenreChip genre={r.genre} />
                  {r.skills.map((s) => (
                    <SkillChip key={s}>{s}</SkillChip>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/70 pt-5 mt-6">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">with {partner.name}</p>
                    <div className="flex items-center gap-2">
                      <CategoryLabel category={partner.category} />
                      <span className="text-xs text-muted-foreground">· since {format(new Date(r.createdAt), "d MMM")}</span>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="glass">
                    <Link to="/creators/$creatorId" params={{ creatorId: partner.id }}>
                      Profile
                    </Link>
                  </Button>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}
