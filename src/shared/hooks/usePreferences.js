import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../app/providers/AuthProvider";
import { useTheme } from "../theme/ThemeProvider";
import { UserPreferencesService } from "../data/userPreferences";

export function usePreferences() {
  const { auth } = useAuth();
  const user = auth?.user;
  const { i18n } = useTranslation();
  const { setTheme, theme: currentTheme } = useTheme();

  const [preferences, setPreferences] = useState({
    theme: "system",
    language: "es",
    prefsJson: "{}",
  });
  const [loading, setLoading] = useState(false);

  // Load prefs on mount/login
  useEffect(() => {
    if (!user) return;

    let mounted = true;
    setLoading(true);

    UserPreferencesService.getPreferences(user.$id)
      .then((prefs) => {
        if (!mounted) return;
        if (prefs) {
          setPreferences({
            theme: prefs.theme,
            language: prefs.language,
            prefsJson: prefs.prefsJson,
          });

          // Sync App State
          if (prefs.theme && prefs.theme !== currentTheme) {
            // We don't force set here to avoid overriding user's session choice if they just changed it?
            // Actually, if I login, I expect my saved theme.
            setTheme(prefs.theme);
          }
          if (prefs.language && prefs.language !== i18n.language) {
            i18n.changeLanguage(prefs.language);
          }
        }
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user?.$id]); // Run only when user changes (login)

  const updateTheme = useCallback(
    async (newTheme) => {
      setTheme(newTheme); // Immediate UI update
      setPreferences((p) => ({ ...p, theme: newTheme }));

      if (user) {
        try {
          await UserPreferencesService.updatePreferences(user.$id, {
            theme: newTheme,
          });
        } catch (e) {
          console.error("Failed to save theme preference", e);
        }
      }
    },
    [user, setTheme],
  );

  const updateLanguage = useCallback(
    async (lang) => {
      i18n.changeLanguage(lang); // Immediate UI update
      setPreferences((p) => ({ ...p, language: lang }));

      if (user) {
        try {
          await UserPreferencesService.updatePreferences(user.$id, {
            language: lang,
          });
        } catch (e) {
          console.error("Failed to save language preference", e);
        }
      }
    },
    [user, i18n],
  );

  const updateSettings = useCallback(
    async (newSettingsInfo) => {
      // Merge with existing json
      const currentJson = JSON.parse(preferences.prefsJson || "{}");
      const merged = { ...currentJson, ...newSettingsInfo };
      const jsonString = JSON.stringify(merged);

      setPreferences((p) => ({ ...p, prefsJson: jsonString }));

      if (user) {
        try {
          await UserPreferencesService.updatePreferences(user.$id, {
            prefsJson: jsonString,
          });
        } catch (e) {
          console.error("Failed to save generic settings", e);
        }
      }
    },
    [user, preferences.prefsJson],
  );

  return {
    preferences,
    loading,
    updateTheme,
    updateLanguage,
    updateSettings,
  };
}
