import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDHEIWnoT4_XVhVCKn62aqUZF4OthtDmk4",
  authDomain: "nepxall.firebaseapp.com",
  projectId: "nepxall",
  storageBucket: "nepxall.firebasestorage.app", // Updated bucket suffix
  messagingSenderId: "512312187994",
  appId: "1:512312187994:web:c79ea892332791caff8c63",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);