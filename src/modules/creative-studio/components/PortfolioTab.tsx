import { useState, type FormEvent } from 'react';
import {
  Upload,
  Film,
  Music,
  FileText,
  Image as ImageIcon,
  Trash2,
  X,
  Plus,
  HardDrive,
} from 'lucide-react';
import type {
  CreativeProject,
  PortfolioItem,
  PortfolioMediaType,
  UserProfile,
} from '../types/studio';
import type { GenreThemeTokens } from '../theme/genreThemes';
import { studioService as firestoreStudio } from '../services/studioService';
import { resolveStudioAsset } from '../assets/studioAssets';
import { GoogleDriveModal } from './GoogleDriveModal';
import type { DriveFileItem } from '../services/googleDriveApi';

interface PortfolioTabProps {
  project: CreativeProject;
  currentUser: UserProfile;
  theme: GenreThemeTokens;
  onProjectUpdate?: (updated: CreativeProject) => void | undefined;
}

const PORTFOLIO_TYPES: PortfolioMediaType[] = [
  'Final Animation',
  'Finished Video',
  'Music & Soundtrack',
  'Artwork',
  'Character Design',
  'Poster',
  'Final Script',
  'Other Material',
];

export function PortfolioTab({
  project,
  currentUser,
  theme,
}: PortfolioTabProps) {
  const isOwner = project.ownerId === currentUser.id;
  const isMember = project.members.some((m) => m.userId === currentUser.id);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState<PortfolioMediaType>('Final Animation');
  const [contributors, setContributors] = useState<string[]>([currentUser.name]);
  const [file, setFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [uploadPct, setUploadPct] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lightboxItem, setLightboxItem] = useState<PortfolioItem | null>(null);
  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [selectedDriveFile, setSelectedDriveFile] = useState<{
    file: DriveFileItem;
    accessToken: string;
  } | null>(null);

  function toggleContributor(name: string) {
    setContributors((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }

  async function handleAddPortfolio(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setErrorMsg(null);
    setSubmitting(true);
    setUploadPct(0);

    try {
      if (selectedDriveFile && !file && !mediaUrl.trim()) {
        await firestoreStudio.importPortfolioFromDrive(
          project.id,
          currentUser,
          selectedDriveFile.accessToken,
          {
            fileId: selectedDriveFile.file.id,
            fileName: selectedDriveFile.file.name,
            mimeType: selectedDriveFile.file.mimeType,
            title: title.trim(),
            description: description.trim(),
            mediaType,
            contributors: contributors.length > 0 ? contributors : [currentUser.name],
          }
        );
      } else {
        await firestoreStudio.addPortfolioItem(
          project.id,
          currentUser,
          {
            title: title.trim(),
            description: description.trim(),
            mediaType,
            contributors: contributors.length > 0 ? contributors : [currentUser.name],
            file,
            mediaUrl: mediaUrl.trim() || undefined,
          },
          (pct) => setUploadPct(pct)
        );
      }
      setTitle('');
      setDescription('');
      setFile(null);
      setMediaUrl('');
      setSelectedDriveFile(null);
      setShowForm(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to publish portfolio item.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(itemId: string) {
    try {
      await firestoreStudio.deletePortfolioItem(project.id, itemId);
      if (lightboxItem?.id === itemId) setLightboxItem(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to remove portfolio item.');
    }
  }

  function renderPreview(item: PortfolioItem, tall = false) {
    const resolved = resolveStudioAsset(item.previewImageUrl || item.mediaUrl) || item.mediaUrl;
    const isVideo =
      item.mimeType?.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(resolved);
    const isAudio =
      item.mimeType?.startsWith('audio/') ||
      /\.(mp3|wav|ogg|m4a)$/i.test(resolved) ||
      item.mediaType === 'Music & Soundtrack';
    const isPdfOrDoc =
      item.mimeType?.includes('pdf') ||
      /\.(pdf|docx|txt)$/i.test(resolved) ||
      item.mediaType === 'Final Script';

    if (isVideo) {
      return (
        <video
          controls
          src={resolved}
          className={`w-full ${tall ? 'max-h-[68vh]' : 'h-56'} object-cover bg-slate-900/5`}
        />
      );
    }
    if (isAudio) {
      return (
        <div
          className={`w-full ${tall ? 'p-10' : 'h-56 p-6'} flex flex-col items-center justify-center gap-3`}
          style={{ background: theme.cardHeaderGradient }}
        >
          <div
            className="w-12 h-12 rounded-2xl bg-white/90 flex items-center justify-center shadow-2xs"
            style={{ color: theme.accentText }}
          >
            <Music className="w-6 h-6" />
          </div>
          <audio controls src={resolved} className="w-full max-w-xs" />
        </div>
      );
    }
    if (isPdfOrDoc) {
      return (
        <div
          className={`w-full ${tall ? 'p-10' : 'h-56 p-6'} flex flex-col items-center justify-center gap-2`}
          style={{ background: theme.cardHeaderGradient }}
        >
          <FileText className="w-8 h-8" style={{ color: theme.accentText }} />
          <span className="text-xs font-medium">{item.fileName || item.title}</span>
          <a
            href={resolved}
            target="_blank"
            rel="noreferrer"
            className="text-xs underline"
            style={{ color: theme.accentText }}
          >
            Open Document
          </a>
        </div>
      );
    }

    return (
      <img
        src={resolved}
        alt={item.title}
        referrerPolicy="no-referrer"
        className={`w-full ${tall ? 'max-h-[68vh] object-contain bg-slate-50' : 'h-56 object-cover'}`}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Showcase Header */}
      <div
        className="studio-glass rounded-2xl border p-6 flex flex-wrap items-center justify-between gap-4"
        style={{ borderColor: theme.borderSubtle }}
      >
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Group Portfolio & Finished Work</h3>
          <p className="text-xs mt-0.5" style={{ color: theme.mutedInk }}>
            Curated showcase of completed animations, soundtracks, character sheets, posters, and final scripts.
          </p>
        </div>
        {isMember && (
          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            style={{ backgroundColor: theme.accent, color: '#FFFFFF' }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Close Upload Form' : 'Publish Finished Work'}
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Upload Form */}
      {showForm && isMember && (
        <form
          onSubmit={handleAddPortfolio}
          className="studio-glass rounded-2xl border p-6 space-y-4"
          style={{ borderColor: theme.borderStrong }}
        >
          <h4 className="text-sm font-semibold">Upload to Project Portfolio</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Work Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Final Opening Sequence"
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-white border focus:outline-none"
                style={{ borderColor: theme.borderSubtle }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Media Type</label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as PortfolioMediaType)}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-white border"
                style={{ borderColor: theme.borderSubtle }}
              >
                {PORTFOLIO_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the final piece, creative tools used, or production notes..."
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-white border focus:outline-none"
              style={{ borderColor: theme.borderSubtle }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed bg-white/80 hover:bg-white cursor-pointer"
                style={{ borderColor: theme.borderStrong }}
              >
                <Upload className="w-4 h-4 mb-1" style={{ color: theme.accentText }} />
                <span className="text-xs font-medium text-center">
                  {file
                    ? file.name
                    : selectedDriveFile
                      ? `Drive: ${selectedDriveFile.file.name}`
                      : 'Upload finished file (image, video, audio, PDF)'}
                </span>
                <input
                  type="file"
                  accept="image/*,video/*,audio/*,.pdf,.docx,.txt,.mov,.mp4,.webm"
                  className="sr-only"
                  onChange={(e) => {
                    const picked = e.target.files?.[0] ?? null;
                    setFile(picked);
                    if (picked) setSelectedDriveFile(null);
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() => setDriveModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-white border hover:bg-slate-50 cursor-pointer"
                style={{ borderColor: theme.borderSubtle }}
              >
                <HardDrive className="w-3.5 h-3.5" />
                {selectedDriveFile ? 'Change Google Drive File' : 'Pick from Google Drive'}
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Or Media URL (optional)</label>
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => {
                  setMediaUrl(e.target.value);
                  if (e.target.value.trim()) setSelectedDriveFile(null);
                }}
                placeholder="https://..."
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-white border focus:outline-none"
                style={{ borderColor: theme.borderSubtle }}
              />
              <p className="text-[11px] mt-1" style={{ color: theme.mutedInk }}>
                Upload a file directly, pick from Google Drive, or link to a hosted final master.
              </p>
            </div>
          </div>

          <div>
            <span className="block text-xs font-medium mb-1.5">Contributing Members</span>
            <div className="flex flex-wrap gap-1.5">
              {project.members.map((m) => {
                const checked = contributors.includes(m.name);
                return (
                  <button
                    key={m.userId}
                    type="button"
                    onClick={() => toggleContributor(m.name)}
                    style={
                      checked
                        ? {
                            backgroundColor: theme.accentSoft,
                            borderColor: theme.borderStrong,
                            color: theme.accentText,
                          }
                        : undefined
                    }
                    className={`px-2.5 py-1 text-xs rounded-lg border cursor-pointer ${
                      checked
                        ? 'font-medium'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    {checked ? '✓ ' : '+ '}
                    {m.name}
                  </button>
                );
              })}
            </div>
          </div>

          {submitting && uploadPct > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs tabular-nums">
                <span>Uploading finished work...</span>
                <span>{uploadPct}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: theme.progressTrack }}>
                <div
                  className="h-full transition-all"
                  style={{ width: `${uploadPct}%`, backgroundColor: theme.progressFill }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-xs font-medium rounded-xl hover:bg-black/5 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (!file && !selectedDriveFile && !mediaUrl.trim())}
              style={{ backgroundColor: theme.accent, color: '#FFFFFF' }}
              className="px-5 py-2 text-xs font-medium rounded-xl cursor-pointer disabled:opacity-45"
            >
              {submitting ? 'Publishing...' : 'Publish to Portfolio'}
            </button>
          </div>
        </form>
      )}

      {/* Portfolio Gallery */}
      {project.portfolio.length === 0 ? (
        <div
          className="studio-glass rounded-2xl border p-12 text-center space-y-2"
          style={{ borderColor: theme.borderSubtle }}
        >
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <ImageIcon className="w-5 h-5" />
            <Film className="w-5 h-5" />
            <Music className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium">No finished portfolio pieces yet</p>
          <p className="text-xs max-w-md mx-auto" style={{ color: theme.mutedInk }}>
            When your team completes scenes, soundtracks, character designs, or posters, publish them here for the final showcase.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {project.portfolio.map((item) => (
            <article
              key={item.id}
              className="studio-glass rounded-2xl border overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-md"
              style={{ borderColor: theme.borderSubtle }}
            >
              <div>
                <div
                  onClick={() => setLightboxItem(item)}
                  className="cursor-pointer overflow-hidden border-b"
                  style={{ borderColor: theme.borderSubtle }}
                >
                  {renderPreview(item, false)}
                </div>

                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[11px]" style={{ color: theme.accentText }}>
                    <span className="font-medium">{item.mediaType}</span>
                    <span className="font-mono tabular-nums" style={{ color: theme.mutedInk }}>
                      {new Date(item.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4
                    onClick={() => setLightboxItem(item)}
                    className="text-base font-semibold tracking-tight cursor-pointer hover:underline"
                  >
                    {item.title}
                  </h4>
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: theme.mutedInk }}>
                    {item.description || 'Finished collaborative production work.'}
                  </p>
                </div>
              </div>

              <div
                className="px-5 py-3 border-t flex items-center justify-between gap-2 text-xs"
                style={{ borderColor: theme.borderSubtle, color: theme.mutedInk }}
              >
                <span className="truncate">By {item.contributors.join(', ')}</span>
                {(isOwner || item.uploadedBy === currentUser.id) && (
                  <button
                    type="button"
                    onClick={() => void handleDelete(item.id)}
                    className="text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                    title="Remove portfolio item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          onClick={() => setLightboxItem(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-medium" style={{ color: theme.accentText }}>
                  {lightboxItem.mediaType} · {new Date(lightboxItem.uploadedAt).toLocaleDateString()}
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{lightboxItem.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50">{renderPreview(lightboxItem, true)}</div>

            <div className="p-6 space-y-2">
              <p className="text-sm text-slate-700 leading-relaxed">{lightboxItem.description}</p>
              <div className="text-xs text-slate-500">
                Contributors: <span className="font-medium text-slate-800">{lightboxItem.contributors.join(', ')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <GoogleDriveModal
        isOpen={driveModalOpen}
        onClose={() => setDriveModalOpen(false)}
        title="Pick Finished Work from Google Drive"
        subtitle="Select an animation, video, soundtrack, artwork, or poster from Drive."
        initialFilter="all"
        allowMultiple={false}
        confirmLabel="Use Selected File"
        theme={theme}
        onSelectFiles={async (selected, accessToken) => {
          const picked = selected[0];
          if (!picked) return;
          setSelectedDriveFile({ file: picked, accessToken });
          setFile(null);
          setMediaUrl('');
          if (!title.trim()) {
            setTitle(picked.name.replace(/\.[^.]+$/, ''));
          }
        }}
      />
    </div>
  );
}
