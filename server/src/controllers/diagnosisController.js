import Scholarship from "../models/Scholarship.js";
import StudentProfile from "../models/StudentProfile.js";
import { diagnoseScholarshipRisks } from "../services/diagnosisService.js";
import { evaluateScholarships } from "../services/eligibilityService.js";
import { getLocalProfile } from "../services/localProfileStore.js";
import { getAllLocalScholarships } from "../services/localScholarshipStore.js";
import { createDiagnosisNotifications } from "../services/notificationService.js";
import { calculateReadiness } from "../services/readinessService.js";

export async function getMyDiagnosis(req, res, next) {
  try {
    const userId = req.user.id || req.user._id?.toString();
    let profile = null;
    let scholarships = [];

    if (Scholarship.db.readyState === 1) {
      profile = await StudentProfile.findOne({ userId }).lean();
      scholarships = await Scholarship.find({}).sort({ deadline: 1, name: 1 }).lean();
    } else {
      profile = await getLocalProfile(userId);
      scholarships = await getAllLocalScholarships();
    }

    const eligibilityResults = evaluateScholarships(profile, scholarships);
    const readiness = calculateReadiness(profile, eligibilityResults);
    const diagnosis = diagnoseScholarshipRisks(profile, eligibilityResults, readiness);
    await createDiagnosisNotifications(req.user, diagnosis);

    res.json({
      profileFound: Boolean(profile),
      diagnosis
    });
  } catch (error) {
    next(error);
  }
}
