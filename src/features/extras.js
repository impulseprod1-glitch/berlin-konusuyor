import { db, doc, collection, query, orderBy, getDocs, updateDoc } from '../firebase-config.js';

// ── AI Chatbot Assistant (Knowledge-Base Powered) ──────────
const BERLIN_KB = [
  { keys: ['anmeldung','adres','kayıt','registration','adresse','anmelden'], answer: '📋 **Anmeldung (Adres Kaydı)**\n\nBerlin\'e taşındıktan sonra **14 gün içinde** Bürgeramt\'a gidip adres kaydı yaptırmanız gerekir.\n\n🔹 Gerekli belgeler:\n• Kimlik/Pasaport\n• Kira sözleşmesi\n• Wohnungsgeberbestätigung (ev sahibinden onay formu)\n\n🔹 Online randevu: service.berlin.de\n\n💡 İpucu: Randevu bulmak zor olabilir. Her sabah 08:00\'da yeni randevular açılır!' },
  { keys: ['ev','kira','wohnung','daire','kiralık','ev bulma','mietwohnung','housing'], answer: '🏠 **Berlin\'de Ev Bulma**\n\nPopüler arama siteleri:\n• immobilienscout24.de\n• wg-gesucht.de (paylaşımlı ev)\n• ebay-kleinanzeigen.de\n• immowelt.de\n\n🔹 Ortalama kira (soğuk):\n• 1+1: 600-900€\n• 2+1: 900-1.300€\n• WG odası: 400-650€\n\n💡 İpucu: Schufa (kredi raporu) hazır bulundurun. Başvurularda öz-tanıtım mektubu çok işe yarar!' },
  { keys: ['vize','visum','visa','oturum','çalışma izni','aufenthaltstitel','blue card','mavi kart'], answer: '🛂 **Vize & Oturum İzni**\n\n🔹 Türk vatandaşları için:\n• Turist vizesi: Schengen vizesi (90 gün)\n• Çalışma vizesi: İş teklifi + Ausländerbehörde başvurusu\n• Mavi Kart (Blue Card): Üniversite diploması + yıllık min. ~43.800€ maaş\n\n🔹 Ausländerbehörde randevu:\notv.verwalt-berlin.de\n\n💡 İpucu: Başvuru öncesi tüm belgelerin noter onaylı çevirilerini hazırlayın.' },
  { keys: ['ulaşım','transport','bvg','u-bahn','s-bahn','bilet','fahrkarte','ticket','metro'], answer: '🚇 **Berlin Ulaşım Rehberi**\n\n🔹 Bilet türleri (AB Bölgesi):\n• Tek bilet: 3.20€\n• Günlük: 9.50€\n• Aylık: 86€\n• Deutschland-Ticket: 49€/ay (tüm Almanya!)\n\n🔹 Uygulamalar: BVG app, DB Navigator\n\n💡 İpucu: Deutschland-Ticket (49€) en mantıklı seçenek — bütün şehir içi + bölgesel trenlerde geçerli!' },
  { keys: ['iş','job','arbeit','çalışmak','maaş','gehalt','iş bulma','bewerbung'], answer: '💼 **Berlin\'de İş Bulma**\n\nPopüler iş arama platformları:\n• linkedin.com\n• indeed.de\n• stepstone.de\n• xing.com\n• arbeitsagentur.de\n\n🔹 Ortalama maaşlar (brüt):\n• IT Uzmanı: 55-75k€\n• Gastronomi: 28-35k€\n• Ofis işleri: 35-50k€\n\n💡 İpucu: Almanca bilmek büyük avantaj! VHS (Volkshochschule) kursları oldukça uygun fiyatlı.' },
  { keys: ['yeme','restoran','restaurant','yemek','cafe','kafe','döner','türk','essen','food'], answer: '🍽️ **Yeme & İçme Rehberi**\n\nKreuzberg\'in en iyileri:\n• Hasır (Adalbertstr.) — Klasik Türk mutfağı\n• Mustafa\'s Gemüse Kebap — Efsanevi döner\n• Five Elephant — Specialty kahve\n• Markthalle Neun — Street food cenneti\n\n🔹 Neukölln:\n• Sonnenallee ("Arap Sokağı") — Ortadoğu lezzetleri\n• Lavanderia Vecchia — İtalyan fine dining\n\n💡 İpucu: Öğle yemeklerinde "Mittagstisch" menülerine bakın — 7-12€ arası!' },
  { keys: ['sağlık','arzt','doktor','hastane','sigorta','versicherung','krankenhaus','health'], answer: '🏥 **Sağlık Sistemi**\n\n🔹 Sigorta:\n• Zorunlu sağlık sigortası (gesetzliche KV): TK, AOK, Barmer\n• Aylık: Maaşın ~%14.6\'sı (yarısını işveren öder)\n\n🔹 Acil durumlar:\n• Acil: 112 numarayı arayın\n• Ärztlicher Bereitschaftsdienst: 116 117\n\n💡 İpucu: Doctolib uygulaması ile kolayca doktor randevusu alabilirsiniz.' },
  { keys: ['dil','almanca','deutsch','sprache','kurs','öğrenmek','lernen','language'], answer: '📚 **Almanca Öğrenme**\n\nÜcretsiz/uygun kaynaklar:\n• VHS (Volkshochschule) — dönemlik kurslar (~100-200€)\n• DW (Deutsche Welle) — ücretsiz online kurs\n• Goethe Institut — profesyonel kurslar\n• Tandem dil uygulamaları\n\n🔹 Önemli seviyeler:\n• A1-A2: Günlük yaşam\n• B1: Oturum izni için gerekli\n• B2-C1: İş dünyası\n\n💡 İpucu: Kreuzberg ve Neukölln\'de Türkçe konuşanlar çok ama Almanca pratik için Prenzlauer Berg idealdir!' },
  { keys: ['gece','nightlife','club','party','techno','berghain','bar','eğlence'], answer: '🎶 **Berlin Gece Hayatı**\n\nEfsanevi kulüpler:\n• Berghain/Panorama Bar — Techno tapınağı\n• Tresor — Endüstriyel techno\n• Watergate — Spree nehri manzaralı\n• KitKat Club — Öncü\n• Sisyphos — Açık hava partisi\n\n💡 İpucu: Berghain\'e giriş garanti değil! Sade giyinin, küçük gruplarla gidin ve Almanca konuşun.' },
  { keys: ['hava','wetter','weather','sıcaklık','yağmur','mevsim'], answer: '🌤️ **Berlin Hava Durumu**\n\nMevsimsel ortalamalar:\n• Yaz (Haz-Ağu): 20-30°C, uzun günler\n• Kış (Kas-Şub): -5 ile 5°C, erken karanlık\n• İlkbahar/Sonbahar: 8-18°C, değişken\n\n💡 İpucu: Kış çok karanlık olabilir, D vitamini almanız önerilir. Yaz aylarında parklar ve göller harikadır!' },
  { keys: ['banka','konto','hesap','bank','n26','finans'], answer: '🏦 **Banka Hesabı Açma**\n\nPopüler bankalar:\n• N26 — %100 online, hızlı açılım\n• Deutsche Bank — Geleneksel\n• Commerzbank — Yaygın ATM ağı\n• ING — Ücretsiz Girokonto\n\n🔹 Gerekli belgeler:\n• Kimlik/Pasaport\n• Anmeldung belgesi\n• Bazen Schufa (kredi raporu)\n\n💡 İpucu: N26 oder Wise ile Anmeldung\'dan bile önce hesap açabilirsiniz!' },
  { keys: ['kültür','museum','müze','sanat','kultur','galeri','ausstellung'], answer: '🎭 **Kültür & Müzeler**\n\nÜcretsiz/indirimli müzeler:\n• Museumsinsel (UNESCO) — kombi bilet 22€\n• East Side Gallery — ücretsiz\n• Gedenkstätte Berliner Mauer — ücretsiz\n• Her ayın ilk Pazar günü birçok müze ücretsiz!\n\n💡 İpucu: Museum Pass Berlin (3 gün) 36€ — 30+ müzeye giriş!' },
  { keys: ['çocuk','kita','kreş','okul','schule','kindergarten','aile'], answer: '👶 **Çocuk & Eğitim**\n\nBerlin\'de Kita (kreş):\n• Başvuru: kita-navigator.berlin.de\n• 0-6 yaş arası ücretsiz (son yıl zorunlu)\n• Erken başvuru yapın — bekleme listesi uzun!\n\n🔹 Okullar:\n• Devlet okulları ücretsiz\n• Türk-Alman Eğitim Merkezi Kreuzberg\'de\n\n💡 İpucu: Kita başvurusunu doğumdan hemen sonra yapın!' },
  { keys: ['merhaba','selam','hello','hi','hey','naber','nasılsın'], answer: 'Merhaba! 👋 Ben Berlin Konuşuyor Asistanı. Size Berlin hakkında her konuda yardımcı olabilirim.\n\nŞu konularda sorular sorabilirsiniz:\n📋 Anmeldung & Resmi işlemler\n🏠 Ev bulma\n🛂 Vize & Oturum\n🚇 Ulaşım\n💼 İş arama\n🍽️ Yeme & İçme\n🎶 Gece hayatı\n\nYa da aşağıdaki hızlı butonları kullanın!' },
  { keys: ['teşekkür','sağol','danke','thanks','eyvallah'], answer: 'Rica ederim! 😊 Berlin\'de size yardımcı olmaktan mutluluk duyarım. Başka sorunuz olursa çekinmeden sorun!\n\n📧 Daha detaylı sorularınız için: berlinkonusuyor@outlook.de' },
  { keys: ['schufa','kredi','kredit','credit'], answer: '📊 **Schufa (Kredi Raporu)**\n\nSchufa, Almanya\'daki kredi itibar sistemidir.\n\n🔹 Nasıl alınır?\n• meineschufa.de → Ücretsiz kopyayı "Datenkopie" bölümünden talep edin\n• Ücretli anında erişim: ~29.95€\n\n🔹 Neden önemli?\n• Ev kiralama başvurularında şart\n• Telefon aboneliği, kredi kartı\n\n💡 İpucu: Ücretsiz Schufa kopyası yılda 1 kez hakkınızdır!' },
  { keys: ['spor','sport','fitness','gym','yüzme','schwimmen'], answer: '🏋️ **Spor İmkanları**\n\nUygun fiyatlı seçenekler:\n• Fitness First, McFit: ~20-30€/ay\n• Urban Sports Club: ~50-100€/ay (çoklu tesis)\n• Berlin\'deki açık hava spor alanları ücretsiz!\n• Halk yüzme havuzları: ~5-6€/giriş\n\n💡 İpucu: Tiergarten ve Tempelhofer Feld koşu için mükemmel!' },
];

