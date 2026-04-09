export const legalDocs = {
  tr: {
    impressum: `
      <h2>Impressum (Künye)</h2>
      <p><strong>Site Sahibi / Sorumlu:</strong> [İSİM/ŞİRKET ADI]</p>
      <p><strong>Adres:</strong> [ADRES - ALMANYA]</p>
      <p><strong>İletişim:</strong> E-posta: hello@berlinkonusuyor.com | Tel: [TELEFON]</p>
      <h3>Hukuki Sorumluluk (Haftung für Inhalte)</h3>
      <p>Hizmet sağlayıcı olarak TMG § 7 Abs.1 uyarınca kendi içeriklerimizden sorumluyuz. TMG §§ 8 ila 10 uyarınca, iletilen veya saklanan yabancı bilgileri izlemek veya yasa dışı faaliyete işaret eden durumları araştırmakla yükümlü değiliz.</p>
      <h3>Telif Hakkı</h3>
      <p>Bu sitedeki içerikler Alman telif hakkı yasasına tabidir. Yazılı izin olmaksızın çoğaltılması veya dağıtılması yasaktır.</p>
    `,
    privacy: `
      <h2>Gizlilik Politikası (DSGVO)</h2>
      <p>Veri koruma önceliğimizdir. Verileriniz AB Veri Koruma Yönetmeliği (GDPR/DSGVO) uyarınca işlenmektedir.</p>
      <h3>1. Veri Sorumlusu</h3>
      <p>[İSİM/ŞİRKET ADI], Berlin, E-posta: hello@berlinkonusuyor.com</p>
      <h3>2. Firebase & Barındırma</h3>
      <p>Sitemiz Firebase (Google Cloud) altyapısını kullanmaktadır. Veriler güvenli Google sunucularında saklanmaktadır. Auth (Giriş) ve Firestore (Veritabanı) işlemleri bu kapsamdadır.</p>
      <h3>3. Çerezler (Cookies)</h3>
      <p>Sitemiz, kullanıcı deneyimini iyileştirmek için teknik olarak gerekli çerezleri kullanır. Google Analytics veya benzeri takip araçları için onayınız alınır.</p>
      <h3>4. Haklarınız</h3>
      <p>Verileriniz hakkında bilgi alma, düzeltme, sildirme ve itiraz etme hakkına sahipsiniz.</p>
    `
  },
  de: {
    impressum: `
      <h2>Impressum</h2>
      <p><strong>Angaben gemäß § 5 TMG</strong></p>
      <p>[NAME/FIRMA]</p>
      <p>[STRASSE, PLZ, BERLIN]</p>
      <p><strong>Kontakt:</strong> E-Mail: hello@berlinkonusuyor.com | Tel: [TELEFON]</p>
      <h3>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:</h3>
      <p>[NAME DER PERSON]</p>
      <h3>Streitschlichtung</h3>
      <p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <a href="https://ec.europa.eu/consumers/odr" target="_blank">ec.europa.eu/consumers/odr</a>.</p>
    `,
    privacy: `
      <h2>Datenschutzerklärung</h2>
      <p>Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften (DSGVO).</p>
      <h3>Einwilligung</h3>
      <p>Durch die Nutzung unserer Website erklären Sie sich mit der Erhebung, Verarbeitung und Nutzung von Daten gemäß der nachfolgenden Beschreibung einverstanden.</p>
      <h3>Hosting & Firebase</h3>
      <p>Unsere Website nutzt Dienste von Firebase (Google Ireland Limited). Dabei werden Daten an Google übertragen und dort verarbeitet.</p>
    `
  },
  en: {
    impressum: `
      <h2>Imprint</h2>
      <p><strong>According to § 5 TMG (Germany)</strong></p>
      <p>[NAME/COMPANY]</p>
      <p>[ADDRESS, BERLIN]</p>
      <p><strong>Contact:</strong> Email: hello@berlinkonusuyor.com | Tel: [PHONE]</p>
      <h3>Copyright</h3>
      <p>The contents of these pages are subject to German copyright law. Reproduction, processing, distribution, or any form of commercialization requires written consent.</p>
    `,
    privacy: `
      <h2>Privacy Policy (GDPR)</h2>
      <p>This privacy policy informs you about the type, scope and purpose of the processing of personal data on our website according to GDPR.</p>
      <h3>Firebase Service</h3>
      <p>We use Firebase (Google) for authentication and database services. Data may be stored on servers located in the US under appropriate safety certifications.</p>
      <h3>User Rights</h3>
      <p>You have the right to access, rectify, or delete your personal data stored by us at any time.</p>
    `
  }
};

export function openLegal(type) {
  const lang = localStorage.getItem('bk-lang') || 'tr';
  const content = legalDocs[lang][type] || legalDocs['en'][type];
  document.getElementById('legalContent').innerHTML = content;
  document.getElementById('legalModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function closeLegal() {
  document.getElementById('legalModal').classList.remove('active');
  document.body.style.overflow = '';
}

export function initCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  if (!banner) return;

  const isAccepted = localStorage.getItem('bk-cookies-accepted');
  if (!isAccepted) {
    setTimeout(() => {
      banner.classList.add('active');
    }, 2000);
  }
}

export function acceptCookies() {
  localStorage.setItem('bk-cookies-accepted', 'true');
  const banner = document.getElementById('cookieBanner');
  if (banner) banner.classList.remove('active');
}

export function closeCookieBanner() {
  localStorage.setItem('bk-cookies-accepted', 'false'); // Minimal refusal tracking
  const banner = document.getElementById('cookieBanner');
  if (banner) banner.classList.remove('active');
}

window.openLegal = openLegal;
window.closeLegal = closeLegal;
window.acceptCookies = acceptCookies;
window.closeCookieBanner = closeCookieBanner;
