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
 * 2) Sincroniza el `name` del usuario de Auth: `${firstName} ${lastName}` (trim)
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
  const authedUserId = process.env.APPWRITE_FUNCTION_USER_ID;
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

  if (!firstName || !lastName) {
    return res.json(
      { success: false, message: "firstName and lastName are required" },
      400,
    );
  }

  const fullName = buildFullName(firstName, lastName);
  const now = new Date().toISOString();

  const patch = {
    firstName,
    lastName,
    phone: formatPhone(body.phone),
    bio: safeStr(body.bio, 500),
    country: safeStr(body.country || "MX", 2),
    avatarFileId: safeStr(body.avatarFileId, 36),
  };

  try {
    // 1) Update profile document
    await db.updateDocument(databaseId, profilesCollectionId, userId, patch);

    // 2) Sync auth name
    const authUser = await users.get(userId);
    if (fullName && fullName !== authUser.name) {
      await users.updateName(userId, fullName);
    }

    return res.json({
      success: true,
      userId,
      fullName,
      updated: Object.keys(patch),
    });
  } catch (err) {
    error("syncUserProfile failed: " + err.message);
    return res.json(
      { success: false, message: err.message, code: err.code },
      500,
    );
  }
};
