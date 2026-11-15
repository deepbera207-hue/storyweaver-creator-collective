import type {
  CreativeProject,
  CreativeRole,
  ExperienceLevel,
  Genre,
  MediaCategory,
  PortfolioMediaType,
  ProjectStatus,
  ScriptAccessLevel,
  TaskStatus,
  UserProfile,
} from '../types/studio';

function buildHeaders(userId?: string, json = true): HeadersInit {
  const headers: Record<string, string> = {};
  if (json) headers['Content-Type'] = 'application/json';
  if (userId) headers['x-studio-user-id'] = userId;
  return headers;
}

async function handleJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export function uploadWithProgress<T>(
  url: string,
  formData: FormData,
  userId: string | undefined,
  onProgress?: (percent: number) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    if (userId) xhr.setRequestHeader('x-studio-user-id', userId);

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable && onProgress) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const parsed = JSON.parse(xhr.responseText || '{}');
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(parsed as T);
        } else {
          reject(new Error(parsed?.error || `Upload failed (${xhr.status})`));
        }
      } catch {
        if (xhr.status === 413) {
          reject(new Error('File is too large for upload. Try a smaller file or import via Google Drive.'));
          return;
        }
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload. Please try again.'));
    xhr.onabort = () => reject(new Error('Upload was cancelled.'));
    xhr.send(formData);
  });
}

