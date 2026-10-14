# Week 4 — Property Detail & Open House Endpoints

> ✅ All steps done — see the checkpoint at the bottom.

## Goal
Add two new endpoints and request logging:
- `GET /api/properties/:id` — one property, or 404
- `GET /api/properties/:id/openhouses` — that property's open houses (sorted)
- Validate the ID on both (bad or too long → 400)
- Log every request: method, URL, status code, time taken

## The plan

| Step | What | Where | Status |
|---|---|---|---|
| 1 | Request logging middleware | `server.js` | ✅ Done |
| 2 | ID validation helper | `routes/properties.js` | ✅ Done (tested in step 3) |
| 3 | `GET /:id/openhouses` | `routes/properties.js` | ✅ Done |
| 4 | `GET /:id` | `routes/properties.js` | ✅ Done |
| 5 | Route order experiment | — | ✅ Done |
| 6 | Debug challenge (error handling + the "special" listing ID) | `server.js` | ✅ Done |

### Decision: which ID?
Each property has two IDs: `id` (the database's internal row number) and
`L_ListingID` (the real listing number, e.g. `1118381441`). We use
**`L_ListingID`** because the assignment says "listing ID" and it's the column
that links to `rets_openhouse`.

I checked the data: every listing ID is **digits only** and **9–10 characters**
long. Validation rule: **digits only, max 20 characters** — anything else → 400.

### Why 404 vs. empty array?
- Property doesn't exist → **404** (the thing you asked for isn't there).
- Property exists but has no open houses → **200 with `[]`** (it exists, there's
  just nothing scheduled — like a blank events calendar).

---

## Step 1 — Request logger (`server.js:9-19`)

```js
// Request logger (Week 4): prints method, URL, status code and duration for every request
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date(start).toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });

  next();
});
```

**What is middleware?** Code that runs on *every* request before it reaches its
route.
**Comparison:** A security guard at the front door. Every visitor passes them
first. Our guard starts a stopwatch, lets the visitor in, and writes in the
sign-in book when they leave.

| Line | Plain English |
|---|---|
| `app.use(...)` | Run this for every request. |
| `const start = Date.now()` | Click the stopwatch on (time in milliseconds). |
| `res.on('finish', ...)` | When the response has been sent, do this. We only know the status code and total time at the *end*. A **callback** is a function you hand over now that runs later. |
| `Date.now() - start` | Stop the stopwatch → time taken in ms. |
| `console.log(...)` | Print timestamp, method (GET, POST…), URL, status code, duration. |
| `next()` | "I'm done, pass the request on." **Without it, every request hangs forever.** |

**Why is it placed first** (before `cors()` and the routes)? So it sees every
request — even ones that end in 404 or 400.

### Test
```bash
curl http://localhost:5000/api/health
curl "http://localhost:5000/api/properties?limit=2"
curl "http://localhost:5000/api/properties?limit=500"
curl http://localhost:5000/api/nope
```
Terminal output:
```
[2026-10-14T09:16:45.276Z] GET /api/health 200 - 47ms
[2026-10-14T09:16:45.341Z] GET /api/properties?limit=2 200 - 18ms
[2026-10-14T09:16:45.374Z] GET /api/properties?limit=500 400 - 0ms
[2026-10-14T09:16:45.389Z] GET /api/nope 404 - 1ms
```
- Health took **47 ms** because it was the first request: the pool had to open
  its first connection to MySQL. The next request took only **18 ms**.
- The **400** took **0 ms** — validation rejected it before the database.
- The **404** is logged too, because the logger is the first thing every request hits.
- The `Z` at the end means **UTC** (world standard time). 09:16 UTC = 2:16 am in
  California. Servers often log in UTC so logs from different places line up.

### Problem we hit: two servers fighting over port 5000
After saving `server.js`, requests worked but **no log lines appeared**.

**Cause:** two copies of the backend were running (an old leftover one from a
previous session, plus the one started this session). When the file changed,
both restarted; the old one grabbed port 5000 first, the new one gave up
(`[nodemon] clean exit`). The old copy answered the requests, but its logs went
nowhere visible.
**Comparison:** two shops trying to open at the same address — only one gets the door.

**How we found it:**
```bash
lsof -nP -i :5000 -sTCP:LISTEN     # which program owns port 5000?
pgrep -fl nodemon                  # how many nodemon copies are running?
```
**Fix:** stopped the old copy, restarted the new one → logs appeared.

