import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    console.log("Mevcut Modeller:");
    data.models.forEach(m => console.log(m.name, m.version, m.supportedGenerationMethods.join(',')));
  } catch (err) {
    console.error(err);
  }
}
run();
