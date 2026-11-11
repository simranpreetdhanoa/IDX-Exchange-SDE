# Week 8 — Property detail page

> 🚧 In progress.

## Goal
A full property detail page with routing, photo gallery, map, and open houses.

| # | Requirement | In plain English |
|---|---|---|
| 37 | React Router: `/` and `/property/:id` | The web address decides which page is shown |
| 38 | Clickable cards | Clicking a card opens that home's detail page |
| 39 | `PropertyDetailPage` | Price, address, beds/baths/sqft/year built, description, details, open houses |
| 40 | `PropertyImageCarousel` (cards) | Several photos per card, prev/next arrows, "X / Y" counter |
| 41 | `PropertyImageGallery` (detail page) | Main photo, thumbnail strip, full-screen lightbox |
| 42 | Parse `L_Photos` | Both photo components read the JSON array safely |
| 43 | `PropertyMap` | Google Maps Embed API in an iframe, no npm package |
| 44 | Map location | Uses `LMD_MP_Latitude` and `LMD_MP_Longitude` |
| 45 | Open houses | Date, start/end time, remarks (inside `all_data`) |

**Debug challenge 1 🐛:** open house remarks never appear. They are inside the `all_data` JSON field. Fix it in the React
component, without changing the backend.

**Debug challenge 2 🐛:** the lightbox doesn't close on Escape. The keydown handler is attached but never fires.

