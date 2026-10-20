/* =====================================================================
 * explore.js — نقشهٔ کاوش (بعد از urgent.js)
 *   دور ۳۲: کاوش به حالت قبل برگشت (دسته‌ها و فیلترهای یک‌لمسی دور ۳۱ برداشته شد، به خواست مجید)؛ فقط نقشهٔ بهتر ماند:
 *   حباب هر شهر با تعداد (به‌جای پین‌های روی هم)، زوم خودکار روی شهرها، لمس حباب = فقط همان شهر، دکمهٔ کوچک بستن نقشه
 * ===================================================================== */
(function () {
  const wrapW = (name, fn) => { const prev = window[name]; if (typeof prev !== 'function') return; window[name] = function (...a) { return fn.call(this, prev, ...a); }; };
  const myCity = () => (S.auth && ME().place) || 'قشم';
  S.cityF = S.cityF || null;
  try { S.exMapOff = localStorage.getItem('blk-exmap') === '0'; } catch (e) {}

  const css = document.createElement('style');
  css.textContent = `
  .cbub{cursor:pointer}
  .cbub .h{fill:none;stroke-width:1.2;opacity:0;animation:cbPing 2.4s infinite}
  @keyframes cbPing{0%{transform:scale(.6);opacity:.8}100%{transform:scale(1.9);opacity:0}}
  .cbub.sel circle.b{stroke:#FFC93C;stroke-width:2.4}
  #heroMap svg{max-height:240px;width:100%}
  .map-tog{border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:#fff;border-radius:10px;min-width:34px;min-height:32px;padding:0 8px;font:600 13px inherit;font-family:inherit}
  .city-chip{border:0;border-radius:12px;background:color-mix(in srgb,var(--accent) 14%,var(--surface));color:var(--accent);font:700 12.5px inherit;font-family:inherit;min-height:32px;padding:0 10px;margin:0 0 10px}`;
  document.head.appendChild(css);

  // لمس حباب یک شهر ← فقط همان شهر
  wrapW('listFor', function (prev, ign) { const l = prev(ign); return S.cityF ? l.filter((x) => x.a.place === S.cityF) : l; });
  window.exMapTog = () => { S.exMapOff = !S.exMapOff; try { localStorage.setItem('blk-exmap', S.exMapOff ? '0' : '1'); } catch (e) {} renderExplore(); };
  window.exCityClear = () => { S.cityF = null; renderExplore(); };

  wrapW('renderExplore', function (prev, ...a) {
    const r = prev(...a);
    const host = $('s-explore');
    if (!host) return r;
    const hh = host.querySelector('.hero-head .hh-r');
    if (hh && !hh.querySelector('.map-tog')) hh.insertAdjacentHTML('afterbegin', `<button class="map-tog" onclick="exMapTog()" aria-label="${S.exMapOff ? 'نمایش نقشه' : 'بستن نقشه'}" title="${S.exMapOff ? 'نمایش نقشه' : 'بستن نقشه'}">${S.exMapOff ? '🗺' : '✕'}</button>`);
    if (S.exMapOff) { const m = $('heroMap'); if (m) m.remove(); host.querySelectorAll('.ex-tip').forEach((x) => x.remove()); }
    return r;
  });
  wrapW('renderResults', function (prev, ...a) {
    const r = prev(...a);
    const el = $('results');
    if (el && S.cityF) {
      const head = el.querySelector('.sec-head');
      const html = `<button class="city-chip" onclick="exCityClear()">📍 فقط ${esc(S.cityF)} ×</button>`;
      if (head) head.insertAdjacentHTML('afterend', html); else el.insertAdjacentHTML('afterbegin', html);
    }
    return r;
  });

  /* ---- نقشه: حباب شهرها با زوم خودکار ---- */
  wrapW('exploreMap', function (prev, list) {
    const zoom = !S.provF && !S.mapAll ? 'qeshm' : S.provF || 'iran';
    if (zoom === 'iran' || typeof CITY !== 'object') return prev(list);
    const by = {};
    list.forEach((x) => { if (!CITY[x.a.place]) return; const b = (by[x.a.place] = by[x.a.place] || { n: 0, roles: {} }); b.n++; b.roles[x.p.role] = (b.roles[x.p.role] || 0) + 1; });
    const cities = Object.keys(by);
    // زوم خودکار روی شهرهایی که مورد دارند (حباب‌ها روی هم نیفتند)
    const pts = cities.concat(CITY[myCity()] ? [myCity()] : []).map((c) => CITY[c]);
    let vb;
    if (pts.length) {
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      let w = Math.max(30, (x1 - x0) * 1.6 + 14), h = w / 1.55;
      if ((y1 - y0) * 1.6 + 12 > h) { h = (y1 - y0) * 1.6 + 12; w = h * 1.55; }
      vb = [(x0 + x1) / 2 - w / 2, (y0 + y1) / 2 - h / 2, w, h];
    }
    const svg = islandSVG({ explore: true, prov: S.provF, zoom: S.provF || 'qeshm', vb, cities, me: S.auth ? myCity() : '' });
    const k = typeof LASTK === 'number' ? LASTK : 1;
    const marks = cities.sort((a, b) => by[a].n - by[b].n).map((c, i) => {
      const [x, y] = CITY[c], b = by[c], role = Object.entries(b.roles).sort((p, q) => q[1] - p[1])[0][0], col = ROLES[role] ? ROLES[role].c : 'var(--accent)';
      const R = (8 + Math.min(6, b.n)) * k * 0.9;
      return `<g class="cbub ${S.cityF === c ? 'sel' : ''}" data-city="${esc(c)}" tabindex="0" role="button" aria-label="${esc(c)}: ${fa(b.n)} مورد" transform="translate(${x} ${y})"><circle class="h" r="${R}" stroke="${col}" style="animation-delay:${i * 0.3}s"/><circle class="b" r="${R}" fill="${col}" stroke="#fff" stroke-width="${1.4 * k}"/><text y="${3.6 * k}" text-anchor="middle" fill="#fff" style="font-size:${10 * k}px;font-weight:800">${fa(b.n)}</text></g>`;
    }).join('');
    return svg.replace(/<\/g><\/svg>$/, marks + '</g></svg>');
  });
  wrapW('bindPins', function (prev, root) {
    prev(root);
    root.querySelectorAll('.cbub').forEach((g) => {
      const f = () => { S.cityF = S.cityF === g.dataset.city ? null : g.dataset.city; renderExplore(); setTimeout(() => { const r = $('results'); if (r) r.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50); };
      g.addEventListener('click', f);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f(); } });
    });
  });
  wrapW('setMode', function (prev, m, ...a) { if (m !== S.mode) S.cityF = null; return prev(m, ...a); });
})();
