import { ID, Query } from "appwrite";
import { db } from "../appwrite/client";
import { APPWRITE } from "../appwrite/ids";

const { databaseId } = APPWRITE;
const { courseSections } = APPWRITE.collections;

export const SectionService = {
  async listByCourse(courseId) {
    if (!courseId) return [];

    const queries = [
      Query.equal("courseId", courseId),
      Query.equal("enabled", true),
      Query.orderAsc("order"),
    ];

    const response = await db.listDocuments(
      databaseId,
      courseSections,
      queries,
    );
    return response.documents;
  },

  async create(data) {
    return await db.createDocument(databaseId, courseSections, ID.unique(), {
      ...data,
      enabled: true,
    });
  },

  async update(sectionId, data) {
    return await db.updateDocument(databaseId, courseSections, sectionId, data);
  },

  async delete(sectionId) {
    return await db.updateDocument(databaseId, courseSections, sectionId, {
      enabled: false,
    });
  },

  async reorder(items) {
    // items is array of { $id, order }
    const promises = items.map((item) =>
      db.updateDocument(databaseId, courseSections, item.$id, {
        order: item.order,
      }),
    );
    return Promise.all(promises);
  },
};
