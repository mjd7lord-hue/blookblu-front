/* =====================================================================
 * pay.js — دور ۵۳: درگاه پرداخت (زرین‌پال) — بعد از real.js، قبل از desktop.js
 *   ۱) ارتقای آگهی: قیمت‌ها از سرور (/api/pay/plans، قابل تغییر از پنل) ← پرداخت ← آگهی «ویژه»/«فوری»/نردبان
 *   ۲) هزینهٔ داوری: «پرداخت آنلاین» روی کارت پرونده ← پرداخت ← پرونده خودکار جلو می‌رود
 *   ۳) برگشت از درگاه (?pay=<id>): برگهٔ نتیجه با کد پیگیری
 * مبلغ را اپ نمی‌فرستد؛ سرور حساب می‌کند و پرداخت را فقط با تأیید خود درگاه قبول می‌کند.
 * بدون سرور (نسخهٔ نمایشی) همان رفتار قبلی index.html.
 * ===================================================================== */
(function () {
  const on = () => !!(window.LIVE && LIVE.on);
  const wrapW = (name, fn) => { const prev = window[name]; if (typeof prev !== 'function') return; window[name] = function (...a) { return fn.call(this, prev, ...a); }; };
  const err = (e) => (window.LIVE && LIVE.err ? LIVE.err(e) : toast((e && e.message) || 'خطا'));
  const PAY = { plans: null, online: false, test: false };

  const css = document.createElement('style');
  css.textContent = `.bst-badge{display:inline-block;font-size:11px;font-weight:800;border-radius:7px;padding:1px 7px;margin-inline-end:6px;vertical-align:2px}
  .bst-badge.star{background:color-mix(in srgb,var(--gold) 20%,transparent);color:var(--gold)}.bst-badge.urgent{background:color-mix(in srgb,var(--bad) 14%,transparent);color:var(--bad)}
  .pay-res{text-align:center;padding:6px 0 2px}.pay-res .ic{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;margin:0 auto 10px;font-size:32px;color:#fff}
  .pay-res .ic.ok{background:var(--ok)}.pay-res .ic.no{background:var(--bad)}.pay-res h3{margin:0 0 4px}
  .pay-rows{margin-top:12px;text-align:start}.pay-rows div{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px dashed var(--line);font-size:14px}.pay-rows div:last-child{border:0}
  .pay-safe{display:flex;gap:8px;align-items:center;font-size:12.5px;color:var(--muted);margin-top:10px;justify-content:center}`;
  document.head.appendChild(css);

  /* ---- قیمت‌ها از سرور ---- */
  async function loadPlans() {
    if (!on() || PAY.plans) return;
    try {
      const d = await fetch(LIVE.base + '/api/pay/plans').then((r) => r.json());
      PAY.plans = d.plans || []; PAY.online = !!d.online; PAY.test = !!d.test;
      if (typeof BOOST !== 'undefined') {
        for (let i = BOOST.length - 1; i >= 0; i--) { const p = PAY.plans.find((x) => x.k === BOOST[i][0]); if (p) BOOST[i][3] = p.p; else BOOST.splice(i, 1); }
        if (S.bst && !BOOST.some((x) => x[0] === S.bst.pick) && BOOST[0]) S.bst.pick = BOOST[0][0];
      }
    } catch (e) {}
  }

  /* ---- شروع پرداخت: ساخت تراکنش روی سرور ← رفتن به صفحهٔ بانک ---- */
  window.payStart = function (body, btn) {
    if (btn) { btn.disabled = true; btn.dataset.t = btn.textContent; btn.textContent = 'در حال اتصال به درگاه…'; }
    LIVE.api('POST', '/pay', body)
      .then((r) => { try { sessionStorage.setItem('blk-pay', r.id); } catch (e) {} location.href = r.url; })
      .catch((e) => { if (btn) { btn.disabled = false; btn.textContent = btn.dataset.t; } err(e); });
  };
  const paySheet = (title, sub, amount, body) => {
    sb.innerHTML = `<div class="grab"></div><h3 id="sheetTitle">${title}</h3><p class="sub">${sub}</p>
      <div class="card pay-rows" style="box-shadow:none;background:var(--bg);padding:4px 14px"><div><span>مبلغ قابل پرداخت</span><b class="num">${faNum(amount)} تومان</b></div></div>
      ${PAY.online ? `<button class="cta" id="pyGo">پرداخت ${faNum(amount)} تومان</button>` : `<button class="cta" disabled>پرداخت آنلاین به‌زودی فعال می‌شود</button>`}
      <div class="pay-safe"><svg class="ico" viewBox="0 0 24 24" style="width:16px;height:16px"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>پرداخت امن از درگاه بانکی زرین‌پال${PAY.test ? ' (آزمایشی)' : ''}؛ بعد از پرداخت به بلوک برمی‌گردی</div>`;
    show();
    const b = document.getElementById('pyGo'); if (b) b.onclick = () => payStart(body, b);
  };

  /* ---- ۱) ارتقای آگهی ---- */
  wrapW('payBoost', function (prev) {
    const a = ADS.find((x) => x.id === S.bst.id), b = BOOST.find((x) => x[0] === S.bst.pick);
    if (!on() || !a || !a._live || !b) return prev();
    paySheet('پرداخت ارتقای آگهی', `${esc(b[1])} · ${esc(a.title)}`, b[3], { purpose: 'boost', targetId: a.id, plan: b[0] });
  });
  wrapW('openBoost', function (prev, id) { loadPlans().finally(() => prev(id)); });
  // نشان «ویژه» و «فوری» روی کارت آگهی (از featuredUntil/urgentUntil سرور)
  wrapW('adCard', function (prev, a, ...r) {
    const h = prev(a, ...r);
    return a && a.boost ? h.replace('<h4>', `<h4><span class="bst-badge ${a.boost}">${a.boost === 'star' ? 'ویژه' : 'فوری'}</span>`) : h;
  });

  /* ---- ۲) هزینهٔ داوری ---- */
  wrapW('arbBox', function (prev, d) {
    const h = prev(d);
    if (!on() || !d || !d._live || !d.arb || !d.arb._c) return h;
    const c = d.arb._c;
    if (c.status !== 'awaiting_payment' || !c.paidByMe || !c.id) return h;
    return h.replace(/<\/div>$/, `<button class="cta" style="margin-top:8px" onclick="payArb('${c.id}',${+c.total || 0})">پرداخت آنلاین هزینهٔ داوری</button></div>`);
  });
  window.payArb = (caseId, total) => loadPlans().finally(() => paySheet('پرداخت امانی هزینهٔ داوری', 'پول نزد بلوک امانت می‌ماند؛ اگر حل‌کننده سر قرار نیاید، کل مبلغ برمی‌گردد', total, { purpose: 'arbitration', targetId: caseId }));

  /* ---- ۳) برگشت از درگاه ---- */
  function showResult(p) {
    const ok = p.status === 'paid';
    const what = p.purpose === 'boost' ? 'ارتقای آگهی' : 'هزینهٔ داوری';
    sb.innerHTML = `<div class="grab"></div><div class="pay-res"><div class="ic ${ok ? 'ok' : 'no'}">${ok ? '✓' : '!'}</div>
      <h3 id="sheetTitle">${ok ? 'پرداخت موفق بود' : 'پرداخت انجام نشد'}</h3><p class="sub" style="margin:0">${esc(what)}</p></div>
      <div class="card pay-rows" style="box-shadow:none;background:var(--bg);padding:4px 14px">
        <div><span>مبلغ</span><b class="num">${faNum(p.amount)} تومان</b></div>
        ${ok ? `<div><span>کد پیگیری</span><b class="num" dir="ltr">${esc(p.refId || '—')}</b></div>${p.cardPan ? `<div><span>کارت</span><b class="num" dir="ltr">${esc(p.cardPan)}</b></div>` : ''}` : `<div><span>علت</span><b>${esc(p.failReason || 'پرداخت تأیید نشد')}</b></div>`}
      </div>
      ${ok ? '' : '<p class="hint" style="text-align:center">اگر پولی از حسابت کم شده، حداکثر تا ۷۲ ساعت خودکار برمی‌گردد.</p>'}
      <button class="cta" id="pyDone">${ok ? (p.purpose === 'boost' ? 'دیدن آگهی‌های من' : 'دیدن پرونده') : 'باشه'}</button>`;
    show();
    document.getElementById('pyDone').onclick = () => {
      closeSheet();
      if (!ok) return;
      if (p.purpose === 'boost') { if (LIVE.loaded) { LIVE.loaded['myads:' + S.role] = 0; LIVE.loaded['ads:work'] = 0; LIVE.loaded['ads:job'] = 0; } go('myads'); }
      else { if (LIVE.loaded) LIVE.loaded.disp = 0; go('disp'); }
    };
  }
  (function back() {
    let id = null;
    try { id = new URLSearchParams(location.search).get('pay'); } catch (e) {}
    if (!id) return;
    try { history.replaceState(null, '', location.pathname + location.search.replace(/([?&])pay=[^&]*&?/, '$1').replace(/[?&]$/, '') + location.hash); } catch (e) {}
    if (!/^[0-9a-f-]{36}$/.test(id)) { setTimeout(() => toast('نتیجهٔ پرداخت پیدا نشد؛ از «پرداخت‌های من» پیگیری کن'), 1500); return; }
    // منتظر اتصال و ورود (توکن ذخیره‌شده)
    let n = 0;
    const t = setInterval(() => {
      if (++n > 60) return clearInterval(t);
      if (!on() || !S.auth) return;
      clearInterval(t);
      LIVE.api('GET', '/pay/' + id).then((r) => showResult(r.payment)).catch(err);
    }, 500);
  })();

  if (typeof I18N === 'object') {
    Object.assign(I18N.dict, {
      'پرداخت ارتقای آگهی': 'Pay for ad boost', 'مبلغ قابل پرداخت': 'Amount to pay', 'پرداخت آنلاین به‌زودی فعال می‌شود': 'Online payment coming soon',
      'در حال اتصال به درگاه…': 'Connecting to the gateway…', 'پرداخت آنلاین هزینهٔ داوری': 'Pay arbitration fee online', 'پرداخت امانی هزینهٔ داوری': 'Escrow arbitration fee',
      'پول نزد بلوک امانت می‌ماند؛ اگر حل‌کننده سر قرار نیاید، کل مبلغ برمی‌گردد': 'Blook holds the money in escrow; if the resolver does not show up, it is fully refunded',
      'پرداخت موفق بود': 'Payment successful', 'پرداخت انجام نشد': 'Payment failed', 'ارتقای آگهی': 'Ad boost', 'هزینهٔ داوری': 'Arbitration fee', 'مبلغ': 'Amount',
      'کد پیگیری': 'Tracking code', 'کارت': 'Card', 'علت': 'Reason', 'پرداخت تأیید نشد': 'Payment was not confirmed', 'دیدن آگهی‌های من': 'See my ads', 'دیدن پرونده': 'See the case', 'باشه': 'OK',
      'اگر پولی از حسابت کم شده، حداکثر تا ۷۲ ساعت خودکار برمی‌گردد.': 'If money was taken from your account, it returns automatically within 72 hours.',
      'نتیجهٔ پرداخت پیدا نشد؛ از «پرداخت‌های من» پیگیری کن': 'Payment result not found; check “My payments”', 'ویژه': 'Featured', 'فوری': 'Urgent',
      'پرداخت لغو شد': 'Payment cancelled', 'پرداخت در زمان مقرر انجام نشد': 'Payment was not completed in time',
    });
    I18N.re = null;
  }
  // قیمت‌ها همان اول (بعد از اتصال) گرفته شود تا صفحهٔ ارتقا قیمت واقعی نشان دهد
  let tries = 0; const pl = setInterval(() => { if (on()) { clearInterval(pl); loadPlans(); } else if (++tries > 40) clearInterval(pl); }, 500);
})();
