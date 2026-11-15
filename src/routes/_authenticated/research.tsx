import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/motion";
import { ResearchPanel } from "@/features/research/ResearchPanel";

export const Route = createFileRoute("/_authenticated/research")({
  head: () => ({
    meta: [
      { title: "Story research — Crea-Link" },
      { name: "description", content: "Build focused research questions about genres, eras, places, professions and science for your story." },
      { property: "og:title", content: "Story research — Crea-Link" },
      { property: "og:description", content: "Build focused research questions about genres, eras, places, professions and science for your story." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResearchPage,
});

function ResearchPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Research"
        title="Research for your story"
        description="Shape a clear research request, then search Google or take the prepared prompt to ChatGPT, Claude or Gemini. Results open on those sites — Crea-Link doesn't run the search itself."
      />
      <ResearchPanel />
    </div>
  );
}
