import { ID, Query } from "appwrite";
import { db as databases } from "../appwrite/client";

const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COL_COUPONS = import.meta.env.VITE_APPWRITE_COL_COUPONS;
const COL_REDEMPTIONS = import.meta.env.VITE_APPWRITE_COL_COUPON_REDEMPTIONS;

export const CouponsService = {
  /**
   * Validate a coupon code
   * @param {string} code
   * @param {string} courseId (optional, if coupon is course specific)
   */
  async validateCoupon(code, courseId) {
    try {
      const response = await databases.listDocuments(DB_ID, COL_COUPONS, [
        Query.equal("code", code.toUpperCase()),
        Query.equal("enabled", true),
      ]);

      if (response.documents.length === 0) {
        throw new Error("Invalid coupon code");
      }

      const coupon = response.documents[0];

      // Check expiration - coupon is valid through the entire expiration day
      if (coupon.expiresAt) {
        const utcDate = new Date(coupon.expiresAt);
        // Create local date using UTC components (assuming 'expiresAt' meant that calendar date)
        const expirationDate = new Date(
          utcDate.getUTCFullYear(),
          utcDate.getUTCMonth(),
          utcDate.getUTCDate(),
          23,
          59,
          59,
          999,
        );

        if (new Date() > expirationDate) {
          throw new Error("Coupon expired");
        }
      }

      // Check max uses
      if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
        throw new Error("Coupon usage limit reached");
      }

      // Check specific course
      if (coupon.courseId && coupon.courseId !== courseId) {
        throw new Error("Coupon not valid for this course");
      }

      return coupon;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Record coupon usage
   * @param {string} couponId
   * @param {string} userId
   * @param {string} orderId
   */
  async redeemCoupon(couponId, userId, orderId) {
    try {
      // Create redemption record
      await databases.createDocument(DB_ID, COL_REDEMPTIONS, ID.unique(), {
        couponId,
        userId,
        redeemedAt: new Date().toISOString(),
        orderId,
      });

      // Increment usage count (Atomic ideally, but here via read/write or function)
      // Ideally invoke a function. Here we just try to update.
      // For atomic increments, Appwrite might need a Function or careful handling.
      // We will assume a backend function `onRedemption` handles the counter,
      // or we do it here optimistically.
      const coupon = await databases.getDocument(DB_ID, COL_COUPONS, couponId);

      const updateData = {};
      if ("usedCount" in coupon) {
        updateData.usedCount = (coupon.usedCount || 0) + 1;
      } else {
        console.warn(
          `Coupon ${couponId} missing usedCount attribute. Increment skipped.`,
        );
      }

      if (Object.keys(updateData).length > 0) {
        await databases.updateDocument(
          DB_ID,
          COL_COUPONS,
          couponId,
          updateData,
        );
      }
    } catch (e) {
      console.error("Redemption failed", e);
      throw e;
    }
  },
};
