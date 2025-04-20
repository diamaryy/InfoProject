import { auth, loginUser, db } from './FirebaseConfig.js';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut 
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { 
  doc, 
  setDoc, 
  getDoc,
  updateDoc, 
  arrayUnion, 
  arrayRemove 
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// UI Utility Functions (unchanged)
export function showLoading() {
  document.body.classList.add('loading');
}

export function hideLoading() {
  document.body.classList.remove('loading');
}

export function showError(form, message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'form-error';
  errorDiv.textContent = message;
  
  const existingError = form.querySelector('.form-error');
  if (existingError) form.removeChild(existingError);
  
  form.prepend(errorDiv);
}

// Authentication Actions
export async function handleEmailLogin(email, password) {
  try {
    if (email === 'bob@internsync.com' && password === 'bobpass') {
      localStorage.setItem('currentUser', JSON.stringify({
        uid: 'local-bob',
        email: 'bob@internsync.com',
        username: 'bob',
        isLocalUser: true,
        favorites: []
      }));
      return { isLocalUser: true };
    }
    
    const userCredential = await loginUser(email, password);
    return userCredential.user;
  } catch (error) {
    throw new Error(getFriendlyAuthError(error.code));
  }
}

export async function handleGoogleLogin() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Create/update user document with proper structure
    const userRef = doc(db, 'users', result.user.uid);
    await setDoc(userRef, {
      email: result.user.email,
      displayName: result.user.displayName || result.user.email.split('@')[0],
      favorites: [],
      createdAt: new Date().toISOString(),
      isLocalUser: false
    }, { merge: true });

    // Store in localStorage for immediate UI access
    localStorage.setItem('currentUser', JSON.stringify({
      uid: result.user.uid,
      email: result.user.email,
      username: result.user.displayName || result.user.email.split('@')[0],
      favorites: [],
      isLocalUser: false
    }));

    return result.user;
  } catch (error) {
    console.error("Google sign-in failed:", error);
    throw new Error(getFriendlyAuthError(error.code));
  }
}

export async function handleLogout() {
  localStorage.removeItem('currentUser');
  await signOut(auth);
}

// Enhanced Favorite Management
export async function toggleFavoriteJob(userId, job) {
  try {
    if (userId.startsWith('local-')) {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      const existingIndex = currentUser.favorites?.findIndex(f => f.id === job.id) ?? -1;
      
      if (existingIndex >= 0) {
        currentUser.favorites.splice(existingIndex, 1);
      } else {
        currentUser.favorites.push({
          id: job.id,
          jobTitle: job.jobTitle,
          companyName: job.companyName,
          location: job.location
        });
      }
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      return existingIndex < 0;
    }
    
    // Firebase user handling
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    // Ensure job object has minimal required fields
    const favoriteJob = {
      id: job.id,
      jobTitle: job.jobTitle,
      companyName: job.companyName,
      location: job.location
    };

    if (userDoc.exists()) {
      const currentFavorites = userDoc.data().favorites || [];
      const existingIndex = currentFavorites.findIndex(f => f.id === job.id);
      
      if (existingIndex >= 0) {
        await updateDoc(userRef, {
          favorites: arrayRemove(currentFavorites[existingIndex])
        });
        return false;
      } else {
        await updateDoc(userRef, {
          favorites: arrayUnion(favoriteJob)
        });
        return true;
      }
    } else {
      await setDoc(userRef, {
        favorites: [favoriteJob]
      }, { merge: true });
      return true;
    }
  } catch (error) {
    console.error("Error in toggleFavoriteJob:", error);
    throw new Error('Failed to update favorites');
  }
}

// Helper function to get current user state
export function getCurrentUser() {
  try {
    const firebaseUser = auth.currentUser;
    const localUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Prioritize Firebase user if both exist
    return firebaseUser ? {
      ...firebaseUser,
      isLocalUser: false
    } : localUser;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

function getFriendlyAuthError(code) {
  const errors = {
    'auth/invalid-email': 'Invalid email address',
    'auth/user-disabled': 'Account disabled',
    'auth/user-not-found': 'Account not found',
    'auth/wrong-password': 'Incorrect password',
    'auth/too-many-requests': 'Too many attempts. Try again later',
    'auth/popup-closed-by-user': 'Sign in cancelled',
    'auth/cancelled-popup-request': 'Sign in cancelled',
    'auth/operation-not-allowed': 'Google sign-in not enabled'
  };
  return errors[code] || 'Authentication failed';
}