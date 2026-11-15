import { useEffect, useRef, useState, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ClipboardCheck, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Research Studio (ported from the original Crea-Link research page).
 * It does NOT run AI research inside Crea-Link: Google opens a search; for AI
 * platforms the prepared prompt is copied to the clipboard and the platform
 * opens in a new tab for the writer to paste it.
 */

export const RESEARCH_PLATFORMS = {
  google: { label: "Google Search", url: "https://www.google.com/search?q=" },
  chatgpt: { label: "ChatGPT", url: "https://chatgpt.com/" },
  claude: { label: "Claude", url: "https://claude.ai/new" },
  gemini: { label: "Google Gemini", url: "https://gemini.google.com/app" },
} as const;
export type ResearchPlatform = keyof typeof RESEARCH_PLATFORMS;

export const OUTPUT_TYPES = [
  "Quick Overview",
  "Detailed Explanation",
  "Key Points",
  "Historical Context",
  "Scientific Analysis",
  "Real-world Examples",
  "Creative Inspiration",
  "Research Report",
  "Compare and Contrast",
] as const;

export const RESEARCH_TOPICS = [
  "Story genre conventions",
  "Historical setting",
  "Character profession",
  "Location & culture",
  "Scientific concept",
  "Real-world event",
] as const;

export function buildResearchPrompt(question: string, outputType: string, custom: string, context?: string) {
  return `
Research Question: ${question}

Required Output: ${outputType}
${context ? `\nStory Context: ${context}\n` : ""}
Additional Instructions: ${custom || "None"}

Please provide a clear, well-organized research response.
Include relevant facts, examples and credible sources.
Avoid unnecessary information.
`;
}

export function ResearchPanel({ storyContext, compact = false }: { storyContext?: string; compact?: boolean }) {
  const [question, setQuestion] = useState("");
  const [platform, setPlatform] = useState<ResearchPlatform>("google");
  const [outputType, setOutputType] = useState<string>("Quick Overview");
  const [custom, setCustom] = useState("");
  const [status, setStatus] = useState<{ tone: "ok" | "warn"; text: string } | null>(null);

  const linkRef = useRef<HTMLAnchorElement>(null);
  const [embedded, setEmbedded] = useState(false);
  useEffect(() => {
    try {
      setEmbedded(window.self !== window.top);
    } catch {
      setEmbedded(true);
    }
  }, []);
  const [fallback, setFallback] = useState<{ url: string; label: string; prompt: string | null } | null>(null);

  function copyTextSync(text: string): boolean {
    // execCommand works inside embedded previews where the async Clipboard API is blocked.
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }

  async function copyText(text: string): Promise<boolean> {
    if (copyTextSync(text)) return true;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  const q = question.trim();
  const target = RESEARCH_PLATFORMS[platform];
  const targetUrl = platform === "google" ? target.url + encodeURIComponent(q) : target.url;

  // The button is a real link (opens a normal new tab, like the original page).
  // The click only adds the clipboard copy for AI platforms.
  function handleResearchClick(e: MouseEvent<HTMLAnchorElement>) {
    setFallback(null);
    if (!q) {
      e.preventDefault();
      setStatus({ tone: "warn", text: "Please enter a research question." });
      return;
    }
    if (platform === "google") {
      setStatus({ tone: "ok", text: "Opened Google Search in a new tab." });
      return;
    }
    const prompt = buildResearchPrompt(q, outputType, custom.trim(), storyContext);
    if (copyTextSync(prompt)) {
      setStatus({
        tone: "ok",
        text: `✓ Research prompt copied! Paste it into ${target.label} with Ctrl + V (or long-press → Paste on mobile).`,
      });
    } else {
      setFallback({ url: target.url, label: target.label, prompt });
      setStatus({ tone: "warn", text: `${target.label} opened, but copying was blocked. Copy the prompt below and paste it there.` });
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`genre-wash rounded-3xl border border-border shadow-soft ${compact ? "p-5 md:p-6" : "p-6 md:p-10"}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Crea-Link · Research Studio</p>
      <h2 className={`mt-2 font-display leading-tight text-foreground ${compact ? "text-3xl" : "text-4xl md:text-5xl"}`}>
        What would you like to research?
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Explore genres, historical settings, professions, places, cultures, science and real events for your story. Choose a
        platform and the kind of answer you want. <strong className="text-foreground">For AI platforms</strong>, Crea-Link
        copies your prepared question to the clipboard and opens the platform in a new tab — just paste it. Research
        happens on that external platform, not inside Crea-Link.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {RESEARCH_TOPICS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setQuestion((q) => (q ? q : `${t}: `))}
            className="genre-chip rounded-full px-3 py-1 text-xs transition-transform hover:-translate-y-0.5"
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="research-q">Your research question</Label>
          <Input
            id="research-q"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Psychological effects of long-term isolation"
            className="mt-2 h-12 rounded-xl bg-card"
            onKeyDown={(e) => e.key === "Enter" && linkRef.current?.click()}
          />
        </div>
        <div>
          <Label>Where would you like to research?</Label>
          <Select value={platform} onValueChange={(v) => setPlatform(v as ResearchPlatform)}>
            <SelectTrigger className="mt-2 h-12 rounded-xl bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RESEARCH_PLATFORMS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>What type of output do you want?</Label>
          <Select value={outputType} onValueChange={setOutputType}>
            <SelectTrigger className="mt-2 h-12 rounded-xl bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OUTPUT_TYPES.map((o) => (
                <SelectItem key={o} value={o}>
                  {o === "Research Report" ? "Structured Research Report" : o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="research-extra">Additional instructions (optional)</Label>
          <Textarea
            id="research-extra"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Tell the platform exactly what you want to know…"
            className="mt-2 min-h-24 rounded-xl bg-card"
          />
        </div>
      </div>

      <Button asChild size="lg" className="mt-6 w-full">
        <a ref={linkRef} href={targetUrl} target="_blank" rel="noopener noreferrer" onClick={handleResearchClick}>
          {platform === "google" ? <Search /> : <ClipboardCheck />}
          Research now <ArrowUpRight />
        </a>
      </Button>
      {embedded && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Google, ChatGPT, Claude and Gemini don't allow themselves to be shown inside another window. If you see “refused
          to connect”, open Crea-Link in its own browser tab and try again.
        </p>
      )}
      {status && (
        <p
          role="status"
          className={`mt-4 text-center text-sm ${status.tone === "ok" ? "text-status-accepted-ink" : "text-status-declined-ink"}`}
        >
          {status.text}
        </p>
      )}
      {fallback && (
        <div className="mt-4 space-y-3 rounded-2xl border border-border bg-card p-4">
          {fallback.prompt && (
            <>
              <Textarea
                readOnly
                value={fallback.prompt.trim()}
                onFocus={(e) => e.currentTarget.select()}
                className="min-h-40 rounded-xl bg-background text-xs"
                aria-label="Research prompt to copy"
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  const ok = await copyText(fallback.prompt ?? "");
                  setStatus(
                    ok
                      ? { tone: "ok", text: `✓ Prompt copied! Paste it into ${fallback.label}.` }
                      : { tone: "warn", text: "Copy is blocked here — select the text above and copy it manually." },
                  );
                }}
              >
                <ClipboardCheck /> Copy prompt
              </Button>
            </>
          )}
          <Button asChild className="w-full">
            <a href={fallback.url} target="_blank" rel="noopener noreferrer">
              Open {fallback.label} <ArrowUpRight />
            </a>
          </Button>
        </div>
      )}
      <p className="mt-4 text-center text-xs text-muted-foreground">
        No API keys or subscriptions required by Crea-Link. Your research, your platform, your choice.
      </p>
    </motion.section>
  );
}
