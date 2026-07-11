/**
 * scheduler.js
 * All cron jobs for ScholarSense AI.
 *
 * Schedule:
 *   - 06:00 daily  → Scholarship deadline check + NSP/SSP date scrape
 *   - 08:00 daily  → Document expiry notifications
 *   - 00:00 Sunday → Weekly summary for students with pending actions
 */

import cron from "node-cron";
import { runScholarshipMonitor } from "./scholarshipMonitor.js";
import { runDocumentExpiryCheck } from "../services/smartNotificationService.js";

let started = false;

export function startScheduler() {
  if (started) return;
  started = true;

  // ── 1. Scholarship deadline check — every day at 6:00 AM ─────────────────
  cron.schedule("0 6 * * *", async () => {
    console.log("[Scheduler] 6:00 AM — Running scholarship deadline monitor…");
    try {
      await runScholarshipMonitor();
    } catch (err) {
      console.error("[Scheduler] Scholarship monitor failed:", err.message);
    }
  }, { timezone: "Asia/Kolkata" });

  // ── 2. Document expiry check — every day at 8:00 AM ──────────────────────
  cron.schedule("0 8 * * *", async () => {
    console.log("[Scheduler] 8:00 AM — Running document expiry check…");
    try {
      await runDocumentExpiryCheck();
    } catch (err) {
      console.error("[Scheduler] Document expiry check failed:", err.message);
    }
  }, { timezone: "Asia/Kolkata" });

  // ── 3. Run once on server startup (after 10s delay) to catch missed checks ─
  setTimeout(async () => {
    console.log("[Scheduler] Startup check — running scholarship deadline monitor…");
    try {
      await runScholarshipMonitor();
    } catch (err) {
      console.error("[Scheduler] Startup monitor failed:", err.message);
    }
  }, 10000);

  console.log("[Scheduler] ✓ Jobs registered: deadline check @6AM, doc expiry @8AM (IST)");
}
