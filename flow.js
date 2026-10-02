/* flow.js — دور ۲۷: بازبینی جریان‌ها (کیبورد، لمس، برگشت، قرارداد از چت، درخواست‌ها، پروفایل یکپارچه،
 * آگهی رایگان، جست‌وجوی افراد، پرسش تخصصی، خانهٔ ساده، از برآورد تا نیرو).
 * بدون سرور هم کار می‌کند؛ live-more.js (بخش ۱۱) همین‌ها را به API وصل می‌کند. پیش از live.js بار می‌شود. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const live = () => !!(window.LIVE && window.LIVE.on);
  const toEnD = (s) => String(s == null ? '' : s).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const wrapW = (name, fn) => { const prev = window[name]; window[name] = function (...a) { return fn.call(this, prev, ...a); }; };

  /* ================= ثابت‌ها ================= */
  const FREE_AD_LIMIT = 1; // هر کاربر رایگان: یک آگهی کار/نیروی فعال (پرسش تخصصی آزاد است)
  window.FREE_AD_LIMIT = FREE_AD_LIMIT;
  const freeLimit = () => (window.LIVE && LIVE.cfg && LIVE.cfg.limits && LIVE.cfg.limits.freeAds) || FREE_AD_LIMIT;
  const QPL = ['قشم', 'درگهان', 'طولا', 'رمکان', 'سوزا', 'بندرعباس'];

  /* ================= الف) سبک: لمس سریع، بازخورد فوری، نوار بالای مات ================= */
  const css = document.createElement('style');
  css.id = 'blk-flow';
  css.textContent = `
  /* ۲: بدون تأخیر ۳۰۰ میلی‌ثانیه و بازخورد فوری لمس */
  button,a,[role=button],[onclick],label,summary,.chip,.acard,.citem{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
  button:active,[role=button]:active,.acard:active,.citem:active,.chip:active,summary:active{opacity:.7;transition:opacity 0s!important}
  .screen.fwd,.screen.bwd{animation-duration:.18s!important}
  .acard,.scard,.crow,.rq,.ma,.ans,.need,.day,.story,.attgrid button,.rolebtn,.rolepick button,.qa button,.pp-c{animation-delay:0s!important;animation-duration:.2s!important}
  /* لایه‌های بسته روی صفحه نمانند (پیام پایین صفحه بعد از محو شدن، لمس دکمه‌های پایین را می‌گرفت) */
  #toast:not(.on),.toast:not(.on){pointer-events:none!important}
  .scrim:not(.on){pointer-events:none!important}
  .sheet:not(.on){pointer-events:none}
  /* ۳: نوار بالای صفحه‌های داخلی مات و ثابت */
  .bar{background:var(--bg)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
  .chat-top{background:var(--bg)}
  /* ۱: دکمهٔ ارسال ثابت؛ فقط کلاس عوض می‌شود */
  .snd .i-snd{display:none}.snd.has .i-snd{display:contents}.snd.has .i-mic{display:none}.snd .i-mic{display:contents}
  /* ۴: قرارداد در چت */
  .qr .qr-ctr{background:var(--accent);color:#fff;border-color:var(--accent);font-weight:700}
  .ctr-hint{display:flex;align-items:center;gap:10px;width:100%;margin:0 0 8px;padding:10px 12px;border:1px dashed var(--accent);border-radius:14px;background:color-mix(in srgb,var(--accent) 8%,var(--surface));color:var(--ink);font:500 14px/1.5 inherit;font-family:inherit;text-align:right;cursor:pointer}
  .ctr-hint b{color:var(--accent)}.ctr-hint .go{margin-inline-start:auto;color:var(--accent);font-size:18px}
  .cw-steps{display:flex;gap:6px;margin:4px 0 14px}.cw-steps div{flex:1;text-align:center;font-size:12px;color:var(--muted)}
  .cw-steps i{display:block;height:4px;border-radius:2px;background:var(--line);margin-bottom:6px}.cw-steps .on i{background:var(--accent)}.cw-steps .on{color:var(--ink);font-weight:700}
  .cw-sum{background:var(--bg);border-radius:14px;padding:12px 14px;margin:6px 0 10px}
  .cw-sum div{display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-top:1px solid var(--line);font-size:14px}.cw-sum div:first-child{border-top:0}
  .cw-sum span{color:var(--muted)}.cw-sum b{text-align:left}
  .cw-row{display:flex;gap:8px}.cw-row>*{flex:1}
  .dl-st{display:block;font-size:12.5px;margin-top:4px;opacity:.85}
  /* ۵ و ۶: صفحهٔ تأیید یکسان و مرکز درخواست‌ها */
  .rd-next{background:var(--bg);border-radius:14px;padding:10px 14px;margin:10px 0;text-align:right}
  .rd-next b{display:block;font-size:14px;margin-bottom:4px}.rd-next li{font-size:13.5px;color:var(--muted);margin:4px 0}
  .rd-next ol{margin:0;padding-inline-start:18px}.rd-where{font-size:13.5px;color:var(--muted);text-align:center;margin:-4px 0 6px}
  .rq-sum{display:flex;align-items:center;gap:12px;width:100%;border:0;background:var(--surface);box-shadow:var(--shadow);border-radius:16px;padding:12px 14px;font-family:inherit;color:var(--ink);text-align:right;cursor:pointer}
  .rq-sum .n{flex:none;min-width:30px;height:30px;padding:0 6px;border-radius:10px;display:grid;place-items:center;background:var(--accent);color:#fff;font-weight:800;font-size:14px}
  .rq-sum .n.z{background:var(--soft);color:var(--muted)}
  .rq-sum .t{flex:1}.rq-sum b{display:block;font-size:15px}.rq-sum small{display:block;font-size:12.5px;color:var(--muted)}.rq-sum .go{color:var(--muted);font-size:20px}
  .rq-k{font-size:12px;font-weight:700;border-radius:8px;padding:2px 8px;background:var(--soft);color:var(--muted);margin-inline-start:6px;white-space:nowrap}
  .collab-hint{width:100%;margin:6px 0 0;font-size:12.5px;line-height:1.6;color:var(--muted);text-align:center}
  /* ۷: پروفایل یکپارچه */
  .pv-head{display:flex;gap:14px;align-items:center;margin:6px 16px 0}
  .pv-head .t{flex:1;min-width:0}.pv-head h2{margin:0;font-size:20px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
  .pv-head .rl{font-size:14px;color:var(--muted);margin-top:2px}
  .pv-code{display:inline-flex;align-items:center;gap:6px;margin-top:6px;font-size:13px;color:var(--muted)}
  .pv-code b{direction:ltr;color:var(--ink);font-weight:700;letter-spacing:.5px}
  .pv-code button{border:1px solid var(--line);background:none;border-radius:8px;padding:2px 8px;font:500 12px inherit;font-family:inherit;color:var(--muted);min-height:28px}
  .pv-why{margin:10px 16px 0;font-size:13.5px;line-height:1.7;color:var(--muted)}
  .pv-why b{color:var(--ink)}
  .pv-score{background:var(--surface);border-radius:16px;box-shadow:var(--shadow);padding:0 14px}
  .pv-score summary{list-style:none;display:flex;align-items:center;gap:8px;min-height:48px;font-weight:700;font-size:15px;cursor:pointer}
  .pv-score summary::-webkit-details-marker{display:none}.pv-score summary::after{content:'‹';margin-inline-start:auto;color:var(--muted);transition:transform .2s;transform:rotate(-90deg)}
  .pv-score[open] summary::after{transform:rotate(90deg)}
  .pv-bars{padding:0 0 12px}.pv-bar{margin:8px 0}.pv-bar .h{display:flex;justify-content:space-between;font-size:13.5px}.pv-bar .h span{color:var(--muted);font-size:12.5px}
  .pv-bar .tr{height:9px;border-radius:6px;background:var(--soft);margin-top:5px;overflow:hidden}.pv-bar .tr i{display:block;height:100%;border-radius:6px}
  .pv-svc{display:grid;gap:8px}.pv-svc div{display:flex;justify-content:space-between;gap:8px;font-size:14px;padding:8px 0;border-top:1px solid var(--line)}.pv-svc div:first-child{border-top:0}
  .pv-svc span{color:var(--muted)}
  /* ۱۲: افراد در نتیجهٔ جست‌وجو */
  .pp-row{display:flex;gap:10px;overflow-x:auto;padding:2px 2px 8px;scrollbar-width:none}.pp-row::-webkit-scrollbar{display:none}
  .pp-c{flex:none;width:132px;border:0;background:var(--surface);box-shadow:var(--shadow);border-radius:16px;padding:12px 10px;display:flex;flex-direction:column;align-items:center;gap:4px;font-family:inherit;color:var(--ink);cursor:pointer}
  .pp-c b{font-size:14px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pp-c small{font-size:12px;color:var(--muted)}
  .pp-c code{direction:ltr;font-size:12px;color:var(--muted);font-family:inherit}
  /* ۱۳: رأی به پاسخ */
  .ans-a .vt{display:inline-flex;align-items:center;gap:6px}.ans-a .vt.on{color:var(--accent);border-color:var(--accent);background:color-mix(in srgb,var(--accent) 10%,transparent)}
  .ans-a .vt.dn.on{color:var(--bad);border-color:var(--bad);background:color-mix(in srgb,var(--bad) 8%,transparent)}
  /* ۱۵: خانهٔ ساده */
  .hm-today{border:1px solid color-mix(in srgb,var(--line) 60%,transparent);background:var(--night);color:#fff;border-radius:20px;padding:16px;display:flex;flex-direction:column;gap:8px}
  .hm-today small{color:var(--concrete);font-size:12.5px}.hm-today h2{margin:0;font-size:18px;line-height:1.5}
  .hm-today .who{font-size:13.5px;color:var(--concrete)}
  .hm-today .row{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap}
  .hm-today .go{border:0;border-radius:12px;background:var(--accent);color:#fff;font:700 14px inherit;font-family:inherit;min-height:44px;padding:0 16px}
  .hm-today .go.gh{background:rgba(255,255,255,.12)}
  .hm-today .stg{display:flex;gap:4px;margin-top:2px}.hm-today .stg i{flex:1;height:5px;border-radius:3px;background:rgba(255,255,255,.18)}.hm-today .stg i.d{background:var(--accent)}
  .role-tag{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--muted)}.role-tag i{width:8px;height:8px;border-radius:50%}
  .qa.hs{display:flex;overflow-x:auto;scrollbar-width:none}.qa.hs button{flex:0 0 22%}
  /* ۱۸: برآورد چندنوعی و «نیروی این پروژه» */
  .est-types{display:flex;gap:8px;overflow-x:auto;padding:2px 16px 4px;margin:8px 0 0;scrollbar-width:none}.est-types::-webkit-scrollbar{display:none}
  .est-types button{flex:none;border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:14px;padding:0 14px;min-height:44px;font:600 14px inherit;font-family:inherit;white-space:nowrap}
  .est-types button[aria-pressed=true]{background:var(--accent);border-color:var(--accent);color:#fff}
  .eg-steps{display:flex;gap:6px;margin:4px 16px 0}.eg-steps div{flex:1;font-size:12px;color:var(--muted);text-align:center}.eg-steps i{display:block;height:4px;border-radius:2px;background:var(--accent);margin-bottom:6px}
  .eg-p{display:flex;align-items:center;gap:10px;width:100%;border:0;border-top:1px solid var(--line);background:none;padding:10px 0;font-family:inherit;color:var(--ink);text-align:right;cursor:pointer}
  .eg-p:first-child{border-top:0}.eg-p .t{flex:1;min-width:0}.eg-p b{display:block;font-size:14.5px}.eg-p small{display:block;font-size:12.5px;color:var(--muted)}
  .eg-p .ck{flex:none;width:26px;height:26px;border-radius:8px;border:2px solid var(--line);display:grid;place-items:center;color:#fff;font-weight:900}
  .eg-p[aria-pressed=true] .ck{background:var(--accent);border-color:var(--accent)}
  .eg-sum{font-size:13.5px;line-height:1.8;white-space:pre-line;color:var(--ink)}
  `;
  document.head.appendChild(css);

  /* ================= الف-۱) کیبورد هنگام تایپ بسته نشود =================
   * هر رندر کامل صفحه‌ای که کادر نوشتن در حال تایپ دارد، همان کادر (و ظرفش) را دست‌نخورده نگه می‌دارد
   * و فقط بقیهٔ صفحه را عوض می‌کند. پس رندرهای پس‌زمینه (داده از سرور، پیام لحظه‌ای) فوکوس را نمی‌گیرند. */
  const IH = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  function keepWhileTyping(hostId, keepSel, active) {
    const host = $(hostId);
    if (!host) return;
    Object.defineProperty(host, 'innerHTML', {
      configurable: true,
      get() { return IH.get.call(this); },
      set(v) {
        const keep = [...this.children].find((ch) => ch.matches(keepSel));
        if (!keep || !active(keep)) { IH.set.call(this, v); this.dataset.cid = S.cid || ''; return; }
        const t = document.createElement('template');
        IH.set.call(t, v);
        const all = [...t.content.childNodes], nk = all.find((n) => n.nodeType === 1 && n.matches(keepSel));
        if (!nk) { IH.set.call(this, v); return; }
        [...this.childNodes].forEach((n) => { if (n !== keep) n.remove(); });
        const i = all.indexOf(nk);
        all.slice(0, i).forEach((n) => this.insertBefore(n, keep));
        all.slice(i + 1).forEach((n) => this.appendChild(n));
        // بخش‌های غیر از خود کادر (نشان فیلتر، پاسخ‌های سریع) تازه شوند
        ['.fbtn', '.qr'].forEach((sel) => { const a = keep.querySelector(sel), b = nk.querySelector(sel); if (a && b) a.innerHTML = b.innerHTML; });
      },
    });
  }
  const typingIn = (el) => { const ae = document.activeElement; return !!ae && el.contains(ae) && /^(INPUT|TEXTAREA)$/.test(ae.tagName); };
  function initKeep() {
    keepWhileTyping('s-explore', '.search', typingIn);
    keepWhileTyping('s-msg', '.search', typingIn);
    keepWhileTyping('s-chat', '.composer', (el) => { const i = el.querySelector('#cIn'); return !!i && $('s-chat').dataset.cid === String(S.cid) && (typingIn(el) || !!i.value); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initKeep); else initKeep();

  // جست‌وجو با مکث ۲۰۰ میلی‌ثانیه
  const deb = {};
  window.blkDeb = (k, fn, ms = 200) => { clearTimeout(deb[k]); deb[k] = setTimeout(fn, ms); };

  // دکمهٔ ارسال در چت: یک المان ثابت؛ با تایپ فقط کلاسش عوض می‌شود
  window.cbarHTML = function () {
    return `<button class="att" id="attB" aria-label="پیوست" onclick="openAttach()">${MI.clip}</button>
  <label class="field-w"><textarea id="cIn" rows="1" placeholder="پیام…" aria-label="متن پیام"></textarea></label>
  <button class="snd" id="sndB" aria-label="برای ضبط صدا نگه دار"><span class="i-mic">${MI.mic}</span><span class="i-snd">${MI.send}</span></button>`;
  };
  window.bindComposer = function () {
    const inp = $('cIn'), b = $('sndB');
    if (!inp || !b || inp._bound) return;
    inp._bound = 1;
    const upd = () => {
      const has = inp.value.trim().length > 0;
      if (b.classList.contains('has') !== has) { b.classList.toggle('has', has); b.setAttribute('aria-label', has ? 'فرستادن' : 'برای ضبط صدا نگه دار'); }
      inp.style.height = 'auto'; inp.style.height = Math.min(110, inp.scrollHeight) + 'px';
    };
    inp.addEventListener('input', upd);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (inp.value.trim()) sendText(inp.value.trim()); } });
    let t0 = 0, holding = false;
    b.addEventListener('pointerdown', (e) => { if (inp.value.trim()) return; e.preventDefault(); t0 = Date.now(); holding = true; S.recT = setTimeout(() => { if (holding) startRec(); }, 250); });
    const up = () => { if (!holding) return; holding = false; clearTimeout(S.recT); if (S.rec) stopRec(true); else if (Date.now() - t0 < 250) toast('برای ضبط صدا، دکمه را نگه دار'); };
    b.addEventListener('pointerup', up);
    b.addEventListener('pointerleave', () => { if (S.rec && holding) { holding = false; stopRec(true); } });
    // فرستادن بدون از دست رفتن فوکوس (کیبورد باز بماند)
    b.addEventListener('mousedown', (e) => { if (inp.value.trim()) e.preventDefault(); });
    b.addEventListener('click', () => { if (inp.value.trim()) { sendText(inp.value.trim()); inp.focus({ preventScroll: true }); } });
    upd();
  };
  // پیام‌ها: جست‌وجو فقط فهرست را تازه می‌کند
  window.msgFilter = function () {
    const q = (S.mq || '').trim();
    let L = S.convs.filter((c) => (S.mf === 'arch' ? c.arch : !c.arch)).filter((c) => (S.mf === 'unread' ? c.unread > 0 : ['project', 'ad', 'support'].includes(S.mf) ? c.type === S.mf : true));
    if (q) L = L.filter((c) => (convName(c) + lastText(c) + (c.ctx ? c.ctx.title : '')).includes(q));
    return L.sort((a, b) => b.pinned - a.pinned);
  };
  wrapW('renderMsgList', function (prev, L) { if (!L && $('clist')) return prev(msgFilter()); return prev(L); });

  // ردیف گفت‌وگو: کلیک فقط وقتی لغو شود که انگشت واقعاً بیش از ۱۰ پیکسل افقی کشیده شده
  window.bindSwipe = function (it) {
    let x0 = null, y0 = 0, dx = 0, drag = false, open = false;
    const W = 156;
    it.addEventListener('pointerdown', (e) => { x0 = e.clientX; y0 = e.clientY; dx = 0; drag = false; it.classList.add('drag'); });
    it.addEventListener('pointermove', (e) => {
      if (x0 === null) return;
      dx = e.clientX - x0;
      if (!drag && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(e.clientY - y0)) drag = true;
      if (drag) { const b = open ? W : 0, v = Math.max(0, Math.min(W, b + dx)); it.style.transform = `translateX(${v}px)`; }
    });
    const end = () => { if (x0 === null) return; it.classList.remove('drag'); if (drag) { const b = open ? W : 0, v = Math.max(0, Math.min(W, b + dx)); open = v > 60; it.style.transform = open ? `translateX(${W}px)` : ''; } x0 = null; };
    it.addEventListener('pointerup', end); it.addEventListener('pointercancel', end); it.addEventListener('pointerleave', end);
    it.addEventListener('click', (e) => { if (drag) { e.preventDefault(); drag = false; return; } if (open) { open = false; it.style.transform = ''; return; } openChat(it.dataset.id); });
  };

  /* ================= ب-۵ و ۶) صفحهٔ تأیید یکسان برای هر درخواست ================= */
  // o: {title, who, where, steps[], pid, cid}
  window.reqDone = function (o) {
    sb.innerHTML = `<div class="grab"></div><svg class="okdraw" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44"/><path d="M30 52l13 13 27-29"/></svg>
    <h3 id="sheetTitle" class="center" style="margin-top:8px">${esc(o.title || 'درخواست فرستاده شد')}</h3>
    ${o.who ? `<p class="sub center">${esc(o.who)}</p>` : ''}
    <p class="rd-where">ذخیره شد در: <b>${esc(o.where || 'درخواست‌ها ← ارسالی')}</b></p>
    <div class="rd-next"><b>بعدش چه می‌شود؟</b><ol>${(o.steps || []).map((s) => `<li>${esc(s)}</li>`).join('')}</ol></div>
    <button class="cta" onclick="closeSheet();S.rtab='out';S.rk='all';go('req')">رفتن به درخواست‌ها</button>
    ${o.cid || o.pid ? `<button class="ghost" style="width:100%;margin-top:8px" onclick="closeSheet();${o.cid ? `LIVE.openConv('${o.cid}')` : `openChatWith('${o.pid}')`}">چت با ${esc(o.name || 'او')}</button>` : ''}`;
    show();
  };
  const pidByName = (name) => (Object.entries(P).find(([, v]) => v && v.name === name) || [])[0];
  // پاسخ به آگهی ← همان صفحهٔ تأیید
  window.sent = function (name) {
    const pid = pidByName(name), a = S.respAd ? ADS.find((x) => x.id === S.respAd) : null;
    if (!live()) S.out.unshift({ t: (a && a.type === 'consult' ? 'پاسخ به پرسش: ' : 'درخواست همکاری: ') + (a ? a.title : 'درخواست تازه'), to: pid || 'reza', d: 'همین حالا', st: null, kind: 'collab' });
    reqDone({
      title: 'درخواست تو فرستاده شد', who: 'برای ' + name + (a ? ' · «' + a.title + '»' : ''), pid, name,
      steps: [name + ' درخواست را در «درخواست‌ها» می‌بیند و قبول یا رد می‌کند.', 'جواب را با اعلان می‌گیری؛ گفت‌وگو هم همین حالا باز شد.', 'اگر توافق کردید، از داخل چت «ثبت قرارداد» را بزن.'],
    });
  };

  /* ================= ب-۵) درخواست همکاری از پروفایل ================= */
  S.cr = {};
  window.collabReq = function (pid, day) {
    gate('request', () => {
      const p = person(pid);
      if (!p) return;
      const mine = ADS.filter((a) => a.who === 'me' && (a.st || 'active') === 'active' && a.type === 'job');
      const projs = (S.projs[S.role] || []).filter((x) => x.stage < 3);
      const opts = [...mine.map((a) => ['ad:' + a.id, a.title]), ...projs.map((x, i) => ['pj:' + i, x.t])];
      const di = typeof day === 'number' && day >= 0 ? day : (p.week || []).indexOf('a');
      S.cr = { pid, pick: opts.length ? opts[0][0] : 'new', day: di };
      const free = (p.week || []).map((d, k) => (d === 'a' ? k : -1)).filter((k) => k >= 0);
      sb.innerHTML = `<div class="grab"></div><h3 id="sheetTitle">درخواست همکاری</h3><p class="sub">با ${esc(p.name)} · ${ROLES[p.role].n}</p>
      <p class="hint" style="margin-top:0">درخواست همکاری یعنی دعوت این فرد به کار تو؛ اگر قبول کند، چت و قرارداد باز می‌شود.</p>
      <span class="label">برای کدام کار؟</span>
      <div class="chips" id="crW">${opts.map(([k, t]) => `<button class="chip" aria-pressed="${S.cr.pick === k}" onclick="S.cr.pick='${k}';pickOne(this);$('crNew').hidden=true">${esc(t)}</button>`).join('')}<button class="chip" aria-pressed="${S.cr.pick === 'new'}" onclick="S.cr.pick='new';pickOne(this);$('crNew').hidden=false">+ کار جدید</button></div>
      <div id="crNew" ${S.cr.pick === 'new' ? '' : 'hidden'}><input class="field" id="crT" style="margin-top:8px" placeholder="مثلاً بلوک‌چینی طبقهٔ دوم ویلای درگهان"></div>
      <span class="label">روز شروع</span>
      <div class="chips" id="crD">${free.map((k) => `<button class="chip" data-v="${DAYF[k]} ${DAYS[k][1]} مهر" aria-pressed="${k === di}" onclick="pickOne(this)">${DAYF[k]} ${DAYS[k][1]} مهر</button>`).join('')}<button class="chip" data-v="با هماهنگی" aria-pressed="${free.length ? 'false' : 'true'}" onclick="pickOne(this)">با هماهنگی</button></div>
      <span class="label">مبلغ پیشنهادی (اختیاری)</span><input class="field" id="crO" inputmode="text" placeholder="مثلاً ۲٬۰۰۰٬۰۰۰ تومان روزانه">
      <span class="label">توضیح کوتاه (اختیاری)</span><textarea class="field" id="crM" rows="2" placeholder="مدت کار، ساعت، ابزار…"></textarea>
      <button class="cta" onclick="collabSend()">ارسال درخواست</button>`;
      show();
    });
  };
  window.collabData = function () {
    const p = person(S.cr.pid), pick = S.cr.pick;
    let title = '', adId = null;
    if (pick === 'new') title = ($('crT') && $('crT').value.trim()) || '';
    else if (pick.startsWith('ad:')) { adId = pick.slice(3); const a = ADS.find((x) => x.id === adId); title = a ? a.title : ''; }
    else { const x = (S.projs[S.role] || []).filter((y) => y.stage < 3)[+pick.slice(3)]; title = x ? x.t : ''; }
    const d = document.querySelector('#crD .chip[aria-pressed=true]');
    return { p, pid: S.cr.pid, title, adId, startWhen: d ? d.dataset.v : 'با هماهنگی', offer: ($('crO') && $('crO').value.trim()) || '', message: ($('crM') && $('crM').value.trim()) || '' };
  };
  window.collabDone = function (x, cid) {
    reqDone({
      title: 'درخواست همکاری فرستاده شد', who: 'برای ' + x.p.name + ' · «' + x.title + '»', pid: x.pid, cid, name: x.p.name,
      steps: [x.p.name + ' درخواست را در «درخواست‌ها ← دریافتی» می‌بیند.', 'اگر قبول کند، اعلان می‌گیری و در چت شرایط را نهایی می‌کنید.', 'بعد از توافق، «ثبت قرارداد» را در همان چت بزن تا پروژه ساخته شود.'],
    });
  };
  window.collabSend = function () {
    const x = collabData();
    if (x.title.length < 3) { toast('بنویس برای چه کاری درخواست می‌دهی'); return; }
    S.out.unshift({ t: 'درخواست همکاری: ' + x.title, to: x.pid, d: x.startWhen + (x.offer ? ' · ' + x.offer : ''), st: null, kind: 'collab' });
    collabDone(x);
  };
  window.dayReq = (i) => collabReq(S.pid, i);

  /* ================= ب-۶) مرکز واحد درخواست‌ها ================= */
  S.rk = S.rk || 'all';
  const RK = [['all', 'همه'], ['collab', 'همکاری'], ['visit', 'بازدید'], ['verify', 'تأیید و معرف'], ['contract', 'امضای قرارداد']];
  const RK_N = { collab: 'همکاری', visit: 'بازدید', verify: 'تأیید', contract: 'قرارداد' };
  // قراردادهای در انتظار امضا (نمایشی از S.ctr؛ live-more نسخهٔ سرور را می‌گذارد)
  window.ctrPending = window.ctrPending || function () {
    const out = [];
    Object.entries(S.ctr || {}).forEach(([k, c]) => {
      const [role, i] = k.split(':');
      if (role !== S.role || !c || !c.p || (c.me && c.them)) return;
      out.push({ dir: c.me ? 'out' : 'in', t: 'قرارداد: ' + c.p.t, who: c.p.who, d: c.me ? 'منتظر امضای طرف مقابل' : 'منتظر امضای تو', open: `openContract(${+i})` });
    });
    return out;
  };
  function rqKind(r) { if (r.kind) return r.kind; if (r._visit || /بازدید/.test(r.t)) return 'visit'; return 'collab'; }
  window.reqItems = function () {
    const inc = [], out = [];
    (S.req[S.role] || []).forEach((r, i) => inc.push({ kind: rqKind(r), t: r.t, who: r.from, d: r.d, st: r.st, acts: !r.st ? [['قبول', `rqAct('in',${i},'ok')`, 1], ['رد', `rqAct('in',${i},'no')`]] : [] }));
    (S.out || []).forEach((r, i) => out.push({ kind: rqKind(r), t: r.t, who: r.to, d: r.d, st: r.st, acts: !r.st ? [['لغو درخواست', `rqAct('out',${i},'x')`]] : [] }));
    ((S.me && S.me.guarReq) || []).forEach((r, i) => inc.push({ kind: 'verify', t: 'تأیید به‌عنوان معرف: ' + r.n, who: r.pid || null, nm: r.n, d: 'نسبت: ' + (r.rel || 'آشنا'), st: r.st, acts: !r.st ? [['تأیید', `guarAns(${i},'ok');renderReq()`, 1], ['رد', `guarAns(${i},'no');renderReq()`]] : [] }));
    ((S.me && S.me.guar) || []).forEach((g) => out.push({ kind: 'verify', t: 'درخواست معرف: ' + g[0], who: null, nm: g[0], d: g[1], st: g[2] === 'ok' ? 'ok' : g[2] === 'no' ? 'no' : null, acts: [] }));
    (ctrPending() || []).forEach((c) => (c.dir === 'in' ? inc : out).push({ kind: 'contract', t: c.t, who: c.who, d: c.d, st: null, acts: [[c.dir === 'in' ? 'دیدن و امضا' : 'دیدن قرارداد', c.open, c.dir === 'in' ? 1 : 0]] }));
    return { inc, out };
  };
  window.reqPending = () => reqItems().inc.filter((r) => !r.st).length;
  window.reqSummary = function (where) {
    if (!S.auth) return '';
    const n = reqPending();
    return `<div class="section"><button class="rq-sum" onclick="S.rtab='in';S.rk='all';go('req')"><span class="n num ${n ? '' : 'z'}">${fa(n)}</span><span class="t"><b>${n ? fa(n) + ' درخواست منتظر توست' : 'درخواست‌ها'}</b><small>${n ? 'همکاری، بازدید، تأیید و امضای قرارداد در یک جا' : 'درخواستی منتظر جواب تو نیست'}</small></span><span class="go">‹</span></button></div>`;
  };
  window.rqAct = function (dir, i, st) { S.rtab = dir; rqAns(i, st); };
  window.renderReq = function () {
    const { inc, out } = reqItems(), all = S.rtab === 'out' ? out : inc;
    const L = S.rk === 'all' ? all : all.filter((r) => r.kind === S.rk);
    const pend = inc.filter((r) => !r.st).length;
    const cnt = (k) => (k === 'all' ? all.length : all.filter((r) => r.kind === k).length);
    $('s-req').innerHTML = `${pageBar('درخواست‌ها')}
    <div class="section" style="margin-top:10px"><div class="tabs" role="tablist"><button role="tab" aria-selected="${S.rtab !== 'out'}" onclick="S.rtab='in';renderReq()">دریافتی ${pend ? `<span class="tbadge num">${fa(pend)}</span>` : ''}</button><button role="tab" aria-selected="${S.rtab === 'out'}" onclick="S.rtab='out';renderReq()">ارسالی</button></div></div>
    <div class="rail" role="group" aria-label="نوع درخواست" style="margin-top:10px">${RK.map(([k, n]) => `<button class="chip" aria-pressed="${S.rk === k}" onclick="S.rk='${k}';renderReq()">${n} <small>${fa(cnt(k))}</small></button>`).join('')}</div>
    <div class="section" style="margin-top:12px">${L.length ? L.map((r) => {
      const p = r.who ? person(r.who) : null;
      const st = r.st === 'ok' ? ['پذیرفته شد', 'ok'] : r.st === 'no' ? ['رد شد', 'no'] : r.st === 'x' ? ['لغو شد', 'no'] : [r.kind === 'contract' ? 'منتظر امضا' : 'در انتظار پاسخ', 'wait'];
      const av = p ? hexA(p) : `<div class="hex" style="width:44px;height:48px;background:var(--gold)">${esc((r.nm || '؟')[0])}</div>`;
      const nm = p ? p.name : r.nm || '';
      return `<div class="rq ${r.st ? 'closed' : ''}"><div class="rq-h">${av}<div class="t"><b>${esc(r.t)}<span class="rq-k">${RK_N[r.kind]}</span></b><span>${nm ? (S.rtab === 'out' ? 'به ' : 'از ') + esc(nm) + ' · ' : ''}${esc(r.d || '')}</span></div><span class="tag ${st[1] === 'ok' ? 'ok' : st[1] === 'wait' ? 'wait' : ''}" ${st[1] === 'no' ? 'style="background:var(--soft);color:var(--muted)"' : ''}>${st[0]}</span></div>
        <div class="rq-a">${r.acts.map(([n, f, y]) => `<button ${y ? 'class="yes"' : ''} onclick="${f}">${n}</button>`).join('')}${p && r.who !== 'me' ? `<button onclick="openChatWith('${r.who}')">${I.chat.replace('class="ico"', 'class="ico" style="width:16px;height:16px"')} چت</button>` : ''}</div></div>`;
    }).join('') : `<div class="empty"><b>درخواستی اینجا نیست</b><p style="margin:4px 0 0">${S.rtab === 'out' ? 'از پروفایل افراد «درخواست همکاری» بفرست یا به آگهی‌ها پاسخ بده.' : 'درخواست‌های همکاری، بازدید، معرف و امضای قرارداد اینجا جمع می‌شود.'}</p></div>`}</div>`;
  };

  /* ================= ب-۴) قرارداد از داخل چت (۳ گام، پیش‌پر از آگهی و گفت‌وگو) ================= */
  S.ctrDrafts = (() => { try { return JSON.parse(localStorage.getItem('blk-ctrd') || '{}'); } catch (e) { return {}; } })();
  window.saveCtrDraft = (adId, d) => { S.ctrDrafts[adId] = d; try { localStorage.setItem('blk-ctrd', JSON.stringify(S.ctrDrafts)); } catch (e) {} };
  const curConv = () => S.convs.find((x) => x.id === S.cid);
  const AGREE = /قبول|توافق|موافق|باشه|حله|اوکی|اوکیه|عالیه|ok\b|deal/i;
  function hasDeal(c) { return (c.msgs || []).some((m) => m.k === 'deal' && m.st !== 'no'); }
  function showCtrHint(c) {
    if (!c || !c.pid || c.type === 'support' || hasDeal(c) || c.stage >= 2) return false;
    const txt = (c.msgs || []).filter((m) => m.k === 'text' || m.k === 'sys');
    const both = txt.some((m) => m.me) && txt.some((m) => !m.me && m.k === 'text');
    return both && txt.slice(-6).some((m) => AGREE.test(m.t || '') || /قبول کرد/.test(m.t || ''));
  }
  wrapW('renderChat', function (prev) {
    const r = prev();
    const c = curConv(), host = $('s-chat');
    if (!c || !host) return r;
    const qr = host.querySelector('.qr');
    if (qr && c.pid && c.type !== 'support' && !qr.querySelector('.qr-ctr') && !(c.msgs || []).some((m) => m.k === 'deal' && m.st === 'ok')) qr.insertAdjacentHTML('afterbegin', `<button class="qr-ctr" onclick="ctrWizard()">ثبت قرارداد</button>`);
    const ci = host.querySelector('.composer-in');
    const old = host.querySelector('.ctr-hint');
    if (showCtrHint(c)) { if (!old && ci) ci.insertAdjacentHTML('afterbegin', `<button class="ctr-hint" onclick="ctrWizard()"><span>توافق کردید؟ <b>قرارداد را ثبت کن</b></span><span class="go">‹</span></button>`); }
    else if (old) old.remove();
    return r;
  });
  // پیام تازه: کارت «توافق کردید؟» به‌روز شود
  wrapW('pushMsg', function (prev, m, reply) { const r = prev(m, reply); setTimeout(() => { const c = curConv(), host = $('s-chat'); if (!c || !host || S.cur !== 'chat') return; const ci = host.querySelector('.composer-in'), old = host.querySelector('.ctr-hint'); if (showCtrHint(c)) { if (!old && ci) ci.insertAdjacentHTML('afterbegin', `<button class="ctr-hint" onclick="ctrWizard()"><span>توافق کردید؟ <b>قرارداد را ثبت کن</b></span><span class="go">‹</span></button>`); } else if (old) old.remove(); }, 0); return r; });
  // منوی «+»: «پیشنهاد توافق» = «ثبت قرارداد»
  wrapW('openAttach', function (prev) {
    prev();
    document.querySelectorAll('#sb .attgrid button').forEach((b) => { if ((b.getAttribute('onclick') || '').includes('dealForm')) { b.setAttribute('onclick', 'ctrWizard()'); b.lastChild.textContent = 'ثبت قرارداد'; } });
  });
  const DURS = ['۳ روز', '۱ هفته', '۲ هفته', '۱ ماه', '۳ ماه', '۶ ماه'];
  window.ctrWizard = function () {
    const c = curConv();
    if (!c || !c.pid) { toast('قرارداد فقط در گفت‌وگو با یک نفر ثبت می‌شود'); return; }
    const a = c.ad ? ADS.find((x) => x.id === c.ad) : null, dr = (c.ad && S.ctrDrafts[c.ad]) || null;
    S.cw = {
      step: 1,
      job: (dr && dr.job) || (a && a.title) || (c.ctx && c.ctx.title) || '',
      qty: (dr && dr.qty) || '',
      price: (dr && dr.price) || (a && a.wage && !/توافقی|گفت‌وگو/.test(a.wage) ? wageTxt(a) : ''),
      place: (a && a.place) || '',
      start: (a && a.start && a.start !== 'فوری' ? a.start : '') || 'همین هفته',
      dur: (dr && dr.dur) || '۱ هفته',
    };
    peSet((dr && dr.plan) || PAY_PLANS.two[1], dr && dr.plan ? 'custom' : 'two');
    ctrStep(1);
  };
  function cwSave() {
    const v = (id) => ($(id) ? $(id).value.trim() : null);
    if (S.cw.step === 1) { S.cw.job = v('cwJ') ?? S.cw.job; S.cw.qty = v('cwQ') ?? S.cw.qty; S.cw.price = v('cwP') ?? S.cw.price; }
    if (S.cw.step === 2) { S.cw.start = v('cwS') ?? S.cw.start; const d = document.querySelector('#cwD .chip[aria-pressed=true]'); if (d) S.cw.dur = d.dataset.v; }
  }
  window.ctrStep = function (n) {
    if (n > S.cw.step) {
      cwSave();
      if (S.cw.step === 1 && S.cw.job.length < 2) { toast('شرح کار را بنویس'); return; }
      if (S.cw.step === 1 && !S.cw.price) { toast('مبلغ یا دستمزد را بنویس'); return; }
      if (S.cw.step === 2 && !peValid()) return;
    } else cwSave();
    S.cw.step = n;
    const c = curConv(), w = S.cw, nm = convName(c);
    const steps = `<div class="cw-steps">${['شرح کار و مبلغ', 'پرداخت و مدت', 'بررسی و ارسال'].map((t, k) => `<div class="${k < n ? 'on' : ''}"><i></i>${fa(k + 1)}. ${t}</div>`).join('')}</div>`;
    let body = '';
    if (n === 1) body = `<span class="label" style="margin-top:0">شرح کار</span><input class="field" id="cwJ" value="${esc(w.job)}" placeholder="مثلاً آرماتوربندی سقف دوم ویلای درگهان">
      <span class="label">مقدار کار (اختیاری)</span><input class="field" id="cwQ" value="${esc(w.qty)}" placeholder="مثلاً حدود ۳ تن یا ۱۲۰ متر">
      <span class="label">مبلغ یا دستمزد</span><input class="field" id="cwP" value="${esc(w.price)}" placeholder="مثلاً ۹٬۲۰۰٬۰۰۰ تومان هر تن">
      ${w.place ? `<p class="hint">محل: ${esc(placeLbl(w.place))} (از آگهی)</p>` : ''}
      <button class="cta" onclick="ctrStep(2)">ادامه</button>`;
    if (n === 2) body = `<span class="label" style="margin-top:0">زمان شروع</span><input class="field" id="cwS" value="${esc(w.start)}" placeholder="مثلاً شنبه ۱۱ مهر، ۷ صبح">
      <span class="label">مدت اجرا</span><div class="chips" id="cwD">${DURS.map((x) => `<button class="chip" data-v="${x}" aria-pressed="${w.dur === x}" onclick="pickOne(this)">${x}</button>`).join('')}</div>
      <span class="label">مراحل پرداخت</span><div id="peBox">${peHTML()}</div>
      <div class="cw-row" style="margin-top:12px"><button class="ghost" onclick="ctrStep(1)">قبلی</button><button class="cta" style="margin:0" onclick="ctrStep(3)">ادامه</button></div>`;
    if (n === 3) body = `<div class="cw-sum"><div><span>کار</span><b>${esc(w.job)}</b></div>${w.qty ? `<div><span>مقدار</span><b>${esc(w.qty)}</b></div>` : ''}<div><span>مبلغ</span><b>${esc(w.price)}</b></div><div><span>شروع</span><b>${esc(w.start)}</b></div><div><span>مدت</span><b>${esc(w.dur)}</b></div><div><span>پرداخت</span><b>${esc(planTxt(PE.ms))}</b></div></div>
      <p class="hint" style="margin-top:0">بعد از تأیید ${esc(nm)}، پروژه در «پروژه‌های من» ساخته می‌شود و قرارداد با همین شرایط آماده است. هر دو طرف با کد پیامکی امضا می‌کنید؛ وضعیت امضا همین‌جا در چت دیده می‌شود.</p>
      <div class="cw-row"><button class="ghost" onclick="ctrStep(2)">قبلی</button><button class="cta" style="margin:0" onclick="ctrSend()">ارسال برای ${esc(nm)}</button></div>`;
    sb.innerHTML = `<div class="grab"></div><h3 id="sheetTitle">ثبت قرارداد</h3><p class="sub">با ${esc(nm)} · اطلاعات از آگهی و گفت‌وگو پر شده؛ فقط بررسی و اصلاح کن.</p>${steps}${body}`;
    show();
  };
  window.ctrSend = function () {
    const w = S.cw;
    const d = { job: w.job, qty: w.qty, price: w.price, start: w.start, dur: w.dur, plan: PE.ms.map((m) => [String(m[0]).trim(), +m[1]]) };
    closeSheet();
    pushMsg({ me: 1, k: 'deal', d, st: null }, true);
    toast('قرارداد برای تأیید فرستاده شد');
  };
  // وضعیت امضا روی کارت توافقِ پذیرفته‌شده (نمایشی)
  wrapW('dealCtrBtn', function (prev, c, m, i) {
    const h = prev(c, m, i);
    if (!h || live()) return h;
    return h.replace('منتظر امضای طرف مقابل', 'امضای تو ثبت شد · منتظر امضای طرف مقابل');
  });

  /* ================= ج-۷) پروفایل و شناسنامهٔ کاری در یک صفحه ================= */
  window.openTrust = function (id, guide) {
    S.tid = id; S.guide = !!guide;
    if (S.cur === 'profile' && S.pid === id) { openScore(); return; }
    S.pid = id; S.ptab = 0; S._openScore = true;
    go('profile');
  };
  function openScore() {
    const d = $('pvScore');
    if (!d) return;
    d.open = true;
    requestAnimationFrame(() => d.scrollIntoView({ behavior: 'auto', block: 'start' }));
  }
  const svcRows = () => {
    const V = (window.LIVE && LIVE.cfg && LIVE.cfg.visitTypes) ? LIVE.cfg.visitTypes.map((x) => [x.n, x.d, x.p]) : VTYPE;
    return V.map((x) => `<div><span>${esc(x[0])} · ${esc(x[1])}</span><b class="num">${fa((x[2] / 1e6).toFixed(1).replace(/\.0$/, ''))} میلیون</b></div>`).join('');
  };
  window.renderProfile = function () {
    const p = person(S.pid);
    if (!p) return;
    const tr = trustOf(p), me = !!p.me, pro = !!(p.skills && p.skills.length), saved = S.saved.has(S.pid);
    const rating = String(p.rating || 0).replace('.', '٫');
    const parts = [['رضایت همکاری‌ها', 55, tr.c, 'var(--gold)', 'میانگین ' + fa(rating) + ' از ۵'], ['پروژه‌های تمام‌شده', 25, tr.pr, 'var(--steel)', fa(p.done || 0) + ' پروژه'], ['تعداد نظرها', 10, tr.r, '#5EA8FF', fa(p.revN || 0) + ' نظر'], ['تأیید هویت', 10, tr.id, 'var(--ok)', p.verified ? 'تأیید شده' : 'هنوز تأیید نشده']];
    const steps = me && window.LIVE && LIVE.trustSteps ? LIVE.trustSteps() : [];
    const tot = (p.stars || []).reduce((a, b) => a + b, 0);
    const needAd = !pro && (p.needs || []).find((n) => n[3]);
    $('s-profile').innerHTML = `
    <div class="bar"><button class="icon-btn" aria-label="بازگشت" onclick="back()">${I.back}</button><h1>${me ? 'پروفایل و شناسنامهٔ کاری من' : 'پروفایل و شناسنامهٔ کاری'}</h1>
      ${me ? '' : `<button class="icon-btn" aria-label="${saved ? 'حذف از ذخیره‌ها' : 'ذخیره پروفایل'}" onclick="togSave('${S.pid}')">${saved ? I.saved : I.save}</button>`}</div>
    ${me && S.me && !S.me.pub ? `<div class="section" style="margin-top:8px"><div class="note">${I.warn}<span>پروفایل عمومی تو خاموش است؛ دیگران این صفحه را نمی‌بینند.</span></div></div>` : ''}
    <div class="pv-head">${hexA(p)}<div class="t"><h2>${esc(p.name)}${p.verified ? I.verified : ''}</h2><div class="rl"><span style="color:${ROLES[p.role].c};font-weight:700">${ROLES[p.role].n}</span>${p.title ? ' · ' + esc(String(p.title).replace(new RegExp('^' + ROLES[p.role].n + '\s*·\s*'), '')) : ''}</div>
      <div class="pv-code">کد کاربری <b>${esc(p.code || '')}</b><button onclick="copyCode('${esc(p.code || '')}')">کپی</button></div></div>
      <div class="ring-sc" aria-label="اعتبار ${fa(tr.t)} از ۱۰۰" role="button" tabindex="0" onclick="openTrust('${S.pid}')">${ringSm(tr.t, 'var(--gold)', 58, 6)}<b class="num">${fa(tr.t)}<small>اعتبار</small></b></div></div>
    <p class="pv-why">${p.verified ? '<b>هویت تأیید شده.</b> ' : '<b>هویت هنوز تأیید نشده.</b> '}امتیاز اعتبار ${fa(tr.t)} از ۱۰۰ از رضایت همکاری‌ها، پروژه‌های تمام‌شده، تعداد نظرها و تأیید هویت ساخته می‌شود.</p>
    ${me ? reqSummary('profile') : ''}
    <div class="section" style="margin-top:12px"><div class="stats" style="grid-template-columns:repeat(4,1fr)">
      <div><b class="num">${fa(p.done || 0)}</b><span>همکاری تمام‌شده</span></div>
      <div><b>${esc(String(p.exp || '—').replace(' سال', ''))}</b><span>${/سال/.test(p.exp || '') ? 'سال سابقه' : 'سابقه'}</span></div>
      <div><b class="num">${fa(rating)}</b><span>میانگین ستاره</span></div>
      <div><b class="num">${fa((p.guar || []).length)}</b><span>معرف</span></div></div></div>
    ${p.bio ? `<div class="section"><div class="card"><p style="font-size:15px;margin:0">${esc(p.bio)}</p></div></div>` : ''}
    <div class="section"><details class="pv-score" id="pvScore" ${S.guide ? 'open' : ''}><summary>امتیاز از کجا آمده؟</summary><div class="pv-bars">
      ${parts.map((x) => `<div class="pv-bar"><div class="h"><b>${x[0]}</b><span class="num">${fa(x[2])} از ${fa(x[1])} · ${esc(x[4])}</span></div><div class="tr"><i style="width:${Math.round((x[2] / x[1]) * 100)}%;background:${x[3]}"></i></div></div>`).join('')}
      ${steps.length ? `<b style="display:block;margin:14px 0 4px;font-size:14px">قدم بعدی برای امتیاز بیشتر</b>${steps.slice(0, 4).map((s, i) => `<div class="tstep ${s[2] ? '' : 'off'}" ${s[2] ? `role="button" tabindex="0" onclick="${s[2]}"` : ''}><span class="n num">${fa(i + 1)}</span><span class="t"><b>${esc(s[0])}</b><small>${esc(s[1])}</small></span>${s[2] ? '<span class="go">‹</span>' : ''}</div>`).join('')}` : ''}
    </div></details></div>
    ${pro ? `<div class="section"><div class="sec-head"><h3>مهارت‌ها و تعرفه</h3></div><div class="card">${p.skills.map((s) => `<div class="skill"><div class="h"><b>${esc(s[0])}</b><span>${esc(s[4] || '')}</span></div><div class="s"><span>سابقه: ${esc(s[1] || '—')}</span><span>${s[3] && s[3] !== s[4] ? esc(s[3]) : ''}</span></div></div>`).join('')}</div></div>`
      : (p.needs || []).length ? `<div class="section"><div class="sec-head"><h3>نیازهای فعال</h3></div><div class="card">${p.needs.map((n) => `<div class="need"><div style="flex:1"><b style="display:block">${esc(n[0])}</b><span style="font-size:13px;color:var(--muted)">${esc(n[1] || '')} · ${esc(n[2] || '')}</span></div>${n[3] ? `<button class="chip" onclick="openAd('${n[3]}')">دیدن آگهی</button>` : ''}</div>`).join('')}</div></div>` : ''}
    ${p.role === 'engineer' ? `<div class="section" id="pvSvc"><div class="sec-head"><h3>خدمات</h3><span>بازدید حضوری از کارگاه</span></div><div class="card"><div class="pv-svc">${svcRows()}</div>
      ${me ? '' : `<button class="cta" style="margin-top:10px" onclick="openVisit('${S.pid}')">رزرو بازدید کارگاه</button>`}</div></div>` : ''}
    <div class="section"><div class="sec-head"><h3>نمونه‌کارها</h3>${me ? `<button onclick="go('pf')">مدیریت ‹</button>` : ''}</div>${(p.pf || []).length ? `<div class="pf">${p.pf.map((x) => `<div>${pfArt(x[2], ROLES[p.role].c)}<p>${esc(x[0])}<span>${esc(x[1] || '')}</span></p></div>`).join('')}</div>` : `<div class="empty">هنوز نمونه‌کاری ثبت نشده.</div>`}</div>
    <div class="section"><div class="sec-head"><h3>نظرها</h3><span class="num">${fa(p.revN || 0)} نظر</span></div>
      ${tot ? `<div class="card"><div class="hist">${p.stars.map((n, i) => `<div><b class="num" style="font-weight:500">${fa(5 - i)}★</b><span><i style="width:${(n / tot) * 100}%"></i></span><b class="num" style="font-weight:500">${fa(n)}</b></div>`).join('')}</div></div>` : ''}
      ${(p.revs || []).length ? `<div class="card" style="margin-top:10px">${p.revs.map((r) => `<div class="rev"><div class="h"><b>${esc(r[0])}</b><span>${esc(r[3] || '')}</span></div><div class="starsr" aria-label="${fa(r[1])} ستاره">${[1, 2, 3, 4, 5].map((i) => I.star(i <= r[1] ? 'var(--gold)' : 'var(--line)')).join('')}</div><p>${esc(r[2] || '')}</p></div>`).join('')}</div>` : `<div class="empty">هنوز نظری ثبت نشده؛ نظر فقط بعد از پایان همکاری در بلوک ثبت می‌شود.</div>`}</div>
    ${(p.guar || []).length ? `<div class="section"><div class="sec-head"><h3>معرف‌ها</h3><span class="num">${fa(p.guar.length)} نفر</span></div><div class="card">${p.guar.map((g) => `<div class="need"><div style="flex:1"><b style="display:block">${esc(g[0])}</b><span style="font-size:13px;color:var(--muted)">${esc(g[1] || '')}</span></div><span class="tag ok">تأیید کرد</span></div>`).join('')}</div></div>` : ''}
    ${pro ? `<div class="section"><div class="sec-head"><h3>روزهای آزاد این هفته</h3>${me ? `<button onclick="go('cal')">ویرایش ‹</button>` : '<span>روز سبز را بزن تا درخواست بدهی</span>'}</div>
      <div class="days">${(p.week || []).map((d, i) => `<button class="day ${d}${i === 0 ? ' today' : ''}" ${d === 'a' && !me ? `onclick="collabReq('${S.pid}',${i})"` : 'disabled'} aria-label="${DAYF[i]} ${DAYS[i][1]} مهر: ${d === 'a' ? 'آزاد' : d === 'b' ? 'رزرو شده' : 'تعطیل'}">${DAYS[i][0]}<b class="num">${DAYS[i][1]}</b>${d === 'a' ? 'آزاد' : d === 'b' ? 'رزرو' : 'تعطیل'}</button>`).join('')}</div></div>` : ''}
    <div class="section"><div class="sec-head"><h3>محل فعالیت</h3><span>${esc(provOf(p.place) ? 'استان ' + provOf(p.place) : '')}</span></div>
      <div class="mapcard">${islandSVG({ zoom: provOf(p.place) === 'هرمزگان' ? 'qeshm' : undefined, hl: provOf(p.place), pins: [{ id: 'pp', place: p.place, color: ROLES[p.role].c, sel: true }] })}<span class="cap">${esc(placeLbl(p.place))}</span></div></div>
    ${me ? '' : `<div class="section"><button class="linkrow" style="color:var(--bad)" onclick="openReport()"><span class="ic" style="color:var(--bad)">${I.flag}</span><span>گزارش یا مسدود کردن این کاربر</span></button></div>`}
    <div style="height:${me ? 20 : 96}px"></div>
    ${me ? '' : `<div class="sticky"><div class="sticky-in" style="flex-wrap:wrap"><button class="sq" aria-label="گفت‌وگو" onclick="openChatWith('${S.pid}')">${I.chat}</button>
      ${pro || !needAd ? `<button class="cta" onclick="collabReq('${S.pid}')">درخواست همکاری</button><p class="collab-hint">درخواست همکاری یعنی دعوت این فرد به کار تو؛ اگر قبول کند، چت و قرارداد باز می‌شود.</p>` : `<button class="cta" onclick="openAd('${needAd[3]}')">دیدن نیاز فعال</button>`}</div></div>`}`;
    if (S._openScore) { S._openScore = false; openScore(); }
  };
  window.renderPTab = function () {};

  /* ================= ج-۸) رزرو بازدید: نه در آگهی؛ در پروفایل مهندس و صفحهٔ پروژه ================= */
  wrapW('renderAd', function (prev) {
    const r = prev();
    document.querySelectorAll('#s-ad .vis-link').forEach((x) => (x.closest('.section') || x).remove());
    // ۱۱: کد آگهی روی نقشهٔ بالای آگهی نمایش داده نشود
    const w = document.querySelector('#s-ad .adhero .when');
    if (w) w.textContent = w.textContent.replace(/\s*·\s*کد آگهی.*$/, '');
    return r;
  });
  wrapW('renderPdet', function (prev) {
    const r = prev();
    const host = $('s-pdet'), p = (S.projs[S.role] || [])[S.pi];
    if (!host || !p || p.stage >= 3 || !['general', 'contractor', 'company'].includes(S.role) || host.querySelector('#pdVisit')) return r;
    const other = p.who && P[p.who], eng = other && other.role === 'engineer';
    const html = `<div class="section" id="pdVisit"><button class="card vis-link" style="display:flex;align-items:center;gap:12px;width:100%;border:0;text-align:right;font-family:inherit;color:var(--ink)" onclick="${eng ? `S.visit.t=1;openVisit('${p.who}')` : "S.roleF='engineer';exploreMode('workers')"}"><span class="nt-ic">${QI.cal}</span><div style="flex:1"><b style="display:block">پیش از بتن‌ریزی: کنترل آرماتور را رزرو کن</b><span style="font-size:13px;color:var(--muted)">${eng ? 'بازدید حضوری ' + esc(other.name) : 'یک مهندس ناظر نزدیک پیدا کن و بازدید رزرو کن'}</span></div><span style="color:var(--muted)">‹</span></button></div>`;
    const anchor = [...host.querySelectorAll('.section')].find((s) => /دفترچهٔ پرداخت|گزارش روزانه/.test(s.textContent));
    if (anchor) anchor.insertAdjacentHTML('beforebegin', html); else host.insertAdjacentHTML('beforeend', html);
    return r;
  });

  /* ================= ج-۹) محدودیت آگهی رایگان ================= */
  window.myActiveAds = () => ADS.filter((a) => a.who === 'me' && (a.st || 'active') === 'active' && a.type !== 'consult');
  wrapW('openWizard', function (prev, ...a) {
    if (S.auth && !S._skipLimit && myActiveAds().length >= freeLimit()) { adLimitSheet(); return; }
    return prev(...a);
  });
  window.adLimitSheet = function () {
    const L = myActiveAds(), a = L[0];
    sb.innerHTML = `<div class="grab"></div><h3 id="sheetTitle">یک آگهی فعال داری</h3>
    <p class="sub">${freeLimit() === 1 ? 'یک آگهی فعال داری. آن را ویرایش کن، ببند، یا برای آگهی بیشتر ارتقا بده.' : fa(L.length) + ' آگهی فعال داری. یکی را ببند یا برای آگهی بیشتر ارتقا بده.'}</p>
    ${a ? `<div class="card" style="box-shadow:none;background:var(--bg);margin-bottom:6px"><b style="display:block">${esc(a.title)}</b><span style="font-size:13px;color:var(--muted)">${esc(TYPE[a.type].n)} · ${esc(placeLbl(a.place || ''))}</span></div>` : ''}
    ${a ? `<button class="cta" onclick="closeSheet();adEdit('${a.id}')">ویرایش آگهی فعلی</button>
    <button class="ghost" style="width:100%;margin-top:8px" onclick="adCloseFree('${a.id}')">بستن آن</button>
    <button class="ghost" style="width:100%;margin-top:8px" onclick="closeSheet();openBoost('${a.id}')">ارتقا</button>` : ''}
    <button class="ghost" style="width:100%;margin-top:8px;color:var(--muted)" onclick="closeSheet();S._skipLimit=1;postWith('consult','',['engineer']);S._skipLimit=0">پرسش تخصصی می‌پرسم (رایگان و بی‌محدودیت)</button>`;
    show();
  };
  window.adCloseFree = function (id) { closeSheet(); adSt(id, 'closed'); setTimeout(() => { if (!myActiveAds().length || myActiveAds().length < freeLimit()) toast('آگهی بسته شد؛ حالا می‌توانی آگهی تازه ثبت کنی'); }, 300); };
  window.adEdit = function (id) {
    const a = ADS.find((x) => x.id === id);
    if (!a) return;
    const amt = toEnD(a.wage || '').replace(/[^\d]/g, '');
    sb.innerHTML = `<div class="grab"></div><h3 id="sheetTitle">ویرایش آگهی</h3><p class="sub">${esc(TYPE[a.type].n)}</p>
    <span class="label">عنوان</span><input class="field" id="aeT" value="${esc(a.title)}">
    <span class="label">توضیح</span><textarea class="field" id="aeD" rows="3">${esc(a.desc && a.desc !== 'توضیحی ثبت نشده.' ? a.desc : '')}</textarea>
    ${a.type !== 'consult' ? `<span class="label">مبلغ (تومان، خالی = توافقی)</span><input class="field num" id="aeW" inputmode="numeric" value="${amt ? fa(amt) : ''}">` : ''}
    <button class="cta" onclick="adEditSave('${a.id}')">ذخیره</button>`;
    show();
  };
  window.adEditSave = function (id) {
    const a = ADS.find((x) => x.id === id), t = $('aeT').value.trim();
    if (t.length < 4) { toast('عنوان حداقل ۴ حرف'); return; }
    a.title = t; a.desc = $('aeD').value.trim() || 'توضیحی ثبت نشده.';
    if ($('aeW')) { const n = +toEnD($('aeW').value).replace(/[^\d]/g, ''); a.wage = n ? faNum(n) + ' تومان' : 'توافقی'; }
    closeSheet(); toast('آگهی ویرایش شد'); render();
  };

  /* ================= ج-۱۰ و ۱۲) کاوش: بدون آگهی‌های خودم + جست‌وجوی افراد ================= */
  wrapW('listFor', function (prev, ign) { return prev(ign).filter((x) => x.a.who !== 'me' && !(x.p && x.p.me)); });
  window.normCode = function (q) {
    const r = toEnD(q).toUpperCase().replace(/[^A-Z0-9]/g, '');
    return /^B?[A-Z0-9]{4}$/.test(r) ? 'B-' + r.slice(-4) : null;
  };
  window.peopleFor = function (q) {
    q = (q || '').trim();
    if (q.length < 2) return [];
    const code = normCode(q), ql = q.toLowerCase(), qc = toEnD(q).toUpperCase().replace(/[^A-Z0-9]/g, '');
    return Object.entries(P).filter(([id, p]) => id !== 'me' && p && !p.me && p.name && ROLES[p.role] && (
      (code && p.code === code) || p.name.toLowerCase().includes(ql) || (qc.length >= 3 && String(p.code || '').replace('-', '').includes(qc))
    )).sort((a, b) => (b[1].code === code) - (a[1].code === code) || trustOf(b[1]).t - trustOf(a[1]).t).slice(0, 10);
  };
  wrapW('renderResults', function (prev, first) {
    const r = prev(first);
    const el = $('results');
    if (!el || !S.q || !S.q.trim()) { S._codeGo = null; return r; }
    const ppl = peopleFor(S.q), code = normCode(S.q);
    const exact = code && ppl.find(([, p]) => p.code === code);
    if (exact && S._codeGo !== code && S.cur === 'explore') { S._codeGo = code; setTimeout(() => openProfile(exact[0]), 0); }
    const h = el.querySelector('.sec-head h3');
    if (h) h.textContent = 'آگهی‌ها';
    if (ppl.length) el.insertAdjacentHTML('afterbegin', `<div class="section" id="blkPeople" style="margin-top:14px"><div class="sec-head"><h3>افراد</h3><span class="num">${fa(ppl.length)} نفر</span></div>
      <div class="pp-row">${ppl.map(([id, p]) => `<button class="pp-c" onclick="openProfile('${id}')">${hexA(p)}<b>${esc(p.name)}</b><small style="color:${ROLES[p.role].c}">${ROLES[p.role].n}</small><code>${esc(p.code || '')}</code><span class="score-mini num">${ringSm(trustOf(p).t, 'var(--gold)')}<span class="sm-l">اعتبار</span>${fa(trustOf(p).t)}</span></button>`).join('')}</div></div>`);
    return r;
  });

  /* ================= ج-۱۳) پرسش تخصصی: همه پاسخ می‌دهند؛ مفید بود / نبود ================= */
  Object.values(S.ans || {}).forEach((L) => L.forEach((x) => { x.down = x.down || 0; x.my = x.my || 0; }));
  window.renderQA = function () {
    const a = ADS.find((x) => x.id === S.adId), p = P[a.who] || ME();
    const L = (S.ans[a.id] || []).map((x, i) => Object.assign(x, { _i: i })).slice().sort((x, y) => ((y.up || 0) - (y.down || 0)) - ((x.up || 0) - (x.down || 0)));
    const up = '<svg viewBox="0 0 24 24" class="ico" style="width:18px;height:18px"><path d="M7 11v9H4v-9zM7 11l4-8a2 2 0 0 1 3 2l-1 5h6a2 2 0 0 1 2 2l-2 7a2 2 0 0 1-2 1H7"/></svg>';
    const dn = up.replace('<svg ', '<svg style="transform:scaleY(-1)" ');
    $('s-qa').innerHTML = `${pageBar('پرسش تخصصی', `<button class="icon-btn" aria-label="ذخیره" onclick="togSave('ad:${a.id}')">${S.saved.has('ad:' + a.id) ? I.saved : I.save}</button>`)}
    <div class="section" style="margin-top:8px"><div class="qa-q"><div class="qa-bp" aria-hidden="true"><svg viewBox="0 0 120 80"><path class="qa-crack" d="M60 10 L55 25 L63 34 L57 48 L64 60 L60 72"/><rect x="36" y="22" width="48" height="36" rx="2" fill="none" stroke="currentColor" stroke-width="2" opacity=".5"/></svg></div>
      <span class="type" style="background:color-mix(in srgb,var(--r-engineer) 14%,transparent);color:var(--r-engineer)">پرسش تخصصی · ${esc(placeLbl(a.place))}</span>
      <h2>${esc(a.title)}</h2><p>${esc(a.desc)}</p>
      <div class="qa-m">${hexA(p).replace('class="hex "', 'class="hex sm2" ')}<span>${esc(p.name)} · ${esc(a.posted)}</span><span class="num">${fa(L.length)} پاسخ</span></div></div></div>
    <div class="section"><div class="sec-head"><h3>پاسخ‌ها</h3><span>همه می‌توانند پاسخ بدهند · مرتب بر اساس «مفید بود»</span></div>
      ${L.length ? L.map((x) => {
        const w = P[x.who] || ME(), t = trustOf(w), own = x.who === 'me' || (w && w.me);
        return `<div class="ans ${x.best ? 'isbest' : ''}">
        ${x.best ? `<div class="best-tag">${MI.check.replace('<svg', '<svg style="width:14px;height:14px"')} بهترین پاسخ از نظر پرسش‌کننده</div>` : ''}
        <div class="ans-h" onclick="openProfile('${x.who}')">${hexA(w)}<div class="t"><b>${esc(w.name)} ${w.verified ? I.verified : ''}</b><span>${ROLES[w.role] ? ROLES[w.role].n : ''} · اعتبار ${fa(t.t)}</span></div><small>${esc(x.time || '')}</small></div>
        <p>${esc(x.t)}</p>
        <div class="ans-a"><button class="vt ${x.my > 0 ? 'on' : ''}" ${own ? 'disabled' : ''} aria-pressed="${x.my > 0}" aria-label="مفید بود" onclick="voteAns('${a.id}',${x._i},1)">${up}<span class="num">${fa(x.up || 0)}</span> مفید بود</button>
          <button class="vt dn ${x.my < 0 ? 'on' : ''}" ${own ? 'disabled' : ''} aria-pressed="${x.my < 0}" aria-label="مفید نبود" onclick="voteAns('${a.id}',${x._i},-1)">${dn}<span class="num">${fa(x.down || 0)}</span> مفید نبود</button></div></div>`;
      }).join('') : `<div class="empty">هنوز پاسخی نیامده؛ اگر بلدی، اولین نفر باش.</div>`}</div>
    <div style="height:70px"></div>
    ${p.me ? '' : `<div class="sticky"><div class="sticky-in"><button class="cta" onclick="answerQA('${a.id}')">پاسخ می‌دهم</button></div></div>`}`;
  };
  // v: ۱ یا ‎-۱؛ دوباره زدن همان = برداشتن رأی
  window.voteAns = function (aid, i, v) {
    gate('respond', () => {
      const x = (S.ans[aid] || [])[i];
      if (!x) return;
      const nv = x.my === v ? 0 : v;
      if (x.my > 0) x.up--; if (x.my < 0) x.down--;
      if (nv > 0) x.up = (x.up || 0) + 1; if (nv < 0) x.down = (x.down || 0) + 1;
      x.my = nv;
      renderQA();
      if (window.voteAnsLive) voteAnsLive(aid, x, nv);
    });
  };
  window.answerQA = function (aid) {
    gate('respond', () => {
      sb.innerHTML = `<div class="grab"></div><h3 id="sheetTitle">پاسخ تو</h3><p class="sub">علت احتمالی، راه بررسی و اینکه بازدید حضوری لازم است یا نه.</p><textarea class="field" id="ansT" placeholder="مثلاً: از عکس‌ها به نظر ترک نشست است…"></textarea>
      <button class="cta" onclick="const t=$('ansT').value.trim();if(t.length<10){toast('پاسخ کوتاه است');return}S.ans['${aid}']=S.ans['${aid}']||[];S.ans['${aid}'].push({who:'me',t:t,up:0,down:0,my:0,time:'همین حالا'});closeSheet();renderQA();toast('پاسخ تو منتشر شد')">انتشار پاسخ</button>`;
      show();
    });
  };
  window.dayReqFor = (pid) => collabReq(pid);

  /* ================= د-۱۴) نقش فقط هنگام ثبت‌نام؛ تغییر از تنظیمات با تأیید پشتیبانی ================= */
  window.openRoles = () => go('roles');
  window.addRole = function (k) {
    sb.innerHTML = `<div class="grab"></div><h3 id="sheetTitle">افزودن یا تغییر نقش</h3><p class="sub">نقش هنگام ثبت‌نام انتخاب می‌شود. برای نقش «${esc(ROLES[k].n)}»، پشتیبانی بلوک درخواستت را بررسی و تأیید می‌کند.</p>
    <button class="cta" onclick="roleReqSend('${k}')">ارسال درخواست به پشتیبانی</button><button class="ghost" style="width:100%;margin-top:8px" onclick="closeSheet()">پشیمان شدم</button>`;
    show();
  };
  window.roleReqSend = function (k) {
    closeSheet();
    const txt = `درخواست افزودن نقش «${ROLES[k].n}» به حسابم را دارم.`;
    openChat('c-support');
    let n = 0;
    const fill = () => { const i = $('cIn'); if (S.cur === 'chat' && i) { i.value = txt; i.dispatchEvent(new Event('input')); toast('متن درخواست آماده است؛ «فرستادن» را بزن'); } else if (n++ < 20) setTimeout(fill, 150); };
    setTimeout(fill, 100);
  };
  wrapW('renderRoles', function (prev) {
    const r = prev();
    const p = document.querySelector('#s-roles .reg-sub');
    if (p) p.textContent = 'نقش هنگام ثبت‌نام انتخاب شده. بین نقش‌هایی که داری جابه‌جا شو؛ برای نقش تازه، درخواست به پشتیبانی می‌رود.';
    document.querySelectorAll('#s-roles .rolepick button').forEach((b) => { const o = b.getAttribute('onclick') || ''; if (o.startsWith('addRole')) { const n = b.querySelector('.rp-n'), s = b.querySelector('small'); if (n) n.textContent = 'درخواست'; if (s) s.textContent = 'با تأیید پشتیبانی'; } });
    return r;
  });
  const staticRole = () => `<span class="role-tag"><i style="background:${ROLES[S.role].c}"></i>${S.role === 'general' ? 'کارفرما' : ROLES[S.role].n}</span>`;
  ['renderExplore', 'renderMe'].forEach((fn) => wrapW(fn, function (prev, ...a) {
    const r = prev(...a);
    document.querySelectorAll(`#s-${fn === 'renderMe' ? 'me' : 'explore'} .role-pill`).forEach((b) => (b.outerHTML = staticRole()));
    if (fn === 'renderMe') {
      // درخواست‌های تأیید پخش‌شده ← فقط یک ردیف خلاصه
      document.querySelectorAll('#s-me .section').forEach((s) => { const h = s.querySelector('.sec-head h3'); if (h && /درخواست‌های تأیید برای تو/.test(h.textContent)) s.remove(); });
      const anchor = document.querySelector('#s-me .mecard') || document.querySelector('#s-me header');
      if (S.auth && anchor && !document.querySelector('#s-me .rq-sum')) anchor.insertAdjacentHTML('afterend', reqSummary('me'));
      document.querySelectorAll('#s-me .linkrow').forEach((b) => { if (/تغییر نقش/.test(b.textContent)) { const s = b.querySelectorAll('span')[1]; if (s) s.textContent = 'نقش‌های من'; } });
    }
    return r;
  }));

  /* ================= د-۱۵/۱۶/۱۷) خانهٔ ساده: حداکثر ۴ بخش، فقط دادهٔ واقعی ================= */
  const CLIENT = ['general', 'contractor', 'company'];
  const SC = {
    client: [['قراردادها', 'var(--gold)', 'doc', "go('proj')"], ['درخواست‌ها', 'var(--r-contractor)', 'users', "S.rtab='in';S.rk='all';go('req')"], ['ثبت آگهی', 'var(--accent)', 'plus', 'openWizard()'], ['برآورد هزینه', 'var(--r-engineer)', 'card', "go('est')"]],
    crew: [['کار نزدیک من', 'var(--r-worker)', 'search', "S.f.sort='near';exploreMode('jobs')"], ['درخواست‌ها', 'var(--r-contractor)', 'users', "S.rtab='in';S.rk='all';go('req')"], ['قراردادها', 'var(--gold)', 'doc', "go('proj')"], ['روزهای آزادم', 'var(--concrete-2)', 'cal', "go('cal')"]],
    engineer: [['پرسش‌های تخصصی', 'var(--r-engineer)', 'q', "exploreMode('consult')"], ['درخواست‌ها', 'var(--r-contractor)', 'users', "S.rtab='in';S.rk='all';go('req')"], ['قراردادها', 'var(--gold)', 'doc', "go('proj')"], ['بازدیدهای رزروشده', 'var(--concrete-2)', 'cal', "S.rtab='in';S.rk='visit';go('req')"]],
  };
  const scFor = () => (S.role === 'engineer' ? SC.engineer : CLIENT.includes(S.role) ? SC.client : SC.crew);
  function todayCard() {
    const L = (S.projs[S.role] || []).map((p, i) => [p, i]).filter(([p]) => p.stage >= 1 && p.stage < 3);
    const tv = typeof window.todayVisits === 'function' ? todayVisits() : [];
    if (S.role === 'engineer' && tv.length) {
      const v = tv[0];
      return `<div class="section"><div class="hm-today"><small>کار امروز · ${fa(tv.length)} بازدید</small><h2>${esc(v.t)}</h2><div class="who">${esc(v.w)}</div><div class="row"><span></span><button class="go" onclick="S.rtab='in';S.rk='visit';go('req')">بازدیدهای امروز ‹</button></div></div></div>`;
    }
    if (L.length) {
      const [p, i] = L[0], w = p.who && person(p.who);
      return `<div class="section"><div class="hm-today"><small>پروژهٔ فعال${L.length > 1 ? ' · ' + fa(L.length) + ' پروژه' : ''}</small><h2>${esc(p.t)}</h2>
        <div class="who">${w ? esc(w.name) + ' · ' : ''}${esc(CSTG[p.stage] || '')}${p.amt ? ' · ' + esc(p.amt) : ''}</div>
        <div class="stg" aria-hidden="true">${CSTG.map((_, k) => `<i class="${k <= p.stage ? 'd' : ''}"></i>`).join('')}</div>
        <div class="row"><span></span><button class="go" onclick="openProjPage(${i})">ادامهٔ کار ‹</button></div></div></div>`;
    }
    const crew = !CLIENT.includes(S.role) && S.role !== 'engineer';
    return `<div class="section"><div class="hm-today"><small>کار امروز</small><h2>${crew ? 'امروز کار ثبت‌شده‌ای نداری' : S.role === 'engineer' ? 'امروز بازدیدی رزرو نشده' : 'هنوز پروژهٔ فعالی نداری'}</h2>
      <div class="who">${crew ? 'روزهای آزادت را مشخص کن تا کارفرماها پیدایت کنند.' : S.role === 'engineer' ? 'به پرسش‌های تخصصی جواب بده تا دیده شوی.' : 'نیرو پیدا کن، توافق کن و قرارداد را در چت ثبت کن.'}</div>
      <div class="row"><span></span>${crew ? `<button class="go" onclick="S.f.sort='near';exploreMode('jobs')">کار نزدیک من ‹</button>` : S.role === 'engineer' ? `<button class="go" onclick="exploreMode('consult')">پرسش‌های باز ‹</button>` : `<button class="go" onclick="exploreMode('workers')">پیدا کردن نیرو ‹</button>`}</div></div></div>`;
  }
  function suggest() {
    const t = CLIENT.includes(S.role) ? 'work' : S.role === 'engineer' ? 'consult' : 'job';
    const mode = t === 'work' ? 'workers' : t === 'job' ? 'jobs' : 'consult';
    const L = ADS.filter((a) => a.type === t && a.who !== 'me' && (a.st || 'active') === 'active' && (t !== 'job' || !a.aud || a.aud.includes(S.role)))
      .map((a) => ({ a, p: P[a.who] })).filter((x) => x.p && !x.p.me).sort((x, y) => trustOf(y.p).t - trustOf(x.p).t).slice(0, 3);
    const title = { work: 'نیروی پیشنهادی برای تو', job: 'کار مناسب تو', consult: 'پرسش‌های منتظر پاسخ' }[t];
    return `<div class="section"><div class="sec-head"><h3>${title}</h3><button onclick="exploreMode('${mode}')">همه ‹</button></div>${L.length ? L.map((x, k) => adCard(x.a, x.p, k)).join('') : `<div class="empty">فعلاً موردی نیست؛ بعداً سر بزن یا در کاوش بگرد.</div>`}</div>`;
  }
  window.homeSuggestType = () => (CLIENT.includes(S.role) ? 'work' : S.role === 'engineer' ? 'consult' : 'job');
  // خانه: همان نسخهٔ قبلی (به خواست مجید برگردانده شد)
  // استوری نمایشی شخصی (مثل «امتیاز تو ۹۷») حذف؛ فقط استوری‌های واقعی
  wrapW('storyList', function (prev) { return prev().filter((s) => s.k !== 'trust'); });

  /* ================= هـ-۱۸) برآورد چندنوعی ← «نیروی این پروژه را پیدا کن» ================= */
  const Q3 = { eco: 'اقتصادی', mid: 'متوسط', lux: 'لوکس' };
  const mm = (lo, hi) => ({ lo, hi });
  // هر نوع: نام، ورودی‌ها، فرمول هزینه و مصالح، نقش‌ها و مهارت‌های لازم، قالب آگهی و قالب قرارداد
  window.EST_TYPES = [
    {
      k: 'build', n: 'ساخت ساختمان', unit: 'ساختمان',
      inputs: [{ k: 'area', n: 'متراژ هر طبقه', u: 'متر', min: 40, max: 1000, step: 10, d: 120 }, { k: 'fl', n: 'تعداد طبقات', u: 'طبقه', min: 1, max: 12, step: 1, d: 3 }, { k: 'fr', n: 'نوع اسکلت', opts: { c: 'اسکلت بتنی', s: 'اسکلت فلزی' }, d: 'c' }, { k: 'q', n: 'کیفیت ساخت', opts: Q3, d: 'mid' }],
      calc(e) {
        const f = EST.fr[e.fr], tot = e.area * e.fl, con = tot * f.con, cost = tot * EST.q[e.q].p * f.k;
        return { tot, lo: cost * 0.9, hi: cost * 1.12, mon: Math.round(4 + e.fl * 1.8),
          rows: [['بتن', Math.round(con), 'متر مکعب'], ['سیمان', Math.round(con * 7 + tot * 1.1), 'کیسهٔ ۵۰ کیلویی'], ['میلگرد', +(tot * f.reb / 1000).toFixed(1), 'تن'], ...(f.stl ? [['تیرآهن و ورق', +(tot * f.stl / 1000).toFixed(1), 'تن']] : []), ['بلوک سیمانی', Math.round(tot * 27 / 100) * 100, 'عدد'], ['نیروی کار', Math.round(tot * f.lab), 'نفر-روز']],
          parts: EST.parts.map((x) => [x[0], x[1], x[2]]) };
      },
      roles: () => ['contractor', 'company', 'engineer'], skills: ['اجرای اسکلت بتنی', 'سفت‌کاری', 'نظارت عالیه'],
      title: (e, r, pl) => `ساخت ساختمان ${fa(e.fl)} طبقه، ${EST.fr[e.fr].n}، ${fa(r.tot)} متر، ${pl}`,
      desc: (e, r) => `متراژ هر طبقه: ${fa(e.area)} متر\nتعداد طبقات: ${fa(e.fl)}\nنوع اسکلت: ${EST.fr[e.fr].n}\nکیفیت ساخت: ${Q3[e.q]}\nزیربنای کل: ${fa(r.tot)} متر مربع\nهزینهٔ تقریبی: ${toman(r.lo)} تا ${toman(r.hi)} تومان\nمدت اجرا: حدود ${fa(r.mon)} ماه`,
      plan: 'stage', days: (r) => r.mon * 30,
    },
    {
      k: 'unit', n: 'بازسازی واحد مسکونی', unit: 'واحد',
      inputs: [{ k: 'area', n: 'متراژ واحد', u: 'متر', min: 30, max: 400, step: 5, d: 90 }, { k: 'lv', n: 'حجم بازسازی', opts: { light: 'سبک (رنگ و کف)', mid: 'متوسط (+کاشی و برق)', full: 'کامل (+لوله‌کشی و کابینت)' }, d: 'mid' }, { k: 'q', n: 'کیفیت', opts: Q3, d: 'mid' }],
      calc(e) {
        const P2 = { light: { eco: 3, mid: 5, lux: 9 }, mid: { eco: 7, mid: 11, lux: 18 }, full: { eco: 12, mid: 18, lux: 30 } }[e.lv][e.q];
        const cost = e.area * P2, days = Math.round(e.area / { light: 6, mid: 3.5, full: 2.2 }[e.lv]);
        const rows = [['رنگ', Math.round(e.area * 0.9), 'لیتر'], ['کف‌پوش یا سرامیک', Math.round(e.area * 1.08), 'متر مربع']];
        if (e.lv !== 'light') rows.push(['کاشی دیوار', Math.round(e.area * 0.35), 'متر مربع'], ['سیم و لوازم برق', Math.round(e.area * 0.8), 'متر سیم']);
        if (e.lv === 'full') rows.push(['لوله و اتصالات', Math.round(e.area * 0.6), 'متر'], ['کابینت', Math.max(3, Math.round(e.area / 25)), 'متر طول']);
        rows.push(['نیروی کار', Math.round(days * (e.lv === 'light' ? 2 : 3)), 'نفر-روز']);
        const parts = e.lv === 'light' ? [['رنگ و نقاشی', 45, 'var(--gold)'], ['کف', 40, 'var(--r-contractor)'], ['تخریب و نخاله', 15, 'var(--concrete-2)']]
          : [['تخریب و نخاله', 10, 'var(--concrete-2)'], ['کاشی و کف', 30, 'var(--r-contractor)'], ['برق', 15, 'var(--r-engineer)'], ...(e.lv === 'full' ? [['لوله‌کشی', 15, 'var(--accent)'], ['کابینت', 15, 'var(--r-specialist)']] : []), ['رنگ', e.lv === 'full' ? 15 : 45, 'var(--gold)']];
        return { tot: e.area, lo: cost * 0.88, hi: cost * 1.15, mon: Math.max(1, Math.round(days / 26)), days, rows, parts };
      },
      roles: (e) => (e.lv === 'light' ? ['specialist', 'worker'] : ['contractor', 'specialist', 'worker']), skills: ['نقاشی ساختمان', 'کاشی‌کاری', 'برق‌کاری'],
      title: (e, r, pl) => `بازسازی ${{ light: 'سبک', mid: '', full: 'کامل' }[e.lv]} واحد ${fa(e.area)} متری، ${pl}`.replace('  ', ' '),
      desc: (e, r) => `متراژ واحد: ${fa(e.area)} متر\nحجم کار: ${{ light: 'سبک (رنگ و کف)', mid: 'متوسط (رنگ، کف، کاشی و برق)', full: 'کامل (رنگ، کف، کاشی، برق، لوله‌کشی و کابینت)' }[e.lv]}\nکیفیت: ${Q3[e.q]}\nهزینهٔ تقریبی: ${toman(r.lo)} تا ${toman(r.hi)} تومان\nمدت اجرا: حدود ${fa(r.days)} روز`,
      plan: 'three', days: (r) => r.days,
    },
    {
      k: 'kitchen', n: 'بازسازی آشپزخانه', unit: 'آشپزخانه',
      inputs: [{ k: 'area', n: 'متراژ آشپزخانه', u: 'متر', min: 4, max: 40, step: 1, d: 10 }, { k: 'cab', n: 'طول کابینت', u: 'متر', min: 2, max: 14, step: 1, d: 5 }, { k: 'q', n: 'کیفیت', opts: Q3, d: 'mid' }],
      calc(e) {
        const cab = e.cab * { eco: 9, mid: 16, lux: 30 }[e.q], rest = e.area * { eco: 4, mid: 7, lux: 12 }[e.q], cost = cab + rest, days = 10 + e.cab * 2;
        return { tot: e.area, lo: cost * 0.9, hi: cost * 1.15, mon: 1, days,
          rows: [['کابینت', e.cab, 'متر طول'], ['صفحهٔ روی کابینت', e.cab, 'متر طول'], ['کاشی بین کابینت', Math.round(e.cab * 0.7 * 10) / 10, 'متر مربع'], ['سرامیک کف', Math.round(e.area * 1.08), 'متر مربع'], ['لوله و اتصالات', 12, 'متر'], ['نیروی کار', Math.round(days * 2), 'نفر-روز']],
          parts: [['کابینت و صفحه', Math.round((cab / cost) * 100), 'var(--r-specialist)'], ['کاشی و کف', Math.round((rest / cost) * 55), 'var(--r-contractor)'], ['لوله‌کشی و برق', 100 - Math.round((cab / cost) * 100) - Math.round((rest / cost) * 55), 'var(--r-engineer)']] };
      },
      roles: () => ['specialist', 'worker', 'contractor'], skills: ['کابینت‌سازی', 'کاشی‌کاری', 'لوله‌کشی', 'برق‌کاری'],
      title: (e, r, pl) => `بازسازی آشپزخانه ${fa(e.area)} متری با ${fa(e.cab)} متر کابینت، ${pl}`,
      desc: (e, r) => `متراژ آشپزخانه: ${fa(e.area)} متر\nطول کابینت: ${fa(e.cab)} متر\nکیفیت: ${Q3[e.q]}\nکارها: تخریب، لوله‌کشی و برق، کاشی و کف، نصب کابینت و صفحه\nهزینهٔ تقریبی: ${toman(r.lo)} تا ${toman(r.hi)} تومان\nمدت اجرا: حدود ${fa(r.days)} روز`,
      plan: 'three', days: (r) => r.days,
    },
    {
      k: 'bath', n: 'بازسازی سرویس بهداشتی و حمام', unit: 'سرویس',
      inputs: [{ k: 'cnt', n: 'تعداد سرویس و حمام', u: 'عدد', min: 1, max: 4, step: 1, d: 1 }, { k: 'area', n: 'متراژ هر کدام', u: 'متر', min: 2, max: 15, step: 1, d: 5 }, { k: 'q', n: 'کیفیت', opts: Q3, d: 'mid' }],
      calc(e) {
        const body = e.cnt * e.area * { eco: 9, mid: 15, lux: 26 }[e.q], fix = e.cnt * { eco: 15, mid: 30, lux: 60 }[e.q], cost = body + fix, days = e.cnt * 9;
        const tile = Math.round(e.cnt * e.area * 3.6);
        return { tot: e.cnt * e.area, lo: cost * 0.9, hi: cost * 1.15, mon: 1, days,
          rows: [['کاشی و سرامیک', tile, 'متر مربع'], ['عایق رطوبتی', Math.round(e.cnt * e.area * 1.6), 'متر مربع'], ['لوله و اتصالات', e.cnt * 15, 'متر'], ['شیرآلات و چینی', e.cnt, 'سری'], ['نیروی کار', Math.round(days * 2), 'نفر-روز']],
          parts: [['تخریب و عایق', 15, 'var(--concrete-2)'], ['لوله‌کشی', 25, 'var(--accent)'], ['کاشی و سرامیک', 35, 'var(--r-contractor)'], ['برق و نور', 10, 'var(--r-engineer)'], ['شیرآلات و چینی', 15, 'var(--gold)']] };
      },
      roles: () => ['specialist', 'worker', 'contractor'], skills: ['کاشی‌کاری', 'لوله‌کشی', 'برق‌کاری', 'عایق‌کاری'],
      title: (e, r, pl) => `بازسازی ${fa(e.cnt)} سرویس بهداشتی و حمام (${fa(e.area)} متری)، ${pl}`,
      desc: (e, r) => `تعداد: ${fa(e.cnt)} سرویس/حمام، هر کدام حدود ${fa(e.area)} متر\nکیفیت: ${Q3[e.q]}\nکارها: تخریب، عایق رطوبتی، لوله‌کشی، کاشی و سرامیک، برق، نصب شیرآلات و چینی\nنیروی لازم: کاشی‌کار، لوله‌کش، برق‌کار یا پیمانکار جزء\nهزینهٔ تقریبی: ${toman(r.lo)} تا ${toman(r.hi)} تومان\nمدت اجرا: حدود ${fa(r.days)} روز`,
      plan: 'three', days: (r) => r.days,
    },
  ];
  const estT = () => EST_TYPES.find((t) => t.k === (S.est.tk || 'build')) || EST_TYPES[0];
  function estVals(t) {
    S.est.v = S.est.v || {};
    const v = S.est.v[t.k] || (S.est.v[t.k] = {});
    t.inputs.forEach((x) => { if (v[x.k] === undefined) v[x.k] = t.k === 'build' && S.est[x.k] !== undefined ? S.est[x.k] : x.d; });
    return v;
  }
  window.estType = (k) => { S.est.tk = k; renderEst(true); };
  window.estV = (k, d) => { const t = estT(), v = estVals(t), x = t.inputs.find((i) => i.k === k); v[k] = x.opts ? d : Math.max(x.min, Math.min(x.max, v[k] + d * x.step)); if (t.k === 'build') S.est[k] = v[k]; renderEst(true); };
  window.renderEst = function (soft) {
    const t = estT(), e = estVals(t), r = t.calc(e);
    const tower = t.k === 'build' ? `<div class="est-bld" aria-hidden="true"><div class="est-crane"><i class="arm"></i><i class="hook"></i></div>${Array.from({ length: e.fl }, (_, k) => `<div class="est-fl ${e.fr === 's' ? 'steel' : ''}" style="--k:${k}"><span></span><span></span><span></span></div>`).join('')}<div class="est-base"></div></div>` : '';
    $('s-est').innerHTML = `${pageBar('برآورد مصالح و هزینه')}
    <div class="est-types" role="group" aria-label="نوع پروژه">${EST_TYPES.map((x) => `<button aria-pressed="${x.k === t.k}" onclick="estType('${x.k}')">${x.n}</button>`).join('')}</div>
    <div class="hcard est-hero"><div style="flex:1;min-width:0"><small>${t.k === 'build' ? 'زیربنای کل' : 'متراژ'}</small><div class="big num">${fa(r.tot)} <span style="font-size:14px">متر مربع</span></div>
      <small style="display:block;margin-top:10px">هزینهٔ تقریبی</small><b class="est-cost num">${toman(r.lo)} تا ${toman(r.hi)}</b><small class="num">تومان · حدود ${r.days ? fa(r.days) + ' روز' : fa(r.mon) + ' ماه'} اجرا</small></div>${tower}</div>
    <div class="section"><div class="card">${t.inputs.map((x, i) => `<span class="label" ${i ? '' : 'style="margin-top:0"'}>${x.n}</span>${x.opts ? `<div class="seg2">${Object.entries(x.opts).map(([k, n]) => `<button aria-pressed="${e[x.k] === k}" onclick="estV('${x.k}','${k}')">${n}</button>`).join('')}</div>`
      : `<div class="stepper"><button onclick="estV('${x.k}',-1)" aria-label="کمتر">−</button><b class="num">${fa(e[x.k])} ${x.u}</b><button onclick="estV('${x.k}',1)" aria-label="بیشتر">+</button></div>`}`).join('')}</div></div>
    <div class="section"><div class="sec-head"><h3>مصالح اصلی</h3><span>تقریبی</span></div><div class="card est-list">${r.rows.map((x) => `<div class="need"><span class="nt-ic">${QI.doc}</span><div style="flex:1"><b style="display:block">${x[0]}</b><span style="font-size:13px;color:var(--muted)">${x[2]}</span></div><b class="num est-v">${fa(x[1])}</b></div>`).join('')}</div></div>
    <div class="section"><div class="sec-head"><h3>هزینه به تفکیک مرحله</h3></div><div class="card">
      <div class="est-stack">${r.parts.map((x, k) => `<i style="--w:${x[1]}%;--c:${x[2]};--k:${k}"></i>`).join('')}</div>
      ${r.parts.map((x) => `<div class="est-leg"><i style="background:${x[2]}"></i><span>${x[0]}</span><b class="num">${toman(((r.lo + r.hi) / 2) * x[1] / 100)}</b></div>`).join('')}</div></div>
    <div class="section"><p class="est-note">این برآورد با ضرایب میانگین بازار محاسبه شده و جای متره و برآورد مهندس را نمی‌گیرد. قیمت روز مصالح را از فروشنده بپرسید.</p>
      <button class="cta" onclick="gate('post',estGo)">نیروی این پروژه را پیدا کن</button>
      <button class="ghost" style="width:100%;margin-top:8px" onclick="gate('est',saveEst)">ذخیرهٔ برآورد</button>
      <button class="ghost" style="width:100%;margin-top:8px" onclick="exploreMode('consult')">پرسیدن از مهندس</button></div>
    ${S.est.saved.length ? `<div class="section"><div class="sec-head"><h3>برآوردهای ذخیره‌شده</h3></div><div class="card">${S.est.saved.map((x) => `<div class="need"><span class="nt-ic">${QI.doc}</span><div style="flex:1"><b style="display:block" class="num">${esc(x.t)}</b><span style="font-size:13px;color:var(--muted)" class="num">${esc(x.c)}</span></div></div>`).join('')}</div></div>` : ''}`;
    if (soft) $('s-est').querySelectorAll('.est-fl,.est-list .need').forEach((n) => (n.style.animation = 'none'));
  };
  window.saveEst = function () { const t = estT(), e = estVals(t), r = t.calc(e); S.est.saved.unshift({ t: t.title(e, r, '').replace(/،\s*$/, ''), c: `${toman(r.lo)} تا ${toman(r.hi)} تومان` }); toast('برآورد ذخیره شد'); renderEst(true); };

  // «نیروی این پروژه»: آگهی آماده + نقش‌ها + افراد مناسب + پیش‌نویس قرارداد
  function ensureScreen() {
    if ($('s-estgo')) return;
    const s = document.createElement('section');
    s.className = 'screen'; s.id = 's-estgo'; s.setAttribute('aria-label', 'نیروی این پروژه');
    $('s-est').after(s);
  }
  window.estGo = function () {
    ensureScreen();
    const t = estT(), e = estVals(t), r = t.calc(e), pl = (S.profile && S.profile.city) || 'قشم';
    const mid = Math.round((r.lo + r.hi) / 2);
    S.eg = { tk: t.k, title: t.title(e, r, pl), desc: t.desc(e, r), place: QPL.includes(pl) ? pl : 'قشم', budget: toman(mid) + ' تومان (تقریبی)', roles: t.roles(e).slice(), skills: t.skills.slice(), picks: new Set(), days: t.days(r), all: false };
    peSet(PAY_PLANS[t.plan][1], t.plan);
    go('estgo');
  };
  window.egCands = function () {
    const g = S.eg;
    return Object.entries(P).filter(([id, p]) => id !== 'me' && p && !p.me && p.name && g.roles.includes(p.role))
      .map(([id, p]) => ({ id, p, free: (p.week || []).filter((d) => d === 'a').length, near: provOf(p.place) === 'هرمزگان' ? 1 : 0 }))
      .sort((a, b) => b.near - a.near || (b.free > 0) - (a.free > 0) || trustOf(b.p).t - trustOf(a.p).t).slice(0, 12);
  };
  function egSave() {
    const g = S.eg, v = (id) => ($(id) ? $(id).value : null);
    if (v('egT') !== null) g.title = v('egT').trim();
    if (v('egD') !== null) g.desc = v('egD').trim();
    if (v('egB') !== null) g.budget = v('egB').trim();
    if (v('egP') !== null) g.place = v('egP');
    if (v('egDays') !== null) g.days = +toEnD(v('egDays')).replace(/[^\d]/g, '') || g.days;
  }
  window.egRole = (k) => { egSave(); const g = S.eg; g.roles = g.roles.includes(k) ? g.roles.filter((x) => x !== k) : g.roles.concat(k); g.picks = new Set([...g.picks].filter((id) => P[id] && g.roles.includes(P[id].role))); renderEstGo(); };
  window.egPick = (id) => { egSave(); const g = S.eg; g.picks.has(id) ? g.picks.delete(id) : g.picks.add(id); renderEstGo(); };
  window.egAll = () => { egSave(); const g = S.eg, C = egCands(); g.picks = g.picks.size === C.length ? new Set() : new Set(C.map((c) => c.id)); renderEstGo(); };
  const JOB_AUD = ['worker', 'specialist', 'engineer', 'contractor', 'company'];
  window.renderEstGo = function () {
    const g = S.eg;
    if (!g) { go('est'); return; }
    const C = egCands();
    $('s-estgo').innerHTML = `${pageBar('نیروی این پروژه')}
    <div class="eg-steps"><div><i></i>۱. آگهی آماده</div><div><i></i>۲. افراد مناسب</div><div><i></i>۳. پیش‌نویس قرارداد</div></div>
    <div class="section"><div class="sec-head"><h3>آگهی آماده</h3><span>قبل از انتشار ویرایش کن</span></div><div class="card">
      <span class="label" style="margin-top:0">عنوان</span><input class="field" id="egT" value="${esc(g.title)}">
      <span class="label">شرح</span><textarea class="field" id="egD" rows="7">${esc(g.desc)}</textarea>
      <div class="cw-row"><div><span class="label">محل</span><select class="field" id="egP">${QPL.map((x) => `<option ${x === g.place ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
      <div><span class="label">بودجه</span><input class="field" id="egB" value="${esc(g.budget)}"></div></div></div></div>
    <div class="section"><div class="sec-head"><h3>نقش‌های مناسب</h3><span>خودکار انتخاب شد</span></div>
      <div class="chips">${JOB_AUD.map((k) => `<button class="chip" aria-pressed="${g.roles.includes(k)}" onclick="egRole('${k}')"><i style="background:${ROLES[k].c}"></i>${ROLES[k].n}</button>`).join('')}</div></div>
    <div class="section"><div class="sec-head"><h3>افراد مناسب</h3>${C.length ? `<button onclick="egAll()">${g.picks.size === C.length ? 'برداشتن همه' : 'انتخاب همه'}</button>` : ''}</div>
      <div class="card">${C.length ? C.map(({ id, p, free }) => `<button class="eg-p" aria-pressed="${g.picks.has(id)}" onclick="egPick('${id}')">${hexA(p)}<span class="t"><b>${esc(p.name)} ${p.verified ? I.verified : ''}</b><small>${ROLES[p.role].n} · ${esc(placeLbl(p.place || ''))} · اعتبار ${fa(trustOf(p).t)}${free ? ' · ' + fa(free) + ' روز آزاد' : ''}</small></span><span class="ck">${g.picks.has(id) ? '✓' : ''}</span></button>`).join('')
        : `<p style="margin:0;color:var(--muted)">فعلاً کسی با این نقش‌ها پیدا نشد؛ آگهی منتشر می‌شود و افراد مناسب خودشان اعلام آمادگی می‌کنند.</p>`}</div></div>
    <div class="section"><div class="sec-head"><h3>پیش‌نویس قرارداد</h3><span>ضمیمهٔ آگهی؛ بعداً در چت اصلاح می‌شود</span></div><div class="card">
      <div class="eg-sum"><b>شرح کار:</b> ${esc(g.title)}\n<b>مبلغ تقریبی:</b> ${esc(g.budget)}</div>
      <span class="label">مدت اجرا (روز)</span><input class="field num" id="egDays" inputmode="numeric" value="${fa(g.days)}">
      <span class="label">مراحل پرداخت</span><div id="peBox">${peHTML()}</div></div></div>
    <div class="section"><button class="cta" onclick="estPublish()">${g.picks.size ? 'انتشار و ارسال به ' + fa(g.picks.size) + ' نفر' : 'انتشار آگهی'}</button>
      <p class="est-note" style="margin-top:10px">آگهی در کاوش منتشر می‌شود و برای افراد انتخاب‌شده «درخواست همکاری» می‌رود. هر کس قبول کند، در چت با همین پیش‌نویس قرارداد را ثبت می‌کنید.</p></div>`;
  };
  window.egPayload = function () {
    egSave();
    const g = S.eg;
    return { g, draft: { job: g.title, qty: '', price: g.budget, dur: fa(g.days) + ' روز', plan: PE.ms.map((m) => [String(m[0]).trim(), +m[1]]) },
      descFull: g.desc + `\n\nپیش‌نویس قرارداد: مبلغ تقریبی ${g.budget} · مدت ${fa(g.days)} روز · پرداخت: ${planTxt(PE.ms)}` };
  };
  window.estPublish = function () {
    const { g, draft, descFull } = egPayload();
    if (g.title.length < 4) { toast('عنوان آگهی را بنویس'); return; }
    if (!g.roles.length) { toast('حداقل یک نقش انتخاب کن'); return; }
    if (!peValid()) return;
    if (myActiveAds().length >= freeLimit()) { adLimitSheet(); return; }
    const a = { id: 'e' + Date.now(), type: 'job', who: 'me', title: g.title, place: g.place, wageType: 'پروژه‌ای', wage: g.budget, start: 'با هماهنگی', range: 'استان', aud: g.roles.filter((r) => JOB_AUD.includes(r)), need: 1, resp: 0, posted: 'همین حالا', skills: g.skills, desc: descFull, st: 'active' };
    ADS.unshift(a);
    saveCtrDraft(a.id, draft);
    const ids = [...g.picks];
    ids.forEach((id) => S.out.unshift({ t: 'درخواست همکاری: ' + g.title, to: id, d: 'همین حالا · ' + g.budget, st: null, kind: 'collab' }));
    estDone(ids.length);
  };
  window.estDone = function (n, cid, noAd) {
    const g = S.eg;
    reqDone({
      title: noAd ? 'درخواست‌ها رفت (بدون آگهی تازه)' : n ? 'آگهی منتشر شد و درخواست‌ها رفت' : 'آگهی منتشر شد', who: '«' + g.title + '»' + (n ? ' · برای ' + fa(n) + ' نفر' : ''), cid,
      where: noAd ? 'درخواست‌ها ← ارسالی' : n ? 'درخواست‌ها ← ارسالی · و «آگهی‌های من»' : '«آگهی‌های من»',
      steps: [n ? 'افراد انتخاب‌شده درخواست را در «درخواست‌ها» می‌بینند و قبول یا رد می‌کنند.' : 'آگهی در کاوش برای نقش‌های انتخاب‌شده دیده می‌شود.', 'هر کس قبول کند یا اعلام آمادگی کند، گفت‌وگو باز می‌شود.', 'در چت «ثبت قرارداد» را بزن؛ پیش‌نویس همین برآورد آماده است.'],
    });
  };
  wrapW('render', function (prev) { if (S.cur === 'estgo') return renderEstGo(); return prev(); });
  wrapW('go', function (prev, name, noPush) { if (name === 'estgo') ensureScreen(); return prev(name, noPush); });
})();
