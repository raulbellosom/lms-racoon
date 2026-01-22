import { redirect } from "react-router-dom";
import { authStore } from "../stores/authStore";

export async function requireAuthLoader() {
  const state = authStore.getState();
  if (!state.isHydrated) {
    await authStore.hydrate();
  }
  if (!authStore.getState().session) {
    throw redirect("/auth/login");
  }
  return null;
}

export function requireRoleLoader(allowedRoles = []) {
  return async () => {
    const state = authStore.getState();
    if (!state.isHydrated) await authStore.hydrate();
    const role = authStore.getState().profile?.role;
    if (!role || !allowedRoles.includes(role)) {
      throw redirect("/app/home");
    }
    return null;
  };
}
