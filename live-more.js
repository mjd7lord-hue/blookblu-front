/* =================== بلوک · اتصال بخش ۳: ذخیره‌ها، آگهی‌های من و پاسخ‌ها، مرکز درخواست‌ها، تقویم ===================
 * بعد از live.js و live-projects.js بار می‌شود؛ فقط وقتی سرور وصل است (LIVE.on) کار می‌کند.
 */
(function () {
  'use strict';
  const L = window.LIVE;
  if (!L) return;
  const on = () => L.on && S.auth;
  const api = (...a) => L.api(...a);
  const err = (e) => L.err(e);
  const wrap = (name, fn) => { const prev = window[name]; if (typeof prev !== 'function') return; window[name] = function () { return fn.call(this, prev, ...arguments); }; };
  const fresh = (k, ms = 20000) => L.loaded[k] && Date.now() - L.loaded[k] < ms;

  function reset() { S.saved = new Set(); S.req = {}; S.out = []; }
  L.onLive = (L.onLive || []).concat(reset);
  L.onEnd = (L.onEnd || []).concat(reset);

  /* ================= ذخیره‌ها ================= */

  async function loadSaved(force) {
    if (!force && fresh('saved')) return;
    L.loaded.saved = Date.now();
    const d = await api('GET', '/saved');
    const keys = new Set();
    // آگهی ذخیره‌شده با نویسنده‌اش لازم است (کارت آگهی)
    await Promise.all(d.ads.map(async (a) => {
      keys.add('ad:' + a.id);
      if (ADS.find((x) => x.id === a.id)) return;
      try { const full = await api('GET', '/ads/' + a.id); ADS.push(Object.assign(L.mapAd(full.ad), { st: full.ad.status })); } catch (e) { keys.delete('ad:' + a.id); }
    }));
    d.profiles.forEach((p) => {
      const id = L.upsertPerson({ code: p.code, name: p.name, role: p.role, title: p.title, rating: p.rating, avatarUrl: p.avatarUrl }, p.city);
      if (P[id]) { P[id]._pid = p.id; if (!P[id].place) P[id].place = p.city; }
      keys.add(id);
    });
    S.saved = keys;
  }
  L.loadSaved = loadSaved;
  async function profileUuid(code) {
    const p = P[code];
    if (p && p._pid) return p._pid;
    const d = await api('GET', '/profiles/' + encodeURIComponent(code));
    L.fillPerson(d.profile);
    return d.profile.id;
  }
  wrap('togSave', function (prev, k) {
    if (!on()) return prev(k);
    const was = S.saved.has(k);
    prev(k); // نمایش فوری
    const isAd = String(k).startsWith('ad:');
    const go2 = isAd ? Promise.resolve(k.slice(3)) : profileUuid(k);
    go2
      .then((id) => api(was ? 'DELETE' : 'PUT', `/saved/${isAd ? 'ad' : 'profile'}/${id}`))
      .catch((e) => { was ? S.saved.add(k) : S.saved.delete(k); render(); err(e); });
  });
  wrap('renderSaved', function (prev) {
    if (!on()) return prev();
    prev();
    if (!fresh('saved')) loadSaved().then(() => { if (S.cur === 'saved') renderSaved(); }).catch(err);
  });

  /* ================= آگهی‌های من و پاسخ‌ها ================= */

  function myAuthor() {
    const p = L.pub || {};
    return { code: p.code, role: p.role, name: p.name, title: p.title, rating: p.rating, doneCount: p.doneCount, reviewsCount: p.reviewsCount, week: p.week, trust: p.trust && p.trust.total };
  }
  async function loadMyAds(force) {
    const k = 'myads:' + S.role;
    if (!force && fresh(k)) return;
    L.loaded[k] = Date.now();
    const d = await api('GET', '/ads/mine');
    for (let i = ADS.length - 1; i >= 0; i--) if (ADS[i].who === 'me') ADS.splice(i, 1);
    d.items.forEach((x) => ADS.push(Object.assign(L.mapAd(Object.assign({}, x, { author: myAuthor() })), { who: 'me', st: x.status, views: x.views })));
  }
  wrap('renderMyAds', function (prev) {
    if (!on()) return prev();
    prev();
    if (!fresh('myads:' + S.role)) loadMyAds().then(() => { if (S.cur === 'myads') renderMyAds(); }).catch(err);
  });
  wrap('adSt', function (prev, id, st) {
    const a = ADS.find((x) => x.id === id);
    if (!on() || !a || !a._live) return prev(id, st);
    api('PATCH', '/ads/' + id, { status: st })
      .then(() => { a.st = st; L.loaded['ads:' + a.type] = 0; renderMyAds(); toast({ active: 'آگهی دوباره فعال شد (۳۰ روز)', paused: 'آگهی متوقف شد؛ در کاوش دیده نمی‌شود', closed: 'آگهی بسته شد' }[st]); })
      .catch(err);
  });
  const RS_ST = { pending: null, accepted: 'پذیرفتی', rejected: 'رد کردی' };
  wrap('respList', function (prev, id) {
    const a = ADS.find((x) => x.id === id);
    if (!on() || !a || !a._live) return prev(id);
    api('GET', '/ads/' + id + '/responses')
      .then((d) => {
        a._rs = d.items;
        a.rs = d.items.map((r) => [L.upsertPerson(r.from), r.message, r.offer || '—']);
        prev(id);
        // پذیرش/رد واقعی؛ وضعیت پاسخ‌های قبلی
        document.querySelectorAll('#sb .rs').forEach((el, n) => {
          const r = d.items[n]; if (!r) return;
          const acts = el.querySelector('.rq-a');
          if (r.status !== 'pending') { const b = acts && acts.querySelector('.yes'); if (b) b.outerHTML = `<span class="tag ${r.status === 'accepted' ? 'ok' : ''}">${RS_ST[r.status]}</span>`; return; }
          if (acts) acts.insertAdjacentHTML('beforeend', `<button data-rej="${r.id}">رد</button>`);
        });
        document.querySelectorAll('#sb [data-rej]').forEach((b) => (b.onclick = () => answer(b.dataset.rej, 'rejected', id)));
      })
      .catch(err);
  });
  function answer(rid, status, adId) {
    return api('PATCH', '/responses/' + rid, { status })
      .then(() => {
        L.loaded.req = 0;
        toast(status === 'accepted' ? 'انتخاب شد؛ در چت شرایط را نهایی کنید و «پیشنهاد توافق» بفرستید' : 'درخواست رد شد');
        if (adId && S.cur === 'myads') { closeSheet(); respList(adId); }
        if (S.cur === 'req') L.loadRequests(true).then(renderReq);
        if (S.cur === 'home') L.loadRequests(true).then(renderHome);
      })
      .catch(err);
  }
  wrap('acceptResp', function (prev, id, pid) {
    const a = ADS.find((x) => x.id === id);
    if (!on() || !a || !a._rs) return prev(id, pid);
    const r = a._rs.find((x) => x.from.code === pid);
    if (!r) { toast('پاسخ پیدا نشد'); return; }
    answer(r.id, 'accepted', id);
  });

  /* ================= مرکز درخواست‌ها (و کارت درخواست‌ها در خانه) ================= */

  const TYPE_T = { work: 'درخواست همکاری', job: 'اعلام آمادگی', consult: 'پاسخ به پرسش' };
  const RQ_ST = { pending: null, accepted: 'ok', rejected: 'no' };
  async function loadRequests(force) {
    if (!force && fresh('req')) return;
    L.loaded.req = Date.now();
    const [inc, out] = await Promise.all([api('GET', '/responses?dir=in'), api('GET', '/responses?dir=out')]);
    S.req[S.role] = inc.items.map((r) => ({ t: TYPE_T[r.ad.type] + ': ' + r.ad.title, from: L.upsertPerson(r.from), d: (r.offer ? r.offer + ' · ' : '') + L.rel(r.createdAt), st: RQ_ST[r.status], _id: r.id, _msg: r.message }));
    S.out = out.items.map((r) => ({ t: TYPE_T[r.ad.type] + ': ' + r.ad.title, to: r.to ? L.upsertPerson(r.to) : 'me', d: (r.offer ? r.offer + ' · ' : '') + L.rel(r.createdAt), st: RQ_ST[r.status], _id: r.id }));
    // درخواست‌های بازدید مهندس (بخش ۴)
    try {
      await L.loadVisits();
      const VQ = { requested: null, confirmed: 'ok', done: 'ok', declined: 'no', cancelled: 'no' };
      const vis = (L.visits || []).filter((v) => v.status !== 'cancelled' || v.as === 'client');
      if (S.role === 'engineer') S.req[S.role] = vis.filter((v) => v.as === 'engineer').map((v) => ({ t: 'درخواست بازدید: ' + v.typeName, from: v._c, d: v.dayLabel + ' ساعت ' + v.slot + ' · ' + v.address, st: VQ[v.status], _visit: v.id })).concat(S.req[S.role]);
      S.out = vis.filter((v) => v.as === 'client').map((v) => ({ t: 'بازدید مهندس: ' + v.typeName, to: v._e, d: v.dayLabel + ' ساعت ' + v.slot, st: VQ[v.status], _visit: v.id, _vst: v.status })).concat(S.out);
    } catch (e) {}
  }
  L.loadRequests = loadRequests;
  wrap('renderReq', function (prev) {
    if (!on()) return prev();
    if (!S.req[S.role]) S.req[S.role] = [];
    prev();
    if (!fresh('req')) L.loadRequests().then(() => { if (S.cur === 'req') renderReq(); }).catch(err);
  });
  wrap('rqAns', function (prev, i, st) {
    if (!on()) return prev(i, st);
    const Lx = S.rtab === 'in' ? S.req[S.role] : S.out, r = Lx[i];
    if (r && r._visit) {
      const act = st === 'x' ? 'cancel' : st === 'ok' ? 'confirm' : 'decline';
      api('POST', '/visits/' + r._visit + '/' + act, {}).then(() => { toast(act === 'confirm' ? 'بازدید تأیید شد؛ در میز کار امروزت می‌آید' : act === 'cancel' ? 'بازدید لغو شد' : 'درخواست بازدید رد شد'); return L.loadRequests(true); }).then(renderReq).catch(err);
      return;
    }
    if (!r || !r._id) return prev(i, st);
    if (st === 'x') {
      api('POST', '/responses/' + r._id + '/withdraw').then(() => { toast('درخواست پس گرفته شد'); return L.loadRequests(true); }).then(renderReq).catch(err);
      return;
    }
    answer(r._id, st === 'ok' ? 'accepted' : 'rejected');
  });
  wrap('ansReq', function (prev, role, i, st) {
    const r = (S.req[role] || [])[i];
    if (on() && r && r._visit) { api('POST', '/visits/' + r._visit + '/' + (st === 'ok' ? 'confirm' : 'decline'), {}).then(() => L.loadRequests(true)).then(() => { toast(st === 'ok' ? 'بازدید تأیید شد' : 'درخواست بازدید رد شد'); render(); }).catch(err); return; }
    if (!on() || !r || !r._id) return prev(role, i, st);
    answer(r._id, st === 'ok' ? 'accepted' : 'rejected');
  });
  // بعد از پاسخ به آگهی، فهرست درخواست‌های ارسالی دوباره از سرور گرفته شود (نه نسخهٔ نمایشی)
  wrap('sent', async function (prev, name) { await prev(name); L.loaded.req = 0; });
  wrap('renderHome', function (prev) {
    if (on() && !S.req[S.role]) S.req[S.role] = [];
    prev();
    if (on() && !fresh('req', 60000)) L.loadRequests().then(() => { if (S.cur === 'home') prev(); }).catch(() => {});
  });

  /* ================= تقویم (ماه جاری شمسی) ================= */

  const JM = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  const jParts = (d) => {
    const p = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', { year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'Asia/Tehran' }).formatToParts(d);
    const g = (t) => +p.find((x) => x.type === t).value;
    return { y: g('year'), m: g('month'), d: g('day') };
  };
  function monthInfo() {
    const now = new Date(); now.setHours(12, 0, 0, 0);
    const t = jParts(now);
    const first = new Date(now.getTime() - (t.d - 1) * 864e5);
    let len = 29;
    while (jParts(new Date(first.getTime() + len * 864e5)).m === t.m) len++;
    return { y: t.y, m: t.m, today: t.d, col: (first.getDay() + 1) % 7, len };
  }
  // «۱۲ مهر، ۷ صبح» ← روز و ساعت (رویدادهای پروژه‌ها)
  const toEn = (s) => L.toEn(s);
  function eventsOf(M) {
    const out = [];
    (S.projs[S.role] || []).forEach((p) => {
      if (!p._live || p.status !== 'active') return;
      const txt = (p._x && (p._x.startDate || p._x.startText)) || '';
      const m = txt.match(/([۰-۹\d]{1,2})\s*(فروردین|اردیبهشت|خرداد|تیر|مرداد|شهریور|مهر|آبان|آذر|دی|بهمن|اسفند)/);
      if (!m || JM.indexOf(m[2]) !== M.m - 1) return;
      const h = (txt.match(/ساعت\s*([^،]+)|،\s*([^،]*(صبح|ظهر|عصر|شب))/) || [])[1] || (txt.match(/([۰-۹\d]+\s*(صبح|ظهر|عصر|شب))/) || [])[1] || '—';
      out.push({ d: +toEn(m[1]), h: String(h).trim(), t: (p.stage >= 2 ? 'کار: ' : 'شروع کار: ') + p.t, w: (P[p.who] || {}).name || '' });
    });
    (L.visits || []).forEach((v) => {
      if (!['requested', 'confirmed', 'done'].includes(v.status)) return;
      const j = jParts(new Date(v.day + 'T12:00:00Z'));
      if (j.y !== M.y || j.m !== M.m) return;
      const o = v.as === 'engineer' ? v.client : v.engineer;
      out.push({ d: j.d, h: v.slot, t: 'بازدید: ' + v.typeName + (v.status === 'requested' ? ' (منتظر تأیید)' : ''), w: (o ? o.name : '') + ' · ' + v.address });
    });
    return out;
  }
  wrap('renderCal', function (prev) {
    if (!on()) return prev();
    if (!fresh('projs:' + S.role)) (L.loadProjects ? L.loadProjects() : Promise.resolve()).then(() => { if (S.cur === 'cal') renderCal(); }).catch(() => {});
    if (!fresh('visits', 60000) && L.loadVisits) L.loadVisits().then(() => { if (S.cur === 'cal') renderCal(); }).catch(() => {});
    const M = monthInfo(), type = CAL_TYPE[S.role], wd = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
    const week = (L.pub && L.pub.week) || ['o', 'o', 'o', 'o', 'o', 'o', 'o'];
    const dayState = (d) => week[(M.col + d - 1) % 7];
    if (!S.cal._live) { S.cal.sel = M.today; S.cal._live = 1; }
    const sel = S.cal.sel, evs = eventsOf(M);
    let cells = '';
    for (let i = 0; i < M.col; i++) cells += '<span></span>';
    for (let d = 1; d <= M.len; d++) {
      const has = evs.some((e) => e.d === d), av = dayState(d);
      cells += `<button class="cd2 ${d === M.today ? 'today' : ''} ${d === sel ? 'sel' : ''} ${type === 'avail' && av !== 'o' ? 'av-' + av : ''} ${d < M.today ? 'past' : ''}" onclick="calPick(${d})" aria-label="${fa(d)} ${JM[M.m - 1]}${has ? '، رویداد دارد' : ''}"><b class="num">${fa(d)}</b>${has ? '<i></i>' : ''}</button>`;
    }
    const dayEv = evs.filter((e) => e.d === sel);
    const title = { avail: 'روزهای آزاد من', book: 'تقویم پروژه‌ها و بازدیدها', appt: 'قرارهای من' }[type];
    const st = dayState(sel);
    $('s-cal').innerHTML = `${pageBar(title)}
    <div class="section" style="margin-top:10px"><div class="card cal">
      <div class="cal-h"><b>${JM[M.m - 1]} ${fa(M.y)}</b><span class="num">${fa(evs.length)} رویداد</span></div>
      <div class="cal-w">${wd.map((x) => `<span>${x}</span>`).join('')}</div><div class="cal-g">${cells}</div>
      ${type === 'avail' ? `<div class="day-legend"><span><i style="background:var(--ok)"></i>آزاد</span><span><i style="background:var(--gold)"></i>رزرو شده</span><span><i style="background:var(--line)"></i>تعطیل</span></div>` : ''}</div></div>
    <div class="section"><div class="sec-head"><h3>${fa(sel)} ${JM[M.m - 1]}</h3>${sel >= M.today && st !== 'b' ? `<button onclick="calTog(${sel})">${st === 'a' ? 'هر ' + DAYF[(M.col + sel - 1) % 7] + ' تعطیل' : 'هر ' + DAYF[(M.col + sel - 1) % 7] + ' آزاد'}</button>` : ''}</div>
      <div id="dayEv">${dayEv.length ? dayEv.map((e, k) => `<div class="evc" style="animation-delay:${k * 70}ms"><span class="tm num">${esc(e.h)}</span><div class="t"><b>${esc(e.t)}</b><span>${esc(e.w)}</span></div></div>`).join('')
        : `<div class="empty" style="padding:22px"><b>${st === 'a' ? 'این روز آزادی' : st === 'b' ? 'این روز رزرو است' : 'این روز تعطیلی'}</b><p style="margin:4px 0 0">روزهای آزاد هفتگی است: هر هفته همان روزها آزاد نشان داده می‌شوند. رویدادها از روز شروع پروژه‌ها می‌آیند.</p></div>`}</div></div>`;
  });
  wrap('calTog', function (prev, d) {
    if (!on()) return prev(d);
    const M = monthInfo(), wdI = (M.col + d - 1) % 7;
    const week = ((L.pub && L.pub.week) || ['o', 'o', 'o', 'o', 'o', 'o', 'o']).slice();
    const next = week[wdI] === 'a' ? 'o' : 'a';
    // روزهای رزرو (b) را سرور نگه می‌دارد
    const body = week.map((x, i) => (i === wdI ? next : x === 'a' ? 'a' : 'o'));
    api('PUT', '/me/roles/' + S.role + '/week', { week: body })
      .then(() => L.loadMe())
      .then(() => { renderCal(); toast('هر ' + DAYF[wdI] + (next === 'a' ? ' آزاد شد' : ' تعطیل شد')); })
      .catch(err);
  });

  /* =================================================================
   * بخش ۴: تنظیمات پنل ادمین (قوانین، استوری، ضرایب، حالت تعمیر)، پشتیبانی، آکادمی،
   *        تیم و حضور و غیاب، رزرو بازدید مهندس
   * ================================================================= */
  const setArr = (arr, items) => { arr.length = 0; items.forEach((x) => arr.push(x)); };
  const addD = (day, n) => { const d = new Date(day + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const faDM = (day, o) => new Intl.DateTimeFormat('fa-IR-u-ca-persian', Object.assign({ timeZone: 'UTC' }, o)).format(new Date(day + 'T12:00:00Z'));

  /* ---------- تنظیمات عمومی ---------- */
  function showMaint(on_) {
    let el = document.getElementById('blkMaint');
    if (!on_) { if (el) el.remove(); return; }
    if (el) return;
    el = document.createElement('div');
    el.id = 'blkMaint';
    el.setAttribute('role', 'alertdialog');
    el.style.cssText = 'position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:var(--bg,#0E1917);padding:24px;text-align:center';
    el.innerHTML = '<div style="max-width:340px"><div style="font-size:44px">🛠</div><h2 style="margin:8px 0">بلوک در حال به‌روزرسانی است</h2><p style="color:var(--muted);margin:0 0 16px">چند دقیقهٔ دیگر دوباره سر بزن. کارهایت ذخیره است.</p><button class="cta" onclick="location.reload()">دوباره امتحان کن</button></div>';
    document.body.appendChild(el);
  }
  function applyCfg(d) {
    L.cfg = d;
    showMaint(d.flags && d.flags.maintenance === true);
    // قوانین (پنل ← قوانین و قرارداد)
    if (typeof LEGAL === 'object' && d.legal) Object.entries(d.legal).forEach(([k, v]) => { if (LEGAL[k] || ['terms', 'privacy', 'rules'].includes(k)) LEGAL[k] = [v.n, v.items]; });
    // ضرایب برآورد هزینه و داوری (نمایش؛ مبلغ داوری را سرور حساب می‌کند)
    const c = d.coefs || {};
    try {
      if (c.est && typeof EST === 'object') { EST.q.eco.p = c.est.eco; EST.q.mid.p = c.est.mid; EST.q.lux.p = c.est.lux; EST.fr.c.con = c.est.con; EST.fr.c.reb = c.est.reb; EST.fr.c.lab = c.est.lab; EST.fr.s.stl = c.est.stl; }
      if (c.arb) {
        if (typeof ARB_F !== 'undefined') ARB_F.forEach((f) => { if (c.arb.fields[f.k] != null) f.f = c.arb.fields[f.k]; });
        if (typeof ARB_TRAVEL === 'object') Object.assign(ARB_TRAVEL, c.arb.travel);
        if (typeof ARB_AMT !== 'undefined') c.arb.amt.forEach((t, i) => { if (ARB_AMT[i]) ARB_AMT[i][1] = t[1]; });
      }
    } catch (e) { console.warn(e); }
    if (typeof VTYPE !== 'undefined' && Array.isArray(d.visitTypes)) setArr(VTYPE, d.visitTypes.map((t) => [t.n, t.d, t.p]));
  }
  async function loadCfg() { applyCfg(await api('GET', '/app/config')); }
  L.loadCfg = loadCfg;
  // حالت آزمایشی اپ با سرور: دادهٔ نمایشی تیم، بازدید و تأییدهای بتن کنار می‌رود
  L.onLive = (L.onLive || []).concat(() => {
    loadCfg().catch(() => {});
    S.team = []; S.today = {}; S.hold = [];
    if (typeof EVIS !== 'undefined') EVIS.length = 0;
    S.visDone = {};
    L.visits = []; L.team = null;
  });
  // هر ۵ دقیقه (برای حالت تعمیر و تغییر قوانین/استوری)
  setInterval(() => { if (L.on && !document.hidden) loadCfg().catch(() => {}); }, 300000);
  const err0 = L.err;
  L.err = function (e) { if (e && e.code === 'MAINTENANCE') { showMaint(true); return; } return err0.apply(this, arguments); };
  wrap('openLegal', function (prev, k) {
    prev(k);
    const v = L.cfg && L.cfg.legal && L.cfg.legal[k];
    const sub = v && document.querySelector('#sb .sub');
    if (sub) sub.textContent = 'نسخهٔ ' + v.v + ' · ' + v.d;
  });

  /* ---------- استوری‌های پنل ---------- */
  const seenStory = new Set();
  wrap('storyList', function (prev) {
    const base = prev();
    if (!L.on || !L.cfg || !(L.cfg.stories || []).length) return base;
    const ic = (typeof QI === 'object' && (QI.helmet || QI.bell)) || '';
    const mine = L.cfg.stories.map((s) => ({ k: 'adm-' + s.id, n: s.t, ic, h: s.s, p: s.p || '', cta: s.cta || (s.go ? 'دیدن' : 'فهمیدم'), fn: s.go ? `closeStory();go('${s.go}')` : 'nextStory()', art: 'sun', _id: s.id }));
    return mine.concat(base);
  });
  wrap('renderStory', function (prev) {
    prev();
    try {
      const s = storyList()[S.si];
      if (s && s._id && !seenStory.has(s._id)) { seenStory.add(s._id); api('POST', '/app/stories/' + s._id + '/view').catch(() => {}); }
    } catch (e) {}
  });

  /* ---------- پشتیبانی ---------- */
  wrap('openChat', function (prev, id) {
    if (id !== 'c-support' || !L.on) return prev(id);
    if (!S.auth) { gate('chat', () => window.openChat('c-support')); return; }
    api('POST', '/app/support').then((d) => L.openConv(d.conversation.id)).catch(err);
  });

  /* ---------- آکادمی ---------- */
  let learnSynced = {};
  async function loadCourses() {
    L.loaded.learn = Date.now();
    const d = await api('GET', '/app/courses');
    setArr(COURSES, d.items.map((c) => [c.title, c.category, c.lessons, c.minutes, c.roles.length ? c.roles.join(' ') : 'all', c.id]));
    S.learn.p = {};
    d.items.forEach((c, i) => { if (c.done) S.learn.p[i] = c.done; });
    S.learn.badges = d.badges;
    learnSynced = Object.assign({}, S.learn.p);
  }
  wrap('renderLearn', function (prev) {
    if (!L.on) return prev();
    // درس تازه‌ای که کاربر تمام کرده به سرور برود
    if (S.auth && L.loaded.learn) Object.keys(S.learn.p).forEach((i) => {
      const c = COURSES[i], v = S.learn.p[i];
      if (c && c[5] && v > (learnSynced[i] || 0)) { learnSynced[i] = v; api('PUT', '/app/courses/' + c[5] + '/progress', { done: v }).catch(err); }
    });
    prev();
    if (!fresh('learn', 60000)) loadCourses().then(() => { if (S.cur === 'learn') prev(); }).catch(() => {});
  });

  /* ---------- تیم و حضور و غیاب ---------- */
  async function loadTeam() {
    L.loaded.team = Date.now();
    let d = await api('GET', '/me/team?days=6');
    // اول هر روز همه «حاضر» (مثل نسخهٔ نمایشی)؛ بعد با لمس عوض می‌شود
    if (d.items.length && !d.items.some((m) => m.days[d.today])) { await api('POST', '/me/team/attendance/all-present'); d = await api('GET', '/me/team?days=6'); }
    const past = [5, 4, 3, 2, 1].map((n) => addD(d.today, -n));
    S.team = d.items.filter((m) => m.active).map((m) => ({ n: m.name, sk: m.skill, w: m.dailyWage, wk: past.map((day) => m.days[day] || 'a'), _id: m.id }));
    S.today = {};
    S.team.forEach((m, k) => (S.today[k] = d.items.find((x) => x.id === m._id).days[d.today] || 'a'));
    L.team = Object.assign(d, { past });
  }
  wrap('renderTeam', function (prev, soft) {
    if (!on()) return prev(soft);
    prev(soft);
    const t = L.team;
    if (t) {
      const hero = document.querySelector('#s-team .tm-hero small');
      if (hero) hero.textContent = 'امروز، ' + faDM(t.today, { weekday: 'long', day: 'numeric', month: 'long' });
      const lab = document.querySelectorAll('#s-team .tmgrid small');
      t.past.forEach((day, i) => { if (lab[i]) lab[i].textContent = faDM(day, { day: 'numeric' }); });
    }
    if (!fresh('team', 30000)) loadTeam().then(() => { if (S.cur === 'team') prev(true); }).catch(err);
  });
  wrap('tmToggle', function (prev, k) {
    if (!on() || !S.team[k] || !S.team[k]._id) return prev(k);
    prev(k);
    api('PUT', '/me/team/' + S.team[k]._id + '/attendance', { status: S.today[k] }).catch((e) => { L.loaded.team = 0; err(e); renderTeam(); });
  });
  wrap('saveMember', function (prev) {
    if (!on()) return prev();
    const n = $('tmN').value.trim();
    if (!n) { toast('نام را بنویسید'); return; }
    const sk = (document.querySelector('#sb .chip[aria-pressed="true"]') || {}).textContent || 'کارگر ساده';
    const w = +String($('tmW').value).replace(/[۰-۹]/g, (x) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(x)).replace(/\D/g, '') || 1800000;
    api('POST', '/me/team', { name: n, skill: sk, dailyWage: w })
      .then(() => loadTeam())
      .then(() => { closeSheet(); renderTeam(); toast(n + ' به تیم اضافه شد'); })
      .catch(err);
  });

  /* ---------- رزرو بازدید مهندس ---------- */
  const VST = { requested: ['منتظر تأیید', 'wait'], confirmed: ['تأیید شد', 'ok'], declined: ['رد شد', 'no'], cancelled: ['لغو شد', 'no'], done: ['گزارش رسید', 'ok'] };
  async function loadVisits() {
    L.loaded.visits = Date.now();
    const d = await api('GET', '/visits');
    L.visits = d.items;
    d.items.forEach((v) => { if (v.client) v._c = L.upsertPerson(v.client); if (v.engineer) v._e = L.upsertPerson(v.engineer); });
    // میز کار مهندس: بازدیدهای تأییدشدهٔ امروز
    if (typeof EVIS !== 'undefined') {
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }).format(new Date());
      const mine = d.items.filter((v) => v.as === 'engineer' && v.day === today && (v.status === 'confirmed' || v.status === 'done')).sort((a, b) => hourOf(a.slot) - hourOf(b.slot));
      setArr(EVIS, mine.map((v) => ({ h: hourOf(v.slot), d: durOf(v.duration), place: (v.client && v.client.city) || '—', t: v.typeName, pid: v._c, k: /آرماتور/.test(v.typeName) ? 'rebar' : /قالب/.test(v.typeName) ? 'form' : /ترک|نشست|پی/.test(v.typeName) ? 'fnd' : 'meet', _id: v.id })));
      S.visDone = {};
      mine.forEach((v, i) => { if (v.status === 'done') S.visDone[i] = 1; });
    }
  }
  L.loadVisits = loadVisits;
  const hourOf = (slot) => +String(slot).replace(/[۰-۹]/g, (x) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(x)).split(':')[0];
  const durOf = (t) => +String(t || '1').replace(/[۰-۹]/g, (x) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(x)).replace('٫', '.').replace(/[^\d.]/g, '') || 1;

  wrap('openVisit', function (prev, pid) {
    const p = P[pid];
    if (!L.on || !p || !p.code) return prev(pid);
    api('GET', '/visits/slots/' + encodeURIComponent(p.code))
      .then((d) => { L.vs = Object.assign(d, { pid }); prev(pid); if (S.auth) loadVisits().then(() => { if (S.cur === 'visit') renderVisit(true); }).catch(() => {}); })
      .catch(err);
  });
  wrap('renderVisit', function (prev, soft) {
    const v = S.visit;
    if (!L.on || !L.vs || L.vs.pid !== v.pid) return prev(soft);
    const p = P[v.pid], ty = VTYPE[v.t] || VTYPE[0], D = L.vs.days, ok = v.d >= 0 && v.s >= 0 && D[v.d];
    const taken = (d, s) => !!D[d] && D[d].taken.includes(VSLOT[s]);
    const full = (d) => VSLOT.every((_, s) => taken(d, s));
    const mine = (L.visits || []).filter((x) => x.as === 'client' && x.engineer && x.engineer.code === p.code);
    $('s-visit').innerHTML = `${pageBar('رزرو بازدید کارگاه')}
  <div class="hcard vis-hero">${hexA(p)}<div style="flex:1;min-width:0"><small>بازدید حضوری</small><h2>${esc(p.name)}</h2><p>${esc(p.title || '')}</p></div>
    <div class="road" aria-hidden="true"><svg viewBox="0 0 120 50"><path d="M4 40 C30 40 40 12 70 16 S104 34 114 14" class="rd"/><g class="car"><rect x="-8" y="-5" width="16" height="8" rx="3" fill="var(--gold)"/><circle cx="-4" cy="4" r="2" fill="#fff"/><circle cx="4" cy="4" r="2" fill="#fff"/></g><path d="M114 4a5 5 0 0 1 5 5c0 4-5 9-5 9s-5-5-5-9a5 5 0 0 1 5-5z" fill="var(--accent-2,#2DD4BF)"/></svg></div></div>
  <div class="section"><span class="label" style="margin-top:0">نوع بازدید</span><div class="vtypes">${VTYPE.map((x, k) => `<button aria-pressed="${v.t === k}" onclick="vPick('t',${k})"><b>${esc(x[0])}</b><span class="num">${esc(x[1])} · ${fa((x[2] / 1e6).toFixed(1).replace(/\.0$/, ''))} میلیون</span></button>`).join('')}</div>
  <span class="label">روز (هفتهٔ پیش رو)</span><div class="vdays">${D.map((d, i) => { const st = !d.open ? 'o' : full(i) ? 'b' : 'a'; return `<button ${st !== 'a' ? 'disabled' : ''} aria-pressed="${v.d === i}" onclick="vPick('d',${i})"><small>${DAYF[d.weekday].slice(0, 3)}</small><b class="num">${faDM(d.day, { day: 'numeric' })}</b><i class="${st}"></i></button>`; }).join('')}</div>
  <div class="vleg"><span><i class="a"></i>آزاد</span><span><i class="b"></i>پر</span><span><i class="o"></i>تعطیل</span></div>
  ${v.d >= 0 ? `<span class="label">ساعت</span><div class="vslots">${VSLOT.map((s, k) => `<button ${taken(v.d, k) ? 'disabled' : ''} aria-pressed="${v.s === k}" onclick="vPick('s',${k})" class="num">${s}${taken(v.d, k) ? '<small>رزرو شده</small>' : ''}</button>`).join('')}</div>` : ''}
  <span class="label">نشانی کارگاه</span><textarea class="field" id="vAddr" rows="2" placeholder="مثلاً درگهان، بلوار ساحلی، کوچهٔ ۱۲، ویلای در حال ساخت" oninput="S.visit.addr=this.value">${esc(v.addr)}</textarea></div>
  <div class="section"><div class="card vsum ${ok ? 'ready' : ''}"><div class="ticket"><div><small>بازدید</small><b>${esc(ty[0])}</b></div><div><small>زمان</small><b class="num">${ok ? esc(D[v.d].label) + ' · ' + VSLOT[v.s] : 'انتخاب نشده'}</b></div><div><small>هزینه</small><b class="num">${fa((ty[2] / 1e6).toFixed(1).replace(/\.0$/, ''))} میلیون تومان</b></div></div>
    <p class="est-note" style="margin:10px 0 0">هزینه بعد از بازدید و دریافت گزارش مکتوب مستقیم به مهندس پرداخت می‌شود. تا ۱۲ ساعت قبل، لغو رایگان است.</p>
    <button class="cta" ${ok ? '' : 'disabled'} onclick="gate('visit',vConfirm)">${ok ? 'رزرو بازدید' : 'روز و ساعت را انتخاب کن'}</button></div></div>
  ${mine.length ? `<div class="section"><div class="sec-head"><h3>بازدیدهای من با ${esc(p.name)}</h3></div><div class="card">${mine.map((x) => `<div class="need"><span class="nt-ic">${QI.cal}</span><div style="flex:1"><b style="display:block">${esc(x.typeName)}</b><span class="num" style="font-size:13px;color:var(--muted)">${esc(x.dayLabel)} · ${esc(x.slot)}${x.report ? ' · ' + esc(x.report.slice(0, 60)) : ''}</span></div><span class="tag ${VST[x.status][1]}">${VST[x.status][0]}</span>${['requested', 'confirmed'].includes(x.status) ? `<button class="mini" onclick="LIVE.cancelVisit('${x.id}')">لغو</button>` : ''}</div>`).join('')}</div></div>` : ''}`;
    if (soft) $('s-visit').querySelectorAll('.car').forEach((n) => (n.style.animationPlayState = 'running'));
  });
  wrap('vConfirm', function (prev) {
    const v = S.visit, p = P[v.pid];
    if (!L.on || !L.vs || L.vs.pid !== v.pid) return prev();
    const addr = String(v.addr || '').trim();
    if (addr.length < 5) { toast('نشانی کارگاه را کامل بنویس'); $('vAddr') && $('vAddr').focus(); return; }
    api('POST', '/visits', { engineerCode: p.code, type: v.t, day: L.vs.days[v.d].day, slot: VSLOT[v.s], address: addr })
      .then((d) => {
        v.d = -1; v.s = -1;
        return Promise.all([api('GET', '/visits/slots/' + encodeURIComponent(p.code)).then((x) => { L.vs = Object.assign(x, { pid: v.pid }); }), loadVisits()]).then(() => d);
      })
      .then((d) => {
        renderVisit();
        L.loaded.req = 0;
        L.visitDone();
      })
      .catch(err);
  });
  L.cancelVisit = (id) => api('POST', '/visits/' + id + '/cancel').then(() => Promise.all([loadVisits(), L.vs ? api('GET', '/visits/slots/' + encodeURIComponent(P[L.vs.pid].code)).then((x) => { L.vs = Object.assign(x, { pid: L.vs.pid }); }) : null])).then(() => { toast('بازدید لغو شد'); if (S.cur === 'visit') renderVisit(true); L.loaded.req = 0; }).catch(err);

  // میز کار مهندس: بازدیدهای امروز و ثبت گزارش
  wrap('renderHome', function (prev) {
    prev();
    if (on() && S.role === 'engineer' && !fresh('visits', 60000)) loadVisits().then(() => { if (S.cur === 'home') prev(); }).catch(() => {});
  });
  if (typeof window.homeEngineer === 'function') {
    const he0 = window.homeEngineer;
    window.homeEngineer = function () { return he0().replace('stroke-dasharray="NaN 100"', 'stroke-dasharray="0 100"'); };
  }
  wrap('engVisitDone', function (prev, i) {
    const v = typeof EVIS !== 'undefined' && EVIS[i];
    if (!on() || !v || !v._id) return prev(i);
    const items = ECHK[v.k] || [], sel = (S._ev && S._ev.sel) || {};
    const checklist = items.map((item, k) => ({ item, ok: !!sel[k] }));
    const n = checklist.filter((x) => x.ok).length;
    api('POST', '/visits/' + v._id + '/done', { checklist, report: `بازدید «${v.t}» انجام شد؛ ${fa(n)} از ${fa(items.length)} مورد کنترل و تأیید شد.` })
      .then(() => { prev(i); L.loaded.visits = 0; })
      .catch(err);
  });

  /* =================================================================
   * بخش ۵: راهنمایی کاربر و فرم‌ها — شهر مثل استان، سال تولد، قدم‌های بالا بردن امتیاز،
   *        راهنمای قرارداد، نشان قرمز مدارک ناقص، پیش‌بارگذاری بعد از ورود
   * ================================================================= */
  const jy = () => +new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', { year: 'numeric' }).format(new Date()).replace(/\D/g, '');
  const ageOf = (by) => { const y = +String(by || '').replace(/[۰-۹]/g, (x) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(x)).replace(/\D/g, ''); return y > 1300 && y < jy() ? fa(jy() - y) + ' سال' : null; };
  L.ageOf = ageOf;

  // سال تولد در مرحلهٔ «اطلاعات پایه» (اختیاری؛ سن روی شناسنامهٔ کاری)
  try {
    Object.values(REG).forEach((steps) => steps.forEach((st) => {
      const i = st.f.findIndex((f) => f.k === 'prov');
      if (i > -1 && st.f.some((f) => f.k === 'ln') && !st.f.some((f) => f.k === 'by')) st.f.splice(i, 0, { k: 'by', t: 'text', label: 'سال تولد (اختیاری)', ph: 'مثلاً ۱۳۶۵', dir: 'ltr', hint: 'سنت روی شناسنامهٔ کاری نمایش داده می‌شود' });
    }));
  } catch (e) { console.warn(e); }
  wrap('ME', function (prev) {
    const m = prev();
    const a = S.profile && S.profile.d && ageOf(S.profile.d.by);
    if (m && a) m.age = a;
    // عکس پروفایل خودم (همه‌جای اپ)
    if (m && L.pub && L.pub.avatarUrl) m.avatar = L.abs(L.pub.avatarUrl);
    return m;
  });

  // شهر: فهرست کشویی مثل استان (+ «شهر دیگر» برای نوشتن)
  wrap('fieldHTML', function (prev, f, d) {
    if (f.t !== 'city') return prev(f, d);
    const pr = d.prov, Lc = pr ? PCITY[pr] || [] : [], cur = d.city, other = !!cur && !Lc.includes(cur);
    const lab = `<span class="label">${f.label}</span>`;
    if (!pr) return lab + '<p class="hint" style="margin:0">اول استان را انتخاب کن؛ شهرهای همان استان این‌جا می‌آید.</p>';
    const sel = other || d._cityOther ? '__o' : cur || '';
    return lab + `<select class="field" id="rf_city" onchange="if(this.value==='__o'){S.reg.d._cityOther=1;S.reg.d.city=undefined}else{S.reg.d._cityOther=0;S.reg.d.city=this.value||undefined}renderRegStep()"><option value="">انتخاب شهر</option>${Lc.map((c) => `<option ${sel === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}<option value="__o" ${sel === '__o' ? 'selected' : ''}>شهر یا روستای دیگر…</option></select>` +
      (sel === '__o' ? `<div class="xadd" style="margin-top:8px"><input class="field" id="rf_cityx" placeholder="نام شهر یا روستا را بنویس" value="${other ? esc(cur) : ''}" oninput="S.reg.d.city=this.value.trim();updRegBtn()"></div>` : '');
  });

  // امتیاز بلوک: قدم‌های عملی برای خود کاربر
  L.trustSteps = () => (on() ? trustSteps() : []);
  function trustSteps() {
    const me = L.me && L.me.user, pub = L.pub || {}, t = pub.trust || {};
    const miss = missingDocs();
    const steps = [];
    if (me && me.kycStatus !== 'verified') steps.push([me.kycStatus === 'pending' ? 'تأیید هویتت در حال بررسی است' : 'هویتت را تأیید کن (کارت ملی + سلفی)', me.kycStatus === 'pending' ? 'تا ۲۴ ساعت' : '+۱۰ امتیاز و نشان آبی', me.kycStatus === 'pending' ? '' : 'openKYC()']);
    if (miss.length) steps.push(['مدارک لازم را بارگذاری کن: ' + miss.join('، '), 'نشان «مدرک‌دار» و اعتماد کارفرما', "go('docs')"]);
    if (!(pub.portfolio || []).length) steps.push(['یک نمونه‌کار با عکس واقعی اضافه کن', 'پروفایلت کامل‌تر و در کاوش بالاتر دیده می‌شوی', "go('pf')"]);
    if (!(pub.guarantors || []).length) steps.push(['یک معرف (قیم) معرفی کن', 'کسی که کارت را دیده، اعتبارت را تأیید می‌کند', typeof openAddGuar === 'function' ? 'openAddGuar()' : "openTrust('me',true)"]);
    if ((t.projects || 0) < 25) steps.push(['پروژه‌ها را داخل بلوک ثبت و تمام کن', 'هر پروژهٔ تمام‌شده +۱ (تا ۲۵)', "go('proj')"]);
    if ((t.reviews || 0) < 10) steps.push(['بعد از پایان هر کار، از طرف مقابل بخواه امتیاز بدهد', 'هر ۲ نظر +۱ (تا ۱۰) و امتیاز رضایت تا ۵۵', "go('proj')"]);
    return steps;
  }
  wrap('renderTrust', function (prev) {
    prev();
    if (!on() || S.tid !== 'me') return;
    const steps = trustSteps(), host = document.getElementById('s-trust');
    if (!host || !steps.length) return;
    const t = (L.pub && L.pub.trust) || {};
    const row = (s, i) => `<div class="tstep ${s[2] ? '' : 'off'}" ${s[2] ? `role="button" tabindex="0" onclick="${s[2]}"` : ''}><span class="n num">${fa(i + 1)}</span><span class="t"><b>${esc(s[0])}</b><small>${esc(s[1])}</small></span>${s[2] ? '<span class="go">‹</span>' : ''}</div>`;
    const more = steps.length > 3 ? `<div id="blkStepsMore" hidden>${steps.slice(3).map((s, i) => row(s, i + 3)).join('')}</div><button class="tsteps-more" onclick="const m=document.getElementById('blkStepsMore');m.hidden=!m.hidden;this.textContent=m.hidden?'همهٔ قدم‌ها (${fa(steps.length)})':'کمتر'">همهٔ قدم‌ها (${fa(steps.length)})</button>` : '';
    const html = `<div class="section" id="blkSteps"><div class="sec-head"><h3>قدم بعدی برای امتیاز بیشتر</h3><span class="num">${fa(t.total || 0)} از ۱۰۰</span></div><div class="card">${steps.slice(0, 3).map(row).join('')}${more}</div></div>`;
    const first = host.querySelector('.section');
    if (first) first.insertAdjacentHTML('beforebegin', html); else host.insertAdjacentHTML('beforeend', html);
  });

  // مدارک ناقص: نشان قرمز (مثل تنظیمات آیفون) روی «مدارک من»، دکمهٔ «من» و فهرست بالای صفحهٔ مدارک
  function missingDocs() {
    const need = (DOCS[S.role] || []).filter((x) => x[2]).map((x) => x[0]);
    const have = S.docs[S.role];
    if (!have) return [];
    return need.filter((n) => { const d = have.find((x) => x.n === n); return !d || d.st === 'none'; });
  }
  function redBadge(n) { return `<i class="blk-red" style="display:inline-grid;place-items:center;min-width:18px;height:18px;padding:0 5px;margin-inline-start:6px;border-radius:9px;background:#EF4444;color:#fff;font:700 12px/1 inherit;font-style:normal">${fa(n)}</i>`; }
  function paintDocBadges() {
    if (!on()) return;
    const n = missingDocs().length;
    document.querySelectorAll('.blk-red').forEach((x) => x.remove());
    const nav = document.querySelector('.nav [data-go="me"]');
    if (nav) { nav.style.position = 'relative'; if (n) nav.insertAdjacentHTML('beforeend', '<i class="blk-red" style="position:absolute;top:4px;right:calc(50% - 16px);width:9px;height:9px;border-radius:50%;background:#EF4444"></i>'); }
    if (!n) return;
    const b = document.querySelector('button[onclick="go(\'docs\')"]');
    if (b) b.insertAdjacentHTML('beforeend', redBadge(n));
  }
  wrap('renderMe', function (prev) {
    prev();
    if (!on()) return;
    if (!S.docs[S.role] && L.loadDocs) L.loadDocs().then(paintDocBadges).catch(() => {});
    paintDocBadges();
  });
  wrap('renderDocs', function (prev) {
    prev();
    if (!on()) return;
    const miss = missingDocs(), host = document.getElementById('s-docs');
    if (!host || !miss.length || host.querySelector('#blkDocNeed')) return;
    const bar = host.querySelector('.section') || host.firstElementChild;
    const html = `<div class="section" id="blkDocNeed"><div class="card" style="border:1px solid #EF4444"><b style="display:flex;align-items:center;gap:6px">برای تکمیل پروفایل ${redBadge(miss.length)}</b><p style="margin:6px 0 0;font-size:14px;color:var(--muted)">این مدارک لازم است: <b style="color:var(--ink)">${miss.map(esc).join('، ')}</b>. روی هر ردیف پایین بزن و عکس یا PDF خوانا بفرست؛ بررسی معمولاً کمتر از ۲۴ ساعت است.</p></div></div>`;
    if (bar) bar.insertAdjacentHTML('afterend', html); else host.insertAdjacentHTML('afterbegin', html);
  });

  // راهنمای قرارداد: در «راهنما» و وقتی هنوز پروژه‌ای نیست
  const CTR_STEPS = [
    'در گفت‌وگوی آگهی یا پروفایل، دکمهٔ «پیشنهاد توافق» را بزن: کار، مقدار، مبلغ، روز شروع و مراحل پرداخت را بنویس.',
    'طرف مقابل پیشنهاد را تأیید کند؛ پروژه خودکار در «پروژه‌های من» ساخته می‌شود.',
    'در صفحهٔ پروژه، «قرارداد» را باز کن؛ متن قرارداد از همان توافق ساخته شده (با مادهٔ داوری).',
    'هر دو طرف با کد پیامکی امضا می‌کنند؛ قرارداد فعال و نسخهٔ چاپی آماده می‌شود. هر تغییر = نسخهٔ تازه و امضای دوباره.',
  ];
  const ctrGuideHTML = () => `<ol style="margin:6px 0 0;padding-inline-start:20px;font-size:14px;line-height:1.9">${CTR_STEPS.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>`;
  L.ctrGuide = () => { sb.innerHTML = `<div class="grab"></div><h3 id="sheetTitle">قرارداد را چطور تنظیم کنم؟</h3>${ctrGuideHTML()}<button class="cta" onclick="closeSheet()">فهمیدم</button>`; show(); };
  wrap('openHelp', function (prev) {
    prev();
    const box = document.querySelector('#sb .faq');
    if (box && !document.getElementById('blkCtrQ')) box.insertAdjacentHTML('beforebegin', `<details class="faq" id="blkCtrQ"><summary>قرارداد را چطور تنظیم کنم؟</summary>${ctrGuideHTML()}</details>`);
  });
  wrap('renderProj', function (prev) {
    prev();
    const host = document.getElementById('s-proj');
    if (!host || host.querySelector('#blkCtrHelp')) return;
    const none = !(S.projs && S.projs[S.role] && S.projs[S.role].length);
    const html = `<div class="section" id="blkCtrHelp"><div class="card"><b>${none ? 'هنوز پروژه‌ای نداری' : 'راهنمای قرارداد'}</b>${none ? ctrGuideHTML() : `<p style="margin:6px 0 0;font-size:14px;color:var(--muted)">قرارداد هر پروژه از توافق داخل چت ساخته و با کد پیامکی امضا می‌شود.</p><button class="ghost" style="margin-top:8px" onclick="LIVE.ctrGuide()">مراحل تنظیم قرارداد</button>`}</div></div>`;
    host.insertAdjacentHTML(none ? 'beforeend' : 'beforeend', html);
  });

  // بعد از ورود: داده‌های پرکاربرد در پس‌زمینه گرفته شود تا صفحه‌ها فوری باز شوند
  wrap('renderHome', function (prev) {
    prev();
    if (!on() || L._prefetched === (L.me && L.me.user && L.me.user.id)) return;
    L._prefetched = L.me && L.me.user && L.me.user.id;
    setTimeout(() => [L.loadDocs, L.loadVisits].forEach((f) => { if (typeof f === 'function') f().catch(() => {}); }), 400);
  });

  /* =================================================================
   * بخش ۶: پروفایل و شناسنامهٔ کاری در یک صفحه (دو زبانه)، نوار بالای ثابت، کشیدن از لبه برای برگشت
   *        (بدون سرور هم کار می‌کند)
   * ================================================================= */
  (function injectCss() {
    const st = document.createElement('style');
    st.textContent = `
      /* نوار عنوان هر صفحه هنگام اسکرول بالا می‌ماند؛ دکمهٔ برگشت همیشه در دسترس */
      .bar{position:sticky;top:0;z-index:30;background:color-mix(in srgb,var(--bg) 86%,transparent);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);padding-bottom:10px;transition:box-shadow .2s}
      .bar.stuck{box-shadow:0 1px 0 var(--line),0 6px 16px rgba(0,0,0,.05)}
      /* نوارهای «امتیاز از کجا آمده؟» (قانون نمودار ستونی .bars رویشان افتاده بود) */
      .brk .bars{display:block;height:10px;padding-top:0;margin-top:6px}
      .brk .bars i{max-width:none;height:100%;width:0;border-radius:7px;animation:none;transform:none}
      /* قدم‌های بالا بردن امتیاز: هم‌شکل فهرست‌های اپ */
      .tstep{display:flex;align-items:center;gap:12px;padding:12px 0;border-top:1px solid var(--line);cursor:pointer}
      .tstep:first-child{border-top:0;padding-top:4px}
      .tstep .n{flex:none;width:28px;height:28px;border-radius:10px;display:grid;place-items:center;background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent);font-weight:800;font-size:13px}
      .tstep .t{flex:1;min-width:0}
      .tstep .t b{display:block;font-size:14.5px;line-height:1.5}
      .tstep .t small{display:block;font-size:12.5px;color:var(--muted);margin-top:2px}
      .tstep .go{flex:none;color:var(--muted);font-size:18px;line-height:1}
      .tstep.off{cursor:default;opacity:.7}
      .tsteps-more{display:block;width:100%;border:0;background:none;color:var(--accent);font:700 13.5px inherit;padding:10px 0 2px;cursor:pointer}
      .pv-tabs{margin:4px 16px 0}
      /* نشانگر کشیدن برای برگشت */
      #blkSwipe{position:fixed;top:50%;width:40px;height:40px;margin-top:-20px;border-radius:50%;background:var(--surface,#fff);box-shadow:0 4px 14px rgba(0,0,0,.18);display:grid;place-items:center;z-index:9997;opacity:0;pointer-events:none;transition:opacity .15s;color:var(--ink,#111)}
    `;
    document.head.appendChild(st);
  })();

  // سایهٔ نوار وقتی صفحه اسکرول شده
  addEventListener('scroll', () => {
    const b = document.querySelector('.screen.on .bar, section.on .bar') || [...document.querySelectorAll('.bar')].find((x) => x.offsetParent);
    document.querySelectorAll('.bar.stuck').forEach((x) => x !== b && x.classList.remove('stuck'));
    if (b) b.classList.toggle('stuck', scrollY > 8);
  }, { passive: true });

  // کشیدن انگشت از لبهٔ راست یا چپ صفحه به سمت وسط = برگشت (مثل آیفون)
  (function swipeBack() {
    let x0 = 0, y0 = 0, edge = 0, active = false;
    const ind = document.createElement('div');
    ind.id = 'blkSwipe';
    ind.setAttribute('aria-hidden', 'true');
    ind.innerHTML = (typeof I === 'object' && I.back) || '‹';
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(ind));
    if (document.body) document.body.appendChild(ind);
    const canBack = () => S.hist && S.hist.length && !document.querySelector('.sheet.on, #sb.on, .sv.on');
    addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      edge = t.clientX > innerWidth - 24 ? 1 : t.clientX < 24 ? -1 : 0;
      active = !!edge && canBack();
      x0 = t.clientX; y0 = t.clientY;
    }, { passive: true });
    addEventListener('touchmove', (e) => {
      if (!active) return;
      const t = e.touches[0], dx = (x0 - t.clientX) * edge, dy = Math.abs(t.clientY - y0);
      if (dy > 60 && dy > dx) { active = false; ind.style.opacity = '0'; return; }
      const p = Math.max(0, Math.min(1, dx / 90));
      ind.style.opacity = String(p);
      ind.style.top = t.clientY + 'px';
      ind.style.right = edge === 1 ? 8 + p * 20 + 'px' : 'auto';
      ind.style.left = edge === -1 ? 8 + p * 20 + 'px' : 'auto';
      ind.style.transform = edge === -1 ? 'scaleX(-1)' : '';
    }, { passive: true });
    addEventListener('touchend', (e) => {
      if (!active) return;
      active = false;
      const t = e.changedTouches[0], dx = (x0 - t.clientX) * edge;
      ind.style.opacity = '0';
      if (dx > 80 && canBack()) back();
    }, { passive: true });
  })();

  /* ---------- پروفایل + شناسنامه: یک صفحه (flow.js)؛ صفحهٔ قدیمی «trust» به همان پروفایل می‌رود ---------- */
  wrap('go', function (prev, name, noPush) {
    if (name === 'trust') { S.pid = S.tid; S.ptab = 0; S._openScore = true; return prev('profile', noPush); }
    return prev(name, noPush);
  });

  /* ---------- کاوش: آگهی خود کاربر همیشه پیدا شود ---------- */
  // هر نقش پیش‌فرض «طرف مقابل» را می‌بیند (کارگر ← پیدا کردن کار)؛ آگهی خودت در زبانهٔ دیگر است
  wrap('listFor', function (prev, ignoreRole) {
    const seen = new Set();
    return prev(ignoreRole).filter((x) => (seen.has(x.a.id) ? false : seen.add(x.a.id)));
  });
  wrap('renderResults', function (prev, first) {
    prev(first);
    if (!on()) return;
    if (!fresh('myads:' + S.role, 60000)) { loadMyAds().then(() => { if (S.cur === 'explore') renderResults(); }).catch(() => {}); return; }
    const t = modeType(), el = document.getElementById('results');
    const mine = ADS.filter((a) => a.who === 'me' && (!a.st || a.st === 'active'));
    if (!el || !mine.length || el.querySelector('#blkMyAds')) return;
    // آگهی‌های خودم در فهرست کاوش نمی‌آیند؛ فقط این ردیف که به «آگهی‌های من» می‌برد
    el.insertAdjacentHTML('afterbegin', `<div class="section" id="blkMyAds"><div class="tstep" role="button" tabindex="0" onclick="go('myads')" style="background:var(--surface);border-radius:16px;padding:12px 14px;box-shadow:var(--shadow)"><span class="n num">${fa(mine.length)}</span><span class="t"><b>${mine.length > 1 ? fa(mine.length) + ' آگهی فعال داری' : 'آگهی تو «' + esc(mine[0].title) + '» فعال است'}</b><small>آگهی‌های خودت در کاوش نمی‌آیند؛ در «آگهی‌های من» ببین</small></span><span class="go">‹</span></div></div>`);
  });

  /* =================================================================
   * بخش ۷: چت روی گوشی — پیام صوتی واقعی، بدون ذره‌بین روی دکمه، کادر نوشتن چسبیده به کیبورد،
   *        سربرگ ثابت (نام و مرحله) و فقط فهرست پیام‌ها اسکرول می‌شود
   * ================================================================= */
  (function chatCss() {
    const st = document.createElement('style');
    st.textContent = `
      /* نگه داشتن دکمهٔ صدا: بدون ذره‌بین، انتخاب متن و منوی لمس طولانی */
      #s-chat .composer, #s-chat .composer *:not(textarea), #s-chat .voice, #s-chat .voice *{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
      #s-chat .snd{touch-action:none}
      @media (max-width:799px){
        body.blk-chat{overflow:hidden;overscroll-behavior:none}
        body.blk-chat .nav{display:none!important}
        /* صفحهٔ چت = ارتفاع قسمت دیده‌شده (بالای کیبورد)؛ سربرگ و کادر نوشتن ثابت، فقط پیام‌ها اسکرول */
        body.blk-chat #s-chat{position:fixed;left:0;right:0;top:var(--vvt,0px);height:var(--vvh,100dvh);display:flex;flex-direction:column;z-index:25;background:var(--bg);overflow:hidden}
        body.blk-chat #s-chat .chat-top{position:relative;top:0;flex:none;padding-top:calc(8px + env(safe-area-inset-top,0px))}
        body.blk-chat #s-chat .ctxbar{position:relative;top:0;flex:none;margin-bottom:6px}
        body.blk-chat #s-chat .msgs{flex:1 1 auto;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding-bottom:12px}
        body.blk-chat #s-chat .composer{position:relative;flex:none;bottom:auto;left:auto;right:auto;background:var(--bg);padding:6px 12px calc(8px + env(safe-area-inset-bottom,0px))}
        body.blk-chat.blk-kb #s-chat .composer{padding-bottom:6px}
        body.blk-chat.blk-kb #s-chat .qr{display:none}
      }`;
    document.head.appendChild(st);
  })();
  const isChat = () => S.cur === 'chat' && innerWidth < 800;
  // ارتفاع و جای قسمت دیده‌شدهٔ صفحه (آیفون موقع باز شدن کیبورد صفحه را جابه‌جا می‌کند)
  function vvSync() {
    const vv = window.visualViewport;
    const h = vv ? vv.height : innerHeight, t = vv ? vv.offsetTop : 0;
    document.documentElement.style.setProperty('--vvh', h + 'px');
    document.documentElement.style.setProperty('--vvt', t + 'px');
    document.body.classList.toggle('blk-kb', !!vv && h < innerHeight * 0.8);
  }
  function syncChatMode() {
    document.body.classList.toggle('blk-chat', isChat());
    vvSync();
  }
  if (window.visualViewport) {
    let wasBottom = true;
    const msgsEl = () => document.getElementById('msgs');
    visualViewport.addEventListener('resize', () => {
      const el = msgsEl();
      if (el && isChat()) wasBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      vvSync();
      // کیبورد باز شد: آخرین پیام درست بالای کادر نوشتن دیده شود
      if (el && isChat() && wasBottom) requestAnimationFrame(() => (el.scrollTop = el.scrollHeight));
    });
    visualViewport.addEventListener('scroll', vvSync);
  }
  addEventListener('resize', syncChatMode);
  wrap('go', function (prev, name, noPush) { const r = prev(name, noPush); syncChatMode(); return r; });
  wrap('renderChat', function (prev) { const r = prev(); syncChatMode(); return r; });
  // در حالت چت، فهرست پیام‌ها اسکرول می‌شود نه خود صفحه
  wrap('scrollEnd', function (prev, inst) {
    const el = document.getElementById('msgs');
    if (!isChat() || !el) return prev(inst);
    requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior: inst || reduce ? 'auto' : 'smooth' }));
  });
  document.addEventListener('contextmenu', (e) => { if (e.target.closest && e.target.closest('#s-chat .composer, #s-chat .voice')) e.preventDefault(); });

  /* ---------- ضبط و پخش صدای واقعی ---------- */
  const rec = { state: null, mr: null, chunks: [], stream: null, t0: 0 };
  const pickMime = () => (window.MediaRecorder && ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm'].find((t) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t))) || '';
  const liveConv = () => { const c = S.convs.find((x) => x.id === S.cid); return L.on && c && c._live ? c : null; };
  wrap('startRec', function (prev) {
    if (!liveConv()) return prev();
    if (!navigator.mediaDevices || !window.MediaRecorder) { toast('این مرورگر ضبط صدا ندارد؛ پیام بنویس'); return; }
    prev();
    rec.state = 'starting'; rec.chunks = []; rec.t0 = Date.now();
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).then((stream) => {
      if (rec.state !== 'starting') { stream.getTracks().forEach((t) => t.stop()); return; }
      const mime = pickMime();
      rec.stream = stream;
      rec.mr = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : undefined);
      rec.mr.ondataavailable = (e) => { if (e.data && e.data.size) rec.chunks.push(e.data); };
      rec.mr.start();
      rec.state = 'rec'; rec.t0 = Date.now();
    }).catch(() => {
      rec.state = null;
      try { stopRec(false); } catch (e) {}
      toast('برای پیام صوتی، به بلوک اجازهٔ میکروفون بده');
    });
  });
  wrap('stopRec', function (prev, send) {
    if (!liveConv() || !rec.state) return prev(send);
    const was = rec.state;
    rec.state = null;
    const done = () => { if (rec.stream) rec.stream.getTracks().forEach((t) => t.stop()); rec.stream = null; rec.mr = null; };
    if (was === 'starting') { done(); prev(false); if (send) toast('اجازهٔ میکروفون داده شد؛ دوباره دکمه را نگه دار'); return; }
    const dur = Math.max(1, Math.round((Date.now() - rec.t0) / 1000));
    const mr = rec.mr;
    mr.onstop = () => {
      const blob = new Blob(rec.chunks, { type: (mr.mimeType || 'audio/webm').split(';')[0] });
      done();
      if (!send) { prev(false); return; }
      if (blob.size < 500) { prev(false); toast('صدا خیلی کوتاه بود'); return; }
      L._voiceBlob = blob;
      prev(true); // پیام را در صفحه می‌گذارد و live.js آن را آپلود می‌کند
      const c = liveConv(), m = c && [...c.msgs].reverse().find((x) => x.me && x.k === 'voice');
      if (m) { m.dur = dur; if (!m.src) m.src = URL.createObjectURL(blob); }
    };
    try { mr.stop(); } catch (e) { done(); prev(false); }
  });
  let audio = null, audioI = null;
  wrap('playVoice', function (prev, i) {
    const c = S.convs.find((x) => x.id === S.cid), m = c && c.msgs[i];
    if (!m || !m.src) return prev(i);
    const btn = document.getElementById('pl' + i), wf = document.getElementById('wf' + i), bars = wf ? [...wf.children] : [], tEl = document.getElementById('vt' + i);
    const reset = () => { clearInterval(audioI); bars.forEach((b) => b.classList.remove('on')); if (btn) btn.innerHTML = MI.play; if (tEl) tEl.textContent = fa('0:' + String(m.dur || 0).padStart(2, '0')); };
    if (audio && audio._i === i && !audio.paused) { audio.pause(); reset(); return; }
    if (audio) { audio.pause(); const ob = document.getElementById('pl' + audio._i); if (ob) ob.innerHTML = MI.play; clearInterval(audioI); }
    audio = new Audio(m.src); audio._i = i;
    audio.onended = reset;
    audio.play().then(() => {
      if (btn) btn.innerHTML = MI.pause;
      audioI = setInterval(() => {
        const d = audio.duration && isFinite(audio.duration) ? audio.duration : m.dur || 1;
        const k = Math.round((audio.currentTime / d) * bars.length);
        bars.forEach((b, j) => b.classList.toggle('on', j < k));
        if (tEl) tEl.textContent = fa('0:' + String(Math.round(audio.currentTime)).padStart(2, '0'));
      }, 120);
    }).catch(() => { reset(); toast('پخش نشد؛ دوباره امتحان کن'); });
  });

  /* ---------- «تازه‌های بلوک» بعد از هر به‌روزرسانی (هنگام ورود، حداکثر ۲ بار، بعد دیگر هرگز) ---------- */
  const WN_MAX = 2;
  let wnShownThisSession = false;
  const wnKey = (v) => 'blk-wn:' + v;
  function maybeWhatsNew() {
    const w = L.cfg && L.cfg.whatsNew;
    if (!on() || wnShownThisSession || !w || !w.items || !w.items.length) return;
    if (S.cur !== 'home' || document.querySelector('#sheet.on')) return;
    let n = 0;
    try { n = +(localStorage.getItem(wnKey(w.v)) || 0); } catch (e) { return; }
    if (n >= WN_MAX) return;
    wnShownThisSession = true;
    try { localStorage.setItem(wnKey(w.v), String(n + 1)); } catch (e) {}
    sb.innerHTML = `<div class="grab"></div><h3 id="sheetTitle">${esc(w.title || 'تازه‌های بلوک')}</h3><p class="sub">این به‌روزرسانی چه چیزهایی آورد و چطور از آن استفاده کنی</p>
      <div class="card" style="box-shadow:none;background:var(--bg);padding:6px 14px">${w.items.map((x, i) => `<div class="tstep" style="cursor:default"><span class="n num">${fa(i + 1)}</span><span class="t"><b>${esc(x.t)}</b>${x.d ? `<small>${esc(x.d)}</small>` : ''}</span></div>`).join('')}</div>
      <button class="cta" onclick="closeSheet()">فهمیدم</button>`;
    show();
  }
  L.whatsNew = maybeWhatsNew;
  wrap('renderHome', function (prev) {
    prev();
    setTimeout(maybeWhatsNew, 900);
    setTimeout(maybeWhatsNew, 3500);
  });
  const loadCfg0 = L.loadCfg;
  L.loadCfg = () => loadCfg0().then(() => setTimeout(maybeWhatsNew, 300));

  /* ---------- صفحهٔ آغاز (لوگو): برای کاربر واردشده کوتاه، برای بقیه کوتاه‌تر از ۳ ثانیه ---------- */
  (function shortSplash() {
    const sp = document.querySelector('.splash2');
    if (!sp) return;
    let returning = false;
    try { returning = !!localStorage.getItem('blk-tok'); } catch (e) {}
    setTimeout(() => sp.classList.add('gone'), returning ? 350 : 1600);
    setTimeout(() => sp.remove(), returning ? 900 : 2300);
  })();

  /* =================================================================
   * بخش ۸: استودیوی عکس پروفایل — قاب خط‌چین سر و شانه، دوربین جلو یا گالری، جابه‌جا و بزرگ‌نمایی،
   *        پس‌زمینهٔ محو (خود شخص واضح) تا همهٔ عکس‌های پروفایل یک‌دست شوند
   * ================================================================= */
  const AV = 720; // اندازهٔ خروجی (مربع)
  // شکل سر و شانه روی بوم ۱۰۰×۱۰۰ (همان قاب خط‌چین)
  function silhouette(ctx, s) {
    ctx.beginPath();
    ctx.ellipse(50 * s, 40 * s, 20 * s, 25 * s, 0, 0, Math.PI * 2);
    ctx.moveTo(4 * s, 100 * s);
    ctx.bezierCurveTo(4 * s, 82 * s, 22 * s, 72 * s, 40 * s, 70 * s);
    ctx.lineTo(42 * s, 62 * s); ctx.lineTo(58 * s, 62 * s); ctx.lineTo(60 * s, 70 * s);
    ctx.bezierCurveTo(78 * s, 72 * s, 96 * s, 82 * s, 96 * s, 100 * s);
    ctx.closePath();
  }
  const SIL_SVG = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"><defs><mask id="avm"><rect width="100" height="100" fill="#fff"/><ellipse cx="50" cy="40" rx="20" ry="25" fill="#000"/><path d="M4 100 C4 82 22 72 40 70 L42 62 L58 62 L60 70 C78 72 96 82 96 100 Z" fill="#000"/></mask></defs><rect width="100" height="100" fill="rgba(0,0,0,.5)" mask="url(#avm)"/><g fill="none" stroke="#fff" stroke-width="1.1" stroke-dasharray="3 2" stroke-linecap="round" style="filter:drop-shadow(0 0 1.5px rgba(0,0,0,.6))"><ellipse cx="50" cy="40" rx="20" ry="25"/><path d="M4 100 C4 82 22 72 40 70 L42 62 L58 62 L60 70 C78 72 96 82 96 100"/></g><g stroke="#fff" stroke-width=".6" opacity=".55"><line x1="50" y1="12" x2="50" y2="17"/><line x1="26" y1="40" x2="31" y2="40"/><line x1="69" y1="40" x2="74" y2="40"/></g><text x="50" y="8.5" text-anchor="middle" font-size="4.2" fill="#fff" style="font-family:inherit">صورت داخل بیضی · شانه‌ها روی خط</text></svg>`;
  const st8 = { src: null, img: null, zoom: 1, x: 0, y: 0, blur: true, stream: null, mirror: false };
  function stopCam() { if (st8.stream) st8.stream.getTracks().forEach((t) => t.stop()); st8.stream = null; }
  // تصویر در قاب: زوم و جابه‌جایی، «پوشاندن» کامل مربع
  function drawTo(ctx, size) {
    const im = st8.img; if (!im) return;
    const iw = im.videoWidth || im.naturalWidth || im.width, ih = im.videoHeight || im.naturalHeight || im.height;
    const base = Math.max(size / iw, size / ih) * st8.zoom;
    const w = iw * base, h = ih * base;
    ctx.save();
    if (st8.mirror) { ctx.translate(size, 0); ctx.scale(-1, 1); }
    ctx.drawImage(im, (size - w) / 2 + (st8.mirror ? -st8.x : st8.x), (size - h) / 2 + st8.y, w, h);
    ctx.restore();
  }
  // خروجی: پس‌زمینهٔ محو و روشن، شخص داخل قاب واضح با لبهٔ نرم
  function renderAvatar() {
    const cv = document.createElement('canvas'); cv.width = cv.height = AV;
    const ctx = cv.getContext('2d');
    drawTo(ctx, AV);
    if (!st8.blur) return cv;
    const sharp = document.createElement('canvas'); sharp.width = sharp.height = AV;
    sharp.getContext('2d').drawImage(cv, 0, 0);
    // محو کردن: کوچک و دوباره بزرگ (همه‌جا کار می‌کند، حتی آیفون قدیمی)
    const tiny = document.createElement('canvas'); tiny.width = tiny.height = 36;
    tiny.getContext('2d').drawImage(cv, 0, 0, 36, 36);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(tiny, 0, 0, AV, AV);
    ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(0, 0, AV, AV);
    // ماسک سر و شانه با لبهٔ نرم
    const m = document.createElement('canvas'); m.width = m.height = 90;
    const mc = m.getContext('2d'); mc.fillStyle = '#fff'; silhouette(mc, 0.9); mc.fill();
    const mask = document.createElement('canvas'); mask.width = mask.height = AV;
    const mk = mask.getContext('2d'); mk.imageSmoothingQuality = 'high'; mk.drawImage(m, 0, 0, AV, AV);
    const person = document.createElement('canvas'); person.width = person.height = AV;
    const pc = person.getContext('2d'); pc.drawImage(sharp, 0, 0); pc.globalCompositeOperation = 'destination-in'; pc.drawImage(mask, 0, 0);
    ctx.drawImage(person, 0, 0);
    return cv;
  }
  function paintPreview() {
    const cv = document.getElementById('avCv'); if (!cv) return;
    const ctx = cv.getContext('2d'); ctx.clearRect(0, 0, cv.width, cv.height);
    if (st8.img && !st8.live) ctx.drawImage(renderAvatar(), 0, 0, cv.width, cv.height);
  }
  function studioHTML() {
    const live = !!st8.live;
    return `<div class="grab"></div><h3 id="sheetTitle">عکس پروفایل</h3><p class="sub">سر و شانه‌ات را داخل قاب خط‌چین بگذار؛ همهٔ عکس‌ها یک‌دست و حرفه‌ای می‌شوند.</p>
      <div id="avStage" style="position:relative;width:100%;max-width:440px;aspect-ratio:1;margin:6px auto 12px;border-radius:24px;overflow:hidden;background:#0B1412;touch-action:none">
        ${live ? '<video id="avVid" playsinline autoplay muted style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scaleX(-1)"></video>' : '<canvas id="avCv" width="600" height="600" style="position:absolute;inset:0;width:100%;height:100%"></canvas>'}
        ${SIL_SVG}
        ${!st8.img && !live ? '<div style="position:absolute;inset:0;display:grid;place-items:center;color:#fff;font-size:14px;text-align:center;padding:20px">با دوربین جلو عکس بگیر<br>یا از گالری انتخاب کن</div>' : ''}
      </div>
      ${live ? `<button class="cta" onclick="LIVE.avShot()">📸 گرفتن عکس</button><button class="ghost" style="width:100%" onclick="LIVE.avCancelCam()">انصراف</button>` : `
      ${st8.img ? `<label class="label" style="margin-top:0">بزرگ‌نمایی</label><input type="range" min="1" max="3" step="0.01" value="${st8.zoom}" style="width:100%" oninput="LIVE.avZoom(this.value)">
      <p class="hint" style="margin:4px 0 8px;text-align:center">برای جابه‌جا کردن، عکس را با انگشت بکش</p>
      <button class="chip" aria-pressed="${st8.blur}" onclick="LIVE.avBlur()" style="margin:0 auto 10px;display:flex">پس‌زمینهٔ محو</button>` : ''}
      <div style="display:flex;gap:8px"><button class="ghost" style="flex:1" onclick="LIVE.avCam()">دوربین جلو</button><label class="ghost" style="flex:1;display:grid;place-items:center;cursor:pointer">گالری<input type="file" accept="image/*" hidden onchange="LIVE.avPick(this)"></label></div>
      ${st8.img ? '<button class="cta" onclick="LIVE.avSave()">ذخیرهٔ عکس پروفایل</button>' : ''}`}`;
  }
  function openStudio() {
    stopCam(); Object.assign(st8, { live: false });
    sb.innerHTML = studioHTML(); show(); bindStage(); paintPreview();
  }
  function rerenderStudio() { sb.innerHTML = studioHTML(); bindStage(); paintPreview(); }
  function bindStage() {
    const el = document.getElementById('avStage'); if (!el || st8.live) return;
    let p0 = null;
    el.onpointerdown = (e) => { if (!st8.img) return; p0 = { x: e.clientX, y: e.clientY, sx: st8.x, sy: st8.y }; el.setPointerCapture(e.pointerId); };
    el.onpointermove = (e) => { if (!p0) return; const k = AV / el.clientWidth; st8.x = p0.sx + (e.clientX - p0.x) * k; st8.y = p0.sy + (e.clientY - p0.y) * k; paintPreview(); };
    el.onpointerup = el.onpointercancel = () => (p0 = null);
  }
  Object.assign(L, {
    avZoom(v) { st8.zoom = +v; paintPreview(); },
    avBlur() { st8.blur = !st8.blur; rerenderStudio(); },
    avPick(inp) {
      const f = inp.files && inp.files[0]; if (!f) return;
      const im = new Image();
      im.onload = () => { Object.assign(st8, { img: im, zoom: 1, x: 0, y: 0, mirror: false }); rerenderStudio(); };
      im.src = URL.createObjectURL(f);
    },
    avCam() {
      if (!navigator.mediaDevices) { toast('این مرورگر دوربین ندارد؛ از گالری انتخاب کن'); return; }
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false }).then((stream) => {
        st8.stream = stream; st8.live = true; rerenderStudio();
        const v = document.getElementById('avVid'); v.srcObject = stream; v.play().catch(() => {});
      }).catch(() => toast('برای عکس گرفتن، به بلوک اجازهٔ دوربین بده'));
    },
    avCancelCam() { stopCam(); st8.live = false; rerenderStudio(); },
    avShot() {
      const v = document.getElementById('avVid'); if (!v || !v.videoWidth) return;
      const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight;
      c.getContext('2d').drawImage(v, 0, 0);
      stopCam();
      Object.assign(st8, { live: false, img: c, zoom: 1, x: 0, y: 0, mirror: true });
      rerenderStudio();
    },
    avSave() {
      const cv = renderAvatar();
      cv.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const h = document.getElementById('avH'); if (h) { h.style.background = 'url(' + url + ') center/cover'; h.textContent = ''; }
        closeSheet();
        if (!on()) { toast('عکس پروفایل عوض شد'); return; }
        const fd = new FormData(); fd.append('file', new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
        api('PUT', '/me/roles/' + S.role + '/avatar', fd).then(() => L.loadMe()).then(() => { try { render(); } catch (e) {} if (L.saveSnap) L.saveSnap(); toast('عکس پروفایل ذخیره شد'); }).catch(err);
      }, 'image/jpeg', 0.86);
    },
  });
  // دکمهٔ عکس پروفایل (صفحهٔ ویرایش) ← استودیو، به‌جای انتخاب مستقیم فایل
  document.addEventListener('click', (e) => {
    const lab = e.target.closest && e.target.closest('.avup');
    if (!lab) return;
    e.preventDefault(); e.stopPropagation();
    Object.assign(st8, { img: null, zoom: 1, x: 0, y: 0, blur: true, live: false });
    openStudio();
  }, true);
  wrap('closeSheet', function (prev) { stopCam(); st8.live = false; return prev(); });

  /* ---------- بدون زوم و لرزش صفحه (مثل اپ‌های دیگر) ---------- */
  (function noZoom() {
    const st = document.createElement('style');
    st.textContent = `
      html{-webkit-text-size-adjust:100%;text-size-adjust:100%;touch-action:manipulation}
      html,body{overflow-x:clip;overscroll-behavior-x:none}
      /* آیفون روی کادر متنی با نوشتهٔ کوچک‌تر از ۱۶ خودش زوم می‌کند */
      @supports (-webkit-touch-callout:none){input,select,textarea{font-size:max(16px,1em)!important}}`;
    document.head.appendChild(st);
    // آیفون user-scalable=no را نادیده می‌گیرد: جلوی زوم دو انگشتی و دو ضربه‌ای
    ['gesturestart', 'gesturechange', 'gestureend'].forEach((n) => document.addEventListener(n, (e) => e.preventDefault(), { passive: false }));
    // زوم دو ضربه‌ای را touch-action: manipulation بالا می‌بندد (بدون کند کردن لمس‌های پشت‌سرهم)
    document.addEventListener('touchmove', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
  })();

  /* =================================================================
   * بخش ۹: توافق در چت ← پروژه و قرارداد واقعی؛ مدارک بدون بیمهٔ تأمین اجتماعی
   * ================================================================= */
  // زیر پیشنهاد توافقِ پذیرفته‌شده: «دیدن و امضای قرارداد» و «رفتن به پروژه» (پروژهٔ واقعی سرور)
  wrap('linkDeal', function (prev, c, m) {
    if (L.on && m && m.k === 'deal') { if (m.projectId) { m.proj = { live: true }; m.projRole = S.role; } return; }
    return prev(c, m);
  });
  wrap('dealCtrBtn', function (prev, c, m, i) {
    if (!L.on || !m || !m.projectId) return prev(c, m, i);
    const ic = (typeof QI === 'object' && QI.doc ? QI.doc.replace('class="ico"', 'class="ico" style="width:18px;height:18px"') : '');
    return `<button class="dl-ctr s0" onclick="LIVE.openDealProject('${m.projectId}','ctr')">${ic}<span>توافق‌نامه (قرارداد): دیدن و امضا</span><b>›</b></button>
      <button class="dl-prj" onclick="LIVE.openDealProject('${m.projectId}','page')">رفتن به پروژه در «پروژه‌های من»</button>`;
  });
  L.openDealProject = async (pid, where) => {
    try {
      let i = (S.projs[S.role] || []).findIndex((p) => p._id === pid);
      if (i < 0 && L.loadProjects) { await L.loadProjects(true); i = (S.projs[S.role] || []).findIndex((p) => p._id === pid); }
      if (i < 0) { toast('این پروژه در نقش دیگرت است؛ نقش را عوض کن'); return; }
      S.pi = i;
      if (where === 'ctr') openContract(i); else openProjPage(i);
    } catch (e) { err(e); }
  };
  // پیام‌های تازه: اگر پیشنهاد پذیرفته شد، دکمه‌ها فوری بیایند
  const mapDealProj = () => (S.convs || []).forEach((c) => (c.msgs || []).forEach((m) => { if (m.k === 'deal' && m.st === 'ok' && m.projectId && !m.proj) { m.proj = { live: true }; m.projRole = S.role; } }));
  wrap('renderChat', function (prev) { if (L.on) mapDealProj(); return prev(); });

  /* ---------- پرسش تخصصی: پاسخ‌ها روی سرور و برای همه ---------- */
  const ansLoaded = {};
  async function loadAnswers(adId) {
    ansLoaded[adId] = Date.now();
    const d = await api('GET', '/ads/' + adId + '/answers');
    S.ans[adId] = d.items.map((x) => ({ who: L.upsertPerson(Object.assign({}, x.author, { avatarUrl: x.author.avatarUrl })), t: x.message, up: x.up || 0, down: x.down || 0, my: x.myVote || 0, time: L.rel(x.createdAt), best: x.best, _id: x.id }));
  }
  wrap('renderQA', function (prev) {
    const a = ADS.find((x) => x.id === S.adId);
    if (!L.on || !a || !a._live) return prev();
    if (!S.ans[a.id]) S.ans[a.id] = [];
    prev();
    if (!ansLoaded[a.id] || Date.now() - ansLoaded[a.id] > 15000) loadAnswers(a.id).then(() => { if (S.cur === 'qa' && S.adId === a.id) prev(); }).catch(() => {});
  });
  wrap('answerQA', function (prev, aid) {
    prev(aid);
    const a = ADS.find((x) => x.id === aid);
    if (!L.on || !a || !a._live) return;
    const b = document.querySelector('#sb .cta');
    if (!b || !document.getElementById('ansT')) return;
    b.removeAttribute('onclick');
    b.onclick = () => {
      const t = document.getElementById('ansT').value.trim();
      if (t.length < 10) { toast('پاسخ کوتاه است'); return; }
      b.disabled = true;
      api('POST', '/ads/' + aid + '/responses', { message: t })
        .then(() => loadAnswers(aid))
        .then(() => { closeSheet(); renderQA(); toast('پاسخ تو منتشر شد؛ همه می‌بینند'); })
        .catch((e) => { b.disabled = false; err(e); });
    };
  });

  /* ---------- بازدید آگهی (برای آمار آگهی‌دهنده) ---------- */
  const seenAd = new Set();
  wrap('openAd', function (prev, id) {
    const r = prev(id);
    const a = ADS.find((x) => x.id === id);
    if (L.on && a && a._live && a.who !== 'me' && !seenAd.has(id)) { seenAd.add(id); api('GET', '/ads/' + id).catch(() => {}); }
    return r;
  });

  /* ---------- آمار عملکرد واقعی ---------- */
  let statsData = null;
  wrap('renderStats', function (prev) {
    if (!on()) return prev();
    const host = document.getElementById('s-stats');
    const d = statsData;
    const nf = (v, u) => (v == null ? '—' : fa(v) + (u || ''));
    if (!d) host.innerHTML = `${pageBar('آمار عملکرد')}<div class="section"><div class="card" style="text-align:center;color:var(--muted)">در حال گرفتن آمار…</div></div>`;
    else {
      const bars = (vals, cls) => { const mx = Math.max(1, ...vals); return `<div class="bars">${vals.map((v, k) => `<div><b class="num">${fa(v)}</b><i style="--h:${(v / mx) * 100}%;--k:${k}" class="${k === vals.length - 1 ? 'cur' : ''}"></i><small>${d.months[k].slice(0, 3)}</small></div>`).join('')}</div>`; };
      const inc = d.income.monthly.map((v) => Math.round(v / 1e5) / 10);
      const dmx = Math.max(1, ...d.demand.map((x) => x.n));
      host.innerHTML = `${pageBar('آمار عملکرد')}
      <div class="section" style="margin-top:6px"><div class="kpis">${[
        ['بازدید پروفایل', nf(d.profileViews.total)],
        ['بازدید آگهی‌ها', nf(d.adViews.total)],
        d.responses.received ? ['نرخ پاسخ به درخواست‌ها', nf(d.responses.answerRate, '٪')] : ['درخواست‌های فرستاده', nf(d.responses.sent)],
        d.responses.avgAnswerMinutes != null ? ['میانگین زمان پاسخ', nf(d.responses.avgAnswerMinutes, ' دقیقه')] : ['تبدیل به همکاری', nf(d.responses.conversion, '٪')],
      ].map((x, k) => `<div class="kpi" style="animation-delay:${k * 70}ms"><small>${x[0]}</small><b class="num">${x[1]}</b></div>`).join('')}</div></div>
      <div class="section"><div class="card"><div class="sec-head" style="margin:0 0 6px"><h3>بازدید پروفایل</h3><span>۶ ماه اخیر</span></div>${bars(d.profileViews.monthly)}</div></div>
      ${d.adViews.total || d.adViews.activeAds ? `<div class="section"><div class="card"><div class="sec-head" style="margin:0 0 6px"><h3>بازدید آگهی‌هایم</h3><span>${fa(d.adViews.activeAds)} آگهی فعال</span></div>${bars(d.adViews.monthly)}</div></div>` : ''}
      ${S.role !== 'general' ? `<div class="section"><div class="card"><div class="sec-head" style="margin:0 0 6px"><h3>درآمد ثبت‌شده در بلوک</h3><span>میلیون تومان</span></div>${bars(inc)}
        <p class="est-note" style="margin:6px 0 0">فقط پرداخت‌هایی که در دفترچهٔ پرداخت پروژه‌ها ثبت و تأیید شده حساب می‌شود.</p></div></div>` : ''}
      <div class="section"><div class="card"><div class="sec-head" style="margin:0 0 6px"><h3>${d.responses.received ? 'درخواست‌های دریافتی' : 'درخواست‌های فرستاده'}</h3><span>${fa(d.projects.total)} پروژه · ${fa(d.projects.done)} تمام‌شده</span></div>${bars(d.responses.received ? d.responses.receivedMonthly : d.responses.sentMonthly)}</div></div>
      <div class="section"><div class="sec-head"><h3>پرتقاضاترین مهارت‌ها در ${esc(d.province || 'استان تو')}</h3><span>۳۰ روز اخیر</span></div><div class="card">${d.demand.length ? d.demand.map((x, k) => `<div class="est-leg"><span>${esc(x.skill)}</span><div class="hbar"><i style="--w:${(x.n / dmx) * 100}%;--k:${k}"></i></div><b class="num">${fa(x.n)}</b></div>`).join('') : '<p style="margin:0;color:var(--muted)">هنوز آگهی کافی در استان نیست.</p>'}</div></div>`;
    }
    api('GET', '/me/stats').then((x) => { const first = !statsData; statsData = x; if (S.cur === 'stats' && first) renderStats(); else if (S.cur === 'stats') { statsData = x; } }).catch(err);
  });

  // مدارک: بیمهٔ تأمین اجتماعی لازم نیست (درخواست مجید)
  try {
    Object.keys(DOCS).forEach((r) => { DOCS[r] = DOCS[r].filter((d) => !/تأمین اجتماعی/.test(d[0])); });
  } catch (e) {}

  /* =================================================================
   * بخش ۱۰: بازبینی رابط (با یا بدون سرور)
   * ================================================================= */
  // ۴) مهمان: درخواست‌ها، پروژه‌ها و اعلان‌ها = صفحهٔ قفل داخل صفحه (پنجرهٔ ورود خودکار باز نمی‌شود)
  const LOCKED = {
    req: ['درخواست‌ها', 'درخواست‌های همکاری که می‌فرستی و می‌گیری اینجا جمع می‌شود.'],
    proj: ['پروژه‌ها', 'پروژه‌ها، قراردادها و پرداخت‌هایت بعد از ورود اینجاست.'],
    notif: ['اعلان‌ها', 'پیام‌ها، درخواست‌ها و خبر کارگاه‌هایت اینجا می‌آید.'],
  };
  wrap('go', function (prev, name, noPush) {
    if (S.auth || !LOCKED[name] || !document.getElementById('s-' + name)) return prev(name, noPush);
    if (!noPush && S.cur !== name) S.hist.push(S.cur);
    S.cur = name;
    document.querySelectorAll('.screen').forEach((x) => x.classList.toggle('on', x.id === 's-' + name));
    document.getElementById('navwrap').hidden = true;
    scrollTo(0, 0);
    const t = LOCKED[name];
    document.getElementById('s-' + name).innerHTML = `${pageBar(t[0])}
      <div class="section"><div class="card locked"><div class="lock-art" aria-hidden="true"><svg viewBox="0 0 80 80"><rect x="18" y="36" width="44" height="34" rx="8" fill="var(--accent)"/><path class="shackle" d="M28 36V26a12 12 0 0 1 24 0v10" fill="none" stroke="var(--accent)" stroke-width="6" stroke-linecap="round"/><circle cx="40" cy="52" r="5" fill="#fff"/></svg></div>
      <b>${t[0]} بعد از ورود باز می‌شود</b><p>${t[1]}</p><button class="cta" onclick="startAuth()">ورود یا ثبت‌نام</button><button class="ghost" onclick="go('explore')">دیدن آگهی‌ها</button></div></div>`;
  });

  // ۸) صفحهٔ «من»: کاشی‌ها در ۴ گروه (پرکاربردترین اول)
  const ME_GROUPS = [
    ['کار من', ["go('req')", "go('proj')", "go('myads')", "go('cal')", "go('disp')"]],
    ['پروفایل و اعتبار', ['trust', "go('pf')", "go('guar')", "go('team')", "go('docs')"]],
    ['ابزارها', ["go('est')", "go('learn')", "go('stats')", "go('safe')", "go('saved')"]],
    ['تنظیمات', ["go('set')", "go('notif')", "go('invite')", "go('about')"]],
  ];
  wrap('renderMe', function (prev) {
    const r = prev();
    if (!S.auth) return r;
    const grid = document.querySelector('#s-me .mygrid');
    if (!grid || grid.dataset.grouped) return r;
    const sec = grid.closest('.section');
    const tiles = [...grid.children];
    const used = new Set();
    const take = (key) => {
      if (key === 'trust') {
        const b = document.createElement('button');
        b.setAttribute('onclick', "openTrust('me')");
        b.innerHTML = `<span class="ic" style="--c:var(--gold)">${(typeof QI === 'object' && QI.card) || ''}</span>شناسنامهٔ کاری`;
        return [b];
      }
      return tiles.filter((t) => !used.has(t) && (t.getAttribute('onclick') || '') === key).map((t) => (used.add(t), t));
    };
    const frag = document.createDocumentFragment();
    const groups = ME_GROUPS.map(([title, keys]) => [title, keys.flatMap(take)]);
    tiles.filter((t) => !used.has(t)).forEach((t) => groups[2][1].push(t)); // بقیه در «ابزارها»
    groups.forEach(([title, items]) => {
      if (!items.length) return;
      const s2 = document.createElement('div');
      s2.className = 'section me-grp';
      s2.innerHTML = `<div class="sec-head"><h3>${title}</h3></div>`;
      const g2 = document.createElement('div');
      g2.className = grid.className; g2.dataset.grouped = '1';
      items.forEach((t) => g2.appendChild(t));
      s2.appendChild(g2);
      frag.appendChild(s2);
    });
    sec.replaceWith(frag);
    return r;
  });

  // ۸) خانهٔ کاربر واردشده: یک ردیف میان‌بر — ردیف دایره‌ای فقط وقتی مدیر استوری منتشر کرده باشد
  wrap('storiesRail', function (prev) {
    if (!S.auth) return prev();
    const admin = L.cfg && (L.cfg.stories || []).length;
    return admin ? prev() : '';
  });
  wrap('storyList', function (prev) {
    const all = prev();
    return S.auth ? all.filter((x) => x._id) : all;
  });

  /* =================================================================
   * بخش ۱۱: اتصال جریان‌های دور ۲۷ (flow.js) به سرور
   *   برگشت گوشی، درخواست همکاری (invites)، معرف‌ها، مرکز درخواست‌ها، رأی پاسخ‌ها، جست‌وجوی افراد،
   *   آگهی رایگان، ویرایش آگهی، «نیروی این پروژه»، وضعیت امضای قرارداد در چت، خانه
   * ================================================================= */
  const byId = (id) => document.getElementById(id);
  // ۳) دکمهٔ برگشت گوشی/مرورگر = back() اپ
  (function history2() {
    let skip = 0;
    const NAVR = { home: 1, explore: 1, msg: 1, me: 1 };
    try { history.replaceState({ blk: 0 }, ''); } catch (e) {}
    wrap('go', function (prev, name, noPush) {
      const from = S.cur;
      const r = prev(name, noPush);
      if (!noPush && name !== from && !(NAVR[name] && NAVR[from])) { try { history.pushState({ blk: 1 }, ''); } catch (e) {} }
      return r;
    });
    wrap('back', function (prev) {
      if (history.state && history.state.blk) { skip++; try { history.back(); } catch (e) { skip--; } }
      return prev();
    });
    addEventListener('popstate', () => {
      if (skip) { skip--; return; }
      const sh = byId('sheet');
      if (sh && sh.classList.contains('on')) { closeSheet(); try { history.pushState({ blk: 1 }, ''); } catch (e) {} return; }
      if (S.hist && S.hist.length) { const p = S.hist.pop(); go(p, true); }
    });
  })();

  L.onLive = (L.onLive || []).concat(() => { if (S.me) { S.me.guar = []; S.me.guarReq = []; } S.alerts = []; S.ctrSt = {}; });

  // ۵) درخواست همکاری ← /invites
  wrap('collabSend', function (prev) {
    if (!on()) return prev();
    const x = collabData();
    if (x.title.length < 3) { toast('بنویس برای چه کاری درخواست می‌دهی'); return; }
    if (!x.p || !x.p.code) { toast('این کاربر در نسخهٔ واقعی نیست'); return; }
    const b = document.querySelector('#sb .cta'); if (b) b.disabled = true;
    api('POST', '/invites', { profileCode: x.p.code, adId: x.adId && L.isUuid(x.adId) ? x.adId : null, title: x.title, startWhen: x.startWhen, offer: x.offer || null, message: x.message || null })
      .then((d) => { L.loaded.req = 0; L.loadConvs().catch(() => {}); collabDone(x, d.items[0] && d.items[0].conversationId); })
      .catch((e) => { if (b) b.disabled = false; err(e); });
  });

  // ۶) مرکز درخواست‌ها: همکاری مستقیم، معرف‌ها و امضای قرارداد هم بیایند
  const IV_ST = { pending: null, accepted: 'ok', rejected: 'no' };
  const loadReq0 = L.loadRequests;
  async function loadRequests2(force) {
    if (!force && fresh('req')) return;
    await loadReq0(true);
    const [ii, io, gg] = await Promise.all([
      api('GET', '/invites?dir=in').catch(() => ({ items: [] })),
      api('GET', '/invites?dir=out').catch(() => ({ items: [] })),
      api('GET', '/guarantees').catch(() => ({ mine: [], incoming: [] })),
    ]);
    const inv = (r, dir) => ({ t: 'درخواست همکاری: ' + r.title, [dir === 'in' ? 'from' : 'to']: L.upsertPerson(dir === 'in' ? r.from : r.to), d: [r.startWhen, r.offer].filter(Boolean).join(' · ') || L.rel(r.createdAt), st: IV_ST[r.status], _inv: r.id, _cid: r.conversationId, kind: 'collab' });
    S.req[S.role] = ii.items.map((r) => inv(r, 'in')).concat(S.req[S.role] || []);
    S.out = io.items.map((r) => inv(r, 'out')).concat(S.out || []);
    if (S.me) {
      S.me.guar = gg.mine.map((g) => [g.name, g.relation, g.status === 'accepted' ? 'ok' : g.status === 'rejected' ? 'no' : 'wait', g.id]);
      S.me.guarReq = gg.incoming.map((g) => ({ n: g.from.name, rel: g.relation, st: g.status === 'accepted' ? 'ok' : g.status === 'rejected' ? 'no' : null, _g: g.id, pid: L.upsertPerson(g.from) }));
    }
    await loadCtrPending().catch(() => {});
  }
  L.loadRequests = loadRequests2;
  wrap('renderReq', function (prev) {
    if (!on()) return prev();
    prev();
    if (!fresh('req')) loadRequests2().then(() => { if (S.cur === 'req') prev(); }).catch(err);
  });
  wrap('rqAns', function (prev, i, st) {
    const Lx = S.rtab === 'in' ? S.req[S.role] : S.out, r = Lx && Lx[i];
    if (!on() || !r || !r._inv) return prev(i, st);
    const call = st === 'x' ? api('POST', '/invites/' + r._inv + '/withdraw') : api('PATCH', '/invites/' + r._inv, { status: st === 'ok' ? 'accepted' : 'rejected' });
    call.then(() => {
      toast(st === 'ok' ? 'قبول شد؛ در چت شرایط را نهایی کنید و «ثبت قرارداد» را بزنید' : st === 'x' ? 'درخواست پس گرفته شد' : 'درخواست رد شد');
      L.loaded.req = 0;
      if (st === 'ok' && r._cid) { L.loadConvs().then(() => L.openConv(r._cid)).catch(() => {}); return; }
      return loadRequests2(true).then(() => { if (S.cur === 'req') renderReq(); });
    }).catch(err);
  });
  // معرف (قیم): ثبت، تأیید و رد
  wrap('guarAns', function (prev, i, st) {
    const r = S.me && S.me.guarReq[i];
    if (!on() || !r || !r._g) return prev(i, st);
    api('PATCH', '/guarantees/' + r._g, { status: st === 'ok' ? 'accepted' : 'rejected' })
      .then(() => { r.st = st; toast(st === 'ok' ? 'تأیید تو به اعتبار هر دو نفر اضافه شد' : 'درخواست رد شد'); render(); })
      .catch(err);
  });
  function guarDone(n, invited) {
    reqDone({ title: 'درخواست معرف فرستاده شد', who: 'برای ' + n, where: 'درخواست‌ها ← ارسالی (تأیید و معرف)',
      steps: [invited ? n + ' هنوز در بلوک نیست؛ وقتی با همین شماره ثبت‌نام کند، درخواست را می‌بیند.' : n + ' درخواست را در «درخواست‌ها» می‌بیند.', 'اگر تأیید کند، در شناسنامهٔ کاری تو «معرف» می‌شود و اعتبارت بالا می‌رود.'] });
  }
  wrap('saveGuar', function (prev) {
    const n = (byId('gN') && byId('gN').value.trim()) || '', rel = (byId('gR') && byId('gR').value.trim()) || 'آشنا', ph = (byId('gP') && byId('gP').value.trim()) || '';
    if (!on()) { prev(); if (n && ph) guarDone(n); return; }
    if (!n) { toast('نام معرف را بنویس'); return; }
    if (!ph) { toast('شمارهٔ موبایل معرف را بنویس'); return; }
    api('POST', '/guarantees', { name: n, relation: rel, phone: L.toEn(ph) })
      .then((d) => { L.loaded.req = 0; closeSheet(); if (S.cur === 'guar') renderGuar(); guarDone(n, d.invited); })
      .catch(err);
  });

  // ۴) وضعیت امضای قرارداد: در کارت توافق داخل چت و در «درخواست‌ها»
  S.ctrSt = S.ctrSt || {};
  async function ctrStatus(pid) {
    const d = await api('GET', '/projects/' + pid + '/contract');
    const c = d.contract, mine = !!c.signatures[c.mySide], theirs = !!c.signatures[c.mySide === 'client' ? 'provider' : 'client'];
    S.ctrSt[pid] = { mine, theirs, active: c.status === 'active', at: Date.now() };
    return S.ctrSt[pid];
  }
  // پروژه‌ها برای خانه و «درخواست‌ها» گرفته می‌شود ولی صفحهٔ پروژه‌ها باز هم خودش تازه می‌کند
  async function peekProjects() {
    const k = 'projs:' + S.role;
    if (!L.loadProjects || fresh(k) || fresh('ph:' + S.role, 60000)) return;
    L.loaded['ph:' + S.role] = Date.now();
    try { await L.loadProjects(true); } finally { L.loaded[k] = 0; }
  }
  async function loadCtrPending() {
    await peekProjects().catch(() => {});
    const L2 = (S.projs[S.role] || []).filter((p) => p._live && p.stage < 3);
    await Promise.all(L2.map((p) => (S.ctrSt[p._id] && Date.now() - S.ctrSt[p._id].at < 30000 ? null : ctrStatus(p._id).catch(() => null))));
  }
  window.ctrPending = function () {
    if (!on()) return [];
    return (S.projs[S.role] || []).filter((p) => p._live && S.ctrSt[p._id] && !S.ctrSt[p._id].active).map((p) => {
      const c = S.ctrSt[p._id];
      return { dir: c.mine ? 'out' : 'in', t: 'قرارداد: ' + p.t, who: p.who, d: c.mine ? 'امضای تو ثبت شد؛ منتظر امضای طرف مقابل' : c.theirs ? 'طرف مقابل امضا کرد؛ نوبت توست' : 'منتظر امضای تو', open: `LIVE.openDealProject('${p._id}','ctr')` };
    });
  };
  const sigLbl = (c) => (!c ? 'قرارداد: دیدن و امضا' : c.active ? 'قرارداد امضا شد · دیدن' : c.mine ? 'امضای تو ثبت شد · منتظر امضای طرف مقابل' : c.theirs ? 'طرف مقابل امضا کرد · نوبت امضای توست' : 'قرارداد آماده است · امضا با کد پیامکی');
  wrap('dealCtrBtn', function (prev, c, m, i) {
    const h = prev(c, m, i);
    if (!L.on || !m || !m.projectId) return h;
    const st = S.ctrSt[m.projectId];
    if (!st || Date.now() - st.at > 30000) {
      S.ctrSt[m.projectId] = Object.assign({}, st || {}, { at: Date.now() }); // یک درخواست در هر ۳۰ ثانیه
      ctrStatus(m.projectId).then(() => { if (S.cur === 'chat' && byId('m' + i)) rerenderMsg(i); }).catch(() => {});
    }
    return h.replace('توافق‌نامه (قرارداد): دیدن و امضا', sigLbl(st && st.mine !== undefined ? st : null));
  });
  // بعد از امضا وضعیت تازه شود
  wrap('renderCtr', function (prev) { const r = prev(); const p = (S.projs[S.role] || [])[S.pi]; if (on() && p && p._id) delete S.ctrSt[p._id]; return r; });

  // ۱۳) رأی «مفید بود / نبود»
  window.voteAnsLive = function (aid, x, v) {
    if (!on() || !x._id) return;
    api('POST', '/responses/' + x._id + '/vote', { value: v }).then((d) => { x.up = d.up; x.down = d.down; x.my = d.myVote; if (S.cur === 'qa') renderQA(); }).catch(err);
  };

  // ۱۲) جست‌وجوی افراد با نام یا کد کاربری از سرور
  let pq = '';
  wrap('renderResults', function (prev, first) {
    const r = prev(first);
    const q = (S.q || '').trim();
    if (!L.on || q.length < 2 || q === pq) return r;
    pq = q;
    blkDeb('ppl', () => {
      api('GET', '/profiles?q=' + encodeURIComponent(q) + '&limit=12')
        .then((d) => { d.items.forEach((x) => L.upsertPerson(x, x.city)); if (S.cur === 'explore' && (S.q || '').trim() === q) renderResults(); })
        .catch(() => {});
    }, 250);
    return r;
  });

  // ۹) آگهی رایگان: آگهی‌های خودم پیش از باز شدن فرم گرفته شود
  wrap('openWizard', function (prev, ...a) {
    const r = prev(...a); // فرم فوری باز شود؛ آگهی‌های من پشت صحنه
    if (!on() || S._skipLimit || fresh('myads:' + S.role, 60000) || fresh('mp:' + S.role, 30000)) return r;
    L.loaded['mp:' + S.role] = Date.now(); // صفحهٔ «آگهی‌های من» باز هم خودش تازه می‌کند
    api('GET', '/ads/mine').then((d) => {
      for (let i = ADS.length - 1; i >= 0; i--) if (ADS[i].who === 'me') ADS.splice(i, 1);
      d.items.forEach((x) => ADS.push(Object.assign(L.mapAd(Object.assign({}, x, { author: { code: L.pub && L.pub.code, role: S.role, name: (L.pub && L.pub.name) || '' } })), { who: 'me', st: x.status, views: x.views })));
      // هنوز در قدم اول فرم است و آگهی فعال دارد ← همان پیام محدودیت (پیش از پر کردن فرم)
      if (S.cur === 'new' && S.w && (S.w.step || 0) <= 1 && myActiveAds().length >= ((L.cfg && L.cfg.limits && L.cfg.limits.freeAds) || FREE_AD_LIMIT)) adLimitSheet();
    }).catch(() => {});
    return r;
  });
  const limitErr = (e) => !!e && e.code === 'FREE_AD_LIMIT';
  L.limitErr = limitErr;
  wrap('adEditSave', function (prev, id) {
    const a = ADS.find((x) => x.id === id);
    if (!on() || !a || !a._live) return prev(id);
    const t = byId('aeT').value.trim();
    if (t.length < 4) { toast('عنوان حداقل ۴ حرف'); return; }
    const body = { title: t, description: byId('aeD').value.trim() || null };
    if (byId('aeW')) { const n = +L.toEn(byId('aeW').value).replace(/[^\d]/g, ''); body.wageAmount = n || null; if (!n) body.wageType = 'توافقی'; }
    api('PATCH', '/ads/' + id, body).then((d) => { Object.assign(a, L.mapAd(Object.assign({}, d.ad, { author: { code: L.pub.code, role: S.role, name: L.pub.name } })), { who: 'me', st: d.ad.status }); closeSheet(); toast('آگهی ویرایش شد'); render(); }).catch(err);
  });

  // ۱۸) «نیروی این پروژه»: افراد واقعی هر نقش، انتشار آگهی و ارسال درخواست‌ها
  wrap('estGo', function (prev) {
    prev();
    if (!on()) return;
    Promise.all(S.eg.roles.map((r) => api('GET', '/profiles?role=' + r + '&limit=12').then((d) => d.items.forEach((x) => L.upsertPerson(x, x.city))).catch(() => {})))
      .then(() => { if (S.cur === 'estgo') renderEstGo(); });
  });
  wrap('estPublish', async function (prev) {
    if (!on()) return prev();
    const { g, draft, descFull } = egPayload();
    if (g.title.length < 4) { toast('عنوان آگهی را بنویس'); return; }
    if (!g.roles.length) { toast('حداقل یک نقش انتخاب کن'); return; }
    if (!peValid()) return;
    const b = document.querySelector('#s-estgo .cta'); if (b) b.disabled = true;
    const aud = g.roles.filter((r) => ['worker', 'specialist', 'engineer', 'contractor', 'company'].includes(r)).slice(0, 3);
    const codes = [...g.picks].map((id) => P[id] && P[id].code).filter(Boolean);
    let adId = null;
    try {
      const d = await api('POST', '/ads', { type: 'job', title: g.title.slice(0, 120), description: descFull.slice(0, 2000), province: CITY_PROV[g.place] || 'هرمزگان', city: g.place, wageType: 'پروژه‌ای', wageAmount: null, startWhen: 'با هماهنگی', range: 'province', audience: aud, needCount: 1, skills: g.skills.slice(0, 5) });
      adId = d.ad.id;
      ADS.unshift(Object.assign(L.mapAd(Object.assign({}, d.ad, { author: { code: L.pub.code, role: S.role, name: L.pub.name } })), { who: 'me', st: 'active' }));
      saveCtrDraft(adId, draft);
    } catch (e) {
      if (b) b.disabled = false;
      if (!limitErr(e)) { err(e); return; }
      if (!codes.length) { adLimitSheet(); return; }
      toast('آگهی فعال دیگری داری؛ درخواست‌ها بدون آگهی تازه فرستاده می‌شود');
    }
    try {
      let cid = null;
      if (codes.length) {
        const r = await api('POST', '/invites', { profileCodes: codes, adId, title: g.title.slice(0, 160), startWhen: 'با هماهنگی', offer: g.budget.slice(0, 120), message: `پیش‌نویس قرارداد: مدت ${fa(g.days)} روز · پرداخت: ${planTxt(PE.ms)}`.slice(0, 1000) });
        cid = r.items.length === 1 ? r.items[0].conversationId : null;
        if (!adId) r.items.forEach((x) => saveCtrDraft('c:' + x.conversationId, draft));
      }
      L.loaded.req = 0; L.loadConvs().catch(() => {});
      estDone(codes.length, cid, !adId);
    } catch (e) { if (b) b.disabled = false; err(e); }
  });
  // پیش‌نویس قرارداد در گفت‌وگوهای بدون آگهی
  wrap('ctrWizard', function (prev) {
    const c = S.convs.find((x) => x.id === S.cid);
    if (c && !c.ad && S.ctrDrafts['c:' + c.id]) { c.ad = 'c:' + c.id; try { return prev(); } finally { c.ad = null; } }
    return prev();
  });

  // ۱۵) خانه: پروژه‌ها، بازدیدهای امروز و پیشنهادها از سرور
  window.todayVisits = function () {
    if (!on() || S.role !== 'engineer') return [];
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }).format(new Date());
    return (L.visits || []).filter((v) => v.as === 'engineer' && v.day === today && v.status === 'confirmed').map((v) => ({ t: v.typeName + ' · ساعت ' + v.slot, w: (v.client ? v.client.name : '') + (v.address ? ' · ' + v.address : '') }));
  };
  // (خانه دست‌نخورده می‌ماند)
  // بازدید (نسخهٔ نمایشی): همان صفحهٔ تأیید یکسان؛ نسخهٔ سرور در vConfirm بخش ۴
  wrap('vConfirm', function (prev) {
    const r = prev();
    const t = byId('sheetTitle');
    if (!L.on && t && /بازدید فرستاده شد/.test(t.textContent)) visitDone();
    return r;
  });
  function visitDone() {
    const p = P[S.visit.pid];
    reqDone({ title: 'درخواست بازدید فرستاده شد', who: p ? 'برای ' + p.name : '', pid: S.visit.pid, name: p && p.name, where: 'درخواست‌ها ← ارسالی (بازدید)',
      steps: ['مهندس روز و ساعت را تأیید یا رد می‌کند؛ با اعلان خبرت می‌کنیم.', 'بعد از بازدید، گزارش مکتوب می‌رسد و هزینه را مستقیم می‌پردازی.', 'تا ۱۲ ساعت قبل، لغو رایگان است.'] });
  }
  L.visitDone = visitDone;
})();
