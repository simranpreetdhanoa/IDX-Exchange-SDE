# Week 5 — React Frontend: Property Grid

> ✅ All requirements and acceptance criteria pass (Step 8: 8/8) — merged in PR #5.
> ✅ Testing tools from the guide added (Jest, Supertest, React Testing Library): **71 automatic tests** — see "Part C".

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
| 3 | Debug challenge: investigate `L_Photos` | ✅ Solved — commit `4a32c89`; 211 `""` → crash; 404/PDF photos → broken image |
| 4 | Helper functions `src/utils/property.js` | ✅ Done — commit `35e144a`; 39/39 edge cases, 0 crashes on 55,212 rows |
| 5 | `PropertyCard` component | ✅ Done — commit `85a16e8`; 3/3 render tests (hover + `onError` checked in Step 8) |
| 6 | `ListingsPage` component | ✅ Done — commit `4080e24`; starts in "Loading…", lint clean |
| 7 | Hook it up in `App.jsx` | ✅ Done — commit `80810ef`; 20 real cards, "Showing 20 of 55,212", 0 console errors |
| 8 | Full acceptance check | ✅ Done — **8/8 criteria** + `onError` swap, in a real browser |
| 9 | README + PR | ⏳ Next |

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

## Step 4 — Helper functions ✅ (`frontend/src/utils/property.js`)

### First: check the facts
The README said `LM_Int2_3` "appears to be" living area — not good enough for code.
Average `LM_Int2_3` by bedrooms grows the way house size does, so it **is** living area:

| Beds | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Avg `LM_Int2_3` | 768 | 1,215 | 1,731 | 2,488 | 3,604 | 5,008 |

(7 listings say their area is in square **meters** — a tiny edge case, not handled.)

**`L_Photos` isn't the only field with holes:**

| Field | Column | Missing / empty |
|---|---|---|
| Price | `L_SystemPrice` | 0 |
| Sqft | `LM_Int2_3` | 92 missing + 112 zero |
| Beds | `L_Keyword2` | 104 |
| Baths | `LM_Dec_3` (comes as text, e.g. `"4.0"`) | 14 |
| Address | `L_Address` | 135 |
| City / State | `L_City` / `L_State` | 89 / 67 |

Without care, a card could show `null beds` or `$NaN`.

### What & why
Small functions that turn raw database values into **safe, readable text**. Each one
accepts *anything* and **never throws**.
Comparison: a kitchen prep station — raw ingredients come in (some bruised or
missing), only clean, ready-to-serve food goes out to the card.

### The code
```js
export function getFirstPhoto(rawPhotos) {
  if (typeof rawPhotos !== 'string' || rawPhotos.trim() === '') return null;
  try {
    const photos = JSON.parse(rawPhotos);
    if (!Array.isArray(photos)) return null;
    const first = photos[0];
    return typeof first === 'string' && first.trim() !== '' ? first : null;
  } catch {
    return null; // broken JSON
  }
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function formatPrice(value) {          // 1122426 → "$1,122,426"
  const price = toNumber(value);
  if (price === null || price <= 0) return 'Price not listed';
  return '$' + price.toLocaleString('en-US');
}

export function formatSqft(value) {           // 2992 → "2,992 sqft"
  const sqft = toNumber(value);
  if (sqft === null || sqft <= 0) return '— sqft';
  return `${sqft.toLocaleString('en-US')} sqft`;
}

export function formatCount(value) {          // "4.0" → "4", "2.5" → "2.5", missing → "—"
  const count = toNumber(value);
  return count === null ? '—' : String(count);
}

export function formatAddress(address) {
  return typeof address === 'string' && address.trim() !== '' ? address.trim() : 'Address not listed';
}

export function formatCityState(city, state) { // ("Mountain House", "CA") → "Mountain House, CA"
  const parts = [city, state]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter((part) => part !== '');
  return parts.length > 0 ? parts.join(', ') : 'Location not listed';
}
```

**`getFirstPhoto` — the debug challenge fix (protection A)**
| Code | Plain English |
|---|---|
| `typeof rawPhotos !== 'string'` | Not text at all (e.g. `null`) → no photo. `typeof` tells you what kind of value something is. |
| `.trim() === ''` | Empty or only spaces → no photo. **Catches the 211.** `trim()` removes spaces at both ends. |
| `try { JSON.parse } catch { return null }` | Seatbelt: broken JSON → "no photo", not a crash |
| `Array.isArray(photos)` | `JSON.parse("null")` / `("{}")` don't throw but aren't lists |
| `typeof first === 'string'` | First item must be text — `[1]`, `[null]` → no photo |
| returns `null` | "No usable photo" → the card shows the placeholder (Step 5) |

