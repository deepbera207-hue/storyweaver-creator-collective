import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  X,
  Search,
  Image as ImageIcon,
  Film,
  Music,
  FileText,
  File,
  Check,
  LogOut,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import type { GenreThemeTokens } from '../theme/genreThemes';
import {
  getAccessToken,
  getCurrentGoogleUser,
  googleSignIn,
  initAuth,
  logoutGoogleDrive,
} from '../services/googleDriveAuth';
import {
  DriveAuthError,
  listDriveFiles,
  type DriveFileFilter,
  type DriveFileItem,
} from '../services/googleDriveApi';
import { GoogleSignInButton } from './GoogleSignInButton';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | undefined;
  subtitle?: string | undefined;
  initialFilter?: DriveFileFilter | undefined;
  allowMultiple?: boolean | undefined;
  confirmLabel?: string | undefined;
  theme?: GenreThemeTokens | undefined;
  onSelectFiles: (files: DriveFileItem[], accessToken: string) => Promise<void>;
}

const FILTER_TABS: { id: DriveFileFilter; label: string }[] = [
  { id: 'all', label: 'All Files' },
  { id: 'image', label: 'Photos' },
  { id: 'video', label: 'Videos' },
  { id: 'audio', label: 'Audio' },
  { id: 'document', label: 'Scripts & Docs' },
];

