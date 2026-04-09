
import dotenv from "dotenv";
import { Buffer } from "node:buffer";
import http from "http";
import fsPromises from "fs/promises";
import path from "path";
import process from "node:process";

dotenv.config();

const PORT = process.env.EMAIL_SERVER_PORT || 4001;
const SENDGRID_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  process.env.SENDGRID_FROM_EMAIL ||
  "no-reply@example.com";
const DEV_EMAIL_FALLBACK_TO = process.env.DEV_EMAIL_FALLBACK_TO || "approver@example.com";
const APP_URL = process.env.APP_URL || "http://localhost:5173";
const APP_LOGIN_URL = process.env.APP_LOGIN_URL || `${APP_URL.replace(/\/$/, "")}/login`;

// File-backed queue for retrying failed sends
const QUEUE_FILE = path.resolve(process.cwd(), "server", "pending-emails.json");

// ---------------- Queue Utilities ----------------
async function readQueue() {
  try {
    const txt = await fsPromises.readFile(QUEUE_FILE, "utf8");
    return JSON.parse(txt || "[]");
  } catch {
    return [];
  }
}

async function writeQueue(arr) {
  try {
    await fsPromises.writeFile(
      QUEUE_FILE,
      JSON.stringify(arr || [], null, 2),
      "utf8"
    );
  } catch (err) {
    console.error("[email-server] Failed to write queue file:", err);
  }
}

async function enqueueEmail(item) {
  const q = await readQueue();
  q.push({ ...item, enqueuedAt: new Date().toISOString() });
  await writeQueue(q);
  console.info("[email-server] Email enqueued for retry. Queue length:", q.length);
}

async function processQueue() {
  if (!SENDGRID_KEY) return;
  const q = await readQueue();
  if (!q.length) return;
  console.info("[email-server] Processing queued emails...", q.length);
  const remaining = [];
  for (const it of q) {
    try {
      await sendEmailViaSendGrid(it.from, it.to, it.subject, it.textBody, it.htmlBody);
      console.info("[email-server] Queued email sent", it.deferralNumber || "");
    } catch {
      remaining.push(it);
    }
  }
  await writeQueue(remaining);
}

// Start periodic queue processing
setInterval(processQueue, 30 * 1000);

// ---------------- SendGrid Email ----------------
const sendEmailViaSendGrid = async (from, to, subject, textBody, htmlBody) => {
  if (!SENDGRID_KEY) throw new Error("SENDGRID_API_KEY not set");

  const payload = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: from },
    subject,
    content: [
      { type: "text/plain", value: textBody },
      { type: "text/html", value: htmlBody },
    ],
    tracking_settings: { click_tracking: { enable: false, enable_text: false } },
  };

  const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SENDGRID_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`SendGrid error ${resp.status}: ${text}`);
  }

  // Log success for visibility
  console.info('[email-server] SendGrid accepted message', { status: resp.status });
  return { success: true };
};

// ---------------- CORS Helper ----------------
const setCors = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173"); // frontend URL
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
};

