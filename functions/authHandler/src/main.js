const sdk = require("node-appwrite");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

/**
 * Racoon LMS — authHandler
 *
 * Unified handler for:
 * 1. request_recovery: Generate token, save to DB, send email.
 * 2. update_password: Validate token, update password in Auth.
 * 3. create_user: Admin creates a new user (with password).
 *
 * Env Requirements:
 * - APPWRITE_FUNCTION_ENDPOINT
 * - APPWRITE_FUNCTION_PROJECT_ID
 * - APPWRITE_FUNCTION_API_KEY (Admin scopes: users.write, documents.write, documents.read)
 * - APPWRITE_DATABASE_ID
 * - APPWRITE_PASSWORD_RESET_TOKENS_COLLECTION_ID
 * - EMAIL_SMTP_HOST, EMAIL_SMTP_PORT, EMAIL_SMTP_USER, EMAIL_SMTP_PASS
 * - APP_BASE_URL
 */

// Helper to validate email format
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

module.exports = async ({ req, res, log, error }) => {
  const client = new sdk.Client();
  const users = new sdk.Users(client);
  const db = new sdk.Databases(client);

  // Config
  const endpoint =
    process.env.APPWRITE_FUNCTION_ENDPOINT || process.env.APPWRITE_ENDPOINT;
  const projectId =
    process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
  const apiKey =
    process.env.APPWRITE_FUNCTION_API_KEY || process.env.APPWRITE_API_KEY;

  if (!endpoint || !projectId || !apiKey) {
    error("Server misconfigured: Missing Appwrite env vars");
    return res.json({ success: false, message: "Server error" }, 500);
  }

  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

  const databaseId = process.env.APPWRITE_DATABASE_ID || "lms";
  const tokensCollectionId =
    process.env.APPWRITE_PASSWORD_RESET_TOKENS_COLLECTION_ID ||
    "password_reset_tokens";

  // Parse Body
  let body = {};
  try {
    const raw = req.body ?? req.payload ?? "{}";
    body = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (e) {
    return res.json({ success: false, message: "Invalid JSON" }, 400);
  }

  const { action } = body;

  // If triggered by event or explicit action
  // (Logic for users.*.create removed as it is handled by onUserCreated)

  // =========================================================================
  // ACTION: REQUEST RECOVERY
  // =========================================================================
  if (action === "request_recovery") {
    const { email } = body;
    if (!email || !isValidEmail(email)) {
      return res.json({ success: false, message: "Valid email required" }, 400);
    }

    try {
      // 1. Find user by email
      const list = await users.list([sdk.Query.equal("email", email)]);
      if (list.total === 0) {
        // Return success even if not found (security best practice)
        // or strictly follow requirements. We'll log it.
        log(`Request recovery for non-existent email: ${email}`);
        return res.json({ success: true, message: "If email exists, sent." });
      }

      const user = list.users[0];
      const userId = user.$id;

      // 2. Generate Token (64 hex chars)
      const token = crypto.randomBytes(32).toString("hex");
      // Expire in 1 hour
      const expireAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      // 3. Save to DB
      await db.createDocument(databaseId, tokensCollectionId, sdk.ID.unique(), {
        userId,
        token,
        email,
        expireAt,
        used: false,
      });

      // 4. Send Email
      const appUrl = process.env.APP_BASE_URL || "http://localhost:5173";
      const resetLink = `${appUrl}/reset-password?userId=${userId}&token=${token}`;

      // Validate SMTP config
      const smtpHost = process.env.EMAIL_SMTP_HOST;
      const smtpPort = process.env.EMAIL_SMTP_PORT;
      const smtpUser = process.env.EMAIL_SMTP_USER;
      const smtpPass = process.env.EMAIL_SMTP_PASS;
      const fromAddress = process.env.EMAIL_FROM_ADDRESS;

      if (!smtpHost || !smtpUser || !smtpPass || !fromAddress) {
        error(
          `SMTP not configured. Missing: ${!smtpHost ? "HOST " : ""}${!smtpUser ? "USER " : ""}${!smtpPass ? "PASS " : ""}${!fromAddress ? "FROM_ADDRESS" : ""}`,
        );
        // Still return success to not reveal if user exists, but log the config issue
        return res.json({
          success: true,
          message: "If email exists, recovery email will be sent.",
        });
      }

      log(
        `SMTP Config: host=${smtpHost}, port=${smtpPort}, user=${smtpUser}, from=${fromAddress}`,
      );

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort) || 587,
        secure: process.env.EMAIL_SMTP_SECURE === "true", // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const emailHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Restablecer Contraseña - Racoon LMS</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);">
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                🦝 Racoon LMS
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 500;">
                Sistema de Gestión de Aprendizaje
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1a202c; font-size: 24px; font-weight: 700;">
                Restablecer Contraseña
              </h2>
              
              <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Hola <strong style="color: #2d3748;">${user.name}</strong>,
              </p>
              
              <p style="margin: 0 0 24px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta en Racoon LMS. Si no realizaste esta solicitud, puedes ignorar este correo de forma segura.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="margin: 0 0 24px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                      Restablecer mi Contraseña
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative link -->
              <div style="background: #f7fafc; border-left: 4px solid #667eea; padding: 16px; border-radius: 8px; margin: 0 0 24px 0;">
                <p style="margin: 0 0 8px 0; color: #2d3748; font-size: 14px; font-weight: 600;">
                  ¿El botón no funciona?
                </p>
                <p style="margin: 0 0 8px 0; color: #4a5568; font-size: 14px; line-height: 1.5;">
                  Copia y pega este enlace en tu navegador:
                </p>
                <p style="margin: 0; word-break: break-all;">
                  <a href="${resetLink}" style="color: #667eea; font-size: 13px; text-decoration: none;">
                    ${resetLink}
                  </a>
                </p>
              </div>
              
              <!-- Security notice -->
              <div style="background: #fff5f5; border-left: 4px solid #fc8181; padding: 16px; border-radius: 8px; margin: 0 0 24px 0;">
                <p style="margin: 0; color: #742a2a; font-size: 14px; line-height: 1.5;">
                  <strong>⏱️ Importante:</strong> Este enlace expira en <strong>1 hora</strong> por seguridad.
                </p>
              </div>
              
              <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.6;">
                Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; color: #a0aec0; font-size: 13px;">
                © ${new Date().getFullYear()} Racoon LMS. Todos los derechos reservados.
              </p>
              <p style="margin: 0; color: #cbd5e0; font-size: 12px;">
                Si no solicitaste este cambio, tu cuenta está segura. Puedes ignorar este mensaje.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `;

      const mailResult = await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || "Racoon LMS"}" <${fromAddress}>`,
        to: email,
        subject: "Restablecer tu contraseña - Racoon LMS",
        html: emailHtml,
      });

      log(
        `Recovery email sent to ${email} (User: ${userId}). MessageId: ${mailResult.messageId}`,
      );
      return res.json({ success: true, message: "Recovery email sent" });
    } catch (err) {
      error(`Error in request_recovery: ${err.message}`);
      error(`Stack: ${err.stack}`);
      return res.json({ success: false, message: "Internal Error" }, 500);
    }
  }

  // =========================================================================
  // ACTION: UPDATE PASSWORD
  // =========================================================================
  if (action === "update_password") {
    const { userId, token, newPassword } = body;

    if (!userId || !token || !newPassword) {
      return res.json(
        { success: false, message: "Missing required fields" },
        400,
      );
    }

    if (newPassword.length < 8) {
      return res.json(
        { success: false, message: "Password too short (min 8)" },
        400,
      );
    }

    try {
      // 1. Verify Token in DB
      const queries = [
        sdk.Query.equal("userId", userId),
        sdk.Query.equal("token", token),
        sdk.Query.equal("used", false),
        sdk.Query.limit(1), // Optimization
      ];

      const result = await db.listDocuments(
        databaseId,
        tokensCollectionId,
        queries,
      );

      if (result.total === 0) {
        return res.json(
          { success: false, message: "Invalid or used token" },
          400,
        );
      }

      const tokenDoc = result.documents[0];

      // 2. Check Expiry
      if (new Date(tokenDoc.expireAt) < new Date()) {
        return res.json({ success: false, message: "Token expired" }, 400);
      }

      // 3. Update Password in Auth
      await users.updatePassword(userId, newPassword);

      // 4. Mark token used
      await db.updateDocument(databaseId, tokensCollectionId, tokenDoc.$id, {
        used: true,
      });

      log(`Password updated for user ${userId}`);
      return res.json({ success: true, message: "Password updated" });
    } catch (err) {
      error(`Error in update_password: ${err.message}`);
      return res.json({ success: false, message: "Internal Error" }, 500);
    }
  }
  // =========================================================================
  // ACTION: CREATE USER
  // =========================================================================
  if (action === "create_user") {
    const { email, password, name, phone, sendWelcomeEmail = true } = body;

    if (!email || !password || !name) {
      return res.json(
        { success: false, message: "Missing email, password or name" },
        400,
      );
    }

    try {
      // Create user in Appwrite Auth
      const user = await users.create(
        sdk.ID.unique(),
        email,
        phone || undefined,
        password,
        name,
      );

      log(`User created via function: ${user.$id} (${email})`);

      // Send welcome email if enabled
      // DISABLED: Now using Email Verification via onUserCreated
      if (false && sendWelcomeEmail) {
        try {
          const appUrl = process.env.APP_BASE_URL || "http://localhost:5173";
          const loginLink = `${appUrl}/login`;

          const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_SMTP_HOST,
            port: process.env.EMAIL_SMTP_PORT,
            secure: process.env.EMAIL_SMTP_SECURE === "true",
            auth: {
              user: process.env.EMAIL_SMTP_USER,
              pass: process.env.EMAIL_SMTP_PASS,
            },
          });

          const welcomeHtml = `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bienvenido a Racoon LMS</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);">
              <!-- Header with gradient -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                    🦝 Racoon LMS
                  </h1>
                  <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 500;">
                    Sistema de Gestión de Aprendizaje
                  </p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin: 0 0 20px 0; color: #1a202c; font-size: 24px; font-weight: 700;">
                    ¡Bienvenido a Racoon LMS!
                  </h2>
                  
                  <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                    Hola <strong style="color: #2d3748;">${name}</strong>,
                  </p>
                  
                  <p style="margin: 0 0 24px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                    Tu cuenta ha sido creada exitosamente. Ya puedes acceder a la plataforma y comenzar a aprender.
                  </p>
                  
                  <!-- Account Info Box -->
                  <div style="background: #f7fafc; border-left: 4px solid #667eea; padding: 16px; border-radius: 8px; margin: 0 0 24px 0;">
                    <p style="margin: 0 0 8px 0; color: #2d3748; font-size: 14px; font-weight: 600;">
                      Tus credenciales de acceso:
                    </p>
                    <p style="margin: 0 0 4px 0; color: #4a5568; font-size: 14px;">
                      <strong>Email:</strong> ${email}
                    </p>
                    <p style="margin: 0; color: #4a5568; font-size: 14px;">
                      <strong>Contraseña:</strong> La proporcionada por tu administrador
                    </p>
                  </div>
                  
                  <!-- CTA Button -->
                  <table role="presentation" style="margin: 0 0 24px 0;">
                    <tr>
                      <td style="text-align: center;">
                        <a href="${loginLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                          Iniciar Sesión
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Security notice -->
                  <div style="background: #fff5f5; border-left: 4px solid #fc8181; padding: 16px; border-radius: 8px; margin: 0 0 24px 0;">
                    <p style="margin: 0; color: #742a2a; font-size: 14px; line-height: 1.5;">
                      <strong>⚠️ Recomendación:</strong> Te sugerimos cambiar tu contraseña después del primer inicio de sesión.
                    </p>
                  </div>
                  
                  <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.6;">
                    Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 8px 0; color: #a0aec0; font-size: 13px;">
                    © ${new Date().getFullYear()} Racoon LMS. Todos los derechos reservados.
                  </p>
                </td>
              </tr>
            </table>
          </body>
          </html>
          `;

          await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || "Racoon LMS"}" <${process.env.EMAIL_FROM_ADDRESS}>`,
            to: email,
            subject: "¡Bienvenido a Racoon LMS!",
            html: welcomeHtml,
          });

          log(`Welcome email sent to ${email}`);
        } catch (emailErr) {
          // Don't fail user creation if email fails
          error(`Failed to send welcome email: ${emailErr.message}`);
        }
      }

      return res.json({ success: true, userId: user.$id, user });
    } catch (err) {
      error(`Error in create_user: ${err.message}`);
      return res.json(
        { success: false, message: err.message, code: err.code || 500 },
        500,
      );
    }
  }

  // =========================================================================
  // ACTION: SEND WELCOME EMAIL (Standalone)
  // =========================================================================
  if (action === "send_welcome") {
    const { email, name } = body;

    if (!email || !name) {
      return res.json(
        { success: false, message: "Missing email or name" },
        400,
      );
    }

    return await sendWelcomeEmail({ email, name, log, error, res });
  }

  // Unknown Action
  return res.json(
    { success: false, message: `Unknown action: ${action}` },
    400,
  );
};

