import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Volume2, VolumeX, Bell } from "lucide-react";
import { NotificationsService } from "../data/notifications";
import { useAuth } from "../../app/providers/AuthProvider";
import { Dropdown } from "../../shared/ui/Dropdown";
import { usePreferences } from "../../shared/hooks/usePreferences";
import { useNotificationAction } from "./NotificationActionHandler";

export function NotificationsPopover() {
  const { t } = useTranslation();
  const { auth } = useAuth();
  const user = auth?.user;
  const navigate = useNavigate();
  const { preferences, updateSettings } = usePreferences();
  const { handleAction, NotificationModal } = useNotificationAction();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Settings
  const settings = JSON.parse(preferences.prefsJson || "{}");
  const soundEnabled = settings.notificationSound !== false; // Default true if undefined

  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchNotifications();
    fetchUnreadCount();

    // Poll every minute
    const interval = setInterval(() => {
      fetchUnreadCount();
      // Ideally verify if count increased to play sound
    }, 60000);

    return () => clearInterval(interval);
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    const items = await NotificationsService.getNotifications(user.$id, 5);
    setNotifications(items);
  };

  const fetchUnreadCount = async () => {
    if (!user) return;
    const count = await NotificationsService.getUnreadCount(user.$id);
    // Logic to play sound if count increased could go here
    setUnreadCount(count);
  };

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (open) {
      fetchNotifications();
    }
  };

  const handleToggleSound = (e) => {
    e.stopPropagation();
    updateSettings({ notificationSound: !soundEnabled });
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await NotificationsService.markAsRead(notification.$id);
      const newItems = notifications.map((n) =>
        n.$id === notification.$id ? { ...n, read: true } : n,
      );
      setNotifications(newItems);
      setUnreadCount(Math.max(0, unreadCount - 1));
    }
    handleAction(notification);
    setIsOpen(false);
  };

  return (
    <>
      <Dropdown
        align="end"
        side="bottom"
        sideOffset={12}
        className="w-80"
        open={isOpen}
        onOpenChange={handleOpenChange}
        trigger={
          <button className="relative rounded-lg p-2 text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-muted))] hover:text-[rgb(var(--brand-primary))] transition-colors outline-none focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary))/0.2]">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-[rgb(var(--bg-surface))]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        }
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3 border-b border-[rgb(var(--border-base))] pb-2">
            <h3 className="font-semibold text-sm text-[rgb(var(--text-primary))]">
              {t("notifications.title", "Notificaciones")}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleToggleSound}
                className={`p-1 rounded hover:bg-[rgb(var(--bg-muted))] ${soundEnabled ? "text-[rgb(var(--brand-primary))]" : "text-gray-400"}`}
                title={soundEnabled ? "Silenciar" : "Activar sonido"}
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-6 text-sm text-[rgb(var(--text-secondary))]">
                {t("notifications.empty", "No tienes notificaciones.")}
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.$id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors flex gap-3 ${
                    n.read
                      ? "bg-transparent hover:bg-[rgb(var(--bg-muted))]"
                      : "bg-[rgb(var(--bg-muted))/0.5] hover:bg-[rgb(var(--bg-muted))]"
                  }`}
                >
                  <div
                    className={`mt-1 h-2 w-2 rounded-full shrink-0 ${n.read ? "bg-transparent" : "bg-[rgb(var(--brand-primary))]"}`}
                  />
                  <div>
                    <p
                      className={`text-sm ${n.read ? "text-[rgb(var(--text-primary))]" : "font-semibold text-[rgb(var(--text-primary))]"}`}
                    >
                      {n.title}
                    </p>
                    <p className="text-xs text-[rgb(var(--text-secondary))] line-clamp-2">
                      {n.body}
                    </p>
                    <p className="text-[10px] text-[rgb(var(--text-tertiary))] mt-1">
                      {new Date(n.$createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-[rgb(var(--border-base))] text-center">
            <button
              onClick={() => {
                navigate("/app/notifications");
                setIsOpen(false);
              }}
              className="text-xs font-semibold text-[rgb(var(--brand-primary))] hover:underline block w-full py-1"
            >
              {t("notifications.viewAll", "Ver todas las notificaciones")}
            </button>
          </div>
        </div>
      </Dropdown>
      <NotificationModal />
    </>
  );
}