**Lesson:** if your server "works" but behaves strangely or ignores your changes,
check whether an old copy is still running.

### Check question
**Q:** What happens to every request if we forget `next();` in the logger?
**A:** The request never reaches its route, so it hangs — `curl` or the browser
keeps waiting until it times out. Bonus: no log line is printed either, because
`finish` only fires once a response is sent, and none ever is.

---

## Understanding middleware

**Middleware = a step a request passes through on its way to the answer.**
Each middleware can either:
1. **pass it on** to the next step → calls `next()`, or
2. **stop it and answer right away** → calls `res.status(...).json(...)`.

**Comparison — an airport:** to reach your plane you pass check-in → security →
the gate. Each checkpoint either lets you through (`next()`) or stops you
("sorry, you can't fly" → a `400`). The plane is the actual route that gives
the answer.

### The steps in my server, in order
```
Request: GET /api/properties/1118381441
   │
   ▼
① logger         server.js:10   starts the stopwatch → next()
   │
   ▼
② cors()         server.js:21   allows the frontend to call us → next()
   │
   ▼
③ express.json() server.js:22   reads any JSON the request sent → next()
   │
   ▼
④ validateListingId (new)       is the ID only digits?
   │      ├── no  → STOP, answer 400 ✋
   │      └── yes → next()
   ▼
⑤ the route itself              asks MySQL, answers 200 or 404 ✅
```

### Two kinds of middleware
| | Logger | `validateListingId` |
|---|---|---|
| Added with | `app.use(...)` | inside a route: `router.get('/:id', validateListingId, ...)` |
| Runs for | **every** request (the airport entrance) | only routes we attach it to (security for one gate) |
| Can stop the request? | No — always calls `next()` | Yes — answers 400 if the ID is bad |

**Why this is good design:** each middleware does **one small job**. The route can
trust the ID is already valid and focus only on the database — shorter, easier
to read code.

### 400 vs 404 — two different checks at two different steps
The ID check **never looks in the database** — it only checks the **format**.
Whether the property exists is checked later, by the route.

| URL | Stops at | Status | Why |
|---|---|---|---|
| `/api/properties/abc123` | ④ ID check | **400** | Wrong **format** — never asks MySQL |
| `/api/properties/999999999` | ⑤ the route | **404** | Format OK, but **no such property** |
| `/api/properties/1118381441` | ⑤ the route | **200** | Format OK and it exists |

**Comparison:** airport security checks your passport *looks real* (right shape,
not torn). Whether you *have a ticket* for this flight is checked at the gate.
400 = "your passport is the wrong shape"; 404 = "no booking under that name".

### Check question
**Q:** What happens with `/api/properties/abc123`?
**A:** It stops at step ④ (the ID check) and returns **400**, because `abc123`
has letters. It never reaches the database, so we don't yet know if it exists —
that's the job of step ⑤.

---

## Step 2 — ID validation helper (`routes/properties.js:5-17`) — ✅ added

**What & why:** one small checking function that rejects bad listing IDs with a
400. Both new endpoints need the same check, so we write it once and reuse it —
if the rule changes, we fix it in one place.

```js
// Listing IDs are digits only (9–10 in our data); allow up to 20 so longer future IDs still work
function validateListingId(req, res, next) {
  const { id } = req.params;

  if (!/^\d{1,20}$/.test(id)) {
    return res.status(400).json({
      error: 'Invalid listing ID. It must contain only digits (max 20 characters).'
    });
  }

  next();
}
```

| Code | Plain English |
|---|---|
| `const { id } = req.params` | Read the ID from the URL. **`req.params`** = the changing parts of the URL; in `/api/properties/1118381441`, `id` is `"1118381441"`. |
| `/^\d{1,20}$/` | A **regular expression** (regex) — a pattern for checking text, like a stencil the ID must fit exactly. `^` = from the start, `\d` = a digit 0–9, `{1,20}` = 1 to 20 of them, `$` = to the end, nothing extra. |
| `.test(id)` | True if the ID fits. `!` flips it, so the `if` runs when it does **not** fit. |
| `return res.status(400).json(...)` | Send a 400 with a helpful message. `return` stops here — `next()` never runs, the database is never touched. |
| `next()` | ID is fine → go on to the real route. |

