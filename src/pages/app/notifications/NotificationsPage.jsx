import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Bell,
  CheckCheck,
  Trash2,
  Volume2,
  VolumeX,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { NotificationsService } from "../../../shared/data/notifications";
import { usePreferences } from "../../../shared/hooks/usePreferences";
import { useNotificationAction } from "../../../shared/components/NotificationActionHandler";
import { PageLayout } from "../../../shared/ui/PageLayout";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { Badge } from "../../../shared/ui/Badge";
import { useToast } from "../../../app/providers/ToastProvider";
import { LoadingContent } from "../../../shared/ui/LoadingScreen";

export function NotificationsPage() {
  const { t } = useTranslation();
  const { auth } = useAuth();
  const { showToast } = useToast();
  const { preferences, updateSettings } = usePreferences();
  const { handleAction, NotificationModal } = useNotificationAction();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Settings parsing
  const settings = JSON.parse(preferences.prefsJson || "{}");
  const soundEnabled = settings.notificationSound !== false; // Default true

  useEffect(() => {
    loadAll();
  }, [auth.user]);

  const loadAll = async () => {
    if (!auth.user) return;
    setLoading(true);
    try {
      // Get more items for full page
      const items = await NotificationsService.getNotifications(
        auth.user.$id,
        50,
      );
      setNotifications(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    // Naive implementation: iterate. Better: Backend function.
    try {
      const unread = notifications.filter((n) => !n.read);
      await Promise.all(
        unread.map((n) => NotificationsService.markAsRead(n.$id)),
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      showToast(
        t("notifications.allRead", "Todas marcadas como leídas"),
        "success",
      );
    } catch (e) {
      showToast(t("common.error"), "error");
    }
  };

  const handleToggleSound = () => {
    updateSettings({ notificationSound: !soundEnabled });
    showToast(soundEnabled ? "Sonido desactivado" : "Sonido activado", "info");
  };

  const onItemClick = async (n) => {
    if (!n.read) {
      await NotificationsService.markAsRead(n.$id);
      setNotifications((prev) =>
        prev.map((x) => (x.$id === n.$id ? { ...x, read: true } : x)),
      );
    }
    handleAction(n);
  };

  return (
    <PageLayout title={t("notifications.title", "Notificaciones")}>
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[rgb(var(--bg-surface))] p-4 rounded-xl border border-[rgb(var(--border-base))] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[rgb(var(--brand-primary))/0.1] rounded-lg text-[rgb(var(--brand-primary))]">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-[rgb(var(--text-primary))]">
                Tus Notificaciones
              </h3>
              <p className="text-sm text-[rgb(var(--text-secondary))]">
                {notifications.filter((n) => !n.read).length} no leídas
              </p>
            </div>
          </div>
          <div className="flex w-full sm:w-auto gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleSound}
              title={soundEnabled ? "Silenciar" : "Activar sonido"}
              className="flex-1 sm:flex-none"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="h-4 w-4 mr-2 sm:mr-0" />
                  <span className="sm:hidden">Silenciar</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4 text-red-400 mr-2 sm:mr-0" />
                  <span className="sm:hidden text-red-400">Activar</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="flex-1 sm:flex-none"
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              <span className="whitespace-nowrap">
                {t("common.markAllRead", "Marcar leídas")}
              </span>
            </Button>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => setNotifications([])} /* Mock clear */
                title="Borrar todas"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <LoadingContent message="Cargando..." />
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-[rgb(var(--border-base))] rounded-2xl">
            <div className="p-4 bg-[rgb(var(--bg-muted))] rounded-full mb-4">
              <Bell className="h-8 w-8 text-[rgb(var(--text-muted))]" />
            </div>
            <h3 className="text-lg font-medium text-[rgb(var(--text-primary))] mb-1">
              No tienes notificaciones
            </h3>
            <p className="text-sm text-[rgb(var(--text-secondary))]">
              {t("notifications.empty", "Te avisaremos cuando haya novedades.")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.$id}
                onClick={() => onItemClick(n)}
                className={`group relative p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                  n.read
                    ? "bg-[rgb(var(--bg-surface))] border-[rgb(var(--border-base))]"
                    : "bg-[rgb(var(--bg-surface))] border-[rgb(var(--brand-primary))/0.3] shadow-sm"
                }`}
              >
                {!n.read && (
                  <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-[rgb(var(--brand-primary))]" />
                )}

                <div className="flex gap-4 pr-6">
                  <div
                    className={`mt-1 h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${
                      n.read
                        ? "bg-[rgb(var(--bg-muted))]"
                        : "bg-[rgb(var(--brand-primary))/0.1] text-[rgb(var(--brand-primary))]"
                    }`}
                  >
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                      <h4
                        className={`text-base truncate ${n.read ? "font-medium text-[rgb(var(--text-primary))]" : "font-bold text-[rgb(var(--text-primary))]"}`}
                      >
                        {n.title}
                      </h4>
                      <span className="text-xs text-[rgb(var(--text-tertiary))] whitespace-nowrap">
                        {new Date(n.$createdAt).toLocaleDateString()}{" "}
                        {new Date(n.$createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-[rgb(var(--text-secondary))] mt-1 line-clamp-2">
                      {n.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <NotificationModal />
    </PageLayout>
  );
}
