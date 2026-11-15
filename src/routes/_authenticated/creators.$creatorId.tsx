import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";
import { scoreMatch, briefFromProfile } from "@/lib/matchmaking";
import { useMe, useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@/components/creator/bits";
import { ProfileView } from "@/components/creator/ProfileView";

export const Route = createFileRoute("/_authenticated/creators/$creatorId")({
  head: () => ({
    meta: [
      { title: "Creator profile — Crea-Link" },
      { name: "description", content: "Explore a Crea-Link creator's skills, genres, projects and collaboration preferences." },
      { property: "og:title", content: "Creator profile — Crea-Link" },
      { property: "og:description", content: "Explore a Crea-Link creator's skills, genres, projects and collaboration preferences." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreatorPage,
});

function CreatorPage() {
  const { creatorId } = Route.useParams();
  const { getPerson, hydrated, user } = useStore();
  const me = useMe();
  const creator = getPerson(creatorId);

  if (!hydrated) {
    return <div className="surface h-72 animate-pulse rounded-[2rem]" />;
  }
  if (!creator) {
    return (
      <div className="surface mx-auto max-w-lg rounded-3xl p-12 text-center">
        <p className="font-display text-4xl">We couldn't find that creator.</p>
        <Button asChild className="mt-6">
          <Link to="/explore">Discover creators</Link>
        </Button>
      </div>
    );
  }
  const isMe = creator.id === user?.id;
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
          isMe ? (
            <Button asChild size="lg">
              <Link to="/profile">Edit my profile</Link>
            </Button>
          ) : (
            <>
              <ConnectButton creator={creator} size="lg" />
              <span
                className="match-shimmer inline-flex items-center justify-center gap-1.5 rounded-full border border-match-b px-4 py-2 text-xs font-semibold text-match-ink"
                title="Score from transparent matching rules, not AI"
              >
                <Sparkles className="size-3.5" /> {match.score}% match with you
              </span>
            </>
          )
        }
      />
    </div>
  );
}
