import StudentProfile from "../models/StudentProfile.js";
import Scholarship from "../models/Scholarship.js";
import { getLocalProfile, upsertLocalProfile } from "../services/localProfileStore.js";
import { getAllLocalScholarships } from "../services/localScholarshipStore.js";
import { evaluateScholarships } from "../services/eligibilityService.js";
import { createProfileNotifications } from "../services/notificationService.js";
import { getProfileInsights, normalizeProfile } from "../services/profileService.js";
import { logProfileUpdate } from "../services/auditService.js";

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
  } catch {
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

async function sendSavedProfile(req, res, profile, changedFields = []) {
  const insights = getProfileInsights(profile || {});
  await createProfileNotifications(req.user, insights);
  const userId = req.user.id || req.user._id?.toString();
  if (changedFields.length > 0) {
    logProfileUpdate(userId, changedFields, profile).catch(() => {});
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

      return sendSavedProfile(req, res, profile, changedFields);
    }

    const profile = await upsertLocalProfile(userId, updatePayload);
    return sendSavedProfile(req, res, profile, changedFields);
  } catch (error) {
    next(error);
  }
}
