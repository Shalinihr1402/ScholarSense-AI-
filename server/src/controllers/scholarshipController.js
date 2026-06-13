import Scholarship from "../models/Scholarship.js";
import StudentProfile from "../models/StudentProfile.js";
import {
  createLocalScholarship,
  deleteLocalScholarship,
  getAllLocalScholarships,
  listLocalScholarships,
  updateLocalScholarship
} from "../services/localScholarshipStore.js";
import { getLocalProfile } from "../services/localProfileStore.js";
import { evaluateScholarships } from "../services/eligibilityService.js";

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeScholarship(payload) {
  return {
    name: payload.name?.trim(),
    provider: payload.provider?.trim(),
    state: payload.state?.trim() || "All India",
    categories: normalizeArray(payload.categories),
    incomeLimit: Number(payload.incomeLimit || 0),
    minMarks: Number(payload.minMarks || 0),
    courseLevels: normalizeArray(payload.courseLevels),
    gender: payload.gender || "Any",
    disabilityRequired: Boolean(payload.disabilityRequired),
    requiredDocuments: normalizeArray(payload.requiredDocuments),
    deadline: payload.deadline || "",
    applicationLink: payload.applicationLink || "",
    sourceUrl: payload.sourceUrl || "",
    status: payload.status || "Open",
    description: payload.description || ""
  };
}

function getFilters(req) {
  return {
    search: req.query.search || "",
    state: req.query.state || "",
    category: req.query.category || ""
  };
}

export async function listScholarships(req, res, next) {
  try {
    const filters = getFilters(req);

    if (Scholarship.db.readyState === 1) {
      const query = {};

      if (filters.search) {
        query.$or = [
          { name: new RegExp(filters.search, "i") },
          { provider: new RegExp(filters.search, "i") },
          { description: new RegExp(filters.search, "i") }
        ];
      }

      if (filters.state) {
        query.$and = [...(query.$and || []), { $or: [{ state: "All India" }, { state: filters.state }] }];
      }

      if (filters.category) {
        query.categories = filters.category;
      }

      const scholarships = await Scholarship.find(query).sort({ deadline: 1, name: 1 }).lean();
      return res.json({ scholarships, count: scholarships.length });
    }

    const scholarships = await listLocalScholarships(filters);
    return res.json({ scholarships, count: scholarships.length });
  } catch (error) {
    next(error);
  }
}

export async function listPersonalizedScholarships(req, res, next) {
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

    const results = evaluateScholarships(profile, scholarships);
    const summary = results.reduce(
      (acc, scholarship) => {
        acc[scholarship.eligibility.status] += 1;
        return acc;
      },
      { Eligible: 0, Check: 0, "Not Eligible": 0 }
    );

    return res.json({
      profileFound: Boolean(profile),
      summary,
      scholarships: results,
      count: results.length
    });
  } catch (error) {
    next(error);
  }
}

export async function createScholarship(req, res, next) {
  try {
    const payload = normalizeScholarship(req.body);

    if (!payload.name || !payload.provider) {
      return res.status(400).json({ message: "Scholarship name and provider are required." });
    }

    if (Scholarship.db.readyState === 1) {
      const scholarship = await Scholarship.create(payload);
      return res.status(201).json({ scholarship });
    }

    const scholarship = await createLocalScholarship(payload);
    return res.status(201).json({ scholarship });
  } catch (error) {
    next(error);
  }
}

export async function updateScholarship(req, res, next) {
  try {
    const payload = normalizeScholarship(req.body);

    if (Scholarship.db.readyState === 1) {
      const scholarship = await Scholarship.findByIdAndUpdate(req.params.id, payload, {
        new: true,
        runValidators: true
      }).lean();

      if (!scholarship) {
        return res.status(404).json({ message: "Scholarship record not found." });
      }

      return res.json({ scholarship });
    }

    const scholarship = await updateLocalScholarship(req.params.id, payload);
    return res.json({ scholarship });
  } catch (error) {
    next(error);
  }
}

export async function deleteScholarship(req, res, next) {
  try {
    if (Scholarship.db.readyState === 1) {
      const scholarship = await Scholarship.findByIdAndDelete(req.params.id);

      if (!scholarship) {
        return res.status(404).json({ message: "Scholarship record not found." });
      }

      return res.status(204).send();
    }

    await deleteLocalScholarship(req.params.id);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}
