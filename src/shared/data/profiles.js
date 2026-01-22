import { db, Query } from "../appwrite/client";
import { APPWRITE } from "../appwrite/ids";

export async function getProfileById(userId) {
  const dbId = APPWRITE.databaseId;
  const col = APPWRITE.collections.profiles;

  // demo mode
  if (!import.meta.env.VITE_APPWRITE_ENDPOINT || !import.meta.env.VITE_APPWRITE_PROJECT_ID) {
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

  if (!import.meta.env.VITE_APPWRITE_ENDPOINT || !import.meta.env.VITE_APPWRITE_PROJECT_ID) {
    return [];
  }

  const res = await db.listDocuments(dbId, col, [
    Query.equal("role", "teacher"),
    ...(q ? [Query.search("displayName", q)] : []),
    Query.limit(20),
  ]);
  return res.documents;
}
