import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

/**
 * Hook/Component to handle notification clicks.
 * Can open a modal or redirect.
 */
export function useNotificationAction() {
  const navigate = useNavigate();
  const [modalContent, setModalContent] = useState(null);

  const handleAction = (notification) => {
    try {
      const data = JSON.parse(notification.dataJson || "{}");

      // 1. Direct Link
      if (data.actionType === "link" || (!data.actionType && data.link)) {
        if (data.link) navigate(data.link);
        return;
      }

      // 2. Modal Details (e.g. "modal")
      if (data.actionType === "modal") {
        setModalContent({
          title: notification.title,
          body: notification.body,
          ...data, // extra fields support
        });
        return;
      }

      // Default fallback
      if (data.link) navigate(data.link);
    } catch (e) {
      console.error("Invalid notification data", e);
    }
  };

  const closeLoop = () => setModalContent(null);

  const NotificationModal = () => (
    <Modal
      open={!!modalContent}
      onClose={closeLoop}
      title={modalContent?.title || ""}
    >
      <div className="space-y-4">
        <p className="text-[rgb(var(--text-secondary))] whitespace-pre-wrap">
          {modalContent?.body}
        </p>

        {/* Dynamic Content could go here based on actionType subtype */}

        <div className="flex justify-end pt-4">
          {modalContent?.link && (
            <Button
              onClick={() => {
                navigate(modalContent.link);
                closeLoop();
              }}
            >
              Ir a detalle
            </Button>
          )}
          <Button variant="ghost" onClick={closeLoop}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );

  return { handleAction, NotificationModal };
}
