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
    if (!r || !r._id) return prev(i, st);
    if (st === 'x') {
      api('POST', '/responses/' + r._id + '/withdraw').then(() => { toast('درخواست پس گرفته شد'); return loadRequests(true); }).then(renderReq).catch(err);
      return;
    }
    answer(r._id, st === 'ok' ? 'accepted' : 'rejected');
  });
  wrap('ansReq', function (prev, role, i, st) {
    const r = (S.req[role] || [])[i];
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
    return out;
  }
  wrap('renderCal', function (prev) {
    if (!on()) return prev();
    if (!fresh('projs:' + S.role)) (L.loadProjects ? L.loadProjects() : Promise.resolve()).then(() => { if (S.cur === 'cal') renderCal(); }).catch(() => {});
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
})();
