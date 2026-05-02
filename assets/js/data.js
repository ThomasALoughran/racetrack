/* eslint-disable */
/**
 * Mock data for the Run for the Roses threshold race.
 *
 * Replace `getAccountConsumption()` with a Salesforce-backed data source
 * when wiring this dashboard to live data. The shape returned by the
 * function is the only contract the rendering layer depends on.
 *
 *   { ae: { id, name, handle, silks: { primary, secondary } },
 *     accounts: [
 *       { id, name, aeId, t28dArr, t7dArr }
 *     ]
 *   }
 *
 * Invariant: t7dArr >= t28dArr (sticky T7D revenue).
 */
(function (root) {
  const AES = [
    {
      id: 'ae-mreeves',
      name: 'Madison "Maverick" Reeves',
      handle: 'Money-Center East',
      silks: { primary: '#b8002b', secondary: '#f4d35e' }, // crimson & gold
    },
    {
      id: 'ae-csullivan',
      name: 'Carter "Cash" Sullivan',
      handle: 'Money-Center South',
      silks: { primary: '#1f4e9d', secondary: '#ffffff' }, // royal blue & white
    },
    {
      id: 'ae-jpark',
      name: 'Jordan "Jet" Park',
      handle: 'Custody & Wealth',
      silks: { primary: '#1f7a4d', secondary: '#cfd2d4' }, // emerald & silver
    },
    {
      id: 'ae-rchen',
      name: 'Riley "Rocket" Chen',
      handle: 'Canada & Cross-Border',
      silks: { primary: '#5a2a82', secondary: '#f4d35e' }, // purple & yellow
    },
    {
      id: 'ae-swhitfield',
      name: 'Sloane "Sprint" Whitfield',
      handle: 'Super-Regional',
      silks: { primary: '#111111', secondary: '#ee7b1a' }, // black & orange
    },
  ];

  // 25 accounts, 5 per AE. Top NA banks by assets.
  // Invariant: t7dArr >= t28dArr (sticky)
  const ACCOUNTS = [
    // Madison Reeves — Money-Center East
    { id: 'jpm',   name: 'JPMorgan Chase',         aeId: 'ae-mreeves',    t28dArr: 1_250_000, t7dArr: 1_420_000 },
    { id: 'bac',   name: 'Bank of America',        aeId: 'ae-mreeves',    t28dArr:   875_000, t7dArr:   950_000 },
    { id: 'wfc',   name: 'Wells Fargo',            aeId: 'ae-mreeves',    t28dArr:   145_000, t7dArr:   165_000 },
    { id: 'pnc',   name: 'PNC Financial',          aeId: 'ae-mreeves',    t28dArr:     8_500, t7dArr:    11_200 },
    { id: 'mtb',   name: 'M&T Bank',               aeId: 'ae-mreeves',    t28dArr:         0, t7dArr:         0.5 },

    // Carter Sullivan — Money-Center South
    { id: 'c',     name: 'Citigroup',              aeId: 'ae-csullivan',  t28dArr: 1_050_000, t7dArr: 1_180_000 },
    { id: 'gs',    name: 'Goldman Sachs',          aeId: 'ae-csullivan',  t28dArr:   425_000, t7dArr:   510_000 },
    { id: 'usb',   name: 'U.S. Bancorp',           aeId: 'ae-csullivan',  t28dArr:    22_500, t7dArr:    28_000 },
    { id: 'cof',   name: 'Capital One',            aeId: 'ae-csullivan',  t28dArr:         0, t7dArr:         2.5 },
    { id: 'cfg',   name: 'Citizens Financial',     aeId: 'ae-csullivan',  t28dArr:         0, t7dArr:         0 },

    // Jordan Park — Custody & Wealth
    { id: 'ms',    name: 'Morgan Stanley',         aeId: 'ae-jpark',      t28dArr:   320_000, t7dArr:   380_000 },
    { id: 'schw',  name: 'Charles Schwab',         aeId: 'ae-jpark',      t28dArr:    95_000, t7dArr:   112_000 },
    { id: 'bk',    name: 'Bank of New York Mellon',aeId: 'ae-jpark',      t28dArr:     6_500, t7dArr:     8_200 },
    { id: 'stt',   name: 'State Street',           aeId: 'ae-jpark',      t28dArr:         0.75, t7dArr:     4.20 },
    { id: 'key',   name: 'KeyBank',                aeId: 'ae-jpark',      t28dArr:         0, t7dArr:         0 },

    // Riley Chen — Canada & Cross-Border
    { id: 'ry',    name: 'Royal Bank of Canada',   aeId: 'ae-rchen',      t28dArr: 1_580_000, t7dArr: 1_720_000 },
    { id: 'td',    name: 'Toronto-Dominion Bank',  aeId: 'ae-rchen',      t28dArr:   215_000, t7dArr:   265_000 },
    { id: 'bmo',   name: 'Bank of Montreal',       aeId: 'ae-rchen',      t28dArr:    45_000, t7dArr:    58_000 },
    { id: 'bns',   name: 'Bank of Nova Scotia',    aeId: 'ae-rchen',      t28dArr:       950, t7dArr:     1_250 },
    { id: 'tdus',  name: 'TD Bank (US)',           aeId: 'ae-rchen',      t28dArr:         0, t7dArr:         0 },

    // Sloane Whitfield — Super-Regional
    { id: 'tfc',   name: 'Truist Financial',       aeId: 'ae-swhitfield', t28dArr:   580_000, t7dArr:   680_000 },
    { id: 'cm',    name: 'CIBC',                   aeId: 'ae-swhitfield', t28dArr:    78_000, t7dArr:    92_000 },
    { id: 'fitb',  name: 'Fifth Third Bank',       aeId: 'ae-swhitfield', t28dArr:    12_500, t7dArr:    18_500 },
    { id: 'rf',    name: 'Regions Financial',      aeId: 'ae-swhitfield', t28dArr:         3.20, t7dArr:    7.80 },
    { id: 'na',    name: 'National Bank of Canada',aeId: 'ae-swhitfield', t28dArr:         0, t7dArr:         0 },
  ];

  const THRESHOLDS = [
    { id: 'gate',     label: 'Gate',   value: 0,         pillClass: 'gate' },
    { id: 'dollar',   label: '$1',     value: 1,         pillClass: 'dollar' },
    { id: 'tenk',     label: '$10K',   value: 10_000,    pillClass: 'tenk' },
    { id: 'hundredk', label: '$100K',  value: 100_000,   pillClass: 'hundredk' },
    { id: 'million',  label: '$1M',    value: 1_000_000, pillClass: 'million' },
  ];

  /**
   * The single boundary the rendering layer crosses to fetch data.
   * In production, replace the body with a Salesforce REST/Bulk query
   * (e.g. consumption mart -> aggregated to T7D and T28D ARR per Account).
   */
  function getAccountConsumption() {
    return {
      aes: AES,
      accounts: ACCOUNTS,
      thresholds: THRESHOLDS,
      asOf: new Date(),
    };
  }

  root.RaceData = { getAccountConsumption };
})(window);
