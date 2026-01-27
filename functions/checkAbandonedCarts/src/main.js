const sdk = require("node-appwrite");

/**
 * Racoon LMS — checkAbandonedCarts
 * Trigger: Schedule (CRON)
 *
 * Checks for cart items added 30 days ago and sends a notification.
 */

module.exports = async ({ req, res, log, error }) => {
  const client = new sdk.Client();
  const db = new sdk.Databases(client);

  const endpoint =
    process.env.APPWRITE_FUNCTION_ENDPOINT || process.env.APPWRITE_ENDPOINT;
  const projectId =
    process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
  const apiKey =
    process.env.APPWRITE_FUNCTION_API_KEY || process.env.APPWRITE_API_KEY;

  const databaseId = process.env.APPWRITE_DATABASE_ID || "lms";
  const cartCollectionId = process.env.APPWRITE_CART_COLLECTION_ID || "cart";
  const notificationsCollectionId =
    process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID || "notifications";

  if (!endpoint || !projectId || !apiKey) {
    error("Missing APPWRITE env vars");
    return res.json({ success: false, message: "Server misconfigured" }, 500);
  }

  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

  try {
    // 1. Calculate Date Range (30 to 31 days ago)
    const now = new Date();
    const days30Ago = new Date(now);
    days30Ago.setDate(now.getDate() - 30);
    const days31Ago = new Date(now);
    days31Ago.setDate(now.getDate() - 31);

    log(
      `Checking for carts between ${days31Ago.toISOString()} and ${days30Ago.toISOString()}`,
    );

    // 2. Query Cart Items
    // addedAt > days31Ago AND addedAt < days30Ago
    const queries = [
      sdk.Query.greaterThan("addedAt", days31Ago.toISOString()),
      sdk.Query.lessThan("addedAt", days30Ago.toISOString()),
      sdk.Query.limit(100), // Process in batches if needed, for now limit 100
    ];

    const cartItems = await db.listDocuments(
      databaseId,
      cartCollectionId,
      queries,
    );

    log(`Found ${cartItems.total} potential abandoned items.`);

    if (cartItems.total === 0) {
      return res.json({
        success: true,
        message: "No abandoned carts found in range",
      });
    }

    // 3. Group by User to avoid spamming multiple notifications
    const usersToNotify = new Set();
    cartItems.documents.forEach((item) => {
      if (item.userId) {
        usersToNotify.add(item.userId);
      }
    });

    log(`Found ${usersToNotify.size} unique users to notify.`);

    // 4. Send Notifications
    let sentCount = 0;
    const errors = [];

    for (const userId of usersToNotify) {
      try {
        await db.createDocument(
          databaseId,
          notificationsCollectionId,
          sdk.ID.unique(),
          {
            userId: userId,
            type: "system", // or 'sale'
            title: "¡Olvidaste algo en tu carrito!",
            body: "Tus cursos te están esperando. Completa tu compra hoy.",
            read: false,
            createdAt: new Date().toISOString(),
            dataJson: JSON.stringify({
              link: "/cart",
              action: "abandoned_cart_recovery",
            }),
          },
        );
        sentCount++;
      } catch (e) {
        error(`Failed to notify user ${userId}: ${e.message}`);
        errors.push({ userId, error: e.message });
      }
    }

    log(`Successfully sent ${sentCount} notifications.`);

    return res.json({
      success: true,
      foundItems: cartItems.total,
      usersNotified: sentCount,
      errors: errors,
    });
  } catch (err) {
    error("checkAbandonedCarts failed: " + err.message);
    return res.json({ success: false, message: err.message }, 500);
  }
};