| ID in URL | Result |
|---|---|
| `1118381441` | ✅ passes |
| `abc123` | ❌ 400 — letters |
| `123456789012345678901` (21 digits) | ❌ 400 — too long ("oversized") |
| `-5` or `12.5` | ❌ 400 — not just digits |

**After adding it:** the server restarted fine and `GET /api/properties?limit=2`
still returns 200. The editor warns *"'validateListingId' is declared but never
read"* — expected, because no route uses it yet. It can't be tested with `curl`
until step 3 attaches it to a route.

### Check question
**Q:** Why do we need `return` in front of `res.status(400)...`?
**A:** Without `return`, the function keeps going after sending the 400 and calls
`next()`. The bad ID reaches the route, which asks MySQL anyway and then tries to
send a **second** answer. Express refuses and logs
`Error: Cannot set headers after they are sent to the client`.

| Mistake | What happens | Comparison |
|---|---|---|
| Forget `next()` | **No** answer → hangs until timeout | Guard never opens the door |
| Forget `return` before `res...` | **Two** answers → error | Guard says "no" but lets you through anyway |

**Rule of thumb:** once you've sent a response, `return` so nothing else runs.

## Step 3 — `GET /api/properties/:id/openhouses` — ✅ added

**What & why:** returns one property's open houses. First checks the property
exists (404 if not), then fetches its open houses sorted by date and start time.
No open houses → `[]` with 200 (normal, not an error).

```js
router.get('/:id/openhouses', validateListingId, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Make sure the property exists
    const [properties] = await pool.query(
      'SELECT L_ListingID FROM rets_property WHERE L_ListingID = ? LIMIT 1',
      [id]
    );

    if (properties.length === 0) {
      return res.status(404).json({ error: `No property found with listing ID ${id}` });
    }

    // 2. Get its open houses, earliest first
    const [openHouses] = await pool.query(
      'SELECT * FROM rets_openhouse WHERE L_ListingID = ? ORDER BY OH_StartDate, OH_StartTime',
      [id]
    );

    return res.status(200).json(openHouses);

  } catch (error) {
    console.error('Open houses endpoint error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
```

| Code | Plain English |
|---|---|
| `'/:id/openhouses'` | `:id` is a **placeholder** — whatever is typed there lands in `req.params.id`. |
| `validateListingId,` | Our guard from step 2, posted at this gate → bad IDs get 400 here. |
| `async` / `await` | Wait for MySQL's answers before moving on. |
| `try { } catch` | Safety net: anything breaks → 500 instead of a crash. |
| Query 1 `SELECT L_ListingID ... LIMIT 1` | "Does this house exist?" Only one column (we just need yes/no). `LIMIT 1` stops at the first match — useful since 3 IDs appear twice in `rets_property`. |
| `properties.length === 0` | No rows → no such house → 404 with a helpful message. |
| Query 2 `... WHERE L_ListingID = ?` | All open houses for that listing. `?` placeholder prevents SQL injection. |
| `ORDER BY OH_StartDate, OH_StartTime` | Date first; same day → earlier start time first. Like a calendar. |
| `res.status(200).json(openHouses)` | Send the list — `[]` if empty, still 200. |

### Test results
| Request | Result | Why |
|---|---|---|
| `/1118381441/openhouses` (349 E Gobind Blvd) | **200**, 1 open house (Sept 20, 13:00–16:00) | Exists, has an open house |
| `/1178585070/openhouses` | **200**, 1 open house | This ID is one of the 3 **duplicates** in `rets_property` — still 1 result, because we query `rets_openhouse` directly instead of JOINing (a JOIN would have shown it twice) |
| `/1118422731/openhouses` (1461 Laurel Way) | **200**, `[]` | Exists, no open houses → empty list, not an error |
| `/999999999/openhouses` | **404** `No property found with listing ID 999999999` | Format OK, house doesn't exist |
| `/abc123/openhouses` | **400** `Invalid listing ID...` | Guard stopped it — letters |
| `/123456789012345678901/openhouses` (21 digits) | **400** | Guard stopped it — oversized |

Log lines:
```
GET /api/properties/1118381441/openhouses 200 - 39ms
GET /api/properties/1178585070/openhouses 200 - 4ms
GET /api/properties/1118422731/openhouses 200 - 3ms
GET /api/properties/999999999/openhouses 404 - 3ms
GET /api/properties/abc123/openhouses 400 - 0ms
GET /api/properties/123456789012345678901/openhouses 400 - 0ms
```
- The two **400s took 0 ms** — the guard answered without touching the database.
- The 404 took 3 ms — it had to ask MySQL (query 1) before knowing.

