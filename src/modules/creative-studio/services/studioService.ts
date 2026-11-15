/**
 * Crea-Link Creative Studio data service (Lovable Cloud).
 * Replaces the original Firestore + Express services with the same method
 * surface so the studio UI components keep working unchanged.
 */
import { supabase } from '@/integrations/supabase/client';
import {
  parseStorageRef,
  resolveStorageUrls,
  safeFileName,
  storageRef,
  uploadToBucket,
} from '@/lib/storage-urls';
import type {
  ChatMessage,
  CreativeProject,
  CreativeRole,
  CreatorConnection,
  ExperienceLevel,
  Genre,
  MediaAttachment,
  MediaCategory,
  Milestone,
  PeerFeedback,
  PortfolioItem,
  PortfolioMediaType,
  ProjectInvite,
  ProjectMember,
  ProjectStatus,
  ProjectTask,
  ScriptAccessLevel,
  ScriptData,
  TaskStatus,
  UserProfile,
} from '../types/studio';

type Unsubscribe = () => void;
type ProfileRow = {
  id: string;
  full_name: string;
  username: string | null;
  avatar_url: string;
  bio: string;
  studio_role: string;
  skill_category: string;
  skills: string[];
  experience: string;
  onboarded: boolean;
};

const EXP_MAP: Record<string, ExperienceLevel> = {
  Emerging: 'Emerging',
  Intermediate: 'Intermediate',
  Professional: 'Senior',
  Veteran: 'Lead',
};
const EXP_BACK: Record<ExperienceLevel, string> = {
  Emerging: 'Emerging',
  Intermediate: 'Intermediate',
  Senior: 'Professional',
  Lead: 'Veteran',
};

