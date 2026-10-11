/* =====================================================================
 * explore.js — دور ۳۱: کاوش خواناتر (بعد از urgent.js)
 *   ۱) دسته‌های مهارت با آیکون و تعداد (بنایی، آرماتور و قالب، برق، لوله‌کشی، ...)
 *   ۲) فیلترهای یک‌لمسی: آزاد امروز / شروع فوری، شهر من، تأییدشده، ۴ ستاره به بالا
 *   ۳) نقشه: حباب هر شهر با تعداد (به‌جای پین‌های روی هم)؛ لمس حباب = فقط همان شهر؛ نقشه قابل بستن
 *   ۴) فیلترهای فعال به‌صورت برچسب‌های قابل حذف بالای نتیجه‌ها
 * ===================================================================== */
(function () {
  const wrapW = (name, fn) => { const prev = window[name]; if (typeof prev !== 'function') return; window[name] = function (...a) { return fn.call(this, prev, ...a); }; };

  // دسته‌ها: نام، آیکون، الگوی تطبیق روی مهارت‌ها + عنوان آگهی + عنوان شخص
  const CATS = [
    ['build', 'بنایی و سفت‌کاری', '🧱', /بنا|بلوک|دیوارچین|سفت|آجر/],
    ['rebar', 'آرماتور و قالب', '🔩', /آرماتور|قالب/],
    ['concrete', 'بتن و اسکلت', '🏗', /بتن|اسکلت بتنی|فونداسیون|گودبرداری/],
    ['elec', 'برق', '⚡', /برق|سیم/],
    ['plumb', 'لوله‌کشی و تأسیسات', '🚰', /لوله|تأسیسات|شوفاژ|موتورخانه/],
    ['tile', 'کاشی و سنگ', '🟫', /کاشی|سرامیک|سنگ/],
    ['weld', 'جوش و فلزی', '🔥', /جوش|فلزی|سوله|آهن/],
    ['paint', 'نقاشی و گچ', '🎨', /نقاش|گچ|کناف|نازک|رنگ/],
    ['wood', 'نجاری و در و پنجره', '🪚', /نجار|کابینت|درب|پنجره|UPVC|MDF/i],
    ['iso', 'عایق و ایزوگام', '🛡', /ایزو|عایق/],
    ['labor', 'کارگر ساده و حمل', '👷', /کارگر ساده|حمل|نخاله|نظافت|کمک/],
    ['eng', 'مهندسی و نظارت', '📐', /نظارت|طراحی|محاسب|نقشه|مهندس|برآورد|کارشناس/],
  ];
  const textOf = (x) => [(x.a.skills || []).join(' '), x.a.title || '', (x.p && x.p.title) || ''].join(' ');
  const catOf = (x) => CATS.filter((c) => c[3].test(textOf(x)) || (c[0] === 'eng' && x.p && x.p.role === 'engineer')).map((c) => c[0]);
  const todayIdx = () => (new Date().getDay() + 1) % 7; // شنبه = ۰
  const myCity = () => (S.auth && ME().place) || 'قشم';
  S.cat = S.cat || null; S.qf = S.qf || { free: false, city: false }; S.cityF = S.cityF || null;
  try { S.exMapOff = localStorage.getItem('blk-exmap') === '0'; } catch (e) {}

  const css = document.createElement('style');
  css.textContent = `
  .cat-rail{display:flex;gap:8px;overflow-x:auto;padding:12px 16px 2px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
  .cat-rail::-webkit-scrollbar{display:none}
  .cat-rail button{flex:none;width:84px;min-height:88px;border-radius:18px;border:1px solid var(--line);background:var(--surface);font-family:inherit;color:var(--ink);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:8px 4px;box-shadow:var(--shadow)}
  .cat-rail button .e{font-size:26px;line-height:1}
  .cat-rail button b{font-size:12px;line-height:1.35;text-align:center}
  .cat-rail button small{font-size:11.5px;color:var(--muted)}
  .cat-rail button[aria-pressed=true]{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,var(--surface));box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 35%,transparent)}
  .cat-rail button.zero{opacity:.45}
  .qf-rail{display:flex;gap:8px;overflow-x:auto;padding:10px 16px 0;scrollbar-width:none}
  .qf-rail::-webkit-scrollbar{display:none}
  .qf-rail .chip{flex:none;min-height:40px}
  .af-row{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}
  .af-row button{border:0;border-radius:12px;background:color-mix(in srgb,var(--accent) 14%,var(--surface));color:var(--accent);font:700 12.5px inherit;font-family:inherit;min-height:32px;padding:0 10px}
  .af-row button.clr{background:none;color:var(--muted);text-decoration:underline}
  .cbub{cursor:pointer}
  .cbub .h{fill:none;stroke-width:1.2;opacity:0;animation:cbPing 2.4s infinite}
  @keyframes cbPing{0%{transform:scale(.6);opacity:.8}100%{transform:scale(1.9);opacity:0}}
  .cbub.sel circle.b{stroke:#FFC93C;stroke-width:2.4}
  #heroMap svg{max-height:240px;width:100%}
  .map-tog{border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:#fff;border-radius:10px;min-height:32px;padding:0 10px;font:600 12.5px inherit;font-family:inherit}`;
  document.head.appendChild(css);

  /* ---- فیلتر فهرست ---- */
  wrapW('listFor', function (prev, ign) {
    let l = prev(ign);
    const t = typeof modeType === 'function' ? modeType() : 'work';
    if (S.cat) l = l.filter((x) => catOf(x).includes(S.cat));
    if (S.cityF) l = l.filter((x) => x.a.place === S.cityF);
    if (S.qf.city) l = l.filter((x) => x.a.place === myCity());
    if (S.qf.free) l = l.filter((x) => (t === 'work' ? (x.p.week || [])[todayIdx()] === 'a' : /فوری|امروز|فردا|همین/.test(x.a.start || '')));
    return l;
  });
  // شمارش دسته‌ها بدون خود فیلتر دسته
  const countCats = () => { const c0 = S.cat; S.cat = null; const all = listFor(true); S.cat = c0; const n = {}; all.forEach((x) => catOf(x).forEach((k) => (n[k] = (n[k] || 0) + 1))); return n; };

  window.exCat = (k) => { S.cat = S.cat === k ? null : k; renderExplore(); };
  window.exQf = (k) => {
    if (k === 'verified') S.f.verified = !S.f.verified;
    else if (k === 'rating') S.f.rating = S.f.rating ? 0 : 4;
    else S.qf[k] = !S.qf[k];
    renderExplore();
  };
  window.exClear = (k) => {
    if (!k) { S.roleF = 'all'; S.cat = null; S.cityF = null; S.provF = null; S.mapAll = true; S.qf = { free: false, city: false }; S.f.verified = false; S.f.rating = 0; S.q = ''; S.provF = null; }
    else if (k === 'role') S.roleF = 'all'; else if (k === 'prov') { S.provF = null; S.mapAll = true; } else if (k === 'cat') S.cat = null; else if (k === 'cityF') S.cityF = null; else if (k === 'q') S.q = '';
    else if (k === 'verified') S.f.verified = false; else if (k === 'rating') S.f.rating = 0; else S.qf[k] = false;
    renderExplore();
  };
  window.exMapTog = () => { S.exMapOff = !S.exMapOff; try { localStorage.setItem('blk-exmap', S.exMapOff ? '0' : '1'); } catch (e) {} renderExplore(); };

  wrapW('renderExplore', function (prev, ...a) {
    const r = prev(...a);
    const host = $('s-explore');
    if (!host) return r;
    const t = typeof modeType === 'function' ? modeType() : 'work';
    // نقشه: دکمهٔ بستن/باز کردن
    const hh = host.querySelector('.hero-head .hh-r');
    if (hh) hh.querySelectorAll('.provx').forEach((x) => x.remove()); // محدودهٔ استان حالا برچسب بالای نتیجه‌هاست
    if (hh && !hh.querySelector('.map-tog')) hh.insertAdjacentHTML('afterbegin', `<button class="map-tog" onclick="exMapTog()" aria-pressed="${!S.exMapOff}" aria-label="${S.exMapOff ? 'نمایش نقشه' : 'بستن نقشه'}">${S.exMapOff ? '🗺 نقشه' : '✕ نقشه'}</button>`);
    if (S.exMapOff) { const m = $('heroMap'); if (m) m.remove(); host.querySelectorAll('.ex-tip').forEach((x) => x.remove()); }
    if (t === 'consult') return r;
    // دسته‌ها و فیلترهای یک‌لمسی زیر جست‌وجو
    const search = host.querySelector('.search');
    if (search && !host.querySelector('.cat-rail')) {
      const n = countCats();
      const cats = CATS.filter((c) => n[c[0]] || S.cat === c[0]).concat(CATS.filter((c) => !n[c[0]] && S.cat !== c[0]));
      const qf = t === 'work'
        ? [['free', '🟢 آزاد امروز', S.qf.free], ['city', '📍 شهر من', S.qf.city], ['verified', '✓ تأییدشده', S.f.verified], ['rating', '⭐ ۴ به بالا', !!S.f.rating]]
        : [['free', '⚡ شروع فوری', S.qf.free], ['city', '📍 شهر من', S.qf.city], ['verified', '✓ کارفرمای تأییدشده', S.f.verified]];
      search.insertAdjacentHTML('afterend', `<div class="cat-rail" role="group" aria-label="دسته‌بندی مهارت">${cats.map((c) => `<button class="${n[c[0]] ? '' : 'zero'}" aria-pressed="${S.cat === c[0]}" onclick="exCat('${c[0]}')"><span class="e" aria-hidden="true">${c[2]}</span><b>${c[1]}</b><small class="num">${n[c[0]] ? fa(n[c[0]]) + (t === 'work' ? ' نفر' : ' کار') : '—'}</small></button>`).join('')}</div>
        <div class="qf-rail" role="group" aria-label="فیلتر سریع">${qf.map(([k, l, on]) => `<button class="chip" aria-pressed="${!!on}" onclick="exQf('${k}')">${l}</button>`).join('')}</div>`);
      const rail = host.querySelector(':scope > .rail');
      if (rail) { const q = host.querySelector('.qf-rail'); [...rail.querySelectorAll('.chip')].filter((b) => !/^s*همه/.test(b.textContent)).forEach((b) => { const m = (b.getAttribute('onclick') || '').match(/S.roleF='(w+)'/); if (m) b.setAttribute('onclick', `S.roleF=S.roleF==='${m[1]}'?'all':'${m[1]}';renderExplore()`); q.appendChild(b); }); rail.remove(); }
      host.querySelectorAll('.ex-where').forEach((x) => x.remove());
    }
    return r;
  });

  // برچسب فیلترهای فعال بالای نتیجه‌ها
  wrapW('renderResults', function (prev, ...a) {
    const r = prev(...a);
    const el = $('results'); if (!el) return r;
    const tags = [];
    if (S.cat) { const c = CATS.find((x) => x[0] === S.cat); if (c) tags.push(['cat', c[2] + ' ' + c[1]]); }
    if (S.roleF && S.roleF !== 'all' && ROLES[S.roleF]) tags.push(['role', ROLES[S.roleF].n]);
    if (S.provF) tags.push(['prov', '📍 استان ' + S.provF]);
    if (S.cityF) tags.push(['cityF', '📍 ' + S.cityF]);
    if (S.qf.city) tags.push(['city', 'شهر من']);
    if (S.qf.free) tags.push(['free', modeType() === 'work' ? 'آزاد امروز' : 'شروع فوری']);
    if (S.f.verified) tags.push(['verified', 'تأییدشده']);
    if (S.f.rating) tags.push(['rating', '۴ ستاره به بالا']);
    if (!tags.length) return r;
    const head = [...el.querySelectorAll('.sec-head')].find((h) => /نتیجه|همهٔ آگهی|آگهی‌ها/.test(h.textContent));
    const html = `<div class="af-row">${tags.map(([k, l]) => `<button onclick="exClear('${k}')">${esc(l)} ×</button>`).join('')}${tags.length > 1 ? '<button class="clr" onclick="exClear()">پاک کردن همه</button>' : ''}</div>`;
    if (head) head.insertAdjacentHTML('afterend', html); else el.insertAdjacentHTML('afterbegin', html);
    if (!listFor().length) {
      const em = el.querySelector('.empty');
      if (em) em.insertAdjacentHTML('beforeend', '<p style="margin:8px 0 0">با این فیلترها چیزی نیست؛ یکی از برچسب‌های بالا را بردار.</p>');
    }
    return r;
  });

  /* ---- نقشه: حباب شهرها ---- */
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
    let svg = islandSVG({ explore: true, prov: S.provF, zoom: S.provF || 'qeshm', vb, cities, me: S.auth ? myCity() : 'قشم' });
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
  // عوض شدن حالت (نیرو/کار/پرسش): دسته و شهر پاک شود
  wrapW('setMode', function (prev, m, ...a) { if (m !== S.mode) { S.cat = null; S.cityF = null; S.qf.free = false; } return prev(m, ...a); });
})();
