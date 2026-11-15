import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type FormEvent,
} from 'react';
import {
  Send,
  Paperclip,
  Mic,
  Square,
  Heart,
  Sparkles,
  ThumbsUp,
  Award,
  Image as ImageIcon,
  Film,
  Music,
  FileText,
  Download,
  X,
  MessageSquare,
  Compass,
  HardDrive,
  HardDriveUpload,
  Check,
} from 'lucide-react';
import type {
  ChatMessage,
  CreativeProject,
  MediaAttachment,
  UserProfile,
} from '../types/studio';
import type { GenreThemeTokens } from '../theme/genreThemes';
import { firestoreStudio } from '../services/firestoreStudio';
import { StudioAvatar } from './StudioAvatar';
import { resolveStudioAsset } from '../assets/studioAssets';
import { GoogleDriveModal } from './GoogleDriveModal';
import { DriveSaveConfirmModal } from './DriveSaveConfirmModal';
import {
  DriveAuthError,
  type DriveFileFilter,
  type DriveFileItem,
  uploadStudioUrlToDrive,
} from '../services/googleDriveApi';
import { getAccessToken, googleSignIn } from '../services/googleDriveAuth';

interface CollaborationTabProps {
  project: CreativeProject;
  currentUser: UserProfile;
  theme: GenreThemeTokens;
  onProjectUpdate?: (updated: CreativeProject) => void;
}

const REACTIONS = [
  { key: 'heart', label: 'Love', Icon: Heart },
  { key: 'clap', label: 'Bravo', Icon: Award },
  { key: 'spark', label: 'Idea', Icon: Sparkles },
  { key: 'thumbs', label: 'Agree', Icon: ThumbsUp },
] as const;

const MAX_UPLOAD_BYTES = 150 * 1024 * 1024;
const ACCEPTED_MEDIA_TYPES =
  'image/*,video/*,audio/*,.pdf,.docx,.txt,.mov,.mp4,.webm,.heic,.heif,.mkv,.avi';

