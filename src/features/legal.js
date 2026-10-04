/*
 * Impressum and privacy policy. Provider details live in src/data/owner.js.
 * The German text is the legally binding one; TR and EN are translations.
 * Have the final version checked once by a lawyer or a generator such as
 * e-recht24 – especially once ads or affiliate links are added.
 */
import { OWNER } from '../data/owner.js';

const address = `${OWNER.name}<br>${OWNER.street}<br>${OWNER.city}`;
const contact = `E-Mail: <a href="mailto:${OWNER.email}">${OWNER.email}</a><br>Tel.: ${OWNER.phone}`;

const de = {
  impressum: `
    <h2>Impressum</h2>
    <h3>Angaben gemäß § 5 DDG</h3>
    <p>${address}</p>
    <h3>Kontakt</h3>
    <p>${contact}</p>
    <h3>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h3>
    <p>${OWNER.editor}<br>Anschrift wie oben</p>
    <h3>Verbraucherstreitbeilegung</h3>
    <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
    <h3>Nachrichtenüberblick</h3>
    <p>Die Kurzmeldungen im Nachrichtenbereich werden automatisiert aus öffentlich zugänglichen Quellen zusammengestellt und mit Hilfe künstlicher Intelligenz (Google Gemini) zusammengefasst. Die jeweilige Quelle ist verlinkt; maßgeblich ist der Originalbericht.</p>
    <h3>Haftung für Inhalte und Links</h3>
    <p>Für eigene Inhalte sind wir nach den allgemeinen Gesetzen verantwortlich. Für Inhalte verlinkter externer Seiten sind deren Betreiber verantwortlich. Werden uns Rechtsverletzungen bekannt, entfernen wir die betreffenden Inhalte oder Links umgehend. Rechtswidrige Inhalte in Chat, Forum oder Stellenanzeigen können Sie jederzeit an die oben genannte E-Mail-Adresse melden.</p>
  `,
  privacy: `
    <h2>Datenschutzerklärung</h2>
    <h3>1. Verantwortlicher</h3>
    <p>${address}<br>${contact}</p>

    <h3>2. Hosting und Backend (Google Firebase)</h3>
    <p>Die Website wird über Firebase Hosting ausgeliefert; Konten, Datenbank (Firestore) und Dateispeicher laufen ebenfalls über Firebase. Anbieter ist die Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland. Beim Aufruf der Seite werden technisch notwendige Daten wie IP-Adresse, Zeitpunkt und Browserinformationen verarbeitet, um die Seite auszuliefern und abzusichern (Art. 6 Abs. 1 lit. f DSGVO). Die Datenbank liegt in der EU (Region eur3). Eine Übermittlung an die Google LLC in den USA ist nicht ausgeschlossen; sie erfolgt auf Grundlage des EU-US Data Privacy Framework (Angemessenheitsbeschluss der EU-Kommission vom 10.07.2023). Mit Google besteht ein Auftragsverarbeitungsvertrag.</p>

    <h3>3. Schriftarten und Bibliotheken</h3>
    <p>Schriftarten, Icons und Programmbibliotheken werden von unserem eigenen Server geladen. Eine Verbindung zu Google Fonts oder anderen CDNs findet nicht statt.</p>

    <h3>4. Nutzerkonto (Google-Anmeldung)</h3>
    <p>Für Chat, Stellenanzeigen und Lesezeichen können Sie sich mit Ihrem Google-Konto anmelden. Wir erhalten dabei Name, E-Mail-Adresse, Profilbild und eine Nutzerkennung (Art. 6 Abs. 1 lit. b DSGVO). Die Anmeldung erfolgt über Firebase Authentication.</p>

    <h3>5. Chat, Forum und Stellenanzeigen</h3>
    <p>Chatnachrichten werden mit Ihrem Anzeigenamen und Profilbild öffentlich angezeigt. Forumsfragen und Antworten können ohne Konto mit einem frei gewählten Namen eingereicht werden; Fragen und Stellenanzeigen werden vor der Veröffentlichung geprüft. Die Inhalte werden gespeichert, bis sie gelöscht werden oder Sie die Löschung verlangen (Art. 6 Abs. 1 lit. b und f DSGVO).</p>

    <h3>6. Push-Benachrichtigungen</h3>
    <p>Wenn Sie Benachrichtigungen aktivieren, speichern wir ein Geräte-Token und – falls Sie angemeldet sind – Ihre E-Mail-Adresse, um Ihnen Meldungen über Firebase Cloud Messaging zu senden (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG). Sie können die Einwilligung jederzeit in den Browsereinstellungen widerrufen.</p>

    <h3>7. Karte und Videos (nur nach Klick)</h3>
    <p>Die Stadtkarte lädt Kartenkacheln von CARTO (CARTO DB S.L., Madrid, Spanien) auf Basis von OpenStreetMap-Daten; das Video-Widget lädt Inhalte von YouTube (Google Ireland Limited) im erweiterten Datenschutzmodus. Beide Dienste werden erst geladen, wenn Sie auf „Laden“ klicken. Dabei wird Ihre IP-Adresse an den jeweiligen Anbieter übertragen (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG). Ihre Auswahl wird im Browser gespeichert; Sie widerrufen sie, indem Sie die Websitedaten löschen.</p>

    <h3>8. Lokale Speicherung im Browser</h3>
    <p>Wir setzen keine Tracking- oder Werbe-Cookies. Im lokalen Speicher Ihres Browsers legen wir nur ab, was für von Ihnen gewünschte Funktionen nötig ist: Sprache, Darstellung, abgegebene Umfrage-Stimme und Ihre Auswahl zu Karte und Videos (§ 25 Abs. 2 Nr. 2 TDDDG).</p>

    <h3>9. Ihre Rechte</h3>
    <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO) sowie auf Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO). Wenden Sie sich dazu an die oben genannte E-Mail-Adresse. Sie können sich außerdem bei einer Aufsichtsbehörde beschweren, etwa bei der Berliner Beauftragten für Datenschutz und Informationsfreiheit, Alt-Moabit 59–61, 10555 Berlin.</p>
  `,
};

