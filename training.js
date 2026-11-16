/* ==========================================================================
   HRA Training — courses
   Each course is a list of modules; each module is a list of short steps.
   Step types:
     content   a short card (title, text, bullets, callout, visual)
     action    something to do; the person ticks "I've done this" to continue (optional link)
     quiz      a question with options; must pick the right one to continue
     values    tap every item to reveal it (used for Be KINDD)
     steps     a short walkthrough revealed one step at a time
     complete  the finish line
   Links left empty ("") fall back to the HRA Team Site until you add the real link.
   ========================================================================== */

window.HRA_TRAINING = {

  // Who can see everyone's progress and answer questions (admins always can).
  // Add managers here AND in firestore.rules → trainerEmails().
  trainers: [],

  // Links used by the courses. Paste the real "Copy link" URLs from SharePoint when you have them.
  links: {
    teamSite: "https://hunterrecruitmentnet.sharepoint.com/sites/TeamSite",
    emailInstructions: "",
    signatureLogo: "",
    ourTeam: "",
    communityLogins: "",
    zoomDownload: "https://zoom.us/download",
    zoomBackground: "",
    workable: "",
    microsoftTraining: ""
  },

  categories: [
    { id: "onboarding", label: "Onboarding" },
    { id: "guides", label: "Training guides" },
    { id: "tools", label: "Tools and systems" },
    { id: "communication", label: "Communication" },
    { id: "library", label: "Library" }
  ],

  courses: [
    {
      id: "onboarding-contractor", category: "onboarding", icon: "rocket", color: "orange",
      title: "Onboarding - Contractor", minutes: 20,
      summary: "Your first steps at HRA: our values, the Team Site, email, Zoom, Workable and where to get help.",
      modules: [
        { id: "welcome", title: "Welcome", steps: [
          { id: "hello", type: "content", visual: "hello",
            title: "Welcome to HRA!",
            text: "We are so excited to have you on our team! This short course walks you through everything you need to get set up. Take it one step at a time. Your progress saves automatically." },
          { id: "kindd", type: "values",
            title: "At HRA, we Be KINDD",
            text: "These five values guide how we work with each other and our clients. Tap each one to reveal it.",
            items: [
              { key: "K", name: "Keep Learning", text: "We must constantly be learning newer insights of our craft and the industries we are working in to better serve our business partners.", icon: "search" },
              { key: "I", name: "Improving Lives", text: "Ask yourself, “how can I be of service to my teammates and business partners?” and then do it.", icon: "hands" },
              { key: "N", name: "Numbers Matter", text: "We are a fact-based provider of talent management consultation.", icon: "chart" },
              { key: "D", name: "Deliver Excellence", text: "Provide an enterprise-level of service that creates positive fanaticism of HRA's team and services.", icon: "award" },
              { key: "D", name: "Dedication", text: "It's hard to beat a person who never gives up!", icon: "flag" }
            ] },
          { id: "kindd-quiz", type: "quiz",
            title: "Quick check",
            question: "What does the last “D” in KINDD stand for?",
            options: ["Discipline", "Dedication", "Diversity", "Delivery"], answer: 1,
            explain: "Dedication: it's hard to beat a person who never gives up!" },
          { id: "zywave", type: "content", visual: "lms-email",
            title: "Zywave is our Learning Management System",
            text: "You'll receive emails directly from Zywave University to register and log in to your personalized training modules.",
            bullets: ["The email comes from notifications@learning.zywave.com", "Look for it later today and complete the modules assigned to you"],
            callout: { tone: "warn", text: "Log in with your username. Do not use “Continue with Microsoft” or “Continue with Google”." } },
          { id: "zywave-quiz", type: "quiz",
            title: "Quick check",
            question: "How should you sign in to Zywave?",
            options: ["Continue with Microsoft", "With my Zywave username", "Continue with Google"], answer: 1,
            explain: "Always use your Zywave username. The Microsoft and Google buttons won't connect you to your HRA modules." },
          { id: "ahead", type: "content", visual: "roadmap",
            title: "What's ahead",
            text: "Your training is separate from your onboarding. Here's what this onboarding covers:",
            chips: ["Team Site", "Email signature", "Contact list", "Shared resources", "Zoom Phone", "Zoom background", "Workable", "IT help", "Microsoft resources"] }
        ] },

        { id: "team-site", title: "Team Site", steps: [
          { id: "site", type: "action", visual: "teamsite",
            title: "The HRA Team Site",
            text: "Our team site is where you'll find useful information. It houses most of our internal resources, and many steps in this course point you there.",
            link: { label: "Open the HRA Team Site", key: "teamSite" },
            confirm: "I opened the Team Site" },
          { id: "signature", type: "action", visual: "signature",
            title: "Set up your email signature",
            text: "Set up your signature in your email account. The instructions and logo are on the Team Site. Your finished signature should look like the example.",
            callout: { tone: "info", text: "Your email address and the website must be hyperlinks." },
            links: [{ label: "Email instructions", key: "emailInstructions" }, { label: "Get the logo", key: "signatureLogo" }],
            confirm: "My signature is set up" },
          { id: "our-team", type: "action", visual: "teamsite:Our Team",
            title: "Meet your coworkers",
            text: "The employee contact list is on the Team Site under “Our Team”. Always use the Team Site, as it has the most current information.",
            link: { label: "Open Our Team", key: "ourTeam" },
            confirm: "I found the Our Team list" },
          { id: "community", type: "action", visual: "teamsite:Community Passwords",
            title: "Community shared resources",
            text: "We share certain login credentials as a group for platforms like LinkedIn, Indeed and ZipRecruiter. You'll find them under “Community Passwords” on the Team Site. More details come during your training.",
            callout: { tone: "warn", text: "Shared logins are for HRA work only. Never share them outside the team." },
            link: { label: "Open Community Login Information", key: "communityLogins" },
            confirm: "I can open Community Passwords" },
          { id: "site-quiz", type: "quiz",
            title: "Quick check",
            question: "Where's the best place to find a coworker's current contact information?",
            options: ["My email inbox", "Zoom contacts", "Team Site → Our Team", "Workable"], answer: 2,
            explain: "The Team Site's Our Team list is always the most current." }
        ] },

        { id: "zoom", title: "Zoom", steps: [
          { id: "zoom-phone", type: "action", visual: "zoom-app",
            title: "The Zoom Phone platform",
            text: "We use Zoom Phone at HRA for internal and external calls. Make sure the app is installed and you can sign in.",
            callout: { tone: "info", text: "It may already be on your computer. Check before downloading." },
            link: { label: "Zoom download center", key: "zoomDownload" },
            confirm: "Zoom is installed and I can sign in" },
          { id: "zoom-bg-get", type: "action", visual: "zoom-bg",
            title: "Get the HRA virtual background",
            text: "We use a virtual background for our Zoom calls. If you don't already see it in Zoom under Backgrounds & effects, download it here.",
            link: { label: "Download the Zoom background", key: "zoomBackground" },
            confirm: "I have the background image" },
          { id: "zoom-bg-set", type: "steps",
            title: "Set it as your background",
            text: "Follow these steps in the Zoom app. Tap “Next step” as you go.",
            items: [
              { title: "Open your profile", text: "Click your profile picture in the top-right corner." },
              { title: "Go to Settings", text: "Choose Settings from the dropdown menu." },
              { title: "Backgrounds & effects", text: "In the left menu, select Background & Effects." },
              { title: "Add the image", text: "Click the + button, choose Add Image, and select the HRA background." },
              { title: "Select it", text: "Click the HRA background so it's used in your meetings." }
            ],
            callout: { tone: "info", text: "The logo looks reversed on your own screen, but others see it correctly." } },
          { id: "zoom-quiz", type: "quiz",
            title: "Quick check",
            question: "You're joining a meeting on behalf of one of our clients. What should you do?",
            options: ["Keep the HRA background", "Change your background", "Turn your camera off"], answer: 1,
            explain: "When you represent a client, change your background so it fits that client." }
        ] },

        { id: "systems", title: "Systems and help", steps: [
          { id: "workable", type: "action", visual: "recruiting",
            title: "Our Applicant Tracking System",
            text: "The ATS we use is Workable. Recruiters receive an email for access and are asked to verify their email address. You can always reach it through the Team Site's Recruiting page.",
            link: { label: "Open Workable", key: "workable" },
            confirm: "I verified my Workable email" },
          { id: "it-help", type: "content", visual: "it-flow",
            title: "Having IT issues?",
            text: "Someone will reach out as quickly as possible. Just follow this order:",
            bullets: ["First, troubleshoot with your manager or Mindy", "Still stuck? Email it@hunterrecruitment.net"] },
          { id: "it-quiz", type: "quiz",
            title: "Quick check",
            question: "Outlook won't sync your email. What's your first step?",
            options: ["Email IT right away", "Troubleshoot with your manager or Mindy", "Reinstall Outlook", "Wait until tomorrow"], answer: 1,
            explain: "Always troubleshoot with your manager or Mindy before sending an IT request." }
        ] },

        { id: "wrap-up", title: "Wrap-up", steps: [
          { id: "microsoft", type: "action", visual: "teamsite:Training",
            title: "Microsoft resources",
            text: "Go through the Microsoft Resources on the Team Site to complete your account set-up. You'll find the link at the bottom of the Training page: Microsoft Training Resources.",
            link: { label: "Microsoft Training Resources", key: "microsoftTraining" },
            confirm: "I went through the Microsoft resources" },
          { id: "explore", type: "content", visual: "explore",
            title: "Explore the Team Site",
            text: "Take time to look around the Team Site. There's A LOT of useful information and resources there.",
            bullets: ["The site is a work in progress and keeps growing", "It's built to help you, so feedback is always welcome!"],
            link: { label: "Open the HRA Team Site", key: "teamSite" } },
          { id: "done", type: "complete",
            title: "You're all set!",
            text: "You've finished your contractor onboarding. Welcome to the team. We're glad you're here!" }
        ] }
      ]
    },

    { id: "onboarding-employee", category: "onboarding", icon: "rocket", color: "navy", title: "Onboarding - Employee", minutes: 20, summary: "Getting set up as a full-time HRA employee.", soon: true },
    { id: "guide-contractor", category: "guides", icon: "book", color: "orange", title: "Training Guide - Contractor", summary: "Everything you need to do the job as a contractor.", soon: true },
    { id: "guide-employee", category: "guides", icon: "book", color: "navy", title: "Training Guide - Employee", summary: "Your complete guide to the role.", soon: true },
    { id: "guide-sourcer", category: "guides", icon: "search", color: "teal", title: "Training Guide - Sourcer", summary: "Sourcing the right candidates, the HRA way.", soon: true },
    { id: "time-reporting", category: "tools", icon: "clock", color: "purple", title: "Time Reporting", summary: "How to report your time correctly.", soon: true },
    { id: "jazzhr-training", category: "tools", icon: "layers", color: "green", title: "JazzHR Training", summary: "Working in JazzHR day to day.", soon: true },
    { id: "jazzhr-academy", category: "tools", icon: "cap", color: "green", title: "JazzHR Academy", summary: "JazzHR's own learning library.", soon: true },
    { id: "zoom-instructions", category: "tools", icon: "video", color: "navy", title: "Zoom Instructions", summary: "Calls, meetings and settings in Zoom.", soon: true },
    { id: "microsoft-training", category: "tools", icon: "grid", color: "teal", title: "Microsoft Training Resources", summary: "Outlook, Teams and the rest of Microsoft 365.", soon: true },
    { id: "templates", category: "communication", icon: "mail", color: "orange", title: "HRA Templates and Standard Candidate Communications", summary: "The templates and wording we use with candidates.", soon: true },
    { id: "home-services", category: "communication", icon: "home", color: "purple", title: "Home Services Highlights", summary: "Key things to know about the home services industry.", soon: true },
    { id: "resources", category: "library", icon: "folder", color: "navy", title: "Resources", summary: "Useful documents and links.", soon: true },
    { id: "how-to", category: "library", icon: "tool", color: "teal", title: "General How to / Misc", summary: "Quick answers to everyday questions.", soon: true },
    { id: "videos", category: "library", icon: "play", color: "orange", title: "Training Videos", summary: "Watch and learn at your own pace.", soon: true },
    { id: "lunch-learn", category: "library", icon: "coffee", color: "green", title: "Lunch and Learns", summary: "Recordings and notes from our sessions.", soon: true }
  ]
};
