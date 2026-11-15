import { useEffect, useState, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import { X, HardDrive, LogOut, Check, ShieldCheck, Save } from 'lucide-react';
import {
  CREATIVE_ROLES,
  type CreativeRole,
  type ExperienceLevel,
  type UserProfile,
} from '../types/studio';
import { StudioAvatar } from './StudioAvatar';
import { GoogleSignInButton } from './GoogleSignInButton';
import {
  clearCachedAccessToken,
  getAccessToken,
  getCurrentGoogleUser,
  googleSignIn,
  initAuth,
  logoutGoogleDrive,
} from '../services/googleDriveAuth';
import { firestoreStudio } from '../services/firestoreStudio';
import { studioSignOut } from '../services/firebaseClient';

interface CreatorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  firebaseUser: User | null;
  currentUser: UserProfile;
  onProfileUpdated: (profile: UserProfile) => void;
  onOpenBackendGuide: () => void;
}

const EXPERIENCE_LEVELS: ExperienceLevel[] = ['Emerging', 'Intermediate', 'Senior', 'Lead'];

export function CreatorProfileModal({
  isOpen,
  onClose,
  firebaseUser,
  currentUser,
  onProfileUpdated,
  onOpenBackendGuide,
}: CreatorProfileModalProps) {
  const [name, setName] = useState(currentUser.name);
  const [creativeRole, setCreativeRole] = useState<CreativeRole>(currentUser.creativeRole);
  const [skillCategory, setSkillCategory] = useState(currentUser.skillCategory);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    currentUser.experienceLevel
  );
  const [bio, setBio] = useState(currentUser.bio);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedBanner, setSavedBanner] = useState(false);

  const [driveConnectedEmail, setDriveConnectedEmail] = useState<string | null>(null);
  const [driveBusy, setDriveBusy] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName(currentUser.name);
    setCreativeRole(currentUser.creativeRole);
    setSkillCategory(currentUser.skillCategory);
    setExperienceLevel(currentUser.experienceLevel);
    setBio(currentUser.bio);
    setErrorMsg(null);
    setSavedBanner(false);

    const unsubscribe = initAuth(
      (user) => {
        setDriveConnectedEmail(user.email || user.displayName || 'Connected');
      },
      () => {
        setDriveConnectedEmail(null);
      }
    );
    void getAccessToken().then((token) => {
      const user = getCurrentGoogleUser();
      if (token && user) {
        setDriveConnectedEmail(user.email || user.displayName || 'Connected');
      } else {
        setDriveConnectedEmail(null);
      }
    });
    return () => unsubscribe();
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  async function handleConnectDrive() {
    setDriveError(null);
    setDriveBusy(true);
    try {
      const { user } = await googleSignIn();
      setDriveConnectedEmail(user.email || user.displayName || 'Connected');
    } catch (err) {
      setDriveError(err instanceof Error ? err.message : 'Unable to connect Google Drive.');
    } finally {
      setDriveBusy(false);
    }
  }

  async function handleDisconnectDrive() {
    setDriveBusy(true);
    try {
      await logoutGoogleDrive();
      setDriveConnectedEmail(null);
    } finally {
      setDriveBusy(false);
    }
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (!firebaseUser || !name.trim()) return;
    setErrorMsg(null);
    setSavedBanner(false);
    setBusy(true);
    try {
      const updated = await firestoreStudio.updateMyProfile(firebaseUser, {
        name: name.trim(),
        creativeRole,
        skillCategory: skillCategory.trim() || `${creativeRole} Craft`,
        experienceLevel,
        bio: bio.trim(),
      });
      onProfileUpdated(updated);
      setSavedBanner(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOutStudio() {
    clearCachedAccessToken();
    await studioSignOut();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-white/95 border border-slate-200 shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <StudioAvatar name={currentUser.name} avatarUrl={currentUser.avatarUrl} size="sm" />
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-900 truncate">
                Your Creator Profile & Account
              </h2>
              <p className="text-xs text-slate-500 truncate">
                Signed in as {firebaseUser?.email || currentUser.email || currentUser.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Profile Editor */}
          <form
            onSubmit={handleSaveProfile}
            className="p-5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">
                Public Studio Profile
              </span>
              <span className="text-[11px] text-slate-500">
                Visible in Connect People directory (your email stays private)
              </span>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMsg}
              </div>
            )}
            {savedBanner && (
              <div className="flex items-center gap-1.5 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
                <Check className="w-3.5 h-3.5" />
                Profile saved and synced across devices.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Primary Creative Role
                </label>
                <select
                  value={creativeRole}
                  onChange={(e) => setCreativeRole(e.target.value as CreativeRole)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200"
                >
                  {CREATIVE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200"
                >
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Skill Category
                </label>
                <input
                  type="text"
                  value={skillCategory}
                  onChange={(e) => setSkillCategory(e.target.value)}
                  placeholder="e.g., 2D Frame-by-Frame, Foley"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Creative Bio
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell collaborators what you love creating..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={busy || !name.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-slate-900 text-white hover:bg-slate-800 cursor-pointer disabled:opacity-45"
              >
                <Save className="w-3.5 h-3.5" />
                {busy ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>

          {/* Optional Google Drive Connection */}
          <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-700">
                <HardDrive className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900">
                  Google Drive (Optional Media & Script Import)
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {driveConnectedEmail
                    ? `Drive active for ${driveConnectedEmail}`
                    : 'Connect Google Drive to import or save photos, videos, and scripts'}
                </div>
                {driveError && <div className="text-[11px] text-rose-600 mt-0.5">{driveError}</div>}
              </div>
            </div>
            {driveConnectedEmail ? (
              <button
                type="button"
                disabled={driveBusy}
                onClick={() => void handleDisconnectDrive()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Disconnect Drive
              </button>
            ) : (
              <GoogleSignInButton
                onClick={() => void handleConnectDrive()}
                loading={driveBusy}
                label="Connect Drive"
              />
            )}
          </div>

          {/* Account & Storage Controls */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenBackendGuide();
              }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Cloud Sync & Security Guide
            </button>

            <button
              type="button"
              onClick={() => void handleSignOutStudio()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
