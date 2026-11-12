# HRA Dashboard · Hunter Recruitment Advisors

Internal tools for the team, switched from the left panel:

- **Request Center**: send and track requests (details below).
- **Client Pipeline**: submitted candidates per client from Workable, in the Weekly Hiring Update layout, with **Download spreadsheet**. Setup: **[WORKABLE-SETUP.md](WORKABLE-SETUP.md)**.
- **Insights** (admins only): totals, trends, hiring funnel, status breakdown, leaderboard and a performance table for recruiters, account managers and clients, built from the Client Pipeline data. Filter by period, account manager, client or recruiter. Each admin can remove or add any box (**Customize**), and **Export to Excel** saves either the current view or a full archive of every candidate.

- **Who to contact**: a short list of people and what they handle (search works too: "laptop", "payroll", "time off"). Click a person to see how to reach them: a Request Center request, a ticket portal link, a Zoom Phone number or an email. Edit the people in `config.js` → `contacts`.
- **SharePoint**: opens the team site (`config.js` → `links`).

- **All-employees alert** (admins only): the megaphone button in the top bar sends a full-screen alert to everyone, then keeps a large animated banner at the top of the dashboard for 5 minutes up to "until I turn it off". Looks: Critical, Warning, Notice and **Festive** (party colors and confetti, for shout-outs and good news). Admins can end it from the banner. Stored in Firestore at `broadcast/current`, with a history in `broadcast_log`.
- **Notifications**: shown as Windows notifications (or inside the dashboard if Windows notifications are off or blocked), with a chime. Sent for new alerts, new requests (to admins) and completed requests (to the requester). They arrive while the dashboard is open in a browser tab, even minimized.
- **Notification center** (bell button): a history of alerts and request updates with unread dots, so nothing is missed even if the dashboard was closed. Read status is saved to each person's account. The gear opens notification settings, and the trash button deletes all notifications from your list.

- **Helper chat** (bubble, bottom-right): describe a problem ("my Outlook login isn't working", "payroll question", "add someone to a phone queue") and it points to the right person, with their contact buttons, or opens the right request form. It also answers Client Pipeline questions: clients per account manager, who manages a client, hires, submissions, interviews, no-shows and hire rate for a person or client and a period ("this month", "last 30 days"), top performers, and a candidate's status. Request forms are matched with their `keywords` in `config.js`.

Until Firebase and Workable are connected, the dashboard runs on fictional demo data.
