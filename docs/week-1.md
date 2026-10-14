# Week 1 — Database Setup

## Goal
Get a MySQL database running on my laptop with the real estate data loaded,
and connect my Node.js backend to it.

---

## What I built

### 1. MySQL running in Docker
- **Container name:** `idx-mysql-local`
- **Image:** `mysql:8` (currently version 8.4)
- **Port:** `3306` (so the backend reaches it at `localhost:3306`)

**What is Docker?** A tool that runs programs inside a *container* — a small,
sealed box that has everything the program needs.
**Comparison:** Instead of installing MySQL directly on my Mac (like building a
kitchen into my house), Docker gives me a food truck — a complete kitchen I can
start, stop or throw away without touching the house.

**Why Docker?** Everyone on the team gets the exact same MySQL version, and it
doesn't mess with anything else on my computer.

Useful commands:
```bash
docker ps                          # list running containers
docker start idx-mysql-local       # start it again (e.g. after a restart)
docker exec idx-mysql-local mysqladmin ping   # "are you alive?" → mysqld is alive
```
> Docker Desktop must be open before these commands work.

### 2. Data loaded into the `rets` database
The SQL dump files live in `IDX/SQL/`. The two main tables:

| Table | Rows | Columns | What it holds |
|---|---|---|---|
| `rets_property` | ~55,200 | 126 | One row per house listing (address, price, beds, baths…) |
| `rets_openhouse` | ~13,400 | 13 | One row per open house time slot |

**Confusing column names** (RETS is the real estate industry's data format and
uses generic names):

| Column | Really means |
|---|---|
| `L_ListingID` | The listing number, e.g. `1118381441` |
| `L_SystemPrice` | Price |
| `L_Keyword2` | Bedrooms |
| `LM_Dec_3` | Bathrooms |
| `L_Type_` | Property type, e.g. `SingleFamilyResidence` |

### 3. How the two tables are connected
Both tables have an `L_ListingID` column. Each open house row stores the listing
ID of the house it belongs to.

**Comparison:** `rets_property` is a list of **houses**; `rets_openhouse` is a
list of **visiting times**. Each visiting time has the house number written on it.

- This is a **one-to-many** relationship: one property can have zero, one, or
  many open houses.
- There is **no foreign key** — a *foreign key* is a database rule that would stop
  an open house from pointing to a property that doesn't exist. The link only
  works because the IDs match.

```sql
SELECT p.L_Address, o.OH_StartDate, o.OH_StartTime, o.OH_EndTime
FROM rets_property p
JOIN rets_openhouse o ON o.L_ListingID = p.L_ListingID;
```

### 4. Connection pool — `backend/db.js:4-14`
```js
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'rets',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 5000
});
```

**What is a connection pool?** A set of database connections that are opened once
and reused.
**Comparison:** A taxi stand with 10 taxis already waiting. Instead of calling a
new taxi for every trip (slow), you grab one from the stand and bring it back
when you're done.

| Setting | Meaning |
|---|---|
| `host`, `user`, `password`, `database`, `port` | Where the database is and how to log in. Read from the `.env` file; `||` means "use this default if it's missing". |
| `waitForConnections: true` | If all 10 are busy, wait in line instead of failing. |
| `connectionLimit: 10` | At most 10 connections open at once. |
| `queueLimit: 0` | No limit on how many requests can wait (0 = unlimited). |
| `connectTimeout: 5000` | Give up after 5 seconds if the database doesn't answer (e.g. Docker is off) instead of hanging forever. |

**Why the `.env` file?** It keeps passwords out of the code. The `.env` file is
private and must never be shared or committed.

---

## How I tested it
- `docker exec idx-mysql-local mysqladmin ping` → `mysqld is alive`
- Counted rows in both tables and looked at sample rows.

## Data issues I found (to follow up)
1. **~1,300 open houses point to properties that don't exist** in `rets_property`
   (about 10% of the open house table). A normal `JOIN` quietly skips them.
2. **3 listing IDs appear twice** in `rets_property`.
3. Many open houses in the data are **in the past** — to show upcoming ones only,
   filter with `WHERE OH_StartDate >= CURDATE()`.

## Questions my supervisor may ask
- **Why Docker instead of installing MySQL?** Same setup for everyone, easy to
  reset, doesn't clutter my computer.
- **Why a connection pool?** Opening a connection is slow; reusing them makes
  every request faster and limits how many connections hit the database.
- **How are the tables linked?** By `L_ListingID`, one property → many open houses.

## TODO: add your own notes
- How you imported the `.sql` files (command used, any errors you hit).
