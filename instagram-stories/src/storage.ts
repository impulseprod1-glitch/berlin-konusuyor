import { randomUUID } from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

/*
 * Firebase Storage (the site's own bucket) does two jobs: it hosts the story
 * JPEGs, because Instagram only accepts images by public URL, and it carries
 * state from the 08:10 run to the 09:00 run (manifest, veto decision and
 * per-slide "published" markers). Everything lives under stories/<date>/.
 *
 * The Admin SDK bypasses storage.rules; images become fetchable through a
 * random download token in their URL, the same mechanism the Firebase web
 * SDK uses for getDownloadURL().
 */

const BUCKET = process.env.FIREBASE_STORAGE_BUCKET || 'berlin-konusuyor.firebasestorage.app';
const dir = (isoDate: string) => `stories/${isoDate}/`;

function bucket() {
  if (getApps().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    initializeApp({
      storageBucket: BUCKET,
      // Without a key (emulator, local tests) the SDK falls back to default credentials.
      ...(serviceAccount ? { credential: cert(JSON.parse(serviceAccount)) } : {}),
    });
  }
  return getStorage().bucket();
}

/** True when the service account can see the bucket (connection check). */
export async function bucketReachable(): Promise<boolean> {
  const [found] = await bucket().exists();
  return found;
}

export async function uploadImage(isoDate: string, name: string, jpeg: Buffer): Promise<string> {
  // A fresh name per upload: a re-rendered slide never reuses a cached URL.
  const path = `${dir(isoDate)}${name}-${randomUUID().slice(0, 8)}.jpg`;
  const token = randomUUID();
  await bucket()
    .file(path)
    .save(jpeg, {
      resumable: false,
      contentType: 'image/jpeg',
      metadata: { cacheControl: 'public, max-age=86400', metadata: { firebaseStorageDownloadTokens: token } },
    });
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

export async function saveJson(isoDate: string, name: string, data: unknown): Promise<void> {
  await bucket()
    .file(`${dir(isoDate)}${name}.json`)
    .save(JSON.stringify(data, null, 2), { resumable: false, contentType: 'application/json' });
}

export async function loadJson<T>(isoDate: string, name: string): Promise<T | null> {
  const file = bucket().file(`${dir(isoDate)}${name}.json`);
  const [found] = await file.exists();
  if (!found) return null;
  const [content] = await file.download();
  return JSON.parse(content.toString('utf8')) as T;
}

export async function exists(isoDate: string, name: string): Promise<boolean> {
  const [found] = await bucket().file(`${dir(isoDate)}${name}.json`).exists();
  return found;
}

/** Deletes editions older than `days`. Old story images serve no one. */
export async function deleteOlderThan(days: number, now: Date): Promise<number> {
  const cutoff = now.getTime() - days * 86_400_000;
  const [files] = await bucket().getFiles({ prefix: 'stories/' });
  const stale = files.filter((f) => Date.parse(String(f.metadata.timeCreated)) < cutoff);
  await Promise.all(stale.map((f) => f.delete({ ignoreNotFound: true })));
  return stale.length;
}