**The other helpers**
| Code | Plain English |
|---|---|
| `toNumber` | Private helper. `Number("4.0")` → 4; missing or rubbish → `null`. `Number("abc")` gives **`NaN`** ("Not a Number"); **`Number.isFinite`** = "is it a real number?" |
| `toLocaleString('en-US')` | Adds commas: `1122426` → `1,122,426` |
| `price <= 0` | A price of 0 isn't real → "Price not listed" |
| `formatCityState` | `.map` tidies each part, `.filter` drops empty ones, `.join(', ')` glues them — no `"Fresno, "` |

**Protection B** (404/PDF photos) needs `onError` on the `<img>`, so it lives in the card (Step 5).

### Test
**1. Edge cases — 39 of 39 ✅** (throwaway script)

| Function | Tricky inputs → result |
|---|---|
| `getFirstPhoto` | `""`, `"   "`, `null`, `undefined`, `"broken["`, `"null"`, `"{}"`, `"[]"`, `"[1]"`, `"[\"\"]"`, `"\"just text\""`, `42` → all `null`; a real list → first URL |
| `formatPrice` | `1122426` → `$1,122,426`; `"950000"` → `$950,000`; `0`, `null`, `"abc"`, `-5` → `Price not listed` |
| `formatSqft` | `2992` → `2,992 sqft`; `0`, `null`, `""` → `— sqft` |
| `formatCount` | `"4.0"` → `4`; `"2.5"` → `2.5`; `0` → `0`; `null`, `""`, `"x"` → `—` |
| `formatAddress` | spaces trimmed; `""`, `null` → `Address not listed` |
| `formatCityState` | `("Fresno", "")` → `Fresno`; nothing → `Location not listed` |

**2. Every real row (55,212) — 0 crashes ✅**

| What | Count |
|---|---|
| No photo | **211** (exactly the empty strings) |
| No sqft | 204 (92 + 112) |
| No beds / baths | 104 / 14 |
| No address | 135 |
| No city and no state | 65 |
| Price not listed | 0 |

Example card text for `1118381441`:
```
$1,122,426 | 349 E Gobind Blvd | Mountain House, CA | 5 beds | 4 baths | 2,992 sqft
```
All 7 card items — including state and sqft, which the old code was missing.

**3. Lint** (`npx oxlint`) ✅ no problems.

### What I learned: `try/catch` vs `Array.isArray`
`JSON.parse("null")` **succeeds** and returns `null` — nothing is thrown, so `try/catch`
never runs. `Array.isArray` is what catches it.
**`try/catch` only protects against errors that are *thrown*.** A value that parses fine
but is the wrong *kind* needs its own check.
Comparison: the seatbelt protects you in a crash — but if you got into the **wrong car**
without crashing, the seatbelt doesn't help. You have to check it's the right car.

### Check question
**Q:** `getFirstPhoto("null")` returns `null`. Which line catches it — `try/catch` or another check?
**A:** `Array.isArray` — `JSON.parse("null")` doesn't throw.

---

## Step 5 — `PropertyCard` ✅ (`frontend/src/components/PropertyCard.jsx` + `.css`)

### What & why
My first real React **component** — one LEGO brick that shows **one house**. It
receives a property, uses the Step 4 helpers for all the text, adds **protection B**
(placeholder when the photo fails), and has the **hover effect** in its CSS.

### The code
```jsx
import { useState } from 'react';
import { getFirstPhoto, formatPrice, formatSqft, formatCount, formatAddress, formatCityState } from '../utils/property';
import './PropertyCard.css';

export default function PropertyCard({ property }) {
  const photoUrl = getFirstPhoto(property.L_Photos);
  // Debug challenge, protection B: some photo URLs lead to a 404 or a PDF
  const [photoFailed, setPhotoFailed] = useState(false);
  const address = formatAddress(property.L_Address);

  return (
    <article className="property-card">
      {photoUrl && !photoFailed ? (
        <img
          className="property-card-photo"
          src={photoUrl}
          alt={`Photo of ${address}`}
          loading="lazy"
          onError={() => setPhotoFailed(true)}
        />
      ) : (
        <div className="property-card-photo property-card-placeholder">No photo available</div>
      )}

      <div className="property-card-body">
        <p className="property-card-price">{formatPrice(property.L_SystemPrice)}</p>
        <p className="property-card-address">{address}</p>
        <p className="property-card-location">{formatCityState(property.L_City, property.L_State)}</p>
        <p className="property-card-specs">
          {formatCount(property.L_Keyword2)} beds · {formatCount(property.LM_Dec_3)} baths ·{' '}
          {formatSqft(property.LM_Int2_3)}
        </p>
      </div>
    </article>
  );
}
```

