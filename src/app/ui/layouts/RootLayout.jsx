import React from "react";
import { Outlet } from "react-router-dom";
import { ScrollToTop } from "../../../shared/ui/ScrollToTop";

export function RootLayout() {
  return (
    <div className="min-h-[100dvh]">
      <ScrollToTop />
      <Outlet />
    </div>
  );
}