## Plan
| Step | What | Status |
|---|---|---|
| 0 | Finish Week 7 (pull request #9), branch `week-8` | ✅ |
| 1 | React Router; routes `/` and `/property/:id` | ✅ |
| 2 | Cards are clickable and go to the detail page | ✅ |
| 3 | `PropertyDetailPage` + invalid ID error | ✅ 3a price, address, stats, errors · 3b description + details |
| 4 | Shared `L_Photos` parsing helper | ✅ |
| 5 | `PropertyImageCarousel` (`stopPropagation`) | ✅ + 2 bugs fixed (no-photo layout, broken photo links) |
| 6 | `PropertyImageGallery` + lightbox | ✅ 6a main photo, thumbnails, arrows · 6b lightbox |
| 7 | Debug challenge 2: Escape key | ✅ solved with hints |
| 8 | `PropertyMap` + Get Directions | ⏳ |
| 9 | Open houses section | ⏳ |
| 10 | Debug challenge 1: remarks in `all_data` | ⏳ |
| 11 | Check with real data in real Chrome | ⏳ |
| 12 | Notes + README link | ⏳ (updated after each step) |
| 13 | Commit and pull request | ⏳ |

## Key idea (the building comparison)
The app is a **building** with several rooms (pages). **React Router** is the **reception desk**: it reads the web
address and sends you to the right room.
- `/` → the listings room
- `/property/1118422731` → the detail room, for home 1118422731
- anything else → "Page not found."

### Words to know
| Word | Meaning |
|---|---|
| **Routing** | Choosing which page to show from the web address |
| **Route** | One rule: "this address → this page" |
| **Library** | Ready-made code written by someone else that we add to our project |
| **URL parameter** | A placeholder in an address, like `:id` in `/property/:id` |
| **Hook** | A React function whose name starts with `use` (like `useParams`) |
| **Single-page app** | The browser loads the site once; after that, React swaps the page content without reloading |

---

## Before we started (Step 0)
- Week 7's demo guide and README tick were still uncommitted. They went in as pull request #9 on branch
  `docs/week-7-demo`, which I merged.
- Deleted the merged branches `week-7` and `docs/week-7-demo` (git's `-d` refuses to delete unmerged work).
- **Google Maps key:** created in Google Cloud Console, restricted to `http://localhost:3000/*` and the Maps Embed API
  only. It goes in `frontend/.env` as `VITE_GOOGLE_MAPS_API_KEY`. The `.env` file is never committed.
  - The guide says `REACT_APP_GOOGLE_MAPS_API_KEY`, but that's the naming rule of Create React App. Our project uses
    **Vite**, which only passes on settings whose names start with `VITE_`.

## Step 1 — Routing (`frontend/src/main.jsx`, `App.jsx`, `pages/PropertyDetailPage.jsx`)
**Why:** before this, `App.jsx` always showed `<ListingsPage />`, whatever the address. A second page needs its own
address, a working Back button, refresh, and shareable links.

**Installed:** `npm install react-router`. Vite stays: Vite is the tool that runs and builds the project, and React Router
is a library inside the app. (We first got version 8, then switched to **version 7.18.5** in Step 2; see below.)

**The code:**
- `main.jsx`: `<BrowserRouter>` wraps `<App />`. It watches the address bar and the Back/Forward buttons.
- `App.jsx`: `<Routes>` picks the one `<Route>` that matches:
  - `path="/"` → `<ListingsPage />`
  - `path="/property/:id"` → `<PropertyDetailPage />`
  - `path="*"` → "Page not found." (a catch-all, so a wrong address isn't a blank screen)
- `PropertyDetailPage.jsx`: a placeholder for now. `useParams()` reads `{ id }` from the address, and
  `<Link to="/">` goes back without reloading the site.

**Tested:**
- 106 frontend tests still pass; lint is clean.
- `curl`: `/`, `/property/123` and `/nonsense` all return HTTP 200 with the same `index.html` (an empty
  `<div id="root"></div>`). The browser, not the server, decides which page to show.
- In Chrome: `/` shows the listings ✅, `/property/1118422731` shows "Property 1118422731" ✅, and
  "← Back to listings" returns to the listings ✅.

## Step 2 — Clickable cards (`frontend/src/components/PropertyCard.jsx` + `.css`)
**Why:** requirement 38. Clicking a card opens `/property/<its L_ListingID>`.

**The code:**
- `const navigate = useNavigate();` gives us a function that changes the page from code.
- `openDetail()` calls `` navigate(`/property/${property.L_ListingID}`) ``. The backticks make a **template string**: text
  with a value dropped into `${ }`.
- `<article className="property-card" onClick={openDetail}>`: a click anywhere on the card runs `openDetail`.
- CSS: `cursor: pointer` shows a hand, so users know the card can be clicked.

**Why `onClick` + `navigate` instead of wrapping the card in a `<Link>`:** in Step 5 the carousel arrows sit inside the card
and must not open the detail page. `stopPropagation` stops a click reaching the card's `onClick`; it would not stop a `<Link>`.

**Why `L_ListingID` and not `id`:** the backend's detail endpoint looks homes up by `L_ListingID`. `id` is just the row number.

### Problem: the tests couldn't load React Router 8
1. `useNavigate` only works inside a router, so the 22 existing card and listings tests now render inside a
   **`MemoryRouter`** (a pretend router for tests that keeps the address in memory): `render(..., { wrapper: MemoryRouter })`.
2. Then two test files failed with **"Must use import to load ES Module"**. React Router 8 only ships in the modern
   format (**ES modules**, `import`/`export`). Jest, as set up here, runs the older format (**CommonJS**, `require`).
   - Tried letting Babel convert React Router: it uses `import.meta`, which can't be converted.
   - Tried Node's `--experimental-vm-modules`: it broke other tests (`jest is not defined`).
   - **Fix:** switched to **React Router 7.18.5**, which ships both formats. The code didn't change: `BrowserRouter`,
     `Routes`, `Route`, `Link`, `useParams` and `useNavigate` work the same.
3. Then: **"TextEncoder is not defined"**. Jest's pretend browser (jsdom) leaves out `TextEncoder`, which React Router needs.
   **Fix:** `frontend/test/textEncoder.js` borrows Node's version, and `jest.config.js` loads it with `setupFiles`
   (before each test file loads; `setupFilesAfterEnv` would be too late).
4. The running dev server still served version 8 from **Vite's cache** (a saved copy). Restarting with
   `npm run dev -- --force` fixed it.

**Tested:**
- **108 tests pass** (106 old + 2 new: clicking a card shows the detail route, and the address uses the card's
  `L_ListingID`). Lint is clean; `npm run build` works.
- In Chrome: hand cursor ✅, the first card opens `/property/1118422731` ✅, Back returns to listings ✅, the second card
  opens `/property/1118398412` ✅.

**Known limits (for later):**
- The card has `onClick` but can't be reached with the Tab key. We come back to this after debug challenge 2.
- Back always returns to listings **page 1**, because the page number lives only in React's memory.

## Step 3a — Detail page: price, address, stats, errors (`frontend/src/pages/PropertyDetailPage.jsx` + `.css`)
**Why:** requirement 39, and "visiting `/property/invalid-id` shows an error, not a crash".

**Which fields** (found by looking at one real home from the API, which has 126 fields):

| Shown as | Field |
|---|---|
| Price | `L_SystemPrice` |
| Address | `L_Address`, `L_City`, `L_State`, `L_Zip` |
| Beds / baths / living area | `L_Keyword2`, `LM_Dec_3`, `LM_Int2_3` (same as the cards) |
| Year built | `YearBuilt` |

**The code:**
- `useParams()` gives the `id`; `useEffect(..., [id])` calls `fetchPropertyDetail(id)` when the page opens (and again if
  the id changes). The `cancelled` switch from Week 6 ignores a late, old answer.
- Three screens, chosen by `if` statements that `return` early: `if (loading)` → "Loading property…",
  `if (error)` → a red box with the reason, otherwise → the home. The "← Back to listings" link is on all three.
- The stats use a **description list** (`<dl>`, `<dt>` label, `<dd>` value), which screen readers read as label + value pairs.
- New helper `formatYear` in `utils/property.js`: `1973` → "1973"; missing or impossible years (0, 3025, 1973.5) → "—".

**How invalid IDs are handled:** the backend already checks IDs (Week 4). `client.js` turns its error into a message and the
page shows it.

| Address | Backend answer | Page shows |
|---|---|---|
| `/property/1118422731` | 200 + the home | The home |
| `/property/invalid-id` | **400** "Invalid listing ID…" (it has letters) | Red box |
| `/property/999` | **404** "No property found…" (valid format, no such home) | Red box |

**Tested:**
- **123 tests pass** (+6 detail page tests: calls the API with the address id, loading → price/address/stats, fallbacks for
  missing values, 400 error, 404 error, Back link; +9 `formatYear` tests). Lint is clean, no React warnings.
- `curl` through the frontend proxy: 200 / 400 / 404 as in the table above.
- In Chrome: 1461 Laurel Way shows $3,950,000 and Beds 4 · Baths 5 · 3,677 sqft · 1973 ✅, `invalid-id` → red box ✅,
  `999` → red box ✅, Back link ✅.

## Step 3b — Description and property details
**Why:** requirement 39 also asks for the description and property details.

**Choosing the fields:** a script counted how often each field is filled in across all **55,212** homes:

| Field | Filled | Example |
|---|---|---|
| `L_Remarks` (description) | 99% | "Opportunity to reimagine a Classic 70's…" |
| `L_Type_`, `L_Status`, `CountyOrParish`, `L_DisplayId` | 100% | SingleFamilyResidence, Active, Los Angeles |
| `LotSizeAcres` / `LotSizeSquareFeet` | 91% | 0.4261 / 18562.00 |
| `Cooling`, `PoolFeatures`, `DaysOnMarket` | 91–96% | CentralAir, None, 245 |
| `StoriesTotal`, `Heating`, `View`, `InteriorFeatures`, `Appliances` | 71–86% | 2, Central, CityLights,Coastline |
| `Flooring`, `ArchitecturalStyle` | 62%, 39% | Carpet,Tile; MidCenturyModern |
| `GarageSpaces`, `Levels` | — | These columns don't exist |

Many values are **CamelCase** (words joined, each starting with a capital).

**The code:**
- New helpers in `utils/property.js` (each returns `null` when there's nothing to show):
  - `formatFeatureList`: `.split(',')` cuts the list into pieces; a **regular expression** (a search pattern),
    `/([a-z])([A-Z])/g`, puts a space wherever a small letter meets a capital; `.join(', ')` glues the pieces back.
    `CarpetTile,Wood` → "Carpet Tile, Wood". A run of capitals (`HOA`) is left alone.
  - `formatLotSize`: `(0.4261, 18562)` → "0.43 acres (18,562 sqft)"; one value → just that one.
  - `formatDays`: `245` → "245 days", `1` → "1 day".
- `PropertyDetailPage.jsx`: "About this home" shows `L_Remarks` (CSS `white-space: pre-line` keeps the agent's line breaks;
  missing → "No description provided."). "Property details" is a list of 15 label/value pairs; `.filter(...)` **hides rows
  with no value**, so homes with fewer fields don't show empty rows.

**Tested:**
- **149 tests pass** (+23 helper tests, +3 page tests: description and tidied details shown, empty rows hidden, fallback
  for a home with no description). Lint is clean.
- The helpers on the real home 1118422731: Single Family Residence, 0.43 acres (18,562 sqft), Mid Century Modern,
  City Lights, Coastline, Central Air, Walk In Closets, 245 days, 1973.
- In Chrome: description ✅, tidied details ✅, another home shows different details with no empty rows ✅.

## Step 4 — Reading all the photos (`frontend/src/utils/property.js`)
**Why:** requirement 42: both photo components must read `L_Photos` (a JSON array of URLs). Week 5's `getFirstPhoto` only
returned one photo, so we need the whole list, and we want only **one** place in the code that reads `L_Photos`.

**What the real data looks like** (a script over all 55,212 homes):

| Photos per home | Homes |
|---|---|
| none (`""`) | 211 |
| 1 | 1,123 (e.g. 1114880309) |
| 2–5 | 1,298 |
| 6–20 | 8,115 |
| 21–50 | 32,558 |
| 51 or more | 11,907 |

No broken JSON and no bad entries today, but 11,907 homes have 50+ photos, so the gallery's thumbnail strip must scroll.

**The code:**
- `getPhotos(rawPhotos)` returns every usable URL, or `[]`:
  1. Not text, or empty → `[]` straight away. This check runs **before** `JSON.parse`, because `JSON.parse('')` would crash.
  2. `JSON.parse` inside `try/catch`: broken JSON → `[]` instead of a crash.
  3. Not a list → `[]`.
  4. `.filter(...)` keeps only non-blank text; `.map(...)` trims spaces.
- `getFirstPhoto` is now `getPhotos(rawPhotos)[0] ?? null` (`??` = "if the left side is missing, use the right side").

**Tested:**
- **161 tests pass** (+12 `getPhotos` tests: many, one, none, broken JSON, not a list, escaped `\/` slashes like the real
  data, blanks and numbers mixed in). All the old `getFirstPhoto` tests still pass.
- Real homes: 1118422731 → 9 photos (matches its `PhotoCount`), 1114880309 → 1, 1118398412 → 0 (`null` first photo).
- In Chrome: the cards look the same as before ✅.

## Step 5 — Photo carousel on the cards (`frontend/src/components/PropertyImageCarousel.jsx` + `.css`)
**Why:** requirement 40: several photos per card, prev/next arrows, an "X / Y" counter.

**What it does:**
- One photo at a time. **›** / **‹** move forward and back and **wrap around** (after the last photo comes the first).
- The counter shows `position + 1` / number of photos: the computer counts from 0, people from 1.
- One working photo → no arrows and no counter. No photos → "No photo available".
- Only the current photo is downloaded (`loading="lazy"`), because a page of 20 cards can hold 500+ photos.
- `PropertyCard.jsx`'s photo part is now one line: `<PropertyImageCarousel photos={getPhotos(property.L_Photos)} alt=... />`.

**The key idea, `stopPropagation`:** a click **bubbles up** from the arrow to the card (like a shout heard on every floor
above). The card's `onClick` would then open the detail page. `event.stopPropagation()` stops the click at the arrow.
- **Proof:** with `stopPropagation` removed, the test "clicking the arrows does not navigate" **failed**; with it back, it passed.

**Wrap-around with `%` (remainder):** `(position + 1) % count`. With 9 photos, on the last one: `(8 + 1) % 9 = 0` → the first
photo, shown as "1 / 9". Like a clock: after 12 comes 1.

### Bug 1 (found in Chrome): no-photo cards hid their details
- **Cause:** the placeholder had both classes, `carousel` (`height: 200px`) and `carousel-placeholder` (`height: 100%`). The
  later rule won, so it grew to 100% of the **whole card**, and the card's `overflow: hidden` cut off the price and address.
- **Fix:** the placeholder now always sits **inside** the 200px box, so 100% means 100% of 200px.
- **Why the tests missed it:** Jest's pretend browser doesn't calculate layout. A new test checks the structure
  (placeholder inside the box, details on the page); it fails on the old code.

### Bug 2 (found in Chrome): a card with 43 photos showed only 3 real ones
- **Investigation:** checked all 552 photo links on listings page 1 with `curl`:

  | Result | Photos |
  |---|---|
  | Photo loads (206, image/jpeg, from media.crmls.org) | 395 |
  | **404 `"Media record not found!"`** | **157** (28%) |

  All 157 belong to **5 homes** where only photo 1 works (1118353294 1/33, 1118296285 1/75, 1118274241 1/25,
  1117708583 1/23, 1117615767 1/6). 1118353294's photos changed on 11 Sep 2026: the provider deleted the old photos, but our
  database still has the old links.
- **Fix (frontend):** the carousel keeps a `working` list = all photos minus failed ones. A photo that fails to load leaves
  the list, and the next photo takes its place, so broken photos are skipped instead of shown as grey boxes.
- **Limit:** a browser only knows a photo is broken after trying it, so the counter can start at "1 / 33" and shrink.
  Checking every photo up front would mean ~550 downloads per listings page.
- **Changed a Week 5 test:** "swaps to the placeholder when the photo fails" now checks photo 1 fails → photo 2 shows; both
  fail → placeholder. The goal (never show a broken image) is the same.

**Tested:**
- **174 tests pass** (+14 carousel tests: start at 1 / 3, Next and wrap, Previous wrap, one photo, no photos, a failed photo is
  skipped, a broken photo found while clicking, the last one failing wraps, one left → no arrows, all fail → placeholder,
  arrows don't navigate, the photo does navigate, no-photo layout). Lint is clean.
- In Chrome: 1461 Laurel Way: arrows, photo and counter change ✅. 350 S. Fairway Dr: one click on › skips the 32 broken
  photos, and the arrows disappear ✅. 582 Pasture Ave: grey box with the details underneath ✅. Clicking the photo opens
  the detail page ✅.

## Step 6a — Photo gallery on the detail page (`frontend/src/components/PropertyImageGallery.jsx` + `.css`)
**Why:** requirement 41: a main image and a thumbnail strip (the lightbox comes in 6b).

**A shared custom hook, `frontend/src/hooks/usePhotoList.js`:** a **custom hook** is a function starting with `use` that holds
React logic we want to reuse. Both the carousel and the gallery need "which photo is showing" and "skip broken photos", so
that logic moved out of the carousel into `usePhotoList`. It returns `working`, `current`, `position`, `showNext`,
`showPrevious`, `showPhoto(url)` and `markFailed(url)`.
- **The bookmark points at a spot in the ORIGINAL list.** If that photo is broken, the hook looks forward (wrapping around) for
  the next good one. Why not a spot in the working list, like the first carousel version? In the gallery **every thumbnail
  loads**, so a thumbnail can fail while you look at another photo. The working list would get shorter and the bookmark would
  point at a different photo: the main photo would jump. A test checks this can't happen.
- After the move, all the existing carousel tests still passed, which shows the carousel behaves the same.

**The gallery:**
- A big main photo (420px, 260px on phones) with an "X / Y" counter.
- A thumbnail strip: one small button per working photo. Clicking one makes it the main photo; the selected one has a blue
  border and `aria-pressed="true"` (tells screen readers it's the chosen one).
- The strip uses `display: flex` + `overflow-x: auto`, so it **scrolls sideways** (some homes have 75 photos), and
  `flex: 0 0 auto` stops thumbnails from shrinking.
- One photo → no strip and no counter. No photos → "No photos available". Broken thumbnails disappear.
- On the detail page, `key={property.L_ListingID}` gives each home a fresh gallery (starts at photo 1).

**Tested:**
- **184 tests pass** (+8 gallery tests: start state, highlighted thumbnail, click a thumbnail, one photo, no photos, broken main
  photo skipped, a broken thumbnail doesn't move the main photo, all broken → placeholder; +2 detail page tests). Lint is clean.
- In Chrome: 1461 Laurel Way shows the main photo and thumbnails ✅; clicking the 4th thumbnail → main photo changes, blue
  border, "4 / 9" ✅; 1117694056 (67 photos): the strip scrolls sideways ✅.

### Extra (my idea): arrows on the main photo
- **‹ ›** buttons on the big photo use the hook's `showPrevious` / `showNext`, so they wrap around like the carousel.
- **The strip follows the selected thumbnail:** `useRef` gives a handle on the strip element (like a name tag), and
  `useEffect(..., [current])` runs each time the main photo changes and calls `strip.scrollTo(...)` to put the selected
  thumbnail in the middle. It scrolls only the strip, never the page.
- The strip has `position: relative`, because a thumbnail's `offsetLeft` is measured from the nearest *positioned* parent;
  without it the distance would be measured from further out and the strip would scroll too far.
- Jest's pretend browser can't scroll, so the code skips scrolling when `scrollTo` doesn't exist; the test puts in a pretend
  `scrollTo` (`jest.fn()`) and checks it's called.
- **Tested:** 187 tests pass (+3). In Chrome: 1118422731: › three times → 2 / 9, 3 / 9, 4 / 9 and the blue border moves ✅;
  1117694056 (67 photos): › fifteen times → the strip slides along and the selected thumbnail stays visible ✅.

## Step 6b — Lightbox (`frontend/src/components/PhotoLightbox.jsx` + `.css`)
**Why:** requirement 41 and the acceptance criteria: clicking the main image opens a full-screen **lightbox** (a dark
full-screen view of one photo, like dimming the cinema lights); it closes on a click outside or Escape; arrows change photos.

**The code:**
- `PropertyImageGallery.jsx` has `const [lightboxOpen, setLightboxOpen] = useState(false)`. Clicking the main photo (🔍
  `cursor: zoom-in`) sets it to `true`, and the gallery shows `<PhotoLightbox … />`.
- The lightbox gets the **same hook values** as the gallery (`current`, `position`, `showNext`, `showPrevious`,
  `markFailed`), so it opens on the gallery's photo and the gallery is on the last photo you saw when it closes.
- **Click outside closes it:** the dark `<div>` covers the screen (`position: fixed; inset: 0`) and has `onClick={onClose}`.
  The photo and the ‹ › buttons use `stopPropagation`, so their clicks don't reach the dark background.
- `role="dialog"` + `aria-modal="true"` tell screen readers a pop-up window is open.
- `onKeyDown` on the dark `<div>` handles Escape, ← and → (it didn't work at first: see Step 7).

**Tested:**
- **196 tests pass** (+9 lightbox tests: closed at first, opens on the same photo, ‹ › change the photo and don't close it,
  × closes it, outside click closes it, photo click doesn't, the gallery shows the last photo after closing, single photo,
  broken photo skipped). Lint is clean.
- In Chrome on 1118422731: the big photo opens the lightbox with ×, ‹ › and 1 / 9 ✅; › twice → 3 / 9, still open ✅; clicking
  the photo keeps it open ✅; clicking the dark area closes it and the gallery shows 3 / 9 ✅.

## Step 7 — Debug challenge 2 🐛: the lightbox doesn't close on Escape (`frontend/src/components/PhotoLightbox.jsx`)
**The bug:** open the lightbox, press Escape → nothing happens. The `onKeyDown` handler is attached, and the code inside it is
fine, but it **never runs**.

**How I found the cause (hint by hint):**
1. **Which element gets the key press?** In Chrome's Console, `document.activeElement` showed **`<body>`**: the browser's
   **focus** (the one element that receives key presses) was on the whole page, not on the lightbox.
2. A key press starts at the focused element and **bubbles up** to its parents, never down. The lightbox `<div>` is *inside*
   `<body>`, so the Escape press never reached it.
3. **Which elements can take focus?** A Console listener (`focusin`) printed what got focus while pressing Tab: only
   **`A`** (links) and **`BUTTON`**. A plain `<div>` can't take focus.
4. Searched "make a div focusable" → the **`tabindex`** attribute. In React (camelCase): **`tabIndex`**.
5. Value: `0` = focusable and reachable with Tab; **`-1`** = focusable only from code. The dark background doesn't need to be
   a Tab stop, so **`tabIndex={-1}`**.
6. **Tested in Chrome:** Escape straight after opening still did nothing, but after clicking the photo inside the lightbox,
   Escape worked. So the `<div>` was now *allowed* focus, but nothing *gave* it focus when it opened.
7. **Gave it the focus:** the same tools as the thumbnail strip: `useRef` (a handle on the `<div>`) + `useEffect(..., [])`
   (run once, right after the lightbox appears) → `lightboxRef.current.focus()`.

**The fix:**
```jsx
const lightboxRef = useRef(null);
useEffect(() => {
  lightboxRef.current.focus();   // GIVES the div the focus when the lightbox opens
}, []);
...
<div ref={lightboxRef} ... onKeyDown={handleKeyDown} tabIndex={-1}>   // tabIndex ALLOWS the div to have focus
```

**Tested:**
- **+4 keyboard tests:** the lightbox has the focus when it opens; Escape closes it; → / ← change photos and wrap; other keys
  do nothing. The test presses keys on `document.activeElement`, like a real keyboard.
- **Proof:** with the fix removed, **3 of these tests failed**; with it back, all passed.
- In Chrome: Escape straight after opening closes the lightbox ✅; → → ← gives 2 / 9, 3 / 9, 2 / 9 ✅.

### Small change (my request): "← Back to listings" → "← Back"
- The link at the top of the detail page now shows **← Back**. `aria-label="Back to listings"` keeps the full meaning for
  screen-reader users (it still contains "Back", so it matches what sighted users see).
- **201 tests pass** (+1 test: visible text "← Back", screen-reader name "Back to listings", goes to `/`).

## Problems we hit
| Problem | Cause | Fix |
|---|---|---|
| Week 7 notes still uncommitted | The demo guide was written after pull request #8 was merged | Pull request #9 on a new branch |
| Guide's env name won't work | `REACT_APP_` is for Create React App; we use Vite | Named it `VITE_GOOGLE_MAPS_API_KEY` |
| Tests couldn't load React Router 8 | Version 8 is ES-module only and uses `import.meta` | Switched to React Router 7.18.5 |
| `TextEncoder is not defined` in tests | jsdom leaves it out | `test/textEncoder.js` + `setupFiles` |
| Chrome still used version 8 | Vite's cache | `npm run dev -- --force` |
| No-photo cards hid their details | `height: 100%` meant the whole card | Placeholder inside the 200px box |
| Most photos of some homes were grey boxes | 28% of page 1's photo links are 404 "Media record not found!" | Carousel skips failed photos |
| Lightbox ignored Escape (debug challenge 2) | Focus was on `<body>`; a plain `<div>` can't take focus | `tabIndex={-1}` + `.focus()` on open |

## Questions my supervisor may ask
- **Why React Router?** → Each home gets its own address; Back, refresh and sharing links work.
- **Does this replace Vite?** → No. Vite runs and builds the project; React Router is part of the app.
- **Why does `/nonsense` return 200?** → The server always sends the same app page. The "not found" decision happens
  in the browser, in the `path="*"` route.
- **Why is `BrowserRouter` in `main.jsx`?** → It keeps `App` testable: tests can wrap it in `MemoryRouter` at any address.
- **Isn't the Maps key visible in the browser?** → Yes, any frontend key is. That's why it's restricted to
  `localhost:3000` and the Maps Embed API.

- **Why React Router 7 and not 8?** → Version 8 can't be loaded by Jest; version 7 has the same features we use.
- **Why `onClick` instead of a `<Link>` around the card?** → So the carousel arrows can stop the click with `stopPropagation`.
- **What is `MemoryRouter`?** → A router for tests that keeps the address in memory instead of the address bar.

- **How does the page handle an invalid ID?** → The backend returns 400 (bad format) or 404 (no such home); `client.js` turns
  it into an error; the page shows a red box with a Back link.
- **How does the page choose what to show?** → `if (loading)` and `if (error)` return early; otherwise it shows the home.

- **Why hide empty detail rows?** → Many fields are only filled for some homes (architectural style 39%). The 4 stat boxes
  always show, with "—" when missing.
- **What does the regular expression do?** → Puts a space between a small letter and a capital: `CentralAir` → `Central Air`.

- **Why `try/catch` if the data has no broken JSON?** → It comes from an outside feed; one bad record must not crash the page.
- **Why one shared photo helper?** → One place reads `L_Photos`, so one fix covers the cards, carousel and gallery.

- **What would happen without `stopPropagation`?** → Every arrow click would also open the detail page. A test proves it.
- **Why didn't the tests catch the layout bug?** → Jest doesn't do layout; that's why we check in a real browser every step.
- **Why are photos missing?** → The provider deleted old photos after those homes updated theirs, but our database still has
  the old links (404 "Media record not found!"). The frontend skips them; the data needs refreshing.

- **What's a custom hook?** → A function starting with `use` that holds reusable React logic; `usePhotoList` serves the
  carousel and the gallery.

- **What does `useRef` do?** → Gives a direct handle on a page element; we use it to scroll the thumbnail strip.

- **Why didn't Escape work?** → Key presses go to the focused element. A plain `<div>` can't take focus, so its `onKeyDown`
  never ran. `tabIndex={-1}` allows focus; `useRef` + `useEffect` call `.focus()` when the lightbox opens.
- **Why `-1` and not `0`?** → `0` would add the dark background as a Tab stop; it only needs focus from our code.
- **Why does the Back link have an `aria-label`?** → The visible text is short; the label tells screen-reader users where it goes.

## Still to do / ask
- Keyboard ← / → on the gallery itself (not just the lightbox) — possible follow-up using the same `tabIndex` idea.
- **Ask:** can the photo links be refreshed from the provider? 157 of 552 links on page 1 (28%) are 404.
- Back from a detail page returns to listings page 1 (page number isn't kept in the address).
- `npm audit` reports moderate warnings in test tools (`deepmerge`, `glob`, `minimatch`, used by Jest). These are not
  shipped to the browser. I didn't run `npm audit fix --force` because it can install breaking versions; ask before fixing.
