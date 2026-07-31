import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, query, where, orderBy, onSnapshot, addDoc, setDoc,
  serverTimestamp, doc, updateDoc, increment, getDocs, getDoc, deleteDoc
} from "firebase/firestore";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD6gKsqI-JaxsRqMdB3UDayb2bvNKfpU3A",
  authDomain: "berlin-konusuyor.firebaseapp.com",
  projectId: "berlin-konusuyor",
  storageBucket: "berlin-konusuyor.firebasestorage.app",
  messagingSenderId: "737902412085",
  appId: "1:737902412085:web:f9fee790ad15697852cc7c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

/* ── Tembel yüklenen modüller ────────────────────────────────
   Storage yalnızca medya yüklenirken (admin paneli + sohbet
   görseli), Messaging yalnızca bildirim kullanılırken gerekir.
   Bunları ilk yükten çıkarmak ana paketi belirgin şekilde
   küçültür.

   Ayrıca getMessaging() desteklenmeyen tarayıcılarda hata
   fırlatıyordu; bu modül seviyesinde çalıştığı için tüm siteyi
   kırma riski taşıyordu. Artık isSupported() ile korunuyor ve
   hata yalnızca bildirim özelliğini etkiliyor. */

let storagePromise = null;

/**
 * Firebase Storage modülünü ve örneğini gerektiğinde yükler.
 * @returns {Promise<{storage:object, ref:Function, uploadBytes:Function,
 *   uploadBytesResumable:Function, getDownloadURL:Function, deleteObject:Function}>}
 */
export function loadStorage() {
  if (!storagePromise) {
    storagePromise = import("firebase/storage").then((mod) => ({
      storage: mod.getStorage(app),
      ref: mod.ref,
      uploadBytes: mod.uploadBytes,
      uploadBytesResumable: mod.uploadBytesResumable,
      getDownloadURL: mod.getDownloadURL,
      deleteObject: mod.deleteObject,
    }));
  }
  return storagePromise;
}

let messagingPromise = null;

/**
 * Firebase Messaging modülünü gerektiğinde yükler.
 * Tarayıcı desteklemiyorsa hata fırlatmadan null döner.
 * @returns {Promise<{messaging:object, getToken:Function, onMessage:Function}|null>}
 */
export function loadMessaging() {
  if (!messagingPromise) {
    messagingPromise = import("firebase/messaging")
      .then(async (mod) => {
        if (!(await mod.isSupported())) {
          console.warn('[Firebase] Bu tarayıcı push bildirimlerini desteklemiyor.');
          return null;
        }
        return { messaging: mod.getMessaging(app), getToken: mod.getToken, onMessage: mod.onMessage };
      })
      .catch((err) => {
        console.warn('[Firebase] Messaging yüklenemedi:', err.message);
        return null;
      });
  }
  return messagingPromise;
}

let functionsPromise = null;

/**
 * Firebase Functions modülünü ve örneğini gerektiğinde yükler
 * (yalnızca admin claim senkronizasyonunda kullanılır).
 * Fonksiyonlar eur3 Firestore'un yanında, europe-west3'te —
 * bölge burada da eşleşmeli.
 * @returns {Promise<{functions:object, httpsCallable:Function}>}
 */
export function loadFunctions() {
  if (!functionsPromise) {
    functionsPromise = import('firebase/functions').then((mod) => ({
      functions: mod.getFunctions(app, 'europe-west3'),
      httpsCallable: mod.httpsCallable,
    }));
  }
  return functionsPromise;
}

export {
  app, db, auth, googleProvider,
  collection, query, where, orderBy, onSnapshot, addDoc, setDoc,
  serverTimestamp, doc, updateDoc, increment, getDocs, getDoc, deleteDoc,
  signInWithPopup, signOut, onAuthStateChanged
};
