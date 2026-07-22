import fetch from "node-fetch";

export function isWhatsAppConfigured() {
  return Boolean(process.env.ULTRAMSG_INSTANCE && process.env.ULTRAMSG_TOKEN);
}

// Format phone number → international format (India default)
function formatPhone(number) {
  const cleaned = String(number).replace(/\D/g, "");
  if (cleaned.startsWith("91") && cleaned.length === 12) return cleaned;
  if (cleaned.length === 10) return "91" + cleaned;
  return cleaned;
}

// Kannada message templates
export function buildKannadaMessage({ studentName, scholarshipName, status, deadline, portal }) {
  const portalLabel = portal?.includes("scholarships.gov.in") ? "NSP" : "SSP";

  if (status === "eligible") {
    return (
      `📢 *ScholarSense AI - ವಿದ್ಯಾರ್ಥಿ ವಜೀಫ ಅಧಿಸೂಚನೆ*\n\n` +
      `ಆತ್ಮೀಯ ಪೋಷಕರೇ,\n\n` +
      `ನಿಮ್ಮ ಮಗು *${studentName}* ಈ ಕೆಳಗಿನ ವಿದ್ಯಾರ್ಥಿ ವೇತನಕ್ಕೆ ಅರ್ಹರಾಗಿದ್ದಾರೆ:\n` +
      `🎓 *${scholarshipName}*\n\n` +
      `📅 ಅರ್ಜಿ ಕೊನೆ ದಿನಾಂಕ: *${deadline || "ಶೀಘ್ರದಲ್ಲಿ"}*\n` +
      `🌐 ಪೋರ್ಟಲ್: *${portalLabel}*\n\n` +
      `ದಯವಿಟ್ಟು ${portalLabel} ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.\n` +
      `ಹೆಚ್ಚಿನ ಮಾಹಿತಿಗೆ ScholarSense AI ಅಪ್ಲಿಕೇಶನ್ ತೆರೆಯಿರಿ.\n\n` +
      `- ScholarSense AI ತಂಡ`
    );
  }

  if (status === "deadline") {
    return (
      `⏰ *ScholarSense AI - ಕೊನೆ ದಿನಾಂಕ ಎಚ್ಚರಿಕೆ*\n\n` +
      `ಆತ್ಮೀಯ ಪೋಷಕರೇ,\n\n` +
      `*${studentName}* ಅವರ *${scholarshipName}* ವಿದ್ಯಾರ್ಥಿ ವೇತನ ಅರ್ಜಿ ಸಲ್ಲಿಸಲು\n` +
      `ಕೊನೆ ದಿನಾಂಕ: *${deadline}*\n\n` +
      `⚠️ ದಯವಿಟ್ಟು ತಡ ಮಾಡದೆ ${portalLabel} ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.\n\n` +
      `- ScholarSense AI ತಂಡ`
    );
  }

  // default / custom
  return (
    `📢 *ScholarSense AI ಅಧಿಸೂಚನೆ*\n\n` +
    `ವಿದ್ಯಾರ್ಥಿ: *${studentName}*\n` +
    `ವಿದ್ಯಾರ್ಥಿ ವೇತನ: *${scholarshipName}*\n\n` +
    `ScholarSense AI ಅಪ್ಲಿಕೇಶನ್ ತೆರೆದು ಹೆಚ್ಚಿನ ವಿವರ ನೋಡಿ.\n\n` +
    `- ScholarSense AI ತಂಡ`
  );
}

export async function sendWhatsApp({ to, message }) {
  if (!isWhatsAppConfigured()) {
    throw new Error("WhatsApp (UltraMsg) credentials not configured in .env");
  }

  const phone = formatPhone(to);
  const url = `https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE}/messages/chat`;

  const body = new URLSearchParams({
    token: process.env.ULTRAMSG_TOKEN,
    to: phone,
    body: message,
    priority: "10"
  });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });

  const data = await res.json();
  if (!res.ok || data.sent === "false" || data.error) {
    throw new Error(data.error || `UltraMsg API error: ${res.status}`);
  }
  return data;
}
