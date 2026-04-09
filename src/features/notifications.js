import { messaging, db, getToken, onMessage, collection, addDoc, query, where, getDocs, setDoc, doc } from '../firebase-config.js';

const VAPID_KEY = "BKB-eES6AMxMmUTnrXOugT0kz1dZ92MmS1fjC6Jdu8wmNV_xdLmeWOOMM08e-2GTV5lYrkVeU0zYarVjjfNP0Sw"; // USER: Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates

export async function initNotifications() {
  if (!('Notification' in window)) {
    console.warn('Bu tarayıcı bildirimleri desteklemiyor.');
    return;
  }

  // Check if we already have permission or should ask
  if (Notification.permission === 'default') {
    // We could show a custom UI toast first to not be invasive
  }

  // Handle foreground messages
  onMessage(messaging, (payload) => {
    showCustomNotification(payload.notification);
  });
}

export async function requestNotificationPermission(userEmail = null) {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
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
