/* =====================================================================
 * work.js — دور ۲۸ (بعد از live-more.js، پیش از desktop.js)
 *   ۱) مبلغ: جداکنندهٔ نقطه هنگام تایپ (۸۵۰.۲۰۰.۰۰۰) + مبلغ به حروف زیر هر فیلد پول
 *   ۲) خانه: کارت هر پروژهٔ در جریان (پیشرفت، پول دریافت‌شده، روز مانده، آخرین فعالیت)
 *   ۳) پیشرفت کار: فهرست واحدها یا مراحل که مجری تیک می‌زند (PUT /projects/:id/progress)
 *   ۴) قرارداد: مبلغ کل + فهرست کار در «ثبت قرارداد»؛ قرارداد سادهٔ کارگر (یک صفحه)
 *   ۵) صورت‌وضعیت: راهنمای سه‌قدمی تصویری + ساخت خودکار ردیف‌ها از قرارداد (حالت درصدی)
 * بدون سرور هم با دادهٔ نمایشی کار می‌کند.
 * ===================================================================== */
(function () {
  const live = () => !!(window.LIVE && LIVE.on && S.auth);
  const wrapW = (name, fn) => { const prev = window[name]; if (typeof prev !== 'function') return; window[name] = function (...a) { return fn.call(this, prev, ...a); }; };
  const toEnD = (s) => String(s == null ? '' : s).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const digits = (s) => toEnD(s).replace(/\D/g, '');
  const api = (m, p, b) => LIVE.api(m, p, b);
  const err = (e) => (window.LIVE && LIVE.err ? LIVE.err(e) : toast(e.message || 'خطا'));

  /* ================= ۱) مبلغ: نقطه + حروف ================= */
  const g3 = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  window.moneyFa = (n) => fa(g3(String(Math.round(Math.abs(+n || 0)))));
  const ONES = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
  const TEENS = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
  const TENS = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
  const HUND = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
  const SCALE = ['', 'هزار', 'میلیون', 'میلیارد', 'هزار میلیارد'];
  function w3(n) {
    const h = Math.floor(n / 100), r = n % 100, o = [];
    if (h) o.push(HUND[h]);
    if (r >= 10 && r < 20) o.push(TEENS[r - 10]);
    else { if (r >= 20) o.push(TENS[Math.floor(r / 10)]); if (r % 10) o.push(ONES[r % 10]); }
    return o.join(' و ');
  }
  window.numWords = function (n) {
    n = Math.floor(+n || 0);
    if (!n) return 'صفر';
    const parts = [];
    for (let i = 0; n > 0 && i < SCALE.length; i++, n = Math.floor(n / 1000)) {
      const c = n % 1000;
      if (c) parts.unshift(i === 1 && c === 1 ? 'هزار' : w3(c) + (SCALE[i] ? ' ' + SCALE[i] : ''));
    }
    return parts.join(' و ');
  };
  // فیلدهای فقط-مبلغ و فیلدهای متنی که مبلغ دارند («۹.۲۰۰.۰۰۰ تومان هر تن»)
  const MONEY = new Set(['wW', 'payA', 'tmW', 'srP', 'aeW', 'rf_rate', 'rf_visit', 'rf_wage', 'cwA', 'csR', 'pgAmt']);
  const MONEY_TXT = new Set(['rspW', 'dP', 'crO', 'cwP']);
  const isMoney = (el) => el && el.tagName === 'INPUT' && (MONEY.has(el.id) || el.dataset.money === '1');
  const isMoneyTxt = (el) => el && el.tagName === 'INPUT' && (MONEY_TXT.has(el.id) || el.dataset.money === 'txt');
  // اعداد ۵ رقم به بالا در متن سه‌رقم‌سه‌رقم (سال ۱۴۰۵ دست نمی‌خورد)
  const fmtTxt = (v) => v.replace(/[0-9۰-۹](?:[0-9۰-۹]|[.,٬](?=[0-9۰-۹]{3}))*/g, (m) => { const d = digits(m); return d.length >= 5 ? fa(g3(d)) : m; });
  function setKeepCaret(el, nv) {
    if (el.value === nv) return;
    const pos = el.selectionStart == null ? el.value.length : el.selectionStart;
    const before = digits(el.value.slice(0, pos)).length;
    el.value = nv;
    let k = 0, i = 0;
    for (; i < nv.length && k < before; i++) if (/[0-9۰-۹]/.test(nv[i])) k++;
    try { el.setSelectionRange(i, i); } catch (e) {}
  }
  function wordsEl(el) {
    const host = el.parentElement && el.parentElement.classList.contains('numf') ? el.parentElement : el;
    let w = host.nextElementSibling;
    if (!w || !w.classList.contains('mwords')) { host.insertAdjacentHTML('afterend', '<small class="mwords" aria-live="polite"></small>'); w = host.nextElementSibling; }
    return w;
  }
  function moneyWords(el) {
    const m = isMoney(el) ? digits(el.value) : ((toEnD(el.value).replace(/[.,٬]/g, '').match(/\d{5,}/) || [''])[0]);
    const w = wordsEl(el);
    w.textContent = m && +m > 0 ? numWords(+m) + ' تومان' : '';
  }
  window.moneyField = function (el) {
    if (!el) return;
    if (isMoney(el)) { const d = digits(el.value); setKeepCaret(el, d ? fa(g3(d)) : ''); }
    else if (isMoneyTxt(el)) setKeepCaret(el, fmtTxt(el.value));
    else return;
    moneyWords(el);
  };
  // capture: پیش از oninput خود فیلد اجرا می‌شود، پس مقدار ذخیره‌شده هم جداشده است
  document.addEventListener('input', (e) => { if (isMoney(e.target) || isMoneyTxt(e.target)) moneyField(e.target); }, true);
  document.addEventListener('focusin', (e) => { if ((isMoney(e.target) || isMoneyTxt(e.target)) && e.target.value) moneyField(e.target); }, true);

  const css = document.createElement('style');
  css.textContent = `
  .mwords{display:block;margin:4px 4px 0;font-size:12.5px;color:var(--accent);line-height:1.6;min-height:0}
  .mwords:empty{display:none}
  .hp-card{display:block;width:100%;text-align:right;border:0;background:var(--surface);box-shadow:var(--shadow);border-radius:20px;padding:14px;font-family:inherit;color:var(--ink);cursor:pointer;margin-bottom:10px}
  .hp-top{display:flex;align-items:flex-start;gap:10px}
  .hp-top .nt-ic{flex:none}
  .hp-top .t{flex:1;min-width:0}.hp-top b{display:block;font-size:15.5px;line-height:1.5}.hp-top small{display:block;font-size:12.5px;color:var(--muted);margin-top:2px}
  .hp-bar{height:10px;border-radius:6px;background:var(--soft);overflow:hidden;margin:12px 0 6px;position:relative}
  .hp-bar i{position:absolute;inset:0 0 0 auto;border-radius:6px;background:var(--accent);transition:width .8s cubic-bezier(.3,1,.4,1)}
  .hp-bar i.pay{background:var(--gold);opacity:.9}
  .hp-row{display:flex;justify-content:space-between;gap:8px;font-size:12.5px;color:var(--muted)}
  .hp-row b{color:var(--ink);font-size:13px}
  .hp-kpi{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px}
  .hp-kpi div{background:var(--soft);border-radius:12px;padding:8px 6px;text-align:center}
  .hp-kpi b{display:block;font-size:14px}.hp-kpi small{display:block;font-size:11.5px;color:var(--muted);margin-top:1px;line-height:1.4}
  .hp-kpi .late b{color:var(--bad)}
  .hp-steps{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
  .hp-steps span{border:1px solid var(--line);border-radius:10px;padding:5px 9px;font-size:12.5px;display:inline-flex;align-items:center;gap:4px;min-height:32px}
  .hp-steps span.d{background:color-mix(in srgb,var(--ok) 14%,transparent);border-color:color-mix(in srgb,var(--ok) 45%,transparent);color:var(--ok)}
  .hp-steps span[role=button]{cursor:pointer}
  .hp-last{margin-top:10px;font-size:12.5px;color:var(--muted);border-top:1px dashed var(--line);padding-top:8px;line-height:1.7}
  .pg-row{display:flex;align-items:center;gap:12px;width:100%;border:0;background:none;padding:10px 0;min-height:52px;font-family:inherit;font-size:15px;color:var(--ink);text-align:right}
  .pg-row+.pg-row{border-top:1px solid var(--line)}
  .pg-row .m{flex:none;width:28px;height:28px;border-radius:50%;border:2px solid var(--line);display:grid;place-items:center;color:#fff;font-size:15px}
  .pg-row.d .m{background:var(--ok);border-color:var(--ok)}
  .pg-row .t{flex:1}.pg-row.d .t{color:var(--muted)}
  .pg-row small{font-size:12px;color:var(--muted)}
  .pg-row[disabled]{cursor:default}
  .stp-n{display:flex;align-items:center;gap:10px;margin-top:8px}
  .stp-n button{width:44px;height:44px;border-radius:12px;border:1px solid var(--line);background:var(--surface);font-size:22px;font-family:inherit;color:var(--ink)}
  .stp-n b{min-width:40px;text-align:center;font-size:20px}
  .stp-prev{font-size:12.5px;color:var(--muted);margin:8px 0 0;line-height:1.8}
  .cs-pt{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
  .cs-pt button{border:2px solid var(--line);background:var(--surface);border-radius:16px;padding:12px 6px;font-family:inherit;color:var(--ink);font-size:14px;display:flex;flex-direction:column;align-items:center;gap:4px;min-height:84px}
  .cs-pt button span{font-size:26px;line-height:1}
  .cs-pt button[aria-pressed=true]{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 10%,var(--surface))}
  .cs-tot{margin-top:14px;border-radius:16px;padding:14px;background:var(--night);color:#fff;text-align:center}
  .cs-tot small{display:block;color:var(--concrete);font-size:12.5px}
  .cs-tot b{display:block;font-size:24px;margin:2px 0}
  .cs-tot span{display:block;font-size:13px;color:var(--gold-2);line-height:1.7}
  .cs-safe{display:flex;gap:8px;align-items:flex-start;margin-top:12px;font-size:13px;line-height:1.8;background:color-mix(in srgb,var(--ok) 10%,transparent);border-radius:12px;padding:10px 12px}
  .sov-guide{border-radius:18px;background:var(--surface);box-shadow:var(--shadow);overflow:hidden}
  .sov-guide>summary{list-style:none;display:flex;align-items:center;gap:10px;padding:12px 14px;font-weight:800;cursor:pointer}
  .sov-guide>summary::-webkit-details-marker{display:none}
  .sov-guide>summary .q{flex:none;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:var(--accent);color:#fff;font-size:16px}
  .sov-guide>summary em{margin-inline-start:auto;font-style:normal;color:var(--muted);font-weight:400;font-size:13px}
  .sg-steps{display:grid;gap:10px;padding:0 14px 14px}
  .sg-step{display:flex;gap:12px;align-items:flex-start}
  .sg-step .n{flex:none;width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent);font-weight:900}
  .sg-step b{display:block;font-size:14.5px}.sg-step small{display:block;font-size:13px;color:var(--muted);line-height:1.8}
  .sg-art{display:block;width:100%;max-width:240px;margin-top:6px}
  .sg-note{margin:0 14px 14px;font-size:12.5px;color:var(--muted);line-height:1.8;border-top:1px dashed var(--line);padding-top:8px}
  .sov-auto{display:grid;gap:8px}
  .sov-auto button{display:flex;gap:12px;align-items:center;text-align:right;border:1px solid var(--line);background:var(--surface);border-radius:16px;padding:12px 14px;font-family:inherit;color:var(--ink);width:100%}
  .sov-auto button b{display:block;font-size:14.5px}.sov-auto button small{display:block;font-size:12.5px;color:var(--muted);line-height:1.6}
  .sov-auto .ic{flex:none;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:color-mix(in srgb,var(--gold) 18%,transparent);font-size:20px}`;
  document.head.appendChild(css);

  /* ================= مدت و فهرست کار ================= */
  const DUR_U = { 'روز': 1, 'هفته': 7, 'ماه': 30, 'سال': 365 };
  window.durDays = (s) => {
    const t = toEnD(s), n = parseFloat(t.replace('٫', '.')) || 1, u = Object.keys(DUR_U).find((k) => t.includes(k));
    return Math.max(1, Math.round(n * (u ? DUR_U[u] : 1)));
  };
  window.STEP_TPL = [
    { k: 'units', n: 'هر واحد یک تیک', unit: 'واحد' },
    { k: 'days', n: 'هر روز یک تیک', unit: 'روز' },
    { k: 'elec', n: 'برق‌کاری', s: ['لوله‌گذاری و قوطی‌گذاری', 'سیم‌کشی', 'نصب کلید، پریز و تابلو', 'تست و تحویل'] },
    { k: 'plumb', n: 'لوله‌کشی', s: ['لوله‌کشی آب و فاضلاب', 'تست فشار', 'نصب شیرآلات و تحویل'] },
    { k: 'tile', n: 'کاشی و سرامیک', s: ['زیرسازی', 'کاشی دیوار', 'سرامیک کف', 'بندکشی و تحویل'] },
    { k: 'arch', n: 'طراحی معماری', s: ['برداشت و نقشهٔ وضع موجود', 'طرح اولیه (پلان و نما)', 'نقشه‌های نهایی', 'تحویل و تأیید'] },
    { k: 'struct', n: 'محاسبات سازه', s: ['بررسی نقشهٔ معماری', 'محاسبات و مدل', 'نقشه‌های سازه', 'کنترل و تحویل'] },
    { k: 'sup', n: 'نظارت', s: ['فونداسیون', 'اسکلت', 'سقف‌ها', 'سفت‌کاری', 'نازک‌کاری و پایان‌کار'] },
    { k: 'build', n: 'ساخت و سفت‌کاری', s: ['گودبرداری و فونداسیون', 'اسکلت', 'سقف‌ها', 'دیوارچینی', 'تحویل'] },
    { k: 'reno', n: 'بازسازی', s: ['تخریب', 'تأسیسات', 'کاشی و کف', 'رنگ و تحویل'] },
    { k: 'none', n: 'بدون فهرست' },
  ];
  const tplOf = (k) => STEP_TPL.find((t) => t.k === k) || STEP_TPL[STEP_TPL.length - 1];
  const unitsIn = (s) => { const m = toEnD(s).match(/(\d+)\s*(واحد|طبقه)/); return m ? Math.min(30, +m[1]) : 0; };
  window.guessTpl = function (job, qty) {
    const t = (job || '') + ' ' + (qty || '');
    const u = unitsIn(t);
    if (u > 1) return { k: 'units', n: u };
    const R = [[/سیم|برق/, 'elec'], [/لوله|تأسیسات مکانیکی/, 'plumb'], [/کاشی|سرامیک/, 'tile'], [/نقشه|طراحی|معماری/, 'arch'], [/محاسب|سازه/, 'struct'], [/نظارت/, 'sup'], [/بازساز|تعمیر/, 'reno'], [/اسکلت|سفت|ساخت|فونداسیون/, 'build']];
    const hit = R.find(([re]) => re.test(t));
    if (hit) return { k: hit[1], n: 0 };
    if (S.role === 'engineer') {
      const f = window.engFields ? engFields().names.join(' ') : '';
      if (/معماری|شهرسازی/.test(f)) return { k: 'arch', n: 0 };
      if (/برق/.test(f)) return { k: 'elec', n: 0 };
      return { k: 'sup', n: 0 };
    }
    return { k: 'none', n: 0 };
  };
  window.stepsFor = (k, n) => {
    const t = tplOf(k);
    if (t.unit) return Array.from({ length: Math.max(1, Math.min(30, n || 1)) }, (_, i) => `${t.unit} ${fa(i + 1)}`);
    return (t.s || []).slice();
  };
  // انتخابگر فهرست کار (قرارداد و ویرایش در صفحهٔ پروژه)؛ وضعیت در st = {k, n}
  window.stepPicker = function (st, idp) {
    const t = tplOf(st.k), list = stepsFor(st.k, st.n);
    return `<div class="chips" id="${idp}T">${STEP_TPL.map((x) => `<button class="chip" aria-pressed="${x.k === st.k}" onclick="stepPick('${idp}','${x.k}')">${x.n}</button>`).join('')}</div>
      ${t.unit ? `<div class="stp-n"><button onclick="stepN('${idp}',-1)" aria-label="کمتر">−</button><b class="num" id="${idp}N">${fa(st.n || 1)}</b><button onclick="stepN('${idp}',1)" aria-label="بیشتر">+</button><span>${t.unit}</span></div>` : ''}
      <p class="stp-prev" id="${idp}P">${st.k === 'none' ? 'پیشرفت فقط با مرحلهٔ پروژه (توافق، در حال اجرا، تمام) نشان داده می‌شود.' : 'تیک‌ها: ' + list.map(esc).join(' · ')}</p>`;
  };
  const PICK = {};
  window.stepState = (idp, st) => (st ? (PICK[idp] = st) : PICK[idp]);
  window.stepPick = (idp, k) => { const st = PICK[idp]; st.k = k; st.auto = false; if (tplOf(k).unit && !st.n) st.n = k === 'days' ? 5 : 4; refreshPick(idp); };
  window.stepN = (idp, d) => { const st = PICK[idp]; st.auto = false; st.n = Math.max(1, Math.min(30, (st.n || 1) + d)); refreshPick(idp); };
  function refreshPick(idp) {
    const host = document.querySelector(`[data-steps="${idp}"]`);
    if (host) host.innerHTML = stepPicker(PICK[idp], idp);
  }

  /* ================= ۲ و ۳) پیشرفت پروژه ================= */
  const CLIENT_ROLES = ['general'];
  const amtGuess = (s) => {
    const t = toEnD(s).replace('٫', '.');
    const m = t.match(/([\d.]+)\s*(میلیارد|میلیون)/);
    if (m) return Math.round(parseFloat(m[1]) * (m[2] === 'میلیارد' ? 1e9 : 1e6));
    const d = (t.match(/\d[\d.,٬]{4,}/) || [''])[0].replace(/\D/g, '');
    return +d || 0;
  };
  function demoSteps(p) {
    const g = guessTpl(p.t, p.amt);
    const k = g.k === 'none' ? 'build' : g.k, list = stepsFor(k, g.n || 4);
    const done = p.stage >= 3 ? list.length : p.stage === 2 ? Math.ceil(list.length / 2) : 0;
    return list.map((t, i) => ({ t, done: i < done, at: null }));
  }
  window.projInfo = function (p) {
    const x = p._x || null;
    const total = x ? x.amount || 0 : p.demoTotal != null ? p.demoTotal : amtGuess(p.amt);
    const paid = x ? x.paid || 0 : p.demoPaid != null ? p.demoPaid : p.stage >= 2 ? Math.round(total * 0.35) : 0;
    const pend = x ? x.paidPending || 0 : 0;
    const steps = x ? x.progress || [] : p.prog || (p.prog = demoSteps(p));
    const doneN = steps.filter((s) => s.done).length;
    const pct = steps.length ? Math.round((doneN / steps.length) * 100) : p.stage >= 3 ? 100 : null;
    const durD = x ? x.durationDays || 0 : durDays((p.deal && p.deal.dur) || '۳۰ روز');
    let left = null, started = p.stage >= 2;
    if (x && x.startedAt && durD) left = Math.ceil((new Date(x.startedAt).getTime() + durD * 864e5 - Date.now()) / 864e5);
    else if (!x && started) left = p.demoLeft != null ? p.demoLeft : Math.max(1, Math.round(durD * 0.4));
    const last = x ? (x.lastReport ? x.lastReport.done : null) : started ? (p.demoLast || (steps.find((s) => !s.done) ? 'در حال انجام: ' + steps.find((s) => !s.done).t : null)) : null;
    const canTick = x ? !!(x.can && x.can.progress) : !CLIENT_ROLES.includes(S.role) && p.stage < 3;
    return { total, paid, pend, steps, doneN, pct, durD, left, started, last, canTick };
  };
  async function saveSteps(i, items) {
    const p = (S.projs[S.role] || [])[i];
    if (!p) return;
    if (p._x) {
      const old = p._x.progress;
      p._x.progress = items;
      try {
        const d = await api('PUT', '/projects/' + p._id + '/progress', { items: items.map((s) => ({ t: s.t, done: !!s.done })) });
        p._x = Object.assign(p._x, { progress: d.project.progress, can: d.project.can });
      } catch (e) { p._x.progress = old; err(e); }
    } else p.prog = items;
    rerender();
  }
  function rerender() { if (S.cur === 'home' && typeof renderHome === 'function') renderHome(); else if (S.cur === 'pdet' && typeof renderPdet === 'function') renderPdet(); }
  window.pgTick = function (i, k, ev) {
    if (ev) ev.stopPropagation();
    const p = (S.projs[S.role] || [])[i], inf = p && projInfo(p);
    if (!inf || !inf.canTick) { toast('پیشرفت کار را مجری تیک می‌زند'); return; }
    const items = inf.steps.map((s, j) => (j === k ? { ...s, done: !s.done, at: !s.done ? new Date().toISOString() : null } : s));
    saveSteps(i, items);
    if (items[k].done) toast(`«${items[k].t}» تمام شد؛ ${live() ? 'برای طرف مقابل هم ثبت شد' : 'ثبت شد'}`);
  };
  window.pgEdit = function (i) {
    const p = (S.projs[S.role] || [])[i], inf = projInfo(p);
    const g = inf.steps.length ? { k: 'custom', n: 0 } : guessTpl(p.t, (p.deal && p.deal.qty) || p.amt);
    stepState('pg', g.k === 'custom' ? { k: 'none', n: 0 } : g);
    sb.innerHTML = `<div class="grab"></div><h3 id="sheetTitle">فهرست کار</h3><p class="sub">هر ردیف یک تیک است؛ با هر تیک، طرف مقابل پیشرفت را می‌بیند.</p>
      ${inf.steps.length ? `<span class="label">فهرست فعلی (هر خط یک ردیف)</span><textarea class="field" id="pgTxt" style="min-height:140px">${esc(inf.steps.map((s) => s.t).join('\n'))}</textarea><span class="label">یا از الگو بساز</span>` : '<span class="label" style="margin-top:0">الگو</span>'}
      <div data-steps="pg">${stepPicker(stepState('pg'), 'pg')}</div>
      <button class="cta" id="pgGo">ذخیره</button>`;
    show();
    $('pgGo').onclick = () => {
      const st = stepState('pg');
      let list = st.k !== 'none' ? stepsFor(st.k, st.n) : $('pgTxt') ? $('pgTxt').value.split('\n').map((s) => s.trim()).filter(Boolean) : [];
      list = [...new Set(list)].slice(0, 30).map((t) => t.slice(0, 60));
      const was = new Map(inf.steps.map((s) => [s.t, s]));
      closeSheet();
      saveSteps(i, list.map((t) => was.get(t) || { t, done: false, at: null }));
      toast('فهرست کار ذخیره شد');
    };
  };
  const shortDate = (iso) => { if (!iso) return ''; try { return new Date(iso).toLocaleDateString('fa-IR', { day: 'numeric', month: 'long' }); } catch (e) { return ''; } };
  function stepsHTML(i, inf, max) {
    const L = inf.steps.slice(0, max || 30);
    return `<div class="hp-steps">${L.map((s, k) => `<span class="${s.done ? 'd' : ''}" ${inf.canTick ? `role="button" tabindex="0" aria-pressed="${!!s.done}" onclick="pgTick(${i},${k},event)"` : ''}>${s.done ? '✓' : '○'} ${esc(s.t)}</span>`).join('')}${inf.steps.length > L.length ? `<span>+${fa(inf.steps.length - L.length)}</span>` : ''}</div>`;
  }
  window.projCard = function (p, i) {
    const w = p.who && person(p.who), inf = projInfo(p);
    const stg = p.stage >= 2 ? 'در حال اجرا' : 'منتظر شروع';
    const payPct = inf.total ? Math.min(100, Math.round((inf.paid / inf.total) * 100)) : 0;
    const prog = inf.pct != null ? inf.pct : p.stage >= 2 ? 50 : 0;
    const leftTxt = !inf.started ? `${fa(inf.durD)} روز` : inf.left == null ? '—' : inf.left >= 0 ? `${fa(inf.left)} روز` : `${fa(-inf.left)} روز`;
    const leftLbl = !inf.started ? 'مدت قرارداد' : inf.left != null && inf.left < 0 ? 'تأخیر' : 'مانده تا پایان';
    const qty = (p.deal && p.deal.qty && p.deal.qty !== '—' && p.deal.qty) || '';
    return `<div class="hp-card" role="button" tabindex="0" onclick="openProjPage(${i})">
      <div class="hp-top"><span class="nt-ic">${QI.helmet}</span><span class="t"><b>${esc(p.t)}</b><small>${w ? esc(w.name) + ' · ' : ''}${esc(stg)}${qty ? ' · ' + esc(qty) : ''}</small></span><span class="tag ${p.stage >= 2 ? 'ok' : 'wait'}">${inf.pct != null ? fa(inf.pct) + '٪' : esc(stg)}</span></div>
      <div class="hp-bar" aria-label="پیشرفت کار ${fa(prog)} درصد"><i style="width:${prog}%"></i></div>
      <div class="hp-row"><span>پیشرفت کار${inf.steps.length ? ` · ${fa(inf.doneN)} از ${fa(inf.steps.length)}` : ''}</span><b class="num">${fa(prog)}٪</b></div>
      <div class="hp-kpi">
        <div><b class="num">${inf.total ? moneyM(inf.paid) : '—'}</b><small>دریافت شده${inf.total ? ' از ' + moneyM(inf.total) : ''}</small></div>
        <div class="${inf.left != null && inf.left < 0 ? 'late' : ''}"><b class="num">${leftTxt}</b><small>${leftLbl}</small></div>
        <div><b class="num">${inf.pend ? moneyM(inf.pend) : inf.total ? fa(payPct) + '٪' : '—'}</b><small>${inf.pend ? 'منتظر تأیید دریافت' : 'از مبلغ پرداخت شده'}</small></div>
      </div>
      ${inf.steps.length ? stepsHTML(i, inf, 8) : ''}
      ${inf.last ? `<div class="hp-last">آخرین فعالیت: ${esc(inf.last)}</div>` : ''}
    </div>`;
  };
  // مبلغ کوتاه: ۸۵۰ میلیون / ۱٫۲ میلیارد
  const moneyM = (n) => (n >= 1e9 ? fa(String(Math.round(n / 1e8) / 10).replace('.', '٫')) + ' میلیارد' : n >= 1e6 ? fa(String(Math.round(n / 1e5) / 10).replace('.', '٫')) + ' میلیون' : moneyFa(n));
  window.moneyM = moneyM;
  const activeProjs = () => (S.projs[S.role] || []).map((p, i) => [p, i]).filter(([p]) => p.stage >= 1 && p.stage < 3 && (!p.status || p.status === 'active'));
  window.homeProjects = function () {
    const L = activeProjs();
    if (!L.length) return '';
    return `<div class="section" id="hmProj"><div class="sec-head"><h3>پروژه‌های در جریان${L.length > 1 ? ' · ' + fa(L.length) : ''}</h3><button onclick="go('proj')">همه ‹</button></div>${L.map(([p, i]) => projCard(p, i)).join('')}</div>`;
  };
  wrapW('renderHome', function (prev, ...a) {
    const r = prev(...a);
    const host = $('s-home');
    if (!S.auth || !host) return r;
    const old = $('hmProj'); if (old) old.remove();
    const html = homeProjects();
    if (!html) return r;
    // نمایش‌های قبلی «یک پروژه» جایشان را به کارت‌ها می‌دهند
    let anchor = null;
    [...host.querySelectorAll(':scope > .section')].forEach((s) => {
      const h = s.querySelector('.sec-head h3');
      const one = (h && /^(کار در جریان|کارهای در جریان)$/.test(h.textContent.trim())) || (s.querySelector('.hm-today') && s.querySelector('[onclick^="openProjPage"]'));
      if (one) { if (!anchor) { anchor = document.createElement('div'); s.before(anchor); } s.remove(); }
    });
    if (!anchor) {
      const hero = host.querySelector(':scope > .hcard') || host.querySelector(':scope > header');
      anchor = document.createElement('div');
      if (hero) hero.after(anchor); else host.prepend(anchor);
    }
    anchor.outerHTML = html;
    return r;
  });

  // صفحهٔ پروژه: بخش «پیشرفت کار»
  wrapW('renderPdet', function (prev, ...a) {
    const r = prev(...a);
    const host = $('s-pdet'), p = (S.projs[S.role] || [])[S.pi];
    if (!host || !p || host.querySelector('#pgSec')) return r;
    const i = S.pi, inf = projInfo(p);
    if (!inf.steps.length && !inf.canTick) return r;
    const html = `<div class="section" id="pgSec"><div class="sec-head"><h3>پیشرفت کار</h3><span>${inf.steps.length ? `${fa(inf.doneN)} از ${fa(inf.steps.length)} · ${fa(inf.pct)}٪` : ''}</span></div>
      <div class="card" style="padding:4px 16px">${inf.steps.length ? inf.steps.map((s, k) => `<button class="pg-row ${s.done ? 'd' : ''}" ${inf.canTick ? `onclick="pgTick(${i},${k})"` : 'disabled'} aria-pressed="${!!s.done}"><span class="m">${s.done ? '✓' : ''}</span><span class="t">${esc(s.t)}</span><small>${s.done ? shortDate(s.at) : ''}</small></button>`).join('')
        : `<p class="hint" style="margin:12px 0">هنوز فهرست کار ندارد. مثلاً برای ساختمان ۴ واحدی «واحد ۱ تا ۴» بساز؛ هر واحد که تمام شد تیک بزن.</p>`}</div>
      ${inf.canTick ? `<button class="ghost" style="width:100%;margin-top:8px" onclick="pgEdit(${i})">${inf.steps.length ? 'ویرایش فهرست کار' : '+ ساخت فهرست کار'}</button><p class="hint">${inf.steps.length ? 'هر بار کاری تمام شد تیکش را بزن؛ کارفرما در چت و اعلان‌ها می‌بیند.' : ''}</p>` : `<p class="hint">مجری با تمام شدن هر ردیف تیک می‌زند.</p>`}</div>`;
    const first = host.querySelector('.section');
    if (first) first.insertAdjacentHTML('afterend', html); else host.insertAdjacentHTML('beforeend', html);
    return r;
  });

  /* ================= ۴) قرارداد ================= */
  const curConv = () => S.convs.find((x) => x.id === S.cid);
  const otherRole = (c) => { const o = c && c.pid && person(c.pid); return (o && o.role) || ''; };
  const isWorkerDeal = (c) => S.role === 'worker' || otherRole(c) === 'worker';

  // ثبت قرارداد معمولی: مبلغ کل (با حروف) + فهرست کار
  wrapW('ctrWizard', function (prev) {
    const c = curConv();
    if (c && c.pid && isWorkerDeal(c)) return ctrSimple();
    PICK.cw = null; // فرم تازه = حدس تازه از شرح کار
    return prev();
  });
  function cwExtraSave() {
    if (!S.cw) return;
    if ($('cwA')) S.cw.amount = +digits($('cwA').value) || 0;
    const p = $('cwP');
    if (p && !p.value.trim() && S.cw.amount) p.value = moneyFa(S.cw.amount) + ' تومان کل کار';
  }
  wrapW('ctrStep', function (prev, n) {
    cwExtraSave();
    // شرح کار عوض شد و کاربر خودش الگو انتخاب نکرده ← حدس دوباره (مثلاً «۴ واحدی» ← واحد ۱ تا ۴)
    if (S.cw && S.cw.step === 1 && $('cwJ') && PICK.cw && PICK.cw.auto) PICK.cw = Object.assign(guessTpl($('cwJ').value, $('cwQ') ? $('cwQ').value : ''), { auto: true });
    if (S.cw && S.cw.step === 1 && n > 1 && !S.cw.amount) { toast('مبلغ کل قرارداد را بنویس تا پول دریافتی و مانده درست حساب شود'); return; }
    const r = prev(n);
    decorate();
    return r;
  });
  function decorate() {
    const w = S.cw;
    if (!w || !document.querySelector('#sb .cw-steps')) return;
    if (w.amount === undefined) w.amount = w.price && !/تن|متر|روز|ساعت|هر /.test(w.price) ? +digits(w.price) || 0 : 0;
    if (!PICK.cw) stepState('cw', Object.assign(guessTpl(w.job, w.qty), { auto: true }));
    if (w.step === 1 && $('cwP') && !$('cwA')) {
      const p = $('cwP'), lab = p.previousElementSibling;
      if (lab && lab.classList.contains('label')) lab.textContent = 'نرخ یا توضیح مبلغ (اختیاری)';
      p.placeholder = 'مثلاً ۹.۲۰۰.۰۰۰ تومان هر تن';
      p.insertAdjacentHTML('beforebegin', `<span class="label">مبلغ کل قرارداد (تومان)</span><div class="numf"><input class="field" id="cwA" inputmode="numeric" placeholder="مثلاً ۸۵۰.۲۰۰.۰۰۰" value="${w.amount ? moneyFa(w.amount) : ''}"><span>تومان</span></div>`);
      moneyField($('cwA')); if ($('cwP').value) moneyField($('cwP'));
      const btn = document.querySelector('#sb .cta');
      if (btn) btn.insertAdjacentHTML('beforebegin', `<span class="label">پیشرفت کار را چطور نشان بدهیم؟</span><div data-steps="cw">${stepPicker(stepState('cw'), 'cw')}</div>`);
    }
    if (w.step === 3) {
      const sum = document.querySelector('#sb .cw-sum');
      const st = stepState('cw') || { k: 'none' }, list = stepsFor(st.k, st.n);
      if (sum && !sum.querySelector('.cw-amt')) {
        sum.insertAdjacentHTML('beforeend', `<div class="cw-amt"><span>مبلغ کل</span><b>${moneyFa(w.amount)} تومان<br><small style="font-weight:400;color:var(--accent)">${numWords(w.amount)} تومان</small></b></div>${list.length ? `<div><span>فهرست کار</span><b>${list.map(esc).join('، ')}</b></div>` : ''}`);
      }
    }
  }
  window.ctrSend = function () {
    const w = S.cw, st = stepState('cw') || { k: 'none' };
    const d = { job: w.job, qty: w.qty, price: w.price, amount: w.amount || undefined, start: w.start, dur: w.dur, plan: PE.ms.map((m) => [String(m[0]).trim(), +m[1]]), steps: stepsFor(st.k, st.n) };
    closeSheet();
    pushMsg({ me: 1, k: 'deal', d, st: null }, true);
    toast('قرارداد برای تأیید فرستاده شد');
  };

  // قرارداد سادهٔ کارگر: یک صفحه، دکمه‌های بزرگ، مبلغ به حروف، جمع خودکار
  const CS_PT = [['day', '📅', 'روزمزد', 'روز'], ['unit', '📏', 'متری', 'متر'], ['lump', '🤝', 'کل کار', '']];
  const CS_PAY = { end: ['پایان کار', [['پایان کار', 100]]], half: ['نصف اول، نصف آخر', [['شروع کار', 50], ['پایان کار', 50]]], week: ['آخر هر هفته', null] };
  function csTotal() { const s = S.cs; return s.pt === 'lump' ? s.rate : s.rate * (s.n || 0); }
  function csPlan() {
    const s = S.cs;
    if (s.pay !== 'week') return CS_PAY[s.pay][1];
    const days = s.pt === 'day' ? s.n : durDays(s.dur), weeks = Math.max(1, Math.min(8, Math.ceil(days / 6)));
    const base = Math.floor(100 / weeks);
    return Array.from({ length: weeks }, (_, k) => [`هفتهٔ ${fa(k + 1)}`, k === weeks - 1 ? 100 - base * (weeks - 1) : base]);
  }
  window.ctrSimple = function () {
    const c = curConv();
    const a = c && c.ad ? ADS.find((x) => x.id === c.ad) : null;
    const rate = a && a.wage ? +digits(a.wage) || 0 : 0;
    S.cs = {
      job: (a && a.title) || (c.ctx && c.ctx.title) || '', pt: a && /متر/.test(a.wageType || '') ? 'unit' : a && /مقطوع|کل/.test(a.wageType || '') ? 'lump' : 'day',
      rate: rate > 1000 ? rate : 0, n: 5, start: 'فردا صبح', dur: '۱ هفته', pay: 'end', unitName: 'متر',
    };
    csRender();
  };
  window.csSet = (k, v) => { S.cs[k] = v; if (k === 'pt' && v === 'day' && S.cs.pay === 'week' && S.cs.n < 7) S.cs.pay = 'end'; csRender(); };
  window.csN = (d) => { csRead(); S.cs.n = Math.max(1, Math.min(999, (S.cs.n || 1) + d)); csRender(); };
  function csRead() {
    const s = S.cs;
    if ($('csJ')) s.job = $('csJ').value.trim();
    if ($('csR')) s.rate = +digits($('csR').value) || 0;
    if ($('csNn')) s.n = Math.max(1, +digits($('csNn').value) || 1);
    if ($('csS')) s.start = $('csS').value.trim();
  }
  window.csUpd = function () {
    csRead();
    const t = csTotal(), box = $('csTot');
    if (box) box.innerHTML = t > 0 ? `<small>جمع کل قرارداد</small><b class="num">${moneyFa(t)} تومان</b><span>${numWords(t)} تومان</span>` : `<small>جمع کل قرارداد</small><b>—</b><span>مبلغ را بنویس</span>`;
  };
  function csRender(soft) {
    if (soft) csRead();
    const s = S.cs, c = curConv(), nm = convName(c), pt = CS_PT.find((x) => x[0] === s.pt);
    sb.innerHTML = `<div class="grab"></div><h3 id="sheetTitle">قرارداد ساده با ${esc(nm)}</h3><p class="sub">چند سؤال کوتاه؛ جمع مبلغ خودکار حساب می‌شود.</p>
      <span class="label" style="margin-top:0">۱. چه کاری؟</span><input class="field" id="csJ" value="${esc(s.job)}" placeholder="مثلاً بلوک‌چینی طبقهٔ دوم" oninput="csUpd()">
      <span class="label">۲. دستمزد چطور حساب شود؟</span>
      <div class="cs-pt">${CS_PT.map((x) => `<button aria-pressed="${s.pt === x[0]}" onclick="csSet('pt','${x[0]}')"><span aria-hidden="true">${x[1]}</span>${x[2]}</button>`).join('')}</div>
      <span class="label">۳. ${s.pt === 'day' ? 'دستمزد هر روز' : s.pt === 'unit' ? 'دستمزد هر متر' : 'مبلغ کل کار'} (تومان)</span>
      <div class="numf"><input class="field" id="csR" inputmode="numeric" value="${s.rate ? moneyFa(s.rate) : ''}" placeholder="مثلاً ۱.۸۰۰.۰۰۰" oninput="csUpd()"><span>تومان</span></div>
      ${s.pt !== 'lump' ? `<span class="label">۴. چند ${pt[3]}؟</span><div class="stp-n"><button onclick="csN(-1)" aria-label="کمتر">−</button><input class="field num" id="csNn" inputmode="numeric" value="${fa(s.n)}" style="width:90px;text-align:center;font-size:20px" oninput="csUpd()"><button onclick="csN(1)" aria-label="بیشتر">+</button><span>${pt[3]}</span></div>`
        : `<span class="label">۴. چقدر طول می‌کشد؟</span><div class="chips">${['۳ روز', '۱ هفته', '۲ هفته', '۱ ماه'].map((x) => `<button class="chip" aria-pressed="${s.dur === x}" onclick="csSet('dur','${x}')">${x}</button>`).join('')}</div>`}
      <div class="cs-tot" id="csTot"></div>
      <span class="label">۵. کی شروع؟</span><input class="field" id="csS" value="${esc(s.start)}" placeholder="مثلاً شنبه ۷ صبح" oninput="csUpd()">
      <span class="label">۶. پول کی پرداخت شود؟</span>
      <div class="chips">${Object.entries(CS_PAY).filter(([k]) => k !== 'week' || (s.pt === 'day' ? s.n >= 7 : s.pt === 'lump' && durDays(s.dur) >= 7)).map(([k, v]) => `<button class="chip" aria-pressed="${s.pay === k}" onclick="csSet('pay','${k}')">${v[0]}</button>`).join('')}</div>
      <div class="cs-safe">${I.shield}<span>پول را بعد از هر پرداخت در «دفترچهٔ پرداخت» پروژه ثبت کنید و رسید بگیرید. اگر کسی خواست مبلغ را بیرون از بلوک عوض کند، قبول نکن.</span></div>
      <button class="cta" onclick="csSend()">ارسال برای ${esc(nm)}</button>`;
    show();
    moneyField($('csR'));
    csUpd();
  }
  window.csSend = function () {
    csRead();
    const s = S.cs, t = csTotal();
    if (s.job.length < 2) { toast('بنویس چه کاری است'); return; }
    if (!(s.rate > 0)) { toast('مبلغ دستمزد را بنویس'); return; }
    const pt = CS_PT.find((x) => x[0] === s.pt);
    const d = {
      job: s.job,
      qty: s.pt === 'lump' ? '' : `${fa(s.n)} ${pt[3]}`,
      price: s.pt === 'day' ? `${moneyFa(s.rate)} تومان روزانه` : s.pt === 'unit' ? `${moneyFa(s.rate)} تومان هر متر` : `${moneyFa(s.rate)} تومان کل کار`,
      amount: t, start: s.start || 'هماهنگ می‌شود', dur: s.pt === 'day' ? `${fa(s.n)} روز` : s.pt === 'lump' ? s.dur : '۱ هفته',
      plan: csPlan(), steps: s.pt === 'day' && s.n <= 30 ? stepsFor('days', s.n) : [],
    };
    closeSheet();
    pushMsg({ me: 1, k: 'deal', d, st: null }, true);
    toast(`قرارداد ${moneyFa(t)} تومانی برای تأیید فرستاده شد`);
  };

  /* ================= ۵) صورت‌وضعیت آسان ================= */
  const SG_K = 'blk-sovg';
  const sgOpen = () => { try { return localStorage.getItem(SG_K) !== '0'; } catch (e) { return true; } };
  window.sgTog = (el) => { try { localStorage.setItem(SG_K, el.open ? '1' : '0'); } catch (e) {} };
  const SG_ART = `<svg class="sg-art" viewBox="0 0 240 46" aria-hidden="true"><rect x="0" y="16" width="240" height="14" rx="7" fill="var(--soft)"/><rect x="140" y="16" width="100" height="14" rx="7" fill="var(--concrete-2)"/><rect x="90" y="16" width="56" height="14" fill="var(--gold)"/><text x="190" y="44" text-anchor="middle" font-size="10" fill="var(--muted)">قبلاً</text><text x="118" y="44" text-anchor="middle" font-size="10" fill="var(--muted)">این دوره</text><text x="45" y="44" text-anchor="middle" font-size="10" fill="var(--muted)">مانده</text><text x="118" y="11" text-anchor="middle" font-size="10" fill="var(--gold)">+ و −</text></svg>`;
  function guideHTML() {
    return `<div class="section"><details class="sov-guide" ${sgOpen() ? 'open' : ''} ontoggle="sgTog(this)"><summary><span class="q">؟</span>صورت‌وضعیت در ۳ قدم<em>راهنما</em></summary>
      <div class="sg-steps">
        <div class="sg-step"><span class="n">۱</span><span><b>ردیف‌های کار را بساز (فقط یک بار)</b><small>کارهای قرارداد با واحد و قیمت. ساده‌ترین راه: «درصدی» — یک ردیف «کل کار» به مبلغ قرارداد.</small></span></div>
        <div class="sg-step"><span class="n">۲</span><span><b>بگو تا امروز چقدر انجام شده</b><small>با دکمه‌های + و − جلوی هر ردیف. نوار طلایی = کار همین دوره که پولش را می‌خواهی.</small>${SG_ART}</span></div>
        <div class="sg-step"><span class="n">۳</span><span><b>«ارسال» را بزن</b><small>کارفرما تأیید یا رد (با دلیل) می‌کند. بعد از تأیید، مبلغ «قابل پرداخت» در دفترچهٔ پرداخت ثبت می‌شود.</small></span></div>
      </div>
      <p class="sg-note">کسورات پایین صفحه: «حسن انجام کار» بخشی است که کارفرما تا پایان کار نگه می‌دارد؛ «بیمه» سهم بیمهٔ کارگاه است. درصدها از قرارداد می‌آید.</p></details></div>`;
  }
  function sovAutoHTML(i) {
    const p = (S.projs[S.role] || [])[i], inf = projInfo(p);
    return `<div class="section" id="sovAuto"><div class="sec-head"><h3>شروع سریع</h3><span>ردیف‌ها از قرارداد ساخته می‌شود</span></div><div class="sov-auto">
      <button onclick="sovAuto('pct')"><span class="ic">٪</span><span><b>درصدی (ساده‌ترین)</b><small>یک ردیف «کل کار»${inf.total ? ' به مبلغ ' + moneyFa(inf.total) + ' تومان' : ''}؛ فقط بگو چند درصد تمام شده.</small></span></button>
      ${inf.steps.length ? `<button onclick="sovAuto('steps')"><span class="ic">✓</span><span><b>از فهرست کار (${fa(inf.steps.length)} ردیف)</b><small>${esc(inf.steps.slice(0, 4).map((s) => s.t).join('، '))}${inf.steps.length > 4 ? '…' : ''} — ردیف‌های تیک‌خورده انجام‌شده حساب می‌شوند.</small></span></button>` : ''}
    </div></div>`;
  }
  window.sovAuto = function (mode) {
    const i = S.pi, p = (S.projs[S.role] || [])[i], inf = projInfo(p);
    const k = S.role + ':' + i, v = S.sov[k] || (typeof sovOf === 'function' ? sovOf(k) : null);
    if (!v) return;
    let total = inf.total;
    if (!total) { toast('مبلغ کل قرارداد ثبت نشده؛ ردیف را دستی اضافه کن'); return; }
    if (mode === 'pct') v.items.push({ n: 'کل کار طبق قرارداد: ' + p.t.slice(0, 60), u: 'درصد', q: 100, done: inf.pct || 0, prev: 0, p: Math.round(total / 100) });
    else {
      const each = Math.round(total / inf.steps.length);
      inf.steps.forEach((s) => v.items.push({ n: s.t, u: 'مرحله', q: 1, done: s.done ? 1 : 0, prev: 0, p: each }));
    }
    renderSov(true);
    toast('ردیف‌ها ساخته شد؛ با + و − مقدار انجام‌شده را درست کن و بفرست');
  };
  wrapW('sovQ', function (prev, key, k, d) {
    const v = S.sov[key] || (typeof sovOf === 'function' ? sovOf(key) : null), r = v && v.items[k];
    if (r && (r.u === 'درصد' || r.u === 'مرحله')) { const step = r.u === 'درصد' ? 5 : 1; r.done = Math.max(r.prev, Math.min(r.q, r.done + d * step)); renderSov(true); return; }
    return prev(key, k, d);
  });
  wrapW('renderSov', function (prev, ...a) {
    const r = prev(...a);
    const host = $('s-sov');
    if (!host || host.querySelector('.sov-guide')) return r;
    const hero = host.querySelector('.sov-hero');
    if (hero) hero.insertAdjacentHTML('afterend', guideHTML()); else host.insertAdjacentHTML('afterbegin', guideHTML());
    const p = (S.projs[S.role] || [])[S.pi], v = S.sov[S.role + ':' + S.pi];
    const provider = p && (p._x ? !p.meClient : true);
    if (v && v.st === 'draft' && provider && !v.items.length) {
      const g = host.querySelector('.sov-guide').closest('.section');
      g.insertAdjacentHTML('afterend', sovAutoHTML(S.pi));
    }
    // واژه‌های ساده‌تر
    host.querySelectorAll('.sec-head span').forEach((s) => { if (s.textContent.trim() === 'مقدار انجام‌شده را اصلاح کن') s.textContent = 'با + و − بگو تا امروز چقدر انجام شده'; });
    return r;
  });

})();
