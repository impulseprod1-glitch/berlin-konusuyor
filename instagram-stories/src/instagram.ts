import { env } from './env.ts';
import { sleep } from './time.ts';

/*
 * Instagram content publishing is a two-step API: create a media container
 * from a public image URL, wait until Instagram has fetched it, then publish.
 * Stories appear in publishing order, so callers publish strictly in sequence.
 */

export class GraphError extends Error {
  constructor(
    message: string,
    readonly code?: number,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'GraphError';
  }

  /** Error 190: the token expired or was revoked – needs a human, not a retry. */
  get isAuth(): boolean {
    return this.code === 190;
  }

  /** Rate limits and transient faults: nothing was published, trying again is safe. */
  get isRetryable(): boolean {
    return [1, 2, 4, 17, 32, 613].includes(this.code ?? -1);
  }
}

const base = () => (process.env.IG_GRAPH_BASE || 'https://graph.facebook.com/v26.0').replace(/\/$/, '');

/** Instagram Login tokens talk to graph.instagram.com, Facebook Login tokens to graph.facebook.com. */
export const usesInstagramLogin = () => base().includes('graph.instagram.com');

export async function graph<T>(method: 'GET' | 'POST', path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${base()}${path}`);
  const all = { ...params, access_token: env('IG_ACCESS_TOKEN') };
  let init: RequestInit = { method };
  if (method === 'GET') Object.entries(all).forEach(([k, v]) => url.searchParams.set(k, v));
  else init = { method, body: new URLSearchParams(all) };

  const res = await fetch(url, init);
  const json = (await res.json().catch(() => ({}))) as { error?: { message?: string; code?: number } } & T;
  if (!res.ok || json.error) {
    throw new GraphError(json.error?.message ?? `HTTP ${res.status}`, json.error?.code, res.status);
  }
  return json;
}

async function retrying<T>(what: string, fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (err) {
      if (!(err instanceof GraphError) || !err.isRetryable || i >= attempts) throw err;
      console.warn(`${what} failed (${err.message}), retry ${i}/${attempts - 1}`);
      await sleep(10_000 * i);
    }
  }
}

async function waitUntilReady(containerId: string): Promise<void> {
  for (let i = 0; i < 30; i++) {
    const { status_code } = await graph<{ status_code?: string }>('GET', `/${containerId}`, { fields: 'status_code' });
    if (status_code === 'FINISHED') return;
    if (status_code === 'ERROR' || status_code === 'EXPIRED') {
      throw new GraphError(`Story container ${containerId} ended in status ${status_code}`);
    }
    await sleep(3_000);
  }
  throw new GraphError(`Story container ${containerId} was not ready after 90 s`);
}

/** Publishes one story image and returns the Instagram media id. */
export async function publishStory(imageUrl: string): Promise<string> {
  const igUser = env('IG_USER_ID');
  const container = await retrying('Create story container', () =>
    graph<{ id: string }>('POST', `/${igUser}/media`, { image_url: imageUrl, media_type: 'STORIES' }),
  );
  await waitUntilReady(container.id);
  // Only rate-limit errors are retried here: a timeout after a successful
  // publish would otherwise post the same story twice.
  const published = await retrying('Publish story', () =>
    graph<{ id: string }>('POST', `/${igUser}/media_publish`, { creation_id: container.id }),
  );
  return published.id;
}
