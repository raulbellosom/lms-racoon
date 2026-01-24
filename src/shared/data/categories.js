import { db, ID } from "../appwrite/client";
import { APPWRITE } from "../appwrite/ids";
import { Query } from "appwrite";

const COLLECTION = APPWRITE.collections.categories;

export const CategoryService = {
  async list() {
    const response = await db.listDocuments(APPWRITE.databaseId, COLLECTION, [
      Query.orderAsc("name"),
    ]);
    return response.documents;
  },

  async create(data) {
    // data: { name, slug }
    return await db.createDocument(
      APPWRITE.databaseId,
      COLLECTION,
      ID.unique(),
      {
        ...data,
        enabled: true,
      },
    );
  },

  async delete(id) {
    // Soft delete or hard delete? The docs say "enabled: true" for logical delete.
    // Let's do logical delete as per docs "Borrado lógico: enabled: true (para “eliminar”, set enabled=false)"
    return await db.updateDocument(APPWRITE.databaseId, COLLECTION, id, {
      enabled: false,
    });
  },

  async restore(id) {
    return await db.updateDocument(APPWRITE.databaseId, COLLECTION, id, {
      enabled: true,
    });
  },
};
