// IMPORTANTE: Este archivo va en la carpeta `public/`
// Se encarga de recibir notificaciones en background (cuando la app está cerrada/minimizada).

importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js",
);

// 1. Pega tu configuración de firebase aquí directamente.
// Los Service Workers no tienen acceso a variables de entorno de Vite por defecto.
// Reemplaza los strings con tus valores reales de Firebase Console.

const firebaseConfig = {
  apiKey: "AIzaSyAjVDvNyY-AumTJXsLzEROAstORU2DC5eM",
  authDomain: "bonjour-vallarta.firebaseapp.com",
  projectId: "bonjour-vallarta",
  storageBucket: "bonjour-vallarta.firebasestorage.app",
  messagingSenderId: "623602042138",
  appId: "1:623602042138:web:629afee497e52bf16bd8a3",
  measurementId: "G-YE4XGHY9ZB",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Opcional: Manejar mensajes en background
messaging.onBackgroundMessage(function (payload) {
  console.log(
    "[firebase-messaging-sw.js] Mensaje en background recibido ",
    payload,
  );
  // Personaliza la notificación aquí si el payload no trae 'notification' key
  const notificationTitle = payload.notification.title || "Nueva Notificación";
  const notificationOptions = {
    body: payload.notification.body || "Tienes un nuevo mensaje.",
    icon: "/icon.svg", // Ruta a tu icono
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
