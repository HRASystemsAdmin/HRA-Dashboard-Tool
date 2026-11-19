# Connecting Workable to the Client Pipeline

The Client Pipeline shows every submitted candidate per client, in the same columns and colors as the Weekly Hiring Update spreadsheet. It reads from Workable automatically, so account managers no longer copy anything by hand. **Download spreadsheet** rebuilds the familiar workbook whenever someone needs a file.


## Testing safely (start here)

The sync is set up so testing can't affect Workable, Power BI or your costs:

- **Power BI is not involved.** Power BI reads Workable's BI Data Link database (confirmed by Nick), not the API, so the sync cannot affect it.
- **Read-only token.** Create a separate token named "HRA Dashboard" with only `r_jobs` and `r_candidates`. Workable blocks any change made with it. Never reuse or change the existing tokens: it isn't known yet who uses them.
- **No credits.** Workable doesn't charge per API request. The only limit is speed (10 requests every 10 seconds), and it may be shared with whatever uses the existing tokens.
- **Gentle mode (always on).** 1 request every 3 seconds (about 30% of the limit); the **first load** goes even slower, 1 every 5 seconds (about 20%). If Workable ever says "slow down", the run **stops immediately** instead of retrying, and the next run continues from there.
- **First load once, then only changes.** The first sync reads the last 12 months once (it can be spread over several runs; progress is saved). After that, each run asks Workable only for candidates and jobs updated since the previous run, usually 15 to 40 requests and 1 to 2 minutes.
- **Light on Firebase.** Clients that didn't change are not rewritten, so open dashboards don't re-read them. Big clients are split across records to stay under Firestore's 1 MB limit.
- **Safety cap.** Each run stops after 400 requests unless you change it.
- **Manual only.** Nothing runs on a schedule until you turn it on in `.github/workflows/workable-sync.yml`.
- **Safety report** at the end of every run: requests used, time, the lowest "requests left" Workable reported, and any slow-downs.
- **Public logs.** This repo is public, so run logs are too. Runs never print candidate names. Job and client names are hidden unless you tick "show names". Inspect does show job titles, departments and stage names (that's its purpose), so delete its log after reading it: Actions → the run → ⋯ → **Delete all logs**.

**Step by step**
1. Test at a quiet time (for example, lunch or the evening), since it isn't known yet what uses the existing API tokens.
2. In GitHub → Settings → Secrets and variables → Actions, add `WORKABLE_SUBDOMAIN` and `WORKABLE_TOKEN`. (`FIREBASE_SERVICE_ACCOUNT` is only needed for the final **sync** step.)
3. Actions → **Workable sync** → **Run workflow** → mode **inspect**. About 1–2 minutes. Read the job, department and stage lists, then delete the log.
4. Send the stage names and how jobs map to clients to whoever maintains `config.js` (`workable.stages`, `workable.clients`).
5. Run mode **preview**: reads everything and saves nothing. Check the counts and the safety report.
6. Add `FIREBASE_SERVICE_ACCOUNT`, then run mode **sync** with one **client** name to fill just that client in the dashboard.
7. When you're happy: run mode **sync** with no client and **max_requests** `1500`, at a quiet time. That's the first load (about 2 hours at most). If it stops at the cap or because Workable asked to slow down, run it again: it continues where it stopped.
8. Later, turn on the schedule. Each scheduled run then fetches only what changed.

To stop everything instantly at any point, delete the dashboard's token in Workable. Power BI is not affected.

## How it works

```
Workable  ──(read-only API token)──▶  Workable sync  ──▶  Firestore  ──▶  Dashboard  ──▶  Download spreadsheet
                                     (GitHub Actions,
                                      every 30 minutes)
```

The Workable token can read every candidate in your account, so it must never be inside the web page, where anyone could see it. Instead, a small script in this repo (`workable-sync/sync.mjs`) runs on GitHub's servers on a schedule. It keeps the token in GitHub's encrypted secrets, reads Workable, and saves the results in your Firestore database. The dashboard only reads from Firestore, behind the same login and access list as the Request Center.

## What you need

- A **Workable admin** account (only admins can create API tokens).
- The **Firebase project** you set up for the Request Center.
- **Admin access to the GitHub repo**.

Total setup time is about 30 minutes.

---

## Step 1: Create the Workable API token

1. Sign in to Workable as an admin.
2. Click your profile picture (top right) → **Settings** → **Integrations** → **Apps**.
3. In **API Access Tokens**, click **Generate API token**.
4. Name it `HRA Dashboard` and select only these permissions (read only):
   - `r_jobs`
   - `r_candidates`
5. Click **Generate** and **copy the token right away**. Workable shows it only once.
6. Note your Workable **subdomain**: if your Workable address is `https://hunterrecruitment.workable.com`, the subdomain is `hunterrecruitment`.

> Treat the token like a password. Don't email it or paste it into any file in the repo.

## Step 2: Create a Firebase service account key

This lets the sync write to Firestore.

1. Open the Firebase console → your project → the **gear icon** → **Project settings**.
2. Open the **Service accounts** tab → **Generate new private key** → **Generate key**.
3. A `.json` file downloads. Keep it private; you'll paste its contents into GitHub next, then you can delete the file.

## Step 3: Add three secrets to GitHub

1. In the GitHub repo, go to **Settings** → **Secrets and variables** → **Actions**.
2. Click **New repository secret** three times:

| Name | Value |
|---|---|
| `WORKABLE_SUBDOMAIN` | your subdomain, e.g. `hunterrecruitment` |
| `WORKABLE_TOKEN` | the token from Step 1 |
| `FIREBASE_SERVICE_ACCOUNT` | open the `.json` file from Step 2 in Notepad, copy **everything**, paste |

Secrets are encrypted. Nobody can read them back, not even people who can see the code.

## Step 4: Upload the files

Upload these in **one commit**:

- `index.html`, `app.js`, `styles.css`, `config.js` (updated)
- `firestore.rules` (updated), then **also publish it** in Firebase → Firestore Database → Rules
- the `workable-sync` folder (`sync.mjs`, `package.json`)
- the workflow file at exactly `.github/workflows/workable-sync.yml`

> Folders that start with a dot can be hard to drag in. If it doesn't upload, use **Add file → Create new file**, type `.github/workflows/workable-sync.yml` as the name (the slashes create the folders), paste the file's contents, and commit.

## Step 5: Look at how your Workable is organized (safe "inspect" run)

1. In GitHub, open the **Actions** tab → **Workable sync** (left list) → **Run workflow**.
2. Choose mode **inspect** → **Run workflow**.
3. When it finishes (about 1 minute), open the run → **sync** → **Run** step. You'll see:
   - every job with its **department** and which **client** it matched
   - every **pipeline stage name** your jobs use
   - **no candidate names or details** (inspect mode never prints them, since logs on a public repo are public)

## Step 6: Fill in `config.js` → `workable`

Use what the inspect run showed:

1. **`clientFrom`**: how a job belongs to a client.
   - `"department"` (default): the job's Department in Workable is the client name.
   - `"title"`: the client name is in the job title, like `Plumber - Beyond Wow Plumbing`.
   - For a client whose jobs don't follow the rule, add an override in `clients`, e.g. `"Trust 1 Plumbing": { shortcodes: ["ABC123"] }` (shortcodes are listed in the inspect output).
2. **`stages`**: put your exact stage names into the right groups. A candidate appears in the table once they reach a **submitted** stage or later.
   - `screen`: your phone screen stage(s), used for the weekly sourcing numbers
   - `submitted`: the stage where a candidate is sent to the client
   - `interview`, `offer`, `hired`
3. **`accountManagers`**: each AM's name, **work email** (must match the email they sign in with, so their name shows in green and opens automatically), and their client names (spelled the way the inspect run shows them).
4. **`clients`** (optional): location and hours per client for the title bar, e.g. `"Beyond Wow Plumbing": { location: "Austin, TX", hours: "15 hours/wk" }`.

Commit `config.js`.

## Step 7: Run the first sync

**Actions** → **Workable sync** → **Run workflow** → mode **sync**. When it's green, open the dashboard → **Client Pipeline**. The status chip at the top shows when the data was last synced.

From then on it runs **every 30 minutes, Monday to Friday, about 6am to 7pm Eastern** (11:00 to 23:59 UTC). To change that, edit the `cron` line in `.github/workflows/workable-sync.yml`. Anyone with repo access can also click **Run workflow** for an immediate refresh.

---

## Refreshing one client right away

Besides the automatic schedule, anyone with access to the repo can refresh immediately: **Actions** → **Workable sync** → **Run workflow**. Type a client name in **client** to refresh only that client (about 1 to 2 minutes), or leave it empty to refresh everything.

---

## Personal column layouts

Each person can choose which columns they see and their order (**Columns** button above the table). Their layout is saved to their account (`user_prefs` in Firestore), so it follows them to any computer. **Download spreadsheet** uses the columns they're viewing, and **Reset to spreadsheet** restores the standard layout.

Extra columns anyone can switch on: **Workable stage**, **Status**, **Days since submitted**.

## How each spreadsheet column is filled

| Column | Comes from Workable |
|---|---|
| Candidate Submitted | Candidate name (links to their Workable profile when available) |
| Role Submitted | Job title |
| Date Submitted | When the candidate was first moved into a **submitted** stage |
| Wants to Interview (Y/N), When? | `Y - date` once they reached an **interview** stage; `N` if disqualified before that |
| Hired (Y/N) | `Y` in a **hired** stage; `Offer` in an offer stage; `N - reason` if the hire fell through |
| Role hired for | Job title, once hired |
| Start Date | The start date on the candidate's offer in Workable, when there is one |
| Recruiter | The team member who moved the candidate into the submitted stage |
| Notes | The two most recent comments on the candidate, plus the disqualification reason |

**Row colors** (same as the spreadsheet legend):

| Color | Meaning | Rule |
|---|---|---|
| White | Client has passed on this candidate | Disqualified |
| Yellow | In Process | Still active |
| Red | Interview No Show | Reached an interview, and the disqualification reason or a recent comment says "no show" / "NCNS" |
| Green | Hired | In a hired stage |
| Blue | Hired no-show or quit/fired/declined offer | Disqualified at offer or hired, or the reason says "declined offer", "quit" and so on |

The trigger words live in `config.js` (`noShowWords`, `fellThroughWords`). The more consistently recruiters use clear disqualification reasons in Workable, the more accurate the colors are.

**Weekly sourcing numbers** (last two weeks, Monday to Friday, per role) are calculated from Workable: **# Sourced** is candidates added that day, **Screened** is candidates moved into a screen stage, and **Submitted** is candidates moved into a submitted stage.

**Not included:** the "Account Manager Update" questions (plan for next week, recommendations, questions for the client, candidates to revisit). That's written commentary that doesn't exist in Workable. If you want it in the dashboard, it would be a small form per client; ask and it can be added.

---

## Privacy and cost

- The token is **read-only**: the dashboard can never change anything in Workable.
- Candidate data lives in your Firestore database and is readable only by accounts on the access list (`firestore.rules`).
- The sync never prints candidate details to the GitHub logs (sync mode prints job titles and counts only).
- **GitHub Actions** is free for public repos. For a private repo, each run takes about 1 to 3 minutes; the default schedule uses roughly 1,000 to 1,500 of the 2,000 free minutes a month. Reduce the schedule if needed.
- **Firestore** stays well within the free plan.

## Troubleshooting

| What you see | What to do |
|---|---|
| Run fails with "Workable rejected the token (401)" | Recreate the token with `r_jobs` and `r_candidates`, update the `WORKABLE_TOKEN` secret |
| Status chip says "Waiting for first sync" | Run the workflow (Step 7), and make sure `firestore.rules` is published |
| A client tab says no jobs matched | The client name in `accountManagers` doesn't match the job's department (or title). Compare with the inspect output |
| Candidates missing | Their stage isn't listed under `submitted`, `interview`, `offer` or `hired` in `config.js` |
| An AM isn't highlighted in green | Their `email` in `config.js` must match the email they sign in with |
| Clients under "Unassigned" | Add those client names to an account manager in `config.js` |
| Wrong row colors | Adjust `noShowWords` / `fellThroughWords`, or use clearer disqualification reasons in Workable |
