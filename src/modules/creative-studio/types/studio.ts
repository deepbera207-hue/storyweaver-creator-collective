export const ALL_GENRES = [
  'Animation',
  '2D Animation',
  '3D Animation',
  'Action',
  'Adventure',
  'Love / Romance',
  'Drama',
  'Revenge',
  'Psychological Thriller',
  'Horror',
  'Mystery',
  'Science Fiction',
  'Fantasy',
  'Documentary',
  'Social Awareness',
  'Comedy',
  'Other',
] as const;

export type Genre = (typeof ALL_GENRES)[number];

export const PROJECT_STATUSES = [
  'Planning',
  'Recruiting',
  'Developing',
  'Complete',
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const CREATIVE_ROLES = [
  'Animator',
  '3D Artist',
  'Character Designer',
  'Music Producer',
  'Sound Designer',
  'Video Editor',
  'Scriptwriter',
  'Content Creator',
  'Voice Actor',
  'Storyboard Artist',
  'Background Artist',
  'Director',
] as const;

export type CreativeRole = (typeof CREATIVE_ROLES)[number];

export type ExperienceLevel = 'Emerging' | 'Intermediate' | 'Senior' | 'Lead';

export type ScriptAccessLevel = 'owner_only' | 'team_members' | 'all_collaborators';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export type MediaCategory = 'image' | 'video' | 'audio' | 'voice_note' | 'document';

export type PortfolioMediaType =
  | 'Final Animation'
  | 'Finished Video'
  | 'Music & Soundtrack'
  | 'Artwork'
  | 'Character Design'
  | 'Poster'
  | 'Final Script'
  | 'Other Material';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  creativeRole: CreativeRole;
  skillCategory: string;
  experienceLevel: ExperienceLevel;
  bio: string;
  isDemoProfile?: boolean;
}

export interface ProjectMember {
  userId: string;
  name: string;
  avatarUrl: string;
  creativeRole: CreativeRole;
  skillCategory: string;
  experienceLevel: ExperienceLevel;
  roleInProject: 'owner' | 'admin' | 'member';
  joinedAt: string;
  bio: string;
}

export interface ScriptData {
  id: string;
  fileName: string;
  format: 'docx' | 'pdf' | 'txt' | 'editor';
  fileUrl?: string;
  textContent: string;
  htmlPreview?: string;
  accessLevel: ScriptAccessLevel;
  uploadedBy: string;
  uploadedByName: string;
  updatedAt: string;
  fileSize?: number;
}

export interface Milestone {
  id: string;
  title: string;
  targetDate: string;
  status: TaskStatus;
  description?: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  milestoneId?: string;
  assigneeId?: string;
  assigneeName?: string;
  status: TaskStatus;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  mediaCategory: MediaCategory;
  fileSize: number;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
  durationSeconds?: number;
}

export interface ChatMessage {
  id: string;
  projectId: string;
  channel: 'chat' | 'discussion';
  topicTitle?: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: string;
  content: string;
  createdAt: string;
  attachment?: MediaAttachment;
  reactions: Record<string, string[]>;
}

