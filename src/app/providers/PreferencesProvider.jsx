import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "./AuthProvider";
import { useTheme } from "../../shared/theme/ThemeProvider";
import { UserPreferencesService } from "../../shared/data/userPreferences";
import { LoadingScreen } from "../../shared/ui/LoadingScreen";

export const PreferencesContext = createContext(null);

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
};

export function PreferencesProvider({ children }) {
  const { auth } = useAuth();
  const user = auth?.user;
  const { i18n } = useTranslation();
  const { setTheme, theme: currentTheme } = useTheme();

  const [preferences, setPreferences] = useState({
    theme: "system",
    language: "es",
    prefsJson: "{}",
  });
  const [loading, setLoading] = useState(true); // Default to true to prevent flash

  // Load prefs on mount/login
  useEffect(() => {
    // If not logged in, we are not loading user prefs anymore.
    // However, if we are in a protected route, auth.user is likely present.
    // If we are in public route, auth.user is null.
    // We should only block if user is logged in?
    // Actually, if user is null, we can just stop loading.

    if (!user) {
      setLoading(false);
      return;
    }

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
      const jsonString = JSON.stringify(merged); // If updateSettings is called, we update the merged result, not append?
      // Actually the current implementation in usePreferences.js merges correctly.

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

  const value = {
    preferences,
    loading,
    updateTheme,
    updateLanguage,
    updateSettings,
  };

  if (loading && user) {
    // If we are logged in, show loading until preferences are fetched.
    // If not logged in, just show children (login page etc).
    return <LoadingScreen />;
  }

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}
