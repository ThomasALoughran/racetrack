/* eslint-disable */
(function () {
  const { getAccountConsumption } = window.RaceData;

  const fmtMoney = (n) => {
    if (n === 0) return '$0';
    if (n < 1) return '$' + n.toFixed(2);
    if (n < 1000) return '$' + n.toFixed(0);
    if (n < 1_000_000) return '$' + (n / 1000).toFixed(n < 10_000 ? 1 : 0) + 'K';
    return '$' + (n / 1_000_000).toFixed(2) + 'M';
  };

  const fmtDateLong = (d) =>
    d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  const fmtClock = (d) =>
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  /**
   * Map ARR -> [0, 1] track position using a 4-segment log scale.
   * Segments: gate(0)->$1 (0..0.25), $1->$10K (0.25..0.5),
   * $10K->$100K (0.5..0.75), $100K->$1M (0.75..1.0).
   */
  function arrToPosition(arr) {
    if (arr <= 0) return 0.02;
    if (arr < 1) return 0.03 + 0.18 * arr; // out of the gate
    if (arr >= 1_000_000) return 0.98;
    const log = Math.log10(arr);
    if (arr < 10_000) return 0.25 + 0.24 * (log / 4); // $1 -> 25%, $10K -> 49%
    if (arr < 100_000) return 0.5 + 0.24 * (log - 4); // $10K -> 50%, $100K -> 74%
    return 0.75 + 0.23 * (log - 5);                    // $100K -> 75%, ~$1M -> 98%
  }

  /** Furthest threshold an account has crossed. Returns threshold.id. */
  function furlongFor(arr, thresholds) {
    let cur = thresholds[0];
    for (const t of thresholds) {
      if (arr >= t.value) cur = t;
    }
    return cur;
  }

  function momentumOf(account) {
    if (account.t28dArr <= 0) return account.t7dArr > 0 ? Infinity : 1;
    return account.t7dArr / account.t28dArr;
  }

  function classifyHorse(account) {
    if (account.t7dArr >= 1_000_000) return 'is-winner';
    if (account.t7dArr === 0) return 'is-cold';
    const m = momentumOf(account);
    if (!isFinite(m) || m >= 1.15) return 'is-accelerating';
    return '';
  }

  function silksStyle(silks) {
    return `--silk-primary:${silks.primary};--silk-secondary:${silks.secondary};`;
  }

  // -------- Leaderboard --------
  function renderLeaderboard(state) {
    const { aes, accounts, thresholds } = state;
    const counts = {};
    for (const ae of aes) {
      counts[ae.id] = { dollar: 0, tenk: 0, hundredk: 0, million: 0, totalT7d: 0 };
    }
    for (const acc of accounts) {
      const c = counts[acc.aeId];
      c.totalT7d += acc.t7dArr;
      if (acc.t7dArr >= 1) c.dollar += 1;
      if (acc.t7dArr >= 10_000) c.tenk += 1;
      if (acc.t7dArr >= 100_000) c.hundredk += 1;
      if (acc.t7dArr >= 1_000_000) c.million += 1;
    }

    // Standings: sort by million, then 100k, 10k, 1, then total T7D.
    const standings = aes
      .map((ae) => ({ ae, ...counts[ae.id] }))
      .sort((a, b) => {
        return (
          b.million - a.million ||
          b.hundredk - a.hundredk ||
          b.tenk - a.tenk ||
          b.dollar - a.dollar ||
          b.totalT7d - a.totalT7d
        );
      });

    const container = document.getElementById('leaderboard');
    container.innerHTML = '';
    standings.forEach((row, idx) => {
      const rank = idx + 1;
      const rankLabel =
        rank === 1 ? 'Win' : rank === 2 ? 'Place' : rank === 3 ? 'Show' : `${rank}th`;
      const card = document.createElement('div');
      card.className = `jockey-card rank-${rank}`;
      card.dataset.aeId = row.ae.id;
      card.style.cssText = silksStyle(row.ae.silks);
      card.innerHTML = `
        <div class="jockey-head">
          <div class="silks"></div>
          <div class="jockey-id">
            <div class="jockey-name">${row.ae.name}</div>
            <div class="jockey-handle">${row.ae.handle}</div>
          </div>
          <div class="rank-pill">${rankLabel}</div>
        </div>
        <div class="threshold-badges">
          <div class="tb ${row.dollar ? '' : 'empty'}"><div class="tb-label">$1</div><div class="tb-count">${row.dollar}</div></div>
          <div class="tb ${row.tenk ? '' : 'empty'}"><div class="tb-label">$10K</div><div class="tb-count">${row.tenk}</div></div>
          <div class="tb ${row.hundredk ? '' : 'empty'}"><div class="tb-label">$100K</div><div class="tb-count">${row.hundredk}</div></div>
          <div class="tb win ${row.million ? '' : 'empty'}"><div class="tb-label">$1M</div><div class="tb-count">${row.million}</div></div>
        </div>
        <div class="jockey-foot">
          <span>Stable T7D ARR</span>
          <strong>${fmtMoney(row.totalT7d)}</strong>
        </div>
      `;
      card.addEventListener('click', () => toggleFilter(row.ae.id));
      container.appendChild(card);
    });
  }

  // -------- Track --------
  function renderTrack(state) {
    const { accounts, aes } = state;
    const aeById = Object.fromEntries(aes.map((a) => [a.id, a]));
    const sortMode = document.getElementById('sortMode').value;

    let sorted = accounts.slice();
    if (sortMode === 'arr') {
      sorted.sort((a, b) => b.t7dArr - a.t7dArr);
    } else if (sortMode === 'ae') {
      sorted.sort(
        (a, b) =>
          a.aeId.localeCompare(b.aeId) || b.t7dArr - a.t7dArr
      );
    } else if (sortMode === 'account') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortMode === 'momentum') {
      sorted.sort((a, b) => momentumOf(b) - momentumOf(a));
    }

    const lanes = document.getElementById('lanes');
    lanes.innerHTML = '';
    sorted.forEach((acc, idx) => {
      const ae = aeById[acc.aeId];
      const pos = arrToPosition(acc.t7dArr) * 100;
      const lane = document.createElement('div');
      lane.className = 'lane';
      lane.dataset.aeId = acc.aeId;
      if (state.filterAeId && state.filterAeId !== acc.aeId) {
        lane.classList.add('dim');
      }
      lane.innerHTML = `
        <div class="lane-number">${idx + 1}</div>
        <div class="horse ${classifyHorse(acc)}" style="left:${pos}%;${silksStyle(
        ae.silks
      )}">
          <div class="horse-icon"><div class="horse-emoji">&#x1F40E;</div></div>
          <div class="horse-label">${acc.name}<span class="arr">${fmtMoney(
        acc.t7dArr
      )}</span></div>
        </div>
      `;
      lanes.appendChild(lane);
    });

    renderMobileTrack(state, sorted, aeById);
  }

  // -------- Mobile Track (vertical lane cards) --------
  function renderMobileTrack(state, sorted, aeById) {
    const mt = document.getElementById('mtLanes');
    mt.innerHTML = '';
    sorted.forEach((acc) => {
      const ae = aeById[acc.aeId];
      const pos = arrToPosition(acc.t7dArr) * 100;
      const m = momentumOf(acc);
      const cls = classifyHorse(acc);
      const lane = document.createElement('div');
      lane.className = `mt-lane ${cls}`;
      lane.dataset.aeId = acc.aeId;
      if (state.filterAeId && state.filterAeId !== acc.aeId) {
        lane.classList.add('dim');
      }
      const momentumLabel = !isFinite(m)
        ? 'NEW'
        : acc.t7dArr === 0
        ? ''
        : (m * 100 - 100 >= 1 ? '+' : '') + (m * 100 - 100).toFixed(0) + '%';
      const momentumClass = !isFinite(m) || m > 1.05 ? 'up' : '';
      lane.innerHTML = `
        <div class="mt-lane-head">
          <span class="mt-silks" style="${silksStyle(ae.silks)}"></span>
          <span class="mt-account">${acc.name}</span>
          <span class="mt-arr">${fmtMoney(acc.t7dArr)}</span>
          ${momentumLabel ? `<span class="mt-momentum ${momentumClass}">${momentumLabel}</span>` : ''}
        </div>
        <div class="mt-rail">
          <div class="mt-progress" style="width:${pos}%"></div>
          <div class="mt-tick t-1" style="left:25%"></div>
          <div class="mt-tick t-10k" style="left:50%"></div>
          <div class="mt-tick t-100k" style="left:75%"></div>
          <div class="mt-tick t-1m" style="left:100%"></div>
          <div class="mt-horse" style="left:${pos}%;${silksStyle(ae.silks)}">
            <div class="mt-horse-emoji">&#x1F40E;</div>
          </div>
        </div>
      `;
      mt.appendChild(lane);
    });
  }

  // -------- Winners' Circle --------
  function renderWinnersCircle(state) {
    const winners = state.accounts
      .filter((a) => a.t7dArr >= 1_000_000)
      .sort((a, b) => b.t7dArr - a.t7dArr);
    const aeById = Object.fromEntries(state.aes.map((a) => [a.id, a]));

    const el = document.getElementById('winnersCircle');
    el.innerHTML = '';
    if (winners.length === 0) {
      el.innerHTML =
        '<div class="empty-winners">No horses past the wire yet &mdash; the race is still on.</div>';
      return;
    }
    winners.forEach((w) => {
      const ae = aeById[w.aeId];
      const card = document.createElement('div');
      card.className = 'winner-card';
      card.style.cssText = silksStyle(ae.silks);
      card.innerHTML = `
        <div class="wc-account">${w.name}</div>
        <div class="wc-jockey"><span class="silks-mini" style="${silksStyle(
          ae.silks
        )}"></span>${ae.name}</div>
        <div class="wc-arrs">
          <span>T28D <span class="num">${fmtMoney(w.t28dArr)}</span></span>
          <span>T7D <span class="num">${fmtMoney(w.t7dArr)}</span></span>
        </div>
      `;
      el.appendChild(card);
    });
  }

  // -------- Race card table --------
  function renderRaceCard(state) {
    const aeById = Object.fromEntries(state.aes.map((a) => [a.id, a]));
    const tbody = document.getElementById('raceCardBody');
    tbody.innerHTML = '';
    const rows = state.accounts
      .slice()
      .sort((a, b) => b.t7dArr - a.t7dArr);
    rows.forEach((acc, idx) => {
      const ae = aeById[acc.aeId];
      const f = furlongFor(acc.t7dArr, state.thresholds);
      const m = momentumOf(acc);
      const mDisplay = !isFinite(m)
        ? 'NEW'
        : (m === 1 && acc.t7dArr === 0 ? '—' : (m * 100 - 100).toFixed(0) + '%');
      const mClass =
        !isFinite(m) || (isFinite(m) && m > 1.05)
          ? 'up'
          : 'flat';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td><strong>${acc.name}</strong></td>
        <td><span class="silks-mini" style="${silksStyle(
          ae.silks
        )}"></span>${ae.name}</td>
        <td class="num">${fmtMoney(acc.t28dArr)}</td>
        <td class="num">${fmtMoney(acc.t7dArr)}</td>
        <td class="num momentum ${mClass}">${mDisplay}</td>
        <td><span class="furlong-pill ${f.pillClass}">${f.label}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  // -------- Filter / state --------
  const state = {
    ...getAccountConsumption(),
    filterAeId: null,
  };

  function toggleFilter(aeId) {
    state.filterAeId = state.filterAeId === aeId ? null : aeId;
    document.querySelectorAll('.jockey-card').forEach((card) => {
      card.classList.toggle(
        'active',
        state.filterAeId && card.dataset.aeId === state.filterAeId
      );
    });
    document.getElementById('clearFilter').hidden = !state.filterAeId;
    renderTrack(state);
  }

  function init() {
    const now = state.asOf;
    document.getElementById('raceDate').textContent = fmtDateLong(now);
    document.getElementById('lastUpdate').innerHTML =
      'as of ' + fmtClock(now) + ' &middot; mock';

    renderLeaderboard(state);
    renderTrack(state);
    renderWinnersCircle(state);
    renderRaceCard(state);

    document
      .getElementById('sortMode')
      .addEventListener('change', () => renderTrack(state));
    document
      .getElementById('clearFilter')
      .addEventListener('click', () => toggleFilter(state.filterAeId));
  }

  document.addEventListener('DOMContentLoaded', init);
})();
