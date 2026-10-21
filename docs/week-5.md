# Week 5 — React Frontend: Property Grid

> 🚧 In progress — Steps 0 and 1 done. See "Where we are" below.

## Goal
A React frontend that fetches properties from my Express API and shows them as a
grid of cards.

| # | Requirement | In plain English |
|---|---|---|
| 21 | React app in `frontend/` | A separate project folder for the website |
| 22 | Proxy `/api/*` → Express | The website asks for `/api/...`; a forwarder sends it to `localhost:5000` |
| 23 | API client module | One file with all the "talk to the backend" functions |
| 24 | `ListingsPage` + `PropertyCard` | Split the page into reusable pieces |
| 25 | Card shows 7 things | First photo (from `L_Photos`), price, address, city/state, beds, baths, sqft |
| 26 | Loading and error states | "Loading…" while waiting; a clear message if the backend is down |

**Acceptance criteria:** runs on port 3000 without errors · real data in the grid ·
first photo from `L_Photos` · loading state · error message if backend unreachable ·
"Showing 20 of N properties" · hover effect on cards · API client throws meaningful errors.

**Debug challenge:** images are broken for some properties. Is `L_Photos` always a
valid JSON array? What does it contain when there are no photos? Write code that
never crashes. *(Not started — hints only.)*

---

## Where we are

| Step | What | Status |
|---|---|---|
| — | Checks before starting (Week 5 status, Week 4 re-test) | ✅ Done |
| — | Restructure the repo (R1–R8) | ✅ Done — PR #4 merged |
| 0 | Get `frontend/` into git | ✅ Done — commit `b193b17` |
| 1 | Port 3000 + proxy | ✅ Done (not committed yet) |
| 2 | API client `src/api/client.js` | ⏳ Next |
| 3 | Debug challenge: investigate `L_Photos` | ⏳ |
| 4 | Helper functions `src/utils/property.js` | ⏳ |
| 5 | `PropertyCard` component | ⏳ |
| 6 | `ListingsPage` component | ⏳ |
| 7 | Hook it up in `App.jsx` | ⏳ |
| 8 | Full acceptance check | ⏳ |
| 9 | Notes + PR | ⏳ |

---

## Key ideas (the restaurant comparison)

| Part | Restaurant | My project |
|---|---|---|
| Database | Pantry — where food is stored | MySQL in Docker (port 3306) |
| Backend | Kitchen — takes orders, gets food, hands it back | Express API (port 5000) |
| Frontend | Dining room — what customers see | React app (port 3000) |
| Proxy | The pass — carries orders from dining room to kitchen | Vite's `server.proxy` setting |

### Words to know
| Word | Meaning | Comparison |
|---|---|---|
| **React** | A JavaScript tool for pages that redraw themselves when data changes. You describe *what* to show; React works out *how* to update the screen. | A menu board that redraws itself when you change the list of dishes |
| **Component** | A reusable piece of the page, written as a function that returns what to show | A LEGO brick — design it once, use it many times |
| **Props** | Inputs passed from a parent component to a child | A manager handing each waiter one order |
| **State** | Data a component remembers that can change (e.g. "loading?"). When it changes, React redraws. | The "open/closed" sign on a shop door |
| **JSX** | HTML-looking code inside JavaScript, e.g. `<h2>Hello</h2>` | |
| **Dev server** | The program `npm run dev` starts; serves the React app while I build it | |
| **Proxy** | Forwards requests from one place to another | A receptionist passing calls on |
| **Vite** | The tool that runs and builds my React app (instead of Create React App) | |

### Planned component layout
```
App
└── ListingsPage          ← fetches data, shows loading / error / count
    ├── "Showing 20 of 55,212 properties"
    └── grid
        ├── PropertyCard  ← one house
        ├── PropertyCard
        └── ...
```

### Vite vs Create React App (CRA)
The assignment was written for **Create React App**. My app uses **Vite** (CRA is no
longer maintained). Two differences matter:

| | Create React App | Vite (mine) |
|---|---|---|
| Default port | 3000 | 5173 → I set it to 3000 |
| Proxy setting | `"proxy"` line in `package.json` | `server.proxy` in `vite.config.js` — **Vite ignores the `package.json` line** |
| Tests | Jest built in | Need to add **Vitest** myself |

---

## Part A — Checks before starting

### Week 5 status check (before any Week 5 work)
A `frontend/` folder existed with a Vite app, but almost everything was in one
369-line `App.jsx`. Tested in a real (headless) Chrome:

| Criterion | Result | Why |
|---|---|---|
| Port 3000 | ❌ | Ran on 5173 (Vite default) |
| Cards with real data | ❌ | **0 cards, "(0 Total)"** although the database has 55,212 |
| Photo parsed from `L_Photos` | ⚠️ | Parsing code OK, but no cards appear |
| 7 things on card | ❌ | State and sqft missing |
| Loading state | ✅ | In code |
| Error message | ❌ | `catch` only does `console.error` — nothing on the page |
| Count "Showing X of Y" | ❌ | Different format, and shows 0 |
| Hover effect | ✅ | `App.css:22` |
| API client errors | ❌ | No `client.js`; no `res.ok` checks |

