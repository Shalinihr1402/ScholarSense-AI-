import { createHash, randomUUID } from "crypto";
import { logDocumentUpload, logDocumentDelete } from "../services/auditService.js";
import { readFile, unlink } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { readJsonArray, writeJsonAtomic } from "../utils/atomicJson.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const archiver = require("archiver");
import Document from "../models/Document.js";
import Scholarship from "../models/Scholarship.js";
import { getAllLocalScholarships } from "../services/localScholarshipStore.js";
import { crossValidateDocuments, extractFieldsByDocumentType, extractTextFromImage, verifyDocumentType } from "../services/ocrAnalysisService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_STORE = path.resolve(__dirname, "../../data/documents.local.json");

// ── helpers ──────────────────────────────────────────────────────────────────

function getUserId(req) {
  return req.user.id || req.user._id?.toString();
}

function computeHash(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function readLocalDocs() {
  return readJsonArray(LOCAL_STORE);
}

async function writeLocalDocs(docs) {
  await writeJsonAtomic(LOCAL_STORE, docs);
}

const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];

async function runOcrExtraction(filePath, mimeType, documentType) {
  if (!IMAGE_MIMES.includes(mimeType)) return { fields: null, confidence: null, verification: { verified: true }, ocrFailed: false };
  try {
    const { text, confidence } = await extractTextFromImage(filePath);
    const verification = verifyDocumentType(text, documentType);
    const fields = verification.verified ? extractFieldsByDocumentType(text, documentType) : null;
    return { fields, confidence, verification, ocrFailed: false };
  } catch {
    // OCR crashed — mark as unverified so caller can decide what to do
    return { fields: null, confidence: null, verification: { verified: false, warning: null }, ocrFailed: true };
  }
}

async function updateLocalDocFields(fileHash, documentType, userId, extractedFields, ocrConfidence) {
  const docs = await readLocalDocs();
  const idx = docs.findIndex(d => d.fileHash === fileHash && d.documentType === documentType && d.userId === userId);
  if (idx >= 0) {
    docs[idx].extractedFields = extractedFields;
    docs[idx].ocrConfidence = ocrConfidence;
    await writeLocalDocs(docs);
  }
}

// ── controllers ───────────────────────────────────────────────────────────────

export async function uploadDocument(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const userId = getUserId(req);
    const { documentType = "Other" } = req.body;
    const fileBuffer = await readFile(req.file.path);
    const fileHash = computeHash(fileBuffer);

    const isMongo = Document.db.readyState === 1;

    if (isMongo) {
      // Duplicate = same file content AND same document type
      const existing = await Document.findOne({ userId, fileHash, documentType });
      if (existing) {
        await unlink(req.file.path).catch(() => {});
        return res.status(200).json({
          message: "This file was already uploaded under this document type.",
          document: existing,
          duplicate: true
        });
      }

      const doc = await Document.create({
        userId,
        originalName: req.file.originalname,
        documentType,
        filePath: req.file.path,
        fileHash,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      });

      // Run OCR — verify type BEFORE keeping the document
      const ocr = await runOcrExtraction(req.file.path, req.file.mimetype, documentType);

      if (!ocr.ocrFailed && ocr.verification && !ocr.verification.verified) {
        await unlink(req.file.path).catch(() => {});
        await doc.deleteOne();
        return res.status(422).json({
          message: ocr.verification.warning || `This does not look like a ${documentType}. Please upload the correct document.`,
          wrongDocument: true
        });
      }

      if (ocr?.fields) {
        await Document.findByIdAndUpdate(doc._id, {
          extractedFields: ocr.fields,
          ocrConfidence: ocr.confidence,
          ocrVerified: true
        });
        doc.extractedFields = ocr.fields;
        doc.ocrConfidence = ocr.confidence;
      }

      logDocumentUpload(userId, documentType, req.file.originalname).catch(() => {});
      return res.status(201).json({ document: doc, duplicate: false });
    }

    // JSON fallback when MongoDB is not connected
    const docs = await readLocalDocs();
    const existing = docs.find(d => d.userId === userId && d.fileHash === fileHash && d.documentType === documentType);
    if (existing) {
      await unlink(req.file.path).catch(() => {});
      return res.status(200).json({ message: "Already uploaded under this document type.", document: existing, duplicate: true });
    }

    const doc = {
      id: randomUUID(),
      userId,
      originalName: req.file.originalname,
      documentType,
      filePath: req.file.path,
      fileHash,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      createdAt: new Date().toISOString(),
      extractedFields: null,
      ocrConfidence: null
    };

    // Run OCR now — verify document type BEFORE saving
    const ocr = await runOcrExtraction(req.file.path, req.file.mimetype, documentType);

    // Block wrong document — if OCR read something but type doesn't match, reject
    if (!ocr.ocrFailed && ocr.verification && !ocr.verification.verified) {
      await unlink(req.file.path).catch(() => {});
      return res.status(422).json({
        message: ocr.verification.warning || `This does not look like a ${documentType}. Please upload the correct document.`,
        wrongDocument: true
      });
    }

    if (ocr?.fields) {
      doc.extractedFields = ocr.fields;
      doc.ocrConfidence = ocr.confidence;
    }

    docs.push(doc);
    await writeLocalDocs(docs);
    logDocumentUpload(userId, documentType, req.file.originalname).catch(() => {});
    return res.status(201).json({ document: doc, duplicate: false });

  } catch (error) {
    next(error);
  }
}

