import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useStore, type ProfilePatch } from "@/lib/store";
import { AVAILABILITY, CATEGORIES, CATEGORY_KEYS, COLLAB_PREFS, EXPERIENCE_LEVELS, type Availability, type CategoryKey, type CollabPref, type Experience } from "@/lib/categories";
import { GENRE_KEYS, GENRES, genreStyle, type GenreKey } from "@/lib/genres";
import { safeFileName, uploadToBucket } from "@/lib/storage-urls";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CreatorAvatar } from "@/components/creator/bits";

const CREATOR_TYPES: CategoryKey[] = ["storyteller", "animator", "filmmaker", "designer", "artist", "researcher", "music", "content"];

const SKILL_IDEAS = ["Screenwriting", "Worldbuilding", "Character design", "Storyboarding", "2D animation", "3D animation", "Editing", "Cinematography", "Illustration", "Concept art", "Sound design", "Historical research"];
const INTEREST_IDEAS = ["Short films", "Web series", "Graphic novels", "Fantasy worlds", "Documentaries", "Mythology", "Indie games", "Poetry"];

export function ProfileForm({ submitLabel, onSaved }: { submitLabel: string; onSaved?: () => void }) {
  const { myProfile, me, user, updateMe } = useStore();
  const [fullName, setFullName] = useState(myProfile?.full_name ?? "");
  const [username, setUsername] = useState(myProfile?.username ?? "");
  const [bio, setBio] = useState(myProfile?.bio ?? "");
  const [tagline, setTagline] = useState(myProfile?.tagline ?? "");
  const [location, setLocation] = useState(myProfile?.location ?? "");
  const [type, setType] = useState<CategoryKey>((myProfile?.creator_type as CategoryKey) ?? "storyteller");
  const [genres, setGenres] = useState<GenreKey[]>(me?.genres?.length && myProfile?.genres?.length ? me.genres : []);
  const [skills, setSkills] = useState<string[]>(myProfile?.skills ?? []);
  const [interests, setInterests] = useState<string[]>(myProfile?.interests ?? []);
  const [experience, setExperience] = useState<Experience>((myProfile?.experience as Experience) ?? "Emerging");
  const [availability, setAvailability] = useState<Availability>((myProfile?.availability as Availability) ?? "open");
  const [prefs, setPrefs] = useState<CollabPref[]>((myProfile?.collab_prefs as CollabPref[]) ?? []);
  const [lookingFor, setLookingFor] = useState<CategoryKey[]>((myProfile?.looking_for as CategoryKey[]) ?? []);
  const [avatarRef, setAvatarRef] = useState<string>(myProfile?.avatar_url ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string>(me?.avatarUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file.");
    if (file.size > 10 * 1024 * 1024) return toast.error("Images must be under 10 MB.");
    setUploading(true);
    try {
      const ref = await uploadToBucket("profile-media", `${user.id}/avatar_${Date.now()}_${safeFileName(file.name)}`, file, file.type);
      setAvatarRef(ref);
      setAvatarPreview(URL.createObjectURL(file));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const handle = username.trim().toLowerCase();
    if (!/^[a-z0-9_.]{3,30}$/.test(handle)) return toast.error("Usernames use 3–30 letters, numbers, dots or underscores.");
    if (!fullName.trim()) return toast.error("Please add your name.");
    if (genres.length === 0) return toast.error("Pick at least one genre you love.");
    const patch: ProfilePatch = {
      full_name: fullName.trim().slice(0, 80),
      username: handle,
      bio: bio.trim().slice(0, 1200),
      tagline: tagline.trim().slice(0, 140),
      location: location.trim().slice(0, 80),
      creator_type: type,
      genres,
      skills: skills.slice(0, 15),
      interests: interests.slice(0, 15),
      experience,
      availability,
      collab_prefs: prefs,
      looking_for: lookingFor,
      avatar_url: avatarRef,
      onboarded: true,
    };
    setSaving(true);
    try {
      await updateMe(patch);
      toast.success("Profile saved");
      onSaved?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your profile");
    } finally {
      setSaving(false);
    }
  };

  const previewCreator = me ? { ...me, name: fullName || me.name, avatarUrl: avatarPreview, genres: genres.length ? genres : me.genres } : null;

  return (
    <form onSubmit={save} style={genreStyle(genres.length ? genres : ["peaceful"])} className="space-y-8">
      <section className="genre-wash flex flex-col items-center gap-5 rounded-3xl border border-border p-6 sm:flex-row">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative rounded-full"
          aria-label="Upload profile picture"
        >
          {previewCreator && <CreatorAvatar creator={previewCreator} size="lg" />}
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/0 text-card opacity-0 transition-all group-hover:bg-foreground/30 group-hover:opacity-100">
            {uploading ? <Loader2 className="size-5 animate-spin" /> : <Camera className="size-5" />}
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && void uploadAvatar(e.target.files[0])} />
        <div className="grid w-full flex-1 gap-3 sm:grid-cols-2">
          <Text label="Full name" value={fullName} onChange={setFullName} required />
          <Text label="Username" value={username} onChange={(v) => setUsername(v.replace(/\s/g, ""))} prefix="@" required />
          <Text label="Tagline" value={tagline} onChange={setTagline} placeholder="One line about your craft" />
          <Text label="Location" value={location} onChange={setLocation} placeholder="City, country" />
        </div>
      </section>

      <Group label="Bio">
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          placeholder="Tell other creators what you make and what stories move you."
          className="w-full rounded-2xl border border-border bg-background p-4 text-sm outline-none transition-all focus:border-ring focus:bg-card"
        />
      </Group>

      <Group label="I am a…">
        {CREATOR_TYPES.map((k) => (
          <Pill key={k} on={type === k} onClick={() => setType(k)}>
            {CATEGORIES[k].label}
          </Pill>
        ))}
      </Group>

      <Group label="Preferred genres (first one sets your colours)">
        {GENRE_KEYS.map((g) => (
          <Pill key={g} on={genres.includes(g)} genre={g} onClick={() => setGenres(toggle(genres, g))}>
            {GENRES[g].label}
          </Pill>
        ))}
      </Group>

      <TagGroup label="Skills & expertise" values={skills} onChange={setSkills} ideas={SKILL_IDEAS} />
      <TagGroup label="Creative interests" values={interests} onChange={setInterests} ideas={INTEREST_IDEAS} />

      <div className="grid gap-8 md:grid-cols-2">
        <Group label="Experience">
          {EXPERIENCE_LEVELS.map((x) => (
            <Pill key={x} on={experience === x} onClick={() => setExperience(x)}>
              {x}
            </Pill>
          ))}
        </Group>
        <Group label="Availability">
          {(Object.keys(AVAILABILITY) as Availability[]).map((a) => (
            <Pill key={a} on={availability === a} onClick={() => setAvailability(a)}>
              {AVAILABILITY[a].label}
            </Pill>
          ))}
        </Group>
      </div>

      <Group label="How I like to collaborate">
        {COLLAB_PREFS.map((p) => (
          <Pill key={p} on={prefs.includes(p)} onClick={() => setPrefs(toggle(prefs, p))}>
            {p}
          </Pill>
        ))}
      </Group>

      <Group label="Looking for">
        {CATEGORY_KEYS.map((k) => (
          <Pill key={k} on={lookingFor.includes(k)} onClick={() => setLookingFor(toggle(lookingFor, k))}>
            {CATEGORIES[k].plural}
          </Pill>
        ))}
      </Group>

      <motion.div layout className="flex justify-end">
        <Button type="submit" size="lg" disabled={saving || uploading}>
          {saving && <Loader2 className="animate-spin" />}
          {submitLabel}
        </Button>
      </motion.div>
    </form>
  );
}

function Text({
  label,
  value,
  onChange,
  placeholder,
  prefix,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      <div className="relative">
        {prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{prefix}</span>}
        <input
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn("auth-input", prefix && "pl-8")}
        />
      </div>
    </label>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Pill({ on, genre, onClick, children }: { on: boolean; genre?: GenreKey; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      style={genre ? genreStyle([genre]) : undefined}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm transition-all duration-200 active:scale-95",
        on
          ? genre
            ? "genre-chip ring-2 ring-g-accent/40"
            : "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function TagGroup({ label, values, onChange, ideas }: { label: string; values: string[]; onChange: (v: string[]) => void; ideas: string[] }) {
  const [text, setText] = useState("");
  const add = (v: string) => {
    const t = v.trim();
    if (t && !values.includes(t) && values.length < 15) onChange([...values, t]);
    setText("");
  };
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        {values.map((v) => (
          <span key={v} className="genre-chip inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm">
            {v}
            <button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(values.filter((x) => x !== v))}>
              <X className="size-3.5" />
            </button>
          </span>
        ))}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(text);
            }
          }}
          onBlur={() => text && add(text)}
          placeholder="Type and press Enter"
          className="h-9 min-w-[180px] flex-1 rounded-full border border-dashed border-border bg-transparent px-3 text-sm outline-none focus:border-ring"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ideas
          .filter((i) => !values.includes(i))
          .slice(0, 8)
          .map((i) => (
            <button key={i} type="button" onClick={() => add(i)} className="rounded-full px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              + {i}
            </button>
          ))}
      </div>
    </div>
  );
}
