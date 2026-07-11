/**
 * ML-based scholarship eligibility engine
 * Features extracted from NSP eligibility form fields:
 * Domicile, Gender, DOB, Marital Status, Parent Income, Parent Profession,
 * Religion, Community, Disability, Hosteler, Parents Not Alive,
 * Course, Mode of Study, Previous %, 12th %, 10th %, Competitive Exam
 *
 * Uses TensorFlow.js neural network trained on scholarship rule patterns
 */

import * as tf from "@tensorflow/tfjs";

// ── Feature extraction (maps profile+scholarship → numeric vector) ─────────────

function normCategory(raw = "") {
  const s = raw.toLowerCase();
  if (s.includes("sc") && !s.includes("st")) return "SC";
  if (s.includes("st"))  return "ST";
  if (s.includes("obc")) return "OBC";
  if (s.includes("ews")) return "EWS";
  if (s.includes("minority")) return "Minority";
  if (s.includes("general")) return "General";
  return "General";
}

function deriveCourseLevel(educationLevel = "", course = "") {
  const el = educationLevel.toLowerCase();
  const c  = course.toLowerCase();
  if (el.includes("phd") || c.includes("phd")) return "PhD";
  if (el.includes("post graduate") || el.includes("pg") || c.match(/\b(mca|mba|m\.tech|msc|mcom)\b/)) return "PG";
  if (el.includes("degree") || el.includes("ug") || c.match(/\b(b\.tech|btech|be\b|bca|bsc|bcom|ba\b|mbbs)\b/)) return "UG";
  if (el.includes("diploma") || c.includes("diploma")) return "Diploma";
  if (el.includes("puc") || el.includes("12")) return "PostMatric";
  if (el.includes("school") || el.includes("class") || el.includes("pre-matric")) return "Pre-Matric";
  return "UG"; // default assumption
}

/**
 * Extract 16-dimensional feature vector from [profile, scholarship] pair
 * All values normalized to [0, 1]
 */