| Code | Plain English |
|---|---|
| `export default function PropertyCard(...)` | A **component** is just a function. `default` = the main thing this file offers (`import PropertyCard from ...`). |
| `({ property })` | The **props** — input from the parent. `ListingsPage` hands over one house. (The order a manager hands to a waiter.) |
| `return ( <article> … )` | The **JSX** — what this component shows. `<article>` = an HTML box for one self-contained item. |
| `className="…"` | JSX's word for HTML's `class` (`class` is reserved in JavaScript). React turns it into `class` in the real HTML. |
| `{formatPrice(…)}` | Curly braces = "run this JavaScript and put the result here". |
| `useState(false)` | **State** — a value the card remembers. `setPhotoFailed(true)` changes it and React **redraws** the card. |
| `photoUrl && !photoFailed ? <img/> : <div/>` | `? :` = "if … then … otherwise …". URL exists **and** hasn't failed → photo; otherwise → placeholder. |
| `onError={() => setPhotoFailed(true)}` | **Protection B** — the image fails (404, PDF) → remember it → placeholder. |
| `alt={…}` | Describes the picture for screen readers (used by blind users); shown if it can't load. |
| `loading="lazy"` | Only download the photo when it's about to scroll into view — faster page with many cards. |
| `{' '}` | Keeps the space before the sqft when the line wraps (a JSX quirk). |

### The CSS (hover effect)
```css
.property-card {
  /* … white box, border, rounded corners … */
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}
.property-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12);
}
.property-card-photo { display: block; width: 100%; height: 200px; object-fit: cover; }
```
| Code | Plain English |
|---|---|
| `transition: … 0.2s` | Animate changes over 0.2 seconds instead of jumping |
| `:hover { translateY(-4px); box-shadow … }` | **The hover effect** — mouse over the card → lift 4 px + shadow |
| `object-fit: cover` | Fill the photo area without stretching; crop the edges instead |
| `overflow: hidden` | Keep the photo inside the rounded corners |
| `property-card-…` names | Can't clash with the old `App.css`, which also has `.card` |

### Test
Rendered the component to HTML **without a browser** (server-side rendering: drawing a
component as text) using a throwaway script — no project file changed.

| Test house | Result |
|---|---|
| Real data `1118381441` | ✅ `<img src="https://api.cotality.com/…" alt="Photo of 349 E Gobind Blvd" loading="lazy">` · `$1,122,426` · `349 E Gobind Blvd` · `Mountain House, CA` · `5 beds · 4 baths · 2,992 sqft` |
| `L_Photos: ""` (one of the 211) | ✅ no `<img>`; `No photo available`; rest of the card intact; no crash |
| Everything missing `{}` | ✅ `Price not listed` · `Address not listed` · `Location not listed` · `— beds · — baths · — sqft` · placeholder; no crash |
| Lint | ✅ no problems |

All 7 card items appear (requirement 25). `onError` isn't in the HTML — event handlers
only exist in a live browser — so the photo-fails swap and the hover are checked in Step 8.

**Problem we hit:** the first test run failed with `module is not defined`. That was my
test script loading React the wrong way through Vite (the error came from inside
React's own files) — fixed the script; the card code didn't change.

### What I learned: what happens when a photo is a PDF
```
1. <img> tries to load the PDF  →  it's not a picture
2. The browser fires onerror     →  onError={() => setPhotoFailed(true)} runs
3. photoFailed becomes true      →  state changed, so React REDRAWS the card
4. The check runs again: photoUrl && !photoFailed  →  false
5. The "otherwise" part shows    →  "No photo available"
```
Step 3 is the key: **changing state is what makes React redraw.** With a normal variable,
the screen would never change.

### Check question
**Q:** A card's photo URL leads to a PDF — what happens?
**A:** `onError` fires → `photoFailed` becomes true → React redraws → placeholder shows.

---

## Step 6 — `ListingsPage` ✅ (`frontend/src/pages/ListingsPage.jsx` + `.css`)

### What & why
The **manager** of the page: asks `client.js` for properties, shows the right message
while waiting or when something goes wrong, then shows the **count** and hands each
house to a `PropertyCard`. Covers requirements 24 and 26.
```
ListingsPage
 ├─ loading?  → "Loading properties…"
 ├─ error?    → "Couldn't load properties. <clear message from client.js>"
 └─ data      → "Showing 20 of 55,212 properties"
                 grid → PropertyCard × 20
```

### The code
```jsx
const PAGE_SIZE = 20;

export default function ListingsPage() {
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Runs once, when the page first appears
  useEffect(() => {
    async function load() {
      try {
        const data = await fetchProperties({ limit: PAGE_SIZE });
        setProperties(data.results);
        setTotal(data.total);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <p className="listings-status">Loading properties…</p>;
  }

  if (error) {
    return (
      <div className="listings-status listings-error" role="alert">
        <strong>Couldn't load properties.</strong> {error}
      </div>
    );
  }

  return (
    <section className="listings-page">
      <h1 className="listings-title">Properties for sale</h1>
      <p className="listings-count">
        Showing {properties.length.toLocaleString('en-US')} of {total.toLocaleString('en-US')} properties
      </p>
      {properties.length === 0 ? (
        <p className="listings-status">No properties found.</p>
      ) : (
        <div className="listings-grid">
          {properties.map((property) => (
            // id (row number) is unique; L_ListingID isn't — 3 listings appear twice (Week 4)
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </section>
  );
}
```

| Code | Plain English |
|---|---|
| 4 × `useState` | The page's memory: houses, total, "still loading?", "what went wrong?" |
| `useState(true)` for `loading` | Start in loading mode — no data yet |
| **`useEffect(() => {…}, [])`** | "Run this **after** the page appears." `[]` = **only once**. Comparison: a restaurant fetches the day's menu once when it opens, not every time a customer sits down. |
| `async function load()` inside | `useEffect` itself can't be `async`, so we make a small `async` function and call it |
| `data.results`, `data.total` | The backend's **real** field names — fixes the old `data.success` / `data.data` bug |
| `catch` → `setError(err.message)` | Store `client.js`'s clear sentence to show on screen (the old code only did `console.error`) |
| `finally` → `setLoading(false)` | Stop showing "Loading" whether it worked or failed |
| `if (loading) return …` | An **early return** — show a message and stop, like Week 4's `validateListingId` |
| `role="alert"` | Tells screen readers "important — read this out now" |
| `properties.length === 0 ?` | No matches → "No properties found" instead of an empty grid |
| **`properties.map(…)`** | Turns a list of 20 houses into 20 `<PropertyCard>`s — one brick per house |
| **`key={property.id}`** | React needs a **unique** label on each list item to track which card is which. Comparison: name tags at a party. `L_ListingID` isn't unique (Week 4's 3 duplicates), so we use the row number `id`. |

