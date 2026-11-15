import type { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
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
import { db, handleFirestoreError, OperationType } from './firebaseClient';
import { uploadWithProgress } from './studioApi';

function tsToIso(val: unknown): string {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof val === 'string' && val) return val;
  return new Date().toISOString();
}

function makeDocId(prefix: string): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}_${hex}`;
}

function makeInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export function connectionIdFor(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('__');
}

function mapCreatorDoc(data: Record<string, unknown>, id: string, email = ''): UserProfile {
  return {
    id: (typeof data.uid === 'string' && data.uid) || id,
    name: typeof data.name === 'string' && data.name ? data.name : 'Studio Creator',
    email,
    avatarUrl: typeof data.avatarUrl === 'string' ? data.avatarUrl : '',
    creativeRole: (data.creativeRole as CreativeRole) || 'Content Creator',
    skillCategory:
      typeof data.skillCategory === 'string' && data.skillCategory
        ? data.skillCategory
        : 'Multidisciplinary Creative',
    experienceLevel: (data.experienceLevel as ExperienceLevel) || 'Intermediate',
    bio: typeof data.bio === 'string' ? data.bio : '',
  };
}

function mapMemberDoc(data: Record<string, unknown>, id: string): ProjectMember {
  return {
    userId: (typeof data.userId === 'string' && data.userId) || id,
    name: typeof data.name === 'string' ? data.name : 'Creator',
    avatarUrl: typeof data.avatarUrl === 'string' ? data.avatarUrl : '',
    creativeRole: (data.creativeRole as CreativeRole) || 'Content Creator',
    skillCategory: typeof data.skillCategory === 'string' ? data.skillCategory : '',
    experienceLevel: (data.experienceLevel as ExperienceLevel) || 'Intermediate',
    roleInProject: (data.roleInProject as 'owner' | 'admin' | 'member') || 'member',
    joinedAt: tsToIso(data.joinedAt),
    bio: typeof data.bio === 'string' ? data.bio : '',
  };
}

function mapProjectShell(
  data: Record<string, unknown>,
  id: string,
  prev?: CreativeProject
): CreativeProject {
  return {
    id: (typeof data.id === 'string' && data.id) || id,
    title: typeof data.title === 'string' ? data.title : 'Untitled Project',
    description: typeof data.description === 'string' ? data.description : '',
    genres: Array.isArray(data.genres) && data.genres.length > 0 ? (data.genres as Genre[]) : ['Animation'],
    primaryGenre: (data.primaryGenre as Genre) || 'Animation',
    status: (data.status as ProjectStatus) || 'Planning',
    isDraft: Boolean(data.isDraft),
    ownerId: typeof data.ownerId === 'string' ? data.ownerId : '',
    ownerName: typeof data.ownerName === 'string' ? data.ownerName : undefined,
    createdAt: tsToIso(data.createdAt),
    updatedAt: tsToIso(data.updatedAt),
    requiredRoles: Array.isArray(data.requiredRoles) ? (data.requiredRoles as CreativeRole[]) : [],
    members: prev?.members ?? [],
    script: prev?.script ?? null,
    scriptRestricted: prev?.scriptRestricted ?? false,
    milestones: prev?.milestones ?? [],
    tasks: prev?.tasks ?? [],
    messages: prev?.messages ?? [],
    sharedMedia: prev?.sharedMedia ?? [],
    feedback: prev?.feedback ?? [],
    portfolio: prev?.portfolio ?? [],
    invites: prev?.invites ?? [],
  };
}

function mapInviteDoc(data: Record<string, unknown>, id: string): ProjectInvite {
  return {
    id: (typeof data.id === 'string' && data.id) || id,
    code: (typeof data.code === 'string' && data.code) || id,
    projectId: typeof data.projectId === 'string' ? data.projectId : '',
    projectTitle: typeof data.projectTitle === 'string' ? data.projectTitle : 'Creative Project',
    projectPrimaryGenre: data.projectPrimaryGenre as Genre | undefined,
    projectStatus: data.projectStatus as ProjectStatus | undefined,
    ownerId: typeof data.ownerId === 'string' ? data.ownerId : '',
    ownerName: typeof data.ownerName === 'string' ? data.ownerName : '',
    roleOffered: data.roleOffered as CreativeRole | undefined,
    targetUserId: typeof data.targetUserId === 'string' ? data.targetUserId : undefined,
    targetName: typeof data.targetName === 'string' ? data.targetName : undefined,
    acceptedBy: typeof data.acceptedBy === 'string' ? data.acceptedBy : undefined,
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
    createdAt: tsToIso(data.createdAt),
    updatedAt: tsToIso(data.updatedAt),
    status: data.status === 'accepted' ? 'accepted' : 'pending',
  };
}

function mapConnectionDoc(data: Record<string, unknown>, id: string): CreatorConnection {
  const parts = Array.isArray(data.participants) ? (data.participants as string[]) : [];
  return {
    id: (typeof data.id === 'string' && data.id) || id,
    fromId: typeof data.fromId === 'string' ? data.fromId : '',
    fromName: typeof data.fromName === 'string' ? data.fromName : 'Creator',
    fromRole: typeof data.fromRole === 'string' ? data.fromRole : undefined,
    fromAvatar: typeof data.fromAvatar === 'string' ? data.fromAvatar : undefined,
    toId: typeof data.toId === 'string' ? data.toId : '',
    toName: typeof data.toName === 'string' ? data.toName : 'Creator',
    toRole: typeof data.toRole === 'string' ? data.toRole : undefined,
    toAvatar: typeof data.toAvatar === 'string' ? data.toAvatar : undefined,
    participants: [parts[0] || '', parts[1] || ''],
    status:
      data.status === 'accepted' || data.status === 'declined' ? data.status : 'pending',
    note: typeof data.note === 'string' ? data.note : undefined,
    createdAt: tsToIso(data.createdAt),
    updatedAt: tsToIso(data.updatedAt),
  };
}

export const firestoreStudio = {
  // ------------------------------------------------------------------
  // Creator Profile Sync & Updates
  // ------------------------------------------------------------------
  async ensureCreatorProfile(user: User): Promise<{ profile: UserProfile; isNew: boolean }> {
    const publicRef = doc(db, 'creators', user.uid);
    const privateRef = doc(db, 'creators', user.uid, 'private', 'info');
    try {
      const snap = await getDoc(publicRef);
      if (snap.exists()) {
        const existingData = snap.data();
        const profile = mapCreatorDoc(existingData, user.uid, user.email || '');
        if (existingData.isDirectoryPublic !== true) {
          await updateDoc(publicRef, {
            isDirectoryPublic: true,
            updatedAt: serverTimestamp(),
          });
        }
        if (user.email) {
          await setDoc(
            privateRef,
            { uid: user.uid, email: user.email.slice(0, 200), updatedAt: serverTimestamp() },
            { merge: true }
          ).catch(() => {});
        }
        return { profile, isNew: false };
      }

      const fallbackName = (user.displayName || user.email?.split('@')[0] || 'Studio Creator')
        .trim()
        .slice(0, 80);
      const avatar = user.photoURL ? user.photoURL.slice(0, 1000) : '';

      const batch = writeBatch(db);
      batch.set(publicRef, {
        uid: user.uid,
        name: fallbackName,
        ...(avatar ? { avatarUrl: avatar } : {}),
        creativeRole: 'Content Creator',
        skillCategory: 'Multidisciplinary Creative',
        experienceLevel: 'Intermediate',
        bio: '',
        isDirectoryPublic: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.set(privateRef, {
        uid: user.uid,
        email: (user.email || '').slice(0, 200),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();

      return {
        profile: {
          id: user.uid,
          name: fallbackName,
          email: user.email || '',
          avatarUrl: avatar,
          creativeRole: 'Content Creator',
          skillCategory: 'Multidisciplinary Creative',
          experienceLevel: 'Intermediate',
          bio: '',
        },
        isNew: true,
      };
    } catch (err) {
      return handleFirestoreError(err, OperationType.WRITE, `creators/${user.uid}`);
    }
  },

  async updateMyProfile(
    user: User,
    payload: {
      name: string;
      creativeRole: CreativeRole;
      skillCategory: string;
      experienceLevel: ExperienceLevel;
      bio: string;
    }
  ): Promise<UserProfile> {
    const publicRef = doc(db, 'creators', user.uid);
    const cleanName = payload.name.trim().slice(0, 80) || 'Studio Creator';
    const cleanSkill = payload.skillCategory.trim().slice(0, 100) || `${payload.creativeRole} Craft`;
    const cleanBio = payload.bio.trim().slice(0, 500);
    try {
      await updateDoc(publicRef, {
        name: cleanName,
        creativeRole: payload.creativeRole,
        skillCategory: cleanSkill,
        experienceLevel: payload.experienceLevel,
        bio: cleanBio,
        updatedAt: serverTimestamp(),
      });
      return {
        id: user.uid,
        name: cleanName,
        email: user.email || '',
        avatarUrl: user.photoURL || '',
        creativeRole: payload.creativeRole,
        skillCategory: cleanSkill,
        experienceLevel: payload.experienceLevel,
        bio: cleanBio,
      };
    } catch (err) {
      return handleFirestoreError(err, OperationType.UPDATE, `creators/${user.uid}`);
    }
  },

  // ------------------------------------------------------------------
  // Real-Time Global Subscriptions (Creators, Connections, Invites, Projects)
  // ------------------------------------------------------------------
  subscribeCreators(onUpdate: (creators: UserProfile[]) => void): Unsubscribe {
    const q = query(collection(db, 'creators'), where('isDirectoryPublic', '==', true));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => mapCreatorDoc(d.data(), d.id))
          .sort((a, b) => a.name.localeCompare(b.name));
        onUpdate(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'creators')
    );
  },

  subscribeConnections(uid: string, onUpdate: (connections: CreatorConnection[]) => void): Unsubscribe {
    const q = query(collection(db, 'connections'), where('participants', 'array-contains', uid));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => mapConnectionDoc(d.data(), d.id))
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        onUpdate(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'connections')
    );
  },

  subscribeIncomingInvites(uid: string, onUpdate: (invites: ProjectInvite[]) => void): Unsubscribe {
    const q = query(collection(db, 'invites'), where('targetUserId', '==', uid));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => mapInviteDoc(d.data(), d.id))
          .filter((inv) => inv.status === 'pending')
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        onUpdate(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'invites')
    );
  },

  subscribeDashboardProjects(
    uid: string,
    onUpdate: (projects: CreativeProject[]) => void
  ): Unsubscribe {
    const publicMap = new Map<string, CreativeProject>();
    const ownedMap = new Map<string, CreativeProject>();
    const joinedDraftMap = new Map<string, CreativeProject>();

    // Cache lightweight subcollection data (members, portfolio, tasks for member projects)
    const subData = new Map<
      string,
      { members?: ProjectMember[]; portfolio?: PortfolioItem[]; tasks?: ProjectTask[] }
    >();
    const subUnsubs = new Map<
      string,
      { members?: Unsubscribe; portfolio?: Unsubscribe; tasks?: Unsubscribe }
    >();

    function emit() {
      const merged = new Map<string, CreativeProject>();
      for (const [id, p] of publicMap) merged.set(id, p);
      for (const [id, p] of ownedMap) merged.set(id, p);
      for (const [id, p] of joinedDraftMap) {
        if (!merged.has(id)) merged.set(id, p);
      }

      const list = Array.from(merged.values())
        .map((proj) => {
          const extras = subData.get(proj.id);
          return {
            ...proj,
            members: extras?.members ?? proj.members,
            portfolio: extras?.portfolio ?? proj.portfolio,
            tasks: extras?.tasks ?? proj.tasks,
          };
        })
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

      syncSubListeners(list);
      onUpdate(list);
    }

    function syncSubListeners(visibleList: CreativeProject[]) {
      const visibleIds = new Set(visibleList.map((p) => p.id));

      for (const [pid, unsubs] of subUnsubs) {
        if (!visibleIds.has(pid)) {
          unsubs.members?.();
          unsubs.portfolio?.();
          unsubs.tasks?.();
          subUnsubs.delete(pid);
          subData.delete(pid);
        }
      }

      for (const proj of visibleList) {
        let entry = subUnsubs.get(proj.id);
        if (!entry) {
          entry = {};
          subUnsubs.set(proj.id, entry);

          entry.members = onSnapshot(
            collection(db, 'projects', proj.id, 'members'),
            (snap) => {
              const cur = subData.get(proj.id) ?? {};
              cur.members = snap.docs
                .map((d) => mapMemberDoc(d.data(), d.id))
                .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
              subData.set(proj.id, cur);
              emit();
            },
            (err) => handleFirestoreError(err, OperationType.LIST, `projects/${proj.id}/members`)
          );

          entry.portfolio = onSnapshot(
            collection(db, 'projects', proj.id, 'portfolio'),
            (snap) => {
              const cur = subData.get(proj.id) ?? {};
              cur.portfolio = snap.docs
                .map((d) => {
                  const data = d.data();
                  return {
                    id: (data.id as string) || d.id,
                    projectId: (data.projectId as string) || proj.id,
                    title: (data.title as string) || '',
                    description: (data.description as string) || '',
                    mediaType: (data.mediaType as PortfolioMediaType) || 'Artwork',
                    mediaUrl: (data.mediaUrl as string) || '',
                    previewImageUrl: data.previewImageUrl as string | undefined,
                    fileName: data.fileName as string | undefined,
                    mimeType: data.mimeType as string | undefined,
                    contributors: Array.isArray(data.contributors) ? (data.contributors as string[]) : [],
                    uploadedBy: (data.uploadedBy as string) || '',
                    uploadedByName: (data.uploadedByName as string) || '',
                    uploadedAt: tsToIso(data.uploadedAt),
                  };
                })
                .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
              subData.set(proj.id, cur);
              emit();
            },
            (err) => handleFirestoreError(err, OperationType.LIST, `projects/${proj.id}/portfolio`)
          );
        }

        const currentMembers = subData.get(proj.id)?.members ?? [];
        const isMember =
          proj.ownerId === uid || currentMembers.some((m) => m.userId === uid);

        if (isMember && !entry.tasks) {
          entry.tasks = onSnapshot(
            collection(db, 'projects', proj.id, 'tasks'),
            (snap) => {
              const cur = subData.get(proj.id) ?? {};
              cur.tasks = snap.docs
                .map((d) => {
                  const data = d.data();
                  return {
                    id: (data.id as string) || d.id,
                    title: (data.title as string) || '',
                    description: data.description as string | undefined,
                    milestoneId: data.milestoneId as string | undefined,
                    assigneeId: data.assigneeId as string | undefined,
                    assigneeName: data.assigneeName as string | undefined,
                    status: (data.status as TaskStatus) || 'pending',
                    dueDate: data.dueDate as string | undefined,
                    createdAt: tsToIso(data.createdAt),
                    updatedAt: tsToIso(data.updatedAt),
                  };
                })
                .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
              subData.set(proj.id, cur);
              emit();
            },
            (err) => handleFirestoreError(err, OperationType.LIST, `projects/${proj.id}/tasks`)
          );
        } else if (!isMember && entry.tasks) {
          entry.tasks();
          entry.tasks = undefined;
          const cur = subData.get(proj.id);
          if (cur) cur.tasks = [];
        }
      }
    }

    const unsubPublic = onSnapshot(
      query(collection(db, 'projects'), where('isDraft', '==', false)),
      (snap) => {
        publicMap.clear();
        for (const d of snap.docs) {
          publicMap.set(d.id, mapProjectShell(d.data(), d.id));
        }
        emit();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'projects')
    );

    const unsubOwned = onSnapshot(
      query(collection(db, 'projects'), where('ownerId', '==', uid)),
      (snap) => {
        ownedMap.clear();
        for (const d of snap.docs) {
          ownedMap.set(d.id, mapProjectShell(d.data(), d.id));
        }
        emit();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'projects')
    );

    const unsubJoined = onSnapshot(
      query(collection(db, 'creators', uid, 'joinedProjects'), where('userId', '==', uid)),
      async (snap) => {
        const joinedIds = snap.docs.map((d) => d.id);
        joinedDraftMap.clear();
        await Promise.all(
          joinedIds.map(async (pid) => {
            if (publicMap.has(pid) || ownedMap.has(pid)) return;
            try {
              const projSnap = await getDoc(doc(db, 'projects', pid));
              if (projSnap.exists()) {
                joinedDraftMap.set(pid, mapProjectShell(projSnap.data(), pid));
              }
            } catch {
              // ignore if no longer accessible
            }
          })
        );
        emit();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `creators/${uid}/joinedProjects`)
    );

    return () => {
      unsubPublic();
      unsubOwned();
      unsubJoined();
      for (const unsubs of subUnsubs.values()) {
        unsubs.members?.();
        unsubs.portfolio?.();
        unsubs.tasks?.();
      }
      subUnsubs.clear();
    };
  },

  // ------------------------------------------------------------------
  // Real-Time Active Project Workspace Listener
  // ------------------------------------------------------------------
  subscribeProjectWorkspace(
    projectId: string,
    uid: string,
    onUpdate: (patch: Partial<CreativeProject>) => void
  ): Unsubscribe {
    const unsubs: Unsubscribe[] = [];
    let currentOwnerId = '';
    let currentMembers: ProjectMember[] = [];
    let memberUnsubs: Unsubscribe[] = [];
    let ownerUnsub: Unsubscribe | null = null;
    let rawMessages: Omit<ChatMessage, 'reactions'>[] = [];
    let rawReactions: { messageId: string; userId: string; key: string }[] = [];

    function emitMessages() {
      const reactionByMsg = new Map<string, Record<string, string[]>>();
      for (const r of rawReactions) {
        let map = reactionByMsg.get(r.messageId);
        if (!map) {
          map = {};
          reactionByMsg.set(r.messageId, map);
        }
        if (!map[r.key]) map[r.key] = [];
        if (!map[r.key].includes(r.userId)) map[r.key].push(r.userId);
      }
      const combined: ChatMessage[] = rawMessages
        .map((m) => ({
          ...m,
          reactions: reactionByMsg.get(m.id) ?? {},
        }))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      onUpdate({ messages: combined });
    }

    function ensureMemberListeners() {
      const isMember =
        currentOwnerId === uid || currentMembers.some((m) => m.userId === uid);
      const isOwner = currentOwnerId === uid;

      if (isMember && memberUnsubs.length === 0) {
        memberUnsubs.push(
          onSnapshot(
            collection(db, 'projects', projectId, 'milestones'),
            (snap) => {
              const milestones: Milestone[] = snap.docs
                .map((d) => {
                  const data = d.data();
                  return {
                    id: (data.id as string) || d.id,
                    title: (data.title as string) || '',
                    targetDate: (data.targetDate as string) || '',
                    status: (data.status as TaskStatus) || 'pending',
                    description: data.description as string | undefined,
                  };
                })
                .sort((a, b) => a.targetDate.localeCompare(b.targetDate));
              onUpdate({ milestones });
            },
            (err) => handleFirestoreError(err, OperationType.LIST, `projects/${projectId}/milestones`)
          ),
          onSnapshot(
            collection(db, 'projects', projectId, 'messages'),
            (snap) => {
              rawMessages = snap.docs.map((d) => {
                const data = d.data();
                return {
                  id: (data.id as string) || d.id,
                  projectId: (data.projectId as string) || projectId,
                  channel: data.channel === 'discussion' ? 'discussion' : 'chat',
                  topicTitle: data.topicTitle as string | undefined,
                  senderId: (data.senderId as string) || '',
                  senderName: (data.senderName as string) || '',
                  senderAvatar: (data.senderAvatar as string) || '',
                  senderRole: (data.senderRole as string) || '',
                  content: (data.content as string) || '',
                  attachment: data.attachment as MediaAttachment | undefined,
                  createdAt: tsToIso(data.createdAt),
                };
              });
              emitMessages();
            },
            (err) => handleFirestoreError(err, OperationType.LIST, `projects/${projectId}/messages`)
          ),
          onSnapshot(
            collection(db, 'projects', projectId, 'reactions'),
            (snap) => {
              rawReactions = snap.docs.map((d) => {
                const data = d.data();
                return {
                  messageId: (data.messageId as string) || '',
                  userId: (data.userId as string) || '',
                  key: (data.key as string) || '',
                };
              });
              emitMessages();
            },
            (err) => handleFirestoreError(err, OperationType.LIST, `projects/${projectId}/reactions`)
          ),
          onSnapshot(
            collection(db, 'projects', projectId, 'media'),
            (snap) => {
              const sharedMedia: MediaAttachment[] = snap.docs
                .map((d) => {
                  const data = d.data();
                  return {
                    id: (data.id as string) || d.id,
                    fileName: (data.fileName as string) || '',
                    fileUrl: (data.fileUrl as string) || '',
                    mimeType: (data.mimeType as string) || '',
                    mediaCategory: (data.mediaCategory as MediaCategory) || 'document',
                    fileSize: Number(data.fileSize) || 0,
                    uploadedBy: (data.uploadedBy as string) || '',
                    uploadedByName: (data.uploadedByName as string) || '',
                    durationSeconds:
                      typeof data.durationSeconds === 'number' ? data.durationSeconds : undefined,
                    createdAt: tsToIso(data.createdAt),
                  };
                })
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
              onUpdate({ sharedMedia });
            },
            (err) => handleFirestoreError(err, OperationType.LIST, `projects/${projectId}/media`)
          ),
          onSnapshot(
            collection(db, 'projects', projectId, 'feedback'),
            (snap) => {
              const feedback: PeerFeedback[] = snap.docs
                .map((d) => {
                  const data = d.data();
                  return {
                    id: (data.id as string) || d.id,
                    projectId: (data.projectId as string) || projectId,
                    reviewerId: (data.reviewerId as string) || '',
                    reviewerName: (data.reviewerName as string) || '',
                    targetUserId: (data.targetUserId as string) || '',
                    sentiment: (data.sentiment === 'constructive' ? 'constructive' : 'positive') as
                      | 'constructive'
                      | 'positive',
                    comment: (data.comment as string) || '',
                    createdAt: tsToIso(data.createdAt),
                    updatedAt: tsToIso(data.updatedAt),
                  };
                })
                .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
              onUpdate({ feedback });
            },
            (err) => handleFirestoreError(err, OperationType.LIST, `projects/${projectId}/feedback`)
          )
        );
      } else if (!isMember && memberUnsubs.length > 0) {
        memberUnsubs.forEach((u) => u());
        memberUnsubs = [];
        onUpdate({ milestones: [], messages: [], sharedMedia: [], feedback: [] });
      }

      if (isOwner && !ownerUnsub) {
        const invQ = query(collection(db, 'invites'), where('ownerId', '==', uid));
        ownerUnsub = onSnapshot(
          invQ,
          (snap) => {
            const invites = snap.docs
              .map((d) => mapInviteDoc(d.data(), d.id))
              .filter((inv) => inv.projectId === projectId)
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            onUpdate({ invites });
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'invites')
        );
      } else if (!isOwner && ownerUnsub) {
        ownerUnsub();
        ownerUnsub = null;
        onUpdate({ invites: [] });
      }
    }

    unsubs.push(
      onSnapshot(
        doc(db, 'projects', projectId),
        (snap) => {
          if (!snap.exists()) return;
          const data = snap.data();
          currentOwnerId = (data.ownerId as string) || '';
          ensureMemberListeners();
        },
        (err) => handleFirestoreError(err, OperationType.GET, `projects/${projectId}`)
      ),
      onSnapshot(
        collection(db, 'projects', projectId, 'members'),
        (snap) => {
          currentMembers = snap.docs
            .map((d) => mapMemberDoc(d.data(), d.id))
            .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
          onUpdate({ members: currentMembers });
          ensureMemberListeners();
        },
        (err) => handleFirestoreError(err, OperationType.LIST, `projects/${projectId}/members`)
      ),
      onSnapshot(
        doc(db, 'projects', projectId, 'script', 'current'),
        (snap) => {
          if (!snap.exists()) {
            onUpdate({ script: null, scriptRestricted: false });
            return;
          }
          const data = snap.data();
          const script: ScriptData = {
            id: (data.id as string) || snap.id,
            fileName: (data.fileName as string) || 'script.txt',
            format: (data.format as ScriptData['format']) || 'txt',
            fileUrl: data.fileUrl as string | undefined,
            textContent: (data.textContent as string) || '',
            htmlPreview: data.htmlPreview as string | undefined,
            accessLevel: (data.accessLevel as ScriptAccessLevel) || 'team_members',
            uploadedBy: (data.uploadedBy as string) || '',
            uploadedByName: (data.uploadedByName as string) || '',
            updatedAt: tsToIso(data.updatedAt),
            fileSize: typeof data.fileSize === 'number' ? data.fileSize : undefined,
          };
          onUpdate({ script, scriptRestricted: false });
        },
        (err) => {
          const code =
            typeof err === 'object' && err !== null && 'code' in err
              ? String((err as { code?: unknown }).code)
              : '';
          if (code === 'permission-denied') {
            onUpdate({ script: null, scriptRestricted: true });
            return;
          }
          handleFirestoreError(err, OperationType.GET, `projects/${projectId}/script/current`);
        }
      )
    );

    return () => {
      unsubs.forEach((u) => u());
      memberUnsubs.forEach((u) => u());
      ownerUnsub?.();
    };
  },

  // ------------------------------------------------------------------
  // Projects CRUD
  // ------------------------------------------------------------------
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
    const projectId = makeDocId('proj');
    const cleanTitle = payload.title.trim().slice(0, 140) || 'Untitled Creative Project';
    const cleanDesc = payload.description.trim().slice(0, 2000);
    const cleanGenres: Genre[] = payload.genres.length > 0 ? payload.genres.slice(0, 10) : ['Animation'];
    const cleanPrimary = cleanGenres.includes(payload.primaryGenre)
      ? payload.primaryGenre
      : cleanGenres[0];

    const projectRef = doc(db, 'projects', projectId);
    const ownerMemberRef = doc(db, 'projects', projectId, 'members', creator.id);
    const joinedRef = doc(db, 'creators', creator.id, 'joinedProjects', projectId);

    try {
      const batch = writeBatch(db);
      batch.set(projectRef, {
        id: projectId,
        title: cleanTitle,
        description: cleanDesc,
        genres: cleanGenres,
        primaryGenre: cleanPrimary,
        status: payload.status,
        isDraft: Boolean(payload.isDraft),
        ownerId: creator.id,
        ownerName: creator.name.slice(0, 80),
        requiredRoles: payload.requiredRoles.slice(0, 15),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      batch.set(ownerMemberRef, {
        userId: creator.id,
        name: creator.name.slice(0, 80),
        ...(creator.avatarUrl ? { avatarUrl: creator.avatarUrl.slice(0, 1000) } : {}),
        creativeRole: creator.creativeRole,
        skillCategory: creator.skillCategory.slice(0, 100),
        experienceLevel: creator.experienceLevel,
        roleInProject: 'owner',
        ...(creator.bio ? { bio: creator.bio.slice(0, 500) } : {}),
        joinedAt: serverTimestamp(),
      });

      batch.set(joinedRef, {
        projectId,
        userId: creator.id,
        title: cleanTitle,
        joinedAt: serverTimestamp(),
      });

      await batch.commit();

      let scriptData: ScriptData | null = null;
      if (payload.scriptText && payload.scriptText.trim()) {
        const scriptRef = doc(db, 'projects', projectId, 'script', 'current');
        const scriptId = makeDocId('script');
        await setDoc(scriptRef, {
          id: scriptId,
          fileName: 'studio_script_editor.txt',
          format: 'editor',
          textContent: payload.scriptText,
          accessLevel: payload.scriptAccessLevel || 'team_members',
          uploadedBy: creator.id,
          uploadedByName: creator.name.slice(0, 80),
          fileSize: new Blob([payload.scriptText]).size,
          updatedAt: serverTimestamp(),
        });
        scriptData = {
          id: scriptId,
          fileName: 'studio_script_editor.txt',
          format: 'editor',
          textContent: payload.scriptText,
          accessLevel: payload.scriptAccessLevel || 'team_members',
          uploadedBy: creator.id,
          uploadedByName: creator.name,
          updatedAt: new Date().toISOString(),
        };
      }

      const now = new Date().toISOString();
      return {
        id: projectId,
        title: cleanTitle,
        description: cleanDesc,
        genres: cleanGenres,
        primaryGenre: cleanPrimary,
        status: payload.status,
        isDraft: Boolean(payload.isDraft),
        ownerId: creator.id,
        ownerName: creator.name,
        createdAt: now,
        updatedAt: now,
        requiredRoles: payload.requiredRoles,
        members: [
          {
            userId: creator.id,
            name: creator.name,
            avatarUrl: creator.avatarUrl,
            creativeRole: creator.creativeRole,
            skillCategory: creator.skillCategory,
            experienceLevel: creator.experienceLevel,
            roleInProject: 'owner',
            joinedAt: now,
            bio: creator.bio,
          },
        ],
        script: scriptData,
        milestones: [],
        tasks: [],
        messages: [],
        sharedMedia: [],
        feedback: [],
        portfolio: [],
        invites: [],
      };
    } catch (err) {
      return handleFirestoreError(err, OperationType.CREATE, `projects/${projectId}`);
    }
  },

  async updateProject(
    projectId: string,
    payload: Partial<{
      title: string;
      description: string;
      genres: Genre[];
      primaryGenre: Genre;
      status: ProjectStatus;
      isDraft: boolean;
      requiredRoles: CreativeRole[];
    }>
  ): Promise<void> {
    const ref = doc(db, 'projects', projectId);
    const updates: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (payload.title !== undefined) updates.title = payload.title.trim().slice(0, 140) || 'Untitled Project';
    if (payload.description !== undefined) updates.description = payload.description.trim().slice(0, 2000);
    if (payload.genres !== undefined) updates.genres = payload.genres.slice(0, 10);
    if (payload.primaryGenre !== undefined) updates.primaryGenre = payload.primaryGenre;
    if (payload.status !== undefined) updates.status = payload.status;
    if (payload.isDraft !== undefined) updates.isDraft = payload.isDraft;
    if (payload.requiredRoles !== undefined) updates.requiredRoles = payload.requiredRoles.slice(0, 15);

    try {
      await updateDoc(ref, updates);
    } catch (err) {
      return handleFirestoreError(err, OperationType.UPDATE, `projects/${projectId}`);
    }
  },

  async deleteProject(projectId: string, ownerId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      await deleteDoc(doc(db, 'creators', ownerId, 'joinedProjects', projectId)).catch(() => {});
    } catch (err) {
      return handleFirestoreError(err, OperationType.DELETE, `projects/${projectId}`);
    }
  },

  // ------------------------------------------------------------------
  // Script Upload / Editor / Drive Import
  // ------------------------------------------------------------------
  async uploadScriptFile(
    projectId: string,
    user: UserProfile,
    file: File,
    accessLevel: ScriptAccessLevel,
    onProgress?: (percent: number) => void
  ): Promise<ScriptData> {
    const form = new FormData();
    form.append('file', file);
    const uploaded = await uploadWithProgress<{
      fileUrl: string;
      fileName: string;
      format: 'docx' | 'pdf' | 'txt';
      textContent: string;
      htmlPreview?: string;
      fileSize: number;
    }>('/api/files/script', form, user.id, onProgress);

    const scriptId = makeDocId('script');
    try {
      await setDoc(doc(db, 'projects', projectId, 'script', 'current'), {
        id: scriptId,
        fileName: uploaded.fileName.slice(0, 200),
        format: uploaded.format,
        fileUrl: uploaded.fileUrl,
        textContent: (uploaded.textContent || '').slice(0, 200000),
        ...(uploaded.htmlPreview ? { htmlPreview: uploaded.htmlPreview.slice(0, 300000) } : {}),
        accessLevel,
        uploadedBy: user.id,
        uploadedByName: user.name.slice(0, 80),
        fileSize: uploaded.fileSize,
        updatedAt: serverTimestamp(),
      });
      return {
        id: scriptId,
        fileName: uploaded.fileName,
        format: uploaded.format,
        fileUrl: uploaded.fileUrl,
        textContent: uploaded.textContent,
        htmlPreview: uploaded.htmlPreview,
        accessLevel,
        uploadedBy: user.id,
        uploadedByName: user.name,
        fileSize: uploaded.fileSize,
        updatedAt: new Date().toISOString(),
      };
    } catch (err) {
      return handleFirestoreError(err, OperationType.WRITE, `projects/${projectId}/script/current`);
    }
  },

  async saveScriptEditor(
    projectId: string,
    user: UserProfile,
    existingScript: ScriptData | null,
    payload: { textContent?: string; fileName?: string; accessLevel?: ScriptAccessLevel }
  ): Promise<void> {
    const ref = doc(db, 'projects', projectId, 'script', 'current');
    const resolvedText =
      payload.textContent !== undefined ? payload.textContent : existingScript?.textContent ?? '';
    const resolvedName =
      payload.fileName?.trim() || existingScript?.fileName || 'story_script.txt';
    const resolvedAccess = payload.accessLevel || existingScript?.accessLevel || 'team_members';
    const resolvedFormat =
      payload.textContent !== undefined ? 'editor' : existingScript?.format || 'editor';

    try {
      await setDoc(ref, {
        id: existingScript?.id || makeDocId('script'),
        fileName: resolvedName.slice(0, 200),
        format: resolvedFormat,
        ...(existingScript?.fileUrl && payload.textContent === undefined
          ? { fileUrl: existingScript.fileUrl }
          : {}),
        ...(existingScript?.htmlPreview && payload.textContent === undefined
          ? { htmlPreview: existingScript.htmlPreview }
          : {}),
        textContent: resolvedText.slice(0, 200000),
        accessLevel: resolvedAccess,
        uploadedBy: user.id,
        uploadedByName: user.name.slice(0, 80),
        fileSize: new Blob([resolvedText]).size,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      return handleFirestoreError(err, OperationType.WRITE, `projects/${projectId}/script/current`);
    }
  },

  async removeScript(projectId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'projects', projectId, 'script', 'current'));
    } catch (err) {
      return handleFirestoreError(err, OperationType.DELETE, `projects/${projectId}/script/current`);
    }
  },

  async importScriptFromDrive(
    projectId: string,
    user: UserProfile,
    accessToken: string,
    payload: { fileId: string; fileName: string; mimeType: string; accessLevel: ScriptAccessLevel }
  ): Promise<ScriptData> {
    const res = await fetch('/api/drive/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ ...payload, mode: 'script' }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || 'Unable to import script from Google Drive.');

    const scriptId = makeDocId('script');
    try {
      await setDoc(doc(db, 'projects', projectId, 'script', 'current'), {
        id: scriptId,
        fileName: String(data.fileName).slice(0, 200),
        format: data.format,
        fileUrl: data.fileUrl,
        textContent: String(data.textContent || '').slice(0, 200000),
        ...(data.htmlPreview ? { htmlPreview: String(data.htmlPreview).slice(0, 300000) } : {}),
        accessLevel: payload.accessLevel,
        uploadedBy: user.id,
        uploadedByName: user.name.slice(0, 80),
        fileSize: Number(data.fileSize) || 0,
        updatedAt: serverTimestamp(),
      });
      return {
        id: scriptId,
        fileName: data.fileName,
        format: data.format,
        fileUrl: data.fileUrl,
        textContent: data.textContent || '',
        htmlPreview: data.htmlPreview,
        accessLevel: payload.accessLevel,
        uploadedBy: user.id,
        uploadedByName: user.name,
        fileSize: Number(data.fileSize) || 0,
        updatedAt: new Date().toISOString(),
      };
    } catch (err) {
      return handleFirestoreError(err, OperationType.WRITE, `projects/${projectId}/script/current`);
    }
  },

  // ------------------------------------------------------------------
  // Team Members, Invites & Redeeming Codes
  // ------------------------------------------------------------------
  async addMemberDirect(
    project: CreativeProject,
    targetProfile: UserProfile,
    creativeRole: CreativeRole
  ): Promise<void> {
    try {
      await setDoc(doc(db, 'projects', project.id, 'members', targetProfile.id), {
        userId: targetProfile.id,
        name: targetProfile.name.slice(0, 80),
        ...(targetProfile.avatarUrl ? { avatarUrl: targetProfile.avatarUrl.slice(0, 1000) } : {}),
        creativeRole,
        skillCategory: targetProfile.skillCategory.slice(0, 100),
        experienceLevel: targetProfile.experienceLevel,
        roleInProject: 'member',
        ...(targetProfile.bio ? { bio: targetProfile.bio.slice(0, 500) } : {}),
        joinedAt: serverTimestamp(),
      });
    } catch (err) {
      return handleFirestoreError(
        err,
        OperationType.CREATE,
        `projects/${project.id}/members/${targetProfile.id}`
      );
    }
  },

  async joinOpenProject(
    project: CreativeProject,
    currentUser: UserProfile,
    creativeRole: CreativeRole
  ): Promise<void> {
    const batch = writeBatch(db);
    batch.set(doc(db, 'projects', project.id, 'members', currentUser.id), {
      userId: currentUser.id,
      name: currentUser.name.slice(0, 80),
      ...(currentUser.avatarUrl ? { avatarUrl: currentUser.avatarUrl.slice(0, 1000) } : {}),
      creativeRole,
      skillCategory: currentUser.skillCategory.slice(0, 100),
      experienceLevel: currentUser.experienceLevel,
      roleInProject: 'member',
      ...(currentUser.bio ? { bio: currentUser.bio.slice(0, 500) } : {}),
      joinedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'creators', currentUser.id, 'joinedProjects', project.id), {
      projectId: project.id,
      userId: currentUser.id,
      title: project.title.slice(0, 140),
      joinedAt: serverTimestamp(),
    });
    try {
      await batch.commit();
    } catch (err) {
      return handleFirestoreError(
        err,
        OperationType.CREATE,
        `projects/${project.id}/members/${currentUser.id}`
      );
    }
  },

  async removeMember(projectId: string, memberId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'projects', projectId, 'members', memberId));
    } catch (err) {
      return handleFirestoreError(
        err,
        OperationType.DELETE,
        `projects/${projectId}/members/${memberId}`
      );
    }
  },

  async createInvite(
    project: CreativeProject,
    owner: UserProfile,
    payload: {
      roleOffered?: CreativeRole;
      targetUserId?: string;
      targetName?: string;
    }
  ): Promise<ProjectInvite> {
    const code = makeInviteCode();
    try {
      await setDoc(doc(db, 'invites', code), {
        id: code,
        code,
        projectId: project.id,
        projectTitle: project.title.slice(0, 140),
        projectPrimaryGenre: project.primaryGenre,
        projectStatus: project.status,
        ownerId: owner.id,
        ownerName: owner.name.slice(0, 80),
        ...(payload.roleOffered ? { roleOffered: payload.roleOffered } : {}),
        ...(payload.targetUserId ? { targetUserId: payload.targetUserId } : {}),
        ...(payload.targetName ? { targetName: payload.targetName.slice(0, 80) } : {}),
        status: 'pending',
        createdBy: owner.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
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
        updatedAt: now,
        status: 'pending',
      };
    } catch (err) {
      return handleFirestoreError(err, OperationType.CREATE, `invites/${code}`);
    }
  },

  async lookupInvite(code: string): Promise<ProjectInvite> {
    const clean = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,24}$/.test(clean)) {
      throw new Error('Please enter a valid invite code (letters and numbers, e.g. B737C2F2).');
    }
    try {
      const snap = await getDoc(doc(db, 'invites', clean));
      if (!snap.exists()) {
        throw new Error(`Invite code "${clean}" was not found. Ask the project owner to generate a fresh code.`);
      }
      return mapInviteDoc(snap.data(), snap.id);
    } catch (err) {
      if (err instanceof Error && err.message.includes('not found')) throw err;
      return handleFirestoreError(err, OperationType.GET, `invites/${clean}`);
    }
  },

  async redeemInvite(
    code: string,
    user: UserProfile,
    creativeRole?: CreativeRole
  ): Promise<{ projectId: string; alreadyMember: boolean }> {
    const clean = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,24}$/.test(clean)) {
      throw new Error('Invalid invite code format.');
    }

    const inviteRef = doc(db, 'invites', clean);
    const inviteSnap = await getDoc(inviteRef).catch((err) =>
      handleFirestoreError(err, OperationType.GET, `invites/${clean}`)
    );
    if (!inviteSnap.exists()) {
      throw new Error(`Invite code "${clean}" was not found.`);
    }

    const inv = mapInviteDoc(inviteSnap.data(), inviteSnap.id);
    const memberRef = doc(db, 'projects', inv.projectId, 'members', user.id);

    const existingMember = await getDoc(memberRef).catch(() => null);
    if (existingMember?.exists()) {
      return { projectId: inv.projectId, alreadyMember: true };
    }

    if (inv.status !== 'pending') {
      throw new Error('This invite code has already been used. Ask the project owner for a new invite.');
    }

    if (inv.targetUserId && inv.targetUserId !== user.id) {
      throw new Error('This invite was sent to a different creator account.');
    }

    const batch = writeBatch(db);
    batch.update(inviteRef, {
      status: 'accepted',
      acceptedBy: user.id,
      updatedAt: serverTimestamp(),
    });
    batch.set(memberRef, {
      userId: user.id,
      name: user.name.slice(0, 80),
      ...(user.avatarUrl ? { avatarUrl: user.avatarUrl.slice(0, 1000) } : {}),
      creativeRole: creativeRole || inv.roleOffered || user.creativeRole,
      skillCategory: user.skillCategory.slice(0, 100),
      experienceLevel: user.experienceLevel,
      roleInProject: 'member',
      inviteCode: clean,
      ...(user.bio ? { bio: user.bio.slice(0, 500) } : {}),
      joinedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'creators', user.id, 'joinedProjects', inv.projectId), {
      projectId: inv.projectId,
      userId: user.id,
      title: (inv.projectTitle || 'Creative Project').slice(0, 140),
      joinedAt: serverTimestamp(),
    });

    try {
      await batch.commit();
      return { projectId: inv.projectId, alreadyMember: false };
    } catch (err) {
      return handleFirestoreError(err, OperationType.WRITE, `invites/${clean}`);
    }
  },

  async declineInvite(code: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'invites', code));
    } catch (err) {
      return handleFirestoreError(err, OperationType.DELETE, `invites/${code}`);
    }
  },

  // ------------------------------------------------------------------
  // Connect with Real People
  // ------------------------------------------------------------------
  async sendConnectionRequest(
    fromUser: UserProfile,
    toCreator: UserProfile,
    note?: string
  ): Promise<void> {
    if (fromUser.id === toCreator.id) {
      throw new Error('You cannot connect with yourself.');
    }
    const connId = connectionIdFor(fromUser.id, toCreator.id);
    const connRef = doc(db, 'connections', connId);

    try {
      const existing = await getDoc(connRef);
      if (existing.exists()) {
        const cur = mapConnectionDoc(existing.data(), existing.id);
        if (cur.status === 'accepted') {
          throw new Error(`You are already connected with ${toCreator.name}.`);
        }
        if (cur.status === 'pending') {
          if (cur.fromId === fromUser.id) {
            throw new Error('Connection request already sent.');
          }
          // They already requested us — accept right away!
          await updateDoc(connRef, {
            status: 'accepted',
            updatedAt: serverTimestamp(),
          });
          return;
        }
        if (cur.status === 'declined') {
          if (cur.fromId === fromUser.id) {
            await updateDoc(connRef, {
              status: 'pending',
              ...(note?.trim() ? { note: note.trim().slice(0, 300) } : {}),
              updatedAt: serverTimestamp(),
            });
            return;
          }
          await deleteDoc(connRef);
        }
      }

      const cleanNote = note?.trim().slice(0, 300);
      await setDoc(connRef, {
        id: connId,
        fromId: fromUser.id,
        fromName: fromUser.name.slice(0, 80),
        fromRole: fromUser.creativeRole.slice(0, 60),
        ...(fromUser.avatarUrl ? { fromAvatar: fromUser.avatarUrl.slice(0, 1000) } : {}),
        toId: toCreator.id,
        toName: toCreator.name.slice(0, 80),
        toRole: toCreator.creativeRole.slice(0, 60),
        ...(toCreator.avatarUrl ? { toAvatar: toCreator.avatarUrl.slice(0, 1000) } : {}),
        participants: [fromUser.id, toCreator.id],
        status: 'pending',
        ...(cleanNote ? { note: cleanNote } : {}),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes('already') || err.message.includes('yourself'))
      ) {
        throw err;
      }
      return handleFirestoreError(err, OperationType.WRITE, `connections/${connId}`);
    }
  },

  async respondToConnection(connectionId: string, status: 'accepted' | 'declined'): Promise<void> {
    try {
      await updateDoc(doc(db, 'connections', connectionId), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      return handleFirestoreError(err, OperationType.UPDATE, `connections/${connectionId}`);
    }
  },

  async removeConnection(connectionId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'connections', connectionId));
    } catch (err) {
      return handleFirestoreError(err, OperationType.DELETE, `connections/${connectionId}`);
    }
  },

  // ------------------------------------------------------------------
  // Milestones & Tasks
  // ------------------------------------------------------------------
  async createMilestone(
    projectId: string,
    userId: string,
    payload: { title: string; targetDate: string; description?: string }
  ): Promise<void> {
    const msId = makeDocId('ms');
    try {
      await setDoc(doc(db, 'projects', projectId, 'milestones', msId), {
        id: msId,
        title: payload.title.trim().slice(0, 140),
        targetDate: payload.targetDate.slice(0, 40),
        status: 'pending',
        ...(payload.description?.trim()
          ? { description: payload.description.trim().slice(0, 400) }
          : {}),
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      return handleFirestoreError(
        err,
        OperationType.CREATE,
        `projects/${projectId}/milestones/${msId}`
      );
    }
  },

  async updateMilestone(
    projectId: string,
    msId: string,
    payload: { status?: TaskStatus; title?: string; targetDate?: string }
  ): Promise<void> {
    const updates: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (payload.status) updates.status = payload.status;
    if (payload.title) updates.title = payload.title.trim().slice(0, 140);
    if (payload.targetDate) updates.targetDate = payload.targetDate.slice(0, 40);
    try {
      await updateDoc(doc(db, 'projects', projectId, 'milestones', msId), updates);
    } catch (err) {
      return handleFirestoreError(
        err,
        OperationType.UPDATE,
        `projects/${projectId}/milestones/${msId}`
      );
    }
  },

  async createTask(
    project: CreativeProject,
    userId: string,
    payload: {
      title: string;
      description?: string;
      milestoneId?: string;
      assigneeId?: string;
      dueDate?: string;
    }
  ): Promise<void> {
    const taskId = makeDocId('task');
    const assignee = payload.assigneeId
      ? project.members.find((m) => m.userId === payload.assigneeId)
      : undefined;
    try {
      await setDoc(doc(db, 'projects', project.id, 'tasks', taskId), {
        id: taskId,
        title: payload.title.trim().slice(0, 160),
        ...(payload.description?.trim()
          ? { description: payload.description.trim().slice(0, 500) }
          : {}),
        ...(payload.milestoneId ? { milestoneId: payload.milestoneId } : {}),
        ...(assignee ? { assigneeId: assignee.userId, assigneeName: assignee.name.slice(0, 80) } : {}),
        status: 'pending',
        ...(payload.dueDate ? { dueDate: payload.dueDate.slice(0, 40) } : {}),
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      return handleFirestoreError(
        err,
        OperationType.CREATE,
        `projects/${project.id}/tasks/${taskId}`
      );
    }
  },

  async updateTask(
    project: CreativeProject,
    taskId: string,
    payload: { status?: TaskStatus; assigneeId?: string | null; title?: string }
  ): Promise<void> {
    const updates: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (payload.status) updates.status = payload.status;
    if (payload.title) updates.title = payload.title.trim().slice(0, 160);
    if (payload.assigneeId !== undefined) {
      if (payload.assigneeId === null || payload.assigneeId === '') {
        updates.assigneeId = deleteField();
        updates.assigneeName = deleteField();
      } else {
        const assignee = project.members.find((m) => m.userId === payload.assigneeId);
        if (assignee) {
          updates.assigneeId = assignee.userId;
          updates.assigneeName = assignee.name.slice(0, 80);
        }
      }
    }
    try {
      await updateDoc(doc(db, 'projects', project.id, 'tasks', taskId), updates);
    } catch (err) {
      return handleFirestoreError(
        err,
        OperationType.UPDATE,
        `projects/${project.id}/tasks/${taskId}`
      );
    }
  },

  async deleteTask(projectId: string, taskId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'projects', projectId, 'tasks', taskId));
    } catch (err) {
      return handleFirestoreError(
        err,
        OperationType.DELETE,
        `projects/${projectId}/tasks/${taskId}`
      );
    }
  },

  // ------------------------------------------------------------------
  // Real-Time Chat, Reactions, Media Uploads & Google Drive Imports
  // ------------------------------------------------------------------
  async postMessage(
    projectId: string,
    user: UserProfile,
    payload: {
      content: string;
      channel: 'chat' | 'discussion';
      topicTitle?: string;
    }
  ): Promise<void> {
    const msgId = makeDocId('msg');
    try {
      await setDoc(doc(db, 'projects', projectId, 'messages', msgId), {
        id: msgId,
        projectId,
        channel: payload.channel,
        ...(payload.topicTitle?.trim() ? { topicTitle: payload.topicTitle.trim().slice(0, 120) } : {}),
        senderId: user.id,
        senderName: user.name.slice(0, 80),
        ...(user.avatarUrl ? { senderAvatar: user.avatarUrl.slice(0, 1000) } : {}),
        senderRole: user.creativeRole.slice(0, 60),
        content: payload.content.trim().slice(0, 2000),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      return handleFirestoreError(
        err,
        OperationType.CREATE,
        `projects/${projectId}/messages/${msgId}`
      );
    }
  },

  async toggleReaction(
    projectId: string,
    userId: string,
    messageId: string,
    key: 'heart' | 'clap' | 'spark' | 'thumbs'
  ): Promise<void> {
    const reactionId = `${messageId}__${userId}__${key}`;
    const ref = doc(db, 'projects', projectId, 'reactions', reactionId);
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await deleteDoc(ref);
      } else {
        await setDoc(ref, {
          id: reactionId,
          messageId,
          userId,
          key,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      return handleFirestoreError(
        err,
        OperationType.WRITE,
        `projects/${projectId}/reactions/${reactionId}`
      );
    }
  },

  async uploadMedia(
    projectId: string,
    user: UserProfile,
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
  ): Promise<void> {
    const form = new FormData();
    form.append('file', file, fileName);
    if (options.mediaCategory) form.append('mediaCategory', options.mediaCategory);

    const uploaded = await uploadWithProgress<{
      fileUrl: string;
      fileName: string;
      mimeType: string;
      mediaCategory: MediaCategory;
      fileSize: number;
    }>('/api/files/upload', form, user.id, onProgress);

    const mediaId = makeDocId('media');
    const resolvedCategory = options.mediaCategory || uploaded.mediaCategory;
    const batch = writeBatch(db);

    batch.set(doc(db, 'projects', projectId, 'media', mediaId), {
      id: mediaId,
      fileName: uploaded.fileName.slice(0, 200),
      fileUrl: uploaded.fileUrl,
      mimeType: (uploaded.mimeType || 'application/octet-stream').slice(0, 120),
      mediaCategory: resolvedCategory,
      fileSize: Number(uploaded.fileSize) || 0,
      uploadedBy: user.id,
      uploadedByName: user.name.slice(0, 80),
      ...(typeof options.durationSeconds === 'number'
        ? { durationSeconds: options.durationSeconds }
        : {}),
      createdAt: serverTimestamp(),
    });

    if (options.postToChat) {
      const msgId = makeDocId('msg');
      const caption =
        options.caption?.trim() ||
        (resolvedCategory === 'voice_note' ? 'Shared a voice note' : `Shared ${uploaded.fileName}`);
      batch.set(doc(db, 'projects', projectId, 'messages', msgId), {
        id: msgId,
        projectId,
        channel: options.channel === 'discussion' ? 'discussion' : 'chat',
        ...(options.topicTitle?.trim() ? { topicTitle: options.topicTitle.trim().slice(0, 120) } : {}),
        senderId: user.id,
        senderName: user.name.slice(0, 80),
        ...(user.avatarUrl ? { senderAvatar: user.avatarUrl.slice(0, 1000) } : {}),
        senderRole: user.creativeRole.slice(0, 60),
        content: caption.slice(0, 2000),
        attachment: {
          id: mediaId,
          fileName: uploaded.fileName.slice(0, 200),
          fileUrl: uploaded.fileUrl,
          mimeType: (uploaded.mimeType || 'application/octet-stream').slice(0, 120),
          mediaCategory: resolvedCategory,
          fileSize: Number(uploaded.fileSize) || 0,
        },
        createdAt: serverTimestamp(),
      });
    }

    try {
      await batch.commit();
    } catch (err) {
      return handleFirestoreError(
        err,
        OperationType.CREATE,
        `projects/${projectId}/media/${mediaId}`
      );
    }
  },

  async importMediaFromDrive(
    projectId: string,
    user: UserProfile,
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
  ): Promise<void> {
    const res = await fetch('/api/drive/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        fileId: payload.fileId,
        fileName: payload.fileName,
        mimeType: payload.mimeType,
        mode: 'media',
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || 'Unable to import file from Google Drive.');

    const mediaId = makeDocId('media');
    const batch = writeBatch(db);
    batch.set(doc(db, 'projects', projectId, 'media', mediaId), {
      id: mediaId,
      fileName: String(data.fileName).slice(0, 200),
      fileUrl: String(data.fileUrl),
      mimeType: String(data.mimeType || 'application/octet-stream').slice(0, 120),
      mediaCategory: (data.mediaCategory as MediaCategory) || 'document',
      fileSize: Number(data.fileSize) || 0,
      uploadedBy: user.id,
      uploadedByName: user.name.slice(0, 80),
      createdAt: serverTimestamp(),
    });

    if (payload.postToChat) {
      const msgId = makeDocId('msg');
      const caption = payload.caption?.trim() || `Shared ${data.fileName} from Google Drive`;
      batch.set(doc(db, 'projects', projectId, 'messages', msgId), {
        id: msgId,
        projectId,
        channel: payload.channel === 'discussion' ? 'discussion' : 'chat',
        ...(payload.topicTitle?.trim() ? { topicTitle: payload.topicTitle.trim().slice(0, 120) } : {}),
        senderId: user.id,
        senderName: user.name.slice(0, 80),
        ...(user.avatarUrl ? { senderAvatar: user.avatarUrl.slice(0, 1000) } : {}),
        senderRole: user.creativeRole.slice(0, 60),
        content: caption.slice(0, 2000),
        attachment: {
          id: mediaId,
          fileName: String(data.fileName).slice(0, 200),
          fileUrl: String(data.fileUrl),
          mimeType: String(data.mimeType || 'application/octet-stream').slice(0, 120),
          mediaCategory: (data.mediaCategory as MediaCategory) || 'document',
          fileSize: Number(data.fileSize) || 0,
        },
        createdAt: serverTimestamp(),
      });
    }

    try {
      await batch.commit();
    } catch (err) {
      return handleFirestoreError(
        err,
        OperationType.CREATE,
        `projects/${projectId}/media/${mediaId}`
      );
    }
  },

  // ------------------------------------------------------------------
  // Peer Feedback (1 editable review per reviewer -> target per project)
  // ------------------------------------------------------------------
  async submitFeedback(
    projectId: string,
    reviewer: UserProfile,
    payload: { targetUserId: string; sentiment: 'positive' | 'constructive'; comment: string }
  ): Promise<void> {
    const fbId = `${reviewer.id}__${payload.targetUserId}`;
    const ref = doc(db, 'projects', projectId, 'feedback', fbId);
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, {
          sentiment: payload.sentiment,
          comment: payload.comment.trim().slice(0, 600),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          id: fbId,
          projectId,
          reviewerId: reviewer.id,
          reviewerName: reviewer.name.slice(0, 80),
          targetUserId: payload.targetUserId,
          sentiment: payload.sentiment,
          comment: payload.comment.trim().slice(0, 600),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      return handleFirestoreError(
        err,
        OperationType.WRITE,
        `projects/${projectId}/feedback/${fbId}`
      );
    }
  },

  // ------------------------------------------------------------------
  // Group Portfolio & Showcase
  // ------------------------------------------------------------------
  async addPortfolioItem(
    projectId: string,
    user: UserProfile,
    payload: {
      title: string;
      description: string;
      mediaType: PortfolioMediaType;
      contributors: string[];
      file?: File | null;
      mediaUrl?: string;
    },
    onProgress?: (percent: number) => void
  ): Promise<void> {
    let resolvedUrl = payload.mediaUrl?.trim() || '';
    let fileName: string | undefined;
    let mimeType: string | undefined;

    if (payload.file) {
      const form = new FormData();
      form.append('file', payload.file);
      const uploaded = await uploadWithProgress<{
        fileUrl: string;
        fileName: string;
        mimeType: string;
      }>('/api/files/upload', form, user.id, onProgress);
      resolvedUrl = uploaded.fileUrl;
      fileName = uploaded.fileName;
      mimeType = uploaded.mimeType;
    }

    if (!resolvedUrl) {
      throw new Error('Please upload a file or provide a media URL.');
    }

    const itemId = makeDocId('port');
    const isImg = mimeType?.startsWith('image/');
    const contributors =
      payload.contributors.length > 0 ? payload.contributors.slice(0, 25) : [user.name];

    try {
      await setDoc(doc(db, 'projects', projectId, 'portfolio', itemId), {
        id: itemId,
        projectId,
        title: payload.title.trim().slice(0, 140),
        description: payload.description.trim().slice(0, 1000),
        mediaType: payload.mediaType,
        mediaUrl: resolvedUrl.slice(0, 2000),
        ...(isImg ? { previewImageUrl: resolvedUrl.slice(0, 2000) } : {}),
        ...(fileName ? { fileName: fileName.slice(0, 200) } : {}),
        ...(mimeType ? { mimeType: mimeType.slice(0, 120) } : {}),
        contributors,
        uploadedBy: user.id,
        uploadedByName: user.name.slice(0, 80),
        uploadedAt: serverTimestamp(),
      });
    } catch (err) {
      return handleFirestoreError(
        err,
        OperationType.CREATE,
        `projects/${projectId}/portfolio/${itemId}`
      );
    }
  },

  async importPortfolioFromDrive(
    projectId: string,
    user: UserProfile,
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
  ): Promise<void> {
    const res = await fetch('/api/drive/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        fileId: payload.fileId,
        fileName: payload.fileName,
        mimeType: payload.mimeType,
        mode: 'media',
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || 'Failed to import portfolio work from Google Drive.');

    const itemId = makeDocId('port');
    const isImg = String(data.mimeType || '').startsWith('image/');
    const contributors =
      payload.contributors.length > 0 ? payload.contributors.slice(0, 25) : [user.name];

    try {
      await setDoc(doc(db, 'projects', projectId, 'portfolio', itemId), {
        id: itemId,
        projectId,
        title: payload.title.trim().slice(0, 140),
        description: payload.description.trim().slice(0, 1000),
        mediaType: payload.mediaType,
        mediaUrl: String(data.fileUrl).slice(0, 2000),
        ...(isImg ? { previewImageUrl: String(data.fileUrl).slice(0, 2000) } : {}),
        fileName: String(data.fileName).slice(0, 200),
        mimeType: String(data.mimeType || 'application/octet-stream').slice(0, 120),
        contributors,
        uploadedBy: user.id,
        uploadedByName: user.name.slice(0, 80),
        uploadedAt: serverTimestamp(),
      });
    } catch (err) {
      return handleFirestoreError(
        err,
        OperationType.CREATE,
        `projects/${projectId}/portfolio/${itemId}`
      );
    }
  },

  async deletePortfolioItem(projectId: string, itemId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'projects', projectId, 'portfolio', itemId));
    } catch (err) {
      return handleFirestoreError(
        err,
        OperationType.DELETE,
        `projects/${projectId}/portfolio/${itemId}`
      );
    }
  },
};