export async function listMyDocuments(req, res, next) {
  try {
    const userId = getUserId(req);

    if (Document.db.readyState === 1) {
      const docs = await Document.find({ userId }).sort({ createdAt: -1 }).lean();
      return res.json({ documents: docs });
    }

    const all = await readLocalDocs();
    return res.json({ documents: all.filter(d => d.userId === userId) });

  } catch (error) {
    next(error);
  }
}

export async function getRiskReport(req, res, next) {
  try {
    const userId = getUserId(req);
    let docs;

    if (Document.db.readyState === 1) {
      docs = await Document.find({ userId }).lean();
    } else {
      const all = await readLocalDocs();
      docs = all.filter(d => d.userId === userId);
    }

    // For each document type, keep the most recently uploaded one
    const latestByType = {};
    for (const doc of docs) {
      const existing = latestByType[doc.documentType];
      if (!existing || new Date(doc.createdAt) > new Date(existing.createdAt)) {
        latestByType[doc.documentType] = doc;
      }
    }

    // Build extractedFields map by document type
    const extractedByType = {};
    for (const [type, doc] of Object.entries(latestByType)) {
      extractedByType[type] = doc.extractedFields || null;
    }

    const KEY_DOCS = ["Aadhaar Card", "Bank Passbook", "Income Certificate", "Marksheet", "Caste Certificate"];
    const report = crossValidateDocuments(extractedByType);

    res.json({
      report,
      uploadedTypes: Object.keys(latestByType),
      missingTypes: KEY_DOCS.filter(t => !latestByType[t]),
      documentDetails: Object.entries(latestByType).map(([type, doc]) => ({
        type,
        originalName: doc.originalName,
        uploadedAt: doc.createdAt,
        ocrConfidence: doc.ocrConfidence,
        extractedFields: doc.extractedFields
      }))
    });
  } catch (error) {
    next(error);
  }
}

// ── Document Kit: match user's docs against a scholarship's requiredDocuments ──

async function getUserDocs(userId) {
  if (Document.db?.readyState === 1) {
    return await Document.find({ userId }).lean();
  }
  const all = await readLocalDocs();
  return all.filter(d => d.userId === userId);
}

// ── Document Kit Matching Helper ──────────────────────────────────────────────
function matchRequiredDocuments(required, userDocs) {
  const matched = [];
  const missing = [];
  const usedDocIds = new Set();

  for (const reqDoc of required) {
    let foundDoc = userDocs.find(d => d.documentType === reqDoc && !usedDocIds.has(d._id?.toString() || d.id));

    if (!foundDoc) {
      foundDoc = userDocs.find(d => reqDoc.toLowerCase().includes(d.documentType.toLowerCase()) && !usedDocIds.has(d._id?.toString() || d.id));
    }

    if (!foundDoc) {
      foundDoc = userDocs.find(d => d.documentType.toLowerCase().includes(reqDoc.toLowerCase()) && !usedDocIds.has(d._id?.toString() || d.id));
    }

    if (!foundDoc) {
      const r = reqDoc.toLowerCase();
      let targetType = null;
      if (r.includes("caste") || r.includes("obc") || r.includes("minority") || r.includes("brahmin") || r.includes("religion")) targetType = "Caste Certificate";
      else if (r.includes("income")) targetType = "Income Certificate";
      else if (r.includes("bank") || r.includes("passbook")) targetType = "Bank Passbook";
      else if (r.includes("fee") || r.includes("receipt")) targetType = "Fee Receipt";
      else if (r.includes("bonafide") || r.includes("admission") || r.includes("allotment")) targetType = "Bonafide Certificate";
      else if (r.includes("disability") || r.includes("udid")) targetType = "Disability Certificate";
      else if (r.includes("domicile") || r.includes("residence")) targetType = "Domicile Certificate";
      else if (r.includes("marksheet") || r.includes("degree")) targetType = "Marksheet";
      else if (r.includes("aadhaar") || r.includes("aadhar")) targetType = "Aadhaar Card";

      if (targetType) {
        foundDoc = userDocs.find(d => d.documentType === targetType && !usedDocIds.has(d._id?.toString() || d.id));
      }
      
      if (!foundDoc && targetType === "Disability Certificate") {
        foundDoc = userDocs.find(d => d.documentType === "UDID Card" && !usedDocIds.has(d._id?.toString() || d.id));
      }
    }

    if (foundDoc) {
      usedDocIds.add(foundDoc._id?.toString() || foundDoc.id);
      matched.push({ type: reqDoc, doc: foundDoc, docId: foundDoc._id || foundDoc.id, originalName: foundDoc.originalName });
    } else {
      missing.push(reqDoc);
    }
  }

  return { matched, missing };
}

