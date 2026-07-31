/*  ═══════════════════════════════════════════════════════════
    URL slug üretimi — saf fonksiyon, bağımlılık yok.
    Hem tarayıcıda hem derleme script'lerinde kullanılır.
    ═══════════════════════════════════════════════════════════ */

// Türkçe ve Almanca karakterler ASCII karşılıklarına eşlenir.
// Not: 'ı' ve 'İ' Unicode normalizasyonu ile doğru çözülmediği için
// elle eşleniyor (İ → I, ı → i).
const CHAR_MAP = {
  ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', İ: 'i', ö: 'o', Ö: 'o',
  ş: 's', Ş: 's', ü: 'u', Ü: 'u', ä: 'ae', Ä: 'ae', ß: 'ss',
  â: 'a', Â: 'a', î: 'i', Î: 'i', û: 'u', Û: 'u',
};

/**
 * Bir başlığı URL'de kullanılabilir slug'a çevirir.
 * @param {string} text
 * @param {number} [maxLength=80]
 * @returns {string} örn. "kreuzbergde-kira-zammi"
 */
export function slugify(text, maxLength = 80) {
  const raw = String(text ?? '').trim();
  if (!raw) return '';

  let out = '';
  for (const ch of raw) {
    out += CHAR_MAP[ch] ?? ch;
  }

  out = out
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // kalan aksanları düşür
    // Kesme işareti Türkçede eki ayırır ("Kreuzberg'de"); tireye
    // çevirmek yerine tamamen düşürüyoruz → "kreuzbergde".
    .replace(/['’‘`"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (out.length > maxLength) {
    out = out.slice(0, maxLength).replace(/-+[^-]*$/, ''); // kelimeyi ortadan kesme
  }
  return out.replace(/^-+|-+$/g, '');
}

/**
 * Bir içerik için kalıcı ve benzersiz URL yolu üretir.
 * Slug başlıktan gelir, sonuna kimliğin kısa bir eki eklenir;
 * böylece başlık düzenlense bile eski bağlantılar çakışmaz ve
 * iki aynı başlık birbirini ezmez.
 *
 * @param {'haber'|'video'} kind
 * @param {{id?:string, title?:string, summary_tr?:string}} item
 * @returns {string} örn. "/haber/kreuzbergde-kira-zammi-a1b2c3"
 */
export function contentPath(kind, item = {}) {
  const base = slugify(item.title || item.summary_tr || '') || kind;
  const id = String(item.id || '');
  const suffix = id ? id.slice(-6).toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  return suffix ? `/${kind}/${base}-${suffix}` : `/${kind}/${base}`;
}

/**
 * Bir slug'ın sonundaki kimlik ekini ayıklar.
 * @param {string} slug
 * @returns {string}
 */
export function idSuffixFromSlug(slug = '') {
  const m = String(slug).match(/-([a-z0-9]{4,})$/);
  return m ? m[1] : '';
}
