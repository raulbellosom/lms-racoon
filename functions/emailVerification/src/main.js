import { ID } from "node-appwrite";
import {
  must,
  safeBodyJson,
  json,
  getVerificationEmailHtml,
  sendEmailWithNodemailer,
} from "./_shared.js";

/**
 * ======================================================
 * Agenda Pro - Appwrite Function (Email Verifications)
 *
 * Objetivo de esta versión:
 * - Tener logs MUY detallados (para debug en server)
 * - NO depender del SDK (node-appwrite) para llamadas HTTP,
 *   porque muchos errores se resumen a "fetch failed".
 * - Usar Appwrite REST directamente con fetch, y registrar:
 *   - URL final
 *   - status
 *   - body (recortado)
 *   - tiempos
 *   - Node version + disponibilidad de fetch
 *
 * Nota:
 * - Esta Function requiere APPWRITE_API_KEY con permisos de DB.
 * - Usa el endpoint interno: http://appwrite/v1
 * ======================================================
 */

const DEBUG = (process.env.DEBUG || "true").toLowerCase() === "true";
const LOG_BODY_MAX = parseInt(process.env.LOG_BODY_MAX || "1200", 10);
const HTTP_TIMEOUT_MS = parseInt(process.env.HTTP_TIMEOUT_MS || "12000", 10);

function nowMs() {
  return Date.now();
}