export async function getDocumentKit(req, res, next) {
  try {
    const userId = getUserId(req);
    const { scholarshipId } = req.params;

    let scholarship;
    if (Scholarship.db?.readyState === 1) {
      scholarship = await Scholarship.findById(scholarshipId).lean();
    }
    if (!scholarship) {
      const all = await getAllLocalScholarships();
      scholarship = all.find(s => s.id === scholarshipId || String(s._id) === scholarshipId);
    }
    if (!scholarship) return res.status(404).json({ message: "Scholarship not found." });

    const required = scholarship.requiredDocuments || [];
    const userDocs = await getUserDocs(userId);

    const { matched, missing } = matchRequiredDocuments(required, userDocs);

    res.json({
      scholarshipName: scholarship.name,
      applicationLink: scholarship.applicationLink,
      required,
      matched,
      missing,
      readyToApply: missing.length === 0
    });
  } catch (err) {
    next(err);
  }
}

export async function downloadBundle(req, res, next) {
  try {
    const userId = getUserId(req);
    const { scholarshipId } = req.params;

    let scholarship;
    if (Scholarship.db?.readyState === 1) {
      scholarship = await Scholarship.findById(scholarshipId).lean();
    }
    if (!scholarship) {
      const all = await getAllLocalScholarships();
      scholarship = all.find(s => s.id === scholarshipId || String(s._id) === scholarshipId);
    }
    if (!scholarship) return res.status(404).json({ message: "Scholarship not found." });

    const required = scholarship.requiredDocuments || [];
    const userDocs = await getUserDocs(userId);

    const { matched } = matchRequiredDocuments(required, userDocs);
    const toZip = matched.map(m => m.doc);
    if (toZip.length === 0) return res.status(404).json({ message: "No matching documents to bundle." });

    const zipName = `ScholarSense_ApplicationKit.zip`;
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);

    const archive = new archiver.ZipArchive({ zlib: { level: 6 } });
    archive.on("error", err => next(err));
    archive.pipe(res);

    for (const doc of toZip) {
      const ext = path.extname(doc.originalName) || "";
      archive.file(doc.filePath, { name: `${doc.documentType}${ext}` });
    }

    await archive.finalize();
  } catch (err) {
    next(err);
  }
}

export async function deleteDocument(req, res, next) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (Document.db.readyState === 1) {
      const doc = await Document.findOne({ _id: id, userId });
      if (!doc) return res.status(404).json({ message: "Document not found." });
      await unlink(doc.filePath).catch(() => {});
      await doc.deleteOne();
      logDocumentDelete(userId, doc.documentType).catch(() => {});
      return res.json({ message: "Document deleted." });
    }

    const docs = await readLocalDocs();
    // Match by UUID id first; fallback to matching by fileHash if id format changed
    const index = docs.findIndex(d => d.userId === userId && (d.id === id || d.fileHash === id));
    if (index === -1) return res.status(404).json({ message: "Document not found." });
    const deletedType = docs[index].documentType;
    await unlink(docs[index].filePath).catch(() => {});
    docs.splice(index, 1);
    await writeLocalDocs(docs);
    logDocumentDelete(userId, deletedType).catch(() => {});
    return res.json({ message: "Document deleted." });

  } catch (error) {
    next(error);
  }
}
