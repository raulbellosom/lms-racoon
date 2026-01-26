import { useEffect, useRef } from "react";
import {
  requestForToken,
  onMessageListener,
} from "../../../shared/services/firebase";
import { usePreferences } from "../../../shared/hooks/usePreferences";
import { useAuth } from "../../../app/providers/AuthProvider";

export function usePushNotifications() {
  const { user } = useAuth().auth;
  const { preferences, updateSettings } = usePreferences();
  const listenerRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    // 1. Request Token and Save if needed
    const handleToken = async () => {
      // You can wrap this in a check if user has disabled notifications in settings
      // if (preferences.notificationsDisabled) return;

      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.warn("VITE_FIREBASE_VAPID_KEY is missing.");
        return;
      }

      const token = await requestForToken(vapidKey);

      if (token) {
        // Parse current tokens
        const currentJson = JSON.parse(preferences.prefsJson || "{}");
        const currentTokens = currentJson.fcmTokens || [];

        if (!currentTokens.includes(token)) {
          const newTokens = [...currentTokens, token];
          await updateSettings({ fcmTokens: newTokens });
          console.log("FCM Token registered for user.");
        }
      }
    };

    handleToken();

    // 2. Listen for Foreground Messages
    const listen = async () => {
      const payload = await onMessageListener();
      console.log("Foreground Message:", payload);
      // Here you could trigger a toast or update a notification badge context
      // const { title, body } = payload.notification;
    };

    listen();
  }, [user, updateSettings, preferences.prefsJson]);

  return {};
}
