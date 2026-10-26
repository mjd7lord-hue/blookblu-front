/* =====================================================================
 * real.js — دور ۳۷ «همه‌چیز واقعی» (بعد از trust36.js، قبل از desktop.js)
 * وقتی اپ به سرور وصل است، هیچ دادهٔ نمایشی (نمونه‌های index.html) دیده نمی‌شود:
 *   آگهی، آدم، پروژه، کارگاه، مناقصه، تأیید ناظر، ظرفیت نیرو، «قدم بعدی»، بازدید مهندس نمونه و …
 *   جای خالی ← حالت خالی واقعی یا اصلاً نمایش داده نمی‌شود. بدون سرور (نسخهٔ نمایشی) همه‌چیز مثل قبل.
 * بررسی خودکار: npm run front:real (در مخزن بک‌اند)
 * ===================================================================== */
(function () {
  const on = () => !!(window.LIVE && LIVE.on);
  const wrapW = (name, fn) => { const prev = window[name]; if (typeof prev !== 'function') return; window[name] = function (...a) { return fn.call(this, prev, ...a); }; };
  const isDemoP = (id) => id && id !== 'me' && P[id] && !P[id]._live;

  /* ---- حضور و بازدید (دور ۳۹): برای «آنلاین همین حالا» و آمار بازدید پنل؛ مهمان‌ها هم شمرده می‌شوند ---- */
  const vid = (() => {
    let v = null; try { v = localStorage.getItem('blk-vid'); } catch (e) {}
    if (!v || !/^[A-Za-z0-9_-]{8,40}$/.test(v)) { v = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); try { localStorage.setItem('blk-vid', v); } catch (e) {} }
    return v;
  })();
  let lastView = 0;
  // دور ۵۱: منبع ورود (utm_source یا سایت قبلی) و «باز شده از آیکون روی گوشی» — برای آمار پنل؛ بدون دادهٔ شخصی
  const entrySrc = (() => {
    try {
      const u = new URLSearchParams(location.search).get('utm_source') || new URLSearchParams(location.search).get('ref');
      if (u) return u.slice(0, 40);
      const r = document.referrer ? new URL(document.referrer).hostname : '';
      return r && r !== location.hostname ? r : '';
    } catch (e) { return ''; }
  })();
  const installed = () => { try { return !!(matchMedia('(display-mode: standalone)').matches || navigator.standalone); } catch (e) { return false; } };
  function ping(view) {
    if (!window.LIVE || !LIVE.base || document.hidden) return;
    const h = { 'Content-Type': 'application/json' };
    if (LIVE.tok && LIVE.tok.a) h.Authorization = 'Bearer ' + LIVE.tok.a;
    if (view) lastView = Date.now();
    const body = { v: vid, view: !!view, sa: installed() };
    if (entrySrc) body.src = entrySrc;
    fetch(LIVE.base + '/api/app/ping', { method: 'POST', headers: h, body: JSON.stringify(body) }).catch(() => {});
  }
  // باز شدن اپ = یک بازدید؛ برگشتن بعد از ۳۰ دقیقه = بازدید تازه؛ هر ۶۰ ثانیه «هنوز اینجام»
  setTimeout(() => ping(true), 2500);
  setInterval(() => ping(false), 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) ping(Date.now() - lastView > 30 * 60000); });

  /* ---- دور ۴۵: کد پیامکی خودکار ----
   * آیفون: autocomplete="one-time-code" ← کد پیامک بالای کیبورد می‌آید و با یک لمس پر می‌شود.
   * اندروید (Chrome): WebOTP ← اگر خط آخر پیامک «@blooko.ir #12345» باشد، کد بدون لمس خوانده و وارد می‌شود.
   * کد کامل (چسباندن یا پرشدن خودکار) در هر خانه‌ای بیاید، بین ۵ خانه پخش می‌شود. */
  const toEnD = (s) => String(s || '').replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  function fillOtpBoxes(code) {
    const ins = [...document.querySelectorAll('#otp input')];
    const d = toEnD(code).replace(/\D/g, '').slice(0, ins.length);
    if (!ins.length || d.length < ins.length) return false;
    ins.forEach((x, k) => (x.value = d[k]));
    window.otpIn(ins[ins.length - 1], ins.length - 1);
    return true;
  }
  wrapW('otpIn', function (prev, inp, i) {
    const d = toEnD(inp && inp.value).replace(/\D/g, '');
    if (d.length > 1 && fillOtpBoxes(d)) return;
    return prev(inp, i);
  });
  let webOtp = null;
  function listenSms(onCode) {
    if (!('OTPCredential' in window) || !navigator.credentials) return;
    if (webOtp) webOtp.abort();
    const ac = (webOtp = new AbortController());
    setTimeout(() => ac.abort(), 5 * 60000);
    navigator.credentials.get({ otp: { transport: ['sms'] }, signal: ac.signal }).then((c) => { if (c && c.code) onCode(c.code); }).catch(() => {});
  }
  function armCodeInputs() {
    const first = document.querySelector('#otp input:not([data-otp])');
    if (first) {
      document.querySelectorAll('#otp input').forEach((x) => { x.dataset.otp = '1'; x.setAttribute('autocomplete', 'off'); });
      first.setAttribute('autocomplete', 'one-time-code');
      first.setAttribute('name', 'otp');
      first.removeAttribute('maxlength');
      listenSms((code) => fillOtpBoxes(code));
    }
    // کد امضای قرارداد و تأیید قیم
    document.querySelectorAll('#sigC:not([data-otp]), #gCode:not([data-otp])').forEach((x) => {
      x.dataset.otp = '1';
      x.setAttribute('autocomplete', 'one-time-code');
      listenSms((code) => { if (document.body.contains(x)) { x.value = toEnD(code).replace(/\D/g, '').slice(0, 5); x.dispatchEvent(new Event('input', { bubbles: true })); } });
    });
    if (!document.querySelector('#otp input, #sigC, #gCode') && webOtp) { webOtp.abort(); webOtp = null; }
  }

  /* ---- دور ۴۵: بدون کپی متن (به‌جز داخل کادرهای نوشتن) ---- */
  const ncCss = document.createElement('style');
  ncCss.textContent = `body{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
  input,textarea,select,[contenteditable="true"]{-webkit-user-select:text;user-select:text;-webkit-touch-callout:default}
  img,svg{-webkit-user-drag:none}`;
  document.head.appendChild(ncCss);
  const editable = (t) => !!(t && t.closest && t.closest('input, textarea, select, [contenteditable="true"]'));
  ['copy', 'cut'].forEach((ev) => document.addEventListener(ev, (e) => { if (!editable(e.target)) e.preventDefault(); }, true));
  document.addEventListener('contextmenu', (e) => { if (!editable(e.target)) e.preventDefault(); }, true);
  document.addEventListener('selectstart', (e) => { if (!editable(e.target)) e.preventDefault(); }, true);
  document.addEventListener('dragstart', (e) => { if (!editable(e.target)) e.preventDefault(); }, true);

  /* ---- دور ۴۴: برچسب «نمونه» روی آگهی و پروفایل حساب‌های نمونه (وقتی مدیر نمایششان را روشن کرده) ---- */
  const smpCss = document.createElement('style');
  smpCss.textContent = `.smp{display:inline-block;vertical-align:middle;margin-inline-start:6px;font-size:11px;font-weight:700;line-height:1;padding:4px 7px;border-radius:7px;background:#FEF3C7;color:#92400E;border:1px solid #FCD34D}
  .smp-note{margin:10px 16px 0;padding:10px 12px;border-radius:12px;background:#FEF3C7;color:#92400E;font-size:13px;line-height:1.8}`;
  document.head.appendChild(smpCss);
  const isSampleAd = (id) => { const a = ADS.find((x) => String(x.id) === String(id)); return !!(a && (a._sample || (P[a.who] && P[a.who].sample))); };
  let smpT = 0;
  function markSamples() {
    smpT = 0;
    if (!on()) return;
    document.querySelectorAll('.acard[data-id]:not([data-smp])').forEach((c) => {
      c.dataset.smp = '1';
      if (!isSampleAd(c.dataset.id)) return;
      const t = c.querySelector('h3, b, .t'); (t || c).insertAdjacentHTML('beforeend', '<span class="smp" title="آگهی نمونه برای نمایش بلوک">نمونه</span>');
    });
    const ad = $('s-ad');
    if (ad && S.cur === 'ad' && S.adId && isSampleAd(S.adId) && !ad.querySelector('.smp-note')) {
      const bar = ad.querySelector('.bar'); const html = '<div class="smp-note">این آگهی «نمونه» است و برای نمایش بلوک ساخته شده؛ پشت آن شخص واقعی نیست.</div>';
      if (bar) bar.insertAdjacentHTML('afterend', html); else ad.insertAdjacentHTML('afterbegin', html);
    }
    const pf = $('s-profile');
    if (pf && S.cur === 'profile' && P[S.pid] && P[S.pid].sample && !pf.querySelector('.smp-note')) {
      const bar = pf.querySelector('.bar'); const html = '<div class="smp-note">این پروفایل «نمونه» است و برای نمایش بلوک ساخته شده؛ پشت آن شخص واقعی نیست.</div>';
      if (bar) bar.insertAdjacentHTML('afterend', html); else pf.insertAdjacentHTML('afterbegin', html);
    }
  }
  let armT = 0;
  try { new MutationObserver(() => { if (!smpT) smpT = setTimeout(markSamples, 60); if (!armT) armT = setTimeout(() => { armT = 0; armCodeInputs(); }, 40); }).observe(document.body, { childList: true, subtree: true }); } catch (e) {}

  /* ---- انبارهای نمایشی: با اتصال خالی می‌شوند ---- */
  function purge() {
    if (!on()) return;
    // آگهی‌های نمایشی (آگهی واقعی _live دارد)
    for (let i = ADS.length - 1; i >= 0; i--) if (!ADS[i]._live && !ADS[i]._mine) ADS.splice(i, 1);
    if (Array.isArray(S.hold)) S.hold.length = 0;
    if (Array.isArray(S.alerts)) S.alerts.length = 0;
  }
  if (window.LIVE) LIVE.onLive = (LIVE.onLive || []).concat(purge);
  ['renderExplore', 'renderHome', 'renderReq', 'renderMyAds', 'renderSaved'].forEach((n) => wrapW(n, function (prev, ...a) { purge(); return prev(...a); }));

  /* ---- خانه: کارت‌ها و بخش‌های نمایشی ---- */
  const DEMO_HEAD = /^(نیروی لازم برای فردا|ظرفیت نیروی این هفته|دعوت به مناقصه|منتظر تأیید تو|کارهای در جریان|درخواست‌های تازه در رشتهٔ تو|قدم بعدی)/;
  wrapW('renderHome', function (prev, ...a) {
    const r = prev(...a);
    if (!on() || !S.auth) return r;
    try {
      const host = $('s-home'); if (!host) return r;
      // کارت بزرگ نمایشی (کارگاه، شیفت امروز، پروژهٔ من، پروژه‌های شرکت) — پروژهٔ واقعی در اسلایدر بالای خانه است
      host.querySelectorAll('#csite, :scope > .hcard, #phHero .ph-ext').forEach((h) => {
        if (h.closest('#phHero') && !h.classList.contains('ph-ext')) return;
        const t = h.textContent.replace(/\s+/g, ' ').trim();
        if (h.id === 'csite' || /^(شیفت امروز|پروژهٔ من|پروژه‌های شرکت|کارگاه )/.test(t)) {
          const ext = h.closest('.ph-ext'); (ext || h).remove();
        }
      });
      const dots = host.querySelectorAll('#phHero .ph-dots button'), slides = host.querySelectorAll('#phHero .ph-slide');
      if (dots.length && dots.length !== slides.length) { [...dots].slice(slides.length).forEach((d) => d.remove()); if (slides.length < 2) { const dd = host.querySelector('#phHero .ph-dots'); if (dd) dd.remove(); } }
      host.querySelectorAll(':scope > .section').forEach((s) => {
        const h = s.querySelector('.sec-head h3, b');
        const t = h ? h.textContent.trim() : '';
        if (s.id === 'tender' || s.id === 'ehold' || DEMO_HEAD.test(t)) s.remove();
      });
    } catch (e) {}
    return r;
  });

  /* ---- مدارک من: «کارت ملی» = همان «تأیید هویت» (کارت + سلفی)، نه یک مدرک جدا (دور ۴۰) ---- */
  wrapW('renderDocs', function (prev, ...a) {
    const r = prev(...a);
    if (!on() || !S.auth) return r;
    try {
      const k = (LIVE.me && LIVE.me.user && LIVE.me.user.kycStatus) || 'none';
      document.querySelectorAll('#s-docs .doc-row').forEach((row) => {
        const b = row.querySelector('b');
        if (!b || b.textContent.trim() !== 'کارت ملی') return;
        row.querySelectorAll('label.mini, .tag').forEach((x) => x.remove());
        const sub = row.querySelector('span[style*="font-size:13px"]');
        if (sub) sub.textContent = k === 'verified' ? 'هویت تأیید شده' : k === 'pending' ? 'تأیید هویت در حال بررسی' : 'با «تأیید هویت»: کارت ملی + سلفی';
        row.insertAdjacentHTML('beforeend', k === 'verified' ? '<span class="tag ok">تأیید شده</span>' : k === 'pending' ? '<span class="tag wait">در بررسی</span>' : '<button class="mini yes" onclick="openKYC()">تأیید هویت</button>');
      });
      i18n($('s-docs'));
    } catch (e) {}
    return r;
  });

  /* ---- بازدید مهندس: فقط مهندس واقعی ---- */
  wrapW('renderVisit', function (prev, ...a) {
    const v = S.visit;
    if (!on() || !v || !isDemoP(v.pid)) return prev(...a);
    $('s-visit').innerHTML = `${pageBar('رزرو بازدید کارگاه')}
      <div class="section" style="margin-top:12px"><div class="empty"><b>اول یک مهندس انتخاب کن</b><p style="margin:4px 0 12px">در کاوش، پروفایل مهندس را باز کن و «رزرو بازدید» را بزن؛ زمان‌های آزاد واقعی او اینجا می‌آید.</p>
      <button class="cta" onclick="exploreMode('workers')">پیدا کردن مهندس</button></div></div>`;
    if (typeof i18nNode === 'function' && S.prefs && S.prefs.lang === 'en') i18nNode($('s-visit'));
  });

  const i18n = (el) => { try { if (el && typeof i18nNode === 'function' && S.prefs && (S.prefs.lang === 'en' || S.prefs.latin)) i18nNode(el); } catch (e) {} };
  const api = (m, p, b) => LIVE.api(m, p, b);
  const err = (e) => (LIVE.err ? LIVE.err(e) : toast((e && e.message) || 'خطا'));
  const rel = (d) => (LIVE.rel ? LIVE.rel(d) : '');

  /* ---- امنیت حساب: دستگاه‌های واقعی (نشست‌های باز) ---- */
  const devName = (ua) => {
    ua = ua || '';
    const os = /iPhone|iPad/.test(ua) ? 'آیفون' : /Android/.test(ua) ? 'اندروید' : /Windows/.test(ua) ? 'ویندوز' : /Mac OS/.test(ua) ? 'مک' : /Linux/.test(ua) ? 'لینوکس' : 'دستگاه';
    const br = /Edg\//.test(ua) ? 'اج' : /Firefox\//.test(ua) ? 'فایرفاکس' : /Chrome\//.test(ua) ? 'کروم' : /Safari\//.test(ua) ? 'سافاری' : 'مرورگر';
    return [os, br];
  };
  S.sessL = null;
  const loadSess = () => api('POST', '/me/sessions', { refreshToken: LIVE.tok && LIVE.tok.r }).then((d) => { S.sessL = d.items || []; if (S.cur === 'sec') renderSec(); });
  wrapW('renderSec', function (prev, ...a) {
    if (!on() || !S.auth) return prev(...a);
    const L = S.sessL, ph = LIVE.me && LIVE.me.user && LIVE.me.user.phone;
    const phFa = ph ? (typeof faNum === 'function' ? String(ph) : ph).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]) : '';
    const mask = phFa ? phFa.slice(0, 4) + ' ••• ' + phFa.slice(-4) : '';
    const icPhone = MI.phone.replace('class="ico"', 'class="ico" style="width:20px;height:20px"');
    const icPc = '<svg class="ico" viewBox="0 0 24 24" style="width:20px;height:20px"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M2 20h20"/></svg>';
    $('s-sec').innerHTML = `${pageBar('امنیت حساب')}
      <div class="section" style="margin-top:10px"><div class="shield-h"><div class="sh-art" aria-hidden="true"><svg viewBox="0 0 80 90"><path d="M40 6l30 12v22c0 22-14 36-30 42C24 76 10 62 10 40V18z" fill="var(--accent)"/><path class="sh-ck" d="M26 45l10 10 19-21" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        <div><b>ورود فقط با کد پیامکی</b><span>هر ورود تازه با کد یک‌بارمصرف به شمارهٔ خودت انجام می‌شود.</span></div></div></div>
      <div class="section"><div class="sec-head"><h3>دستگاه‌های وارد شده</h3>${L && L.length > 1 ? '<button onclick="secOthers()">خروج از بقیه</button>' : ''}</div>
        <div class="card">${L == null ? '<p class="hint center">در حال بارگذاری…</p>' : L.map((s) => { const [os, br] = devName(s.ua); return `<div class="need"><span class="nt-ic">${/آیفون|اندروید/.test(os) ? icPhone : icPc}</span><div style="flex:1"><b style="display:block">${os} · ${br}${s.current ? ' <span class="tag" style="font-size:11px;border-radius:6px;padding:2px 6px;background:#DCFCE7;color:#166534">همین دستگاه</span>' : ''}</b><span style="font-size:13px;color:var(--muted)">آخرین فعالیت: ${rel(s.at)}</span></div>${s.current ? '' : `<button class="mbtn" onclick="secOut('${s.id}')">خروج</button>`}</div>`; }).join('') || '<p class="hint center">دستگاهی نیست</p>'}</div></div>
      <div class="section"><div class="card" style="padding:2px 16px"><button class="linkrow" onclick="toast(${JSON.stringify('برای تغییر شماره، از «پشتیبانی» پیام بده؛ بعد از بررسی هویت عوض می‌شود')})"><span class="ic">${icPhone}</span><span>شمارهٔ موبایل</span><small dir="ltr">${mask}</small></button></div></div>`;
    i18n($('s-sec'));
    if (L == null) loadSess().catch(err);
  });
  window.secOut = (id) => api('DELETE', '/me/sessions/' + id).then(() => { toast('از آن دستگاه خارج شدی'); return loadSess(); }).catch(err);
  window.secOthers = () => api('POST', '/me/sessions/revoke-others', { refreshToken: LIVE.tok && LIVE.tok.r }).then(() => { toast('از همهٔ دستگاه‌های دیگر خارج شدی'); return loadSess(); }).catch(err);
  const g0 = window.go;
  window.go = function (name, ...a) { if (name === 'sec' && on()) S.sessL = null; if (name === 'invite' && on()) S.refs = null; return g0.call(this, name, ...a); };

  /* ---- دعوت: کسانی که واقعاً با کد من ثبت‌نام کرده‌اند ---- */
  S.refs = null;
  wrapW('renderInvite', function (prev, ...a) {
    if (!on() || !S.auth) return prev(...a);
    S.invited = [];
    const r = prev(...a);
    const head = [...document.querySelectorAll('#s-invite .sec-head h3')].find((h) => /دعوت‌شده‌ها/.test(h.textContent));
    const sec = head && head.closest('.section');
    if (sec) {
      const L = S.refs;
      sec.innerHTML = `<div class="sec-head"><h3>با کد تو عضو شدند</h3><span class="num">${L ? fa(L.length) + ' نفر' : ''}</span></div><div class="card">${L == null ? '<p class="hint center">در حال بارگذاری…</p>' : L.length ? L.map((x) => `<button class="need" style="width:100%;border:0;background:none;text-align:start;font:inherit;color:inherit" onclick="refOpen('${x.code}')"><div class="hex" style="width:40px;height:44px;font-size:13px;background:${(ROLES[x.role] || {}).c || 'var(--accent)'}">${esc((x.name || '؟')[0])}</div><div style="flex:1"><b style="display:block">${esc(x.name)}</b><span style="font-size:13px;color:var(--muted)">${esc((ROLES[x.role] || {}).n || '')} · ${esc(x.city || '')} · ${rel(x.joinedAt)}</span></div></button>`).join('') : '<p class="hint center" style="margin:6px 0">هنوز کسی با کد تو ثبت‌نام نکرده. متن دعوت بالا را برای همکارانت بفرست.</p>'}</div>`;
      i18n(sec);
    }
    if (S.refs == null) api('GET', '/me/referrals').then((d) => { S.refs = d.items || []; if (S.cur === 'invite') renderInvite(); }).catch(err);
    return r;
  });
  window.refOpen = (code) => { const x = (S.refs || []).find((r) => r.code === code); if (!x) return; const id = LIVE.upsertPerson({ code: x.code, role: x.role, name: x.name, doneCount: x.doneCount }, x.city); openProfile(id); };

  /* ---- دربارهٔ بلوک: وضعیت واقعی سرویس ---- */
  S.health = null;
  wrapW('renderAbout', function (prev, ...a) {
    const r = prev(...a);
    if (!on()) return r;
    const el = $('s-about'); if (!el) return r;
    el.querySelectorAll('p').forEach((p) => { if (/نسخهٔ ۲٫۰ نمایشی/.test(p.textContent)) p.textContent = p.textContent.replace(' نمایشی', ''); });
    const head = [...el.querySelectorAll('.sec-head h3')].find((h) => /وضعیت سرویس/.test(h.textContent));
    const card = head && head.closest('.section').querySelector('.card');
    if (card) {
      const h = S.health, row = (n, ok) => `<div class="svc"><span class="dot ${ok == null ? 'slow' : ok ? 'ok' : 'down'}"></span><span style="flex:1">${n}</span><small>${ok == null ? 'در حال بررسی…' : ok ? 'عادی' : 'قطع'}</small></div>`;
      card.innerHTML = row('سرور بلوک', h ? h.ok : null) + row('پایگاه داده', h ? h.db === 'up' : null);
      const sp = head.parentElement.querySelector('span'); if (sp) sp.textContent = h ? 'به‌روز: ' + rel(h.time) : '';
    }
    i18n(el);
    if (!S.health) fetch(LIVE.base + '/api/health').then((x) => x.json()).catch(() => ({ ok: false, db: 'down', time: new Date().toISOString() })).then((d) => { S.health = d; if (S.cur === 'about') renderAbout(); });
    return r;
  });

  if (typeof I18N === 'object') {
    Object.assign(I18N.dict, {
      'ورود فقط با کد پیامکی': 'Sign-in by SMS code only', 'هر ورود تازه با کد یک‌بارمصرف به شمارهٔ خودت انجام می‌شود.': 'Every new sign-in uses a one-time code sent to your own number.',
      'همین دستگاه': 'This device', 'آخرین فعالیت: {@}': 'Last active: {@}', 'خروج': 'Sign out', 'دستگاهی نیست': 'No devices', 'شمارهٔ موبایل': 'Mobile number',
      'برای تغییر شماره، از «پشتیبانی» پیام بده؛ بعد از بررسی هویت عوض می‌شود': 'To change your number, message Support; it is changed after an identity check',
      'از آن دستگاه خارج شدی': 'Signed out of that device', 'آیفون': 'iPhone', 'اندروید': 'Android', 'ویندوز': 'Windows', 'مک': 'Mac', 'لینوکس': 'Linux', 'دستگاه': 'Device', 'کروم': 'Chrome', 'فایرفاکس': 'Firefox', 'سافاری': 'Safari', 'اج': 'Edge', 'مرورگر': 'Browser',
      'با کد تو عضو شدند': 'Joined with your code', 'هنوز کسی با کد تو ثبت‌نام نکرده. متن دعوت بالا را برای همکارانت بفرست.': 'Nobody has joined with your code yet. Send the invite text above to your colleagues.',
      'سرور بلوک': 'Blook server', 'پایگاه داده': 'Database', 'در حال بررسی…': 'Checking…', 'قطع': 'Down', 'عادی': 'Normal', 'به‌روز: {@}': 'Updated: {@}',
    });
    I18N.re = null;
  }

  if (typeof I18N === 'object') {
    Object.assign(I18N.dict, {
      'اول یک مهندس انتخاب کن': 'Pick an engineer first',
      'در کاوش، پروفایل مهندس را باز کن و «رزرو بازدید» را بزن؛ زمان‌های آزاد واقعی او اینجا می‌آید.': 'In Explore, open an engineer’s profile and tap “Book a visit”; their real free times appear here.',
      'پیدا کردن مهندس': 'Find an engineer', 'نمونه': 'Sample', 'این آگهی «نمونه» است و برای نمایش بلوک ساخته شده؛ پشت آن شخص واقعی نیست.': 'This is a “sample” ad made to showcase Blook; there is no real person behind it.', 'این پروفایل «نمونه» است و برای نمایش بلوک ساخته شده؛ پشت آن شخص واقعی نیست.': 'This is a “sample” profile made to showcase Blook; there is no real person behind it.',
      'هویت تأیید شده': 'Identity verified', 'تأیید هویت در حال بررسی': 'Identity check in review', 'با «تأیید هویت»: کارت ملی + سلفی': 'Via “Verify identity”: national card + selfie', 'تأیید هویت': 'Verify identity',
    });
    I18N.re = null;
  }
})();
