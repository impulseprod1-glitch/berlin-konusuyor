import { describe, it, expect } from 'vitest';
import { slugify, contentPath, idSuffixFromSlug } from './slug.js';

describe('slugify — Türkçe karakterler', () => {
  it('Türkçe harfleri doğru çevirir', () => {
    expect(slugify('Şişli Güneşli Çiçek')).toBe('sisli-gunesli-cicek');
    expect(slugify('İstanbul')).toBe('istanbul');
    expect(slugify('ılık ışık')).toBe('ilik-isik');
    expect(slugify('ÖĞRENCİ')).toBe('ogrenci');
  });

  it('gerçek bir haber başlığını çevirir', () => {
    expect(slugify("Kreuzberg'de kira zammı: esnaf ne diyor?")).toBe('kreuzbergde-kira-zammi-esnaf-ne-diyor');
  });

  it('Almanca karakterleri çevirir', () => {
    expect(slugify('Straße')).toBe('strasse');
    expect(slugify('Ärzte')).toBe('aerzte');
    expect(slugify('Neukölln')).toBe('neukolln');
  });
});

describe('slugify — biçim', () => {
  it('noktalama ve boşlukları tek tireye indirger', () => {
    expect(slugify('BVG   grevi!!!  07:00')).toBe('bvg-grevi-07-00');
  });

  it('baştaki ve sondaki tireleri temizler', () => {
    expect(slugify('  --- Merhaba ---  ')).toBe('merhaba');
  });

  it('boş ve geçersiz girdilerde boş dize döner', () => {
    expect(slugify('')).toBe('');
    expect(slugify(null)).toBe('');
    expect(slugify(undefined)).toBe('');
    expect(slugify('!!!')).toBe('');
  });

  it('uzunluğu sınırlar ve kelimeyi ortadan kesmez', () => {
    const uzun = 'Berlin Kreuzberg bolgesinde kira artislari ve esnafin tepkisi uzerine kapsamli bir degerlendirme';
    const s = slugify(uzun, 40);
    expect(s.length).toBeLessThanOrEqual(40);
    expect(s.endsWith('-')).toBe(false);
    // Son parça yarım kelime olmamalı
    expect(uzun.toLowerCase()).toContain(s.split('-').pop());
  });
});

describe('contentPath', () => {
  it('haber için yol üretir ve kimlik ekini ekler', () => {
    const p = contentPath('haber', { id: 'aBcDeF123456', title: "Kreuzberg'de kira zammı" });
    expect(p).toBe('/haber/kreuzbergde-kira-zammi-123456');
  });

  it('video için yol üretir', () => {
    expect(contentPath('video', { id: 'xyz789', title: 'BVG grevi' })).toBe('/video/bvg-grevi-xyz789');
  });

  it('başlık yoksa summary_tr kullanır', () => {
    expect(contentPath('haber', { id: 'abc123', summary_tr: 'Özet başlık' })).toBe('/haber/ozet-baslik-abc123');
  });

  it('başlık da kimlik de yoksa türü kullanır', () => {
    expect(contentPath('haber', {})).toBe('/haber/haber');
  });

  it('aynı başlıklı iki içerik farklı yol alır', () => {
    const a = contentPath('haber', { id: 'aaa111', title: 'Aynı Başlık' });
    const b = contentPath('haber', { id: 'bbb222', title: 'Aynı Başlık' });
    expect(a).not.toBe(b);
  });
});

describe('idSuffixFromSlug', () => {
  it('sondaki kimlik ekini ayıklar', () => {
    expect(idSuffixFromSlug('kreuzbergde-kira-zammi-123456')).toBe('123456');
  });

  it('ek yoksa boş döner', () => {
    expect(idSuffixFromSlug('sadece-baslik')).toBe('baslik');
    expect(idSuffixFromSlug('')).toBe('');
  });
});
