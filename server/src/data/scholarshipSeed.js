/**
 * Real NSP (scholarships.gov.in) + SSP Karnataka (ssp.karnataka.gov.in) scholarship seed
 * Academic year 2026-27 — application dates from NSP portal screenshots
 * Run: node scholarshipSeed.js  (from server root with .env loaded)
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import Scholarship from "../models/Scholarship.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

// ─── NSP Central Sector Schemes ──────────────────────────────────────────────
const NSP_SCHEMES = [
  // ── Ministry of Home Affairs ──
  {
    name: "PM Scholarship for Wards of States/UTs Police Personnel",
    provider: "Ministry of Home Affairs",
    ministry: "Ministry of Home Affairs",
    state: "All India",
    categories: ["General", "SC", "ST", "OBC", "EWS"],
    incomeLimit: 0,
    minMarks: 60,
    courseLevels: ["UG", "PG", "Diploma"],
    gender: "Any",
    disabilityRequired: false,
    amount: "₹36,000/year (Boys) | ₹30,000/year (Girls)",
    amountDetails: "₹3,000/month — 10 months per year",
    openDate: "2026-06-01",
    deadline: "2026-10-31",
    lastDateInstitute: "2026-11-15",
    applicationLink: "https://scholarships.gov.in",
    sourceUrl: "https://scholarships.gov.in/public/schemeGuidelines/mha_scheme_guidelines.pdf",
    status: "Active",
    requiredDocuments: [
      "Aadhaar Card",
      "Bank Passbook (Aadhaar Seeded)",
      "Domicile Certificate",
      "10th Marksheet",
      "12th Marksheet",
      "Death/Disability Certificate of Police Personnel",
      "Service Certificate of Police Personnel",
      "Income Certificate",
      "Fee Receipt",
      "Bonafide Certificate"
    ],
    description: "Scholarship for wards and widows of State/UT Police personnel who were killed or disabled in terrorist/Naxal attacks. Covers professional courses from 1st year onwards."
  },
  {
    name: "PM Scholarship for Central Armed Police Forces (CAPF) and Assam Rifles",
    provider: "Ministry of Home Affairs",
    ministry: "Ministry of Home Affairs",
    state: "All India",
    categories: ["General", "SC", "ST", "OBC", "EWS"],
    incomeLimit: 0,
    minMarks: 60,
    courseLevels: ["UG", "PG", "Diploma"],
    gender: "Any",
    disabilityRequired: false,
    amount: "₹36,000/year (Boys) | ₹30,000/year (Girls)",
    amountDetails: "₹3,000/month — 10 months per year",
    openDate: "2026-06-01",
    deadline: "2026-10-31",
    lastDateInstitute: "2026-11-15",
    applicationLink: "https://scholarships.gov.in",
    sourceUrl: "https://scholarships.gov.in/public/schemeGuidelines/mha_capf_guidelines.pdf",
    status: "Active",
    requiredDocuments: [
      "Aadhaar Card",
      "Bank Passbook (Aadhaar Seeded)",
      "Service Certificate of CAPF/AR Personnel",
      "Death/Disability Certificate",
      "10th Marksheet",
      "12th Marksheet",
      "Fee Receipt",
      "Bonafide Certificate",
      "Income Certificate"
    ],
    description: "Scholarship for wards and widows of CAPF (BSF, CRPF, CISF, ITBP, SSB, NSG) and Assam Rifles personnel. For those martyred, deceased in service, or disabled."
  },

  // ── AICTE ──
  {
    name: "AICTE Pragati Scholarship for Girls (Technical Education)",
    provider: "All India Council for Technical Education (AICTE)",
    ministry: "Ministry of Education",
    state: "All India",
    categories: ["General", "SC", "ST", "OBC", "EWS"],
    incomeLimit: 800000,
    minMarks: 0,
    courseLevels: ["UG", "Diploma"],
    gender: "Female",
    disabilityRequired: false,
    amount: "₹50,000/year",
    amountDetails: "Tuition fees up to ₹30,000 + ₹20,000 incidental charges",
    openDate: "2026-07-01",
    deadline: "2026-10-31",
    lastDateInstitute: "2026-11-15",
    applicationLink: "https://scholarships.gov.in",
    sourceUrl: "https://www.aicte-india.org/bureaus/dme/pragati-scholarship",
    status: "Active",
    requiredDocuments: [
      "Aadhaar Card",
      "Bank Passbook (Aadhaar Seeded)",
      "Income Certificate",
      "10th Marksheet",
      "12th Marksheet",
      "Current Year Fee Receipt",
      "Bonafide Certificate",
      "AICTE Approved College Certificate",
      "Caste Certificate (if applicable)"
    ],
    description: "Supports girl students pursuing technical education (BE/B.Tech/B.Arch/B.Pharm/Diploma) in AICTE-approved institutions. Family income below ₹8 lakh. Maximum 2 students per family."
  },
  {
    name: "AICTE Saksham Scholarship for Specially Abled Students",
    provider: "All India Council for Technical Education (AICTE)",
    ministry: "Ministry of Education",
    state: "All India",
    categories: ["General", "SC", "ST", "OBC", "EWS"],
    incomeLimit: 800000,
    minMarks: 0,
    courseLevels: ["UG", "Diploma"],
    gender: "Any",
    disabilityRequired: true,
    amount: "₹50,000/year",
    amountDetails: "Tuition fees up to ₹30,000 + ₹20,000 incidental charges",
    openDate: "2026-07-01",
    deadline: "2026-10-31",
    lastDateInstitute: "2026-11-15",
    applicationLink: "https://scholarships.gov.in",
    sourceUrl: "https://www.aicte-india.org/bureaus/dme/saksham-scholarship",
    status: "Active",
    requiredDocuments: [
      "Aadhaar Card",
      "Bank Passbook (Aadhaar Seeded)",
      "Income Certificate",
      "10th Marksheet",
      "12th Marksheet",
      "Disability Certificate (minimum 40% disability)",
      "Fee Receipt",
      "Bonafide Certificate",
      "AICTE Approved College Certificate"
    ],
    description: "Supports specially-abled students with at least 40% disability pursuing AICTE-approved technical courses. Family income below ₹8 lakh. Not for renewal if student fails."
  },

  // ── UGC ──
  {
    name: "Ishan Uday – Special Scholarship for North East India",
    provider: "University Grants Commission (UGC)",
    ministry: "Ministry of Education",
    state: "All India",
    categories: ["General", "SC", "ST", "OBC"],
    incomeLimit: 450000,
    minMarks: 0,
    courseLevels: ["UG"],
    gender: "Any",
    disabilityRequired: false,
    amount: "₹5,400–7,800/month",
    amountDetails: "Day Scholar: ₹5,400/month | Hosteller: ₹7,800/month",
    openDate: "2026-07-01",
    deadline: "2026-10-31",
    lastDateInstitute: "2026-11-30",
    applicationLink: "https://scholarships.gov.in",
    sourceUrl: "https://ugc.ac.in/page/Ishan-Uday.aspx",
    status: "Active",
    requiredDocuments: [
      "Aadhaar Card",
      "Bank Passbook (Aadhaar Seeded)",
      "Domicile Certificate of North East State",
      "12th Marksheet",
      "Income Certificate",
      "Bonafide Certificate",
      "Fee Receipt"
    ],
    description: "For students domiciled in North East states (Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura, Arunachal Pradesh) studying in UGC-recognized colleges/universities."
  },
  {
    name: "PG Scholarship for SC/ST Students – UGC",
    provider: "University Grants Commission (UGC)",
    ministry: "Ministry of Education",
    state: "All India",
    categories: ["SC", "ST"],
    incomeLimit: 0,
    minMarks: 55,
    courseLevels: ["PG"],
    gender: "Any",
    disabilityRequired: false,
    amount: "₹3,100/month (Science) | ₹2,000/month (Non-Science)",
    amountDetails: "Sciences/Engineering: ₹3,100/month | Humanities/Social Sciences: ₹2,000/month",
    openDate: "2026-07-01",
    deadline: "2026-10-31",
    lastDateInstitute: "2026-11-30",
    applicationLink: "https://scholarships.gov.in",
    sourceUrl: "https://ugc.ac.in/page/Scholarships-for-PG-students.aspx",
    status: "Active",
    requiredDocuments: [
      "Aadhaar Card",
      "Bank Passbook (Aadhaar Seeded)",
      "Caste Certificate",
      "UG Degree Certificate",
      "UG Marksheets",
      "Bonafide Certificate",
      "Fee Receipt",
      "Income Certificate"
    ],
    description: "Post-Graduate scholarships for SC/ST students admitted to regular full-time PG degree courses in universities/colleges. 55% marks in UG required."
  },

  // ── Department of Higher Education (CSSS) ──
  {
    name: "Central Sector Scheme of Scholarships for College and University Students (CSSS)",
    provider: "Department of Higher Education",
    ministry: "Ministry of Education",
    state: "All India",
    categories: ["General", "SC", "ST", "OBC", "EWS"],
    incomeLimit: 800000,
    minMarks: 80,
    courseLevels: ["UG", "PG"],
    gender: "Any",
    disabilityRequired: false,
    amount: "₹12,000/year (UG 1-3 yr) | ₹20,000/year (PG)",
    amountDetails: "UG Years 1–3: ₹10,000/year | UG Yr 4–5 (Professional): ₹20,000/year | PG: ₹20,000/year",
    openDate: "2026-06-01",
    deadline: "2026-10-31",
    lastDateInstitute: "2026-11-30",
    applicationLink: "https://scholarships.gov.in",
    sourceUrl: "https://scholarships.gov.in/public/schemeGuidelines/csss_guidelines.pdf",
    status: "Active",
    requiredDocuments: [
      "Aadhaar Card",
      "Bank Passbook (Aadhaar Seeded)",
      "12th Marksheet",
      "12th State Board Rank/Merit Certificate",
      "Income Certificate",
      "Bonafide Certificate",
      "Fee Receipt",
      "Caste Certificate (if applicable)"
    ],
    description: "Merit-cum-means scholarship for students scoring in top 20th percentile of their State Board in Class 12. Annual family income below ₹8 lakh. For studies in regular UG/PG courses (not distance/ODL)."
  },

  // ── Ministry of Labour & Employment ──
  {
    name: "Financial Assistance for Education of Wards of Beedi/Cine/IOMC/LSDM Workers",
    provider: "Ministry of Labour and Employment",
    ministry: "Ministry of Labour and Employment",
    state: "All India",
    categories: ["General", "SC", "ST", "OBC"],
    incomeLimit: 0,
    minMarks: 0,
    courseLevels: ["Pre-Matric", "Post-Matric", "UG", "PG"],
    gender: "Any",
    disabilityRequired: false,
    amount: "₹1,500–5,000/year",
    amountDetails: "Class 1–5: ₹1,500 | Class 6–8: ₹2,500 | Class 9–10: ₹3,500 | Class 11–12: ₹4,500 | UG/PG: ₹5,000",
    openDate: "2026-07-01",
    deadline: "2026-10-31",
    lastDateInstitute: "2026-11-15",
    applicationLink: "https://scholarships.gov.in",
    sourceUrl: "https://scholarships.gov.in/public/schemeGuidelines/mol_beedi_guidelines.pdf",
    status: "Active",
    requiredDocuments: [
      "Aadhaar Card",
      "Bank Passbook (Aadhaar Seeded)",
      "Beedi Worker Parent's Identity Card",
      "Income Certificate",
      "Marksheet of Previous Year",
      "Bonafide Certificate",
      "Fee Receipt"
    ],
    description: "For children of Beedi, Cine, Iron Ore Manganese & Chrome Ore Mines (IOMC), and Limestone & Dolomite Mines (LSDM) workers. No income limit — applicable as long as parent is registered worker."
  },

  // ── Dept of Social Justice & Empowerment (OBC) ──
  {
    name: "Post Matric Scholarship for OBC Students (Central – PMS-OBC)",
    provider: "Department of Social Justice & Empowerment",
    ministry: "Ministry of Social Justice and Empowerment",
    state: "All India",
    categories: ["OBC"],
    incomeLimit: 100000,
    minMarks: 0,
    courseLevels: ["Post-Matric", "UG", "PG", "Diploma"],
    gender: "Any",
    disabilityRequired: false,
    amount: "Maintenance + Tuition Fee (varies by course)",
    amountDetails: "Day Scholar: ₹4,200–5,000/year | Hosteller: ₹6,000–8,000/year | Tuition reimbursed as per course",
    openDate: "2026-07-01",
    deadline: "2026-11-30",
    lastDateInstitute: "2026-12-15",
    applicationLink: "https://scholarships.gov.in",
    sourceUrl: "https://scholarships.gov.in/public/schemeGuidelines/pms_obc_guidelines.pdf",
    status: "Active",
    requiredDocuments: [
      "Aadhaar Card",
      "Bank Passbook (Aadhaar Seeded)",
      "OBC Certificate (Non-Creamy Layer)",
      "Income Certificate (< ₹1 lakh)",
      "10th Marksheet",
      "Previous Year Marksheet",
      "Bonafide Certificate",
      "Fee Receipt",
      "Domicile Certificate"
    ],
    description: "Central government Post Matric scholarship for OBC students (Non-Creamy Layer) studying post-class 10. Family income must be below ₹1 lakh per annum. Covers tuition and maintenance."
  },

  // ── Dept of Social Justice & Empowerment (SC) ──
  {
    name: "Post Matric Scholarship for SC Students (PMS-SC)",
    provider: "Department of Social Justice & Empowerment",
    ministry: "Ministry of Social Justice and Empowerment",
    state: "All India",
    categories: ["SC"],
    incomeLimit: 250000,
    minMarks: 0,
    courseLevels: ["Post-Matric", "UG", "PG", "Diploma"],
    gender: "Any",
    disabilityRequired: false,
    amount: "Maintenance + Actual Tuition Fee",
    amountDetails: "Day Scholar: ₹5,900–12,500/year | Hosteller: ₹10,500–18,000/year | Full tuition fee reimbursed",
    openDate: "2026-07-01",
    deadline: "2026-11-30",
    lastDateInstitute: "2026-12-15",
    applicationLink: "https://scholarships.gov.in",
    sourceUrl: "https://scholarships.gov.in/public/schemeGuidelines/pms_sc_guidelines.pdf",
    status: "Active",
    requiredDocuments: [
      "Aadhaar Card",
      "Bank Passbook (Aadhaar Seeded)",
      "Caste Certificate (SC)",
      "Income Certificate",
      "10th Marksheet",
      "Previous Year Marksheet",
      "Bonafide Certificate",
      "Fee Receipt",
      "Domicile Certificate",
      "Hostel Certificate (if applicable)"
    ],
    description: "Central government Post Matric scholarship for SC students studying in recognized institutions. Family income up to ₹2.5 lakh. Covers full tuition and maintenance allowance."
  },

  // ── Ministry of Tribal Affairs ──
  {
    name: "Post Matric Scholarship for ST Students (PMS-ST)",
    provider: "Ministry of Tribal Affairs",
    ministry: "Ministry of Tribal Affairs",
    state: "All India",
    categories: ["ST"],
    incomeLimit: 250000,
    minMarks: 0,
    courseLevels: ["Post-Matric", "UG", "PG", "Diploma"],
    gender: "Any",
    disabilityRequired: false,
    amount: "Maintenance + Actual Tuition Fee",
    amountDetails: "Day Scholar: ₹5,900–12,500/year | Hosteller: ₹10,500–18,000/year | Full tuition fee reimbursed",
    openDate: "2026-07-01",
    deadline: "2026-11-30",
    lastDateInstitute: "2026-12-15",
    applicationLink: "https://scholarships.gov.in",
    sourceUrl: "https://scholarships.gov.in/public/schemeGuidelines/pms_st_guidelines.pdf",
    status: "Active",
    requiredDocuments: [
      "Aadhaar Card",
      "Bank Passbook (Aadhaar Seeded)",
      "Caste Certificate (ST)",
      "Income Certificate",
      "10th Marksheet",
      "Previous Year Marksheet",
      "Bonafide Certificate",
      "Fee Receipt",
      "Domicile Certificate",
      "Hostel Certificate (if applicable)"
    ],
    description: "Ministry of Tribal Affairs Post Matric scholarship for ST students. Family income up to ₹2.5 lakh. Applicable from Class 11 onwards. Covers full tuition and maintenance allowance at recognized institutions."
  },

  // ── Dept of Empowerment of Persons with Disabilities ──
  {
    name: "Post Matric Scholarship for Students with Disabilities",
    provider: "Department of Empowerment of Persons with Disabilities",
    ministry: "Ministry of Social Justice and Empowerment",
    state: "All India",
    categories: ["General", "SC", "ST", "OBC"],
    incomeLimit: 250000,
    minMarks: 0,
    courseLevels: ["Post-Matric", "UG", "PG", "Diploma"],
    gender: "Any",
    disabilityRequired: true,
    amount: "₹4,000–35,000/year",
    amountDetails: "Maintenance: ₹4,000–7,500/year | Reader Allowance: ₹2,000–4,000/year | Course fee reimbursed",
    openDate: "2026-07-01",
    deadline: "2026-10-31",
    lastDateInstitute: "2026-11-30",
    applicationLink: "https://scholarships.gov.in",
    sourceUrl: "https://scholarships.gov.in/public/schemeGuidelines/depd_guidelines.pdf",
    status: "Active",
    requiredDocuments: [
      "Aadhaar Card",
      "Bank Passbook (Aadhaar Seeded)",
      "Disability Certificate (minimum 40% from CMO/Government Hospital)",
      "Income Certificate",
      "10th Marksheet",
      "Previous Year Marksheet",
      "Bonafide Certificate",
      "Fee Receipt",
      "Caste Certificate (if applicable)"
    ],
    description: "For students with at least 40% disability. Provides maintenance allowance, reader allowance for visually impaired, and course fee reimbursement. Income limit ₹2.5 lakh per annum."
  },

  // ── Ministry of Minority Affairs ──
  {
    name: "Pre Matric Scholarship for Minority Students",
    provider: "Ministry of Minority Affairs",
    ministry: "Ministry of Minority Affairs",
    state: "All India",
    categories: ["Minority"],
    religion: ["Muslim", "Christian", "Sikh", "Buddhist", "Zoroastrian", "Jain"],
    incomeLimit: 100000,
    minMarks: 50,
    courseLevels: ["Pre-Matric"],
    gender: "Any",
    disabilityRequired: false,
    amount: "₹1,000–10,000/year",
    amountDetails: "Day Scholar Class 1–5: ₹1,000 | Class 6–8: ₹5,700 | Class 9–10: ₹8,400 | Hosteller extra ₹3,000",
    openDate: "2026-07-01",
    deadline: "2026-09-30",
    lastDateInstitute: "2026-10-15",
    applicationLink: "https://scholarships.gov.in",
    sourceUrl: "https://scholarships.gov.in/public/schemeGuidelines/moma_prematric_guidelines.pdf",
    status: "Active",
    requiredDocuments: [
      "Aadhaar Card",
      "Bank Passbook (Aadhaar Seeded)",
      "Income Certificate",
      "Religion/Minority Certificate",
      "Previous Year Marksheet",
      "Bonafide Certificate",
      "Fee Receipt"
    ],
    description: "Pre-Matric scholarship for minority community students (Muslim, Christian, Sikh, Buddhist, Zoroastrian, Jain). Family income below ₹1 lakh. At least 50% marks in previous exam."
  },
  {
    name: "Post Matric Scholarship for Minority Students",
    provider: "Ministry of Minority Affairs",
    ministry: "Ministry of Minority Affairs",
    state: "All India",
    categories: ["Minority"],
    religion: ["Muslim", "Christian", "Sikh", "Buddhist", "Zoroastrian", "Jain"],
    incomeLimit: 200000,
    minMarks: 50,
    courseLevels: ["Post-Matric", "UG", "PG", "Diploma"],
    gender: "Any",
    disabilityRequired: false,
    amount: "₹5,000–20,000/year",
    amountDetails: "Maintenance: ₹5,000–7,500/year | Course Fee: Up to ₹20,000/year | Hostel: ₹10,000 extra",
    openDate: "2026-07-01",
    deadline: "2026-10-31",
    lastDateInstitute: "2026-11-30",
    applicationLink: "https://scholarships.gov.in",
    sourceUrl: "https://scholarships.gov.in/public/schemeGuidelines/moma_postmatric_guidelines.pdf",
    status: "Active",
    requiredDocuments: [
      "Aadhaar Card",
      "Bank Passbook (Aadhaar Seeded)",
      "Income Certificate",
      "Religion/Minority Certificate",
      "10th Marksheet",
      "Previous Year Marksheet",
      "Bonafide Certificate",
      "Fee Receipt",
      "Hostel Certificate (if applicable)"
    ],
    description: "Post-Matric scholarship for minority students from Class 11 onwards. Family income below ₹2 lakh. Covers tuition and maintenance. At least 50% marks required."
  },
  {
    name: "Merit-cum-Means Scholarship for Professional and Technical Courses (Minority)",
    provider: "Ministry of Minority Affairs",
    ministry: "Ministry of Minority Affairs",
    state: "All India",
    categories: ["Minority"],
    religion: ["Muslim", "Christian", "Sikh", "Buddhist", "Zoroastrian", "Jain"],
    incomeLimit: 250000,
    minMarks: 50,
    courseLevels: ["UG", "PG"],
    gender: "Any",
    disabilityRequired: false,
    amount: "₹20,000–30,000/year",
    amountDetails: "Course Fees: ₹20,000/year | Maintenance: ₹10,000/year",
    openDate: "2026-07-01",
    deadline: "2026-10-31",
    lastDateInstitute: "2026-11-30",
    applicationLink: "https://scholarships.gov.in",
    sourceUrl: "https://scholarships.gov.in/public/schemeGuidelines/moma_mcm_guidelines.pdf",
    status: "Active",
    requiredDocuments: [
      "Aadhaar Card",
      "Bank Passbook (Aadhaar Seeded)",
      "Income Certificate",
      "Religion/Minority Certificate",
      "12th Marksheet",
      "Previous Year Marksheet",
      "Bonafide Certificate",
      "Fee Receipt",
      "Admission Letter"
    ],
    description: "For minority students in technical/professional courses (Engineering, Medicine, MBA, MCA, etc.) from NAAC A-graded or NIRF-ranked institutions. Family income below ₹2.5 lakh."
  },

  // ── Ministry of New & Renewable Energy ──
  {
    name: "National Scholarship for Higher Education of ST Students – MNRE",
    provider: "Ministry of New and Renewable Energy",
    ministry: "Ministry of New and Renewable Energy",
    state: "All India",
    categories: ["ST"],
    incomeLimit: 200000,
    minMarks: 60,
    courseLevels: ["UG", "Diploma"],
    gender: "Any",
    disabilityRequired: false,
    amount: "₹15,000/year",
    amountDetails: "₹15,000 per year for renewable energy courses",
    openDate: "2026-07-01",
    deadline: "2026-10-31",
    lastDateInstitute: "2026-11-30",
    applicationLink: "https://scholarships.gov.in",
    sourceUrl: "https://scholarships.gov.in",
    status: "Active",
    requiredDocuments: [
      "Aadhaar Card",
      "Bank Passbook (Aadhaar Seeded)",
      "Caste Certificate (ST)",
      "Income Certificate",
      "12th Marksheet",
      "Bonafide Certificate",
      "Fee Receipt"
    ],
    description: "Scholarship for ST students pursuing higher education in renewable energy and related technical fields. Promotes green energy literacy among tribal students."
  }
];

// ─── SSP Karnataka Schemes ────────────────────────────────────────────────────
const SSP_KARNATAKA_SCHEMES = [
  {
    name: "SSP Post Matric Scholarship for SC Students – Karnataka",
    provider: "Karnataka State Scholarship Portal (SSP)",
    ministry: "Department of Social Welfare, Karnataka",
    state: "Karnataka",
    categories: ["SC"],
    incomeLimit: 250000,
    minMarks: 0,
    courseLevels: ["Post-Matric", "UG", "PG", "Diploma", "ITI"],
    gender: "Any",
    disabilityRequired: false,
    amount: "Tuition Fee + Maintenance (varies)",
    amountDetails: "Maintenance: ₹5,900–18,000/year | Full Tuition Reimbursed | Books/Stationery: ₹2,000",
    openDate: "2026-07-15",
    deadline: "2026-11-30",
    lastDateInstitute: "2026-12-15",
    applicationLink: "https://ssp.karnataka.gov.in",
    sourceUrl: "https://ssp.karnataka.gov.in/deptDashboard.do",
    status: "Active",
    requiredDocuments: [
      "Aadhaar Card",
      "Bank Passbook (Aadhaar Seeded, Karnataka Bank preferred)",
      "Caste Certificate (SC) – from Karnataka Tahsildar",
      "Income Certificate – from Karnataka Tahsildar",
      "10th Marksheet",
      "Previous Year Marksheet",
      "Bonafide Certificate",
      "Current Year Fee Receipt",
      "Domicile Certificate (Karnataka)",
      "Hostel Certificate (if applicable)"
    ],
    description: "Karnataka SSP Post Matric scholarship for SC students. Apply at ssp.karnataka.gov.in. Requires Karnataka domicile. Full tuition + maintenance. Also covers Books/Stationery grant."
  },
  {
    name: "SSP Post Matric Scholarship for ST Students – Karnataka",
    provider: "Karnataka State Scholarship Portal (SSP)",
    ministry: "Department of Tribal Welfare, Karnataka",
    state: "Karnataka",
    categories: ["ST"],
    incomeLimit: 250000,
    minMarks: 0,
    courseLevels: ["Post-Matric", "UG", "PG", "Diploma", "ITI"],
    gender: "Any",
    disabilityRequired: false,
    amount: "Tuition Fee + Maintenance (varies)",
    amountDetails: "Maintenance: ₹5,900–18,000/year | Full Tuition Reimbursed | Books/Stationery: ₹2,000",
    openDate: "2026-07-15",
    deadline: "2026-11-30",
    lastDateInstitute: "2026-12-15",
    applicationLink: "https://ssp.karnataka.gov.in",
    sourceUrl: "https://ssp.karnataka.gov.in/deptDashboard.do",
    status: "Active",
    requiredDocuments: [
      "Aadhaar Card",
      "Bank Passbook (Aadhaar Seeded)",
      "Caste Certificate (ST) – from Karnataka Tahsildar",
      "Income Certificate – from Karnataka Tahsildar",
      "10th Marksheet",
      "Previous Year Marksheet",
      "Bonafide Certificate",
      "Current Year Fee Receipt",
      "Domicile Certificate (Karnataka)",
      "Hostel Certificate (if applicable)"
    ],
    description: "Karnataka SSP Post Matric scholarship for ST students from Karnataka. Apply at ssp.karnataka.gov.in. Covers full tuition and maintenance allowance."
  },
  {
    name: "SSP Post Matric Scholarship for OBC Students – Karnataka",
    provider: "Karnataka State Scholarship Portal (SSP)",
    ministry: "Department of Backward Classes Welfare, Karnataka",
    state: "Karnataka",
    categories: ["OBC"],
    incomeLimit: 100000,
    minMarks: 0,
    courseLevels: ["Post-Matric", "UG", "PG", "Diploma", "ITI"],
    gender: "Any",
    disabilityRequired: false,
    amount: "₹4,200–10,500/year",
    amountDetails: "Day Scholar: ₹4,200–5,000/year | Hosteller: ₹7,500–10,500/year | Tuition up to ₹10,000",
    openDate: "2026-07-15",
    deadline: "2026-11-30",
    lastDateInstitute: "2026-12-15",
    applicationLink: "https://ssp.karnataka.gov.in",
    sourceUrl: "https://ssp.karnataka.gov.in/deptDashboard.do",
    status: "Active",
    requiredDocuments: [
      "Aadhaar Card",
      "Bank Passbook (Aadhaar Seeded)",
      "OBC Certificate (Karnataka) – Non-Creamy Layer",
      "Income Certificate – below ₹1 lakh",
      "10th Marksheet",
      "Previous Year Marksheet",
      "Bonafide Certificate",
      "Fee Receipt",
      "Domicile Certificate (Karnataka)"
    ],
    description: "Karnataka SSP OBC Post Matric scholarship. Non-creamy layer OBC students with family income below ₹1 lakh. Apply at ssp.karnataka.gov.in. Covers tuition and maintenance."
  },
  {
    name: "Sanchi Honnamma Scholarship for Economically Backward Girls – Karnataka",
    provider: "Karnataka State Scholarship Portal (SSP)",
    ministry: "Department of Women and Child Development, Karnataka",
    state: "Karnataka",
    categories: ["General", "OBC"],
    incomeLimit: 150000,
    minMarks: 0,
    courseLevels: ["Post-Matric", "UG", "PG"],
    gender: "Female",
    disabilityRequired: false,
    amount: "₹5,000–10,000/year",
    amountDetails: "₹5,000 for Class 11-12 | ₹7,500 for Diploma/ITI | ₹10,000 for UG/PG",
    openDate: "2026-07-15",
    deadline: "2026-11-30",
    lastDateInstitute: "2026-12-15",
    applicationLink: "https://ssp.karnataka.gov.in",
    sourceUrl: "https://ssp.karnataka.gov.in/deptDashboard.do",
    status: "Active",
    requiredDocuments: [
      "Aadhaar Card",
      "Bank Passbook (Aadhaar Seeded)",
      "Income Certificate – below ₹1.5 lakh",
      "10th Marksheet",
      "Previous Year Marksheet",
      "Bonafide Certificate",
      "Fee Receipt",
      "Domicile Certificate (Karnataka)",
      "Category Certificate (if applicable)"
    ],
    description: "Karnataka scholarship named after poet Sanchi Honnamma for economically backward girls. Family income below ₹1.5 lakh. For girls pursuing higher education in Karnataka institutions."
  },
  {
    name: "Rajiv Gandhi National Fellowship (State – SC/ST) – Karnataka",
    provider: "Karnataka State Scholarship Portal (SSP)",
    ministry: "Department of Social Welfare, Karnataka",
    state: "Karnataka",
    categories: ["SC", "ST"],
    incomeLimit: 0,
    minMarks: 55,
    courseLevels: ["PG", "Ph.D", "M.Phil"],
    gender: "Any",
    disabilityRequired: false,
    amount: "₹25,000–28,000/month",
    amountDetails: "Junior Research Fellow: ₹25,000/month | Senior Research Fellow: ₹28,000/month | HRA + Contingency extra",
    openDate: "2026-07-01",
    deadline: "2026-10-31",
    lastDateInstitute: "2026-11-30",
    applicationLink: "https://ssp.karnataka.gov.in",
    sourceUrl: "https://ssp.karnataka.gov.in/deptDashboard.do",
    status: "Active",
    requiredDocuments: [
      "Aadhaar Card",
      "Bank Passbook (Aadhaar Seeded)",
      "Caste Certificate (SC/ST)",
      "UG and PG Marksheets",
      "Research Proposal Letter from University",
      "Guide/Supervisor Certificate",
      "Bonafide Certificate",
      "NET/SLET Scorecard (if available)"
    ],
    description: "Research fellowship for SC/ST students pursuing M.Phil/Ph.D. in recognized universities in Karnataka. No income limit. 55% marks in PG required. Covers stipend + HRA + contingency."
  },
  {
    name: "Vidyasiri Scholarship for Economically Backward Students – Karnataka",
    provider: "Karnataka State Scholarship Portal (SSP)",
    ministry: "Department of Backward Classes Welfare, Karnataka",
    state: "Karnataka",
    categories: ["EWS", "General"],
    incomeLimit: 100000,
    minMarks: 50,
    courseLevels: ["UG", "Diploma"],
    gender: "Any",
    disabilityRequired: false,
    amount: "₹5,000–10,000/year",
    amountDetails: "₹5,000 for Diploma | ₹7,500 for UG Arts/Commerce/Science | ₹10,000 for Engineering/Medical",
    openDate: "2026-07-15",
    deadline: "2026-11-30",
    lastDateInstitute: "2026-12-15",
    applicationLink: "https://ssp.karnataka.gov.in",
    sourceUrl: "https://ssp.karnataka.gov.in/deptDashboard.do",
    status: "Active",
    requiredDocuments: [
      "Aadhaar Card",
      "Bank Passbook (Aadhaar Seeded)",
      "Income Certificate – below ₹1 lakh",
      "EWS Certificate (if General category)",
      "10th Marksheet",
      "12th Marksheet",
      "Bonafide Certificate",
      "Fee Receipt",
      "Domicile Certificate (Karnataka)"
    ],
    description: "Karnataka Vidyasiri scholarship for economically backward students who do not qualify for SC/ST/OBC schemes. Family income below ₹1 lakh. 50% marks in previous exam required."
  },
  {
    name: "Karnataka SC/ST Overseas Scholarship",
    provider: "Karnataka State Scholarship Portal (SSP)",
    ministry: "Department of Social Welfare, Karnataka",
    state: "Karnataka",
    categories: ["SC", "ST"],
    incomeLimit: 600000,
    minMarks: 60,
    courseLevels: ["PG", "Ph.D"],
    gender: "Any",
    disabilityRequired: false,
    amount: "Up to ₹25 lakh",
    amountDetails: "Tuition + Living expenses + Travel (up to ₹25 lakh total) for 2-year course",
    openDate: "2026-07-01",
    deadline: "2026-09-30",
    lastDateInstitute: "2026-10-15",
    applicationLink: "https://ssp.karnataka.gov.in",
    sourceUrl: "https://ssp.karnataka.gov.in/deptDashboard.do",
    status: "Active",
    requiredDocuments: [
      "Aadhaar Card",
      "Bank Passbook",
      "Caste Certificate (SC/ST)",
      "Income Certificate",
      "UG Degree Certificate",
      "UG Marksheets",
      "Admission Letter from Foreign University",
      "Passport",
      "Domicile Certificate (Karnataka)"
    ],
    description: "Overseas scholarship for Karnataka SC/ST students to pursue PG/Ph.D in top foreign universities. Family income below ₹6 lakh. Age limit 35 years. Up to ₹25 lakh for 2-year program."
  },
  {
    name: "Fee Concession for SC/ST/OBC Students – Government Colleges Karnataka",
    provider: "Karnataka State Scholarship Portal (SSP)",
    ministry: "Higher Education Department, Karnataka",
    state: "Karnataka",
    categories: ["SC", "ST", "OBC"],
    incomeLimit: 250000,
    minMarks: 0,
    courseLevels: ["UG", "PG", "Diploma"],
    gender: "Any",
    disabilityRequired: false,
    amount: "100% Fee Waiver",
    amountDetails: "Full tuition fee waiver at Government/Aided colleges in Karnataka",
    openDate: "2026-07-01",
    deadline: "2026-10-31",
    lastDateInstitute: "2026-11-30",
    applicationLink: "https://ssp.karnataka.gov.in",
    sourceUrl: "https://ssp.karnataka.gov.in/deptDashboard.do",
    status: "Active",
    requiredDocuments: [
      "Aadhaar Card",
      "Caste Certificate",
      "Income Certificate",
      "10th Marksheet",
      "Bonafide Certificate",
      "Admission Proof"
    ],
    description: "Complete fee concession for SC/ST/OBC students studying in Government and Government-Aided colleges in Karnataka. Applied directly at college level — submit documents to college office."
  }
];

// ─── Seed function ─────────────────────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/scholarsense");
    console.log("✓ Connected to MongoDB");

    // Remove only existing seeded records (keep any manually added ones)
    const deleted = await Scholarship.deleteMany({
      applicationLink: { $in: ["https://scholarships.gov.in", "https://ssp.karnataka.gov.in"] }
    });
    console.log(`✓ Removed ${deleted.deletedCount} old seeded records`);

    const all = [...NSP_SCHEMES, ...SSP_KARNATAKA_SCHEMES];
    const inserted = await Scholarship.insertMany(all, { ordered: false });
    console.log(`✓ Inserted ${inserted.length} scholarships`);
    console.log(`  → NSP Central: ${NSP_SCHEMES.length}`);
    console.log(`  → SSP Karnataka: ${SSP_KARNATAKA_SCHEMES.length}`);

    // Summary
    console.log("\n── Seeded Scholarships ──────────────────────────────");
    inserted.forEach((s, i) => console.log(`  ${i + 1}. ${s.name} [${s.state}]`));

    await mongoose.disconnect();
    console.log("\n✓ Done — seed complete");
    process.exit(0);
  } catch (err) {
    console.error("✗ Seed failed:", err.message);
    process.exit(1);
  }
}

seed();
