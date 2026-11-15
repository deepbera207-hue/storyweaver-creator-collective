import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CreativeProjectsStudio } from "@/modules/creative-studio";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/studio/")({
  head: () => ({
    meta: [
      { title: "Collaborative studio — Crea-Link" },
      { name: "description", content: "Your project workspaces: group chat, shared media, scripts, tasks and the AI Story Assistant." },
      { property: "og:title", content: "Collaborative studio — Crea-Link" },
      { property: "og:description", content: "Your project workspaces: group chat, shared media, scripts, tasks and the AI Story Assistant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudioHome,
});

function StudioHome() {
  const { user } = useStore();
  const navigate = useNavigate();
  if (!user) return null;
  return (
    <CreativeProjectsStudio
      userId={user.id}
      onlyMine
      heading="Collaborative Studio"
      subheading="The projects you own or belong to. Open one to chat with your team, share images and videos, edit the script and work with the AI Story Assistant."
      onOpenProject={(projectId) => navigate({ to: "/studio/$projectId", params: { projectId } })}
    />
  );
}
