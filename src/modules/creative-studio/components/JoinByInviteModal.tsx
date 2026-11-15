import { useEffect, useState, type FormEvent } from 'react';
import { KeyRound, X, AlertCircle, Sparkles } from 'lucide-react';
import {
  CREATIVE_ROLES,
  type CreativeRole,
  type ProjectInvite,
  type UserProfile,
} from '../types/studio';
import { studioService as firestoreStudio } from '../services/studioService';
import { GoogleSignInButton } from './GoogleSignInButton';

interface JoinByInviteModalProps {
  isOpen: boolean;
  initialCode?: string;
  currentUser: UserProfile | null;
  onClose: () => void;
  onJoinedProject: (projectId: string) => void;
}

export function JoinByInviteModal({
  isOpen,
  initialCode = '',
  currentUser,
  onClose,
  onJoinedProject,
}: JoinByInviteModalProps) {
  const [code, setCode] = useState(initialCode);
  const [inviteInfo, setInviteInfo] = useState<ProjectInvite | null>(null);
  const [selectedRole, setSelectedRole] = useState<CreativeRole>(
    currentUser?.creativeRole || 'Animator'
  );
  const [checking, setChecking] = useState(false);
  const [joining, setJoining] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    if (currentUser) {
      setSelectedRole(currentUser.creativeRole);
    }
    if (initialCode) {
      setCode(initialCode.toUpperCase());
      if (currentUser) {
        void runLookup(initialCode);
      }
    } else {
      setInviteInfo(null);
    }
  }, [isOpen, initialCode, currentUser]);

  if (!isOpen) return null;

  async function runLookup(targetCode: string) {
    const clean = targetCode.trim().toUpperCase();
    if (!clean) return;
    setErrorMsg(null);
    setChecking(true);
    try {
      const inv = await firestoreStudio.lookupInvite(clean);
      setInviteInfo(inv);
      if (inv.roleOffered) {
        setSelectedRole(inv.roleOffered);
      }
    } catch (err) {
      setInviteInfo(null);
      setErrorMsg(err instanceof Error ? err.message : 'Invite code not found.');
    } finally {
      setChecking(false);
    }
  }

  async function handleLookupSubmit(e: FormEvent) {
    e.preventDefault();
    await runLookup(code);
  }

  async function handleJoin() {
    if (!currentUser) return;
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    setErrorMsg(null);
    setJoining(true);
    try {
      const { projectId } = await firestoreStudio.redeemInvite(
        clean,
        currentUser,
        selectedRole
      );
      onJoinedProject(projectId);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to join with that invite code.');
    } finally {
      setJoining(false);
    }
  }

  async function handleSignInFirst() {
    setErrorMsg(null);
    setSigningIn(true);
    try {
      window.location.assign('/auth');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs overflow-y-auto"
      onClick={joining ? undefined : onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Join Project with Invite Code</h2>
              <p className="text-xs text-slate-500">
                Enter an 8-character invite code from your friend to join their shared cloud project
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={joining}
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!currentUser ? (
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <p className="text-sm font-semibold text-slate-900">
                Sign in with Google to redeem code {code || ''}
              </p>
              <p className="text-xs text-slate-600">
                Once signed in, you and your friend stay synced in the exact same cloud workspace.
              </p>
              {errorMsg && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
              <div className="flex justify-center pt-1">
                <GoogleSignInButton onClick={() => void handleSignInFirst()} loading={signingIn} />
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleLookupSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Enter invite code (e.g. X7K9M2PQ)"
                  className="flex-1 px-3.5 py-2.5 text-sm font-mono uppercase tracking-wider rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-slate-400"
                />
                <button
                  type="submit"
                  disabled={checking || !code.trim()}
                  className="px-4 py-2.5 text-xs font-medium rounded-xl bg-slate-900 text-white hover:bg-slate-800 cursor-pointer disabled:opacity-45 whitespace-nowrap"
                >
                  {checking ? 'Checking...' : 'Find Project'}
                </button>
              </form>

              {errorMsg && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {inviteInfo && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-slate-500">
                      <span>
                        {inviteInfo.projectPrimaryGenre || 'Creative Project'} ·{' '}
                        {inviteInfo.projectStatus || 'Active'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md ${
                          inviteInfo.status === 'pending'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {inviteInfo.status === 'pending' ? 'Active Invite' : 'Already Accepted'}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {inviteInfo.projectTitle}
                    </h3>
                    <div className="pt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span>
                        Host: <strong className="text-slate-900">{inviteInfo.ownerName}</strong>
                      </span>
                      {inviteInfo.roleOffered && (
                        <span className="inline-flex items-center gap-1 text-slate-800 font-medium">
                          <Sparkles className="w-3.5 h-3.5" />
                          Role Offered: {inviteInfo.roleOffered}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-700">
                      Your Creative Role on this Project (joining as {currentUser.name})
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as CreativeRole)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200"
                    >
                      {CREATIVE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      disabled={joining}
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-medium rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={joining || inviteInfo.status !== 'pending'}
                      onClick={() => void handleJoin()}
                      className="px-5 py-2 text-xs font-medium rounded-xl bg-slate-900 text-white hover:bg-slate-800 cursor-pointer disabled:opacity-45"
                    >
                      {joining ? 'Joining Project...' : 'Accept Invite & Open Workspace'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
