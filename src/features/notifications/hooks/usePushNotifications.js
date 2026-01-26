import { useEffect, useRef, useState } from "react";
import {
  requestForToken,
  onMessageListener,
} from "../../../shared/services/firebase";
import { usePreferences } from "../../../shared/hooks/usePreferences";
import { useAuth } from "../../../app/providers/AuthProvider";

export function usePushNotifications() {
  const { user } = useAuth().auth;
  const { preferences, updateSettings } = usePreferences();
  const [permissionStatus, setPermissionStatus] = useState(
    Notification.permission,
  );

  const subscribe = async (isManual = true) => {
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn("VITE_FIREBASE_VAPID_KEY is missing.");
      if (isManual) alert("Error: VITE_FIREBASE_VAPID_KEY missing in .env");
      return;
    }

    const token = await requestForToken(vapidKey);
    if (token) {
      const currentJson = JSON.parse(preferences.prefsJson || "{}");
      const currentTokens = currentJson.fcmTokens || [];

      if (!currentTokens.includes(token)) {
        const newTokens = [...currentTokens, token];
        await updateSettings({ fcmTokens: newTokens });
        console.log("FCM Token registered for user.");
      }
      setPermissionStatus(Notification.permission);
      if (isManual) alert("¡Notificaciones activadas correctamente!");
    } else {
      setPermissionStatus(Notification.permission);
      if (isManual)
        alert(
          "No se pudo obtener el token. Revisa los permisos del navegador o la consola.",
        );
    }
  };

  useEffect(() => {
    if (!user) return;
    // Check permission on mount
    setPermissionStatus(Notification.permission);

    // Auto-attempt subscription (silent)
    // Only if not explicitly denied
    if (Notification.permission !== "denied") {
      subscribe(false);
    }

    // 2. Listen for Foreground Messages
    const listen = async () => {
      const payload = await onMessageListener();
      console.log("Foreground Message:", payload);
    };

    listen();
  }, [user]);

  return { subscribe, permissionStatus };
}
