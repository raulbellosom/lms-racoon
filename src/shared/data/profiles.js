import { db, storage, Query } from "../appwrite/client";
import { ID } from "appwrite";
import { APPWRITE } from "../appwrite/ids";

export async function getProfileById(userId) {
  const dbId = APPWRITE.databaseId;
  const col = APPWRITE.collections.profiles;

  // demo mode
  if (
    !import.meta.env.VITE_APPWRITE_ENDPOINT ||
    !import.meta.env.VITE_APPWRITE_PROJECT_ID
  ) {
    return {
      $id: userId,
      displayName: "Demo User",
      role: "student",
      avatarFileId: null,
      bio: "Perfil demo (sin Appwrite configurado).",
    };
  }

  const doc = await db.getDocument(dbId, col, userId);
  return doc;
}

export async function searchTeachers({ q = "" } = {}) {
  const dbId = APPWRITE.databaseId;
  const col = APPWRITE.collections.profiles;

  if (
    !import.meta.env.VITE_APPWRITE_ENDPOINT ||
    !import.meta.env.VITE_APPWRITE_PROJECT_ID
  ) {
    return [];
  }

  const res = await db.listDocuments(dbId, col, [
    Query.equal("role", "teacher"),
    ...(q ? [Query.search("displayName", q)] : []),
    Query.limit(20),
  ]);
  return res.documents;
}

const { avatars } = APPWRITE.buckets;
import { functions } from "../appwrite/client";

export const ProfileService = {
  async update(profileId, data) {
    if (!profileId) throw new Error("Profile ID required");
    return await db.updateDocument(
      APPWRITE.databaseId,
      APPWRITE.collections.profiles,
      profileId,
      data,
    );
  },

  /**
   * Updates profile via Cloud Function to sync with Auth (email/phone/name)
   * @param {string} userId
   * @param {object} data { firstName, lastName, email, phone, bio, ... }
   */
  async syncUpdate(userId, data) {
    if (!userId) throw new Error("User ID required");

    const execution = await functions.createExecution(
      APPWRITE.functions.syncUserProfile,
      JSON.stringify({ userId, ...data }),
      false, // async (false = sync execution to get result immediately)
    );

    const response = JSON.parse(execution.responseBody);
    if (!response.success) {
      throw new Error(response.message || "Sync update failed");
    }

    return response;
  },

  async uploadAvatar(file) {
    return await storage.createFile(avatars, ID.unique(), file);
  },

  getAvatarUrl(fileId) {
    if (!fileId) return null;
    return storage.getFilePreview(avatars, fileId);
  },
};
