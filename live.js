/* =================== بلوک · اتصال به API بک‌اند (نسخهٔ واقعی) ===================
 * این فایل بعد از اسکریپت اصلی index.html بار می‌شود و تابع‌های نمایشی را به API وصل می‌کند.
 * اگر آدرس API تنظیم نشده یا سرور در دسترس نیست، اپ همان نسخهٔ نمایشی می‌ماند.
 *
 * آدرس API:
 *   index.html?api=http://localhost:3000   ← یک بار؛ در مرورگر ذخیره می‌شود
 *   index.html?api=off                     ← برگشت به نسخهٔ نمایشی
 *   روی localhost یا باز کردن فایل از روی کامپیوتر، پیش‌فرض http://localhost:3000 است.
 *
 * وصل‌شده در این نسخه: ورود با کد پیامکی، ثبت‌نام نقش، افزودن/تعویض نقش، خروج و حذف حساب،
 * پروفایل من، کاوش آگهی‌ها، پروفایل دیگران، ثبت آگهی، پاسخ به آگهی، گفت‌وگو (متن، موقعیت،
 * شماره، عکس/PDF، پیشنهاد توافق و روز شروع، تأیید/رد)، رویداد لحظه‌ای، اعلان‌ها، تأیید هویت.
 * هنوز نمایشی: پروژه‌ها و قرارداد و پرداخت، تقویم، درخواست‌ها، ذخیره‌ها، خانهٔ هر نقش.
 */
