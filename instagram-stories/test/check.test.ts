import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { instagramCandidates, missingPermissions, runConnectionCheck } from '../src/check.ts';

const SECRETS = ['IG_ACCESS_TOKEN', 'IG_USER_ID', 'IG_GRAPH_BASE', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID', 'FIREBASE_SERVICE_ACCOUNT', 'ANTHROPIC_API_KEY', 'GITHUB_STEP_SUMMARY'];

describe('helpers', () => {
  it('finds Instagram accounts behind Facebook Pages', () => {
    expect(
      instagramCandidates([
        { name: 'Berlin Konuşuyor', instagram_business_account: { id: '1784', username: 'berlin.konusuyor' } },
        { name: 'Page without Instagram' },
      ]),
    ).toEqual([{ page: 'Berlin Konuşuyor', id: '1784', username: 'berlin.konusuyor' }]);
  });

  it('lists required permissions that are missing or declined', () => {
    expect(
      missingPermissions([
        { permission: 'instagram_basic', status: 'granted' },
        { permission: 'instagram_content_publish', status: 'declined' },
        { permission: 'pages_show_list', status: 'granted' },
      ]),
    ).toEqual(['instagram_content_publish', 'pages_read_engagement']);
  });
});

describe('runConnectionCheck', () => {
  let saved: Record<string, string | undefined>;
  beforeEach(() => {
    saved = Object.fromEntries(SECRETS.map((k) => [k, process.env[k]]));
    SECRETS.forEach((k) => delete process.env[k]);
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => {
    Object.entries(saved).forEach(([k, v]) => (v === undefined ? delete process.env[k] : (process.env[k] = v)));
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('reports every missing secret without calling any service', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    expect(await runConnectionCheck()).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
    const output = vi.mocked(console.log).mock.calls.flat().join('\n');
    for (const name of ['IG_ACCESS_TOKEN', 'TELEGRAM_BOT_TOKEN', 'FIREBASE_SERVICE_ACCOUNT', 'ANTHROPIC_API_KEY']) {
      expect(output).toContain(name);
    }
  });

  it('suggests IG_USER_ID from the token and never prints the token', async () => {
    process.env.IG_ACCESS_TOKEN = 'secret-token-value';
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: URL) => {
        const path = new URL(url).pathname;
        const body = path.endsWith('/me/permissions')
          ? { data: ['instagram_basic', 'instagram_content_publish', 'pages_show_list', 'pages_read_engagement'].map((permission) => ({ permission, status: 'granted' })) }
          : path.endsWith('/me/accounts')
            ? { data: [{ name: 'Berlin Konuşuyor', instagram_business_account: { id: '17841400000000000', username: 'berlin.konusuyor' } }] }
            : { name: 'Story Bot' };
        return new Response(JSON.stringify(body), { status: 200 });
      }),
    );
    await runConnectionCheck();
    const output = vi.mocked(console.log).mock.calls.flat().join('\n');
    expect(output).toContain('`17841400000000000`');
    expect(output).toContain('Gerekli tüm izinler verilmiş');
    expect(output).not.toContain('secret-token-value');
  });
});
