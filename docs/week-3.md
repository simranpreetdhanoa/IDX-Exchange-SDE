# Week 3 — Property Search & Performance

## Goal
Let users search properties with filters, page through results, reject bad
input, and make the searches fast with database indexes.

---

## What I built

### 1. `GET /api/properties` — `backend/routes/properties.js`
Mounted in `server.js` with `app.use('/api/properties', propertiesRouter)`.
**What is a router?** A mini-app that groups related routes in their own file —
like a separate section of the menu.

**Filters (query parameters)** — the bits after `?` in the URL:

| Parameter | Column | Rule |
|---|---|---|
| `city` | `L_City` | Exact match, ignoring upper/lowercase and extra spaces |
| `zipcode` | `L_Zip` | Exact match |
| `minPrice` / `maxPrice` | `L_SystemPrice` | Price range |
| `beds` | `L_Keyword2` | At least this many |
| `baths` | `LM_Dec_3` | At least this many |
| `limit` | — | How many results per page (1–100, default 20) |
| `offset` | — | How many results to skip (default 0) |

Example: `/api/properties?city=Mountain House&beds=4&limit=10&offset=20`

### 2. Input validation (lines 12-54) → 400 Bad Request
Before touching the database, every filter is checked. Bad input gets a **400**
with a helpful message, e.g. `limit must be an integer between 1 and 100`.
**Comparison:** A bouncer checking IDs at the door — no point letting someone in
just to throw them out later.

### 3. Pagination (`limit` + `offset`)
**Comparison:** Reading a book page by page instead of all 55,000 lines at once.
`limit=10&offset=20` means "skip the first 20, give me the next 10" → page 3.

The response tells the frontend how many matches exist in total:
```json
{ "total": 1234, "limit": 10, "offset": 20, "results": [ ... ] }
```
That's why there are **two queries**: `COUNT(*)` for the total, then
`SELECT ... LIMIT ? OFFSET ?` for the current page.

### 4. Safe query building (lines 59-110)
- Each filter adds a piece to `whereClauses` and a value to `filterParams`.
- The `?` placeholders are filled in by MySQL itself — this prevents **SQL
  injection** (a hacker sneaking their own SQL commands into a search box).
  **Comparison:** Filling in a form's blank boxes instead of letting a stranger
  rewrite the whole form.
- `const queryParams = [...filterParams, parsedLimit, parsedOffset];` makes a
  **new array** (a copy) of the filter values plus limit/offset, so the original
  `filterParams` list is never changed. The code comments link this to the
  Week 3 debug challenge — TODO: write down what the bug was in your own words.

### 5. Database indexes — `backend/sql/indexes.sql`
**What is an index?** A sorted lookup list MySQL keeps for a column.
**Comparison:** The index at the back of a textbook — instead of reading every
page to find "Docker", you jump straight to page 42.

| Index | Column(s) | Helps with |
|---|---|---|
| `idx_city` | `L_City` | city filter |
| `idx_city_lower` | `LOWER(TRIM(L_City))` | our case-insensitive city filter — wrapping a column in a function stops a normal index from being used, so this *functional index* stores the already-lowercased value |
| `idx_zip` | `L_Zip` | zipcode filter |
| `idx_price` | `L_SystemPrice` | price range |
| `idx_beds` | `L_Keyword2` | beds |
| `idx_baths` | `LM_Dec_3` | baths |
| `idx_city_price` | `L_City, L_SystemPrice` | city + price together; city first because it's an exact match, price second because it's a range |

**`EXPLAIN`** — put it in front of a query and MySQL shows its plan: whether it
uses an index (`type: ref`/`range`) or reads the whole table (`type: ALL`).

---

## How to test
```bash
curl "http://localhost:5000/api/properties?limit=2"           # 200
curl "http://localhost:5000/api/properties?limit=500"         # 400 — limit too big
curl "http://localhost:5000/api/properties?minPrice=abc"      # 400 — not a number
```

## Known issues to tidy up
1. **`indexes.sql` won't run on our MySQL.** It uses `CREATE INDEX IF NOT EXISTS`,
   which works in MariaDB but **not in MySQL 8.4** (tested: `ER_PARSE_ERROR`).
   The indexes exist in the database now, but a fresh setup would fail.
2. **Duplicate indexes:** the database also has `idx_L_City` (same as `idx_city`)
   and `idx_L_Zip` (same as `idx_zip`). Duplicates slow down writes and waste space.
3. A comment in `routes/properties.js:3` says the pool was created in Week 2;
   the README says Week 1.

## Questions my supervisor may ask
- **Why validate before querying?** Faster (no database trip), safer, and the
  user gets a clear message instead of a 500.
- **Why `?` placeholders?** Prevents SQL injection.
- **Why return `total`?** So the frontend can show "Page 3 of 124".
- **How do you know an index is used?** Run `EXPLAIN` on the query.
- **Why is column order in `idx_city_price` important?** An index is sorted by its
  first column first — like a phone book sorted by last name, then first name.

## TODO: add your own notes
- Your `EXPLAIN` results before and after adding indexes (and query times).
- What the Week 3 debug challenge was and how you found the bug.
