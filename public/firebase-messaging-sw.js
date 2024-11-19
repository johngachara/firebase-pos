importScripts(
    "https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js",
);
importScripts(
    "https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js",
);

const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY,
    authDomain: import.meta.env.VITE_AUTHDOMAIN,
    databaseURL: import.meta.env.VITE_DATABASEURL,
    projectId: import.meta.env.VITE_PROJECT_ID,
    storageBucket:import.meta.env.VITE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
    appId:import.meta.env.VITE_APP_ID,
    measurementId:import.meta.env.VITE_MEASUREMENT_ID,
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log("Received background message ", payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});