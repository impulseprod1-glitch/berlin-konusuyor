import { db, collection, addDoc, serverTimestamp } from './src/firebase-config.js';

async function seedPoll() {
  try {
    const pollData = {
      question: "Berlin'in en sevdiğiniz yanı nedir?",
      options: [
        { text: "Kültürel Çeşitlilik", votes: 42 },
        { text: "Gece Hayatı", votes: 28 },
        { text: "Parklar ve Doğası", votes: 35 },
        { text: "Tarihi Atmosfer", votes: 19 }
      ],
      createdAt: serverTimestamp(),
      active: true
    };

    const docRef = await addDoc(collection(db, 'polls'), pollData);
    console.log("✅ Örnek anket eklendi. ID:", docRef.id);
  } catch (e) {
    console.error("❌ Hata:", e);
  }
}

seedPoll();
