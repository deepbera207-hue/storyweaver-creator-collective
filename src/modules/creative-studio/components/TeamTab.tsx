import { useState, type FormEvent } from 'react';
import { UserPlus, Mail, Trash2, X, Copy, Check, Shield, Link2 } from 'lucide-react';
import {
  CREATIVE_ROLES,
  computeUnfilledRoles,
  type CreativeProject,
  type CreativeRole,
  type ProjectMember,
  type UserProfile,
} from '../types/studio';
import type { GenreThemeTokens } from '../theme/genreThemes';
import { studioService as firestoreStudio } from '../services/studioService';
import { StudioAvatar } from './StudioAvatar';

interface TeamTabProps {
  project: CreativeProject;
  currentUser: UserProfile;
  allCreators: UserProfile[];
  theme: GenreThemeTokens;
  onProjectUpdate: (updated: CreativeProject) => void;
}

export function TeamTab({
  project,
  currentUser,
  allCreators,
  theme,
}: TeamTabProps) {
  const isOwner = project.ownerId === currentUser.id;
  const isMember = project.members.some((m) => m.userId === currentUser.id);
  const unfilledRoles = computeUnfilledRoles(project.requiredRoles, project.members);

  const availableCreators = allCreators.filter(
    (c) => !project.members.some((m) => m.userId === c.id)
  );

  const [selectedUserId, setSelectedUserId] = useState(availableCreators[0]?.id ?? '');
  const [assignedRole, setAssignedRole] = useState<CreativeRole>(
    unfilledRoles[0] ?? 'Animator'
  );
  const [inviteTargetUserId, setInviteTargetUserId] = useState('');
  const [inviteRole, setInviteRole] = useState<CreativeRole>(unfilledRoles[0] ?? 'Animator');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [profileModal, setProfileModal] = useState<ProjectMember | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleAddMember(e: FormEvent) {
    e.preventDefault();
    const targetId = selectedUserId || availableCreators[0]?.id;
    const target = availableCreators.find((c) => c.id === targetId);
    if (!target) return;
    setErrorMsg(null);
    setBusy(true);
    try {
      await firestoreStudio.addMemberDirect(project, target, assignedRole);
      const remaining = availableCreators.filter((c) => c.id !== target.id);
      setSelectedUserId(remaining[0]?.id ?? '');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to add member.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateInvite(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setBusy(true);
    try {
      const target = inviteTargetUserId
        ? availableCreators.find((c) => c.id === inviteTargetUserId)
        : undefined;
      await firestoreStudio.createInvite(project, currentUser, {
        roleOffered: inviteRole,
        targetUserId: target?.id,
        targetName: target?.name,
      });
      setInviteTargetUserId('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to create invite.');
    } finally {
      setBusy(false);
    }
  }

  async function handleJoinWithCode(e: FormEvent) {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;
    setErrorMsg(null);
    setBusy(true);
    try {
      await firestoreStudio.redeemInvite(
        inviteCodeInput.trim().toUpperCase(),
        currentUser
      );
      setInviteCodeInput('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Invalid or expired invite code.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    setErrorMsg(null);
    setBusy(true);
    try {
      await firestoreStudio.removeMember(project.id, memberId);
      if (profileModal?.userId === memberId) setProfileModal(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to remove member.');
    } finally {
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

      {/* Unfilled Required Roles */}
      <div
        className="studio-glass rounded-2xl border p-5 flex flex-wrap items-center justify-between gap-4"
        style={{ borderColor: theme.borderSubtle }}
      >
        <div>
          <h3 className="text-sm font-semibold">Required Team Positions</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {unfilledRoles.length > 0 ? (
              unfilledRoles.map((role) => (
                <span
                  key={role}
                  className="px-3 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 border border-slate-200"
                >
                  {role}
                </span>
              ))
            ) : (
              <span className="text-xs" style={{ color: theme.accentText }}>
                All specified team roles are filled.
              </span>
            )}
          </div>
        </div>

        {!isMember && (
          <form onSubmit={handleJoinWithCode} className="flex items-center gap-2">
            <input
              type="text"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value)}
              placeholder="Enter invite code"
              className="px-3 py-1.5 text-xs rounded-xl bg-white border w-36 focus:outline-none uppercase font-mono"
              style={{ borderColor: theme.borderSubtle }}
            />
            <button
              type="submit"
              disabled={busy}
              style={{ backgroundColor: theme.accent, color: '#FFFFFF' }}
              className="px-3.5 py-1.5 text-xs font-medium rounded-xl cursor-pointer whitespace-nowrap"
            >
              Accept Invite
            </button>
          </form>
        )}
      </div>

      {/* Owner Administrative Controls: Add Member & Generate Invite */}
      {isOwner && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <form
            onSubmit={handleAddMember}
            className="studio-glass rounded-2xl border p-5 space-y-3"
            style={{ borderColor: theme.borderSubtle }}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <UserPlus className="w-4 h-4" style={{ color: theme.accentText }} />
              Add Studio Creator to Team
            </div>
            {availableCreators.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="flex-1 min-w-[160px] px-3 py-2 text-xs rounded-xl bg-white border"
                  style={{ borderColor: theme.borderSubtle }}
                >
                  {availableCreators.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.creativeRole})
                    </option>
                  ))}
                </select>
                <select
                  value={assignedRole}
                  onChange={(e) => setAssignedRole(e.target.value as CreativeRole)}
                  className="px-3 py-2 text-xs rounded-xl bg-white border"
                  style={{ borderColor: theme.borderSubtle }}
                >
                  {CREATIVE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={busy}
                  style={{ backgroundColor: theme.accent, color: '#FFFFFF' }}
                  className="px-4 py-2 text-xs font-medium rounded-xl cursor-pointer whitespace-nowrap"
                >
                  Add Member
                </button>
              </div>
            ) : (
              <p className="text-xs" style={{ color: theme.mutedInk }}>
                All registered studio creators are already on this project team.
              </p>
            )}
          </form>

          <form
            onSubmit={handleCreateInvite}
            className="studio-glass rounded-2xl border p-5 space-y-3"
            style={{ borderColor: theme.borderSubtle }}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Mail className="w-4 h-4" style={{ color: theme.accentText }} />
              Invite Collaborator
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={inviteTargetUserId}
                onChange={(e) => setInviteTargetUserId(e.target.value)}
                aria-label="Invite target creator"
                className="flex-1 min-w-[180px] px-3 py-2 text-xs rounded-xl bg-white border focus:outline-none"
                style={{ borderColor: theme.borderSubtle }}
              >
                <option value="">Open Invite Code (Anyone with code)</option>
                {availableCreators.map((c) => (
                  <option key={c.id} value={c.id}>
                    Direct to {c.name} ({c.creativeRole})
                  </option>
                ))}
              </select>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as CreativeRole)}
                className="px-3 py-2 text-xs rounded-xl bg-white border"
                style={{ borderColor: theme.borderSubtle }}
              >
                {CREATIVE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-white border hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                style={{ borderColor: theme.borderStrong, color: theme.accentText }}
              >
                Generate Invite
              </button>
            </div>

            {project.invites.length > 0 && (
              <div className="pt-2 space-y-1.5">
                {project.invites.slice(0, 6).map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-white/80 border text-xs"
                    style={{ borderColor: theme.borderSubtle }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-semibold shrink-0">{inv.code}</span>
                      <span className="truncate" style={{ color: theme.mutedInk }}>
                        {inv.roleOffered || 'Member'} · {inv.status}
                        {inv.targetName ? ` · for ${inv.targetName}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard?.writeText(inv.code);
                          setCopiedCode(`${inv.id}:code`);
                          setTimeout(() => setCopiedCode(null), 1500);
                        }}
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                        title="Copy invite code"
                      >
                        {copiedCode === `${inv.id}:code` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        Code
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const shareUrl = `${window.location.origin}/?invite=${encodeURIComponent(inv.code)}`;
                          void navigator.clipboard?.writeText(shareUrl);
                          setCopiedCode(`${inv.id}:link`);
                          setTimeout(() => setCopiedCode(null), 1500);
                        }}
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                        title="Copy shareable invite link"
                      >
                        {copiedCode === `${inv.id}:link` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Link2 className="w-3.5 h-3.5" />
                        )}
                        Link
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>
      )}

      {/* Team Member Profile Cards (3-column responsive grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {project.members.map((member) => {
          const memberTasks = project.tasks.filter((t) => t.assigneeId === member.userId);
          const activeTask =
            memberTasks.find((t) => t.status === 'in_progress') ||
            memberTasks.find((t) => t.status === 'pending');
          const completedCount = memberTasks.filter((t) => t.status === 'completed').length;

          return (
            <div
              key={member.userId}
              className="studio-glass rounded-2xl border p-5 flex flex-col justify-between space-y-4"
              style={{ borderColor: theme.borderSubtle }}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <StudioAvatar
                      name={member.name}
                      avatarUrl={member.avatarUrl}
                      size="md"
                      tintBg={theme.accentSoft}
                      tintText={theme.accentText}
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold truncate">{member.name}</h4>
                      <p className="text-xs font-medium truncate" style={{ color: theme.accentText }}>
                        {member.creativeRole}
                      </p>
                    </div>
                  </div>
                  {member.roleInProject === 'owner' && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md shrink-0"
                      style={{ backgroundColor: theme.accentSoft, color: theme.accentText }}
                    >
                      <Shield className="w-3 h-3" />
                      Owner
                    </span>
                  )}
                </div>

                <div className="text-xs space-y-1.5" style={{ color: theme.mutedInk }}>
                  <div>
                    <span className="font-medium text-slate-700">Skill:</span> {member.skillCategory}
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Experience:</span>{' '}
                    {member.experienceLevel}
                  </div>
                  <div className="tabular-nums">
                    <span className="font-medium text-slate-700">Contribution:</span>{' '}
                    {completedCount} completed / {memberTasks.length} assigned tasks
                  </div>
                  <div className="pt-1">
                    <span className="font-medium text-slate-700">Current Task:</span>{' '}
                    {activeTask ? activeTask.title : 'Available for next assignment'}
                  </div>
                </div>
              </div>

              <div
                className="pt-3 border-t flex items-center justify-between gap-2"
                style={{ borderColor: theme.borderSubtle }}
              >
                <button
                  type="button"
                  onClick={() => setProfileModal(member)}
                  className="text-xs font-medium hover:underline cursor-pointer"
                  style={{ color: theme.accentText }}
                >
                  View Profile
                </button>

                {isOwner && member.userId !== project.ownerId && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleRemoveMember(member.userId)}
                    className="inline-flex items-center gap-1 text-xs text-rose-700 hover:underline cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Member Profile Detail Modal */}
      {profileModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 backdrop-blur-xs"
          onClick={() => setProfileModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: theme.softGradient, borderColor: theme.borderStrong }}
            className="w-full max-w-md rounded-2xl border p-6 shadow-xl space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <StudioAvatar
                  name={profileModal.name}
                  avatarUrl={profileModal.avatarUrl}
                  size="lg"
                  tintBg={theme.accentSoft}
                  tintText={theme.accentText}
                />
                <div>
                  <h3 className="text-lg font-semibold">{profileModal.name}</h3>
                  <p className="text-xs font-medium" style={{ color: theme.accentText }}>
                    {profileModal.creativeRole} · {profileModal.experienceLevel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProfileModal(null)}
                className="p-1.5 rounded-lg hover:bg-black/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-white/80 border space-y-2 text-xs" style={{ borderColor: theme.borderSubtle }}>
              <div>
                <span className="font-semibold text-slate-700">Skill Category:</span>{' '}
                {profileModal.skillCategory}
              </div>
              <div>
                <span className="font-semibold text-slate-700">Joined Project:</span>{' '}
                {new Date(profileModal.joinedAt).toLocaleDateString()}
              </div>
              <p className="pt-1 text-sm leading-relaxed text-slate-700">
                {profileModal.bio || 'No creator bio provided yet.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
