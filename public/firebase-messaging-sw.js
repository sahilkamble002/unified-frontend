/* global firebase, importScripts */

const params = new URL(self.location.href).searchParams;
const firebaseConfig = {
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId")
};

const isConfigured = Object.values(firebaseConfig).every(Boolean);

if (isConfigured) {
  importScripts("https://www.gstatic.com/firebasejs/11.6.1/firebase-app-compat.js");
  importScripts("https://www.gstatic.com/firebasejs/11.6.1/firebase-messaging-compat.js");

  firebase.initializeApp(firebaseConfig);

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title =
      payload?.notification?.title || payload?.data?.title || "Notification";
    const body =
      payload?.notification?.body || payload?.data?.body || "";
    const url = payload?.fcmOptions?.link || payload?.data?.link || "/notifications";

    self.registration.showNotification(title, {
      body,
      data: {
        url
      }
    });
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification?.data?.url || "/notifications";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const matchingClient = clients.find((client) => client.url.includes(url));

      if (matchingClient) {
        matchingClient.focus();
        return matchingClient.navigate(url);
      }

      return self.clients.openWindow(url);
    })
  );
});
