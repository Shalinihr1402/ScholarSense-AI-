import StudentProfile from "../models/StudentProfile.js";
import { getLocalProfile, upsertLocalProfile } from "../services/localProfileStore.js";
import { createProfileNotifications } from "../services/notificationService.js";
import { getProfileInsights, normalizeProfile } from "../services/profileService.js";

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

async function sendSavedProfile(req, res, profile) {
  const insights = getProfileInsights(profile || {});
  await createProfileNotifications(req.user, insights);
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

    if (StudentProfile.db.readyState === 1) {
      const profile = await StudentProfile.findOneAndUpdate(
        { userId },
        { $set: { ...normalized, userId } },
        { new: true, upsert: true, runValidators: true }
      ).lean();

      return sendSavedProfile(req, res, profile);
    }

    const profile = await upsertLocalProfile(userId, normalized);
    return sendSavedProfile(req, res, profile);
  } catch (error) {
    next(error);
  }
}
