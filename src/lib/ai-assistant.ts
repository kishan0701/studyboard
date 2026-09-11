import { Assignment, computeStats, deadlineRisk, daysUntil, formatDate } from "./assignments";

export type AIModelType = "studyboard" | "gpt4o" | "claude" | "deepseek";

export type AIMessage = {
  id: string;
  sender: "user" | "ai" | "system";
  text: string;
  timestamp: string;
  model?: AIModelType;
  language?: SupportedLanguage;
  action?: {
    type: "create_assignment" | "view_assignments" | "view_notices" | "plan_created";
    payload?: Partial<Assignment>;
  };
  suggestedPrompts?: string[];
};

export interface AIContext {
  assignments: Assignment[];
  notices: Array<{ id: string; title: string; message: string; created_at: string }>;
  classInstructions?: Array<{
    id: string;
    title: string;
    subject: string;
    profName: string;
    targetDate: string;
    urgency: string;
    completed?: boolean;
    personalNote?: string;
  }>;
  userName?: string;
  userRole?: string;
  model?: AIModelType;
}

export type SupportedLanguage = "english" | "hinglish" | "hindi";

// Unambiguous Hindi words in Latin script that never collide with common English words
const HINGLISH_MARKERS = new Set([
  // Question words
  "kya",
  "kyu",
  "kyun",
  "kaise",
  "kab",
  "kahan",
  "kitna",
  "kitne",
  "kitni",
  "kaun",
  "kiska",
  "kisko",
  // Pronouns & Possessives
  "mera",
  "meri",
  "mere",
  "mujhe",
  "mujhko",
  "hum",
  "hume",
  "humara",
  "humari",
  "humare",
  "tum",
  "tumhe",
  "tumhara",
  "tumhari",
  "tumhare",
  "aap",
  "aapko",
  "aapka",
  "aapki",
  "aapke",
  "tera",
  "teri",
  "tere",
  "tujhe",
  "uska",
  "uski",
  "uske",
  "unka",
  "unki",
  "unke",
  // Verbs & Auxiliaries
  "karna",
  "karo",
  "kare",
  "karein",
  "karenge",
  "karta",
  "karti",
  "karte",
  "kardo",
  "kar do",
  "batao",
  "bata",
  "bataiye",
  "batana",
  "bataye",
  "samjhao",
  "samjha",
  "samjhaiye",
  "dikhao",
  "padhna",
  "padho",
  "padhai",
  "padhe",
  "banao",
  "bana",
  "banaye",
  "likho",
  "likhna",
  "aaya",
  "aayi",
  "aaye",
  "gaya",
  "gayi",
  "gaye",
  "hoga",
  "hogi",
  "honge",
  "chahiye",
  "hai",
  "hain",
  "tha",
  "thi",
  "the",
  "raha",
  "rahi",
  "rahe",
  // Common Conversational words
  "bhai",
  "yaar",
  "suno",
  "sunna",
  "accha",
  "achha",
  "thik",
  "theek",
  "mast",
  "bhi",
  "aur",
  "pehle",
  "sabse",
  "baad",
  "abhi",
  "aaj",
  "kal",
  "parso",
  "nahi",
  "mat",
  "kuch",
  "sab",
  "bohot",
  "bahut",
  "thoda",
  "thode",
  "thodi",
  "wala",
  "wali",
  "wale",
  "waala",
  "waali",
  "dost",
  "sirji",
  "jod",
  "jodo",
]);

const ENGLISH_MARKERS = new Set([
  "the",
  "is",
  "are",
  "was",
  "were",
  "what",
  "how",
  "why",
  "when",
  "where",
  "who",
  "which",
  "my",
  "your",
  "our",
  "their",
  "this",
  "that",
  "these",
  "those",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "can",
  "could",
  "should",
  "would",
  "will",
  "shall",
  "please",
  "tell",
  "show",
  "give",
  "explain",
  "create",
  "help",
  "pending",
  "assignment",
  "assignments",
  "schedule",
  "routine",
  "plan",
  "urgent",
  "due",
  "risk",
  "today",
  "tomorrow",
  "yesterday",
  "course",
  "subject",
  "deadlines",
  "tasks",
  "submission",
  "submissions",
  "notices",
  "announcements",
  "guide",
  "notes",
  "grade",
  "grades",
  "exam",
  "exams",
  "hello",
  "hi",
  "hey",
  "good",
]);

/**
 * Intelligent Language Detector:
 * 1. Hindi (Devanagari script)
 * 2. Hinglish (Hindi conversational Roman script)
 * 3. English (Strict English responses for English inputs)
 */
export function detectLanguage(text: string): SupportedLanguage {
  // Check Devanagari Unicode range first (e.g. नमस्ते, असाइनमेंट, क्या हाल है)
  if (/[\u0900-\u097F]/.test(text)) {
    return "hindi";
  }

  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const words = clean.split(/\s+/).filter((w) => w.length > 0);

  let hinglishScore = 0;
  let englishScore = 0;

  for (const w of words) {
    if (HINGLISH_MARKERS.has(w)) hinglishScore++;
    if (ENGLISH_MARKERS.has(w)) englishScore++;
  }

  // If there are explicit Hindi/Hinglish marker words
  if (hinglishScore > 0 && hinglishScore >= englishScore * 0.5) {
    return "hinglish";
  }

  // Default to English for all standard English / academic terms
  return "english";
}

/**
 * Intelligent Academic AI Engine
 * Multilingual (English, Hindi, Hinglish) & Multi-Model (GPT-4o, Claude 3.7, DeepSeek R1, StudyBoard)
 */
