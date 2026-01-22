import { account } from "../../shared/appwrite/client";
import { getProfileById } from "../../shared/data/profiles";

/**
 * Tiny auth store (no external state libs).
 * Persists session + profile in localStorage.
 */
const KEY = "racoon-lms-auth-v1";

let state = {
  isHydrated: false,
  session: null,
  user: null,
  profile: null,
};

const listeners = new Set();

function notify() {
  for (const fn of listeners) fn(state);
}

function setState(patch) {
  state = { ...state, ...patch };
  notify();
}

async function hydrate() {
  if (state.isHydrated) return;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed, isHydrated: true };
    } else {
      state = { ...state, isHydrated: true };
    }
  } catch {
    state = { ...state, isHydrated: true };
  }

  // Validate quickly by asking Appwrite for the current user if session exists
  if (state.session) {
    try {
      const user = await account.get();
      const profile = await getProfileById(user.$id).catch(() => null);
      setState({ user, profile });
    } catch {
      clear();
    }
  } else {
    notify();
  }
}

function persist() {
  const { isHydrated, ...persistable } = state;
  localStorage.setItem(KEY, JSON.stringify(persistable));
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getState() {
  return state;
}

function clear() {
  state = { isHydrated: true, session: null, user: null, profile: null };
  localStorage.removeItem(KEY);
  notify();
}

async function refresh() {
  const user = await account.get();
  const profile = await getProfileById(user.$id).catch(() => null);
  setState({ user, profile });
  persist();
  return { user, profile };
}

export const authStore = {
  getState,
  subscribe,
  setState: (patch) => {
    setState(patch);
    persist();
  },
  hydrate,
  clear,
  refresh,
};