// ---------------- HTTP Server ----------------
const server = http.createServer(async (req, res) => {
  setCors(res); // Always set CORS

  // Preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // ---------------- /api/send-deferral ----------------
  if (req.url === "/api/send-deferral" && req.method === "POST") {
    let bodyText = "";
    req.on("data", (chunk) => { bodyText += chunk; });
    req.on("end", async () => {
      try {
        const deferralData = JSON.parse(bodyText || "{}");
        const from = EMAIL_FROM;
        const to = (deferralData.currentApprover && deferralData.currentApprover.email) || DEV_EMAIL_FALLBACK_TO;
        const deferralNumber = deferralData.deferralNumber || "DEF-UNKNOWN";
        const customerName = deferralData.customerName || deferralData.createdBy || "Customer";
        const documentRequested = (deferralData.documents && deferralData.documents[0] && (deferralData.documents[0].name || deferralData.documents[0])) || deferralData.documentName || deferralData.deferralTitle || "Document";

        const subject = `DEFERRAL REQUEST (${deferralNumber})`;

        let approvalLink = `${APP_URL}/public/approver/review/${encodeURIComponent(deferralNumber)}`;
        const approverPos = deferralData.targetApproverPosition || deferralData.approver;
        if (approverPos) approvalLink += `?approver=${encodeURIComponent(approverPos)}`;

        const preview = encodeURIComponent(Buffer.from(JSON.stringify(deferralData)).toString("base64"));
        const sep = approvalLink.includes("?") ? "&" : "?";
        approvalLink += `${sep}preview=${preview}`;

        const body = `A deferral has been requested for ${customerName}.\nDeferral Number: ${deferralNumber}\nDocument requested: ${documentRequested}\n\nApproval link:\n${approvalLink}\n\nLogin to DCL System:\n${APP_LOGIN_URL}`;

        let messageId, sentVia;

        try {
          const htmlBody = `<p>A deferral has been requested for <strong>${customerName}</strong>.</p>
            <p><strong>Deferral Number:</strong> ${deferralNumber}<br/>
            <strong>Document requested:</strong> ${documentRequested}</p>
            <p>Approval link: <a href="${approvalLink}">${approvalLink}</a></p>
            <div style="margin: 20px 0;">
              <a href="${APP_LOGIN_URL}" style="display:inline-block;background-color:#164679;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600;font-family:Arial,sans-serif;">Login to DCL System</a>
            </div>`;

          if (SENDGRID_KEY) {
            try {
              await sendEmailViaSendGrid(from, to, subject, body, htmlBody);
              messageId = `sendgrid-${Date.now()}`;
              sentVia = "sendgrid";
            } catch (err) {
              console.error("[email-server] SendGrid failed, enqueuing", err);
              await enqueueEmail({ from, to, subject, textBody: body, htmlBody, deferralNumber });
              messageId = `queued-${Date.now()}`;
              sentVia = "queued";
            }
          } else {
            messageId = `mock-${Date.now()}`;
            sentVia = "mock-local";
            console.info("[email-server] Mock send", { from, to, approvalLink, messageId });
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, to, subject, approvalLink, messageId, sentVia }));

        } catch (err) {
          console.error("Error sending email:", err);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: "Failed to send email" }));
        }

      } catch (err) {
        console.error("Error in /api/send-deferral:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // ---------------- Health Check ----------------
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, status: "ok" }));
    return;
  }

  // ---------------- Admin: queue endpoints ----------------
  if (req.url === "/admin/queue" && req.method === "GET") {
    try {
      const q = await readQueue();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, queueLength: q.length, queue: q }));
    } catch {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: 'Failed to read queue' }));
    }
    return;
  }

  if (req.url === "/admin/queue/process" && req.method === "POST") {
    try {
      await processQueue();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, message: 'Queue processing triggered' }));
    } catch {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: 'Failed to process queue' }));
    }
    return;
  }

  // ---------------- Redirect /r/:deferralId ----------------
  if (req.url && req.method === "GET" && req.url.startsWith("/r/")) {
    try {
      const urlParts = req.url.split("?");
      const deferralId = decodeURIComponent(urlParts[0].split("/")[2] || "");
      const queryPart = urlParts[1] ? "?" + urlParts[1] : "";
      const target = `${APP_URL}/public/approver/review/${encodeURIComponent(deferralId)}${queryPart}`;
      res.writeHead(302, { Location: target });
      res.end();
      return;
    } catch (err) {
      console.error("Redirect /r error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: "Redirect handler error" }));
      return;
    }
  }

  // ---------------- Not Found ----------------
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ success: false, error: "Not found" }));
});

// ---------------- Start Server ----------------
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Email server listening on port ${PORT}. SENDGRID_KEY set: ${!!SENDGRID_KEY}`);
  console.log(`EMAIL_FROM: ${EMAIL_FROM}`);
  // Heartbeat log to ensure process remains alive and to assist debugging
  setInterval(() => console.log('[email-server] heartbeat — alive'), 10000);
});

process.on("uncaughtException", (err) => console.error("Uncaught exception:", err));
process.on("unhandledRejection", (reason) => console.error("Unhandled rejection:", reason));
