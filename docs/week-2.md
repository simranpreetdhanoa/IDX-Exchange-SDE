# Week 2 — Express Server & Health Check

## Goal
Create the backend web server and a simple endpoint that tells us whether the
database is reachable.

---

## What I built

### 1. Express server — `backend/server.js`
**What is Express?** A Node.js library for building web servers.
**What is an endpoint?** A specific address on the server that answers one kind
of question, e.g. `GET /api/health`.
**Comparison:** The server is a restaurant; each endpoint is a dish on the menu.
You order by URL, and the kitchen sends back a response.

Key lines:
| Code | What it does |
|---|---|
| `require('dotenv').config()` | Loads settings from `.env` (port, database login). |
| `const app = express()` | Creates the server. |
| `app.use(cors())` | Allows the frontend (running on a different port) to call this API. *CORS* = the browser's rule about which websites may talk to which servers. |
| `app.use(express.json())` | Lets the server read JSON in request bodies. |
| `app.listen(PORT, '0.0.0.0', …)` | Starts listening for requests on port 5000. |

**404 handler** (at the bottom of `server.js`): any URL that didn't match a route
gets `{ success: false, message: "Route ... not found" }` with status **404**.
It must be **last**, because Express checks routes top to bottom — like a
"none of the above" option at the end of a list.

### 2. Health check — `GET /api/health` (`server.js:25-36`)
```js
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', message: error.message });
  }
});
```
- `SELECT 1` is the smallest possible question to ask MySQL — "are you there?"
- If it answers → **200** (OK). If it fails → **500** (server error).
- `try / catch`: *try* the risky thing; if it throws an error, *catch* it and
  respond nicely instead of crashing.
- `async / await`: talking to the database takes time. `await` means "wait for
  the answer before going to the next line" — like waiting for the waiter to
  bring your order before you start eating.

**Comparison:** A health check is like a doctor checking your pulse — a quick
sign of life, not a full exam.

---

## How to run and test
```bash
cd backend
npm run dev        # starts the server with nodemon (auto-restarts when files change)
curl http://localhost:5000/api/health
# → {"status":"ok","database":"connected"}
```
Stop the server with `Ctrl + C`. If Docker/MySQL is off, the health check returns
**500** after ~5 seconds (the `connectTimeout` from `db.js`).

**What is nodemon?** A tool that watches your files and restarts the server
automatically when you save a change.

## Status codes used
| Code | Meaning |
|---|---|
| 200 | OK — it worked |
| 404 | Not found — no such route |
| 500 | Server error — something broke on our side |

## Questions my supervisor may ask
- **Why have a health check?** Monitoring tools and teammates can quickly see if
  the server *and* database are up.
- **Why `SELECT 1`?** It's the cheapest query possible — it doesn't read any table.
- **Why must the 404 handler be last?** Express checks routes in order; if it
  were first, it would catch every request.

## TODO: add your own notes
- Anything you got stuck on this week.
