import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/motion";
import { StoryAssistantPage } from "@/features/story-assistant/StoryAssistantPage";
import { useStore } from "@/lib/store";
import { storyGenreForProject } from "@/lib/genre-theme";
import { genreStyle } from "@/lib/genres";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({
    meta: [
      { title: "AI Story Assistant — Crea-Link" },
      { name: "description", content: "Develop plot, characters, dialogue, structure and worlds with an AI creative partner that keeps you in control." },
      { property: "og:title", content: "AI Story Assistant — Crea-Link" },
      { property: "og:description", content: "Develop plot, characters, dialogue, structure and worlds with an AI creative partner that keeps you in control." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AssistantPage,
});

function AssistantPage() {
  const { projects, user } = useStore();
  const mine = useMemo(
    () => projects.filter((p) => p.ownerId === user?.id || p.memberIds.includes(user?.id ?? "")),
    [projects, user?.id],
  );
  const [projectId, setProjectId] = useState<string>("");
  const project = mine.find((p) => p.id === projectId);
  const context = project
    ? `Project: ${project.title}\nGenres: ${project.genres.join(", ")}\nDescription: ${project.description}`
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI Story Assistant"
        title="Your creative partner"
        description="Bring your idea or script. The assistant offers suggestions — you decide what stays."
      />
      {mine.length > 0 && (
        <div className="surface flex flex-wrap items-center gap-2 rounded-3xl p-3">
          <span className="px-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Working on</span>
          <button
            onClick={() => setProjectId("")}
            className={cn("rounded-full px-3 py-1.5 text-sm transition-colors", !project ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
          >
            A free idea
          </button>
          {mine.map((p) => (
            <button
              key={p.id}
              onClick={() => setProjectId(p.id)}
              style={genreStyle(p.genreKeys)}
              className={cn("rounded-full px-3 py-1.5 text-sm transition-all", projectId === p.id ? "genre-chip ring-2 ring-g-accent/40" : "text-muted-foreground hover:bg-g-soft")}
            >
              {p.title}
            </button>
          ))}
          {project && (
            <Link
              to="/studio/$projectId"
              params={{ projectId: project.id }}
              search={{ tab: "assistant" }}
              className="ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              Open in the project studio <ArrowUpRight className="size-4" />
            </Link>
          )}
        </div>
      )}
      <StoryAssistantPage
        key={project?.id ?? "free"}
        embedded
        initialTitle={project?.title ?? ""}
        initialGenreId={project ? storyGenreForProject(project.primaryGenre) : "calm"}
        projectContext={context}
        storageKey={project ? `crealink_story_assistant_${project.id}` : `crealink_story_assistant_free_${user?.id ?? ""}`}
      />
    </div>
  );
}