export function extractFeatures(profile, scholarship) {
  const p = profile || {};
  const s = scholarship || {};

  // 1. State match
  const schState   = (s.state || "").toLowerCase();
  const profState  = (p.state || "").toLowerCase();
  const stateMatch = schState === "all india" ? 1 : (schState === profState ? 1 : 0);

  // 2. Category match
  const profCat  = normCategory(p.category || "");
  const schCats  = (s.categories || []).map(normCategory);
  const catMatch = schCats.includes(profCat) || schCats.includes("General") ? 1 : 0;

  // 3. Income score (1 = qualifies, 0 = disqualified)
  const incomeLimit    = Number(s.incomeLimit) || 0;
  const incomeLimitMin = Number(s.incomeLimitMin) || 0;
  const income         = Number(p.annualIncome) || 0;
  let incomeScore = 1;
  if (incomeLimitMin > 0 && income > 0) {
    // Income-range scheme (e.g. SSP Technical SC/ST: 2.5L–10L)
    if (income < incomeLimitMin) incomeScore = Math.max(0, income / incomeLimitMin);
    else if (income > incomeLimit) incomeScore = Math.max(0, 1 - (income - incomeLimit) / incomeLimit);
    else incomeScore = 1;
  } else if (incomeLimit > 0 && income > 0) {
    incomeScore = income <= incomeLimit ? 1 : Math.max(0, 1 - (income - incomeLimit) / incomeLimit);
  }

  // 4. Marks ratio
  const minMarks  = Number(s.minMarks) || 0;
  const marks     = Number(p.marksPercentage) || 0;
  let marksScore  = 1;
  if (minMarks > 0 && marks > 0) {
    marksScore = marks >= minMarks ? 1 : marks / minMarks;
  }

  // 5. Course level match
  const courseLevel   = deriveCourseLevel(p.educationLevel || "", p.course || "");
  const schLevels     = (s.courseLevels || []).map(l => l.toLowerCase());
  const courseLevelMatch = !schLevels.length ? 1 :
    schLevels.some(l => l.includes(courseLevel.toLowerCase()) ||
      (l === "post-matric" && ["ug","pg","diploma","postmatric"].includes(courseLevel.toLowerCase()))) ? 1 : 0;

  // 6. Gender match
  const schGender  = (s.gender || "any").toLowerCase();
  const profGender = (p.gender || "").toLowerCase();
  const genderMatch = schGender === "any" ? 1 : (schGender === profGender ? 1 : 0);

  // 7. Disability match
  const needsDisability = s.disabilityRequired ? 1 : 0;
  const hasDisability   = p.disabilityStatus === "Yes" ? 1 : 0;
  const disabilityMatch = needsDisability === 0 ? 1 : hasDisability;

  // 8. Minority status
  const schNeedsMinority = (s.categories || []).some(c => c.toLowerCase().includes("minority")) ? 1 : 0;
  const profIsMinority   = p.minorityStatus === "Yes" ? 1 : 0;
  const minorityMatch    = schNeedsMinority === 0 ? 1 : profIsMinority;

  // 9. DBT readiness (Aadhaar seeded to bank)
  const dbtReady = (p.aadhaarBankLinked === "Yes" && p.dbtEnabled === "Yes") ? 1 : 0.5;

  // 10. Documents readiness ratio
  const requiredDocs  = (s.requiredDocuments || []).length;
  const availableDocs = (p.availableDocuments || []).length;
  const docsScore     = requiredDocs === 0 ? 1 : Math.min(1, availableDocs / requiredDocs);

  // 11. Deadline urgency (1 = plenty of time, 0 = past deadline)
  let deadlineScore = 1;
  if (s.deadline) {
    const days = Math.ceil((new Date(s.deadline) - new Date()) / 86400000);
    deadlineScore = days < 0 ? 0 : days < 7 ? 0.3 : days < 30 ? 0.7 : 1;
  }

  // 12. Hosteler match (some scholarships prefer hostelers)
  const schPrefersHosteler = (s.name || "").toLowerCase().includes("hostel") ? 1 : 0;
  const isHosteler         = p.hosteler === "Hosteller" ? 1 : 0;
  const hostelerMatch      = schPrefersHosteler === 0 ? 1 : isHosteler;

  // 13. Orphan/parents not alive match
  const schNeedsOrphan  = (s.name || "").toLowerCase().includes("orphan") || (s.description || "").toLowerCase().includes("parents not alive") ? 1 : 0;
  const isOrphan        = p.orphanStatus === "Yes" ? 1 : 0;
  const orphanMatch     = schNeedsOrphan === 0 ? 1 : isOrphan;

  // 14. First graduate preference
  const isFirstGrad     = p.firstGraduate === "Yes" ? 1 : 0;

  // 15. Profile completeness score
  const profileFields = [p.state, p.category, p.annualIncome, p.marksPercentage, p.course, p.gender, p.educationLevel, p.collegeName];
  const completeness  = profileFields.filter(f => f && String(f).trim() !== "" && f !== "Unknown").length / profileFields.length;

  // 16. NPCI mapping
  const npciMapped = (p.npciMapping || "").includes("Yes") ? 1 : 0.5;

  // 17. Parent profession match
  const reqProfession  = (s.parentProfession || "").toLowerCase();
  const profProfessionRaw = (p.parentProfession || "none").toLowerCase();
  const profProfession = profProfessionRaw.split("(")[0].trim(); // strip parenthetical
  const professionMatch = !reqProfession ? 1 :
    (profProfession.includes(reqProfession) || reqProfession.includes(profProfession)) ? 1 : 0;

  return [
    stateMatch,       // 0
    catMatch,         // 1
    incomeScore,      // 2
    marksScore,       // 3
    courseLevelMatch, // 4
    genderMatch,      // 5
    disabilityMatch,  // 6
    minorityMatch,    // 7
    dbtReady,         // 8
    docsScore,        // 9
    deadlineScore,    // 10
    hostelerMatch,    // 11
    orphanMatch,      // 12
    isFirstGrad,      // 13
    completeness,     // 14
    npciMapped,       // 15
    professionMatch   // 16
  ];
}

