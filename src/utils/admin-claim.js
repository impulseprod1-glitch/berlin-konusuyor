import { loadFunctions } from '../firebase-config.js';

/**
 * Giriş yapmış kullanıcının admin olup olmadığını, Firebase Auth
 * token'ındaki "admin" custom claim'inden okur. Claim henüz yoksa
 * (ör. adminin ilk girişi) `syncAdminClaim` Cloud Function'ını bir
 * kez çağırıp token'ı tazeler — bkz. functions/index.js.
 * @param {import('firebase/auth').User|null} user
 * @returns {Promise<boolean>}
 */
export async function resolveAdminStatus(user) {
  if (!user) return false;

  const current = await user.getIdTokenResult();
  if (current.claims.admin === true) return true;

  try {
    const { functions, httpsCallable } = await loadFunctions();
    const syncAdminClaim = httpsCallable(functions, 'syncAdminClaim');
    const { data } = await syncAdminClaim();
    if (data?.admin) {
      await user.getIdToken(true);
      return true;
    }
  } catch (err) {
    console.warn('[admin] Claim senkronizasyonu başarısız:', err.message);
  }
  return false;
}