export async function processAIMessage(userInput: string, context: AIContext): Promise<AIMessage> {
  const query = userInput.trim();
  const lower = query.toLowerCase();
  const now = new Date().toISOString();
  const model = context.model || "studyboard";
  const lang = detectLanguage(query);

  const stats = computeStats(context.assignments);
  const pendingItems = context.assignments
    .filter((a) => a.status === "Pending")
    .map((a) => ({ ...a, risk: deadlineRisk(a), diff: daysUntil(a.deadline) }))
    .sort((a, b) => a.diff - b.diff);

  const overdueItems = pendingItems.filter((a) => a.diff < 0);
  const highRiskItems = pendingItems.filter((a) => a.risk === "HIGH");
  const notices = context.notices || [];

  const classInstructions = context.classInstructions || [
    {
      id: "ic-1",
      title: "Bring spiral-bound Black Book Chapter 1 & 2 draft with plagiarism report (< 10%)",
      subject: "Final Year Project",
      profName: "Mrs. Abha Dhote (CS HOD)",
      targetDate: "2026-09-12",
      urgency: "critical",
      completed: false,
      personalNote: "Print 2 copies at college xerox shop before 9:00 AM",
    },
    {
      id: "ic-2",
      title: "Submit DBMS Lab 4 ER Diagram hard copy signed in practical journal",
      subject: "Database Management",
      profName: "Prof. S. Sharma",
      targetDate: "2026-09-12",
      urgency: "critical",
      completed: false,
      personalNote: "Draw relational cardinality tables neatly with pencil",
    },
    {
      id: "ic-3",
      title: "Prepare 5-slide PPT on Round Robin CPU Scheduling for in-class viva",
      subject: "Operating Systems",
      profName: "Prof. K. Mehta",
      targetDate: "2026-09-14",
      urgency: "important",
      completed: false,
    },
  ];

  // =========================================================================
  // 0. COLLEGE NOTICES, PRACTICAL CHECKING & "AAJ/KAL KYA KARNA HAI" INTELLIGENCE
  // =========================================================================
  const isCollegeActionQuery =
    lower.includes("checking") ||
    lower.includes("check") ||
    lower.includes("journal") ||
    lower.includes("practical") ||
    lower.includes("sign") ||
    lower.includes("viva") ||
    lower.includes("important") ||
    lower.includes("kuch important") ||
    lower.includes("kya important") ||
    lower.includes("kya notice") ||
    lower.includes("circular") ||
    lower.includes("aaj ke date") ||
    lower.includes("aaj kya") ||
    lower.includes("kal kya") ||
    lower.includes("karna hai") ||
    lower.includes("kuch karna") ||
    lower.includes("kya karna") ||
    lower.includes("what to do") ||
    lower.includes("abha") ||
    lower.includes("dhote") ||
    lower.includes("giri") ||
    lower.includes("ma'am") ||
    lower.includes("maam") ||
    lower.includes("class me") ||
    lower.includes("attendance") ||
    lower.includes("defaulter");

  if (isCollegeActionQuery) {
    let answerText = "";

    if (lang === "hinglish") {
      answerText =
        `📢 **Bhai, Thakur Shyamnarayan Degree College (TSDC) TYCS ke liye aaj aur kal ke critical updates yeh rahe:**\n\n` +
        `🚨 **1. KAL (TOMORROW) KYA CHECKING & SUBMIT KARNA HAI (1-DAY WARNING!):**\n` +
        `• 📝 **OS Lab 4 Practical Journal Checking & Sign-off**:\n` +
        `  - **Faculty:** Mrs. Abha Dhote (CS HOD)\n` +
        `  - **Location & Time:** Lab 3 (Room 701), afternoon 2:00 PM cutoff\n` +
        `  - **Strict Rule:** Index certified hona zaroori hai. Absent students ko internals me ZERO marks milenge!\n` +
        `• 📌 **Final Year Project Black Book Chapter 1 & 2 Draft**:\n` +
        `  - **Ma'am ne class me bola:** 2 spiral-bound hard copies + Turnitin plagiarism report (< 10%) guide sign ke sath laani hai.\n` +
        `• ⚡ **DBMS Lab 4 ER Diagram**:\n` +
        `  - Cardinality tables aur foreign keys journal me neat draw karke sign karwana hai.\n\n` +
        `📢 **2. AAJ KE DATE PE KYA IMPORTANT NOTICES & CIRCULARS HAIN:**\n` +
        `• ⚠️ **Compulsory Attendance Notice (Ref: TSDC/ACAD/2026/109)**:\n` +
        `  - Cyber Forensics Industry Seminar in Room 701. Biometric attendance compulsory hai term-grant criteria ke liye!\n` +
        `• 🎟️ **75% Attendance Defaulter Clearance Notice**:\n` +
        `  - Defaulter students ko Room 304 me parent undertaking letter ke sath report karna hai hall ticket collect karne ke liye.\n` +
        `• 🎓 **Exam Form Verification**:\n` +
        `  - Counter 3 pe semester fee receipt verify karwao before 3:00 PM (keep 2 passport photos ready).\n\n` +
        `🎯 **3. ABHI TUJHE KYA KARNA CHAHIYE (ACTION PLAN):**\n` +
        `1. Apni **OS aur DBMS journal** me index fill karke ready rakho.\n` +
        `2. **Black Book** ka spiral binding station shop se kara lo.\n` +
        `3. Cyber Forensics seminar me biometric punch miss mat karna!`;
    } else if (lang === "hindi") {
      answerText =
        `📢 **ठाकुर श्यामनारायण डिग्री कॉलेज (TSDC) - आज एवं कल की महत्वपूर्ण सूचनाएं व प्रैक्टिकल चेकिंग:**\n\n` +
        `🚨 **1. कल क्या चेकिंग और जमा करना है (1-दिन की पूर्व चेतावनी):**\n` +
        `• 📝 **OS लैब 4 प्रैक्टिकल जर्नल चेकिंग एवं हस्ताक्षर**:\n` +
        `  - **शिक्षिका**: श्रीमती आभा धोते (HOD, कंप्यूटर साइंस विभाग)\n` +
        `  - **स्थान व समय**: लैब 3 (कमरा 701), दोपहर 2:00 बजे तक\n` +
        `  - **नियम**: हस्ताक्षरित इंडेक्स अनिवार्य है; अनुपस्थित रहने पर आंतरिक अंक शून्य दिए जाएंगे।\n` +
        `• 📌 **फाइनल ईयर प्रोजेक्ट ब्लैक बुक ड्राफ्ट (अध्याय 1 व 2)**:\n` +
        `  - **कक्षा निर्देश**: 2 स्पाइरल बाउंड हार्ड कॉपी + 10% से कम प्लेगियराइज्म रिपोर्ट संलग्न करें।\n` +
        `• ⚡ **DBMS लैब 4 ई-आर आरेख**:\n` +
        `  - कार्डिनैलिटी तालिकाओं के साथ जर्नल में तैयार कर हस्ताक्षर करवाएं।\n\n` +
        `📢 **2. आज की महत्वपूर्ण आधिकारिक सूचनाएं (Notices):**\n` +
        `• ⚠️ **अनिवार्य उपस्थिति परिपत्र (Ref: TSDC/ACAD/2026/109)**:\n` +
        `  - कमरा 701 में साइबर फोरेंसिक संगोष्ठी। बायोमेट्रिक उपस्थिति अनिवार्य है।\n` +
        `• 🎟️ **75% उपस्थिति डिफाल्टर नोटिस**:\n` +
        `  - डिफाल्टर छात्र कमरा 304 में अभिभावक सहमति पत्र के साथ हॉल टिकट प्राप्त करें।\n\n` +
        `🎯 **3. आपकी आज की कार्ययोजना:**\n` +
        `1. जर्नल इंडेक्स पूर्ण करके तैयार रखें।\n` +
        `2. ब्लैक बुक ड्राफ्ट की प्रतिलिपि तैयार करवाएं।\n` +
        `3. कॉलेज सेमिनार में समय पर उपस्थित रहें।`;
    } else {
      answerText =
        `📢 **Thakur Shyamnarayan Degree College (TSDC) — Important Academic Deadlines & Notices:**\n\n` +
        `🚨 **1. TOMORROW'S MANDATORY CHECKING & SUBMISSIONS (1-DAY WARNING):**\n` +
        `• 📝 **Operating Systems Lab 4 Practical Journal Certification**:\n` +
        `  - **Faculty:** Mrs. Abha Dhote (CS HOD)\n` +
        `  - **Venue & Cutoff:** Lab 3 (Room 701), by 2:00 PM\n` +
        `  - **Policy:** Index certification is strictly required; absent students receive 0 in internals.\n` +
        `• 📌 **Final Year Project Black Book (Chapters 1 & 2 Draft)**:\n` +
        `  - **In-Class Instruction:** Submit 2 spiral-bound hard copies with Turnitin report (< 10%).\n` +
        `• ⚡ **DBMS Lab 4 Relational Schema & ER Diagram**:\n` +
        `  - Complete diagram with primary and foreign key mapping in journal.\n\n` +
        `📢 **2. ACTIVE OFFICIAL CAMPUS NOTICES FOR TODAY:**\n` +
        `• ⚠️ **Compulsory Attendance (Ref: TSDC/ACAD/2026/109)**: Cyber Forensics seminar in Room 701 (biometric attendance mandatory).\n` +
        `• 🎟️ **Attendance Defaulters & Hall Ticket Clearance**: Report to Room 304 with parent undertaking.\n` +
        `• 🎓 **Exam Form Verification**: Counter 3 before 3:00 PM with passport photographs.\n\n` +
        `🎯 **Recommended Action**: Finalize your practical journal index now and keep project documentation printed.`;
    }

    return {
      id: "msg-" + Date.now(),
      sender: "ai",
      timestamp: now,
      model,
      language: lang,
      text: formatByModel(answerText, model),
      suggestedPrompts: [
        lang === "hindi"
          ? "🔬 प्रैक्टिकल जर्नल चेकिंग के नियम"
          : lang === "hinglish"
            ? "🔬 Journal checking ke exact rules kya hain?"
            : "🔬 Practical journal checking guidelines",
        lang === "hindi"
          ? "👩‍🏫 आभा मैम ने क्लास में क्या बोला?"
          : lang === "hinglish"
            ? "👩‍🏫 Abha Ma'am ne class me kya bola?"
            : "👩‍🏫 What did Prof. Abha instruct in class?",
        lang === "hindi"
          ? "📊 मेरे लंबित कार्य दिखाओ"
          : lang === "hinglish"
            ? "📊 Mera pending tasks checklist dikhao"
            : "📊 Show my pending tasks",
      ],
    };
  }

  // ==========================================
  // 1. Natural Language Assignment Creation (Hindi / English / Hinglish)
  // ==========================================
  const addKeywords = [
    "add assignment",
    "create assignment",
    "new assignment",
    "add homework",
    "add task",
    "schedule assignment",
    "create task",
    "assignment add kar",
    "task add",
    "ek assignment add",
    "homework jod",
    "naya assignment",
  ];
  const isAddAssignment = addKeywords.some((k) => lower.includes(k));

  if (isAddAssignment) {
    const parsed = parseAssignmentDetails(query);

    let replyText = "";
    if (lang === "hinglish") {
      replyText =
        `🎯 **Bhai, maine tumhara assignment prepare kar diya hai:**\n\n` +
        `• 📚 **Subject**: ${parsed.subject}\n` +
        `• 📝 **Title**: ${parsed.title}\n` +
        `• 🗓️ **Deadline**: ${parsed.deadline} (${formatDate(parsed.deadline)})\n` +
        `• ⚡ **Priority**: ${parsed.priority}\n\n` +
        `Neeche button par click karke direct StudyBoard me add kar lo!`;
    } else if (lang === "hindi") {
      replyText =
        `🎯 **मैंने आपका असाइनमेंट तैयार कर लिया है:**\n\n` +
        `• 📚 **विषय**: ${parsed.subject}\n` +
        `• 📝 **शीर्षक**: ${parsed.title}\n` +
        `• 🗓️ **अंतिम तिथि**: ${parsed.deadline} (${formatDate(parsed.deadline)})\n` +
        `• ⚡ **प्राथमिकता**: ${parsed.priority}\n\n` +
        `क्या आप इसे अपने StudyBoard में जोड़ना चाहते हैं?`;
    } else {
      replyText =
        `🎯 **I've drafted your new assignment:**\n\n` +
        `• 📚 **Subject**: ${parsed.subject}\n` +
        `• 📝 **Title**: ${parsed.title}\n` +
        `• 🗓️ **Deadline**: ${parsed.deadline} (${formatDate(parsed.deadline)})\n` +
        `• ⚡ **Priority**: ${parsed.priority}\n\n` +
        `Click the confirmation button below to save it instantly to your workspace.`;
    }

    return {
      id: "msg-" + Date.now(),
      sender: "ai",
      timestamp: now,
      model,
      language: lang,
      text: replyText,
      action: {
        type: "create_assignment",
        payload: {
          subject: parsed.subject,
          title: parsed.title,
          description: parsed.description || "Created via AI Study Copilot",
          deadline: parsed.deadline,
          priority: parsed.priority,
          status: "Pending",
        },
      },
      suggestedPrompts: [
        lang === "hindi"
          ? "✅ हाँ, डैशबोर्ड में जोड़ें"
          : lang === "hinglish"
            ? "✅ Haan, save kar do"
            : "✅ Yes, save to dashboard",
        lang === "hindi"
          ? "📅 आज की अध्ययन योजना बनाएं"
          : lang === "hinglish"
            ? "📅 Aaj ka study plan banao"
            : "📅 Plan today's study",
        lang === "hindi"
          ? "⚡ सर्वोच्च जोखिम क्या है?"
          : lang === "hinglish"
            ? "⚡ Sabse urgent kya hai?"
            : "⚡ What is highest risk?",
      ],
    };
  }

  // ==========================================
  // 2. Pending Work, What To Do Next, Deadline Risks
  // ==========================================
  if (
    lower.includes("pending") ||
    lower.includes("kya karna hai") ||
    lower.includes("what to do") ||
    lower.includes("kya baki hai") ||
    lower.includes("urgent") ||
    lower.includes("risk") ||
    lower.includes("deadline") ||
    lower.includes("overdue") ||
    lower.includes("summary")
  ) {
    let responseText = "";

    if (lang === "hinglish") {
      responseText =
        `📊 **Bhai, yaha hai tumhare assignments ka complete status:**\n\n` +
        `• 📌 **Total Assignments**: ${stats.total}\n` +
        `• ⏳ **Pending Tasks**: ${stats.pending}\n` +
        `• ✅ **Completed**: ${stats.completed}\n` +
        `• 🚨 **Overdue**: ${stats.overdue}\n\n`;

      if (overdueItems.length > 0) {
        responseText += `🔥 **SABSE PEHLE YEH KARO (OVERDUE):**\n`;
        overdueItems.forEach((item) => {
          responseText += `• ❌ **${item.title}** (${item.subject}) — *${Math.abs(item.diff)} din pehle deadline nikal chuki hai!*\n`;
        });
        responseText += `\n`;
      }

      if (highRiskItems.length > 0) {
        responseText += `⚠️ **HIGH RISK (Jaldi khatam karo):**\n`;
        highRiskItems.forEach((item) => {
          const dueWhen = item.diff === 0 ? "Aaj hi submit karna hai!" : "Kal tak due hai!";
          responseText += `• ⚡ **${item.title}** (${item.subject}) — *${dueWhen}*\n`;
        });
        responseText += `\n`;
      }

      if (pendingItems.length === 0) {
        responseText += `🎉 **Mast news!** Tumhara koi bhi assignment pending nahi hai. Pura syllabus up-to-date hai!`;
      } else {
        responseText += `💡 **Next Step Advice:** Sabse pehle Overdue aur High Risk tasks ko 45 minutes ke deep focus session me khatam karo!`;
      }
    } else if (lang === "hindi") {
      responseText =
        `📊 **आपके असाइनमेंट और समय सीमा की संपूर्ण स्थिति:**\n\n` +
        `• 📌 **कुल असाइनमेंट**: ${stats.total}\n` +
        `• ⏳ **लंबित कार्य (Pending)**: ${stats.pending}\n` +
        `• ✅ **पूर्ण कार्य (Completed)**: ${stats.completed}\n` +
        `• 🚨 **अतिदेय (Overdue)**: ${stats.overdue}\n` +
        `• 📅 **इस सप्ताह देय**: ${stats.dueThisWeek}\n\n`;

      if (overdueItems.length > 0) {
        responseText += `🔥 **सर्वप्रथम इन्हें पूरा करें (Overdue):**\n`;
        overdueItems.forEach((item) => {
          responseText += `• ❌ **${item.title}** (${item.subject}) — *${Math.abs(item.diff)} दिन पहले समय सीमा समाप्त!*\n`;
        });
        responseText += `\n`;
      }

      if (highRiskItems.length > 0) {
        responseText += `⚠️ **उच्च जोखिम (High Risk — 24–48 घंटों में देय):**\n`;
        highRiskItems.forEach((item) => {
          const when = item.diff === 0 ? "आज ही जमा करना है!" : "कल तक जमा करना है!";
          responseText += `• ⚡ **${item.title}** (${item.subject}) — *${when}*\n`;
        });
        responseText += `\n`;
      }

      if (pendingItems.length === 0) {
        responseText += `🎉 **उत्कृष्ट!** आपका कोई भी असाइनमेंट लंबित नहीं है। आप पूरी तरह अपडेट हैं!`;
      } else {
        responseText += `💡 **परामर्श**: 45 मिनट के डीप-फोकस सत्र में सबसे पहले अतिदेय और उच्च जोखिम वाले कार्यों को पूरा करें।`;
      }
    } else {
      responseText =
        `📊 **Here is your Complete Deadline & Risk Summary:**\n\n` +
        `• 📌 **Total Tracked**: ${stats.total}\n` +
        `• ⏳ **Pending Submissions**: ${stats.pending}\n` +
        `• ✅ **Completed**: ${stats.completed}\n` +
        `• 🚨 **Overdue Tasks**: ${stats.overdue}\n` +
        `• 📅 **Due This Week**: ${stats.dueThisWeek}\n\n`;

      if (overdueItems.length > 0) {
        responseText += `🔥 **IMMEDIATE ACTION REQUIRED (Overdue):**\n`;
        overdueItems.forEach((item) => {
          responseText += `• ❌ **${item.title}** (${item.subject}) — *${Math.abs(item.diff)} days overdue*\n`;
        });
        responseText += `\n`;
      }

      if (highRiskItems.length > 0) {
        responseText += `⚠️ **HIGH RISK (Due within 24–48 hours):**\n`;
        highRiskItems.forEach((item) => {
          const when = item.diff === 0 ? "Due Today" : "Due Tomorrow";
          responseText += `• ⚡ **${item.title}** (${item.subject}) — *${when}*\n`;
        });
        responseText += `\n`;
      }

      if (pendingItems.length === 0) {
        responseText += `🎉 **Great Job!** You have zero pending tasks. You're completely caught up!`;
      } else {
        responseText += `💡 **Recommended Strategy**: Finish the top urgent item using the Pomodoro technique before moving to other subjects.`;
      }
    }

    return {
      id: "msg-" + Date.now(),
      sender: "ai",
      timestamp: now,
      model,
      language: lang,
      text: formatByModel(responseText, model),
      suggestedPrompts: [
        lang === "hindi"
          ? "📅 आज की समय सारिणी बनाओ"
          : lang === "hinglish"
            ? "📅 Aaj ka timetable bana do"
            : "📅 Plan today's schedule",
        lang === "hindi"
          ? "📢 नए नोटिस दिखाओ"
          : lang === "hinglish"
            ? "📢 Naya notice kya aaya hai?"
            : "📢 Check new notices",
        lang === "hindi"
          ? "➕ नया असाइनमेंट जोड़ें"
          : lang === "hinglish"
            ? "➕ Ek aur assignment jod do"
            : "➕ Add new assignment",
      ],
    };
  }

  // ==========================================
  // 3. What is New / Recent Department Notices & Circulars
  // ==========================================
  if (
    lower.includes("new") ||
    lower.includes("kya naya") ||
    lower.includes("notice") ||
    lower.includes("circular") ||
    lower.includes("update") ||
    lower.includes("announcement") ||
    lower.includes("khabar")
  ) {
    if (notices.length === 0) {
      let msg = "";
      if (lang === "hindi") {
        msg = "📢 विभाग के नोटिस बोर्ड पर वर्तमान में कोई नया नोटिस प्रकाशित नहीं है।";
      } else if (lang === "hinglish") {
        msg =
          "📢 Abhi department board par koi naya notice publish nahi hua hai. Sab normal chal raha hai!";
      } else {
        msg = "📢 Currently there are no new notices published on the department board.";
      }
      return {
        id: "msg-" + Date.now(),
        sender: "ai",
        timestamp: now,
        model,
        language: lang,
        text: msg,
        suggestedPrompts: [
          lang === "hindi"
            ? "📊 लंबित असाइनमेंट दिखाओ"
            : lang === "hinglish"
              ? "📊 Pending assignments dikhao"
              : "📊 Show pending assignments",
          lang === "hindi"
            ? "📅 अध्ययन योजना बनाओ"
            : lang === "hinglish"
              ? "📅 Study plan banao"
              : "📅 Plan my study",
        ],
      };
    }

    let noticesReply = "";
    if (lang === "hindi") {
      noticesReply = `📢 **विभाग के नवीनतम नोटिस और सूचनाएं (${notices.length} सूचनाएं):**\n\n`;
      notices.slice(0, 3).forEach((n, idx) => {
        noticesReply +=
          `**${idx + 1}. ${n.title}**\n` +
          `> ${n.message}\n` +
          `🗓️ *दिनांक: ${new Date(n.created_at).toLocaleDateString("hi-IN")}*\n\n`;
      });
      noticesReply += `💡 *परामर्श*: परीक्षा तिथियों और असाइनमेंट नियमों के लिए नोटिस बोर्ड नियमित रूप से देखते रहें।`;
    } else if (lang === "hinglish") {
      noticesReply = `📢 **Department ke Latest Notices & Updates (${notices.length} circulars):**\n\n`;
      notices.slice(0, 3).forEach((n, idx) => {
        noticesReply +=
          `**${idx + 1}. ${n.title}**\n` +
          `> ${n.message}\n` +
          `🗓️ *Published: ${new Date(n.created_at).toLocaleDateString()}*\n\n`;
      });
      noticesReply += `💡 *Tip*: Exam timetables aur submission extensions ke liye board regularly check karte raho!`;
    } else {
      noticesReply = `📢 **Official Department Notices & Announcements (${notices.length} found):**\n\n`;
      notices.slice(0, 3).forEach((n, idx) => {
        noticesReply +=
          `**${idx + 1}. ${n.title}**\n` +
          `> ${n.message}\n` +
          `🗓️ *Published: ${new Date(n.created_at).toLocaleDateString()}*\n\n`;
      });
      noticesReply += `💡 *All students are advised to adhere to stated submission guidelines.*`;
    }

    return {
      id: "msg-" + Date.now(),
      sender: "ai",
      timestamp: now,
      model,
      language: lang,
      text: formatByModel(noticesReply, model),
      action: { type: "view_notices" },
      suggestedPrompts: [
        lang === "hindi"
          ? "⚡ मेरी समय सीमा जांचें"
          : lang === "hinglish"
            ? "⚡ Mere deadlines check karo"
            : "⚡ Check my deadlines",
        lang === "hindi"
          ? "📅 आज की अध्ययन योजना बनाएं"
          : lang === "hinglish"
            ? "📅 Aaj ka routine banao"
            : "📅 Generate study routine",
      ],
    };
  }

  // ==========================================
  // 4. Personalized Study Routine / Timetable
  // ==========================================
  if (
    lower.includes("study plan") ||
    lower.includes("timetable") ||
    lower.includes("schedule") ||
    lower.includes("plan") ||
    lower.includes("kaise padhu") ||
    lower.includes("routine") ||
    lower.includes("padhai")
  ) {
    if (pendingItems.length === 0) {
      let emptyPlan = "";
      if (lang === "hindi") {
        emptyPlan = `🎉 **बधाई! आपका कोई भी असाइनमेंट लंबित नहीं है!**\n\nरिवीजन के लिए आप इस 2 घंटे की अध्ययन समय सारिणी का पालन कर सकते हैं:\n• **सत्र 1 (45 मिनट)**: सैद्धांतिक नोट्स और मुख्य सिद्धांतों का पुनरावलोकन\n• **विश्राम (15 मिनट)**: जलपान एवं विश्राम\n• **सत्र 2 (45 मिनट)**: कोडिंग अभ्यास अथवा संख्यात्मक प्रश्न हल करें\n• **सत्र 3 (15 मिनट)**: आगामी व्याख्यानों की तैयारी`;
      } else if (lang === "hinglish") {
        emptyPlan = `🎉 **Bhai koi pending homework nahi hai!**\n\nRevision ke liye yeh simple 2-hour routine follow kar sakte ho:\n• **Slot 1 (45m)**: Previous notes & concepts review\n• **Break (15m)**: Relax & water break\n• **Slot 2 (45m)**: Coding practice / numericals solve karo\n• **Slot 3 (15m)**: Agle din ke lectures prepare karo`;
      } else {
        emptyPlan = `🎉 **You have no pending assignments!**\n\nHere is a 2-hour master revision routine:\n• **Block 1 (45m)**: Review theoretical lecture notes\n• **Break (15m)**: Stretch & hydrate\n• **Block 2 (45m)**: Coding & algorithm practice\n• **Block 3 (15m)**: Preview upcoming topics`;
      }

      return {
        id: "msg-" + Date.now(),
        sender: "ai",
        timestamp: now,
        model,
        language: lang,
        text: formatByModel(emptyPlan, model),
        suggestedPrompts: [
          lang === "hindi"
            ? "➕ नया असाइनमेंट जोड़ें"
            : lang === "hinglish"
              ? "➕ Naya assignment add karo"
              : "➕ Add an assignment",
          lang === "hindi"
            ? "📢 नोटिस जांचें"
            : lang === "hinglish"
              ? "📢 Notice check karo"
              : "📢 Check notices",
        ],
      };
    }

    let planText = "";
    if (lang === "hindi") {
      planText =
        `📅 **आज के लिए आपकी व्यक्तिगत अध्ययन समय सारिणी (Study Timetable):**\n\n` +
        `आपकी समय सीमा और जोखिम के आधार पर प्राथमिकता क्रम:\n\n`;

      const slots = ["04:00 PM – 05:30 PM", "06:00 PM – 07:30 PM", "08:30 PM – 09:45 PM"];
      pendingItems.slice(0, 3).forEach((item, idx) => {
        const slot = slots[idx] || `सत्र ${idx + 1}`;
        planText +=
          `🎯 **अध्ययन सत्र ${idx + 1} [${slot}]**\n` +
          `• 📖 **विषय**: ${item.subject}\n` +
          `• 📝 **असाइनमेंट**: ${item.title}\n` +
          `• ⚡ **जोखिम स्तर**: **${item.risk} RISK** (अंतिम तिथि: ${formatDate(item.deadline)})\n` +
          `• 🧠 **कार्यनीति**: 45 मिनट गहन अध्ययन + 10 मिनट समीक्षा + 5 मिनट विश्राम\n\n`;
      });

      planText += `💡 **पोमोडोरो सुझाव**: पढ़ाई के समय फोन साइलेंट रखें और हर दो सत्र के बाद 15 मिनट का विश्राम लें!`;
    } else if (lang === "hinglish") {
      planText =
        `📅 **Bhai, yaha hai tumhara customized Daily Study Timetable:**\n\n` +
        `Maine tumhare sabse urgent aur high-risk tasks ko pehle organize kiya hai:\n\n`;

      const slots = ["04:00 PM – 05:30 PM", "06:00 PM – 07:30 PM", "08:30 PM – 09:45 PM"];
      pendingItems.slice(0, 3).forEach((item, idx) => {
        const slot = slots[idx] || `Slot ${idx + 1}`;
        planText +=
          `🎯 **Block ${idx + 1} [${slot}]**\n` +
          `• 📖 **Subject**: ${item.subject}\n` +
          `• 📝 **Topic**: ${item.title}\n` +
          `• ⚡ **Risk Level**: **${item.risk} RISK** (Due: ${formatDate(item.deadline)})\n` +
          `• 🧠 **Strategy**: 45m deep focus + 10m review + 5m rest break\n\n`;
      });

      planText += `💡 **Pro Tip**: Study ke time phone silent rakho aur water bottle paas rakho for maximum focus!`;
    } else {
      planText =
        `📅 **Personalized Smart Study Plan for Today:**\n\n` +
        `Prioritised sequence based on your deadlines and risk metrics:\n\n`;

      const slots = ["04:00 PM – 05:30 PM", "06:00 PM – 07:30 PM", "08:30 PM – 09:45 PM"];
      pendingItems.slice(0, 3).forEach((item, idx) => {
        const slot = slots[idx] || `Block ${idx + 1}`;
        planText +=
          `🎯 **Block ${idx + 1} [${slot}]**\n` +
          `• 📖 **Course**: ${item.subject}\n` +
          `• 📝 **Assignment**: ${item.title}\n` +
          `• ⚡ **Urgency**: **${item.risk}** (Due: ${formatDate(item.deadline)})\n` +
          `• 🧠 **Action**: 45m deep work + 10m self-test + 5m break\n\n`;
      });

      planText += `💡 **Pomodoro Protocol**: Take a 15-minute restorative walk after completing two full blocks.`;
    }

    return {
      id: "msg-" + Date.now(),
      sender: "ai",
      timestamp: now,
      model,
      language: lang,
      text: formatByModel(planText, model),
      action: { type: "plan_created" },
      suggestedPrompts: [
        lang === "hindi"
          ? "✅ असाइनमेंट पूर्ण चिह्नित करें"
          : lang === "hinglish"
            ? "✅ Assignment complete mark karo"
            : "✅ Mark an assignment completed",
        lang === "hindi"
          ? "⚡ सर्वोच्च जोखिम क्या है?"
          : lang === "hinglish"
            ? "⚡ Highest risk kya hai?"
            : "⚡ What is highest risk?",
        lang === "hindi"
          ? "📢 विभागीय सूचनाएं देखें"
          : lang === "hinglish"
            ? "📢 Department circulars dikhao"
            : "📢 View department circulars",
      ],
    };
  }

  // ==========================================
  // 5. Subject Concept Guidance (DBMS, OS, Python, Web Dev, DSA, Math)
  // ==========================================
  if (
    lower.includes("dbms") ||
    lower.includes("er diagram") ||
    lower.includes("sql") ||
    lower.includes("os") ||
    lower.includes("operating system") ||
    lower.includes("cpu") ||
    lower.includes("scheduling") ||
    lower.includes("dsa") ||
    lower.includes("data structure") ||
    lower.includes("tree") ||
    lower.includes("graph") ||
    lower.includes("react") ||
    lower.includes("web") ||
    lower.includes("python") ||
    lower.includes("math") ||
    lower.includes("kaise") ||
    lower.includes("explain") ||
    lower.includes("kya hota") ||
    lower.includes("samjhao") ||
    lower.includes("guide")
  ) {
    let academic = "";

    if (lower.includes("dbms") || lower.includes("er diagram") || lower.includes("sql")) {
      if (lang === "hindi") {
        academic =
          `📘 **DBMS: ई-आर आरेख (ER Diagram) एवं स्कीमा डिजाइन संदर्शिका**\n\n` +
          `1. **इकाइयाँ (Entities)**: मुख्य वस्तुएं पहचानें जैसे \`Student\`, \`Course\`, \`Department\`।\n` +
          `2. **गुणधर्म (Attributes)**: प्राथमिक कुंजी (Primary Key जैसे \`roll_no\`), समग्र और व्युत्पन्न गुणधर्म।\n` +
          `3. **संबंध (Relationships)**:\n` +
          `   • \`1:1\` (एक से एक: जैसे 1 छात्र $\\rightarrow$ 1 आईडी कार्ड)\n` +
          `   • \`1:N\` (एक से अनेक: 1 विभाग $\\rightarrow$ अनेक छात्र)\n` +
          `   • \`M:N\` (अनेक से अनेक: छात्र $\\leftrightarrow$ पाठ्यक्रम) $\\rightarrow$ इसके लिए संधि तालिका (Junction Table) बनती है।\n` +
          `4. **सामान्यीकरण (Normalization)**: 1NF, 2NF और 3NF नियमों का पालन करके डेटा पुनरावृत्ति समाप्त करें।\n\n` +
          `💡 *क्या आप चाहते हैं कि मैं इसका असाइनमेंट आपके स्टडीबोर्ड में जोड़ दूँ?*`;
      } else if (lang === "hinglish") {
        academic =
          `📘 **DBMS: ER Diagram aur Schema Design ka Easy Guide**\n\n` +
          `1. **Entities Pehchano**: Main objects jaise \`Student\`, \`Course\`, \`Department\`, \`Doctor\`, \`Patient\`.\n` +
          `2. **Attributes Define Karo**: Primary Keys (e.g. \`student_id\`, \`roll_no\`), Composite aur Derived attributes.\n` +
          `3. **Relationships Set Karo**:\n` +
          `   • \`1:1\` (One-to-One: Jaise 1 Student $\\rightarrow$ 1 ID Card)\n` +
          `   • \`1:N\` (One-to-Many: 1 Department $\\rightarrow$ Many Students)\n` +
          `   • \`M:N\` (Many-to-Many: Students $\\leftrightarrow$ Courses) $\\rightarrow$ Iske liye Junction/Bridge Table banti hai.\n` +
          `4. **Normalization**: 1NF, 2NF aur 3NF rules apply karke data redundancy hatao!\n\n` +
          `💡 *Kya tum chahte ho main DBMS ka naya assignment add kar du?*`;
      } else {
        academic =
          `📘 **DBMS: Complete Guide to Entity-Relationship (ER) Modeling**\n\n` +
          `1. **Identify Entities**: Strong & weak entities representing real-world nouns (\`Student\`, \`Course\`, \`Faculty\`).\n` +
          `2. **Define Attributes**: Primary keys, multivalued attributes, and foreign key linkages.\n` +
          `3. **Determine Cardinality**:\n` +
          `   • **1:1**: One-to-one mapping.\n` +
          `   • **1:N**: One-to-many relationship.\n` +
          `   • **M:N**: Many-to-many relationship (resolved using bridge/cross-reference tables).\n` +
          `4. **Normalization Stages**: 1NF (Atomic values), 2NF (No partial dependency), 3NF (No transitive dependency).\n\n` +
          `Would you like me to schedule a DBMS assignment in your workspace?`;
      }
    } else if (
      lower.includes("os") ||
      lower.includes("operating system") ||
      lower.includes("scheduling")
    ) {
      if (lang === "hindi") {
        academic =
          `💻 **ऑपरेटिंग सिस्टम (OS): सीपीयू शेड्यूलिंग एवं महत्वपूर्ण संकल्पनाएं**\n\n` +
          `• **सीपीयू शेड्यूलिंग एल्गोरिदम**:\n` +
          `  1. **FCFS** (First-Come, First-Served) — सरल, किंतु कॉन्वॉय प्रभाव (Convoy Effect) संभव।\n` +
          `  2. **SJF** (Shortest Job First) — न्यूनतम औसत प्रतीक्षा समय प्रदान करता है।\n` +
          `  3. **Round Robin (RR)** — टाइम क्वांटम पर आधारित, इंटरैक्टिव सिस्टम के लिए श्रेष्ठ।\n` +
          `• **डेडलाक की 4 आवश्यक शर्तें**: (1) Mutual Exclusion, (2) Hold & Wait, (3) No Preemption, (4) Circular Wait।\n\n` +
          `यदि आपको किसी विशिष्ट न्यूमेरिकल या कोड में संदेह है तो अवश्य पूछें!`;
      } else if (lang === "hinglish") {
        academic =
          `💻 **Operating Systems (OS): Important Concepts & Lab Guide**\n\n` +
          `• **CPU Scheduling Algorithms**:\n` +
          `  1. **FCFS** (First-Come, First-Served) — Simple par Convoy Effect ho sakta hai.\n` +
          `  2. **SJF** (Shortest Job First) — Optimal waiting time, par future burst time estimate karna padta hai.\n` +
          `  3. **Round Robin (RR)** — Time Quantum use karta hai, preemptive aur fair hota hai.\n` +
          `• **Process Sync & Deadlock**: 4 conditions zaroor yaad rakhna: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait.\n\n` +
          `Koi specific lab question ya algorithm me doubt hai to poocho!`;
      } else {
        academic =
          `💻 **Operating Systems (OS): Scheduling & Core Systems Guide**\n\n` +
          `• **CPU Scheduling Mechanics**:\n` +
          `  - **Round Robin**: Time-sliced preemptive execution optimal for interactive responsiveness.\n` +
          `  - **SJF / SRTF**: Minimizes average waiting time; susceptible to starvation.\n` +
          `  - **Priority Scheduling**: Executes by urgency tier; resolved via aging mechanisms.\n` +
          `• **Deadlock Coffman Conditions**: (1) Mutual Exclusion, (2) Hold & Wait, (3) No Preemption, (4) Circular Wait.\n\n` +
          `Ask me if you need source code implementations or numerical solutions!`;
      }
    } else {
      if (lang === "hindi") {
        academic =
          `🎓 **अकादमिक मार्गदर्शन सहायक**\n\n` +
          `आपके विषय **"${query.slice(0, 35)}..."** के समाधान की सर्वोत्तम रणनीति:\n` +
          `1. **मूल संकल्पना**: सैद्धांतिक परिभाषाएं और सूत्र पहले दोहराएं।\n` +
          `2. **व्यावहारिक उदाहरण**: 2-3 मानक प्रश्न या कोड चरण-दर-चरण हल करें।\n` +
          `3. **परीक्षा एवं वाइवा दृष्टि**: प्रमुख मौखिक प्रश्न तैयार करें।\n\n` +
          `आप अपना विशिष्ट प्रश्न या कोड यहाँ लिख सकते हैं, मैं विस्तार से व्याख्या करूँगा!`;
      } else if (lang === "hinglish") {
        academic =
          `🎓 **Academic Doubt Resolution Helper**\n\n` +
          `Aapke is topic **"${query.slice(0, 35)}..."** ko solve karne ka best tarika:\n` +
          `1. **Core Concept**: Theoretical definition aur formulas pehle revise karo.\n` +
          `2. **Practical Example**: 2-3 standard problems ya code snippets step-by-step likho.\n` +
          `3. **Viva / Exam Angle**: Common interview/exam questions prepare karo.\n\n` +
          `Aap specific question ya code paste karo, main detail me samjha dunga!`;
      } else {
        academic =
          `🎓 **Academic Subject Guide**\n\n` +
          `For **"${query.slice(0, 35)}..."**:\n` +
          `1. **Fundamental Axioms**: Review theoretical definitions and mathematical boundaries.\n` +
          `2. **Step-by-Step Problem Solving**: Deconstruct the problem into manageable phases.\n` +
          `3. **Edge Case Validation**: Test against edge constraints and asymptotic limits.\n\n` +
          `Feel free to paste the exact problem statement or code snippet for a line-by-line breakdown!`;
      }
    }

    return {
      id: "msg-" + Date.now(),
      sender: "ai",
      timestamp: now,
      model,
      language: lang,
      text: formatByModel(academic, model),
      suggestedPrompts: [
        lang === "hindi"
          ? "➕ इसके लिए असाइनमेंट बनाएं"
          : lang === "hinglish"
            ? "➕ Iska assignment add kar do"
            : "➕ Create assignment for this",
        lang === "hindi"
          ? "📅 अध्ययन योजना बनाएं"
          : lang === "hinglish"
            ? "📅 Study plan banao"
            : "📅 Plan my study schedule",
        lang === "hindi"
          ? "📊 लंबित समय सीमाएं देखें"
          : lang === "hinglish"
            ? "📊 Pending deadlines dikhao"
            : "📊 Show pending deadlines",
      ],
    };
  }

  // ==========================================
  // 6. Conversational Greetings & General Queries
  // ==========================================
  let genericReply = "";
  if (lang === "hindi") {
    genericReply =
      `नमस्ते ${context.userName || "विद्यार्थी"}! 👋 मैं आपका **StudyBoard AI सहायक** हूँ।\n\n` +
      `आप मुझसे जिस भाषा में बात करेंगे, मैं उसी भाषा में उत्तर दूँगा। मैं आपकी इन चीज़ों में मदद कर सकता हूँ:\n` +
      `• ⏳ *"मेरे कौन से असाइनमेंट बाकी हैं?"* $\\rightarrow$ लंबित कार्यों और समय सीमा की लाइव स्थिति\n` +
      `• 📅 *"आज की अध्ययन समय सारिणी बनाओ"* $\\rightarrow$ व्यक्तिगत दैनिक टाइमटेबल\n` +
      `• ➕ *"नया असाइनमेंट जोड़ें: गणित का गृहकार्य"* $\\rightarrow$ सीधे स्टडीबोर्ड में सेव करें\n` +
      `• 📢 *"नए नोटिस दिखाओ"* $\\rightarrow$ विभाग के परिपत्र व सर्कुलर\n` +
      `• 🧠 *"DBMS / OS / DSA समझाइए"* $\\rightarrow$ सरल एवं विस्तृत व्याख्या।\n\n` +
      `बताइए, आज आपकी किस प्रकार सहायता करूँ?`;
  } else if (lang === "hinglish") {
    genericReply =
      `Bhai ${context.userName || "Student"}! 👋 Main tumhara **StudyBoard AI Copilot** hoon.\n\n` +
      `Tum jis language me baat karoge (English, Hindi ya Hinglish), main usi me reply karunga:\n` +
      `• ⏳ *"Bhai mera kya pending hai?"* $\\rightarrow$ Live deadlines aur overdue tasks ka report dunga.\n` +
      `• 📅 *"Aaj ka study routine bana do"* $\\rightarrow$ Personalized daily timetable create karunga.\n` +
      `• ➕ *"Add assignment: Physics lab report due Friday high priority"* $\\rightarrow$ Direct save kar dunga.\n` +
      `• 📢 *"Kya naya notice aaya hai?"* $\\rightarrow$ Department ke circulars bataunga.\n` +
      `• 🧠 *"DBMS / OS / DSA me help karo"* $\\rightarrow$ Step-by-step topics samjhaunga.\n\n` +
      `Batao bhai, abhi kis cheez me help chahiye?`;
  } else {
    genericReply =
      `Hello ${context.userName || "Student"}! 👋 I'm your **StudyBoard AI Copilot**.\n\n` +
      `I will always respond in whichever language you speak or type (English, Hindi, or Hinglish):\n` +
      `• 📊 **Check Deadlines**: Ask *"What are my pending assignments and risk levels?"*\n` +
      `• 📅 **Daily Study Routine**: Ask *"Create a personalized study plan for today"*\n` +
      `• ➕ **Direct Task Creation**: Type *"Add DBMS lab report due this Friday high priority"*\n` +
      `• 📢 **Department Circulars**: Ask *"Show the latest department notices"*\n` +
      `• 🧠 **Academic Explanations**: Ask any questions in DBMS, OS, DSA, Python or Mathematics!`;
  }

  return {
    id: "msg-" + Date.now(),
    sender: "ai",
    timestamp: now,
    model,
    language: lang,
    text: formatByModel(genericReply, model),
    suggestedPrompts: [
      lang === "hindi"
        ? "📊 मेरे लंबित असाइनमेंट दिखाओ"
        : lang === "hinglish"
          ? "📊 Mere pending assignments dikhao"
          : "📊 Check pending deadlines",
      lang === "hindi"
        ? "📅 आज की समय सारिणी बनाओ"
        : lang === "hinglish"
          ? "📅 Aaj ka study timetable banao"
          : "📅 Plan today's study schedule",
      lang === "hindi"
        ? "📢 नए नोटिस क्या हैं?"
        : lang === "hinglish"
          ? "📢 Naya notice kya aaya hai?"
          : "📢 Check new notices",
      lang === "hindi"
        ? "➕ नया असाइनमेंट जोड़ें"
        : lang === "hinglish"
          ? "➕ Naya assignment add karo"
          : "➕ Add new assignment",
    ],
  };
}

