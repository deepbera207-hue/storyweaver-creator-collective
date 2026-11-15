import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CreativeProjectsStudio } from "@/modules/creative-studio";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({
    meta: [
      { title: "Creative projects — Crea-Link" },
      { name: "description", content: "Create a story project, browse open roles and join other creators' projects on Crea-Link." },
      { property: "og:title", content: "Creative projects — Crea-Link" },
      { property: "og:description", content: "Create a story project, browse open roles and join other creators' projects on Crea-Link." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { user } = useStore();
  const navigate = useNavigate();
  if (!user) return null;
  return (
    <CreativeProjectsStudio
      userId={user.id}
      onOpenProject={(projectId) => void navigate({ to: "/studio/$projectId", params: { projectId } })}
    />
  );
}
