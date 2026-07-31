import { db, loadMessaging, setDoc, doc } from '../firebase-config.js';

const VAPID_KEY = "BKB-eES6AMxMmUTnrXOugT0kz1dZ92MmS1fjC6Jdu8wmNV_xdLmeWOOMM08e-2GTV5lYrkVeU0zYarVjjfNP0Sw"; // USER: Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates

export async function initNotifications() {
  if (!('Notification' in window)) {
    console.warn('Bu tarayıcı bildirimleri desteklemiyor.');
    return;
  }

  // Ön plan bildirim dinleyicisi yalnızca kullanıcı zaten izin vermişse
  // anlamlıdır. İzin yoksa Messaging SDK'sını hiç indirmiyoruz —
  // ziyaretçilerin büyük çoğunluğu için ~45 kB tasarruf.
  if (Notification.permission !== 'granted') return;

  const fcm = await loadMessaging();
  if (!fcm) return;

  // Uygulama açıkken gelen bildirimler
  fcm.onMessage(fcm.messaging, (payload) => {
    showCustomNotification(payload.notification);
  });
}

export async function requestNotificationPermission(userEmail = null) {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const fcm = await loadMessaging();
      if (!fcm) return false;

      const token = await fcm.getToken(fcm.messaging, { vapidKey: VAPID_KEY });
      if (token) {
        await saveToken(token, userEmail);
        return true;
      }
    }
  } catch (error) {
    console.error('Bildirim izni alınamadı:', error);
  }
  return false;
}

async function saveToken(token, email) {
  const tokenRef = doc(db, 'fcm_tokens', token);
  await setDoc(tokenRef, {
    token: token,
    email: email || 'anonymous',
    updatedAt: new Date().toISOString()
  });
}

function showCustomNotification(notif) {
  // Simple toast or snackbar logic could go here
  // For now, let's use the browser notification if in foreground
  new Notification(notif.title, {
    body: notif.body,
    icon: notif.image || '/icon-192.png'
  });
}