// ── Generate training data from scholarship rule patterns ──────────────────────

function generateTrainingData() {
  const samples = [];

  // Eligible patterns (label = 1.0) — 17 features
  const eligiblePatterns = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1],   // perfect match
    [1,1,1,1,1,1,1,1,1,0.5,1,1,1,0,0.9,1,1], // missing some docs
    [1,1,0.9,1,1,1,1,1,1,1,1,1,1,0,1,1,1],  // income near limit
    [1,1,1,0.95,1,1,1,1,0.5,0.8,1,1,1,0,0.8,0.5,1], // some dbt issues
    [1,1,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1],   // no disability needed
    [1,1,1,1,1,1,1,0,1,1,1,1,1,1,0.9,1,1], // minority not needed
    [1,1,0.8,0.9,1,1,1,1,1,0.7,0.8,1,1,0,0.85,1,1],
    [1,1,1,1,1,1,1,1,1,1,0.7,1,1,1,1,1,1], // deadline approaching
    [1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1],   // defence/profession match
  ];

  // Not eligible patterns (label = 0.0) — 17 features
  const notEligiblePatterns = [
    [0,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1],   // state mismatch
    [1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1],   // category mismatch
    [1,1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,1],   // income exceeded
    [1,1,1,0.3,1,1,1,1,1,1,1,1,1,0,1,1,1], // marks too low
    [1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1],   // wrong course level
    [1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1],   // gender mismatch
    [0,0,0,0.3,0,1,1,1,1,1,1,1,1,0,0.4,1,1], // multiple failures
    [1,0,0,1,1,1,1,1,1,1,1,1,1,0,0.5,1,1], // category + income fail
    [1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0],   // profession mismatch (defence/labour/farmer)
  ];

  // Check/borderline patterns (label = 0.5) — 17 features
  const checkPatterns = [
    [1,1,1,1,1,1,1,1,0.5,0.5,1,1,1,0,0.6,0.5,1], // dbt issues
    [1,1,0.95,1,1,1,1,1,1,1,1,1,1,0,0.7,1,1],     // income borderline
    [1,1,1,0.85,1,1,1,1,1,1,1,1,1,0,0.65,1,1],    // marks borderline
    [1,1,1,1,1,1,1,1,1,0.3,1,1,1,0,0.5,0.5,1],    // low docs + incomplete profile
  ];

  for (const p of eligiblePatterns) {
    samples.push({ input: p, output: [1.0] });
    // Augment with small noise
    samples.push({ input: p.map(v => Math.min(1, Math.max(0, v + (Math.random() - 0.5) * 0.05))), output: [0.95] });
  }
  for (const p of notEligiblePatterns) {
    samples.push({ input: p, output: [0.0] });
    samples.push({ input: p.map(v => Math.min(1, Math.max(0, v + (Math.random() - 0.5) * 0.05))), output: [0.05] });
  }
  for (const p of checkPatterns) {
    samples.push({ input: p, output: [0.5] });
    samples.push({ input: p.map(v => Math.min(1, Math.max(0, v + (Math.random() - 0.5) * 0.05))), output: [0.5] });
  }

  return samples;
}

// ── Build and train the neural network ────────────────────────────────────────

let model = null;
let modelReady = false;

async function buildAndTrainModel() {
  const trainingData = generateTrainingData();

  const xs = tf.tensor2d(trainingData.map(d => d.input));
  const ys = tf.tensor2d(trainingData.map(d => d.output));

  model = tf.sequential({
    layers: [
      tf.layers.dense({ inputShape: [17], units: 32, activation: "relu" }),
      tf.layers.dropout({ rate: 0.1 }),
      tf.layers.dense({ units: 16, activation: "relu" }),
      tf.layers.dense({ units: 1,  activation: "sigmoid" })
    ]
  });

  model.compile({ optimizer: tf.train.adam(0.01), loss: "meanSquaredError" });

  await model.fit(xs, ys, { epochs: 150, verbose: 0, shuffle: true });

  xs.dispose();
  ys.dispose();
  modelReady = true;
  console.log("[ML] Eligibility model trained and ready.");
}