export const studioApi = {
  async listCreators(): Promise<UserProfile[]> {
    const data = await handleJson<{ creators: UserProfile[] }>(await fetch('/api/creators'));
    return data.creators;
  },

  async createCreator(payload: {
    name: string;
    email?: string;
    creativeRole: CreativeRole;
    skillCategory: string;
    experienceLevel: ExperienceLevel;
    bio?: string;
  }): Promise<UserProfile> {
    const data = await handleJson<{ creator: UserProfile }>(
      await fetch('/api/creators', {
        method: 'POST',
        headers: buildHeaders(undefined, true),
        body: JSON.stringify(payload),
      })
    );
    return data.creator;
  },

  async listProjects(userId?: string): Promise<CreativeProject[]> {
    const data = await handleJson<{ projects: CreativeProject[] }>(
      await fetch('/api/projects', { headers: buildHeaders(userId, false) })
    );
    return data.projects;
  },

  async getProject(projectId: string, userId?: string): Promise<CreativeProject> {
    const data = await handleJson<{ project: CreativeProject }>(
      await fetch(`/api/projects/${projectId}`, { headers: buildHeaders(userId, false) })
    );
    return data.project;
  },

  async createProject(
    userId: string,
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
    const data = await handleJson<{ project: CreativeProject }>(
      await fetch('/api/projects', {
        method: 'POST',
        headers: buildHeaders(userId, true),
        body: JSON.stringify(payload),
      })
    );
    return data.project;
  },

  async updateProject(
    projectId: string,
    userId: string,
    payload: Partial<{
      title: string;
      description: string;
      genres: Genre[];
      primaryGenre: Genre;
      status: ProjectStatus;
      isDraft: boolean;
      requiredRoles: CreativeRole[];
    }>
  ): Promise<CreativeProject> {
    const data = await handleJson<{ project: CreativeProject }>(
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: buildHeaders(userId, true),
        body: JSON.stringify(payload),
      })
    );
    return data.project;
  },

  async deleteProject(projectId: string, userId: string): Promise<void> {
    await handleJson(
      await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: buildHeaders(userId, false),
      })
    );
  },

  async uploadScriptFile(
    projectId: string,
    userId: string,
    file: File,
    accessLevel: ScriptAccessLevel,
    onProgress?: (percent: number) => void
  ): Promise<CreativeProject> {
    const form = new FormData();
    form.append('file', file);
    form.append('accessLevel', accessLevel);
    const data = await uploadWithProgress<{ project: CreativeProject }>(
      `/api/projects/${projectId}/script/upload`,
      form,
      userId,
      onProgress
    );
    return data.project;
  },

  async saveScriptEditor(
    projectId: string,
    userId: string,
    payload: { textContent?: string; fileName?: string; accessLevel?: ScriptAccessLevel }
  ): Promise<CreativeProject> {
    const data = await handleJson<{ project: CreativeProject }>(
      await fetch(`/api/projects/${projectId}/script`, {
        method: 'PUT',
        headers: buildHeaders(userId, true),
        body: JSON.stringify(payload),
      })
    );
    return data.project;
  },

  async removeScript(projectId: string, userId: string): Promise<CreativeProject> {
    const data = await handleJson<{ project: CreativeProject }>(
      await fetch(`/api/projects/${projectId}/script`, {
        method: 'DELETE',
        headers: buildHeaders(userId, false),
      })
    );
    return data.project;
  },

  async addOrJoinMember(
    projectId: string,
    requesterId: string,
    payload: { userId?: string; creativeRole?: CreativeRole; inviteCode?: string }
  ): Promise<CreativeProject> {
    const data = await handleJson<{ project: CreativeProject }>(
      await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: buildHeaders(requesterId, true),
        body: JSON.stringify(payload),
      })
    );
    return data.project;
  },

  async removeMember(
    projectId: string,
    requesterId: string,
    memberId: string
  ): Promise<CreativeProject> {
    const data = await handleJson<{ project: CreativeProject }>(
      await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: 'DELETE',
        headers: buildHeaders(requesterId, false),
      })
    );
    return data.project;
  },

  async createInvite(
    projectId: string,
    requesterId: string,
    payload: { targetEmail?: string; roleOffered?: CreativeRole }
  ): Promise<CreativeProject> {
    const data = await handleJson<{ project: CreativeProject }>(
      await fetch(`/api/projects/${projectId}/invites`, {
        method: 'POST',
        headers: buildHeaders(requesterId, true),
        body: JSON.stringify(payload),
      })
    );
    return data.project;
  },

  async lookupInvite(code: string): Promise<{
    invite: { code: string; status: 'pending' | 'accepted'; roleOffered?: CreativeRole; targetEmail?: string };
    project: {
      id: string;
      title: string;
      description: string;
      primaryGenre: Genre;
      status: ProjectStatus;
      ownerName: string;
      memberCount: number;
    };
  }> {
    return handleJson(await fetch(`/api/invites/${encodeURIComponent(code.trim().toUpperCase())}`));
  },

  async redeemInvite(
    userId: string,
    inviteCode: string,
    creativeRole?: CreativeRole
  ): Promise<{ project: CreativeProject; alreadyMember?: boolean }> {
    return handleJson(
      await fetch('/api/invites/redeem', {
        method: 'POST',
        headers: buildHeaders(userId, true),
        body: JSON.stringify({ inviteCode: inviteCode.trim().toUpperCase(), creativeRole }),
      })
    );
  },

  async createMilestone(
    projectId: string,
    userId: string,
    payload: { title: string; targetDate: string; description?: string }
  ): Promise<CreativeProject> {
    const data = await handleJson<{ project: CreativeProject }>(
      await fetch(`/api/projects/${projectId}/milestones`, {
        method: 'POST',
        headers: buildHeaders(userId, true),
        body: JSON.stringify(payload),
      })
    );
    return data.project;
  },

  async updateMilestone(
    projectId: string,
    userId: string,
    msId: string,
    payload: { status?: TaskStatus; title?: string; targetDate?: string }
  ): Promise<CreativeProject> {
    const data = await handleJson<{ project: CreativeProject }>(
      await fetch(`/api/projects/${projectId}/milestones/${msId}`, {
        method: 'PATCH',
        headers: buildHeaders(userId, true),
        body: JSON.stringify(payload),
      })
    );
    return data.project;
  },

  async createTask(
    projectId: string,
    userId: string,
    payload: {
      title: string;
      description?: string;
      milestoneId?: string;
      assigneeId?: string;
      dueDate?: string;
    }
  ): Promise<CreativeProject> {
    const data = await handleJson<{ project: CreativeProject }>(
      await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: buildHeaders(userId, true),
        body: JSON.stringify(payload),
      })
    );
    return data.project;
  },

  async updateTask(
    projectId: string,
    userId: string,
    taskId: string,
    payload: { status?: TaskStatus; assigneeId?: string | null; title?: string }
  ): Promise<CreativeProject> {
    const data = await handleJson<{ project: CreativeProject }>(
      await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: buildHeaders(userId, true),
        body: JSON.stringify(payload),
      })
    );
    return data.project;
  },

  async deleteTask(projectId: string, userId: string, taskId: string): Promise<CreativeProject> {
    const data = await handleJson<{ project: CreativeProject }>(
      await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: buildHeaders(userId, false),
      })
    );
    return data.project;
  },

  async postMessage(
    projectId: string,
    userId: string,
    payload: {
      content: string;
      channel: 'chat' | 'discussion';
      topicTitle?: string;
      attachmentId?: string;
    }
  ): Promise<CreativeProject> {
    const data = await handleJson<{ project: CreativeProject }>(
      await fetch(`/api/projects/${projectId}/messages`, {
        method: 'POST',
        headers: buildHeaders(userId, true),
        body: JSON.stringify(payload),
      })
    );
    return data.project;
  },

  async reactToMessage(
    projectId: string,
    userId: string,
    msgId: string,
    reaction: 'heart' | 'clap' | 'spark' | 'thumbs'
  ): Promise<CreativeProject> {
    const data = await handleJson<{ project: CreativeProject }>(
      await fetch(`/api/projects/${projectId}/messages/${msgId}/react`, {
        method: 'POST',
        headers: buildHeaders(userId, true),
        body: JSON.stringify({ reaction }),
      })
    );
    return data.project;
  },

  async uploadMedia(
    projectId: string,
    userId: string,
    file: File | Blob,
    fileName: string,
    options: {
      postToChat?: boolean;
      channel?: 'chat' | 'discussion';
      caption?: string;
      mediaCategory?: MediaCategory;
      durationSeconds?: number;
      topicTitle?: string;
    },
    onProgress?: (percent: number) => void
  ): Promise<CreativeProject> {
    const form = new FormData();
    form.append('file', file, fileName);
    if (options.postToChat) form.append('postToChat', 'true');
    if (options.channel) form.append('channel', options.channel);
    if (options.caption) form.append('caption', options.caption);
    if (options.mediaCategory) form.append('mediaCategory', options.mediaCategory);
    if (options.durationSeconds) form.append('durationSeconds', String(options.durationSeconds));
    if (options.topicTitle) form.append('topicTitle', options.topicTitle);

    const data = await uploadWithProgress<{ project: CreativeProject }>(
      `/api/projects/${projectId}/media`,
      form,
      userId,
      onProgress
    );
    return data.project;
  },

  async submitFeedback(
    projectId: string,
    userId: string,
    payload: { targetUserId: string; sentiment: 'positive' | 'constructive'; comment: string }
  ): Promise<CreativeProject> {
    const data = await handleJson<{ project: CreativeProject }>(
      await fetch(`/api/projects/${projectId}/feedback`, {
        method: 'POST',
        headers: buildHeaders(userId, true),
        body: JSON.stringify(payload),
      })
    );
    return data.project;
  },

  async addPortfolioItem(
    projectId: string,
    userId: string,
    payload: {
      title: string;
      description: string;
      mediaType: PortfolioMediaType;
      contributors: string[];
      file?: File | null;
      mediaUrl?: string;
    },
    onProgress?: (percent: number) => void
  ): Promise<CreativeProject> {
    const form = new FormData();
    form.append('title', payload.title);
    form.append('description', payload.description);
    form.append('mediaType', payload.mediaType);
    form.append('contributors', JSON.stringify(payload.contributors));
    if (payload.file) {
      form.append('file', payload.file);
    } else if (payload.mediaUrl) {
      form.append('mediaUrl', payload.mediaUrl);
    }
    const data = await uploadWithProgress<{ project: CreativeProject }>(
      `/api/projects/${projectId}/portfolio`,
      form,
      userId,
      onProgress
    );
    return data.project;
  },

  async deletePortfolioItem(
    projectId: string,
    userId: string,
    itemId: string
  ): Promise<CreativeProject> {
    const data = await handleJson<{ project: CreativeProject }>(
      await fetch(`/api/projects/${projectId}/portfolio/${itemId}`, {
        method: 'DELETE',
        headers: buildHeaders(userId, false),
      })
    );
    return data.project;
  },

  async importMediaFromDrive(
    projectId: string,
    userId: string,
    accessToken: string,
    payload: {
      fileId: string;
      fileName: string;
      mimeType: string;
      postToChat?: boolean;
      channel?: 'chat' | 'discussion';
      topicTitle?: string;
      caption?: string;
    }
  ): Promise<CreativeProject> {
    const data = await handleJson<{ project: CreativeProject }>(
      await fetch(`/api/projects/${projectId}/media/from-drive`, {
        method: 'POST',
        headers: {
          ...buildHeaders(userId, true),
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })
    );
    return data.project;
  },

  async importScriptFromDrive(
    projectId: string,
    userId: string,
    accessToken: string,
    payload: {
      fileId: string;
      fileName: string;
      mimeType: string;
      accessLevel?: ScriptAccessLevel;
    }
  ): Promise<CreativeProject> {
    const data = await handleJson<{ project: CreativeProject }>(
      await fetch(`/api/projects/${projectId}/script/from-drive`, {
        method: 'POST',
        headers: {
          ...buildHeaders(userId, true),
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })
    );
    return data.project;
  },

  async importPortfolioFromDrive(
    projectId: string,
    userId: string,
    accessToken: string,
    payload: {
      fileId: string;
      fileName: string;
      mimeType: string;
      title: string;
      description: string;
      mediaType: PortfolioMediaType;
      contributors: string[];
    }
  ): Promise<CreativeProject> {
    const data = await handleJson<{ project: CreativeProject }>(
      await fetch(`/api/projects/${projectId}/portfolio/from-drive`, {
        method: 'POST',
        headers: {
          ...buildHeaders(userId, true),
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })
    );
    return data.project;
  },
};
