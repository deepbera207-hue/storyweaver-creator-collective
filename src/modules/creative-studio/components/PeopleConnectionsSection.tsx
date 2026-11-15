import { useMemo, useState } from 'react';
import {
  UserPlus,
  UserCheck,
  Search,
  Check,
  X,
  Send,
  Link2,
  Copy,
  Sparkles,
  Users,
  Clock,
  FolderPlus,
  AlertCircle,
} from 'lucide-react';
import {
  CREATIVE_ROLES,
  type CreativeProject,
  type CreativeRole,
  type CreatorConnection,
  type ProjectInvite,
  type UserProfile,
} from '../types/studio';
import type { GenreThemeTokens } from '../theme/genreThemes';
import { StudioAvatar } from './StudioAvatar';
import { firestoreStudio } from '../services/firestoreStudio';

interface PeopleConnectionsSectionProps {
  currentUser: UserProfile;
  allCreators: UserProfile[];
  connections: CreatorConnection[];
  incomingInvites: ProjectInvite[];
  ownedProjects: CreativeProject[];
  theme: GenreThemeTokens;
  onOpenProject: (projectId: string) => void;
}

export function PeopleConnectionsSection({
  currentUser,
  allCreators,
  connections,
  incomingInvites,
  ownedProjects,
  theme,
  onOpenProject,
}: PeopleConnectionsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<CreativeRole | 'all'>('all');
  const [noteByCreator, setNoteByCreator] = useState<Record<string, string>>({});
  const [inviteOpenFor, setInviteOpenFor] = useState<string | null>(null);
  const [inviteProjectId, setInviteProjectId] = useState<string>(ownedProjects[0]?.id ?? '');
  const [inviteRole, setInviteRole] = useState<CreativeRole>('Animator');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [copiedAppUrl, setCopiedAppUrl] = useState(false);

  const creatorMap = useMemo(() => {
    const map = new Map<string, UserProfile>();
    for (const c of allCreators) map.set(c.id, c);
    return map;
  }, [allCreators]);

  const connectionByOtherId = useMemo(() => {
    const map = new Map<string, CreatorConnection>();
    for (const conn of connections) {
      const otherId = conn.fromId === currentUser.id ? conn.toId : conn.fromId;
      map.set(otherId, conn);
    }
    return map;
  }, [connections, currentUser.id]);

  const incomingRequests = useMemo(
    () =>
      connections.filter(
        (c) => c.status === 'pending' && c.toId === currentUser.id
      ),
    [connections, currentUser.id]
  );

  const outgoingRequests = useMemo(
    () =>
      connections.filter(
        (c) => c.status === 'pending' && c.fromId === currentUser.id
      ),
    [connections, currentUser.id]
  );

  const acceptedConnections = useMemo(
    () => connections.filter((c) => c.status === 'accepted'),
    [connections]
  );

  const otherCreators = useMemo(() => {
    return allCreators.filter((c) => {
      if (c.id === currentUser.id) return false;
      if (roleFilter !== 'all' && c.creativeRole !== roleFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          c.name.toLowerCase().includes(q) ||
          c.creativeRole.toLowerCase().includes(q) ||
          c.skillCategory.toLowerCase().includes(q) ||
          c.bio.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [allCreators, currentUser.id, roleFilter, searchQuery]);

  async function handleSendConnection(target: UserProfile) {
    setErrorMsg(null);
    setStatusMsg(null);
    setBusyId(target.id);
    try {
      await firestoreStudio.sendConnectionRequest(
        currentUser,
        target,
        noteByCreator[target.id]
      );
      setNoteByCreator((prev) => ({ ...prev, [target.id]: '' }));
      setStatusMsg(`Connection request sent to ${target.name}.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to send connection request.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleRespondConnection(connId: string, decision: 'accepted' | 'declined', name: string) {
    setErrorMsg(null);
    setStatusMsg(null);
    setBusyId(connId);
    try {
      await firestoreStudio.respondToConnection(connId, decision);
      setStatusMsg(
        decision === 'accepted'
          ? `Connected with ${name}! You can now invite each other directly to projects.`
          : `Declined connection request from ${name}.`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to update connection.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemoveConnection(connId: string) {
    setErrorMsg(null);
    setStatusMsg(null);
    setBusyId(connId);
    try {
      await firestoreStudio.removeConnection(connId);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to remove connection.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleAcceptProjectInvite(inv: ProjectInvite) {
    setErrorMsg(null);
    setStatusMsg(null);
    setBusyId(inv.id);
    try {
      const { projectId } = await firestoreStudio.redeemInvite(
        inv.code,
        currentUser,
        inv.roleOffered
      );
      onOpenProject(projectId);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to accept project invite.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeclineProjectInvite(inv: ProjectInvite) {
    setErrorMsg(null);
    setBusyId(inv.id);
    try {
      await firestoreStudio.declineInvite(inv.code);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to decline invite.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleSendProjectInvite(target: UserProfile) {
    const chosenProject =
      ownedProjects.find((p) => p.id === inviteProjectId) || ownedProjects[0];
    if (!chosenProject) return;

    setErrorMsg(null);
    setStatusMsg(null);
    setBusyId(`invite_${target.id}`);
    try {
      const inv = await firestoreStudio.createInvite(chosenProject, currentUser, {
        roleOffered: inviteRole,
        targetUserId: target.id,
        targetName: target.name,
      });
      setInviteOpenFor(null);
      setStatusMsg(
        `Sent invite to ${target.name} for "${chosenProject.title}" (Code: ${inv.code}). It now shows in their Connect People tab!`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to send project invitation.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Copy Studio Link */}
      <div
        className="studio-glass rounded-2xl border p-6 flex flex-wrap items-center justify-between gap-4"
        style={{ borderColor: theme.borderSubtle }}
      >
        <div className="space-y-1 max-w-2xl">
          <h2 className="text-lg font-semibold text-slate-900">Connect with Real Creators</h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Find friends and collaborators signed into Creative Studio, send connection requests,
            and invite connected teammates straight into your projects across any device.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(window.location.origin);
            setCopiedAppUrl(true);
            setTimeout(() => setCopiedAppUrl(false), 1800);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shrink-0"
        >
          {copiedAppUrl ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Studio Link Copied
            </>
          ) : (
            <>
              <Link2 className="w-3.5 h-3.5" />
              Copy Studio Link for Friends
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {statusMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm">
          <Check className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Incoming Direct Project Invitations */}
      {incomingInvites.length > 0 && (
        <div
          className="studio-glass rounded-2xl border p-5 space-y-3"
          style={{ borderColor: theme.borderStrong }}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="w-4 h-4" style={{ color: theme.accentText }} />
            Project Invitations for You ({incomingInvites.length})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {incomingInvites.map((inv) => (
              <div
                key={inv.id}
                className="p-4 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="text-[11px] font-medium" style={{ color: theme.accentText }}>
                    {inv.projectPrimaryGenre || 'Creative Project'} · Code {inv.code}
                  </div>
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    {inv.projectTitle}
                  </div>
                  <div className="text-xs text-slate-600">
                    From <strong>{inv.ownerName}</strong>
                    {inv.roleOffered ? ` · Role: ${inv.roleOffered}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={busyId === inv.id}
                    onClick={() => void handleDeclineProjectInvite(inv)}
                    className="px-3 py-1.5 text-xs font-medium rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    disabled={busyId === inv.id}
                    onClick={() => void handleAcceptProjectInvite(inv)}
                    style={{ backgroundColor: theme.accent, color: '#FFFFFF' }}
                    className="px-3.5 py-1.5 text-xs font-medium rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {busyId === inv.id ? 'Joining...' : 'Accept & Open'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Connection Requests (Incoming & Outgoing) */}
      {(incomingRequests.length > 0 || outgoingRequests.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {incomingRequests.length > 0 && (
            <div
              className="studio-glass rounded-2xl border p-5 space-y-3"
              style={{ borderColor: theme.borderSubtle }}
            >
              <div className="text-sm font-semibold text-slate-900">
                Incoming Connection Requests ({incomingRequests.length})
              </div>
              <div className="space-y-2.5">
                {incomingRequests.map((req) => {
                  const sender = creatorMap.get(req.fromId);
                  const displayName = sender?.name || req.fromName;
                  const displayRole = sender?.creativeRole || req.fromRole || 'Creator';
                  const displayAvatar = sender?.avatarUrl || req.fromAvatar || '';
                  return (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <StudioAvatar name={displayName} avatarUrl={displayAvatar} size="sm" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate">
                            {displayName}
                          </div>
                          <div className="text-xs text-slate-500 truncate">{displayRole}</div>
                          {req.note && (
                            <p className="text-xs text-slate-600 mt-1 italic">“{req.note}”</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          disabled={busyId === req.id}
                          onClick={() => void handleRespondConnection(req.id, 'declined', displayName)}
                          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer"
                          title="Decline"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={busyId === req.id}
                          onClick={() => void handleRespondConnection(req.id, 'accepted', displayName)}
                          style={{ backgroundColor: theme.accent, color: '#FFFFFF' }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Accept
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {outgoingRequests.length > 0 && (
            <div
              className="studio-glass rounded-2xl border p-5 space-y-3"
              style={{ borderColor: theme.borderSubtle }}
            >
              <div className="text-sm font-semibold text-slate-900">
                Sent Requests ({outgoingRequests.length})
              </div>
              <div className="space-y-2.5">
                {outgoingRequests.map((req) => {
                  const target = creatorMap.get(req.toId);
                  const displayName = target?.name || req.toName;
                  const displayRole = target?.creativeRole || req.toRole || 'Creator';
                  const displayAvatar = target?.avatarUrl || req.toAvatar || '';
                  return (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <StudioAvatar name={displayName} avatarUrl={displayAvatar} size="sm" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate">
                            {displayName}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Pending · {displayRole}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={busyId === req.id}
                        onClick={() => void handleRemoveConnection(req.id)}
                        className="px-3 py-1.5 text-xs font-medium rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer shrink-0"
                      >
                        Cancel
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Accepted Connections */}
      <div
        className="studio-glass rounded-2xl border p-6 space-y-4"
        style={{ borderColor: theme.borderSubtle }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: theme.accentText }} />
            <h3 className="text-base font-semibold text-slate-900">
              My Connected Collaborators ({acceptedConnections.length})
            </h3>
          </div>
        </div>

        {acceptedConnections.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">
            You haven’t connected with anyone yet. Send a connection request below or share the
            Studio link with your friend so they appear in the creator directory.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {acceptedConnections.map((conn) => {
              const otherId = conn.fromId === currentUser.id ? conn.toId : conn.fromId;
              const other = creatorMap.get(otherId);
              const name = other?.name || (conn.fromId === currentUser.id ? conn.toName : conn.fromName);
              const role =
                other?.creativeRole ||
                (conn.fromId === currentUser.id ? conn.toRole : conn.fromRole) ||
                'Creator';
              const avatar =
                other?.avatarUrl ||
                (conn.fromId === currentUser.id ? conn.toAvatar : conn.fromAvatar) ||
                '';
              const isInviting = inviteOpenFor === otherId;

              return (
                <div
                  key={conn.id}
                  className="p-4 rounded-xl bg-white border border-slate-200 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <StudioAvatar name={name} avatarUrl={avatar} size="md" />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">{name}</div>
                        <div className="text-xs font-medium truncate" style={{ color: theme.accentText }}>
                          {role}
                        </div>
                        {other?.skillCategory && (
                          <div className="text-[11px] text-slate-500 truncate">
                            {other.skillCategory}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md bg-emerald-50 text-emerald-700 shrink-0">
                      <UserCheck className="w-3 h-3" />
                      Connected
                    </span>
                  </div>

                  {isInviting && other ? (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      {ownedProjects.length === 0 ? (
                        <p className="text-xs text-slate-600">
                          Create a project first to invite {name}.
                        </p>
                      ) : (
                        <>
                          <select
                            value={inviteProjectId || ownedProjects[0]?.id || ''}
                            onChange={(e) => setInviteProjectId(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white border border-slate-200"
                          >
                            {ownedProjects.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.title}
                              </option>
                            ))}
                          </select>
                          <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value as CreativeRole)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white border border-slate-200"
                          >
                            {CREATIVE_ROLES.map((r) => (
                              <option key={r} value={r}>
                                Role: {r}
                              </option>
                            ))}
                          </select>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setInviteOpenFor(null)}
                              className="px-2.5 py-1 text-xs rounded-lg text-slate-600 hover:bg-slate-200/60 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={busyId === `invite_${otherId}`}
                              onClick={() => void handleSendProjectInvite(other)}
                              style={{ backgroundColor: theme.accent, color: '#FFFFFF' }}
                              className="px-3 py-1 text-xs font-medium rounded-lg cursor-pointer"
                            >
                              {busyId === `invite_${otherId}` ? 'Sending...' : 'Send Invite'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setInviteProjectId(ownedProjects[0]?.id ?? '');
                          setInviteRole(other?.creativeRole || 'Animator');
                          setInviteOpenFor(otherId);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline cursor-pointer"
                        style={{ color: theme.accentText }}
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        Invite to Project
                      </button>
                      <button
                        type="button"
                        disabled={busyId === conn.id}
                        onClick={() => void handleRemoveConnection(conn.id)}
                        className="text-[11px] text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Real Creator Directory */}
      <div
        className="studio-glass rounded-2xl border p-6 space-y-4"
        style={{ borderColor: theme.borderSubtle }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Studio Creator Directory ({otherCreators.length})
            </h3>
            <p className="text-xs text-slate-500">
              Real people signed into Creative Studio. Connect with anyone to collaborate.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search creators by name or skill..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none w-56"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as CreativeRole | 'all')}
              className="px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 cursor-pointer"
            >
              <option value="all">All Creative Roles</option>
              {CREATIVE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {otherCreators.length === 0 ? (
          <div className="p-8 rounded-xl bg-white/80 border border-slate-200 text-center space-y-2">
            <p className="text-sm font-medium text-slate-700">No other creators visible yet</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Have your friend open the Shared Studio URL and click Sign in with Google. As soon
              as they sign in, they will appear right here in real time.
            </p>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(window.location.origin);
                setCopiedAppUrl(true);
                setTimeout(() => setCopiedAppUrl(false), 1800);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-xl bg-slate-900 text-white cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Studio Link
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherCreators.map((creator) => {
              const conn = connectionByOtherId.get(creator.id);
              const isConnected = conn?.status === 'accepted';
              const isPendingOutgoing =
                conn?.status === 'pending' && conn.fromId === currentUser.id;
              const isPendingIncoming =
                conn?.status === 'pending' && conn.toId === currentUser.id;

              return (
                <div
                  key={creator.id}
                  className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3">
                      <StudioAvatar
                        name={creator.name}
                        avatarUrl={creator.avatarUrl}
                        size="md"
                        tintBg={theme.accentSoft}
                        tintText={theme.accentText}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {creator.name}
                        </div>
                        <div className="text-xs font-medium truncate" style={{ color: theme.accentText }}>
                          {creator.creativeRole} · {creator.experienceLevel}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {creator.skillCategory}
                        </div>
                      </div>
                    </div>

                    {creator.bio && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {creator.bio}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    {isConnected ? (
                      <div className="flex items-center justify-between text-xs text-emerald-700 font-medium">
                        <span className="inline-flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" />
                          Connected
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setInviteProjectId(ownedProjects[0]?.id ?? '');
                            setInviteRole(creator.creativeRole);
                            setInviteOpenFor(creator.id);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="hover:underline cursor-pointer"
                          style={{ color: theme.accentText }}
                        >
                          Invite to Project
                        </button>
                      </div>
                    ) : isPendingIncoming && conn ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-600">Sent you a request</span>
                        <button
                          type="button"
                          disabled={busyId === conn.id}
                          onClick={() =>
                            void handleRespondConnection(conn.id, 'accepted', creator.name)
                          }
                          style={{ backgroundColor: theme.accent, color: '#FFFFFF' }}
                          className="px-3 py-1.5 text-xs font-medium rounded-xl cursor-pointer"
                        >
                          Accept Request
                        </button>
                      </div>
                    ) : isPendingOutgoing && conn ? (
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Request Pending
                        </span>
                        <button
                          type="button"
                          disabled={busyId === conn.id}
                          onClick={() => void handleRemoveConnection(conn.id)}
                          className="text-slate-500 hover:text-slate-800 underline cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={noteByCreator[creator.id] ?? ''}
                          onChange={(e) =>
                            setNoteByCreator((prev) => ({
                              ...prev,
                              [creator.id]: e.target.value,
                            }))
                          }
                          placeholder="Optional intro note..."
                          className="flex-1 min-w-0 px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={busyId === creator.id}
                          onClick={() => void handleSendConnection(creator)}
                          style={{ backgroundColor: theme.accent, color: '#FFFFFF' }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl cursor-pointer shrink-0 disabled:opacity-50"
                        >
                          {busyId === creator.id ? (
                            <Send className="w-3.5 h-3.5 animate-pulse" />
                          ) : (
                            <UserPlus className="w-3.5 h-3.5" />
                          )}
                          Connect
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
