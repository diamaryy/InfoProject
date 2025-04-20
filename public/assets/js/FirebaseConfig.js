import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDvbXf4D9f7Fj9ocdZg1uzVeFXe9PXiQNs",
  authDomain: "internsync-d43ef.firebaseapp.com",
  projectId: "internsync-d43ef",
  storageBucket: "internsync-d43ef.firebasestorage.app",
  messagingSenderId: "939785682597",
  appId: "1:939785682597:web:cbe3196ebe1d5e2c07574c",
  measurementId: "G-FWZVDWNY4N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Ensure this is exported

const loginUser = async (email, password) => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw error;
  }
};

export { app, auth, db, loginUser, GoogleAuthProvider };