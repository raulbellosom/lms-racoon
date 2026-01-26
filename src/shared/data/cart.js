import { ID, Query } from "appwrite";
import { db as databases } from "../appwrite/client";

const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COL_CART = import.meta.env.VITE_APPWRITE_COL_CART;
const COL_COURSES = import.meta.env.VITE_APPWRITE_COL_COURSES; // To expand course details

export const CartService = {
  /**
   * Get all cart items for a user
   * @param {string} userId
   * @returns {Promise<Array>} Array of cart items (enriched with course data if possible)
   */
  async getCart(userId) {
    if (!userId) return [];
    try {
      const response = await databases.listDocuments(DB_ID, COL_CART, [
        Query.equal("userId", userId),
      ]);

      // We need to fetch course details for each item.
      // Ideally, we might use a relationship or backend function, but for now we fetch courses.
      // Optimization: Promise.all
      const items = await Promise.all(
        response.documents.map(async (doc) => {
          try {
            const course = await databases.getDocument(
              DB_ID,
              COL_COURSES,
              doc.courseId,
            );
            return {
              ...course, // Spread course data (title, price, etc.)
              $cartItemId: doc.$id, // Keep reference to cart item ID
              addedAt: doc.addedAt,
            };
          } catch (e) {
            console.error("Failed to load course for cart item", doc.courseId);
            return null;
          }
        }),
      );

      return items.filter((i) => i !== null);
    } catch (error) {
      console.error("CartService.getCart error:", error);
      return [];
    }
  },

  /**
   * Add a course to the user's cart
   * @param {string} userId
   * @param {string} courseId
   */
  async addToCart(userId, courseId) {
    try {
      // Check if already exists to avoid duplicates (though constraint should handle it)
      // We rely on unique constraint userId_courseId
      await databases.createDocument(DB_ID, COL_CART, ID.unique(), {
        userId,
        courseId,
        addedAt: new Date().toISOString(),
      });
    } catch (error) {
      // Ignore "Document already exists" error (409)
      if (error.code !== 409) {
        console.error("CartService.addToCart error:", error);
        throw error;
      }
    }
  },

  /**
   * Remove a course from the cart
   * @param {string} userId
   * @param {string} courseId
   */
  async removeFromCart(userId, courseId) {
    try {
      // We need to find the document ID first since we delete by document ID
      const list = await databases.listDocuments(DB_ID, COL_CART, [
        Query.equal("userId", userId),
        Query.equal("courseId", courseId),
      ]);

      if (list.documents.length > 0) {
        await databases.deleteDocument(DB_ID, COL_CART, list.documents[0].$id);
      }
    } catch (error) {
      console.error("CartService.removeFromCart error:", error);
      throw error;
    }
  },

  /**
   * Clear user's cart
   * @param {string} userId
   */
  async clearCart(userId) {
    try {
      // List all
      // Delete loops (Appwrite doesn't have deleteMany yet)
      const list = await databases.listDocuments(DB_ID, COL_CART, [
        Query.equal("userId", userId),
      ]);

      await Promise.all(
        list.documents.map((doc) =>
          databases.deleteDocument(DB_ID, COL_CART, doc.$id),
        ),
      );
    } catch (error) {
      console.error("CartService.clearCart error:", error);
      throw error;
    }
  },
};
