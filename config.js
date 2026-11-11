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

  /* 3) Phone queues people can be added to. */
  phoneQueues: [
    "Main line",
    "Recruiting",
    "Client services",
    "Payroll",
    "After hours"
  ],

  /* 4) Request types. To add a new one, copy a block and change it.
        Field types: text, email, textarea, date, select, chips (multi-select). */
  requestTypes: {
    phone_queue: {
      label: "Add members to phone queues",
      blurb: "Get someone added to one or more call queues.",
      icon: "phone",
      fields: [
        { name: "members",   label: "Who should be added",            type: "text",  required: true,  placeholder: "Full name(s), separated by commas" },
        { name: "emails",    label: "Their work email(s)",            type: "text",  required: true,  placeholder: "name@yourcompany.com" },
        { name: "extension", label: "Extension or phone number",      type: "text",  required: false, placeholder: "Optional" },
        { name: "queues",    label: "Queues",                         type: "chips", required: true,  optionsFrom: "phoneQueues" },
        { name: "startDate", label: "Start date",                     type: "date",  required: false },
        { name: "notes",     label: "Anything else we should know",   type: "textarea", required: false, placeholder: "Shift times, temporary access, etc." }
      ],
      title: (d) => `Add ${d.members || "member"} to ${(d.queues || []).join(", ") || "queues"}`
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