export function initChatbot() {
  const chatbotWindow = document.getElementById('chatbotWindow');
  const chatbotMessages = document.getElementById('chatbotMessages');
  const chatbotForm = document.getElementById('chatbotForm');
  const chatbotInput = document.getElementById('chatbotInput');

  window.toggleChatbot = () => {
    if(chatbotWindow) {
      chatbotWindow.classList.toggle('active');
      if (chatbotWindow.classList.contains('active') && chatbotInput) {
        setTimeout(() => chatbotInput.focus(), 300);
      }
    }
  };

  function findBestAnswer(query) {
    const q = query.toLowerCase().replace(/[?.!,]/g, '');
    const words = q.split(/\s+/);
    let bestMatch = null;
    let bestScore = 0;

    for (const item of BERLIN_KB) {
      let score = 0;
      for (const key of item.keys) {
        const keyLower = key.toLowerCase();
        if (q.includes(keyLower)) score += keyLower.length * 3;
        for (const word of words) {
          if (word.length < 2) continue;
          if (keyLower.includes(word) || word.includes(keyLower)) {
            score += word.length;
          }
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }

    if (bestScore >= 4 && bestMatch) return bestMatch.answer;
    return null;
  }

  function formatBotMessage(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>').replace(/• /g, '&bull; ');
  }

  function addChatMsg(content, cls, id = '') {
    const div = document.createElement('div');
    div.className = `chat-msg ${cls}`;
    div.innerHTML = content;
    if (id) div.id = id;
    if (chatbotMessages) {
      chatbotMessages.appendChild(div);
      chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }
  }

  function handleChatQuery(query) {
    addChatMsg(query, 'user-msg');
    const typingId = 'typing-' + Date.now();
    addChatMsg('<div class="typing-indicator"><span></span><span></span><span></span></div>', 'bot-msg', typingId);

    setTimeout(() => {
      const typingEl = document.getElementById(typingId);
      if (typingEl) typingEl.remove();

      const answer = findBestAnswer(query);
      if (answer) {
        addChatMsg(formatBotMessage(answer), 'bot-msg');
      } else {
        addChatMsg(formatBotMessage('🤔 Bu konuda henüz bilgi bankamda yeterli veri yok. Ama size yardımcı olmak isterim!\n\n📧 Detaylı sorularınız için: <a href="mailto:berlinkonusuyor@outlook.de" style="color:var(--accent);text-decoration:underline;">berlinkonusuyor@outlook.de</a>'), 'bot-msg');
      }
    }, 800 + Math.random() * 600);
  }

  if (chatbotForm) {
    chatbotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const txt = chatbotInput.value.trim();
      if (!txt) return;
      chatbotInput.value = '';
      handleChatQuery(txt);
    });
  }

  document.querySelectorAll('.quick-reply-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const query = btn.dataset.query;
      if (query) handleChatQuery(query);
    });
  });
}

