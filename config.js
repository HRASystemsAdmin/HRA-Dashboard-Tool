/* ==========================================================================
   Hunter Recruitment Advisors · Request Center — configuration
   Edit this file only. Everything else reads from it.
   ========================================================================== */

window.HRA_CONFIG = {

  /* 1) Firebase project keys (Firebase console → Project settings → Your apps → Web app).
        Leave apiKey empty to run in DEMO MODE (data stays in this browser only). */
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    appId: ""
  },

  /* 2) Who can use the tool. Emails are compared in lowercase.
        Keep these lists identical to the ones in firestore.rules —
        the rules are what actually protect the data. */
  admins: [
    "admin@yourcompany.com"
  ],
  members: [
    "employee@yourcompany.com"
  ],

  /* 3) Attachments. Files are saved inside Firestore, so the free Firebase plan works
        (about 1 GB total). Photos and screenshots are compressed automatically. */
  attachments: {
    maxFiles: 8,
    maxSizeMB: 5
  },

  /* 4) Email for request types with "emailTo".
        method "outlook": after sending, the person's email app (Outlook) opens with
        the email already filled in; they check it and click Send. No setup needed.
        method "emailjs": sends automatically through EmailJS (fill in the keys below;
        setup is in README.md). */
  email: {
    method: "outlook",
    siteUrl: "",       // optional, e.g. "https://your-username.github.io/request-center/"

    publicKey: "",
    serviceId: "",
    templateId: ""
  },

  /* 5) Tile groups. Request types with the same "group" share one tile on the home
        screen; clicking it first asks which kind of request it is. */
  groups: {
    phone: {
      label: "Phone Queues",
      blurb: "Add members to a queue or set up a new one.",
      icon: "phone",
      question: "What do you need?"
    }
  },

  /* 6) Request types. To add a new one, copy a block and change it.
        group: puts the type under a shared tile (see groups above).
        adminOnly: true shows the type to admins only.
        adminTab: gives the type its own admin tab instead of the main Admin queue.
        Field types: text, email, url, tel, textarea, date, select (options),
        chips (multi-select pills), checks (checkboxes; "locked" ones are always on),
        picker (collapsible section: add items one at a time; items with "options" ask for a value),
        heading (a section title inside the form).
        showIf: { field, equals } only shows a field when another field has that value.
        suggestions: [...] offers typing suggestions on a text field. */
  requestTypes: {
    phone_queue: {
      group: "phone",
      label: "Add members to a queue",
      short: "Add members",
      blurb: "Get someone added to an existing call queue.",
      icon: "userplus",
      fields: [
        { name: "queueName",   label: "Phone queue name",             type: "text",     required: true,  placeholder: "e.g. HRA Recruiting" },
        { name: "members",     label: "Who should be added",          type: "text",     required: true,  placeholder: "Full name(s), separated by commas" },
        { name: "emails",      label: "Their work email(s)",          type: "text",     required: true,  placeholder: "name@yourcompany.com" },
        { name: "permissions", label: "Permissions needed",           type: "checks",   required: true,
          options: ["Access", "Download", "Delete", "Share"], locked: ["Access"] },
        { name: "notes",       label: "Anything else we should know", type: "textarea", required: false, placeholder: "Which queue, temporary access, etc." }
      ],
      title: (d) => `Add ${d.members || "member"} to ${d.queueName || "a phone queue"}`
    },

    new_phone_queue: {
      group: "phone",
      label: "Create a new phone queue",
      short: "New queue",
      blurb: "Set up a new call queue for a client.",
      icon: "queue",
      fields: [
        { name: "clientName", label: "Client name",        type: "text",     required: true,  placeholder: "Company name" },
        { name: "address",    label: "Address",            type: "text",     required: true,  placeholder: "Street, city, state, ZIP" },
        { name: "website",    label: "Website",            type: "url",      required: false, placeholder: "https://" },
        { name: "areaCode",   label: "Area code",          type: "tel",      required: true,  placeholder: "e.g. 512" },
        { name: "timeZone",   label: "Time zone",          type: "select",   required: true,
          options: ["Eastern (ET)", "Central (CT)", "Mountain (MT)", "Arizona (MST, no DST)", "Pacific (PT)", "Alaska (AKT)", "Hawaii (HT)", "Other"] },
        { name: "users",      label: "Users (full names)", type: "textarea", required: true,  placeholder: "One name per line" },
        { name: "neededBy",   label: "Needed by",          type: "date",     required: true }
      ],
      title: (d) => `New phone queue for ${d.clientName || "client"}`
    },

    new_employee: {
      adminOnly: true,
      adminTab: { id: "newhires", label: "New employees", short: "New hires", blurb: "Onboarding requests, kept separate from the main queue." },
      label: "New employee request",
      blurb: "Set up accounts and access for someone joining.",
      icon: "userplus",
      emailTo: "jroching@hunterrecruitment.net",
      fields: [
        { name: "fullName",          label: "New employee name",            type: "text",     required: true,  placeholder: "First and last name" },
        { name: "startDate",         label: "Start date",                   type: "date",     required: true },
        { name: "phone",             label: "Phone number",                 type: "tel",      required: false },
        { name: "address",           label: "Address",                      type: "text",     required: false, placeholder: "Street, city, state, ZIP" },
        { name: "personalEmail",     label: "Personal email address",       type: "email",    required: true,  placeholder: "name@gmail.com" },
        { name: "title",             label: "Title",                        type: "text",     required: true },
        { name: "manager",           label: "Manager",                      type: "text",     required: true },
        { name: "department",        label: "Department",                   type: "select",   required: true,
          options: ["Recruiting", "Recruiting Contractor (US)", "OSC", "Third Party OSC", "Sales", "Marketing", "Executive"] },
        { name: "country",           label: "Country of physical location", type: "text",     required: true,
          suggestions: ["United States", "Mexico", "Argentina", "Philippines", "South Africa"] },
        { name: "roleType",          label: "Type of role",                 type: "select",   required: true,  blank: true,
          options: ["FT Employee", "Contractor", "Third Party Contractor"] },
        { name: "thirdPartyCompany", label: "Third party company name",     type: "text",     required: true,
          showIf: { field: "roleType", equals: "Third Party Contractor" } },
        { name: "hraEmail",          label: "HRA email address",            type: "text",     required: true,  placeholder: "first.last@hunterrecruitment.net" },
        { name: "itNotes",           label: "IT notes",                     type: "textarea", required: false },

        { type: "heading", label: "Access and systems", hint: "Open a section and add only what this person needs. Only what you add is sent." },

        { name: "equipment", label: "Equipment Requirements", type: "picker", addLabel: "Add equipment",
          items: ["Laptop"] },
        { name: "license", label: "License Type", type: "picker", addLabel: "Add a license",
          items: [
            { name: "Microsoft License Type", options: ["Microsoft 365 Business Basic", "Microsoft 365 Business Standard", "Microsoft 365 Business Premium"] },
            "Power BI"
          ] },
        { name: "remoteDesktop", label: "Remote Desktop Access", type: "picker", addLabel: "Add remote access",
          items: ["Blue Agent Access"] },
        { name: "extraApps", label: "Extra Applications", type: "picker", addLabel: "Add an application",
          items: ["Zoom", "Windows App", "Favorites"] },
        { name: "systemAccess", label: "System User Access", type: "picker", addLabel: "Add system access",
          items: [
            { name: "Zoom User Group", options: ["Zoom", "Accounting", "Administrative", "Paused Users", "Prince / Unified", "Recruiting"] },
            { name: "Zoom Licenses", options: ["Zoom Workplace Enterprise Premier with US/CA Unlimited & Zoom Revenue Accelerator Essentials", "Zoom Workplace Enterprise Premier with US/CA Unlimited", "Zoom Revenue Accelerator Essentials"] },
            "Zoom HRA Recruiting Call Queue",
            "Zoom Channels (Recruiter 101/911, Yea You, HRA Random, HRA Company Celebration)",
            { name: "Udemy", options: ["Account Manager", "Leadership", "Recruiter"] },
            { name: "JazzHR", options: ["Recruiting Role: Recruiting Administrator", "Accounts Portal Role: Administrator"] },
            { name: "Workable", options: ["Account Manager: Super Admin", "Recruiter: Recruiting : Admin"] },
            { name: "Indeed", options: ["Limited", "Admin"] },
            "Jeanie / Classet"
          ] },
        { name: "distributionGroups", label: "Distribution Groups", type: "picker", addLabel: "Add a distribution group",
          items: ["ALL CONTRACT EE", "All EE", "All FT EE", "Contract Request Group", "Executive Team", "Leadership Team", "Management Team", "Recruiting Management Team", "Recruiting Team", "Sales Team"] },
        { name: "teamsGroups", label: "Team & Microsoft 365 Groups", type: "picker", addLabel: "Add a group",
          items: ["All Company", "Employee Archive", "Hunter Recruitment", "INKY-Exclude", "INKY-Journaling", "INKY-Users", "JazzHR Data Hub", "Marketing Group", "Recordings (Zoom)"] },
        { name: "securityGroups", label: "Security Groups", type: "picker", addLabel: "Add a security group",
          items: ["Accounting SG", "All Contract EE SG", "All EE SG", "All FT EE SG", "All Licensed & Enabled Users (Excluding Admins)", "All Users", "Argentina Employees", "Azure Requests", "DocusignSSO", "Executive Team SG", "External Users MFA", "Human Resources SG", "Leadership SG", "Management SG", "Marketing SG", "Mexico Employees", "New User Group for Onboarding", "OSC Recruiting SG", "Philippine Employees", "Recruiting Management SG", "Recruiting SG", "Sales SG", "South Africa Employees"] },
        { name: "sharedEmail", label: "Shared Email Access", type: "picker", addLabel: "Add a shared mailbox",
          items: ["HRA Candidate", "HRA Canva (Everyone)", "HRA Corp", "HRA Manufacturing", "HRA Marketing", "HRA Recruiting (Account Managers & Up)", "HRA Sales", "HRA Workable", "HRA1 (Account Managers & Up)", "HRA2 (Account Managers & Up)", "HRA3 (Account Managers & Up)", "HRA4 (Account Managers & Up)", "HRA5 (Account Managers & Up)", "Blue Agent Calendar Access", "Market Analysis (Account Managers & Up)", "Unified Prince"] }
      ],
      title: (d) => `New employee: ${d.fullName || "new hire"}`
    },

    general: {
      label: "General help",
      blurb: "Ask for help with anything that isn't listed.",
      icon: "spark",
      fields: [
        { name: "subject",     label: "What do you need help with", type: "text",     required: true,  placeholder: "One line summary" },
        { name: "description", label: "Details",                    type: "textarea", required: true,  placeholder: "What's happening, what you've tried, any deadlines" },
        { name: "priority",    label: "How urgent is it",           type: "select",   required: true,  options: ["Normal", "Soon", "Urgent"] }
      ],
      title: (d) => d.subject || "General help"
    }
  },

  /* 7) Client Pipeline (Workable). Data is copied from Workable by the sync in
        workable-sync/ (see WORKABLE-SETUP.md). The dashboard only displays it. */
  workable: {
    // Who manages which clients. The account manager whose email matches the
    // person signed in is highlighted in green and opened automatically.
    // Client names must match the client names the sync produces (see clientFrom).
    accountManagers: [
      { name: "Megan",  email: "megan@hunterrecruitment.net",  clients: ["Beyond Wow Plumbing", "Trust 1 Plumbing"] },
      { name: "Holly",  email: "holly@hunterrecruitment.net",  clients: ["Metro Electric"] }
    ],

    // How a Workable job is matched to a client:
    //   "department"  the job's Department in Workable is the client name (default)
    //   "title"       the client name is in the job title, e.g. "Plumber - Beyond Wow Plumbing"
    clientFrom: "department",

    // Optional extra details shown in each client's title bar, and manual overrides
    // when a client's jobs don't follow the rule above.
    clients: {
      "Beyond Wow Plumbing": { location: "Austin, TX", hours: "15 hours/wk" }
      // "Trust 1 Plumbing": { location: "Quincy, MA", hours: "20 hours/wk", shortcodes: ["ABC123"] }
    },

    // Your Workable pipeline stage names (not case sensitive). A candidate shows in
    // the table once they reach any "submitted" stage or later.
    stages: {
      screen:    ["Phone Screen", "Screening"],
      submitted: ["Submitted to Client", "Submitted", "Client Review"],
      interview: ["Interview", "Client Interview", "In-Person Interview"],
      offer:     ["Offer"],
      hired:     ["Hired"]
    },

    // Words in a disqualification reason or comment that mark a status color.
    noShowWords:      ["no show", "no-show", "ncns", "no call"],
    fellThroughWords: ["declined offer", "offer declined", "quit", "fired", "rescinded", "no show to start", "didn't start"],

    lookbackDays: 365,                  // ignore candidates older than this
    syncEveryMinutes: 30,               // shown on the page; the schedule itself is in the workflow file
    sourcingWeeks: 8                    // weeks of sourcing numbers kept (the page lets people pick how many to show)
  },

  /* 8) Links in the left panel. */
  links: {
    sharepoint: "https://hunterrecruitmentnet.sharepoint.com/sites/TeamSite"
  },

  /* 9) "Who to contact" directory. Each topic says who to reach for it.
        Replace the examples with your real people (remove example: true when done).
        contact fields: name, role, email, phone (optional), teams (true = show a Teams chat button)
        backup: an optional second person. tips: what to include when reaching out.
        category: one of the ids in categories. keywords: other words people might search for. */
  contacts: {
    categories: [
      { id: "systems",  label: "Systems and tech",    icon: "chip" },
      { id: "access",   label: "Logins and access",   icon: "key" },
      { id: "people",   label: "HR and payroll",      icon: "people" },
      { id: "clients",  label: "Clients and recruiting", icon: "brief" },
      { id: "general",  label: "Everything else",     icon: "help" }
    ],
    topics: [
      { example: true, category: "access", topic: "I can't log in or I'm locked out",
        description: "Password resets, locked accounts and two-step verification codes that don't arrive.",
        keywords: ["password", "reset", "locked out", "login", "sign in", "mfa", "2fa", "authenticator", "verification code"],
        contact: { name: "IT Support", role: "Systems administrator", email: "it@hunterrecruitment.net", phone: "", teams: true },
        response: "Same business day",
        tips: ["Which system you're trying to open", "The exact error message (a screenshot helps)", "When it started"] },

      { example: true, category: "access", topic: "I need access to a system or shared mailbox",
        description: "New access to Workable, Zoom, shared mailboxes, Teams channels or SharePoint folders.",
        keywords: ["access", "permission", "shared mailbox", "workable", "zoom", "sharepoint", "teams", "license"],
        contact: { name: "IT Support", role: "Systems administrator", email: "it@hunterrecruitment.net", teams: true },
        response: "1 to 2 business days",
        tips: ["What you need access to", "Why you need it", "Your manager's approval, if needed"] },

      { example: true, category: "systems", topic: "Something isn't working (computer, email, Teams)",
        description: "Errors, crashes, slow computer, Outlook or Teams problems, printers and headsets.",
        keywords: ["error", "broken", "crash", "slow", "outlook", "email", "teams", "laptop", "computer", "printer", "headset", "audio", "camera"],
        contact: { name: "IT Support", role: "Systems administrator", email: "it@hunterrecruitment.net", teams: true },
        backup: { name: "Operations Manager", email: "operations@hunterrecruitment.net" },
        response: "Same business day",
        tips: ["What you were doing when it happened", "A screenshot of the problem", "Whether you already restarted"] },

      { example: true, category: "systems", topic: "Workable problems",
        description: "Pipelines, job posts, candidate stages, email templates or integrations not behaving.",
        keywords: ["workable", "ats", "pipeline", "job post", "candidate", "stage", "template", "jeanie", "classet", "indeed"],
        contact: { name: "Workable Admin", role: "ATS administrator", email: "workable@hunterrecruitment.net", teams: true },
        response: "Same business day",
        tips: ["The job or candidate involved", "What you expected vs. what happened"] },

      { example: true, category: "systems", topic: "Phone, Zoom or call queue issues",
        description: "Calls not ringing, call queues, voicemail, Zoom meetings or recordings.",
        keywords: ["phone", "zoom", "call", "queue", "voicemail", "recording", "dial", "extension"],
        contact: { name: "Phone Systems", role: "Zoom administrator", email: "phones@hunterrecruitment.net", teams: true },
        response: "Same business day",
        tips: ["Your extension or queue name", "Time the issue happened"] },

      { example: true, category: "people", topic: "Payroll, time off or benefits",
        description: "Paychecks, time off requests, benefits enrollment and tax forms.",
        keywords: ["payroll", "pay", "paycheck", "pto", "time off", "vacation", "sick", "benefits", "w2", "w-2", "tax", "401k"],
        contact: { name: "HR and Payroll", role: "People team", email: "hr@hunterrecruitment.net", teams: true },
        response: "1 to 2 business days",
        tips: ["Pay period or dates involved", "Keep personal details out of group chats"] },

      { example: true, category: "people", topic: "Onboarding a new team member",
        description: "Accounts, equipment and first-day setup for someone joining the team.",
        keywords: ["new hire", "onboarding", "new employee", "start date", "laptop", "equipment", "setup"],
        contact: { name: "Operations Manager", role: "Operations", email: "operations@hunterrecruitment.net", teams: true },
        response: "At least 1 week before the start date",
        tips: ["Use the New employee request in the Request Center for the details"] },

      { example: true, category: "clients", topic: "Client questions or escalations",
        description: "Contract questions, unhappy clients, new roles or pausing an account.",
        keywords: ["client", "contract", "escalation", "complaint", "pause", "new role", "account manager"],
        contact: { name: "Your Account Manager", role: "Account management", email: "accounts@hunterrecruitment.net", teams: true },
        backup: { name: "Director of Recruiting", email: "director@hunterrecruitment.net" },
        response: "Same business day",
        tips: ["The client name", "What happened and what the client asked for"] },

      { example: true, category: "clients", topic: "Candidate background checks or MVRs",
        description: "Ordering, status and results of background checks and driving records.",
        keywords: ["background", "check", "mvr", "driving record", "drug test", "screening", "references"],
        contact: { name: "Recruiting Coordinator", role: "Recruiting operations", email: "coordinator@hunterrecruitment.net", teams: true },
        response: "1 business day",
        tips: ["Candidate name and client", "Which check you need"] },

      { example: true, category: "general", topic: "Not sure who to ask",
        description: "Anything that isn't listed here. We'll point you to the right person.",
        keywords: ["help", "question", "other", "not sure", "don't know", "anything"],
        contact: { name: "Operations Manager", role: "Operations", email: "operations@hunterrecruitment.net", teams: true },
        response: "Same business day",
        tips: ["A short description of what you need"] }
    ]
  }
};
