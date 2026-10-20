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
      'پیدا کردن مهندس': 'Find an engineer',
    });
    I18N.re = null;
  }
})();
