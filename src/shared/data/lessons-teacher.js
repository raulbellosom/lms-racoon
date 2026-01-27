import { ID, Query } from "appwrite";
import { db } from "../appwrite/client";
import { APPWRITE } from "../appwrite/ids";

const { databaseId } = APPWRITE;
const { lessons } = APPWRITE.collections;

export const LessonService = {
  async listBySection(sectionId) {
    if (!sectionId) return [];

    const queries = [
      Query.equal("sectionId", sectionId),
      Query.equal("enabled", true),
      Query.orderAsc("order"),
    ];

    const response = await db.listDocuments(databaseId, lessons, queries);
    return response.documents;
  },

  async getById(lessonId) {
    return await db.getDocument(databaseId, lessons, lessonId);
  },

  // Helper to get all lessons for a course to calculate stats or duration
  async listByCourse(courseId) {
    if (!courseId) return [];

    const queries = [
      Query.equal("courseId", courseId),
      Query.equal("enabled", true),
    ];
    // Note: If scale is large, we might need pagination, but for edition usually it's fine
    const response = await db.listDocuments(databaseId, lessons, queries);
    return response.documents;
  },

  async create(data) {
    return await db.createDocument(databaseId, lessons, ID.unique(), {
      ...data,
      enabled: true,
    });
  },

  async update(lessonId, data) {
    return await db.updateDocument(databaseId, lessons, lessonId, data);
  },

  async delete(lessonId) {
    return await db.updateDocument(databaseId, lessons, lessonId, {
      enabled: false,
    });
  },

  async reorder(items) {
    const promises = items.map((item) =>
      db.updateDocument(databaseId, lessons, item.$id, {
        order: item.order,
      }),
    );
    return Promise.all(promises);
  },
};
