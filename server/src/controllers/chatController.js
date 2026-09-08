import https from "https";
import StudentProfile from "../models/StudentProfile.js";
import { getLocalProfile } from "../services/localProfileStore.js";

// ── Node-compatible HTTPS POST (works on Node 14, 16, 18+) ──────────────────
function httpsPost(url, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const data = JSON.stringify(body);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data), ...extraHeaders }
    };
    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", chunk => raw += chunk);
      res.on("end", () => {
        try { resolve({ ok: res.statusCode < 400, status: res.statusCode, json: () => JSON.parse(raw) }); }
        catch { reject(new Error("Invalid JSON from Gemini")); }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

// ── Build RAG context string from student profile ─────────────────────────────
function buildProfileContext(profile) {
  if (!profile) return "No profile data found for this student.";

  const yn = (v) => (v === "Yes" ? "✓ Yes" : v === "No" ? "✗ No" : "Unknown");
  const val = (v) => v || "Not provided";

  return `
=== STUDENT PROFILE (Retrieved Context) ===

PERSONAL:
- Name: ${val(profile.fullName)}
- Gender: ${val(profile.gender)}
- State: ${val(profile.state)}, District: ${val(profile.district)}
- Mobile: ${val(profile.mobile)}
- Category: ${val(profile.category)}${profile.subcategory ? " / Sub-category: " + profile.subcategory : ""}
- Parent Profession: ${val(profile.parentProfession)}
- Annual Family Income: ${profile.annualIncome ? "₹" + profile.annualIncome : "Not provided"}

ACADEMIC:
- Education Level: ${val(profile.educationLevel)}
- Course: ${val(profile.course)}
- Semester/Year: ${val(profile.semester)}
- Marks/Percentage: ${profile.marksPercentage != null ? profile.marksPercentage + "%" : "Not provided"}
- Admission Year: ${val(profile.admissionYear)}
- Current Academic Year: ${val(profile.currentAcademicYear)}
- University/Board: ${val(profile.universityBoard)}
- Admission Type: ${val(profile.admissionType)}

INSTITUTE:
- College: ${val(profile.collegeName)}
- Institute Code: ${val(profile.instituteCode)}
- Nodal Officer: ${val(profile.nodalOfficerName)} (${val(profile.nodalOfficerContact)})

ELIGIBILITY FLAGS:
- Disability Status: ${yn(profile.disabilityStatus)}
- Minority: ${yn(profile.minorityStatus)}
- Hosteller: ${yn(profile.hosteller)}
- Orphan: ${yn(profile.orphanStatus)}
- First Graduate in Family: ${yn(profile.firstGraduate)}

BANK & DBT STATUS:
- Bank Name: ${val(profile.bankName)}
- Account Holder: ${val(profile.accountHolderName)}
- IFSC Code: ${val(profile.ifscCode)}
- Aadhaar Linked to Bank: ${yn(profile.aadhaarBankLinked)}
- DBT Enabled: ${yn(profile.dbtEnabled)}
- Bank Account Active: ${yn(profile.bankAccountActive)}
- NPCI Mapping: ${yn(profile.npciMapping)}

DOCUMENTS AVAILABLE:
- ${profile.availableDocuments?.length ? profile.availableDocuments.join(", ") : "None uploaded yet"}

===========================================
`.trim();
}

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are ScholarSense AI — a highly knowledgeable, warm, and precise scholarship assistant for Indian students.
You have retrieved this student's real profile from the database. Every answer you give MUST be grounded in their actual data.

## YOUR EXPERTISE
- NSP (scholarships.gov.in) and SSP (ssp.karnataka.gov.in) scholarship portals
- PFMS payment pipeline and all failure modes
- Aadhaar–bank seeding, DBT activation, NPCI Aadhaar Payment Bridge
- Scholarship eligibility by category (SC/ST/OBC/General), income, marks, course
- Document checklist and what to do when a document is missing or rejected
- Application stages: Draft → Submitted → Institute Verified → Defective → Sanctioned → Payment Processed → Bank Credited
- Common portal errors and exactly how to fix them

## ANSWER FORMAT RULES
1. **Maximum 5 lines or 80 words** — be brutally short and direct
2. **One problem = one solution** — do not list every possible cause, pick the most likely one from their profile
3. **No intro phrases** — never start with "Great question", "I understand", "Based on your profile" etc. Just answer directly
4. **Steps: max 3** — if a fix needs steps, give max 3 numbered steps only
5. **Bold only the action word** — e.g. **Visit bank branch**, **Dial *99*99*1#**
6. **One next action at the end** — single sentence starting with "→ Do this now:"
7. Never repeat the same point twice in different words

## PERSONALIZATION RULES
- If their Aadhaar bank linking status is "✗ No" or "Unknown" → prioritize fixing Aadhaar seeding first
- If DBT is "✗ No" → tell them to visit their specific bank (use bank name from profile) and ask to enable DBT
- If NPCI mapping is "Unknown" → tell them to check via *99*99*1# on their Aadhaar-registered mobile
- If marks are known → calculate eligibility for NSP (75% cutoff for most central schemes)
- If income is known → assess NSP income cutoff (₹2.5 lakh for most central schemes)
- If documents list is empty → give them the full checklist for their category
- If nodal officer contact is available → always mention they can contact them directly
- If college/institute code is missing → tell them to get it from their college admin

## LANGUAGE RULES (IMPORTANT)
- Detect the language of the student's message automatically
- If the student writes in **Kannada script** (ಕನ್ನಡ), reply fully in Kannada script
- If the student writes in **Hindi script** (हिंदी), reply fully in Hindi script
- If the student writes in **English**, reply in English
- If the student writes using **English letters for Kannada words** (Romanized Kannada), e.g. "nanna scholarship bandilla", "hogbeku", "dorethu", "helri", "illa", "beku", "aagilla", "nimma", "avaru" — detect as Kannada and reply in proper Kannada script (ಕನ್ನಡ)
- If the student writes using **English letters for Hindi words** (Romanized Hindi), e.g. "mera scholarship", "kab aayega", "nahi mila", "kaise karu", "paisa", "milega", "chahiye", "abhi" — detect as Hindi and reply in proper Hindi script (हिंदी)
- Never mix languages in a single response
- Keep the same answer format rules regardless of language

## WHAT TO AVOID
- Do not repeat the same advice in different words
- Do not say "I hope this helps" or filler phrases
- Do not make up scholarship amounts, deadlines, or portal URLs you are not sure about
- Do not ignore their profile data — always reference it
- If something in their profile is "Unknown" or missing, specifically tell them which field to update in their ScholarSense profile

## KNOWN FACTS YOU CAN USE
- NSP income limit: ₹2.5 lakh/year for most central schemes (₹4.5 lakh for OBC)
- PFMS payment takes 7–30 working days after Sanctioned status
- Aadhaar seeding verification: dial *99*99*1# on Aadhaar-registered mobile
- DBT fix: visit bank branch, say "enable DBT and Aadhaar Payment Bridge on my account"
- NPCI mapper check: pfms.nic.in → Know Your Payment → search by Aadhaar
- NSP helpdesk: 0120-6619540 | PFMS: 1800-118-111 | UIDAI: 1947
- SSP general helpline: 1902 | Portal: ssp.karnataka.gov.in (pre-matric) | ssp.postmatric.karnataka.gov.in (post-matric)
- SSP Social Welfare (SC/ST): 94823004000 / 080-22634300 | swdcontrolroom@gmail.com
- SSP Backward Classes (OBC): 8050770004 / 8050770005
- SSP Minority Welfare: 8277799990
- SSP 2026-27 key deadlines: SC post-matric 31 Jan 2027 | OBC/ST post-matric 31 Aug 2026 | Minority post-matric 30 Sep 2026 | Pre-matric most depts 30 Jun 2026 | Disability/Labour pre-matric 30 Jun 2026 | Minority pre-matric 30 Sep 2026
- SSP DBT: funds credited Feb–Jul of the following year after application verification
- SSP pre-matric login: https://ssp.postmatric.karnataka.gov.in/ssppre/
- SSP post-matric login: https://ssp.postmatric.karnataka.gov.in/post_sa_2627/login
- SSP new account creation (both pre and post-matric): https://ssp.postmatric.karnataka.gov.in/CA/
- SSP pre-matric requires SATS ID (Student Achievement Tracking System ID from school)`;

// ── POST /api/chat ─────────────────────────────────────────────────────────────
export async function chat(req, res) {
  try {
    const { message, history = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: "Message is required." });
    }

    const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ message: "AI service is not configured. Please set GROQ_API_KEY in server .env file." });
    }

    // ── Retrieve student profile (RAG retrieval step) ──
    let profile = null;
    try {
      if (StudentProfile.db?.readyState === 1) {
        profile = await StudentProfile.findOne({ userId: req.user._id || req.user.id }).lean();
      } else {
        profile = await getLocalProfile(String(req.user._id || req.user.id));
      }
    } catch {
      // profile stays null — chatbot still works, just without personalization
    }

    const profileContext = buildProfileContext(profile);

    // ── Build Groq messages ──
    const groqMessages = [
      { role: "system", content: `${SYSTEM_PROMPT}\n\n${profileContext}` },
      ...history.map(h => ({ role: h.from === "user" ? "user" : "assistant", content: h.text })),
      { role: "user", content: message }
    ];

    // Model is configurable via GROQ_MODEL. Default targets a model that is
    // broadly available on current Groq keys. reasoning_effort keeps the
    // reasoning-style models (gpt-oss / qwen3) from spending the whole token
    // budget on hidden reasoning and returning an empty content field.
    const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
    const groqRes = await httpsPost(
      "https://api.groq.com/openai/v1/chat/completions",
      { model, messages: groqMessages, temperature: 0.2, max_tokens: 1024, reasoning_effort: "low" },
      { "Authorization": `Bearer ${apiKey}` }
    );

    if (!groqRes.ok) {
      const err = groqRes.json();
      console.error("Groq API error:", groqRes.status, JSON.stringify(err));
      return res.status(502).json({ message: `AI error (${groqRes.status}): ${err?.error?.message || "Please check your API key."}` });
    }

    const data = groqRes.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(502).json({ message: "No response from AI. Please try again." });
    }

    return res.json({ reply, hasProfile: Boolean(profile) });
  } catch (err) {
    console.error("Chat error:", err.message);
    return res.status(500).json({ message: "Chat service error. Please try again." });
  }
}
