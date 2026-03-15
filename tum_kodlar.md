# Berlin Konuşuyor - Tüm Proje Kodları (v3.4 - Layout Reverted & Wine Red)

Bu dosya bülten sistemi düzeltilmiş, Şarap Kırmızısı teması uygulanmış, haber düzeni orijinal haline getirilmiş ve video galerisi rafine edilmiş en güncel proje kodlarını barındırır.

---

## 🎨 Tasarım & Düzen Notları
- **Tema:** Şarap Kırmızısı (#800020) & Siyah
- **Tipografi:** Başlıklar: 'Playfair Display', Gövde: 'Inter'
- **Haber Düzeni:** Öne Çıkan Ana Haber + 3 Yan Haber (Orijinal yapıya dönüldü).
- **Video Galerisi:** Sadece kullanıcıya ait özel video içerikleri (`data/podcasts.json`) üzerinden beslenir.

---

## 1. index.html (Tipografi & Yapı)
```html
<!-- Google Fonts & FontAwesome ... -->
<!-- NEWSLETTER ... -->
<!-- VIDEO GALLERIE ... -->
```

---

## 2. main.js (Layout Reverted)
```javascript
function renderNews(articles) {
  const featured = articles[0];
  const side = articles.slice(1, 4);
  // ... Original logic restored ...
}
```
