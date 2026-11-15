import { useState } from 'react';
import { Pencil, Check, X, UserPlus, Trash2, Globe, Lock } from 'lucide-react';
import {
  ALL_GENRES,
  CREATIVE_ROLES,
  PROJECT_STATUSES,
  computeProjectProgress,
  computeUnfilledRoles,
  type CreativeProject,
  type CreativeRole,
  type Genre,
  type ProjectStatus,
  type UserProfile,
} from '../types/studio';
import type { GenreThemeTokens } from '../theme/genreThemes';
import { STATUS_STYLES } from '../theme/genreThemes';
import { firestoreStudio } from '../services/firestoreStudio';

interface ProjectOverviewTabProps {
  project: CreativeProject;
  currentUser: UserProfile;
  theme: GenreThemeTokens;
  onProjectUpdate: (updated: CreativeProject) => void;
  onProjectDeleted: (projectId: string) => void;
  onNavigateTab: (tab: 'script' | 'collaboration' | 'team' | 'progress' | 'contributions' | 'portfolio') => void;
}

export function ProjectOverviewTab({
  project,
  currentUser,
  theme,
  onProjectDeleted,
  onNavigateTab,
}: ProjectOverviewTabProps) {
  const isOwner = project.ownerId === currentUser.id;
  const isMember = project.members.some((m) => m.userId === currentUser.id);
  const progress = computeProjectProgress(project.tasks);
  const unfilledRoles = computeUnfilledRoles(project.requiredRoles, project.members);
  const statusStyle = STATUS_STYLES[project.status];

  const [editingInfo, setEditingInfo] = useState(false);
  const [titleInput, setTitleInput] = useState(project.title);
  const [descInput, setDescInput] = useState(project.description);
  const [joinRole, setJoinRole] = useState<CreativeRole>(
    unfilledRoles[0] || currentUser.creativeRole
  );
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function saveTitleAndDesc() {
    setBusy(true);
    setErrorMsg(null);
    try {
      await firestoreStudio.updateProject(project.id, {
        title: titleInput,
        description: descInput,
      });
      setEditingInfo(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save details.');
    } finally {
      setBusy(false);
    }
  }

  async function handleStatusChange(nextStatus: ProjectStatus) {
    setBusy(true);
    setErrorMsg(null);
    try {
      await firestoreStudio.updateProject(project.id, {
        status: nextStatus,
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to update status.');
    } finally {
      setBusy(false);
    }
  }

  async function handlePrimaryGenreChange(nextPrimary: Genre) {
    setBusy(true);
    setErrorMsg(null);
    try {
      const nextGenres = project.genres.includes(nextPrimary)
        ? project.genres
        : [nextPrimary, ...project.genres];
      await firestoreStudio.updateProject(project.id, {
        primaryGenre: nextPrimary,
        genres: nextGenres,
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to switch genre theme.');
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleRequiredRole(role: CreativeRole) {
    if (!isOwner) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      const exists = project.requiredRoles.includes(role);
      const nextRoles = exists
        ? project.requiredRoles.filter((r) => r !== role)
        : [...project.requiredRoles, role];
      await firestoreStudio.updateProject(project.id, {
        requiredRoles: nextRoles,
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to update required roles.');
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleDraft() {
    if (!isOwner) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      await firestoreStudio.updateProject(project.id, {
        isDraft: !project.isDraft,
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to update visibility.');
    } finally {
      setBusy(false);
    }
  }

  async function handleJoinOpenProject() {
    setBusy(true);
    setErrorMsg(null);
    try {
      await firestoreStudio.joinOpenProject(project, currentUser, joinRole);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to join project.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await firestoreStudio.deleteProject(project.id, currentUser.id);
      onProjectDeleted(project.id);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to delete project.');
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Main Editable Narrative & Theme Controls */}
      <div
        className="studio-glass rounded-2xl border p-6 space-y-5 transition-colors duration-500"
        style={{ borderColor: theme.borderSubtle }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-[260px]">
            {editingInfo ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-lg font-semibold rounded-xl bg-white border focus:outline-none"
                  style={{ borderColor: theme.borderStrong }}
                />
                <textarea
                  rows={3}
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-white border focus:outline-none"
                  style={{ borderColor: theme.borderSubtle }}
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void saveTitleAndDesc()}
                    style={{ backgroundColor: theme.accent, color: '#FFFFFF' }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTitleInput(project.title);
                      setDescInput(project.description);
                      setEditingInfo(false);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-black/5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-2xl font-semibold tracking-tight">{project.title}</h2>
                  {isMember && (
                    <button
                      type="button"
                      onClick={() => {
                        setTitleInput(project.title);
                        setDescInput(project.description);
                        setEditingInfo(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-white/80 border hover:bg-white transition-colors cursor-pointer"
                      style={{ borderColor: theme.borderSubtle, color: theme.mutedInk }}
                    >
                      <Pencil className="w-3 h-3" />
                      Rename / Edit
                    </button>
                  )}
                </div>
                <p className="mt-2.5 text-sm leading-relaxed max-w-3xl" style={{ color: theme.mutedInk }}>
                  {project.description || 'No description added yet. Edit project details to share your creative vision.'}
                </p>
              </div>
            )}
          </div>

          {/* Genre Theme Switcher & Status Control */}
          <div className="flex flex-col sm:items-end gap-2.5 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                style={{
                  backgroundColor: statusStyle.bg,
                  borderColor: statusStyle.border,
                  color: statusStyle.text,
                }}
                className="px-3 py-1 text-xs font-medium rounded-lg border"
              >
                Status: {project.status}
              </span>

              {isOwner && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleToggleDraft()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-white border hover:bg-slate-50 cursor-pointer"
                  style={{ borderColor: theme.borderSubtle }}
                >
                  {project.isDraft ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      Draft (Publish)
                    </>
                  ) : (
                    <>
                      <Globe className="w-3.5 h-3.5" />
                      Published
                    </>
                  )}
                </button>
              )}
            </div>

            {isMember && (
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs" style={{ color: theme.mutedInk }}>
                  Update Status:
                </label>
                <select
                  value={project.status}
                  disabled={busy}
                  onChange={(e) => void handleStatusChange(e.target.value as ProjectStatus)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border cursor-pointer"
                  style={{ borderColor: theme.borderSubtle }}
                >
                  {PROJECT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <label className="text-xs ml-1" style={{ color: theme.mutedInk }}>
                  Theme Genre:
                </label>
                <select
                  value={project.primaryGenre}
                  disabled={busy}
                  onChange={(e) => void handlePrimaryGenreChange(e.target.value as Genre)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border cursor-pointer"
                  style={{ borderColor: theme.borderStrong, color: theme.accentText }}
                >
                  {ALL_GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Summary Metrics Strip */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t"
          style={{ borderColor: theme.borderSubtle }}
        >
          <button
            type="button"
            onClick={() => onNavigateTab('team')}
            className="text-left p-3 rounded-xl bg-white/65 hover:bg-white transition-colors border cursor-pointer"
            style={{ borderColor: theme.borderSubtle }}
          >
            <div className="text-xs" style={{ color: theme.mutedInk }}>Team Size</div>
            <div className="text-lg font-semibold tabular-nums mt-0.5">
              {project.members.length} {project.members.length === 1 ? 'Creator' : 'Creators'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('progress')}
            className="text-left p-3 rounded-xl bg-white/65 hover:bg-white transition-colors border cursor-pointer"
            style={{ borderColor: theme.borderSubtle }}
          >
            <div className="text-xs" style={{ color: theme.mutedInk }}>Overall Progress</div>
            <div className="text-lg font-semibold tabular-nums mt-0.5">{progress.percentage}%</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('script')}
            className="text-left p-3 rounded-xl bg-white/65 hover:bg-white transition-colors border cursor-pointer"
            style={{ borderColor: theme.borderSubtle }}
          >
            <div className="text-xs" style={{ color: theme.mutedInk }}>Story Script</div>
            <div className="text-sm font-semibold mt-1 truncate">
              {project.script ? project.script.fileName : 'Not uploaded yet'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('portfolio')}
            className="text-left p-3 rounded-xl bg-white/65 hover:bg-white transition-colors border cursor-pointer"
            style={{ borderColor: theme.borderSubtle }}
          >
            <div className="text-xs" style={{ color: theme.mutedInk }}>Portfolio Works</div>
            <div className="text-lg font-semibold tabular-nums mt-0.5">
              {project.portfolio.length}
            </div>
          </button>
        </div>
      </div>

      {/* Required Team Roles & Recruitment Callout */}
      <div
        className="studio-glass rounded-2xl border p-6 space-y-4"
        style={{ borderColor: theme.borderSubtle }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Required Creative Roles</h3>
            <p className="text-xs mt-0.5" style={{ color: theme.mutedInk }}>
              Unfilled positions stay visible in grey. Once a team member fills a role, it moves to the active Team roster.
            </p>
          </div>
          {!isMember && (project.status === 'Recruiting' || project.status === 'Planning') && (
            <div className="flex items-center gap-2">
              <select
                value={joinRole}
                onChange={(e) => setJoinRole(e.target.value as CreativeRole)}
                className="px-3 py-1.5 text-xs rounded-xl bg-white border"
                style={{ borderColor: theme.borderSubtle }}
              >
                {(unfilledRoles.length > 0 ? unfilledRoles : CREATIVE_ROLES).map((r) => (
                  <option key={r} value={r}>
                    Join as {r}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleJoinOpenProject()}
                style={{ backgroundColor: theme.accent, color: '#FFFFFF' }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-xl cursor-pointer whitespace-nowrap"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Join Project
              </button>
            </div>
          )}
        </div>

        <div>
          <div className="text-xs font-medium mb-2" style={{ color: theme.mutedInk }}>
            Unfilled Requirements
          </div>
          {unfilledRoles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {unfilledRoles.map((role) => (
                <span
                  key={role}
                  className="px-3 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 border border-slate-200"
                >
                  {role}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: theme.accentText }}>
              All currently required creative roles are filled by your team.
            </p>
          )}
        </div>

        {isOwner && (
          <div className="pt-3 border-t" style={{ borderColor: theme.borderSubtle }}>
            <div className="text-xs font-medium mb-2" style={{ color: theme.mutedInk }}>
              Manage Required Roles (Owner Control)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CREATIVE_ROLES.map((role) => {
                const required = project.requiredRoles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    disabled={busy}
                    onClick={() => void handleToggleRequiredRole(role)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
                      required
                        ? 'bg-slate-100 border-slate-300 text-slate-800 font-medium'
                        : 'bg-white/70 border-slate-200 text-slate-500 hover:bg-white'
                    }`}
                  >
                    {required ? '✓ ' : '+ '}
                    {role}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Owner Danger Zone */}
      {isOwner && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/70 border border-slate-200/80">
          <div className="text-xs text-slate-600">
            Project Owner Controls — permanently remove this project and its uploaded materials.
          </div>
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleDelete()}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
              >
                Confirm Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Project
            </button>
          )}
        </div>
      )}
    </div>
  );
}
