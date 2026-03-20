import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import {
  getPushConfig,
  registerPushToken,
  unregisterPushToken
} from "../api/notifications.js";
import { getPushToken, setPushToken } from "../utils/storage.js";

const envFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
const envVapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

const isConfigured = (config, vapidKey) =>
  Object.values(config).every((value) => Boolean(value)) && Boolean(vapidKey);

let firebaseApp = null;
let onMessageUnsubscribe = null;
let resolvedConfigPromise = null;

const getResolvedFirebaseConfig = async () => {
  if (isConfigured(envFirebaseConfig, envVapidKey)) {
    return {
      firebaseConfig: envFirebaseConfig,
      vapidKey: envVapidKey
    };
  }

  if (!resolvedConfigPromise) {
    resolvedConfigPromise = getPushConfig().then((config) => ({
      firebaseConfig: {
        apiKey: config?.apiKey || "",
        authDomain: config?.authDomain || "",
        projectId: config?.projectId || "",
        storageBucket: config?.storageBucket || "",
        messagingSenderId: config?.messagingSenderId || "",
        appId: config?.appId || ""
      },
      vapidKey: config?.vapidKey || ""
    }));
  }

  return resolvedConfigPromise;
};

const getFirebaseApp = (firebaseConfig) => {
  if (!firebaseApp) {
    firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }

  return firebaseApp;
};

const buildServiceWorkerUrl = (firebaseConfig) => {
  const search = new URLSearchParams(firebaseConfig);
  return `/firebase-messaging-sw.js?${search.toString()}`;
};

const showForegroundNotification = (payload) => {
  if (typeof window === "undefined" || Notification.permission !== "granted") {
    return;
  }

  const title = payload?.notification?.title || payload?.data?.title || "Notification";
  const body = payload?.notification?.body || payload?.data?.body || "";
  const notification = new Notification(title, {
    body,
    data: {
      url: payload?.fcmOptions?.link || payload?.data?.link || "/notifications"
    }
  });

  notification.onclick = () => {
    window.focus();
    window.location.assign(notification.data?.url || "/notifications");
    notification.close();
  };
};

export const initializeWebPush = async () => {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return null;
  }

  if (!(await isSupported())) {
    return null;
  }

  const { firebaseConfig, vapidKey } = await getResolvedFirebaseConfig();

  if (!isConfigured(firebaseConfig, vapidKey)) {
    return null;
  }

  const registration = await navigator.serviceWorker.register(
    buildServiceWorkerUrl(firebaseConfig)
  );
  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    return null;
  }

  const messaging = getMessaging(getFirebaseApp(firebaseConfig));
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration
  });

  if (!token) {
    return null;
  }

  await registerPushToken({
    token,
    platform: "WEB"
  });
  setPushToken(token);

  if (!onMessageUnsubscribe) {
    onMessageUnsubscribe = onMessage(messaging, showForegroundNotification);
  }

  return token;
};

export const disableWebPush = async () => {
  const token = getPushToken();

  if (!token) {
    return;
  }

  try {
    await unregisterPushToken(token);
  } catch {
    // best-effort cleanup
  } finally {
    setPushToken(null);
  }
};
