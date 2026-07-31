/*  ═══════════════════════════════════════════════════════════
    Video bağlantısı çözümleme — saf yardımcı fonksiyonlar.

    Firebase veya DOM bağımlılığı YOKTUR; hem tarayıcıda hem
    testlerde doğrudan çalışır. (src/utils/video-url.test.js)
    ═══════════════════════════════════════════════════════════ */

/**
 * Bir video bağlantısını tanır ve normalize eder.
 * YouTube (normal / shorts / youtu.be / embed / live), Vimeo ve
 * doğrudan dosya (mp4/webm/mov, Firebase Storage) desteklenir.
 *
 * @param {string} rawUrl Kullanıcının yapıştırdığı bağlantı
 * @returns {{provider:'youtube'|'vimeo'|'file', videoId:string, videoUrl:string,
 *   thumbnail:string, orientation:'landscape'|'portrait'} | null} Tanınmazsa null
 */
export function parseVideoUrl(rawUrl = '') {
  const url = String(rawUrl).trim();
  if (!url) return null;

  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/
  );
  if (yt) {
    return {
      provider: 'youtube',
      videoId: yt[1],
      videoUrl: `https://www.youtube.com/watch?v=${yt[1]}`,
      thumbnail: `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg`,
      orientation: /shorts\//.test(url) ? 'portrait' : 'landscape',
    };
  }

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) {
    return {
      provider: 'vimeo',
      videoId: vimeo[1],
      videoUrl: `https://vimeo.com/${vimeo[1]}`,
      thumbnail: '',
      orientation: 'landscape',
    };
  }

  if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) || /firebasestorage\.googleapis\.com/.test(url)) {
    return { provider: 'file', videoId: '', videoUrl: url, thumbnail: '', orientation: 'landscape' };
  }

  return null;
}

/**
 * Oynatıcıya gömülecek adresi üretir.
 * YouTube için çerezsiz (youtube-nocookie) alan adı kullanılır.
 *
 * @param {{provider:string, videoId:string, videoUrl:string}} video
 * @param {boolean} autoplay
 * @returns {string}
 */
export function buildEmbedUrl(video, autoplay = true) {
  const ap = autoplay ? 1 : 0;
  if (video.provider === 'youtube') {
    return `https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=${ap}&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3`;
  }
  if (video.provider === 'vimeo') {
    return `https://player.vimeo.com/video/${video.videoId}?autoplay=${ap}&dnt=1&title=0&byline=0`;
  }
  return video.videoUrl;
}

/**
 * Saniyeyi "d:ss" biçimine çevirir. Geçersiz/0 değerde boş dize döner.
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  const s = Math.round(Number(seconds) || 0);
  if (!s) return '';
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
