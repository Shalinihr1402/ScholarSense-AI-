/**
 * scholarshipMonitor.js
 * Scrapes NSP (scholarships.gov.in) and SSP Karnataka (ssp.karnataka.gov.in)
 * daily for real opening/closing dates.
 * If dates change → updates MongoDB → notifies all eligible students.
 */

import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import crypto from "crypto";
import path from "path";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import Scholarship from "../models/Scholarship.js";
import StudentProfile from "../models/StudentProfile.js";
import { getAllLocalScholarships } from "../services/localScholarshipStore.js";
import { createNotification, isDuplicateNotification } from "../services/notificationService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const LOCAL_PROFILES_PATH = path.resolve(__dirname, "../../data/profiles.local.json");
import { sendAdminAlert } from "../services/emailService.js";

puppeteer.use(StealthPlugin());

// ─── NSP schemes to monitor ───────────────────────────────────────────────────
// Each entry maps to a real scheme visible on scholarships.gov.in
const NSP_SCHEMES_TO_MONITOR = [
  { nameContains: "Post Matric Scholarship for SC",          ministry: "Social Justice" },
  { nameContains: "Post Matric Scholarship for ST",          ministry: "Tribal Affairs" },
  { nameContains: "Post Matric Scholarship for OBC",         ministry: "Social Justice" },
  { nameContains: "AICTE Pragati",                           ministry: "AICTE" },
  { nameContains: "AICTE Saksham",                           ministry: "AICTE" },
  { nameContains: "Central Sector Scheme",                   ministry: "Higher Education" },
  { nameContains: "PM Scholarship for Central Armed Police", ministry: "Home Affairs" },
  { nameContains: "PM Scholarship for Wards",               ministry: "Home Affairs" },
  { nameContains: "Post Matric Scholarship for Minority",    ministry: "Minority Affairs" },
  { nameContains: "Merit-cum-Means",                         ministry: "Minority Affairs" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hash(str) {
  return crypto.createHash("md5").update(str || "").digest("hex");
}

function parseIndianDate(str = "") {
  // Converts "31-10-2026" or "31/10/2026" → "2026-10-31"
  const m = str.trim().match(/(\d{2})[-\/](\d{2})[-\/](\d{4})/);
  if (!m) return "";
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

// ─── Launch browser (shared instance) ────────────────────────────────────────
async function launchBrowser() {
  return puppeteer.launch({
    headless: "new",
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1280,800"
    ]
  });
}

// ─── Scrape NSP scholarships.gov.in ──────────────────────────────────────────
async function scrapeNSP(browser) {
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36");
  await page.setViewport({ width: 1280, height: 800 });

  const results = [];

  try {
    console.log("[Monitor] Opening NSP portal…");
    await page.goto("https://scholarships.gov.in/public/schemeGuidelines/schemeList.action", {
      waitUntil: "networkidle2", timeout: 30000
    });

    // Wait for scheme table
    await page.waitForSelector("table", { timeout: 15000 }).catch(() => {});

    // Extract all scheme rows
    const schemes = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("table tr"));
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll("td")).map(td => td.innerText.trim());
        return cells;
      }).filter(c => c.length >= 3);
    });

    for (const row of schemes) {
      const schemeName = row[0] || row[1] || "";
      const openDateRaw = row.find(c => c.match(/\d{2}[-\/]\d{2}[-\/]\d{4}/)) || "";

      for (const target of NSP_SCHEMES_TO_MONITOR) {
        if (schemeName.toLowerCase().includes(target.nameContains.toLowerCase())) {
          // Try to find open and close dates from the row
          const dates = row.filter(c => c.match(/\d{2}[-\/]\d{2}[-\/]\d{4}/));
          results.push({
            name: schemeName,
            ministry: target.ministry,
            openDate: parseIndianDate(dates[0] || ""),
            deadline: parseIndianDate(dates[1] || ""),
            source: "NSP"
          });
          break;
        }
      }
    }

    // Fallback: scrape the main scheme listing page
    if (results.length === 0) {
      console.log("[Monitor] Table scrape failed, trying scheme cards…");
      const cards = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".scheme-card, .schemeBox, [class*='scheme']")).map(el => ({
          name: el.querySelector("h3,h4,.scheme-name")?.innerText?.trim() || "",
          dates: el.innerText
        }));
      });

      for (const card of cards) {
        const dates = card.dates.match(/\d{2}[-\/]\d{2}[-\/]\d{4}/g) || [];
        for (const target of NSP_SCHEMES_TO_MONITOR) {
          if (card.name.toLowerCase().includes(target.nameContains.toLowerCase())) {
            results.push({
              name: card.name,
              ministry: target.ministry,
              openDate: parseIndianDate(dates[0] || ""),
              deadline: parseIndianDate(dates[1] || ""),
              source: "NSP"
            });
          }
        }
      }
    }

    console.log(`[Monitor] NSP: found ${results.length} scheme date(s)`);
  } catch (err) {
    console.error("[Monitor] NSP scrape error:", err.message);
  } finally {
    await page.close();
  }

  return results;
}

