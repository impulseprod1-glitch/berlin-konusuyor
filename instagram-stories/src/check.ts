import { appendFileSync } from 'node:fs';
import { graph, GraphError, usesInstagramLogin } from './instagram.ts';
import { bucketReachable } from './storage.ts';
import { botUsername, sendMessage } from './telegram.ts';

/*
 * Connection check for the story bot (`npm run check`, workflow
 * "Stories: connection check"). It tells the owner what works and what is
 * still missing, and finds IG_USER_ID so nobody has to dig through the Graph
 * API Explorer. It never prints a secret, and the only thing it writes is one
 * test message to the configured Telegram chat.
 */

type Status = 'ok' | 'warn' | 'fail';
interface Row {
  status: Status;
  item: string;
  detail: string;
}

export const REQUIRED_PERMISSIONS = ['instagram_basic', 'instagram_content_publish', 'pages_show_list', 'pages_read_engagement'];

export interface PageAccount {
  name?: string;
  instagram_business_account?: { id: string; username?: string };
}

/** Instagram professional accounts reachable through the token's Facebook Pages. */
export function instagramCandidates(pages: PageAccount[]): { page: string; id: string; username: string }[] {
  return pages
    .filter((p) => p.instagram_business_account?.id)
    .map((p) => ({
      page: p.name ?? '?',
      id: p.instagram_business_account!.id,
      username: p.instagram_business_account!.username ?? '?',
    }));
}

export function missingPermissions(granted: { permission: string; status: string }[]): string[] {
  const have = new Set(granted.filter((p) => p.status === 'granted').map((p) => p.permission));
  return REQUIRED_PERMISSIONS.filter((p) => !have.has(p));
}

async function checkInstagram(rows: Row[]): Promise<void> {
  if (!process.env.IG_ACCESS_TOKEN) {
    rows.push({ status: 'fail', item: 'Instagram token', detail: '`IG_ACCESS_TOKEN` secret eksik.' });
    return;
  }

  let candidates: { page: string; id: string; username: string }[] = [];
  try {
    if (usesInstagramLogin()) {
      const me = await graph<{ user_id?: string; id?: string; username?: string }>('GET', '/me', { fields: 'user_id,username' });
      candidates = [{ page: '(Instagram Login)', id: me.user_id ?? me.id ?? '?', username: me.username ?? '?' }];
      rows.push({ status: 'ok', item: 'Instagram token', detail: `Geçerli, hesap @${me.username ?? '?'}.` });
    } else {
      const me = await graph<{ name?: string }>('GET', '/me', { fields: 'id,name' });
      rows.push({ status: 'ok', item: 'Instagram token', detail: `Geçerli, sahibi: ${me.name ?? 'bilinmiyor'}.` });

      try {
        const perms = await graph<{ data: { permission: string; status: string }[] }>('GET', '/me/permissions', {});
        const missing = missingPermissions(perms.data ?? []);
        rows.push(
          missing.length === 0
            ? { status: 'ok', item: 'İzinler', detail: 'Gerekli tüm izinler verilmiş.' }
            : { status: 'fail', item: 'İzinler', detail: `Eksik: ${missing.join(', ')}. Token'ı bu izinlerle yeniden oluştur.` },
        );
      } catch {
        rows.push({ status: 'warn', item: 'İzinler', detail: 'Bu token türünde izin listesi okunamadı; yayın testi aşağıda.' });
      }

      const accounts = await graph<{ data: PageAccount[] }>('GET', '/me/accounts', {
        fields: 'name,instagram_business_account{id,username}',
      });
      candidates = instagramCandidates(accounts.data ?? []);
    }
  } catch (err) {
    const detail = err instanceof GraphError && err.isAuth ? 'Token geçersiz veya süresi dolmuş.' : (err as Error).message;
    rows.push({ status: 'fail', item: 'Instagram token', detail });
    return;
  }

  const configured = process.env.IG_USER_ID;
  if (!configured) {
    rows.push(
      candidates.length > 0
        ? {
            status: 'fail',
            item: 'IG_USER_ID',
            detail: `Secret eksik. Bulunan hesap(lar): ${candidates.map((c) => `@${c.username} → \`${c.id}\` (Sayfa: ${c.page})`).join('; ')}. Doğru olanı \`IG_USER_ID\` olarak ekle.`,
          }
        : {
            status: 'fail',
            item: 'IG_USER_ID',
            detail: 'Token hiçbir Instagram profesyonel hesabı görmüyor. Instagram hesabı bir Facebook Sayfasına bağlı mı ve sistem kullanıcısına atandı mı?',
          },
    );
    return;
  }

  try {
    const account = await graph<{ username?: string }>('GET', `/${configured}`, { fields: 'username' });
    const limit = await graph<{ data?: { quota_usage?: number; config?: { quota_total?: number } }[] }>(
      'GET',
      `/${configured}/content_publishing_limit`,
      { fields: 'quota_usage,config' },
    );
    const usage = limit.data?.[0];
    rows.push({
      status: 'ok',
      item: 'Yayın yetkisi',
      detail: `@${account.username ?? '?'} için paylaşım açık (son 24 saatte ${usage?.quota_usage ?? 0}/${usage?.config?.quota_total ?? 25}).`,
    });
  } catch (err) {
    rows.push({ status: 'fail', item: 'Yayın yetkisi', detail: `\`IG_USER_ID\` ile paylaşım kontrolü başarısız: ${(err as Error).message}` });
  }
}