### Things noticed
- **Sorting couldn't be shown with real data:** in our database every listing has
  **at most 1** open house. *(Later proved with test rows — see "Final check" → sorting test.)*
- **Dates look odd:** `OH_StartDate` comes back as `2026-09-20T07:00:00.000Z`
  instead of `2026-09-20`. MySQL stores just a date; Node turns it into a full
  date-and-time at midnight California time, then shows it in UTC (= 07:00).
  The day is still right, but a frontend could show the wrong day in another
  timezone. Possible fix: the `dateStrings` option in `db.js`. *(Not changed yet.)*

### Problem we hit: editor showed an old copy and overwrote the new code
My editor tab still showed `routes/properties.js` without step 3 (it ended at
line 141 with `module.exports`). The tab had **unsaved typing** in it (comments
I'd added), so VS Code didn't load the newer version from disk. When the tab
was saved, the old copy replaced the file and **step 3 disappeared**.

**Fix:** re-added step 3 (my comments were kept), re-tested: 200 / 200 / 404 / 400 ✅

**Lesson:** a white dot ● on a tab = unsaved changes. If someone else (or a tool)
changes the file while the tab is "dirty", VS Code keeps showing your copy, and
saving it overwrites theirs. Save or revert (`Cmd+Shift+P` → *Revert File*)
before letting another tool edit the same file.

---

## Step 4 — `GET /api/properties/:id` — ✅ added (`routes/properties.js:172-195`)

**What & why:** returns **one full property** (all 126 columns), or 404 with a
helpful message. Placed **after** the `/openhouses` route, as the assignment requires.

```js
// GET /api/properties/:id — one full property (Week 4)
router.get('/:id', validateListingId, async (req, res) => {
  try {
    const { id } = req.params;

    // LIMIT 1: three listing IDs appear twice in rets_property (identical copies)
    const [rows] = await pool.query(
      'SELECT * FROM rets_property WHERE L_ListingID = ? LIMIT 1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: `No property found with listing ID ${id}. Check the ID and try again.`
      });
    }

    return res.status(200).json(rows[0]);

  } catch (error) {
    console.error('Property detail endpoint error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
```

| Code | Plain English |
|---|---|
| `router.get('/:id', validateListingId, ...)` | Answers `GET /api/properties/<id>`, same guard from step 2. |
| `SELECT * ... LIMIT 1` | **All** columns of that house. `LIMIT 1` because of the duplicates. |
| `rows.length === 0` | Nothing found → 404 that says what went wrong and what to do. |
| `rows[0]` | `rows` is always a **list**; `rows[0]` takes the first item so the user gets **one object** `{…}`, not a list `[{…}]`. |

### Decision: duplicate listing IDs
The 3 duplicated listing IDs are **exact copies** (same address, price, status
and update time, neighbouring row numbers) — probably imported twice. So picking
either copy gives the same answer, and `LIMIT 1` is enough.

| Listing ID | Address |
|---|---|
| 1178234327 | 2516 E Quincy |
| 1178585070 | 919 W 14th st |
| 1178691980 | 1745 E Norberry Street |

### Test results
| Request | Result |
|---|---|
| `/1118381441` | **200** — one object, 126 columns, 349 E Gobind Blvd, Mountain House, $1,122,426, 5 beds |
| `/1178585070` (a duplicate) | **200** — still one object (919 W 14th st, Upland) |
| `/999999999` | **404** `No property found with listing ID 999999999. Check the ID and try again.` |
| `/abc123` | **400** `Invalid listing ID...` |
| 21-digit ID | **400** |
| `/1118381441/openhouses` and `/?limit=2` | still **200** — nothing else broke |

### Object vs array
- `/:id` returns an **object** — one ID points to exactly one thing.
- `/:id/openhouses` returns an **array** — a collection that can have 0, 1 or many.
- Comparison: "show me *this book*" vs "show me *this book's reviews*".

---

## Step 5 — Route order experiment — ✅ done

**What & why:** the assignment says `/openhouses` must be registered before
`/:id`. Instead of just trusting the hint, we tested it with a tiny **separate**
test server (not part of the project), so the real code wasn't touched.

### Experiment 1 — `/:id` first, then `/:id/openhouses`
My prediction: (c) a 404. Actual result:
```
GET /properties/123            → answered by /:id              id = "123"
GET /properties/123/openhouses → answered by /:id/openhouses   id = "123"
```
**Surprise:** the order of *these two* routes doesn't matter. The assignment hint
("`/:id` will match with id = `123/openhouses`") is not right for Express.

**Why — a route is a fill-in-the-blank pattern.** `:id` is a blank that holds
**one word**; a word ends where a `/` begins.

| URL | `/properties/ _____` | `/properties/ _____ /openhouses` |
|---|---|---|
| `/properties/123` | ✅ blank = `123` | ❌ `/openhouses` missing |
| `/properties/123/openhouses` | ❌ `/openhouses` left over | ✅ blank = `123` |

Comparison: `:id` is a parking space for one car — it fits `123`, but not a car
towing a trailer (`123/openhouses`).

### Experiment 2 — `/:id` vs a fixed word like `/featured`
My prediction: `/featured` would answer. Actual result:
```
WRONG order (1. /:id   2. /featured)
  GET /properties/featured → answered by /:id, id = "featured"   ❌
  GET /properties/123      → answered by /:id, id = "123"        ✅

RIGHT order (1. /featured   2. /:id)
  GET /properties/featured → answered by /featured               ✅
  GET /properties/123      → answered by /:id, id = "123"        ✅
```
In the wrong order, `featured` is "one word", so `/:id` grabs it. In my real code
the ID guard would then answer **400 Invalid listing ID**, and the featured route
would never run.

**Why — Express takes the FIRST match, not the best match.** It reads routes top
to bottom and stops at the first one that fits.

Comparison — a queue of shop staff:
1. **Sam:** "I'll take *anyone*." (`/:id`)
2. **Priya:** "I only take people asking for *featured*." (`/featured`)

If Sam is first, he serves everyone and Priya never gets a customer. Put the
picky one first and everyone is served correctly.

### Check questions
- **Q:** `/:id` first, `/featured` second — what does `/properties/featured` give?
  **A:** The `/:id` route answers with `id = "featured"` (→ 400 in my code). The
  featured route is never reached.
- **Q:** Where should a new `/properties/count` route go?
  **A:** **Before** `/:id`, otherwise `/:id` grabs `count` as an ID.

### In my code
`routes/properties.js` registers `/` → `/:id/openhouses` → `/:id`. That meets
the assignment's rule, and any future fixed-word route (`/featured`, `/count`,
`/search`…) must also go **above** `/:id`.