// ── Polls ─────────────────
export async function initPolls() {
  const pollQuestionEl = document.getElementById('pollQuestion');
  const pollOptionsEl = document.getElementById('pollOptions');
  const pollTotalEl = document.getElementById('pollTotal');
  const pollResetBtn = document.getElementById('pollReset');

  if (!pollQuestionEl || !pollOptionsEl) return;

  try {
    const pollsRef = collection(db, 'polls');
    const q = query(pollsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      pollQuestionEl.innerText = "Şu an aktif bir anket bulunmuyor.";
      return;
    }

    const pollDoc = querySnapshot.docs[0];
    const pollId = pollDoc.id;
    const pollData = pollDoc.data();

    pollQuestionEl.innerText = pollData.question;
    const votedId = localStorage.getItem(`bk-poll-${pollId}`);

    renderPollOptions(pollId, pollData, votedId);

    pollResetBtn?.addEventListener('click', () => {
      localStorage.removeItem(`bk-poll-${pollId}`);
      renderPollOptions(pollId, pollData, null);
      pollResetBtn.classList.add('hidden');
    });

    if (votedId && pollResetBtn) pollResetBtn.classList.remove('hidden');

  } catch (error) {
    console.error("Poll error:", error);
    pollQuestionEl.innerText = "Anket yüklenirken bir hata oluştu.";
  }
}