**The main bug:** the backend sends `{ total, limit, offset, results }`, but the old
code waited for `data.success` and `data.data` — fields that never come. So the
data arrived and was silently ignored.
Comparison: a mail sorter told to accept only envelopes stamped "SUCCESS" — none
have the stamp, so all letters are quietly thrown away.

Other bugs in the old code: sends `page=` (backend reads `offset`), `bedrooms=`
(backend reads `beds`), opens details with `prop.id` (backend wants `L_ListingID`).

### Week 4 re-test (11 of 11 ✅)
Ran on a separate test copy of the backend (port 5001) so I could read its logs.

| Test | Result |
|---|---|
| `/1118381441` | 200, object with 126 columns |
| `/999999999` | 404 with helpful message |
| `/abc123`, 25-digit ID | 400 |
| `/1118381441/openhouses` | 200, array of 1 |
| `/1118422731/openhouses` | 200, `[]` |
| Sorting | `ORDER BY OH_StartDate, OH_StartTime` (`routes/properties.js:160`) |
| Orphan ID `1021795007` | 404 on both endpoints, server stayed up |
| Logging | 10 requests → 10 log lines |
| Route order | `/:id/openhouses` (line 144) before `/:id` (line 173) |
| try/catch + global handler | every route + `server.js:51` |
| Week 3 search `?city=Los Angeles&minPrice=300000&beds=3` | 200, total 2,468, all results match |

Noticed: the city search took **602 ms** (others 0–17 ms). `LOWER(TRIM(L_City))`
stops MySQL from using the `idx_city` index.

---

## Part B — Restructuring the repo

### The problem
Git only saves files **inside the folder where the repository starts**. Mine
started at `IDX/backend/`, and `frontend/` was next to it — outside, so not saved.
Comparison: a photocopier that only copies what's inside one box.

### Options I considered
| Option | Verdict |
|---|---|
| A. Put `frontend/` inside the `backend` folder | Works, but confusing: a folder called "backend" holding the frontend |
| B. Start git one level up at `IDX/` | ❌ Would expose private files (offer letter PDF) and a 773 MB SQL folder (GitHub rejects files > 100 MB) |
| C. Separate GitHub repo for the frontend | Two repos, two PRs — more to manage |
| **Chosen: restructure** | One repo with `backend/` and `frontend/` side by side |

### Result
```
IDX/
└── IDX-Exchange-SDE/     ← the git repo (renamed from "backend" on my laptop)
    ├── backend/          ← server.js, db.js, routes/, sql/, package.json, .env
    ├── frontend/         ← React app
    ├── docs/             ← weekly notes
    ├── README.md
    └── .gitignore        ← protects .env and node_modules in every folder
```

### Steps
| Step | What | Command |
|---|---|---|
| R1 | Stop the backend, close `.env` in VS Code | `kill <PID>` / `Ctrl + C` |
| R2 | Rename the local folder | `mv IDX/backend IDX/IDX-Exchange-SDE` |
| R3 | Rename the empty branch | `git branch -m week-5 restructure` |
| R4 | Move backend files, keeping history | `git mv server.js db.js routes sql package.json package-lock.json .env.example backend/` |
| R5 | Move untracked files | `mv .env node_modules backend/` |
| R6 | Fix README paths | 7 changes (`cd IDX-Exchange-SDE/backend`, structure, links) |
| R7 | Test everything again | All curl tests same as before |
| R8 | 2 commits, push, PR #4, merged | |

### Things I learned
- **`git mv`** = move a file *and* tell git it's the same file. History is kept:
  `git log --follow backend/server.js` still shows the Week 3–4 commits.
  Comparison: a mail forwarding notice — same person, new address.
- **`R100`** in `git status` / `git diff` = git compared old and new file and they're
  100% the same → recorded as a rename. (After my extra comments, `server.js` showed
  88% — still a rename.)
- **Staging area** = the "basket" of changes that go into the next commit.
  `git mv` puts the move in the basket straight away.
- **`git check-ignore -v backend/.env`** proves `.env` is still ignored after moving.
  The `.gitignore` rule `.env` (no slash) works in every sub-folder.
- **Renaming the outer folder doesn't affect git** — git keeps everything in the
  hidden `.git` folder inside.
- **Fast-forward** (on `git pull`) = my branch had nothing new, so git just moved it
  forward to GitHub's latest commit.
- **`git branch -d`** (lowercase) only deletes a branch if its work is already merged.

### How to start things now
```bash
# backend
cd ~/Downloads/IDX/IDX-Exchange-SDE/backend
npm run dev                  # → Server listening on http://localhost:5000

# frontend (second terminal)
cd ~/Downloads/IDX/IDX-Exchange-SDE/frontend
npm run dev                  # → Local: http://localhost:3000/
```
Use `pwd` to check which folder the terminal is in.

---

