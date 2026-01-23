import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient } from "@tanstack/react-query";

import "./i18n"; // Initialize i18n
import "./styles/app.css";
import { router } from "./app/router/router";
import { AuthProvider } from "./app/providers/AuthProvider";
import { ToastProvider } from "./app/providers/ToastProvider";
import { ThemeProvider } from "./shared/theme/ThemeProvider";
import { RenderErrorBoundary } from "./shared/errors/RenderErrorBoundary";
import { PWAInstallPrompt } from "./shared/pwa/PWAInstallPrompt";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      gcTime: 1000 * 60 * 60 * 24,
      refetchOnWindowFocus: false,
    },
  },
});

const persister = createSyncStoragePersister({ storage: window.localStorage });

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RenderErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <ThemeProvider defaultTheme="system" storageKey="racoon-lms-theme">
          <ToastProvider>
            <AuthProvider>
              <RouterProvider router={router} />
              <PWAInstallPrompt />
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </PersistQueryClientProvider>
    </RenderErrorBoundary>
  </React.StrictMode>,
);
