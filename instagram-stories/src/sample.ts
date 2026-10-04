import type { Story } from './editor.ts';

/**
 * Layout fixtures for `npm run preview -- --sample`: realistic lengths,
 * including a headline and summary at the upper limit, but no real news.
 * The cover is labelled "Tasarım Örneği" so these never pass as an edition.
 */
export const SAMPLE_STORIES: Story[] = [
  {
    category: 'BERLİN',
    kicker: 'Ulaşım',
    headline: 'Ring hattında hafta sonu bakım: S-Bahn seferleri kısmen duruyor',
    summary:
      'Örnek metin: Cumartesi ve pazar günleri Ring hattının bir bölümünde trenler çalışmayacak. Yolcular için yedek otobüs seferleri planlanıyor; sefer bilgisi için BVG uygulamasını kontrol edin.',
    sources: ['rbb24'],
    links: [],
  },
  {
    category: 'ALMANYA',
    kicker: 'Kira',
    headline: 'Kira artışlarına yeni sınır tartışılıyor',
    summary:
      'Örnek metin: Federal hükümet, büyük şehirlerde kira freninin (Mietpreisbremse) süresini uzatmayı görüşüyor. Düzenleme Berlin’de kiracı olarak yaşayan milyonlarca kişiyi doğrudan ilgilendiriyor.',
    sources: ['tagesschau', 'DW Türkçe'],
    links: [],
  },
  {
    category: 'ALMANYA',
    kicker: 'Vatandaşlık',
    headline: 'Vatandaşlık başvurularında bekleme süreleri uzuyor',
    summary: 'Örnek metin: Pek çok eyalette başvuruların sonuçlanması bir yılı aşıyor.',
    sources: ['tagesschau'],
    links: [],
  },
  {
    category: 'DÜNYA',
    kicker: 'İklim',
    headline: 'Avrupa Birliği ülkeleri yeni iklim hedefi üzerinde uzlaşmaya çok yakın, son karar haftaya',
    summary:
      'Örnek metin: Üye ülkelerin çevre bakanları, 2040 için belirlenecek emisyon hedefi konusunda Brüksel’de bir araya geldi. Uzlaşma sağlanırsa hedef, sanayiden ulaşıma kadar pek çok alanda yeni kuralların temelini oluşturacak.',
    sources: ['BBC News', 'DW Türkçe'],
    links: [],
  },
  {
    category: 'DÜNYA',
    kicker: 'Ekonomi',
    headline: 'Petrol fiyatları haftaya düşüşle başladı',
    summary: 'Örnek metin: Piyasalardaki dalgalanma akaryakıt fiyatlarına birkaç gün gecikmeyle yansıyabilir.',
    sources: ['BBC News'],
    links: [],
  },
];
