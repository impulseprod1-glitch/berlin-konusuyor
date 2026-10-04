import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, query, serverTimestamp, setDoc, updateDoc, where,
} from 'firebase/firestore';
import { getBytes, ref, uploadBytes } from 'firebase/storage';

/*
 * Each block mirrors a write the app really makes (see the file named in the
 * describe title), plus the abuse that rule exists to stop.
 */

let env;

const ADMIN = { email: 'oarslanerbln@gmail.com', email_verified: true };

const anon = () => env.unauthenticatedContext().firestore();
const user = (uid = 'alice', claims = { email: `${uid}@example.com`, email_verified: true }) =>
  env.authenticatedContext(uid, claims).firestore();
const admin = () => env.authenticatedContext('owner', ADMIN).firestore();

async function seed(path, data) {
  await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), path), data));
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-berlin-konusuyor',
    firestore: { rules: readFileSync('../../firestore.rules', 'utf8') },
    storage: { rules: readFileSync('../../storage.rules', 'utf8') },
  });
});

afterAll(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.clearStorage();
});

describe('admin identity', () => {
  it('lets the verified owner write news', () =>
    assertSucceeds(setDoc(doc(admin(), 'news/n1'), { title: 'x' })));

  it('rejects the old test@admin.com backdoor', () =>
    assertFails(setDoc(doc(user('mallory', { email: 'test@admin.com', email_verified: true }), 'news/n1'), { title: 'x' })));

  it('rejects the owner address when it is not verified', () =>
    assertFails(setDoc(doc(user('mallory', { email: ADMIN.email, email_verified: false }), 'news/n1'), { title: 'x' })));

  it('keeps news and events publicly readable', async () => {
    await seed('news/n1', { title: 'x' });
    await assertSucceeds(getDoc(doc(anon(), 'news/n1')));
    await assertSucceeds(getDocs(collection(anon(), 'events')));
  });
});

describe('chat (src/features/chat.js)', () => {
  const message = (uid) => ({
    text: 'Merhaba', image: null, senderId: uid, senderName: 'Alice', senderPhoto: '', timestamp: serverTimestamp(),
  });

  it('lets a signed-in user post as themselves', () =>
    assertSucceeds(addDoc(collection(user('alice'), 'chat_genel'), message('alice'))));

  it('rejects posting in someone else\'s name', () =>
    assertFails(addDoc(collection(user('alice'), 'chat_genel'), message('bob'))));

  it('rejects signed-out posts and unknown rooms', async () => {
    await assertFails(addDoc(collection(anon(), 'chat_genel'), message('alice')));
    await assertFails(addDoc(collection(user('alice'), 'chat_spam'), message('alice')));
  });

  it('rejects oversized messages', () =>
    assertFails(addDoc(collection(user('alice'), 'chat_genel'), { ...message('alice'), text: 'x'.repeat(1001) })));

  it('keeps rooms readable, but only admins delete', async () => {
    await seed('chat_genel/m1', { text: 'x', senderId: 'bob' });
    await assertSucceeds(getDocs(collection(anon(), 'chat_genel')));
    await assertFails(deleteDoc(doc(user('alice'), 'chat_genel/m1')));
    await assertSucceeds(deleteDoc(doc(admin(), 'chat_genel/m1')));
  });
});

describe('forum (src/features/forum.js)', () => {
  const question = { name: 'Anonim', text: 'Soru?', category: 'Genel', time: '2026-10-04T10:00:00Z', karma: 0, replies: [], status: 'pending' };

  it('accepts anonymous questions into moderation only', async () => {
    await assertSucceeds(addDoc(collection(anon(), 'forum'), question));
    await assertFails(addDoc(collection(anon(), 'forum'), { ...question, status: 'approved' }));
    await assertFails(addDoc(collection(anon(), 'forum'), { ...question, karma: 99 }));
  });

  it('shows approved posts and hides the moderation queue', async () => {
    await seed('forum/a', { ...question, status: 'approved' });
    await seed('forum/p', question);
    await assertSucceeds(getDocs(query(collection(anon(), 'forum'), where('status', '==', 'approved'))));
    await assertFails(getDoc(doc(anon(), 'forum/p')));
    await assertSucceeds(getDocs(query(collection(admin(), 'forum'), where('status', '==', 'pending'))));
  });

  it('allows +1 votes and one appended reply, nothing else', async () => {
    const existing = { name: 'Bob', text: 'İlk cevap', time: '2026-10-04T11:00:00Z' };
    await seed('forum/a', { ...question, status: 'approved', replies: [existing] });
    const reply = { name: 'Ali', text: 'Cevap', time: '2026-10-04T12:00:00Z' };

    await assertSucceeds(updateDoc(doc(anon(), 'forum/a'), { karma: increment(1) }));
    await assertFails(updateDoc(doc(anon(), 'forum/a'), { karma: increment(50) }));
    await assertSucceeds(updateDoc(doc(anon(), 'forum/a'), { replies: [existing, reply] }));
    await assertFails(updateDoc(doc(anon(), 'forum/a'), { replies: [reply] }));
    await assertFails(updateDoc(doc(anon(), 'forum/a'), { text: 'değiştirildi' }));
    await assertFails(updateDoc(doc(anon(), 'forum/a'), { status: 'approved', karma: 0 }));
  });

  it('does not let visitors interact with pending posts', async () => {
    await seed('forum/p', question);
    await assertFails(updateDoc(doc(anon(), 'forum/p'), { karma: increment(1) }));
  });
});

