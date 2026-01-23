import React from "react";
import { useTranslation } from "react-i18next";
import { PageLayout } from "../../../shared/ui/PageLayout";
import { Card } from "../../../shared/ui/Card";
import { ThemeSelector } from "../../../shared/theme/ThemeProvider"; // Reuse existing

export function SettingsView() {
  const { t } = useTranslation();

  return (
    <PageLayout
      title={t("common.settings", "Configuración")}
      subtitle="Preferencias de la aplicación"
    >
      <div className="max-w-2xl space-y-6">
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-bold text-[rgb(var(--text-primary))]">
            Apariencia
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[rgb(var(--text-primary))]">
                Tema
              </div>
              <div className="text-xs text-[rgb(var(--text-secondary))]">
                Selecciona tu preferencia de color (Claro/Oscuro/Sistema)
              </div>
            </div>
            <ThemeSelector />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-bold text-[rgb(var(--text-primary))]">
            Notificaciones
          </h3>
          <div className="space-y-4">
             {/* Mock checkboxes */}
             {["Correos de marketing", "Notificaciones de cursos", "Nuevos mensajes"].map((item) => (
                <label key={item} className="flex items-center gap-3">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-[rgb(var(--brand-primary))] focus:ring-[rgb(var(--brand-primary))]" />
                  <span className="text-sm text-[rgb(var(--text-secondary))]">{item}</span>
                </label>
             ))}
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
