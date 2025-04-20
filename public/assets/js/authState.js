import { auth } from './FirebaseConfig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { db } from './FirebaseConfig.js';

// Safe DOM element handler with null checks
const getSafeElement = (id) => {
  const element = document.getElementById(id);
  if (!element) console.warn(`Element with ID '${id}' not found`);
  return element;
};

// Initialize authentication state listener
export function initAuthState() {
  onAuthStateChanged(auth, async (firebaseUser) => {
    try {
      const logoutWrapper = getSafeElement('logoutWrapper');
      const loginWrapper = getSafeElement('loginWrapper');
      const usernameSpan = getSafeElement('username');
      const viewFavoritesBtn = getSafeElement('viewFavorites');
      const localUser = JSON.parse(localStorage.getItem('currentUser'));

      // Determine authentication state
      const isAuthenticated = firebaseUser || (localUser?.isLocalUser);

      if (isAuthenticated) {
        // User is logged in (via either method)
        if (logoutWrapper) logoutWrapper.style.display = 'block';
        if (loginWrapper) loginWrapper.style.display = 'none';

        // Firebase user handling
        if (firebaseUser) {
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            const userData = userDoc.exists() ? userDoc.data() : { favorites: [] };

            localStorage.setItem('currentUser', JSON.stringify({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              username: firebaseUser.displayName || firebaseUser.email.split('@')[0],
              isLocalUser: false,
              favorites: userData.favorites || []
            }));

            if (usernameSpan) {
              usernameSpan.textContent = firebaseUser.displayName || firebaseUser.email.split('@')[0];
            }
          } catch (error) {
            console.error("Firestore data load error:", error);
          }
        }
        // Local user handling
        else if (localUser) {
          if (usernameSpan) {
            usernameSpan.textContent = localUser.username || 'User';
          }
        }
      } else {
        // User is logged out
        if (logoutWrapper) logoutWrapper.style.display = 'none';
        if (loginWrapper) loginWrapper.style.display = 'block';
        if (usernameSpan) usernameSpan.textContent = 'Guest';
        localStorage.removeItem('currentUser');
      }

      // Handle favorites button state
      if (viewFavoritesBtn) {
        viewFavoritesBtn.disabled = !isAuthenticated;
      }
    } catch (error) {
      console.error("Auth state change error:", error);
    }
  });
}

// Enhanced logout handler
export async function handleLogout() {
  try {
    // Clear both authentication methods
    localStorage.removeItem('currentUser');
    await auth.signOut();
    
    // Force UI update
    initAuthState();
    
    return true;
  } catch (error) {
    console.error("Logout failed:", error);
    return false;
  }
}

// Get current user from either source
export function getCurrentAuthState() {
  return {
    firebaseUser: auth.currentUser,
    localUser: JSON.parse(localStorage.getItem('currentUser'))
  };
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initAuthState();
  
  // Setup logout button if exists
  const logoutBtn = getSafeElement('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await handleLogout();
      window.location.href = 'login.html';
    });
  }
});