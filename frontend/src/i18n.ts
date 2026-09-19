export interface UICopy {
  brandTag: string;
  navOverview: string;
  navHistory: string;
  navHow: string;
  eyebrow: string;
  heroA: string;
  heroB: string;
  heroCopy: string;
  secureNote: string;
  kickerInput: string;
  kickerResult: string;
  howHeading: string;
  close: string;
  outputLangLabel: string;
  trySample: string;
  uploadTab: string;
  pasteTab: string;
  pastePlaceholder: string;
  textareaLabel: string;
  contextShow: string;
  contextHide: string;
  analysing: string;
  checkRejection: string;
  finePrint: string;
  emptyH2: string;
  emptyP: string;
  how: Array<[string, string]>;
  watchSample: string;
  workPhases: [string, string, string];
  footer: string;
  historyHeading: string;
  historyEmpty: string;
}

const ENGLISH: UICopy = {
  brandTag: "Claim intelligence desk",
  navOverview: "Overview",
  navHistory: "Case history",
  navHow: "How it works",
  eyebrow: "Claims / new review",
  heroA: "Make your claim",
  heroB: "count.",
  heroCopy:
    "Turn a confusing rejection letter into a clear next step, with evidence on your side.",
  secureNote: "Private workspace",
  kickerInput: "Bring your letter",
  kickerResult: "Your claim snapshot",
  howHeading: "How Vouchmark works",
  close: "Close",
  outputLangLabel: "Output language",
  trySample: "Try a sample",
  uploadTab: "Upload a letter",
  pasteTab: "Paste the text",
  pastePlaceholder:
    "Paste the exact wording of the rejection letter… policy number, the reasons for rejection, amounts, dates.",
  textareaLabel: "Rejection letter text",
  contextShow: "Add optional details",
  contextHide: "Hide optional details",
  analysing: "Analysing…",
  checkRejection: "Check this rejection",
  finePrint:
    "Your letter is analysed, not stored as text by anyone. No login, no account. Informational only — never a promise.",
  emptyH2: 'If an insurer says “no”, is that the whole story?',
  emptyP:
    "Upload the rejection letter, or paste its wording. We extract each stated reason, check it against how Indian health policies actually behave, and draft a counter letter a real person can send.",
  how: [
    [
      "Bedrock vision",
      " reads the letter (even a photo), in English, Hindi, Tamil, Telugu or Bengali.",
    ],
    [
      "Rules, not vibes",
      " — each reason is scored: weak ground, curable, or looks valid.",
    ],
    [
      "A letter you can actually send",
      ", plus the evidence list that makes it stick.",
    ],
  ],
  watchSample: "Watch it work on a sample letter →",
  workPhases: [
    "Reading the letter…",
    "Checking each reason against policy rules…",
    "Drafting your reply letter…",
  ],
  footer:
    "Built for the AWS First Commit hackathon · Amazon Bedrock + Lambda + API Gateway + DynamoDB + CloudFront · a rejection is a disagreement, not a verdict",
  historyHeading: "Past checks on this device",
  historyEmpty: "Nothing here yet — your first check will appear.",
};

const HINGLISH: UICopy = {
  brandTag: "Claim intelligence desk",
  navOverview: "Overview",
  navHistory: "Case history",
  navHow: "Kaise kaam karta hai",
  eyebrow: "Claims / naya review",
  heroA: "Apne claim ko",
  heroB: "asli banayein.",
  heroCopy:
    "Bhramit karne wali rejection letter ko ek saaf agla kadam banao — evidence apni taraf ho.",
  secureNote: "Private workspace",
  kickerInput: "Apni letter lao",
  kickerResult: "Aapka claim snapshot",
  howHeading: "Vouchmark kaise kaam karta hai",
  close: "Band karo",
  outputLangLabel: "Output language",
  trySample: "Sample try karo",
  uploadTab: "Letter upload karo",
  pasteTab: "Text paste karo",
  pastePlaceholder:
    "Rejection letter ka exact text paste karo… policy number, rejection ke reasons, amounts, dates.",
  textareaLabel: "Rejection letter ka text",
  contextShow: "Optional details add karo",
  contextHide: "Optional details chhupao",
  analysing: "Analyse ho raha hai…",
  checkRejection: "Rejection check karo",
  finePrint:
    "Aapki letter analyse hoti hai, text ke roop mein koi nahi rakhta. Na login, na account. Sirf jaankari — koi guarantee nahi.",
  emptyH2: 'Insurer ne “no” bola — kya yehi aakhri baat hai?',
  emptyP:
    "Rejection letter upload karo ya uska text paste karo. Hum har reason nikaalte hain, Indian health policy ke rules se check karte hain, aur ek counter letter tayar karte hain jo aap actually bhej sakte hain.",
  how: [
    [
      "Bedrock vision",
      " letter padh leta hai — photo bhi — English, Hindi, Tamil, Telugu ya Bengali mein.",
    ],
    [
      "Rules, not vibes",
      " — har reason score hota hai: weak ground, curable, ya looks valid.",
    ],
    [
      "A letter you can actually send",
      ", aur evidence list jo ise mazboot banati hai.",
    ],
  ],
  watchSample: "Sample letter pe dekho kaise kaam karta hai →",
  workPhases: [
    "Letter padh rahe hain…",
    "Har reason policy rules se check ho raha hai…",
    "Reply letter tayar ho raha hai…",
  ],
  footer:
    "AWS First Commit hackathon ke liye banaya · Amazon Bedrock + Lambda + API Gateway + DynamoDB + CloudFront · rejection ek disagreement hai, verdict nahi",
  historyHeading: "Is par device ke purane checks",
  historyEmpty: "Abhi kuch nahi — aapka pehla check yahan dikhega.",
};

export function uiStrings(language: string): UICopy {
  return String(language || "").toLowerCase() === "hinglish" ? HINGLISH : ENGLISH;
}

export { ENGLISH, HINGLISH };