export function CollaborationTab({
  project,
  currentUser,
  theme,
}: CollaborationTabProps) {
  const isMember = project.members.some((m) => m.userId === currentUser.id);
  const [channel, setChannel] = useState<'chat' | 'discussion'>('chat');
  const [topicTitle, setTopicTitle] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadingLabel, setUploadingLabel] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Google Drive import & save state
  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [drivePostToChat, setDrivePostToChat] = useState(true);
  const [driveInitialFilter, setDriveInitialFilter] = useState<DriveFileFilter>('all');
  const [saveTarget, setSaveTarget] = useState<MediaAttachment | null>(null);
  const [savingToDrive, setSavingToDrive] = useState(false);

  // Voice Note Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSec, setRecordingSec] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const visibleMessages = project.messages.filter((m) => m.channel === channel);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages.length, channel]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  async function handleSendMessage(e: FormEvent) {
    e.preventDefault();
    if (!messageText.trim() || !isMember) return;
    setErrorMsg(null);
    setStatusMsg(null);
    setSending(true);
    try {
      await firestoreStudio.postMessage(project.id, currentUser, {
        content: messageText.trim(),
        channel,
        topicTitle: channel === 'discussion' ? topicTitle.trim() || undefined : undefined,
      });
      setMessageText('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setSending(false);
    }
  }

  async function handleFilesUpload(fileList: File[], postToChat: boolean) {
    if (fileList.length === 0 || !isMember) return;
    setErrorMsg(null);
    setStatusMsg(null);

    const oversized = fileList.find((f) => f.size > MAX_UPLOAD_BYTES);
    if (oversized) {
      setErrorMsg(
        `"${oversized.name}" exceeds the 150 MB upload limit. Try compressing the video or importing it from Google Drive.`
      );
      return;
    }

    setUploadingMedia(true);
    const captionText = postToChat && messageText.trim() ? messageText.trim() : undefined;

    try {
      for (let i = 0; i < fileList.length; i += 1) {
        const file = fileList[i];
        setUploadPct(0);
        setUploadingLabel(
          fileList.length > 1
            ? `Uploading ${file.name} (${i + 1}/${fileList.length})...`
            : `Uploading ${file.name}...`
        );

        const safeName =
          file.name && file.name.trim()
            ? file.name
            : `upload_${Date.now()}.${file.type.split('/')[1] || 'bin'}`;

        await firestoreStudio.uploadMedia(
          project.id,
          currentUser,
          file,
          safeName,
          {
            postToChat,
            channel,
            caption: i === 0 ? captionText : undefined,
            topicTitle: channel === 'discussion' ? topicTitle.trim() || undefined : undefined,
          },
          (pct) => setUploadPct(pct)
        );
      }

      if (captionText) setMessageText('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Media upload failed. Please try again.');
    } finally {
      setUploadingMedia(false);
      setUploadingLabel(null);
      setUploadPct(0);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (!isMember) return;
    const droppedFiles = Array.from(e.dataTransfer.files ?? []);
    if (droppedFiles.length > 0) {
      void handleFilesUpload(droppedFiles, true);
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    if (!isMember) return;
    const items = Array.from(e.clipboardData?.items ?? []);
    const pastedFiles = items
      .filter((item) => item.kind === 'file')
      .map((item) => item.getAsFile())
      .filter((f): f is File => Boolean(f));
    if (pastedFiles.length > 0) {
      e.preventDefault();
      void handleFilesUpload(pastedFiles, true);
    }
  }

  async function handleImportFromDrive(selectedFiles: DriveFileItem[], accessToken: string) {
    setErrorMsg(null);
    setStatusMsg(null);
    const captionText = drivePostToChat && messageText.trim() ? messageText.trim() : undefined;

    for (let i = 0; i < selectedFiles.length; i += 1) {
      const df = selectedFiles[i];
      await firestoreStudio.importMediaFromDrive(project.id, currentUser, accessToken, {
        fileId: df.id,
        fileName: df.name,
        mimeType: df.mimeType,
        postToChat: drivePostToChat,
        channel,
        topicTitle: channel === 'discussion' ? topicTitle.trim() || undefined : undefined,
        caption: i === 0 ? captionText : undefined,
      });
    }

    if (captionText) setMessageText('');
    setStatusMsg(
      `Imported ${selectedFiles.length} ${selectedFiles.length === 1 ? 'file' : 'files'} from Google Drive.`
    );
  }

  async function handleConfirmSaveToDrive() {
    if (!saveTarget) return;
    setErrorMsg(null);
    setStatusMsg(null);
    setSavingToDrive(true);
    try {
      let token = await getAccessToken();
      if (!token) {
        const res = await googleSignIn();
        token = res.accessToken;
      }
      const resolvedUrl = resolveStudioAsset(saveTarget.fileUrl) || saveTarget.fileUrl;
      await uploadStudioUrlToDrive({
        sourceUrl: resolvedUrl,
        fileName: saveTarget.fileName,
        mimeType: saveTarget.mimeType || 'application/octet-stream',
      });
      setStatusMsg(`Saved "${saveTarget.fileName}" to your Google Drive.`);
      setSaveTarget(null);
    } catch (err) {
      if (err instanceof DriveAuthError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Unable to save file to Google Drive.');
      }
    } finally {
      setSavingToDrive(false);
    }
  }

  async function toggleVoiceRecording() {
    if (!isMember) return;
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      if (timerRef.current) window.clearInterval(timerRef.current);
      setIsRecording(false);
      return;
    }

    setErrorMsg(null);
    setStatusMsg(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMsg('Voice recording is not supported in this browser. You can upload audio files instead.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      setRecordingSec(0);
      const startedAt = Date.now();

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size === 0) return;

        setUploadingMedia(true);
        setUploadingLabel('Uploading voice note...');
        setUploadPct(0);
        try {
          await firestoreStudio.uploadMedia(
            project.id,
            currentUser,
            blob,
            `voice_note_${Date.now()}.webm`,
            {
              postToChat: true,
              channel,
              mediaCategory: 'voice_note',
              durationSeconds,
              caption: `Voice note (${durationSeconds}s)`,
            },
            (pct) => setUploadPct(pct)
          );
        } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to upload voice note.');
        } finally {
          setUploadingMedia(false);
          setUploadingLabel(null);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setRecordingSec((s) => s + 1);
      }, 1000);
    } catch {
      setErrorMsg('Microphone access was denied. Enable microphone permission or upload an audio file.');
    }
  }

  async function handleReaction(msg: ChatMessage, key: 'heart' | 'clap' | 'spark' | 'thumbs') {
    if (!isMember) return;
    try {
      await firestoreStudio.toggleReaction(project.id, currentUser.id, msg.id, key);
    } catch {
      // ignore transient reaction error
    }
  }

  function renderAttachmentPreview(att: MediaAttachment) {
    const resolved = resolveStudioAsset(att.fileUrl) || att.fileUrl;
    if (att.mediaCategory === 'image') {
      return (
        <div className="mt-2 space-y-1.5">
          <button
            type="button"
            onClick={() => setLightboxImage({ url: resolved, name: att.fileName })}
            className="block overflow-hidden rounded-xl border border-black/10 bg-white max-w-xs cursor-zoom-in"
          >
            <img
              src={resolved}
              alt={att.fileName}
              referrerPolicy="no-referrer"
              className="max-h-56 w-full object-cover"
            />
          </button>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <a href={resolved} download={att.fileName} className="hover:text-slate-800 underline">
              Download
            </a>
            <button
              type="button"
              onClick={() => setSaveTarget(att)}
              className="inline-flex items-center gap-1 hover:text-slate-800 underline cursor-pointer"
            >
              <HardDriveUpload className="w-3 h-3" />
              Save to Drive
            </button>
          </div>
        </div>
      );
    }
    if (att.mediaCategory === 'video') {
      return (
        <div className="mt-2 space-y-1.5 max-w-sm">
          <video
            controls
            playsInline
            preload="metadata"
            src={resolved}
            className="rounded-xl border border-black/10 max-h-60 w-full bg-slate-900/5"
          />
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <a href={resolved} download={att.fileName} className="hover:text-slate-800 underline">
              Download
            </a>
            <button
              type="button"
              onClick={() => setSaveTarget(att)}
              className="inline-flex items-center gap-1 hover:text-slate-800 underline cursor-pointer"
            >
              <HardDriveUpload className="w-3 h-3" />
              Save to Drive
            </button>
          </div>
        </div>
      );
    }
    if (att.mediaCategory === 'audio' || att.mediaCategory === 'voice_note') {
      return (
        <div className="mt-2 p-2.5 rounded-xl bg-white/90 border border-black/10 space-y-1.5 max-w-xs">
          <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-slate-600">
            <div className="flex items-center gap-1.5 min-w-0">
              <Music className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {att.mediaCategory === 'voice_note'
                  ? `Voice Note${att.durationSeconds ? ` (${att.durationSeconds}s)` : ''}`
                  : att.fileName}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSaveTarget(att)}
              title="Save to Google Drive"
              className="text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
            >
              <HardDriveUpload className="w-3.5 h-3.5" />
            </button>
          </div>
          <audio controls preload="metadata" src={resolved} className="w-full h-8" />
        </div>
      );
    }
    return (
      <div className="mt-2 flex items-center gap-2">
        <a
          href={resolved}
          download={att.fileName}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/90 border border-black/10 text-xs font-medium hover:bg-white transition-colors"
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span className="truncate max-w-[180px]">{att.fileName}</span>
          <Download className="w-3.5 h-3.5 opacity-60" />
        </a>
        <button
          type="button"
          onClick={() => setSaveTarget(att)}
          title="Save to Google Drive"
          className="p-2 rounded-xl bg-white/90 border border-black/10 text-slate-500 hover:text-slate-800 hover:bg-white cursor-pointer"
        >
          <HardDriveUpload className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div
        className="studio-glass rounded-2xl border p-10 text-center space-y-3"
        style={{ borderColor: theme.borderSubtle }}
      >
        <h3 className="text-lg font-semibold">Private Team Collaboration Workspace</h3>
        <p className="text-sm max-w-md mx-auto" style={{ color: theme.mutedInk }}>
          Only accepted team members can access the project group chat, voice notes, creative discussions, and shared reference media.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Columns: Group Chat & Creative Discussion */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isDraggingOver) setIsDraggingOver(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setIsDraggingOver(false);
        }}
        onDrop={handleDrop}
        className="relative lg:col-span-2 studio-glass rounded-2xl border flex flex-col h-[640px] overflow-hidden"
        style={{ borderColor: isDraggingOver ? theme.accent : theme.borderSubtle }}
      >
        {isDraggingOver && (
          <div className="absolute inset-0 z-20 bg-white/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl pointer-events-none"
            style={{ borderColor: theme.accent }}
          >
            <ImageIcon className="w-7 h-7" style={{ color: theme.accentText }} />
            <p className="text-sm font-semibold text-slate-900">Drop photos, videos, or files to share</p>
            <p className="text-xs text-slate-500">Up to 150 MB per file</p>
          </div>
        )}

        {/* Channel Switcher Header */}
        <div
          className="px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 bg-white/60"
          style={{ borderColor: theme.borderSubtle }}
        >
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/80">
            <button
              type="button"
              onClick={() => setChannel('chat')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                channel === 'chat'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Group Chat
            </button>
            <button
              type="button"
              onClick={() => setChannel('discussion')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                channel === 'discussion'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Project Discussion
            </button>
          </div>
          <span className="text-xs tabular-nums" style={{ color: theme.mutedInk }}>
            Real-time workspace · {project.members.length} team members
          </span>
        </div>

        {/* Scrollable Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {visibleMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <p className="text-sm font-medium">
                {channel === 'chat'
                  ? 'No messages in group chat yet.'
                  : 'No project discussion threads yet.'}
              </p>
              <p className="text-xs mt-1 max-w-sm" style={{ color: theme.mutedInk }}>
                {channel === 'chat'
                  ? 'Say hello, drop photos or videos, record a voice note, or import from Google Drive.'
                  : 'Coordinate creative direction, references, and pacing notes by topic.'}
              </p>
            </div>
          ) : (
            visibleMessages.map((msg) => {
              const isSelf = msg.senderId === currentUser.id;
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2.5 ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <StudioAvatar
                    name={msg.senderName}
                    avatarUrl={msg.senderAvatar}
                    size="sm"
                    tintBg={theme.accentSoft}
                    tintText={theme.accentText}
                  />
                  <div className={`max-w-[78%] space-y-1 ${isSelf ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className="flex items-center gap-2 text-[11px] px-1" style={{ color: theme.mutedInk }}>
                      <span className="font-medium text-slate-700">{isSelf ? 'You' : msg.senderName}</span>
                      <span>·</span>
                      <span>{msg.senderRole}</span>
                      <span>·</span>
                      <span className="tabular-nums">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div
                      style={
                        isSelf
                          ? {
                              backgroundColor: theme.bubbleSelfBg,
                              borderColor: theme.bubbleSelfBorder,
                            }
                          : {
                              backgroundColor: '#FFFFFF',
                              borderColor: theme.borderSubtle,
                            }
                      }
                      className="rounded-2xl border px-4 py-2.5 shadow-2xs"
                    >
                      {msg.topicTitle && (
                        <div
                          className="text-[11px] font-semibold mb-1 pb-1 border-b"
                          style={{ color: theme.accentText, borderColor: theme.borderSubtle }}
                        >
                          Topic: {msg.topicTitle}
                        </div>
                      )}
                      {msg.content && (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      )}
                      {msg.attachment && renderAttachmentPreview(msg.attachment)}
                    </div>

                    {/* Message Reactions */}
                    <div className="flex items-center gap-1 px-1">
                      {REACTIONS.map(({ key, label, Icon }) => {
                        const users = msg.reactions?.[key] ?? [];
                        const reacted = users.includes(currentUser.id);
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => void handleReaction(msg, key)}
                            title={label}
                            style={
                              reacted
                                ? { backgroundColor: theme.accentSoft, color: theme.accentText }
                                : undefined
                            }
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] transition-colors cursor-pointer ${
                              reacted
                                ? 'font-medium'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-white/70'
                            }`}
                          >
                            <Icon className="w-3 h-3" />
                            {users.length > 0 && <span className="tabular-nums">{users.length}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Upload / Error / Status Banner */}
        {(errorMsg || statusMsg || uploadingMedia) && (
          <div className="px-5 py-2 border-t bg-white/85 text-xs space-y-1" style={{ borderColor: theme.borderSubtle }}>
            {errorMsg && <p className="text-rose-700 font-medium">{errorMsg}</p>}
            {statusMsg && (
              <p className="text-emerald-700 font-medium flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                {statusMsg}
              </p>
            )}
            {uploadingMedia && (
              <div className="space-y-1">
                <div className="flex justify-between tabular-nums">
                  <span className="truncate">{uploadingLabel || 'Uploading media...'}</span>
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
          </div>
        )}

        {/* Composer */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t bg-white/85 space-y-2.5"
          style={{ borderColor: theme.borderSubtle }}
        >
          {channel === 'discussion' && (
            <input
              type="text"
              value={topicTitle}
              onChange={(e) => setTopicTitle(e.target.value)}
              placeholder="Discussion topic (e.g. Character Pacing, Sound References)"
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border focus:outline-none"
              style={{ borderColor: theme.borderSubtle }}
            />
          )}

          <div className="flex items-center gap-2">
            <label
              title="Upload photos, videos, audio, or documents (up to 150 MB)"
              className="inline-flex items-center gap-1.5 px-2.5 py-2.5 rounded-xl bg-white border hover:bg-slate-50 transition-colors cursor-pointer shrink-0 text-xs font-medium"
              style={{ borderColor: theme.borderSubtle, color: theme.mutedInk }}
            >
              <Paperclip className="w-4 h-4" />
              <span className="hidden sm:inline">Photo / Video</span>
              <input
                type="file"
                multiple
                accept={ACCEPTED_MEDIA_TYPES}
                className="sr-only"
                onChange={(e) => {
                  const selected = Array.from(e.target.files ?? []);
                  e.target.value = '';
                  if (selected.length > 0) {
                    void handleFilesUpload(selected, true);
                  }
                }}
              />
            </label>

            <button
              type="button"
              onClick={() => {
                setDrivePostToChat(true);
                setDriveInitialFilter('all');
                setDriveModalOpen(true);
              }}
              title="Share photo, video, or file from Google Drive"
              className="inline-flex items-center gap-1.5 px-2.5 py-2.5 rounded-xl bg-white border hover:bg-slate-50 transition-colors cursor-pointer shrink-0 text-xs font-medium"
              style={{ borderColor: theme.borderSubtle, color: theme.mutedInk }}
            >
              <HardDrive className="w-4 h-4" />
              <span className="hidden sm:inline">Drive</span>
            </button>

            <button
              type="button"
              onClick={() => void toggleVoiceRecording()}
              title={isRecording ? 'Stop and send voice note' : 'Record a voice note'}
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                isRecording
                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'bg-white hover:bg-slate-50 text-slate-600'
              }`}
              style={!isRecording ? { borderColor: theme.borderSubtle } : undefined}
            >
              {isRecording ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span className="tabular-nums">{recordingSec}s</span>
                </>
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onPaste={handlePaste}
              placeholder={
                channel === 'chat'
                  ? 'Write a message, paste an image, or drop photos/videos...'
                  : 'Share an idea, reference, or coordination note...'
              }
              className="flex-1 min-w-0 px-3.5 py-2.5 text-sm rounded-xl bg-white border focus:outline-none"
              style={{ borderColor: theme.borderSubtle }}
            />

            <button
              type="submit"
              disabled={sending || !messageText.trim()}
              style={{ backgroundColor: theme.accent, color: '#FFFFFF' }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-xl cursor-pointer disabled:opacity-45 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              Send
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: Shared Media Library */}
      <div
        className="studio-glass rounded-2xl border p-5 flex flex-col h-[640px]"
        style={{ borderColor: theme.borderSubtle }}
      >
        <div className="flex items-center justify-between gap-2 pb-3 border-b" style={{ borderColor: theme.borderSubtle }}>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">Shared Media</h3>
            <p className="text-xs truncate" style={{ color: theme.mutedInk }}>
              Images, video, audio & Google Drive
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setDrivePostToChat(false);
                setDriveInitialFilter('all');
                setDriveModalOpen(true);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl bg-white border hover:bg-slate-50 cursor-pointer whitespace-nowrap"
              style={{ borderColor: theme.borderSubtle, color: theme.ink }}
              title="Import from Google Drive"
            >
              <HardDrive className="w-3.5 h-3.5" />
              Drive
            </button>
            <label
              style={{
                backgroundColor: theme.accentSoft,
                color: theme.accentText,
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-xl cursor-pointer hover:opacity-90 whitespace-nowrap"
            >
              + Upload
              <input
                type="file"
                multiple
                accept={ACCEPTED_MEDIA_TYPES}
                className="sr-only"
                onChange={(e) => {
                  const selected = Array.from(e.target.files ?? []);
                  e.target.value = '';
                  if (selected.length > 0) {
                    void handleFilesUpload(selected, false);
                  }
                }}
              />
            </label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pt-4 space-y-3">
          {project.sharedMedia.length === 0 ? (
            <div className="text-center py-14 px-4">
              <p className="text-xs font-medium text-slate-600">No shared media yet</p>
              <p className="text-[11px] mt-1" style={{ color: theme.mutedInk }}>
                Upload photos, videos, scratch audio, voice notes, or import from Google Drive.
              </p>
            </div>
          ) : (
            project.sharedMedia.map((media) => {
              const resolved = resolveStudioAsset(media.fileUrl) || media.fileUrl;
              const CatIcon =
                media.mediaCategory === 'image'
                  ? ImageIcon
                  : media.mediaCategory === 'video'
                    ? Film
                    : media.mediaCategory === 'audio' || media.mediaCategory === 'voice_note'
                      ? Music
                      : FileText;

              return (
                <div
                  key={media.id}
                  className="p-3 rounded-xl bg-white/85 border space-y-2"
                  style={{ borderColor: theme.borderSubtle }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <CatIcon className="w-3.5 h-3.5 shrink-0" style={{ color: theme.accentText }} />
                      <span className="text-xs font-medium truncate">{media.fileName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSaveTarget(media)}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Save to Google Drive"
                      >
                        <HardDriveUpload className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={resolved}
                        download={media.fileName}
                        className="text-slate-400 hover:text-slate-700"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {media.mediaCategory === 'image' && (
                    <button
                      type="button"
                      onClick={() => setLightboxImage({ url: resolved, name: media.fileName })}
                      className="block w-full overflow-hidden rounded-lg border border-black/5 cursor-zoom-in"
                    >
                      <img
                        src={resolved}
                        alt={media.fileName}
                        referrerPolicy="no-referrer"
                        className="w-full h-28 object-cover"
                      />
                    </button>
                  )}

                  {media.mediaCategory === 'video' && (
                    <video
                      controls
                      playsInline
                      preload="metadata"
                      src={resolved}
                      className="w-full rounded-lg max-h-36 bg-black/5"
                    />
                  )}

                  {(media.mediaCategory === 'audio' || media.mediaCategory === 'voice_note') && (
                    <audio controls preload="metadata" src={resolved} className="w-full h-8" />
                  )}

                  <div className="flex items-center justify-between text-[11px]" style={{ color: theme.mutedInk }}>
                    <span className="truncate">By {media.uploadedByName}</span>
                    <span className="tabular-nums">
                      {Math.max(1, Math.round(media.fileSize / 1024))} KB
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Lightbox Image Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-2xl p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-2 pb-2">
              <span className="text-xs font-medium text-slate-700 truncate">{lightboxImage.name}</span>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.name}
              referrerPolicy="no-referrer"
              className="w-full max-h-[75vh] object-contain rounded-xl bg-slate-50"
            />
          </div>
        </div>
      )}

      {/* Google Drive Picker Modal */}
      <GoogleDriveModal
        isOpen={driveModalOpen}
        onClose={() => setDriveModalOpen(false)}
        title={drivePostToChat ? 'Share from Google Drive to Chat' : 'Import to Shared Media'}
        subtitle="Select photos, videos, audio tracks, or documents from your Google Drive."
        initialFilter={driveInitialFilter}
        allowMultiple
        confirmLabel={drivePostToChat ? 'Share in Chat' : 'Add to Shared Media'}
        theme={theme}
        onSelectFiles={handleImportFromDrive}
      />

      {/* Explicit Confirmation Modal before saving/uploading to Google Drive */}
      <DriveSaveConfirmModal
        isOpen={Boolean(saveTarget)}
        fileName={saveTarget?.fileName ?? ''}
        description="This saves a copy of the project media file into your personal Google Drive."
        busy={savingToDrive}
        onCancel={() => setSaveTarget(null)}
        onConfirm={() => void handleConfirmSaveToDrive()}
      />
    </div>
  );
}