function renderPollOptions(pollId, pollData, votedId) {
  const pollOptionsEl = document.getElementById('pollOptions');
  const pollTotalEl = document.getElementById('pollTotal');
  const options = pollData.options || [];
  const totalVotes = options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
  
  if(pollTotalEl) pollTotalEl.innerText = `Toplam ${totalVotes} oy`;

  if(pollOptionsEl) {
    pollOptionsEl.innerHTML = options.map((option, index) => {
      const percent = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
      const isVoted = votedId !== null;
      const isSelected = votedId === String(index);

      return `
        <button class="poll-option-btn ${isVoted ? 'voted' : ''} ${isSelected ? 'selected' : ''}"
                onclick="votePoll('${pollId}', ${index})"
                ${isVoted ? 'disabled' : ''}>
          <div class="poll-progress-bg" style="width: ${isVoted ? percent : 0}%"></div>
          <span class="poll-option-text">${option.text}</span>
          <span class="poll-option-percent">${percent}%</span>
        </button>
      `;
    }).join('');
  }
}

window.votePoll = async (pollId, optionIndex) => {
  try {
    const pollRef = doc(db, 'polls', pollId);
    const querySnapshot = await getDocs(query(collection(db, 'polls')));
    const pollDoc = querySnapshot.docs.find(d => d.id === pollId);
    if (!pollDoc) return;

    const pollData = pollDoc.data();
    const options = [...pollData.options];
    options[optionIndex].votes = (options[optionIndex].votes || 0) + 1;

    await updateDoc(pollRef, { options });
    localStorage.setItem(`bk-poll-${pollId}`, String(optionIndex));
    renderPollOptions(pollId, { ...pollData, options }, String(optionIndex));
    const btn = document.getElementById('pollReset');
    if(btn) btn.classList.remove('hidden');
  } catch (error) {
    console.error("Vote error:", error);
  }
};

