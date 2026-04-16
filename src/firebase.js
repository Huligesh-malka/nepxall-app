import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCf8R8ASjSFjL_k6j0dCGtuxbBS7tFjLws",
  authDomain: "nepxall.firebaseapp.com",
  projectId: "nepxall",
  storageBucket: "nepxall.firebasestorage.app",
  messagingSenderId: "512312187994",
  appId: "1:512312187994:web:15cb222337980116ff8c63",
  measurementId: "G-VNQM7CS5XV"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

////////////////////////////////////////////////////////
// 🔥 CRITICAL FIX: PERSIST LOGIN (NO AUTO LOGOUT)
////////////////////////////////////////////////////////
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("✅ Firebase persistence enabled (local)");
  })
  .catch((err) => {
    console.error("❌ Persistence error:", err);
  });