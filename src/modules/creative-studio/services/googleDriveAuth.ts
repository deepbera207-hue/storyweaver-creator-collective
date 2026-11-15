import {
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithPopup,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import { auth, formatFirebaseAuthError } from './firebaseClient';

export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
] as const;

const driveProvider = new GoogleAuthProvider();
for (const scope of GOOGLE_DRIVE_SCOPES) {
  driveProvider.addScope(scope);
}
driveProvider.setCustomParameters({
  prompt: 'consent select_account',
});

let isSigningIn = false;
// In-memory cache only (never stored in localStorage or sessionStorage)
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess?.(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        onAuthFailure?.(user);
      }
    } else {
      cachedAccessToken = null;
      onAuthFailure?.(null);
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = auth.currentUser
      ? await reauthenticateWithPopup(auth.currentUser, driveProvider).catch(async (err) => {
          const code = typeof err === 'object' && err !== null && 'code' in err ? String(err.code) : '';
          if (code === 'auth/user-mismatch') {
            return signInWithPopup(auth, driveProvider);
          }
          throw err;
        })
      : await signInWithPopup(auth, driveProvider);

    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not obtain a Google Drive access token. Please allow Google Drive permissions and try again.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (err) {
    throw new Error(formatFirebaseAuthError(err));
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getCurrentGoogleUser = (): User | null => {
  return auth.currentUser;
};

export const clearCachedAccessToken = (): void => {
  cachedAccessToken = null;
};

export const logoutGoogleDrive = async (): Promise<void> => {
  cachedAccessToken = null;
};
