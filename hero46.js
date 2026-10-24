/* =====================================================================
 * hero46.js — دور ۴۶: کارت بزرگ پروژه در خانه (بعد از work.js)
 *   هر مهارت طرح، رنگ و انیمیشن خودش (آرماتور، قالب، بتن، بنایی، کاشی، سنگ، برق، لوله‌کشی، نقاشی، کناف،
 *   جوشکاری، عایق، پنجره، کابینت، تخریب، طراحی/نظارت، ساخت) — صحنه با پیشرفت کار پر می‌شود.
 *   یک جملهٔ روشن «قدم بعدی» با یک دکمهٔ بزرگ (تیک، شروع، تأیید پایان)، ۴ دکمهٔ ساده، و برگهٔ «مدیریت پروژه»
 *   (ویرایش مستقیم فهرست کار: تیک، حذف، افزودن، الگو + همهٔ کارهای پروژه).
 * work.js: slideHTML اگر window.slideHTML46 باشد، از این‌جا می‌خواند.
 * ===================================================================== */
(function () {
  const $id = (x) => document.getElementById(x);
  const en = () => !!(S.prefs && S.prefs.lang === 'en');

  /* ---------- طرح هر مهارت ---------- */
  // [کلید، الگو، نام، رنگ اصلی، رنگ تیره]
  const THEMES = [
    ['rebar', /آرماتور|میلگرد|خاموت/, 'آرماتوربندی', '#F97316', '#3B1708'],
    ['form', /قالب/, 'قالب‌بندی', '#EAB308', '#2E2508'],
    ['concrete', /بتن/, 'بتن‌ریزی', '#94A3B8', '#1A2230'],
    ['weld', /جوش|سوله|اسکلت فلزی|نرده|خرپا/, 'جوشکاری و اسکلت فلزی', '#60A5FA', '#0C1B33'],
    ['tile', /کاشی|سرامیک|پرسلان|موزاییک/, 'کاشی و سرامیک', '#2DD4BF', '#082826'],
    ['stone', /سنگ|نما/, 'سنگ‌کاری و نما', '#D6B48A', '#2A2016'],
    ['elec', /برق|سیم|تابلو|روشنایی|آیفون/, 'برق‌کاری', '#FACC15', '#2A2405'],
    ['plumb', /لوله|تأسیسات|گاز|پکیج|فاضلاب|موتورخانه|رادیاتور/, 'لوله‌کشی و تأسیسات', '#38BDF8', '#062236'],
    ['paint', /نقاش|رنگ|کاغذ ?دیواری|بتونه/, 'نقاشی ساختمان', '#F472B6', '#2E0C1E'],
    ['drywall', /کناف|سقف کاذب|گچ/, 'گچ‌کاری و کناف', '#E5E7EB', '#1C1F24'],
    ['insul', /ایزوگام|عایق|آب‌بندی|قیرگونی/, 'عایق‌کاری', '#A3E635', '#18240A'],
    ['window', /پنجره|UPVC|دوجداره|شیشه/, 'درب و پنجره', '#7DD3FC', '#0B2030'],
    ['cabinet', /کابینت|MDF|کمد/, 'کابینت و MDF', '#FB923C', '#2B160A'],
    ['demo', /تخریب|نخاله/, 'تخریب', '#F87171', '#2C0E0E'],
    ['design', /نقشه|طراحی|محاسب|نظارت|ناظر|متره|مهندس|پروانه/, 'طراحی و نظارت', '#818CF8', '#14163A'],
    ['mason', /بنا|دیوار|آجر|بلوک|تیغه|لیکا/, 'بنایی و دیوارچینی', '#FB7185', '#2E0F14'],
    ['build', /./, 'ساخت و ساز', '#F2B53A', '#1B1708'],
  ];
  function themeOf(p) {
    const x = p._x || {};
    const txt = [p.t, p.deal && p.deal.job, x.title, x.quantity, p.amt].filter(Boolean).join(' ');
    return THEMES.find((t) => t[1].test(txt)) || THEMES[THEMES.length - 1];
  }

  /* ---------- صحنهٔ متحرک هر مهارت (۰ تا ۱۰۰٪) ---------- */
  const f = (n) => Math.round(n * 10) / 10;
  function scene(k, pct, c) {
    const P = Math.max(0, Math.min(100, pct)) / 100;
    const g = (n) => Math.round(n * P);
    const A = c, dim = 'rgba(255,255,255,.12)', soft = 'rgba(255,255,255,.28)';
    switch (k) {
      case 'tile': {
        let s = ''; const n = 24, d = g(n);
        for (let j = 0; j < n; j++) { const x = 20 + (j % 6) * 20, y = 18 + Math.floor(j / 6) * 20; s += `<rect x="${x}" y="${y}" width="18" height="18" rx="2" fill="${j < d ? A : dim}" ${j < d ? `class="h46-pop" style="animation-delay:${j * 45}ms"` : ''}/>`; }
        return s + (d < n ? `<rect x="${20 + (d % 6) * 20}" y="${18 + Math.floor(d / 6) * 20}" width="18" height="18" rx="2" fill="none" stroke="${A}" stroke-dasharray="3 2" class="h46-blink"/>` : '');
      }
      case 'rebar': {
        let s = ''; const v = 8, h = 5, tot = v + h, d = g(tot);
        for (let j = 0; j < v; j++) s += `<line x1="${22 + j * 16}" y1="16" x2="${22 + j * 16}" y2="100" stroke="${j < d ? A : dim}" stroke-width="3" stroke-linecap="round" ${j < d ? `class="h46-draw" style="animation-delay:${j * 60}ms"` : ''}/>`;
        for (let j = 0; j < h; j++) { const on = v + j < d; s += `<line x1="16" y1="${24 + j * 18}" x2="144" y2="${24 + j * 18}" stroke="${on ? A : dim}" stroke-width="3" stroke-linecap="round" ${on ? `class="h46-draw" style="animation-delay:${(v + j) * 60}ms"` : ''}/>`; }
        return s + (P > 0 ? Array.from({ length: Math.min(12, g(30)) }, (_, j) => `<circle cx="${22 + (j % 8) * 16}" cy="${24 + Math.floor(j / 8) * 18}" r="2.6" fill="#fff" opacity=".8"/>`).join('') : '');
      }
      case 'form': {
        let s = ''; const n = 6, d = g(n);
        for (let j = 0; j < n; j++) { const x = 16 + j * 22; s += `<rect x="${x}" y="${j < d ? 30 : 70}" width="16" height="${j < d ? 72 : 32}" rx="1.5" fill="${j < d ? A : dim}" ${j < d ? `class="h46-rise" style="animation-delay:${j * 90}ms"` : ''}/><line x1="${x - 3}" y1="40" x2="${x - 3}" y2="102" stroke="${soft}" stroke-width="1.5"/>`; }
        return s + `<rect x="10" y="102" width="140" height="6" rx="2" fill="${soft}"/>`;
      }
      case 'concrete': {
        const lvl = 96 - f(60 * P);
        return `<path d="M18 36 V100 H142 V36" fill="none" stroke="${soft}" stroke-width="4"/><rect x="20" y="${lvl}" width="120" height="${f(98 - lvl)}" fill="${A}" opacity=".85"/>
          <path class="h46-wave" d="M20 ${lvl} q15 -5 30 0 t30 0 t30 0 t30 0" fill="none" stroke="#fff" stroke-width="2" opacity=".6"/>
          <g class="h46-pour"><rect x="74" y="8" width="12" height="${f(Math.max(4, lvl - 8))}" rx="3" fill="${A}" opacity=".7"/></g>`;
      }
      case 'mason': {
        let s = ''; const rows = 7, d = g(rows);
        for (let r = 0; r < rows; r++) { const y = 100 - (r + 1) * 12, off = r % 2 ? 10 : 0; for (let b = 0; b < 6; b++) { const x = 18 + off + b * 21; if (x > 128) continue; s += `<rect x="${x}" y="${y}" width="19" height="10" rx="1.5" fill="${r < d ? A : dim}" ${r < d ? `class="h46-drop" style="animation-delay:${(r * 6 + b) * 30}ms"` : ''}/>`; } }
        return s + `<rect x="12" y="100" width="136" height="5" rx="2" fill="${soft}"/>`;
      }
      case 'stone': {
        let s = ''; const n = 12, d = g(n);
        for (let j = 0; j < n; j++) { const x = 30 + (j % 3) * 34, y = 92 - Math.floor(j / 3) * 20; s += `<rect x="${x}" y="${y}" width="32" height="18" rx="1" fill="${j < d ? A : dim}" ${j < d ? `class="h46-pop" style="animation-delay:${j * 70}ms"` : ''}/>`; }
        return `<rect x="26" y="10" width="108" height="102" fill="none" stroke="${soft}" stroke-width="2"/>` + s;
      }
      case 'elec': {
        const n = 5, d = g(n);
        let s = `<path d="M20 100 V30 L80 10 L140 30 V100 Z" fill="none" stroke="${soft}" stroke-width="2.5"/><path class="h46-flow" d="M28 96 V42 H132 V96" fill="none" stroke="${A}" stroke-width="2.5" stroke-dasharray="6 6" opacity="${P ? 0.9 : 0.25}"/>`;
        for (let j = 0; j < n; j++) { const x = 36 + j * 22, on = j < d; s += `<line x1="${x}" y1="42" x2="${x}" y2="58" stroke="${soft}" stroke-width="1.5"/><circle cx="${x}" cy="64" r="7" fill="${on ? A : dim}" ${on ? `class="h46-glow" style="animation-delay:${j * 200}ms"` : ''}/>`; }
        return s + `<rect x="66" y="74" width="28" height="22" rx="3" fill="${soft}"/><path d="M78 79 l-4 7 h6 l-4 7" stroke="${A}" stroke-width="2" fill="none"/>`;
      }
      case 'plumb': {
        const lvl = 100 - f(46 * P);
        return `<path d="M16 26 H70 V60 H128" fill="none" stroke="${soft}" stroke-width="9" stroke-linecap="round"/><path class="h46-flow" d="M16 26 H70 V60 H128" fill="none" stroke="${A}" stroke-width="4" stroke-linecap="round" stroke-dasharray="5 7" opacity="${P ? 1 : 0.3}"/>
          <path d="M128 52 v14 h8 v-14" fill="${soft}"/><circle class="h46-drip" cx="132" cy="72" r="3" fill="${A}"/>
          <rect x="104" y="54" width="40" height="50" rx="5" fill="none" stroke="${soft}" stroke-width="2"/><rect x="106" y="${lvl}" width="36" height="${f(102 - lvl)}" rx="3" fill="${A}" opacity=".75"/>`;
      }
      case 'paint': {
        const w = f(110 * P);
        return `<rect x="20" y="14" width="110" height="90" rx="4" fill="${dim}"/><rect x="20" y="14" width="${w}" height="90" rx="4" fill="${A}" opacity=".9"/>
          <g class="h46-roll" style="transform-origin:${20 + w}px 50px"><rect x="${f(14 + w)}" y="40" width="12" height="30" rx="4" fill="#fff"/><line x1="${f(20 + w)}" y1="70" x2="${f(20 + w)}" y2="104" stroke="#fff" stroke-width="3"/></g>`;
      }
      case 'drywall': {
        let s = ''; const n = 8, d = g(n);
        for (let j = 0; j < n; j++) { const x = 16 + (j % 4) * 32, y = 22 + Math.floor(j / 4) * 30; s += `<rect x="${x}" y="${y}" width="30" height="28" rx="2" fill="${j < d ? A : dim}" opacity="${j < d ? 0.9 : 1}" ${j < d ? `class="h46-slide" style="animation-delay:${j * 80}ms"` : ''}/>`; }
        return `<line x1="10" y1="18" x2="150" y2="18" stroke="${soft}" stroke-width="3"/>` + s + `<rect x="14" y="88" width="132" height="4" rx="2" fill="${P > 0.5 ? '#FDE68A' : soft}" ${P > 0.5 ? 'class="h46-glow"' : ''}/>`;
      }
      case 'weld': {
        const parts = [`M20 104 V30`, `M140 104 V30`, `M20 30 L80 12 L140 30`, `M20 66 H140`, `M50 30 V104`, `M110 30 V104`, `M20 30 L50 66 L80 30 L110 66 L140 30`];
        const d = g(parts.length);
        const s = parts.map((p, j) => `<path d="${p}" fill="none" stroke="${j < d ? A : dim}" stroke-width="${j < 2 ? 5 : 3}" stroke-linejoin="round" ${j < d ? `class="h46-draw" style="animation-delay:${j * 120}ms"` : ''}/>`).join('');
        const sp = P > 0 && P < 1 ? `<g class="h46-spark"><circle cx="80" cy="12" r="3" fill="#FDE68A"/><circle cx="86" cy="8" r="1.6" fill="#fff"/><circle cx="74" cy="7" r="1.4" fill="#FDBA74"/><circle cx="84" cy="18" r="1.2" fill="#fff"/></g>` : '';
        return s + sp;
      }
      case 'insul': {
        const w = f(124 * P);
        return `<path d="M10 70 L80 26 L150 70" fill="none" stroke="${soft}" stroke-width="3"/><path d="M18 72 H142 V104 H18 Z" fill="${dim}"/>
          <rect x="18" y="62" width="${w}" height="10" rx="2" fill="${A}"/>${P < 1 ? `<circle cx="${f(22 + w)}" cy="62" r="8" fill="${A}" class="h46-roll2"/>` : ''}
          ${[30, 62, 94, 126].map((x, j) => `<line class="h46-rain" style="animation-delay:${j * 250}ms" x1="${x}" y1="6" x2="${x - 4}" y2="16" stroke="#7DD3FC" stroke-width="2" stroke-linecap="round"/>`).join('')}`;
      }
      case 'window': {
        let s = ''; const n = 4, d = g(n);
        for (let j = 0; j < n; j++) { const x = 18 + j * 32; s += `<rect x="${x}" y="24" width="28" height="64" rx="2" fill="${j < d ? 'rgba(125,211,252,.25)' : dim}" stroke="${j < d ? A : soft}" stroke-width="3"/><line x1="${x + 14}" y1="24" x2="${x + 14}" y2="88" stroke="${j < d ? A : soft}" stroke-width="2"/>${j < d ? `<rect class="h46-shine" x="${x + 2}" y="26" width="6" height="60" fill="#fff" opacity=".35"/>` : ''}`; }
        return `<rect x="10" y="14" width="140" height="84" rx="3" fill="none" stroke="${soft}" stroke-width="2"/>` + s;
      }
      case 'cabinet': {
        let s = ''; const n = 5, d = g(n);
        for (let j = 0; j < n; j++) { const x = 14 + j * 27, on = j < d; s += `<rect x="${x}" y="58" width="25" height="40" rx="2" fill="${on ? A : dim}"/><rect x="${x}" y="16" width="25" height="28" rx="2" fill="${on ? A : dim}" opacity=".85" ${on ? `class="h46-door" style="animation-delay:${j * 160}ms;transform-origin:${x}px 30px"` : ''}/><circle cx="${x + 20}" cy="78" r="1.6" fill="#fff"/>`; }
        return s + `<rect x="12" y="54" width="136" height="4" rx="1" fill="#fff" opacity=".6"/>`;
      }
      case 'demo': {
        const h = f(80 * (1 - P));
        return `<rect x="30" y="${104 - h}" width="70" height="${h}" fill="${dim}" stroke="${soft}" stroke-width="2"/><path d="M55 ${104 - h} l6 14 l-8 10 l10 12" fill="none" stroke="${A}" stroke-width="2"/>
          <g class="h46-hammer" style="transform-origin:128px 96px"><line x1="128" y1="96" x2="112" y2="${f(Math.max(30, 104 - h))}" stroke="#fff" stroke-width="4" stroke-linecap="round"/><rect x="100" y="${f(Math.max(22, 96 - h))}" width="20" height="10" rx="2" fill="${A}"/></g>
          ${P > 0 ? [0, 1, 2, 3].map((j) => `<rect class="h46-fall" style="animation-delay:${j * 220}ms" x="${44 + j * 12}" y="${f(100 - h)}" width="6" height="6" fill="${A}" opacity=".8"/>`).join('') : ''}<rect x="10" y="104" width="140" height="4" rx="2" fill="${soft}"/>`;
      }
      case 'design': {
        const lines = ['M30 90 V30 H130 V90 Z', 'M30 60 H80', 'M80 30 V90', 'M80 70 H130', 'M100 30 V70', 'M50 60 V90'];
        const d = g(lines.length);
        let s = `<rect x="14" y="14" width="132" height="92" rx="4" fill="rgba(129,140,248,.10)" stroke="${soft}"/>`;
        for (let x = 22; x < 146; x += 12) s += `<line x1="${x}" y1="14" x2="${x}" y2="106" stroke="rgba(255,255,255,.05)"/>`;
        s += lines.map((l, j) => `<path d="${l}" fill="none" stroke="${j < d ? A : dim}" stroke-width="2.5" ${j < d ? `class="h46-draw" style="animation-delay:${j * 140}ms"` : ''}/>`).join('');
        return s + (P < 1 ? `<g class="h46-pencil"><path d="M118 98 l14 -14 l4 4 l-14 14 z" fill="#FDE68A"/><path d="M118 98 l-3 7 l7 -3 z" fill="#fff"/></g>` : `<circle cx="80" cy="60" r="12" fill="${A}" class="h46-pop"/><path d="M74 60 l4 4 l8 -8" stroke="#fff" stroke-width="3" fill="none"/>`);
      }
      default: {
        let s = ''; const n = 5, d = Math.max(P > 0 ? 1 : 0, g(n));
        for (let j = 0; j < n; j++) { const y = 92 - j * 16; s += `<rect x="40" y="${y}" width="80" height="14" rx="1.5" fill="${j < d ? A : dim}" ${j < d ? `class="h46-drop" style="animation-delay:${j * 120}ms"` : ''}/>${j < d ? [0, 1, 2].map((w) => `<rect x="${50 + w * 22}" y="${y + 4}" width="12" height="6" rx="1" fill="#0B1412" opacity=".55"/>`).join('') : ''}`; }
        return s + `<line x1="128" y1="${92 - n * 16}" x2="128" y2="106" stroke="${soft}" stroke-width="3"/><line x1="128" y1="${92 - n * 16}" x2="${f(70 + 50 * P)}" y2="${92 - n * 16}" stroke="${soft}" stroke-width="3"/><line class="h46-hook" x1="${f(80 + 40 * P)}" y1="${92 - n * 16}" x2="${f(80 + 40 * P)}" y2="${f(96 - n * 16 + 14)}" stroke="${A}" stroke-width="1.5"/><rect x="20" y="106" width="120" height="4" rx="2" fill="${soft}"/>`;
      }
    }
  }

  /* ---------- برگ پروژه ---------- */
  const ring = (pct, c) => { const r = 22, L = 2 * Math.PI * r; return `<svg class="h46-ring" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="${r}" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="6"/><circle class="h46-ringv" cx="28" cy="28" r="${r}" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${f(L)}" stroke-dashoffset="${f(L)}" data-off="${f(L * (1 - pct / 100))}" transform="rotate(-90 28 28)"/></svg>`; };
  window.slideHTML46 = function (p, i) {
    const w = p.who && person(p.who), inf = projInfo(p), th = themeOf(p), [k, , tname, A, deep] = th;
    const prov = isProvider(p);
    const pct = inf.pct != null ? inf.pct : p.stage >= 2 ? 50 : 0;
    const next = inf.steps.find((s) => !s.done);
    const cel = S.cel46 && S.cel46.i === i && Date.now() - S.cel46.at < 2500;
    const late = inf.left != null && inf.left < 0;
    const daysTxt = !inf.started ? `${fa(inf.durD || 0)} روز قرارداد` : inf.left == null ? 'در حال اجرا' : late ? `${fa(-inf.left)} روز تأخیر` : `${fa(inf.left)} روز مانده`;
    const payPct = inf.total ? Math.min(100, Math.round((inf.paid / inf.total) * 100)) : 0;
    // قدم بعدی: یک جمله + یک دکمهٔ اصلی
    let nx;
    if (p.stage < 2) nx = { lbl: 'قدم اول', t: 'شروع کار در کارگاه', btn: ['stage', '▶ شروع کار'] };
    else if (next) nx = { lbl: 'قدم بعدی', t: next.t, btn: prov ? ['tick', '✓ تمام شد'] : null, hint: prov ? '' : 'مجری بعد از انجام، تیک می‌زند' };
    else if (inf.steps.length) nx = { lbl: 'همهٔ کارها تمام شد', t: prov ? 'منتظر تأیید پایان کار از کارفرما' : 'کار را ببین و پایانش را تأیید کن', btn: !prov && p.stage === 2 ? ['stage', '⚑ تأیید پایان کار'] : null };
    else nx = { lbl: 'فهرست کار', t: prov ? 'کارها را ردیف کن تا پیشرفت دیده شود' : 'مجری هنوز فهرست کار نساخته', btn: prov ? ['manage', '☰ ساخت فهرست کار'] : null };
    const chain = inf.steps.length ? `<div class="h46-chain" aria-hidden="true">${inf.steps.slice(0, 14).map((s) => `<i class="${s.done ? 'd' : ''}"></i>`).join('')}${inf.steps.length > 14 ? '<em>…</em>' : ''}</div>` : '';
    const btn = (act, ic, t) => `<button class="h46-b" onclick="h46Act('${act}',${i},event)" aria-label="${t}"><span aria-hidden="true">${ic}</span><small>${t}</small></button>`;
    const acts = prov
      ? [btn('daily', '✎', 'گزارش امروز'), btn('sov', '▤', 'صورت‌وضعیت'), btn('chat', '💬', 'چت'), btn('manage', '⋯', 'مدیریت')]
      : [btn('pay', '₮', 'ثبت پرداخت'), btn('sov', '▤', 'صورت‌وضعیت'), btn('chat', '💬', 'چت'), btn('manage', '⋯', 'مدیریت')];
    return `<div class="hcard ph-hero ph-slide h46 ${cel ? 'cel' : ''}" data-i="${i}" data-k="${k}" style="--a:${A};--deep:${deep}" role="button" tabindex="0" onclick="openProjPage(${i})">
      <div class="h46-head"><span class="h46-skill"><i></i>${tname}</span><span class="h46-stage">${p.stage < 2 ? 'منتظر شروع' : 'در حال اجرا'}</span><button class="h46-edit" aria-label="مدیریت پروژه" onclick="h46Act('manage',${i},event)">✎</button></div>
      <div class="h46-body">
        <div class="h46-t"><h2>${esc(p.t)}</h2><small>${w ? (prov ? 'کارفرما: ' : 'مجری: ') + esc(w.name) : ''}</small>
          <div class="h46-pct">${ring(pct, A)}<b class="num">${fa(pct)}٪</b><span>${inf.steps.length ? `${fa(inf.doneN)} از ${fa(inf.steps.length)} کار` : 'پیشرفت'}</span></div></div>
        <svg class="ph-art h46-art" viewBox="0 0 160 120" aria-hidden="true">${scene(k, pct, A)}</svg>
      </div>
      <div class="ph-bar h46-bar" aria-label="پیشرفت ${fa(pct)} درصد"><i data-w="${pct}"></i></div>
      ${chain}
      <div class="h46-next"><div><small>${nx.lbl}</small><b class="ph-who">${esc(nx.t)}</b>${nx.hint ? `<span>${nx.hint}</span>` : ''}</div>${nx.btn ? `<button class="h46-go" onclick="h46Act('${nx.btn[0]}',${i},event)">${nx.btn[1]}</button>` : ''}</div>
      <div class="ph-kpi h46-kpi"><div><b class="num">${fa(pct)}٪</b><small>پیشرفت</small></div><div><b class="num">${inf.total ? moneyM(inf.paid) : '—'}</b><small>${inf.total ? `${prov ? 'دریافت' : 'پرداخت'} از ${moneyM(inf.total)}` : 'پرداخت'}</small>${inf.total ? `<i class="h46-mbar"><em style="width:${payPct}%"></em></i>` : ''}</div><div class="${late ? 'late' : ''}"><b class="num">${daysTxt}</b><small>${inf.pend ? 'پرداخت منتظر تأیید' : 'زمان'}</small></div></div>
      <div class="h46-acts">${acts.join('')}</div>
      ${cel ? `<div class="h46-conf" aria-hidden="true">${Array.from({ length: 14 }, (_, j) => `<i style="--x:${(j * 37) % 100}%;--d:${(j % 5) * 60}ms;--c:${['#F2B53A', '#22C55E', A, '#fff'][j % 4]}"></i>`).join('')}</div>` : ''}
    </div>`;
  };

  /* ---------- دکمه‌ها ---------- */
  window.h46Act = function (act, i, ev) {
    if (ev) ev.stopPropagation();
    const p = (S.projs[S.role] || [])[i]; if (!p) return;
    S.pi = i;
    if (act === 'manage') return h46Manage(i);
    if (act === 'tick') {
      const inf = projInfo(p);
      if (!inf.canTick) { toast('پیشرفت کار را مجری تیک می‌زند'); return; }
      S.cel46 = { i, at: Date.now() };
      if (navigator.vibrate) try { navigator.vibrate(30); } catch (e) {}
    }
    heroAct(act, i);
  };
  // برگهٔ «مدیریت پروژه»: فهرست کار قابل ویرایش + همهٔ کارهای پروژه
  S.e46 = null;
  function h46Manage(i) {
    const p = (S.projs[S.role] || [])[i], inf = projInfo(p), th = themeOf(p);
    S.pi = i;
    if (!S.e46 || S.e46.i !== i) S.e46 = { i, items: inf.steps.map((s) => ({ ...s })), dirty: false };
    const E = S.e46, can = inf.canTick;
    const row = (s, k) => `<div class="m46-row ${s.done ? 'd' : ''}">${can ? `<button class="m46-ck" aria-pressed="${!!s.done}" onclick="m46Tog(${k})">${s.done ? '✓' : ''}</button>` : `<span class="m46-ck ro">${s.done ? '✓' : ''}</span>`}<span class="t">${esc(s.t)}</span>${can ? `<button class="m46-x" aria-label="حذف" onclick="m46Del(${k})">✕</button>` : ''}</div>`;
    const go = (fn, ic, t, sub) => `<button class="linkrow" onclick="closeSheet();${fn}"><span class="ic">${ic}</span><span>${t}${sub ? `<small style="display:block;color:var(--muted);font-size:12px">${sub}</small>` : ''}</span><small>‹</small></button>`;
    const key = S.role + ':' + i;
    sb.innerHTML = `<div class="grab"></div><h3 id="sheetTitle" style="display:flex;align-items:center;gap:8px"><span class="m46-dot" style="background:${th[3]}"></span>${esc(p.t)}</h3>
      <p class="sub">${th[2]} · ${p.stage < 2 ? 'منتظر شروع' : 'در حال اجرا'}</p>
      <div class="sec-head" style="margin:6px 0"><h3 style="font-size:15px">فهرست کار</h3>${can ? `<button onclick="closeSheet();pgEdit(${i})">از الگو</button>` : ''}</div>
      <div class="m46-list">${E.items.length ? E.items.map(row).join('') : `<p class="hint" style="margin:6px 0">${can ? 'هنوز فهرستی نیست؛ اولین کار را بنویس (مثلاً «واحد ۱» یا «فونداسیون»).' : 'مجری هنوز فهرست کار نساخته.'}</p>`}</div>
      ${can ? `<div class="m46-add"><input class="field" id="m46In" maxlength="60" placeholder="کار تازه، مثلاً کاشی حمام طبقهٔ دوم" onkeydown="if(event.key==='Enter')m46Add()"><button class="mbtn" onclick="m46Add()">افزودن</button></div>
        <button class="cta" id="m46Save" ${E.dirty ? '' : 'disabled'} onclick="m46Save()">ذخیرهٔ فهرست کار</button>` : ''}
      <div class="card" style="padding:2px 16px;margin-top:12px">
        ${p.stage < 2 ? go(`heroAct('stage',${i})`, '▶', 'شروع کار') : ''}
        ${isProvider(p) ? go(`heroAct('daily',${i})`, '✎', 'گزارش روزانه', 'کار امروز با عکس') : go(`heroAct('pay',${i})`, '₮', 'ثبت پرداخت', 'با رسید یا شمارهٔ پیگیری')}
        ${go(`heroAct('sov',${i})`, '▤', 'صورت‌وضعیت')}
        ${go(`heroAct('ctr',${i})`, '✍', 'قرارداد')}
        ${go(`heroAct('chat',${i})`, '💬', 'چت با ' + esc((p.who && person(p.who) && person(p.who).name) || 'طرف مقابل'))}
        ${!isProvider(p) && p.stage === 2 ? go(`heroAct('stage',${i})`, '⚑', 'تأیید پایان کار') : ''}
        ${go(`openProjPage(${i})`, '▦', 'صفحهٔ کامل پروژه', 'پرداخت‌ها، گزارش‌ها، فایل‌ها')}
        ${typeof pjReport === 'function' && p._live ? go(`S.pi=${i};pjReport()`, '⚠', 'مشکل یا بدقولی') : ''}
      </div>`;
    void key;
    show();
    if (typeof i18nNode === 'function' && en()) i18nNode(sb);
  }
  window.h46Manage = h46Manage;
  window.H46 = { themeOf, scene, THEMES };
  window.m46Tog = (k) => { const E = S.e46; if (!E) return; const s = E.items[k]; s.done = !s.done; s.at = s.done ? new Date().toISOString() : null; E.dirty = true; h46Manage(E.i); };
  window.m46Del = (k) => { const E = S.e46; if (!E) return; E.items.splice(k, 1); E.dirty = true; h46Manage(E.i); };
  window.m46Add = () => { const E = S.e46, v = ($id('m46In') && $id('m46In').value.trim()) || ''; if (!E || !v) return; if (E.items.some((s) => s.t === v)) { toast('این کار در فهرست هست'); return; } E.items.push({ t: v.slice(0, 60), done: false, at: null }); E.dirty = true; h46Manage(E.i); setTimeout(() => $id('m46In') && $id('m46In').focus(), 50); };
  window.m46Save = () => {
    const E = S.e46; if (!E) return;
    const items = E.items.slice(0, 30);
    S.e46 = null; closeSheet();
    window.pgSave(E.i, items);
    toast('فهرست کار ذخیره شد');
  };
  const cs0 = window.closeSheet;
  window.closeSheet = function (...a) { if (S.e46 && !S.e46.dirty) S.e46 = null; return cs0.apply(this, a); };

  /* ---------- حلقهٔ پیشرفت: بعد از نمایش پر شود ---------- */
  const wrapW = (name, fn) => { const prev = window[name]; if (typeof prev !== 'function') return; window[name] = function (...a) { return fn.call(this, prev, ...a); }; };
  wrapW('renderHome', function (prev, ...a) {
    const r = prev(...a);
    requestAnimationFrame(() => requestAnimationFrame(() => document.querySelectorAll('#phHero .h46-ringv').forEach((c) => c.setAttribute('stroke-dashoffset', c.dataset.off))));
    return r;
  });

  /* ---------- طراحی ---------- */
  const css = document.createElement('style');
  css.textContent = `
  .ph-slide.h46{background:radial-gradient(120% 90% at 0% 0%,color-mix(in srgb,var(--a) 22%,transparent),transparent 60%),linear-gradient(160deg,var(--deep),#0B1412 75%);color:#fff;padding:14px 14px 12px;border-radius:24px;position:relative;overflow:hidden;min-height:0}
  .h46-head{display:flex;align-items:center;gap:8px}
  .h46-skill{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:800;color:var(--a);background:color-mix(in srgb,var(--a) 14%,transparent);border:1px solid color-mix(in srgb,var(--a) 35%,transparent);padding:4px 10px;border-radius:20px}
  .h46-skill i{width:7px;height:7px;border-radius:50%;background:var(--a);box-shadow:0 0 0 0 var(--a);animation:h46Ping 2s infinite}
  .h46-stage{font-size:11.5px;color:#cbd5e1;margin-inline-start:auto}
  .h46-edit{width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font-size:15px;display:grid;place-items:center;cursor:pointer}
  .h46-body{display:flex;gap:6px;align-items:center;margin-top:8px}
  .h46-t{flex:1;min-width:0}.h46-t h2{font-size:18px;line-height:1.5;margin:0;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
  .h46-t>small{display:block;color:#cbd5e1;font-size:12.5px;margin-top:2px}
  .h46-pct{display:flex;align-items:center;gap:8px;margin-top:10px;position:relative}
  .h46-ring{width:52px;height:52px;flex:none}.h46-ringv{transition:stroke-dashoffset 1.2s cubic-bezier(.3,1,.4,1)}
  .h46-pct b{position:absolute;inset-inline-start:0;width:52px;text-align:center;font-size:13px}
  .h46-pct span{font-size:12.5px;color:#e2e8f0}
  .h46-art{width:150px!important;height:116px!important;flex:none}
  .h46-bar{height:6px;border-radius:4px;background:rgba(255,255,255,.12);margin-top:10px;overflow:hidden}
  .h46-bar i{display:block;height:100%;width:0;border-radius:4px;background:linear-gradient(90deg,var(--a),#fff);transition:width 1.1s cubic-bezier(.3,1,.4,1)}
  .h46-chain{display:flex;gap:4px;margin-top:8px;align-items:center}.h46-chain i{flex:1;max-width:22px;height:5px;border-radius:3px;background:rgba(255,255,255,.16)}.h46-chain i.d{background:var(--a)}.h46-chain em{font-style:normal;color:#94a3b8;font-size:11px}
  .h46-next{display:flex;align-items:center;gap:10px;margin-top:12px;padding:10px 12px;border-radius:16px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1)}
  .h46-next>div{flex:1;min-width:0}.h46-next small{display:block;font-size:11.5px;color:var(--a);font-weight:700}
  .h46-next b{display:block;font-size:15px;line-height:1.6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.h46-next span{display:block;font-size:11.5px;color:#94a3b8}
  .h46-go{flex:none;border:0;border-radius:14px;min-height:44px;padding:0 14px;font:800 14px/1 inherit;font-family:inherit;color:#111;background:var(--a);box-shadow:0 6px 18px color-mix(in srgb,var(--a) 40%,transparent);cursor:pointer;animation:h46Btn 2.6s infinite}
  .h46-go:active{transform:scale(.95)}
  .h46-kpi{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px}
  .h46-kpi>div{background:rgba(255,255,255,.05);border-radius:12px;padding:7px 8px;position:relative}
  .h46-kpi b{display:block;font-size:13.5px}.h46-kpi small{display:block;font-size:10.5px;color:#94a3b8}.h46-kpi .late b{color:#FCA5A5}
  .h46-mbar{display:block;height:3px;border-radius:2px;background:rgba(255,255,255,.12);margin-top:4px;overflow:hidden}.h46-mbar em{display:block;height:100%;background:#22C55E}
  .h46-acts{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-top:12px}
  .h46-b{border:0;background:none;color:#e2e8f0;display:flex;flex-direction:column;align-items:center;gap:4px;font-family:inherit;cursor:pointer;padding:0}
  .h46-b span{width:44px;height:44px;border-radius:15px;display:grid;place-items:center;font-size:17px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);transition:transform .15s}
  .h46-b:active span{transform:scale(.88)}.h46-b small{font-size:11px;color:#cbd5e1;white-space:nowrap}
  .h46.cel .h46-pct b,.h46.cel .h46-next{animation:h46Pop .6s both}
  .h46-conf{position:absolute;inset:0;pointer-events:none;overflow:hidden}.h46-conf i{position:absolute;top:-8px;left:var(--x);width:7px;height:11px;border-radius:2px;background:var(--c);animation:h46Conf 1.4s var(--d) both}
  @keyframes h46Conf{0%{transform:translateY(0) rotate(0)}100%{transform:translateY(340px) rotate(540deg);opacity:0}}
  @keyframes h46Pop{0%{transform:scale(.9)}50%{transform:scale(1.06)}100%{transform:none}}
  @keyframes h46Ping{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--a) 60%,transparent)}80%,100%{box-shadow:0 0 0 7px transparent}}
  @keyframes h46Btn{0%,85%,100%{transform:none}90%{transform:scale(1.05)}}
  .h46-pop{animation:h46Pop2 .5s both;transform-box:fill-box;transform-origin:center}@keyframes h46Pop2{0%{transform:scale(0);opacity:0}100%{transform:none;opacity:1}}
  .h46-draw{stroke-dasharray:200;stroke-dashoffset:200;animation:h46Draw 1s forwards}@keyframes h46Draw{to{stroke-dashoffset:0}}
  .h46-drop{animation:h46Drop .5s both}@keyframes h46Drop{0%{transform:translateY(-14px);opacity:0}100%{transform:none;opacity:1}}
  .h46-rise{animation:h46Rise .6s both;transform-box:fill-box;transform-origin:bottom}@keyframes h46Rise{0%{transform:scaleY(0)}100%{transform:none}}
  .h46-slide{animation:h46Slide .5s both}@keyframes h46Slide{0%{transform:translateX(-12px);opacity:0}100%{transform:none;opacity:.9}}
  .h46-blink{animation:h46Blink 1.2s infinite}@keyframes h46Blink{50%{opacity:.25}}
  .h46-flow{animation:h46Flow 1.2s linear infinite}@keyframes h46Flow{to{stroke-dashoffset:-24}}
  .h46-glow{animation:h46Glow 1.8s infinite}@keyframes h46Glow{50%{opacity:.55;filter:drop-shadow(0 0 4px #fde68a)}}
  .h46-drip{animation:h46Drip 1.6s infinite}@keyframes h46Drip{0%{transform:translateY(0);opacity:0}20%{opacity:1}100%{transform:translateY(22px);opacity:0}}
  .h46-wave{animation:h46Wave 2s ease-in-out infinite}@keyframes h46Wave{50%{transform:translateX(-8px)}}
  .h46-pour{animation:h46Pour 1.4s ease-in-out infinite}@keyframes h46Pour{50%{opacity:.4}}
  .h46-roll{animation:h46Roll 1.6s ease-in-out infinite}@keyframes h46Roll{50%{transform:translateY(-16px)}}
  .h46-roll2{animation:h46Roll2 1s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes h46Roll2{50%{transform:scale(1.12)}}
  .h46-spark{animation:h46Spark .35s steps(2) infinite}@keyframes h46Spark{50%{opacity:.2;transform:translate(1px,-1px)}}
  .h46-rain{animation:h46Rain 1s linear infinite}@keyframes h46Rain{0%{transform:translateY(-6px);opacity:0}30%{opacity:1}100%{transform:translateY(40px);opacity:0}}
  .h46-shine{animation:h46Shine 2.6s ease-in-out infinite}@keyframes h46Shine{0%{transform:translateX(0);opacity:0}30%{opacity:.4}60%{transform:translateX(16px);opacity:0}100%{opacity:0}}
  .h46-door{animation:h46Door 2.4s ease-in-out infinite;transform-box:fill-box}@keyframes h46Door{0%,60%,100%{transform:none}75%{transform:scaleX(.55)}}
  .h46-hammer{animation:h46Ham 1s ease-in-out infinite}@keyframes h46Ham{50%{transform:rotate(-14deg)}}
  .h46-fall{animation:h46Fall 1.3s ease-in infinite}@keyframes h46Fall{0%{transform:none;opacity:1}100%{transform:translateY(30px) rotate(90deg);opacity:0}}
  .h46-pencil{animation:h46Pen 2s ease-in-out infinite}@keyframes h46Pen{50%{transform:translate(-22px,-16px)}}
  .h46-hook{animation:h46Hook 2s ease-in-out infinite}@keyframes h46Hook{50%{transform:translateY(6px)}}
  #phHero.ph-wrap .hq.ph-hq{top:auto;bottom:-6px;inset-inline-end:0;width:28px;height:28px}
  .m46-dot{width:12px;height:12px;border-radius:50%;flex:none}
  .m46-list{display:grid;gap:6px;max-height:42vh;overflow:auto}
  .m46-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:12px;background:var(--surface);border:1px solid var(--line)}
  .m46-row.d .t{color:var(--muted);text-decoration:line-through}.m46-row .t{flex:1;font-size:14px}
  .m46-ck{flex:none;width:28px;height:28px;border-radius:9px;border:2px solid var(--accent);background:none;color:#fff;font-weight:900;display:grid;place-items:center;cursor:pointer}
  .m46-ck[aria-pressed=true],.m46-row.d .m46-ck{background:var(--accent)}.m46-ck.ro{border-color:var(--line);color:var(--accent);background:none}
  .m46-x{flex:none;border:0;background:none;color:var(--muted);font-size:15px;cursor:pointer;min-width:30px;min-height:30px}
  .m46-add{display:flex;gap:8px;margin:10px 0}.m46-add .field{flex:1;min-height:44px}
  @media (prefers-reduced-motion:reduce){.h46 *{animation:none!important;transition:none!important}.h46-draw{stroke-dashoffset:0}}`;
  document.head.appendChild(css);

  if (typeof I18N === 'object') {
    Object.assign(I18N.dict, {
      'آرماتوربندی': 'Rebar work', 'قالب‌بندی': 'Formwork', 'بتن‌ریزی': 'Concrete pouring', 'جوشکاری و اسکلت فلزی': 'Welding & steel frame', 'کاشی و سرامیک': 'Tiling', 'سنگ‌کاری و نما': 'Stone & facade',
      'برق‌کاری': 'Electrical', 'لوله‌کشی و تأسیسات': 'Plumbing & HVAC', 'نقاشی ساختمان': 'Painting', 'گچ‌کاری و کناف': 'Plaster & drywall', 'عایق‌کاری': 'Insulation', 'درب و پنجره': 'Doors & windows',
      'کابینت و MDF': 'Cabinets & MDF', 'تخریب': 'Demolition', 'طراحی و نظارت': 'Design & supervision', 'بنایی و دیوارچینی': 'Masonry', 'ساخت و ساز': 'Construction',
      'منتظر شروع': 'Not started', 'در حال اجرا': 'In progress', 'مدیریت پروژه': 'Manage project', 'کارفرما: {@}': 'Employer: {@}', 'مجری: {@}': 'Provider: {@}',
      '{#} از {#} کار': '{#} of {#} tasks', 'قدم اول': 'First step', 'شروع کار در کارگاه': 'Start work on site', '▶ شروع کار': '▶ Start work', 'قدم بعدی': 'Next step', '✓ تمام شد': '✓ Done',
      'مجری بعد از انجام، تیک می‌زند': 'The provider ticks it when done', 'همهٔ کارها تمام شد': 'All tasks done', 'منتظر تأیید پایان کار از کارفرما': 'Waiting for the employer to confirm completion',
      'کار را ببین و پایانش را تأیید کن': 'Check the work and confirm completion', '⚑ تأیید پایان کار': '⚑ Confirm completion', 'فهرست کار': 'Task list', 'کارها را ردیف کن تا پیشرفت دیده شود': 'List the tasks so progress is visible',
      'مجری هنوز فهرست کار نساخته': 'The provider has not made a task list yet', 'مجری هنوز فهرست کار نساخته.': 'The provider has not made a task list yet.', '☰ ساخت فهرست کار': '☰ Make task list',
      'گزارش امروز': 'Today’s report', 'صورت‌وضعیت': 'Statement', 'چت': 'Chat', 'مدیریت': 'Manage', 'ثبت پرداخت': 'Record payment', 'پیشرفت': 'Progress', 'پرداخت': 'Payment',
      'دریافت از {@}': 'Received of {@}', 'پرداخت از {@}': 'Paid of {@}', '{#} روز قرارداد': '{#}-day contract', '{#} روز تأخیر': '{#} days late', '{#} روز مانده': '{#} days left', 'زمان': 'Time', 'پرداخت منتظر تأیید': 'Payment awaiting confirmation',
      'از الگو': 'From template', 'هنوز فهرستی نیست؛ اولین کار را بنویس (مثلاً «واحد ۱» یا «فونداسیون»).': 'No list yet; write the first task (e.g. “Unit 1” or “Foundation”).',
      'کار تازه، مثلاً کاشی حمام طبقهٔ دوم': 'New task, e.g. second-floor bathroom tiles', 'افزودن': 'Add', 'ذخیرهٔ فهرست کار': 'Save task list', 'شروع کار': 'Start work', 'گزارش روزانه': 'Daily report',
      'کار امروز با عکس': 'Today’s work with photos', 'با رسید یا شمارهٔ پیگیری': 'With receipt or tracking number', 'قرارداد': 'Contract', 'چت با {@}': 'Chat with {@}', 'تأیید پایان کار': 'Confirm completion',
      'صفحهٔ کامل پروژه': 'Full project page', 'پرداخت‌ها، گزارش‌ها، فایل‌ها': 'Payments, reports, files', 'مشکل یا بدقولی': 'Problem or bad faith', 'این کار در فهرست هست': 'This task is already in the list', 'فهرست کار ذخیره شد': 'Task list saved',
    });
    I18N.re = null;
  }
})();
