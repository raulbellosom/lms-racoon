import nodemailer from "nodemailer";

/**
 * Ensures an environment variable is present.
 */
export function must(key) {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return val;
}

/**
 * Safely parses the request body.
 */
export function safeBodyJson(req) {
  try {
    const raw = req.body ?? req.payload ?? "{}";
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return {};
  }
}

/**
 * Returns a JSON response.
 */
export function json(res, code, body) {
  return res.json(body, code);
}

/**
 * Sends an email using Nodemailer.
 */
export async function sendEmailWithNodemailer(to, subject, html) {
  // Configuración SMTP estándar
  const host = process.env.EMAIL_SMTP_HOST;
  const port = parseInt(process.env.EMAIL_SMTP_PORT || "587", 10);
  const secure = (process.env.EMAIL_SMTP_SECURE || "false") === "true";
  const user = process.env.EMAIL_SMTP_USER;
  const pass = process.env.EMAIL_SMTP_PASS;
  const fromName = process.env.EMAIL_FROM_NAME || "Racoon LMS";
  const fromAddress = process.env.EMAIL_FROM_ADDRESS;

  if (!host || !user || !pass || !fromAddress) {
    throw new Error(
      "SMTP configuration is missing (HOST, USER, PASS, or FROM_ADDRESS)",
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(port || "587"),
    secure,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to,
    subject,
    html,
  });
}

/**
 * Generates the HTML for the verification email.
 */
export function getVerificationEmailHtml(token, frontendUrl) {
  // Ensure frontendUrl doesn't have a trailing slash
  const baseUrl = frontendUrl.replace(/\/$/, "");
  // Link to the verification page
  const link = `${baseUrl}/verify-email?token=${token}`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifica tu Email - Racoon LMS</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 40px 20px;">
  <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);">
    <tr>
      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
        <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">🦝 Racoon LMS</h1>
        <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 500;">
          Verificación de Cuenta
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="margin: 0 0 20px 0; color: #1a202c; font-size: 24px; font-weight: 700;">
          Confirma tu correo electrónico
        </h2>
        
        <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
          Gracias por registrarte en Racoon LMS. Para completar tu registro y asegurar tu cuenta, por favor verifica tu dirección de correo electrónico.
        </p>
        
        <table role="presentation" style="margin: 0 0 24px 0;">
          <tr>
            <td style="text-align: center;">
              <a href="${link}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                Verificar Email
              </a>
            </td>
          </tr>
        </table>
        
        <div style="background: #f7fafc; border-left: 4px solid #667eea; padding: 16px; border-radius: 8px; margin: 0 0 24px 0;">
          <p style="margin: 0 0 8px 0; color: #2d3748; font-size: 14px; font-weight: 600;">
            ¿El botón no funciona?
          </p>
          <p style="margin: 0; word-break: break-all;">
            <a href="${link}" style="color: #667eea; font-size: 13px; text-decoration: none;">
              ${link}
            </a>
          </p>
        </div>
        
        <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.6;">
          Este enlace expirará en 2 horas. Si no creaste esta cuenta, puedes ignorar este correo.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #cbd5e0; font-size: 12px;">
          © ${new Date().getFullYear()} Racoon LMS. Todos los derechos reservados.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
