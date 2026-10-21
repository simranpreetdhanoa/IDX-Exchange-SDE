# Week 5 — React Frontend: Property Grid

> 🚧 In progress — Steps 0–3 done (debug challenge solved). See "Where we are" below.

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
never crashes. *(Solved in Step 3 — see below.)*

---

## Where we are

| Step | What | Status |
|---|---|---|
| — | Checks before starting (Week 5 status, Week 4 re-test) | ✅ Done |
| — | Restructure the repo (R1–R8) | ✅ Done — PR #4 merged |
| 0 | Get `frontend/` into git | ✅ Done — commit `b193b17` |
| 1 | Port 3000 + proxy | ✅ Done — commit `626d698` |
| 2 | API client `src/api/client.js` | ✅ Done — commit `790e5ac`, 9/9 tests pass |
| 3 | Debug challenge: investigate `L_Photos` | ✅ Solved — 211 `""` → crash; 404/PDF photos → broken image |
| 4 | Helper functions `src/utils/property.js` | ⏳ Next |
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

## Step 2 — API client ✅ (`frontend/src/api/client.js`)

### Why do we need it?
1. **It's a requirement** (#23) and an acceptance criterion ("throws meaningful error messages").
2. **One place for all backend talk.** The old `App.jsx` had 3 separate `fetch` calls,
   each with the same bugs (checked `data.success`, never checked `res.ok`, wrong
   parameter names). With `client.js` each thing is written once.
3. **Components stay simple:** `const data = await fetchProperties({ limit: 20 });`
   — data, or a clear error. Same idea as Week 4's middleware: each piece does one job.

**Comparison:** one trained waiter who carries every order to the kitchen and comes
back with either the food or a clear message — instead of every customer walking
into the kitchen. If the kitchen changes, you retrain one waiter.

**Check question:** if the API path changed to `/api/v2/properties`, how many files
change? **A:** With `client.js`: **one**. Old way: 2 edits in `App.jsx` today — and
one in *every* component file once the app has several pages.

### The code
```js
async function request(path) {
  let response;
  try {
    response = await fetch(path);
  } catch {
    throw new Error('Cannot reach the server. Is the frontend dev server running?');
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    // Not JSON (e.g. the proxy's own error page); keep body as null
  }

  if (!response.ok) {
    if (body === null && response.status >= 500) {
      throw new Error('Cannot reach the backend. Is the API running on port 5000?');
    }
    const detail = body?.error || body?.message || response.statusText;
    throw new Error(`Request failed (${response.status}): ${detail}`);
  }

  return body;
}

export function fetchProperties(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  }
  const queryString = query.toString();
  return request(`/api/properties${queryString ? `?${queryString}` : ''}`);
}

export function fetchPropertyDetail(id) {
  return request(`/api/properties/${encodeURIComponent(id)}`);
}
```

**`request(path)` — the shared helper (the waiter)**
| Code | Plain English |
|---|---|
| `await fetch(path)` | Send the request. `fetch` = the browser's built-in "send a request" tool. |
| first `catch` | Only runs when there's **no answer at all** (e.g. the dev server is off). |
| `response.json()` in its own `try` | Turn the answer into data; if it isn't JSON, keep `null` instead of crashing. |
| `!response.ok` | "The server answered, but with an error." See the traffic-light table below. |
| `body === null && status >= 500` | A 5xx with **no JSON** comes from the proxy, not Express (Express always sends JSON) → the backend is unreachable. |
| `body?.error \|\| body?.message` | Use the backend's own message. `?.` = "if `body` exists, read this; otherwise `undefined` — don't crash". `error` comes from my routes, `message` from my 404 handler. |
| `throw new Error(...)` | Stop and hand back a clear sentence the page can show. |

**`fetchProperties(params)` / `fetchPropertyDetail(id)`**
| Code | Plain English |
|---|---|
| `URLSearchParams` | Builds `?city=Los+Angeles&beds=3` safely (handles spaces and symbols). |
| `Object.entries(params)` | `{ city: 'Irvine', beds: 3 }` → `[['city','Irvine'], ['beds',3]]` |
| skip `''`, `null`, `undefined` | An empty search box doesn't send `?city=`. |
| `beds`, `offset` | The names the backend really reads (`backend/routes/properties.js:21`) — fixes the old `bedrooms`/`page` bug. |
| `encodeURIComponent(id)` | Makes the ID URL-safe: `12/34` → `12%2F34`, so it can't add an extra `/`. |
| `export` | Other files may use this function. `request` isn't exported — it's private to this file. |

### What I learned: `fetch` does NOT throw on 404 or 500
`fetch` only throws when there is **no response at all**. If the server answers with
an error, `fetch` succeeds — you must check `response.ok` yourself.
Comparison: you get a reply letter — the post worked, but you still have to open it
and read whether it says "rejected".

