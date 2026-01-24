import { db, Query } from "../appwrite/client";
import { APPWRITE } from "../appwrite/ids";

const { databaseId } = APPWRITE;
const { courseStats } = APPWRITE.collections;

export const StatsService = {
  async getCourseStats(courseId) {
    try {
      const response = await db.listDocuments(databaseId, courseStats, [
        Query.equal("courseId", courseId),
      ]);
      return response.documents[0] || null;
    } catch (error) {
      console.warn(`Failed to fetch stats for course ${courseId}`, error);
      return null;
    }
  },

  async getStatsForCourses(courseIds) {
    if (!courseIds.length) return {};
    // Appwrite doesn't have "in" query for listDocuments widely optimized for many IDs,
    // but we can try parallel requests or a single list if small number.
    // For now, let's fetch individual for robustness or list all and filter if feasible?
    // Actually, let's just do parallel, it's simpler for limited teacher courses.
    const promises = courseIds.map((id) => this.getCourseStats(id));
    const results = await Promise.all(promises);

    // Map courseId -> stats
    const statsMap = {};
    results.forEach((stat, index) => {
      if (stat) {
        statsMap[courseIds[index]] = stat;
      }
    });
    return statsMap;
  },
};
