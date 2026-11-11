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

  /* 4) Email (EmailJS, free for 200 emails a month). Request types with "emailTo"
        send their details to that address when submitted. Setup is in README.md.
        Leave these empty and nothing is emailed. */
  email: {
    publicKey: "",
    serviceId: "",
    templateId: "",
    siteUrl: ""        // optional, e.g. "https://your-username.github.io/request-center/"
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
        Field types: text, email, url, tel, textarea, date, select (options),
        chips (multi-select pills), checks (checkboxes; "locked" ones are always on). */
  requestTypes: {
    phone_queue: {
      group: "phone",
      label: "Add members to a queue",
      short: "Add members",
      blurb: "Get someone added to an existing call queue.",
      icon: "userplus",
      fields: [
        { name: "members",     label: "Who should be added",          type: "text",     required: true,  placeholder: "Full name(s), separated by commas" },
        { name: "emails",      label: "Their work email(s)",          type: "text",     required: true,  placeholder: "name@yourcompany.com" },
        { name: "permissions", label: "Permissions needed",           type: "checks",   required: true,
          options: ["Access", "Download", "Delete", "Share"], locked: ["Access"] },
        { name: "notes",       label: "Anything else we should know", type: "textarea", required: false, placeholder: "Which queue, temporary access, etc." }
      ],
      title: (d) => `Add ${d.members || "member"} to a phone queue`
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
      label: "New employee request",
      blurb: "Set up accounts and access for someone joining.",
      icon: "userplus",
      fields: [
        { name: "fullName",       label: "Full name",               type: "text",     required: true,  placeholder: "First and last name" },
        { name: "jobTitle",       label: "Job title",               type: "text",     required: true },
        { name: "department",     label: "Department",              type: "text",     required: false },
        { name: "manager",        label: "Manager",                 type: "text",     required: true,  placeholder: "Who they report to" },
        { name: "startDate",      label: "Start date",              type: "date",     required: true },
        { name: "phone",          label: "Phone number",            type: "tel",      required: false },
        { name: "personalEmail",  label: "Personal email",          type: "email",    required: true,  placeholder: "name@gmail.com" },
        { name: "companyEmail",   label: "Company email requested", type: "text",     required: true,  placeholder: "first.last@yourcompany.com" },
        { name: "notes",          label: "Equipment, software or anything else", type: "textarea", required: false, placeholder: "Laptop, headset, systems they need access to" }
      ],
      emailTo: "jroching@hunterrecruitment.net",
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
  }
};
