import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, query, where, orderBy, onSnapshot, addDoc, setDoc,
  serverTimestamp, doc, updateDoc, increment, getDocs 
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

export { 
  db, auth, googleProvider,
  collection, query, where, orderBy, onSnapshot, addDoc, setDoc,
  serverTimestamp, doc, updateDoc, increment, getDocs,
  signInWithPopup, signOut, onAuthStateChanged
};
