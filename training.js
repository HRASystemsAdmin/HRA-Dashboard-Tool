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

      /* ---- Training Guide - Contractor ---- */
      { id: "guide-contractor", category: "guides", icon: "book", color: "orange", minutes: 120,
        title: "Training Guide - Contractor",
        summary: "Culture, tools, compliance, the basics of recruiting, and how we work with candidates and clients.",
        modules: [
          culture("awards"),
          (() => { const t = tools("contractor"); t.steps.push(
            { id: "workable-academy", type: "resources", title: "Workable is our ATS",
              text: "Workable Academy has online courses that walk you through the system.",
              items: [
                { title: "Workable Academy courses", note: "workableacademy.com", url: L.workableAcademy },
                { title: "Getting started: how to sign up", note: "Workable help center", url: L.workableStart }
              ] }); return t; })(),
          { id: "learning", title: "Learning and compliance", steps: [
            { id: "udemy", type: "resources", optional: true, title: "Your Udemy training",
              text: "These Udemy courses build key skills. Tick each one off as you start it. You can keep going and finish them over your first weeks.",
              items: [
                { q: "Compliance", title: "Cyber Security Awareness Training", minutes: "87" },
                { q: "Compliance", title: "Preventing Workplace Harassment 101", minutes: "19" },
                { q: "Compliance", title: "Overcome Unconscious Bias in Hiring", minutes: "82" },
                { q: "Working well as a team", title: "Working Remotely: How To Succeed In The New Workplace", minutes: "126" },
                { q: "Working well as a team", title: "Feedback is Fuel: giving and receiving feedback at work", minutes: "32" },
                { q: "Working well as a team", title: "Goal Crushing: Use OKRs to achieve business results", minutes: "32" },
                { q: "Working well as a team", title: "Write Magnetic Emails: Your Superpower at Work + in Business", minutes: "92" },
                { q: "AI literacy", title: "AI Literacy at Work: Essential Skills for Every Employee", note: "What AI can do, how to use it in your job, and how to work with it responsibly. No technical background needed.", minutes: "54" }
              ] },
            { id: "laws", type: "action", title: "Know the laws",
              text: "Always cover your bases legally. Whether you're an entry-level recruiter or one with decades of experience, it's extraordinarily important to understand the regulations you must follow.",
              bullets: ["You'll get an email from Zywave with an interactive video to complete", "Complete the All Systems Learning Path"],
              callout: { tone: "warn", text: "Do NOT complete the Fireflies training in that learning path." },
              confirm: "I completed the Zywave learning path" },
            { id: "laws-quiz", type: "quiz", title: "Quick check",
              question: "Which training in the Zywave All Systems Learning Path should you skip?",
              options: ["Interview Compliance", "Fireflies", "Fair Hiring"], answer: 1,
              explain: "Skip the Fireflies training. Complete the rest of the learning path." }
          ] },
          jobBasics(),
          { id: "work", title: "Doing the work", steps: [
            templates(["Interview", "Job Posting", "Submissions", "Communications"]),
            ...candidateMgmt(),
            homeServicesIntro(),
            responsibility(["Candidate submission templates", "Weekly account manager updates", "Account manager expectations", "Time blocking"]),
            firstAssignment(true),
            done()
          ] }
        ] },

      /* ---- Training Guide - Employee ---- */
      { id: "guide-employee", category: "guides", icon: "book", color: "navy", minutes: 100,
        title: "Training Guide - Employee",
        summary: "Culture, tools, compliance, the basics of recruiting, and how we work, for full-time employees.",
        modules: [
          culture("video"),
          tools("employee"),
          { id: "law", title: "Compliance", steps: [
            { id: "law", type: "action", title: "Know the law",
              text: "Always cover your bases legally. Whether you're an entry-level recruiter or one with decades of experience, it's extraordinarily important to understand the regulations you must follow.",
              bullets: ["You'll get an email from Zywave with a fun interactive video", "Complete the task: Interview Compliance & Fair Hiring"],
              confirm: "I completed Interview Compliance & Fair Hiring" }
          ] },
          jobBasics(),
          { id: "work", title: "Doing the work", steps: [
            templates(["Interview", "Job Posting", "Submissions", "Communications"]),
            ...candidateMgmt(),
            homeServicesIntro(),
            responsibility(["Candidate submission templates", "Weekly account manager updates", "Account manager expectations", "Time blocking"]),
            firstAssignment(true),
            { id: "time-clock", type: "content", title: "Reporting your time",
              text: "You'll report your time in QuickBooks. The recruiting coordinator will guide you through it.",
              callout: { tone: "info", text: "Contractors only: also submit an invoice every week, in addition to adding time in QuickBooks." },
              link: { label: "Take the Time Reporting course", course: "time-reporting" } },
            done()
          ] }
        ] },

      /* ---- Training Guide - Sourcer ---- */
      { id: "guide-sourcer", category: "guides", icon: "search", color: "teal", minutes: 90,
        title: "Training Guide - Sourcer",
        summary: "Culture, tools and the recruiting basics every sourcer needs, plus your first sourcing assignment.",
        modules: [
          culture("video"),
          tools("sourcer"),
          jobBasics(),
          { id: "work", title: "Doing the work", steps: [
            templates(["Job Posting", "Communications"]),
            homeServicesIntro(),
            responsibility(["Weekly account manager updates", "Account manager expectations", "Time blocking"]),
            firstAssignment(false),
            done()
          ] }
        ] },

      /* ---- Time Reporting ---- */
      { id: "time-reporting", category: "tools", icon: "clock", color: "purple", minutes: 15,
        title: "Time Reporting",
        summary: "Weekly contractor invoices, entering time in QuickBooks, billing clients, and requesting time off.",
        modules: [
          { id: "invoicing", title: "Contractor invoicing", steps: [
            { id: "where", type: "action", visual: "teamsite:Human Resources", title: "Where is the invoice?",
              text: "You'll find it on the Team Site under Human Resources, listed under Contract Employees. Select “HRA Invoice Template for Contract Employees”.",
              callout: { tone: "warn", text: "Download the form. Don't fill it out on the site." },
              link: { label: "Open the HRA Team Site", url: L.teamSite }, confirm: "I downloaded the invoice template" },
            { id: "fill", type: "content", visual: "invoice", title: "Filling out your invoice",
              text: "Fill in all the yellow boxes:",
              bullets: ["Invoice date: the Monday you submit the invoice", "Period of engagement: Sunday to Saturday", "Description: Recruiting, then your hours worked for the week and your hourly rate. The formula calculates the total for you", "Send it to accounting@hunterrecruitment.net and copy Mindy Muhonen"],
              callout: { tone: "warn", text: "Send it by 10:30 AM ET every Monday." } },
            { id: "invoice-quiz", type: "quiz", title: "Quick check",
              question: "When is your weekly invoice due?",
              options: ["Fridays by 5:00 PM ET", "Mondays by 10:30 AM ET", "The last day of the month"], answer: 1,
              explain: "Every Monday by 10:30 AM ET, to accounting@hunterrecruitment.net with Mindy Muhonen copied." },
            { id: "period-quiz", type: "quiz", title: "Quick check",
              question: "What “period of engagement” goes on the invoice?",
              options: ["Monday to Friday", "Sunday to Saturday", "The 1st to the 15th"], answer: 1,
              explain: "The period runs Sunday to Saturday. The invoice date is the Monday you submit it." }
          ] },
          { id: "quickbooks", title: "Time in QuickBooks", steps: [
            { id: "qb-start", type: "action", title: "Getting into QuickBooks",
              text: "Sign in with the link you were given, then watch the video provided. The recruiting coordinator will guide you through your first week.",
              link: { label: "Open QuickBooks", key: "quickbooks" }, confirm: "I signed in and watched the video" },
            { id: "qb-first-week", type: "steps", visual: "qb-timecard", title: "Entering time in your first week",
              text: "Follow along. Tap “Next step” as you go.",
              items: [
                { title: "Time Entries → Manual Time Card", text: "Select Time Entries. The Manual Time Card is the most popular way to enter time." },
                { title: "Customer: HRA", text: "Click the customer box, type HRA in the search field and select HRA (for your first week of training)." },
                { title: "Service item: HRA Time", text: "At the bottom left of the time sheet, choose Operational Activities: HRA Time." },
                { title: "Billable: No", text: "Training isn't billed to a client, so select No." },
                { title: "Enter your hours", text: "Enter 8 hours in each weekday cell (if you worked 8-hour days) and type “HRA Training” in the notes for each day." },
                { title: "Save", text: "Click Save. Once you see it's saved, it's safe to exit." }
              ] },
            { id: "qb-quiz", type: "quiz", title: "Quick check",
              question: "During your first week of training, which customer do you enter time for?",
              options: ["The client you'll recruit for", "HRA", "Leave it blank"], answer: 1,
              explain: "In your first week, everything goes to HRA, with service item Operational Activities: HRA Time and Billable: No." }
          ] },
          { id: "billing", title: "Billing clients", steps: [
            { id: "categories", type: "values", title: "Weekly billing categories",
              text: "Once you're working with clients, each hour goes into one of these categories. Tap each card.",
              items: [
                { key: "HRA", label: "HRA Time", name: "Billed to HRA", text: "Internal HRA meetings and operational activities that support HRA goals.", icon: "home" },
                { key: "CS", label: "Client Support", name: "Billed to the client", text: "Reporting billable time; adding updates, candidates, hires and jobs to weekly reports; client meetings; social media recruiting; updating job postings.", icon: "chart" },
                { key: "SSI", label: "Screening / Scheduling / Interviews", name: "Billed to the client", text: "Screening applicants in job boards and the ATS, scheduling and running screening interviews, and candidate communication.", icon: "chat" },
                { key: "SRC", label: "Sourcing", name: "Billed to the client", text: "Sourcing on job boards and reaching out to candidates.", icon: "search" }
              ] },
            { id: "billable", type: "content", visual: "qb-timecard", title: "Billing a client's time",
              text: "When billing clients, select the right service item for each cell you claim hours in.",
              callout: { tone: "warn", text: "After choosing the service item, set Billable to Yes." } },
            { id: "cat-quiz-1", type: "quiz", title: "Which category?",
              question: "You spent an hour reaching out to candidates on job boards for a client.",
              options: ["HRA Time", "Client Support", "Screening / Scheduling / Interviews", "Sourcing"], answer: 3,
              explain: "Sourcing: billed to the client." },
            { id: "cat-quiz-2", type: "quiz", title: "Which category?",
              question: "You screened applicants in the ATS and scheduled two interviews.",
              options: ["Sourcing", "Screening / Scheduling / Interviews", "Client Support", "HRA Time"], answer: 1,
              explain: "Screening / Scheduling / Interviews: billed to the client." },
            { id: "cat-quiz-3", type: "quiz", title: "Which category?",
              question: "You attended an internal HRA team meeting.",
              options: ["HRA Time", "Client Support", "Sourcing"], answer: 0,
              explain: "HRA Time: billed to HRA, not the client." }
          ] },
          { id: "time-off", title: "Time off", steps: [
            { id: "request", type: "steps", title: "Requesting time off",
              text: "Time off is requested in the same time system. Tap “Next step” as you go.",
              items: [
                { title: "Open Time Off", text: "Select Time Off in the left menu. Your available PTO balance shows on the right." },
                { title: "Add Time Off", text: "Click the blue “+ Add Time Off” button." },
                { title: "Choose the code", text: "Pick PTO, Holiday - Paid, or Leave without pay." },
                { title: "Date and hours", text: "Choose the date and the hours. Use “Add day” for more than one day." },
                { title: "Add a note", text: "For example “Family Vacation”, then submit the request." }
              ] },
            { id: "done", type: "complete", title: "You're ready to report time!", text: "You know how to invoice, enter your time, bill clients correctly and request time off." }
          ] }
        ] },

      /* ---- JazzHR Training ---- */
      { id: "jazzhr-training", category: "tools", icon: "layers", color: "green", minutes: 10,
        title: "JazzHR Training",
        summary: "Our two JazzHR portals, client folders, and the right email signature for each.",
        modules: [
          { id: "portals", title: "The portals", steps: [
            { id: "intro", type: "content", visual: "jazz-portals", title: "JazzHR is one of our ATS",
              text: "There are two portals we use:",
              bullets: ["JazzHRA: used for HRA reporting and for clients that don't have JazzHR", "Jazz Accounts Portal: used for clients that have their own JazzHR"] },
            { id: "portal-quiz", type: "quiz", title: "Quick check",
              question: "A client has its own JazzHR account. Which portal do you use?",
              options: ["JazzHRA", "Jazz Accounts Portal", "Either one"], answer: 1,
              explain: "Clients with their own JazzHR use the Jazz Accounts Portal. JazzHRA is for HRA reporting and clients without JazzHR." },
            { id: "client-folders", type: "action", title: "Client folders",
              text: "Each client has a folder on the Team Site with what you need to work with them.",
              link: { label: "Open Client Folders", url: L.clientFolders }, confirm: "I can open the client folders" },
            { id: "hra-portal", type: "content", title: "The HRA Jazz portal",
              text: "Your trainer will walk you through each of these in the JazzHRA portal:",
              chips: ["How to log in", "All jobs posted for reporting (account manager)", "Posting a job and writing a job ad", "Company codes", "Workflow templates", "Signature file", "Interview guides"] },
            { id: "accounts-portal", type: "content", title: "The Jazz Accounts Portal",
              text: "And these in the Jazz Accounts Portal:",
              chips: ["How to log in", "Signature file", "Standard workflow", "Templates", "Interview guides"] }
          ] },
          { id: "signatures", title: "Signatures", steps: [
            { id: "sigs", type: "content", visual: "jazz-sig", title: "JazzHR signatures",
              text: "Your signature depends on the portal:",
              bullets: ["Client JazzHR: your name, Recruitment Consultant, the client's Zoom phone number and the client's name", "HRA JazzHR: your name and Recruitment Consultant"],
              callout: { tone: "info", text: "You can add your scheduling link (like Calendly) so candidates can book a call with you." } },
            { id: "sig-quiz", type: "quiz", title: "Quick check",
              question: "Which signature includes the client's Zoom phone number and the client's name?",
              options: ["HRA JazzHR", "Client JazzHR", "Both"], answer: 1,
              explain: "The Client JazzHR signature includes the client's Zoom number and name. The HRA one is just your name and title." },
            { id: "done", type: "complete", title: "JazzHR basics done!", text: "You know the two portals, where client folders live, and which signature to use." }
          ] }
        ] },

      /* ---- Home Services Highlights ---- */
      { id: "home-services", category: "industry", icon: "home", color: "purple", minutes: 30,
        title: "Home Services Highlights",
        summary: "The trades we recruit for, HVAC, plumbing and electrical: roles, pay, licenses, and how to spot the right candidates.",
        modules: [
          { id: "basics", title: "The basics", steps: [
            { id: "what", type: "content", visual: "trades", title: "What are home services?",
              text: "We recruit for professional services and home services. Home services are the trades: HVAC, plumbing, electrical, and sometimes roofing.",
              bullets: ["These tradespeople specialize in residential service", "They go into people's homes to maintain equipment, diagnose and repair problems"] },
            { id: "earn-quiz", type: "quiz", title: "Take a guess",
              question: "How much can a seasoned technician earn in a year?",
              options: ["$30–45K", "$50–65K", "$80–120K"], answer: 2,
              explain: "Earnings vary widely, but a seasoned technician typically earns $80–120K a year. They're not shy about pay, and you shouldn't be either." },
            { id: "levels", type: "content", visual: "levels", title: "Skill levels and licenses",
              bullets: ["There are 3 general skill levels: Apprentice, Journeyman and Master", "The trades are in decline, so finding great people can be a challenge", "Some states require a license, especially for plumbing and electrical", "Apprenticeships sometimes require a license, with work hours reported to the state licensing board"],
              callout: { tone: "info", text: "You can often find or buy a list of licensed tradespeople. If a license is required, make that your first step." } },
            { id: "types", type: "values", title: "Types of tradespeople",
              text: "Tradespeople work in different capacities. Tap each one.",
              items: [
                { key: "R", label: "Residential", name: "Residential", text: "Home services: working on individual homes. This is who we recruit.", icon: "home" },
                { key: "C", label: "Commercial", name: "Commercial", text: "Bigger equipment, higher pressure and voltage. For HVAC, often on roofs with all their equipment.", icon: "layers" },
                { key: "LC", label: "Light Commercial", name: "Light Commercial", text: "Small-scale businesses.", icon: "grid" },
                { key: "I", label: "Industrial", name: "Industrial", text: "For electrical, often in a manufacturing facility.", icon: "tool" },
                { key: "NC", label: "New Construction", name: "New Construction", text: "New residential or commercial builds. These candidates are the roughest of the group.", icon: "flag" }
              ],
              callout: { tone: "info", text: "Commercial and residential HVAC are not apples to apples. Commercial units are modular and much more complex." } },
            { id: "types-quiz", type: "quiz", title: "Quick check",
              question: "Which branch of the trades is home services?",
              options: ["Commercial", "Residential", "Industrial", "New Construction"], answer: 1,
              explain: "Home services is residential: working on individual homes." }
          ] },
          { id: "hvac", title: "HVAC", steps: [
            { id: "creds", type: "content", title: "HVAC credentials and paths",
              text: "HVAC is heating, ventilation and air conditioning. There are two main credentials:",
              bullets: ["EPA: a card to handle refrigerant. Anyone in HVAC should have it. It can be obtained online in about half an hour", "NATE (North American Technician Excellence): an HVAC-only certification that's hard to get and requires training to maintain"],
              callout: { tone: "info", text: "About half of HVAC candidates go to trade school (about 9 months at a for-profit school, 2 years at a state technical college). School career departments are a great place to source." } },
            { id: "epa-quiz", type: "quiz", title: "Quick check",
              question: "Which credential does every HVAC tech need to handle refrigerant?",
              options: ["NATE", "EPA card", "A journeyman license"], answer: 1,
              explain: "The EPA card. It's quick to get online, and anyone in HVAC should have it." },
            { id: "service", type: "content", title: "HVAC service technicians",
              text: "Two pathways in HVAC: service and installation. Service technicians have “the gift of gab”.",
              bullets: ["They diagnose problems and present good, better and best options to customers", "Seasonal maintenance: the furnace in fall and winter, the condenser (AC unit) in spring and summer", "Newer technicians run maintenance calls; more skilled ones run problem calls", "When replacement makes sense, they “flip the lead” to a Comfort Advisor (a salesperson), and earn a spiff", "Pay: performance pay (commission), or hourly ($18–30, depending on the region) plus bonus or spiff"] },
            { id: "install", type: "content", title: "HVAC installers",
              text: "Installers are detail oriented and lighter on the chit-chat. They like to get in, do the work and go home. The good ones are proud of their work and keep photos of it on their phones.",
              bullets: ["There's always a lead installer (2+ years of install experience) and an apprentice", "Apprentices first learn to solder and braze; within a month they can set the outdoor unit", "A highly skilled installer can install two units a day", "Pay: hourly (around $45 for a lead), or piece rate: a share of the install's sale. A furnace, AC and coil system is worth about $575 for 4–8 hours of work", "On piece pay the lead usually gets 70% and the helper 30%, moving toward 50/50 as the helper gains experience"] },
            { id: "gab-quiz", type: "quiz", title: "Quick check",
              question: "Who usually has “the gift of gab” and presents options to the customer?",
              options: ["The installer", "The service technician", "The apprentice"], answer: 1,
              explain: "Service technicians talk with customers, diagnose and sell. Installers focus on the work." },
            { id: "piece-quiz", type: "quiz", title: "Quick check",
              question: "On piece pay, how is the install usually split between the lead and a new helper?",
              options: ["50/50", "70/30", "90/10"], answer: 1,
              explain: "Usually 70% lead, 30% helper, moving toward 50/50 as the helper gains experience." }
          ] },
          { id: "plumbing", title: "Plumbing", steps: [
            { id: "plumbers", type: "content", title: "Plumbers",
              bullets: ["A license is often needed", "Some are paid straight commission, usually 18–24% of a job's sales price; some are paid hourly plus bonus", "A plumber who can talk to customers can earn $80–120K", "It takes 2–4 years to become a journeyman plumber", "Plumbers work with gas (needed to run their own truck), service 40/50-gallon and tankless water heaters, and in the Northeast work on oil or gas boilers"],
              callout: { tone: "info", text: "A good residential service plumber is inherently a salesperson. The money is “in the dirt”: digs and whole-house repipes." } },
            { id: "roles", type: "values", title: "Jobs in plumbing",
              text: "Tap each role.",
              items: [
                { key: "AP", label: "Apprentice Plumber", name: "Apprentice Plumber", text: "Learning the trade and possibly earning their license.", icon: "cap" },
                { key: "P", label: "Plumber", name: "Plumber (journeyman or master)", text: "Runs their own truck, knows the codes, and can diagnose, sell and do the work without supervision.", icon: "tool" },
                { key: "DT", label: "Drain Tech", name: "Drain Tech", text: "Limited plumbing knowledge. Investigates leaks and turns bigger jobs over to a salesperson.", icon: "search" },
                { key: "IC", label: "Install Crew", name: "Install Crew", text: "In bigger departments, does the underground work a plumber or camera tech sold.", icon: "layers" },
                { key: "CT", label: "Camera Tech", name: "Camera Tech", text: "A salesperson who sells bigger plumbing jobs for a percentage and hands the work to a plumber or crew.", icon: "video" },
                { key: "PF", label: "Pipefitter", name: "Pipefitter", text: "Commercial and industrial construction; mostly welds pipe. Not a good home services candidate.", icon: "flag" }
              ] },
            { id: "sales-quiz", type: "quiz", title: "Quick check",
              question: "A plumber tells you they average $40K+ in sales a week. That makes them…",
              options: ["Below average", "About average", "A top performer"], answer: 2,
              explain: "$20K a week is mediocre, $30K is average, and $40K+ is a top performer. A good plumber knows their number." },
            { id: "pipefitter-quiz", type: "quiz", title: "Quick check",
              question: "Which of these is NOT a good home services candidate?",
              options: ["Drain tech", "Pipefitter", "Journeyman plumber"], answer: 1,
              explain: "Pipefitters do commercial and industrial construction, and their plumbing knowledge may be limited." }
          ] },
          { id: "electrical", title: "Electrical", steps: [
            { id: "electricians", type: "content", title: "Electricians",
              text: "Electrical is the longest trade to master, and electricians are detail oriented.",
              bullets: ["Paid straight commission, hourly, or hourly plus bonus; they tend to be the highest earners", "On average about $40+ an hour, depending on experience", "It takes about 4 years of apprenticeship to become a skilled electrician", "Some electricians also do HVAC work"],
              callout: { tone: "warn", text: "Solar installers are not electricians." } },
            { id: "solar-quiz", type: "quiz", title: "Quick check",
              question: "A candidate's only experience is installing solar panels. Are they an electrician?",
              options: ["Yes", "No"], answer: 1,
              explain: "Solar installers are not electricians." }
          ] },
          { id: "sourcing-tips", title: "Sourcing tips", steps: [
            { id: "red-flags", type: "values", title: "Reading a trades resume",
              text: "Tap each clue to see what it tells you.",
              items: [
                { key: "M", label: "“XYZ Mechanical”", name: "Commercial company", text: "A company name ending in Mechanical means commercial work.", icon: "layers" },
                { key: "HC", label: "HVAC Controls", name: "Building automation", text: "Commercial building automation. Not a good fit for a service technician.", icon: "grid" },
                { key: "SM", label: "Sheet metal / ductwork", name: "Metal fabricator", text: "Skilled in metal work only. Not an installer or service tech; any HVAC is commercial.", icon: "tool" },
                { key: "L#", label: "“Local ###”", name: "Union", text: "Usually construction or commercial work. IBEW is the electrical union.", icon: "flag" },
                { key: "2Y", label: "Job changes", name: "About 2 years each", text: "Tradespeople job hop more than professional services, but about 2 years per job is typical.", icon: "clock" }
              ],
              callout: { tone: "info", text: "Lots of commercial work is a sign the candidate may be rough with customers, and not a good fit for home services." } },
            { id: "resume-quiz", type: "quiz", title: "Quick check",
              question: "A resume shows “ABC Mechanical” and “Local 290”. What does that suggest?",
              options: ["A residential service expert", "A commercial or union background, likely not a home services fit", "An HVAC installer apprentice"], answer: 1,
              explain: "“Mechanical” points to a commercial company, and “Local ###” to a union. Both lean commercial or construction." },
            { id: "done", type: "complete", title: "You know your trades!", text: "HVAC, plumbing and electrical: roles, pay, licenses and what to look for on a resume. Time to find great people." }
          ] }
        ] },

      { id: "jazzhr-academy", category: "tools", icon: "cap", color: "green", title: "JazzHR Academy", summary: "JazzHR's own learning library.", soon: true },
      { id: "zoom-instructions", category: "tools", icon: "video", color: "navy", title: "Zoom Instructions", summary: "Calls, meetings and settings in Zoom.", soon: true },
      { id: "microsoft-training", category: "tools", icon: "grid", color: "teal", title: "Microsoft Training Resources", summary: "Outlook, Teams and the rest of Microsoft 365.", soon: true },
      { id: "templates", category: "communication", icon: "mail", color: "orange", title: "HRA Templates and Standard Candidate Communications", summary: "The templates and wording we use with candidates.", soon: true },
      { id: "resources", category: "library", icon: "folder", color: "navy", title: "Resources", summary: "Useful documents and links.", soon: true },
      { id: "how-to", category: "library", icon: "tool", color: "teal", title: "General How to / Misc", summary: "Quick answers to everyday questions.", soon: true },
      { id: "videos", category: "library", icon: "play", color: "orange", title: "Training Videos", summary: "Watch and learn at your own pace.", soon: true },
      { id: "lunch-learn", category: "library", icon: "coffee", color: "green", title: "Lunch and Learns", summary: "Recordings and notes from our sessions.", soon: true }
    ]
  };
})();