// ── TTS ───────────────────
let synth = window.speechSynthesis;
let isSpeaking = false;

window.toggleTTS = () => {
  const ttsBtn = document.getElementById('ttsBtn');
  const titleEl = document.getElementById('newsModalTitle');
  const descEl = document.getElementById('newsModalDesc');
  if (!titleEl || !descEl) return;
  const title = titleEl.innerText;
  const desc = descEl.innerText;

  if (!synth) return;

  if (isSpeaking) {
    synth.cancel();
    isSpeaking = false;
    if(ttsBtn) ttsBtn.innerHTML = '<i class="fas fa-volume-up"></i> <span data-i18n="listen_news">Dinle</span>';
    return;
  }

  const textToRead = title + '. ' + desc;
  const utterance = new SpeechSynthesisUtterance(textToRead);
  utterance.lang = localStorage.getItem('bk-lang') === 'tr' ? 'tr-TR' : localStorage.getItem('bk-lang') === 'de' ? 'de-DE' : 'en-US';

  utterance.onend = () => {
    isSpeaking = false;
    if(ttsBtn) ttsBtn.innerHTML = '<i class="fas fa-volume-up"></i> <span data-i18n="listen_news">Dinle</span>';
  };

  synth.speak(utterance);
  isSpeaking = true;
  if(ttsBtn) ttsBtn.innerHTML = '<i class="fas fa-stop"></i> <span data-i18n="listen_stop">Durdur</span>';
};

window.stopTTS = () => {
  if (synth && isSpeaking) {
    synth.cancel();
    isSpeaking = false;
    const ttsBtn = document.getElementById('ttsBtn');
    if (ttsBtn) ttsBtn.innerHTML = '<i class="fas fa-volume-up"></i> <span data-i18n="listen_news">Dinle</span>';
  }
};

// ── History Shake ──────────
const BERLIN_HISTORY_EVENTS = [
  { date: "9 KASIM 1989", title: "Berlin Duvarı Yıkılıyor", text: "Soğuk Savaş'ın simgesi olan Berlin Duvarı, halkın baskısı ve yanlış anlaşılan bir basın açıklaması sonucu açıldı.", image: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?q=80&w=800&auto=format&fit=crop" }
];

export function initShakeHistory() {
  const modal = document.getElementById('historyModal');
  const hint = document.getElementById('shakeHint');
  let shakeThreshold = 15;
  let lastX, lastY, lastZ;
  let lastUpdate = 0;
  let isShaking = false;

  if (window.innerWidth < 768) {
    setTimeout(() => {
      if (!localStorage.getItem('bk-shake-hint-shown')) {
        hint?.classList.add('visible');
        setTimeout(() => hint?.classList.remove('visible'), 5000);
        localStorage.setItem('bk-shake-hint-shown', 'true');
      }
    }, 10000);
  }

  const handleMotion = (event) => {
    const acceleration = event.accelerationIncludingGravity;
    if(!acceleration) return;
    const curTime = Date.now();

    if ((curTime - lastUpdate) > 100) {
      const diffTime = curTime - lastUpdate;
      lastUpdate = curTime;
      const x = acceleration.x;
      const y = acceleration.y;
      const z = acceleration.z;
      const speed = Math.abs(x + y + z - (lastX||0) - (lastY||0) - (lastZ||0)) / diffTime * 10000;

      if (speed > shakeThreshold && !isShaking && modal && !modal.classList.contains('active')) {
        isShaking = true;
        window.triggerHistoryPortal();
        setTimeout(() => { isShaking = false; }, 2000);
      }
      lastX = x; lastY = y; lastZ = z;
    }
  };

  const requestPermission = () => {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission().then(response => {
        if (response === 'granted') {
          window.addEventListener('devicemotion', handleMotion);
        }
      }).catch(console.error);
    } else {
      window.addEventListener('devicemotion', handleMotion);
    }
  };
  document.addEventListener('click', requestPermission, { once: true });
}

