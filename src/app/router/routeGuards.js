import { redirect } from "react-router-dom";
import { authStore } from "../stores/authStore";

export async function requireAuthLoader({ request }) {
  const state = authStore.getState();
  if (!state.isHydrated) {
    await authStore.hydrate();
  }
  if (!authStore.getState().session) {
    const url = new URL(request.url);
    const returnUrl = url.pathname + url.search;

    // Save for robust redirection after registration/multi-step auth
    localStorage.setItem("racoon-return-url", returnUrl);

    throw redirect(`/auth/login?redirect=${encodeURIComponent(returnUrl)}`);
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

export async function requireGuestLoader() {
  const state = authStore.getState();
  if (!state.isHydrated) {
    await authStore.hydrate();
  }
  // Si hay sesión, redirigir al home de la app
  if (authStore.getState().session) {
    throw redirect("/app/home");
  }
  return null;
}

export async function publicRouteLoader({ request }) {
  const state = authStore.getState();
  if (!state.isHydrated) {
    await authStore.hydrate();
  }

  // If authenticated, redirect to app equivalent
  if (authStore.getState().session) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/" || path === "") {
      throw redirect("/app/home");
    }

    if (path === "/catalog" || path === "/catalog/") {
      throw redirect("/app/explore");
    }

    if (path.startsWith("/catalog/")) {
      const id = path.split("/").pop();
      throw redirect(`/app/courses/${id}`);
    }

    // Default to app home if logged in but on a public page
    throw redirect("/app/home");
  }

  return null;
}