### One sentence for my supervisor
> "Express checks routes top to bottom and uses the first one that fits. A `:id`
> placeholder fits any single word, so fixed routes like `/featured` must come
> before `/:id`, or `/:id` will grab them. `/:id/openhouses` is safe either way
> because `:id` never matches across a `/` — we tested it."

---

## Step 6 — Debug challenge 🐛

> *The open houses endpoint works for most properties but crashes with an
> unhandled promise rejection for one specific listing ID. Add proper error
> handling, then figure out what is special about that listing ID.*

### How I investigated (with hints)
1. **Ruled things out:** a bad-format ID can't cause it (the guard → 400), and a
   missing house can't either (→ 404). So the special ID must be a **real, valid**
   ID, and the problem must come from **what the database sends back**.
2. **First guess: `all_data`** (big JSON blob from an outside feed). Checked: in our
   data it is never empty, never missing and always valid JSON. We also send it
   as-is and never `JSON.parse` it, so it couldn't crash this route anyway.
3. **Tested every listing ID** in `rets_openhouse` (13,433) against the endpoint:

   | Result | Count |
   |---|---|
   | 200 | 12,111 |
   | 404 | 1,322 |
   | 500 / crash | **0** |

   My endpoint never crashes. But **1,322 IDs that have an open house got a 404.**

