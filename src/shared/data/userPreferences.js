import { ID, Query } from "appwrite";
import { db as databases } from "../appwrite/client";
import { APPWRITE } from "../appwrite/ids";

const DB_ID = APPWRITE.databaseId;
const COL_PREFS = APPWRITE.collections.userPreferences;

export const UserPreferencesService = {
  /**
   * Get preferences for a user
   * @param {string} userId
   */
  async getPreferences(userId) {
    if (!userId) return null;
    try {
      const response = await databases.listDocuments(DB_ID, COL_PREFS, [
        Query.equal("userId", userId),
      ]);
      if (response.documents.length > 0) {
        return response.documents[0];
      }
      return null;
    } catch (error) {
      console.error("Failed to get preferences", error);
      return null;
    }
  },

  /**
   * Create or Update preferences
   * @param {string} userId
   * @param {Object} prefs - { language, theme, prefsJson }
   */
  async updatePreferences(userId, prefs) {
    if (!userId) return;

    // Check if exists
    const existing = await this.getPreferences(userId);

    try {
      if (existing) {
        return await databases.updateDocument(
          DB_ID,
          COL_PREFS,
          existing.$id,
          prefs,
        );
      } else {
        return await databases.createDocument(DB_ID, COL_PREFS, ID.unique(), {
          userId,
          ...prefs,
        });
      }
    } catch (error) {
      console.error("Failed to update preferences", error);
      throw error;
    }
  },
};