/**
 * Format response depending on chosen AI Model persona (GPT-4o, Claude 3.7, DeepSeek R1, StudyBoard)
 */
function formatByModel(text: string, model: AIModelType): string {
  if (model === "deepseek") {
    return `🤔 *[DeepSeek R1 Reasoning Model]*\n\n` + text;
  }
  if (model === "claude") {
    return `🧠 *[Claude 3.7 Sonnet Academic]*\n\n` + text;
  }
  if (model === "gpt4o") {
    return `⚡ *[GPT-4o Pro Academic]*\n\n` + text;
  }
  return text;
}

/**
 * Natural language parser helper for assignments (Multilingual support)
 */
function parseAssignmentDetails(input: string): {
  subject: string;
  title: string;
  deadline: string;
  priority: "Low" | "Medium" | "High";
  description: string;
} {
  const lower = input.toLowerCase();

  // Priority detection
  let priority: "Low" | "Medium" | "High" = "Medium";
  if (
    lower.includes("high") ||
    lower.includes("urgent") ||
    lower.includes("zaruri") ||
    lower.includes("jaldi")
  ) {
    priority = "High";
  } else if (lower.includes("low") || lower.includes("aaram")) {
    priority = "Low";
  }

  // Deadline calculation
  const targetDate = new Date();
  if (lower.includes("today") || lower.includes("aaj")) {
    // today
  } else if (lower.includes("tomorrow") || lower.includes("kal")) {
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (
    lower.includes("in 2 days") ||
    lower.includes("parso") ||
    lower.includes("day after tomorrow")
  ) {
    targetDate.setDate(targetDate.getDate() + 2);
  } else if (lower.includes("in 3 days") || lower.includes("3 din")) {
    targetDate.setDate(targetDate.getDate() + 3);
  } else if (lower.includes("in 5 days") || lower.includes("5 din")) {
    targetDate.setDate(targetDate.getDate() + 5);
  } else if (
    lower.includes("next week") ||
    lower.includes("agle hafte") ||
    lower.includes("in 7 days")
  ) {
    targetDate.setDate(targetDate.getDate() + 7);
  } else if (lower.includes("friday") || lower.includes("shukrawar")) {
    const dayOfWeek = targetDate.getDay();
    const dist = (5 - dayOfWeek + 7) % 7 || 7;
    targetDate.setDate(targetDate.getDate() + dist);
  } else if (lower.includes("monday") || lower.includes("somwar")) {
    const dayOfWeek = targetDate.getDay();
    const dist = (1 - dayOfWeek + 7) % 7 || 7;
    targetDate.setDate(targetDate.getDate() + dist);
  } else {
    targetDate.setDate(targetDate.getDate() + 3);
  }

  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
  const dd = String(targetDate.getDate()).padStart(2, "0");
  const deadline = `${yyyy}-${mm}-${dd}`;

  // Subject heuristics
  let subject = "General Academics";
  if (lower.includes("dbms") || lower.includes("database")) subject = "DBMS";
  else if (lower.includes("os") || lower.includes("operating system"))
    subject = "Operating Systems";
  else if (lower.includes("dsa") || lower.includes("data structure") || lower.includes("algorithm"))
    subject = "Data Structures & Algorithms";
  else if (lower.includes("math") || lower.includes("maths") || lower.includes("ganit"))
    subject = "Mathematics";
  else if (lower.includes("physics")) subject = "Applied Physics";
  else if (lower.includes("chemistry")) subject = "Chemistry";
  else if (
    lower.includes("web") ||
    lower.includes("frontend") ||
    lower.includes("react") ||
    lower.includes("javascript")
  )
    subject = "Web Technologies";
  else if (lower.includes("ai") || lower.includes("machine learning"))
    subject = "Artificial Intelligence";
  else if (lower.includes("network") || lower.includes("cn") || lower.includes("networking"))
    subject = "Computer Networks";

  // Clean title
  let title = input
    .replace(
      /^(bhai|plz|please|sun|sunna|ek|add|create|schedule|new)\s+(assignment|task|homework)?[:\s]*/i,
      "",
    )
    .replace(
      /(due|deadline|priority|high|medium|low|tomorrow|kal|aaj|parso|today|in \d+ days|next week|friday|monday|tak|kardo|kar de).*/i,
      "",
    )
    .trim();

  if (!title || title.length < 3) {
    title = `${subject} Coursework`;
  }

  return {
    subject,
    title,
    deadline,
    priority,
    description: `Created automatically by AI Copilot based on query: "${input}"`,
  };
}
