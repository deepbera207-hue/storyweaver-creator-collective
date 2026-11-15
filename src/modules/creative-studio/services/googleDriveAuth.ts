/**
 * Google Drive access for importing files into Crea-Link projects.
 *
 * The original module obtained Drive tokens through Firebase Google sign-in.
 * Crea-Link now uses a single Lovable Cloud account, so Drive access is
 * requested separately with Google Identity Services. This requires a Google
 * OAuth Web Client ID in VITE_GOOGLE_DRIVE_CLIENT_ID (a public identifier).
 * Without it, Drive import shows a clear "not configured" message.
 */
export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
] as const;

type TokenClient = { requestAccessToken: (o?: { prompt?: string }) => void };
type GoogleOAuth = {
  accounts: {
    oauth2: {
      initTokenClient: (cfg: {
        client_id: string;
        scope: string;
        callback: (r: { access_token?: string; error?: string; error_description?: string }) => void;
        error_callback?: (e: { message?: string }) => void;
      }) => TokenClient;
    };
  };
};

type DriveUser = { email?: string; displayName?: string };
const DRIVE_USER: DriveUser = { email: 'Google Drive connected', displayName: 'Google Drive' };
let cachedAccessToken: string | null = null;

export function isDriveConfigured(): boolean {
  return Boolean(import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID);
}

function loadGis(): Promise<GoogleOAuth> {
  const w = window as unknown as { google?: GoogleOAuth };
  if (w.google?.accounts?.oauth2) return Promise.resolve(w.google);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => (w.google ? resolve(w.google) : reject(new Error('Google sign-in failed to load.')));
    s.onerror = () => reject(new Error('Google sign-in failed to load.'));
    document.head.appendChild(s);
  });
}

export const googleSignIn = async (): Promise<{ user: DriveUser; accessToken: string }> => {
  const clientId = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID as string | undefined;
  if (!clientId) {
    throw new Error(
      'Google Drive import is not configured yet. Upload files from your device instead, or ask the app owner to add a Google Drive client ID.'
    );
  }
  const google = await loadGis();
  const token = await new Promise<string>((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_DRIVE_SCOPES.join(' '),
      callback: (r) => (r.access_token ? resolve(r.access_token) : reject(new Error(r.error_description || 'Google Drive access was not granted.'))),
      error_callback: (e) => reject(new Error(e.message || 'Google Drive access was cancelled.')),
    });
    client.requestAccessToken({ prompt: 'consent' });
  });
  cachedAccessToken = token;
  return { user: DRIVE_USER, accessToken: token };
};

export const getAccessToken = async (): Promise<string | null> => cachedAccessToken;
export const getCurrentGoogleUser = (): DriveUser | null => (cachedAccessToken ? DRIVE_USER : null);
export const clearCachedAccessToken = (): void => {
  cachedAccessToken = null;
};
export const logoutGoogleDrive = async (): Promise<void> => {
  cachedAccessToken = null;
};
export const initAuth = (
  onSuccess?: (user: DriveUser, token: string) => void,
  onFailure?: (user: DriveUser | null) => void
) => {
  if (cachedAccessToken) onSuccess?.(DRIVE_USER, cachedAccessToken);
  else onFailure?.(null);
  return () => {};
};