**`ok` means "was it OK?"** — real output from my backend:

| ID | Status | `response.ok` | Light |
|---|---|---|---|
| `1118381441` | 200 | **true** | 🟢 found it |
| `999999999` | 404 | **false** | 🔴 not found |
| `abc123` | 400 | **false** | 🔴 bad ID |
| (MySQL down) | 500 | **false** | 🔴 server problem |

**Rule:** only **200–299** is OK (`true`). Every error code is `false`.
`response.ok` asks "did it work?"; `!response.ok` (with `!` = not) asks "did it go wrong?".

| What happened | `fetch` throws? | `response.ok` | Caught by |
|---|---|---|---|
| 200 | no | true | — data is returned |
| 400 / 404 / 500 | **no** | false | `if (!response.ok)` |
| No server at all | **yes** | (no response) | the first `catch` |

### Test
A throwaway test script (outside the project) called the real functions through the
proxy on port 3000. Lint check (`npx oxlint`) → no problems.

| # | Call | Sent | Result |
|---|---|---|---|
| 1 | `fetchProperties({ limit: 2 })` | `?limit=2` | ✅ total 55,212, 2 results |
| 2 | LA, ≥ $300k, ≥ 3 beds | `?city=Los+Angeles&minPrice=300000&beds=3` | ✅ total 2,468 (same as Week 4) |
| 3 | `{ city: '', beds: 3 }` | `?beds=3` | ✅ empty city skipped (total 39,661) |
| 4 | `fetchPropertyDetail('1118381441')` | `/1118381441` | ✅ 349 E Gobind Blvd, 126 columns |
| 5 | `fetchPropertyDetail('999999999')` | `/999999999` | ✅ `Request failed (404): No property found with listing ID 999999999. Check the ID and try again.` |
| 6 | `fetchPropertyDetail('abc123')` | `/abc123` | ✅ `Request failed (400): Invalid listing ID…` |
| 7 | `fetchProperties({ limit: 500 })` | `?limit=500` | ✅ `Request failed (400): limit must be an integer between 1 and 100` |
| 8 | `fetchPropertyDetail('12/34')` | `/12%2F34` | ✅ slash encoded → backend 400 |
| 9 | Nothing running (port 3999) | | ✅ `Cannot reach the server. Is the frontend dev server running?` |

**Not tested yet:** "Cannot reach the backend…" (Vite running, Express stopped) —
saved for Step 8.

### Check questions
- **Q:** The backend answers `abc123` with a 400. Which line notices the problem even
  though the server answered? **A:** `if (!response.ok)` — `ok` is false for 400.
- **Q:** 200 → `response.ok`? **A:** true. **404?** false. **500?** false.

---

## Step 3 — Debug challenge 🐛 ✅ (`L_Photos`)

> *Images are broken for some properties but not others. Is `L_Photos` always a valid
> JSON array? What does it contain for properties with no photos? Write defensive
> code that never crashes.*

**Defensive code** = code that expects bad input and handles it calmly instead of
crashing. Like a seatbelt — you assume something *might* go wrong.

No project files changed in this step — all checks were throwaway scripts.

### The detective trail (hints → what I did → what I found)

**Hint 1 — one example can't speak for 55,212 rows.**
My idea: group the values and count each.
```sql
SELECT L_Photos, COUNT(*) AS how_many
FROM rets_property
GROUP BY L_Photos
ORDER BY how_many DESC
LIMIT 10;
```
Result: 54,999 different values (almost every house has its own unique list). Repeated
values rise to the top:
```
how_many | L_Photos
     211 | ""                      ← an EMPTY STRING, not a JSON array
       2 | ["https://...1178234327...   ← the 3 duplicate listings from Week 4
       1 | ["https://...
```