// ─── Scrape SSP Karnataka ssp.karnataka.gov.in ────────────────────────────────
async function scrapeSSP(browser) {
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36");
  await page.setViewport({ width: 1280, height: 800 });

  const results = [];

  try {
    console.log("[Monitor] Opening SSP Karnataka portal…");
    await page.goto("https://ssp.karnataka.gov.in/deptDashboard.do", {
      waitUntil: "networkidle2", timeout: 30000
    });

    await page.waitForSelector("body", { timeout: 10000 }).catch(() => {});

    const pageText = await page.evaluate(() => document.body.innerText);

    // Look for date patterns near scholarship keywords
    const lines = pageText.split("\n").map(l => l.trim()).filter(Boolean);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes("scholarship") || line.includes("post matric") || line.includes("fee concession")) {
        // Scan surrounding lines for dates
        const context = lines.slice(Math.max(0, i - 2), i + 5).join(" ");
        const dates = context.match(/\d{2}[-\/]\d{2}[-\/]\d{4}/g) || [];
        if (dates.length >= 1) {
          results.push({
            name: lines[i],
            ministry: "SSP Karnataka",
            openDate: parseIndianDate(dates[0] || ""),
            deadline: parseIndianDate(dates[1] || dates[0] || ""),
            source: "SSP"
          });
        }
      }
    }

    console.log(`[Monitor] SSP: found ${results.length} scheme date(s)`);
  } catch (err) {
    console.error("[Monitor] SSP scrape error:", err.message);
  } finally {
    await page.close();
  }

  return results;
}

// ─── Compare scraped dates with DB and update if changed ─────────────────────
async function syncDatesToDB(scrapedSchemes) {
  const changed = [];

  for (const scraped of scrapedSchemes) {
    if (!scraped.deadline && !scraped.openDate) continue;

    // Find matching scholarship in DB by name similarity
    const dbScheme = await Scholarship.findOne({
      name: { $regex: scraped.name.slice(0, 30), $options: "i" }
    });

    if (!dbScheme) continue;

    const oldHash = hash(`${dbScheme.openDate}|${dbScheme.deadline}`);
    const newHash = hash(`${scraped.openDate}|${scraped.deadline}`);

    if (oldHash !== newHash) {
      // Dates changed — update DB
      await Scholarship.findByIdAndUpdate(dbScheme._id, {
        $set: {
          openDate: scraped.openDate || dbScheme.openDate,
          deadline: scraped.deadline || dbScheme.deadline,
          status: "Active"
        }
      });

      changed.push({
        name: dbScheme.name,
        oldDeadline: dbScheme.deadline,
        newDeadline: scraped.deadline,
        oldOpen: dbScheme.openDate,
        newOpen: scraped.openDate
      });

      console.log(`[Monitor] Updated: "${dbScheme.name}" deadline ${dbScheme.deadline} → ${scraped.deadline}`);
    }
  }

  return changed;
}

