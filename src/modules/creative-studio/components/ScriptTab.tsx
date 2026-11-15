import { useEffect, useState } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  Lock,
  ExternalLink,
  AlertCircle,
  Edit3,
  Check,
  HardDrive,
  HardDriveUpload,
} from 'lucide-react';
import type {
  CreativeProject,
  ScriptAccessLevel,
  UserProfile,
} from '../types/studio';
import type { GenreThemeTokens } from '../theme/genreThemes';
import { studioService as firestoreStudio } from '../services/studioService';
import { GoogleDriveModal } from './GoogleDriveModal';
import { DriveSaveConfirmModal } from './DriveSaveConfirmModal';
import {
  DriveAuthError,
  type DriveFileItem,
  uploadBlobToDrive,
  uploadStudioUrlToDrive,
} from '../services/googleDriveApi';
import { getAccessToken, googleSignIn } from '../services/googleDriveAuth';

interface ScriptTabProps {
  project: CreativeProject;
  currentUser: UserProfile;
  theme: GenreThemeTokens;
  onProjectUpdate?: (updated: CreativeProject) => void | undefined;
}

export function ScriptTab({
  project,
  currentUser,
  theme,
}: ScriptTabProps) {
  const isOwner = project.ownerId === currentUser.id;
  const isMember = project.members.some((m) => m.userId === currentUser.id);
  const script = project.script;

  const [mode, setMode] = useState<'preview' | 'editor'>('preview');
  const [editorText, setEditorText] = useState(script?.textContent ?? '');
  const [editorName, setEditorName] = useState(script?.fileName ?? 'story_script.txt');
  const [accessLevel, setAccessLevel] = useState<ScriptAccessLevel>(
    script?.accessLevel ?? 'team_members'
  );
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [confirmSaveDrive, setConfirmSaveDrive] = useState(false);
  const [savingToDrive, setSavingToDrive] = useState(false);

  useEffect(() => {
    if (mode === 'preview') {
      setEditorText(script?.textContent ?? '');
      setEditorName(script?.fileName ?? 'story_script.txt');
      setAccessLevel(script?.accessLevel ?? 'team_members');
    }
  }, [script?.textContent, script?.fileName, script?.accessLevel, mode]);

  async function handleFileSelect(file: File | undefined) {
    if (!file) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      const uploaded = await firestoreStudio.uploadScriptFile(
        project.id,
        currentUser,
        file,
        accessLevel,
        (pct) => setUploadProgress(pct)
      );
      setEditorText(uploaded.textContent ?? '');
      setEditorName(uploaded.fileName ?? file.name);
      setMode('preview');
      setSuccessMsg(`Uploaded "${file.name}" successfully.`);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Script upload failed. Please check file format.'
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveEditor() {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSaving(true);
    try {
      await firestoreStudio.saveScriptEditor(project.id, currentUser, script, {
        textContent: editorText,
        fileName: editorName.trim() || 'story_script.txt',
        accessLevel,
      });
      setMode('preview');
      setSuccessMsg('Script saved.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save script.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAccessChange(nextLevel: ScriptAccessLevel) {
    setAccessLevel(nextLevel);
    if (!script || !isOwner) return;
    setErrorMsg(null);
    try {
      await firestoreStudio.saveScriptEditor(project.id, currentUser, script, {
        accessLevel: nextLevel,
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to update script permissions.');
    }
  }

  async function handleRemoveScript() {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSaving(true);
    try {
      await firestoreStudio.removeScript(project.id);
      setEditorText('');
      setMode('preview');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to remove script.');
    } finally {
      setSaving(false);
    }
  }

  async function handleImportScriptFromDrive(selected: DriveFileItem[], accessToken: string) {
    const file = selected[0];
    if (!file) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    const imported = await firestoreStudio.importScriptFromDrive(
      project.id,
      currentUser,
      accessToken,
      {
        fileId: file.id,
        fileName: file.name,
        mimeType: file.mimeType,
        accessLevel,
      }
    );
    setEditorText(imported.textContent ?? '');
    setEditorName(imported.fileName ?? file.name);
    setMode('preview');
    setSuccessMsg(`Imported "${imported.fileName ?? file.name}" from Google Drive.`);
  }

  async function handleConfirmSaveScriptToDrive() {
    if (!script) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setSavingToDrive(true);
    try {
      let token = await getAccessToken();
      if (!token) {
        const res = await googleSignIn();
        token = res.accessToken;
      }
      if (script.fileUrl && script.format !== 'editor') {
        await uploadStudioUrlToDrive({
          sourceUrl: script.fileUrl,
          fileName: script.fileName,
          mimeType:
            script.format === 'pdf'
              ? 'application/pdf'
              : script.format === 'docx'
                ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                : 'text/plain',
        });
      } else {
        await uploadBlobToDrive({
          fileName: script.fileName || 'script.txt',
          mimeType: 'text/plain',
          content: script.textContent || '',
        });
      }
      setConfirmSaveDrive(false);
      setSuccessMsg(`Saved "${script.fileName}" to your Google Drive.`);
    } catch (err) {
      if (err instanceof DriveAuthError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Unable to save script to Google Drive.');
      }
    } finally {
      setSavingToDrive(false);
    }
  }

  if (project.scriptRestricted) {
    return (
      <div
        className="studio-glass rounded-2xl border p-10 text-center space-y-3"
        style={{ borderColor: theme.borderSubtle }}
      >
        <div
          className="w-11 h-11 rounded-full mx-auto flex items-center justify-center"
          style={{ backgroundColor: theme.accentSoft, color: theme.accentText }}
        >
          <Lock className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-semibold">Script Access Restricted</h3>
        <p className="text-sm max-w-md mx-auto" style={{ color: theme.mutedInk }}>
          This project’s script permissions are limited to{' '}
          {script?.accessLevel === 'owner_only'
            ? 'the project owner only.'
            : 'accepted team members.'}{' '}
          Join the team or request permission from the project owner to read the script.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Script Header Controls */}
      <div
        className="studio-glass rounded-2xl border p-5 flex flex-wrap items-center justify-between gap-4"
        style={{ borderColor: theme.borderSubtle }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: theme.accentSoft, color: theme.accentText }}
          >
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold truncate">
              {script ? script.fileName : 'No Script Uploaded Yet'}
            </h3>
            <p className="text-xs truncate" style={{ color: theme.mutedInk }}>
              {script
                ? `${script.format.toUpperCase()} · Updated by ${script.uploadedByName} on ${new Date(script.updatedAt).toLocaleDateString()}`
                : 'Supports .docx, .pdf, .txt or direct script writing'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isOwner && (
            <select
              value={script?.accessLevel ?? accessLevel}
              onChange={(e) => void handleAccessChange(e.target.value as ScriptAccessLevel)}
              aria-label="Script team access permission"
              className="px-3 py-1.5 text-xs font-medium rounded-xl bg-white border cursor-pointer"
              style={{ borderColor: theme.borderSubtle }}
            >
              <option value="team_members">Access: Team Members</option>
              <option value="owner_only">Access: Owner Only</option>
              <option value="all_collaborators">Access: All Signed-in Creators</option>
            </select>
          )}

          {isMember && (
            <>
              <label
                style={{
                  backgroundColor: 'rgba(255,255,255,0.92)',
                  borderColor: theme.borderStrong,
                  color: theme.accentText,
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-xl border hover:bg-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5" />
                {script ? 'Replace File' : 'Upload .docx / .pdf / .txt'}
                <input
                  type="file"
                  accept=".docx,.pdf,.txt"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    void handleFileSelect(f);
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() => setDriveModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-xl bg-white border hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                style={{ borderColor: theme.borderSubtle }}
              >
                <HardDrive className="w-3.5 h-3.5" />
                Import from Drive
              </button>

              {script && (
                <button
                  type="button"
                  onClick={() => setConfirmSaveDrive(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-xl bg-white border hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                  style={{ borderColor: theme.borderSubtle }}
                >
                  <HardDriveUpload className="w-3.5 h-3.5" />
                  Save to Drive
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setEditorText(script?.textContent ?? '');
                  setEditorName(script?.fileName ?? 'story_script.txt');
                  setMode((m) => (m === 'editor' ? 'preview' : 'editor'));
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-xl bg-white border hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                style={{ borderColor: theme.borderSubtle }}
              >
                <Edit3 className="w-3.5 h-3.5" />
                {mode === 'editor' ? 'View Preview' : 'Write / Paste Script'}
              </button>

              {script && (isOwner || script.uploadedBy === currentUser.id) && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleRemoveScript()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 cursor-pointer whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Real Upload Progress Indicator */}
      {uploading && (
        <div
          className="studio-glass rounded-xl border p-4 space-y-2"
          style={{ borderColor: theme.borderSubtle }}
        >
          <div className="flex justify-between text-xs font-medium tabular-nums">
            <span>Uploading and parsing script file...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.progressTrack }}>
            <div
              className="h-full transition-all duration-150"
              style={{ width: `${uploadProgress}%`, backgroundColor: theme.progressFill }}
            />
          </div>
        </div>
      )}

      {/* Editor or Preview Area */}
      {mode === 'editor' && isMember ? (
        <div
          className="studio-glass rounded-2xl border p-6 space-y-4"
          style={{ borderColor: theme.borderSubtle }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <input
              type="text"
              value={editorName}
              onChange={(e) => setEditorName(e.target.value)}
              placeholder="Script filename (e.g. episode_1_draft.txt)"
              className="px-3.5 py-2 text-sm font-medium rounded-xl bg-white border w-full sm:w-80 focus:outline-none"
              style={{ borderColor: theme.borderSubtle }}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode('preview')}
                className="px-3.5 py-1.5 text-xs font-medium rounded-xl hover:bg-black/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSaveEditor()}
                style={{ backgroundColor: theme.accent, color: '#FFFFFF' }}
                className="px-4 py-1.5 text-xs font-medium rounded-xl cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Script'}
              </button>
            </div>
          </div>
          <textarea
            rows={16}
            value={editorText}
            onChange={(e) => setEditorText(e.target.value)}
            placeholder="Paste or write your story script, scene headings, and dialogue here..."
            className="w-full p-5 text-sm font-mono leading-relaxed rounded-xl bg-white border focus:outline-none"
            style={{ borderColor: theme.borderSubtle }}
          />
        </div>
      ) : script ? (
        <div
          className="rounded-2xl border bg-white/95 p-6 sm:p-8 shadow-xs space-y-4"
          style={{ borderColor: theme.borderSubtle }}
        >
          {script.format === 'pdf' && script.fileUrl ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: theme.mutedInk }}>
                  PDF Document Preview
                </span>
                <a
                  href={script.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium underline"
                  style={{ color: theme.accentText }}
                >
                  Open PDF in New Tab
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <iframe
                src={script.fileUrl}
                title={script.fileName}
                className="w-full h-[560px] rounded-xl border bg-slate-50"
                style={{ borderColor: theme.borderSubtle }}
              />
            </div>
          ) : script.htmlPreview ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.borderSubtle }}>
                <span className="text-xs font-medium" style={{ color: theme.mutedInk }}>
                  DOCX Formatted Preview
                </span>
                {script.fileUrl && (
                  <a
                    href={script.fileUrl}
                    download={script.fileName}
                    className="text-xs font-medium underline"
                    style={{ color: theme.accentText }}
                  >
                    Download Original .docx
                  </a>
                )}
              </div>
              <div
                className="prose prose-slate max-w-none text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: script.htmlPreview }}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {script.fileUrl && (
                <div className="flex justify-end">
                  <a
                    href={script.fileUrl}
                    download={script.fileName}
                    className="text-xs font-medium underline"
                    style={{ color: theme.accentText }}
                  >
                    Download {script.fileName}
                  </a>
                </div>
              )}
              <pre className="whitespace-pre-wrap font-mono text-sm leading-7 text-slate-800 max-w-3xl mx-auto">
                {script.textContent || 'Empty script document.'}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <div
          className="studio-glass rounded-2xl border p-12 text-center space-y-3"
          style={{ borderColor: theme.borderSubtle }}
        >
          <p className="text-sm font-medium">No story script attached yet.</p>
          <p className="text-xs max-w-md mx-auto" style={{ color: theme.mutedInk }}>
            {isMember
              ? 'Upload a .docx, .pdf, or .txt screenplay, or open the direct text editor to begin drafting with your team.'
              : 'Only team members can upload or draft the project script.'}
          </p>
        </div>
      )}

      <GoogleDriveModal
        isOpen={driveModalOpen}
        onClose={() => setDriveModalOpen(false)}
        title="Import Script from Google Drive"
        subtitle="Select a Google Doc, .docx, .pdf, or .txt script file."
        initialFilter="document"
        allowMultiple={false}
        confirmLabel="Import Script"
        theme={theme}
        onSelectFiles={handleImportScriptFromDrive}
      />

      <DriveSaveConfirmModal
        isOpen={confirmSaveDrive}
        fileName={script?.fileName ?? 'script.txt'}
        description="This uploads a copy of the current project script to your Google Drive."
        busy={savingToDrive}
        onCancel={() => setConfirmSaveDrive(false)}
        onConfirm={() => void handleConfirmSaveScriptToDrive()}
      />
    </div>
  );
}