const tr = {
  impressum: `
    <h2>Künye (Impressum)</h2>
    <p class="legal-note">Hukuken bağlayıcı olan Almanca metindir.</p>
    <h3>§ 5 DDG uyarınca bilgiler</h3>
    <p>${address}</p>
    <h3>İletişim</h3>
    <p>${contact}</p>
    <h3>İçerikten sorumlu (§ 18 Abs. 2 MStV)</h3>
    <p>${OWNER.editor}<br>Adres yukarıdaki gibidir</p>
    <h3>Tüketici uyuşmazlıkları</h3>
    <p>Bir tüketici hakem kurulu önündeki uyuşmazlık çözüm süreçlerine katılmaya hazır veya yükümlü değiliz.</p>
    <h3>Haber özetleri</h3>
    <p>Haber bölümündeki kısa haberler, herkese açık kaynaklardan otomatik olarak derlenir ve yapay zekâ (Google Gemini) yardımıyla özetlenir. Her haberde kaynak bağlantısı vardır; esas olan orijinal habertir.</p>
    <h3>İçerik ve bağlantılar için sorumluluk</h3>
    <p>Kendi içeriklerimizden genel yasalar çerçevesinde sorumluyuz. Bağlantı verilen dış sayfaların içeriğinden o sayfaların işletmecileri sorumludur. Bir hukuka aykırılıktan haberdar olduğumuzda ilgili içeriği veya bağlantıyı derhal kaldırırız. Sohbet, forum veya iş ilanlarındaki hukuka aykırı içerikleri yukarıdaki e-posta adresine bildirebilirsiniz.</p>
  `,
  privacy: `
    <h2>Gizlilik Politikası</h2>
    <p class="legal-note">Hukuken bağlayıcı olan Almanca metindir (Datenschutzerklärung).</p>
    <h3>1. Sorumlu</h3>
    <p>${address}<br>${contact}</p>
    <h3>2. Barındırma ve altyapı (Google Firebase)</h3>
    <p>Site, Firebase Hosting üzerinden yayınlanır; hesaplar, veritabanı (Firestore) ve dosya depolama da Firebase üzerinde çalışır. Hizmet sağlayıcı Google Ireland Limited'dir (Dublin, İrlanda). Sayfa açıldığında IP adresi, zaman ve tarayıcı bilgisi gibi teknik olarak gerekli veriler, sayfayı sunmak ve güvenliğini sağlamak için işlenir (GVKT md. 6/1 f). Veritabanı AB'de (eur3 bölgesi) bulunur. Google LLC'ye (ABD) aktarım olabilir; bu aktarım AB-ABD Veri Gizliliği Çerçevesi'ne dayanır. Google ile veri işleme sözleşmesi vardır.</p>
    <h3>3. Yazı tipleri ve kütüphaneler</h3>
    <p>Yazı tipleri, ikonlar ve kütüphaneler kendi sunucumuzdan yüklenir. Google Fonts veya başka bir CDN'ye bağlantı kurulmaz.</p>
    <h3>4. Kullanıcı hesabı (Google ile giriş)</h3>
    <p>Sohbet, iş ilanları ve kaydedilen haberler için Google hesabınızla giriş yapabilirsiniz. Bu sırada adınız, e-posta adresiniz, profil fotoğrafınız ve bir kullanıcı kimliği alınır (GVKT md. 6/1 b).</p>
    <h3>5. Sohbet, forum ve iş ilanları</h3>
    <p>Sohbet mesajları görünen adınız ve profil fotoğrafınızla herkese açık gösterilir. Forum soruları ve cevapları hesap olmadan, seçtiğiniz bir isimle gönderilebilir; sorular ve iş ilanları yayından önce kontrol edilir. İçerikler silinene veya siz silinmesini isteyene kadar saklanır.</p>
    <h3>6. Anlık bildirimler</h3>
    <p>Bildirimleri açarsanız, size Firebase Cloud Messaging ile haber gönderebilmek için bir cihaz anahtarı ve giriş yaptıysanız e-posta adresiniz saklanır (GVKT md. 6/1 a). İzni istediğiniz zaman tarayıcı ayarlarından geri alabilirsiniz.</p>
    <h3>7. Harita ve videolar (yalnızca tıklayınca)</h3>
    <p>Şehir haritası, OpenStreetMap verilerine dayanan harita görsellerini CARTO'dan (İspanya); video bölümü YouTube'dan (Google Ireland) gelişmiş gizlilik modunda içerik yükler. İkisi de yalnızca "Yükle"ye tıkladığınızda yüklenir ve bu sırada IP adresiniz ilgili hizmete iletilir (GVKT md. 6/1 a). Tercihiniz tarayıcınızda saklanır; site verilerini silerek geri alabilirsiniz.</p>
    <h3>8. Tarayıcıda yerel depolama</h3>
    <p>Takip veya reklam çerezi kullanmıyoruz. Tarayıcınızın yerel depolamasında yalnızca istediğiniz işlevler için gerekenleri tutarız: dil, görünüm, anket oyunuz ve harita/video tercihiniz.</p>
    <h3>9. Haklarınız</h3>
    <p>Bilgi alma, düzeltme, silme, işlemeyi kısıtlama, veri taşınabilirliği ve itiraz haklarına (GVKT md. 15–21) ve verdiğiniz izinleri geri alma hakkına sahipsiniz. Bunun için yukarıdaki e-posta adresine yazın. Ayrıca bir denetim makamına, örneğin Berlin Veri Koruma ve Bilgi Edinme Özgürlüğü Görevlisi'ne (Alt-Moabit 59–61, 10555 Berlin) şikâyette bulunabilirsiniz.</p>
  `,
};

