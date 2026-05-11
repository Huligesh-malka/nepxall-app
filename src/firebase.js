import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import {
  getMessaging,
  getToken,
  onMessage
} from "firebase/messaging";

////////////////////////////////////////////////////////
// ✅ FIREBASE CONFIG FROM ENV
////////////////////////////////////////////////////////
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

////////////////////////////////////////////////////////
// ✅ AUTH + FIRESTORE
////////////////////////////////////////////////////////
export const auth = getAuth(app);
export const db = getFirestore(app);

////////////////////////////////////////////////////////
// 🔥 FIREBASE MESSAGING
////////////////////////////////////////////////////////
export const messaging = getMessaging(app);

////////////////////////////////////////////////////////
// ✅ LOGIN PERSIST
////////////////////////////////////////////////////////
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("✅ Firebase persistence enabled");
  })
  .catch((err) => {
    console.error("❌ Persistence error:", err);
  });

////////////////////////////////////////////////////////
// 🔥 REQUEST NOTIFICATION PERMISSION
////////////////////////////////////////////////////////
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
      });
      
      console.log("✅ FCM TOKEN:", token);
      localStorage.setItem("fcm_token", token);
      return token;
    } else {
      console.log("❌ Notification permission denied");
    }
  } catch (err) {
    console.error("❌ FCM ERROR:", err);
  }
};

////////////////////////////////////////////////////////
// 🔥 FOREGROUND NOTIFICATIONS
////////////////////////////////////////////////////////
onMessage(messaging, (payload) => {
  console.log("📩 Notification received:", payload);
  new Notification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/logo192.png"
  });
});