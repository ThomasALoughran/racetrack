# Run for the Roses 🌹

A Kentucky Derby–themed leaderboard for an Anthropic NA Banking consumption
team. It visualizes how the top 25 North American banks are racing against
four ARR thresholds — **$1, $10K, $100K, $1M** — and which of the five AEs
("jockeys") is winning the meet.

The dashboard is intentionally a self-contained static site so it can be
hosted on GitHub Pages, an internal CDN, or just opened locally. The data
layer is isolated to a single function so it can be swapped for live
Salesforce data without touching the rendering code.

## Features

- **Jockey Standings** – Win / Place / Show ranking of the 5 AEs with a count
  of accounts past each threshold and the jockey's total stable T7D ARR.
  Click a jockey to filter the track to just that book of business.
- **The Track** – A horizontal race track with one lane per account. Each
  horse's position is the account's T7D ARR on a four-segment log scale
  (gate → $1 → $10K → $100K → $1M finish line). Sortable by ARR, jockey,
  account name, or momentum.
- **Winner's Circle** – Roses for every account already past the $1M wire.
- **Race Card** – A traditional tabular view of all 25 starters showing T28D,
  T7D, momentum (T7D / T28D), and the furthest threshold crossed.

## Sticky T7D revenue

The mock data enforces the invariant `t7dArr >= t28dArr` so the dashboard
demonstrates "sticky" consumption: T7D run-rate ARR meeting or exceeding the
T28D run-rate. Momentum > 100% reads as accelerating.

## Run it locally

No build step. Either open `index.html` directly, or serve the directory:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Wiring to Salesforce

Replace `getAccountConsumption()` in [`assets/js/data.js`](assets/js/data.js)
with a call that returns the same shape:

```js
{
  aes: [{ id, name, handle, silks: { primary, secondary } }],
  accounts: [{ id, name, aeId, t28dArr, t7dArr }],
  thresholds: [{ id, label, value, pillClass }],
  asOf: Date,
}
```

A typical implementation will:

1. Query a Salesforce consumption mart (or a Snowflake/BigQuery model fed by
   it) for daily revenue by Account.
2. Aggregate into trailing 7-day and trailing 28-day ARR (annualize the daily
   revenue: `arr = daily_avg * 365`).
3. Join Accounts to their owning AE for the silk colors and standings.
4. Return the structure above. The rest of the dashboard works unchanged.

## Customizing

- **AEs and silks**: edit `AES` at the top of `assets/js/data.js`.
- **Accounts**: edit `ACCOUNTS` in the same file.
- **Thresholds**: edit `THRESHOLDS`. Position math in `assets/js/app.js`
  assumes four thresholds (`$1`, `$10K`, `$100K`, `$1M`); update
  `arrToPosition` if you change them.
- **Theme colors**: CSS variables at the top of `assets/css/styles.css`.

## Files

```
index.html              # Page structure
assets/css/styles.css   # Kentucky Derby theme
assets/js/data.js       # Mock data + the single boundary to swap for Salesforce
assets/js/app.js        # Rendering: leaderboard, track, winners circle, race card
```
