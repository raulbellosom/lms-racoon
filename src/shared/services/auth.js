import { account, db, ID } from "../appwrite/client";
import { APPWRITE } from "../appwrite/ids";

/**
 * Splits a full name into firstName and lastName
 * @param {string} fullName
 * @returns {{ firstName: string, lastName: string }}
 */
function splitName(fullName) {
  const s = String(fullName || "")
    .trim()
    .replace(/\s+/g, " ");
  if (!s) return { firstName: "Usuario", lastName: "" };
  const parts = s.split(" ");
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

/**
 * NOTE: In production, recommended flow:
 * - create user in Auth
 * - Appwrite Function (users.*.create event) creates profile doc with same id
 *
 * This client includes a fallback to create the profile if it doesn't exist.
 */
export async function register({ email, password, name }) {
  const userId = ID.unique();
  await account.create(userId, email, password, name);
  await account.createEmailPasswordSession(email, password);
  const user = await account.get();

  const { firstName, lastName } = splitName(name || user.name);

  // Fallback: ensure profile exists (in case the Appwrite Function hasn't run yet)
  try {
    await db.getDocument(
      APPWRITE.databaseId,
      APPWRITE.collections.profiles,
      user.$id,
    );
  } catch {
    // Profile doesn't exist, create it
    await db.createDocument(
      APPWRITE.databaseId,
      APPWRITE.collections.profiles,
      user.$id,
      {
        firstName,
        lastName,
        role: "student",
        avatarFileId: "",
        bio: "",
        phone: "",
        country: "MX",
        enabled: true,
      },
    );
  }

  const profile = await db.getDocument(
    APPWRITE.databaseId,
    APPWRITE.collections.profiles,
    user.$id,
  );
  return { user, profile };
}

export async function login({ email, password }) {
  await account.createEmailPasswordSession(email, password);
  const user = await account.get();

  let profile = null;
  try {
    profile = await db.getDocument(
      APPWRITE.databaseId,
      APPWRITE.collections.profiles,
      user.$id,
    );
  } catch {
    // If profile doesn't exist yet (race condition with Function), wait and retry
    await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      profile = await db.getDocument(
        APPWRITE.databaseId,
        APPWRITE.collections.profiles,
        user.$id,
      );
    } catch {
      // Still doesn't exist, create minimal profile
      const { firstName, lastName } = splitName(user.name);
      profile = await db.createDocument(
        APPWRITE.databaseId,
        APPWRITE.collections.profiles,
        user.$id,
        {
          firstName,
          lastName,
          role: "student",
          avatarFileId: "",
          bio: "",
          phone: "",
          country: "MX",
          enabled: true,
        },
      );
    }
  }

  return { user, profile };
}

export async function logout() {
  try {
    await account.deleteSession("current");
  } catch {
    // ignore
  }
}

/**
 * Get current user session and profile
 * @returns {Promise<{ user: object, profile: object } | null>}
 */
export async function getCurrentUser() {
  try {
    const user = await account.get();
    const profile = await db.getDocument(
      APPWRITE.databaseId,
      APPWRITE.collections.profiles,
      user.$id,
    );
    return { user, profile };
  } catch {
    return null;
  }
}
