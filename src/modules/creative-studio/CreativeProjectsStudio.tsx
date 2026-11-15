import { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  UserCheck,
  ArrowUpRight,
  AlertCircle,
  KeyRound,
  Users,
  Sparkles,
  Globe2,
  ShieldCheck,
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
import {
  checkRedirectSignIn,
  studioGoogleSignIn,
  studioGoogleSignInRedirect,
  subscribeAuthState,
  testFirestoreConnection,
} from './services/firebaseClient';
import { firestoreStudio } from './services/firestoreStudio';
import { StudioProjectCard } from './components/StudioProjectCard';
import { CreateProjectModal } from './components/CreateProjectModal';
import { ProjectWorkspace } from './components/ProjectWorkspace';
import { CreatorProfileModal } from './components/CreatorProfileModal';
import { BackendSetupModal } from './components/BackendSetupModal';
import { JoinByInviteModal } from './components/JoinByInviteModal';
import { PeopleConnectionsSection } from './components/PeopleConnectionsSection';
import { StudioAvatar } from './components/StudioAvatar';
import { GoogleSignInButton } from './components/GoogleSignInButton';
import { resolveStudioAsset } from './assets/studioAssets';

export interface CreativeProjectsStudioProps {
  /** Optional initial project ID when embedding into a platform router */
  initialProjectId?: string;
}

type StudioSection = 'projects' | 'roles' | 'people' | 'showcase';

export function CreativeProjectsStudio({ initialProjectId }: CreativeProjectsStudioProps) {
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isNewUserBanner, setIsNewUserBanner] = useState(false);

  const [creators, setCreators] = useState<UserProfile[]>([]);
  const [connections, setConnections] = useState<CreatorConnection[]>([]);
  const [incomingInvites, setIncomingInvites] = useState<ProjectInvite[]>([]);
  const [projects, setProjects] = useState<CreativeProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(initialProjectId ?? null);
  const [workspacePatch, setWorkspacePatch] = useState<Partial<CreativeProject>>({});
  const [activeSection, setActiveSection] = useState<StudioSection>('projects');

  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState<Genre | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBackendModal, setShowBackendModal] = useState(false);
  const [inviteModalCode, setInviteModalCode] = useState<string>(() => {
    try {
      return new URLSearchParams(window.location.search).get('invite')?.trim().toUpperCase() || '';
    } catch {
      return '';
    }
  });
  const [showJoinInviteModal, setShowJoinInviteModal] = useState<boolean>(() => {
    try {
      return Boolean(new URLSearchParams(window.location.search).get('invite')?.trim());
    } catch {
      return false;
    }
  });

  // Boot Firestore connectivity check + Firebase Auth state subscription
  useEffect(() => {
    void testFirestoreConnection();
    void checkRedirectSignIn().catch(() => {});

    const unsub = subscribeAuthState((user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      setAuthError(null);
      if (!user) {
        setCurrentUser(null);
        setCreators([]);
        setConnections([]);
        setIncomingInvites([]);
        setProjects([]);
        setWorkspacePatch({});
        setIsNewUserBanner(false);
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  // Ensure Firestore creator profile & subscribe to real-time collections when signed in
  useEffect(() => {
    if (!firebaseUser) return;
    let disposed = false;
    setLoading(true);
    setErrorMsg(null);

    const unsubs: (() => void)[] = [];

    void firestoreStudio
      .ensureCreatorProfile(firebaseUser)
      .then(({ profile, isNew }) => {
        if (disposed) return;
        setCurrentUser(profile);
        if (isNew) setIsNewUserBanner(true);

        unsubs.push(
          firestoreStudio.subscribeCreators((list) => {
            if (disposed) return;
            setCreators(list);
            const updatedSelf = list.find((c) => c.id === firebaseUser.uid);
            if (updatedSelf) {
              setCurrentUser((prev) =>
                prev
                  ? { ...updatedSelf, email: prev.email || firebaseUser.email || '' }
                  : updatedSelf
              );
            }
          }),
          firestoreStudio.subscribeConnections(firebaseUser.uid, (list) => {
            if (!disposed) setConnections(list);
          }),
          firestoreStudio.subscribeIncomingInvites(firebaseUser.uid, (list) => {
            if (!disposed) setIncomingInvites(list);
          }),
          firestoreStudio.subscribeDashboardProjects(firebaseUser.uid, (list) => {
            if (disposed) return;
            setProjects(list);
            setLoading(false);
          })
        );
      })
      .catch((err) => {
        if (disposed) return;
        setErrorMsg(err instanceof Error ? err.message : 'Unable to sync with Cloud Firestore.');
        setLoading(false);
      });

    return () => {
      disposed = true;
      unsubs.forEach((u) => u());
    };
  }, [firebaseUser]);

  // Subscribe to full workspace details when a project is open
  useEffect(() => {
    setWorkspacePatch({});
    if (!firebaseUser || !activeProjectId) return;

    const unsub = firestoreStudio.subscribeProjectWorkspace(
      activeProjectId,
      firebaseUser.uid,
      (patch) => {
        setWorkspacePatch((prev) => ({ ...prev, ...patch }));
      }
    );
    return () => unsub();
  }, [firebaseUser, activeProjectId]);

  const activeProject = useMemo(() => {
    if (!activeProjectId) return null;
    const base = projects.find((p) => p.id === activeProjectId);
    if (!base) return null;
    return { ...base, ...workspacePatch };
  }, [projects, activeProjectId, workspacePatch]);

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
    () => getGenreTheme(genreFilter === 'all' ? 'Animation' : genreFilter),
    [genreFilter]
  );

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
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
  }, [projects, statusFilter, genreFilter, searchQuery]);

  const projectsWithOpenRoles = useMemo(
    () =>
      projects
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

  async function handleGoogleSignIn() {
    setAuthError(null);
    setAuthBusy(true);
    try {
      await studioGoogleSignIn();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to sign in with Google.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleRedirectSignIn() {
    setAuthError(null);
    setAuthBusy(true);
    try {
      await studioGoogleSignInRedirect();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Redirect sign-in failed.');
      setAuthBusy(false);
    }
  }

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

  // Initial Firebase auth hydration
  if (!authReady) {
    return (
      <div
        style={getThemeCssVars('Animation')}
        className="min-h-screen flex items-center justify-center bg-slate-50 px-4"
      >
        <div className="studio-glass rounded-2xl border border-slate-200/80 px-8 py-6 text-center space-y-2 shadow-sm">
          <div className="w-6 h-6 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-700">Connecting to Creative Studio...</p>
        </div>
      </div>
    );
  }

  // Signed-Out Experience: Clean Google Sign-In Gate + Optional Invite Preview
  if (!firebaseUser || !currentUser) {
    return (
      <div
        style={{
          ...getThemeCssVars('Animation'),
          background: dashboardTheme.softGradient,
        }}
        className="min-h-screen text-slate-900 flex flex-col"
      >
        <header className="studio-glass border-b border-slate-200/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between gap-6">
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
              Creative Studio
            </span>
            <button
              type="button"
              onClick={() => setShowBackendModal(true)}
              className="text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer whitespace-nowrap"
            >
              Cloud Sync Guide
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-xl studio-glass rounded-3xl border border-slate-200/80 shadow-xl p-8 sm:p-10 space-y-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
              <Globe2 className="w-6 h-6" />
            </div>

            <div className="space-y-2.5">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 text-balance">
                Creative Projects Studio
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-md mx-auto">
                Sign in with Google to share one live workspace with your friends across any device—
                connect with real creators, share invite codes, chat, upload media, and publish your
                finished portfolio.
              </p>
            </div>

            {inviteModalCode && (
              <div className="p-3.5 rounded-2xl bg-indigo-50/90 border border-indigo-200/80 text-indigo-900 text-xs sm:text-sm flex items-center justify-center gap-2">
                <KeyRound className="w-4 h-4 shrink-0" />
                <span>
                  Invite code <strong className="font-mono">{inviteModalCode}</strong> is ready—sign
                  in below to join the project.
                </span>
              </div>
            )}

            {authError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm text-left space-y-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
                <div>
                  <button
                    type="button"
                    disabled={authBusy}
                    onClick={() => void handleRedirectSignIn()}
                    className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-white border border-rose-200 text-rose-900 hover:bg-rose-100/50 cursor-pointer"
                  >
                    Try Redirect Sign-In Instead
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col items-center gap-3 pt-1">
              <GoogleSignInButton
                onClick={() => void handleGoogleSignIn()}
                loading={authBusy}
                label="Sign in with Google"
              />
              <button
                type="button"
                onClick={() => setShowJoinInviteModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 underline cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Have an invite code?
              </button>
            </div>

            <div className="pt-4 border-t border-slate-200/70 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Standard Google Sign-In
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                Real-Time Cloud Sync
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Optional Google Drive Import
              </span>
            </div>
          </div>
        </main>

        <BackendSetupModal
          isOpen={showBackendModal}
          onClose={() => setShowBackendModal(false)}
        />

        <JoinByInviteModal
          isOpen={showJoinInviteModal}
          initialCode={inviteModalCode}
          currentUser={null}
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

  return (
    <div
      style={getThemeCssVars(
        activeProject
          ? activeProject.primaryGenre
          : genreFilter === 'all'
            ? 'Animation'
            : genreFilter
      )}
      className="min-h-screen bg-white text-slate-900 flex flex-col"
    >
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 studio-glass border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => {
              setActiveProjectId(null);
              setActiveSection('projects');
            }}
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Creative Studio
          </button>

          {/* Zone 2: 4 Clean Single-Line Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => {
                setActiveProjectId(null);
                setActiveSection('projects');
              }}
              className={`whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:text-slate-900 ${
                !activeProject && activeSection === 'projects'
                  ? 'text-slate-900 underline underline-offset-8'
                  : ''
              }`}
            >
              Studio Projects
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveProjectId(null);
                setActiveSection('roles');
              }}
              className={`whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:text-slate-900 ${
                !activeProject && activeSection === 'roles'
                  ? 'text-slate-900 underline underline-offset-8'
                  : ''
              }`}
            >
              Open Roles
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveProjectId(null);
                setActiveSection('people');
              }}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:text-slate-900 ${
                !activeProject && activeSection === 'people'
                  ? 'text-slate-900 underline underline-offset-8'
                  : ''
              }`}
            >
              <span>Connect People</span>
              {pendingPeopleCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-600 text-white tabular-nums leading-none">
                  {pendingPeopleCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveProjectId(null);
                setActiveSection('showcase');
              }}
              className={`whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:text-slate-900 ${
                !activeProject && activeSection === 'showcase'
                  ? 'text-slate-900 underline underline-offset-8'
                  : ''
              }`}
            >
              Portfolio Showcase
            </button>
          </nav>

          {/* Zone 3: 1 Primary CTA */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              style={{ backgroundColor: dashboardTheme.accent, color: '#FFFFFF' }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium rounded-xl shadow-xs hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create New Project
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1">
        {activeProject ? (
          <ProjectWorkspace
            project={activeProject}
            currentUser={currentUser}
            allCreators={creators}
            onBack={() => setActiveProjectId(null)}
            onProjectDeleted={handleProjectDeleted}
          />
        ) : (
          <div
            style={{ background: dashboardTheme.softGradient }}
            className="min-h-[calc(100vh-73px)] transition-colors duration-500"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
              {/* Top Section: Title, Short Description, Active Profile Card & CTAs */}
              <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-200/70">
                <div className="space-y-2.5 max-w-2xl">
                  <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 text-balance">
                    Creative Projects Studio
                  </h1>
                  <p className="text-sm sm:text-base leading-relaxed text-slate-600">
                    Launch original films, animations, audio productions, and collaborative stories.
                    Connect with real creators, share scripts and media in real time, track
                    milestones, and showcase your team’s finished portfolio.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Signed-In Creator Profile Button */}
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(true)}
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
                        {currentUser.creativeRole} · Profile & Drive
                      </div>
                    </div>
                  </button>

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

              {isNewUserBanner && (
                <div className="studio-glass rounded-2xl border border-indigo-200/80 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-800">
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      Welcome to Creative Studio, <strong>{currentUser.name}</strong>! Set your
                      creative role and bio so other real creators can discover and connect with you.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewUserBanner(false);
                        setShowProfileModal(true);
                      }}
                      className="px-3.5 py-1.5 text-xs font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                    >
                      Set My Role
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsNewUserBanner(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* Mobile Section Tabs */}
              <div className="flex md:hidden items-center gap-1 p-1 bg-white/80 border border-slate-200 rounded-xl overflow-x-auto">
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
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap cursor-pointer ${
                      activeSection === item.id
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600'
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
                          {projects.length === 0
                            ? 'Create your first cloud-synced project'
                            : 'No matching projects found'}
                        </p>
                        <p className="text-sm text-slate-500 max-w-md mx-auto">
                          {projects.length === 0
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

      <CreatorProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        firebaseUser={firebaseUser}
        currentUser={currentUser}
        onProfileUpdated={(updated) => setCurrentUser(updated)}
        onOpenBackendGuide={() => {
          setShowProfileModal(false);
          setShowBackendModal(true);
        }}
      />

      <BackendSetupModal
        isOpen={showBackendModal}
        onClose={() => setShowBackendModal(false)}
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
