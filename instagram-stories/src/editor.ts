import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { config } from './config.ts';
import type { NewsItem } from './feeds.ts';
import { turkishDate } from './time.ts';

export const CATEGORIES = ['BERLİN', 'ALMANYA', 'DÜNYA'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Story {
  category: Category;
  kicker: string;
  headline: string;
  summary: string;
  /** Outlet names, derived from the cited items – never taken from model text. */
  sources: string[];
  /** Original article links, shown in the Telegram preview for fact-checking. */
  links: string[];
}

const DraftSchema = z.object({
  stories: z.array(
    z.object({
      sourceIds: z.array(z.string()).describe('IDs of the input items (e.g. "n4") this story is based on'),
      category: z.enum(CATEGORIES),
      kicker: z.string().describe('Topic label in Turkish, one or two words'),
      headline: z.string(),
      summary: z.string(),
    }),
  ),
});
export type Draft = z.infer<typeof DraftSchema>;

/*
 * The system prompt carries the editorial standards; it stays identical every
 * day. Only the date and the item list change, and they go in the user turn.
 * A news account lives on trust, so the rules lean hard on "only what the
 * sources say" – the human veto in Telegram is the second line of defence.
 */
const SYSTEM = `Sen "Berlin Konuşuyor" adlı Instagram sayfasının sabah editörüsün. Sayfayı Berlin'de ve Almanya'da yaşayan Türkçe konuşan insanlar takip ediyor. Her sabah 09:00'da yayınlanan story bülteni için haberleri sen seçiyor ve yazıyorsun.

Seçim:
- İstenen sayıda haber seç. Dağılım: varsa en az bir BERLİN haberi, yaklaşık yarısı ALMANYA, en az bir DÜNYA haberi. Önem sırasına göre sırala; en önemli haber ilk sırada.
- Öncelik okurun hayatına dokunan haberlerde: yasalar ve yönetmelikler, fiyatlar ve vergiler, kira ve konut, ulaşım ve grevler, sağlık, eğitim, göç ve oturum hakkı, hava uyarıları, Berlin siyaseti. Bunun yanında herkesin konuştuğu büyük dünya gelişmeleri.
- Spor sonuçları, ünlü haberleri ve yerel küçük olaylar ancak gerçekten olağanüstüyse girer.
- Aynı olayı anlatan birden fazla kaynak varsa tek haberde birleştir ve hepsinin id'sini sourceIds'e yaz.
- Dünkü bültende yer alan konuları, önemli yeni bir gelişme yoksa tekrar etme.

Doğruluk (en önemli kural):
- Yalnızca verilen kaynak metinlerinde açıkça yazan bilgileri kullan. Sayı, isim, tarih, alıntı ya da neden-sonuç ilişkisi uydurma veya tahmin etme.
- Kaynaklar birbiriyle çelişiyorsa ya da bilgi belirsizse o haberi seçme.
- Kesinleşmemiş bilgileri öyle yaz ("iddia ediliyor", "polisin açıklamasına göre").
- Kaynak cümlelerini kelimesi kelimesine çevirme; olguları kendi cümlelerinle yeniden yaz.

Dil ve ton:
- Doğru Türkçe karakterlerle (ç, ğ, ı, İ, ö, ş, ü), sade ve akıcı bir haber dili kullan. Tarafsız, sakin ve saygılı ol; yorum, slogan, emoji, ünlem ve tık tuzağı kullanma.
- Almanya'ya özgü kavramları Türkçe açıkla, gerekiyorsa Almancasını parantez içinde ver: "vatandaşlık geliri (Bürgergeld)".
- Ölüm, şiddet ve felaket haberlerinde ayrıntıya girme, ölçülü yaz.

Biçim:
- kicker: konuyu anlatan 1–2 kelime ("Ulaşım", "Kira", "Ukrayna").
- headline: en fazla 70 karakter, tek cümle, sonunda nokta yok.
- summary: en fazla 230 karakter, 1–2 cümle. Ne oldu ve okuru neden ilgilendiriyor.
- category: Berlin ve Brandenburg için BERLİN, Almanya'nın geri kalanı ve federal siyaset için ALMANYA, Almanya dışı için DÜNYA.`;

export async function writeStories(
  items: NewsItem[],
  options: { isoDate: string; previousHeadlines: string[]; count?: number; client?: Anthropic },
): Promise<Story[]> {
  const count = options.count ?? config.storyCount;
  const client = options.client ?? new Anthropic();
  const { date, weekday } = turkishDate(options.isoDate);

  const lines = items.map((item) =>
    JSON.stringify({
      id: item.id,
      source: item.source,
      region: item.region,
      published: item.publishedAt,
      title: item.title,
      summary: item.summary,
    }),
  );

  const user = [
    `Bugün: ${date} ${weekday}`,
    `Hazırlanacak haber sayısı: ${count}`,
    '',
    'Dünkü bültenin başlıkları:',
    ...(options.previousHeadlines.length > 0 ? options.previousHeadlines.map((h) => `- ${h}`) : ['- (yok)']),
    '',
    'Son saatlerin haber kaynakları (her satır bir JSON nesnesi):',
    ...lines,
  ].join('\n');

  const response = await client.beta.messages.parse({
    model: config.model,
    max_tokens: 16000,
    system: SYSTEM,
    messages: [{ role: 'user', content: user }],
    output_config: { effort: config.effort, format: betaZodOutputFormat(DraftSchema) },
    // On a policy decline the API reruns the request on a fallback model
    // instead of leaving the morning without an edition.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
  });

  if (response.stop_reason === 'refusal') {
    throw new Error(`Claude declined the edition (${response.stop_details?.category ?? 'no category'})`);
  }
  if (response.stop_reason === 'max_tokens' || !response.parsed_output) {
    throw new Error(`Claude returned no usable edition (stop_reason: ${response.stop_reason})`);
  }

  return resolveDraft(response.parsed_output, items, count);
}

/**
 * Ties every story back to real input items. A story that cites nothing we
 * fed in is dropped: it cannot be attributed, so it cannot be published.
 */
export function resolveDraft(draft: Draft, items: NewsItem[], count: number): Story[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const stories: Story[] = [];

  for (const s of draft.stories) {
    const cited = s.sourceIds.map((id) => byId.get(id)).filter((x): x is NewsItem => x !== undefined);
    if (cited.length === 0) {
      console.warn(`Dropping story without valid sources: ${s.headline}`);
      continue;
    }
    stories.push({
      category: s.category,
      kicker: tidy(s.kicker),
      headline: tidy(s.headline).replace(/\.$/, ''),
      summary: tidy(s.summary),
      sources: [...new Set(cited.map((c) => c.source))],
      links: [...new Set(cited.map((c) => c.link))],
    });
  }

  return stories.slice(0, count);
}

function tidy(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}