window.triggerHistoryPortal = () => {
  const modal = document.getElementById('historyModal');
  const event = BERLIN_HISTORY_EVENTS[Math.floor(Math.random() * BERLIN_HISTORY_EVENTS.length)];
  const dateEl = document.getElementById('historyDate');
  const titleEl = document.getElementById('historyTitle');
  const textEl = document.getElementById('historyText');
  const imageEl = document.getElementById('historyImage');
  
  if(dateEl) dateEl.textContent = event.date;
  if(titleEl) titleEl.textContent = event.title;
  if(textEl) textEl.textContent = event.text;
  if(imageEl) imageEl.style.backgroundImage = `url('${event.image}')`;

  if(modal) {
    modal.classList.add('active');
    const container = modal.querySelector('.history-portal-container');
    if(container) container.classList.add('portal-open');
  }

  if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
};

window.closeHistoryModal = () => {
  const modal = document.getElementById('historyModal');
  if(modal) {
    modal.classList.remove('active');
    const container = modal.querySelector('.history-portal-container');
    if(container) container.classList.remove('portal-open');
  }
};

// ── Swipe to dismiss ──────────
export function initSwipeToDismiss() {
  const modals = document.querySelectorAll('.modal, .news-modal');
  modals.forEach(modal => {
    const content = modal.querySelector('.modal-container, .modal-content, .news-modal-content, .history-portal-container');
    if (!content) return;
    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    content.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      isDragging = true;
      content.style.transition = 'none';
    }, { passive: true });

    content.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      currentY = e.touches[0].clientY - startY;
      if (currentY > 0) {
        const resistance = 0.4;
        const translateY = currentY * resistance;
        content.style.transform = `translateY(${translateY}px) scale(${1 - translateY / 2000})`;
        modal.style.backgroundColor = `rgba(0, 0, 0, ${0.8 - translateY / 1000})`;
      }
    }, { passive: true });

    content.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;
      content.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

      if (currentY > 150) {
        if (modal.id === 'newsModal' && typeof window.closeNewsModal === 'function') window.closeNewsModal();
        else if (modal.id === 'historyModal') window.closeHistoryModal();
        else {
          modal.classList.remove('active');
          document.body.style.overflow = '';
        }
      }
      content.style.transform = '';
      modal.style.backgroundColor = '';
      currentY = 0;
    });
  });
}

// ── Premium Interactions ─────
export function initCursorPremium() {
  const glow = document.getElementById('cursorGlow');
  const ring = document.getElementById('cursorRing');
  if (!glow || !ring || window.matchMedia('(max-width: 768px)').matches) return;

  let mouseX = 0, mouseY = 0;
  let glowX = 0, glowY = 0;
  let ringX = 0, ringY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!glow.classList.contains('active')) glow.classList.add('active');
  });
  document.addEventListener('mouseleave', () => glow.classList.remove('active'));

  function animate() {
    glowX += (mouseX - glowX) * 0.08;
    glowY += (mouseY - glowY) * 0.08;
    glow.style.left = glowX + 'px';
    glow.style.top = glowY + 'px';

    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;
    ring.style.left = ringX + 'px';
    ring.style.top = ringY + 'px';

    requestAnimationFrame(animate);
  }
  animate();

  const targets = 'a, button, .news-card, .yt-mini-card, .event-card';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(targets)) ring.classList.add('hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(targets)) ring.classList.remove('hover');
  });
}

export function initParallax() {
  const heroBg = document.querySelector('.hero::before') ? document.querySelector('.hero') : null;
  if (!heroBg) return;
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    if (scrolled < window.innerHeight) {
      const parallaxEl = heroBg.querySelector('.hero-content');
      if (parallaxEl) {
        parallaxEl.style.transform = `translateY(${scrolled * 0.15}px)`;
        parallaxEl.style.opacity = 1 - (scrolled / window.innerHeight) * 0.6;
      }
    }
  }, { passive: true });
}