(function () {
  'use strict';

  /* ---------- تنظیمات ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} },
  };
  const qs = new URLSearchParams(location.search);
  let fromUrl = null;
  if (qs.has('api')) {
    const v = (qs.get('api') || '').trim();
    fromUrl = v === 'off' ? 'off' : v.replace(/\/+$/, '');
    store.set('blk-api', fromUrl);
  }
  // اگر مرورگر اجازهٔ ذخیره ندهد (حالت خصوصی)، همان آدرسِ داخل لینک
  const saved = fromUrl || store.get('blk-api');
  const local = ['localhost', '127.0.0.1'].includes(location.hostname) || location.protocol === 'file:';
  // روی دامنهٔ اصلی (blooko.ir) خودکار به سرور واقعی وصل می‌شود
  const prod = /(^|\.)blooko\.ir$/.test(location.hostname) ? 'https://api.blooko.ir' : null;
  const L = (window.LIVE = {
    base: saved === 'off' ? null : saved || (local ? 'http://localhost:3000' : prod),
    on: false,
    tok: null,
    me: null, // پاسخ /me
    pub: null, // پروفایل عمومی نقش فعال خودم
    loaded: {},
    es: null,
    kyc: {},
  });

  /* ---------- ابزار ---------- */
  const toEn = (s) => String(s == null ? '' : s).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const abs = (u) => (!u ? null : /^https?:|^blob:/.test(u) ? u : L.base + u);
  const ini = (name) => {
    const nm = String(name || '').replace(/^(مهندس|استاد|شرکت)\s+/, '').split(' ').filter(Boolean);
    return nm.length > 1 ? nm[0][0] + '.' + nm[1][0] : (nm[0] || 'ب')[0];
  };
  const hm = (d) => { const x = new Date(d); return fa(String(x.getHours()).padStart(2, '0') + ':' + String(x.getMinutes()).padStart(2, '0')); };
  const faDate = (d, opt) => new Intl.DateTimeFormat('fa-IR-u-ca-persian', opt || { day: 'numeric', month: 'long' }).format(new Date(d));
  function rel(d) {
    const s = (Date.now() - new Date(d).getTime()) / 1000;
    if (s < 60) return 'همین حالا';
    if (s < 3600) return fa(Math.floor(s / 60)) + ' دقیقه پیش';
    if (s < 86400) return fa(Math.floor(s / 3600)) + ' ساعت پیش';
    if (s < 172800) return 'دیروز';
    if (s < 604800) return fa(Math.floor(s / 86400)) + ' روز پیش';
    return faDate(d);
  }
  function dayLabel(d) {
    const x = new Date(d), t = new Date();
    const same = (a, b) => a.toDateString() === b.toDateString();
    if (same(x, t)) return 'امروز';
    if (same(x, new Date(t.getTime() - 86400000))) return 'دیروز';
    return faDate(x, { weekday: 'long', day: 'numeric', month: 'long' });
  }
  const group = (d) => { const s = (Date.now() - new Date(d).getTime()) / 86400000; return dayLabel(d) === 'امروز' ? 'امروز' : dayLabel(d) === 'دیروز' ? 'دیروز' : s < 7 ? 'این هفته' : 'قدیمی‌تر'; };
  const faPhone = (p) => (p ? fa(String(p).replace(/^(\d{4})(\d{3})(\d{4})$/, '$1 $2 $3')) : null);
  const fsize = (n) => (!n ? '' : n > 1048576 ? fa((n / 1048576).toFixed(1)).replace('.', '٫') + ' مگابایت' : fa(Math.max(1, Math.round(n / 1024))) + ' کیلوبایت');
  const money = (n) => faNum(n) + ' تومان';
  const err = (e) => toast((e && e.message) || 'خطا؛ دوباره تلاش کن');
  const RANGE_B = { city: 'شهر', km50: '۳۰', province: 'استان', country: 'کشور' };
  const RANGE_F = { 'شهر': 'city', '۳۰': 'km50', 'استان': 'province', 'کشور': 'country' };
  const isUuid = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s || ''));

  /* ---------- درخواست به API ---------- */
  function setTok(a, r) { L.tok = a ? { a, r } : null; store.set('blk-tok', a ? JSON.stringify(L.tok) : null); }
  let refreshing = null;
  function refresh() {
    if (!L.tok || !L.tok.r) return Promise.resolve(false);
    return (refreshing = refreshing || fetch(L.base + '/api/auth/refresh', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: L.tok.r }),
    }).then((r) => (r.ok ? r.json() : null)).then((d) => { refreshing = null; if (!d) return false; setTok(d.accessToken, d.refreshToken); return true; })
      .catch(() => { refreshing = null; return false; }));
  }
  /* ---------- کوچک کردن عکس پیش از ارسال: همان کیفیت دیدنی، حجم خیلی کمتر، ارسال و دانلود سریع‌تر ---------- */
  const MAXPX = 1600, JPEGQ = 0.82;
  async function shrinkImage(file) {
    if (!(file instanceof Blob) || !/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 350 * 1024 || file._shrunk) return file;
    try {
      const bmp = await (window.createImageBitmap ? createImageBitmap(file) : new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); }));
      const w0 = bmp.width, h0 = bmp.height, k = Math.min(1, MAXPX / Math.max(w0, h0));
      const cv = document.createElement('canvas');
      cv.width = Math.round(w0 * k); cv.height = Math.round(h0 * k);
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); // پس‌زمینهٔ سفید برای PNG شفاف
      ctx.drawImage(bmp, 0, 0, cv.width, cv.height);
      const out = await new Promise((res) => cv.toBlob(res, 'image/jpeg', JPEGQ));
      if (!out || out.size >= file.size) return file;
      const f = new File([out], (file.name || 'photo').replace(/\.[a-z0-9]+$/i, '') + '.jpg', { type: 'image/jpeg' });
      f._shrunk = true;
      return f;
    } catch (e) { return file; }
  }
  async function shrinkForm(fd) {
    const out = new FormData();
    for (const [k, v] of fd.entries()) {
      if (v instanceof Blob && typeof v !== 'string') { const f = await shrinkImage(v); out.append(k, f, f.name || v.name || 'file'); }
      else out.append(k, v);
    }
    return out;
  }
  L.shrinkImage = shrinkImage;
  async function api(method, path, body, retried) {
    const h = {};
    let b;
    if (body instanceof FormData) b = retried ? body : await shrinkForm(body);
    else if (body !== undefined) { h['Content-Type'] = 'application/json'; b = JSON.stringify(body); }
    if (L.tok && L.tok.a) h.Authorization = 'Bearer ' + L.tok.a;
    let res;
    busy(1);
    try { res = await fetch(L.base + '/api' + path, { method, headers: h, body: b }); }
    catch (e) { throw { code: 'NETWORK', message: 'اتصال به سرور بلوک برقرار نشد؛ اینترنت را بررسی کن' }; }
    finally { busy(-1); }
    if (res.status === 401 && !retried && L.tok) {
      if (await refresh()) return api(method, path, body instanceof FormData ? b : body, true);
      endSession(true);
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign({ status: res.status }, data.error || { code: 'HTTP_' + res.status, message: 'خطای سرور؛ دوباره تلاش کن' });
    return data;
  }
  L.api = api;
  // نوار بارگذاری: کاربر می‌بیند که لمسش ثبت شد و منتظر سرور است
  let busyN = 0, busyT = null;
  function busy(d) {
    busyN = Math.max(0, busyN + d);
    let bar = document.getElementById('blkBusy');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'blkBusy';
      bar.setAttribute('aria-hidden', 'true');
      bar.style.cssText = 'position:fixed;top:0;right:0;left:0;height:3px;z-index:9998;pointer-events:none;opacity:0;transition:opacity .2s;background:linear-gradient(90deg,transparent,var(--accent,#0F9C88),transparent);background-size:50% 100%;background-repeat:no-repeat;animation:blkBusy 1s linear infinite';
      const st = document.createElement('style');
      st.textContent = '@keyframes blkBusy{from{background-position:-50% 0}to{background-position:150% 0}}';
      document.head.appendChild(st);
      document.body.appendChild(bar);
    }
    clearTimeout(busyT);
    if (busyN) busyT = setTimeout(() => (bar.style.opacity = '1'), 150);
    else bar.style.opacity = '0';
  }

  /* ---------- افراد و آگهی‌ها ---------- */
  function trustIdentity(o, trust) {
    const c = Math.round((o.rating || 0) / 5 * 55), pr = Math.min(25, o.done || 0), r = Math.min(10, Math.round((o.revN || 0) / 2));
    return trust - (c + pr + r) >= 10;
  }
  /** نویسندهٔ آگهی / طرف گفت‌وگو ← P[code]؛ خودم ← 'me' */
  function upsertPerson(a, city) {
    if (!a) return null;
    if (L.pub && a.code === L.pub.code) return 'me';
    const o = P[a.code] || (P[a.code] = { _live: true, age: '—', born: '—', exp: '—', since: '', resp: '', bio: '', skills: [], pf: [], revs: [], stars: [0, 0, 0, 0, 0], guar: [], week: ['o', 'o', 'o', 'o', 'o', 'o', 'o'], phone: null, place: city || '', rating: 0, done: 0, revN: 0, verified: false });
    o.role = a.role; o.name = a.name; o.ini = ini(a.name); o.code = a.code;
    if (a.title !== undefined) o.title = a.title || ROLES[a.role].n;
    if (!o.title) o.title = ROLES[a.role].n;
    if (a.rating != null) o.rating = a.rating;
    if (a.doneCount != null) o.done = a.doneCount;
    if (a.reviewsCount != null) o.revN = a.reviewsCount;
    if (a.week) o.week = a.week;
    if (city && !o.place) o.place = city;
    if (a.trust != null) o.verified = trustIdentity(o, a.trust);
    else if (a.verified != null && o._full !== true && o.verified == null) o.verified = a.verified;
    if (a.avatarUrl) o.avatar = abs(a.avatarUrl);
    return a.code;
  }
  function myAuthor() {
    const p = L.pub || {};
    return { code: p.code, role: p.role, name: p.name, title: p.title, rating: p.rating, doneCount: p.doneCount, reviewsCount: p.reviewsCount, week: p.week, trust: p.trust && p.trust.total };
  }
  function mapAd(x) {
    const who = upsertPerson(x.author, x.city);
    if (x.city && !CITY_PROV[x.city]) CITY_PROV[x.city] = x.province;
    return {
      id: x.id, type: x.type, who, title: x.title, place: x.city, prov: x.province,
      wageType: x.wageType || '',
      wage: x.wageAmount ? money(x.wageAmount) : x.type === 'consult' ? '' : x.wageType === 'توافقی' ? 'پس از گفت‌وگو' : 'توافقی',
      start: x.startWhen || 'با هماهنگی', range: RANGE_B[x.range] || 'شهر', aud: x.audience || [], need: x.needCount || undefined,
      resp: x.responsesCount || 0, posted: rel(x.createdAt), skills: x.skills || [], desc: x.description || '', status: x.status, _live: true,
    };
  }
  async function loadAds(type, force) {
    const k = 'ads:' + type;
    if (!force && L.loaded[k] && Date.now() - L.loaded[k] < 15000) return;
    L.loaded[k] = Date.now();
    const d = await api('GET', '/ads?type=' + type + '&limit=50');
    for (let i = ADS.length - 1; i >= 0; i--) if (ADS[i].type === type && ADS[i]._live) ADS.splice(i, 1);
    d.items.forEach((x) => ADS.push(mapAd(x)));
  }
  const skillRow = (s) => [s.title, s.experience || '—', EXP_Y[s.experience] || 0, s.rateType || 'توافقی', s.rateAmount ? money(s.rateAmount) : 'توافقی'];
  const revRow = (r) => [r.fromName, r.rating, r.text || '', rel(r.createdAt)];
  const monthYear = (d) => (d ? faDate(d, { month: 'long', year: 'numeric' }) : '');
  /** پروفایل کامل (GET /profiles/:code) ← P[code] */
  function fillPerson(pp) {
    const id = upsertPerson({ code: pp.code, role: pp.role, name: pp.name, title: pp.title, rating: pp.rating, doneCount: pp.doneCount, reviewsCount: pp.reviewsCount, week: pp.week, avatarUrl: pp.avatarUrl }, pp.city);
    if (id === 'me') return 'me';
    Object.assign(P[id], {
      _full: true, _pid: pp.id, bio: pp.bio || '', place: pp.city, born: pp.city, since: monthYear(pp.since), phone: faPhone(pp.phone),
      verified: !!pp.identityVerified, docVerified: !!pp.verified, stars: pp.stars, exp: (pp.data && pp.data.exp) || '—', age: (L.ageOf && pp.data && L.ageOf(pp.data.by)) || '—',
      skills: pp.skills.map(skillRow), revs: pp.reviews.map(revRow), guar: pp.guarantors.map((g) => [g.name, g.relation, 'general']),
      pf: (pp.portfolio || []).map((x) => [x.title, x.place || '', abs(x.url)]),
    });
    if (pp.role === 'general') P[id].needs = P[id].needs || [];
    return id;
  }

  /* ---------- حساب من ---------- */
  function applyMe(d, pub) {
    L.me = d;
    S.roles = d.profiles.map((p) => p.role);
    if (d.needsRegistration) { L.pub = null; return d; }
    const role = d.user.activeRole && S.roles.includes(d.user.activeRole) ? d.user.activeRole : d.profiles[0].role;
    S.role = role;
    const pr = d.profiles.find((p) => p.role === role);
    S.profile = { d: Object.assign({}, pr.data), name: pr.displayName };
    profileSync();
    S.me.pub = pr.isPublic; S.me.phone = pr.showPhone;
    L.pub = pub || null;
    S.me.pf = !!(L.pub && (L.pub.portfolio || []).length);
    return d;
  }
  async function loadMe() {
    const d = await api('GET', '/me');
    L.me = d;
    let pub = null;
    if (!d.needsRegistration) { try { pub = (await api('GET', '/me/profile')).profile; } catch (e) { pub = null; } }
    return applyMe(d, pub);
  }

  /* ---------- نسخهٔ ذخیره‌شده روی گوشی: باز شدن فوری اپ با آخرین اطلاعات خودت ---------- */
  const SNAP = 'blk-snap-v1';
  function saveSnap() {
    if (!L.on || !S.auth || !L.me || !L.me.user || L.me.needsRegistration) return;
    try {
      const clean = (m) => { const x = Object.assign({}, m); delete x._blob; delete x._pending; if (typeof x.src === 'string' && x.src.startsWith('blob:')) delete x.src; return x; };
      const convs = (S.convs || []).filter((c) => c._live).slice(0, 40).map((c) => Object.assign({}, c, {
        msgs: (c._loaded ? c.msgs.slice(-40) : c.msgs.slice(-1)).filter((m) => !m._pending).map(clean), _loaded: false, _cached: !!c._loaded,
      }));
      const ads = ADS.filter((a) => a._live).slice(0, 80);
      const people = {};
      convs.forEach((c) => { if (c.pid && c.pid !== 'me' && P[c.pid]) people[c.pid] = P[c.pid]; });
      ads.forEach((a) => { if (a.who && a.who !== 'me' && P[a.who]) people[a.who] = P[a.who]; });
      const js = JSON.stringify({ v: 1, uid: L.me.user.id, at: Date.now(), me: L.me, pub: L.pub, convs, notifs: (S.notifs || []).slice(0, 60), people, ads, mode: S.mode });
      if (js.length < 2.5e6) store.set(SNAP, js);
    } catch (e) {}
  }
  setInterval(() => { if (!document.hidden) saveSnap(); }, 5000);
  addEventListener('pagehide', saveSnap);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveSnap(); });
  function applySnap(snap) {
    Object.assign(P, snap.people || {});
    applyMe(snap.me, snap.pub);
    (snap.ads || []).forEach((a) => ADS.push(a));
    S.convs = snap.convs || [];
    S.notifs = snap.notifs || [];
    S.auth = true;
    S.mode = snap.mode || ({ worker: 'jobs', specialist: 'jobs', engineer: 'consult' })[S.role] || 'workers';
    S.roleF = 'all';
    if (typeof userProv === 'function') S.provF = userProv();
    S.hist = [];
    L._fromSnap = true;
    render();
    if (typeof updNavBadge === 'function') updNavBadge();
  }
  L.saveSnap = saveSnap;
  function enterApp(silent) {
    S.auth = true;
    S.mode = ({ worker: 'jobs', specialist: 'jobs', engineer: 'consult' })[S.role] || 'workers';
    S.roleF = 'all';
    if (typeof userProv === 'function') S.provF = userProv();
    S.hist = [];
    connectSSE();
    loadConvs().catch(() => {});
    loadNotifs().catch(() => {});
    const f = S.pending; S.pending = null;
    if (!silent) { go('home'); toast('خوش آمدی به بلوک'); }
    else render();
    if (f) setTimeout(f, 450);
  }
  function endSession(expired) {
    setTok(null);
    store.set(SNAP, null);
    try { L.es && L.es.close(); } catch (e) {}
    L.es = null; L.me = null; L.pub = null;
    S.convs = []; S.notifs = []; S.profile = null; S.roles = [];
    L.loaded = {};
    (L.onEnd || []).forEach((f) => { try { f(); } catch (e) { console.warn(e); } });
    if (expired && S.auth) { S.auth = false; S.hist = []; go('home'); toast('نشست تمام شد؛ دوباره وارد شو'); }
    S.auth = false;
  }

  /* ---------- گفت‌وگو ---------- */
  const dst = (s) => (s === 'accepted' ? 'ok' : s === 'rejected' || s === 'cancelled' ? 'no' : null);
  function mapMsg(m, readAt) {
    const b = { id: m.id, me: m.mine ? 1 : 0, time: hm(m.createdAt), _at: m.createdAt };
    if (m.mine) b.st = readAt && new Date(readAt) >= new Date(m.createdAt) ? 'read' : 'sent';
    if (m.flagged) b.flag = true;
    const p = m.payload || {};
    switch (m.kind) {
      case 'sys': return { k: 'sys', t: m.body, id: m.id, _at: m.createdAt };
      case 'loc': return Object.assign(b, { k: 'loc', place: p.place, label: p.label || '' });
      case 'phone': return Object.assign(b, { k: 'phone', num: faPhone(m.body) });
      case 'photo': return Object.assign(b, { k: 'photo', src: abs(p.url), cap: m.body || '' });
      case 'file': return Object.assign(b, { k: 'file', name: p.name || 'فایل', size: fsize(p.size), url: abs(p.url) });
      case 'deal': return Object.assign(b, { k: 'deal', d: { job: p.job, qty: p.qty || '—', price: p.price, start: p.start, dur: fa(p.durationDays || 1) + ' روز', plan: (p.plan || []).map((x) => [x.title, x.pct]) }, st: dst(m.status), projectId: m.projectId });
      case 'day': return Object.assign(b, { k: 'day', t: /[۰-۹]/.test(p.date || '') ? p.date : (p.date || '') + ' ' + fa(new Date(m.createdAt).getDate()), h: p.hour, st: dst(m.status) });
      case 'del': return Object.assign(b, { k: 'del' });
      case 'voice': return Object.assign(b, { k: 'voice', dur: p.dur || 1, src: abs(p.url) });
      // پیام «پشتیبانی بلوک» (مدیر از پنل)
      default: return Object.assign(b, { k: 'text', t: (m.admin ? '🛡 پشتیبانی بلوک: ' : '') + (m.body || '') });
    }
  }
  function buildMsgs(items, readAt) {
    const out = []; let last = '';
    items.forEach((m) => { const dl = dayLabel(m.createdAt); if (dl !== last) { out.push({ k: 'date', t: dl }); last = dl; } out.push(mapMsg(m, readAt)); });
    return out;
  }
  function mapConv(x) {
    const pid = x.other ? upsertPerson(x.other) : null;
    let c = S.convs.find((y) => y.id === x.id);
    if (!c) c = { id: x.id, replies: [], msgs: [], _live: true, online: false };
    const label = x.projectId || x.kind === 'project' ? 'پروژه' : x.kind === 'ad' ? 'آگهی' : null;
    Object.assign(c, {
      pid, type: x.kind === 'support' ? 'support' : x.projectId ? 'project' : 'ad', unread: x.unread, pinned: x.pinned, muted: x.muted, arch: x.archived,
      stage: x.stage, ad: x.adId || null, projectId: x.projectId, ctx: x.title && label ? { label, title: x.title, meta: '' } : null, _at: x.lastMessageAt,
    });
    // پیام‌های ذخیره‌شده روی گوشی می‌مانند مگر پیام تازه‌تری آمده باشد (باز کردن گفت‌وگو همه را تازه می‌کند)
    const cachedLast = c._cached && [...c.msgs].reverse().find((m) => m._at);
    const stale = !cachedLast || (x.last && new Date(x.last.at) > new Date(cachedLast._at));
    if (!c._loaded && stale) { c._cached = false; c.msgs = x.last ? [{ me: x.last.mine ? 1 : 0, k: 'text', t: x.last.text, time: hm(x.last.at) }] : []; }
    if (!c.pid) c.name = 'پشتیبانی بلوک';
    return c;
  }
  async function loadConvs() {
    const [a, b] = await Promise.all([api('GET', '/conversations?filter=all'), api('GET', '/conversations?filter=archived')]);
    S.convs = [...a.items, ...b.items].map(mapConv);
    if (typeof updNavBadge === 'function') updNavBadge();
    if (S.cur === 'msg') renderMsgs();
  }
  async function loadMsgs(c) {
    const d = await api('GET', '/conversations/' + c.id + '/messages?limit=100');
    if (d.other) upsertPerson(d.other);
    c._readAt = d.conversation.otherLastReadAt;
    c.msgs = buildMsgs(d.items, c._readAt);
    c.stage = d.conversation.stage; c.projectId = d.conversation.projectId;
    c._loaded = true; c.unread = 0;
  }
  L.openConv = async function (id) {
    if (!S.convs.find((c) => c.id === id)) await loadConvs().catch(() => {});
    if (S.convs.find((c) => c.id === id)) openChat(id); else toast('گفت‌وگو پیدا نشد');
  };
  function pushIncoming(c, mm) {
    if (!c._loaded) { c.msgs = [mm]; return false; }
    const lastDate = [...c.msgs].reverse().find((x) => x.k === 'date');
    if (!lastDate || lastDate.t !== 'امروز') c.msgs.push({ k: 'date', t: 'امروز' });
    c.msgs.push(mm);
    if (S.cur === 'chat' && S.cid === c.id && $('msgs')) {
      const i = c.msgs.length - 1;
      $('msgs').insertAdjacentHTML('beforeend', msgHTML(mm, i, c));
      scrollEnd();
      return true;
    }
    return false;
  }
  let readT = null;
  const markRead = (c) => { clearTimeout(readT); readT = setTimeout(() => api('GET', '/conversations/' + c.id + '/messages?limit=1').catch(() => {}), 600); };

  async function onMessage(ev) {
    let c = S.convs.find((x) => x.id === ev.conversationId);
    if (!c) { await loadConvs().catch(() => {}); c = S.convs.find((x) => x.id === ev.conversationId); if (!c) return; }
    const m = ev.message;
    if (c._loaded && c.msgs.some((x) => x.id === m.id)) return;
    // پیام خودم که پاسخ POST هنوز نرسیده
    if (m.mine) {
      const pend = c.msgs.find((x) => x.me && !x.id && x._pending);
      if (pend) { pend.id = m.id; pend._pending = false; return; }
    }
    c._at = m.createdAt;
    // پیام سیستمی = احتمالاً وضعیت پیشنهادها یا مرحله عوض شده؛ گفت‌وگو را تازه کن
    if (m.kind === 'sys' && c._loaded) {
      await loadMsgs(c).catch(() => {});
      if (S.cur === 'chat' && S.cid === c.id) renderChat();
      loadConvs().catch(() => {});
      return;
    }
    const open = pushIncoming(c, mapMsg(m, c._readAt));
    if (!m.mine) {
      if (open) markRead(c);
      else {
        c.unread = (c.unread || 0) + 1;
        if (!c.muted && S.nprefs.msg !== false) notify({ t: 'پیام از ' + convName(c), s: m.kind === 'text' ? m.body : 'پیوست تازه', ty: 'msg', go: `LIVE.openConv('${c.id}')` });
      }
    }
    updNavBadge();
    if (S.cur === 'msg') renderMsgs();
  }
  function onRead(ev) {
    const c = S.convs.find((x) => x.id === ev.conversationId);
    if (!c || !c._loaded) return;
    c._readAt = ev.at;
    c.msgs.forEach((m, i) => { if (m.me && m._at && new Date(m._at) <= new Date(ev.at) && m.st !== 'read') { m.st = 'read'; if (S.cur === 'chat' && S.cid === c.id) rerenderMsg(i); } });
  }
  function onConversation(ev) {
    const c = S.convs.find((x) => x.id === ev.conversationId);
    if (!c || !c._loaded || !ev.deletedMessageId) return;
    const i = c.msgs.findIndex((x) => x.id === ev.deletedMessageId);
    if (i > -1) { c.msgs[i] = Object.assign({}, c.msgs[i], { k: 'del', t: '', flag: false }); if (S.cur === 'chat' && S.cid === c.id) rerenderMsg(i); }
  }

  /* ---------- اعلان‌ها ---------- */
  const NTY = { req: 'req', msg: 'msg', ad: 'ad', star: 'star', id: 'id', cal: 'cal' };
  function goFor(link) {
    if (!link) return "go('notif')";
    if (link.screen === 'chat' && link.id) return `LIVE.openConv('${link.id}')`;
    if (['pdet', 'ctr', 'sov', 'proj'].includes(link.screen)) return "go('proj')";
    if (link.screen === 'trust') return "openTrust('me')";
    if (link.screen === 'kyc') return 'openKYC()';
    if (link.screen === 'docs') return "go('docs')";
    return "go('notif')";
  }
  const mapNotif = (n) => ({ id: n.id, g: group(n.createdAt), ty: NTY[n.type] || 'req', t: n.title, s: n.body || '', time: rel(n.createdAt), go: goFor(n.link), read: !!n.readAt });
  async function loadNotifs() {
    const d = await api('GET', '/notifications?limit=50');
    S.notifs = d.items.map(mapNotif);
    if (typeof bellUpd === 'function') bellUpd();
  }
  function onNotification(n) {
    if (S.nprefs[NTY[n.type]] === false) { S.notifs.unshift(mapNotif(n)); bellUpd(); return; }
    notify({ t: n.title, s: n.body || '', ty: NTY[n.type] || 'req', go: goFor(n.link) });
    if (S.notifs[0]) S.notifs[0].id = n.id;
  }

  /* ---------- رویداد لحظه‌ای (SSE) ---------- */
  function connectSSE() {
    if (!L.on || !L.tok || typeof EventSource === 'undefined') return;
    try { L.es && L.es.close(); } catch (e) {}
    const es = new EventSource(L.base + '/api/events?token=' + encodeURIComponent(L.tok.a));
    L.es = es;
    const on = (name, fn) => es.addEventListener(name, (e) => { try { fn(JSON.parse(e.data)); } catch (x) { console.warn(x); } });
    on('message', onMessage);
    on('read', onRead);
    on('conversation', onConversation);
    on('notification', onNotification);
    es.onerror = () => {
      if (L.es !== es) return;
      es.close(); L.es = null;
      // توکن کوتاه‌عمر است؛ بعد از تمدید دوباره وصل شو
      setTimeout(() => { if (S.auth && L.on) refresh().then((ok) => { if (ok) connectSSE(); }); }, 5000);
    };
  }

  /* =================== بازنویسی تابع‌های نمایشی =================== */
  const wrap = (name, fn) => { const prev = window[name]; if (typeof prev !== 'function') return; window[name] = function () { return fn.call(this, prev, ...arguments); }; };

  /* ---- ورود با کد پیامکی ---- */
  wrap('quickLogin', function (prev, r) { if (!L.on) return prev(r); startAuth(); });
  wrap('sendOtp', async function (prev) {
    if (!L.on) return prev();
    const r = S.reg, b = $('phBtn');
    if (b) b.disabled = true;
    try {
      const d = await api('POST', '/auth/otp/send', { phone: '09' + toEn(r.phone) });
      r.devCode = d.devCode || null; r.t = Date.now(); r.wait = d.resendIn || 60; r.step = 'otp';
      renderAuth(); toast('کد تأیید فرستاده شد');
    } catch (e) { err(e); if (b) b.disabled = false; }
  });
  wrap('renderAuth', function (prev) {
    prev();
    if (!L.on || !S.reg || S.reg.step !== 'otp') return;
    const h = document.querySelector('#s-auth .hint.center');
    if (h) h.innerHTML = S.reg.devCode ? `حالت آزمایشی سرور: کد <b dir="ltr">${fa(S.reg.devCode)}</b>` : 'کد را از پیامک وارد کن.';
  });
  wrap('otpTimer', function (prev) {
    if (!L.on) return prev();
    clearInterval(S.otpI);
    const wait = S.reg.wait || 60;
    const upd = () => {
      const el = $('otpT'); if (!el) { clearInterval(S.otpI); return; }
      const s = Math.max(0, wait - Math.floor((Date.now() - S.reg.t) / 1000));
      el.innerHTML = s ? `ارسال دوباره تا <b class="num">${fa(Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'))}</b>` : '<button class="lnk2" onclick="sendOtp()">ارسال دوبارهٔ کد</button>';
    };
    upd(); S.otpI = setInterval(upd, 1000);
  });
  wrap('otpIn', function (prev, inp, i) {
    if (!L.on) return prev(inp, i);
    inp.value = inp.value.replace(/[^0-9۰-۹]/g, '').slice(-1);
    if (inp.value && inp.nextElementSibling) inp.nextElementSibling.focus();
    const v = toEn([...document.querySelectorAll('#otp input')].map((x) => x.value).join(''));
    if (v.length !== 5 || S.reg._busy) return;
    S.reg._busy = 1;
    const box = $('otp');
    api('POST', '/auth/otp/verify', { phone: '09' + toEn(S.reg.phone), code: v })
      .then(async (d) => {
        setTok(d.accessToken, d.refreshToken);
        box.classList.add('good'); clearInterval(S.otpI);
        await loadMe();
        if (d.needsRegistration || L.me.needsRegistration) { setTimeout(() => { S.reg.step = 'role'; renderAuth(); }, 650); return; }
        enterApp();
      })
      .catch((e) => {
        box.classList.remove('bad'); void box.offsetWidth; box.classList.add('bad'); err(e);
        setTimeout(() => { document.querySelectorAll('#otp input').forEach((x) => (x.value = '')); const f = document.querySelector('#otp input'); f && f.focus(); }, 450);
      })
      .finally(() => { S.reg._busy = 0; });
  });

  /* ---- ثبت‌نام نقش (اولین نقش یا نقش تازه) ---- */
  wrap('regNext', async function (prev) {
    if (!L.on) return prev();
    if (!stepOK()) return;
    const r = S.reg;
    if (r.i < REG[r.role].length - 1) return prev();
    const d = {};
    Object.keys(r.d).forEach((k) => { if (!k.startsWith('_')) d[k] = r.d[k]; });
    const b = $('regNext');
    if (b) { b.disabled = true; b.textContent = 'در حال ساخت پروفایل…'; }
    try {
      await api('POST', '/me/roles', { role: r.role, data: d });
      if (r.addRole) await api('POST', '/me/active-role', { role: r.role }).catch(() => {});
      r.step = 'done'; renderAuth();
    } catch (e) {
      const f = e.details && e.details.fields;
      if (f) {
        const [k, msg] = Object.entries(f)[0];
        toast(msg);
        const si = REG[r.role].findIndex((st) => st.f.some((x) => x.k === k));
        if (si > -1 && si !== r.i) { r.i = si; renderRegStep(); return; }
      } else err(e);
      if (b) { b.disabled = false; b.textContent = 'ساخت پروفایل'; }
    }
  });
  wrap('finishAuth', async function (prev) {
    if (!L.on) return prev();
    const add = S.reg && S.reg.addRole, k = S.reg && S.reg.role;
    try { await loadMe(); } catch (e) { err(e); return; }
    if (add) { S.hist = []; connectSSE(); go('roles'); toast('نقش ' + ROLE_INFO[k][0] + ' اضافه شد'); return; }
    enterApp();
  });

  /* ---- نقش‌ها ---- */
  async function activate(k) {
    try { await api('POST', '/me/active-role', { role: k }); await loadMe(); S.mode = ({ worker: 'jobs', specialist: 'jobs', engineer: 'consult' })[k] || 'workers'; S.roleF = 'all'; return true; }
    catch (e) { err(e); return false; }
    finally { L.loaded = {}; } // دادهٔ نقش قبلی (پروژه‌ها، مدارک، ...) دوباره گرفته شود
  }
  wrap('setRole', function (prev, k) {
    if (!L.on || !S.auth) return prev(k);
    if (!(S.roles || []).includes(k)) { closeSheet(); addRole(k); return; }
    activate(k).then((ok) => { if (ok) { closeSheet(); render(); toast('نقش: ' + ROLES[k].n); } });
  });
  wrap('switchRole', function (prev, k) {
    if (!L.on || !S.auth) return prev(k);
    activate(k).then((ok) => { if (ok) { renderRoles(); toast('نقش فعال: ' + ROLE_INFO[k][0]); } });
  });

  /* ---- خروج و حذف حساب ---- */
  wrap('logout', function (prev) {
    if (L.on && L.tok) { const r = L.tok.r; api('POST', '/auth/logout', { refreshToken: r }).catch(() => {}); endSession(false); }
    prev();
  });
  wrap('delAcc', function (prev) {
    prev();
    if (!L.on) return;
    const b = $('delB'); if (!b) return;
    b.removeAttribute('onclick');
    b.onclick = async () => {
      b.disabled = true;
      try { await api('DELETE', '/me', { confirm: 'DELETE' }); closeSheet(); endSession(false); S.hist = []; go('home'); toast('حساب حذف شد'); }
      catch (e) { err(e); b.disabled = false; }
    };
  });

  /* ---- پروفایل من ---- */
  wrap('ME', function (prev) {
    const m = prev();
    if (!L.on || !S.auth || !L.pub) return m;
    const p = L.pub;
    Object.assign(m, {
      code: p.code, name: p.name, ini: ini(p.name), title: p.title || m.title, place: p.city, born: p.city,
      rating: p.rating, done: p.doneCount, revN: p.reviewsCount, verified: !!p.identityVerified, docVerified: !!p.verified,
      phone: p.phone ? faPhone(p.phone) : null, since: monthYear(p.since), resp: '', bio: p.bio || '', age: '—',
      week: p.week, stars: p.stars, revs: p.reviews.map(revRow), guar: p.guarantors.map((g) => [g.name, g.relation, 'general']),
      pf: (p.portfolio || []).map((x) => [x.title, x.place || '', abs(x.url)]), avatar: abs(p.avatarUrl),
    });
    if (p.skills && p.skills.length) m.skills = p.skills.map(skillRow);
    if (p.role === 'general') { m.skills = undefined; m.needs = m.needs && L.myNeeds ? L.myNeeds : []; }
    return m;
  });
  // نمونه‌کار با عکس واقعی
  wrap('pfArt', function (prev, kind, c) {
    if (typeof kind === 'string' && /^(https?:|blob:)/.test(kind)) return `<img src="${esc(kind)}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block">`;
    return prev(kind, c);
  });

  /* ---- کاوش و آگهی ---- */
  wrap('renderExplore', function (prev) {
    prev();
    if (!L.on) return;
    const t = modeType();
    if (!L.loaded['ads:' + t] || Date.now() - L.loaded['ads:' + t] > 15000) {
      loadAds(t).then(() => { if (S.cur === 'explore') prev(); }).catch((e) => { L.loaded['ads:' + t] = 0; err(e); });
    }
  });
  wrap('openAd', function (prev, id) {
    if (!L.on || ADS.find((x) => x.id === id) || !isUuid(id)) return prev(id);
    api('GET', '/ads/' + id).then((d) => { ADS.push(mapAd(d.ad)); prev(id); }).catch(err);
  });
  wrap('openRespond', function (prev, id) { S.respAd = id; return prev(id); });
  wrap('sent', async function (prev, name) {
    const a = L.on && S.respAd && ADS.find((x) => x.id === S.respAd);
    if (!a || !a._live) return prev(name);
    const txt = ($('rsp') && $('rsp').value.trim()) || '';
    const day = document.querySelector('#sb .chip[aria-pressed=true]');
    const message = a.type === 'work' && day ? `روز پیشنهادی: ${day.textContent}${txt ? '\n' + txt : ''}` : txt;
    if (message.length < 2) { toast('پیام را بنویس'); return; }
    const offer = $('rspW') ? $('rspW').value.trim().slice(0, 120) : null;
    const btn = document.querySelector('#sb .cta'); if (btn) btn.disabled = true;
    try {
      const d = await api('POST', '/ads/' + a.id + '/responses', { message, offer: offer || null });
      a.resp++; S.respAd = null; prev(name);
      loadConvs().catch(() => {});
      if (d.response && d.response.conversationId) L.lastConv = d.response.conversationId;
    } catch (e) { err(e); if (btn) btn.disabled = false; }
  });
  wrap('publish', async function (prev) {
    if (!L.on) return prev();
    const w = S.w;
    const amount = +toEn(w.wage || '').replace(/\D/g, '') || null;
    const body = {
      type: w.type, title: w.title.trim(), description: (w.desc || '').trim() || null,
      province: CITY_PROV[w.place] || (S.profile && S.profile.prov) || 'هرمزگان', city: w.place,
      wageType: w.type === 'consult' ? null : w.wageType || null, wageAmount: w.type === 'consult' || w.wageType === 'توافقی' ? null : amount,
      startWhen: w.type === 'consult' ? null : w.start || null, range: RANGE_F[w.range] || 'city', audience: w.aud.slice(0, 3),
      needCount: w.type === 'job' ? Math.max(1, +toEn(w.need) || 1) : null, skills: (w.skills || []).slice(0, 5),
    };
    try {
      const d = await api('POST', '/ads', body);
      const a = mapAd(Object.assign({}, d.ad, { author: myAuthor() }));
      ADS.unshift(a); S.w.newId = a.id; S.w.step = 4;
      L.loaded['ads:' + a.type] = Date.now();
      const m = (typeof MODES !== 'undefined' && MODES.find((x) => x[2] === a.type)) || null;
      if (m) S.mode = m[0];
      renderWizard();
      toast('آگهی منتشر شد؛ در کاوش، بخش «' + (m ? m[1] : 'آگهی‌ها') + '» دیده می‌شود');
    } catch (e) { err(e); }
  });

  /* ---- پروفایل دیگران ---- */
  const needFull = (id) => L.on && id && id !== 'me' && P[id] && P[id]._live && !P[id]._full;
  ['openProfile', 'openTrust'].forEach((fn) => wrap(fn, function (prev, id, ...rest) {
    if (!needFull(id)) return prev(id, ...rest);
    let shown = false;
    try { prev(id, ...rest); shown = true; } catch (e) {}
    api('GET', '/profiles/' + encodeURIComponent(P[id].code))
      .then((d) => { fillPerson(d.profile); if (!shown) prev(id, ...rest); else try { render(); } catch (e) {} })
      .catch(err);
  }));

  /* ---- گفت‌وگو ---- */
  wrap('openChat', function (prev, id) {
    const c = S.convs.find((x) => x.id === id);
    if (!L.on || !c || !c._live || c._loaded) return prev(id);
    prev(id);
    // پیامی که پیش از رسیدن تاریخچه فرستاده شد، بعد از بارگذاری حفظ شود
    const before = c.msgs, n0 = before.length;
    loadMsgs(c).then(() => {
      const extra = before.slice(n0).filter((m) => m.me && !c.msgs.some((x) => x.id && x.id === m.id));
      extra.forEach((m) => c.msgs.push(m));
      if (S.cur === 'chat' && S.cid === id) renderChat();
      updNavBadge();
    }).catch(err);
  });
  wrap('openChatWith', function (prev, pid, adId) {
    if (!L.on) return prev(pid, adId);
    // مهمان: اول ورود، بعد همین گفت‌وگوی واقعی (نه نسخهٔ نمایشی)
    if (!S.auth) { gate('chat', () => window.openChatWith(pid, adId)); return; }
    const p = pid === 'me' ? null : P[pid];
    if (!p || !p.code) { toast('این کاربر در نسخهٔ واقعی نیست'); return; }
    api('POST', '/conversations', { profileCode: p.code, adId: isUuid(adId) ? adId : undefined })
      .then(async (d) => { await loadConvs(); const c = S.convs.find((x) => x.id === d.conversation.id); if (c) { c.arch = false; openChat(c.id); } })
      .catch(err);
  });
  wrap('pushMsg', function (prev, m, reply) {
    const c = S.convs.find((x) => x.id === S.cid);
    if (!L.on || !c || !c._live || !m.me) return prev(m, reply);
    m._pending = true;
    prev(m, false);
    sendLive(c, m);
  });
  async function sendLive(c, m) {
    let path = '/conversations/' + c.id + '/messages', body;
    if (m.k === 'text') body = { kind: 'text', body: m.t };
    else if (m.k === 'loc') body = { kind: 'loc', payload: { place: m.place, label: m.label || undefined } };
    else if (m.k === 'phone') body = { kind: 'phone' };
    else if (m.k === 'deal') {
      const d = m.d, plan = (d.plan && d.plan.length ? d.plan : [['پس از پایان کار', 100]]).map((x) => ({ title: String(x[0] || '').trim().padEnd(2, '.'), pct: +toEn(x[1]) }));
      const amount = +toEn(d.price || '').replace(/\D/g, '') || undefined;
      path = '/conversations/' + c.id + '/deals';
      body = { job: d.job, qty: d.qty || null, price: d.price || 'توافقی', amount: /تن|متر|روز|ساعت/.test(d.price || '') ? undefined : amount, start: d.start, durationDays: Math.max(1, faInt(d.dur) || 1), plan, retentionPct: 0 };
    } else if (m.k === 'day') { path = '/conversations/' + c.id + '/days'; body = { date: m.t, hour: m.h }; }
    else if (m.k === 'voice') {
      // فایل ضبط‌شده (live-more.js ← L._voiceBlob) به‌صورت پیوست
      const blob = m._blob || L._voiceBlob; L._voiceBlob = null;
      if (!blob) { failMsg(c, m, 'صدایی ضبط نشد'); return; }
      m._blob = blob; if (!m.src) m.src = URL.createObjectURL(blob);
      const ext = /mp4|m4a|aac/.test(blob.type) ? 'm4a' : /ogg/.test(blob.type) ? 'ogg' : 'webm';
      const fd = new FormData(); fd.append('file', blob, 'voice.' + ext); fd.append('duration', String(m.dur || 1));
      try {
        const d = await api('POST', '/conversations/' + c.id + '/attachments', fd);
        const nm = mapMsg(d.message);
        if (!m.id) m.id = nm.id;
        m._pending = false; m._at = nm._at; m.st = 'sent'; m._blob = null;
        const i = c.msgs.indexOf(m);
        if (S.cur === 'chat' && S.cid === c.id && i > -1) rerenderMsg(i);
      } catch (e) { failMsg(c, m, e.message); }
      return;
    }
    else { failMsg(c, m, 'این نوع پیام هنوز فرستاده نمی‌شود'); return; }
    try {
      const d = await api('POST', path, body);
      const nm = mapMsg(d.message);
      if (!m.id) m.id = nm.id;
      m._pending = false; m._at = nm._at; m.st = 'sent';
      if (m.k === 'phone') m.num = nm.num;
      const i = c.msgs.indexOf(m);
      if (S.cur === 'chat' && S.cid === c.id && i > -1) rerenderMsg(i);
    } catch (e) { failMsg(c, m, e.message); }
  }
  function failMsg(c, m, msg) {
    toast(msg || 'پیام فرستاده نشد');
    const i = c.msgs.indexOf(m);
    if (i > -1) c.msgs.splice(i, 1);
    if (S.cur === 'chat' && S.cid === c.id) renderChat();
  }
  wrap('gotFile', function (prev, inp, k) {
    const c = S.convs.find((x) => x.id === S.cid);
    if (!L.on || !c || !c._live) return prev(inp, k);
    const f = inp.files && inp.files[0]; if (!f) return;
    closeSheet();
    const fd = new FormData(); fd.append('file', f);
    toast('در حال فرستادن…');
    api('POST', '/conversations/' + c.id + '/attachments', fd)
      .then((d) => { if (!c.msgs.some((x) => x.id === d.message.id)) pushIncoming(c, mapMsg(d.message)); })
      .catch(err);
  });
  wrap('sharePhone', function (prev) {
    prev();
    if (!L.on || !L.me) return;
    const b = document.querySelector('#sb .card b');
    if (b) b.textContent = faPhone(L.me.user.phone);
  });
  function answer(i, st, kind) {
    const c = S.convs.find((x) => x.id === S.cid), m = c && c.msgs[i];
    if (!m || !m.id) { toast('این پیشنهاد هنوز فرستاده نشده'); return; }
    api('POST', '/messages/' + m.id + '/answer', { status: st === 'ok' ? 'accepted' : 'rejected' })
      .then(async (d) => {
        m.st = st; rerenderMsg(i);
        if (d.project) toast('توافق ثبت شد؛ پروژه ساخته شد');
        else toast(st === 'ok' ? 'تأیید شد' : 'رد شد');
        await loadMsgs(c).catch(() => {});
        if (S.cur === 'chat' && S.cid === c.id) renderChat();
        if (kind === 'day' && st !== 'ok') pickDayProposal();
      })
      .catch(err);
  }
  wrap('ansDeal', function (prev, i, st) { const c = S.convs.find((x) => x.id === S.cid); if (!L.on || !c || !c._live) return prev(i, st); answer(i, st, 'deal'); });
  wrap('ansDay', function (prev, i, st) { const c = S.convs.find((x) => x.id === S.cid); if (!L.on || !c || !c._live) return prev(i, st); answer(i, st, 'day'); });
  wrap('msgHTML', function (prev, m, i, c) {
    let h = prev(m, i, c);
    if (L.on && m.k === 'file' && m.url) h = h.replace(`onclick="toast('دانلود فایل در نسخهٔ واقعی')"`, `onclick="window.open('${esc(m.url)}','_blank')"`);
    return h;
  });
  wrap('renderChat', function (prev) {
    prev();
    const c = L.on && S.convs.find((x) => x.id === S.cid);
    if (c && c._live) { const st = $('chatSt'); if (st) { st.classList.remove('live'); st.textContent = st.textContent.replace(/^(آنلاین|آخرین بازدید امروز)/, 'گفت‌وگوی بلوک'); } }
  });
  wrap('convAct', function (prev, id, a) {
    prev(id, a);
    const c = L.on && S.convs.find((x) => x.id === id);
    if (!c || !c._live) return;
    const set = a === 'mute' ? { muted: c.muted } : a === 'arch' ? { archived: c.arch } : a === 'pin' ? { pinned: c.pinned } : null;
    if (set) api('PATCH', '/conversations/' + id, set).catch(err);
    if (a === 'read') markRead(c);
  });

  /* ---- اعلان‌ها ---- */
  wrap('renderNotif', function (prev) {
    prev();
    if (!L.on) return;
    document.querySelectorAll('#s-notif .nt').forEach((b) => {
      const m = (b.getAttribute('onclick') || '').match(/S\.notifs\[(\d+)\]/);
      const n = m && S.notifs[+m[1]];
      if (n && n.id && !n.read) b.addEventListener('click', () => api('POST', '/notifications/' + n.id + '/read').catch(() => {}), { once: true });
    });
    const all = document.querySelector('#s-notif [aria-label="خواندن همه"]');
    if (all) all.addEventListener('click', () => api('POST', '/notifications/read-all').catch(() => {}), { once: true });
  });

  /* ---- تأیید هویت ---- */
  wrap('kycPick', function (prev, inp, id) { prev(inp, id); if (inp.files && inp.files[0]) L.kyc[id] = inp.files[0]; });
  wrap('openKYC', function (prev) {
    L.kyc = {};
    prev();
    if (!L.on || !S.auth && !(L.tok)) return;
    const b = document.querySelector('#sb .cta'); if (!b) return;
    const after = b.getAttribute('onclick') || '';
    b.removeAttribute('onclick');
    b.onclick = async () => {
      const ids = [...document.querySelectorAll('#sb .upl')].map((x) => x.id);
      const card = L.kyc[ids[0]], selfie = L.kyc[ids[1]];
      if (!card || !selfie) { toast('هر دو عکس لازم است'); return; }
      const d = (S.profile && S.profile.d) || (S.reg && S.reg.d) || {};
      const fd = new FormData();
      fd.append('card', card); fd.append('selfie', selfie);
      if (d.nat === 'اتباع خارجی') { fd.append('idType', 'foreign'); if (d.idNo) fd.append('idNumber', toEn(d.idNo)); }
      b.disabled = true; b.textContent = 'در حال ارسال…';
      try {
        await api('POST', '/me/kyc', fd);
        closeSheet(); toast('مدارک در صف بررسی است؛ معمولاً تا ۲۴ ساعت');
        if (/finishAuth/.test(after) && S.reg && S.reg.step === 'done') finishAuth();
      } catch (e) { err(e); b.disabled = false; b.textContent = 'ارسال برای بررسی'; }
    };
  });

  /* ---- تنظیمات: حریم خصوصی و نشان اتصال ---- */
  wrap('renderSet', function (prev) {
    prev();
    if (!L.on) return;
    const hint = [...document.querySelectorAll('#s-set .hint')].pop();
    if (hint) hint.textContent = 'بلوک · متصل به سرور' + (L.me ? ' · ' + fa(L.me.user.phone) : '');
    const pub = document.querySelector('#s-set [aria-label="پروفایل عمومی"]'), ph = document.querySelector('#s-set [aria-label="نمایش شماره"]');
    const save = (data) => api('PATCH', '/me/roles/' + S.role, { data }).then(() => loadMe()).catch(err);
    if (pub) pub.addEventListener('click', () => save({ pub: S.me.pub }));
    if (ph) ph.addEventListener('click', () => save({ showPhone: S.me.phone }));
    const shield = [...document.querySelectorAll('#s-set .linkrow')].find((x) => x.textContent.includes('تأیید هویت'));
    if (shield && L.me) { const s = shield.querySelector('small'); if (s) s.textContent = { none: 'انجام نشده', pending: 'در حال بررسی', verified: 'تأیید شده', rejected: 'رد شد؛ دوباره بفرست' }[L.me.user.kycStatus] || ''; }
    const phoneRow = [...document.querySelectorAll('#s-set .linkrow')].find((x) => x.textContent.includes('شمارهٔ موبایل'));
    if (phoneRow && L.me) { const s = phoneRow.querySelector('small'); if (s) s.textContent = faPhone(L.me.user.phone); }
  });

  /* ابزار مشترک برای live-projects.js */
  Object.assign(L, { upsertPerson, fillPerson, loadMe, loadConvs, mapAd, abs, rel, faDate, dayLabel, money, err, toEn, faPhone, fsize, isUuid, wrap, ini });

  /* =================== شروع =================== */
  function goLive() {
    if (L.on) return;
    L.on = true;
    document.documentElement.dataset.live = '1';
    // فایل‌های دیگر اتصال (live-projects.js) دادهٔ نمایشی خودشان را همین‌جا کنار می‌گذارند
    (L.onLive || []).forEach((f) => { try { f(); } catch (e) { console.warn(e); } });
    // دادهٔ نمایشی کنار می‌رود
    ADS.length = 0;
    S.convs = []; S.notifs = []; S._demoEv = 1; S.auth = false;
  }
  async function boot() {
    if (!L.base) return;
    try { L.tok = JSON.parse(store.get('blk-tok') || 'null'); } catch (e) { L.tok = null; }
    if (L.tok) {
      // کاربر واردشده: بدون صبر برای سرور، دادهٔ نمایشی نشان داده نمی‌شود و آخرین اطلاعات خودش فوری می‌آید
      await new Promise((r) => (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', r, { once: true }) : r()));
      goLive();
      let snap = null;
      try { snap = JSON.parse(store.get(SNAP) || 'null'); } catch (e) { snap = null; }
      if (snap && snap.v === 1 && snap.me && snap.me.user && !snap.me.needsRegistration) { try { applySnap(snap); } catch (e) { console.warn(e); } }
      else render();
    }
    try {
      const r = await fetch(L.base + '/api/health', { signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined });
      if (!r.ok) throw new Error('down');
    } catch (e) {
      console.warn('[بلوک] سرور در دسترس نیست', L.base);
      toast(L.on ? 'اتصال به سرور برقرار نشد؛ آخرین اطلاعات ذخیره‌شده را می‌بینی' : 'سرور بلوک در دسترس نیست؛ نسخهٔ نمایشی');
      return;
    }
    goLive();
    if (L.tok) {
      try {
        await loadMe();
        if (L.me.needsRegistration) { if (L._fromSnap) { S.auth = false; render(); } }
        else if (L._fromSnap) {
          // همان صفحه‌ای که کاربر هست بماند؛ فقط داده‌ها تازه شوند
          connectSSE();
          loadConvs().catch(() => {});
          loadNotifs().catch(() => {});
          const c = S.cur === 'chat' && S.convs.find((x) => x.id === S.cid);
          if (c) loadMsgs(c).then(() => { if (S.cur === 'chat' && S.cid === c.id) renderChat(); }).catch(() => {});
          render();
        } else enterApp(true);
      } catch (e) {
        if (e.status === 401 || e.status === 403) { setTok(null); store.set(SNAP, null); if (L._fromSnap) { S.auth = false; S.convs = []; S.notifs = []; go('home'); } }
      }
    }
    loadAds(modeType()).catch(() => {}).then(() => render());
    render();
    console.info('[بلوک] متصل به سرور', L.base);
  }
  boot();
})();
