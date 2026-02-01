const sdk = require("node-appwrite");

/**
 * Racoon LMS — syncUserProfile
 *
 * Uso recomendado:
 * - Se invoca desde el frontend autenticado (con sesión Appwrite).
 * - La Function usa APPWRITE_FUNCTION_USER_ID (inyectado por Appwrite) como fuente de verdad.
 *
 * Qué hace:
 * 1) Actualiza el documento `profiles/{userId}` (firstName, lastName, phone, bio, country, avatarFileId)
 * 2) Sincroniza `name`, `email` y `phone` en Appwrite Auth.
 *
 * Seguridad:
 * - Si NO hay APPWRITE_FUNCTION_USER_ID, solo permite operar si envías `SERVICE_CALL_SECRET`
 *   y coincide con `SYNC_PROFILE_SERVICE_SECRET`.
 */

function safeStr(v, maxLen) {
  const s = String(v ?? "").trim();
  return maxLen ? s.slice(0, maxLen) : s;
}

function buildFullName(firstName, lastName) {
  return `${String(firstName || "").trim()} ${String(lastName || "").trim()}`.trim();
}

function formatPhone(phone) {
  if (!phone) return "";
  const raw = String(phone).trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (raw.startsWith("+")) return raw.replace(/[^+\d]/g, "");
  // default MX if 10 digits
  if (digits.length === 10) return `+52${digits}`;
  return `+${digits}`;
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

  const serviceSecret = process.env.SYNC_PROFILE_SERVICE_SECRET || "";

  if (!endpoint || !projectId || !apiKey) {
    error("Missing APPWRITE endpoint/projectId/apiKey env vars");
    return res.json({ success: false, message: "Server misconfigured" }, 500);
  }

  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

  // Parse body
  let body = {};
  try {
    const raw = req.body ?? req.payload ?? "{}";
    body = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (e) {
    return res.json({ success: false, message: "Invalid JSON body" }, 400);
  }

  // Determine userId (prefer authenticated invocation)
  const authedUserId =
    process.env.APPWRITE_FUNCTION_USER_ID || req.headers["x-appwrite-user-id"];

  let userId = authedUserId;

  if (!userId) {
    const providedSecret =
      body.SERVICE_CALL_SECRET || req.headers?.["x-service-secret"];
    if (!serviceSecret || providedSecret !== serviceSecret) {
      return res.json(
        { success: false, message: "Unauthorized (no function user id)" },
        401,
      );
    }
    userId = body.userId;
  }

  if (!userId) {
    return res.json({ success: false, message: "Missing userId" }, 400);
  }

  const firstName = safeStr(body.firstName, 40);
  const lastName = safeStr(body.lastName, 40);
  const fullName = buildFullName(firstName, lastName);

  // Important: Check keys existence to decide if we update
  const email = safeStr(body.email, 100);
  const phone = formatPhone(body.phone);

  // Build patch object dynamically
  const patch = {};
  if (firstName || body.firstName === "") patch.firstName = firstName;
  if (lastName || body.lastName === "") patch.lastName = lastName;

  // Be careful with email/phone uniqueness constraints
  // Only add if explicitly provided in body
  if (body.email !== undefined) patch.email = email;
  if (body.phone !== undefined) patch.phone = phone;

  // Fetch Auth User to check for changes
  let authUser = null;
  try {
    authUser = await users.get(userId);
  } catch (e) {
    // If user not found in Auth, we can't sync, but we can update profile
    log(`Auth user ${userId} not found: ${e.message}`);
  }

  // Check if email changed
  if (
    authUser &&
    email &&
    email.toLowerCase() !== authUser.email.toLowerCase()
  ) {
    patch.emailVerified = false;
    log(`Email changed for ${userId}: resetting emailVerified to false.`);
  }

  if (body.bio !== undefined) patch.bio = safeStr(body.bio, 500);
  if (body.headline !== undefined) patch.headline = safeStr(body.headline, 120);
  if (body.socials !== undefined) patch.socials = safeStr(body.socials, 2500);
  if (body.country !== undefined) patch.country = safeStr(body.country, 2);
  if (body.avatarFileId !== undefined)
    patch.avatarFileId = safeStr(body.avatarFileId, 36);
  if (body.suspended !== undefined) patch.suspended = Boolean(body.suspended);
  if (body.enabled !== undefined) patch.enabled = Boolean(body.enabled);

  if (Object.keys(patch).length === 0) {
    return res.json({ success: true, message: "No changes detected" });
  }

  try {
    log(
      `Updating profile ${userId}. Patch keys: ${Object.keys(patch).join(", ")}`,
    );

    // 1) Update profile document
    try {
      await db.updateDocument(databaseId, profilesCollectionId, userId, patch);
    } catch (dbErr) {
      log(`DB Update failed for ${userId}: ${dbErr.message}`);
      // If "Missing required attribute", it means specific attributes are required in the schema
      // but were missing in the document OR possibly in the patch if creating?
      // Actually, updateDocument checks if the resulting document is valid.
      // It might be that the existing document MUST have 'email' but it's currently empty/null,
      // and we are trying to update OTHER fields, triggering the validation error?
      // Or we are sending 'email': '' (empty string) but the attribute is Required.
      throw dbErr;
    }

    // 2) Sync auth name, email, phone
    // const authUser = await users.get(userId); // Moved up
    if (!authUser) authUser = await users.get(userId); // Retry if failed before? Or just use existing.
    const updates = [];

    // Sync Name
    if (fullName && fullName !== authUser.name) {
      await users.updateName(userId, fullName);
      updates.push("name");
    }

    // Sync Email
    if (email && email.toLowerCase() !== authUser.email.toLowerCase()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email)) {
        await users.updateEmail(userId, email);
        updates.push("email");
      }
    }

    // Sync Phone
    if (phone && phone !== authUser.phone) {
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      if (e164Regex.test(phone)) {
        await users.updatePhone(userId, phone);
        updates.push("phone");
      }
    }

    return res.json({
      success: true,
      userId,
      updatedProfile: Object.keys(patch),
      syncedAuth: updates,
    });
  } catch (err) {
    error("syncUserProfile failed: " + err.message);
    // Return detailed error for debugging
    return res.json(
      { success: false, message: err.message, code: err.code || 500 },
      500,
    );
  }
};