## Step 0 — Save the frontend as a starting point ✅
```bash
git add frontend
git commit -m "chore: add existing Vite React app as starting point"   # b193b17
```
16 files, **0 from `node_modules`** (blocked by `frontend/.gitignore`).
**Why commit code I'm about to replace?** A clear "before" photo — the Week 5 PR
shows exactly what I changed, and the old `App.jsx` stays in history.

---

## Step 1 — Port 3000 + proxy ✅ (`frontend/vite.config.js`)

```js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,         // Week 5: the assignment asks for port 3000 (Vite's default is 5173)
    strictPort: true,   // if 3000 is taken, stop with an error instead of quietly using another port
    proxy: {
      '/api': 'http://localhost:5000',  // forward /api/* requests to the Express backend
    },
  },
})
```

| Line | Plain English |
|---|---|
| `server: { ... }` | Settings for the dev server (`npm run dev`) |
| `port: 3000` | Open the app at `http://localhost:3000` |
| `strictPort: true` | If 3000 is busy, fail loudly instead of silently moving to 3001 |
| `proxy: { '/api': ... }` | Anything starting with `/api` is forwarded to `localhost:5000` |

### Test
| Command | Result |
|---|---|
| `npm run dev` | `➜ Local: http://localhost:3000/` ✅ |
| `curl localhost:3000/` | HTTP 200, `text/html` — the React page ✅ |
| `curl localhost:3000/api/health` | `{"status":"ok","database":"connected"}` — the **backend's** answer through port 3000 ✅ |
| `curl localhost:3000/api/properties/abc123` | The backend's 400 message ✅ |
| `curl "localhost:3000/api/properties?limit=1"` | total 55,212 ✅ |

How a request travels:
```
browser → localhost:3000/api/health → Vite (proxy) → localhost:5000/api/health → Express → MySQL
```
The page itself still shows "0 Total" — the old `App.jsx` gets fixed in steps 2 and 7.

### Check question
**Q:** I open `http://localhost:3000/api/properties/999999999`. Who sends the 404 — Vite or Express?
**A:** **Express.** Vite only carries the request and the answer; Express decides it's a 404.

---

## Problems we hit
| Problem | Cause | Fix / lesson |
|---|---|---|
| Frontend showed 0 properties, no error | Code checked `data.success`, which the backend never sends | Will be fixed in the API client (step 2). Silent failures are the worst kind — always show errors. |
| Backend restarted by itself when `frontend/` was moved in | nodemon watches every `.js`/`.json` file in its folder | Gone after the restructure — `frontend/` is no longer inside the backend folder |
| My backend was stopped by mistake during testing | A stop command matched every `node server.js` process, not just the test copy | Restarted with `rs`. Lesson: stop programs by their exact **PID** |
| `cd backend` → "no such file or directory" and `npm run dev` → "Missing script" | After the rename, the backend is at `IDX-Exchange-SDE/backend`. npm reads the `package.json` of the folder you're in. | `cd IDX-Exchange-SDE/backend`. Use `pwd` when unsure. |
| README diagram looked misaligned in a check | The check counted **bytes**; `│` and `─` are 3 bytes but 1 character | Re-counted characters: all 99. Lesson: check the measuring tool before trusting a ❌ |
| MySQL "Access denied" with the container's saved password | The `MYSQL_ROOT_PASSWORD` saved in the container only applies on first setup; the real password was probably changed later | Not a problem for the app — the backend connects fine with `.env` |

---

## Questions my supervisor may ask
- **What is React? What is a component?** See "Words to know".
- **Why use a proxy instead of calling `localhost:5000` directly?** The frontend only
  uses `/api/...`, so it doesn't need to know where the backend runs; no CORS issues;
  easy to change later.
- **Does the proxy work in production?** No — only while the Vite dev server runs. A
  deployed site needs a different setup.
- **The instructions say Create React App — why Vite?** CRA is no longer maintained.
  With Vite the proxy goes in `vite.config.js`, not `package.json`.
- **Why `strictPort`?** So the app can never quietly start on a different port.
- **Why did the old page show 0 properties but no error?** It checked for a
  `success` field the backend never sends, and the `catch` only logged to the console.
- **Why restructure the repo?** So backend and frontend live side by side in one repo.
- **Did you lose git history by moving files?** No — `git mv` records renames;
  `git log --follow backend/server.js` shows all commits back to Week 3.
- **How do you know `.env` wasn't uploaded?** `git check-ignore -v backend/.env` and
  `git ls-files` confirm it's ignored and untracked.
- **How do you know the move didn't break anything?** Re-ran the Week 4 curl tests
  from the new folder — identical results.
- **Why commit the old frontend before changing it?** A clear before/after in the PR.

---

## Still to do / ask
- Commit Step 1, then Step 2 (API client).
- Confirm which column holds square feet (`LM_Int2_3` looks likely, e.g. 3,677).
- Debug challenge (`L_Photos`).
- Update `CLAUDE.md` paths: notes are now in `docs/week-N.md`, README is `README.md`
  (no longer `backend/...`).
