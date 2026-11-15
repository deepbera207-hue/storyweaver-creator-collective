import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, FileText, Check, AlertCircle } from 'lucide-react';
import {
  ALL_GENRES,
  CREATIVE_ROLES,
  PROJECT_STATUSES,
  type CreativeProject,
  type CreativeRole,
  type Genre,
  type ProjectStatus,
  type ScriptAccessLevel,
} from '../types/studio';
import { getGenreTheme } from '../theme/genreThemes';
import { firestoreStudio } from '../services/firestoreStudio';
import type { UserProfile } from '../types/studio';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onCreated: (project: CreativeProject) => void;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  currentUser,
  onCreated,
}: CreateProjectModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>(['Animation']);
  const [primaryGenre, setPrimaryGenre] = useState<Genre>('Animation');
  const [status, setStatus] = useState<ProjectStatus>('Planning');
  const [requiredRoles, setRequiredRoles] = useState<CreativeRole[]>([
    'Animator',
    'Music Producer',
  ]);
  const [scriptMode, setScriptMode] = useState<'none' | 'upload' | 'paste'>('none');
  const [scriptFile, setScriptFile] = useState<File | null>(null);
  const [scriptText, setScriptText] = useState('');
  const [scriptAccessLevel, setScriptAccessLevel] = useState<ScriptAccessLevel>('team_members');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const theme = getGenreTheme(primaryGenre);

  function toggleGenre(genre: Genre) {
    setSelectedGenres((prev) => {
      if (prev.includes(genre)) {
        if (prev.length === 1) return prev;
        const next = prev.filter((g) => g !== genre);
        if (primaryGenre === genre) setPrimaryGenre(next[0]);
        return next;
      }
      const next = [...prev, genre];
      return next;
    });
  }

  function toggleRole(role: CreativeRole) {
    setRequiredRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  function resetForm() {
    setTitle('');
    setDescription('');
    setSelectedGenres(['Animation']);
    setPrimaryGenre('Animation');
    setStatus('Planning');
    setRequiredRoles(['Animator', 'Music Producer']);
    setScriptMode('none');
    setScriptFile(null);
    setScriptText('');
    setUploadProgress(0);
    setErrorMsg(null);
  }

  async function handleSubmit(saveAsDraft: boolean, isBlank = false) {
    setErrorMsg(null);
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const project = await firestoreStudio.createProject(currentUser, {
        title: isBlank ? 'Untitled Blank Project' : title.trim() || 'Untitled Creative Project',
        description: isBlank ? '' : description.trim(),
        genres: selectedGenres,
        primaryGenre,
        status: saveAsDraft ? 'Planning' : status,
        isDraft: saveAsDraft,
        requiredRoles: isBlank ? [] : requiredRoles,
        scriptText: !isBlank && scriptMode === 'paste' ? scriptText : undefined,
        scriptAccessLevel,
      });

      if (!isBlank && scriptMode === 'upload' && scriptFile) {
        try {
          const uploadedScript = await firestoreStudio.uploadScriptFile(
            project.id,
            currentUser,
            scriptFile,
            scriptAccessLevel,
            (pct) => setUploadProgress(pct)
          );
          project.script = uploadedScript;
        } catch (uploadErr) {
          onCreated(project);
          setErrorMsg(
            uploadErr instanceof Error
              ? `Project created, but script upload failed: ${uploadErr.message}`
              : 'Project created, but script upload failed.'
          );
          setIsSubmitting(false);
          return;
        }
      }

      onCreated(project);
      resetForm();
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to create project.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    void handleSubmit(false, false);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-project-heading"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.985 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: theme.softGradient,
              borderColor: theme.borderStrong,
              color: theme.ink,
            }}
            className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-xl transition-colors duration-500"
          >
            <div className="sticky top-0 z-20 studio-glass px-6 py-4 border-b flex items-center justify-between gap-4" style={{ borderColor: theme.borderSubtle }}>
              <div>
                <h2 id="create-project-heading" className="text-xl font-semibold tracking-tight">
                  Create New Project
                </h2>
                <p className="text-xs mt-0.5" style={{ color: theme.mutedInk }}>
                  Theme preview updates automatically: {theme.familyLabel}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void handleSubmit(true, true)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border bg-white/80 hover:bg-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  style={{ borderColor: theme.borderStrong, color: theme.ink }}
                >
                  Create Blank Project
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close modal"
                  className="p-2 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              {errorMsg && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1.5" htmlFor="proj-title">
                    Project Title
                  </label>
                  <input
                    id="proj-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Paper Lanterns at Low Tide"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white/90 border focus:outline-none focus:ring-2"
                    style={{ borderColor: theme.borderSubtle }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5" htmlFor="proj-status">
                    Initial Status
                  </label>
                  <select
                    id="proj-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white/90 border focus:outline-none"
                    style={{ borderColor: theme.borderSubtle }}
                  >
                    {PROJECT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="proj-desc">
                  Project Description
                </label>
                <textarea
                  id="proj-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Share the premise, visual tone, and creative direction for collaborators..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white/90 border focus:outline-none"
                  style={{ borderColor: theme.borderSubtle }}
                />
              </div>

              {/* Genre Selection & Primary Theme Selector */}
              <div className="p-4 rounded-xl bg-white/75 border space-y-3" style={{ borderColor: theme.borderSubtle }}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-medium">Project Genres</span>
                    <p className="text-xs" style={{ color: theme.mutedInk }}>
                      Select one or more genres. Primary genre sets the pastel frosted-glass palette.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="primary-genre-select" className="text-xs font-medium" style={{ color: theme.mutedInk }}>
                      Theme Genre:
                    </label>
                    <select
                      id="primary-genre-select"
                      value={primaryGenre}
                      onChange={(e) => {
                        const g = e.target.value as Genre;
                        setPrimaryGenre(g);
                        if (!selectedGenres.includes(g)) {
                          setSelectedGenres((prev) => [...prev, g]);
                        }
                      }}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white border"
                      style={{ borderColor: theme.borderStrong, color: theme.accentText }}
                    >
                      {ALL_GENRES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {ALL_GENRES.map((genre) => {
                    const active = selectedGenres.includes(genre);
                    return (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => toggleGenre(genre)}
                        style={
                          active
                            ? {
                                backgroundColor: theme.accentSoft,
                                borderColor: theme.borderStrong,
                                color: theme.accentText,
                              }
                            : undefined
                        }
                        className={`px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                          active
                            ? 'font-medium'
                            : 'bg-white/80 border-slate-200/80 text-slate-600 hover:bg-white'
                        }`}
                      >
                        {active && <Check className="w-3 h-3 inline mr-1 -mt-0.5" />}
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Required Member Roles */}
              <div className="p-4 rounded-xl bg-white/75 border space-y-2.5" style={{ borderColor: theme.borderSubtle }}>
                <div>
                  <span className="text-sm font-medium">Required Team Roles</span>
                  <p className="text-xs" style={{ color: theme.mutedInk }}>
                    Unfilled roles appear as light grey tags and automatically clear once a matching creator joins.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {CREATIVE_ROLES.map((role) => {
                    const selected = requiredRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRole(role)}
                        className={`px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                          selected
                            ? 'bg-slate-100 border-slate-300 text-slate-800 font-medium'
                            : 'bg-white/70 border-slate-200/70 text-slate-500 hover:bg-white'
                        }`}
                      >
                        {selected ? '✓ ' : '+ '}
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Script Upload or Paste */}
              <div className="p-4 rounded-xl bg-white/75 border space-y-3" style={{ borderColor: theme.borderSubtle }}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">Story Script (Optional)</span>
                  <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-lg">
                    {(
                      [
                        { id: 'none', label: 'Add Later' },
                        { id: 'upload', label: 'Upload File' },
                        { id: 'paste', label: 'Paste Text' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setScriptMode(opt.id)}
                        className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                          scriptMode === opt.id
                            ? 'bg-white text-slate-900 shadow-xs font-medium'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {scriptMode === 'upload' && (
                  <div className="space-y-2">
                    <label className="flex flex-col items-center justify-center p-5 border border-dashed rounded-xl bg-white/80 hover:bg-white cursor-pointer transition-colors" style={{ borderColor: theme.borderStrong }}>
                      <Upload className="w-5 h-5 mb-1.5" style={{ color: theme.accent }} />
                      <span className="text-xs font-medium">
                        {scriptFile ? scriptFile.name : 'Choose a .docx, .pdf, or .txt script'}
                      </span>
                      <span className="text-[11px] mt-0.5" style={{ color: theme.mutedInk }}>
                        Max 15 MB
                      </span>
                      <input
                        type="file"
                        accept=".docx,.pdf,.txt"
                        className="sr-only"
                        onChange={(e) => setScriptFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    {isSubmitting && uploadProgress > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs tabular-nums">
                          <span>Uploading script...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: theme.progressTrack }}>
                          <div
                            className="h-full transition-all duration-150"
                            style={{ width: `${uploadProgress}%`, backgroundColor: theme.progressFill }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {scriptMode === 'paste' && (
                  <textarea
                    rows={5}
                    value={scriptText}
                    onChange={(e) => setScriptText(e.target.value)}
                    placeholder="Paste your screenplay, dialogue, or story treatment here..."
                    className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl bg-white border focus:outline-none"
                    style={{ borderColor: theme.borderSubtle }}
                  />
                )}

                {scriptMode !== 'none' && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs flex items-center gap-1.5" style={{ color: theme.mutedInk }}>
                      <FileText className="w-3.5 h-3.5" />
                      Team Script Visibility
                    </span>
                    <select
                      value={scriptAccessLevel}
                      onChange={(e) => setScriptAccessLevel(e.target.value as ScriptAccessLevel)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-white border"
                      style={{ borderColor: theme.borderSubtle }}
                    >
                      <option value="team_members">Accepted Team Members</option>
                      <option value="owner_only">Project Owner Only</option>
                      <option value="all_collaborators">All Signed-in Creators</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t" style={{ borderColor: theme.borderSubtle }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-black/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void handleSubmit(true, false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl bg-white/90 border hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
                  style={{ borderColor: theme.borderStrong, color: theme.ink }}
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ backgroundColor: theme.accent, color: '#FFFFFF' }}
                  className="px-5 py-2 text-sm font-medium rounded-xl shadow-xs hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
