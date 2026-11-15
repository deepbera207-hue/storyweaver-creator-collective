import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import type { Creator } from "@/data/creators";
import { GENRE_KEYS, GENRES, genreStyle, type GenreKey } from "@/lib/genres";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function RequestDialog({ creator, children }: { creator: Creator; children: ReactNode }) {
  const { me, sendRequest } = useStore();
  const myGenres = me?.genres ?? [];
  const shared = creator.genres.find((g) => myGenres.includes(g));
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [genre, setGenre] = useState<GenreKey>(shared ?? myGenres[0] ?? creator.genres[0] ?? "romance");
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

  const reset = () => {
    setTitle("");
    setDescription("");
    setSkills([]);
    setCustom("");
    setErrors({});
  };

  const toggle = (s: string) => setSkills((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const addCustom = () => {
    const v = custom.trim();
    if (v && !skills.includes(v)) setSkills((c) => [...c, v]);
    setCustom("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (title.trim().length < 3) next.title = "Give your project a title (at least 3 characters).";
    if (description.trim().length < 20) next.description = "Describe the project in a sentence or two (20+ characters).";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSending(true);
    try {
      await sendRequest({
        toId: creator.id,
        projectTitle: title.trim(),
        description: description.trim(),
        skills,
        genre,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send the request");
      setSending(false);
      return;
    }
    setSending(false);
    toast.success(`Request sent to ${creator.name}`, { description: "You'll find it under Collaboration Requests → Sent." });
    setOpen(false);
    reset();
  };

  const allSkills = Array.from(new Set([...creator.skills, ...skills]));

  return (
    <Dialog open={open} onOpenChange={(o) => (setOpen(o), !o && reset())}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent style={genreStyle(creator.genres)} className="genre-wash max-h-[90vh] overflow-y-auto rounded-3xl border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-normal">Invite {creator.name.split(" ")[0]}</DialogTitle>
          <DialogDescription>Tell them about the project and what you'd love their help with.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="mt-2 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="rq-title">Project title</Label>
            <Input id="rq-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. The Last Tram Home — animated short" className="rounded-xl bg-card" />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="rq-desc">Project description</Label>
            <Textarea id="rq-desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's the story, the format, and the feeling you're after?" className="rounded-xl bg-card" />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>
          <div className="space-y-2">
            <Label>Required skills</Label>
            <div className="flex flex-wrap gap-1.5">
              {allSkills.map((s) => {
                const on = skills.includes(s);
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => toggle(s)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-all",
                      on ? "genre-chip font-medium" : "border-border bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <AnimatePresence initial={false}>
                      {on && (
                        <motion.span initial={{ width: 0, opacity: 0 }} animate={{ width: "auto", opacity: 1 }} exit={{ width: 0, opacity: 0 }}>
                          <Check className="size-3" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {s}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
                placeholder="Add another skill"
                className="h-8 rounded-full bg-card text-xs"
              />
              <Button type="button" size="sm" variant="outline" onClick={addCustom}>
                Add
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Preferred genre</Label>
            <div className="flex flex-wrap gap-1.5">
              {GENRE_KEYS.map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setGenre(g)}
                  style={genreStyle([g])}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-all",
                    genre === g ? "genre-chip font-semibold ring-2 ring-g-accent/50" : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {GENRES[g].short}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              <X /> Cancel
            </Button>
            <Button type="submit" disabled={sending}>{sending ? "Sending…" : "Send request"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
