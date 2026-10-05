// Accounts allowed into the admin panel. The real enforcement lives in
// firestore.rules and storage.rules; this list only drives the UI.
// Keep all three in sync.
export const ADMIN_EMAILS = ['oarslanerbln@gmail.com'];

export function isAdminUser(user) {
  return Boolean(user && user.emailVerified && ADMIN_EMAILS.includes(user.email));
}
