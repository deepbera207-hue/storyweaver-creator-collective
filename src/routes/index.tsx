import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, BookOpenText, FolderKanban, MessagesSquare, Search, Users, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeUp, stagger } from "@/components/motion";
import { Logo } from "@/components/layout/AppHeader";
import { GENRE_KEYS, GENRES, genreStyle, type GenreKey } from "@/lib/genres";
import { useStore } from "@/lib/store";
import romance from "@/assets/work-romance.jpg";
import adventure from "@/assets/work-adventure.jpg";
import peaceful from "@/assets/work-peaceful.jpg";
import thriller from "@/assets/work-thriller.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Crea-Link — Where creators collaborate and stories grow" },
      {
        name: "description",
        content: "Find writers, animators, filmmakers and artists, build projects together, and develop your story with an AI creative partner.",
      },
      { property: "og:title", content: "Crea-Link — Where creators collaborate and stories grow" },
      {
        property: "og:description",
        content: "Find writers, animators, filmmakers and artists, build projects together, and develop your story with an AI creative partner.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Search, title: "Discover creators", text: "Search writers, animators, filmmakers, designers, artists and researchers by skill, genre and interest.", tone: "peaceful" },
  { icon: FolderKanban, title: "Creative projects", text: "Start a project with a title, genre and script — or ask to join someone else's.", tone: "adventure" },
  { icon: MessagesSquare, title: "Collaborative studio", text: "Group chat, shared images and videos, scripts, tasks and milestones in one shared space.", tone: "moral" },
  { icon: Wand2, title: "AI Story Assistant", text: "Plot, characters, dialogue, structure and world-building ideas — you stay the author.", tone: "romance" },
  { icon: BookOpenText, title: "Research helper", text: "Shape research questions about eras, places, professions and science, then search the web.", tone: "dark" },
  { icon: Users, title: "Genre-tinted spaces", text: "Every project takes on a soft colour palette drawn from its genre.", tone: "peaceful" },
] as const;

function Landing() {
  const { user } = useStore();
  const signedIn = Boolean(user);
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 md:px-8">
        <Logo to="/" />
        <div className="flex items-center gap-2">
          {signedIn ? (
            <Button asChild>
              <Link to="/feed">
                Open Crea-Link <ArrowRight />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link to="/auth" search={{ mode: "signin" }}>Log in</Link>
              </Button>
              <Button asChild>
                <Link to="/auth" search={{ mode: "signup" }}>Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-24 px-4 pb-24 md:px-8">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-border bg-card px-6 py-16 md:px-14 md:py-24">
          <div className="hero-atmosphere pointer-events-none absolute inset-0" />
          <div className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <motion.div initial="hidden" animate="show" variants={stagger}>
              <motion.p variants={fadeUp} className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Creative collaboration · AI storytelling
              </motion.p>
              <motion.h1 variants={fadeUp} className="mt-5 font-display text-5xl leading-[0.98] text-foreground md:text-7xl">
                Find your people. <em className="italic text-muted-foreground">Grow your story.</em>
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Crea-Link brings writers, animators, filmmakers, designers, artists and researchers together to build
                projects — with an AI story partner that helps you think, never takes over.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-9 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to={signedIn ? "/feed" : "/auth"} search={signedIn ? undefined : { mode: "signup" }}>
                    {signedIn ? "Go to my feed" : "Create your profile"} <ArrowRight />
                  </Link>
                </Button>
                {!signedIn && (
                  <Button asChild size="lg" variant="glass">
                    <Link to="/auth" search={{ mode: "signin" }}>I already have an account</Link>
                  </Button>
                )}
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-2 gap-3"
            >
              {[
                { src: romance, g: "romance" as GenreKey },
                { src: adventure, g: "adventure" as GenreKey },
                { src: peaceful, g: "peaceful" as GenreKey },
                { src: thriller, g: "dark" as GenreKey },
              ].map((img, i) => (
                <motion.div
                  key={img.g}
                  animate={{ y: [0, i % 2 ? 6 : -6, 0] }}
                  transition={{ duration: 7 + i, repeat: Infinity, ease: "easeInOut" }}
                  style={genreStyle([img.g])}
                  className={`relative overflow-hidden rounded-3xl border border-border shadow-soft ${i % 2 ? "mt-8" : ""}`}
                >
                  <img src={img.src} alt="" className="aspect-[4/5] h-full w-full object-cover" />
                  <span className="genre-glass absolute bottom-2 left-2 rounded-full px-2.5 py-1 text-[11px] font-medium text-g-ink">
                    {GENRES[img.g].short}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          {[
            {
              eyebrow: "Purpose one",
              title: "Creator collaboration",
              text: "Discover creators who share your genres, connect, form a team, and work in a shared studio with group chat and shared media.",
              tone: "peaceful" as GenreKey,
            },
            {
              eyebrow: "Purpose two",
              title: "AI-powered storytelling",
              text: "Bring your own idea or script. The assistant suggests plot turns, characters, dialogue and structure — you accept, revise or ignore.",
              tone: "romance" as GenreKey,
            },
          ].map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              style={genreStyle([p.tone])}
              className="genre-wash rounded-[2rem] border border-border p-8 shadow-soft md:p-10"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-g-ink">{p.eyebrow}</p>
              <h2 className="mt-3 font-display text-4xl text-foreground">{p.title}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{p.text}</p>
            </motion.div>
          ))}
        </section>

        <section>
          <h2 className="font-display text-4xl text-foreground md:text-5xl">Everything a story needs</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                style={genreStyle([f.tone])}
                className="surface rounded-3xl p-6 transition-shadow hover:shadow-lift"
              >
                <span className="genre-chip flex size-11 items-center justify-center rounded-2xl">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-5 font-display text-2xl text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="surface rounded-[2rem] p-8 md:p-12">
          <h2 className="font-display text-4xl text-foreground">Every genre gets its own light</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Pick a genre when you create a project and its studio takes on a gentle tint — as if seen through thin, white-painted glass.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-5">
            {GENRE_KEYS.map((g) => (
              <div key={g} style={genreStyle([g])} className="genre-wash rounded-2xl border border-border p-4">
                <span className="block h-10 rounded-xl bg-g-accent/30" />
                <p className="mt-3 text-sm font-semibold text-g-ink">{GENRES[g].short}</p>
                <p className="text-xs text-muted-foreground">{GENRES[g].themes.slice(0, 2).join(", ")}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="text-center">
          <h2 className="font-display text-5xl text-foreground">Ready to create together?</h2>
          <Button asChild size="lg" className="mt-8">
            <Link to={signedIn ? "/feed" : "/auth"} search={signedIn ? undefined : { mode: "signup" }}>
              {signedIn ? "Open Crea-Link" : "Join Crea-Link"} <ArrowRight />
            </Link>
          </Button>
        </section>
      </main>
      <footer className="border-t border-border/70 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Crea-Link
      </footer>
    </div>
  );
}
