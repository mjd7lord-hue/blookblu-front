/* ============================================================
   بلوک — حالت دسکتاپ (desktop.js)
   لایهٔ افزوده روی اپ موبایل‌محور؛ به منطق اصلی دست نمی‌زند.
   ≥ 800px  : سایدبار جمع (فقط آیکن)
   ≥ 1080px : سایدبار کامل + چیدمان چندستونی
   زیر 800px همه‌چیز دقیقاً مثل قبل است.
   اجبار دستی: ?desktop=1 (همیشه دسکتاپ) ، ?desktop=0 (همیشه موبایل) ، ?desktop=auto
   ============================================================ */
(function () {
  'use strict';
  if (window.__blkDesktop) return; window.__blkDesktop = true;

  var MQ = matchMedia('(min-width: 800px)');
  var FORCE = null;
  try {
    var q = new URLSearchParams(location.search).get('desktop');
    if (q === '1' || q === '0') localStorage.setItem('blkDesk', q);
    else if (q === 'auto') localStorage.removeItem('blkDesk');
    var v = localStorage.getItem('blkDesk'); if (v === '1') FORCE = true; else if (v === '0') FORCE = false;
  } catch (e) {}
  var root = document.documentElement;

  /* ---------------- CSS ---------------- */
  var css = `
.dk-side,.dk-chat-empty{display:none}
.dk-main,.dk-aside{display:contents}

html.dk{--sbw:84px;--lpw:340px}
@media (min-width:1080px){html.dk{--sbw:264px;--lpw:380px}}

/* پوسته */
html.dk body{padding-right:var(--sbw)}
/* انیمیشن ورود صفحه فقط محو شدن؛ تا عناصر fixed نسبت به پنجره جا بگیرند */
html.dk .screen.on,html.dk .screen.on.fwd,html.dk .screen.on.bwd{animation:dkFade .28s ease both!important}
@keyframes dkFade{from{opacity:0}}
html.dk .screen.on.noanim2{animation:none!important}
html.dk .nav{display:none!important}
html.dk .app{max-width:var(--pw,780px);padding:8px 28px 56px;box-sizing:border-box}
@media (min-width:1080px){html.dk body.dk-wide .app{--pw:1240px}}
html.dk .toast{left:calc((100% - var(--sbw))/2);bottom:32px}
html.dk .sticky{right:var(--sbw)}
html.dk .sticky-in{max-width:724px}
html.dk .offbar{right:var(--sbw)}
html.dk .hup{left:calc((100% - var(--sbw))/2)}

/* سایدبار */
html.dk .dk-side{display:flex;flex-direction:column;position:fixed;top:0;bottom:0;right:0;width:var(--sbw);z-index:25;
  background:var(--surface);border-left:1px solid var(--line);padding:18px 12px 14px;box-sizing:border-box;overflow-y:auto;overflow-x:hidden;
  direction:rtl;scrollbar-width:thin;zoom:var(--uiz,1)}
.dk-brand{display:flex;flex-direction:column;align-items:flex-start;gap:2px;border:0;background:none;padding:4px 10px 14px;text-align:right;cursor:pointer;color:inherit}
.dk-brand .brand{display:inline-flex;align-items:center;gap:8px}
.dk-brand .brand .blk-logo{width:34px;height:36px}
.dk-brand .brand .wm{font-size:24px}
.dk-brand small{font-size:11.5px;color:var(--muted);white-space:nowrap}
.dk-brand .dk-mark{display:none}
.dk-post{display:flex;align-items:center;justify-content:center;gap:8px;min-height:48px;border:0;border-radius:16px;background:var(--accent,var(--gold));color:#fff;
  font:inherit;font-weight:800;font-size:15px;margin:2px 4px 14px;cursor:pointer;box-shadow:0 6px 18px color-mix(in srgb,var(--accent,#0F9C88) 30%,transparent);transition:transform .15s,filter .15s}
.dk-post:hover{filter:brightness(1.07);transform:translateY(-1px)}
.dk-post svg{width:20px;height:20px;stroke-width:2.4}
.dk-grp{font-size:11.5px;color:var(--muted);margin:14px 12px 6px;font-weight:700;letter-spacing:.2px}
.dk-it{display:flex;align-items:center;gap:12px;width:100%;min-height:44px;border:0;background:none;border-radius:13px;padding:0 12px;margin:1px 0;
  font:inherit;font-size:14.5px;color:var(--muted);text-align:right;cursor:pointer;position:relative;transition:background .15s,color .15s}
.dk-it svg{width:21px;height:21px;flex:none}
.dk-it span{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dk-it:hover{background:var(--soft);color:var(--ink)}
.dk-it[aria-current="page"]{background:color-mix(in srgb,var(--accent,#0F9C88) 12%,transparent);color:var(--accent,var(--ink));font-weight:800}
.dk-it[aria-current="page"]::before{content:"";position:absolute;right:-12px;top:10px;bottom:10px;width:4px;border-radius:4px 0 0 4px;background:var(--accent,var(--gold))}
.dk-it .dk-nb{min-width:20px;height:20px;border-radius:10px;background:var(--bad,#C63D3D);color:#fff;font-size:11.5px;font-weight:900;display:grid;place-items:center;padding:0 6px;flex:none}
.dk-sp{flex:1;min-height:12px}
.dk-me{display:flex;align-items:center;gap:10px;width:100%;border:1px solid var(--line);background:var(--bg);border-radius:16px;padding:10px;font:inherit;color:inherit;text-align:right;cursor:pointer;margin-top:8px;transition:border-color .15s}
.dk-me:hover{border-color:var(--accent,var(--gold))}
.dk-me .av{width:40px;height:40px;border-radius:12px;background:var(--night);color:var(--gold-2,#fff);display:grid;place-items:center;font-weight:900;font-size:14px;flex:none}
.dk-me .t{flex:1;min-width:0;line-height:1.5}
.dk-me b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dk-me small{display:flex;align-items:center;gap:6px;color:var(--muted);font-size:12px}
.dk-me small i{width:8px;height:8px;border-radius:50%}
.dk-login{min-height:46px;border:0;border-radius:14px;background:var(--ink);color:var(--bg);font:inherit;font-weight:800;margin-top:8px;cursor:pointer;width:100%}
.dk-login .s{display:none}
.dk-row{display:flex;gap:6px;margin-top:8px}
.dk-row .dk-it{justify-content:center;border:1px solid var(--line);min-height:40px}
.dk-row .dk-it span{flex:none}

/* سایدبار جمع (800 تا 1079) */
@media (max-width:1079px){
  html.dk .dk-side{padding:16px 10px;align-items:center}
  html.dk .dk-brand{padding:2px 0 12px;align-items:center}
  html.dk .dk-brand .brand,html.dk .dk-brand small{display:none}
  html.dk .dk-brand .dk-mark{display:block}
  html.dk .dk-brand .dk-mark .blk-logo{width:36px;height:38px}
  html.dk .dk-post{width:52px;height:52px;padding:0;margin:0 0 12px;border-radius:18px}
  html.dk .dk-post span,html.dk .dk-it span,html.dk .dk-grp,html.dk .dk-me .t{display:none}
  html.dk .dk-grp{display:block;height:1px;background:var(--line);margin:10px 8px;font-size:0;width:40px}
  html.dk .dk-it{justify-content:center;width:52px;padding:0}
  html.dk .dk-it[aria-current="page"]::before{right:-10px}
  html.dk .dk-it .dk-nb{position:absolute;top:4px;left:4px;min-width:17px;height:17px;font-size:10px;padding:0 4px}
  html.dk .dk-me{width:auto;padding:6px;border-radius:14px}
  html.dk .dk-login{width:52px;font-size:12px}
  html.dk .dk-login .l{display:none}html.dk .dk-login .s{display:inline}
  html.dk .dk-row{flex-direction:column}
  html.dk .dk-row .dk-it{width:52px}
}

/* برگه‌ها ← پنجرهٔ وسط صفحه */
html.dk .sheet{left:0;right:var(--sbw);top:0;bottom:0;display:flex;align-items:center;justify-content:center;pointer-events:none;
  transform:none;opacity:0;visibility:hidden;transition:opacity .22s,visibility 0s .22s}
html.dk .sheet.on{opacity:1;visibility:visible;transition:opacity .22s}
html.dk .sheet-in{pointer-events:auto;width:min(560px,calc(100% - 48px));max-width:none;margin:0;border-radius:26px;max-height:86vh;
  padding:22px 26px 24px;transform:translateY(18px) scale(.98);transition:transform .28s cubic-bezier(.2,.9,.25,1.05);box-shadow:0 30px 80px rgba(6,12,24,.35)}
html.dk .sheet.on .sheet-in{transform:none}
html.dk .sheet .grab{display:none}

/* تعامل با ماوس */
@media (hover:hover){
  html.dk .acard:hover,html.dk .poster:hover,html.dk .pcard:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(16,24,40,.10)}
  html.dk .citem:hover{background:var(--soft)}
  html.dk .chip:hover,html.dk .icon-btn:hover{border-color:var(--accent,var(--gold))}
}
html.dk ::-webkit-scrollbar{width:10px;height:10px}
html.dk ::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--muted) 35%,transparent);border-radius:10px;border:3px solid transparent;background-clip:content-box}
html.dk ::-webkit-scrollbar-track{background:transparent}
html.dk .rail{scrollbar-width:thin}
html.dk .rail::-webkit-scrollbar{display:block;height:6px}

/* صفحه‌های داشبوردی ← دو ستون (masonry) */
@media (min-width:1080px){
  html.dk body.dk-cols .screen.on{columns:2 420px;column-gap:28px}
  html.dk body.dk-cols .screen.on>*{break-inside:avoid;-webkit-column-break-inside:avoid}
  html.dk body.dk-cols .screen.on>:is(header,.top,.bar,.stories,.chat-top,.seg-out){column-span:all}
  html.dk body.dk-cols .screen.on>.section{margin-top:0;padding-top:22px}
  html.dk body.dk-cols .screen.on>:is(.hcard,.mecard,.inbox-hero){margin-top:14px}
  html.dk body.dk-cols .screen.on .rail{padding-inline:4px}
}

/* صفحه‌های دو‌بخشی: محتوای اصلی + ستون کناری */
@media (min-width:1080px){
  html.dk .screen.dk-split.on{display:grid;grid-template-columns:minmax(0,1fr) var(--asw,380px);column-gap:28px;align-items:start}
  html.dk .screen.dk-split.aside-first{grid-template-columns:var(--asw,400px) minmax(0,1fr)}
  html.dk .screen.dk-split>:not(.dk-main):not(.dk-aside){grid-column:1/-1}
  html.dk .screen.dk-split .dk-main,html.dk .screen.dk-split .dk-aside{display:block;min-width:0}
  html.dk .screen.dk-split .dk-aside{position:sticky;top:12px;padding-bottom:20px}
  html.dk .screen.dk-split .dk-aside .sticky{position:static;background:none;padding:14px 16px 0}
  html.dk .screen.dk-split .dk-aside .sticky-in{max-width:none}
  html.dk .screen.dk-split .dk-aside>.hero:first-child{margin-top:12px}
  html.dk .screen.dk-split .dk-aside>.hero:first-child .hero-head{margin-top:0}
}
/* نتایج کاوش در شبکه */
@media (min-width:1080px){
  html.dk #s-explore #results>.section{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));column-gap:14px;align-items:start}
  html.dk #s-explore #results>.section>:is(.sec-head,.empty,p,.more,button:not(.acard)){grid-column:1/-1}
  html.dk #s-explore #results .acard{margin-bottom:14px;height:calc(100% - 14px)}
  html.dk #s-saved .section:has(.acard),html.dk #s-myads .section:has(.acard){display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));column-gap:14px}
  html.dk #s-saved .section:has(.acard)>:not(.acard),html.dk #s-myads .section:has(.acard)>:not(.acard){grid-column:1/-1}
}

/* پیام‌ها: فهرست + گفت‌وگو کنار هم */
html.dk body.dk-inbox .app{max-width:none;margin-right:var(--lpw);padding:0}
html.dk body.dk-inbox #s-msg{display:block!important;position:fixed;top:0;bottom:0;right:var(--sbw);width:var(--lpw);overflow-y:auto;
  background:var(--bg);border-left:1px solid var(--line);padding-bottom:24px;box-sizing:border-box;animation:none!important;zoom:1}
html.dk body.dk-inbox #s-msg .citem.dk-act{background:color-mix(in srgb,var(--accent,#0F9C88) 10%,var(--surface))}
html.dk body.dk-inbox #s-msg .citem.dk-act::after{content:"";position:absolute;right:0;top:12px;bottom:12px;width:4px;border-radius:4px 0 0 4px;background:var(--accent,var(--gold))}
html.dk body.dk-inbox #s-msg .swipe-hint{display:none}
html.dk body.dk-inbox #s-chat .chat-top{padding:14px 24px 10px;border-bottom:1px solid var(--line)}
html.dk body.dk-inbox #s-chat .chat-top>.icon-btn:first-child{display:none}
html.dk body.dk-inbox #s-chat>:not(.chat-top):not(.composer){max-width:860px;margin-left:auto;margin-right:auto}
html.dk body.dk-inbox #s-chat .msgs{padding:16px 24px 150px}
html.dk body.dk-inbox .composer{right:calc(var(--sbw) + var(--lpw))}
html.dk body.dk-inbox .composer-in{max-width:820px}
html.dk body.dk-page-msg .dk-chat-empty{display:grid;place-items:center;min-height:100vh;text-align:center;color:var(--muted);padding:24px}
.dk-chat-empty svg{width:120px;height:100px;margin:0 auto 10px}
.dk-chat-empty b{display:block;color:var(--ink);font-size:18px;margin-bottom:4px}

/* حالت انگلیسی (چپ‌به‌راست) */
html.dk[data-en] body{padding-right:0;padding-left:var(--sbw)}
html.dk[data-en] .dk-side{right:auto;left:0;border-left:0;border-right:1px solid var(--line)}
html.dk[data-en] .sheet{right:0;left:var(--sbw)}
html.dk[data-en] .toast,html.dk[data-en] .hup{left:calc(var(--sbw) + (100% - var(--sbw))/2)}
html.dk[data-en] .sticky{right:0;left:var(--sbw)}

@media (prefers-reduced-motion:reduce){.dk-post,.dk-it,html.dk .sheet-in{transition:none}}
`;
  var st = document.createElement('style'); st.id = 'dk-css'; st.textContent = css;
  document.head.appendChild(st);

  /* ---------------- آیکن‌ها ---------------- */
  var P = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    explore: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    msg: '<path d="M4 5h16v11H9l-5 4z"/>',
    notif: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
    me: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
    proj: '<path d="M3 21h18M5 21V8l7-4 7 4v13"/><path d="M9 21v-6h6v6"/>',
    req: '<path d="M4 4h16v16H4z"/><path d="M4 9h16M9 13h6M9 16h4"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    myads: '<path d="M4 4h12l4 4v12H4z"/><path d="M8 12h8M8 16h5"/>',
    saved: '<path d="M6 3h12v18l-6-4-6 4z"/>',
    set: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    theme: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'
  };
  function ico(k) { return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + P[k] + '</svg>'; }

  var MAIN = [['home', 'خانه'], ['explore', 'کاوش'], ['msg', 'پیام‌ها'], ['notif', 'اعلان‌ها'], ['me', 'من']];
  var MINE = [['proj', 'پروژه‌های من'], ['req', 'درخواست‌ها'], ['cal', 'تقویم'], ['myads', 'آگهی‌های من'], ['saved', 'ذخیره‌ها']];
  /* زیرصفحه‌ها ← کدام آیتم منو روشن شود */
  var PARENT = { ad: 'explore', profile: 'explore', qa: 'explore', cmp: 'explore', boost: 'myads', visit: 'explore', chat: 'msg',
    trust: 'me', edit: 'me', pf: 'me', guar: 'me', roles: 'me', docs: 'me', invite: 'me', stats: 'me', learn: 'me', arbj: 'me', about: 'set', sec: 'set',
    pdet: 'proj', ctr: 'proj', sov: 'proj', team: 'proj', disp: 'proj', safe: 'proj', est: 'proj' };
  /* صفحه‌هایی که پهن و دوستونه نمایش داده می‌شوند */
  var COLS = { home: 1, me: 1, set: 1, notif: 0, req: 1, pdet: 1, trust: 1, stats: 1, learn: 1, team: 1, docs: 1, roles: 1, cal: 1, arbj: 1, disp: 1 };
  var WIDE = { explore: 1, ad: 1, profile: 1, saved: 1, myads: 1 };
  /* صفحه‌های دو‌بخشی: [انتخابگر ستون کناری، کناری اول (سمت راست)؟ ، عرض] */
  var SPLIT = {
    explore: ['.hero,.search,.alertbar,.rail:not(#results .rail)', true, '400px'],
    ad: ['.section:has(.poster),.sticky,.section:has(.note)', false, '360px'],
    profile: ['.phero,.sticky', true, '400px']
  };

  function hasS() { return typeof S !== 'undefined' && !!S; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function safe(f, d) { try { return f(); } catch (e) { return d; } }

  /* ---------------- سایدبار ---------------- */
  var side = document.createElement('aside');
  side.className = 'dk-side'; side.id = 'dkSide'; side.setAttribute('dir', 'rtl'); side.setAttribute('aria-label', 'منوی اصلی');
  document.body.appendChild(side);

  function item(k, n) {
    return '<button class="dk-it" data-dk="' + k + '" title="' + n + '" onclick="go(\'' + k + '\')">' + ico(k) + '<span>' + n + '</span></button>';
  }
  function buildSide() {
    var brand = safe(function () { return '<span class="brand sm">' + logoSVG('') + wordmark('') + '</span>'; }, '<b>بلوک</b>');
    var mark = safe(function () { return logoSVG(''); }, '');
    var auth = !!(hasS() && S.auth);
    var foot;
    if (auth) {
      var me = safe(function () { return ME(); }, { name: 'حساب من', ini: 'م' });
      var r = safe(function () { return ROLES[S.role]; }, { n: '', c: 'var(--accent)' });
      foot = '<button class="dk-me" onclick="go(\'me\')" title="' + esc(me.name) + '"><span class="av">' + esc(me.ini || 'م') + '</span>' +
        '<span class="t"><b>' + esc(me.name) + '</b><small><i style="background:' + r.c + '"></i>' + esc(r.n) + '</small></span></button>';
    } else {
      foot = '<button class="dk-login" onclick="startAuth()" title="ورود / ثبت‌نام"><span class="l">ورود / ثبت‌نام</span><span class="s">ورود</span></button>';
    }
    side.innerHTML =
      '<button class="dk-brand" onclick="go(\'home\')" aria-label="بلوک — خانه">' + brand + '<span class="dk-mark">' + mark + '</span><small>اکوسیستم هوشمند صنعت ساخت و ساز</small></button>' +
      '<button class="dk-post" onclick="openWizard()" title="ثبت آگهی">' + ico('plus') + '<span>ثبت آگهی</span></button>' +
      MAIN.map(function (x) { return item(x[0], x[1]); }).join('') +
      '<div class="dk-grp">کارهای من</div>' +
      MINE.map(function (x) { return item(x[0], x[1]); }).join('') +
      '<div class="dk-sp"></div>' +
      '<div class="dk-row">' + item('set', 'تنظیمات') +
      '<button class="dk-it" title="روشن / تیره" onclick="toggleTheme()">' + ico('theme') + '<span>پوسته</span></button></div>' +
      foot;
    side.dataset.auth = auth ? '1' : '0';
    syncSide();
  }
  function syncSide() {
    if (!hasS()) return;
    var cur = S.cur, act = PARENT[cur] || cur;
    side.querySelectorAll('[data-dk]').forEach(function (b) {
      if (b.dataset.dk === act) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    var n = safe(function () { return S.auth ? unreadTotal() : 0; }, 0);
    var b = side.querySelector('[data-dk="msg"]');
    if (b) {
      var s = b.querySelector('.dk-nb');
      if (!n) { if (s) s.remove(); }
      else { if (!s) { s = document.createElement('i'); s.className = 'dk-nb'; b.appendChild(s); } s.textContent = safe(function () { return fa(n); }, n); }
    }
  }

  /* ---------------- جای خالی گفت‌وگو ---------------- */
  var app = document.querySelector('.app');
  var empty = document.createElement('div');
  empty.className = 'dk-chat-empty';
  empty.innerHTML = '<div><svg viewBox="0 0 120 100" aria-hidden="true"><rect x="10" y="14" width="70" height="46" rx="14" fill="none" stroke="currentColor" stroke-width="3"/><path d="M26 60v14l14-14" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><rect x="44" y="36" width="66" height="42" rx="14" fill="var(--accent,#0F9C88)" opacity=".18"/><path d="M28 32h34M28 42h22" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>' +
    '<b>یک گفت‌وگو را انتخاب کن</b><span>فهرست گفت‌وگوها سمت راست است؛ همهٔ هماهنگی‌ها داخل بلوک، بدون شماره.</span></div>';
  if (app) app.appendChild(empty);

  /* ---------------- تقسیم صفحه به اصلی + کناری ---------------- */
  function split(name) {
    var cfg = SPLIT[name]; if (!cfg || !isDk()) return;
    var el = document.getElementById('s-' + name); if (!el || el.querySelector(':scope>.dk-main')) return;
    var kids = Array.prototype.slice.call(el.children);
    if (kids.length < 3) return;
    var head = [], aside = [], main = [];
    kids.forEach(function (k, i) {
      if (k.matches('header,.top,.bar,.seg-out') && !main.length && !aside.length) head.push(k);
      else if (k.matches(cfg[0])) aside.push(k);
      else main.push(k);
    });
    if (!aside.length || !main.length) return;
    var M = document.createElement('div'); M.className = 'dk-main';
    var A = document.createElement('div'); A.className = 'dk-aside';
    main.forEach(function (k) { M.appendChild(k); });
    aside.forEach(function (k) { A.appendChild(k); });
    if (cfg[1]) { el.appendChild(A); el.appendChild(M); } else { el.appendChild(M); el.appendChild(A); }
    el.classList.add('dk-split'); el.classList.toggle('aside-first', !!cfg[1]);
    el.style.setProperty('--asw', cfg[2]);
  }

  /* ---------------- همگام‌سازی با صفحهٔ فعلی ---------------- */
  function isDk() { return root.classList.contains('dk'); }
  var lastAuth = null, busy = false;
  function sync() {
    if (!hasS() || busy) return;
    busy = true;
    try {
      var cur = S.cur, b = document.body;
      b.classList.toggle('dk-cols', !!COLS[cur]);
      b.classList.toggle('dk-wide', !!(COLS[cur] || WIDE[cur]));
      var inbox = isDk() && S.auth && (cur === 'msg' || cur === 'chat');
      b.classList.toggle('dk-inbox', !!inbox);
      b.classList.toggle('dk-page-msg', !!inbox && cur === 'msg');
      if (inbox && cur === 'chat') {
        var list = document.getElementById('s-msg');
        if (list && !list.querySelector('#clist')) safe(function () { renderMsgs(); });
      }
      if (inbox) markActive();
      if (lastAuth !== !!S.auth) { lastAuth = !!S.auth; buildSide(); } else syncSide();
      split(cur);
    } finally { busy = false; }
  }
  function markActive() {
    var id = S.cur === 'chat' ? S.cid : null;
    document.querySelectorAll('#s-msg .citem').forEach(function (c) { c.classList.toggle('dk-act', !!id && c.dataset.id === String(id)); });
  }

  /* هر تغییری در صفحه‌ها (عوض شدن صفحه یا رندر دوباره) ← همگام‌سازی */
  var pending = false;
  function schedule() { if (pending) return; pending = true; Promise.resolve().then(function () { pending = false; sync(); }); }
  var mo = new MutationObserver(schedule);
  document.querySelectorAll('.app>.screen').forEach(function (s) { mo.observe(s, { attributes: true, attributeFilter: ['class'], childList: true }); });
  var clist = new MutationObserver(function () { if (document.body.classList.contains('dk-inbox')) markActive(); });
  var msgEl = document.getElementById('s-msg'); if (msgEl) clist.observe(msgEl, { childList: true, subtree: true });

  /* بج پیام‌ها و تغییر نقش/ورود */
  if (typeof window.updNavBadge === 'function') {
    var u0 = window.updNavBadge;
    window.updNavBadge = function () { var r = u0.apply(this, arguments); syncSide(); return r; };
  }

  /* چرخ ماوس روی ریل‌های افقی ← اسکرول افقی */
  document.addEventListener('wheel', function (e) {
    if (!isDk() || e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    var r = e.target.closest && e.target.closest('.rail,.stories');
    if (!r || r.scrollWidth <= r.clientWidth + 2) return;
    var max = r.scrollWidth - r.clientWidth, x = Math.abs(r.scrollLeft);
    if ((e.deltaY > 0 && x >= max - 1) || (e.deltaY < 0 && x <= 0)) return;
    r.scrollLeft -= e.deltaY; /* RTL */
    e.preventDefault();
  }, { passive: false });

  /* Esc ← بستن پنجره */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isDk()) {
      var sh = document.getElementById('sheet');
      if (sh && sh.classList.contains('on') && typeof closeSheet === 'function') closeSheet();
    }
  });

  /* ---------------- روشن/خاموش با تغییر اندازهٔ پنجره ---------------- */
  function apply() {
    var on = FORCE === null ? MQ.matches : FORCE, was = isDk();
    root.classList.toggle('dk', on);
    if (on !== was && hasS()) {
      /* رندر دوبارهٔ صفحهٔ فعلی تا چیدمان مناسب ساخته شود */
      safe(function () { render(); });
    }
    lastAuth = null; sync();
  }
  if (MQ.addEventListener) MQ.addEventListener('change', apply); else MQ.addListener(apply);
  window.addEventListener('resize', function () { if (isDk()) split(hasS() && S.cur); });
  apply();
})();