### What's special about those IDs
They are **orphan open houses**: the open house exists, but the **property it
points to is missing** from `rets_property`. (We first spotted this in Week 1 —
there's no foreign key to stop it.)

### Why a simpler route would crash
Without the "does the property exist?" check, a route that reads the property:
```js
const [properties] = await pool.query('SELECT * FROM rets_property WHERE L_ListingID = ?', [id]);
const address = properties[0].L_Address;   // 💥 for an orphan ID
```
- `properties` is an **empty list** `[]`
- `properties[0]` → **`undefined`** ("nothing here")
- `undefined.L_Address` → **`TypeError: Cannot read properties of undefined (reading 'L_Address')`**
- Inside an `async` route with no `try/catch`, that error becomes a **rejected
  promise** nobody handles → the **"unhandled promise rejection"** from the assignment.

Comparison: a mail carrier told to read the name on the first letter in an
**empty** mailbox.

### Why my code doesn't crash
```js
if (properties.length === 0) {
  return res.status(404).json({ error: `No property found with listing ID ${id}` });
}
```
It checks the mailbox isn't empty **before** reading from it — plus every route
has `try/catch` as a second layer.

### Check questions
- **Q:** Without the existence check, what happens with `properties[0].L_Address`
  for an orphan ID? **A:** It crashes (`TypeError`, reading from `undefined`).
- **Q:** Why does the property table return 0 rows for those IDs?
  **A:** (b) The open house exists, but the property it points to is missing.

### Global error handler — the last safety net (`server.js:49-54`)
Each route's `try/catch` is a **seatbelt**; this is the **airbag** — it catches
any error a route didn't (a forgotten `try/catch`, or an error outside the routes).

```js
// Global error handler (Week 4): last safety net for any error a route didn't catch
app.use((err, req, res, next) => {
  const status = err.status || 500;   // use the error's own status (e.g. 400), otherwise 500
  console.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, err);
  res.status(status).json({ error: status === 500 ? 'Internal Server Error' : 'Bad request' });
});
```

| Code | Plain English |
|---|---|
| `(err, req, res, next)` | **4 inputs** = Express knows it's an **error handler**. Normal requests skip it. |
| `next` | Never used, but **must stay** — with only 3 inputs Express would treat it as normal middleware. (The editor's "never read" warning is safe to ignore.) |
| `err.status \|\| 500` | Use the error's own status if it has one (e.g. 400), otherwise 500. |
| `console.error(...)` | Full details go to **my log** so I can debug. |
| `res.status(status).json(...)` | The user gets a short, safe message — never the inner details. |
| Placement | **Last**, after the 404 handler — errors "fall through" to the end. |

**Test — sent broken JSON** (`express.json()` fails before any route runs):
- First version answered **500** — but the error itself said `statusCode: 400,
  type: 'entity.parse.failed'`. Broken JSON is the **user's** mistake, so 500 ("our
  fault") was misleading.
- **Fixed** with `err.status || 500` → now **400** `{"error":"Bad request"}`, and the
  full `SyntaxError` is printed in the log.
- All other routes re-tested: health 200, search 200, `/:id` 200/404/400,
  `/openhouses` 200, unknown route 404 ✅

> Not tested: a real 500 through this handler — every current route already
> catches its own errors, so triggering one would need a deliberately broken route.

**Also fixed:** the comment above the 404 handler had been changed to mention the
request logger (which is at the top of the file) — changed back to `// Handle 404 Routes`.

---

## Questions my supervisor may ask
- **What happens if you forget `next()`?** The request never reaches the route,
  so the client waits until it times out.
- **Why log the duration?** To spot slow endpoints (e.g. a query missing an index).
- **Why use `res.on('finish')` instead of logging immediately?** The status code
  and duration only exist after the route has sent its response.
- **What is middleware?** A step every request passes through before the route;
  it either passes the request on (`next()`) or answers right away.
- **What's the difference between 400 and 404?** 400 = the request itself is
  broken (bad format); 404 = the request is fine but the thing isn't there.
- **Why validate the ID if the database would just find nothing?** It's faster
  (no database trip), keeps strange input away from SQL, and gives a clear
  "your ID is wrong" message instead of a misleading "not found".
- **Why two queries in the open houses route?** An empty result alone can't tell
  "house doesn't exist" (404) from "house has no open houses" (`[]`).
- **Why not a JOIN?** We only need open house rows; a JOIN would also duplicate
  results for the 3 listing IDs that appear twice in `rets_property`.
- **Why does `/:id` return an object but `/openhouses` an array?** One ID = one
  thing; open houses are a collection (0, 1 or many).
- **What about the duplicate listing IDs?** They're identical copies, so `LIMIT 1`
  returns the same data either way. A clean-up of the data would be better long-term.
- **Why does route order matter in Express?** Express uses the **first** route
  that fits, top to bottom. `:id` fits any single word, so fixed-word routes
  (`/featured`, `/count`) must come before `/:id`. `/:id/openhouses` is safe
  either way because `:id` never matches across a `/` — we tested it.
- **What was special about the crashing listing ID?** It's an orphan: it has an
  open house, but no matching property. Code that reads `rows[0].something`
  without checking for an empty result crashes with a `TypeError`.
- **How did you prove your endpoint is safe?** Called it for all 13,433 listing
  IDs in the open house table: 12,111 × 200, 1,322 × 404, 0 crashes.
- **Why have a global error handler if every route has `try/catch`?** It's the
  airbag behind the seatbelt — it catches anything a route misses and keeps every
  error answer in the same JSON format.
- **Why not show the real error message to the user?** It can reveal private
  details (table names, file paths). Full details → log; short message → user.
- **How does Express know it's an error handler?** It has 4 inputs `(err, req, res, next)`.
- **How did you test the 500 error?** Stopped MySQL: every database route answered a
  neat 500, the server stayed up, and it recovered by itself when MySQL came back.
- **How did you prove sorting when no listing has 2 open houses?** Inserted 3 test rows
  in the wrong order, called the real endpoint, checked the order, deleted them.
- **Why not use a transaction for that test?** `rets_openhouse` is MyISAM, which has no
  transactions — a rollback would do nothing.
- **Was the assignment hint right?** Not for `/:id/openhouses` — we tested it and
  showed why. The rule still matters for fixed-word routes.

---

## Final check against the assignment (2026-10-14)

Every requirement and acceptance criterion was **actually tested** (curl, logs,
bad IDs, MySQL stopped and restarted). No project files were changed during the check.

### Requirements
| # | Requirement | Result | Evidence |
|---|---|---|---|
| 17 | `GET /api/properties/:id` → one property or 404 | ✅ PASS | 200 for `1118381441`; 404 for 4 unknown IDs |
| 18 | `GET /api/properties/:id/openhouses` | ✅ PASS | 200 + list for `1118381441`; 200 `[]` for `1118422731` |
| 19 | ID validated on both endpoints | ✅ PASS | 13 bad IDs × 2 endpoints → all 400 |
| 20 | Request logging (method, URL, timestamp, time) | ✅ PASS | `[2026-10-14T10:16:45.047Z] GET /api/health 200 - 55ms` |

### Acceptance criteria
| Criterion | Result | Evidence |
|---|---|---|
| `/:id` returns the **full** property object | ✅ PASS | An object (not array); **126 of 126** columns; **0 values differ** from the database row. A duplicated ID still returns one object. |
| `/:id` → 404 with a helpful message | ✅ PASS | `No property found with listing ID 999999999. Check the ID and try again.` |
| `/openhouses` returns an array (empty OK) | ✅ PASS | Array of 1 for `1118381441`; **200 `[]`** for `1118422731` |
| Ordered by date, then start time | ✅ PASS | Sorting test below. Sort columns are real `date`/`time` types, so they sort by actual time. |
| Malformed or oversized IDs → 400 | ✅ PASS | All 400 on both endpoints: `abc123`, `-5`, `12.5`, `1e10`, `+123`, `0x1F`, space inside, leading space, `1' OR '1'='1`, `123%2Fopenhouses`, Arabic digits `١٢٣`, 21 digits, 5,000 digits. The 20-digit maximum passes the check → 404. |
| Every request prints a log line | ✅ PASS | **39 requests → 39 log lines**, correct format, nothing missing, plus all requests while MySQL was down |
| `/openhouses` registered before `/:id` | ✅ PASS | `routes/properties.js:144` before `:173` |
| I can explain why route order matters | ✅ PASS | Step 5 experiments + check questions |

### Checkpoint
| Item | Result | Evidence |
|---|---|---|
| Both endpoints return correct data | ✅ PASS | See above |
| Error cases handled (404, 400, 500) | ✅ PASS | MySQL-down test below |
| Request logs with timing | ✅ PASS | See above |
| Debug challenge | ⚠️ PARTIAL | Error handling ✅; 13,433 IDs → 0 crashes. "Orphan open houses" is a well-supported answer, but we never saw the crash, so we can't confirm it's the ID the assignment means → **ask supervisor**. |

### 500 test: MySQL stopped
Stopped the MySQL container with `docker stop idx-mysql-local`, called every endpoint, then started it again.

| Request (MySQL **down**) | Result |
|---|---|
| `/properties/1118381441` | **500** `{"error":"Internal Server Error"}` |
| `/properties/1118381441/openhouses` | **500** `{"error":"Internal Server Error"}` |
| `/properties?limit=2` | **500** `{"error":"Internal Server Error"}` |
| `/properties/abc123` | **400** — the ID guard doesn't need the database |

- Each route logged its error, e.g. `Property detail endpoint error: Error: connect ECONNREFUSED 127.0.0.1:3306`
- **The server did not crash** — it kept answering.
- **After restarting MySQL:** everything returned 200 again **without restarting the backend** (the connection pool reconnected by itself). Row counts unchanged: 55,212 and 13,433.

### Sorting test: real end-to-end ✅ PASS
**Problem:** no listing in our data has more than 1 open house, so sorting couldn't be seen.
**Solution:** temporarily add 3 open houses **in the wrong order on purpose**, ask the
real endpoint, check the order, then delete exactly those 3 rows (in a `finally`
block — code that always runs at the end, even if a step fails).

| Step | Result |
|---|---|
| 1. Rows before | 13,433 |
| 2. Inserted for 1461 Laurel Way (`1118422731`) | Nov 2 10:00 → Oct 25 14:00 → Oct 25 09:00 |
| 3. The endpoint answered (HTTP 200, 3 items) | **Oct 25 09:00 → Oct 25 14:00 → Nov 2 10:00** ✅ |
| 4. Cleanup | Deleted exactly the 3 test rows (ids 13434–13436) |
| 5. Rows after | 13,433 ✓ — endpoint returns `[]` again |

- **By date:** Oct 25 came before Nov 2, even though Nov 2 was inserted first.
- **Then by start time:** on Oct 25, 09:00 came before 14:00, even though 14:00 was inserted first.
- Only lasting trace: the next new open house gets id 13437 instead of 13434 (harmless).

### Finding: the two tables use different storage engines
A **storage engine** is the part of MySQL that actually stores the data.

| Table | Engine | Transactions? | Foreign keys? |
|---|---|---|---|
| `rets_property` | **InnoDB** (modern, default) | ✅ yes | ✅ yes |
| `rets_openhouse` | **MyISAM** (older) | ❌ no | ❌ no |

- A **transaction** is a "draft mode": make several changes, then either save them all
  (*commit*) or throw them all away (*rollback*). Comparison: an online shopping basket —
  nothing is bought until you click "Pay".
- MyISAM has **no draft mode** — every change is saved immediately ("writing in pen").
  That's why we tested sorting with real insert-then-delete instead of a rollback.
- MyISAM also can't enforce **foreign keys** — likely part of **why 1,322 orphan open
  houses exist**: nothing stops an open house pointing at a property that was deleted.

---

## Week 4 checkpoint
- [x] Both endpoints return correct data (`/:id` → object, `/:id/openhouses` → array)
- [x] Error cases handled: **400** (bad ID, broken JSON), **404** (unknown property / route), **500** (route `try/catch` + global error handler)
- [x] Request logs appear in the terminal with method, URL, status and time in ms
- [x] Route order correct (`/:id/openhouses` before `/:id`) — and I can explain why
- [x] Open houses sorted by date, then start time — proved with an end-to-end test
- [x] Debug challenge: orphan open houses → `rows[0]` is `undefined` → `TypeError`

### Follow-ups for later
**Ask my supervisor**
- Which listing ID the debug challenge meant — does it match the orphan explanation?

**Small improvements (not required by the assignment)**
- The health check reveals internal details when MySQL is down:
  `"message":"connect ECONNREFUSED 127.0.0.1:3306"` (`server.js`, Week 2 code).
- Error answers come in 3 shapes: `{error}` (routes), `{success:false, message}` (404 handler),
  `{status, database, message}` (health).
- The global error handler's **500** path has never been triggered (routes catch their own
  errors first); only its 400 path (broken JSON) is tested.
- Dates come back as `2026-09-20T07:00:00.000Z` — consider `dateStrings` in `db.js`.
- Very long URLs are logged in full (a 5,000-digit test produced a 5,000-character log line).

**Data / database**
- 1,322 orphan open houses and 3 duplicate listings — worth cleaning up.
- `rets_openhouse` is **MyISAM** — consider converting to InnoDB (after cleaning the orphans)
  to get transactions and foreign keys.
- `indexes.sql` uses `CREATE INDEX IF NOT EXISTS`, which MySQL 8.4 rejects (see week-3.md).
- During the 500 test, `docker stop` ended MySQL with exit code 137 (forced stop, not a clean
  shutdown). It recovered normally and no data was lost — worth watching.
