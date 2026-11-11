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

## Notes

- The Firebase web keys in `config.js` are meant to be public; the rules are the security.
- If the repo is public, the code is visible but the data is not.
- Status updates appear live for everyone who has the page open.
