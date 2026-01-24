const sdk = require("node-appwrite");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

/*
  Función Manual: Envío de Email de Restablecimiento de Contraseña
  
  Esta función envía un email bonito y personalizado cuando un admin
  solicita restablecer la contraseña de un usuario.
  
  IMPORTANTE: Usa una colección temporal "password_reset_tokens" para almacenar
  tokens de recuperación seguros que expiran en 1 hora.
  
  Requisitos de Environment Variables:
  - APPWRITE_FUNCTION_API_KEY: API Key con permisos de Users y Database
  - APPWRITE_FUNCTION_PROJECT_ID: ID del proyecto
  - APPWRITE_FUNCTION_ENDPOINT: URL del servidor Appwrite
  - EMAIL_USER: Correo Gmail desde donde se envían los emails
  - EMAIL_PASSWORD: App Password de Gmail (16 caracteres)
  - APPWRITE_DATABASE_ID: ID de la base de datos
  - APPWRITE_RESET_TOKENS_COLLECTION_ID: ID de la colección password_reset_tokens
  - APP_URL: URL de la aplicación frontend
  
  Payload esperado:
  {
    "email": "usuario@ejemplo.com",
    "adminName": "Admin Name" (opcional)
  }
*/

module.exports = async ({ req, res, log, error }) => {
  const client = new sdk.Client();
  const users = new sdk.Users(client);
  const databases = new sdk.Databases(client);

  // Configuración desde variables de entorno
  const endpoint =
    process.env.APPWRITE_FUNCTION_ENDPOINT ||
    process.env.APPWRITE_ENDPOINT ||
    "https://cloud.appwrite.io/v1";
  const projectId =
    process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
  const apiKey =
    process.env.APPWRITE_FUNCTION_API_KEY || process.env.APPWRITE_API_KEY;

  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const resetTokensCollectionId =
    process.env.APPWRITE_RESET_TOKENS_COLLECTION_ID;

  // Validar configuración
  if (!apiKey || !projectId) {
    error("Missing configuration: API_KEY or PROJECT_ID");
    return res.json({ success: false, error: "Configuration missing" }, 500);
  }

  if (!emailUser || !emailPassword) {
    error("Missing email configuration: EMAIL_USER or EMAIL_PASSWORD");
    return res.json(
      { success: false, error: "Email configuration missing" },
      500
    );
  }

  if (!databaseId || !resetTokensCollectionId) {
    error("Missing database configuration for reset tokens");
    return res.json(
      { success: false, error: "Database configuration missing" },
      500
    );
  }

  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

  try {
    // Parse request body
    let payload;
    try {
      payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch (e) {
      payload = req.body;
    }

    const { email, adminName } = payload;

    if (!email) {
      error("Email is required");
      return res.json({ success: false, error: "Email is required" }, 400);
    }

    log(`Processing password reset request for: ${email}`);

    // 1. Buscar usuario por email
    let targetUser;
    try {
      const usersList = await users.list([sdk.Query.equal("email", [email])]);

      if (!usersList.users || usersList.users.length === 0) {
        error(`User not found: ${email}`);
        return res.json({ success: false, error: "User not found" }, 404);
      }

      targetUser = usersList.users[0];
      log(`Found user: ${targetUser.$id}`);
    } catch (e) {
      error(`Error finding user: ${e.message}`);
      return res.json({ success: false, error: "Error finding user" }, 500);
    }

    // 2. Generar token de recuperación seguro
    let resetToken;
    let resetUrl;
    try {
      // Generar URL de reset - apuntará a nuestra página personalizada
      const baseUrl = process.env.APP_URL || "https://ore.site.racoondevs.com";

      // Generar token aleatorio seguro (32 bytes = 64 caracteres hex)
      resetToken = crypto.randomBytes(32).toString("hex");

      // Calcular expiración (1 hora desde ahora)
      const expireAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      // Guardar token en la base de datos
      try {
        await databases.createDocument(
          databaseId,
          resetTokensCollectionId,
          sdk.ID.unique(),
          {
            user_id: targetUser.$id,
            token: resetToken,
            email: targetUser.email,
            expire_at: expireAt.toISOString(),
            used: false,
          }
        );
        log(`Token saved to database for user: ${targetUser.$id}`);
      } catch (dbError) {
        error(`Error saving token to database: ${dbError.message}`);
        throw new Error("Could not save reset token");
      }

      // Construir URL completa con userId y token
      resetUrl = `${baseUrl}/reset-password?userId=${targetUser.$id}&secret=${resetToken}`;

      log(`Generated reset URL: ${resetUrl}`);
      log(`Token expires at: ${expireAt.toISOString()}`);
    } catch (e) {
      error(`Error creating token: ${e.message}`);
      error(`Stack: ${e.stack}`);

      return res.json(
        {
          success: false,
          error: `No se pudo generar el token de recuperación.`,
          details: {
            error: e.message,
            userId: targetUser.$id,
          },
          hint: "Verifica que la base de datos y colección de tokens estén configuradas correctamente.",
        },
        500
      );
    }

    // 3. Configurar transporter de nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    // 4. Crear HTML del email (bonito y profesional)
    const emailHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecimiento de Contraseña</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden;">
          
          <!-- Header con gradiente -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                🔐 Restablecimiento de Contraseña
              </h1>
            </td>
          </tr>
          
          <!-- Contenido -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hola <strong>${targetUser.name || email}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: #666666; font-size: 15px; line-height: 1.6;">
                ${
                  adminName
                    ? `El administrador <strong>${adminName}</strong> ha`
                    : "Se ha"
                } solicitado restablecer tu contraseña en el Sistema de Control de Vales Mineros.
              </p>
              
              <p style="margin: 0 0 30px; color: #666666; font-size: 15px; line-height: 1.6;">
                Para crear una nueva contraseña, haz clic en el botón de abajo:
              </p>
              
              <!-- Botón CTA -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 10px 0 30px;">
                    <a href="${resetUrl}" 
                       style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4);">
                      Restablecer Contraseña
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- URL alternativa -->
              <p style="margin: 0 0 20px; color: #999999; font-size: 13px; line-height: 1.6;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="margin: 0 0 30px; color: #667eea; font-size: 13px; word-break: break-all; background-color: #f8f9fa; padding: 12px; border-radius: 4px; border-left: 3px solid #667eea;">
                ${resetUrl}
              </p>
              
              <!-- Información de seguridad -->
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px; color: #856404; font-size: 14px; font-weight: 600;">
                  ⚠️ Importante:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #856404; font-size: 13px;">
                  <li style="margin-bottom: 6px;">Este enlace expirará en <strong>1 hora</strong></li>
                  <li style="margin-bottom: 6px;">Si no solicitaste este cambio, ignora este correo</li>
                  <li>Tu contraseña actual seguirá siendo válida hasta que la cambies</li>
                </ul>
              </div>
              
              <p style="margin: 20px 0 0; color: #999999; font-size: 13px; line-height: 1.6;">
                Si tienes problemas o preguntas, contacta con el administrador del sistema.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px; font-weight: 600;">
                Sistema de Control de Vales Mineros
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} RacoonDevs. Todos los derechos reservados.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // 5. Enviar el email
    const mailOptions = {
      from: `"Sistema de Vales" <${emailUser}>`,
      to: email,
      subject: "🔐 Restablecimiento de Contraseña - Sistema de Vales",
      html: emailHTML,
      text: `
Hola ${targetUser.name || email},

${
  adminName ? `El administrador ${adminName} ha` : "Se ha"
} solicitado restablecer tu contraseña.

Para crear una nueva contraseña, visita el siguiente enlace:
${resetUrl}

Este enlace expirará en 1 hora.

Si no solicitaste este cambio, ignora este correo.

---
Sistema de Control de Vales Mineros
© ${new Date().getFullYear()} RacoonDevs
      `,
    };

    await transporter.sendMail(mailOptions);
    log(`Email sent successfully to: ${email}`);

    return res.json({
      success: true,
      message: `Email de restablecimiento enviado a ${email}`,
      resetUrl: resetUrl, // Solo para debugging, no exponer en producción
    });
  } catch (e) {
    error(`Unexpected error: ${e.message}`);
    error(e.stack);
    return res.json(
      {
        success: false,
        error: e.message,
      },
      500
    );
  }
};