// ─── Load all student profiles (MongoDB + local JSON fallback) ────────────────
async function loadAllProfiles() {
  const profiles = [];

  // 1. MongoDB profiles
  try {
    if (StudentProfile.db?.readyState === 1) {
      const mongoProfiles = await StudentProfile.find({}).lean();
      profiles.push(...mongoProfiles);
    }
  } catch (err) {
    console.error("[Monitor] MongoDB profile fetch error:", err.message);
  }

  // 2. Local JSON profiles (dev fallback) — array format
  try {
    const raw = await readFile(LOCAL_PROFILES_PATH, "utf8").catch(() => "[]");
    const localArr = JSON.parse(raw);
    if (Array.isArray(localArr)) {
      for (const profile of localArr) {
        const uid = profile.userId || profile.id;
        const alreadyLoaded = profiles.some(p => p.userId?.toString() === uid);
        if (!alreadyLoaded) {
          profiles.push({ ...profile, userId: uid });
        }
      }
    }
  } catch (err) {
    console.error("[Monitor] Local profile load error:", err.message);
  }

  console.log(`[Monitor] Loaded ${profiles.length} student profile(s) for notification check`);
  return profiles;
}

// ─── Notify all eligible students about deadline ──────────────────────────────
async function notifyEligibleStudents(scholarship) {
  const days = daysUntil(scholarship.deadline);
  if (days === null || days < 0) return 0;

  const profiles = await loadAllProfiles();
  if (profiles.length === 0) {
    console.log("[Monitor] No student profiles found — skipping notifications");
    return 0;
  }

  let notified = 0;

  for (const profile of profiles) {
    // Basic eligibility check before notifying
    const cat = (profile.category || "").toUpperCase();
    const schemeCats = scholarship.categories.map(c => c.toUpperCase());
    const income = Number(profile.annualIncome) || 0;
    const incomeLimit = Number(scholarship.incomeLimit) || 0;

    const catMatch = schemeCats.includes("GENERAL") ||
                     schemeCats.some(c => cat.includes(c)) ||
                     scholarship.name.toLowerCase().includes("minority") && profile.minorityStatus === "Yes";

    const incomeMatch = incomeLimit === 0 || !income || income <= incomeLimit;
    const stateMatch  = scholarship.state === "All India" ||
                        scholarship.state.toLowerCase() === (profile.state || "").toLowerCase();

    if (!catMatch || !incomeMatch || !stateMatch) {
      console.log(`[Monitor]   skip ${profile.userId}: cat="${cat}" catMatch=${catMatch} income=${income}/${incomeLimit} incomeMatch=${incomeMatch} state="${profile.state}" stateMatch=${stateMatch}`);
      continue;
    }

    const userId   = profile.userId?.toString();
    const dedupKey = `deadline_${scholarship._id}_${days}d`;

    console.log(`[Monitor]   eligible ${userId?.slice(0,8)} — checking dedup key="${dedupKey.slice(0,50)}"`);
    const isDup = await isDuplicateNotification(userId, dedupKey, 6);
    console.log(`[Monitor]   isDup=${isDup}`);
    if (isDup) continue;

    let priority = "medium";
    let urgencyTag = "";

    if (days <= 1)        { priority = "critical"; urgencyTag = "🚨 LAST DAY — "; }
    else if (days <= 7)   { priority = "high";     urgencyTag = "🔴 URGENT — "; }
    else if (days <= 15)  { priority = "high";     urgencyTag = "⚠️ "; }
    else if (days <= 30)  { priority = "medium";   urgencyTag = "📅 "; }
    else if (days <= 60)  { priority = "medium";   urgencyTag = "📢 Coming up — "; }
    else if (days <= 120) { priority = "low";       urgencyTag = "🗓️ Plan ahead — "; }
    else                  { priority = "low";       urgencyTag = "🎓 Early notice — "; }

    try {
      await createNotification(userId, {
        title: `${urgencyTag}${scholarship.name}`,
        message: days <= 1
          ? `Today is the LAST DAY to apply for "${scholarship.name}". Apply immediately at ${scholarship.applicationLink}`
          : `Only ${days} day(s) left to apply for "${scholarship.name}" (${scholarship.provider}). Open date: ${scholarship.openDate || "Open"} | Deadline: ${scholarship.deadline}. Apply at: ${scholarship.applicationLink}`,
        type: "deadline",
        category: "scholarship",
        priority,
        actionUrl: "/scholarships",
        dedupKey
      });
      console.log(`[Monitor]   ✓ notified ${userId?.slice(0,8)}: "${scholarship.name.slice(0,40)}"`);
      notified++;
    } catch (err) {
      console.error(`[Monitor]   ✗ createNotification failed for ${userId?.slice(0,8)}: ${err.message}`);
    }
  }

  return notified;
}