function formatBytes(sizeStr?: string): string {
  const bytes = Number(sizeStr);
  if (!bytes || Number.isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function GoogleDriveModal({
  isOpen,
  onClose,
  title = 'Import from Google Drive',
  subtitle = 'Select photos, videos, audio, or scripts from your Google Drive.',
  initialFilter = 'all',
  allowMultiple = true,
  confirmLabel = 'Import Selected',
  theme,
  onSelectFiles,
}: GoogleDriveModalProps) {
  const [needsAuth, setNeedsAuth] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const [filter, setFilter] = useState<DriveFileFilter>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchFiles = useCallback(
    async (opts?: { append?: boolean; pageToken?: string; queryOverride?: string; filterOverride?: DriveFileFilter }) => {
      setErrorMsg(null);
      setLoadingFiles(true);
      try {
        const res = await listDriveFiles({
          query: opts?.queryOverride ?? searchQuery,
          filter: opts?.filterOverride ?? filter,
          pageToken: opts?.pageToken,
        });
        setFiles((prev) => (opts?.append ? [...prev, ...res.files] : res.files));
        setNextPageToken(res.nextPageToken);
        setNeedsAuth(false);
      } catch (err) {
        if (err instanceof DriveAuthError) {
          setNeedsAuth(true);
          setFiles([]);
        } else {
          setErrorMsg(err instanceof Error ? err.message : 'Unable to load Google Drive files.');
        }
      } finally {
        setLoadingFiles(false);
      }
    },
    [filter, searchQuery]
  );

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedIds([]);
    setErrorMsg(null);

    const unsubscribe = initAuth(
      (user) => {
        setGoogleEmail(user.email || user.displayName || 'Connected Google Account');
        setNeedsAuth(false);
      },
      (user) => {
        setGoogleEmail(user?.email || null);
        setNeedsAuth(true);
      }
    );

    void getAccessToken().then((token) => {
      const user = getCurrentGoogleUser();
      if (token) {
        setGoogleEmail(user?.email || user?.displayName || 'Connected Google Account');
        setNeedsAuth(false);
        void fetchFiles();
      } else {
        setNeedsAuth(true);
      }
    });

    return () => unsubscribe();
  }, [isOpen, fetchFiles]);

  if (!isOpen) return null;

  async function handleSignIn() {
    setErrorMsg(null);
    setSigningIn(true);
    try {
      const { user } = await googleSignIn();
      setGoogleEmail(user.email || user.displayName || 'Connected Google Account');
      setNeedsAuth(false);
      await fetchFiles();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Google sign-in was cancelled or could not complete.'
      );
    } finally {
      setSigningIn(false);
    }
  }

  async function handleDisconnect() {
    await logoutGoogleDrive();
    setGoogleEmail(null);
    setFiles([]);
    setSelectedIds([]);
    setNeedsAuth(true);
  }

  function toggleSelection(fileId: string) {
    if (!allowMultiple) {
      setSelectedIds((prev) => (prev[0] === fileId ? [] : [fileId]));
      return;
    }
    setSelectedIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  }

  async function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    await fetchFiles({ queryOverride: searchQuery, filterOverride: filter });
  }

  async function handleConfirmImport() {
    const selected = files.filter((f) => selectedIds.includes(f.id));
    if (selected.length === 0) return;

    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setErrorMsg(null);
    setImporting(true);
    try {
      await onSelectFiles(selected, token);
      onClose();
    } catch (err) {
      if (err instanceof DriveAuthError) {
        setNeedsAuth(true);
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to import selected Drive file.');
      }
    } finally {
      setImporting(false);
    }
  }

  function renderFileIcon(mimeType: string) {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-rose-500" />;
    if (mimeType.startsWith('video/')) return <Film className="w-4 h-4 text-indigo-500" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-4 h-4 text-emerald-600" />;
    if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('wordprocessingml') ||
      mimeType === 'text/plain'
    ) {
      return <FileText className="w-4 h-4 text-sky-600" />;
    }
    return <File className="w-4 h-4 text-slate-400" />;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-xs"
      onClick={importing ? undefined : onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[86vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900 truncate">{title}</h2>
            <p className="text-xs text-slate-500 truncate">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!needsAuth && googleEmail && (
              <button
                type="button"
                onClick={() => void handleDisconnect()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                title={`Signed in as ${googleEmail}`}
              >
                <span className="max-w-[140px] truncate">{googleEmail}</span>
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              disabled={importing}
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer disabled:opacity-40"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        {needsAuth ? (
          <div className="p-10 text-center space-y-4">
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-base font-semibold text-slate-900">Connect your Google Drive</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sign in with Google to browse your Drive photos, videos, audio tracks, and scripts
                and share them directly with your project team.
              </p>
            </div>
            {errorMsg && (
              <div className="max-w-md mx-auto flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-left">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
            <div className="flex justify-center pt-1">
              <GoogleSignInButton onClick={() => void handleSignIn()} loading={signingIn} />
            </div>
          </div>
        ) : (
          <>
            {/* Search & Filter Toolbar */}
            <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50/70 space-y-3">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search files in Google Drive..."
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingFiles}
                  className="px-3.5 py-2 text-xs font-medium rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Search
                </button>
                <button
                  type="button"
                  disabled={loadingFiles}
                  onClick={() => void fetchFiles()}
                  title="Refresh files"
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingFiles ? 'animate-spin' : ''}`} />
                </button>
              </form>

              <div className="flex items-center gap-1.5 overflow-x-auto">
                {FILTER_TABS.map((tab) => {
                  const active = filter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setFilter(tab.id);
                        void fetchFiles({ filterOverride: tab.id });
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                        active
                          ? 'bg-slate-900 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {errorMsg && (
              <div className="mx-6 mt-4 flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* File Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingFiles && files.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading your Google Drive files...</span>
                </div>
              ) : files.length === 0 ? (
                <div className="py-16 text-center space-y-1.5">
                  <p className="text-sm font-medium text-slate-700">No matching files found</p>
                  <p className="text-xs text-slate-500">
                    Try switching the category filter or clearing your search query.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {files.map((file) => {
                      const selected = selectedIds.includes(file.id);
                      const sizeLabel = formatBytes(file.size);
                      return (
                        <button
                          key={file.id}
                          type="button"
                          onClick={() => toggleSelection(file.id)}
                          className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                            selected
                              ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900/15'
                              : 'bg-white border-slate-200 hover:bg-slate-50/70'
                          }`}
                        >
                          {file.thumbnailLink ? (
                            <img
                              src={file.thumbnailLink}
                              alt={file.name}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                              {renderFileIcon(file.mimeType)}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-slate-900 truncate">
                              {file.name}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate mt-0.5">
                              {file.mimeType.replace('application/vnd.google-apps.', 'Google ')}
                              {sizeLabel ? ` · ${sizeLabel}` : ''}
                            </div>
                            {file.modifiedTime && (
                              <div className="text-[10px] text-slate-400 mt-0.5 tabular-nums">
                                Updated {new Date(file.modifiedTime).toLocaleDateString()}
                              </div>
                            )}
                          </div>

                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              selected
                                ? 'bg-slate-900 border-slate-900 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {selected && <Check className="w-3 h-3" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {nextPageToken && (
                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        disabled={loadingFiles}
                        onClick={() => void fetchFiles({ append: true, pageToken: nextPageToken })}
                        className="px-4 py-1.5 text-xs font-medium rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                      >
                        {loadingFiles ? 'Loading...' : 'Load More Files'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 tabular-nums">
                {selectedIds.length} {selectedIds.length === 1 ? 'file' : 'files'} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={importing}
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={importing || selectedIds.length === 0}
                  onClick={() => void handleConfirmImport()}
                  style={theme ? { backgroundColor: theme.accent, color: '#FFFFFF' } : undefined}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-slate-900 text-white cursor-pointer disabled:opacity-45"
                >
                  {importing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {importing ? 'Importing...' : confirmLabel}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