**Hint 2 — what does the code do with `""`?** I predicted, then we ran it:
```
JSON.parse("")  →  SyntaxError: Unexpected end of JSON input
```
It **throws**. In React, an error while drawing a component removes the **whole app**
→ a **blank white page**. One bad house out of 20 would wipe out every card.
(Same lesson as Week 4's `rows[0].L_Address`: the code *assumed* data was there.)

**Hint 3 — GROUP BY can't show a broken value that appears only once.**
My idea: loop through every row and try `JSON.parse` on each one. Result for all 55,212:

| Count | Group |
|---|---|
| 54,751 | Valid array, first photo `https://` on `api.cotality.com` |
| 250 | Valid array, first photo `https://` on `api-trestle.corelogic.com` |
| 211 | Empty string `""` |
| 0 | `NULL`, broken JSON, not an array, `[]`, first item not text / not a URL |

"0 today" ≠ "impossible tomorrow" — the data comes from an outside feed.

**Hint 4 — a valid URL can still fail.** Like an address written perfectly on an
envelope, but the building was knocked down. To check: request it and read the status code.
I tested 1 URL from each website: both answered **302** (redirect = "moved, go here
instead") → `media.crmls.org` → **200**. Both worked.

**Hint 5 — one example per group isn't enough.** My idea: test more.
Tested **all 250** corelogic URLs and a **random sample of 250** cotality URLs
(a random sample is like a taste test — 250 random spoonfuls tell you about the pot):

| Group | Final answer | Count | What it really is |
|---|---|---|---|
| corelogic | 200 `image/jpeg` | 234 | Real photo |
| corelogic | **404 Not Found** | **16** | Nothing there |
| cotality | 200 `image/jpeg` | 235 | Real photo |
| cotality | 200 **`application/pdf`** | **11** | A **PDF document**, not a photo |
| cotality | 200 `text/plain` | 4 | Wrong label — `file` says it's really a JPEG |

**Content type** = the label a server puts on what it sends (like a parcel label).
The `file` command ignores the label and looks inside.

**Last check — what does `<img>` show?** My guess: 404 and PDF broken, mislabelled
JPEG shows. Tested in headless Chrome:

| Photo | Result |
|---|---|
| Normal | ✅ shown (1024 × 683) |
| Mislabelled JPEG | ✅ shown — browsers look inside images, not at the label |
| 404 | ❌ broken — `onerror` fired |
| PDF | ❌ broken — `onerror` fired |

**`onerror`** = an **event** (a signal from the browser) that an `<img>` fires when it
can't show the picture.

### The answer
**Is `L_Photos` always a valid JSON array?** No. **With no photos it contains an empty
string `""`** (211 properties). There are two different problems:

| Kind | What | How many | Without protection |
|---|---|---|---|
| **A. Bad data** | `L_Photos` = `""` | 211 of 55,212 | `JSON.parse` throws → **whole page blank** |
| **B. Bad picture** | Valid URL → 404 or PDF | ~6% of corelogic, ~4% of cotality tested | **Broken-image icon** on that card |

### The fix (built in Step 4)
| Problem | Protection | Comparison |
|---|---|---|
| A. Bad data | `try/catch` around `JSON.parse` → "no photo" instead of a crash | Seatbelt |
| A+. Parses but isn't a photo list (`null`, `{}`) | Check `Array.isArray` and that the first item is text | `try/catch` only helps when something **throws** |
| B. Bad picture | `onError` on `<img>` → swap to a placeholder | A spare picture for the frame |
| No photo | Show the placeholder straight away | |

### Check questions
- **Q:** What is in `L_Photos` for the top GROUP BY row? **A:** An empty string — not a valid array.
- **Q:** `JSON.parse("")` returns `[]`, `null`, throws, or `""`? **A:** It **throws** → the page crashes.
- **Q:** Will `<img>` show the 404, the PDF, the mislabelled JPEG? **A:** 404 ❌, PDF ❌, JPEG ✅.
- **Q:** Two protections? **A:** `try/catch` around `JSON.parse`; a placeholder when the image fails.

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
- **What does an API client do?** It's the one file that talks to the backend: builds
  the request, checks for errors, and gives components data or a clear error message.
- **Why not use `fetch` directly in components?** All error handling lives in one
  place; if the API changes, I fix one file.
- **Does `fetch` throw an error on a 404?** No — only when there's no response at all.
  For 404/500 you must check `response.ok`.
- **How do you tell "backend down" from a normal 500?** Through the proxy, "backend
  down" is a 5xx with no JSON body; my Express 500s always have a JSON `error`.
- **What was special about the broken images?** Two things: 211 properties have
  `L_Photos = ""` (crashes `JSON.parse`), and some valid URLs lead to a 404 or a PDF.
- **How did you find them?** GROUP BY + COUNT, then a check of all 55,212 rows, then
  500 photo URLs with curl, then a real browser test.
- **Why handle cases that aren't in the data (NULL, broken JSON)?** The data comes from
  an outside feed and can change; "never crash" means handling any value.
- **Why test a random sample instead of all 54,751 URLs?** Faster, and it doesn't
  hammer someone else's server; a random sample still shows the pattern.
- **Why does a JPEG labelled `text/plain` still show?** Browsers check the file
  itself for images, not the label.

---

## Still to do / ask
- Step 8: test "Cannot reach the backend" (stop the backend — ask first).
- Confirm which column holds square feet (`LM_Int2_3` looks likely, e.g. 3,677).
- Data issue to report: ~4–6% of tested photo URLs are 404s or PDFs (from the MLS feed).
- Update `CLAUDE.md` paths: notes are now in `docs/week-N.md`, README is `README.md`
  (no longer `backend/...`).
