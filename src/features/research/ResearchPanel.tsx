import { useState } from "react";
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

  async function startResearch() {
    const q = question.trim();
    if (!q) {
      setStatus({ tone: "warn", text: "Please enter a research question." });
      return;
    }
    if (platform === "google") {
      window.open(RESEARCH_PLATFORMS.google.url + encodeURIComponent(q), "_blank", "noopener");
      setStatus({ tone: "ok", text: "Opened Google Search in a new tab." });
      return;
    }
    try {
      await navigator.clipboard.writeText(buildResearchPrompt(q, outputType, custom.trim(), storyContext));
      window.open(RESEARCH_PLATFORMS[platform].url, "_blank", "noopener");
      setStatus({
        tone: "ok",
        text: `Research prompt copied! Paste it into ${RESEARCH_PLATFORMS[platform].label} with Ctrl + V (or long-press → Paste on mobile).`,
      });
    } catch {
      setStatus({ tone: "warn", text: "Clipboard access failed. Please allow clipboard access and try again." });
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
            onKeyDown={(e) => e.key === "Enter" && void startResearch()}
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
          <Select value={outputType} onValueChange={setOutputType} disabled={platform === "google"}>
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
            disabled={platform === "google"}
            placeholder="Tell the platform exactly what you want to know…"
            className="mt-2 min-h-24 rounded-xl bg-card"
          />
        </div>
      </div>

      <Button onClick={() => void startResearch()} size="lg" className="mt-6 w-full">
        {platform === "google" ? <Search /> : <ClipboardCheck />}
        Research now <ArrowUpRight />
      </Button>
      {status && (
        <p
          role="status"
          className={`mt-4 text-center text-sm ${status.tone === "ok" ? "text-status-accepted-ink" : "text-status-declined-ink"}`}
        >
          {status.text}
        </p>
      )}
      <p className="mt-4 text-center text-xs text-muted-foreground">
        No API keys or subscriptions required by Crea-Link. Your research, your platform, your choice.
      </p>
    </motion.section>
  );
}
