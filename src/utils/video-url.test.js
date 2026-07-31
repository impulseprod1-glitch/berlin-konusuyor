import { describe, it, expect } from 'vitest';
import { parseVideoUrl, buildEmbedUrl, formatDuration } from './video-url.js';

describe('parseVideoUrl — YouTube', () => {
  it('normal izleme bağlantısını tanır', () => {
    const r = parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(r.provider).toBe('youtube');
    expect(r.videoId).toBe('dQw4w9WgXcQ');
    expect(r.orientation).toBe('landscape');
    expect(r.thumbnail).toContain('dQw4w9WgXcQ');
  });

  it('kısa youtu.be bağlantısını tanır', () => {
    expect(parseVideoUrl('https://youtu.be/dQw4w9WgXcQ').videoId).toBe('dQw4w9WgXcQ');
  });

  it('Shorts bağlantısını dikey olarak işaretler', () => {
    const r = parseVideoUrl('https://youtube.com/shorts/aqz-KE-bpKQ');
    expect(r.videoId).toBe('aqz-KE-bpKQ');
    expect(r.orientation).toBe('portrait');
  });

  it('embed ve live biçimlerini tanır', () => {
    expect(parseVideoUrl('https://www.youtube.com/embed/ScMzIvxBSi4').videoId).toBe('ScMzIvxBSi4');
    expect(parseVideoUrl('https://www.youtube.com/live/ScMzIvxBSi4').videoId).toBe('ScMzIvxBSi4');
  });

  it('v parametresi başta olmasa da bulur', () => {
    const r = parseVideoUrl('https://www.youtube.com/watch?list=PL123&v=dQw4w9WgXcQ&t=30');
    expect(r.videoId).toBe('dQw4w9WgXcQ');
  });

  it('zaman damgası gibi ek parametreleri kimliğe karıştırmaz', () => {
    expect(parseVideoUrl('https://youtu.be/dQw4w9WgXcQ?t=42').videoId).toBe('dQw4w9WgXcQ');
  });
});

describe('parseVideoUrl — Vimeo', () => {
  it('standart bağlantıyı tanır', () => {
    const r = parseVideoUrl('https://vimeo.com/123456789');
    expect(r.provider).toBe('vimeo');
    expect(r.videoId).toBe('123456789');
  });

  it('video/ ön ekli biçimi tanır', () => {
    expect(parseVideoUrl('https://vimeo.com/video/987654321').videoId).toBe('987654321');
  });
});

describe('parseVideoUrl — doğrudan dosya', () => {
  it('mp4 ve webm uzantılarını tanır', () => {
    expect(parseVideoUrl('https://cdn.example.com/a.mp4').provider).toBe('file');
    expect(parseVideoUrl('https://cdn.example.com/a.webm').provider).toBe('file');
  });

  it('sorgu parametreli dosya bağlantısını tanır', () => {
    expect(parseVideoUrl('https://cdn.example.com/a.mp4?v=2').provider).toBe('file');
  });

  it('Firebase Storage bağlantısını uzantısız da tanır', () => {
    const url = 'https://firebasestorage.googleapis.com/v0/b/berlin.appspot.com/o/videos%2F1.mp4?alt=media&token=abc';
    expect(parseVideoUrl(url).provider).toBe('file');
  });
});

describe('parseVideoUrl — geçersiz girdiler', () => {
  it('boş, null ve tanınmayan değerlerde null döner', () => {
    expect(parseVideoUrl('')).toBeNull();
    expect(parseVideoUrl()).toBeNull();
    expect(parseVideoUrl('   ')).toBeNull();
    expect(parseVideoUrl('merhaba dünya')).toBeNull();
    expect(parseVideoUrl('https://example.com/sayfa')).toBeNull();
  });

  it('desteklenmeyen platformlarda null döner (TikTok/Instagram)', () => {
    expect(parseVideoUrl('https://www.tiktok.com/@x/video/123')).toBeNull();
    expect(parseVideoUrl('https://www.instagram.com/reel/Abc123/')).toBeNull();
  });
});

describe('buildEmbedUrl', () => {
  it('YouTube için çerezsiz alan adı kullanır', () => {
    const url = buildEmbedUrl({ provider: 'youtube', videoId: 'abc123' });
    expect(url).toContain('youtube-nocookie.com/embed/abc123');
    expect(url).toContain('autoplay=1');
  });

  it('autoplay kapatılabilir', () => {
    expect(buildEmbedUrl({ provider: 'youtube', videoId: 'abc123' }, false)).toContain('autoplay=0');
  });

  it('Vimeo için dnt (izleme yok) parametresi ekler', () => {
    expect(buildEmbedUrl({ provider: 'vimeo', videoId: '42' })).toContain('dnt=1');
  });

  it('dosya sağlayıcısında bağlantıyı olduğu gibi döner', () => {
    const src = 'https://cdn.example.com/a.mp4';
    expect(buildEmbedUrl({ provider: 'file', videoUrl: src })).toBe(src);
  });
});

describe('formatDuration', () => {
  it('saniyeyi d:ss biçimine çevirir', () => {
    expect(formatDuration(184)).toBe('3:04');
    expect(formatDuration(47)).toBe('0:47');
    expect(formatDuration(3600)).toBe('60:00');
  });

  it('geçersiz veya sıfır değerde boş dize döner', () => {
    expect(formatDuration(0)).toBe('');
    expect(formatDuration(undefined)).toBe('');
    expect(formatDuration('abc')).toBe('');
  });
});
