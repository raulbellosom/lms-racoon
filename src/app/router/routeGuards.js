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
    // Siempre intentar hidratar primero para asegurar estado fresco al recargar
    // o navegar directamente a la URL
    await authStore.hydrate();

    // Obtener el estado más reciente después de hidratar
    const state = authStore.getState();
    const role = state.profile?.role;

    // Si no hay perfil o el rol no coincide, redirigir
    if (!role || !allowedRoles.includes(role)) {
      // Opcional: Podrías hacer un console.warn para debug
      // console.warn("Acceso denegado. Role:", role, "Allowed:", allowedRoles);
      throw redirect("/app/home");
    }
    return null;
  };
}
