import { ID, Query } from "appwrite";
import { db } from "../appwrite/client";
import { APPWRITE } from "../appwrite/ids";

const { databaseId } = APPWRITE;
const { courses } = APPWRITE.collections;

export const TeacherCoursesService = {
  /**
   * List courses created by a specific teacher
   * @param {string} teacherId - The user ID of the teacher
   */
  async listByTeacher(teacherId) {
    if (!teacherId) return [];

    // Query courses where teacherId matches and enabled is true (logic delete)
    const queries = [
      Query.equal("teacherId", teacherId),
      Query.equal("enabled", true),
      Query.orderDesc("$createdAt"),
    ];

    const response = await db.listDocuments(databaseId, courses, queries);
    return response.documents;
  },

  async getById(courseId) {
    return await db.getDocument(databaseId, courses, courseId);
  },

  async create(data) {
    return await db.createDocument(databaseId, courses, ID.unique(), {
      ...data,
      enabled: true,
      isPublished: false,
      publishedAt: null,
    });
  },

  async update(courseId, data) {
    return await db.updateDocument(databaseId, courses, courseId, data);
  },

  /**
   * Soft delete a course
   */
  async delete(courseId) {
    return await db.updateDocument(databaseId, courses, courseId, {
      enabled: false,
    });
  },

  async publish(courseId, isPublished = true) {
    const data = {
      isPublished,
      publishedAt: isPublished ? new Date().toISOString() : null,
    };
    return await db.updateDocument(databaseId, courses, courseId, data);
  },
};
