import { initializeApp } from "firebase/app";

import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";

import { getFirestore } from "firebase/firestore";

////////////////////////////////////////////////////////
// 🔥 ADD THIS
////////////////////////////////////////////////////////
import {
  getMessaging,
  getToken,
  onMessage
} from "firebase/messaging";


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

////////////////////////////////////////////////////////
// ✅ AUTH + DB
////////////////////////////////////////////////////////
export const auth = getAuth(app);
export const db = getFirestore(app);

////////////////////////////////////////////////////////
// 🔥 FIREBASE MESSAGING
////////////////////////////////////////////////////////
export const messaging = getMessaging(app);

////////////////////////////////////////////////////////
// 🔥 LOGIN PERSIST
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

    const permission =
      await Notification.requestPermission();

    if (permission === "granted") {

      const token = await getToken(messaging, {

        ////////////////////////////////////////////////////
        // 🔥 PUT YOUR FIREBASE VAPID KEY
        ////////////////////////////////////////////////////
       vapidKey: "BHug2OB6PLg0gQdHNtSinfD6rmGHC2fO32WvZKOD5u_fbVrYK-cQK4Zwkd11Y3El57XZy51vvli9WfdRrDSo1Dw"

      });

      console.log("✅ FCM TOKEN:", token);

      ////////////////////////////////////////////////////
      // SAVE TOKEN IN LOCAL STORAGE
      ////////////////////////////////////////////////////
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

  new Notification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: "/logo192.png"
    }
  );

});