// Train on startup
buildAndTrainModel().catch(err => console.error("[ML] Training failed:", err.message));

// ── ML predict ────────────────────────────────────────────────────────────────

async function mlPredict(features) {
  if (!modelReady) return null;
  const input   = tf.tensor2d([features]);
  const output  = model.predict(input);
  const [score] = await output.data();
  input.dispose();
  output.dispose();
  return score; // 0.0 → 1.0
}

// ── Main ML eligibility evaluator ─────────────────────────────────────────────

export async function evaluateWithML(profile, scholarship) {
  const features   = extractFeatures(profile, scholarship);
  const mlScore    = await mlPredict(features);

  // Feature names for explanation
  const featureNames = [
    "State", "Category", "Income", "Marks", "CourseLevel", "Gender",
    "Disability", "Minority", "DBT", "Documents", "Deadline",
    "Hosteler", "Orphan", "FirstGrad", "ProfileComplete", "NPCIMapping", "ParentProfession"
  ];

  // Identify which features are weak (< 0.5)
  const weakFeatures = features
    .map((v, i) => ({ name: featureNames[i], value: v }))
    .filter(f => f.value < 0.5);

  // Hard rule overrides (ML can't override clear disqualifiers)
  const hardFail = [];
  if (features[0] < 1) hardFail.push("State mismatch");
  if (features[1] < 1) hardFail.push("Category not eligible");
  if (features[2] < 0.3) hardFail.push("Income exceeds limit");
  if (features[3] < 0.5) hardFail.push("Marks below requirement");
  if (features[4] < 1 && scholarship.courseLevels?.length) hardFail.push("Course level mismatch");
  if (features[5] < 1 && scholarship.gender !== "Any") hardFail.push("Gender mismatch");
  if (features[16] < 1 && scholarship.parentProfession) hardFail.push("Parent profession mismatch");

  let status, confidence;
  const scorePercent = Math.round((mlScore ?? 0.5) * 100);

  if (hardFail.length > 0) {
    status     = "Not Eligible";
    confidence = Math.max(5, Math.round((1 - (mlScore ?? 0)) * 100));
  } else if (scorePercent >= 75) {
    status     = "Eligible";
    confidence = scorePercent;
  } else if (scorePercent >= 40) {
    status     = "Check";
    confidence = scorePercent;
  } else {
    status     = "Not Eligible";
    confidence = Math.max(5, scorePercent);
  }

  // Days until deadline
  let daysLeft = null;
  if (scholarship.deadline) {
    daysLeft = Math.ceil((new Date(scholarship.deadline) - new Date()) / 86400000);
  }

  // Missing documents
  const availableDocs = (profile?.availableDocuments || []).map(d => d.toLowerCase());
  const missingDocuments = (scholarship.requiredDocuments || []).filter(doc =>
    !availableDocs.some(a => a.includes(doc.toLowerCase().split("(")[0].trim()))
  );

  return {
    status,
    matchScore: confidence,
    mlScore: scorePercent,
    hardFail,
    weakFeatures: weakFeatures.map(f => f.name),
    missingDocuments,
    daysLeft,
    features: Object.fromEntries(featureNames.map((n, i) => [n, Math.round(features[i] * 100)]))
  };
}

// ── Batch evaluate ────────────────────────────────────────────────────────────

export async function evaluateAllWithML(profile, scholarships) {
  const results = await Promise.all(
    scholarships.map(async s => ({
      ...s,
      eligibility: await evaluateWithML(profile, s)
    }))
  );

  return results.sort((a, b) => {
    const rank = { Eligible: 0, Check: 1, "Not Eligible": 2 };
    return rank[a.eligibility.status] - rank[b.eligibility.status]
        || b.eligibility.matchScore - a.eligibility.matchScore;
  });
}

export function isModelReady() { return modelReady; }
