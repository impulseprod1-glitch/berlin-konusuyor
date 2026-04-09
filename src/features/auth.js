import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged } from '../firebase-config.js';
import { updateChatAuthState } from './chat.js';

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Login Error:", error);
  }
}

export function initAuthListener() {
  onAuthStateChanged(auth, (user) => {
    const loginLabel = document.getElementById('loginLabel');
    const profileEmail = document.getElementById('profileEmail');
    const loginBtn = document.getElementById('loginBtn');

    updateChatAuthState(user);

    if (user) {
      if (loginLabel) loginLabel.innerText = user.displayName || user.email;
      if (profileEmail) profileEmail.textContent = user.email;

      if (loginBtn) {
        const ALLOWED_ADMINS = ['test@admin.com', 'oarslanerbln@gmail.com'];
        const isAdmin = ALLOWED_ADMINS.includes(user.email);
        
        loginBtn.innerHTML = isAdmin 
          ? '<i class="fas fa-user-shield"></i> Yönetim' 
          : '<i class="fas fa-user-circle"></i> Profil';
          
        loginBtn.onclick = () => window.location.href = isAdmin ? '/admin.html' : '/profile.html';
      }

      const modal = document.getElementById('loginModal');
      if (modal) modal.classList.remove('active');
    } else {
      if (loginLabel) loginLabel.innerText = 'Giriş Yap';
      if (loginBtn) {
        loginBtn.innerHTML = 'Giriş Yap';
        loginBtn.onclick = (e) => {
          e.preventDefault();
          loginWithGoogle();
        };
      }
    }
  });
}

export function handleMobileProfile(e) {
  if (e) e.preventDefault();
  if (auth.currentUser) {
    window.location.href = 'profile.html';
  } else {
    // Assuming login method might want to just loginwithGoogle
    loginWithGoogle();
  }
}

export function logout() {
  signOut(auth).then(() => location.reload());
}

// Global UI listeners
window.loginWithGoogle = loginWithGoogle;
window.logout = logout;
window.handleMobileProfile = handleMobileProfile;

