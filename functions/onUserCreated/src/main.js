const sdk = require("node-appwrite");

/**
 * Racoon LMS — onUserCreated
 * Trigger: users.*.create
 *
 * Crea/asegura el documento espejo en `profiles` con DocID = Auth userId
 * y genera firstName/lastName a partir del `name` del usuario de Auth.
 *
 * Requiere API KEY (server) con permisos:
 * - users.read
 * - databases.write (para crear/actualizar documento)
 */

function splitName(fullName) {
  const s = String(fullName || "")
    .trim()
    .replace(/\s+/g, " ");
  if (!s) return { firstName: "Usuario", lastName: "" };
  const parts = s.split(" ");
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

module.exports = async ({ req, res, log, error }) => {
  const client = new sdk.Client();
  const users = new sdk.Users(client);
  const db = new sdk.Databases(client);

  const endpoint =
    process.env.APPWRITE_FUNCTION_ENDPOINT || process.env.APPWRITE_ENDPOINT;
  const projectId =
    process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
  const apiKey =
    process.env.APPWRITE_FUNCTION_API_KEY || process.env.APPWRITE_API_KEY;

  const databaseId = process.env.APPWRITE_DATABASE_ID || "lms";
  const profilesCollectionId =
    process.env.APPWRITE_PROFILES_COLLECTION_ID || "profiles";

  if (!endpoint || !projectId || !apiKey) {
    error("Missing APPWRITE endpoint/projectId/apiKey env vars");
    return res.json({ success: false, message: "Server misconfigured" }, 500);
  }

  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

  // Parse event data
  let data = {};
  try {
    const raw = req.body ?? req.payload ?? "{}";
    data = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (e) {
    error("Invalid event payload: " + e.message);
    return res.json({ success: false, message: "Invalid payload" }, 400);
  }

  // Appwrite user create event usually includes $id + name + email + phone, etc.
  const userId = data.$id || data.userId || data.id;
  if (!userId) {
    error("No userId in event payload");
    return res.json({ success: false, message: "No userId in payload" }, 400);
  }

  try {
    // Ensure user exists in Auth (extra safety)
    const authUser = await users.get(userId);

    const { firstName, lastName } = splitName(authUser.name);
    const now = new Date().toISOString();

    const doc = {
      firstName,
      lastName,
      role: "student",
      avatarFileId: "",
      bio: "",
      email: authUser.email || `missing_${userId}@noemail.com`,
      phone: authUser.phone || "",
      country: "MX",
      enabled: true,
      suspended: false,
      emailVerified: false,
    };

    // Create if not exists, else update (idempotent)
    try {
      await db.getDocument(databaseId, profilesCollectionId, userId);
      await db.updateDocument(databaseId, profilesCollectionId, userId, doc);
      log(`profiles/${userId} updated`);
      return res.json({ success: true, action: "updated", userId });
    } catch (e) {
      // If not found -> create
      await db.createDocument(databaseId, profilesCollectionId, userId, doc);
      log(`profiles/${userId} created`);
      var result = { success: true, action: "created", userId };
    }

    // -----------------------------------------------------------------------
    // NEW: Create User Preferences (Default: Mexico)
    // -----------------------------------------------------------------------
    const prefsCollectionId =
      process.env.APPWRITE_USER_PREFERENCES_COLLECTION_ID || "userPreferences";
    try {
      // Check if exists first to be safe (idempotent)
      await db.getDocument(databaseId, prefsCollectionId, userId);
    } catch (e) {
      // If not found, create
      await db.createDocument(databaseId, prefsCollectionId, userId, {
        userId: userId,
        language: "es", // Deafult language
        theme: "system",
        prefsJson: JSON.stringify({ country: "MX", currency: "MXN" }), // Default Mexico context
      });
      log(`userPreferences/${userId} created`);
    }

    // -----------------------------------------------------------------------
    // NEW: Trigger Email Verification
    // -----------------------------------------------------------------------
    const verificationFunctionId = process.env.APPWRITE_FN_EMAIL_VERIFICATION;
    if (verificationFunctionId) {
      try {
        const functions = new sdk.Functions(client);
        await functions.createExecution(
          verificationFunctionId,
          JSON.stringify({
            action: "send",
            userAuthId: userId,
            email: authUser.email,
          }),
          true, // async (fire and forget)
        );
        log(`Triggered email verification for ${userId}`);
      } catch (fnErr) {
        error(`Failed to trigger email verification: ${fnErr.message}`);
        // Do not fail the whole function, as profile is already created
      }
    } else {
      log(
        "EMAIL_VERIFICATION_FUNCTION_ID not set, skipping auto-verification email.",
      );
    }

    return res.json(result);
  } catch (err) {
    error("onUserCreated failed: " + err.message);
    return res.json(
      { success: false, message: err.message, code: err.code },
      500,
    );
  }
};
