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
  // ارقام: فارسی، یا لاتین در حالت انگلیسی / «ارقام لاتین»
  const dg = (x) => (S.prefs && (S.prefs.lang === 'en' || S.prefs.latin) ? x : fa(x));
  window.moneyFa = (n) => dg(g3(String(Math.round(Math.abs(+n || 0)))));
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
  // انگلیسی: «eight hundred fifty million two hundred thousand»
  const E1 = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const E10 = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const ESC = ['', 'thousand', 'million', 'billion', 'trillion'];
  const e3 = (n) => { const h = Math.floor(n / 100), r = n % 100, o = []; if (h) o.push(E1[h] + ' hundred'); if (r) o.push(r < 20 ? E1[r] : E10[Math.floor(r / 10)] + (r % 10 ? '-' + E1[r % 10] : '')); return o.join(' '); };
  const numWordsEn = (n) => { if (!n) return 'zero'; const p = []; for (let i = 0; n > 0 && i < ESC.length; i++, n = Math.floor(n / 1000)) { const c = n % 1000; if (c) p.unshift(e3(c) + (ESC[i] ? ' ' + ESC[i] : '')); } return p.join(' '); };
  // مبلغ به حروف + «تومان» (انگلیسی: tomans)
  window.numWordsT = (n) => numWords(n) + (S.prefs && S.prefs.lang === 'en' ? ' tomans' : ' تومان');
  window.numWords = function (n) {
    n = Math.floor(+n || 0);
    if (S.prefs && S.prefs.lang === 'en') return numWordsEn(n);
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
  const fmtTxt = (v) => v.replace(/[0-9۰-۹](?:[0-9۰-۹]|[.,٬](?=[0-9۰-۹]{3}))*/g, (m) => { const d = digits(m); return d.length >= 5 ? dg(g3(d)) : m; });
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
    w.textContent = m && +m > 0 ? numWordsT(+m) : '';
  }
  window.moneyField = function (el) {
    if (!el) return;
    if (isMoney(el)) { const d = digits(el.value); setKeepCaret(el, d ? dg(g3(d)) : ''); }
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
  .hp-card{display:block;width:100%;text-align:start;border:0;background:var(--surface);box-shadow:var(--shadow);border-radius:20px;padding:14px;font-family:inherit;color:var(--ink);cursor:pointer;margin-bottom:10px}
  .hp-top{display:flex;align-items:flex-start;gap:10px}
  .hp-top .nt-ic{flex:none}
  .hp-top .t{flex:1;min-width:0}.hp-top b{display:block;font-size:15.5px;line-height:1.5}.hp-top small{display:block;font-size:12.5px;color:var(--muted);margin-top:2px}
  .hp-bar{height:10px;border-radius:6px;background:var(--soft);overflow:hidden;margin:12px 0 6px;position:relative}
  .hp-bar i{position:absolute;top:0;bottom:0;inset-inline-start:0;border-radius:6px;background:var(--accent);transition:width .8s cubic-bezier(.3,1,.4,1)}
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
  .pg-row{display:flex;align-items:center;gap:12px;width:100%;border:0;background:none;padding:10px 0;min-height:52px;font-family:inherit;font-size:15px;color:var(--ink);text-align:start}
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
  .sov-auto button{display:flex;gap:12px;align-items:center;text-align:start;border:1px solid var(--line);background:var(--surface);border-radius:16px;padding:12px 14px;font-family:inherit;color:var(--ink);width:100%}
  .sov-auto button b{display:block;font-size:14.5px}.sov-auto button small{display:block;font-size:12.5px;color:var(--muted);line-height:1.6}
  .sov-auto .ic{flex:none;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:color-mix(in srgb,var(--gold) 18%,transparent);font-size:20px}`;
  document.head.appendChild(css);

  /* ================= بازرسم یک صفحه = اسکرول سر جایش بماند =================
   * هر انتخاب (تنظیمات، فیلتر، کلید…) کل صفحه را دوباره می‌سازد؛ اگر محتوای تازه لحظه‌ای کوتاه‌تر باشد
   * (داده هنوز از سرور نیامده) مرورگر اسکرول را بالا می‌برد. فقط رفتن به صفحهٔ دیگر (go) بالا می‌برد. */
  let navigating = false, lastY = 0, lastH = 0, relT = 0;
  const onScr = () => document.querySelector('.screen.on');
  addEventListener('scroll', () => { if (navigating) return; lastY = scrollY; const el = onScr(); if (el) lastH = el.offsetHeight; }, { passive: true });
  wrapW('go', function (prev, ...a) {
    navigating = true;
    try { return prev(...a); } finally { lastY = 0; lastH = 0; setTimeout(() => { navigating = false; }, 0); }
  });
  const keep = new MutationObserver((muts) => {
    const el = onScr();
    if (navigating || !el || el.id === 's-chat' || !muts.some((m) => m.target === el) || lastY < 4) return;
    el.classList.add('noanim2');
    if (lastH && el.offsetHeight < lastH) el.style.minHeight = lastH + 'px';
    if (Math.abs(scrollY - lastY) > 2) scrollTo(0, lastY);
    clearTimeout(relT);
    relT = setTimeout(() => { el.style.minHeight = ''; el.classList.remove('noanim2'); }, 900);
  });
  document.querySelectorAll('.screen').forEach((s) => keep.observe(s, { childList: true }));

  /* ================= باز شدن کشو (details) = صفحه هم همراهش حرکت کند ================= */
  // مثلاً «حساب و تنظیمات» در صفحهٔ «من»: محتوای باز شده اگر زیر صفحه یا پشت نوار پایین بود، نرم بالا می‌آید
  document.addEventListener('toggle', (e) => {
    const d = e.target;
    if (!d || d.tagName !== 'DETAILS' || !d.open || !d.closest('.screen')) return;
    setTimeout(() => {
      const r = d.getBoundingClientRect(), vh = innerHeight, navH = 96, topGap = 72;
      if (r.bottom <= vh - navH) return;
      const need = r.bottom - (vh - navH) + 12, room = r.top - topGap;
      if (room > 0) scrollBy({ top: Math.min(need, room), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }, 80);
  }, true);

  /* ================= دکمهٔ تازه‌سازی در پیام‌ها و کاوش ================= */
  const RF_ICO = '<svg class="ico" viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>';
  const rfCss = document.createElement('style');
  rfCss.textContent = '.rf-btn.spin svg{animation:rfspin .8s linear infinite}@keyframes rfspin{to{transform:rotate(360deg)}}';
  document.head.appendChild(rfCss);
  const MODE_T = { workers: 'work', jobs: 'job', consult: 'consult' };
  window.refreshNow = async function (btn) {
    if (btn) btn.classList.add('spin');
    const scr = S.cur;
    try {
      if (live()) {
        if (scr === 'msg') await LIVE.loadConvs();
        else if (scr === 'explore') await LIVE.loadAds(MODE_T[S.mode] || 'work', true);
        if (S.cur === scr) render();
        toast('به‌روز شد');
      } else { await new Promise((r) => setTimeout(r, 500)); toast('به‌روز است'); }
    } catch (e) { err(e); } finally { const b = document.querySelector('.screen.on .rf-btn'); if (b) b.classList.remove('spin'); }
  };
  ['renderMsgs', 'renderExplore'].forEach((fn) => wrapW(fn, function (prev, ...a) {
    const r = prev(...a);
    const h = document.querySelector(`#s-${fn === 'renderMsgs' ? 'msg' : 'explore'} header.top`);
    if (h && !h.querySelector('.rf-btn')) {
      const first = h.querySelector('.icon-btn, .login-btn');
      const html = `<button class="icon-btn rf-btn" aria-label="تازه‌سازی" title="تازه‌سازی" onclick="refreshNow(this)">${RF_ICO}</button>`;
      if (first) first.insertAdjacentHTML('beforebegin', html); else h.insertAdjacentHTML('beforeend', html);
    }
    return r;
  }));

  /* ================= «آماده به کار» (مثل روشن کردن راننده در اسنپ) =================
   * آگهی «آمادهٔ همکاری» یک بار ساخته می‌شود؛ بعد فقط یک کلید روشن/خاموش در خانه.
   * روشن = در کاوش با نشان سبز «آماده به کار». با قرارداد خودکار خاموش می‌شود (بک‌اند)؛ بعد از پایان کار یک لمس. */
  const READY_ROLES = ['worker', 'specialist', 'engineer', 'contractor'];
  const rdCss = document.createElement('style');
  rdCss.textContent = `
  .rd-card{display:flex;align-items:center;gap:12px;width:100%;border:0;border-radius:20px;padding:14px;font-family:inherit;text-align:start;cursor:pointer;background:var(--surface);box-shadow:var(--shadow);color:var(--ink)}
  .rd-card.on{background:linear-gradient(135deg,color-mix(in srgb,var(--ok) 22%,var(--surface)),var(--surface));box-shadow:0 0 0 2px color-mix(in srgb,var(--ok) 55%,transparent),var(--shadow)}
  .rd-card .t{flex:1;min-width:0}.rd-card b{display:block;font-size:16px}.rd-card small{display:block;font-size:12.5px;color:var(--muted);line-height:1.7;margin-top:2px}
  .rd-sw{flex:none;width:64px;height:36px;border-radius:20px;background:var(--line);position:relative;transition:background .25s}
  .rd-sw i{position:absolute;top:4px;right:4px;width:28px;height:28px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.25);transition:right .25s cubic-bezier(.3,1.4,.5,1)}
  .rd-card.on .rd-sw{background:var(--ok)}.rd-card.on .rd-sw i{right:32px}
  .rd-dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--ok);margin-inline-end:6px;box-shadow:0 0 0 0 color-mix(in srgb,var(--ok) 60%,transparent);animation:rdpulse 1.8s infinite}
  @keyframes rdpulse{70%{box-shadow:0 0 0 8px transparent}100%{box-shadow:0 0 0 0 transparent}}
  .type.rd-type{background:color-mix(in srgb,var(--ok) 15%,transparent)!important;color:var(--ok)!important;display:inline-flex;align-items:center}
  .rd-strip{display:flex;align-items:center;gap:8px;margin:10px 16px 0;padding:10px 12px;border-radius:14px;background:color-mix(in srgb,var(--ok) 10%,var(--surface));font-size:13.5px}
  .rd-strip b{color:var(--ok)}`;
  document.head.appendChild(rdCss);
  const rd2Css = document.createElement('style');
  rd2Css.textContent = `
  .rd-box{background:var(--surface);box-shadow:var(--shadow);border-radius:22px;overflow:hidden}
  .rd-box.on{box-shadow:0 0 0 2px color-mix(in srgb,var(--ok) 55%,transparent),var(--shadow)}
  .rd-box .rd-card{box-shadow:none;border-radius:0}
  .rd-prev{padding:0 12px}.rd-prev .acard{margin:0;box-shadow:none;border:1px solid var(--line);animation:none}
  .rd-prev .lbl{display:block;font-size:12px;color:var(--muted);margin:2px 4px 6px}
  .rd-meta{display:flex;flex-wrap:wrap;gap:6px 14px;padding:10px 16px 0;font-size:12.5px;color:var(--muted)}
  .rd-meta b{color:var(--ink)}
  .rd-acts{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px}
  .rd-acts button{min-height:44px;border-radius:14px;border:1px solid var(--line);background:var(--surface);font:700 14px inherit;font-family:inherit;color:var(--ink)}
  .rd-acts button.p{background:var(--accent);border-color:var(--accent);color:#fff}
  .rd-week{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
  .rd-week button{min-height:52px;border-radius:12px;border:1px solid var(--line);background:var(--surface);font-family:inherit;color:var(--muted);font-size:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
  .rd-week button b{font-size:15px;color:var(--ink)}
  .rd-week button[aria-pressed=true]{background:color-mix(in srgb,var(--ok) 16%,var(--surface));border-color:var(--ok);color:var(--ok)}
  .rd-mine{border:2px dashed color-mix(in srgb,var(--ok) 55%,transparent);border-radius:22px;padding:8px;margin-bottom:12px}
  .rd-mine .lbl{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--ok);font-weight:800;margin:2px 6px 8px}
  .rd-mine .acard{margin:0}`;
  document.head.appendChild(rd2Css);
  const myReady = () => {
    const L = ADS.filter((a) => a.who === 'me' && a.type === 'work' && (a.st || 'active') !== 'removed');
    return L.find((a) => (a.st || 'active') === 'active') || L.find((a) => a.st === 'paused') || L.find((a) => a.st === 'closed') || null;
  };
  window.myReady = myReady;
  const busyNow = () => (S.projs[S.role] || []).some((p) => p.stage >= 1 && p.stage < 3 && (!p.status || p.status === 'active'));
  const myWeek = () => ((live() && LIVE.pub && LIVE.pub.week) || ME().week || ['o', 'o', 'o', 'o', 'o', 'o', 'o']).slice(0, 7);
  const daysLeft = (a) => { const e = a && a._x && a._x.expiresAt; return e ? Math.max(0, Math.ceil((new Date(e).getTime() - Date.now()) / 864e5)) : 30; };
  // گزینه‌های مهارت هر نقش (همان فرم ثبت‌نام)
  const SKILL_KEY = { worker: 'skills', specialist: 'skills', engineer: 'services', contractor: 'kinds', company: 'areas' };
  const skillOpts = () => (((REG[S.role] || []).flatMap((s) => s.f || []).find((f) => f.k === SKILL_KEY[S.role]) || {}).opts || []);
  window.readyCard = function () {
    if (!S.auth || !READY_ROLES.includes(S.role)) return '';
    const a = myReady(), on = !!a && (a.st || 'active') === 'active';
    const sub = !a ? 'یک بار در یک صفحهٔ کوتاه بساز؛ بعد فقط این کلید را روشن و خاموش کن.'
      : on ? 'کارفرماها الان در کاوش تو را با نشان سبز می‌بینند.'
      : a.st === 'closed' && busyNow() ? 'سر کاری؛ بعد از قرارداد خودکار خاموش شد. کار که تمام شد روشنش کن.'
      : 'خاموشی؛ در کاوش دیده نمی‌شوی. روشنش کن تا کار پیدا کنی.';
    const head = `<button class="rd-card ${on ? 'on' : ''}" role="switch" aria-checked="${on}" onclick="readyToggle()">
      <span class="t"><b>${on ? '<span class="rd-dot"></span>' : ''}آماده به کار ${on ? '— روشن' : a ? '— خاموش' : ''}</b><small>${esc(sub)}</small></span><span class="rd-sw" aria-hidden="true"><i></i></span></button>`;
    if (!a) return `<div class="section" id="rdSec"><div class="rd-box">${head}<div class="rd-acts" style="grid-template-columns:1fr"><button class="p" onclick="readySheet()">ساخت آگهی آمادگی (۱ دقیقه)</button></div></div></div>`;
    const views = (a._x && a._x.views) || a.views || 0, resp = (a._x && a._x.responsesCount) || a.resp || 0;
    return `<div class="section" id="rdSec"><div class="rd-box ${on ? 'on' : ''}">${head}
      <div class="rd-prev"><span class="lbl">${on ? 'کارفرماها تو را این‌طور می‌بینند:' : 'وقتی روشن باشی این‌طور دیده می‌شوی:'}</span>${adCard(a, ME(), 0, true)}</div>
      <div class="rd-meta"><span>👁 <b class="num">${fa(views)}</b> بازدید</span><span>💬 <b class="num">${fa(resp)}</b> درخواست</span>${on ? `<span>روشن تا <b class="num">${fa(daysLeft(a))}</b> روز دیگر</span>` : ''}</div>
      <div class="rd-acts"><button onclick="readySheet()">✎ ویرایش</button><button class="p" onclick="readySee()">ببین در کاوش ‹</button></div></div></div>`;
  };
  window.readySee = function () {
    S.mode = 'workers'; S.roleF = 'all'; S.provF = null; S.cityF = null; S.cat = null;
    go('explore');
    setTimeout(() => { const m = $('rdMine'); if (m) m.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 450);
  };
  window.readyToggle = async function () {
    const a = myReady();
    if (!a) { readySheet(); return; }
    const on = (a.st || 'active') === 'active', st = on ? 'paused' : 'active';
    const old = a.st;
    ADS.forEach((x) => { if (x.id === a.id) x.st = st; });
    if (S.cur === 'home') renderHome();
    if (live() && a._live) {
      try {
        const d = await api('PATCH', '/ads/' + a.id, { status: st });
        if (d && d.ad) ADS.forEach((x) => { if (x.id === a.id) x._x = Object.assign(x._x || {}, d.ad); });
        LIVE.loaded['ads:work'] = 0;
      } catch (e) { ADS.forEach((x) => { if (x.id === a.id) x.st = old; }); if (S.cur === 'home') renderHome(); err(e); return; }
    }
    if (S.cur === 'home') renderHome();
    toast(on ? 'خاموش شدی؛ در کاوش دیده نمی‌شوی' : 'روشن شدی! کارفرماها الان تو را با نشان سبز می‌بینند');
    if (!on && S.prefs && S.prefs.haptic && navigator.vibrate) try { navigator.vibrate(15); } catch (e) {}
  };

  /* ---- ساخت / ویرایش در یک صفحه ---- */
  const WT = [['روزانه', 'روزانه'], ['متری', 'متری'], ['توافقی', 'توافقی']];
  window.readySheet = function () {
    const a = myReady(), x = (a && a._x) || {};
    const prof = (ME().skills || []).map((s) => s[0]).filter(Boolean);
    S.rs = S.rs && S.rs._for === (a ? a.id : 'new') ? S.rs : {
      _for: a ? a.id : 'new',
      skills: (x.skills || (a && a.skills) || prof).slice(0, 3),
      wt: x.wageType || (a && a.wageType) || 'روزانه',
      wage: x.wageAmount || (a ? +digits(a.wage) || 0 : 0),
      city: x.city || (a && a.place) || ME().place || 'قشم',
      range: x.range || (a && a.range === 'استان' ? 'province' : 'city'),
      week: myWeek(),
      desc: x.description || (a && a.desc && a.desc !== 'توضیحی ثبت نشده.' ? a.desc : '') || '',
    };
    const s = S.rs, opts = [...new Set([...s.skills, ...prof, ...skillOpts()])].slice(0, 30);
    sb.innerHTML = `<div class="grab"></div><h3 id="sheetTitle">${a ? 'ویرایش آگهی آمادگی' : 'آگهی آمادگی'}</h3><p class="sub">همین یک صفحه؛ بعد فقط کلید «آماده به کار» را روشن و خاموش کن.</p>
      <span class="label" style="margin-top:0">چه کاری بلدی؟ (تا ۳ تا)</span><div class="chips" id="rsK">${opts.map((o) => `<button class="chip" aria-pressed="${s.skills.includes(o)}" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>
      <span class="label">دستمزد</span><div class="chips" id="rsT">${WT.map(([k, n]) => `<button class="chip" aria-pressed="${s.wt === k}" data-v="${k}">${n}</button>`).join('')}</div>
      <div id="rsWBox" ${s.wt === 'توافقی' ? 'hidden' : ''}><div class="numf" style="margin-top:8px"><input class="field" id="rsW" data-money="1" inputmode="numeric" value="${s.wage ? moneyFa(s.wage) : ''}" placeholder="${s.wt === 'متری' ? 'مثلاً ۴۵۰.۰۰۰ هر متر' : 'مثلاً ۲.۰۰۰.۰۰۰ در روز'}"><span>تومان</span></div></div>
      <span class="label">کجا کار می‌کنی؟</span><input class="field" id="rsC" list="citylist" value="${esc(s.city)}" placeholder="شهر">
      <div class="chips" id="rsR" style="margin-top:8px">${[['city', 'فقط شهر خودم'], ['province', 'کل استان']].map(([k, n]) => `<button class="chip" aria-pressed="${s.range === k}" data-v="${k}">${n}</button>`).join('')}</div>
      <span class="label">روزهای آزاد این هفته</span><div class="rd-week" id="rsD">${DAYS.map((d, i) => `<button aria-pressed="${s.week[i] === 'a'}" data-i="${i}">${d[0]}<b class="num">${d[1]}</b></button>`).join('')}</div>
      <span class="label">یک جملهٔ کوتاه (اختیاری)</span><input class="field" id="rsX" maxlength="200" value="${esc(s.desc)}" placeholder="مثلاً ۸ سال سابقه، ابزار کامل دارم">
      <button class="cta" id="rsGo">${a ? 'ذخیرهٔ تغییرات' : 'ساختن و روشن کردن'}</button>
      ${a ? '<button class="ghost" style="width:100%;margin-top:8px;color:var(--bad)" id="rsDel">حذف آگهی آمادگی</button>' : ''}`;
    show();
    if ($('rsW') && window.moneyField) moneyField($('rsW'));
    const read = () => { s.wage = +digits(($('rsW') || {}).value || '') || 0; s.city = $('rsC').value.trim() || s.city; s.desc = $('rsX').value.trim(); };
    $('rsK').onclick = (e) => { const b = e.target.closest('.chip'); if (!b) return; const v = b.dataset.v, on = s.skills.includes(v); if (!on && s.skills.length >= 3) { toast('حداکثر ۳ مهارت'); return; } s.skills = on ? s.skills.filter((k) => k !== v) : s.skills.concat(v); b.setAttribute('aria-pressed', !on); };
    $('rsT').onclick = (e) => { const b = e.target.closest('.chip'); if (!b) return; s.wt = b.dataset.v; $('rsT').querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c === b)); $('rsWBox').hidden = s.wt === 'توافقی'; };
    $('rsR').onclick = (e) => { const b = e.target.closest('.chip'); if (!b) return; s.range = b.dataset.v; $('rsR').querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c === b)); };
    $('rsD').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; const i = +b.dataset.i; s.week[i] = s.week[i] === 'a' ? 'o' : 'a'; b.setAttribute('aria-pressed', s.week[i] === 'a'); };
    $('rsGo').onclick = () => { read(); readySave(); };
    if ($('rsDel')) $('rsDel').onclick = () => readyDelete();
  };
  async function readySave(closeOthers) {
    const s = S.rs, a = myReady();
    if (!s.skills.length) { toast('حداقل یک مهارت انتخاب کن'); return; }
    if (s.wt !== 'توافقی' && s.wage < 10000) { toast('مبلغ دستمزد را بنویس'); return; }
    const prov = (typeof provOf === 'function' && provOf(s.city)) || (live() && LIVE.pub && LIVE.pub.province) || 'هرمزگان';
    const body = {
      title: `${s.skills.join('، ')} — آماده به کار`.slice(0, 120),
      description: s.desc || null, province: prov, city: s.city, wageType: s.wt, wageAmount: s.wt === 'توافقی' ? null : s.wage,
      startWhen: 'فوری', range: s.range, audience: ['contractor', 'company', 'general'], skills: s.skills,
    };
    const weekChanged = myWeek().join() !== s.week.join();
    if (!live()) {
      const it = a || { id: 'rd' + Date.now(), type: 'work', who: 'me', resp: 0, views: 0, posted: 'همین حالا', aud: body.audience };
      Object.assign(it, { title: body.title, place: s.city, wageType: s.wt, wage: s.wt === 'توافقی' ? 'پس از گفت‌وگو' : moneyFa(s.wage) + ' تومان', start: 'فوری', range: s.range === 'province' ? 'استان' : 'شهر', skills: s.skills, desc: s.desc || 'توضیحی ثبت نشده.', st: a ? it.st : 'active' });
      if (!a) ADS.push(it);
      if (weekChanged) ME().week = s.week.slice();
      closeSheet(); S.rs = null; if (S.cur === 'home') renderHome(); toast(a ? 'ذخیره شد' : 'ساخته شد و روشن است!');
      return;
    }
    const b = $('rsGo'); if (b) b.disabled = true;
    try {
      if (closeOthers) {
        const m = await api('GET', '/ads/mine');
        for (const o of m.items.filter((o) => o.status === 'active' && o.type !== 'consult' && (!a || o.id !== a.id))) await api('PATCH', '/ads/' + o.id, { status: 'closed' });
      }
      if (a && a._live) await api('PATCH', '/ads/' + a.id, Object.assign(body, a.st === 'active' ? {} : {}));
      else await api('POST', '/ads', Object.assign({ type: 'work' }, body));
      if (weekChanged) { await api('PUT', '/me/roles/' + S.role + '/week', { week: s.week.map((d) => (d === 'a' ? 'a' : 'o')) }); if (LIVE.loadMe) await LIVE.loadMe().catch(() => {}); }
      await LIVE.loadMyAds(true); LIVE.loaded['myads:' + S.role] = 0; LIVE.loaded['ads:work'] = 0;
      closeSheet(); S.rs = null; if (S.cur === 'home') renderHome();
      toast(a ? 'ذخیره شد' : 'ساخته شد و روشن است! کارفرماها تو را در کاوش می‌بینند');
    } catch (e) {
      if (b) b.disabled = false;
      if (e && e.code === 'FREE_AD_LIMIT') {
        sb.innerHTML = `<div class="grab"></div><h3 id="sheetTitle">یک آگهی فعال دیگر داری</h3><p class="sub">با آگهی رایگان فقط یک آگهی فعال می‌شود. آگهی قبلی را ببندم و آگهی آمادگی را بسازم؟ (بعداً از «آگهی‌های من» دوباره فعال می‌شود)</p>
          <button class="cta" id="rsYes">بله، قبلی بسته شود</button><button class="ghost" style="width:100%;margin-top:8px" onclick="closeSheet()">نه</button>`;
        show(); $('rsYes').onclick = () => readySave(true);
        return;
      }
      err(e);
    }
  }
  async function readyDelete() {
    const a = myReady(); if (!a) return;
    if (live() && a._live) { try { await api('DELETE', '/ads/' + a.id); await LIVE.loadMyAds(true); LIVE.loaded['ads:work'] = 0; } catch (e) { err(e); return; } }
    else { const i = ADS.indexOf(a); if (i > -1) ADS.splice(i, 1); }
    closeSheet(); S.rs = null; if (S.cur === 'home') renderHome(); toast('آگهی آمادگی حذف شد');
  }

  /* ---- دادهٔ خانه یک‌جا (دور ۳۲) ----
   * پروژه‌ها، آگهی‌های خودم (کلید آماده به کار) و کار فوری با هم و موازی بار می‌شوند و در پایان یک بار بازرسم.
   * شکست ← دفعهٔ بعد دوباره (قبلاً هر کدام جدا با مهلت ۱۵–۶۰ ثانیه بود و چند رفرش لازم داشت).
   * هر ورود به خانه، برگشت اپ از پس‌زمینه و عوض شدن نقش ← تازه. */
  let hsAt = 0, hsBusy = null, hsRole = '', hsSkip = false, hsTry = 0;
  window.homeSync = function (force) {
    if (!live()) return Promise.resolve();
    if (hsBusy) return hsBusy;
    if (!force && hsRole === S.role && Date.now() - hsAt < 4000) return Promise.resolve();
    const role = S.role, jobs = [];
    // بارگذاری خانه کش صفحه‌های دیگر («پروژه‌ها»، «آگهی‌های من») را «تازه» علامت نزند
    if (LIVE.loadProjects) jobs.push(LIVE.loadProjects(true).then(() => { LIVE.loaded['projs:' + role] = 0; }));
    if (READY_ROLES.includes(role) && LIVE.loadMyAds) jobs.push(LIVE.loadMyAds(true).then(() => { LIVE.loaded['myads:' + role] = 0; }));
    if (typeof window.urgSync === 'function') jobs.push(window.urgSync());
    hsBusy = Promise.allSettled(jobs).then((rs) => {
      hsBusy = null;
      if (rs.every((x) => x.status === 'fulfilled')) { hsAt = Date.now(); hsRole = role; hsTry = 0; }
      else {
        // شکست (سرور خواب/کند): خودکار دوباره، بدون نیاز به زدن «خانه»
        hsAt = 0;
        if (hsTry < 6) { const d = Math.min(15000, 2500 * ++hsTry); setTimeout(() => { if (S.cur === 'home' && S.auth) homeSync(true); }, d); }
      }
      if (S.cur === 'home' && S.role === role) { hsSkip = true; try { renderHome(); } finally { hsSkip = false; } }
      if (window.urgAfterSync) window.urgAfterSync();
    });
    return hsBusy;
  };
  wrapW('go', function (prev, name, ...a) { if (name === 'home' && Date.now() - hsAt > 5000) hsAt = 0; return prev(name, ...a); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && S.cur === 'home' && Date.now() - hsAt > 10000) homeSync(true); });
  wrapW('renderHome', function (prev, ...a) {
    const r = prev(...a);
    const host = $('s-home');
    if (!host) return r;
    const old = $('rdSec'); if (old) old.remove();
    const html = readyCard();
    if (html) { const hd = host.querySelector(':scope > header'); if (hd) hd.insertAdjacentHTML('afterend', html); else host.insertAdjacentHTML('afterbegin', html); }
    if (!hsSkip && S.auth) homeSync();
    return r;
  });

  /* ---- ماندگاری تنظیمات روی همین گوشی: تنظیمات پیام، اعلان و پوستهٔ روشن/تیره ---- */
  const KEEP = [['blk-mprefs', 'mprefs'], ['blk-nprefs', 'nprefs']];
  KEEP.forEach(([k, f]) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); if (v && typeof v === 'object') S[f] = Object.assign(S[f] || {}, v); } catch (e) {} });
  try { const th = localStorage.getItem('blk-theme'); if (th === 'light' || th === 'dark') document.documentElement.dataset.theme = th; } catch (e) {}
  const keepSnap = () => JSON.stringify([S.mprefs, S.nprefs, document.documentElement.dataset.theme || '']);
  let keepLast = keepSnap();
  setInterval(() => {
    const now = keepSnap(); if (now === keepLast) return; keepLast = now;
    try {
      KEEP.forEach(([k, f]) => localStorage.setItem(k, JSON.stringify(S[f] || {})));
      const th = document.documentElement.dataset.theme; if (th) localStorage.setItem('blk-theme', th); else localStorage.removeItem('blk-theme');
    } catch (e) {}
  }, 1000);
  // کلیدهای حریم خصوصی صفحهٔ «من» هم مثل صفحهٔ تنظیمات روی سرور ذخیره شوند
  wrapW('renderMe', function (prev, ...a) {
    const r = prev(...a);
    if (!live()) return r;
    const save = (data, ok) => api('PATCH', '/me/roles/' + S.role, { data }).then(() => { toast(ok); return LIVE.loadMe && LIVE.loadMe(); }).catch(err);
    const pub = document.querySelector('#s-me .tog[aria-label="پروفایل عمومی"]'), ph = document.querySelector('#s-me .tog[aria-label="نمایش شمارهٔ تماس"]');
    if (pub) pub.addEventListener('click', () => save({ pub: S.me.pub }, S.me.pub ? 'پروفایلت در کاوش دیده می‌شود' : 'پروفایلت خصوصی شد'));
    if (ph) ph.addEventListener('click', () => save({ showPhone: S.me.phone }, S.me.phone ? 'شماره روی کارت نمایش داده می‌شود' : 'شماره پنهان شد'));
    return r;
  });
  // کاوش (حالت نیرو): آگهی آمادگی خودم بالای فهرست — «این تویی»
  wrapW('renderResults', function (prev, ...a) {
    const r = prev(...a);
    const el = $('results'), me = myReady();
    if (!el || S.mode !== 'workers' || !S.auth || !me || (me.st || 'active') !== 'active' || $('rdMine')) return r;
    el.insertAdjacentHTML('afterbegin', `<div class="section" style="margin-top:14px"><div class="rd-mine" id="rdMine"><span class="lbl"><span class="rd-dot"></span>این تویی؛ کارفرماها این‌طور می‌بینند</span>${adCard(me, ME(), 0, true)}
      <div class="rd-acts" style="padding:8px 0 0"><button onclick="readySheet()">✎ ویرایش</button><button onclick="readyToggle().then(()=>renderExplore())">خاموش کن</button></div></div></div>`);
    return r;
  });
  // کاوش: آگهی آمادگیِ روشن = نشان سبز «آماده به کار» + نوار شمارش
  wrapW('adCard', function (prev, a, ...rest) {
    let h = prev(a, ...rest);
    if (a && a.type === 'work' && (a.st || 'active') === 'active') h = h.replace(/<span class="type"[^>]*>[^<]*<\/span>/, '<span class="type rd-type"><span class="rd-dot"></span>آماده به کار</span>');
    return h;
  });
  wrapW('renderExplore', function (prev, ...a) {
    const r = prev(...a);
    const host = $('s-explore');
    if (!host || S.mode !== 'workers' || host.querySelector('.rd-strip')) return r;
    const n = ADS.filter((x) => x.type === 'work' && x.who !== 'me' && (x.st || 'active') === 'active').length;
    if (!n) return r;
    const html = `<div class="rd-strip" role="status"><span class="rd-dot"></span><span><b class="num">${fa(n)}</b> نیرو همین الان آماده به کار است؛ روی هر کارت «چت» را بزن.</span></div>`;
    const anchor = host.querySelector('.ex-where') || host.querySelector('header.top');
    if (anchor) anchor.insertAdjacentHTML('afterend', html);
    return r;
  });

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
      <div class="hp-row"><span>پیشرفت کار${inf.steps.length ? `: ${fa(inf.doneN)} از ${fa(inf.steps.length)}` : ''}</span><b class="num">${fa(prog)}٪</b></div>
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
    return `<div class="section" id="hmProj"><div class="sec-head"><h3>پروژه‌های در جریان${L.length > 1 ? ' (' + fa(L.length) + ')' : ''}</h3><button onclick="go('proj')">همه ‹</button></div>${L.map(([p, i]) => projCard(p, i)).join('')}</div>`;
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

  // پرداخت را فقط کارفرمای قرارداد ثبت می‌کند؛ مجری دریافت را تأیید می‌کند (هم‌تراز با CLIENT_ONLY در بک‌اند)
  const isProvider = (p) => (p && p._x ? !p.meClient : !CLIENT_ROLES.includes(S.role));
  window.isProvider = isProvider;
  wrapW('addPay', function (prev, k, ...a) {
    const p = (S.projs[S.role] || [])[+String(k).split(':')[1]];
    if (p && p._x && isProvider(p)) { toast('پرداخت را کارفرما ثبت می‌کند؛ تو فقط دریافت را تأیید می‌کنی'); return; }
    return prev(k, ...a);
  });
  function payRules(host, p) {
    if (!p || !p._x || !isProvider(p)) return;
    const sec = [...host.querySelectorAll('.section')].find((s) => /دفترچهٔ پرداخت/.test((s.querySelector('.sec-head h3') || {}).textContent || ''));
    const b = sec && sec.querySelector('.sec-head button[onclick^="addPay"]');
    if (b) b.outerHTML = '<span>کارفرما ثبت می‌کند · تو تأیید می‌کنی</span>';
  }

  // قرارداد امضاشده ← دکمهٔ بزرگ «رفتن به پروژه» برای هر دو طرف
  wrapW('renderCtr', function (prev, ...a) {
    const r = prev(...a);
    const host = $('s-ctr'), ct = S.ctr && S.ctr[S.role + ':' + S.pi];
    if (!host || !ct || host.querySelector('.ctr-go')) return r;
    const active = ct._c ? ct._c.status === 'active' : ct.me && ct.them;
    if (!active) return r;
    const p = (S.projs[S.role] || [])[S.pi];
    const next = !p ? '' : p.stage < 2 ? 'قدم بعد: «شروع کار» را بزنید' : p.stage === 2 ? (isProvider(p) ? 'قدم بعد: هر کاری تمام شد تیکش را بزن' : 'قدم بعد: پرداخت‌ها را ثبت کن و پیشرفت را ببین') : 'پروژه تمام شده';
    const html = `<div class="section ctr-go"><div class="card" style="display:flex;gap:12px;align-items:center;border:1px solid color-mix(in srgb,var(--ok) 45%,transparent)">
      <span class="nt-ic" style="color:var(--ok)">✓</span><div style="flex:1"><b style="display:block">قرارداد فعال است</b><span style="font-size:13px;color:var(--muted)">${esc(next)}</span></div>
      <button class="cta" style="margin:0;width:auto;padding:0 16px;min-height:44px" onclick="openProjPage(${S.pi})">رفتن به پروژه</button></div></div>`;
    const bar = host.querySelector('.bar, .pagebar, header');
    if (bar) bar.insertAdjacentHTML('afterend', html); else host.insertAdjacentHTML('afterbegin', html);
    return r;
  });

  // صفحهٔ پروژه: بخش «پیشرفت کار»
  wrapW('renderPdet', function (prev, ...a) {
    const r = prev(...a);
    const host = $('s-pdet'), p = (S.projs[S.role] || [])[S.pi];
    if (host && p) payRules(host, p);
    if (!host || !p || host.querySelector('#pgSec')) return r;
    const i = S.pi, inf = projInfo(p);
    if (!inf.steps.length && !inf.canTick) return r;
    const html = `<div class="section" id="pgSec"><div class="sec-head"><h3>پیشرفت کار</h3><span>${inf.steps.length ? `${fa(inf.doneN)} از ${fa(inf.steps.length)}، ${fa(inf.pct)}٪` : ''}</span></div>
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
        sum.insertAdjacentHTML('beforeend', `<div class="cw-amt"><span>مبلغ کل</span><b>${moneyFa(w.amount)} تومان<br><small style="font-weight:400;color:var(--accent)">${numWordsT(w.amount)}</small></b></div>${list.length ? `<div><span>فهرست کار</span><b>${list.map(esc).join('، ')}</b></div>` : ''}`);
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
    if (box) box.innerHTML = t > 0 ? `<small>جمع کل قرارداد</small><b class="num">${moneyFa(t)} تومان</b><span>${numWordsT(t)}</span>` : `<small>جمع کل قرارداد</small><b>—</b><span>مبلغ را بنویس</span>`;
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

  /* ================= ۵) صورت‌وضعیت ساده =================
   * هر ردیف = «یک کار + مبلغش + چند درصد انجام شده». بدون واحد، مقدار کل و فی.
   * (در داده: u='درصد'، q=100، p=مبلغ÷۱۰۰، done=درصد — همان قالب سرور؛ ردیف‌های قدیمی واحدی هم نمایش داده می‌شوند)
   * پرداخت صورت‌وضعیت تأییدشده را کارفرما ثبت می‌کند. */
  const sovCss = document.createElement('style');
  sovCss.textContent = `
  .sv-row{background:var(--surface);box-shadow:var(--shadow);border-radius:18px;padding:14px;margin-bottom:10px}
  .sv-h{display:flex;gap:8px;align-items:flex-start}.sv-h b{flex:1;font-size:15px;line-height:1.6}.sv-h small{color:var(--muted);font-size:12.5px;white-space:nowrap}
  .sv-bar{height:12px;border-radius:7px;background:var(--soft);margin:10px 0 8px;position:relative;overflow:hidden}
  .sv-bar i{position:absolute;top:0;bottom:0;inset-inline-start:0;border-radius:7px}.sv-bar i.pv{background:var(--concrete-2)}.sv-bar i.nw{background:var(--gold)}
  .sv-ctl{display:flex;align-items:center;gap:10px}
  .sv-ctl button{width:46px;height:46px;border-radius:14px;border:1px solid var(--line);background:var(--surface);font-size:24px;font-family:inherit;color:var(--ink);flex:none}
  .sv-ctl button:disabled{opacity:.35}
  .sv-ctl .pc{flex:1;text-align:center}.sv-ctl .pc b{display:block;font-size:24px;line-height:1.2}.sv-ctl .pc small{font-size:12px;color:var(--muted)}
  .sv-now{margin-top:8px;font-size:13px;color:var(--muted);display:flex;justify-content:space-between}.sv-now b{color:var(--gold)}
  .sv-pay{background:var(--night);color:#fff;border-radius:20px;padding:16px;text-align:center}
  .sv-pay small{display:block;color:var(--concrete);font-size:13px}.sv-pay b{display:block;font-size:26px;margin:4px 0}
  .sv-pay span{display:block;color:var(--gold-2);font-size:13px;line-height:1.7}
  .sv-pay details{margin-top:10px;text-align:start;font-size:13px;color:var(--concrete)}
  .sv-pay details summary{cursor:pointer;text-align:center}
  .sv-pay .est-leg{color:var(--concrete)}.sv-pay .est-leg b{font-size:13px;display:inline;margin:0;color:#fff}
  .sv-pct{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
  .sv-pct button{min-height:46px;border-radius:12px;border:1px solid var(--line);background:var(--surface);font-family:inherit;font-size:15px;color:var(--ink)}
  .sv-pct button[aria-pressed=true]{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,var(--surface));color:var(--accent);font-weight:800}`;
  document.head.appendChild(sovCss);
  const SG_K = 'blk-sovg2';
  const sgOpen = () => { try { return localStorage.getItem(SG_K) !== '0'; } catch (e) { return true; } };
  window.sgTog = (el) => { try { localStorage.setItem(SG_K, el.open ? '1' : '0'); } catch (e) {} };
  function guideHTML() {
    return `<div class="section"><details class="sov-guide" ${sgOpen() ? 'open' : ''} ontoggle="sgTog(this)"><summary><span class="q">؟</span>صورت‌وضعیت چطور کار می‌کند؟<em>راهنما</em></summary>
      <div class="sg-steps">
        <div class="sg-step"><span class="n">۱</span><span><b>کارها را با مبلغشان بنویس</b><small>مثلاً «سیم‌کشی واحد ۱ — ۲۰۰ میلیون». یا با یک دکمه از قرارداد بساز.</small></span></div>
        <div class="sg-step"><span class="n">۲</span><span><b>بگو هر کار چند درصد تمام شده</b><small>با دکمه‌های + و −. بخش طلایی نوار = کار همین دوره که پولش را می‌خواهی.</small></span></div>
        <div class="sg-step"><span class="n">۳</span><span><b>بفرست</b><small>کارفرما تأیید می‌کند و مبلغ را پرداخت و در دفترچه ثبت می‌کند؛ تو دریافت را تأیید می‌کنی.</small></span></div>
      </div></details></div>`;
  }
  const sovKey = () => S.role + ':' + S.pi;
  const sovV = (k) => S.sov[k] || (typeof sovOf === 'function' ? sovOf(k) : null);
  const isPct = (r) => r.u === 'درصد' && +r.q === 100;
  const rowAmt = (r) => Math.round(r.q * r.p);
  function sovAutoHTML(i) {
    const p = (S.projs[S.role] || [])[i], inf = projInfo(p);
    return `<div class="section" id="sovAuto"><div class="sec-head"><h3>شروع با یک لمس</h3><span>از قرارداد</span></div><div class="sov-auto">
      <button onclick="sovAuto('pct')"><span class="ic">٪</span><span><b>یک ردیف: کل کار</b><small>${inf.total ? 'به مبلغ ' + moneyFa(inf.total) + ' تومان؛ ' : ''}فقط بگو چند درصد تمام شده.</small></span></button>
      ${inf.steps.length ? `<button onclick="sovAuto('steps')"><span class="ic">✓</span><span><b>از فهرست کار (${fa(inf.steps.length)} ردیف)</b><small>${esc(inf.steps.slice(0, 4).map((s) => s.t).join('، '))}${inf.steps.length > 4 ? '…' : ''}</small></span></button>` : ''}
    </div></div>`;
  }
  window.sovAuto = function (mode) {
    const i = S.pi, p = (S.projs[S.role] || [])[i], inf = projInfo(p), v = sovV(sovKey());
    if (!v) return;
    if (!inf.total) { toast('مبلغ کل قرارداد ثبت نشده؛ کار را با «+ افزودن کار» اضافه کن'); return; }
    if (mode === 'pct') v.items.push({ n: 'کل کار: ' + p.t.slice(0, 80), u: 'درصد', q: 100, done: inf.pct || 0, prev: 0, p: Math.round(inf.total / 100) });
    else { const each = inf.total / inf.steps.length; inf.steps.forEach((s) => v.items.push({ n: s.t, u: 'درصد', q: 100, done: s.done ? 100 : 0, prev: 0, p: Math.round(each / 100) })); }
    renderSov(true);
    toast('آماده شد؛ درصدها را درست کن و بفرست');
  };
  window.sovAddSimple = function () {
    let pct = 0;
    sb.innerHTML = `<div class="grab"></div><h3 id="sheetTitle">افزودن کار</h3><p class="sub">فقط اسم کار، مبلغش و اینکه چقدرش تمام شده.</p>
      <span class="label" style="margin-top:0">چه کاری؟</span><input class="field" id="svN" placeholder="مثلاً سیم‌کشی واحد ۱">
      <span class="label">مبلغ این کار (تومان)</span><div class="numf"><input class="field" id="svA" data-money="1" inputmode="numeric" placeholder="مثلاً ۲۰۰.۰۰۰.۰۰۰"><span>تومان</span></div>
      <span class="label">تا امروز چند درصد تمام شده؟</span><div class="sv-pct" id="svP">${[0, 25, 50, 75, 100].map((x) => `<button aria-pressed="${x === 0}" data-v="${x}">${fa(x)}٪</button>`).join('')}</div>
      <button class="cta" id="svGo">افزودن</button>`;
    show();
    $('svP').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; pct = +b.dataset.v; $('svP').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b)); };
    $('svGo').onclick = () => {
      const n = $('svN').value.trim(), amt = +digits($('svA').value);
      if (n.length < 2) { toast('اسم کار را بنویس'); return; }
      if (!(amt >= 100)) { toast('مبلغ این کار را بنویس'); return; }
      sovV(sovKey()).items.push({ n: n.slice(0, 120), u: 'درصد', q: 100, done: pct, prev: 0, p: Math.round(amt / 100) });
      closeSheet(); renderSov(true);
    };
  };
  wrapW('sovQ', function (prev, key, k, d) {
    const v = sovV(key), r = v && v.items[k];
    if (r && isPct(r)) { r.done = Math.max(r.prev, Math.min(100, r.done + d * 10)); renderSov(true); return; }
    if (r && r.u === 'مرحله') { r.done = Math.max(r.prev, Math.min(r.q, r.done + d)); renderSov(true); return; }
    return prev(key, k, d);
  });
  function rowHTML(key, r, k, edit) {
    const pct = isPct(r);
    const doneP = pct ? r.done : Math.round((r.done / r.q) * 100), prevP = pct ? r.prev : Math.round((r.prev / r.q) * 100);
    const now = Math.round((r.done - r.prev) * r.p);
    return `<div class="sv-row"><div class="sv-h"><b>${esc(r.n)}</b><small class="num">${pct ? moneyFa(rowAmt(r)) + ' تومان' : `${fa(r.q)} ${esc(r.u)} × ${moneyFa(r.p)}`}</small></div>
      <div class="sv-bar" aria-hidden="true"><i class="pv" style="width:${prevP}%"></i><i class="nw" style="inset-inline-start:${prevP}%;width:${Math.max(0, doneP - prevP)}%"></i></div>
      <div class="sv-ctl">${edit ? `<button onclick="sovQ('${key}',${k},-1)" aria-label="کمتر" ${r.done <= r.prev ? 'disabled' : ''}>−</button>` : ''}
        <div class="pc"><b class="num">${pct ? fa(r.done) + '٪' : fa(r.done) + ' ' + esc(r.u)}</b><small>${pct ? 'انجام شده' : 'از ' + fa(r.q) + ' ' + esc(r.u)}${r.prev ? ' · قبلاً ' + (pct ? fa(r.prev) + '٪' : fa(r.prev)) : ''}</small></div>
        ${edit ? `<button onclick="sovQ('${key}',${k},1)" aria-label="بیشتر" ${r.done >= r.q ? 'disabled' : ''}>+</button>` : ''}</div>
      ${now > 0 ? `<div class="sv-now"><span>این دوره</span><b class="num">+${moneyFa(now)} تومان</b></div>` : ''}</div>`;
  }
  wrapW('renderSov', function (prev, ...a) {
    const r = prev(...a);
    const host = $('s-sov'), key = sovKey(), v = sovV(key), p = (S.projs[S.role] || [])[S.pi];
    if (!host || !v || !p) return r;
    const provider = isProvider(p), edit = provider && v.st === 'draft';
    // صورت‌وضعیت خالی: درصد پیشرفت «NaN٪» نشود
    host.querySelectorAll('.sov-ring b, .sov-hero h2').forEach((b) => { if (/NaN/.test(b.textContent)) b.textContent = b.textContent.replace(/NaN/g, '۰'); });
    const secs = [...host.querySelectorAll(':scope > .section')];
    const rowsSec = secs.find((s) => s.querySelector('.sov-row') || /ردیف‌های کار/.test(s.textContent));
    const sumCard = secs.map((s) => s.querySelector('.card')).find((c) => c && /خلاصهٔ مالی/.test(c.textContent));
    // ۱) ردیف‌ها
    if (rowsSec) {
      rowsSec.innerHTML = `<div class="sec-head"><h3>کارها</h3><span>${edit ? 'با + و − بگو چند درصد تمام شده' : ''}</span></div>
        ${v.items.length ? v.items.map((x, k) => rowHTML(key, x, k, edit)).join('') : `<div class="empty">${edit ? 'هنوز کاری اضافه نشده.' : 'مجری هنوز کاری ثبت نکرده.'}</div>`}
        ${edit ? `<button class="ghost" style="width:100%" id="sovAdd2">+ افزودن کار</button>` : ''}`;
      const b = $('sovAdd2'); if (b) b.onclick = sovAddSimple;
    }
    const oldAdd = $('sovAdd'); if (oldAdd) oldAdd.remove();
    // ۲) خلاصهٔ مالی: فقط «قابل پرداخت» بزرگ؛ کسورات در جزئیات
    if (sumCard) {
      const legs = [...sumCard.querySelectorAll('.est-leg')];
      const net = legs.find((l) => l.classList.contains('sov-net'));
      const netB = net ? net.querySelector('b').textContent : '';
      const n = +digits(netB);
      sumCard.outerHTML = `<div class="sv-pay"><small>قابل پرداخت این صورت‌وضعیت</small><b class="num">${esc(netB)}</b><span>${n > 0 ? numWordsT(n) : 'هنوز کاری برای این دوره ثبت نشده'}</span>
        <details><summary>جزئیات و کسورات</summary>${legs.filter((l) => l !== net).map((l) => l.outerHTML).join('')}<p style="margin:6px 0 0;line-height:1.8">«حسن انجام کار» بخشی است که کارفرما تا پایان کار نگه می‌دارد؛ «بیمه» سهم بیمهٔ کارگاه است.</p></details></div>`;
    }
    host.querySelectorAll('.sr-leg').forEach((x) => x.remove());
    // ۳) راهنما و شروع سریع
    if (!host.querySelector('.sov-guide')) {
      const hero = host.querySelector('.sov-hero');
      if (hero) hero.insertAdjacentHTML('afterend', guideHTML()); else host.insertAdjacentHTML('afterbegin', guideHTML());
    }
    if (edit && !v.items.length && !host.querySelector('#sovAuto')) host.querySelector('.sov-guide').closest('.section').insertAdjacentHTML('afterend', sovAutoHTML(S.pi));
    // ۴) دکمه‌ها: پرداخت صورت‌وضعیت تأییدشده فقط با کارفرما
    const acts = [...host.querySelectorAll(':scope > .section')].pop();
    if (acts) {
      acts.querySelectorAll('.est-note').forEach((x) => x.remove());
      if (v.st === 'ok') {
        const c = acts.querySelector('.cta');
        if (c && provider) c.outerHTML = '<p class="hint center">تأیید شد ✓ کارفرما پرداخت را ثبت می‌کند؛ بعد در «دفترچهٔ پرداخت» دریافت را تأیید کن.</p>';
        else if (c) c.textContent = 'پرداخت کردم؛ ثبت در دفترچهٔ پرداخت';
      }
      if (edit) { const c = acts.querySelector('.cta'); if (c && /ارسال/.test(c.textContent)) c.disabled = !v.items.some((x) => x.done > x.prev); }
    }
    return r;
  });

  /* ================= خانه: پروژهٔ فعال در کارت اصلی بالای صفحه، با انیمیشن همان نوع کار =================
   * ساختمان (طبقه‌ها بالا می‌روند) · برق (سیم و لامپ) · لوله‌کشی (آب در لوله) · کاشی · نقشه (خط‌کشی) · بازسازی (غلتک رنگ) · روزانه (تقویم) */
  const heroCss = document.createElement('style');
  heroCss.textContent = `
  .ph-hero{position:relative;overflow:hidden}
  .ph-hero .ph-top{display:flex;gap:12px;align-items:flex-start;position:relative}
  .ph-hero .ph-t{flex:1;min-width:0}.ph-hero small{color:var(--concrete);font-size:12.5px}
  .ph-hero h2{font-size:19px;line-height:1.5;margin:2px 0}
  .ph-hero .ph-who{font-size:13px;color:var(--concrete)}
  .ph-art{flex:none;width:132px;height:112px}
  .ph-hero .hp-steps{position:relative}.ph-hero .hp-steps span{border-color:rgba(255,255,255,.18);color:#E5E7EB}
  .ph-hero .hp-steps span.d{background:rgba(47,179,122,.22);border-color:rgba(47,179,122,.6);color:#8FE3B8}
  .ph-kpi{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px;position:relative}
  .ph-kpi div{background:rgba(255,255,255,.07);border-radius:12px;padding:8px 6px;text-align:center}
  .ph-kpi b{display:block;font-size:15px;color:#fff}.ph-kpi small{display:block;font-size:11.5px}
  .ph-bar{height:8px;border-radius:5px;background:rgba(255,255,255,.12);margin-top:12px;overflow:hidden;position:relative}
  .ph-bar i{position:absolute;top:0;bottom:0;inset-inline-start:0;border-radius:5px;background:var(--gold);width:0;transition:width 1.2s cubic-bezier(.3,1,.4,1)}
  .ph-row{display:flex;align-items:center;gap:8px;margin-top:12px;position:relative}
  .ph-row .go{margin-inline-start:auto;border:0;border-radius:12px;background:var(--gold);color:#1a1205;font:800 14px inherit;font-family:inherit;min-height:42px;padding:0 14px}
  .ph-nav{display:flex;gap:6px;align-items:center}
  .ph-nav button{width:34px;height:34px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:none;color:#fff;font-size:16px}
  .ph-nav span{font-size:12px;color:var(--concrete)}
  @keyframes phRise{from{transform:translateY(14px);opacity:0}to{transform:none;opacity:1}}
  @keyframes phSwing{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}
  @keyframes phBlink{50%{opacity:.35}}
  @keyframes phDraw{from{stroke-dashoffset:var(--len)}to{stroke-dashoffset:var(--to)}}
  @keyframes phFlow{to{stroke-dashoffset:-24}}
  @keyframes phGlow{50%{filter:drop-shadow(0 0 6px #FFD54A)}}
  @keyframes phPop{from{transform:scale(0)}to{transform:scale(1)}}
  @keyframes phRoll{0%,100%{transform:translateX(0)}50%{transform:translateX(var(--rx))}}
  .ph-art .rise{animation:phRise .6s both}
  .ph-art .swing{transform-box:fill-box;transform-origin:50% 0;animation:phSwing 3.2s ease-in-out infinite}
  .ph-art .blink{animation:phBlink 1.2s infinite}
  .ph-art .draw{stroke-dasharray:var(--len);animation:phDraw 1.6s .2s both cubic-bezier(.4,0,.2,1)}
  .ph-art .flow{stroke-dasharray:6 6;animation:phFlow .9s linear infinite}
  .ph-art .glow{animation:phGlow 1.6s infinite}
  .ph-art .pop{transform-box:fill-box;transform-origin:center;animation:phPop .35s both}
  .ph-art .roll{animation:phRoll 2.6s ease-in-out infinite}
  @media (prefers-reduced-motion:reduce){.ph-art *{animation:none!important}}`;
  document.head.appendChild(heroCss);
  const ART_KIND = { elec: 'elec', plumb: 'plumb', tile: 'tile', arch: 'plan', struct: 'plan', reno: 'paint', build: 'build', sup: 'build', units: 'build', days: 'days', none: 'build' };
  function artKind(p, inf) {
    // نوع کار از عنوان (حتی وقتی «۴ واحدی» دارد: سیم‌کشی ← برق)
    const g = guessTpl(String(p.t || '').replace(/[0-9۰-۹]+\s*(واحد|طبقه)/g, ''), '');
    if (g.k !== 'none' && g.k !== 'units') return ART_KIND[g.k];
    if (inf.steps[0] && /^روز /.test(inf.steps[0].t)) return 'days';
    return 'build';
  }
  // ساختمان: n طبقه، d تا تمام؛ برای برق سیم و لامپ، برای لوله‌کشی لوله و آب
  function artBuilding(n, d, mode) {
    n = Math.max(2, Math.min(8, n)); const H = 84 / n, x0 = 34, w = 64;
    let s = `<rect x="16" y="104" width="108" height="4" rx="2" fill="#5B6573"/>`;
    for (let i = 0; i < n; i++) {
      const y = 104 - (i + 1) * H, done = i < d, cur = i === d;
      s += `<g class="rise" style="animation-delay:${i * 0.12}s"><rect x="${x0}" y="${y + 1}" width="${w}" height="${H - 2}" rx="2" fill="${done ? (mode === 'build' ? '#F2B53A' : '#3D4A5A') : 'none'}" stroke="${done || cur ? '#C9D1DC' : '#4A5563'}" stroke-dasharray="${done ? 0 : 3}"/>`;
      if (mode === 'build') for (let j = 0; j < 3; j++) s += `<rect x="${x0 + 8 + j * 19}" y="${y + H / 2 - 3}" width="10" height="6" rx="1" fill="${done ? '#1F2933' : '#2B3440'}"/>`;
      if (mode === 'elec') s += `<circle cx="${x0 + w - 10}" cy="${y + H / 2}" r="${Math.min(5, H / 3)}" fill="${done ? '#FFD54A' : '#4A5563'}" class="${done ? 'glow' : ''}"/>`;
      if (mode === 'plumb') s += `<path d="M${x0 + 10} ${y + H / 2}H${x0 + w - 6}" stroke="${done ? '#5EA8FF' : '#4A5563'}" stroke-width="3" class="${done ? 'flow' : ''}"/>`;
      if (cur) s += `<rect x="${x0}" y="${y + 1}" width="${w}" height="${H - 2}" rx="2" fill="#F97316" opacity=".25" class="blink"/>`;
      s += '</g>';
    }
    if (mode === 'elec') { const len = n * H + 20, to = len - (d / n) * len; s += `<path d="M24 104V${104 - n * H}H${x0 + w - 10}" fill="none" stroke="#FFD54A" stroke-width="2.5" class="draw" style="--len:${len + 70};--to:${to + 70 * (1 - d / n)}"/>`; }
    if (mode === 'plumb') s += `<path d="M${x0 + 10} 104V${104 - n * H + H / 2}" stroke="#5EA8FF" stroke-width="4" class="flow"/>`;
    if (mode === 'build') { const top = 104 - Math.max(d, 1) * H; s += `<path d="M110 104V8M110 12H62" stroke="#F97316" stroke-width="3" fill="none"/><g class="swing" style="transform-origin:96px 12px"><path d="M96 12V${Math.max(20, top - 10)}" stroke="#C9D1DC" stroke-width="1.5"/><rect x="90" y="${Math.max(20, top - 10)}" width="12" height="8" rx="1.5" fill="#F2B53A"/></g>`; }
    return s;
  }
  function artTile(pct) { let s = ''; const N = 24, d = Math.round((pct / 100) * N); for (let i = 0; i < N; i++) { const x = 18 + (i % 6) * 17, y = 14 + Math.floor(i / 6) * 22; s += `<rect x="${x}" y="${y}" width="15" height="20" rx="2" fill="${i < d ? (i % 2 ? '#E9D8B4' : '#F2B53A') : 'none'}" stroke="#4A5563" class="${i < d ? 'pop' : ''}" style="animation-delay:${i * 0.04}s"/>`; } return s; }
  function artPlan(pct) {
    let s = '<rect x="10" y="8" width="120" height="96" rx="6" fill="#123B63"/>';
    for (let i = 1; i < 6; i++) s += `<path d="M10 ${8 + i * 16}H130M${10 + i * 20} 8V104" stroke="#2A5A86" stroke-width=".6"/>`;
    const len = 420, to = len - (pct / 100) * len;
    s += `<path d="M26 92V24H86V58H114V92ZM26 58H86M58 24V58" fill="none" stroke="#E6F1FF" stroke-width="2.2" class="draw" style="--len:${len};--to:${to}"/>`;
    return s + `<path d="M108 100l14-14 4 4-14 14z" fill="#F2B53A" class="swing"/>`;
  }
  function artPaint(pct) { const W = 104 * pct / 100; return `<rect x="18" y="14" width="104" height="80" rx="4" fill="#3D4A5A"/><rect x="18" y="14" width="${W}" height="80" rx="4" fill="#5EC2B7" class="rise"/><g class="roll" style="--rx:${-Math.max(10, W - 10)}px"><rect x="${Math.max(18, 18 + W - 14)}" y="${50}" width="22" height="12" rx="4" fill="#F2B53A"/><path d="M${Math.max(18, 18 + W - 14) + 11} 62v30" stroke="#C9D1DC" stroke-width="3"/></g>`; }
  function artDays(steps) { const L = steps.slice(0, 14); let s = ''; L.forEach((x, i) => { const cx = 22 + (i % 7) * 16, cy = 30 + Math.floor(i / 7) * 34; s += `<rect x="${cx - 7}" y="${cy - 10}" width="14" height="22" rx="3" fill="${x.done ? '#2FB37A' : 'none'}" stroke="#4A5563" class="${x.done ? 'pop' : ''}" style="animation-delay:${i * 0.05}s"/>${x.done ? `<path d="M${cx - 3} ${cy + 1}l2 3 5-6" stroke="#fff" stroke-width="2" fill="none"/>` : ''}`; }); return `<rect x="10" y="8" width="120" height="8" rx="3" fill="#F97316"/>` + s; }
  window.projArt = function (p) {
    const inf = projInfo(p), k = artKind(p, inf), pct = inf.pct != null ? inf.pct : p.stage >= 2 ? 30 : 0;
    const n = inf.steps.length && /^واحد /.test(inf.steps[0].t) ? inf.steps.length : 5;
    const d = inf.steps.length && n === inf.steps.length ? inf.doneN : Math.round((pct / 100) * n);
    const body = k === 'tile' ? artTile(pct) : k === 'plan' ? artPlan(pct) : k === 'paint' ? artPaint(pct) : k === 'days' && inf.steps.length ? artDays(inf.steps) : artBuilding(n, d, k === 'elec' ? 'elec' : k === 'plumb' ? 'plumb' : 'build');
    return `<svg class="ph-art" viewBox="0 0 140 112" aria-hidden="true">${body}</svg>`;
  };
  S.hpi = S.hpi || 0;
  window.heroNav = (d, ev) => { if (ev) ev.stopPropagation(); S.hpi += d; renderHome(); };
  // خانه: پیشنهاد آگهی نشان داده نشود (به خواست مجید)؛ همهٔ آگهی‌ها و افراد در «کاوش»
  const HOME_ADS = /^(نیروی آماده نزدیک تو|کار مناسب مهارت‌هایت|پرسش‌هایی که شاید بلدی|درخواست‌های تازه در رشتهٔ تو|پرسش‌های .+|کار نزدیک تو|متخصص‌های مورد اعتماد نزدیک تو|نیروی پیشنهادی برای تو|کار مناسب تو|پرسش‌های منتظر پاسخ|مناسب پروژه‌هایت|مناسب مهارت‌هایت)$/;
  function noHomeAds(host) {
    [...host.querySelectorAll(':scope > .section')].forEach((sec) => {
      const h = sec.querySelector('.sec-head h3'), t = h ? h.textContent.trim() : '';
      if (HOME_ADS.test(t) || (sec.querySelector('.acard, .scard') && !sec.querySelector('.rd-prev'))) sec.remove();
    });
  }
  window.noHomeAds = noHomeAds;
  // دکمه‌های سریع روی کارت اصلی: مجری (تیک کار بعدی، گزارش امروز، شروع کار) · کارفرما (ثبت پرداخت، صورت‌وضعیت، پایان کار) · چت برای هر دو
  window.heroAct = function (act, i, ev) {
    if (ev) ev.stopPropagation();
    const p = (S.projs[S.role] || [])[i]; if (!p) return;
    S.pi = i;
    const key = S.role + ':' + i;
    if (act === 'tick') { const inf = projInfo(p), k = inf.steps.findIndex((s) => !s.done); if (k > -1) pgTick(i, k); else toast('همهٔ کارها تیک خورده'); return; }
    if (act === 'list') { pgEdit(i); return; }
    if (act === 'daily' && typeof addDaily === 'function') { addDaily(key); return; }
    if (act === 'pay' && typeof addPay === 'function') { addPay(key); return; }
    if (act === 'sov' && typeof openSov === 'function') { openSov(i); return; }
    if (act === 'stage' && typeof advProj === 'function') { advProj(i); return; }
    if (act === 'chat') { if (p.cid && window.LIVE && LIVE.openConv && p._live) LIVE.openConv(p.cid); else if (p.who && typeof openChatWith === 'function') openChatWith(p.who); return; }
    if (act === 'ctr' && typeof openContract === 'function') { openContract(i); return; }
  };
  // دکمه‌های سریع (گرد و کوچک): مجری (شروع، تیک کار بعدی، گزارش، صورت‌وضعیت) · کارفرما (پرداخت، صورت‌وضعیت، پایان) · چت
  function heroActs(p, i, inf) {
    const prov = isProvider(p), b = (act, ic, t, main) => `<button class="pa ${main ? 'm' : ''}" onclick="heroAct('${act}',${i},event)" aria-label="${t}"><span aria-hidden="true">${ic}</span><small>${t}</small></button>`;
    const L = [];
    if (prov) {
      if (p.stage < 2) L.push(b('stage', '▶', 'شروع', 1));
      if (inf.steps.length && inf.steps.some((s) => !s.done)) L.push(b('tick', '✓', 'تیک', p.stage >= 2));
      if (!inf.steps.length) L.push(b('list', '☰', 'فهرست'));
      if (p.stage >= 2) L.push(b('daily', '✎', 'گزارش'));
      L.push(b('sov', '▤', 'صورت‌وضعیت'));
    } else {
      if (p.stage < 2) L.push(b('stage', '▶', 'شروع', 1));
      L.push(b('pay', '₮', 'پرداخت', p.stage >= 2));
      L.push(b('sov', '▤', 'صورت‌وضعیت'));
      if (p.stage === 2) L.push(b('stage', '⚑', 'پایان'));
    }
    L.push(b('chat', '…', 'چت'));
    return `<div class="ph-acts">${L.join('')}</div>`;
  }
  /* ---- یک کارت اسلایدی: هر پروژه یک برگ؛ کارت دیگر نقش (تقاضا، رشته…) برگ آخر همان کارت ---- */
  const phCss2 = document.createElement('style');
  phCss2.textContent = `
  .ph-wrap{position:relative;margin:12px 16px 0}
  .ph-track{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;gap:10px;scrollbar-width:none;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}
  .ph-track::-webkit-scrollbar{display:none}
  .ph-track>.ph-slide{flex:0 0 100%;scroll-snap-align:center;margin:0!important;min-height:300px;transition:transform .45s cubic-bezier(.3,1,.4,1),opacity .45s;transform:scale(.94);opacity:.55}
  .ph-track>.ph-slide.on{transform:none;opacity:1}
  .ph-slide.ph-ext{padding:0;overflow:hidden;border-radius:22px}
  .ph-slide.ph-ext>.hcard{margin:0;height:100%;box-shadow:none}
  .ph-dots{display:flex;justify-content:center;gap:6px;margin-top:10px}
  .ph-dots button{width:7px;height:7px;border-radius:5px;border:0;padding:0;background:var(--line);transition:width .35s cubic-bezier(.3,1.4,.5,1),background .3s}
  .ph-dots button[aria-current=true]{width:22px;background:var(--gold)}
  .ph-hero .ph-art{width:150px;height:126px}
  .ph-hero h2{font-size:18px}
  .ph-acts{display:flex;justify-content:space-between;gap:4px;margin-top:14px;position:relative}
  .ph-acts .pa{flex:1;border:0;background:none;color:#E5E7EB;display:flex;flex-direction:column;align-items:center;gap:5px;padding:0;font-family:inherit;min-height:0}
  .ph-acts .pa span{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-size:17px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.14);transition:transform .2s}
  .ph-acts .pa:active span{transform:scale(.88)}
  .ph-acts .pa small{font-size:11px;color:var(--concrete);white-space:nowrap}
  .ph-acts .pa.m span{background:var(--gold);border-color:var(--gold);color:#1a1205;box-shadow:0 0 0 0 rgba(242,181,58,.5);animation:paPulse 2.4s infinite}
  @keyframes paPulse{70%{box-shadow:0 0 0 10px rgba(242,181,58,0)}100%{box-shadow:0 0 0 0 rgba(242,181,58,0)}}
  .ph-slide.on .ph-art .rise{animation:phRise .6s both}
  @media (prefers-reduced-motion:reduce){.ph-track>.ph-slide{transition:none;transform:none;opacity:1}.ph-acts .pa.m span{animation:none}}`;
  document.head.appendChild(phCss2);
  function slideHTML(p, i) {
    const w = p.who && person(p.who), inf = projInfo(p);
    const prog = inf.pct != null ? inf.pct : p.stage >= 2 ? 50 : 0;
    const left = !inf.started ? `${fa(inf.durD)} روز` : inf.left == null ? '—' : `${fa(Math.abs(inf.left))} روز`;
    const next = p.stage < 2 ? 'منتظر شروع' : inf.steps.length ? (inf.steps.find((s) => !s.done) ? 'بعدی: ' + inf.steps.find((s) => !s.done).t : 'همهٔ کارها تیک خورد') : 'در حال اجرا';
    return `<div class="hcard ph-hero ph-slide" data-i="${i}" role="button" tabindex="0" onclick="openProjPage(${i})"><div class="stars"></div>
      <div class="ph-top"><div class="ph-t"><small>${w ? esc(w.name) : ''}</small><h2>${esc(p.t)}</h2><div class="ph-who">${esc(next)}</div></div>${projArt(p)}</div>
      <div class="ph-bar" aria-label="پیشرفت ${fa(prog)} درصد"><i data-w="${prog}"></i></div>
      ${inf.steps.length ? stepsHTML(i, inf, 6) : ''}
      <div class="ph-kpi"><div><b class="num">${fa(prog)}٪</b><small>پیشرفت</small></div><div><b class="num">${inf.total ? moneyM(inf.paid) : '—'}</b><small>دریافت${inf.total ? ' از ' + moneyM(inf.total) : ''}</small></div><div><b class="num" style="${inf.left != null && inf.left < 0 ? 'color:#FF8A80' : ''}">${left}</b><small>${!inf.started ? 'مدت قرارداد' : inf.left != null && inf.left < 0 ? 'تأخیر' : 'مانده'}</small></div></div>
      ${heroActs(p, i, inf)}</div>`;
  }
  function bindSlider(wrap) {
    const tr = wrap.querySelector('.ph-track'), slides = [...tr.children], dots = [...wrap.querySelectorAll('.ph-dots button')];
    const mark = (k) => {
      slides.forEach((s, j) => s.classList.toggle('on', j === k));
      dots.forEach((d, j) => d.setAttribute('aria-current', j === k));
      if (S.hpi !== k) { S.hpi = k; const b = slides[k] && slides[k].querySelector('.ph-bar i'); if (b) { b.style.width = '0'; requestAnimationFrame(() => (b.style.width = b.dataset.w + '%')); } }
    };
    // فقط کارت افقی جابه‌جا شود، نه کل صفحه (scrollIntoView صفحه را هم تکان می‌داد)
    const goTo = (k, smooth) => { const d = slides[k].getBoundingClientRect().left - tr.getBoundingClientRect().left; tr.scrollBy({ left: d, behavior: smooth ? 'smooth' : 'auto' }); };
    const cur = () => { const w = tr.clientWidth || 1; return Math.max(0, Math.min(slides.length - 1, Math.round(Math.abs(tr.scrollLeft) / (w + 10)))); };
    let t = 0;
    tr.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(() => mark(cur()), 60); }, { passive: true });
    dots.forEach((d, j) => d.addEventListener('click', (e) => { e.stopPropagation(); goTo(j, true); mark(j); }));
    const k = Math.min(slides.length - 1, Math.max(0, S.hpi || 0));
    // بدون انیمیشن به برگ قبلی برگرد (بازرسم صفحه نباید برگ را عوض کند)
    tr.style.scrollBehavior = 'auto';
    if (k) { try { goTo(k, false); } catch (e) {} }
    requestAnimationFrame(() => { tr.style.scrollBehavior = ''; mark(k); slides.forEach((s) => { const b = s.querySelector('.ph-bar i'); if (b) b.style.width = b.dataset.w + '%'; }); });
  }
  wrapW('renderHome', function (prev, ...a) {
    const r = prev(...a);
    const host = $('s-home');
    if (!S.auth || !host) return r;
    const L = (S.projs[S.role] || []).map((p, i) => [p, i]).filter(([p]) => p.stage >= 1 && p.stage < 3 && (!p.status || p.status === 'active'));
    const old = $('phHero'); if (old) old.remove();
    noHomeAds(host);
    const list = $('hmProj'); if (list) list.remove();
    if (!L.length) return r;
    // کارت اصلی دیگرِ نقش: نمونه‌های «کارگاه/شیفت/پروژهٔ من» حذف؛ کارت‌های واقعی (تقاضا، رشته) برگ آخر همین کارت
    const hero = host.querySelector(':scope > .hcard');
    let ext = null;
    if (hero && (hero.id === 'csite' || /^\s*(شیفت امروز|پروژهٔ من)/.test(hero.textContent))) hero.remove();
    else if (hero) ext = hero;
    const n = L.length + (ext ? 1 : 0);
    if (S.hpi >= n) S.hpi = 0;
    const html = `<div class="ph-wrap" id="phHero"><div class="ph-track">${L.map(([p, i]) => slideHTML(p, i)).join('')}${ext ? '<div class="ph-slide ph-ext"></div>' : ''}</div>
      ${n > 1 ? `<div class="ph-dots" role="tablist">${Array.from({ length: n }, (_, k) => `<button role="tab" aria-label="برگ ${fa(k + 1)} از ${fa(n)}"></button>`).join('')}</div>` : ''}</div>`;
    const anchor = $('ugIn') || $('ugBtnSec') || $('rdSec') || host.querySelector(':scope > header');
    if (ext) ext.insertAdjacentHTML('beforebegin', html);
    else if (anchor) anchor.insertAdjacentHTML('afterend', html);
    else host.insertAdjacentHTML('afterbegin', html);
    const wrap = $('phHero');
    if (ext) wrap.querySelector('.ph-ext').appendChild(ext);
    bindSlider(wrap);
    return r;
  });

})();