function makeId(prefix: string) {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return `${prefix}_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

function makeInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export function connectionIdFor(a: string, b: string) {
  return [a, b].sort().join('__');
}

function fail(err: { message?: string } | null | undefined, fallback: string): never {
  throw new Error(err?.message || fallback);
}

function categoryFor(mime: string): MediaCategory {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'document';
}

/** Debounced realtime subscription that calls `refresh` whenever any watched table changes. */
function watch(
  tables: { table: string; filter?: string }[],
  refresh: () => void | Promise<void>
): Unsubscribe {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;
  const run = () => {
    if (disposed) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void refresh(), 120);
  };
  const channel = supabase.channel(`studio-${Math.random().toString(36).slice(2)}`);
  for (const t of tables) {
    channel.on(
      'postgres_changes' as never,
      { event: '*', schema: 'public', table: t.table, ...(t.filter ? { filter: t.filter } : {}) } as never,
      run as never
    );
  }
  channel.subscribe();
  void refresh();
  return () => {
    disposed = true;
    if (timer) clearTimeout(timer);
    void supabase.removeChannel(channel);
  };
}

// ---------------------------------------------------------------- profiles
const profileCache = new Map<string, UserProfile>();

async function mapProfiles(rows: ProfileRow[]): Promise<UserProfile[]> {
  const urls = await resolveStorageUrls(rows.map((r) => r.avatar_url));
  return rows.map((r) => {
    const p: UserProfile = {
      id: r.id,
      name: r.full_name || r.username || 'Crea-Link Creator',
      email: '',
      avatarUrl: urls.get(r.avatar_url) ?? '',
      creativeRole: (r.studio_role as CreativeRole) || 'Scriptwriter',
      skillCategory: r.skill_category || r.skills?.slice(0, 2).join(' & ') || 'Multidisciplinary Creative',
      experienceLevel: EXP_MAP[r.experience] ?? 'Intermediate',
      bio: r.bio || '',
    };
    profileCache.set(p.id, p);
    return p;
  });
}

async function fetchProfiles(ids?: string[]): Promise<UserProfile[]> {
  let q = supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url, bio, studio_role, skill_category, skills, experience, onboarded');
  if (ids) {
    if (ids.length === 0) return [];
    q = q.in('id', ids);
  }
  const { data, error } = await q;
  if (error) fail(error, 'Could not load creators');
  return mapProfiles((data ?? []) as ProfileRow[]);
}

// ---------------------------------------------------------------- projects
type ProjectRow = {
  id: string;
  title: string;
  description: string;
  genres: string[];
  primary_genre: string;
  status: string;
  is_draft: boolean;
  owner_id: string;
  owner_name: string;
  required_roles: string[];
  milestones: unknown;
  tasks: unknown;
  feedback: unknown;
  portfolio: unknown;
  created_at: string;
  updated_at: string;
};
type MemberRow = {
  project_id: string;
  user_id: string;
  role_in_project: string;
  creative_role: string;
  joined_at: string;
};

async function buildProjects(rows: ProjectRow[]): Promise<CreativeProject[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const { data: memberRows } = await supabase
    .from('project_members')
    .select('project_id, user_id, role_in_project, creative_role, joined_at')
    .in('project_id', ids);
  const members = (memberRows ?? []) as MemberRow[];
  const userIds = [...new Set(members.map((m) => m.user_id).concat(rows.map((r) => r.owner_id)))];
  const profiles = await fetchProfiles(userIds);
  const byId = new Map(profiles.map((p) => [p.id, p]));

  const portfolioRefs = rows.flatMap((r) =>
    ((r.portfolio as PortfolioItem[]) ?? []).flatMap((p) => [p.mediaUrl, p.previewImageUrl])
  );
  const urls = await resolveStorageUrls(portfolioRefs);

  return rows.map((r) => {
    const projMembers: ProjectMember[] = members
      .filter((m) => m.project_id === r.id)
      .map((m) => {
        const p = byId.get(m.user_id);
        return {
          userId: m.user_id,
          name: p?.name ?? 'Creator',
          avatarUrl: p?.avatarUrl ?? '',
          creativeRole: (m.creative_role as CreativeRole) || p?.creativeRole || 'Scriptwriter',
          skillCategory: p?.skillCategory ?? '',
          experienceLevel: p?.experienceLevel ?? 'Intermediate',
          roleInProject: (m.role_in_project as ProjectMember['roleInProject']) || 'member',
          joinedAt: m.joined_at,
          bio: p?.bio ?? '',
        };
      })
      .sort((a, b) => (a.roleInProject === 'owner' ? -1 : b.roleInProject === 'owner' ? 1 : a.joinedAt.localeCompare(b.joinedAt)));
    const portfolio = ((r.portfolio as PortfolioItem[]) ?? []).map((p) => ({
      ...p,
      mediaUrl: urls.get(p.mediaUrl) ?? p.mediaUrl,
      previewImageUrl: p.previewImageUrl ? urls.get(p.previewImageUrl) ?? p.previewImageUrl : undefined,
    }));
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      genres: (r.genres?.length ? r.genres : ['Other']) as Genre[],
      primaryGenre: (r.primary_genre as Genre) || 'Other',
      status: (r.status as ProjectStatus) || 'Planning',
      isDraft: r.is_draft,
      ownerId: r.owner_id,
      ownerName: byId.get(r.owner_id)?.name ?? r.owner_name,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      requiredRoles: (r.required_roles ?? []) as CreativeRole[],
      members: projMembers,
      script: null,
      scriptRestricted: false,
      milestones: ((r.milestones as Milestone[]) ?? []).slice().sort((a, b) => a.targetDate.localeCompare(b.targetDate)),
      tasks: (r.tasks as ProjectTask[]) ?? [],
      messages: [],
      sharedMedia: [],
      feedback: (r.feedback as PeerFeedback[]) ?? [],
      portfolio,
      invites: [],
    };
  });
}

async function fetchProjectRow(projectId: string): Promise<ProjectRow> {
  const { data, error } = await supabase.from('projects').select('*').eq('id', projectId).maybeSingle();
  if (error) fail(error, 'Could not load project');
  if (!data) throw new Error('Project not found or you do not have access.');
  return data as ProjectRow;
}

async function patchBoards(
  projectId: string,
  mutate: (row: ProjectRow) => Partial<Pick<ProjectRow, 'milestones' | 'tasks' | 'feedback' | 'portfolio'>>
) {
  const row = await fetchProjectRow(projectId);
  const patch = mutate(row);
  const { error } = await supabase.from('projects').update(patch as never).eq('id', projectId);
  if (error) fail(error, 'Could not save changes');
}

function mapScript(row: Record<string, unknown>, fileUrl?: string): ScriptData {
  return {
    id: `script_${row.project_id}`,
    fileName: String(row.file_name ?? 'script.txt'),
    format: (row.format as ScriptData['format']) || 'editor',
    fileUrl,
    textContent: String(row.text_content ?? ''),
    htmlPreview: (row.html_preview as string) || undefined,
    accessLevel: (row.access_level as ScriptAccessLevel) || 'team_members',
    uploadedBy: String(row.uploaded_by ?? ''),
    uploadedByName: String(row.uploaded_by_name ?? ''),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
    fileSize: (row.file_size as number) ?? undefined,
  };
}

async function extractScript(file: Blob, fileName: string): Promise<{ format: 'docx' | 'pdf' | 'txt'; text: string; html?: string }> {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  if (ext === 'txt' || file.type === 'text/plain') return { format: 'txt', text: await file.text() };
  if (ext === 'docx') {
    const mammoth = (await import('mammoth')).default;
    const arrayBuffer = await file.arrayBuffer();
    const raw = await mammoth.extractRawText({ arrayBuffer });
    const html = await mammoth.convertToHtml({ arrayBuffer });
    return { format: 'docx', text: raw.value || '', html: html.value || undefined };
  }
  if (ext === 'pdf' || file.type === 'application/pdf') return { format: 'pdf', text: '' };
  throw new Error('Unsupported script format. Please upload .docx, .pdf, or .txt.');
}

async function downloadDriveFile(accessToken: string, fileId: string, mimeType: string, fileName: string) {
  let url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`;
  let finalName = fileName;
  let finalMime = mimeType;
  if (mimeType === 'application/vnd.google-apps.document') {
    url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text/plain`;
    finalMime = 'text/plain';
    if (!finalName.toLowerCase().endsWith('.txt')) finalName = `${finalName}.txt`;
  } else if (mimeType.startsWith('application/vnd.google-apps.')) {
    url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=application/pdf`;
    finalMime = 'application/pdf';
    if (!finalName.toLowerCase().endsWith('.pdf')) finalName = `${finalName}.pdf`;
  }
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Google Drive download failed (${res.status}).`);
  const blob = await res.blob();
  return { blob: new Blob([blob], { type: finalMime }), fileName: finalName, mimeType: finalMime };
}

// ---------------------------------------------------------------- service
export const studioService = {
  async getMyProfile(userId: string): Promise<UserProfile | null> {
    const list = await fetchProfiles([userId]);
    return list[0] ?? null;
  },

  async updateMyProfile(
    user: { id: string },
    payload: { name: string; creativeRole: CreativeRole; skillCategory: string; experienceLevel: ExperienceLevel; bio: string }
  ): Promise<UserProfile> {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: payload.name.trim().slice(0, 80),
        studio_role: payload.creativeRole,
        skill_category: payload.skillCategory.trim().slice(0, 100),
        experience: EXP_BACK[payload.experienceLevel],
        bio: payload.bio.trim().slice(0, 500),
      })
      .eq('id', user.id);
    if (error) fail(error, 'Could not update profile');
    const p = await this.getMyProfile(user.id);
    if (!p) throw new Error('Profile not found');
    return p;
  },

  subscribeCreators(onUpdate: (creators: UserProfile[]) => void): Unsubscribe {
    return watch([{ table: 'profiles' }], async () => {
      const list = await fetchProfiles().catch(() => [] as UserProfile[]);
      onUpdate(list.sort((a, b) => a.name.localeCompare(b.name)));
    });
  },

  subscribeConnections(uid: string, onUpdate: (c: CreatorConnection[]) => void): Unsubscribe {
    return watch([{ table: 'connections' }], async () => {
      const { data } = await supabase
        .from('connections')
        .select('*')
        .or(`from_id.eq.${uid},to_id.eq.${uid}`)
        .order('updated_at', { ascending: false });
      const rows = data ?? [];
      const ids = [...new Set(rows.flatMap((r) => [r.from_id, r.to_id]))];
      const profiles = await fetchProfiles(ids).catch(() => [] as UserProfile[]);
      const byId = new Map(profiles.map((p) => [p.id, p]));
      onUpdate(
        rows.map((r) => ({
          id: r.id,
          fromId: r.from_id,
          fromName: byId.get(r.from_id)?.name ?? 'Creator',
          fromRole: byId.get(r.from_id)?.creativeRole,
          fromAvatar: byId.get(r.from_id)?.avatarUrl,
          toId: r.to_id,
          toName: byId.get(r.to_id)?.name ?? 'Creator',
          toRole: byId.get(r.to_id)?.creativeRole,
          toAvatar: byId.get(r.to_id)?.avatarUrl,
          participants: [r.from_id, r.to_id] as [string, string],
          status: r.status as CreatorConnection['status'],
          note: r.note || undefined,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }))
      );
    });
  },

  subscribeIncomingInvites(uid: string, onUpdate: (invites: ProjectInvite[]) => void): Unsubscribe {
    return watch([{ table: 'project_invites', filter: `target_user_id=eq.${uid}` }], async () => {
      const { data } = await supabase
        .from('project_invites')
        .select('*, projects(title, primary_genre, status, owner_id, owner_name)')
        .eq('target_user_id', uid)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      onUpdate(
        (data ?? []).map((r) => {
          const p = (r as unknown as { projects: { title: string; primary_genre: string; status: string; owner_id: string; owner_name: string } | null }).projects;
          return {
            id: r.code,
            code: r.code,
            projectId: r.project_id,
            projectTitle: p?.title ?? 'Creative Project',
            projectPrimaryGenre: p?.primary_genre as Genre | undefined,
            projectStatus: p?.status as ProjectStatus | undefined,
            ownerId: p?.owner_id,
            ownerName: p?.owner_name,
            roleOffered: (r.role_offered as CreativeRole) || undefined,
            targetUserId: r.target_user_id ?? undefined,
            targetName: r.target_name ?? undefined,
            createdBy: r.created_by,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            status: r.status === 'accepted' ? 'accepted' : 'pending',
          } satisfies ProjectInvite;
        })
      );
    });
  },

  subscribeDashboardProjects(_uid: string, onUpdate: (projects: CreativeProject[]) => void): Unsubscribe {
    return watch([{ table: 'projects' }, { table: 'project_members' }], async () => {
      const { data, error } = await supabase.from('projects').select('*').order('updated_at', { ascending: false });
      if (error) {
        onUpdate([]);
        return;
      }
      onUpdate(await buildProjects((data ?? []) as ProjectRow[]));
    });
  },

  subscribeProjectWorkspace(projectId: string, uid: string, onUpdate: (patch: Partial<CreativeProject>) => void): Unsubscribe {
    const f = `project_id=eq.${projectId}`;
    return watch(
      [
        { table: 'project_messages', filter: f },
        { table: 'message_reactions', filter: f },
        { table: 'project_media', filter: f },
        { table: 'project_scripts', filter: f },
        { table: 'project_invites', filter: f },
        { table: 'project_members', filter: f },
        { table: 'projects', filter: `id=eq.${projectId}` },
      ],
      async () => {
        const [rowRes, msgRes, reactRes, mediaRes, scriptRes, invRes] = await Promise.all([
          supabase.from('projects').select('*').eq('id', projectId).maybeSingle(),
          supabase.from('project_messages').select('*').eq('project_id', projectId).order('created_at', { ascending: true }).limit(500),
          supabase.from('message_reactions').select('message_id, user_id, reaction').eq('project_id', projectId),
          supabase.from('project_media').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
          supabase.from('project_scripts').select('*').eq('project_id', projectId).maybeSingle(),
          supabase.from('project_invites').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
        ]);
        const base = rowRes.data ? (await buildProjects([rowRes.data as ProjectRow]))[0] : null;
        const isMember = !!base && (base.ownerId === uid || base.members.some((m) => m.userId === uid));

        const media = mediaRes.data ?? [];
        const msgs = msgRes.data ?? [];
        const attRefs = msgs.map((m) => (m.attachment as { fileUrl?: string } | null)?.fileUrl);
        const scriptRow = scriptRes.data as Record<string, unknown> | null;
        const urls = await resolveStorageUrls([
          ...media.map((m) => storageRef('project-files', m.file_path)),
          ...attRefs,
          ...msgs.map((m) => m.sender_avatar),
          scriptRow?.file_path ? storageRef('project-files', String(scriptRow.file_path)) : null,
        ]);

        const reactions = new Map<string, Record<string, string[]>>();
        for (const r of reactRes.data ?? []) {
          const map = reactions.get(r.message_id) ?? {};
          (map[r.reaction] ??= []).push(r.user_id);
          reactions.set(r.message_id, map);
        }

        const messages: ChatMessage[] = msgs.map((m) => {
          const att = m.attachment as MediaAttachment | null;
          return {
            id: m.id,
            projectId: m.project_id,
            channel: (m.channel as ChatMessage['channel']) || 'chat',
            topicTitle: m.topic_title ?? undefined,
            senderId: m.sender_id,
            senderName: profileCache.get(m.sender_id)?.name ?? m.sender_name,
            senderAvatar: profileCache.get(m.sender_id)?.avatarUrl ?? urls.get(m.sender_avatar) ?? '',
            senderRole: m.sender_role,
            content: m.content,
            createdAt: m.created_at,
            attachment: att ? { ...att, fileUrl: urls.get(att.fileUrl) ?? att.fileUrl } : undefined,
            reactions: reactions.get(m.id) ?? {},
          };
        });

        const sharedMedia: MediaAttachment[] = media.map((m) => ({
          id: m.id,
          fileName: m.file_name,
          fileUrl: urls.get(storageRef('project-files', m.file_path)) ?? '',
          mimeType: m.mime_type,
          mediaCategory: m.media_category as MediaCategory,
          fileSize: Number(m.file_size) || 0,
          uploadedBy: m.uploaded_by,
          uploadedByName: m.uploaded_by_name,
          createdAt: m.created_at,
          durationSeconds: m.duration_seconds != null ? Number(m.duration_seconds) : undefined,
        }));

        const invites: ProjectInvite[] = (invRes.data ?? []).map((r) => ({
          id: r.code,
          code: r.code,
          projectId: r.project_id,
          projectTitle: base?.title,
          roleOffered: (r.role_offered as CreativeRole) || undefined,
          targetUserId: r.target_user_id ?? undefined,
          targetName: r.target_name ?? undefined,
          acceptedBy: r.accepted_by ?? undefined,
          createdBy: r.created_by,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          status: r.status === 'accepted' ? 'accepted' : 'pending',
        }));

        const script = scriptRow
          ? mapScript(scriptRow, scriptRow.file_path ? urls.get(storageRef('project-files', String(scriptRow.file_path))) : undefined)
          : null;

        onUpdate({
          ...(base ?? {}),
          messages,
          sharedMedia,
          invites,
          script,
          scriptRestricted: !script && isMember === false,
        });
      }
    );
  },

  // ---------------------------------------------------------------- projects
  async createProject(
    creator: UserProfile,
    payload: {
      title: string;
      description: string;
      genres: Genre[];
      primaryGenre: Genre;
      status: ProjectStatus;
      isDraft: boolean;
      requiredRoles: CreativeRole[];
      scriptText?: string;
      scriptAccessLevel?: ScriptAccessLevel;
    }
  ): Promise<CreativeProject> {
    const genres: Genre[] = payload.genres.length ? payload.genres.slice(0, 10) : ['Other'];
    const primary = genres.includes(payload.primaryGenre) ? payload.primaryGenre : genres[0];
    const { data, error } = await supabase
      .from('projects')
      .insert({
        title: payload.title.trim().slice(0, 140) || 'Untitled Creative Project',
        description: payload.description.trim().slice(0, 2000),
        genres,
        primary_genre: primary,
        status: payload.status,
        is_draft: payload.isDraft,
        owner_id: creator.id,
        owner_name: creator.name.slice(0, 80),
        required_roles: payload.requiredRoles.slice(0, 15),
      })
      .select('*')
      .single();
    if (error || !data) fail(error, 'Could not create project');
    const { error: mErr } = await supabase.from('project_members').insert({
      project_id: data.id,
      user_id: creator.id,
      role_in_project: 'owner',
      creative_role: creator.creativeRole,
    });
    if (mErr) fail(mErr, 'Could not add you to the project');
    if (payload.scriptText?.trim()) {
      await supabase.from('project_scripts').insert({
        project_id: data.id,
        file_name: 'studio_script_editor.txt',
        format: 'editor',
        text_content: payload.scriptText.slice(0, 200000),
        access_level: payload.scriptAccessLevel || 'team_members',
        uploaded_by: creator.id,
        uploaded_by_name: creator.name.slice(0, 80),
        file_size: new Blob([payload.scriptText]).size,
      });
    }
    return (await buildProjects([data as ProjectRow]))[0];
  },

  async updateProject(
    projectId: string,
    payload: Partial<{ title: string; description: string; genres: Genre[]; primaryGenre: Genre; status: ProjectStatus; isDraft: boolean; requiredRoles: CreativeRole[] }>
  ): Promise<void> {
    const u: Record<string, unknown> = {};
    if (payload.title !== undefined) u.title = payload.title.trim().slice(0, 140) || 'Untitled Project';
    if (payload.description !== undefined) u.description = payload.description.trim().slice(0, 2000);
    if (payload.genres !== undefined) u.genres = payload.genres.slice(0, 10);
    if (payload.primaryGenre !== undefined) u.primary_genre = payload.primaryGenre;
    if (payload.status !== undefined) u.status = payload.status;
    if (payload.isDraft !== undefined) u.is_draft = payload.isDraft;
    if (payload.requiredRoles !== undefined) u.required_roles = payload.requiredRoles.slice(0, 15);
    const { error } = await supabase.from('projects').update(u as never).eq('id', projectId);
    if (error) fail(error, 'Could not update project');
  },

  async deleteProject(projectId: string, _ownerId: string): Promise<void> {
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) fail(error, 'Could not delete project');
  },

  // ---------------------------------------------------------------- script
  async uploadScriptFile(projectId: string, user: UserProfile, file: File, accessLevel: ScriptAccessLevel, onProgress?: (p: number) => void): Promise<ScriptData> {
    onProgress?.(5);
    const parsed = await extractScript(file, file.name);
    onProgress?.(35);
    const path = `${projectId}/scripts/${Date.now()}_${safeFileName(file.name)}`;
    await uploadToBucket('project-files', path, file);
    onProgress?.(85);
    const row = {
      project_id: projectId,
      file_name: file.name.slice(0, 200),
      format: parsed.format,
      file_path: path,
      text_content: parsed.text.slice(0, 200000),
      html_preview: parsed.html?.slice(0, 300000) ?? null,
      access_level: accessLevel,
      uploaded_by: user.id,
      uploaded_by_name: user.name.slice(0, 80),
      file_size: file.size,
    };
    const { error } = await supabase.from('project_scripts').upsert(row);
    if (error) fail(error, 'Could not save script');
    onProgress?.(100);
    return mapScript({ ...row, updated_at: new Date().toISOString() });
  },

  async saveScriptEditor(
    projectId: string,
    user: UserProfile,
    existing: ScriptData | null,
    payload: { textContent?: string; fileName?: string; accessLevel?: ScriptAccessLevel }
  ): Promise<void> {
    const text = payload.textContent !== undefined ? payload.textContent : existing?.textContent ?? '';
    const keepFile = payload.textContent === undefined;
    const current = keepFile
      ? (await supabase.from('project_scripts').select('file_path, html_preview, format').eq('project_id', projectId).maybeSingle()).data
      : null;
    const { error } = await supabase.from('project_scripts').upsert({
      project_id: projectId,
      file_name: (payload.fileName?.trim() || existing?.fileName || 'story_script.txt').slice(0, 200),
      format: keepFile ? current?.format || existing?.format || 'editor' : 'editor',
      file_path: keepFile ? current?.file_path ?? null : null,
      html_preview: keepFile ? current?.html_preview ?? null : null,
      text_content: text.slice(0, 200000),
      access_level: payload.accessLevel || existing?.accessLevel || 'team_members',
      uploaded_by: user.id,
      uploaded_by_name: user.name.slice(0, 80),
      file_size: new Blob([text]).size,
    });
    if (error) fail(error, 'Could not save script');
  },

  async removeScript(projectId: string): Promise<void> {
    const { error } = await supabase.from('project_scripts').delete().eq('project_id', projectId);
    if (error) fail(error, 'Could not remove script');
  },

  async importScriptFromDrive(
    projectId: string,
    user: UserProfile,
    accessToken: string,
    payload: { fileId: string; fileName: string; mimeType: string; accessLevel: ScriptAccessLevel }
  ): Promise<ScriptData> {
    const dl = await downloadDriveFile(accessToken, payload.fileId, payload.mimeType, payload.fileName);
    const file = new File([dl.blob], dl.fileName, { type: dl.mimeType });
    return this.uploadScriptFile(projectId, user, file, payload.accessLevel);
  },

  // ---------------------------------------------------------------- team
  async addMemberDirect(project: CreativeProject, target: UserProfile, creativeRole: CreativeRole): Promise<void> {
    const { error } = await supabase.from('project_members').upsert({
      project_id: project.id,
      user_id: target.id,
      role_in_project: 'member',
      creative_role: creativeRole,
    });
    if (error) fail(error, 'Could not add member');
  },

  async joinOpenProject(project: CreativeProject, currentUser: UserProfile, creativeRole: CreativeRole): Promise<void> {
    const { error } = await supabase.from('project_members').insert({
      project_id: project.id,
      user_id: currentUser.id,
      role_in_project: 'member',
      creative_role: creativeRole,
    });
    if (error) fail(error, 'Could not join project');
  },

  async removeMember(projectId: string, memberId: string): Promise<void> {
    const { error } = await supabase.from('project_members').delete().eq('project_id', projectId).eq('user_id', memberId);
    if (error) fail(error, 'Could not remove member');
  },

  async createInvite(
    project: CreativeProject,
    owner: UserProfile,
    payload: { roleOffered?: CreativeRole; targetUserId?: string; targetName?: string }
  ): Promise<ProjectInvite> {
    const code = makeInviteCode();
    const { error } = await supabase.from('project_invites').insert({
      code,
      project_id: project.id,
      role_offered: payload.roleOffered ?? null,
      target_user_id: payload.targetUserId ?? null,
      target_name: payload.targetName ?? null,
      created_by: owner.id,
    });
    if (error) fail(error, 'Could not create invite');
    const now = new Date().toISOString();
    return {
      id: code,
      code,
      projectId: project.id,
      projectTitle: project.title,
      projectPrimaryGenre: project.primaryGenre,
      projectStatus: project.status,
      ownerId: owner.id,
      ownerName: owner.name,
      roleOffered: payload.roleOffered,
      targetUserId: payload.targetUserId,
      targetName: payload.targetName,
      createdBy: owner.id,
      createdAt: now,
      status: 'pending',
    };
  },

  async lookupInvite(code: string): Promise<ProjectInvite> {
    const clean = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,16}$/.test(clean)) throw new Error('Please enter a valid invite code (letters and numbers, e.g. B737C2F2).');
    const { data, error } = await supabase.rpc('lookup_invite', { _code: clean });
    if (error) fail(error, `Invite code "${clean}" was not found.`);
    const d = data as Record<string, string>;
    return {
      id: d.code,
      code: d.code,
      projectId: d.project_id,
      projectTitle: d.project_title,
      projectPrimaryGenre: d.project_primary_genre as Genre,
      projectStatus: d.project_status as ProjectStatus,
      ownerId: d.owner_id,
      ownerName: d.owner_name,
      roleOffered: (d.role_offered as CreativeRole) || undefined,
      targetUserId: d.target_user_id || undefined,
      targetName: d.target_name || undefined,
      createdBy: d.created_by,
      createdAt: d.created_at,
      status: d.status === 'accepted' ? 'accepted' : 'pending',
    };
  },

  async redeemInvite(code: string, _user: UserProfile, creativeRole?: CreativeRole): Promise<{ projectId: string; alreadyMember: boolean }> {
    const { data, error } = await supabase.rpc('redeem_invite', { _code: code.trim().toUpperCase(), _role: creativeRole ?? '' });
    if (error) fail(error, 'Could not redeem invite');
    const d = data as { project_id: string; already_member: boolean };
    return { projectId: d.project_id, alreadyMember: d.already_member };
  },

  async declineInvite(code: string): Promise<void> {
    const { error } = await supabase.from('project_invites').update({ status: 'declined' }).eq('code', code.trim().toUpperCase());
    if (error) fail(error, 'Could not decline invite');
  },

  // ---------------------------------------------------------------- connections
  async sendConnectionRequest(fromUser: UserProfile, toCreator: UserProfile, note?: string): Promise<void> {
    if (fromUser.id === toCreator.id) throw new Error('You cannot connect with yourself.');
    const { data: existing } = await supabase
      .from('connections')
      .select('id, status')
      .or(`and(from_id.eq.${fromUser.id},to_id.eq.${toCreator.id}),and(from_id.eq.${toCreator.id},to_id.eq.${fromUser.id})`)
      .limit(1);
    if (existing && existing.length > 0) {
      const ex = existing[0];
      if (ex.status === 'declined') {
        await supabase.from('connections').delete().eq('id', ex.id);
      } else {
        throw new Error(ex.status === 'accepted' ? 'You are already connected.' : 'A connection request is already pending.');
      }
    }
    const { error } = await supabase.from('connections').insert({
      from_id: fromUser.id,
      to_id: toCreator.id,
      note: (note ?? '').trim().slice(0, 300),
    });
    if (error) fail(error, 'Could not send connection request');
  },

  async respondToConnection(connectionId: string, status: 'accepted' | 'declined'): Promise<void> {
    const { error } = await supabase.from('connections').update({ status }).eq('id', connectionId);
    if (error) fail(error, 'Could not update connection');
  },

  async removeConnection(connectionId: string): Promise<void> {
    const { error } = await supabase.from('connections').delete().eq('id', connectionId);
    if (error) fail(error, 'Could not remove connection');
  },

  // ---------------------------------------------------------------- boards
  async createMilestone(projectId: string, _userId: string, payload: { title: string; targetDate: string; description?: string }): Promise<void> {
    await patchBoards(projectId, (row) => ({
      milestones: [
        ...((row.milestones as Milestone[]) ?? []),
        {
          id: makeId('ms'),
          title: payload.title.trim().slice(0, 140),
          targetDate: payload.targetDate,
          status: 'pending' as TaskStatus,
          ...(payload.description?.trim() ? { description: payload.description.trim().slice(0, 500) } : {}),
        },
      ],
    }));
  },

  async updateMilestone(projectId: string, msId: string, payload: { status?: TaskStatus; title?: string; targetDate?: string }): Promise<void> {
    await patchBoards(projectId, (row) => ({
      milestones: ((row.milestones as Milestone[]) ?? []).map((m) => (m.id === msId ? { ...m, ...payload } : m)),
    }));
  },

  async createTask(
    project: CreativeProject,
    _userId: string,
    payload: { title: string; description?: string; milestoneId?: string; assigneeId?: string; dueDate?: string }
  ): Promise<void> {
    const assignee = payload.assigneeId ? project.members.find((m) => m.userId === payload.assigneeId) : undefined;
    const now = new Date().toISOString();
    await patchBoards(project.id, (row) => ({
      tasks: [
        ...((row.tasks as ProjectTask[]) ?? []),
        {
          id: makeId('task'),
          title: payload.title.trim().slice(0, 200),
          ...(payload.description?.trim() ? { description: payload.description.trim().slice(0, 1000) } : {}),
          ...(payload.milestoneId ? { milestoneId: payload.milestoneId } : {}),
          ...(assignee ? { assigneeId: assignee.userId, assigneeName: assignee.name } : {}),
          ...(payload.dueDate ? { dueDate: payload.dueDate } : {}),
          status: 'pending' as TaskStatus,
          createdAt: now,
          updatedAt: now,
        },
      ],
    }));
  },

  async updateTask(project: CreativeProject, taskId: string, payload: { status?: TaskStatus; assigneeId?: string | null; title?: string }): Promise<void> {
    await patchBoards(project.id, (row) => ({
      tasks: ((row.tasks as ProjectTask[]) ?? []).map((t) => {
        if (t.id !== taskId) return t;
        const next: ProjectTask = { ...t, updatedAt: new Date().toISOString() };
        if (payload.status) next.status = payload.status;
        if (payload.title) next.title = payload.title.trim().slice(0, 200);
        if (payload.assigneeId !== undefined) {
          const m = payload.assigneeId ? project.members.find((x) => x.userId === payload.assigneeId) : undefined;
          next.assigneeId = m?.userId;
          next.assigneeName = m?.name;
        }
        return next;
      }),
    }));
  },

  async deleteTask(projectId: string, taskId: string): Promise<void> {
    await patchBoards(projectId, (row) => ({
      tasks: ((row.tasks as ProjectTask[]) ?? []).filter((t) => t.id !== taskId),
    }));
  },

  async submitFeedback(projectId: string, reviewer: UserProfile, payload: { targetUserId: string; sentiment: 'positive' | 'constructive'; comment: string }): Promise<void> {
    const now = new Date().toISOString();
    const id = `${reviewer.id}__${payload.targetUserId}`;
    await patchBoards(projectId, (row) => {
      const list = ((row.feedback as PeerFeedback[]) ?? []).filter((f) => f.id !== id);
      const prev = ((row.feedback as PeerFeedback[]) ?? []).find((f) => f.id === id);
      return {
        feedback: [
          ...list,
          {
            id,
            projectId,
            reviewerId: reviewer.id,
            reviewerName: reviewer.name.slice(0, 80),
            targetUserId: payload.targetUserId,
            sentiment: payload.sentiment,
            comment: payload.comment.trim().slice(0, 600),
            createdAt: prev?.createdAt ?? now,
            updatedAt: now,
          },
        ],
      };
    });
  },

  // ---------------------------------------------------------------- chat & media
  async postMessage(projectId: string, user: UserProfile, payload: { content: string; channel: 'chat' | 'discussion'; topicTitle?: string }): Promise<void> {
    const { error } = await supabase.from('project_messages').insert({
      project_id: projectId,
      channel: payload.channel,
      topic_title: payload.topicTitle?.trim().slice(0, 120) || null,
      sender_id: user.id,
      sender_name: user.name.slice(0, 80),
      sender_role: user.creativeRole.slice(0, 60),
      content: payload.content.trim().slice(0, 2000),
    });
    if (error) fail(error, 'Could not send message');
  },

  async toggleReaction(projectId: string, userId: string, messageId: string, key: 'heart' | 'clap' | 'spark' | 'thumbs'): Promise<void> {
    const { data } = await supabase
      .from('message_reactions')
      .select('message_id')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('reaction', key)
      .maybeSingle();
    if (data) {
      await supabase.from('message_reactions').delete().eq('message_id', messageId).eq('user_id', userId).eq('reaction', key);
    } else {
      const { error } = await supabase.from('message_reactions').insert({ message_id: messageId, project_id: projectId, user_id: userId, reaction: key });
      if (error) fail(error, 'Could not react');
    }
  },

  async uploadMedia(
    projectId: string,
    user: UserProfile,
    file: File | Blob,
    fileName: string,
    options: { postToChat?: boolean; channel?: 'chat' | 'discussion'; caption?: string; mediaCategory?: MediaCategory; durationSeconds?: number; topicTitle?: string },
    onProgress?: (p: number) => void
  ): Promise<void> {
    onProgress?.(10);
    const mime = file.type || 'application/octet-stream';
    const path = `${projectId}/media/${Date.now()}_${safeFileName(fileName)}`;
    const ref = await uploadToBucket('project-files', path, file, mime);
    onProgress?.(80);
    const category = options.mediaCategory || categoryFor(mime);
    const { data: mediaRow, error } = await supabase
      .from('project_media')
      .insert({
        project_id: projectId,
        file_name: fileName.slice(0, 200),
        file_path: path,
        mime_type: mime.slice(0, 120),
        media_category: category,
        file_size: file.size,
        uploaded_by: user.id,
        uploaded_by_name: user.name.slice(0, 80),
        duration_seconds: options.durationSeconds ?? null,
      })
      .select('id')
      .single();
    if (error || !mediaRow) fail(error, 'Could not save media');
    if (options.postToChat) {
      const caption = options.caption?.trim() || (category === 'voice_note' ? 'Shared a voice note' : `Shared ${fileName}`);
      const { error: mErr } = await supabase.from('project_messages').insert({
        project_id: projectId,
        channel: options.channel === 'discussion' ? 'discussion' : 'chat',
        topic_title: options.topicTitle?.trim().slice(0, 120) || null,
        sender_id: user.id,
        sender_name: user.name.slice(0, 80),
        sender_role: user.creativeRole.slice(0, 60),
        content: caption.slice(0, 2000),
        attachment: {
          id: mediaRow.id,
          fileName: fileName.slice(0, 200),
          fileUrl: ref,
          mimeType: mime.slice(0, 120),
          mediaCategory: category,
          fileSize: file.size,
          uploadedBy: user.id,
          uploadedByName: user.name.slice(0, 80),
          createdAt: new Date().toISOString(),
          ...(options.durationSeconds ? { durationSeconds: options.durationSeconds } : {}),
        },
      });
      if (mErr) fail(mErr, 'Could not share media to chat');
    }
    onProgress?.(100);
  },

  async importMediaFromDrive(
    projectId: string,
    user: UserProfile,
    accessToken: string,
    payload: { fileId: string; fileName: string; mimeType: string; postToChat?: boolean; channel?: 'chat' | 'discussion'; topicTitle?: string; caption?: string }
  ): Promise<void> {
    const dl = await downloadDriveFile(accessToken, payload.fileId, payload.mimeType, payload.fileName);
    await this.uploadMedia(projectId, user, dl.blob, dl.fileName, {
      postToChat: payload.postToChat,
      channel: payload.channel,
      topicTitle: payload.topicTitle,
      caption: payload.caption,
    });
  },

  // ---------------------------------------------------------------- portfolio
  async addPortfolioItem(
    projectId: string,
    user: UserProfile,
    payload: { title: string; description: string; mediaType: PortfolioMediaType; contributors: string[]; file?: File | Blob | null; mediaUrl?: string; fileName?: string },
    onProgress?: (p: number) => void
  ): Promise<void> {
    let url = payload.mediaUrl?.trim() || '';
    let fileName: string | undefined;
    let mimeType: string | undefined;
    if (payload.file) {
      onProgress?.(10);
      fileName = payload.fileName || (payload.file as File).name || 'portfolio_file';
      mimeType = payload.file.type || 'application/octet-stream';
      url = await uploadToBucket('project-files', `${projectId}/portfolio/${Date.now()}_${safeFileName(fileName)}`, payload.file, mimeType);
      onProgress?.(80);
    }
    if (!url) throw new Error('Please upload a file or provide a media URL.');
    const isImg = mimeType?.startsWith('image/') || (!payload.file && /\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(url));
    const item: PortfolioItem = {
      id: makeId('port'),
      projectId,
      title: payload.title.trim().slice(0, 140),
      description: payload.description.trim().slice(0, 1000),
      mediaType: payload.mediaType,
      mediaUrl: url,
      ...(isImg ? { previewImageUrl: url } : {}),
      ...(fileName ? { fileName } : {}),
      ...(mimeType ? { mimeType } : {}),
      contributors: payload.contributors.length ? payload.contributors.slice(0, 25) : [user.name],
      uploadedBy: user.id,
      uploadedByName: user.name.slice(0, 80),
      uploadedAt: new Date().toISOString(),
    };
    await patchBoards(projectId, (row) => ({ portfolio: [...((row.portfolio as PortfolioItem[]) ?? []), item] }));
    onProgress?.(100);
  },

  async importPortfolioFromDrive(
    projectId: string,
    user: UserProfile,
    accessToken: string,
    payload: { fileId: string; fileName: string; mimeType: string; title: string; description: string; mediaType: PortfolioMediaType; contributors: string[] }
  ): Promise<void> {
    const dl = await downloadDriveFile(accessToken, payload.fileId, payload.mimeType, payload.fileName);
    await this.addPortfolioItem(projectId, user, { ...payload, file: dl.blob, fileName: dl.fileName });
  },

  async deletePortfolioItem(projectId: string, itemId: string): Promise<void> {
    let removed: PortfolioItem | undefined;
    await patchBoards(projectId, (row) => {
      const list = (row.portfolio as PortfolioItem[]) ?? [];
      removed = list.find((p) => p.id === itemId);
      return { portfolio: list.filter((p) => p.id !== itemId) };
    });
    const ref = removed ? parseStorageRef(removed.mediaUrl) : null;
    if (ref) await supabase.storage.from(ref.bucket).remove([ref.path]);
  },
};
