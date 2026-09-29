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
        if (S.cur === 'req') loadRequests(true).then(renderReq);
        if (S.cur === 'home') loadRequests(true).then(renderHome);
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
    if (!fresh('req')) loadRequests().then(() => { if (S.cur === 'req') renderReq(); }).catch(err);
  });
  wrap('rqAns', function (prev, i, st) {
    if (!on()) return prev(i, st);
    const Lx = S.rtab === 'in' ? S.req[S.role] : S.out, r = Lx[i];
    if (r && r._visit) {
      const act = st === 'x' ? 'cancel' : st === 'ok' ? 'confirm' : 'decline';
      api('POST', '/visits/' + r._visit + '/' + act, {}).then(() => { toast(act === 'confirm' ? 'بازدید تأیید شد؛ در میز کار امروزت می‌آید' : act === 'cancel' ? 'بازدید لغو شد' : 'درخواست بازدید رد شد'); return loadRequests(true); }).then(renderReq).catch(err);
      return;
    }
    if (!r || !r._id) return prev(i, st);
    if (st === 'x') {
      api('POST', '/responses/' + r._id + '/withdraw').then(() => { toast('درخواست پس گرفته شد'); return loadRequests(true); }).then(renderReq).catch(err);
      return;
    }
    answer(r._id, st === 'ok' ? 'accepted' : 'rejected');
  });
  wrap('ansReq', function (prev, role, i, st) {
    const r = (S.req[role] || [])[i];
    if (on() && r && r._visit) { api('POST', '/visits/' + r._visit + '/' + (st === 'ok' ? 'confirm' : 'decline'), {}).then(() => loadRequests(true)).then(() => { toast(st === 'ok' ? 'بازدید تأیید شد' : 'درخواست بازدید رد شد'); render(); }).catch(err); return; }
    if (!on() || !r || !r._id) return prev(role, i, st);
    answer(r._id, st === 'ok' ? 'accepted' : 'rejected');
  });
  // بعد از پاسخ به آگهی، فهرست درخواست‌های ارسالی دوباره از سرور گرفته شود (نه نسخهٔ نمایشی)
  wrap('sent', async function (prev, name) { await prev(name); L.loaded.req = 0; });
  wrap('renderHome', function (prev) {
    if (on() && !S.req[S.role]) S.req[S.role] = [];
    prev();
    if (on() && !fresh('req', 60000)) loadRequests().then(() => { if (S.cur === 'home') prev(); }).catch(() => {});
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
        sb.innerHTML = `<div class="grab"></div><h3 class="center" id="sheetTitle">درخواست بازدید فرستاده شد</h3><p class="sub center">${esc(p.name)} تأیید می‌کند و خبرش برایت می‌آید. ${esc(d.visit.dayLabel)} ساعت ${esc(d.visit.slot)}</p><button class="cta" onclick="closeSheet();openChatWith('${v.pid}')">هماهنگی در چت</button>`;
        show();
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
})();