```css
.listings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}
```
"Fit as many columns as possible, each at least 260 px wide, sharing the leftover
space" — 4 columns on a wide screen, 1 on a phone, no extra code.

### Test
| Check | Result |
|---|---|
| Rendered to HTML (starting state) | ✅ `<p class="listings-status">Loading properties…</p>` |
| Lint with React rules (`npx oxlint --react-plugin`) | ✅ no problems |

Server-side rendering draws the page **once**, at the start — `useEffect` only runs in a
real browser, so the fetch never happens here. Real cards and the count → Step 7;
error when the backend is down → Step 8.

### What I learned: why `[]` matters
Without `[]`, the effect runs after **every** redraw:
```
page appears → useEffect → fetch → setProperties(…) → state changed → React redraws
     ↑                                                                    │
     └──────── no [] = "run after EVERY redraw", so it runs again ────────┘
```
An **endless loop** — hundreds of requests per second to my backend. `[]` breaks it.
Comparison: a waiter who, every time food arrives, goes back to order the same food again.

### Check question
**Q:** What goes wrong if we remove the `[]`?
**A:** It fetches again after every redraw — an endless loop.

---

## Step 7 — Hook it up ✅ (`App.jsx`, `App.css`, `index.css`)

### What & why
The browser still showed the **old** 369-line `App.jsx`. Swapped it for `ListingsPage`.
Before changing anything I checked the two style files — both would have got in the way:
- **`App.css`** — styles for the old page only (`.header`, `.health-badge`, `.card`…).
- **`index.css`** — Vite's starter template. It **centres all text** (`#root { text-align: center }`)
  and switches to a **dark background** in dark mode while my title is dark text → unreadable.

### The 3 changes
**1. `App.jsx`** — 369 lines → 5:
```jsx
import ListingsPage from './pages/ListingsPage';

// Week 5: the app is the listings page (the old all-in-one version is in git history, commit b193b17)
export default function App() {
  return <ListingsPage />;
}
```
**2. `App.css`** — deleted (`git rm`); old styles stay in git history.

**3. `index.css`** — 111-line template → small global styles:
```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  background: #f8fafc;
  color: #1e293b;
}
```
| Code | Plain English |
|---|---|
| `return <ListingsPage />` | `App` is the top brick; it now just shows the listings page |
| `box-sizing: border-box` | Widths include padding and border, so `width: 100%` really fits. `*` = every element. A common first line in most websites' CSS. |
| `body { … }` | Page-wide basics: no gap at the edges, clean font, light grey background, dark text |

`main.jsx` wasn't touched — it already loads `index.css` and `App`.

