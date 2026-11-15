import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ME_ID } from "@/data/creators";
import { useStore, type RequestStatus } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/motion";
import { RequestCard } from "@/components/requests/RequestCard";

type Tab = "received" | "sent";
type StatusFilter = RequestStatus | "all";
type RequestsSearch = { tab?: Tab | undefined; status?: StatusFilter | undefined };

export const Route = createFileRoute("/_authenticated/_authenticated/requests")({
  validateSearch: (s: Record<string, unknown>): RequestsSearch => ({
    tab: s["tab"] === "sent" || s["tab"] === "received" ? s["tab"] : undefined,
    status: ["pending", "accepted", "declined", "all"].includes(s["status"] as string)
      ? (s["status"] as StatusFilter)
      : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Collaboration requests — Crea-Link" },
      { name: "description", content: "Review, accept or decline collaboration requests and track the ones you've sent." },
      { property: "og:title", content: "Collaboration requests — Crea-Link" },
      { property: "og:description", content: "Review, accept or decline collaboration requests and track the ones you've sent." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RequestsPage,
});

function Segmented<T extends string>({
  id,
  value,
  options,
  onChange,
}: {
  id: string;
  value: T;
  options: { value: T; label: string; count?: number }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-border bg-card p-1" role="tablist">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cn("relative rounded-full px-4 py-1.5 text-sm transition-colors", on ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            {on && <motion.span layoutId={id} className="absolute inset-0 -z-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
            <span className="relative z-10 flex items-center gap-1.5">
              {o.label}
              {o.count !== undefined && <span className={cn("text-xs", on ? "opacity-80" : "opacity-60")}>{o.count}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function RequestsPage() {
  const { requests, hydrated } = useStore();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/requests" });
  const tab: Tab = search.tab ?? "received";
  const status: StatusFilter = search.status ?? "all";

  const inTab = requests.filter((r) => (tab === "received" ? r.toId === ME_ID : r.fromId === ME_ID));
  const visible = inTab
    .filter((r) => status === "all" || r.status === status)
    .sort((a, b) => (a.status === "pending" ? -1 : 0) - (b.status === "pending" ? -1 : 0) || b.createdAt.localeCompare(a.createdAt));
  const count = (s: RequestStatus) => inTab.filter((r) => r.status === s).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Collaboration Requests"
        title="Invitations, both ways."
        description="Accept the projects that light you up. Everything you send lives under Sent."
      >
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          id="req-tab"
          value={tab}
          onChange={(v) => navigate({ search: (p) => ({ ...p, tab: v }), replace: true })}
          options={[
            { value: "received", label: "Received", count: requests.filter((r) => r.toId === ME_ID).length },
            { value: "sent", label: "Sent", count: requests.filter((r) => r.fromId === ME_ID).length },
          ]}
        />
        <Segmented
          id="req-status"
          value={status}
          onChange={(v) => navigate({ search: (p) => ({ ...p, status: v }), replace: true })}
          options={[
            { value: "all", label: "All" },
            { value: "pending", label: "Pending", count: count("pending") },
            { value: "accepted", label: "Accepted", count: count("accepted") },
            { value: "declined", label: "Declined", count: count("declined") },
          ]}
        />
      </div>

      {!hydrated ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl border border-border bg-muted/60" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="surface rounded-3xl p-12 text-center">
          <p className="font-display text-3xl">Nothing here right now.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {tab === "sent" ? "Find someone whose work you love and invite them." : "New invitations will appear here."}
          </p>
          <Button asChild className="mt-6" variant="outline">
            <Link to="/explore">Explore creators</Link>
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {visible.map((r) => (
              <RequestCard key={r.id} request={r} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