const en = {
  impressum: `
    <h2>Imprint</h2>
    <p class="legal-note">The German version is legally binding.</p>
    <h3>Information pursuant to § 5 DDG</h3>
    <p>${address}</p>
    <h3>Contact</h3>
    <p>${contact}</p>
    <h3>Responsible for content (§ 18(2) MStV)</h3>
    <p>${OWNER.editor}<br>Address as above</p>
    <h3>News digest</h3>
    <p>Short news items are compiled automatically from publicly available sources and summarised with AI (Google Gemini). Each item links to its source; the original report prevails.</p>
    <h3>Reporting content</h3>
    <p>Please report unlawful content in chat, forum or job listings to the e-mail address above. We remove it promptly once we are aware of it.</p>
  `,
  privacy: `
    <h2>Privacy Policy</h2>
    <p class="legal-note">The German version (Datenschutzerklärung) is legally binding.</p>
    <h3>1. Controller</h3>
    <p>${address}<br>${contact}</p>
    <h3>2. Hosting and backend</h3>
    <p>The site, accounts, database (EU region eur3) and file storage run on Google Firebase (Google Ireland Limited). Technically required data such as your IP address is processed to deliver and secure the site (Art. 6(1)(f) GDPR). Transfers to Google LLC (USA) rely on the EU-US Data Privacy Framework.</p>
    <h3>3. Fonts and libraries</h3>
    <p>Fonts, icons and libraries are served from our own server; no connection to Google Fonts or other CDNs is made.</p>
    <h3>4. Accounts, chat, forum and jobs</h3>
    <p>Signing in with Google gives us your name, e-mail address, profile picture and a user ID (Art. 6(1)(b) GDPR). Chat messages are shown publicly with your display name and picture. Forum questions and job listings are reviewed before publication.</p>
    <h3>5. Push notifications</h3>
    <p>If you enable notifications we store a device token and, when signed in, your e-mail address (Art. 6(1)(a) GDPR). You can withdraw at any time in your browser settings.</p>
    <h3>6. Map and videos (click to load)</h3>
    <p>The map (tiles by CARTO, based on OpenStreetMap) and the YouTube widget (privacy-enhanced mode) load only after you click "Load"; your IP address is then sent to that provider (Art. 6(1)(a) GDPR).</p>
    <h3>7. Local storage</h3>
    <p>We use no tracking or advertising cookies. Local storage only keeps what the features you use require: language, theme, your poll vote and your map/video choice.</p>
    <h3>8. Your rights</h3>
    <p>You have the rights under Art. 15–21 GDPR and may withdraw consent at any time (Art. 7(3) GDPR). Contact us at the e-mail address above. You may also lodge a complaint with a supervisory authority, e.g. the Berlin Commissioner for Data Protection and Freedom of Information.</p>
  `,
};

export const legalDocs = { de, tr, en };

export function openLegal(type) {
  const lang = localStorage.getItem('bk-lang') || 'tr';
  const content = (legalDocs[lang] || legalDocs.de)[type] || legalDocs.de[type];
  document.getElementById('legalContent').innerHTML = content;
  document.getElementById('legalModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function closeLegal() {
  document.getElementById('legalModal').classList.remove('active');
  document.body.style.overflow = '';
}

window.openLegal = openLegal;
window.closeLegal = closeLegal;
