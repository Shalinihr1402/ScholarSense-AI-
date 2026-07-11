/**
 * SSP Karnataka official helpline numbers and contact info
 * Source: ssp.karnataka.gov.in — 2026-27
 * Used by chatController to answer "how do I contact SSP" queries
 */
export const SSP_CONTACTS = [
  {
    department: "State Scholarship Portal (SSP)",
    helpline: ["1902"],
    email: null,
    note: "General SSP helpline for login issues, portal errors, application status"
  },
  {
    department: "Department of Social Welfare (SC students)",
    helpline: ["94823004000", "080-22634300"],
    email: "swdcontrolroom@gmail.com",
    note: "For SC post-matric/pre-matric scholarship queries"
  },
  {
    department: "Department of Tribal Welfare (ST students)",
    helpline: ["94823004000", "080-22634300"],
    email: "swdcontrolroom@gmail.com",
    note: "For ST scholarship queries — same control room as Social Welfare"
  },
  {
    department: "Department of Minority Welfare",
    helpline: ["8277799990"],
    email: null,
    note: "For Muslim/Christian/Jain/Sikh/Parsi/Buddhist/Zoroastrian scholarship queries"
  },
  {
    department: "Backward Classes Welfare Department (OBC)",
    helpline: ["8050770004", "8050770005"],
    email: null,
    note: "For OBC Category-1, 2A/3A/2B/3B, Vidyasiri scholarship queries"
  }
];

/**
 * SSP 2026-27 key portal links
 */
export const SSP_PORTALS = {
  preMatric: "https://ssp.postmatric.karnataka.gov.in/ssppre/",
  postMatric: "https://ssp.postmatric.karnataka.gov.in/post_sa_2627/login",
  newAccount: "https://ssp.postmatric.karnataka.gov.in/CA/",
  main: "https://ssp.karnataka.gov.in",
  helpline: "1902"
};

/**
 * SSP DBT timeline note shown to students
 */
export const SSP_DBT_NOTE =
  "SSP scholarship funds are transferred via Direct Benefit Transfer (DBT) directly to your Aadhaar-linked bank account. " +
  "Payments are typically credited between February and July of the following year after application verification is complete. " +
  "Ensure your Aadhaar is linked to your bank account before applying.";
