import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  LayoutGrid,
  FileText,
  MessageSquare,
  Users,
  CheckSquare,
  BarChart3,
  Sparkles,
  Wand2,
  BookOpenText,
} from 'lucide-react';
import { StoryAssistantPage } from '@/features/story-assistant/StoryAssistantPage';
import { ResearchPanel } from '@/features/research/ResearchPanel';
import { storyGenreForProject } from '@/lib/genre-theme';
import type { CreativeProject, UserProfile } from '../types/studio';
import { getGenreTheme, getThemeCssVars, STATUS_STYLES } from '../theme/genreThemes';
import { ProjectOverviewTab } from './ProjectOverviewTab';
import { ScriptTab } from './ScriptTab';
import { CollaborationTab } from './CollaborationTab';
import { TeamTab } from './TeamTab';
import { ProgressTab } from './ProgressTab';
import { ContributionsTab } from './ContributionsTab';
import { PortfolioTab } from './PortfolioTab';

export type WorkspaceTabId =
  | 'overview'
  | 'script'
  | 'collaboration'
  | 'team'
  | 'progress'
  | 'contributions'
  | 'portfolio'
  | 'assistant'
  | 'research';

interface ProjectWorkspaceProps {
  project: CreativeProject;
  currentUser: UserProfile;
  allCreators: UserProfile[];
  onBack: () => void;
  onProjectUpdate?: (updated: CreativeProject) => void | undefined;
  onProjectDeleted: (projectId: string) => void;
  initialTab?: WorkspaceTabId | undefined;
}

const WORKSPACE_TABS: { id: WorkspaceTabId; label: string; Icon: typeof LayoutGrid }[] = [
  { id: 'overview', label: 'Overview', Icon: LayoutGrid },
  { id: 'script', label: 'Script', Icon: FileText },
  { id: 'collaboration', label: 'Group Chat', Icon: MessageSquare },
  { id: 'assistant', label: 'AI Story Assistant', Icon: Wand2 },
  { id: 'research', label: 'Research', Icon: BookOpenText },
  { id: 'team', label: 'Team', Icon: Users },
  { id: 'progress', label: 'Progress', Icon: CheckSquare },
  { id: 'contributions', label: 'Contributions', Icon: BarChart3 },
  { id: 'portfolio', label: 'Portfolio', Icon: Sparkles },
];

export function ProjectWorkspace({
  project,
  currentUser,
  allCreators,
  onBack,
  onProjectUpdate = () => {},
  onProjectDeleted,
  initialTab,
}: ProjectWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTabId>(initialTab ?? 'overview');
  const isMember = project.ownerId === currentUser.id || project.members.some((m) => m.userId === currentUser.id);
  const projectContext = [
    `Project: ${project.title}`,
    `Genres: ${project.genres.join(', ')} (primary: ${project.primaryGenre})`,
    `Status: ${project.status}`,
    project.description ? `Logline / description: ${project.description}` : '',
    project.members.length ? `Team: ${project.members.map((m) => `${m.name} (${m.creativeRole})`).join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  const theme = getGenreTheme(project.primaryGenre);
  const cssVars = getThemeCssVars(project.primaryGenre);
  const statusStyle = STATUS_STYLES[project.status];

  return (
    <div
      style={{ ...cssVars, background: theme.softGradient, color: theme.ink }}
      className="transition-colors duration-500"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Workspace Header & Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-white/85 border hover:bg-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
              style={{ borderColor: theme.borderSubtle, color: theme.ink }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All Projects
            </button>
            <div className="min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: theme.accentText }}>
                {project.genres.join(' · ')}
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight truncate">
                {project.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              style={{
                backgroundColor: statusStyle.bg,
                borderColor: statusStyle.border,
                color: statusStyle.text,
              }}
              className="px-3 py-1 text-xs font-medium rounded-lg border whitespace-nowrap"
            >
              {statusStyle.label}
            </span>
          </div>
        </div>

        {/* 7-Tab Navigation Bar */}
        <nav
          aria-label="Project workspace sections"
          className="studio-glass p-1.5 rounded-2xl border flex items-center gap-1 overflow-x-auto"
          style={{ borderColor: theme.borderSubtle }}
        >
          {WORKSPACE_TABS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                style={
                  active
                    ? {
                        backgroundColor: '#FFFFFF',
                        color: theme.accentText,
                        borderColor: theme.borderStrong,
                      }
                    : { color: theme.mutedInk, borderColor: 'transparent' }
                }
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl border transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  active ? 'shadow-xs' : 'hover:bg-white/60 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Active Tab Viewport with Smooth Transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === 'overview' && (
              <ProjectOverviewTab
                project={project}
                currentUser={currentUser}
                theme={theme}
                onProjectUpdate={onProjectUpdate}
                onProjectDeleted={onProjectDeleted}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}
            {activeTab === 'script' && (
              <ScriptTab
                project={project}
                currentUser={currentUser}
                theme={theme}
                onProjectUpdate={onProjectUpdate}
              />
            )}
            {activeTab === 'collaboration' && (
              <CollaborationTab
                project={project}
                currentUser={currentUser}
                theme={theme}
                onProjectUpdate={onProjectUpdate}
              />
            )}
            {activeTab === 'team' && (
              <TeamTab
                project={project}
                currentUser={currentUser}
                allCreators={allCreators}
                theme={theme}
                onProjectUpdate={onProjectUpdate}
              />
            )}
            {activeTab === 'progress' && (
              <ProgressTab
                project={project}
                currentUser={currentUser}
                theme={theme}
                onProjectUpdate={onProjectUpdate}
              />
            )}
            {activeTab === 'contributions' && (
              <ContributionsTab
                project={project}
                currentUser={currentUser}
                theme={theme}
                onProjectUpdate={onProjectUpdate}
              />
            )}
            {activeTab === 'assistant' &&
              (isMember ? (
                <StoryAssistantPage
                  key={project.id}
                  embedded
                  initialTitle={project.title}
                  initialStory={project.script?.textContent?.slice(0, 6000) ?? ''}
                  initialGenreId={storyGenreForProject(project.primaryGenre)}
                  projectContext={projectContext}
                  storageKey={`crealink_story_assistant_${project.id}`}
                />
              ) : (
                <div className="studio-glass rounded-2xl border p-10 text-center text-sm" style={{ borderColor: theme.borderSubtle }}>
                  Join this project to use the AI Story Assistant with its script and context.
                </div>
              ))}
            {activeTab === 'research' && (
              <ResearchPanel compact storyContext={`${project.title} — ${project.primaryGenre}. ${project.description}`.slice(0, 400)} />
            )}
            {activeTab === 'portfolio' && (
              <PortfolioTab
                project={project}
                currentUser={currentUser}
                theme={theme}
                onProjectUpdate={onProjectUpdate}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
