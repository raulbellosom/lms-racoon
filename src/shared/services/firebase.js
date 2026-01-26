import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
} from "firebase/messaging";

// 1. Configuración de Firebase
// Estos valores deben estar en tu archivo .env (e.g., .env.local)
// VITE_FIREBASE_API_KEY=...
// VITE_FIREBASE_AUTH_DOMAIN=...
// VITE_FIREBASE_PROJECT_ID=...
// VITE_FIREBASE_STORAGE_BUCKET=...
// VITE_FIREBASE_MESSAGING_SENDER_ID=...
// VITE_FIREBASE_APP_ID=...

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Messaging (validar soporte para evitar errores en Safari antiguo o Node)
let messaging = null;

export const initializeMessaging = async () => {
  try {
    const supported = await isSupported();
    if (supported) {
      messaging = getMessaging(app);
      return messaging;
    }
    console.warn("Firebase Messaging no soportado en este navegador.");
    return null;
  } catch (e) {
    console.error("Error inicializando messaging:", e);
    return null;
  }
};

/**
 * Solicita permiso y obtiene el token FCM.
 * @param {string} vapidKey - Tu "Key pair" (Public Key) de Firebase Console -> Cloud Messaging -> Web Push certificates.
 */
export const requestForToken = async (vapidKey) => {
  if (!messaging) {
    await initializeMessaging();
    if (!messaging) return null;
  }

  try {
    const currentToken = await getToken(messaging, { vapidKey });
    if (currentToken) {
      console.log("FCM Token recibido:", currentToken);
      return currentToken;
    } else {
      console.log(
        "No se obtuvo token. Asegúrate de haber permitido las notificaciones.",
      );
      return null;
    }
  } catch (err) {
    console.log("Error obteniendo token FCM:", err);
    return null;
  }
};

/**
 * Escucha mensajes en primer plano (Foreground).
 */
export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export { app, messaging };