// ─── Main: run the full monitor cycle ────────────────────────────────────────
export async function runScholarshipMonitor() {
  console.log(`\n[Monitor] ── Scholarship deadline check started: ${new Date().toISOString()}`);

  // 1. Check all scholarships for upcoming deadlines (MongoDB or local store)
  let deadlineNotifications = 0;
  try {
    let scholarships = [];
    if (Scholarship.db?.readyState === 1) {
      scholarships = await Scholarship.find({ status: "Active" }).lean();
    } else {
      scholarships = await getAllLocalScholarships();
    }
    for (const s of scholarships) {
      const days = daysUntil(s.deadline);
      if (days !== null && days > 0 && days <= 200) {
        const n = await notifyEligibleStudents(s);
        deadlineNotifications += n;
        console.log(`[Monitor] ${s.name} — ${days} days left — notified ${n} students`);
      }
    }
  } catch (err) {
    console.error("[Monitor] Deadline notification error:", err.message);
  }

  // 2. Scrape NSP + SSP for date changes
  let changedSchemes = [];
  let browser;
  try {
    browser = await launchBrowser();
    const [nspResults, sspResults] = await Promise.all([
      scrapeNSP(browser),
      scrapeSSP(browser)
    ]);

    const allScraped = [...nspResults, ...sspResults];
    console.log(`[Monitor] Total scraped: ${allScraped.length} schemes`);

    if (allScraped.length > 0) {
      changedSchemes = await syncDatesToDB(allScraped);
    }
  } catch (err) {
    console.error("[Monitor] Scrape error:", err.message);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }

  // 3. Email admin if any dates changed
  if (changedSchemes.length > 0) {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
      if (adminEmail) {
        await sendAdminAlert({
          subject: `[ScholarSense] ${changedSchemes.length} scholarship date(s) updated`,
          html: `
            <h2>Scholarship Dates Updated</h2>
            <p>The following scholarship deadlines were updated by the scraper. <strong>Please verify on the official portal before relying on these dates.</strong></p>
            <table border="1" cellpadding="8" style="border-collapse:collapse">
              <tr><th>Scheme</th><th>Old Open</th><th>New Open</th><th>Old Deadline</th><th>New Deadline</th></tr>
              ${changedSchemes.map(c => `<tr><td>${c.name}</td><td>${c.oldOpen}</td><td>${c.newOpen}</td><td>${c.oldDeadline}</td><td>${c.newDeadline}</td></tr>`).join("")}
            </table>
            <p>Log in to ScholarSense admin panel to review: <a href="/admin/dashboard">/admin/dashboard</a></p>
          `
        });
        console.log(`[Monitor] Admin alert sent for ${changedSchemes.length} changes`);
      }
    } catch (err) {
      console.error("[Monitor] Admin email error:", err.message);
    }
  }

  console.log(`[Monitor] ── Done. Deadline notifications: ${deadlineNotifications} | Date changes: ${changedSchemes.length}\n`);

  return { deadlineNotifications, changedSchemes };
}
