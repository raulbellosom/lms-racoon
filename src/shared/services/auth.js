import { account, db, ID } from "../appwrite/client";
import { APPWRITE } from "../appwrite/ids";

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

  // Fallback: ensure profile exists
  try {
    await db.getDocument(APPWRITE.databaseId, APPWRITE.collections.profiles, user.$id);
  } catch {
    await db.createDocument(APPWRITE.databaseId, APPWRITE.collections.profiles, user.$id, {
      displayName: name || user.name || "Nuevo usuario",
      role: "student",
      avatarFileId: "",
      bio: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  const profile = await db.getDocument(APPWRITE.databaseId, APPWRITE.collections.profiles, user.$id);
  return { user, profile };
}

export async function login({ email, password }) {
  await account.createEmailPasswordSession(email, password);
  const user = await account.get();
  const profile = await db.getDocument(APPWRITE.databaseId, APPWRITE.collections.profiles, user.$id);
  return { user, profile };
}

export async function logout() {
  try {
    await account.deleteSession("current");
  } catch {
    // ignore
  }
}