describe('polls (src/features/extras.js)', () => {
  beforeEach(() => seed('polls/p1', { question: 'Q', options: [{ text: 'A', votes: 0 }, { text: 'B', votes: 0 }] }));

  it('lets visitors vote', () =>
    assertSucceeds(updateDoc(doc(anon(), 'polls/p1'), { options: [{ text: 'A', votes: 1 }, { text: 'B', votes: 0 }] })));

  it('rejects rewriting the question or dropping options', async () => {
    await assertFails(updateDoc(doc(anon(), 'polls/p1'), { question: 'Hacked' }));
    await assertFails(updateDoc(doc(anon(), 'polls/p1'), { options: [{ text: 'A', votes: 1 }] }));
  });
});

describe('jobs (src/features/jobs.js)', () => {
  const job = (uid) => ({
    title: 'Garson', company: 'Cafe', location: 'Kreuzberg', type: 'Minijob', contact: 'a@b.de',
    postedBy: uid, status: 'pending', createdAt: serverTimestamp(),
  });

  it('accepts pending listings from signed-in users', () =>
    assertSucceeds(addDoc(collection(user('alice'), 'jobs'), job('alice'))));

  it('rejects anonymous, self-approved or impersonated listings', async () => {
    await assertFails(addDoc(collection(anon(), 'jobs'), job('alice')));
    await assertFails(addDoc(collection(user('alice'), 'jobs'), { ...job('alice'), status: 'approved' }));
    await assertFails(addDoc(collection(user('alice'), 'jobs'), job('bob')));
  });
});

describe('bookmarks (src/features/news.js, profile.js)', () => {
  const bookmark = (uid) => ({ userId: uid, title: 'Haber', source: 'rbb24', dateAdded: serverTimestamp() });

  it('lets users manage their own bookmarks', async () => {
    const db = user('alice');
    await assertSucceeds(setDoc(doc(db, 'bookmarks/alice_Haber'), bookmark('alice')));
    await assertSucceeds(getDocs(query(collection(db, 'bookmarks'), where('userId', '==', 'alice'))));
    await assertSucceeds(deleteDoc(doc(db, 'bookmarks/alice_Haber')));
  });

  it('keeps bookmarks private', async () => {
    await seed('bookmarks/bob_Haber', { userId: 'bob', title: 'Haber', source: 'x' });
    await assertFails(getDoc(doc(user('alice'), 'bookmarks/bob_Haber')));
    await assertFails(setDoc(doc(user('alice'), 'bookmarks/bob_Other'), bookmark('bob')));
  });
});

describe('push tokens (src/features/notifications.js)', () => {
  it('lets a browser register its own token', () =>
    assertSucceeds(setDoc(doc(anon(), 'fcm_tokens/tok123'), { token: 'tok123', email: 'anonymous', updatedAt: '2026-10-04T10:00:00Z' })));

  it('rejects someone else\'s email and keeps the list private', async () => {
    await assertFails(setDoc(doc(user('alice'), 'fcm_tokens/tok1'), { token: 'tok1', email: 'bob@example.com', updatedAt: 'x' }));
    await seed('fcm_tokens/tok2', { token: 'tok2', email: 'bob@example.com', updatedAt: 'x' });
    await assertFails(getDocs(collection(user('alice'), 'fcm_tokens')));
    await assertSucceeds(getDocs(collection(admin(), 'fcm_tokens')));
  });
});

describe('closed by default', () => {
  it('hides subscribers and anything unlisted, even from signed-in users', async () => {
    await seed('subscribers/s1', { email: 'x@y.de' });
    await seed('users/u1', { name: 'x' });
    await assertFails(getDoc(doc(user('alice'), 'subscribers/s1')));
    await assertFails(getDoc(doc(user('alice'), 'users/u1')));
    await assertFails(setDoc(doc(user('alice'), 'notifications_queue/q1'), { title: 'spam' }));
  });
});

describe('storage (src/admin.js, src/features/chat.js)', () => {
  const png = new Uint8Array([137, 80, 78, 71]);

  it('lets the admin upload images that everyone can view', async () => {
    const adminStorage = env.authenticatedContext('owner', ADMIN).storage();
    await assertSucceeds(uploadBytes(ref(adminStorage, 'news/a.png'), png, { contentType: 'image/png' }));
    await assertSucceeds(getBytes(ref(env.unauthenticatedContext().storage(), 'news/a.png')));
  });

  it('rejects uploads from other users and non-image files', async () => {
    const userStorage = env.authenticatedContext('alice', { email: 'alice@example.com', email_verified: true }).storage();
    await assertFails(uploadBytes(ref(userStorage, 'chat/genel/a.png'), png, { contentType: 'image/png' }));
    const adminStorage = env.authenticatedContext('owner', ADMIN).storage();
    await assertFails(uploadBytes(ref(adminStorage, 'news/a.html'), png, { contentType: 'text/html' }));
  });
});
