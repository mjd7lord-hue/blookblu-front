/* =====================================================================
 * hero48.js — دور ۴۸: کارت پروژهٔ خانه = نقشهٔ پیشرفت واقعی (بعد از hero46.js)
 *   هر ردیف فهرست کار یک قسمت واقعی از نقشه است؛ شکل نقشه به نوع کار بستگی دارد:
 *     ساختمان (مهندس، پیمانکار، آرماتور، قالب، بتن، جوش، ساخت): برش ساختمان؛ هر کار یک لایه از زمین به بالا
 *     دیوار (بنا، سنگ، عایق): نمای دیوار؛ هر کار یک قطعه، رج‌های آجر با بندکشی؛ متراژ قرارداد
 *     پلان (کاشی، نقاشی، برق، لوله‌کشی، کناف، کابینت، پنجره، تخریب): پلان با یک فضا برای هر کار و الگوی همان کار
 *   لمس هر قسمت ← جزئیات همان کار زیر نقشه + دکمهٔ ✓ برای همان قسمت.
 * از hero46.js: طرح مهارت‌ها (H46.themeOf)، h46Act، h46Manage.
 * ===================================================================== */
(function () {
  if (!window.H46) return;
  const { themeOf } = window.H46;
  const r1 = (n) => Math.round(n * 10) / 10;
  const cut = (t, n) => (t.length > n ? t.slice(0, n - 1) + '…' : t);
  S.sel48 = S.sel48 || {};
  const KIND = { rebar: 'bld', form: 'bld', concrete: 'bld', weld: 'bld', design: 'bld', build: 'bld', mason: 'wall', stone: 'wall', insul: 'wall', tile: 'plan', paint: 'plan', elec: 'plan', plumb: 'plan', drywall: 'plan', cabinet: 'plan', window: 'plan', demo: 'plan' };
  const UNIT_OF = { bld: 'مرحله', wall: 'قطعه', plan: 'فضا' };

  // متراژ قرارداد: «۱۲۰ متر»، «۳ تن»، «۸ واحد»
  function qtyOf(p) {
    const t = String((p.deal && p.deal.qty) || (p._x && p._x.quantity) || '').replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/٬|,/g, '');
    const m = t.match(/(\d+(?:\.\d+)?)\s*(متر مربع|مترمربع|متر|تن|عدد|واحد|طبقه)/);
    return m ? { n: +m[1], u: m[2] } : null;
  }

  /* ---------- برش ساختمان ---------- */
  function drawBld(steps, sel, A, idx) {
    const n = steps.length, H = Math.min(28, 118 / n), X0 = 92, W = 150, G = 152;
    let s = `<defs><pattern id="hat48" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="${A}" stroke-width="2" opacity=".55"/></pattern></defs>
      <rect x="0" y="${G}" width="320" height="18" fill="#3f2d1d"/><path d="M0 ${G} H320" stroke="#7c5a3a" stroke-width="2"/>`;
    steps.forEach((st, k) => {
      const y = G - (k + 1) * H, cur = k === idx, on = k === sel;
      const cols = [0, 1, 2, 3].map((c) => X0 + 4 + c * ((W - 8) / 3));
      let g;
      if (st.done) {
        g = `<rect x="${X0}" y="${r1(y)}" width="${W}" height="${r1(H)}" fill="#64748b"/>` + cols.map((cx) => `<rect x="${r1(cx - 3)}" y="${r1(y + 3)}" width="6" height="${r1(H - 3)}" fill="#94a3b8"/>`).join('') + `<rect x="${X0 - 4}" y="${r1(y)}" width="${W + 8}" height="4" fill="#cbd5e1"/>` + (H > 14 ? `<rect x="${X0 + W * 0.3}" y="${r1(y + H * 0.35)}" width="${W * 0.12}" height="${r1(H * 0.4)}" fill="#0f172a" opacity=".5"/><rect x="${X0 + W * 0.6}" y="${r1(y + H * 0.35)}" width="${W * 0.12}" height="${r1(H * 0.4)}" fill="#0f172a" opacity=".5"/>` : '');
      } else if (cur) {
        g = `<rect x="${X0}" y="${r1(y)}" width="${W}" height="${r1(H)}" fill="url(#hat48)" stroke="${A}" stroke-width="1.5"/>` + cols.map((cx) => `<line x1="${r1(cx)}" y1="${r1(y + H)}" x2="${r1(cx)}" y2="${r1(y + 2)}" stroke="${A}" stroke-width="2.5"/>`).join('') +
          `<g stroke="#f59e0b" stroke-width="1"><line x1="${X0 - 10}" y1="${r1(y)}" x2="${X0 - 10}" y2="${r1(y + H)}"/><line x1="${X0 - 4}" y1="${r1(y)}" x2="${X0 - 4}" y2="${r1(y + H)}"/><line x1="${X0 - 10}" y1="${r1(y + H / 2)}" x2="${X0 - 4}" y2="${r1(y + H / 2)}"/></g>`;
      } else g = `<rect x="${X0}" y="${r1(y)}" width="${W}" height="${r1(H)}" fill="none" stroke="rgba(255,255,255,.28)" stroke-dasharray="4 3"/>`;
      // برچسب کنار هر لایه (اگر جا هست)
      const lab = H >= 11 ? `<text text-anchor="end" x="${X0 + W + 10}" y="${r1(y + H / 2 + 3.5)}" font-size="${H < 16 ? 8.5 : 10}" fill="${st.done ? '#cbd5e1' : cur ? A : 'rgba(255,255,255,.45)'}">${st.done ? '✓ ' : ''}${esc(cut(st.t, 14))}</text>` : '';
      s += `<g class="p48 ${on ? 'sel' : ''}" data-k="${k}">${g}${on ? `<rect x="${X0 - 3}" y="${r1(y - 1.5)}" width="${W + 6}" height="${r1(H + 3)}" fill="none" stroke="#fff" stroke-width="2" rx="2"/>` : ''}${lab}<rect x="0" y="${r1(y)}" width="320" height="${r1(H)}" fill="transparent"/></g>`;
    });
    // جرثقیل کنار لایهٔ در حال اجرا
    if (idx > -1) { const y = G - (idx + 1) * H; s += `<g opacity=".85"><line x1="40" y1="${G}" x2="40" y2="${r1(Math.max(10, y - 18))}" stroke="#f59e0b" stroke-width="2.5"/><line x1="30" y1="${r1(Math.max(10, y - 18))}" x2="${X0 + 30}" y2="${r1(Math.max(10, y - 18))}" stroke="#f59e0b" stroke-width="2.5"/><line class="k48-hook" x1="${X0 + 24}" y1="${r1(Math.max(10, y - 18))}" x2="${X0 + 24}" y2="${r1(y - 4)}" stroke="#cbd5e1" stroke-width="1"/></g>`; }
    return s;
  }

  /* ---------- نمای دیوار ---------- */
  function drawWall(steps, sel, A, idx, k) {
    const n = steps.length, X0 = 14, Wt = 292, w = Wt / n, top = 26, H = 112, base = top + H;
    const brick = k === 'stone' ? `<rect width="22" height="13" fill="${A}"/><rect x="0" y="0" width="22" height="13" fill="none" stroke="#1f2937" stroke-width="1.2"/>` : k === 'insul' ? `<rect width="22" height="13" fill="${A}"/><path d="M0 6 H22" stroke="#1f2937" stroke-width="1"/>` : `<rect width="20" height="9" fill="${A}"/><rect x="-10" y="10" width="20" height="9" fill="${A}"/><rect x="10" y="10" width="20" height="9" fill="${A}"/>`;
    let s = `<defs><pattern id="br48" width="${k === 'mason' ? 21 : 23}" height="${k === 'mason' ? 20 : 14}" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#e5e7eb" opacity=".25"/>${brick}</pattern></defs>
      <rect x="0" y="${base}" width="320" height="30" fill="#3f2d1d"/>`;
    steps.forEach((st, j) => {
      const x = X0 + j * w, on = j === sel, cur = j === idx;
      let g;
      if (st.done) g = `<rect x="${r1(x + 1)}" y="${top}" width="${r1(w - 2)}" height="${H}" fill="url(#br48)"/>`;
      else if (cur) g = `<rect x="${r1(x + 1)}" y="${top}" width="${r1(w - 2)}" height="${H}" fill="none" stroke="${A}" stroke-dasharray="3 3"/><rect x="${r1(x + 1)}" y="${r1(top + H * 0.55)}" width="${r1(w - 2)}" height="${r1(H * 0.45)}" fill="url(#br48)"/><line class="k48-line" x1="${r1(x + 1)}" y1="${r1(top + H * 0.55 - 3)}" x2="${r1(x + w - 1)}" y2="${r1(top + H * 0.55 - 3)}" stroke="#fde047" stroke-width="1"/>`;
      else g = `<rect x="${r1(x + 1)}" y="${top}" width="${r1(w - 2)}" height="${H}" fill="none" stroke="rgba(255,255,255,.28)" stroke-dasharray="4 3"/>`;
      const lab = w >= 34 ? `<text x="${r1(x + w / 2)}" y="${top - 8}" text-anchor="middle" font-size="${w < 50 ? 8 : 9.5}" fill="${st.done ? '#cbd5e1' : cur ? A : 'rgba(255,255,255,.45)'}">${esc(cut(st.t, Math.max(4, Math.floor(w / 6))))}</text>` : `<text x="${r1(x + w / 2)}" y="${top - 8}" text-anchor="middle" font-size="8" fill="rgba(255,255,255,.55)">${fa(j + 1)}</text>`;
      s += `<g class="p48 ${on ? 'sel' : ''}" data-k="${j}">${g}${on ? `<rect x="${r1(x)}" y="${top - 1}" width="${r1(w)}" height="${H + 2}" fill="none" stroke="#fff" stroke-width="2"/>` : ''}${lab}<rect x="${r1(x)}" y="0" width="${r1(w)}" height="${base}" fill="transparent"/></g>`;
    });
    return s;
  }

  /* ---------- پلان ---------- */
  function fillPlan(k, x, y, w, h, A) {
    switch (k) {
      case 'tile': { let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${A}" opacity=".35"/>`; for (let a = x + 8; a < x + w; a += 8) s += `<line x1="${a}" y1="${y}" x2="${a}" y2="${y + h}" stroke="${A}" stroke-width=".8"/>`; for (let b = y + 8; b < y + h; b += 8) s += `<line x1="${x}" y1="${b}" x2="${x + w}" y2="${b}" stroke="${A}" stroke-width=".8"/>`; return s; }
      case 'paint': return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${A}" opacity=".55"/>`;
      case 'elec': { const cx = x + w / 2, cy = y + h / 2; return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${A}" opacity=".12"/><path d="M${x + 4} ${y + 4} H${cx} V${cy - 6}" stroke="${A}" stroke-width="1.2" fill="none"/><circle cx="${cx}" cy="${cy}" r="6" fill="${A}" class="k48-glow"/><circle cx="${x + w - 6}" cy="${y + h - 6}" r="2.5" fill="none" stroke="${A}"/>`; }
      case 'plumb': return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#38bdf8" opacity=".1"/><path d="M${x + 4} ${y + h - 6} H${x + w - 8} V${y + 8}" stroke="#38bdf8" stroke-width="2.5" fill="none"/><path d="M${x + 4} ${y + h - 12} H${x + w - 14} V${y + 8}" stroke="#f87171" stroke-width="2" fill="none"/><circle cx="${x + w - 8}" cy="${y + 8}" r="3" fill="#38bdf8"/>`;
      case 'cabinet': return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${A}" opacity=".1"/><rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="9" fill="${A}"/><rect x="${x + 2}" y="${y + 2}" width="9" height="${h - 4}" fill="${A}"/>`;
      case 'window': return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${A}" opacity=".1"/><rect x="${x + w * 0.3}" y="${y - 2}" width="${w * 0.4}" height="5" fill="${A}"/><rect x="${x + w - 3}" y="${y + h * 0.3}" width="5" height="${h * 0.4}" fill="${A}"/>`;
      case 'demo': { let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${A}" opacity=".15"/>`; for (let a = -h; a < w; a += 7) s += `<line x1="${x + Math.max(0, a)}" y1="${y + Math.max(0, -a)}" x2="${x + Math.min(w, a + h)}" y2="${y + Math.min(h, h - (a + h - Math.min(w, a + h)))}" stroke="${A}" stroke-width=".8" opacity=".6"/>`; return s; }
      case 'drywall': { let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${A}" opacity=".18"/>`; for (let a = x + 12; a < x + w; a += 12) s += `<line x1="${a}" y1="${y}" x2="${a}" y2="${y + h}" stroke="${A}" stroke-width=".7" opacity=".7"/>`; return s + `<rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" fill="none" stroke="#fde68a" stroke-width="1" opacity=".8"/>`; }
      default: return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${A}" opacity=".4"/>`;
    }
  }
  function drawPlan(steps, sel, A, idx, k) {
    const n = steps.length, cols = Math.min(4, Math.ceil(Math.sqrt(n * 1.7))), rows = Math.ceil(n / cols);
    const X0 = 10, Y0 = 8, W = 300, H = 150, cw = W / cols, rh = H / rows;
    let s = `<defs><pattern id="hp48" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="${A}" stroke-width="2" opacity=".5"/></pattern></defs><rect x="${X0}" y="${Y0}" width="${W}" height="${H}" fill="rgba(255,255,255,.03)"/>`;
    steps.forEach((st, j) => {
      const c = j % cols, r = Math.floor(j / cols);
      // آخرین ردیف کمتر از ستون‌ها: فضاها پهن‌تر می‌شوند
      const inRow = r === rows - 1 ? n - r * cols : cols, w = W / inRow, x = X0 + c * w, y = Y0 + r * rh;
      const on = j === sel, cur = j === idx;
      const inner = st.done ? fillPlan(k, r1(x + 3), r1(y + 3), r1(w - 6), r1(rh - 6), A) : cur ? `<rect x="${r1(x + 3)}" y="${r1(y + 3)}" width="${r1(w - 6)}" height="${r1(rh - 6)}" fill="url(#hp48)" class="k48-cur"/>` : '';
      s += `<g class="p48 ${on ? 'sel' : ''}" data-k="${j}">${inner}<rect x="${r1(x + 1.5)}" y="${r1(y + 1.5)}" width="${r1(w - 3)}" height="${r1(rh - 3)}" fill="none" stroke="${on ? '#fff' : 'rgba(255,255,255,.55)'}" stroke-width="${on ? 2.5 : 2}"/>
        <rect x="${r1(x + w / 2 - 7)}" y="${r1(y + rh - 3)}" width="14" height="4" fill="#0B1412"/>
        <text x="${r1(x + w / 2)}" y="${r1(y + rh / 2 + 4)}" text-anchor="middle" font-size="${w < 70 ? 9 : 11}" font-weight="700" fill="${st.done ? '#fff' : cur ? A : 'rgba(255,255,255,.5)'}">${st.done ? '✓ ' : ''}${esc(cut(st.t, Math.max(5, Math.floor(w / 7))))}</text>
        <rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(rh)}" fill="transparent"/></g>`;
    });
    return s;
  }

  /* ---------- آیکون‌ها ---------- */
  const ICO = { daily: '<path d="M8 4h8l3 3v13H5V4z"/><path d="M8 11h8M8 15h5"/>', sov: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>', chat: '<path d="M4 5h16v11H9l-5 4z"/>', pay: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 15h2"/>', more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>', edit: '<path d="M4 20h4l11-11-4-4L4 16z"/>' };
  const ic = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICO[k]}</svg>`;
  const shortD = (iso) => { try { return iso ? new Date(iso).toLocaleDateString('fa-IR', { day: 'numeric', month: 'long' }) : ''; } catch (e) { return ''; } };

  /* ---------- کارت ---------- */
  window.slideHTML46 = function (p, i) {
    const w = p.who && person(p.who), inf = projInfo(p), [k, , tname, A, deep] = themeOf(p);
    const prov = isProvider(p), id = p._id || 'd' + i, kind = KIND[k] || 'bld';
    const steps = inf.steps, N = steps.length, idx = steps.findIndex((s) => !s.done);
    const pct = inf.pct != null ? inf.pct : p.stage >= 2 ? 50 : 0;
    const sel = S.sel48[id] != null && S.sel48[id] < N ? S.sel48[id] : idx > -1 ? idx : N - 1;
    const q = qtyOf(p);
    const late = inf.left != null && inf.left < 0;
    const days = !inf.started ? `${fa(inf.durD || 0)} روز` : inf.left == null ? '—' : late ? `${fa(-inf.left)} روز` : `${fa(inf.left)} روز`;
    // خلاصهٔ پیشرفت به زبان همان کار
    const sum = !N ? '' : q && kind !== 'bld' ? `${fa(Math.round((q.n * inf.doneN) / N))} از ${fa(q.n)} ${q.u}` : `${fa(inf.doneN)} از ${fa(N)} ${kind === 'bld' ? 'مرحله' : kind === 'wall' ? 'قطعهٔ دیوار' : 'فضا'}`;
    const draw = !N ? '' : kind === 'wall' ? drawWall(steps, sel, A, idx, k) : kind === 'plan' ? drawPlan(steps, sel, A, idx, k) : drawBld(steps, sel, A, idx);
    // جزئیات قسمت انتخاب‌شده
    let det;
    if (!N) det = `<div class="d48 empty"><div><b>${prov ? 'نقشهٔ پیشرفت از فهرست کار ساخته می‌شود' : 'مجری هنوز فهرست کار نساخته'}</b><small>${prov ? (kind === 'bld' ? 'مثلاً: فونداسیون، اسکلت طبقهٔ ۱، سقف طبقهٔ ۱ …' : kind === 'wall' ? 'مثلاً: دیوار شمالی، تیغهٔ واحد ۱ …' : 'مثلاً: حمام، آشپزخانه، اتاق خواب …') : 'وقتی بسازد، نقشهٔ کار این‌جا پر می‌شود'}</small></div>${prov ? `<button class="g48" onclick="h46Act('list',${i},event)">☰ بساز</button>` : ''}</div>`;
    else {
      const st = steps[sel];
      const stt = st.done ? `<span class="s48 ok">✓ انجام شد${st.at ? ' · ' + shortD(st.at) : ''}</span>` : sel === idx ? `<span class="s48 cur">در حال انجام</span>` : `<span class="s48">مانده</span>`;
      const btn = prov && inf.canTick && p.stage >= 2 ? (st.done ? `<button class="g48 ghost" onclick="h48Tick(${i},${sel},event)">↺ برگرداندن</button>` : `<button class="g48" onclick="h48Tick(${i},${sel},event)">✓ تمام شد</button>`) : p.stage < 2 ? `<button class="g48" onclick="h46Act('stage',${i},event)">▶ شروع کار</button>` : !prov && idx < 0 && p.stage === 2 ? `<button class="g48" onclick="h46Act('stage',${i},event)">⚑ تأیید پایان</button>` : '';
      det = `<div class="d48"><div><small>${UNIT_OF[kind]} ${fa(sel + 1)} از ${fa(N)}</small><b class="ph-who">${esc(st.t)}</b>${stt}</div>${btn}</div>`;
    }
    const act = (a, k2, t) => `<button class="b48" onclick="h46Act('${a}',${i},event)">${ic(k2)}<small>${t}</small></button>`;
    const acts = prov ? [act('daily', 'daily', 'گزارش'), act('sov', 'sov', 'صورت‌وضعیت'), act('chat', 'chat', 'چت'), act('manage', 'more', 'بیشتر')] : [act('pay', 'pay', 'پرداخت'), act('sov', 'sov', 'صورت‌وضعیت'), act('chat', 'chat', 'چت'), act('manage', 'more', 'بیشتر')];
    return `<div class="hcard ph-hero ph-slide h46 h48" data-i="${i}" data-k="${k}" data-id="${id}" style="--a:${A};--deep:${deep}">
      <div class="t48" role="button" tabindex="0" onclick="openProjPage(${i})">
        <div class="t48-a"><span class="c48">${tname}</span><h2>${esc(p.t)}</h2><small>${w ? (prov ? 'کارفرما: ' : 'مجری: ') + esc(w.name) : ''}${p.stage < 2 ? ' · منتظر شروع' : ''}</small></div>
        <div class="t48-p"><b class="num">${fa(pct)}٪</b><small>${esc(sum)}</small></div>
      </div>
      <div class="m48 ${N ? '' : 'none'}">${N ? `<svg class="ph-art" viewBox="0 0 320 ${kind === 'plan' ? 166 : 170}" onclick="h48Pick(event,'${id}')">${draw}</svg>` : `<div class="m48-e">${kind === 'bld' ? '🏗' : kind === 'wall' ? '🧱' : '📐'}</div>`}
        <div class="lg48"><span><i class="d"></i>انجام شد</span><span><i class="c"></i>در حال انجام</span><span><i></i>مانده</span><button class="e48" onclick="h46Act('manage',${i},event)" aria-label="ویرایش فهرست کار">${ic('edit')}ویرایش</button></div>
      </div>
      ${det}
      <div class="ph-bar" style="display:none"><i data-w="${pct}"></i></div>
      <div class="ph-kpi k48"><div><b class="num">${fa(pct)}٪</b><small>پیشرفت</small></div><div><b class="num">${inf.total ? moneyM(inf.paid) : '—'}</b><small>${inf.total ? `${prov ? 'دریافت' : 'پرداخت'} از ${moneyM(inf.total)}` : 'پرداخت'}</small></div><div class="${late ? 'late' : ''}"><b class="num">${days}</b><small>${!inf.started ? 'مدت' : late ? 'تأخیر' : 'مانده'}</small></div></div>
      ${inf.last ? `<div class="l48">آخرین گزارش: ${esc(cut(inf.last, 70))}</div>` : ''}
      <div class="a48">${acts.join('')}</div>
    </div>`;
  };

  /* ---------- لمس قسمت‌ها ---------- */
  window.h48Pick = function (ev, id) {
    ev.stopPropagation();
    const g = ev.target.closest && ev.target.closest('.p48'); if (!g) return;
    S.sel48[id] = +g.dataset.k;
    const card = ev.target.closest('.h48'), i = card ? +card.dataset.i : -1;
    const p = (S.projs[S.role] || [])[i]; if (!p || !card) return;
    const tmp = document.createElement('div'); tmp.innerHTML = window.slideHTML46(p, i);
    const fresh = tmp.firstElementChild;
    // فقط نقشه و جزئیات عوض شود؛ برگ و جای اسکرول دست نخورد
    ['.m48', '.d48'].forEach((sel) => { const a = card.querySelector(sel), b = fresh.querySelector(sel); if (a && b) a.replaceWith(b); });
  };
  window.h48Tick = function (i, k, ev) {
    if (ev) ev.stopPropagation();
    const p = (S.projs[S.role] || [])[i]; if (!p) return;
    const inf = projInfo(p);
    if (!inf.canTick) { toast('پیشرفت کار را مجری تیک می‌زند'); return; }
    if (!inf.steps[k].done) S.cel46 = { i, at: Date.now() };
    pgTick(i, k);
  };

  /* ---------- طراحی ---------- */
  const css = document.createElement('style');
  css.textContent = `
  .ph-slide.h48{background:linear-gradient(170deg,var(--deep),#0B1412 72%);color:#fff;padding:14px;border-radius:24px;min-height:0}
  .t48{display:flex;gap:10px;align-items:flex-start;cursor:pointer}
  .t48-a{flex:1;min-width:0}.c48{display:inline-block;font-size:11.5px;font-weight:800;color:var(--a);border:1px solid color-mix(in srgb,var(--a) 45%,transparent);border-radius:20px;padding:2px 9px;margin-bottom:4px}
  .t48-a h2{font-size:17px;margin:0;line-height:1.5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.t48-a small{color:#cbd5e1;font-size:12px}
  .t48-p{text-align:end;flex:none}.t48-p b{display:block;font-size:26px;font-weight:900;color:var(--a);line-height:1.1}.t48-p small{font-size:11.5px;color:#e2e8f0}
  .m48{margin-top:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:8px 6px 6px}
  .m48>svg{width:100%!important;height:auto!important;display:block;cursor:pointer}
  .m48-e{height:90px;display:grid;place-items:center;font-size:40px;opacity:.4}
  .p48{cursor:pointer}.p48:hover>rect:first-child{filter:brightness(1.15)}
  .lg48{display:flex;align-items:center;gap:10px;font-size:10.5px;white-space:nowrap;color:#94a3b8;margin-top:4px;padding:0 4px}
  .lg48 i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-inline-end:4px;vertical-align:-1px;border:1px dashed rgba(255,255,255,.4)}.lg48 i.d{background:#64748b;border:0}.lg48 i.c{background:repeating-linear-gradient(45deg,var(--a) 0 2px,transparent 2px 4px);border:1px solid var(--a)}
  .e48{margin-inline-start:auto;display:inline-flex;align-items:center;gap:4px;border:1px solid rgba(255,255,255,.18);background:none;color:#e2e8f0;border-radius:10px;padding:4px 9px;font:inherit;font-size:11.5px;cursor:pointer}
  .e48 svg,.b48 svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}.e48 svg{width:14px;height:14px}
  .d48{display:flex;align-items:center;gap:10px;margin-top:10px;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.07);border-inline-start:3px solid var(--a);animation:d48In .3s both}
  @keyframes d48In{from{opacity:.4;transform:translateY(4px)}}
  .d48>div{flex:1;min-width:0}.d48 small{display:block;font-size:11px;color:#94a3b8}.d48 b{display:block;font-size:15px;line-height:1.6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .s48{display:inline-block;font-size:11.5px;color:#94a3b8}.s48.ok{color:#86efac}.s48.cur{color:var(--a);font-weight:700}
  .d48.empty b{white-space:normal;font-size:14px}
  .g48{flex:none;border:0;border-radius:12px;min-height:42px;padding:0 14px;font:800 13.5px/1 inherit;font-family:inherit;background:var(--a);color:#111;cursor:pointer}.g48:active{transform:scale(.95)}
  .g48.ghost{background:none;color:#e2e8f0;border:1px solid rgba(255,255,255,.25)}
  .k48{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px}.k48>div{background:rgba(255,255,255,.05);border-radius:11px;padding:6px 8px}.k48 b{display:block;font-size:13px}.k48 small{display:block;font-size:10.5px;color:#94a3b8}.k48 .late b{color:#fca5a5}
  .l48{margin-top:8px;font-size:12px;color:#cbd5e1;background:rgba(255,255,255,.04);border-radius:10px;padding:6px 10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .a48{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}
  .b48{border:0;border-radius:13px;background:rgba(255,255,255,.07);color:#e2e8f0;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 0 6px;font-family:inherit;cursor:pointer}.b48 small{font-size:11px}.b48:active{transform:scale(.94)}
  .k48-hook{animation:k48Hook 2.4s ease-in-out infinite}@keyframes k48Hook{50%{transform:translateY(4px)}}
  .k48-line{animation:k48Line 1.4s ease-in-out infinite}@keyframes k48Line{50%{opacity:.3}}
  .k48-cur{animation:k48Line 1.8s ease-in-out infinite}
  .k48-glow{animation:k48Glow 2s ease-in-out infinite}@keyframes k48Glow{50%{opacity:.5}}
  @media (prefers-reduced-motion:reduce){.h48 *{animation:none!important}}`;
  document.head.appendChild(css);

  if (typeof I18N === 'object') {
    Object.assign(I18N.dict, {
      'مرحله': 'Stage', 'قطعه': 'Section', 'فضا': 'Space', 'قطعهٔ دیوار': 'wall sections', '{#} از {#} مرحله': '{#} of {#} stages', '{#} از {#} قطعهٔ دیوار': '{#} of {#} wall sections', '{#} از {#} فضا': '{#} of {#} spaces',
      'مرحله {#} از {#}': 'Stage {#} of {#}', 'قطعه {#} از {#}': 'Section {#} of {#}', 'فضا {#} از {#}': 'Space {#} of {#}',
      'انجام شد': 'Done', 'در حال انجام': 'In progress', 'مانده': 'Left', 'ویرایش': 'Edit', 'ویرایش فهرست کار': 'Edit task list', '✓ تمام شد': '✓ Done', '↺ برگرداندن': '↺ Undo', '▶ شروع کار': '▶ Start work', '⚑ تأیید پایان': '⚑ Confirm completion',
      'نقشهٔ پیشرفت از فهرست کار ساخته می‌شود': 'The progress drawing is built from the task list', 'مجری هنوز فهرست کار نساخته': 'The provider has not made a task list yet',
      'مثلاً: فونداسیون، اسکلت طبقهٔ ۱، سقف طبقهٔ ۱ …': 'e.g. Foundation, Frame floor 1, Slab floor 1 …', 'مثلاً: دیوار شمالی، تیغهٔ واحد ۱ …': 'e.g. North wall, Unit 1 partition …', 'مثلاً: حمام، آشپزخانه، اتاق خواب …': 'e.g. Bathroom, Kitchen, Bedroom …',
      'وقتی بسازد، نقشهٔ کار این‌جا پر می‌شود': 'Once made, the work drawing fills in here', '☰ بساز': '☰ Create', 'آخرین گزارش: {@}': 'Last report: {@}', 'گزارش': 'Report', 'بیشتر': 'More', 'منتظر شروع': 'Not started',
    });
    I18N.re = null;
  }
})();
