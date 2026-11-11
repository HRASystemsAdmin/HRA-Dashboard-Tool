# Request Center · Hunter Recruitment Advisors

Internal request system for employees. People send a request, admins take it (in progress) and complete it, and the requester sees the status update live.

## Files

| File | What it is |
|---|---|
| `index.html` | The page |
| `styles.css` | All styling and animation |
| `app.js` | Logic (sign in, requests, admin queue) |
| `config.js` | **The only file you normally edit**: Firebase keys, who has access, phone queues, request types |
| `firestore.rules` | Security rules that lock the data to approved accounts |
| `assets/logo.png` | Company logo |

## Try it right now (demo mode)

Upload the folder to a GitHub repo and turn on GitHub Pages. With no Firebase keys in `config.js`, the page runs in demo mode: use **Try as employee** / **Try as admin** on the sign-in screen. Demo data stays in that browser only.

## Go live (about 15 minutes)

GitHub Pages only hosts files, so accounts and requests are stored in Firebase (free tier is plenty).

1. **Create a Firebase project** at https://console.firebase.google.com (Google Analytics not needed).
2. **Authentication** → Get started → Sign-in method → enable **Email/Password**.
3. **Authentication → Users → Add user** for each employee and admin (email + temporary password). They can change it with *Forgot password* on the sign-in screen.
4. **Authentication → Settings → Authorized domains** → add `YOUR-USERNAME.github.io`.
5. **Firestore Database** → Create database (production mode, nearest region).
6. **Firestore → Rules** → paste `firestore.rules`, put the real emails in `adminEmails()` and `memberEmails()`, then **Publish**.
7. **Project settings → Your apps → Web (`</>`)** → register an app → copy `apiKey`, `authDomain`, `projectId`, `appId` into `config.js`.
8. In `config.js`, put the same emails in `admins` and `members`.
9. Commit and push. Done.

## Managing access

To add or remove someone, update **both** places:
- `firestore.rules` (then Publish in the Firebase console) — this is what actually protects the data.
- `config.js` (then push to GitHub) — this controls what the page shows.

Admins don't need to be listed in `members` too. An account that signs in but isn't on either list sees a "doesn't have access" screen and can't read anything.

## Adding a new request type

Copy a block inside `requestTypes` in `config.js`, give it a new key, label, and fields. Field types: `text`, `email`, `url`, `tel`, `textarea`, `date`, `select` (with `options`), `chips` (multi-select pills), `checks` (checkboxes; add `locked` for options that are always on, like Access). The form, details view, and admin queue pick it up automatically.

## Attachments and deleting

- People can attach files when they send a request (drag and drop, browse, or paste a screenshot with Ctrl+V), and add more later from the request's details. Admins can add files too.
- Files are stored inside Firestore, so **no billing card is needed** (Firebase's separate file storage service requires the paid Blaze plan). The free plan includes about 1 GB, which is thousands of screenshots. Large photos and screenshots are compressed automatically.
- Limits are set in `config.js` → `attachments` (default 8 files per upload, 5 MB each).
- Admins can delete a request once it's **Completed**. A confirmation appears first, and deleting also removes its attachments, which frees up space.

## Email for New employee requests (EmailJS)

New employee requests are emailed to **jroching@hunterrecruitment.net** with everything that was filled in. GitHub Pages can't send email on its own, so this uses EmailJS (free for 200 emails a month, no card).

1. Create a free account at https://www.emailjs.com.
2. **Email Services → Add New Service** → choose the mailbox that will send the emails (Outlook 365 or Gmail), sign in, and save. Copy the **Service ID**.
3. **Email Templates → Create New Template**, then in **Settings**:
   - Subject: `{{subject}}`
   - To Email: `{{to_email}}`
   - From Name: `HRA Request Center`
   - Reply To: `{{reply_to}}` (replies go to the employee who sent it)
4. In **Content**, open the code editor, delete what's there, paste everything from `email-template.html`, and save. Copy the **Template ID**.
5. **Account → General** → copy your **Public Key**.
6. Paste the three values into `config.js` → `email`, and set `siteUrl` to your GitHub Pages address so the email's button links to the request.
7. Push to GitHub and send a test New employee request.

Each request's details show whether the email went out. Admins can select **Send email** or **Send again** there if needed.

To email other request types, add `emailTo: "someone@hunterrecruitment.net"` to that type in `config.js`.

Tip: the EmailJS public key is visible in the page code. For extra safety, type the address directly into the template's **To Email** field instead of `{{to_email}}`, so the template can only ever send to that inbox.

## Notes

- The Firebase web keys in `config.js` are meant to be public; the rules are the security.
- If the repo is public, the code is visible but the data is not.
- Status updates appear live for everyone who has the page open.
