/* =====================================================================
 * founders.js — دور ۵۴: کمپین «۱۰۰ عضو بنیان‌گذار» (بعد از pay.js، قبل از desktop.js)
 *   ۱) چک‌لیست ۳ مرحله‌ای در خانه: فالو اینستاگرام · احراز هویت · دعوت یک دوست (+ پیشرفت و جایگاه‌های باقی‌مانده واقعی)
 *   ۲) لینک دعوت blooko.ir/i/کد ← ?i=کد ← فیلد «معرف» ثبت‌نام خودکار پر می‌شود
 *   ۳) نشان «عضو بنیان‌گذار #شماره» روی پروفایل
 *   ۴) جشن: تبریک عضو تازه و بنیان‌گذار شدن (ترقه‌بازی)
 *   پیش‌نمایش برای بررسی: ?preview=welcome · ?preview=founder · ?preview=founders
 * داده: GET /api/founders (وضعیت + مراحل من)، POST /api/founders/follow
 * ===================================================================== */
(function () {
  const on = () => !!(window.LIVE && LIVE.on);
  const wrapW = (name, fn) => { const prev = window[name]; if (typeof prev !== 'function') return; window[name] = function (...a) { return fn.call(this, prev, ...a); }; };
  const err = (e) => (window.LIVE && LIVE.err ? LIVE.err(e) : toast((e && e.message) || 'خطا'));
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const jsdom = /jsdom/i.test(navigator.userAgent || '');
  const qs = (() => { try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(''); } })();
  const preview = qs.get('preview') || '';
  const F = { st: null, at: 0, busy: false };
  window.FND = F;

  /* ---------- لینک دعوت: ?i=کد ← ذخیره تا ثبت‌نام ---------- */
  const inv = (qs.get('i') || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12);
  if (inv) {
    ls.set('blk-inv', inv);
    try { history.replaceState(null, '', location.pathname + location.search.replace(/([?&])i=[^&]*&?/, '$1').replace(/[?&]$/, '') + location.hash); } catch (e) {}
  }
  const invCode = () => ls.get('blk-inv') || '';
  // فیلد «معرف» ثبت‌نام خودکار با کد دعوت پر شود (کاربر می‌بیند و می‌تواند عوض کند)
  wrapW('renderRegStep', function (prev, ...a) {
    if (S.reg && S.reg.d && !S.reg.addRole && invCode() && S.reg.d.ref == null) S.reg.d.ref = invCode();
    return prev(...a);
  });

  /* ---------- داده ---------- */
  async function load(force) {
    if (!on() || F.busy) return F.st;
    if (!force && F.st && Date.now() - F.at < 20000) return F.st;
    F.busy = true;
    try {
      F.st = await LIVE.api('GET', '/founders');
      F.at = Date.now();
      celebrateFounderOnce();
    } catch (e) {} finally { F.busy = false; }
    return F.st;
  }
  const me = () => (F.st && F.st.me) || null;
  const link = () => (me() && me().inviteCode ? `https://blooko.ir/i/${me().inviteCode}` : '');

  /* ---------- کارت چک‌لیست در خانه ---------- */
  const css = document.createElement('style');
  css.textContent = `#fnd54 .card{padding:14px;border:1px solid color-mix(in srgb,var(--gold) 40%,var(--line));background:linear-gradient(160deg,color-mix(in srgb,var(--gold) 10%,var(--surface)),var(--surface))}
  #fnd54 .fh{display:flex;align-items:center;gap:10px}#fnd54 .fh .md{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:var(--gold);color:#3b2a00;flex:none}
  #fnd54 .fh .md svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
  #fnd54 .fh b{display:block;font-size:15.5px}#fnd54 .fh small{color:var(--muted);font-size:12.5px}#fnd54 .left{margin-inline-start:auto;text-align:center;line-height:1.2}#fnd54 .left b{font-size:20px;color:var(--gold)}#fnd54 .left small{display:block;font-size:11px}
  #fnd54 .fpb{height:8px;border-radius:6px;background:var(--line);overflow:hidden;margin:12px 0 4px}#fnd54 .fpb i{display:block;height:100%;background:var(--gold);border-radius:6px;transition:width .6s}
  #fnd54 .pg{font-size:12px;color:var(--muted);display:flex;justify-content:space-between}
  #fnd54 .st{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px dashed var(--line)}#fnd54 .st:first-of-type{border-top:0}
  #fnd54 .ck{width:26px;height:26px;border-radius:50%;border:2px solid var(--line);display:grid;place-items:center;flex:none;font-size:14px;font-weight:900;color:var(--muted)}
  #fnd54 .st.ok .ck{background:var(--ok);border-color:var(--ok);color:#fff}#fnd54 .st .tx{flex:1;min-width:0}#fnd54 .st .tx b{display:block;font-size:14px}#fnd54 .st .tx small{color:var(--muted);font-size:12px}
  #fnd54 .st button{border:0;border-radius:12px;padding:8px 12px;font:inherit;font-size:13px;font-weight:800;background:var(--gold);color:#3b2a00;cursor:pointer;flex:none}#fnd54 .st.ok button{background:var(--soft,var(--bg));color:var(--muted)}
  #fnd54 .lnk{direction:ltr;font-size:12px;color:var(--muted);word-break:break-all}#fnd54 .pk{margin:10px 0 0;padding:0;list-style:none;font-size:12.5px;color:var(--muted)}#fnd54 .pk li::before{content:"★ ";color:var(--gold)}
  .fnd-ring{display:inline-block;line-height:0;flex:none;filter:drop-shadow(2.5px 0 0 #F2B53A) drop-shadow(-2.5px 0 0 #F2B53A) drop-shadow(0 2.5px 0 #F2B53A) drop-shadow(0 -2.5px 0 #F2B53A) drop-shadow(0 0 6px rgba(242,181,58,.7))}
  .fnd-badge.sm{font-size:11.5px;padding:2px 8px;margin-top:4px}
  .fnd-ribbon{position:absolute;bottom:12px;left:-40px;transform:rotate(45deg);background:linear-gradient(90deg,#F2B53A,#F97316);color:#3b2a00;font-size:10.5px;font-weight:900;padding:3px 34px;box-shadow:0 2px 6px rgba(0,0,0,.25);pointer-events:none}
  #s-trust .sb-head{position:relative;overflow:hidden}
  #fnd54 .fnd-todo{margin-top:12px;padding:10px 12px;border-radius:12px;background:color-mix(in srgb,var(--gold) 12%,transparent);border:1px dashed var(--gold)}#fnd54 .fnd-todo b{display:block;font-size:14px}#fnd54 .fnd-todo small{color:var(--muted);font-size:12.5px}
  #fnd54 .fnd-todo-b{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}#fnd54 .fnd-todo-b button{border:0;border-radius:10px;padding:7px 12px;font:inherit;font-size:13px;font-weight:800;background:var(--gold);color:#3b2a00;cursor:pointer}
  .fnd-badge{display:inline-flex;align-items:center;gap:5px;margin-top:6px;font-size:12.5px;font-weight:800;border-radius:20px;padding:3px 10px;background:linear-gradient(90deg,#F2B53A,#F97316);color:#3b2a00}
  .cel-sheet{text-align:center}.cel-sheet .big{font-size:54px;line-height:1}.cel-sheet h3{margin:10px 0 4px;font-size:20px}.cel-sheet .num-b{font-size:34px;font-weight:900;color:var(--gold)}
  #celCv{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999}`;
  document.head.appendChild(css);
  const MEDAL = '<svg viewBox="0 0 24 24"><circle cx="12" cy="15" r="6"/><path d="M8.5 3h7l-2 6.5M8.5 3l2 6.5M12 12.5l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L9.1 14.6l2-.3z"/></svg>';

  function cardHTML(st, m) {
    if (m && m.number) {
      const until = m.commissionFreeUntil ? new Date(m.commissionFreeUntil).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
      const pr = m.profile || { complete: true };
      const todo = pr.complete ? '' : `<div class="fnd-todo"><b>پروفایلت را کامل کن</b><small>بنیان‌گذار با عکس و معرفی کامل بیشتر دیده می‌شود و اعتماد بیشتری می‌گیرد.</small><div class="fnd-todo-b">${pr.photo ? '' : '<button onclick="avOpen()">گذاشتن عکس پروفایل</button>'}${pr.bio ? '' : '<button onclick="typeof openEditAll===\'function\'?openEditAll():go(\'edit\')">نوشتن معرفی کوتاه</button>'}</div></div>`;
      return `<div class="card"><div class="fh"><span class="md">${MEDAL}</span><div><b>تو عضو بنیان‌گذار #${fa(m.number)} بلوک هستی</b><small>بدون کمیسیون بلوک${until ? ' تا ' + until : ''}</small></div></div>${todo}</div>`;
    }
    const s = (m && m.steps) || { follow: false, kyc: false, invite: false }, done = (m && m.done) || 0;
    const step = (ok, t, sub, btn, fn) => `<div class="st ${ok ? 'ok' : ''}"><span class="ck">${ok ? '✓' : ''}</span><div class="tx"><b>${t}</b><small>${sub}</small></div>${btn ? `<button onclick="${fn}">${ok ? '✓ ' : ''}${btn}</button>` : ''}</div>`;
    const kycSub = m && m.kycStatus === 'pending' ? 'در حال بررسی؛ نتیجه را خبر می‌دهیم' : 'کارت ملی و سلفی؛ چند دقیقه';
    return `<div class="card"><div class="fh"><span class="md">${MEDAL}</span><div><b>۱۰۰ عضو بنیان‌گذار بلوک</b><small>۳ قدم تا شمارهٔ اختصاصی و امتیازهای ویژه</small></div>
        <div class="left"><b class="num">${fa(st.left)}</b><small>جا مانده</small></div>${window.hqBtn ? hqBtn('founders') : ''}</div>
      <div class="fpb"><i style="width:${Math.round((done / 3) * 100)}%"></i></div><div class="pg"><span>${fa(done)} از ۳ قدم</span><span>${fa(st.taken)} از ${fa(st.cap)} جایگاه گرفته شده</span></div>
      ${S.auth ? '' : `<div class="st"><span class="ck">!</span><div class="tx"><b>اول عضو بلوک شو</b><small>ثبت‌نام با شمارهٔ موبایل؛ یک دقیقه</small></div><button onclick="startAuth()">ثبت‌نام</button></div>`}
      ${step(s.follow, 'فالو پیج اینستاگرام بلوک', 'blooko.ir در اینستاگرام', s.follow ? 'فالو کردی' : 'فالو کردم', 'fndFollow()')}
      ${step(s.kyc, 'احراز هویت', kycSub, s.kyc ? 'انجام شد' : 'تأیید هویت', s.kyc ? 'void 0' : 'openKYC()')}
      ${step(s.invite, 'دعوت یک دوست', m && m.inviteCode ? `<span class="lnk">${esc(link())}</span>${m.invites ? ' · ' + fa(m.invites) + ' نفر عضو شدند' : ''}` : 'وقتی دوستت با لینک تو ثبت‌نام کند تیک می‌خورد', 'اشتراک لینک', 'fndShare()')}
      <ul class="pk">${(st.perks || []).map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>`;
  }
  function paint() {
    const host = document.getElementById('s-home');
    if (!host || S.cur !== 'home') return;
    let box = document.getElementById('fnd54');
    const st = F.st, m = me();
    const show = st && ((st.open && !(m && m.revoked)) || (m && m.number));
    if (!show) { if (box) box.remove(); return; }
    const html = cardHTML(st, m);
    if (!box) {
      box = document.createElement('div'); box.className = 'section'; box.id = 'fnd54';
      const after = document.getElementById('phHero') || document.getElementById('ugIn') || host.querySelector(':scope > header');
      const qa = document.getElementById('qa42');
      if (qa) qa.before(box); else if (after) after.after(box); else host.prepend(box);
    }
    if (box._x !== html) { box.innerHTML = html; box._x = html; if (typeof i18nNode === 'function' && S.prefs && (S.prefs.lang === 'en' || S.prefs.latin)) try { i18nNode(box); } catch (e) {} }
  }
  wrapW('renderHome', function (prev, ...a) {
    const r = prev(...a);
    if (preview === 'founders' && !F.st) F.st = demoState();
    if (on() || F.st) { paint(); if (on() && preview !== 'founders') load().then(paint); }
    return r;
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && on() && S.cur === 'home') load(true).then(paint); });

  /* ---------- مرحله‌ها ---------- */
  window.fndFollow = function () {
    const url = (F.st && F.st.igUrl) || 'https://instagram.com/blooko.ir';
    try { window.open(url, '_blank', 'noopener'); } catch (e) {}
    if (!S.auth) { toast('بعد از ثبت‌نام، این قدم را دوباره بزن تا ثبت شود'); return; }
    if (preview === 'founders') { F.st.me.steps.follow = true; F.st.me.done++; paint(); return; }
    LIVE.api('POST', '/founders/follow').then((r) => { F.st = r; F.at = Date.now(); paint(); toast('قدم ۱ ثبت شد'); celebrateFounderOnce(); }).catch(err);
  };
  window.fndShare = function () {
    if (!S.auth) { startAuth(); return; }
    const url = link();
    if (!url) { toast('لینک دعوت بعد از تکمیل ثبت‌نام ساخته می‌شود'); return; }
    const text = 'بلوک، بازار کار ساختمان ایران؛ با لینک من عضو شو:';
    if (navigator.share) { navigator.share({ title: 'بلوک', text, url }).catch(() => {}); return; }
    const done = () => toast('لینک دعوت کپی شد؛ برای دوستت بفرست');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, () => toast(url));
    else toast(url);
  };

  /* ---------- نشان روی پروفایل ---------- */
  wrapW('renderProfile', function (prev, ...a) {
    const r = prev(...a);
    const p = typeof person === 'function' ? person(S.pid) : null;
    const n = p && (p.founder || (p.me && me() && me().number));
    const rl = n && document.querySelector('#s-profile .phero .rl');
    if (rl && !document.querySelector('#s-profile .fnd-badge')) rl.insertAdjacentHTML('afterend', `<div class="fnd-badge">${MEDAL.replace('<svg', '<svg style="width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2"')}عضو بنیان‌گذار #${fa(n)}</div>`);
    const av = n && document.querySelector('#s-profile .phero .hex');
    if (av && !av.closest('.fnd-ring')) { const w = document.createElement('span'); w.className = 'fnd-ring'; av.replaceWith(w); w.appendChild(av); }
    return r;
  });

  /* ---------- دور ۵۸: نشان «سفیر بلوک» (۱۰+ دعوت موفق) روی پروفایل و شناسنامه ---------- */
  const AMB = '<svg viewBox="0 0 24 24" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"><path d="M12 3l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.3 6.8 19l1-5.8L3.6 9.1l5.8-.8z"/></svg>';
  const ambOf = (p) => !!p && (p.ambassador || (p.me && me() && (me().invites || 0) >= 10));
  const ambBadge = (sm) => `<div class="amb-badge${sm ? ' sm' : ''}">${AMB}سفیر بلوک</div>`;
  const ambCss = document.createElement('style');
  ambCss.textContent = `.amb-badge{display:inline-flex;align-items:center;gap:5px;margin-top:6px;margin-inline-start:6px;font-size:12.5px;font-weight:800;border-radius:20px;padding:3px 10px;background:linear-gradient(90deg,#7C3AED,#2563EB);color:#fff}.amb-badge.sm{font-size:11.5px;padding:2px 8px;margin-top:4px}`;
  document.head.appendChild(ambCss);
  wrapW('renderProfile', function (prev, ...a) {
    const r = prev(...a);
    const p = typeof person === 'function' ? person(S.pid) : null;
    if (!ambOf(p) || document.querySelector('#s-profile .amb-badge')) return r;
    const at = document.querySelector('#s-profile .fnd-badge') || document.querySelector('#s-profile .phero .rl');
    if (at) at.insertAdjacentHTML('afterend', ambBadge());
    return r;
  });
  wrapW('renderTrust', function (prev, ...a) {
    const r = prev(...a);
    const p = typeof person === 'function' ? person(S.tid) : null;
    const nm = ambOf(p) && document.querySelector('#s-trust .sb-nm');
    if (nm && !nm.querySelector('.amb-badge')) nm.insertAdjacentHTML('beforeend', ambBadge(true));
    return r;
  });

  /* ---------- دور ۵۷: نشان روی شناسنامهٔ کاری ---------- */
  wrapW('renderTrust', function (prev, ...a) {
    const r = prev(...a);
    const p = typeof person === 'function' ? person(S.tid) : null;
    const n = p && (p.founder || (p.me && me() && me().number));
    if (!n) return r;
    const nm = document.querySelector('#s-trust .sb-nm');
    if (nm && !nm.querySelector('.fnd-badge')) nm.insertAdjacentHTML('beforeend', `<div class="fnd-badge sm">${MEDAL.replace('<svg', '<svg style="width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:2"')}عضو بنیان‌گذار #${fa(n)}</div>`);
    const av = document.querySelector('#s-trust .sb-id .hex');
    if (av && !av.closest('.fnd-ring')) { const w = document.createElement('span'); w.className = 'fnd-ring'; av.replaceWith(w); w.appendChild(av); }
    const head = document.querySelector('#s-trust .sb-head');
    if (head && !head.querySelector('.fnd-ribbon')) head.insertAdjacentHTML('beforeend', `<span class="fnd-ribbon">بنیان‌گذار #${fa(n)}</span>`);
    return r;
  });

  /* ---------- جشن: ترقه‌بازی ---------- */
  function fireworks(ms = 3200) {
    if (jsdom) return;
    let cv = document.getElementById('celCv');
    if (!cv) { cv = document.createElement('canvas'); cv.id = 'celCv'; document.body.appendChild(cv); }
    const ctx = cv.getContext && cv.getContext('2d'); if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = (cv.width = innerWidth * dpr), H = (cv.height = innerHeight * dpr);
    const reduce = matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const COL = ['#F2B53A', '#F97316', '#22C55E', '#5EA8FF', '#EF4444', '#A78BFA', '#FFFFFF'];
    const P = [];
    const burst = (x, y, n) => { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = (2 + Math.random() * 5) * dpr; P.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, c: COL[i % COL.length], l: 1, r: (1.5 + Math.random() * 2.5) * dpr, f: false }); } };
    const confetti = (n) => { for (let i = 0; i < n; i++) P.push({ x: Math.random() * W, y: -20 * dpr - Math.random() * H * 0.3, vx: (Math.random() - 0.5) * 2 * dpr, vy: (2 + Math.random() * 3) * dpr, c: COL[i % COL.length], l: 1, r: (3 + Math.random() * 4) * dpr, f: true, a: Math.random() * 6 });
    };
    confetti(reduce ? 40 : 140);
    const shots = reduce ? 1 : 5;
    for (let k = 0; k < shots; k++) setTimeout(() => burst(W * (0.2 + Math.random() * 0.6), H * (0.15 + Math.random() * 0.35), 70), k * 450);
    const t0 = performance.now();
    (function tick(t) {
      ctx.clearRect(0, 0, W, H);
      for (const p of P) {
        p.vy += (p.f ? 0.05 : 0.09) * dpr; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; if (!p.f) p.l -= 0.012;
        ctx.globalAlpha = Math.max(0, p.l); ctx.fillStyle = p.c;
        if (p.f) { p.a += 0.15; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore(); }
        else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
      }
      if (t - t0 < ms) requestAnimationFrame(tick); else { ctx.clearRect(0, 0, W, H); cv.remove(); }
    })(t0);
    try { if (navigator.vibrate) navigator.vibrate([30, 60, 30, 60, 80]); } catch (e) {}
  }
  window.fireworks = fireworks;
  function celebrate(title, body, big, cta) {
    fireworks();
    sb.innerHTML = `<div class="grab"></div><div class="cel-sheet">${big}<h3 id="sheetTitle">${title}</h3><p class="sub" style="margin:0 0 12px">${body}</p></div><button class="cta" id="celGo">${cta}</button>`;
    show();
    document.getElementById('celGo').onclick = () => closeSheet();
  }
  function celebrateWelcome(name) {
    const st = F.st;
    celebrate(`به بلوک خوش آمدی${name ? '، ' + esc(name) : ''}!`, st && st.open ? `${fa(st.left)} جایگاه «عضو بنیان‌گذار» مانده؛ ۳ قدم ساده در صفحهٔ خانه.` : 'از امروز کار و نیروی ساختمانی را در بلوک پیدا کن.', '<div class="big">🎉</div>', 'شروع کنیم');
  }
  function celebrateFounder(n) {
    celebrate('تبریک! عضو بنیان‌گذار بلوک شدی', 'نشان بنیان‌گذار روی پروفایلت نشست و ۲ سال از کمیسیون بلوک معافی.', `<div class="big">🏅</div><div class="num-b num">#${fa(n)}</div>`, 'عالیه!');
  }
  function celebrateFounderOnce() {
    const m = me();
    if (!m || !m.number || ls.get('blk-fnd-cel:' + m.number)) return;
    ls.set('blk-fnd-cel:' + m.number, '1');
    if (!jsdom) setTimeout(() => celebrateFounder(m.number), 600);
  }
  // ثبت‌نام تازه (نه ورود دوباره) ← تبریک و ترقه
  wrapW('finishAuth', async function (prev, ...a) {
    const fresh = S.reg && !S.reg.addRole && S.reg.step === 'done';
    const name = S.reg && S.reg.d ? S.reg.d.fn || S.reg.d.cname || '' : '';
    const r = await prev(...a);
    if (fresh && S.auth) {
      ls.set('blk-inv', '');
      if (on()) await load(true);
      // در تست خودکار (jsdom) برگهٔ جشن خودکار باز نمی‌شود تا برگه‌های دیگر را نپوشاند
      if (!jsdom) setTimeout(() => celebrateWelcome(name), 500);
    }
    return r;
  });

  /* ---------- پیش‌نمایش برای مجید: ?preview=welcome | founder | founders ---------- */
  function demoState() {
    return { on: true, open: true, cap: 100, taken: 27, left: 73, igUrl: 'https://instagram.com/blooko.ir', perks: ['نشان «عضو بنیان‌گذار» با شمارهٔ اختصاصی روی پروفایل', '۲ سال معافیت از کمیسیون بلوک', 'اولویت در پشتیبانی و دیده شدن'],
      me: { steps: { follow: true, kyc: false, invite: false }, done: 1, invites: 0, kycStatus: 'none', number: null, inviteCode: 'B-7K31' } };
  }
  if (preview) {
    setTimeout(() => {
      if (preview === 'welcome') celebrateWelcome('حسین');
      else if (preview === 'founder') celebrateFounder(7);
      else if (preview === 'founders') { F.st = demoState(); if (S.cur === 'home') paint(); else go('home'); }
      // دور ۵۷: نشان روی شناسنامه و کارت خانهٔ بنیان‌گذار با یادآوری تکمیل پروفایل
      else if (preview === 'badge') { F.st = demoState(); Object.assign(F.st.me, { invites: 12, number: 7, done: 3, steps: { follow: true, kyc: true, invite: true }, commissionFreeUntil: new Date(Date.now() + 730 * 864e5).toISOString(), profile: { photo: false, bio: false, complete: false } }); go('home'); setTimeout(() => openTrust('me'), 1200); }
    }, 1500);
  }

  if (typeof I18N === 'object') {
    Object.assign(I18N.dict, {
      '۱۰۰ عضو بنیان‌گذار بلوک': '100 Blook founding members', '۳ قدم تا شمارهٔ اختصاصی و امتیازهای ویژه': '3 steps to your own number and special perks', 'جا مانده': 'spots left',
      '{#} از ۳ قدم': '{#} of 3 steps', '{#} از {#} جایگاه گرفته شده': '{#} of {#} spots taken', 'اول عضو بلوک شو': 'Join Blook first', 'ثبت‌نام با شمارهٔ موبایل؛ یک دقیقه': 'Sign up with your mobile; one minute',
      'ثبت‌نام': 'Sign up', 'فالو پیج اینستاگرام بلوک': 'Follow Blook on Instagram', 'blooko.ir در اینستاگرام': 'blooko.ir on Instagram', 'فالو کردم': 'I followed', 'فالو کردی': 'Followed',
      'احراز هویت': 'Identity check', 'کارت ملی و سلفی؛ چند دقیقه': 'National ID and selfie; a few minutes', 'در حال بررسی؛ نتیجه را خبر می‌دهیم': 'In review; we will let you know', 'انجام شد': 'Done',
      'دعوت یک دوست': 'Invite a friend', 'اشتراک لینک': 'Share link', 'وقتی دوستت با لینک تو ثبت‌نام کند تیک می‌خورد': 'Checked when your friend signs up with your link', '{#} نفر عضو شدند': '{#} joined',
      'بدون کمیسیون بلوک': 'No Blook commission', 'قدم ۱ ثبت شد': 'Step 1 saved', 'بعد از ثبت‌نام، این قدم را دوباره بزن تا ثبت شود': 'After signing up, tap this step again to save it',
      'لینک دعوت بعد از تکمیل ثبت‌نام ساخته می‌شود': 'Your invite link is made after you finish signing up', 'لینک دعوت کپی شد؛ برای دوستت بفرست': 'Invite link copied; send it to your friend',
      'تبریک! عضو بنیان‌گذار بلوک شدی': 'Congrats! You are a Blook founding member', 'نشان بنیان‌گذار روی پروفایلت نشست و ۲ سال از کمیسیون بلوک معافی.': 'The founder badge is on your profile and you pay no Blook commission for 2 years.',
      'عالیه!': 'Awesome!', 'شروع کنیم': "Let's start", 'از امروز کار و نیروی ساختمانی را در بلوک پیدا کن.': 'From today, find construction work and workers on Blook.',
      'نشان «عضو بنیان‌گذار» با شمارهٔ اختصاصی روی پروفایل': '“Founding member” badge with your own number on your profile', '۲ سال معافیت از کمیسیون بلوک': '2 years without Blook commission', 'اولویت در پشتیبانی و دیده شدن': 'Priority in support and visibility',
      'عضو بنیان‌گذار': 'Founding member', 'سفیر بلوک': 'Blook ambassador', 'پروفایلت را کامل کن': 'Complete your profile', 'گذاشتن عکس پروفایل': 'Add a profile photo', 'نوشتن معرفی کوتاه': 'Write a short bio',
      'بنیان‌گذار با عکس و معرفی کامل بیشتر دیده می‌شود و اعتماد بیشتری می‌گیرد.': 'A founder with a photo and full bio is seen more and trusted more.', 'بنیان‌گذار #{#}': 'Founder #{#}', 'عضو بنیان‌گذار #{#}': 'Founding member #{#}',
    });
    I18N.re = null;
  }
})();