export function initTiltEffects() {
  const cards = document.querySelectorAll('.glass-panel, .magnetic-card');
  if (window.matchMedia('(max-width: 768px)').matches) return;

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
  });
}

export function initCounters() {
  const counters = document.querySelectorAll('.stat-number');
  if (!counters.length) return;

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 2000;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(target * eased);

      if (target >= 1000) el.textContent = current.toLocaleString('de-DE') + suffix;
      else el.textContent = current + suffix;

      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const nums = entry.target.querySelectorAll('.stat-number');
        nums.forEach((el, i) => setTimeout(() => animateCounter(el), i * 200));
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  const statsBar = document.getElementById('statsBar');
  if (statsBar) observer.observe(statsBar);
}

export function initMagneticButtons() {
  const btns = document.querySelectorAll('.magnetic-btn');
  if (!btns.length || window.matchMedia('(max-width: 768px)').matches) return;
  btns.forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0, 0)';
    });
  });
}

export function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('.newsletter-input');
    const btn = form.querySelector('.newsletter-btn');
    const email = input.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      btn.textContent = 'Geçersiz E-posta!';
      btn.style.background = '#e74c3c';
      setTimeout(() => { btn.textContent = 'Abone Ol'; btn.style.background = ''; }, 2000);
      return;
    }
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    fetch('https://formsubmit.co/ajax/berlinkonusuyor@outlook.de', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email: email, _subject: 'Yeni Bülten Aboneliği' })
    })
    .then(async response => {
        btn.innerHTML = 'Kayıt Başarılı <i class="fas fa-check"></i>';
        btn.style.background = '#22c55e';
        input.value = '';
        setTimeout(() => { btn.textContent = 'Abone Ol'; btn.style.background = ''; }, 3000);
    })
    .catch(error => {
      console.error(error);
      btn.textContent = 'Bağlantı Hatası';
      btn.style.background = '#e74c3c';
      setTimeout(() => { btn.textContent = 'Abone Ol'; btn.style.background = ''; }, 2500);
    });
  });
}

// ── PWA Pull-to-Refresh Logic ──
export function initPullToRefresh() {
  const pwaStatus = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  // If we only want it in PWA: if (!pwaStatus) return;

  let startY = 0;
  let currentY = 0;
  const threshold = 120;
  
  const ptrSpinner = document.createElement('div');
  ptrSpinner.innerHTML = `<i class="fas fa-sync-alt" style="color:var(--accent); font-size:24px;"></i>`;
  ptrSpinner.style.position = 'fixed';
  ptrSpinner.style.top = '-60px';
  ptrSpinner.style.left = '50%';
  ptrSpinner.style.transform = 'translateX(-50%)';
  ptrSpinner.style.zIndex = '99999';
  ptrSpinner.style.transition = 'top 0.2s';
  ptrSpinner.style.background = 'rgba(255,255,255,0.1)';
  ptrSpinner.style.backdropFilter = 'blur(10px)';
  ptrSpinner.style.borderRadius = '50%';
  ptrSpinner.style.border = '1px solid rgba(255,255,255,0.2)';
  ptrSpinner.style.padding = '12px';
  ptrSpinner.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
  
  document.body.appendChild(ptrSpinner);

  document.addEventListener('touchstart', e => {
    if (window.scrollY === 0) startY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if (window.scrollY === 0 && startY > 0) {
      currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      
      if (diff > 0 && diff < threshold + 40) {
        ptrSpinner.style.top = Math.min((diff / 2) - 60, 30) + 'px';
        ptrSpinner.style.transform = `translateX(-50%) rotate(${diff * 2}deg)`;
      }
    }
  }, { passive: true });

  document.addEventListener('touchend', e => {
    if (startY > 0 && currentY > 0) {
      const diff = currentY - startY;
      if (diff > threshold) {
        ptrSpinner.style.top = '30px';
        ptrSpinner.querySelector('i').classList.add('fa-spin');
        if ('vibrate' in navigator) navigator.vibrate(50);
        setTimeout(() => location.reload(), 600);
      } else {
        ptrSpinner.style.top = '-60px';
      }
    }
    startY = 0;
    currentY = 0;
  }, { passive: true });
}
