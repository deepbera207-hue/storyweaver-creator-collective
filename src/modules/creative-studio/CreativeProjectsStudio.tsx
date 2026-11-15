import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import {
  Plus,
  Search,
  UserCheck,
  ArrowUpRight,
  AlertCircle,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import {
  ALL_GENRES,
  PROJECT_STATUSES,
  computeUnfilledRoles,
  type CreativeProject,
  type CreatorConnection,
  type Genre,
  type ProjectInvite,
  type ProjectStatus,
  type UserProfile,
} from './types/studio';
import { getGenreTheme, getThemeCssVars } from './theme/genreThemes';
import { studioService as firestoreStudio } from './services/studioService';
import { StudioProjectCard } from './components/StudioProjectCard';
import { CreateProjectModal } from './components/CreateProjectModal';
import { ProjectWorkspace, type WorkspaceTabId } from './components/ProjectWorkspace';
import { JoinByInviteModal } from './components/JoinByInviteModal';
import { PeopleConnectionsSection } from './components/PeopleConnectionsSection';
import { StudioAvatar } from './components/StudioAvatar';
import { resolveStudioAsset } from './assets/studioAssets';

export type StudioSection = 'projects' | 'roles' | 'people' | 'showcase';

export interface CreativeProjectsStudioProps {
  /** Signed-in Crea-Link user id (Lovable Cloud auth) */
  userId: string;
  /** Project to open in the collaborative workspace */
  initialProjectId?: string;
  /** Starting section of the projects dashboard */
  initialSection?: StudioSection;
  /** Show only projects the user owns or belongs to (Collaborative Studio view) */
  onlyMine?: boolean;
  /** Router-aware navigation hooks */
  onOpenProject?: (projectId: string) => void;
  onCloseProject?: () => void;
  /** Heading shown above the dashboard */
  heading?: string;
  subheading?: string;
  /** Workspace tab to show first when a project is opened */
  initialTab?: WorkspaceTabId;
}

export function CreativeProjectsStudio({
  userId,
  initialProjectId,
  initialSection = 'projects',
  onlyMine = false,
  onOpenProject,
  onCloseProject,
  heading = 'Creative Projects',
  initialTab,
  subheading = 'Launch original stories, films, animations and audio productions. Find open roles, join teams with invite codes, and showcase finished work.',
}: CreativeProjectsStudioProps) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [creators, setCreators] = useState<UserProfile[]>([]);
  const [connections, setConnections] = useState<CreatorConnection[]>([]);
  const [incomingInvites, setIncomingInvites] = useState<ProjectInvite[]>([]);
  const [projects, setProjects] = useState<CreativeProject[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(initialProjectId ?? null);
  const [workspacePatch, setWorkspacePatch] = useState<Partial<CreativeProject>>({});
  const [activeSection, setActiveSection] = useState<StudioSection>(initialSection);

  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState<Genre | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inviteModalCode, setInviteModalCode] = useState<string>('');
  const [showJoinInviteModal, setShowJoinInviteModal] = useState<boolean>(false);

  useEffect(() => {
    setActiveProjectIdState(initialProjectId ?? null);
  }, [initialProjectId]);

  useEffect(() => {
    try {
      const code = new URLSearchParams(window.location.search).get('invite')?.trim().toUpperCase();
      if (code) {
        setInviteModalCode(code);
        setShowJoinInviteModal(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function setActiveProjectId(id: string | null) {
    setActiveProjectIdState(id);
    if (id) onOpenProject?.(id);
    else onCloseProject?.();
  }

  // Subscribe to Lovable Cloud data (realtime) for the signed-in creator
  useEffect(() => {
    let disposed = false;
    setLoading(true);
    setErrorMsg(null);
    const unsubs: (() => void)[] = [];
    try {
      unsubs.push(
        firestoreStudio.subscribeCreators((list) => {
          if (disposed) return;
          setCreators(list);
          const self = list.find((c) => c.id === userId);
          if (self) setCurrentUser(self);
        }),
        firestoreStudio.subscribeConnections(userId, (list) => {
          if (!disposed) setConnections(list);
        }),
        firestoreStudio.subscribeIncomingInvites(userId, (list) => {
          if (!disposed) setIncomingInvites(list);
        }),
        firestoreStudio.subscribeDashboardProjects(userId, (list) => {
          if (disposed) return;
          setProjects(list);
          setLoading(false);
        })
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to load your studio.');
      setLoading(false);
    }
    return () => {
      disposed = true;
      unsubs.forEach((u) => u());
    };
  }, [userId]);

  // Subscribe to full workspace details when a project is open
  useEffect(() => {
    setWorkspacePatch({});
    if (!activeProjectId) return;
    const unsub = firestoreStudio.subscribeProjectWorkspace(activeProjectId, userId, (patch) => {
      setWorkspacePatch((prev) => ({ ...prev, ...patch }));
    });
    return () => unsub();
  }, [userId, activeProjectId]);

  const activeProject = useMemo(() => {
    if (!activeProjectId) return null;
    const base = projects.find((p) => p.id === activeProjectId);
    if (base) return { ...base, ...workspacePatch } as CreativeProject;
    if (workspacePatch.id === activeProjectId) return workspacePatch as CreativeProject;
    return null;
  }, [projects, activeProjectId, workspacePatch]);

  const visibleProjects = useMemo(
    () =>
      onlyMine
        ? projects.filter((p) => p.ownerId === userId || p.members.some((m) => m.userId === userId))
        : projects,
    [projects, onlyMine, userId]
  );

  const ownedProjects = useMemo(
    () => (currentUser ? projects.filter((p) => p.ownerId === currentUser.id) : []),
    [projects, currentUser]
  );

  const pendingPeopleCount = useMemo(() => {
    if (!currentUser) return 0;
    const pendingConnCount = connections.filter(
      (c) => c.status === 'pending' && c.toId === currentUser.id
    ).length;
    return pendingConnCount + incomingInvites.length;
  }, [connections, incomingInvites.length, currentUser]);

  const dashboardTheme = useMemo(
    () => getGenreTheme(genreFilter === 'all' ? undefined : genreFilter),
    [genreFilter]
  );

  const filteredProjects = useMemo(() => {
    return visibleProjects.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (genreFilter !== 'all' && !p.genres.includes(genreFilter)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        const matchesGenre = p.genres.some((g) => g.toLowerCase().includes(q));
        const matchesRole = p.requiredRoles.some((r) => r.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesGenre && !matchesRole) return false;
      }
      return true;
    });
  }, [visibleProjects, statusFilter, genreFilter, searchQuery]);

  const projectsWithOpenRoles = useMemo(
    () =>
      projects
        .filter((p) => !p.isDraft)
        .map((p) => ({
          project: p,
          unfilled: computeUnfilledRoles(p.requiredRoles, p.members),
        }))
        .filter((item) => item.unfilled.length > 0),
    [projects]
  );

  const aggregatedPortfolio = useMemo(
    () =>
      projects.flatMap((p) =>
        p.portfolio.map((item) => ({
          item,
          projectTitle: p.title,
          projectId: p.id,
          primaryGenre: p.primaryGenre,
        }))
      ),
    [projects]
  );

  function handleProjectDeleted(projectId: string) {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
      setWorkspacePatch({});
    }
  }

  function clearInviteQueryParam() {
    if (window.location.search.includes('invite=')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="surface flex items-center gap-3 rounded-2xl px-6 py-4 text-sm text-muted-foreground">
          <span className="size-4 animate-spin rounded-full border-2 border-g-accent border-t-transparent" />
          Opening your studio…
        </div>
      </div>
    );
  }

  if (activeProjectId && !activeProject && !loading) {
    return (
      <div className="surface mx-auto max-w-lg space-y-3 rounded-3xl p-10 text-center">
        <p className="font-display text-3xl">Project not available</p>
        <p className="text-sm text-muted-foreground">
          This project may be private, deleted, or you may need an invite code to join it.
        </p>
        <button
          type="button"
          onClick={() => setActiveProjectId(null)}
          className="mt-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
        >
          Back to projects
        </button>
      </div>
    );
  }

  return (
    <div
      style={getThemeCssVars(activeProject ? activeProject.primaryGenre : genreFilter === 'all' ? undefined : genreFilter)}
      className="overflow-hidden rounded-[2rem] border border-border bg-card text-slate-900 shadow-soft flex flex-col"
    >
      {/* Main Content Viewport */}
      <main className="flex-1">
        {activeProject ? (
          <ProjectWorkspace
            project={activeProject}
            currentUser={currentUser}
            allCreators={creators}
            onBack={() => setActiveProjectId(null)}
            onProjectDeleted={handleProjectDeleted}
            initialTab={initialTab}
          />
        ) : (
          <div
            style={{ background: dashboardTheme.softGradient }}
            className="transition-colors duration-500"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
              {/* Top Section: Title, Short Description, Active Profile Card & CTAs */}
              <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-200/70">
                <div className="space-y-2.5 max-w-2xl">
                  <h1 className="font-display text-4xl sm:text-5xl font-normal tracking-tight text-slate-900 text-balance">
                    {heading}
                  </h1>
                  <p className="text-sm sm:text-base leading-relaxed text-slate-600">{subheading}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Signed-In Creator Profile Button */}
                  <Link
                    to="/profile"
                    className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/90 border border-slate-200/90 hover:bg-white transition-colors text-left cursor-pointer"
                  >
                    <StudioAvatar
                      name={currentUser.name}
                      avatarUrl={currentUser.avatarUrl}
                      size="sm"
                      tintBg={dashboardTheme.accentSoft}
                      tintText={dashboardTheme.accentText}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                        <span className="truncate max-w-[140px]">{currentUser.name}</span>
                        <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {currentUser.creativeRole} · My profile
                      </div>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setInviteModalCode('');
                      setShowJoinInviteModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-white/90 border border-slate-200/90 text-slate-700 hover:bg-white transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" />
                    Join with Code
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    style={{ backgroundColor: dashboardTheme.accent, color: '#FFFFFF' }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl shadow-xs hover:opacity-95 transition-opacity whitespace-nowrap cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Project
                  </button>
                </div>
              </section>

              {/* Mobile Section Tabs */}
              <div className="flex items-center gap-1 p-1 bg-white/80 border border-slate-200 rounded-full overflow-x-auto w-fit max-w-full">
                {(
                  [
                    { id: 'projects', label: 'Projects' },
                    { id: 'roles', label: 'Open Roles' },
                    {
                      id: 'people',
                      label:
                        pendingPeopleCount > 0 ? `People (${pendingPeopleCount})` : 'Connect People',
                    },
                    { id: 'showcase', label: 'Showcase' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full whitespace-nowrap cursor-pointer transition-colors ${
                      activeSection === item.id
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2.5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <AnimatePresence mode="wait">
                {activeSection === 'projects' && (
                  <motion.div
                    key="section-projects"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-6"
                  >
                    {/* Filter & Search Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
                        <div className="relative flex-1 max-w-sm">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search projects, genres, or needed roles..."
                            className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl bg-white/90 border border-slate-200/90 focus:outline-none focus:border-slate-400"
                          />
                        </div>

                        <select
                          value={genreFilter}
                          onChange={(e) => setGenreFilter(e.target.value as Genre | 'all')}
                          aria-label="Filter by genre"
                          className="px-3 py-2 text-xs sm:text-sm rounded-xl bg-white/90 border border-slate-200/90 cursor-pointer"
                        >
                          <option value="all">All Genres</option>
                          {ALL_GENRES.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-1 p-1 bg-white/80 border border-slate-200/80 rounded-xl overflow-x-auto">
                        <button
                          type="button"
                          onClick={() => setStatusFilter('all')}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                            statusFilter === 'all'
                              ? 'bg-slate-900 text-white'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          All
                        </button>
                        {PROJECT_STATUSES.map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setStatusFilter(st)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                              statusFilter === st
                                ? 'bg-slate-900 text-white'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Project Cards Grid */}
                    {loading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((n) => (
                          <div
                            key={n}
                            className="h-72 rounded-2xl bg-white/70 border border-slate-200/70 animate-pulse p-6"
                          />
                        ))}
                      </div>
                    ) : filteredProjects.length === 0 ? (
                      <div className="studio-glass rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                        <p className="text-base font-semibold text-slate-800">
                          {visibleProjects.length === 0
                            ? onlyMine ? 'You are not in any projects yet' : 'No projects yet — start the first one'
                            : 'No matching projects found'}
                        </p>
                        <p className="text-sm text-slate-500 max-w-md mx-auto">
                          {visibleProjects.length === 0
                            ? 'Start a new collaborative project, join an existing one with an invite code, or connect with real creators.'
                            : 'Adjust your genre or status filters, or start a new creative project from scratch.'}
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowCreateModal(true)}
                            style={{ backgroundColor: dashboardTheme.accent, color: '#FFFFFF' }}
                            className="px-4 py-2 text-xs font-medium rounded-xl cursor-pointer"
                          >
                            Create New Project
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowJoinInviteModal(true)}
                            className="px-4 py-2 text-xs font-medium rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            Join with Invite Code
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map((project, idx) => (
                          <StudioProjectCard
                            key={project.id}
                            project={project}
                            index={idx}
                            onOpen={(id) => setActiveProjectId(id)}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeSection === 'roles' && (
                  <motion.div
                    key="section-roles"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold">Open Creative Positions</h2>
                        <p className="text-xs text-slate-600">
                          Projects actively seeking unfilled team roles. Open a project to join or
                          collaborate.
                        </p>
                      </div>
                    </div>

                    {projectsWithOpenRoles.length === 0 ? (
                      <div className="studio-glass rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">
                        No open creative positions right now. Start a project and list roles you need!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {projectsWithOpenRoles.map(({ project, unfilled }) => {
                          const t = getGenreTheme(project.primaryGenre);
                          return (
                            <div
                              key={project.id}
                              style={{ background: t.softGradient, borderColor: t.borderSubtle }}
                              className="rounded-2xl border p-5 flex flex-col justify-between space-y-4"
                            >
                              <div className="space-y-2">
                                <div className="text-xs font-medium" style={{ color: t.accentText }}>
                                  {project.genres.join(' · ')} · {project.status}
                                </div>
                                <h3 className="text-base font-semibold">{project.title}</h3>
                                <p className="text-xs line-clamp-2" style={{ color: t.mutedInk }}>
                                  {project.description}
                                </p>
                                <div className="pt-2">
                                  <div
                                    className="text-[11px] font-medium mb-1.5"
                                    style={{ color: t.mutedInk }}
                                  >
                                    Open Positions
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {unfilled.map((role) => (
                                      <span
                                        key={role}
                                        className="px-2.5 py-1 text-xs rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                                      >
                                        {role}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => setActiveProjectId(project.id)}
                                  style={{ borderColor: t.borderStrong, color: t.accentText }}
                                  className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-medium rounded-xl bg-white/90 border hover:bg-white cursor-pointer"
                                >
                                  View & Join
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeSection === 'people' && (
                  <motion.div
                    key="section-people"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <PeopleConnectionsSection
                      currentUser={currentUser}
                      allCreators={creators}
                      connections={connections}
                      incomingInvites={incomingInvites}
                      ownedProjects={ownedProjects}
                      theme={dashboardTheme}
                      onOpenProject={(projectId) => setActiveProjectId(projectId)}
                    />
                  </motion.div>
                )}

                {activeSection === 'showcase' && (
                  <motion.div
                    key="section-showcase"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-5"
                  >
                    <div>
                      <h2 className="text-lg font-semibold">Studio Portfolio Showcase</h2>
                      <p className="text-xs text-slate-600">
                        Finished animations, artwork, soundtracks, and character designs published by
                        collaborative project teams.
                      </p>
                    </div>

                    {aggregatedPortfolio.length === 0 ? (
                      <div className="studio-glass rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">
                        No finished portfolio pieces have been published yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {aggregatedPortfolio.map(
                          ({ item, projectTitle, projectId, primaryGenre }) => {
                            const t = getGenreTheme(primaryGenre);
                            const imgSrc =
                              resolveStudioAsset(item.previewImageUrl || item.mediaUrl) ||
                              item.mediaUrl;
                            return (
                              <article
                                key={item.id}
                                style={{ background: t.softGradient, borderColor: t.borderSubtle }}
                                className="rounded-2xl border overflow-hidden flex flex-col justify-between"
                              >
                                <div>
                                  <div
                                    className="h-52 overflow-hidden border-b bg-white"
                                    style={{ borderColor: t.borderSubtle }}
                                  >
                                    <img
                                      src={imgSrc}
                                      alt={item.title}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="p-5 space-y-1.5">
                                    <div
                                      className="text-[11px] font-medium"
                                      style={{ color: t.accentText }}
                                    >
                                      {item.mediaType} · {projectTitle}
                                    </div>
                                    <h3 className="text-base font-semibold">{item.title}</h3>
                                    <p
                                      className="text-xs line-clamp-2"
                                      style={{ color: t.mutedInk }}
                                    >
                                      {item.description}
                                    </p>
                                  </div>
                                </div>
                                <div
                                  className="px-5 py-3 border-t flex items-center justify-between text-xs"
                                  style={{ borderColor: t.borderSubtle }}
                                >
                                  <span className="truncate" style={{ color: t.mutedInk }}>
                                    {item.contributors.join(', ')}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setActiveProjectId(projectId)}
                                    className="font-medium hover:underline whitespace-nowrap cursor-pointer"
                                    style={{ color: t.accentText }}
                                  >
                                    Open Project
                                  </button>
                                </div>
                              </article>
                            );
                          }
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        currentUser={currentUser}
        onCreated={(created) => {
          setProjects((prev) =>
            prev.some((p) => p.id === created.id) ? prev : [created, ...prev]
          );
          setActiveProjectId(created.id);
        }}
      />

      <JoinByInviteModal
        isOpen={showJoinInviteModal}
        initialCode={inviteModalCode}
        currentUser={currentUser}
        onClose={() => {
          setShowJoinInviteModal(false);
          setInviteModalCode('');
          clearInviteQueryParam();
        }}
        onJoinedProject={(projectId) => {
          setActiveProjectId(projectId);
          setShowJoinInviteModal(false);
          setInviteModalCode('');
          clearInviteQueryParam();
        }}
      />
    </div>
  );
}