function cut(str, max = LOG_BODY_MAX) {
  if (typeof str !== "string") return String(str);
  if (str.length <= max) return str;
  return str.slice(0, max) + `... [cut ${str.length - max} chars]`;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function redact(val) {
  if (!val) return "";
  const s = String(val);
  if (s.length <= 6) return "***";
  return s.slice(0, 3) + "***" + s.slice(-3);
}

function logRuntimeInfo(log) {
  log(
    `Runtime: node=${process.version}, platform=${process.platform}, arch=${process.arch}`,
  );
  log(`Runtime: fetch=${typeof globalThis.fetch}`);
}

function assertFetchAvailable() {
  if (typeof globalThis.fetch !== "function") {
    throw new Error(
      "globalThis.fetch is not available. Use Node 18+ runtime (Node 18/20) in Appwrite Functions.",
    );
  }
}

function buildAppwriteUrl(endpoint, path, queryParams = []) {
  const base = endpoint.replace(/\/+$/, "");
  const url = new URL(base + path);
  for (const [k, v] of queryParams) {
    url.searchParams.append(k, v);
  }
  return url.toString();
}

function makeQueries(params = []) {
  // Appwrite espera: queries[]=<JSON string>
  // Ejemplos:
  // {"method":"equal","attribute":"email","values":["x@x.com"]}
  // {"method":"limit","values":[1]}
  return params.map((q) => ["queries[]", JSON.stringify(q)]);
}

async function appwriteFetch({
  log,
  method,
  url,
  headers,
  body,
  timeoutMs = HTTP_TIMEOUT_MS,
}) {
  assertFetchAvailable();
  const t0 = nowMs();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (DEBUG) log(`HTTP ${method} ${url}`);

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await res.text();
    const ms = nowMs() - t0;
    const parsed = safeJsonParse(text);

    log(`HTTP done: status=${res.status} timeMs=${ms}`);
    if (DEBUG) {
      log(`HTTP body: ${cut(text)}`);
    }

    return {
      ok: res.ok,
      status: res.status,
      text,
      json: parsed,
    };
  } catch (e) {
    const ms = nowMs() - t0;
    log(`HTTP error after ${ms}ms: ${e?.message || e}`);
    if (DEBUG) log(`HTTP error stack: ${cut(e?.stack || "no stack", 2000)}`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function appwriteHealthCheck({ log, endpoint, projectId }) {
  const url = buildAppwriteUrl(endpoint, "/health");
  const r = await appwriteFetch({
    log,
    method: "GET",
    url,
    headers: {
      "X-Appwrite-Project": projectId,
    },
  });
  // 401 aquí es normal si no hay scopes en guests
  return r;
}

function makeHeaders(projectId, apiKey) {
  return {
    "X-Appwrite-Project": projectId,
    "X-Appwrite-Key": apiKey,
    "Content-Type": "application/json",
  };
}

async function listDocuments({
  log,
  endpoint,
  projectId,
  apiKey,
  dbId,
  collId,
  queries,
}) {
  const url = buildAppwriteUrl(
    endpoint,
    `/databases/${dbId}/collections/${collId}/documents`,
    makeQueries(queries),
  );
  const r = await appwriteFetch({
    log,
    method: "GET",
    url,
    headers: makeHeaders(projectId, apiKey),
  });
  if (!r.ok) {
    throw new Error(
      `Appwrite listDocuments failed: status=${r.status} body=${cut(r.text)}`,
    );
  }
  return r.json;
}

async function createDocument({
  log,
  endpoint,
  projectId,
  apiKey,
  dbId,
  collId,
  data,
}) {
  const url = buildAppwriteUrl(
    endpoint,
    `/databases/${dbId}/collections/${collId}/documents`,
  );
  const r = await appwriteFetch({
    log,
    method: "POST",
    url,
    headers: makeHeaders(projectId, apiKey),
    body: {
      documentId: "unique()",
      data,
    },
  });
  if (!r.ok) {
    throw new Error(
      `Appwrite createDocument failed: status=${r.status} body=${cut(r.text)}`,
    );
  }
  return r.json;
}

async function updateDocument({
  log,
  endpoint,
  projectId,
  apiKey,
  dbId,
  collId,
  docId,
  data,
}) {
  const url = buildAppwriteUrl(
    endpoint,
    `/databases/${dbId}/collections/${collId}/documents/${docId}`,
  );
  const r = await appwriteFetch({
    log,
    method: "PATCH",
    url,
    headers: makeHeaders(projectId, apiKey),
    body: { data },
  });
  if (!r.ok) {
    throw new Error(
      `Appwrite updateDocument failed: status=${r.status} body=${cut(r.text)}`,
    );
  }
  return r.json;
}

/**
 * Obtiene el endpoint correcto para Appwrite Functions
 */
function getAppwriteEndpoint(log) {
  // 1) Si lo defines manualmente, úsalo tal cual
  const internalEndpoint = process.env.APPWRITE_ENDPOINT_INTERNAL;
  if (internalEndpoint) {
    log(`Using configured internal endpoint: ${internalEndpoint}`);
    return internalEndpoint.replace(/\/+$/, "").replace(/\/v1$/, "") + "/v1";
  }

  // 2) Lo que te dé Appwrite runtime / tu env
  let endpoint =
    process.env.APPWRITE_FUNCTION_API_ENDPOINT || process.env.APPWRITE_ENDPOINT;

  if (!endpoint) throw new Error("No Appwrite endpoint configured");

  log(`Original endpoint: ${endpoint}`);

  // 3) Normaliza
  // Si viene https -> cámbialo a http (en runtime interno normalmente es http)
  // 3) Normaliza
  // Si viene localhost/127.0.0.1 -> eso NO sirve dentro del contenedor runtime (si Appwrite corre en Docker local)
  // Cambiamos a host interno por Docker. (default: appwrite)
  if (endpoint.includes("://localhost") || endpoint.includes("://127.0.0.1")) {
    endpoint = endpoint.replace("localhost", "appwrite");
    endpoint = endpoint.replace("127.0.0.1", "appwrite");
    // Y aseguramos http interno
    if (endpoint.startsWith("https://")) {
      endpoint = endpoint.replace("https://", "http://");
    }
  }

  // Asegura /v1
  endpoint = endpoint.replace(/\/+$/, "");
  if (!endpoint.endsWith("/v1")) endpoint += "/v1";

  log(`Final endpoint: ${endpoint}`);
  return endpoint;
}

/**
 * FUNCIÓN UNIFICADA DE VERIFICACIÓN DE EMAIL
 *
 * Maneja 3 acciones según el parámetro "action":
 *
 * 1. "send" - Enviar email de verificación
 *    Body: { userAuthId, email }
 *
 * 2. "verify" - Verificar token del email
 *    Body: { token }
 *
 * 3. "resend" - Reenviar email de verificación
 *    Body: { email }
 *
 * También acepta la acción por query string: ?action=send
 */
export default async ({ req, res, log, error }) => {
  const endpoint = getAppwriteEndpoint(log);
  const projectId =
    process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;

  if (!projectId) {
    return json(res, 500, {
      ok: false,
      error: "Missing APPWRITE_FUNCTION_PROJECT_ID or APPWRITE_PROJECT_ID",
    });
  }

  logRuntimeInfo(log);
  log(`Connecting to Appwrite: endpoint=${endpoint}, project=${projectId}`);

  const API_KEY = must("APPWRITE_API_KEY");
  if (DEBUG) {
    log(`Config: apiKey=${redact(API_KEY)}`);
    log(
      `Config: db=${process.env.APPWRITE_DATABASE_ID}, profiles=${process.env.APPWRITE_PROFILES_COLLECTION_ID}, verifications=${process.env.APPWRITE_EMAIL_VERIFICATIONS_COLLECTION_ID}`,
    );
  }

  const DB_ID = must("APPWRITE_DATABASE_ID");
  const PROFILES_COLL_ID = must("APPWRITE_PROFILES_COLLECTION_ID");
  const VERIFICATIONS_COLL_ID = must(
    "APPWRITE_EMAIL_VERIFICATIONS_COLLECTION_ID",
  );
  const APP_BASE_URL = must("APP_BASE_URL");

  try {
    const body = safeBodyJson(req);

    // Obtener action del body o query string
    const action =
      body.action ||
      new URL(req.url, "http://localhost").searchParams.get("action") ||
      "send";

    log(`Email verification action: ${action}`);

    // ---- Debug obligatorio: prueba conectividad real a Appwrite API ----
    // Si aquí truena con "fetch failed", el problema NO es el correo.
    // Es red/runtime/fetch dentro del contenedor de la Function.
    await appwriteHealthCheck({ log, endpoint, projectId });

    // ============================================
    // ACCIÓN 1: ENVIAR EMAIL DE VERIFICACIÓN
    // ============================================
    if (action === "send") {
      const { userAuthId, email } = body;

      if (!userAuthId || !email) {
        return json(res, 400, {
          ok: false,
          error: "Missing required fields: userAuthId, email",
        });
      }

      // Verificar que el usuario existe (Buscar por ID, ya que docId = userId)
      const profileDocs = await listDocuments({
        log,
        endpoint,
        projectId,
        apiKey: API_KEY,
        dbId: DB_ID,
        collId: PROFILES_COLL_ID,
        queries: [
          { method: "equal", attribute: "$id", values: [userAuthId] },
          { method: "limit", values: [1] },
        ],
      });

      if (!profileDocs?.documents?.length) {
        return json(res, 404, {
          ok: false,
          error: "User profile not found",
        });
      }

      const profile = profileDocs.documents[0];

      // Si ya está verificado, no hacer nada
      if (profile.emailVerified) {
        return json(res, 200, {
          ok: true,
          message: "Email already verified",
        });
      }

      // Generar token único
      const token = ID.unique();
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 horas

      // Guardar en la colección email_verifications
      await createDocument({
        log,
        endpoint,
        projectId,
        apiKey: API_KEY,
        dbId: DB_ID,
        collId: VERIFICATIONS_COLL_ID,
        data: {
          userAuthId,
          email,
          token,
          expiresAt,
          verified: false,
        },
      });

      // Generar HTML del email
      const emailHtml = getVerificationEmailHtml(token, APP_BASE_URL);

      // Enviar email con Nodemailer
      log(`Attempting to send email to: ${email}`);
      log(
        `SMTP Configuration: host=${process.env.EMAIL_SMTP_HOST}, port=${process.env.EMAIL_SMTP_PORT}, secure=${process.env.EMAIL_SMTP_SECURE}`,
      );

      try {
        await sendEmailWithNodemailer(
          email,
          "Verifica tu email - Racoon LMS",
          emailHtml,
        );
        log(`Verification email sent successfully to ${email}`);
      } catch (emailError) {
        error(`Email sending failed: ${emailError.message}`);
        throw emailError;
      }

      log(`Verification email sent to ${email}`);

      return json(res, 200, {
        ok: true,
        message: "Verification email sent successfully",
      });
    }

    // ============================================
    // ACCIÓN 2: VERIFICAR TOKEN
    // ============================================
    if (action === "verify") {
      const { token } = body;

      if (!token) {
        return json(res, 400, {
          ok: false,
          error: "Missing required field: token",
        });
      }

      // Buscar el token en la BD
      const tokenDocs = await listDocuments({
        log,
        endpoint,
        projectId,
        apiKey: API_KEY,
        dbId: DB_ID,
        collId: VERIFICATIONS_COLL_ID,
        queries: [
          { method: "equal", attribute: "token", values: [token] },
          { method: "equal", attribute: "verified", values: [false] },
          { method: "limit", values: [1] },
        ],
      });

      if (!tokenDocs?.documents?.length) {
        return json(res, 400, {
          ok: false,
          error: "Invalid or already used token",
        });
      }

      const tokenDoc = tokenDocs.documents[0];

      // Verificar que no haya expirado
      if (new Date(tokenDoc.expiresAt) < new Date()) {
        return json(res, 400, {
          ok: false,
          error: "Token has expired",
          expired: true,
        });
      }

      // Marcar el token como verificado
      await updateDocument({
        log,
        endpoint,
        projectId,
        apiKey: API_KEY,
        dbId: DB_ID,
        collId: VERIFICATIONS_COLL_ID,
        docId: tokenDoc.$id,
        data: { verified: true },
      });

      // Actualizar el perfil del usuario (Buscar por ID)
      const profileDocs2 = await listDocuments({
        log,
        endpoint,
        projectId,
        apiKey: API_KEY,
        dbId: DB_ID,
        collId: PROFILES_COLL_ID,
        queries: [
          {
            method: "equal",
            attribute: "$id",
            values: [tokenDoc.userAuthId],
          },
          { method: "limit", values: [1] },
        ],
      });

      if (profileDocs2?.documents?.length) {
        await updateDocument({
          log,
          endpoint,
          projectId,
          apiKey: API_KEY,
          dbId: DB_ID,
          collId: PROFILES_COLL_ID,
          docId: profileDocs2.documents[0].$id,
          data: { emailVerified: true },
        });
      }

      log(`Email verified for user ${tokenDoc.userAuthId}`);

      return json(res, 200, {
        ok: true,
        message: "Email verified successfully",
      });
    }

    // ============================================
    // ACCIÓN 3: REENVIAR EMAIL
    // ============================================
    if (action === "resend") {
      const { email } = body;

      if (!email) {
        return json(res, 400, {
          ok: false,
          error: "Missing required field: email",
        });
      }

      // Buscar el perfil del usuario
      const profileDocs = await listDocuments({
        log,
        endpoint,
        projectId,
        apiKey: API_KEY,
        dbId: DB_ID,
        collId: PROFILES_COLL_ID,
        queries: [
          { method: "equal", attribute: "email", values: [email] },
          { method: "limit", values: [1] },
        ],
      });

      if (!profileDocs?.documents?.length) {
        // Por seguridad, no revelar que el email no existe
        return json(res, 200, {
          ok: true,
          message: "If the email exists, a verification email has been sent",
        });
      }

      const profile = profileDocs.documents[0];
      // FIX: userAuthId puede no estar en el doc, usamos $id que es igual al userAuthId
      const userAuthId = profile.userAuthId || profile.$id;

      // Si ya está verificado, no hacer nada
      if (profile.emailVerified) {
        return json(res, 200, {
          ok: true,
          message: "Email already verified",
        });
      }

      // Invalidar tokens anteriores (marcar como verificados para que no se usen)
      const oldTokens = await listDocuments({
        log,
        endpoint,
        projectId,
        apiKey: API_KEY,
        dbId: DB_ID,
        collId: VERIFICATIONS_COLL_ID,
        queries: [
          {
            method: "equal",
            attribute: "userAuthId",
            values: [userAuthId],
          },
          { method: "equal", attribute: "verified", values: [false] },
        ],
      });

      for (const oldToken of oldTokens?.documents || []) {
        await updateDocument({
          log,
          endpoint,
          projectId,
          apiKey: API_KEY,
          dbId: DB_ID,
          collId: VERIFICATIONS_COLL_ID,
          docId: oldToken.$id,
          data: { verified: true },
        });
      }

      // Generar nuevo token
      const token = ID.unique();
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

      await createDocument({
        log,
        endpoint,
        projectId,
        apiKey: API_KEY,
        dbId: DB_ID,
        collId: VERIFICATIONS_COLL_ID,
        data: {
          userAuthId: userAuthId,
          email,
          token,
          expiresAt,
          verified: false,
        },
      });

      // Generar y enviar email
      const emailHtml = getVerificationEmailHtml(token, APP_BASE_URL);

      log(`Attempting to resend email to: ${email}`);
      log(
        `SMTP Configuration: host=${process.env.EMAIL_SMTP_HOST}, port=${process.env.EMAIL_SMTP_PORT}, secure=${process.env.EMAIL_SMTP_SECURE}`,
      );

      try {
        await sendEmailWithNodemailer(
          email,
          "Verifica tu email - Racoon LMS",
          emailHtml,
        );
        log(`Verification email resent successfully to ${email}`);
      } catch (emailError) {
        error(`Email sending failed: ${emailError.message}`);
        throw emailError;
      }

      log(`Verification email resent to ${email}`);

      return json(res, 200, {
        ok: true,
        message: "Verification email sent successfully",
      });
    }

    // Acción no válida
    return json(res, 400, {
      ok: false,
      error: `Invalid action: ${action}. Use 'send', 'verify', or 'resend'`,
    });
  } catch (err) {
    const msg = err?.message || String(err);
    error(`Function error: ${msg}`);
    if (DEBUG) error(`Stack: ${cut(err?.stack || "no stack", 2000)}`);

    // Pistas extra para el error típico
    let hint = undefined;
    if (msg.toLowerCase().includes("fetch failed")) {
      hint = {
        why: "El runtime no pudo completar la petición HTTP. Puede ser DNS, red, timeout o fetch no disponible.",
        check: [
          "1) Asegura runtime Node 18/20 en Appwrite Console",
          "2) APPWRITE_ENDPOINT_INTERNAL debe ser http://appwrite/v1",
          "3) Verifica que el contenedor runtime esté en la network 'appwrite' y pueda resolver 'appwrite'",
          "4) Revisa si hay timeouts; puedes subir HTTP_TIMEOUT_MS",
        ],
      };
    }

    return json(res, 500, {
      ok: false,
      error: msg || "Internal server error",
      hint,
    });
  }
};
