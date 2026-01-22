import { Client, Databases } from "node-appwrite";

/**
 * Appwrite Function — onUserCreated
 * Trigger: users.*.create
 */
export default async ({ req, res, log, error }) => {
  try {
    const endpoint = process.env.APPWRITE_ENDPOINT;
    const project = process.env.APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;

    const databaseId = process.env.APPWRITE_DATABASE_ID || "lms";
    const profilesCol = process.env.APPWRITE_PROFILES_COLLECTION_ID || "profiles";

    if (!endpoint || !project || !apiKey) {
      throw new Error("Missing APPWRITE_ENDPOINT / APPWRITE_PROJECT_ID / APPWRITE_API_KEY");
    }

    const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey);
    const db = new Databases(client);

    const payload = req.bodyJson || {};
    const userId = payload?.$id || payload?.userId || payload?.id;

    if (!userId) {
      throw new Error("Could not determine user id from event payload");
    }

    const name = payload?.name || payload?.email?.split?.("@")?.[0] || "Nuevo usuario";

    // Create profile doc using SAME id as auth user
    // If already exists, ignore.
    try {
      await db.getDocument(databaseId, profilesCol, userId);
      log(`Profile already exists for ${userId}`);
    } catch {
      await db.createDocument(databaseId, profilesCol, userId, {
        displayName: name,
        role: "student",
        avatarFileId: "",
        bio: "",
        phone: "",
        country: "MX",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      log(`Created profile for ${userId}`);
    }

    return res.json({ ok: true, userId });
  } catch (e) {
    error(e.message || String(e));
    return res.json({ ok: false, error: e.message || String(e) }, 500);
  }
};
