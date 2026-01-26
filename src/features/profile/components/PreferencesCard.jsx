import React from "react";
import { useTranslation } from "react-i18next";
import { Monitor, Moon, Sun, Bell, Mail, MessageCircle } from "lucide-react";
import { Card } from "../../../shared/ui/Card";
import { usePreferences } from "../../../shared/hooks/usePreferences";
import { Switch } from "../../../shared/ui/Switch"; // Assuming we have a Switch component or will create one

export function PreferencesCard() {
  const { t } = useTranslation();
  const { preferences, updateTheme, updateLanguage, updateSettings, loading } =
    usePreferences();

  // Parse json settings safely
  const settings = React.useMemo(() => {
    try {
      return JSON.parse(preferences.prefsJson || "{}");
    } catch {
      return {};
    }
  }, [preferences.prefsJson]);

  const handleToggle = (key) => {
    updateSettings({ [key]: !settings[key] });
  };

  return (
    <Card className="p-6 xl:col-span-3">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500/20 to-cyan-500/20 text-blue-500">
          <Monitor className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-[rgb(var(--text-primary))]">
            {t("profile.preferences", "Preferencias")}
          </h3>
          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
            {t(
              "profile.preferencesDesc",
              "Personaliza tu experiencia en la plataforma.",
            )}
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {/* Theme & Language Column */}
            <div className="space-y-6">
              {/* Theme Selector */}
              <div>
                <label className="text-sm font-medium text-[rgb(var(--text-primary))] mb-3 block">
                  {t("profile.theme", "Apariencia")}
                </label>
                <div className="flex items-center gap-2 rounded-lg bg-[rgb(var(--bg-muted))] p-1 text-sm">
                  {[
                    {
                      value: "light",
                      icon: Sun,
                      label: t("theme.light", "Claro"),
                    },
                    {
                      value: "dark",
                      icon: Moon,
                      label: t("theme.dark", "Oscuro"),
                    },
                    {
                      value: "system",
                      icon: Monitor,
                      label: t("theme.system", "Sistema"),
                    },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateTheme(opt.value)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-all ${
                        preferences.theme === opt.value
                          ? "bg-[rgb(var(--bg-surface))] text-[rgb(var(--brand-primary))] shadow-sm"
                          : "text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]"
                      }`}
                    >
                      <opt.icon className="h-4 w-4" />
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Selector */}
              <div>
                <label className="text-sm font-medium text-[rgb(var(--text-primary))] mb-3 block">
                  {t("profile.language", "Idioma")}
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => updateLanguage("es")}
                    className={`px-4 py-2 border rounded-lg text-sm font-medium transition ${
                      preferences.language === "es"
                        ? "border-[rgb(var(--brand-primary))] bg-[rgb(var(--brand-primary))/0.1] text-[rgb(var(--brand-primary))]"
                        : "border-[rgb(var(--border-base))] text-[rgb(var(--text-secondary))] hover:border-[rgb(var(--text-muted))]"
                    }`}
                  >
                    Español
                  </button>
                  <button
                    onClick={() => updateLanguage("en")}
                    className={`px-4 py-2 border rounded-lg text-sm font-medium transition ${
                      preferences.language === "en"
                        ? "border-[rgb(var(--brand-primary))] bg-[rgb(var(--brand-primary))/0.1] text-[rgb(var(--brand-primary))]"
                        : "border-[rgb(var(--border-base))] text-[rgb(var(--text-secondary))] hover:border-[rgb(var(--text-muted))]"
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications Column */}
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-[rgb(var(--text-primary))] mb-3 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  {t("profile.notifications", "Notificaciones")}
                </label>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 rounded-lg border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))]">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-[rgb(var(--text-primary))]">
                          Emails de Ofertas
                        </div>
                        <div className="text-xs text-[rgb(var(--text-secondary))]">
                          Recibe descuentos y promociones.
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={!!settings.email_offers}
                      onChange={() => handleToggle("email_offers")}
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-lg border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))]">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-[rgb(var(--text-primary))]">
                          WhatsApp
                        </div>
                        <div className="text-xs text-[rgb(var(--text-secondary))]">
                          Notificaciones importantes por WA.
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={!!settings.whatsapp_notifs}
                      onChange={() => handleToggle("whatsapp_notifs")}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
