import { storage, ref, uploadBytes, getDownloadURL } from '../firebase-config.js';

/**
 * Uploads a file to Firebase Storage
 * @param {File} file - The file object to upload
 * @param {string} path - The path in storage (e.g., 'news-images/filename.jpg')
 * @returns {Promise<string>} - The download URL of the uploaded file
 */
export async function uploadMedia(file, path) {
  if (!file) return null;
  
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Medya yükleme hatası:', error);
    throw error;
  }
}
