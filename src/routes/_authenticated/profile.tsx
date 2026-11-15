import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Handshake, Inbox, LogOut, Pencil, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe, useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ProfileView } from "@/components/creator/ProfileView";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ProjectFeedCard } from "@/components/feed/ProjectFeedCard";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My profile — Crea-Link" },
      { name: "description", content: "View and edit your Crea-Link creator profile, projects and collaborations." },
      { property: "og:title", content: "My profile — Crea-Link" },
      { property: "og:description", content: "View and edit your Crea-Link creator profile, projects and collaborations." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyProfile,
});

function MyProfile() {
  const me = useMe();
  const { user, projects, requests } = useStore();
  const [editing, setEditing] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const mine = projects.filter((p) => p.ownerId === user?.id || p.memberIds.includes(user?.id ?? ""));
  const pending = requests.filter((r) => r.toId === user?.id && r.status === "pending").length;
  const active = requests.filter((r) => r.status === "accepted").length;

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="space-y-10">
      <AnimatePresence mode="wait">
        {editing ? (
          <motion.section key="edit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="surface rounded-[2rem] p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="font-display text-4xl">Edit profile</h1>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                <X /> Cancel
              </Button>
            </div>
            <ProfileForm submitLabel="Save changes" onSaved={() => setEditing(false)} />
          </motion.section>
        ) : (
          <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ProfileView
              creator={me}
              actions={
                <Button size="lg" onClick={() => setEditing(true)}>
                  <Pencil /> Edit profile
                </Button>
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link to="/collaborations" className="surface flex items-center gap-4 rounded-3xl p-5 transition-shadow hover:shadow-lift">
          <Handshake className="size-6 text-muted-foreground" />
          <div>
            <p className="font-semibold">My collaborations</p>
            <p className="text-sm text-muted-foreground">{active} active</p>
          </div>
        </Link>
        <Link to="/requests" search={{ tab: "received" }} className="surface flex items-center gap-4 rounded-3xl p-5 transition-shadow hover:shadow-lift">
          <Inbox className="size-6 text-muted-foreground" />
          <div>
            <p className="font-semibold">Collaboration requests</p>
            <p className="text-sm text-muted-foreground">{pending} waiting for you</p>
          </div>
        </Link>
      </section>

      <section>
        <h2 className="mb-5 font-display text-3xl">My projects</h2>
        {mine.length === 0 ? (
          <div className="surface rounded-3xl p-10 text-center">
            <p className="text-sm text-muted-foreground">You haven't started or joined a project yet.</p>
            <Button asChild className="mt-4">
              <Link to="/projects">Create or join a project</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((p, i) => (
              <ProjectFeedCard key={p.id} project={p} index={i} />
            ))}
          </div>
        )}
      </section>

      <section className="surface flex flex-col gap-4 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl">Account</h2>
          <p className="text-sm text-muted-foreground">Signed in as {user?.email}</p>
        </div>
        <Button variant="outline" onClick={() => void signOut()}>
          <LogOut /> Sign out
        </Button>
      </section>
    </div>
  );
}
