import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, BookOpenText, FolderKanban, Home, LayoutGrid, LogOut, Search, Sparkles, UserRound, Users, Wand2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreatorAvatar } from "@/components/creator/bits";

export const NAV = [
  { to: "/feed", label: "Home", short: "Home", icon: Home },
  { to: "/explore", label: "Discover Creators", short: "Discover", icon: LayoutGrid },
  { to: "/projects", label: "Creative Projects", short: "Projects", icon: FolderKanban },
  { to: "/studio", label: "Collaborative Studio", short: "Studio", icon: Users },
  { to: "/assistant", label: "AI Story Assistant", short: "AI", icon: Wand2 },
  { to: "/research", label: "Research", short: "Research", icon: BookOpenText },
  { to: "/profile", label: "My Profile", short: "Me", icon: UserRound },
] as const;

function useActive() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (to: string) => path === to || path.startsWith(`${to}/`);
}

export function Logo({ to = "/feed" }: { to?: "/" | "/feed" }) {
  return (
    <Link to={to} className="flex items-center gap-2">
      <span className="hero-atmosphere relative flex size-8 items-center justify-center overflow-hidden rounded-xl border border-border">
        <span className="font-display text-lg italic leading-none text-foreground">c</span>
      </span>
      <span className="font-display text-2xl leading-none tracking-tight text-foreground">Crea-Link</span>
    </Link>
  );
}

function HeaderSearch({ className }: { className?: string }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  return (
    <form
      className={cn("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        navigate({ to: "/explore", search: q.trim() ? { q: q.trim() } : {} });
      }}
    >
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search creators, projects, genres…"
        aria-label="Search creators"
        className="h-10 w-full rounded-full border border-border bg-card/80 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-ring focus:shadow-[var(--shadow-soft)]"
      />
    </form>
  );
}

function Notifications() {
  const { requests, getPerson, hydrated, user } = useStore();
  const ME_ID = user?.id;
  const incoming = requests.filter((r) => r.toId === ME_ID && r.status === "pending");
  const accepted = requests.filter((r) => r.fromId === ME_ID && r.status === "accepted").slice(0, 2);
  const count = hydrated ? incoming.length : 0;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Notifications${count ? `, ${count} new` : ""}`} className="relative">
          <Bell className="size-[18px]" />
          <AnimatePresence>
            {count > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="notify-dot absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-notify text-[10px] font-bold text-primary-foreground"
              >
                {count}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-2xl p-0">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
        </div>
        <div className="max-h-80 overflow-y-auto p-1.5">
          {incoming.length === 0 && accepted.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">You're all caught up.</p>
          )}
          {incoming.map((r) => {
            const p = getPerson(r.fromId);
            if (!p) return null;
            return (
              <Link key={r.id} to="/requests" search={{ tab: "received" }} className="flex gap-3 rounded-xl p-2.5 transition-colors hover:bg-muted">
                <CreatorAvatar creator={p} size="sm" />
                <div className="min-w-0 text-sm">
                  <p className="leading-snug">
                    <span className="font-semibold">{p.name}</span> invited you to <span className="font-medium">{r.projectTitle}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</p>
                </div>
              </Link>
            );
          })}
          {accepted.map((r) => {
            const p = getPerson(r.toId);
            if (!p) return null;
            return (
              <Link key={r.id} to="/collaborations" className="flex gap-3 rounded-xl p-2.5 transition-colors hover:bg-muted">
                <CreatorAvatar creator={p} size="sm" />
                <p className="text-sm leading-snug">
                  <span className="font-semibold">{p.name}</span> accepted <span className="font-medium">{r.projectTitle}</span>
                </p>
              </Link>
            );
          })}
        </div>
        <div className="border-t border-border p-2">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link to="/requests">View all requests</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ProfileMenu() {
  const { me, user } = useStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  if (!me) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Open profile menu" className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <CreatorAvatar creator={me} size="sm" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl">
        <DropdownMenuLabel>
          <p className="font-semibold">{me.name}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile">My profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/collaborations">My collaborations</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/match">Find matches</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/requests">Collaboration requests</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppHeader() {
  const isActive = useActive();
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-8">
        <Logo />
        <HeaderSearch className="ml-4 hidden max-w-md flex-1 md:block" />
        <div className="ml-auto flex items-center gap-1.5">
          <Button asChild variant="ghost" size="icon" className="md:hidden" aria-label="Search">
            <Link to="/explore">
              <Search className="size-[18px]" />
            </Link>
          </Button>
          <Button asChild variant="match" size="sm" className="hidden sm:inline-flex">
            <Link to="/match">
              <Sparkles /> Match me
            </Link>
          </Button>
          <Notifications />
          <ProfileMenu />
        </div>
      </div>
      <nav aria-label="Main" className="mx-auto hidden h-11 max-w-7xl items-center gap-0.5 overflow-x-auto px-4 md:flex md:px-8 [scrollbar-width:none]">
        {NAV.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "relative whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  className="absolute inset-0 -z-10 rounded-full bg-accent"
                />
              )}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

export function MobileNav() {
  const isActive = useActive();
  const { requests, hydrated, user } = useStore();
  const pending = hydrated ? requests.filter((r) => r.toId === user?.id && r.status === "pending").length : 0;
  return (
    <nav aria-label="Main" className="fixed inset-x-2 bottom-3 z-40 md:hidden">
      <div className="genre-glass flex items-center justify-between rounded-full px-1 py-1.5 shadow-lift">
        {NAV.map((item) => {
          const active = isActive(item.to);
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} className="relative flex flex-1 flex-col items-center gap-0.5 rounded-full py-1.5">
              {active && (
                <motion.span layoutId="mobile-pill" className="absolute inset-0 -z-10 rounded-full bg-accent" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
              )}
              <span className="relative">
                <Icon className={cn("size-[18px]", active ? "text-foreground" : "text-muted-foreground")} />
                {item.to === "/profile" && pending > 0 && (
                  <span className="notify-dot absolute -right-1.5 -top-1 size-2 rounded-full bg-notify" />
                )}
              </span>
              <span className={cn("text-[10px]", active ? "font-semibold text-foreground" : "text-muted-foreground")}>{item.short}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
