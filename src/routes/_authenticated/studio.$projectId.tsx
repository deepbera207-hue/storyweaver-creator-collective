import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CreativeProjectsStudio, type WorkspaceTabId } from "@/modules/creative-studio";
import { useStore } from "@/lib/store";

const TABS: WorkspaceTabId[] = ["overview", "script", "collaboration", "team", "progress", "contributions", "portfolio", "assistant", "research"];

type StudioSearch = { tab?: WorkspaceTabId | undefined };

export const Route = createFileRoute("/_authenticated/studio/$projectId")({
  validateSearch: (s: Record<string, unknown>): StudioSearch => ({
    tab: typeof s["tab"] === "string" && (TABS as string[]).includes(s["tab"]) ? (s["tab"] as WorkspaceTabId) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Project workspace — Crea-Link" },
      { name: "description", content: "A shared Crea-Link workspace for a creative project and its team." },
      { property: "og:title", content: "Project workspace — Crea-Link" },
      { property: "og:description", content: "A shared Crea-Link workspace for a creative project and its team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectStudio,
});

function ProjectStudio() {
  const { projectId } = Route.useParams();
  const { tab } = Route.useSearch();
  const { user } = useStore();
  const navigate = useNavigate();
  if (!user) return null;
  return (
    <CreativeProjectsStudio
      key={projectId}
      userId={user.id}
      initialProjectId={projectId}
      initialTab={tab}
      onOpenProject={(id) => {
        if (id !== projectId) void navigate({ to: "/studio/$projectId", params: { projectId: id } });
      }}
      onCloseProject={() => void navigate({ to: "/studio" })}
    />
  );
}