// =========================================================================
// HELPER: SEND WELCOME EMAIL
// =========================================================================
async function sendWelcomeEmail({ email, name, log, error, res }) {
  try {
    const appUrl = process.env.APP_BASE_URL || "http://localhost:5173";
    const loginLink = `${appUrl}/login`;

    // Validate config presence
    if (!process.env.EMAIL_SMTP_HOST || !process.env.EMAIL_SMTP_USER) {
      log("SMTP Config missing, skipping email.");
      return res ? res.json({ success: false, message: "SMTP missing" }) : null;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST,
      port: process.env.EMAIL_SMTP_PORT,
      secure: process.env.EMAIL_SMTP_SECURE === "true",
      auth: {
        user: process.env.EMAIL_SMTP_USER,
        pass: process.env.EMAIL_SMTP_PASS,
      },
    });

    const welcomeHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenido a Racoon LMS</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">🦝 Racoon LMS</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1a202c; font-size: 24px;">¡Bienvenido!</h2>
              <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 16px;">
                Hola <strong>${name}</strong>, tu cuenta está lista para usar.
              </p>
              <table role="presentation" style="margin: 24px 0;">
                <tr>
                  <td>
                    <a href="${loginLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600;">
                      Iniciar Sesión
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; color: #718096; font-size: 14px;">
                  Si tienes alguna pregunta, estamos aquí para ayudarte.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "Racoon LMS"}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: email,
      subject: "¡Bienvenido a Racoon LMS!",
      html: welcomeHtml,
    });

    log(`Welcome email sent to ${email}`);
    if (res) return res.json({ success: true, message: "Welcome email sent" });
  } catch (err) {
    error(`Error in sendWelcomeEmail: ${err.message}`);
    if (res)
      return res.json({ success: false, message: "Failed to send email" }, 500);
  }
}
