importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);

const firebaseConfig = {
  apiKey: "AIzaSyCf8R8ASjSFjL_k6j0dCGtuxbBS7tFjLws",
  authDomain: "nepxall.firebaseapp.com",
  projectId: "nepxall",
  storageBucket: "nepxall.firebasestorage.app",
  messagingSenderId: "512312187994",
  appId: "1:512312187994:web:15cb222337980116ff8c63",
  measurementId: "G-VNQM7CS5XV"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {

  console.log("📩 Background message:", payload);

  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: "/logo192.png"
    }
  );

});