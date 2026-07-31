import { loadStorage } from '../firebase-config.js';

/**
 * Firebase Storage'a dosya yükler.
 * @param {File|Blob} file Yüklenecek dosya
 * @param {string} path Depolama yolu (örn. 'news/1712345_kapak.jpg')
 * @param {(percent:number)=>void} [onProgress] Yükleme yüzdesi callback'i
 * @returns {Promise<string>} İndirme URL'si
 */
export async function uploadMedia(file, path, onProgress) {
  if (!file) return null;

  // Storage SDK'sı ilk yüklemede değil, ilk kullanımda indirilir.
  const { storage, ref, uploadBytes, uploadBytesResumable, getDownloadURL } = await loadStorage();
  const storageRef = ref(storage, path);

  // İlerleme takibi istenmiyorsa basit yükleme yeterli.
  if (typeof onProgress !== 'function') {
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  }

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, {
      contentType: file.type || 'application/octet-stream',
      cacheControl: 'public, max-age=31536000',
    });

    task.on(
      'state_changed',
      (snap) => {
        const pct = snap.totalBytes ? (snap.bytesTransferred / snap.totalBytes) * 100 : 0;
        onProgress(Math.round(pct));
      },
      (error) => {
        console.error('Medya yükleme hatası:', error);
        reject(error);
      },
      async () => {
        try {
          resolve(await getDownloadURL(task.snapshot.ref));
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/**
 * Bir görsel dosyasını tarayıcıda WebP'ye dönüştürüp yeniden boyutlandırır
 * (kapak görselleri için — daha küçük dosya, daha hızlı yükleme). WebP
 * kodlamayı desteklemeyen bir tarayıcıda veya SVG girdisinde orijinal
 * dosya değiştirilmeden döner.
 * @param {File} file
 * @param {number} [maxWidth=1280]
 * @returns {Promise<File>}
 */
export function convertImageToWebP(file, maxWidth = 1280) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      return resolve(file);
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    const done = (result) => {
      URL.revokeObjectURL(url);
      resolve(result);
    };

    img.onerror = () => done(file);
    img.onload = () => {
      try {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            // Bazı tarayıcılar WebP kodlayamazsa sessizce PNG üretir —
            // bu durumda dönüştürmeden vazgeçip orijinali kullan.
            if (!blob || blob.type !== 'image/webp') return done(file);
            const name = file.name.replace(/\.[^.]+$/, '') + '.webp';
            done(new File([blob], name, { type: 'image/webp' }));
          },
          'image/webp',
          0.85
        );
      } catch {
        done(file);
      }
    };
    img.src = url;
  });
}

/**
 * Bir video dosyasının süresini, boyutlarını ve otomatik kapak karesini
 * tarayıcıda çıkarır. Hiçbir sunucu işlemine ihtiyaç duymaz.
 * @param {File} file
 * @returns {Promise<{duration:number, orientation:'landscape'|'portrait', poster:Blob|null}>}
 */
export function probeVideoFile(file) {
  return new Promise((resolve) => {
    const fallback = { duration: 0, orientation: 'landscape', poster: null };
    if (!file || !file.type.startsWith('video/')) return resolve(fallback);

    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    const done = (result) => {
      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      resolve(result);
    };

    const timeout = setTimeout(() => done(fallback), 12000);

    video.onerror = () => {
      clearTimeout(timeout);
      done(fallback);
    };

    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const orientation = video.videoHeight > video.videoWidth ? 'portrait' : 'landscape';

      // Kapak için videonun ~%10'una atla (ilk kare genelde siyah olur).
      video.currentTime = Math.min(Math.max(duration * 0.1, 0.1), Math.max(duration - 0.1, 0.1));

      video.onseeked = () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement('canvas');
          const maxW = 1280;
          const scale = Math.min(1, maxW / (video.videoWidth || maxW));
          canvas.width = Math.round((video.videoWidth || maxW) * scale);
          canvas.height = Math.round((video.videoHeight || 720) * scale);
          canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => done({ duration, orientation, poster: blob }),
            'image/webp',
            0.82
          );
        } catch {
          done({ duration, orientation, poster: null });
        }
      };
    };
  });
}