async function checkTelegram(rows: Row[]): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    rows.push({ status: 'fail', item: 'Telegram botu', detail: '`TELEGRAM_BOT_TOKEN` secret eksik (@BotFather → /newbot).' });
    return;
  }
  try {
    const name = await botUsername();
    rows.push({ status: 'ok', item: 'Telegram botu', detail: `Geçerli: @${name}.` });
  } catch (err) {
    rows.push({ status: 'fail', item: 'Telegram botu', detail: (err as Error).message });
    return;
  }
  if (!process.env.TELEGRAM_CHAT_ID) {
    rows.push({ status: 'fail', item: 'Telegram sohbeti', detail: '`TELEGRAM_CHAT_ID` secret eksik. Bota bir mesaj yaz, sonra getUpdates ile chat.id değerini al.' });
    return;
  }
  try {
    await sendMessage('✅ Berlin Konuşuyor bağlantı testi: story önizlemeleri bu sohbete gelecek.');
    rows.push({ status: 'ok', item: 'Telegram sohbeti', detail: 'Test mesajı gönderildi.' });
  } catch (err) {
    rows.push({ status: 'fail', item: 'Telegram sohbeti', detail: `Mesaj gönderilemedi: ${(err as Error).message}` });
  }
}

async function checkStorage(rows: Row[]): Promise<void> {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    rows.push({ status: 'fail', item: 'Firebase Storage', detail: '`FIREBASE_SERVICE_ACCOUNT` secret eksik.' });
    return;
  }
  try {
    rows.push(
      (await bucketReachable())
        ? { status: 'ok', item: 'Firebase Storage', detail: 'Bucket erişilebilir.' }
        : { status: 'fail', item: 'Firebase Storage', detail: 'Bucket bulunamadı (FIREBASE_STORAGE_BUCKET doğru mu?).' },
    );
  } catch (err) {
    rows.push({ status: 'fail', item: 'Firebase Storage', detail: (err as Error).message });
  }
}

/** Runs every check, prints a table and returns whether everything is ready. */
export async function runConnectionCheck(): Promise<boolean> {
  const rows: Row[] = [];
  await checkInstagram(rows);
  await checkTelegram(rows);
  await checkStorage(rows);
  rows.push(
    process.env.ANTHROPIC_API_KEY
      ? { status: 'ok', item: 'Claude API', detail: 'Anahtar tanımlı.' }
      : { status: 'fail', item: 'Claude API', detail: '`ANTHROPIC_API_KEY` secret eksik (console.anthropic.com).' },
  );

  const icon: Record<Status, string> = { ok: '✅', warn: '⚠️', fail: '❌' };
  const table = ['| | Kontrol | Sonuç |', '|---|---|---|', ...rows.map((r) => `| ${icon[r.status]} | ${r.item} | ${r.detail} |`)].join('\n');
  const ready = rows.every((r) => r.status !== 'fail');
  const summary = `## Story botu bağlantı testi\n\n${table}\n\n${ready ? '**Hazır.** İlk bülten için *Stories: prepare* iş akışını elle çalıştırabilirsin.' : '**Eksikler var.** ❌ satırlarını tamamlayıp testi tekrar çalıştır.'}\n`;

  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  return ready;
}
