// Scripts for firebase and firebase-messaging
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD6gKsqI-JaxsRqMdB3UDayb2bvNKfpU3A",
  authDomain: "berlin-konusuyor.firebaseapp.com",
  projectId: "berlin-konusuyor",
  storageBucket: "berlin-konusuyor.firebasestorage.app",
  messagingSenderId: "737902412085",
  appId: "1:737902412085:web:f9fee790ad15697852cc7c"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background Message: ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image || '/icon-192.png',
    data: { url: payload.data?.url || '/' }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
