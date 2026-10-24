/* =====================================================================
 * hero47.js — دور ۴۷: کارت پروژهٔ خانه، طراحی تازه (بعد از hero46.js)
 *   رو: صحنهٔ زندهٔ کارگاه به عرض کارت — آسمان بر اساس ساعت واقعی (صبح/ظهر/عصر/شب با ستاره و چراغ پنجره)،
 *       ابر متحرک، کارگری که کار همان مهارت را انجام می‌دهد (چکش، غلتک، ماله، جوش، آچار، تبلت) و کاری که با پیشرفت پر می‌شود؛
 *       «جادهٔ پیشرفت» با پرچم هر کار و کلاه‌ایمنی که جلو می‌رود؛ «نگه دار تا ثبت شود» برای تیک (بدون تیک اشتباهی) و جشن.
 *   پشت (برگشتن سه‌بعدی): فهرست کار — تیک، حذف، افزودن و همهٔ کارهای پروژه، بدون ترک خانه.
 * از hero46.js: طرح مهارت‌ها و صحنهٔ هر کار (H46)، h46Act، h46Manage.
 * ===================================================================== */
(function () {
  if (!window.H46) return;
  const { themeOf, scene } = window.H46;
  const $id = (x) => document.getElementById(x);
  const r1 = (n) => Math.round(n * 10) / 10;
  S.f47 = S.f47 || {};

  /* ---------- آسمان بر اساس ساعت ---------- */
  function sky() {
    const h = new Date().getHours() + new Date().getMinutes() / 60;
    const night = h < 6 || h >= 19.5, eve = h >= 16.5 && h < 19.5, morn = h >= 6 && h < 9.5;
    const top = night ? '#0B1530' : eve ? '#7C3AED' : morn ? '#93C5FD' : '#38BDF8';
    const bot = night ? '#1E2A55' : eve ? '#FB923C' : morn ? '#FDE68A' : '#E0F2FE';
    // خورشید/ماه روی کمان آسمان
    const t = night ? ((h + 24 - 19.5) % 24) / 10.5 : (h - 6) / 13.5;
    const x = r1(300 - 280 * Math.max(0, Math.min(1, t))), y = r1(70 - 52 * Math.sin(Math.PI * Math.max(0, Math.min(1, t))));
    return { night, top, bot, x, y, label: night ? 'شب' : eve ? 'عصر' : morn ? 'صبح' : 'روز' };
  }

  /* ---------- کارگر هر مهارت ---------- */
  const TOOL = { rebar: 'hammer', form: 'hammer', build: 'hammer', demo: 'sledge', cabinet: 'drill', window: 'drill', paint: 'roller', mason: 'trowel', tile: 'trowel', stone: 'trowel', drywall: 'trowel', concrete: 'trowel', insul: 'trowel', weld: 'torch', plumb: 'wrench', elec: 'wrench', design: 'tablet' };
  function worker(k, A, cel) {
    const tool = TOOL[k] || 'hammer';
    const T = {
      hammer: `<g class="w47-arm sw"><line x1="0" y1="0" x2="16" y2="-6" stroke="#F4C7A1" stroke-width="5" stroke-linecap="round"/><line x1="16" y1="-6" x2="24" y2="-20" stroke="#78350F" stroke-width="3"/><rect x="18" y="-26" width="14" height="7" rx="1.5" fill="#94A3B8"/></g>`,
      sledge: `<g class="w47-arm sw2"><line x1="0" y1="0" x2="16" y2="-8" stroke="#F4C7A1" stroke-width="5" stroke-linecap="round"/><line x1="16" y1="-8" x2="30" y2="-30" stroke="#78350F" stroke-width="3.5"/><rect x="25" y="-38" width="16" height="10" rx="2" fill="#64748B"/></g>`,
      drill: `<g class="w47-arm vib"><line x1="0" y1="0" x2="16" y2="-4" stroke="#F4C7A1" stroke-width="5" stroke-linecap="round"/><rect x="14" y="-10" width="16" height="9" rx="2" fill="${A}"/><line x1="30" y1="-6" x2="38" y2="-6" stroke="#CBD5E1" stroke-width="2"/></g>`,
      roller: `<g class="w47-arm ud"><line x1="0" y1="0" x2="14" y2="-14" stroke="#F4C7A1" stroke-width="5" stroke-linecap="round"/><line x1="14" y1="-14" x2="24" y2="-36" stroke="#CBD5E1" stroke-width="2.5"/><rect x="20" y="-46" width="18" height="10" rx="4" fill="${A}"/></g>`,
      trowel: `<g class="w47-arm fb"><line x1="0" y1="0" x2="18" y2="2" stroke="#F4C7A1" stroke-width="5" stroke-linecap="round"/><path d="M18 -2 l14 2 l-6 8 z" fill="#CBD5E1"/></g>`,
      torch: `<g class="w47-arm"><line x1="0" y1="0" x2="18" y2="-2" stroke="#F4C7A1" stroke-width="5" stroke-linecap="round"/><line x1="18" y1="-2" x2="30" y2="-8" stroke="#475569" stroke-width="3"/><g class="w47-spark"><circle cx="33" cy="-10" r="3" fill="#FDE68A"/><circle cx="38" cy="-15" r="1.4" fill="#fff"/><circle cx="36" cy="-4" r="1.2" fill="#FDBA74"/><circle cx="41" cy="-9" r="1" fill="#fff"/></g></g>`,
      wrench: `<g class="w47-arm tw"><line x1="0" y1="0" x2="16" y2="-6" stroke="#F4C7A1" stroke-width="5" stroke-linecap="round"/><path d="M16 -6 l10 -6 m0 0 l3 -4 m-3 4 l4 1" stroke="#94A3B8" stroke-width="3" stroke-linecap="round" fill="none"/></g>`,
      tablet: `<g class="w47-arm"><line x1="0" y1="0" x2="12" y2="-8" stroke="#F4C7A1" stroke-width="5" stroke-linecap="round"/><rect x="10" y="-22" width="16" height="20" rx="2" fill="#1E293B" stroke="${A}" stroke-width="1.5"/><path class="w47-pen" d="M13 -16 h8 M13 -12 h6 M13 -8 h9" stroke="${A}" stroke-width="1.2"/></g>`,
    }[tool];
    // کارگر: کلاه ایمنی به رنگ مهارت، جلیقهٔ شب‌رنگ
    return `<g class="w47 ${cel ? 'jump' : ''}" transform="translate(112 128)">
      <ellipse cx="2" cy="1" rx="16" ry="3" fill="rgba(0,0,0,.25)"/>
      <g class="w47-body">
        <rect x="-6" y="-22" width="6" height="22" rx="2" fill="#334155"/><rect x="2" y="-22" width="6" height="22" rx="2" fill="#334155" class="w47-leg"/>
        <rect x="-8" y="-46" width="18" height="26" rx="5" fill="#F97316"/><rect x="-8" y="-38" width="18" height="3" fill="#FDE68A"/><rect x="-8" y="-30" width="18" height="3" fill="#FDE68A"/>
        <circle cx="1" cy="-54" r="8" fill="#F4C7A1"/><path d="M-9 -55 a10 9 0 0 1 20 0 z" fill="${A}"/><rect x="-11" y="-56" width="24" height="3" rx="1.5" fill="${A}"/>
        <circle cx="4" cy="-53" r="1.2" fill="#1F2937"/>
        <g transform="translate(6 -40)">${T}</g>
      </g></g>`;
  }

  /* ---------- صحنهٔ کامل کارگاه ---------- */
  function site(k, pct, A, cel) {
    const s = sky(), P = pct / 100;
    const stars = s.night ? Array.from({ length: 14 }, (_, j) => `<circle class="w47-star" style="animation-delay:${(j % 7) * 300}ms" cx="${(j * 53) % 310 + 5}" cy="${(j * 29) % 60 + 6}" r="${j % 3 ? 0.9 : 1.4}" fill="#fff"/>`).join('') : '';
    const orb = s.night
      ? `<circle cx="${s.x}" cy="${s.y}" r="11" fill="#F1F5F9"/><circle cx="${s.x + 5}" cy="${s.y - 3}" r="10" fill="${s.top}"/>`
      : `<circle class="w47-sun" cx="${s.x}" cy="${s.y}" r="13" fill="#FDE047"/><circle cx="${s.x}" cy="${s.y}" r="20" fill="#FDE047" opacity=".18"/>`;
    const clouds = [[20, 22, 1], [150, 14, 0.8], [240, 30, 1.1]].map(([x, y, sc], j) => `<g class="w47-cloud" style="animation-duration:${38 + j * 14}s;animation-delay:-${j * 9}s"><g transform="translate(${x} ${y}) scale(${sc})" opacity="${s.night ? 0.25 : 0.85}"><ellipse cx="0" cy="0" rx="18" ry="7" fill="#fff"/><ellipse cx="10" cy="-5" rx="11" ry="8" fill="#fff"/><ellipse cx="-9" cy="-3" rx="9" ry="6" fill="#fff"/></g></g>`).join('');
    // شهر دور
    const city = [[0, 52, 30], [32, 40, 22], [56, 62, 26], [84, 46, 20], [270, 50, 24], [296, 38, 24]].map(([x, h, w]) => `<rect x="${x}" y="${128 - h}" width="${w}" height="${h}" fill="${s.night ? '#0F1A3A' : 'rgba(15,23,42,.18)'}"/>${s.night ? `<rect x="${x + 5}" y="${132 - h}" width="4" height="4" fill="#FDE68A" class="w47-win"/><rect x="${x + 13}" y="${142 - h}" width="4" height="4" fill="#FDE68A" opacity=".7"/>` : ''}`).join('');
    // جرثقیل
    const crane = `<g opacity="${s.night ? 0.6 : 0.9}"><line x1="300" y1="128" x2="300" y2="18" stroke="#F59E0B" stroke-width="3"/><line x1="230" y1="20" x2="314" y2="20" stroke="#F59E0B" stroke-width="3"/><g class="w47-hook"><line x1="${r1(240 + 50 * P)}" y1="20" x2="${r1(240 + 50 * P)}" y2="46" stroke="#CBD5E1" stroke-width="1.2"/><rect x="${r1(235 + 50 * P)}" y="46" width="10" height="7" fill="${A}"/></g></g>`;
    const plus = cel ? `<text class="w47-plus" x="112" y="60" text-anchor="middle" font-size="16" font-weight="900" fill="#fff">+۱</text>` : '';
    return `<svg class="ph-art s47" viewBox="0 0 320 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs><linearGradient id="sky47" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.top}"/><stop offset="1" stop-color="${s.bot}"/></linearGradient></defs>
      <rect width="320" height="150" fill="url(#sky47)"/>${stars}${orb}${clouds}${city}${crane}
      <rect x="0" y="128" width="320" height="22" fill="${s.night ? '#1C1917' : '#A16207'}"/><rect x="0" y="128" width="320" height="3" fill="${s.night ? '#292524' : '#CA8A04'}"/>
      <rect x="146" y="6" width="170" height="124" rx="12" fill="rgba(15,23,42,.42)"/><rect x="146" y="6" width="170" height="124" rx="12" fill="none" stroke="rgba(255,255,255,.18)"/>
      <g transform="translate(151 9) scale(.98)">${scene(k, pct, A)}</g>
      ${worker(k, A, cel)}${plus}
    </svg>`;
  }

  /* ---------- آیکون‌ها ---------- */
  const ICO = {
    daily: '<path d="M8 4h8l3 3v13H5V4z"/><path d="M8 11h8M8 15h5"/>',
    sov: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    pay: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 15h2"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
    more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    flip: '<path d="M4 12a8 8 0 0 1 14-5l2-2v6h-6l2.5-2.5A5.5 5.5 0 0 0 6.5 12"/><path d="M20 12a8 8 0 0 1-14 5l-2 2v-6h6l-2.5 2.5A5.5 5.5 0 0 0 17.5 12"/>',
  };
  const ic = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICO[k]}</svg>`;

  /* ---------- کارت ---------- */
  window.slideHTML46 = function (p, i) {
    const w = p.who && person(p.who), inf = projInfo(p), th = themeOf(p), [k, , tname, A, deep] = th;
    const prov = isProvider(p), id = p._id || 'd' + i, flipped = !!S.f47[id];
    const pct = inf.pct != null ? inf.pct : p.stage >= 2 ? 50 : 0;
    const next = inf.steps.find((s) => !s.done), nextK = inf.steps.indexOf(next);
    const cel = S.cel46 && S.cel46.i === i && Date.now() - S.cel46.at < 2600;
    const late = inf.left != null && inf.left < 0;
    const days = !inf.started ? `${fa(inf.durD || 0)} روز` : inf.left == null ? '—' : late ? `${fa(-inf.left)} روز تأخیر` : `${fa(inf.left)} روز`;
    // جادهٔ پیشرفت: پرچم هر کار (حداکثر ۱۰؛ بیشتر = نمونه)
    const N = inf.steps.length, show = N > 10 ? Array.from({ length: 10 }, (_, j) => Math.round((j * (N - 1)) / 9)) : inf.steps.map((_, j) => j);
    const road = `<div class="r47" aria-label="پیشرفت ${fa(pct)} درصد">
      <div class="r47-line"><i data-p="${pct}"></i></div>
      ${show.map((j, n) => { const s = inf.steps[j]; return `<span class="r47-f ${s.done ? 'd' : j === nextK ? 'n' : ''}" style="inset-inline-start:${r1(((n + 1) / (show.length + 1)) * 100)}%" title="${esc(s.t)}"></span>`; }).join('')}
      <span class="r47-m" data-p="${pct}"><svg viewBox="0 0 24 24"><path d="M3 15a9 9 0 0 1 18 0z" fill="${A}"/><rect x="2" y="14" width="20" height="3" rx="1.5" fill="${A}"/></svg></span>
    </div><div class="ph-bar" style="display:none"><i data-w="${pct}"></i></div>`;
    // قدم بعدی
    let main = '', lbl, txt, sub = '';
    if (p.stage < 2) { lbl = 'قدم اول'; txt = 'شروع کار در کارگاه'; main = `<button class="h47-go" onclick="h46Act('stage',${i},event)">▶ شروع</button>`; }
    else if (next) { lbl = 'قدم بعدی'; txt = next.t; if (prov) main = `<button class="h47-hold" data-i="${i}" aria-label="برای ثبت «${esc(next.t)}» نگه دار"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="19" class="bg"/><circle cx="22" cy="22" r="19" class="fg"/></svg><b>✓</b></button>`; else sub = 'مجری بعد از انجام، تیک می‌زند'; }
    else if (N) { lbl = 'همهٔ کارها تمام شد'; txt = prov ? 'منتظر تأیید پایان از کارفرما' : 'کار را ببین و پایان را تأیید کن'; if (!prov && p.stage === 2) main = `<button class="h47-go" onclick="h46Act('stage',${i},event)">⚑ تأیید</button>`; }
    else { lbl = 'فهرست کار'; txt = prov ? 'کارها را ردیف کن' : 'مجری هنوز فهرست کار نساخته'; if (prov) main = `<button class="h47-go" onclick="f47Flip('${id}',event)">☰ بساز</button>`; }
    const holdHint = main.includes('h47-hold') ? '<span class="h47-hint">نگه دار تا ثبت شود</span>' : '';
    const act = (a, k2, t) => `<button class="h47-b" onclick="h46Act('${a}',${i},event)">${ic(k2)}<small>${t}</small></button>`;
    const acts = prov ? [act('daily', 'daily', 'گزارش'), act('sov', 'sov', 'صورت‌وضعیت'), act('chat', 'chat', 'چت')] : [act('pay', 'pay', 'پرداخت'), act('sov', 'sov', 'صورت‌وضعیت'), act('chat', 'chat', 'چت')];
    // پشت کارت: فهرست کار
    const can = inf.canTick;
    const back = `<div class="h47-face h47-back">
      <div class="h47-bh"><b>فهرست کار</b><span class="num">${fa(inf.doneN)} از ${fa(N)}</span><button class="h47-ib" aria-label="برگشت به کارگاه" onclick="f47Flip('${id}',event)">${ic('flip')}</button></div>
      <div class="h47-list">${N ? inf.steps.map((s, j) => `<div class="h47-row ${s.done ? 'd' : ''}">${can ? `<button class="h47-ck" aria-pressed="${!!s.done}" onclick="f47Tick(${i},${j},event)">${s.done ? '✓' : ''}</button>` : `<span class="h47-ck ro">${s.done ? '✓' : ''}</span>`}<span class="t">${esc(s.t)}</span>${can ? `<button class="h47-x" aria-label="حذف" onclick="f47Del(${i},${j},event)">✕</button>` : ''}</div>`).join('') : `<p class="h47-empty">${can ? 'اولین کار را بنویس؛ مثلاً «واحد ۱» یا «فونداسیون».' : 'مجری هنوز فهرست کار نساخته.'}</p>`}</div>
      ${can ? `<div class="h47-add" onclick="event.stopPropagation()"><input id="f47In${i}" maxlength="60" placeholder="کار تازه…" onkeydown="if(event.key==='Enter')f47Add(${i},event)"><button onclick="f47Add(${i},event)">افزودن</button><button class="tpl" onclick="h46Act('list',${i},event)">الگو</button></div>` : ''}
      <button class="h47-more" onclick="h46Act('manage',${i},event)">${ic('more')} همهٔ کارهای پروژه</button>
    </div>`;
    return `<div class="hcard ph-hero ph-slide h46 h47 ${flipped ? 'flipped' : ''} ${cel ? 'cel' : ''}" data-i="${i}" data-k="${k}" data-id="${id}" style="--a:${A};--deep:${deep}">
      <div class="h47-in">
        <div class="h47-face h47-front">
          <div class="h47-scene" role="button" tabindex="0" onclick="openProjPage(${i})">${site(k, pct, A, cel)}
            <div class="h47-top"><span class="h47-skill">${tname}</span><button class="h47-ib" aria-label="فهرست کار" onclick="f47Flip('${id}',event)">${ic('list')}</button></div>
            <div class="h47-pct"><b class="num">${fa(pct)}٪</b><small>${N ? `${fa(inf.doneN)}/${fa(N)}` : ''}</small></div>
          </div>
          <div class="h47-main">
            <div class="h47-title" role="button" tabindex="0" onclick="openProjPage(${i})"><h2>${esc(p.t)}</h2><small>${w ? (prov ? 'کارفرما: ' : 'مجری: ') + esc(w.name) : ''}</small></div>
            ${road}
            <div class="h47-next"><div class="t"><small>${lbl}</small><b class="ph-who">${esc(txt)}</b>${sub ? `<span>${sub}</span>` : holdHint}</div>${main}</div>
            <div class="ph-kpi h47-chips"><div><b class="num">${fa(pct)}٪</b><small>پیشرفت</small></div><div><b class="num">${inf.total ? moneyM(inf.paid) : '—'}</b><small>${inf.total ? `${prov ? 'دریافت' : 'پرداخت'} از ${moneyM(inf.total)}` : 'پرداخت'}</small></div><div class="${late ? 'late' : ''}"><b class="num">${days}</b><small>${!inf.started ? 'مدت' : late ? 'تأخیر' : 'مانده'}</small></div></div>
            <div class="h47-acts">${acts.join('')}<button class="h47-b" onclick="h46Act('manage',${i},event)">${ic('more')}<small>بیشتر</small></button></div>
          </div>
          ${cel ? `<div class="h46-conf" aria-hidden="true">${Array.from({ length: 18 }, (_, j) => `<i style="--x:${(j * 37) % 100}%;--d:${(j % 6) * 60}ms;--c:${['#F2B53A', '#22C55E', A, '#fff', '#F472B6'][j % 5]}"></i>`).join('')}</div>` : ''}
        </div>
        ${back}
      </div>
    </div>`;
  };

  // جادهٔ پیشرفت: بعد از نمایش، کلاه و خط تا درصد واقعی جلو می‌روند
  const prevHome = window.renderHome;
  window.renderHome = function (...a) {
    const r = prevHome.apply(this, a);
    requestAnimationFrame(() => requestAnimationFrame(() => document.querySelectorAll('#phHero .r47 [data-p]').forEach((x) => { if (x.classList.contains('r47-m')) x.style.insetInlineStart = x.dataset.p + '%'; else x.style.width = x.dataset.p + '%'; })));
    return r;
  };

  /* ---------- برگرداندن کارت و فهرست کار پشت آن ---------- */
  window.f47Flip = (id, ev) => {
    if (ev) ev.stopPropagation();
    S.f47[id] = !S.f47[id];
    const el = document.querySelector(`.h47[data-id="${id}"]`);
    if (el) el.classList.toggle('flipped', !!S.f47[id]);
    if (S.f47[id]) setTimeout(() => { const n = el && el.querySelector('.h47-add input'); if (n && !el.querySelector('.h47-row')) n.focus(); }, 600);
  };
  const stepsOf = (i) => { const p = (S.projs[S.role] || [])[i]; return p ? projInfo(p).steps.map((s) => ({ ...s })) : []; };
  window.f47Tick = (i, j, ev) => { if (ev) ev.stopPropagation(); pgTick(i, j); };
  window.f47Del = (i, j, ev) => { if (ev) ev.stopPropagation(); const L = stepsOf(i); const t = L[j] && L[j].t; L.splice(j, 1); window.pgSave(i, L); if (t) toast(`«${t}» از فهرست برداشته شد`); };
  window.f47Add = (i, ev) => {
    if (ev) ev.stopPropagation();
    const inp = $id('f47In' + i), v = (inp && inp.value.trim()) || '';
    if (!v) { if (inp) inp.focus(); return; }
    const L = stepsOf(i);
    if (L.some((s) => s.t === v)) { toast('این کار در فهرست هست'); return; }
    L.push({ t: v.slice(0, 60), done: false, at: null });
    window.pgSave(i, L.slice(0, 30));
    setTimeout(() => { const n = $id('f47In' + i); if (n) n.focus(); }, 120);
  };

  /* ---------- «نگه دار تا ثبت شود» ---------- */
  const HOLD = 750;
  let holdT = 0, holdEl = null;
  const stopHold = () => { clearTimeout(holdT); if (holdEl) holdEl.classList.remove('holding'); holdEl = null; };
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest && e.target.closest('.h47-hold'); if (!b) return;
    e.stopPropagation();
    stopHold(); holdEl = b; b.classList.add('holding');
    if (navigator.vibrate) try { navigator.vibrate(8); } catch (x) {}
    holdT = setTimeout(() => { const i = +b.dataset.i; stopHold(); h46Act('tick', i); }, HOLD);
  }, true);
  // زود رها شد ← راهنما؛ انگشت از دکمه بیرون رفت یا لمس لغو شد ← بی‌صدا لغو
  document.addEventListener('pointerup', () => { if (holdEl) { stopHold(); toast('برای ثبت، دکمه را کمی نگه دار'); } }, true);
  ['pointercancel', 'pointerleave'].forEach((t) => document.addEventListener(t, (e) => { if (holdEl && (t === 'pointercancel' || e.target === holdEl)) stopHold(); }, true));
  document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('.h47-hold'); if (b) e.stopPropagation(); }, true);
  document.addEventListener('keydown', (e) => { const b = document.activeElement; if (b && b.classList && b.classList.contains('h47-hold') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); h46Act('tick', +b.dataset.i); } });

  /* ---------- طراحی ---------- */
  const css = document.createElement('style');
  css.textContent = `
  .ph-slide.h47{padding:0;background:none;box-shadow:none;perspective:1400px;overflow:visible;min-height:0}
  .h47-in{display:grid;transition:transform .75s cubic-bezier(.3,1.2,.4,1);transform-style:preserve-3d}
  .h47.flipped .h47-in{transform:rotateY(180deg)}
  .h47-face{grid-area:1/1;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:24px;overflow:hidden;background:linear-gradient(170deg,var(--deep),#0B1412 70%);color:#fff;box-shadow:0 14px 36px rgba(0,0,0,.28);position:relative}
  .h47-back{transform:rotateY(180deg);padding:14px;display:flex;flex-direction:column}
  .h47-scene{position:relative;height:178px;cursor:pointer}
  .h47-scene .s47{position:absolute;inset:0;width:100%!important;height:100%!important}
  .h47-scene::after{content:"";position:absolute;inset:auto 0 0 0;height:46px;background:linear-gradient(transparent,var(--deep))}
  .h47-top{position:absolute;inset:10px 10px auto 10px;display:flex;justify-content:space-between;align-items:center;z-index:2}
  .h47-skill{font-size:12px;font-weight:800;color:#111;background:var(--a);padding:5px 11px;border-radius:20px;box-shadow:0 4px 12px rgba(0,0,0,.25)}
  .h47-ib{width:36px;height:36px;border-radius:12px;border:1px solid rgba(255,255,255,.35);background:rgba(15,23,42,.45);backdrop-filter:blur(6px);color:#fff;display:grid;place-items:center;cursor:pointer;padding:0}
  .h47-ib svg,.h47-b svg,.h47-more svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
  .h47-pct{position:absolute;inset-inline-start:12px;bottom:12px;z-index:2;display:flex;align-items:baseline;gap:6px;text-shadow:0 2px 8px rgba(0,0,0,.5)}
  .h47-pct b{font-size:28px;font-weight:900}.h47-pct small{font-size:12px;color:#e2e8f0}
  .h47-main{padding:4px 14px 12px}
  .h47-title{cursor:pointer}.h47-title h2{font-size:18px;margin:0;line-height:1.5;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.h47-title small{color:#cbd5e1;font-size:12.5px}
  .r47{position:relative;height:30px;margin:10px 6px 4px}
  .r47-line{position:absolute;inset:13px 0 auto 0;height:5px;border-radius:3px;background:rgba(255,255,255,.14);overflow:hidden}
  .r47-line i{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,var(--a),#fff);width:0;transition:width 1.2s cubic-bezier(.3,1,.4,1)}
  .r47-f{position:absolute;top:9px;width:13px;height:13px;margin-inline-start:-6px;border-radius:50%;background:#1f2937;border:2px solid rgba(255,255,255,.35)}
  .r47-f.d{background:var(--a);border-color:var(--a)}
  .r47-f.n{border-color:var(--a);box-shadow:0 0 0 0 var(--a);animation:r47Ping 1.6s infinite}
  @keyframes r47Ping{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--a) 70%,transparent)}100%{box-shadow:0 0 0 9px transparent}}
  .r47-m{position:absolute;top:-6px;inset-inline-start:0;width:24px;height:24px;margin-inline-start:-12px;transition:inset-inline-start 1.2s cubic-bezier(.3,1,.4,1);filter:drop-shadow(0 2px 4px rgba(0,0,0,.5))}
  .r47-m svg{width:24px;height:24px}
  .h47-next{display:flex;align-items:center;gap:10px;margin-top:8px;padding:10px 12px;border-radius:18px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1)}
  .h47-next .t{flex:1;min-width:0}.h47-next small{display:block;font-size:11.5px;color:var(--a);font-weight:800}
  .h47-next b{display:block;font-size:15.5px;line-height:1.6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .h47-next span{display:block;font-size:11.5px;color:#94a3b8}.h47-hint{color:#cbd5e1!important}
  .h47-go{flex:none;border:0;border-radius:16px;min-height:46px;padding:0 16px;font:800 14px/1 inherit;font-family:inherit;color:#111;background:var(--a);cursor:pointer;box-shadow:0 8px 20px color-mix(in srgb,var(--a) 40%,transparent)}
  .h47-hold{flex:none;position:relative;width:58px;height:58px;border:0;border-radius:50%;background:var(--a);color:#111;cursor:pointer;padding:0;touch-action:none;-webkit-user-select:none;user-select:none;box-shadow:0 8px 22px color-mix(in srgb,var(--a) 45%,transparent);animation:h47Breath 2.4s ease-in-out infinite}
  .h47-hold svg{position:absolute;inset:-5px;width:68px;height:68px;transform:rotate(-90deg)}
  .h47-hold circle{fill:none;stroke-width:4}.h47-hold .bg{stroke:rgba(255,255,255,.18)}
  .h47-hold .fg{stroke:#fff;stroke-dasharray:120;stroke-dashoffset:120;stroke-linecap:round}
  .h47-hold.holding{animation:none;transform:scale(.92)}.h47-hold.holding .fg{transition:stroke-dashoffset ${HOLD}ms linear;stroke-dashoffset:0}
  .h47-hold b{font-size:24px;font-weight:900}
  @keyframes h47Breath{50%{transform:scale(1.06)}}
  .h47-chips{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px}
  .h47-chips>div{background:rgba(255,255,255,.05);border-radius:12px;padding:7px 8px}.h47-chips b{display:block;font-size:13.5px}.h47-chips small{display:block;font-size:10.5px;color:#94a3b8}.h47-chips .late b{color:#FCA5A5}
  .h47-acts{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}
  .h47-b{border:0;border-radius:14px;background:rgba(255,255,255,.07);color:#e2e8f0;display:flex;flex-direction:column;align-items:center;gap:3px;padding:9px 0 7px;font-family:inherit;cursor:pointer}
  .h47-b:active{transform:scale(.94);background:rgba(255,255,255,.12)}.h47-b small{font-size:11px}
  .h47-bh{display:flex;align-items:center;gap:8px;margin-bottom:10px}.h47-bh b{font-size:16px}.h47-bh span{font-size:12px;color:#94a3b8;margin-inline-end:auto}
  .h47-list{display:grid;gap:6px;max-height:300px;overflow:auto;flex:1}
  .h47-row{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:12px;background:rgba(255,255,255,.06);animation:h47In .35s both}
  .h47-row .t{flex:1;font-size:14px}.h47-row.d .t{color:#94a3b8;text-decoration:line-through}
  @keyframes h47In{from{opacity:0;transform:translateY(6px)}}
  .h47-ck{flex:none;width:30px;height:30px;border-radius:10px;border:2px solid var(--a);background:none;color:#111;font-weight:900;cursor:pointer;display:grid;place-items:center;padding:0;transition:background .2s,transform .2s}
  .h47-ck[aria-pressed=true],.h47-row.d .h47-ck{background:var(--a)}.h47-ck:active{transform:scale(.85)}.h47-ck.ro{border-color:rgba(255,255,255,.3);color:var(--a)}
  .h47-x{border:0;background:none;color:#94a3b8;font-size:15px;min-width:30px;min-height:30px;cursor:pointer}
  .h47-empty{color:#cbd5e1;font-size:13.5px;margin:6px 2px}
  .h47-add{display:flex;gap:6px;margin-top:10px}.h47-add input{flex:1;min-width:0;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#fff;padding:0 12px;min-height:44px;font:inherit;-webkit-user-select:text;user-select:text}
  .h47-add button{border:0;border-radius:12px;padding:0 14px;background:var(--a);color:#111;font:800 13px inherit;font-family:inherit;cursor:pointer}.h47-add .tpl{background:rgba(255,255,255,.1);color:#fff}
  .h47-more{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:10px;border:1px solid rgba(255,255,255,.15);background:none;color:#e2e8f0;border-radius:12px;min-height:42px;font:inherit;cursor:pointer}
  /* صحنه */
  .w47-cloud{animation:w47Cloud linear infinite}@keyframes w47Cloud{from{transform:translateX(-60px)}to{transform:translateX(340px)}}
  .w47-sun{animation:w47Sun 4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes w47Sun{50%{transform:scale(1.08)}}
  .w47-star{animation:w47Tw 2.2s ease-in-out infinite}@keyframes w47Tw{50%{opacity:.2}}
  .w47-win{animation:w47Tw 3.4s ease-in-out infinite}
  .w47-hook{animation:w47Hook 3s ease-in-out infinite}@keyframes w47Hook{50%{transform:translateY(8px)}}
  .w47-body{animation:w47Bob 1.4s ease-in-out infinite}@keyframes w47Bob{50%{transform:translateY(-1.5px)}}
  .w47-arm{transform-box:fill-box;transform-origin:0 50%}
  .w47-arm.sw{animation:w47Sw .7s ease-in-out infinite}@keyframes w47Sw{0%,100%{transform:rotate(-30deg)}50%{transform:rotate(25deg)}}
  .w47-arm.sw2{animation:w47Sw2 1s ease-in-out infinite}@keyframes w47Sw2{0%,100%{transform:rotate(-45deg)}55%{transform:rotate(30deg)}}
  .w47-arm.ud{animation:w47Ud 1.1s ease-in-out infinite}@keyframes w47Ud{50%{transform:translateY(14px) rotate(8deg)}}
  .w47-arm.fb{animation:w47Fb .9s ease-in-out infinite}@keyframes w47Fb{50%{transform:translateX(6px) rotate(-10deg)}}
  .w47-arm.tw{animation:w47Tw2 .8s ease-in-out infinite}@keyframes w47Tw2{50%{transform:rotate(-25deg)}}
  .w47-arm.vib{animation:w47Vib .12s linear infinite}@keyframes w47Vib{50%{transform:translateX(1px)}}
  .w47-spark{animation:w47Sp .25s steps(2) infinite}@keyframes w47Sp{50%{opacity:.15}}
  .w47-pen{stroke-dasharray:30;animation:w47Pen 2s linear infinite}@keyframes w47Pen{from{stroke-dashoffset:30}to{stroke-dashoffset:0}}
  .w47.jump .w47-body{animation:w47Jump .6s cubic-bezier(.3,1.6,.5,1) 2}@keyframes w47Jump{50%{transform:translateY(-16px)}}
  .w47-plus{animation:w47Plus 1.4s ease-out both}@keyframes w47Plus{from{transform:translateY(0);opacity:1}to{transform:translateY(-30px);opacity:0}}
  .h47.cel .h47-pct b{animation:h46Pop .6s both}
  @media (prefers-reduced-motion:reduce){.h47 *{animation:none!important;transition:none!important}.h47-in{transition:none}}`;
  document.head.appendChild(css);

  if (typeof I18N === 'object') {
    Object.assign(I18N.dict, {
      'نگه دار تا ثبت شود': 'Hold to confirm', 'برای ثبت، دکمه را کمی نگه دار': 'Hold the button a moment to confirm', 'برای ثبت «{@}» نگه دار': 'Hold to confirm “{@}”',
      'شروع کار در کارگاه': 'Start work on site', '▶ شروع': '▶ Start', '⚑ تأیید': '⚑ Confirm', '☰ بساز': '☰ Create', 'کارها را ردیف کن': 'List the tasks',
      'منتظر تأیید پایان از کارفرما': 'Waiting for the employer to confirm', 'کار را ببین و پایان را تأیید کن': 'Check the work and confirm completion',
      'گزارش': 'Report', 'بیشتر': 'More', 'مدت': 'Length', 'مانده': 'Left', 'تأخیر': 'Late', '{#} روز': '{#} days', '{#} روز تأخیر': '{#} days late',
      'برگشت به کارگاه': 'Back to the site', 'اولین کار را بنویس؛ مثلاً «واحد ۱» یا «فونداسیون».': 'Write the first task; e.g. “Unit 1” or “Foundation”.',
      'کار تازه…': 'New task…', 'الگو': 'Template', 'همهٔ کارهای پروژه': 'All project actions', '«{@}» از فهرست برداشته شد': '“{@}” removed from the list',
    });
    I18N.re = null;
  }
})();
