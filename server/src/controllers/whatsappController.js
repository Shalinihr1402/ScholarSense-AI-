import { sendWhatsApp, buildKannadaMessage, isWhatsAppConfigured } from "../services/whatsappService.js";

export async function sendWhatsAppNotification(req, res) {
  try {
    const { to, studentName, scholarshipName, status, deadline, portal } = req.body;

    if (!to) return res.status(400).json({ error: "Phone number (to) is required" });
    if (!studentName) return res.status(400).json({ error: "studentName is required" });

    const message = buildKannadaMessage({
      studentName,
      scholarshipName: scholarshipName || "ವಿದ್ಯಾರ್ಥಿ ವೇತನ",
      status: status || "eligible",
      deadline,
      portal
    });

    const result = await sendWhatsApp({ to, message });
    res.json({ success: true, message: "WhatsApp ಸಂದೇಶ ಕಳುಹಿಸಲಾಗಿದೆ", result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function whatsAppStatus(req, res) {
  res.json({ configured: isWhatsAppConfigured() });
}

export async function testWhatsApp(req, res) {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: "Phone number required" });

    const message =
      `✅ *ScholarSense AI - ಪರೀಕ್ಷಾ ಸಂದೇಶ*\n\n` +
      `ನಮಸ್ಕಾರ! ಈ ಸಂದೇಶ ScholarSense AI ನಿಂದ ಬಂದಿದೆ.\n` +
      `WhatsApp ಅಧಿಸೂಚನೆ ಯಶಸ್ವಿಯಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿದೆ! 🎓\n\n` +
      `- ScholarSense AI ತಂಡ`;

    const result = await sendWhatsApp({ to, message });
    res.json({ success: true, message: "Test message sent!", result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
