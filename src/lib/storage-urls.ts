import { supabase } from "@/integrations/supabase/client";

/**
 * Files live in private storage buckets. Database rows store a stable
 * reference ("sb://<bucket>/<path>") and this helper turns references into
 * short-lived signed URLs, cached in memory.
 */
const SIGN_SECONDS = 60 * 60 * 24 * 6;
const cache = new Map<string, { url: string; expires: number }>();

export function storageRef(bucket: string, path: string) {
  return `sb://${bucket}/${path}`;
}

export function parseStorageRef(ref: string): { bucket: string; path: string } | null {
  if (!ref?.startsWith("sb://")) return null;
  const rest = ref.slice(5);
  const i = rest.indexOf("/");
  if (i < 0) return null;
  return { bucket: rest.slice(0, i), path: rest.slice(i + 1) };
}

export async function resolveStorageUrls(refs: (string | undefined | null)[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const byBucket = new Map<string, string[]>();
  const now = Date.now();
  for (const ref of refs) {
    if (!ref) continue;
    const parsed = parseStorageRef(ref);
    if (!parsed) {
      out.set(ref, ref);
      continue;
    }
    const hit = cache.get(ref);
    if (hit && hit.expires > now) {
      out.set(ref, hit.url);
      continue;
    }
    const list = byBucket.get(parsed.bucket) ?? [];
    if (!list.includes(parsed.path)) list.push(parsed.path);
    byBucket.set(parsed.bucket, list);
  }
  await Promise.all(
    [...byBucket.entries()].map(async ([bucket, paths]) => {
      const { data } = await supabase.storage.from(bucket).createSignedUrls(paths, SIGN_SECONDS);
      for (const item of data ?? []) {
        if (!item.signedUrl || !item.path) continue;
        const ref = storageRef(bucket, item.path);
        cache.set(ref, { url: item.signedUrl, expires: now + (SIGN_SECONDS - 600) * 1000 });
        out.set(ref, item.signedUrl);
      }
    }),
  );
  return out;
}

export async function resolveStorageUrl(ref: string | undefined | null): Promise<string> {
  if (!ref) return "";
  const map = await resolveStorageUrls([ref]);
  return map.get(ref) ?? "";
}

export function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-120) || "file";
}

export async function uploadToBucket(bucket: string, path: string, file: Blob, contentType?: string) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: contentType || (file as File).type || "application/octet-stream",
  });
  if (error) throw new Error(error.message);
  return storageRef(bucket, path);
}
