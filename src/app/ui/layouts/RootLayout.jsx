import React from "react";
import { Outlet } from "react-router-dom";

export function RootLayout() {
  return (
    <div className="min-h-[100dvh]">
      <Outlet />
    </div>
  );
}
