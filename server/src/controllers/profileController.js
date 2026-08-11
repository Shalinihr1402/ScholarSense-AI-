import StudentProfile from "../models/StudentProfile.js";
import Scholarship from "../models/Scholarship.js";
import { getLocalProfile, upsertLocalProfile } from "../services/localProfileStore.js";
import { getAllLocalScholarships } from "../services/localScholarshipStore.js";
import { evaluateScholarships } from "../services/eligibilityService.js";
import { createProfileNotifications } from "../services/notificationService.js";
import { getProfileInsights, normalizeProfile } from "../services/profileService.js";
import { logProfileUpdate } from "../services/auditService.js";
import { sendWhatsApp, isWhatsAppConfigured } from "../services/whatsappService.js";

async function buildEligibilitySnapshot(profile, isMongoConnected) {
  try {
    const scholarships = isMongoConnected
      ? await Scholarship.find({ status: "Active" }).lean()
      : await getAllLocalScholarships();

    if (!scholarships.length) return null;

    const results = evaluateScholarships(profile, scholarships);
    return {
      total: results.length,
      eligible: results.filter(r => r.eligibility.status === "Eligible").length,
      check: results.filter(r => r.eligibility.status === "Check").length,
      notEligible: results.filter(r => r.eligibility.status === "Not Eligible").length,
      topMatches: results.slice(0, 3).map(r => ({
        id: r._id || r.id,
        name: r.name,
        provider: r.provider,
        status: r.eligibility.status,
        matchScore: r.eligibility.matchScore
      })),
      calculatedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error("[Eligibility] buildEligibilitySnapshot failed:", err.message);
    return null;
  }
}

function getUserId(req) {
  return req.user.id || req.user._id?.toString();
}

function sendProfile(res, profile) {
  const safeProfile = profile || null;

  res.json({
    profile: safeProfile,
    insights: getProfileInsights(safeProfile || {})
  });
}

async function sendSavedProfile(req, res, profile, changedFields = [], computedSnapshot = null) {
  const insights = getProfileInsights(profile || {});
  await createProfileNotifications(req.user, insights);
  const userId = req.user.id || req.user._id?.toString();
  if (changedFields.length > 0) {
    logProfileUpdate(userId, changedFields, profile).catch(() => {});
  }

  // Auto WhatsApp notification to parent/student number
  const notifyPhone = profile?.parentPhone || profile?.mobile;
  console.log("[WhatsApp] configured:", isWhatsAppConfigured(), "| phone:", notifyPhone);
  if (isWhatsAppConfigured() && notifyPhone) {
    const snap = computedSnapshot || profile.eligibilitySnapshot;
    const topMatch = snap?.topMatches?.[0];
    console.log("[WhatsApp] snap eligible:", snap?.eligible, "| topMatch:", topMatch?.name, topMatch?.status);
    if (topMatch && (topMatch.status === "Eligible" || topMatch.status === "Check")) {
      const isEligible = topMatch.status === "Eligible";
      const eligibleCount = snap.eligible || 0;
      const checkCount = snap.check || 0;
      const totalMatched = eligibleCount + checkCount;
      const message =
        `🎓📚 *ScholarSense AI*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📢 *ವಿದ್ಯಾರ್ಥಿ ವೇತನ ಅಧಿಸೂಚನೆ*\n\n` +
        `ಆತ್ಮೀಯ ಪೋಷಕರೇ,\n\n` +
        `ನಿಮ್ಮ ಮಗು *${profile.fullName || "ವಿದ್ಯಾರ್ಥಿ"}* ಅವರಿಗೆ ಕೆಳಗಿನ ವಿದ್ಯಾರ್ಥಿ ವೇತನಕ್ಕೆ ` +
        (isEligible ? `ಅರ್ಹತೆ ಇದೆ:\n\n` : `ಅರ್ಹತೆ ಇರುವ ಸಾಧ್ಯತೆ ಇದೆ:\n\n`) +
        `🎓 *${topMatch.name}*\n\n` +
        (totalMatched > 0
          ? `🔎 ಒಟ್ಟು *${totalMatched}* ವಿದ್ಯಾರ್ಥಿ ವೇತನಗಳು ನಿಮ್ಮ ಮಗುವಿನ ಪ್ರೊಫೈಲ್‌ಗೆ ಹೊಂದಿಕೆಯಾಗುವ ಸಾಧ್ಯತೆಯಿದ್ದು, ಅವುಗಳನ್ನು ಪರಿಶೀಲಿಸಲು ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ.\n\n`
          : "") +
        `✅ ದಯವಿಟ್ಟು ScholarSense AI ಅಪ್ಲಿಕೇಶನ್‌ಗೆ ಲಾಗಿನ್ ಮಾಡಿ, ಅರ್ಹತೆಯನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಕೊನೆಯ ದಿನಾಂಕಕ್ಕೂ ಮುನ್ನ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.\n\n` +
        `📌 *ಸೂಚನೆ:* ಅಂತಿಮ ಅರ್ಹತೆ ಸಂಬಂಧಿತ ವಿದ್ಯಾರ್ಥಿ ವೇತನದ ಅಧಿಕೃತ ಮಾರ್ಗಸೂಚಿಗಳು ಹಾಗೂ ಸಲ್ಲಿಸಿದ ದಾಖಲೆಗಳ ಪರಿಶೀಲನೆಯ ಆಧಾರದ ಮೇಲೆ ನಿರ್ಧರಿಸಲಾಗುತ್ತದೆ.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `— *ScholarSense AI ತಂಡ* 🎓`;

      console.log("[WhatsApp] Sending to:", notifyPhone);
      sendWhatsApp({ to: notifyPhone, message })
        .then(() => console.log("[WhatsApp] ✅ Sent successfully to", notifyPhone))
        .catch(err => console.error("[WhatsApp] ❌ Send failed:", err.message));
    } else {
      console.log("[WhatsApp] Skipped — no eligible top match");
    }
  } else {
    console.log("[WhatsApp] Skipped —", !isWhatsAppConfigured() ? "not configured" : "no phone number");
  }

  res.json({ profile, insights });
}

export async function getMyProfile(req, res, next) {
  try {
    const userId = getUserId(req);

    if (StudentProfile.db.readyState === 1) {
      const profile = await StudentProfile.findOne({ userId }).lean();
      return sendProfile(res, profile);
    }

    const profile = await getLocalProfile(userId);
    return sendProfile(res, profile);
  } catch (error) {
    next(error);
  }
}

export async function saveMyProfile(req, res, next) {
  try {
    const userId = getUserId(req);
    const normalized = normalizeProfile(req.body);

    if (normalized.annualIncome !== "" && Number.isNaN(normalized.annualIncome)) {
      return res.status(400).json({ message: "Annual income must be a valid number." });
    }

    if (normalized.marksPercentage !== "" && Number.isNaN(normalized.marksPercentage)) {
      return res.status(400).json({ message: "Marks percentage must be a valid number." });
    }

    if (
      normalized.marksPercentage !== "" &&
      (normalized.marksPercentage < 0 || normalized.marksPercentage > 100)
    ) {
      return res.status(400).json({ message: "Marks percentage must be between 0 and 100." });
    }

    const isMongo = StudentProfile.db.readyState === 1;
    const eligibilitySnapshot = await buildEligibilitySnapshot(normalized, isMongo);
    const updatePayload = {
      ...normalized,
      userId,
      ...(eligibilitySnapshot && { eligibilitySnapshot, eligibilityUpdatedAt: new Date() })
    };

    const changedFields = Object.keys(normalized).filter(k => normalized[k] !== "" && normalized[k] != null);

    if (isMongo) {
      const profile = await StudentProfile.findOneAndUpdate(
        { userId },
        { $set: updatePayload },
        { new: true, upsert: true, runValidators: true }
      ).lean();

      return sendSavedProfile(req, res, profile, changedFields, eligibilitySnapshot);
    }

    const profile = await upsertLocalProfile(userId, updatePayload);
    return sendSavedProfile(req, res, profile, changedFields, eligibilitySnapshot);
  } catch (error) {
    next(error);
  }
}

export async function uploadUdidCard(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const userId = getUserId(req);
    const udidCardPath = req.file.filename;

    if (StudentProfile.db.readyState === 1) {
      const profile = await StudentProfile.findOneAndUpdate(
        { userId },
        { $set: { udidCardPath } },
        { new: true, upsert: true }
      ).lean();
      return res.json({ profile, message: "UDID card uploaded successfully." });
    }

    const profile = await upsertLocalProfile(userId, { udidCardPath });
    return res.json({ profile, message: "UDID card uploaded successfully." });
  } catch (error) {
    next(error);
  }
}
