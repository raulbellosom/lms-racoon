import { Client, Databases, Users, Query } from "node-appwrite";

/**
 * Actualiza la contraseña de un usuario validando un token personalizado
 *
 * @param {Object} context - Contexto de ejecución de Appwrite Function
 * @param {Object} context.req - Request object
 * @param {Object} context.res - Response object
 * @param {Function} context.log - Función de logging
 * @param {Function} context.error - Función de error logging
 */
export default async ({ req, res, log, error }) => {
  // Validar que sea método POST
  if (req.method !== "POST") {
    return res.json(
      {
        success: false,
        message: "Método no permitido. Use POST.",
      },
      405
    );
  }

  try {
    // Parsear body - Appwrite Functions envía el payload en req.body o req.bodyRaw
    let bodyData;
    try {
      bodyData = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (!bodyData) {
        bodyData = JSON.parse(req.bodyRaw || "{}");
      }
    } catch (parseError) {
      log(`Body parsing error: ${parseError.message}`);
      bodyData = {};
    }

    const { userId, token, newPassword } = bodyData;
    
    log(`Received body: ${JSON.stringify(bodyData)}`);

    // Validar parámetros requeridos
    if (!userId || !token || !newPassword) {
      log("Missing required parameters");
      log(`userId: ${userId}, token: ${token ? "present" : "missing"}, newPassword: ${newPassword ? "present" : "missing"}`);
      return res.json(
        {
          success: false,
          message: "Faltan parámetros requeridos: userId, token, newPassword",
        },
        400
      );
    }

    // Validar longitud de contraseña
    if (newPassword.length < 8) {
      log("Password too short");
      return res.json(
        {
          success: false,
          message: "La contraseña debe tener al menos 8 caracteres",
        },
        400
      );
    }

    log(`Processing password update for user: ${userId}`);

    // Leer variables de entorno
    const endpoint = process.env.APPWRITE_FUNCTION_ENDPOINT || "https://cloud.appwrite.io/v1";
    const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
    const apiKey = process.env.APPWRITE_FUNCTION_API_KEY;
    const databaseId = process.env.APPWRITE_DATABASE_ID;
    const resetTokensCollectionId = process.env.APPWRITE_RESET_TOKENS_COLLECTION_ID;

    // Validar configuración completa
    if (!projectId || !apiKey) {
      error("Missing Appwrite function configuration");
      log(`endpoint: ${endpoint}, projectId: ${projectId ? "present" : "missing"}, apiKey: ${apiKey ? "present" : "missing"}`);
      return res.json(
        {
          success: false,
          message: "Configuración de Appwrite incompleta. Asegúrate de tener habilitado 'Execute with Admin API Key'",
        },
        500
      );
    }

    if (!databaseId || !resetTokensCollectionId) {
      error("Missing database configuration");
      log(`databaseId: ${databaseId}, resetTokensCollectionId: ${resetTokensCollectionId}`);
      return res.json(
        {
          success: false,
          message: "Configuración de base de datos incompleta. Verifica APPWRITE_DATABASE_ID y APPWRITE_RESET_TOKENS_COLLECTION_ID",
        },
        500
      );
    }

    // Configurar cliente de Appwrite con API Key (admin)
    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);

    const databases = new Databases(client);
    const users = new Users(client);

    // Buscar el token en la base de datos
    log("Searching for token in database");
    const tokenDocs = await databases.listDocuments(
      databaseId,
      resetTokensCollectionId,
      [
        Query.equal("user_id", [userId]),
        Query.equal("token", [token]),
        Query.equal("used", [false]),
        Query.limit(1),
      ]
    );

    if (tokenDocs.documents.length === 0) {
      log("Token not found or already used");
      return res.json(
        {
          success: false,
          message: "Token inválido o ya usado",
        },
        401
      );
    }

    const tokenDoc = tokenDocs.documents[0];

    // Verificar expiración
    const expireAt = new Date(tokenDoc.expire_at);
    const now = new Date();

    if (expireAt < now) {
      log(`Token expired at ${expireAt.toISOString()}`);
      return res.json(
        {
          success: false,
          message: "El token ha expirado",
        },
        401
      );
    }

    log("Token is valid, updating password");

    // Actualizar la contraseña usando la API de Admin
    await users.updatePassword(userId, newPassword);

    log("Password updated successfully");

    // Marcar el token como usado
    await databases.updateDocument(
      databaseId,
      resetTokensCollectionId,
      tokenDoc.$id,
      { used: true }
    );

    log("Token marked as used");

    return res.json({
      success: true,
      message: "Contraseña actualizada exitosamente",
    });
  } catch (err) {
    error(`Error updating password: ${err.message}`);
    error(err.stack);

    return res.json(
      {
        success: false,
        message: "Error al actualizar la contraseña",
        error: err.message,
      },
      500
    );
  }
};