### Test — in a real browser (headless Chrome)
| Check | Result |
|---|---|
| Title | ✅ "Properties for sale" |
| Count | ✅ **"Showing 20 of 55,212 properties"** |
| Cards | ✅ **20** from MySQL, e.g. `$3,950,000 · 1461 Laurel Way · Beverly Hills, CA · 4 beds · 5 baths · 3,677 sqft` |
| All 7 items | ✅ 20 of 20 cards have price, address, city/state, beds, baths, sqft + photo or placeholder |
| Photos | ✅ 19 real photos + 1 placeholder |
| Debug challenge, live | ✅ The placeholder card is **582 Pasture Ave** (`1118398412`) — `L_Photos = ""`, one of the 211. The rest of its card shows normally — no blank page. |
| Loading / error | ✅ "Loading…" gone; 0 error boxes |
| Browser console | ✅ no errors (only Vite "connected" and React DevTools tip) |
| Lint | ✅ no problems |

Screenshot: a 4-column grid of white cards with photos, prices in bold, address,
city/state and "beds · baths · sqft" — the second card shows the grey
"No photo available" box.

**False alarm:** my first check said "error shown: True". In development, Vite puts the
CSS **inside** the page, so the class name `listings-error` appeared in the styles —
not as an error box. Re-checked for the box itself (`role="alert"`): **0**.
Lesson: when a test result contradicts what you see, check the test.

**Two requests per page load:** the backend log shows `GET /api/properties?limit=20`
**twice**. That's React **StrictMode** (in `main.jsx`): in development only, it runs
effects twice on purpose to help catch bugs. A deployed site fetches once.

**Noticed (not failures):**
- `1 baths` (6577 Morongo Road) — should be "1 bath"; small grammar fix for later.
- `13 beds · 20 baths · 34,143 sqft` for $28,888,000 — real data (a Palos Verdes mansion), not a bug.

### What I learned: protection A vs B
| | Protection A | Protection B |
|---|---|---|
| When | **Before** drawing — `getFirstPhoto` returns `null` | **After** trying — `<img>` fails, `onError` fires |
| Cause | Bad **data** (`L_Photos = ""`) | Bad **picture** (404, PDF) |
| `<img>` in the page? | **No** | Yes at first, then swapped |
| Example | 582 Pasture Ave (seen in Step 7) | To test in Step 8 |

### Check question
**Q:** 582 Pasture Ave shows "No photo available". Protection A or B?
**A:** **A** — `L_Photos` is empty, so `getFirstPhoto` returns `null`. Proof: no `<img>` tag at all on that card.

---

## Step 8 — Full acceptance check ✅ (8/8)

### How I tested
A throwaway script controlled headless Chrome through the **Chrome DevTools Protocol**
(Chrome's "remote control" — the same thing Chrome's developer tools use). It could:
slow the network down, move a virtual mouse, change a photo on purpose, read the
console and take screenshots. No project file changed.

