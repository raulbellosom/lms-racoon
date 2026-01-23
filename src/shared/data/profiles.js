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

  async uploadAvatar(file) {
    return await storage.createFile(avatars, ID.unique(), file);
  },

  getAvatarUrl(fileId) {
    if (!fileId) return null;
    return storage.getFilePreview(avatars, fileId);
  },
};
