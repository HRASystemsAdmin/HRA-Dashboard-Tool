/* ==========================================================================
   HRA Training — courses
   --------------------------------------------------------------------------
   HOW TO CHANGE THINGS LATER
   • Hide a course:      add  hidden: true  to it (it disappears for everyone, progress is kept).
   • "Coming soon":      add  soon: true  (shows the card, locked).
   • Remove a course:    delete its block below (and any "course:" links pointing to it).
   • Edit a video/link:  most links live in the shared parts at the top (SHARED), so one
                         change updates every course that uses it.
   Step types:
     content    a short card (title, text, bullets, callout, visual)
     action     something to do; the person ticks "I've done this" to continue (optional links)
     quiz       a question with options; must pick the right one to continue
     values     tap every card to reveal it (key = the big letter/word on the front)
     steps      a short walkthrough revealed one step at a time
     resources  a list of videos/documents; tap each one (optional: true lets people continue anyway)
     complete   the finish line
   Links: { label, key } uses links below · { label, url } a direct address · { label, course } opens another course.
   ========================================================================== */

(() => {
  const SP = "https://hunterrecruitmentnet.sharepoint.com";
  const L = {
    teamSite: SP + "/sites/TeamSite",
    awards: SP + "/sites/TeamSite/SitePages/BEyond%20The%20Stars.aspx",
    idealBook: SP + "/:b:/r/sites/HRATraining/Shared%20Documents/Training%20Guides/The%20Ideal%20Team%20Player%20-%20Patrick%20M_.pdf?d=wfa3c0338374e45b3af49e05c1de109f3&csf=1&web=1&e=dEqs0F",
    idealReview: SP + "/:b:/r/sites/HRATraining/Shared%20Documents/Training%20Guides/The%20Ideal%20Team%20Player%20Review.pdf?d=w17caaea7443c4c28a2ccb6ca0066abc4&csf=1&web=1&e=Xipiuo",
    remoteDesktop: SP + "/:b:/r/sites/HRATraining/Shared%20Documents/Misc/Remote%20Desktop%20Access%2010.25.pdf?csf=1&web=1&e=0bhYwV",
    linkedinCover: SP + "/:i:/r/sites/HRAMarketing/MarketingResources/15%20LinkedIn%20Personal%20Cover%201584%20x%20396px.png?d=wa0eca30379384c4780d1f990ea7e0ec2&csf=1&web=1&e=mayanD",
    zoomInstructions: SP + "/:b:/r/sites/HRATraining/Shared%20Documents/Training%20Guides/Zoom%20Instructions.pdf?csf=1&web=1&e=LUZdJi",
    zoomLoom: "https://www.loom.com/share/d173ca94d4b44a86a34b9fb05be05f94",
    zoomDownload: "https://zoom.us/download",
    cultureVideo: "https://www.youtube.com/watch?v=mJn9BzH9iHY",
    workableAcademy: "https://www.workableacademy.com/courses",
    workableStart: "https://help.workable.com/hc/en-us/articles/14190351306263-Getting-Started-with-Workable-Academy",
    calendly: "https://calendly.com/",
    calendlyVideo: "https://youtu.be/BEVPZxDZAJk",
    clientFolders: SP + "/sites/TeamSite/Client%20Folders/Forms/AllItems.aspx"
  };

  /* ---------------- SHARED PARTS (reused by the training guides) ---------------- */
  const culture = (variant) => ({ id: "culture", title: "Our culture", steps: [
    { id: "welcome", type: "content", visual: "hello:navy", title: "Welcome to your training!",
      text: "We are so excited to have you on our team! This guide walks you through our culture, your tools, the basics of the job and how we work. One step at a time." },
    variant === "awards"
      ? { id: "defining-culture", type: "action", title: "Defining our culture",
          text: "Our culture shows in how we recognize each other. Visit our awards page to see the people and moments we celebrate.",
          link: { label: "Visit the awards page", url: L.awards }, confirm: "I visited the awards page" }
      : { id: "defining-culture", type: "action", title: "Defining our culture",
          text: "Start with this short video about who we are: our values, our mission and our legacy.",
          link: { label: "Watch: Our Values, Our Mission, Our Legacy", url: L.cultureVideo }, confirm: "I watched the video" },
    { id: "ideal-team-player", type: "resources", title: "The Ideal Team Player",
      text: "We use Patrick Lencioni's book The Ideal Team Player to describe the kind of teammate we all aim to be. Open both documents.",
      items: [
        { title: "The Ideal Team Player by Patrick Lencioni", note: "The book (PDF)", url: L.idealBook },
        { title: "The Ideal Team Player Review", note: "A short review of the key ideas (PDF)", url: L.idealReview }
      ] },
    { id: "ideal-quiz", type: "quiz", title: "Quick check",
      question: "According to The Ideal Team Player, what three virtues make a great teammate?",
      options: ["Fast, friendly and focused", "Humble, hungry and smart", "Loyal, organized and creative"], answer: 1,
      explain: "Humble, hungry and (people) smart. Keep these in mind; they come up a lot at HRA." }
  ] });

  const tools = (variant) => ({ id: "tools", title: "Your tools", steps: [
    { id: "remote-desktop", type: "action", title: "Remote Desktop for LinkedIn",
      text: "We access LinkedIn through Remote Desktop. Follow the guide to set it up.",
      link: { label: "Open the Remote Desktop guide", url: L.remoteDesktop }, confirm: "Remote Desktop is set up" },
    { id: "authenticator", type: "action", title: "Microsoft Authenticator",
      text: "Check your email for the Microsoft Authenticator set-up. It keeps your HRA account secure when you sign in.",
      callout: { tone: "info", text: "Look in your inbox (and spam) for the Microsoft Authenticator email." },
      confirm: "Microsoft Authenticator is set up" },
    { id: "linkedin-cover", type: "action", title: "Your LinkedIn cover photo",
      text: "Download the HRA LinkedIn cover image and set it as the cover photo on your LinkedIn profile.",
      link: { label: "Get the LinkedIn cover photo", url: L.linkedinCover }, confirm: "My LinkedIn cover photo is updated" },
    variant === "sourcer"
      ? { id: "zoom", type: "action", visual: "zoom-app", title: "The Zoom phone platform",
          text: "Zoom is how we call and meet. Download the Zoom Workplace app if you don't have it yet.",
          link: { label: "Zoom Workplace app", url: L.zoomDownload }, confirm: "Zoom Workplace is installed" }
      : { id: "zoom", type: "resources", visual: "zoom-app", title: "The Zoom phone platform",
          text: "Get to know the Zoom Workplace app, then download it if you don't have it yet.",
          items: [
            { title: "Zoom Workplace training", note: variant === "contractor" ? "Short video overview" : "Zoom instructions (PDF)", url: variant === "contractor" ? L.zoomLoom : L.zoomInstructions },
            { title: "Zoom Workplace app", note: "Download center", url: L.zoomDownload }
          ] }
  ] });

  const jobBasics = () => ({ id: "job-basics", title: "Job basics", steps: [
    { id: "what-is-recruiter", type: "resources", title: "What is a recruiter?",
      text: "Two short videos to set the stage: the recruiter's role, and how agencies fit into recruitment.",
      items: [
        { q: "What is a recruiter?", title: "My job in Recruitment - Career Advice & Tips", url: "https://youtu.be/ZOW2U9bIeh0" },
        { q: "How are agencies part of recruitment?", title: "What is Recruitment and Selection?", url: "https://youtu.be/yeVmteq8D_Q" }
      ] },
    { id: "recruitment-process", type: "resources", title: "The recruitment process",
      text: "The building blocks of recruiting.",
      items: [
        { q: "Define the pieces of the recruitment process", title: "HR Basics: Recruitment", url: "https://youtu.be/CNU2ZMOnf1I", minutes: "7.11" },
        { q: "Internal vs. external hiring: pluses and minuses", title: "INTERNAL vs EXTERNAL Recruiting", url: "https://youtu.be/zoNPGuQiBU0", minutes: "3.56" },
        { q: "What is a job description?", title: "HR Basics: Job Descriptions", url: "https://youtu.be/5ml7NX81ijg", minutes: "7.51" }
      ] },
    { id: "postings-ats", type: "resources", title: "Job postings and applicant tracking",
      items: [
        { q: "What is a job posting?", title: "How to Write a Job Description - How to Recruit a Good Job Candidate", url: "https://youtu.be/uIjoSsof-qg", minutes: "6.58" },
        { q: "Job posting vs. description", title: "Job Description vs. Job Posting – What's the Difference?", url: "https://youtu.be/NaA1hfbxe6M", minutes: "1.38" },
        { q: "What is applicant tracking?", title: "Applicant Tracking System and Recruitment", url: "https://youtu.be/vgABDe06OMI", minutes: "3.04" }
      ] },
    { id: "posting-quiz", type: "quiz", title: "Quick check",
      question: "What's the main difference between a job description and a job posting?",
      options: ["They're the same thing", "The description outlines the role's duties; the posting is the ad that attracts candidates", "The posting is only for internal candidates"], answer: 1,
      explain: "The job description defines the role. The job posting is the advertisement written to attract the right candidates." },
    { id: "sourcing", type: "resources", title: "Sourcing vs. recruitment",
      text: "One video covers it all (about 20 minutes). Watch for the answers to these questions:",
      bullets: ["What is recruitment sourcing?", "Are candidates hard to convince?", "What positions are good for sourcing?", "When does sourcing look like recruitment?", "How long does sourcing take?", "Managing sourcing campaigns, and beginner advice"],
      items: [{ title: "Sourcing versus traditional recruitment? Tips and timing.", url: "https://youtu.be/XH37Dpi9ia0", minutes: "20.06" }] },
    { id: "calendly", type: "action", title: "Set up your scheduling link",
      text: "Create a free Calendly account so candidates can book time with you. You can also use Microsoft Bookings or Zoom Scheduler.",
      links: [{ label: "Calendly", url: L.calendly }, { label: "Video: setting up Calendly", url: L.calendlyVideo }],
      confirm: "My scheduling link is set up" },
    { id: "boolean", type: "resources", title: "Keyword and Boolean searches",
      text: "Searching is a core skill. These three short videos explain how.",
      items: [
        { q: "What are keyword searches?", title: "How to Choose Keywords", url: "https://youtu.be/BoujP8KoK7E", minutes: "2.42" },
        { q: "What is Boolean searching?", title: "Boolean Operators (AND OR NOT)", url: "https://youtu.be/bCAULDuMcso", minutes: "3.43" },
        { q: "What are Boolean modifiers?", title: "Boolean Modifiers \"\", *, ( )", url: "https://youtu.be/Ed7EswsnEbM", minutes: "3.34" }
      ] },
    { id: "boolean-quiz", type: "quiz", title: "Quick check",
      question: "You want candidates whose profiles mention both “HVAC” and “service”. Which search finds that?",
      options: ["HVAC OR service", "HVAC AND service", "HVAC NOT service"], answer: 1,
      explain: "AND narrows the search to results with both words. OR widens it, and NOT excludes a word." },
    { id: "boolean-quiz-2", type: "quiz", title: "Quick check",
      question: "What do quotation marks do, as in “service technician”?",
      options: ["Search for that exact phrase", "Search for either word", "Exclude the phrase"], answer: 0,
      explain: "Quotes keep the words together, so you only get that exact phrase." }
  ] });

  const templates = (items) => ({ id: "templates", type: "content", title: "Our templates",
    text: "We use templates for communication with candidates, account managers and clients. Your trainer will introduce each one:",
    chips: items });

  const candidateMgmt = () => [
    { id: "candidates", type: "steps", title: "Candidate management",
      text: "How a candidate moves through our process. Tap “Next step” as you go.",
      items: [
        { title: "Load the candidate into Workable", text: "Download the resume and change the candidate's status." },
        { title: "Set up the phone screen", text: "In the Interview tab: send the interview invite and add the interview guide (and learn where to find or create guides)." },
        { title: "Run the phone screen", text: "Introduce yourself, find the candidate's pain point with empathy, and use the STAR method." },
        { title: "After the phone screen", text: "Update the status, submit the candidate, confirm the next interview with the client, and contact them every 48 hours." }
      ],
      callout: { tone: "info", text: "Always update discussions and status changes in Workable. Your trainer will email you a practice resume and walk you through it while you share your screen." } },
    { id: "star-quiz", type: "quiz", title: "Quick check",
      question: "In a phone screen, what does the STAR method stand for?",
      options: ["Skills, Training, Attitude, Results", "Situation, Task, Action, Result", "Start, Talk, Ask, Respond"], answer: 1,
      explain: "Situation, Task, Action, Result. It helps candidates give clear, specific examples." },
    { id: "follow-up-quiz", type: "quiz", title: "Quick check",
      question: "After submitting a candidate, how often should you contact them?",
      options: ["Every 48 hours", "Once a week", "Only when the client replies"], answer: 0,
      explain: "Stay in touch every 48 hours, and log every update in Workable." }
  ];

  const homeServicesIntro = () => ({ id: "home-services-intro", type: "content", visual: "trades", title: "Home Services",
    text: "Most of our clients are in home services. You'll learn the typical roles, responsibilities, pay scales and commission, and why home services is unique.",
    link: { label: "Take the Home Services Highlights course", course: "home-services" } });

  const responsibility = (items) => ({ id: "responsibility", type: "content", title: "A day in the life of a recruiter",
    text: "What does the job look like at HRA, and what's expected of you? Your trainer will go over:",
    chips: items });

  const firstAssignment = (withRolePlay) => ({ id: "first-assignment", type: "action", title: withRolePlay ? "Your first assignment" : "Your first sourcing assignment",
    text: "Time to put it into practice. You'll get your first sourcing assignment in a meeting with the team.",
    bullets: withRolePlay ? ["Introduction to your first sourcing assignment, in a meeting with the team", "Role-play a phone screen, or have a team member listen in on one"] : undefined,
    confirm: "I've met with the team about my first assignment" });

  const done = (txt) => ({ id: "done", type: "complete", title: "Training guide complete!", text: txt || "You've finished this training guide. Great work, and welcome to the team!" });

  /* ---------------- COURSES ---------------- */
  window.HRA_TRAINING = {
    // Who can see everyone's progress and answer questions (admins always can).
    // Add managers here AND in firestore.rules → trainerEmails().
    trainers: [],

    // Links used by the Onboarding course. Paste the real "Copy link" URLs from SharePoint when you have them.
    links: {
      teamSite: L.teamSite,
      emailInstructions: "",
      signatureLogo: "",
      ourTeam: "",
      communityLogins: "",
      zoomDownload: L.zoomDownload,
      zoomBackground: "",
      workable: "",
      microsoftTraining: "",
      quickbooks: ""
    },

    categories: [
      { id: "onboarding", label: "Onboarding" },
      { id: "guides", label: "Training guides" },
      { id: "tools", label: "Tools and systems" },
      { id: "industry", label: "Industry knowledge" },
      { id: "communication", label: "Communication" },
      { id: "library", label: "Library" }
    ],
    // More courses (Training guides, Time Reporting, JazzHR, Home Services) are saved in
    // training-archive.js. Copy a course block from there into the list below to bring it back.

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
      }
    ]
  };
})();
