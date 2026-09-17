export type Locale = "en" | "hi" | "te";

export interface LocaleOption {
  code: Locale;
  label: string;
  nativeName: string;
}

export const SUPPORTED_LOCALES: LocaleOption[] = [
  { code: "en", label: "English", nativeName: "English" },
  { code: "hi", label: "Hindi", nativeName: "हिन्दी" },
  { code: "te", label: "Telugu", nativeName: "తెలుగు" },
];

export const DEFAULT_LOCALE: Locale = "en";

export const TRANSLATIONS = {
  en: {
    // Brand & Header
    app_title: "CoalGuard AI",
    app_subtitle: "AI-Powered Smart Governance & Compliance Monitoring System for Coal Mines",
    ministry_label: "Ministry of Coal / Coal India Limited (SIH26024)",
    cil_label: "Ministry of Coal / CIL",

    // Navigation Items
    nav_dashboard: "Dashboard",
    nav_mines: "Mines",
    nav_map: "Map",
    nav_compliance: "Compliance",
    nav_corrective_actions: "Corrective Actions",
    nav_documents: "Documents",
    nav_assistant: "AI Assistant",
    nav_inspections: "Inspections",
    nav_observations: "Observations",
    nav_incidents: "Incidents",
    nav_contractors: "Contractors",
    nav_workers: "Workers",
    nav_attendance: "Attendance",
    nav_environmental: "Environmental",
    nav_production: "Production",
    nav_reports: "Reports",
    nav_grievances: "Grievances",
    nav_audit: "Audit Log",
    nav_admin: "Administration",
    nav_notifications: "Notifications",

    // Navigation Groups
    group_overview: "Overview",
    group_governance: "Governance",
    group_field_operations: "Field Operations",
    group_workforce: "Workforce",
    group_operations: "Operations",
    group_administration: "Administration",

    // Roles
    role_super_admin: "Super Admin",
    role_corporate_admin: "Corporate Admin",
    role_mine_manager: "Mine Manager",
    role_inspector: "Inspector",
    role_contractor: "Contractor",
    role_regulator: "Regulator",
    no_role: "No role",

    // Authentication & Demo
    sign_in: "Sign in",
    signing_in: "Signing in…",
    sign_out: "Sign out",
    email_label: "Email",
    password_label: "Password",
    demo_mode_banner: "Demo mode — fictional seeded data, local demo session. Not a live government system.",
    demo_mode_badge: "Demo mode is enabled on this deployment.",
    explore_as_role: "Explore as team persona",
    enter_demo_workspace: "Enter demo workspace",
    demo_disclaimer: "A demo session renders the role-based interface with fictional seeded data. It grants no real access — database row-level security remains the only authorization boundary.",
    demo_sih_note: "Prototype developed for Smart India Hackathon problem statement SIH26024. Not an official system of the Ministry of Coal or Coal India Limited.",
    demo_role_label: "Demo persona",

    // Actions & Buttons
    btn_save: "Save",
    btn_submit: "Submit",
    btn_cancel: "Cancel",
    btn_delete: "Delete",
    btn_edit: "Edit",
    btn_create: "Create",
    btn_view: "View",
    btn_refresh: "Refresh",
    btn_search: "Search",
    btn_filter: "Filter",
    btn_export: "Export",
    btn_download: "Download",
    btn_upload: "Upload",
    btn_sync: "Sync queue",
    btn_syncing: "Syncing…",
    btn_back: "Back",
    btn_close: "Close",
    btn_start_inspection: "Start inspection",
    btn_report_incident: "Report incident",
    btn_record_attendance: "Record attendance",
    btn_offline_queue: "Offline queue",

    // Mobile / Field
    field_workspace: "Field workspace",
    field_workspace_desc: "Record inspections, incidents and attendance",
    sync_status: "Sync status",
    pending_label: "Pending",
    failed_label: "Failed",
    synced_label: "Synced",
    offline_notice: "You are offline. Records you capture are saved on the device and will sync automatically when a connection returns.",
    status_online: "Online",
    status_offline: "Offline",
    status_unknown: "Unknown",
    record_something: "Record field data",

    // Statuses & Severity
    status_compliant: "Compliant",
    status_due_soon: "Due Soon",
    status_overdue: "Overdue",
    status_non_compliant: "Non-compliant",
    status_under_review: "Under Review",
    status_not_applicable: "Not Applicable",
    status_open: "Open",
    status_in_progress: "In Progress",
    status_completed: "Completed",
    status_verified: "Verified",
    status_active: "Active",
    status_inactive: "Inactive",
    status_approved: "Approved",
    status_resolved: "Resolved",
    status_submitted: "Submitted",

    severity_low: "Low",
    severity_medium: "Medium",
    severity_high: "High",
    severity_critical: "Critical",

    // Common Labels
    loading_label: "Loading your workspace…",
    status_label: "Status",
    priority_label: "Priority",
    deadline_label: "Deadline",
    actions_label: "Actions",
    details_label: "Details",
    language_label: "Language",
    notifications_label: "Notifications",
    unread_label: "unread",
    empty_records: "No records found.",

    // AI & Governance
    ai_risk_score_label: "Predictive Risk Score",
    ai_recommendations_label: "AI Compliance Recommendations",
    ai_anomaly_label: "Anomaly Detection",
  },

  hi: {
    // Brand & Header
    app_title: "कोलार्ड एआई (CoalGuard AI)",
    app_subtitle: "कोयला खदानों के लिए एआई-संचालित स्मार्ट गवर्नेंस और अनुपालन निगरानी प्रणाली",
    ministry_label: "कोयला मंत्रालय / कोल इंडिया लिमिटेड (SIH26024)",
    cil_label: "कोयला मंत्रालय / सीआईएल",

    // Navigation Items
    nav_dashboard: "डैशबोर्ड",
    nav_mines: "खदानें",
    nav_map: "मानचित्र",
    nav_compliance: "अनुपालन",
    nav_corrective_actions: "सुधारात्मक कार्रवाई (CAPA)",
    nav_documents: "दस्तावेज़",
    nav_assistant: "एआई सहायक",
    nav_inspections: "निरीक्षण",
    nav_observations: "अवलोकन",
    nav_incidents: "घटनाएं",
    nav_contractors: "ठेकेदार",
    nav_workers: "श्रमिक",
    nav_attendance: "उपस्थिति",
    nav_environmental: "पर्यावरण निगरानी",
    nav_production: "उत्पादन डाटा",
    nav_reports: "रिपोर्ट",
    nav_grievances: "शिकायतें",
    nav_audit: "ऑडिट लॉग",
    nav_admin: "प्रशासन",
    nav_notifications: "सूचनाएं",

    // Navigation Groups
    group_overview: "सिंहावलोकन",
    group_governance: "शासन एवं अनुपालन",
    group_field_operations: "फील्ड संचालन",
    group_workforce: "कार्यबल",
    group_operations: "खदान संचालन",
    group_administration: "प्रशासन",

    // Roles
    role_super_admin: "सुपर एडमिन",
    role_corporate_admin: "कॉर्पोरेट एडमिन",
    role_mine_manager: "खदान प्रबंधक",
    role_inspector: "सुरक्षा निरीक्षक",
    role_contractor: "ठेकेदार",
    role_regulator: "नियामक",
    no_role: "कोई भूमिका नहीं",

    // Authentication & Demo
    sign_in: "साइन इन करें",
    signing_in: "साइन इन हो रहा है…",
    sign_out: "साइन आउट",
    email_label: "ईमेल",
    password_label: "पासवर्ड",
    demo_mode_banner: "डेमो मोड — काल्पनिक बीज डेटा, स्थानीय डेमो सत्र। यह कोई लाइव सरकारी प्रणाली नहीं है।",
    demo_mode_badge: "इस डिप्लॉयमेंट पर डेमो मोड सक्रिय है।",
    explore_as_role: "टीम सदस्य के रूप में देखें",
    enter_demo_workspace: "डेमो कार्यक्षेत्र में प्रवेश करें",
    demo_disclaimer: "डेमो सत्र काल्पनिक डेटा के साथ भूमिका-आधारित इंटरफ़ेस दिखाता है। डेटाबेस रो-लेवल सुरक्षा ही वास्तविक प्राधिकरण सीमा है।",
    demo_sih_note: "स्मार्ट इंडिया हैकथॉन समस्या विवरण SIH26024 के लिए विकसित प्रोटोटाइप। कोयला मंत्रालय या कोल इंडिया लिमिटेड की आधिकारिक प्रणाली नहीं है।",
    demo_role_label: "डेमो भूमिका",

    // Actions & Buttons
    btn_save: "सहेजें",
    btn_submit: "जमा करें",
    btn_cancel: "रद्द करें",
    btn_delete: "हटाएं",
    btn_edit: "संपादित करें",
    btn_create: "बनाएं",
    btn_view: "देखें",
    btn_refresh: "ताज़ा करें",
    btn_search: "खोजें",
    btn_filter: "फ़िल्टर",
    btn_export: "निर्यात",
    btn_download: "डाउनलोड",
    btn_upload: "अपलोड",
    btn_sync: "कतार सिंक करें",
    btn_syncing: "सिंक हो रहा है…",
    btn_back: "वापस",
    btn_close: "बंद करें",
    btn_start_inspection: "निरीक्षण शुरू करें",
    btn_report_incident: "घटना दर्ज करें",
    btn_record_attendance: "उपस्थिति दर्ज करें",
    btn_offline_queue: "ऑफ़लाइन कतार",

    // Mobile / Field
    field_workspace: "फील्ड कार्यक्षेत्र",
    field_workspace_desc: "निरीक्षण, घटनाएं और उपस्थिति दर्ज करें",
    sync_status: "सिंक स्थिति",
    pending_label: "लंबित",
    failed_label: "विफल",
    synced_label: "सिंक हुआ",
    offline_notice: "आप ऑफ़लाइन हैं। आपके द्वारा दर्ज किए गए रिकॉर्ड डिवाइस पर सुरक्षित हैं और कनेक्शन मिलने पर स्वतः सिंक हो जाएंगे।",
    status_online: "ऑनलाइन",
    status_offline: "ऑफ़लाइन",
    status_unknown: "अज्ञात",
    record_something: "फील्ड डेटा दर्ज करें",

    // Statuses & Severity
    status_compliant: "अनुपालन पूर्ण",
    status_due_soon: "शीघ्र देय",
    status_overdue: "अतिदेय",
    status_non_compliant: "गैर-अनुपालन",
    status_under_review: "समीक्षाधीन",
    status_not_applicable: "लागू नहीं",
    status_open: "खुला",
    status_in_progress: "प्रगति पर",
    status_completed: "पूर्ण",
    status_verified: "सत्यापित",
    status_active: "सक्रिय",
    status_inactive: "निष्क्रिय",
    status_approved: "स्वीकृत",
    status_resolved: "समाधानित",
    status_submitted: "प्रस्तुत",

    severity_low: "निम्न",
    severity_medium: "मध्यम",
    severity_high: "उच्च",
    severity_critical: "गंभीर",

    // Common Labels
    loading_label: "आपका कार्यक्षेत्र लोड हो रहा है…",
    status_label: "स्थिति",
    priority_label: "प्राथमिकता",
    deadline_label: "समय सीमा",
    actions_label: "कार्रवाई",
    details_label: "विवरण",
    language_label: "भाषा",
    notifications_label: "सूचनाएं",
    unread_label: "अपठित",
    empty_records: "कोई रिकॉर्ड नहीं मिला।",

    // AI & Governance
    ai_risk_score_label: "पूर्वानुमानित जोखिम स्कोर",
    ai_recommendations_label: "एआई अनुपालन सिफारिशें",
    ai_anomaly_label: "विसंगति का पता लगाना",
  },

  te: {
    // Brand & Header
    app_title: "కోల్‌గార్డ్ ఏఐ (CoalGuard AI)",
    app_subtitle: "బొగ్గు గనుల కోసం ఏఐ-ఆధారిత స్మార్ట్ గవర్నెన్స్ మరియు సమ్మతి పర్యవేక్షణ వ్యవస్థ",
    ministry_label: "బొగ్గు మంత్రిత్వ శాఖ / కోల్ ఇండియా లిమిటెడ్ (SIH26024)",
    cil_label: "బొగ్గు మంత్రిత్వ శాఖ / సిఐఎల్",

    // Navigation Items
    nav_dashboard: "డాష్‌బోర్డ్",
    nav_mines: "గనులు",
    nav_map: "పటం (Map)",
    nav_compliance: "సమ్మతి",
    nav_corrective_actions: "దిద్దుబాటు చర్యలు (CAPA)",
    nav_documents: "పత్రాలు",
    nav_assistant: "ఏఐ సహాయకుడు",
    nav_inspections: "తనిఖీలు",
    nav_observations: "పరిశీలనలు",
    nav_incidents: "సంఘటనలు",
    nav_contractors: "కాంట్రాక్టర్లు",
    nav_workers: "కార్మికులు",
    nav_attendance: "హాజరు",
    nav_environmental: "పర్యావరణ పర్యవేక్షణ",
    nav_production: "ఉత్పత్తి సమాచారం",
    nav_reports: "నివేదికలు",
    nav_grievances: "ఫిర్యాదులు",
    nav_audit: "ఆడిట్ లాగ్",
    nav_admin: "పరిపాలన",
    nav_notifications: "నోటిఫికేషన్లు",

    // Navigation Groups
    group_overview: "అవలోకనం",
    group_governance: "పాలన మరియు సమ్మతి",
    group_field_operations: "ఫీల్డ్ ఆపరేషన్స్",
    group_workforce: "శ్రామిక శక్తి",
    group_operations: "గని కార్యకలాపాలు",
    group_administration: "పరిపాలన",

    // Roles
    role_super_admin: "సూపర్ అడ్మిన్",
    role_corporate_admin: "కార్పొరేట్ అడ్మిన్",
    role_mine_manager: "గని మేనేజర్",
    role_inspector: "భద్రతా ఇన్‌స్పెక్టర్",
    role_contractor: "కాంట్రాక్టర్",
    role_regulator: "నియంత్రణాధికారి",
    no_role: "పాత్ర లేదు",

    // Authentication & Demo
    sign_in: "సైన్ ఇన్ చేయండి",
    signing_in: "సైన్ ఇన్ అవుతోంది…",
    sign_out: "సైన్ అవుట్",
    email_label: "ఈమెయిల్",
    password_label: "పాస్‌వర్డ్",
    demo_mode_banner: "డెమో మోడ్ — కల్పిత డెమో డేటా, స్థానిక సెషన్. ఇది ప్రత్యక్ష ప్రభుత్వ వ్యవస్థ కాదు.",
    demo_mode_badge: "ఈ విస్తరణలో డెమో మోడ్ ప్రారంభించబడింది.",
    explore_as_role: "టీమ్ సభ్యునిగా అన్వేషించండి",
    enter_demo_workspace: "డెమో వర్క్‌స్పేస్‌లోకి ప్రవేశించండి",
    demo_disclaimer: "డెమో సెషన్ కల్పిత డేటాతో పాత్ర-ఆధారిత ఇంటర్‌ఫేస్‌ను చూపుతుంది. డేటాబేస్ రో-లెవల్ సెక్యూరిటీ మాత్రమే ప్రామాణిక సరిహద్దు.",
    demo_sih_note: "స్మార్ట్ ఇండియా హ్యాకథాన్ సమస్య ప్రకటన SIH26024 కోసం అభివృద్ధి చేయబడిన నమూనా. బొగ్గు మంత్రిత్వ శాఖ లేదా కోల్ ఇండియా లిమిటెడ్ అధికారిక వ్యవస్థ కాదు.",
    demo_role_label: "డెమో పాత్ర",

    // Actions & Buttons
    btn_save: "సేవ్ చేయండి",
    btn_submit: "సమర్పించండి",
    btn_cancel: "రద్దు చేయండి",
    btn_delete: "తొలగించండి",
    btn_edit: "సవరించండి",
    btn_create: "సృష్టించండి",
    btn_view: "చూడండి",
    btn_refresh: "రిఫ్రెష్ చేయండి",
    btn_search: "వెతకండి",
    btn_filter: "ఫిల్టర్",
    btn_export: "ఎగుమతి",
    btn_download: "డౌన్‌లోడ్",
    btn_upload: "అప్‌లోడ్",
    btn_sync: "క్యూను సింక్ చేయండి",
    btn_syncing: "సింక్ అవుతోంది…",
    btn_back: "వెనుకకు",
    btn_close: "మూసివేయండి",
    btn_start_inspection: "తనిఖీని ప్రారంభించండి",
    btn_report_incident: "సంఘటనను నివేదించండి",
    btn_record_attendance: "హాజరును నమోదు చేయండి",
    btn_offline_queue: "ఆఫ్‌లైన్ క్యూ",

    // Mobile / Field
    field_workspace: "ఫీల్డ్ వర్క్‌స్పేస్",
    field_workspace_desc: "తనిఖీలు, సంఘటనలు మరియు హాజరు నమోదు చేయండి",
    sync_status: "సింక్ స్థితి",
    pending_label: "పెండింగ్‌లో ఉంది",
    failed_label: "విఫలమైంది",
    synced_label: "సింక్ చేయబడింది",
    offline_notice: "మీరు ఆఫ్‌లైన్‌లో ఉన్నారు. మీరు నమోదు చేసిన రికార్డులు పరికరంలో భద్రపరచబడతాయి మరియు కనెక్షన్ పునరుద్ధరించబడినప్పుడు స్వయంచాలకంగా సింక్ అవుతాయి.",
    status_online: "ఆన్‌లైన్",
    status_offline: "ఆఫ్‌లైన్",
    status_unknown: "తెలియదు",
    record_something: "ఫీల్డ్ సమాచారాన్ని నమోదు చేయండి",

    // Statuses & Severity
    status_compliant: "సమ్మతి పూర్తయింది",
    status_due_soon: "త్వరలో గడువు",
    status_overdue: "గడువు ముగిసింది",
    status_non_compliant: "నిబంధనల ఉల్లంఘన",
    status_under_review: "సమీక్షలో ఉంది",
    status_not_applicable: "వర్తించదు",
    status_open: "తెరిచి ఉంది",
    status_in_progress: "పురోగతిలో ఉంది",
    status_completed: "పూర్తయింది",
    status_verified: "ధృవీకరించబడింది",
    status_active: "క్రియాశీల",
    status_inactive: "నిష్క్రియాత్మక",
    status_approved: "ఆమోదించబడింది",
    status_resolved: "పరిష్కరించబడింది",
    status_submitted: "సమర్పించబడింది",

    severity_low: "తక్కువ",
    severity_medium: "మధ్యస్థ",
    severity_high: "అధిక",
    severity_critical: "తీవ్రమైన",

    // Common Labels
    loading_label: "మీ వర్క్‌స్పేస్ లోడ్ అవుతోంది…",
    status_label: "స్థితి",
    priority_label: "ప్రాధాన్యత",
    deadline_label: "గడువు",
    actions_label: "చర్యలు",
    details_label: "వివరాలు",
    language_label: "భాష",
    notifications_label: "నోటిఫికేషన్లు",
    unread_label: "చదవనివి",
    empty_records: "రికార్డులు కనుగొనబడలేదు.",

    // AI & Governance
    ai_risk_score_label: "అంచనా వేసిన ప్రమాద స్కోరు",
    ai_recommendations_label: "ఏఐ సమ్మతి సిఫార్సులు",
    ai_anomaly_label: "క్రమరాహిత్యం గుర్తింపు",
  },
};

export type TranslationKey = keyof typeof TRANSLATIONS.en;

export function getTranslation(key: TranslationKey, locale: Locale = DEFAULT_LOCALE): string {
  const table = TRANSLATIONS[locale] || TRANSLATIONS.en;
  return (table as Record<string, string>)[key] || TRANSLATIONS.en[key] || key;
}
