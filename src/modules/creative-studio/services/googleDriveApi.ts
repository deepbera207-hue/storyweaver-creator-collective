import { clearCachedAccessToken, getAccessToken } from './googleDriveAuth';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string | undefined;
  modifiedTime?: string | undefined;
  thumbnailLink?: string | undefined;
  iconLink?: string | undefined;
  webViewLink?: string | undefined;
}

export type DriveFileFilter = 'all' | 'image' | 'video' | 'audio' | 'document';

export class DriveAuthError extends Error {
  constructor(message = 'Please sign in with Google to access Google Drive.') {
    super(message);
    this.name = 'DriveAuthError';
  }
}

async function requireToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new DriveAuthError();
  }
  return token;
}

export async function listDriveFiles(options: {
  query?: string | undefined;
  filter?: DriveFileFilter | undefined;
  pageToken?: string | undefined;
  pageSize?: number | undefined;
}): Promise<{ files: DriveFileItem[]; nextPageToken?: string | undefined }> {
  const token = await requireToken();

  const clauses: string[] = [
    'trashed = false',
    "mimeType != 'application/vnd.google-apps.folder'",
  ];

  if (options.filter === 'image') {
    clauses.push("mimeType contains 'image/'");
  } else if (options.filter === 'video') {
    clauses.push("mimeType contains 'video/'");
  } else if (options.filter === 'audio') {
    clauses.push("mimeType contains 'audio/'");
  } else if (options.filter === 'document') {
    clauses.push(
      "(mimeType = 'application/pdf' or mimeType = 'text/plain' or mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')"
    );
  }

  if (options.query && options.query.trim()) {
    const escaped = options.query.trim().replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    clauses.push(`name contains '${escaped}'`);
  }

  const params = new URLSearchParams({
    q: clauses.join(' and '),
    fields:
      'nextPageToken, files(id, name, mimeType, size, modifiedTime, thumbnailLink, iconLink, webViewLink)',
    orderBy: 'modifiedTime desc',
    pageSize: String(options.pageSize ?? 24),
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  });

  if (options.pageToken) {
    params.set('pageToken', options.pageToken);
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    clearCachedAccessToken();
    throw new DriveAuthError('Your Google Drive session expired. Please sign in with Google again.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || `Unable to list Google Drive files (${res.status}).`);
  }

  return {
    files: Array.isArray(data.files) ? (data.files as DriveFileItem[]) : [],
    nextPageToken: typeof data.nextPageToken === 'string' ? data.nextPageToken : undefined,
  };
}

export async function uploadBlobToDrive(options: {
  fileName: string;
  mimeType: string;
  content: Blob | string;
}): Promise<DriveFileItem> {
  const token = await requireToken();

  const metadata = {
    name: options.fileName,
    mimeType: options.mimeType,
  };

  const blob =
    typeof options.content === 'string'
      ? new Blob([options.content], { type: options.mimeType })
      : options.content;

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob, options.fileName);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  if (res.status === 401) {
    clearCachedAccessToken();
    throw new DriveAuthError('Your Google Drive session expired. Please sign in with Google again.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || `Failed to save file to Google Drive (${res.status}).`);
  }

  return data as DriveFileItem;
}

export async function uploadStudioUrlToDrive(options: {
  sourceUrl: string;
  fileName: string;
  mimeType: string;
}): Promise<DriveFileItem> {
  const fileRes = await fetch(options.sourceUrl);
  if (!fileRes.ok) {
    throw new Error('Could not read the local studio file for Google Drive upload.');
  }
  const blob = await fileRes.blob();
  return uploadBlobToDrive({
    fileName: options.fileName,
    mimeType: options.mimeType || blob.type || 'application/octet-stream',
    content: blob,
  });
}
