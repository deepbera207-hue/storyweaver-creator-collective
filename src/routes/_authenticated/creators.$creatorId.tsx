import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";
import { findCreator } from "@/data/creators";
import { CATEGORIES } from "@/lib/categories";
import { scoreMatch, briefFromProfile } from "@/lib/matchmaking";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@/components/creator/bits";
import { ProfileView } from "@/components/creator/ProfileView";

export const Route = createFileRoute("/creators/$creatorId")({
  loader: ({ params }) => {
    const creator = findCreator(params.creatorId);
    if (!creator) throw notFound();
    return { creator };
  },
  head: ({ loaderData }) => {
    const c = loaderData?.creator;
    if (!c) return { meta: [{ title: "Creator not found — Ensemble" }, { name: "robots", content: "noindex" }] };
    const title = `${c.name}, ${CATEGORIES[c.category].label} — Ensemble`;
    return {
      meta: [
        { title },
        { name: "description", content: c.tagline },
        { property: "og:title", content: title },
        { property: "og:description", content: c.tagline },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="surface mx-auto max-w-lg rounded-3xl p-12 text-center">
      <p className="font-display text-4xl">We couldn't find that creator.</p>
      <Button asChild className="mt-6">
        <Link to="/explore">Explore creators</Link>
      </Button>
    </div>
  ),
  component: CreatorPage,
});

function CreatorPage() {
  const { creator } = Route.useLoaderData();
  const { me } = useStore();
  const match = scoreMatch({ ...briefFromProfile(me), seeking: "any" }, creator);
  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="relative z-10 -ml-2">
        <Link to="/explore">
          <ArrowLeft /> All creators
        </Link>
      </Button>
      <ProfileView
        creator={creator}
        actions={
          <>
            <ConnectButton creator={creator} size="lg" />
            <span className="match-shimmer inline-flex items-center justify-center gap-1.5 rounded-full border border-match-b px-4 py-2 text-xs font-semibold text-match-ink" title="Demo score from simple rules, not live AI">
              <Sparkles className="size-3.5" /> {match.score}% match with you
            </span>
          </>
        }
      />
    </div>
  );
}
