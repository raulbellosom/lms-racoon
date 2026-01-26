import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useModeAnimation } from "react-theme-switch-animation";
import {
  User,
  Palette,
  Bell,
  Globe,
  Shield,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Volume2,
  VolumeX,
  ChevronRight,
  Lock,
  Mail,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { usePreferences } from "../../../shared/hooks/usePreferences";
import { useTheme } from "../../../shared/theme/ThemeProvider";
import { PageLayout } from "../../../shared/ui/PageLayout";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { Switch } from "../../../shared/ui/Switch";
import { Badge } from "../../../shared/ui/Badge";

export function SettingsView() {
  const { t } = useTranslation();
  const { auth } = useAuth();
  const { preferences, updateTheme, updateLanguage, updateSettings } =
    usePreferences();
  const { resolved } = useTheme();
  const [activeTab, setActiveTab] = useState("general");

  // Animation refs
  const pendingThemeRef = useRef(null);

  const { ref, toggleSwitchTheme } = useModeAnimation({
    duration: 500,
    isDarkMode: resolved === "dark",
    onDarkModeChange: () => {
      if (pendingThemeRef.current) {
        updateTheme(pendingThemeRef.current);
        pendingThemeRef.current = null;
      }
    },
  });

  const handleThemeChange = (newTheme, event) => {
    // Determine if visual change will happen
    const getSystemTheme = () =>
      window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
        ? "dark"
        : "light";
    const nextResolved = newTheme === "system" ? getSystemTheme() : newTheme;
    const isVisualChange = nextResolved !== resolved;

    if (isVisualChange) {
      pendingThemeRef.current = newTheme;
      toggleSwitchTheme(event);
    } else {
      updateTheme(newTheme);
    }
  };

  // Parse settings JSON safely
  const settings = JSON.parse(preferences.prefsJson || "{}");
  const soundEnabled = settings.notificationSound !== false; // Default true
  const marketingEmail = settings.marketingEmail !== false; // Default true (opt-out)
  const marketingWhatsapp = settings.marketingWhatsapp === true; // Default false (opt-in)

  const handleToggleSound = (checked) => {
    updateSettings({ notificationSound: checked });
  };

  const handleToggleEmail = (checked) => {
    updateSettings({ marketingEmail: checked });
  };

  const handleToggleWhatsapp = (checked) => {
    updateSettings({ marketingWhatsapp: checked });
  };

  const activeTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Profile Summary */}
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[rgb(var(--brand-primary))] to-purple-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg shrink-0">
                  {auth.user?.name?.charAt(0) || "U"}
                </div>
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <h3 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
                    {auth.user?.name}
                  </h3>
                  <p className="text-[rgb(var(--text-secondary))]">
                    {auth.user?.email}
                  </p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
                    <Badge variant="outline" className="text-xs font-mono">
                      {auth.user?.$id}
                    </Badge>
                    {auth.user?.labels?.map((l) => (
                      <Badge key={l} variant="secondary">
                        {l}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Button
                    variant="outline"
                    onClick={() => (window.location.href = "/app/profile")}
                  >
                    {t("settings.editProfile", "Editar Perfil")}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Language */}
            <Card className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                  <Globe className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">
                    {t("settings.language.title", "Idioma")}
                  </h4>
                  <p className="text-sm text-[rgb(var(--text-secondary))]">
                    {t(
                      "settings.language.desc",
                      "Selecciona el idioma de la interfaz.",
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => updateLanguage("es")}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${preferences.language === "es" ? "border-[rgb(var(--brand-primary))] bg-[rgb(var(--brand-primary))/0.05]" : "border-[rgb(var(--border-base))] hover:bg-[rgb(var(--bg-muted))]"}`}
                >
                  <span className="text-3xl">🇪🇸</span>
                  <div className="text-left">
                    <div className="font-bold text-[rgb(var(--text-primary))]">
                      Español
                    </div>
                    <div className="text-xs text-[rgb(var(--text-tertiary))]">
                      Spanish
                    </div>
                  </div>
                  {preferences.language === "es" && (
                    <div className="ml-auto w-2.5 h-2.5 rounded-full bg-[rgb(var(--brand-primary))]" />
                  )}
                </button>

                <button
                  onClick={() => updateLanguage("en")}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${preferences.language === "en" ? "border-[rgb(var(--brand-primary))] bg-[rgb(var(--brand-primary))/0.05]" : "border-[rgb(var(--border-base))] hover:bg-[rgb(var(--bg-muted))]"}`}
                >
                  <span className="text-3xl">🇺🇸</span>
                  <div className="text-left">
                    <div className="font-bold text-[rgb(var(--text-primary))]">
                      English
                    </div>
                    <div className="text-xs text-[rgb(var(--text-tertiary))]">
                      Inglés
                    </div>
                  </div>
                  {preferences.language === "en" && (
                    <div className="ml-auto w-2.5 h-2.5 rounded-full bg-[rgb(var(--brand-primary))]" />
                  )}
                </button>

                {/* Coming Soon: French */}
                <button
                  disabled
                  className="flex items-center gap-4 p-4 rounded-xl border-2 border-[rgb(var(--border-base))] opacity-60 cursor-not-allowed bg-[rgb(var(--bg-muted))/0.5]"
                >
                  <span className="text-3xl grayscale">🇫🇷</span>
                  <div className="text-left">
                    <div className="font-bold text-[rgb(var(--text-secondary))]">
                      Français
                    </div>
                    <div className="text-xs text-[rgb(var(--text-tertiary))]">
                      Próximamente
                    </div>
                  </div>
                  <Lock className="ml-auto h-4 w-4 text-[rgb(var(--text-muted))]" />
                </button>
              </div>
            </Card>
          </div>
        );
      case "appearance":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600 dark:text-purple-400">
                  <Palette className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">
                    {t("settings.theme.title", "Tema")}
                  </h4>
                  <p className="text-sm text-[rgb(var(--text-secondary))]">
                    {t(
                      "settings.theme.desc",
                      "Personaliza cómo se ve Racoon LMS en tu dispositivo.",
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" ref={ref}>
                {[
                  {
                    id: "light",
                    icon: Sun,
                    label: "Claro",
                    color: "text-amber-500",
                    bg: "bg-gray-100",
                  },
                  {
                    id: "dark",
                    icon: Moon,
                    label: "Oscuro",
                    color: "text-indigo-400",
                    bg: "bg-gray-900",
                  },
                  {
                    id: "system",
                    icon: Monitor,
                    label: "Sistema",
                    color: "text-gray-500",
                    bg: "bg-gradient-to-br from-gray-100 to-gray-900",
                  },
                ].map((theme) => (
                  <button
                    key={theme.id}
                    onClick={(e) => handleThemeChange(theme.id, e)}
                    className={`group relative overflow-hidden rounded-xl border-2 transition-all p-4 text-left ${preferences.theme === theme.id ? "border-[rgb(var(--brand-primary))] shadow-md scale-[1.02]" : "border-transparent bg-[rgb(var(--bg-muted))] hover:bg-[rgb(var(--bg-muted))/0.8]"}`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <theme.icon className={`h-5 w-5 ${theme.color}`} />
                      <span className="font-medium text-[rgb(var(--text-primary))]">
                        {theme.label}
                      </span>
                    </div>
                    <div
                      className={`h-24 rounded-lg border border-[rgb(var(--border-base))] opacity-80 group-hover:opacity-100 transition-opacity ${theme.bg}`}
                    >
                      {theme.id === "system" && (
                        <div className="h-full w-full flex items-center justify-center text-xs text-gray-500 font-mono">
                          Auto
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        );
      case "notifications":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400">
                  <Bell className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">
                    {t(
                      "settings.notifications.title",
                      "Configuración de Notificaciones",
                    )}
                  </h4>
                  <p className="text-sm text-[rgb(var(--text-secondary))]">
                    {t(
                      "settings.notifications.desc",
                      "Elige cómo quieres recibir las alertas.",
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-6 divide-y divide-[rgb(var(--border-base))]">
                <div className="flex items-center justify-between pt-4 first:pt-0">
                  <div className="flex gap-3">
                    <div className="mt-1">
                      {soundEnabled ? (
                        <Volume2 className="h-5 w-5 text-[rgb(var(--text-primary))]" />
                      ) : (
                        <VolumeX className="h-5 w-5 text-[rgb(var(--text-muted))]" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-[rgb(var(--text-primary))]">
                        {t(
                          "settings.notifications.sound",
                          "Sonido de notificación",
                        )}
                      </div>
                      <div className="text-xs text-[rgb(var(--text-secondary))]">
                        {t(
                          "settings.notifications.soundDesc",
                          "Reproducir un sonido cuando llegue una nueva notificación.",
                        )}
                      </div>
                    </div>
                  </div>
                  <Switch checked={soundEnabled} onChange={handleToggleSound} />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex gap-3">
                    <div className="mt-1">
                      <Mail className="h-5 w-5 text-[rgb(var(--text-primary))]" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-[rgb(var(--text-primary))]">
                        Marketing (Email)
                      </div>
                      <div className="text-xs text-[rgb(var(--text-secondary))]">
                        Recibir correos sobre ofertas y nuevos cursos.
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={marketingEmail}
                    onChange={handleToggleEmail}
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex gap-3">
                    <div className="mt-1">
                      <MessageCircle className="h-5 w-5 text-[rgb(var(--text-primary))]" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-[rgb(var(--text-primary))]">
                        Ofertas (WhatsApp)
                      </div>
                      <div className="text-xs text-[rgb(var(--text-secondary))]">
                        Recibir promociones exclusivas a tu celular.
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={marketingWhatsapp}
                    onChange={handleToggleWhatsapp}
                  />
                </div>
              </div>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  const menuItems = [
    { id: "general", label: t("settings.tabs.general", "General"), icon: User },
    {
      id: "appearance",
      label: t("settings.tabs.appearance", "Apariencia"),
      icon: Palette,
    },
    {
      id: "notifications",
      label: t("settings.tabs.notifications", "Notificaciones"),
      icon: Bell,
    },
  ];

  return (
    <PageLayout
      title={t("settings.title", "Configuración")}
      subtitle={t("settings.subtitle", "Gestiona tus preferencias personales")}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        {/* Sidebar Menu */}
        <aside className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id
                  ? "bg-[rgb(var(--brand-primary))] text-white shadow-lg shadow-[rgb(var(--brand-primary))/0.3]"
                  : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-muted))] hover:text-[rgb(var(--text-primary))]"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
              {activeTab === item.id && (
                <ChevronRight className="h-4 w-4 opacity-50" />
              )}
            </button>
          ))}
        </aside>

        {/* Content Content */}
        <div className="min-h-[500px]">{activeTabContent()}</div>
      </div>
    </PageLayout>
  );
}