### Results
| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Runs on port 3000 without errors | ✅ | `http://localhost:3000/`, **0** console errors |
| 2 | Real data from the database | ✅ | 20 cards; **20/20** match the API's address + price, same order |
| 3 | `L_Photos` parsed, **first** photo shown | ✅ | **19/19** `<img src>` = the first URL in that house's `L_Photos`; all 19 loaded; 1 placeholder (582 Pasture Ave) |
| 4 | Loading state | ✅ | Network slowed to a 3 s delay → "Loading properties…" with 0 cards |
| 5 | Error if backend unreachable | ✅ | See below |
| 6 | Property count | ✅ | "Showing 20 of 55,212 properties" |
| 7 | Hover effect | ✅ | `transform: none` → **`matrix(1, 0, 0, 1, 0, -4)`** while hovering (the last number, −4, = 4 px up) + shadow |
| 8 | API client throws meaningful errors | ✅ | 404 / 400 / no server (Step 2) + backend down (#5) |
| + | Protection B (`onError`) | ✅ | Card 3's photo changed to a **real 404 URL** from Step 3 → placeholder shown, `<img>` removed, rest of card intact |

Screenshot 1: card 1 lifted with a shadow (mouse hovering); card 2 (582 Pasture Ave)
"No photo available" from **protection A**; card 3 (14947 Dickens Street 3)
"No photo available" from **protection B** — in Step 7 it showed a red door.

### Test #5 — backend unreachable
1. Stopped only the backend, by exact process ID (npm, nodemon, server). Vite kept running on 3000.
2. The proxy now answered **HTTP 502** with an **empty** body (`text/plain`).
3. The page showed, in a red box:
   **"Couldn't load properties. Cannot reach the backend. Is the API running on port 5000?"**
   — 0 cards, no stuck "Loading…", **0 crashes**.
4. Restarted the backend (`npm run dev` in `backend/`) → health 200, 55,212 properties through the proxy again.

Why this message: the proxy *did* answer (502), so `fetch` didn't throw — `if (!response.ok)`
caught it, and the empty body (`body === null`) with status ≥ 500 means "the proxy
couldn't reach Express" rather than an Express error.

### Week 5 checkpoint
- [x] Property grid renders with real photos, prices, and addresses
- [x] Photo parsing handles missing, null, and malformed `L_Photos` values gracefully
- [x] API errors are caught and displayed to the user

---

## Week 5 vs the guide

### Done differently (same result)
| Guide says | What I did | Why |
|---|---|---|
| `"proxy": "http://localhost:5000"` in `package.json` | `server.proxy` in `vite.config.js` | My app uses **Vite**, which ignores the `package.json` line; the guide assumes Create React App |
| Port 3000 (automatic in Create React App) | `port: 3000` + `strictPort` in `vite.config.js` | Vite's default is 5173 |
| "Wrap `JSON.parse` in try/catch" | `try/catch` **plus** `Array.isArray`, a text check, and `onError` on the image | `try/catch` misses values that parse without throwing (`"null"`) and photos that are 404s/PDFs |

### What the data really showed vs the hints
| Guide says | Real data |
|---|---|
| "not all rows have valid JSON" | 211 rows are `""`; every other row is valid JSON |
| "missing, null, and malformed" | 0 `NULL` today — handled anyway (tested) |
| "images are broken for some properties" | Two causes: `""` **and** valid URLs that lead to a 404 or a PDF |
| "Showing 20 of 487 properties" | "Showing 20 of 55,212 properties" — same format, my real total |

### Extras (not asked for)
- `src/utils/property.js` — safe text for missing price, beds, sqft…
- "No properties found" message for empty results
- Repo restructure so `frontend/` and `backend/` live side by side

### React vs Vite
**I am using React.** Vite is the tool that *runs* the React app (dev server, proxy,
reload on save). Comparison: React is the **recipe**, Vite is the **oven**. Create React
App is an older oven for the same recipe — retired by the React team in 2025.
Evidence: `"react": "^19.2.8"` in `package.json`, `useState`/`useEffect` imported from
`'react'`, components written in `.jsx`.

---

## Part C — Testing tools from the guide (branch `fix/guide-tooling`)

### Why
The guide's tech stack is React · Node.js + Express · MySQL 8 in Docker ·
**Jest + React Testing Library + Supertest**. Everything was in place except the
**testing tools** — all my tests so far were one-off checks (curl, throwaway scripts).
Now they're saved test files that run with one command: `npm test`.

| Tool | What it does | Comparison |
|---|---|---|
| **Jest** | Runs test files and reports ✅/❌ (the "test runner") | The exam hall and the marker |
| **Supertest** | Sends pretend requests to the Express app — like `curl`, but inside a test, no port needed | A mystery shopper checking the kitchen |
| **React Testing Library** | Draws a component on a pretend page and finds things the way a user would (text, "the image", "the alert") | A mystery shopper checking the dining room |

### The steps
| Step | What | Commit |
|---|---|---|
| T1 | Split `backend/server.js` into `app.js` (builds the app) + `server.js` (starts it) | `99300f5` |
| T2 | Install Jest + Supertest in `backend/`, add `"test": "jest"` | `6e8a730` |
| T3 | `backend/__tests__/properties.test.js` — 14 tests | `e69c214` |
| T4 | Set up Jest + React Testing Library in `frontend/` (Babel, jsdom, CSS stand-in) | `fe9809c` |
| T5 | `frontend/src/utils/property.test.js` — 39 tests | `0d8b22d` |
| T6 | `frontend/src/api/client.test.js` — 11 tests | `a8d6275` |
| T7 | `PropertyCard.test.jsx` + `ListingsPage.test.jsx` — 7 tests | `8f68211` |

### T1 — Why split `app.js` and `server.js`?
`server.js` did two jobs: **build** the app and **start** it on port 5000. Supertest needs
the app *without* starting a server (or it would fight the running backend for port 5000).
Comparison: separating **building the car** (`app.js`) from **driving it** (`server.js`).

```js
// backend/server.js — starts the API
const app = require('./app');

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
```
`app.js` = the old `server.js` minus `app.listen`, ending with `module.exports = app;`.
Test: same answers from every endpoint; `require('./app')` opens **0** ports.
`npm run dev` didn't change.

Note: git records this as "`server.js` changed + `app.js` new", not a rename — a rename
only happens when the old file disappears, and `server.js` still exists. History stays
on `backend/server.js`.

### T2–T3 — Backend tests (Jest + Supertest)
```bash
cd backend
npm install --save-dev jest supertest   # --save-dev = tools for developing, not for running the app
npm test
```
```js
const request = require('supertest');
const app = require('../app');
const pool = require('../db');

beforeAll(() => jest.spyOn(console, 'log').mockImplementation(() => {})); // mute the request logger
afterAll(async () => {
  console.log.mockRestore();
  await pool.end(); // close MySQL connections, or Jest waits forever
});

test('returns 404 with a helpful message for an unknown ID', async () => {
  const res = await request(app).get('/api/properties/999999999');
  expect(res.status).toBe(404);
  expect(res.body.error).toMatch(/No property found with listing ID 999999999/);
});
```
| Word | Plain English |
|---|---|
| `describe` / `test` | A group of checks / one check, with a sentence saying what should happen |
| `request(app).get(…)` | Supertest — a pretend request to `app.js` |
| `expect(x).toBe(y)` | `x` must be exactly `y`, or the test fails |
| `test.each([...])` | Run the same test once per value (4 bad IDs, 1 test written) |
| `beforeAll` / `afterAll` | Run once before / after all tests |

**14 tests:** health · full property · 404 unknown · 400 for `abc123`, `-5`, `12.5`, 21 digits ·
open houses array · `[]` · orphan 404 · search filters · `limit=500` → 400 · min > max → 400 · unknown route 404.
**Needs MySQL running** (they use the real database).

**Design choice:** the search test checks **rules** ("every result is in LA, ≥ $300k,
≥ 3 beds"), not a number that can change ("total is 2,468").

Jest looks for tests in `__tests__/` folders or files ending in `.test.js`.

### T4 — Frontend setup (3 problems, 3 fixes)
| Problem | Fix |
|---|---|
| Jest can't read JSX or `import` (Vite translates them, but Jest doesn't use Vite) | **Babel** — `babel.config.cjs` (used only by Jest) |
| Tests run in Node.js — no web page | **jsdom** — a pretend browser page (`testEnvironment: 'jsdom'`) |
| Components import `.css` — Jest only reads JavaScript | `moduleNameMapper`: `.css` → `test/styleMock.js` (an empty stand-in) |

Comparison: Babel is the translator, jsdom is a practice stage, the CSS stand-in is a cardboard prop.

New files: `babel.config.cjs`, `jest.config.js`, `jest.setup.js` (loads `@testing-library/jest-dom`
for checks like `toBeInTheDocument()`), `test/styleMock.js`. `.cjs` = this one file uses the
older `require` style, because the frontend is `"type": "module"`.
Proved Vite ignores the Babel file: after a restart the app was identical (20 cards, 0 console errors).

### T5–T7 — Frontend tests
| File | Tests | What it checks |
|---|---|---|
| `src/utils/property.test.js` | 39 | The Week 5 edge cases — 12 bad `L_Photos` values → `null`, never a crash; price, sqft, beds/baths, address, city/state |
| `src/api/client.test.js` | 11 | URL building; every error message — 400, 404, Express 500, "Cannot reach the **backend**" (502, no JSON), "Cannot reach the **server**" (`fetch` fails) |
| `src/components/PropertyCard.test.jsx` | 4 | All 7 items + first photo; placeholder for `""` (protection A); `onError` swap (protection B); everything missing |
| `src/pages/ListingsPage.test.jsx` | 3 | "Loading…" then count + cards; error alert; "No properties found." |

**Mocks** — stand-ins we control (comparison: a flight simulator — practise engine failure
without a real crash):
```js
global.fetch = jest.fn();                          // pretend fetch
fetch.mockResolvedValue(fakeResponse(502));        // "answer with a 502, no body" = backend down
jest.mock('../api/client');                        // pretend client.js for the page tests
fetchProperties.mockRejectedValue(new Error('…')); // "fail with this message"
```
So "backend down" is tested **without stopping anything**.

**React Testing Library words:**
| Code | Plain English |
|---|---|
| `render(<PropertyCard … />)` | Draw the component on the pretend page |
| `screen.getByText('…')` | Find by text — fails if it's not there |
| `getByRole('img', { name: '…' })` | Find by what it is + its label (the way screen readers see the page) |
| `queryBy…` | Like `getBy…` but returns `null` — to check something is **not** there |
| `await findBy…` | **Wait** for something to appear (the cards after the pretend fetch answers) |
| `fireEvent.error(img)` | Pretend the photo failed to load → triggers `onError` |

### Proof the tests catch bugs
A test that can never fail is useless. Each time, I broke the code in a **throwaway copy**
(the real files unchanged) and ran the tests:

| Broke | Test that caught it |
|---|---|
| `limit` allowed up to 1000 | `rejects limit=500 with 400` — expected 400, received 200 |
| Removed `Array.isArray` from `getFirstPhoto` | `returns null for JSON text, not an array` — received `"j"` |
| Removed `body === null &&` from the backend-down check | `keeps a real Express 500 message` — got "Cannot reach the backend" instead |
| Removed `onError` from `PropertyCard` | `swaps to the placeholder when the photo fails to load` |

**Surprise:** I predicted removing `Array.isArray` would fail 3 tests — only 1 did. `"null"`
was still caught by `try/catch` (`null[0]` throws), and `"{}"` by the "is it text?" check.
But `"just text"` → `"just text"[0]` = **`"j"`** — a card would try to load a photo from `j`.
Lesson: run the test, don't trust the prediction.

### Results
| | Tests | Command |
|---|---|---|
| Backend | **14** ✅ | `cd backend && npm test` (MySQL must be running) |
| Frontend | **57** ✅ | `cd frontend && npm test` |
| **Total** | **71** ✅ | |

Every Week 5 acceptance criterion now has an automatic test, except **port 3000** and the
**hover effect** — those need a real browser and mouse (checked by hand in Step 8).

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
| App on port 5173 instead of 3000 after `git pull` | Switching to the old `main` (no frontend yet) briefly removed `vite.config.js`; Vite restarted without it | Restart the dev server after `git checkout`/`git pull` if the app acts strangely |
| `console.error` boxes at the top of the backend test output | dotenv 18 prints "injected env … from .env" when it loads; Jest shows it as a warning | Harmless. Optional fix: `require('dotenv').config({ quiet: true })` |
| `npm audit` warnings | Mostly the old **nodemon 1.14.10** (2018); a few from the new test packages (dev-only) | Not fixed yet — upgrade nodemon in a separate step |
| A check said "photos: 0" while 19 photos were on the page | My search expected `src` right after `class`, but the browser writes `src` last | Counted `<img` tags instead: 19. Check the test before trusting a ❌ |

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
- **Why put the helpers in a separate file instead of inside the card?** They're plain
  functions with no React, so I can test them on all 55,212 rows without a browser,
  and the card stays focused on layout.
- **How do you know `LM_Int2_3` is square feet?** Its average grows with bedrooms
  (1 bed → 768, 6 beds → 5,008).
- **Why `useState` for `photoFailed` instead of a normal variable?** Changing a normal
  variable doesn't make React redraw; changing state does, so the placeholder appears
  as soon as the image fails.
- **How does the hover effect work?** CSS `:hover` lifts the card (`translateY(-4px)`)
  and adds a shadow; `transition` animates it over 0.2 s.
- **Why `useEffect` instead of fetching directly in the component?** The component
  function runs on every redraw; fetching there would loop forever. `useEffect` with
  `[]` fetches once, after the page appears.
- **Why does each card need a `key`, and why `id` and not `L_ListingID`?** React uses
  keys to track list items between redraws; they must be unique, and 3 listing IDs
  appear twice in the data.
- **Why does the backend log show two requests per page load?** React StrictMode runs
  effects twice in development to help find bugs; production fetches once.
- **Why did you replace `index.css`?** It was Vite's template: it centred all text and
  made the title unreadable in dark mode.
- **How did you test the hover effect and the error message?** Controlled headless
  Chrome remotely: moved a virtual mouse (card moved up 4 px), and stopped the backend
  (red error message, no crash).
- **The guide says Create React App — are you using React?** Yes. Vite only runs the
  React app; it's the modern replacement for Create React App, which is retired.
- **Why is the proxy not in `package.json` like the hint says?** That line only works
  in Create React App; Vite reads the proxy from `vite.config.js`.
- **Why split `app.js` and `server.js`?** So tests can import the Express app and send it
  requests with Supertest without starting a real server on a port.
- **What's the difference between these tests and the curl checks before?** Same checks,
  but saved in files and run automatically with `npm test` — anyone can rerun them in seconds.
- **Why does the frontend need Babel for Jest?** Vite translates JSX for the browser, but
  Jest doesn't use Vite; Babel does the same translation for Jest only.
- **What is a mock?** A stand-in you control — e.g. a pretend `fetch` that answers 502, so
  "backend down" can be tested without stopping the backend.
- **How do you know your tests actually work?** I broke the code on purpose in a copy
  (4 times) and the right test failed each time.
- **Why `findBy` in `ListingsPage` but `getBy` in `PropertyCard`?** The page loads data
  after it appears (`useEffect` + fetch), so the test must wait; the card shows its text immediately.
- **Why do the backend tests need MySQL running?** They call the real database. A separate
  test database would be a later improvement.

---

## Still to do / ask
- Upgrade nodemon (old 1.14.10 causes `npm audit` warnings).
- Optional: quiet dotenv's start-up message in tests (`config({ quiet: true })`).
- Later: a separate test database so backend tests don't depend on the real data.
- Optional: "1 baths" → "1 bath", "1 beds" → "1 bed".
- Optional clean-up: unused `lucide-react` package and template images (`hero.png`, logo `.svg`s).
- 7 listings store living area in square meters (`LivingAreaUnits`) — shown as sqft for now.
- Data issue to report: ~4–6% of tested photo URLs are 404s or PDFs (from the MLS feed).