export interface PeerFeedback {
  id: string;
  projectId: string;
  reviewerId: string;
  reviewerName: string;
  targetUserId: string;
  sentiment: 'positive' | 'constructive';
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioItem {
  id: string;
  projectId: string;
  title: string;
  description: string;
  mediaType: PortfolioMediaType;
  mediaUrl: string;
  previewImageUrl?: string;
  fileName?: string;
  mimeType?: string;
  contributors: string[];
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
}

export interface ProjectInvite {
  id: string;
  projectId: string;
  projectTitle?: string;
  projectPrimaryGenre?: Genre;
  projectStatus?: ProjectStatus;
  ownerId?: string;
  ownerName?: string;
  code: string;
  targetEmail?: string;
  targetUserId?: string;
  targetName?: string;
  roleOffered?: CreativeRole;
  acceptedBy?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  status: 'pending' | 'accepted';
}

export interface CreatorConnection {
  id: string;
  fromId: string;
  fromName: string;
  fromRole?: string;
  fromAvatar?: string;
  toId: string;
  toName: string;
  toRole?: string;
  toAvatar?: string;
  participants: [string, string];
  status: 'pending' | 'accepted' | 'declined';
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreativeProject {
  id: string;
  title: string;
  description: string;
  genres: Genre[];
  primaryGenre: Genre;
  status: ProjectStatus;
  isDraft: boolean;
  isSampleProject?: boolean;
  ownerId: string;
  ownerName?: string;
  createdAt: string;
  updatedAt: string;
  requiredRoles: CreativeRole[];
  members: ProjectMember[];
  script: ScriptData | null;
  scriptRestricted?: boolean;
  milestones: Milestone[];
  tasks: ProjectTask[];
  messages: ChatMessage[];
  sharedMedia: MediaAttachment[];
  feedback: PeerFeedback[];
  portfolio: PortfolioItem[];
  invites: ProjectInvite[];
}

export interface ProjectProgressSummary {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  percentage: number;
}

export function computeProjectProgress(tasks: ProjectTask[]): ProjectProgressSummary {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const pending = tasks.filter((t) => t.status === 'pending').length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, inProgress, pending, percentage };
}

export function computeUnfilledRoles(
  requiredRoles: CreativeRole[],
  members: ProjectMember[]
): CreativeRole[] {
  const filledSet = new Set(members.map((m) => m.creativeRole));
  return requiredRoles.filter((role) => !filledSet.has(role));
}

export interface MemberContributionEstimate {
  userId: string;
  name: string;
  avatarUrl: string;
  creativeRole: CreativeRole;
  assignedTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  participationEvents: number;
  positiveFeedbackCount: number;
  constructiveFeedbackCount: number;
  estimatedScore: number;
  estimatedSharePercent: number;
}

export function computeEstimatedContributions(
  project: CreativeProject
): MemberContributionEstimate[] {
  const raw = project.members.map((member) => {
    const memberTasks = project.tasks.filter((t) => t.assigneeId === member.userId);
    const assignedTasks = memberTasks.length;
    const completedTasks = memberTasks.filter((t) => t.status === 'completed').length;
    const inProgressTasks = memberTasks.filter((t) => t.status === 'in_progress').length;

    const messageCount = project.messages.filter((m) => m.senderId === member.userId).length;
    const mediaCount = project.sharedMedia.filter((m) => m.uploadedBy === member.userId).length;
    const portfolioCount = project.portfolio.filter(
      (p) => p.uploadedBy === member.userId || p.contributors.includes(member.name)
    ).length;
    const participationEvents = messageCount + mediaCount * 2 + portfolioCount * 3;

    const targetFeedback = project.feedback.filter((f) => f.targetUserId === member.userId);
    const positiveFeedbackCount = targetFeedback.filter((f) => f.sentiment === 'positive').length;
    const constructiveFeedbackCount = targetFeedback.filter(
      (f) => f.sentiment === 'constructive'
    ).length;

    // Transparent weighted indicator (0-100 scale before normalization):
    // 50 pts from completed tasks & progress, 30 pts from studio participation, 20 pts baseline/peer recognition
    const taskPoints =
      assignedTasks > 0
        ? (completedTasks / Math.max(assignedTasks, 1)) * 40 + Math.min(inProgressTasks * 6, 15)
        : 0;
    const activityPoints = Math.min(participationEvents * 3.5, 30);
    const feedbackPoints = Math.max(
      0,
      Math.min(15, 8 + positiveFeedbackCount * 3.5 - constructiveFeedbackCount * 1.5)
    );
    const estimatedScore = Math.round(Math.min(100, taskPoints + activityPoints + feedbackPoints));

    return {
      userId: member.userId,
      name: member.name,
      avatarUrl: member.avatarUrl,
      creativeRole: member.creativeRole,
      assignedTasks,
      completedTasks,
      inProgressTasks,
      participationEvents,
      positiveFeedbackCount,
      constructiveFeedbackCount,
      estimatedScore,
    };
  });

  const totalScore = raw.reduce((acc, item) => acc + item.estimatedScore, 0);
  return raw.map((item) => ({
    ...item,
    estimatedSharePercent:
      totalScore > 0 ? Math.round((item.estimatedScore / totalScore) * 100) : 0,
  }));
}
