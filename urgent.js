/* =====================================================================
 * urgent.js — دور ۳۰: «نیروی فوری» (بعد از work.js)
 *   کارفرما: دکمهٔ ⚡ در خانه ← فرم یک‌صفحه‌ای ← درخواست به همهٔ نیروهای «آماده به کار» استان (POST /urgent)
 *            ← صفحهٔ پیگیری با رادار، شمارش و نفرهایی که قبول کردند (GET /urgent/mine)
 *   نیرو:    کارت ⚡ «کار فوری» با جمع مبلغ و دو دکمهٔ بزرگ قبول/نه (GET /urgent/inbox، POST /urgent/:id/accept|decline)
 *            اولین‌ها برنده‌اند؛ قبول = گفت‌وگو + توافق + پروژه خودکار
 * بدون سرور: نسخهٔ نمایشی (یک نیروی نمونه بعد از چند ثانیه قبول می‌کند).
 * ===================================================================== */
(function () {
  const live = () => !!(window.LIVE && LIVE.on && S.auth);
  const wrapW = (name, fn) => { const prev = window[name]; if (typeof prev !== 'function') return; window[name] = function (...a) { return fn.call(this, prev, ...a); }; };
  const api = (m, p, b) => LIVE.api(m, p, b);
  const err = (e) => (window.LIVE && LIVE.err ? LIVE.err(e) : toast(e.message || 'خطا'));
  const toEnD = (s) => String(s == null ? '' : s).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  const digits = (s) => toEnD(s).replace(/\D/g, '');
  const CLIENTS = ['general', 'contractor', 'company', 'engineer'];
  const CREW = ['worker', 'specialist'];

  const css = document.createElement('style');
  css.textContent = `
  .ug-btn{display:flex;align-items:center;gap:12px;width:100%;border:0;border-radius:20px;padding:14px 16px;font-family:inherit;text-align:start;cursor:pointer;color:#1a1205;background:linear-gradient(135deg,#FFC93C,#F97316);box-shadow:0 8px 24px rgba(249,115,22,.35)}
  .ug-btn .bolt{flex:none;width:46px;height:46px;border-radius:14px;background:rgba(255,255,255,.35);display:grid;place-items:center;font-size:26px;animation:ugBolt 2.4s infinite}
  .ug-btn .t{flex:1}.ug-btn b{display:block;font-size:17px}.ug-btn small{display:block;font-size:12.5px;opacity:.85;line-height:1.6}
  @keyframes ugBolt{0%,80%,100%{transform:none}85%{transform:scale(1.15) rotate(-8deg)}90%{transform:scale(1.15) rotate(8deg)}}
  .ug-count{display:flex;align-items:center;gap:8px;margin-top:12px;padding:10px 12px;border-radius:14px;background:color-mix(in srgb,var(--ok) 10%,var(--surface));font-size:13.5px}
  .ug-radar{position:relative;width:180px;height:180px;margin:6px auto 0}
  .ug-radar i{position:absolute;inset:0;border-radius:50%;border:2px solid var(--gold);opacity:0;animation:ugPing 2.4s infinite}
  .ug-radar i:nth-child(2){animation-delay:.8s}.ug-radar i:nth-child(3){animation-delay:1.6s}
  .ug-radar b{position:absolute;inset:58px;border-radius:50%;background:linear-gradient(135deg,#FFC93C,#F97316);display:grid;place-items:center;font-size:30px;color:#1a1205;box-shadow:0 6px 18px rgba(249,115,22,.4)}
  .ug-radar span{position:absolute;width:12px;height:12px;border-radius:50%;background:var(--ok);box-shadow:0 0 0 3px color-mix(in srgb,var(--ok) 30%,transparent)}
  @keyframes ugPing{0%{transform:scale(.3);opacity:.9}100%{transform:scale(1);opacity:0}}
  .ug-st{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}
  .ug-st div{background:var(--surface);box-shadow:var(--shadow);border-radius:14px;padding:10px 6px;text-align:center}
  .ug-st b{display:block;font-size:20px}.ug-st small{font-size:12px;color:var(--muted)}
  .ug-who{display:flex;align-items:center;gap:10px;background:var(--surface);box-shadow:var(--shadow);border-radius:16px;padding:12px;margin-top:8px}
  .ug-who .t{flex:1;min-width:0}.ug-who b{display:block}.ug-who small{color:var(--muted);font-size:12.5px}
  .ug-who button{border:1px solid var(--line);background:var(--surface);border-radius:12px;min-height:40px;padding:0 12px;font-family:inherit;color:var(--ink)}
  .ug-offer{border-radius:22px;padding:16px;background:var(--night);color:#fff;position:relative;overflow:hidden}
  .ug-offer .tag{background:#FFC93C;color:#1a1205}
  .ug-offer h2{font-size:20px;margin:8px 0 2px;line-height:1.5}.ug-offer .sub{color:var(--concrete);font-size:13px}
  .ug-sum{margin-top:12px;border-radius:14px;background:rgba(255,255,255,.08);padding:12px;text-align:center}
  .ug-sum b{display:block;font-size:24px}.ug-sum span{display:block;color:var(--gold-2);font-size:13px;line-height:1.7}
  .ug-acts{display:grid;grid-template-columns:2fr 1fr;gap:8px;margin-top:12px}
  .ug-acts button{min-height:56px;border-radius:16px;border:0;font:800 16px inherit;font-family:inherit}
  .ug-acts .yes{background:var(--ok);color:#fff}.ug-acts .no{background:rgba(255,255,255,.12);color:#fff}
  .ug-time{font-size:12.5px;color:var(--concrete);margin-top:8px;text-align:center}
  .ug-mini{display:flex;align-items:center;gap:10px;width:100%;border:1px solid color-mix(in srgb,#F97316 45%,transparent);border-radius:16px;padding:12px 14px;margin-bottom:8px;font-family:inherit;text-align:start;background:color-mix(in srgb,#F97316 13%,var(--surface));color:var(--ink);cursor:pointer;box-shadow:var(--shadow)}
  .ug-mini .t{flex:1;min-width:0}.ug-mini b{display:block;font-size:15px}.ug-mini small{display:block;font-size:12.5px;color:var(--muted)}
  .ug-mini em{font-style:normal;background:#FFC93C;color:#1a1205;border-radius:10px;padding:4px 10px;font-weight:800;font-size:13px}`;
  document.head.appendChild(css);

  // صفحهٔ پیگیری
  const scr = document.createElement('section');
  scr.className = 'screen'; scr.id = 's-urg'; scr.setAttribute('aria-label', 'نیروی فوری');
  const anyScr = document.querySelector('.screen');
  if (anyScr) anyScr.parentElement.appendChild(scr);
  wrapW('render', function (prev, ...a) { if (S.cur === 'urg') return renderUrg(); return prev(...a); });

  const left = (iso) => { const m = Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 60000)); return m >= 60 ? `${fa(Math.floor(m / 60))} ساعت${m % 60 ? ` و ${fa(m % 60)} دقیقه` : ""}` : `${fa(m)} دقیقه`; };
  const skillOpts = () => {
    const pick = (r) => (((REG[r] || []).flatMap((s) => s.f || []).find((f) => f.k === 'skills') || {}).opts || []);
    return [...new Set([...pick('worker'), ...pick('specialist')])].slice(0, 24);
  };

  /* ================= کارفرما: فرم ================= */
  S.ug = S.ug || { mine: [], inbox: [], seen: {} };
  window.urgSheet = function () {
    if (!S.auth) { toast('اول وارد شو'); return; }
    const f = (S.ugf = S.ugf || { title: '', skill: '', roles: ['worker'], need: 1, when: 'فردا ۷ صبح', wage: 0, days: 1 });
    const SK = skillOpts();
    sb.innerHTML = `<div class="grab"></div><h3 id="sheetTitle">⚡ نیروی فوری</h3><p class="sub">به همهٔ نیروهای «آماده به کار» استانت می‌رسد؛ اولین کسی که قبول کند، کار مال اوست.</p>
      <span class="label" style="margin-top:0">چه کاری؟</span><input class="field" id="ugT" value="${esc(f.title)}" placeholder="مثلاً بلوک‌چینی دیوار طبقهٔ دوم" oninput="S.ugf.title=this.value">
      <span class="label">مهارت لازم</span><div class="chips" id="ugK">${SK.map((x) => `<button class="chip" aria-pressed="${f.skill === x}" onclick="urgSet('skill',this.getAttribute('aria-pressed')==='true'?'':'${x}')">${esc(x)}</button>`).join('')}</div>
      <span class="label">چه کسی؟</span><div class="chips">${[['worker', 'کارگر'], ['specialist', 'متخصص'], ['both', 'هر دو']].map(([k, n]) => `<button class="chip" aria-pressed="${k === 'both' ? f.roles.length === 2 : f.roles.length === 1 && f.roles[0] === k}" onclick="urgSet('roles','${k}')">${n}</button>`).join('')}</div>
      <span class="label">چند نفر؟</span><div class="stp-n"><button onclick="urgSet('need',-1)" aria-label="کمتر">−</button><b class="num">${fa(f.need)}</b><button onclick="urgSet('need',1)" aria-label="بیشتر">+</button><span>نفر</span></div>
      <span class="label">کی؟</span><div class="chips">${['همین الان', 'امروز عصر', 'فردا ۷ صبح', 'پس‌فردا'].map((x) => `<button class="chip" aria-pressed="${f.when === x}" onclick="urgSet('when','${x}')">${x}</button>`).join('')}</div>
      <span class="label">دستمزد روزانهٔ هر نفر (تومان)</span><div class="numf"><input class="field" id="ugW" data-money="1" inputmode="numeric" value="${f.wage ? moneyFa(f.wage) : ''}" placeholder="مثلاً ۲.۰۰۰.۰۰۰" oninput="urgTot()"><span>تومان</span></div>
      <span class="label">چند روز؟</span><div class="stp-n"><button onclick="urgSet('days',-1)" aria-label="کمتر">−</button><b class="num">${fa(f.days)}</b><button onclick="urgSet('days',1)" aria-label="بیشتر">+</button><span>روز</span></div>
      <div class="cs-tot" id="ugTot"></div>
      <div class="ug-count" id="ugCnt"><span class="rd-dot"></span><span>در حال شمردن نیروهای آماده…</span></div>
      <button class="cta" id="ugGo" onclick="urgSend()">⚡ ارسال درخواست</button>`;
    show();
    if ($('ugW') && window.moneyField) moneyField($('ugW'));
    urgTot(); urgCount();
  };
  window.urgSet = function (k, v) {
    const f = S.ugf;
    if ($('ugT')) f.title = $('ugT').value;
    if ($('ugW')) f.wage = +digits($('ugW').value) || 0;
    if (k === 'need') f.need = Math.max(1, Math.min(10, f.need + v));
    else if (k === 'days') f.days = Math.max(1, Math.min(60, f.days + v));
    else if (k === 'roles') f.roles = v === 'both' ? ['worker', 'specialist'] : [v];
    else f[k] = v;
    if (k === 'skill' && v && !f.title) f.title = v;
    urgSheet();
  };
  window.urgTot = function () {
    const f = S.ugf; if ($('ugW')) f.wage = +digits($('ugW').value) || 0;
    const t = f.wage * f.days * f.need, box = $('ugTot');
    if (box) box.innerHTML = t > 0 ? `<small>جمع کل (${fa(f.need)} نفر × ${fa(f.days)} روز)</small><b class="num">${moneyFa(t)} تومان</b><span>${numWordsT(t)}</span>` : '<small>جمع کل</small><b>—</b><span>دستمزد روزانه را بنویس</span>';
  };
  let cntT = 0;
  function urgCount() {
    clearTimeout(cntT);
    cntT = setTimeout(async () => {
      const f = S.ugf, box = $('ugCnt');
      if (!box) return;
      let n = 0, same = 0;
      if (live()) {
        try { const d = await api('GET', `/urgent/preview?roles=${f.roles.join(',')}${f.skill ? '&skill=' + encodeURIComponent(f.skill) : ''}`); n = d.count; same = d.sameCity; } catch (e) { return; }
      } else n = ADS.filter((a) => a.type === 'work' && a.who !== 'me' && (a.st || 'active') === 'active' && (!f.skill || (a.skills || []).some((s) => s.includes(f.skill) || f.skill.includes(s)) || a.title.includes(f.skill))).length;
      if (!$('ugCnt')) return;
      $('ugCnt').innerHTML = n ? `<span class="rd-dot"></span><span>به <b class="num">${fa(n)}</b> نیروی آماده به کار ${same ? `(${fa(same)} نفر در شهر خودت) ` : ''}می‌رسد.</span>`
        : `<span>⚠</span><span>الان نیروی آماده با این مهارت نیست؛ مهارت را بردار یا «هر دو» را بزن.</span>`;
      const b = $('ugGo'); if (b) b.disabled = !n;
    }, 250);
  }
  window.urgSend = async function () {
    const f = S.ugf; if ($('ugT')) f.title = $('ugT').value.trim(); if ($('ugW')) f.wage = +digits($('ugW').value) || 0;
    if (f.title.length < 3) { toast('بنویس چه کاری است'); return; }
    if (f.wage < 100000) { toast('دستمزد روزانه را بنویس'); return; }
    const b = $('ugGo'); if (b) b.disabled = true;
    if (live()) {
      try {
        const d = await api('POST', '/urgent', { title: f.title, skill: f.skill || null, roles: f.roles, needCount: f.need, startWhen: f.when, dailyWage: f.wage, days: f.days });
        closeSheet(); S.ugf = null;
        toast(`⚡ درخواست به ${fa(d.sentCount)} نیروی آماده رسید`);
        await loadMine(); go('urg');
      } catch (e) { if (b) b.disabled = false; err(e); }
      return;
    }
    // نمایشی
    const id = 'u' + Date.now(), rq = { id, title: f.title, skill: f.skill, needCount: f.need, startWhen: f.when, dailyWage: f.wage, days: f.days, total: f.wage * f.days, status: 'open', sentCount: 6, city: ME().place || 'قشم', expiresAt: new Date(Date.now() + 3 * 3600e3).toISOString(), counts: { sent: 6, accepted: 0, declined: 0, waiting: 6 }, accepted: [] };
    S.ug.mine.unshift(rq); closeSheet(); S.ugf = null; go('urg'); toast('⚡ درخواست به ۶ نیروی آماده رسید');
    setTimeout(() => { rq.counts.declined = 1; rq.counts.waiting = 5; if (S.cur === 'urg') renderUrg(); }, 1800);
    setTimeout(() => {
      const pid = Object.keys(P).find((k) => P[k].role === 'worker') || Object.keys(P)[0];
      rq.accepted.push({ person: { code: pid, name: P[pid].name, role: 'worker' }, demo: pid });
      rq.counts.accepted = 1; rq.counts.waiting = 4; if (rq.accepted.length >= rq.needCount) rq.status = 'filled';
      if (S.cur === 'urg') renderUrg(); toast(`⚡ ${P[pid].name} قبول کرد!`);
    }, 4200);
  };
  async function loadMine() { if (!live()) return; const d = await api('GET', '/urgent/mine'); S.ug.mine = d.items; }

  /* ================= کارفرما: صفحهٔ پیگیری ================= */
  const ST = { open: ['در حال جست‌وجو', 'wait'], filled: ['پیدا شد ✓', 'ok'], cancelled: ['لغو شد', 'no'], expired: ['تمام شد', 'no'] };
  function radar(n) { const dots = Array.from({ length: Math.min(8, n) }, (_, i) => { const a = (i / Math.max(1, Math.min(8, n))) * Math.PI * 2, r = 70; return `<span style="top:${90 + Math.sin(a) * r - 6}px;left:${90 + Math.cos(a) * r - 6}px"></span>`; }).join(''); return `<div class="ug-radar" aria-hidden="true"><i></i><i></i><i></i>${dots}<b>⚡</b></div>`; }
  window.renderUrg = function () {
    const el = $('s-urg'); if (!el) return;
    const L = S.ug.mine || [], cur = L[0];
    el.innerHTML = `${pageBar('نیروی فوری')}
      ${!cur ? `<div class="section"><div class="empty">هنوز درخواست فوری نداری.</div><button class="cta" onclick="urgSheet()">⚡ درخواست نیروی فوری</button></div>` : `
      <div class="section" style="text-align:center">${cur.status === 'open' ? radar(cur.counts.waiting) : ''}
        <h2 style="margin:10px 0 2px;font-size:19px">${esc(cur.title)}</h2>
        <p class="hint" style="margin:0">${esc(cur.startWhen)}، ${moneyFa(cur.dailyWage)} تومان روزانه × ${fa(cur.days)} روز، <span class="tag ${ST[cur.status][1]}">${ST[cur.status][0]}</span></p>
        ${cur.status === 'open' ? `<p class="hint" style="margin:6px 0 0">تا ${left(cur.expiresAt)} دیگر باز است، ${fa(cur.counts.accepted)} از ${fa(cur.needCount)} نفر پیدا شده</p>` : ''}
        <div class="ug-st"><div><b class="num">${fa(cur.counts.sent)}</b><small>دیدند</small></div><div><b class="num" style="color:var(--ok)">${fa(cur.counts.accepted)}</b><small>قبول کردند</small></div><div><b class="num">${fa(cur.counts.waiting)}</b><small>منتظر جواب</small></div></div></div>
      ${cur.accepted.length ? `<div class="section"><div class="sec-head"><h3>نیروهای تو</h3><span>پروژه و قرارداد آماده است</span></div>${cur.accepted.map((a) => `<div class="ug-who"><span class="nt-ic" style="color:var(--ok)">✓</span><span class="t"><b>${esc(a.person.name)}</b><small>قبول کرد، قرارداد را امضا کنید</small></span>
          ${a.conversationId ? `<button onclick="LIVE.openConv('${a.conversationId}')">چت</button>` : a.demo ? `<button onclick="openChatWith('${a.demo}')">چت</button>` : ''}<button onclick="go('proj')">پروژه</button></div>`).join('')}</div>` : ''}
      <div class="section">${cur.status === 'open' ? `<button class="ghost" style="width:100%" onclick="urgCancel('${cur.id}')">لغو درخواست</button>` : `<button class="cta" onclick="urgSheet()">⚡ درخواست تازه</button>`}</div>
      ${L.length > 1 ? `<div class="section"><div class="sec-head"><h3>درخواست‌های قبلی</h3></div><div class="card" style="padding:4px 16px">${L.slice(1, 8).map((x) => `<div class="est-leg"><span>${esc(x.title)}</span><b><span class="tag ${ST[x.status][1]}">${ST[x.status][0]}</span> ${fa(x.counts.accepted)}/${fa(x.needCount)}</b></div>`).join('')}</div></div>` : ''}`}`;
  };
  window.urgCancel = async function (id) {
    if (live()) { try { await api('POST', `/urgent/${id}/cancel`); await loadMine(); } catch (e) { err(e); return; } }
    else { const r = S.ug.mine.find((x) => x.id === id); if (r) r.status = 'cancelled'; }
    renderUrg(); toast('درخواست لغو شد');
  };
  // تازه‌سازی صفحهٔ پیگیری هر ۱۵ ثانیه (رویداد لحظه‌ای هم دارد)
  setInterval(() => { if (S.cur === 'urg' && live() && !document.hidden) loadMine().then(renderUrg).catch(() => {}); }, 15000);
  wrapW('go', function (prev, name, ...a) {
    const r = prev(name, ...a);
    if (name === 'urg') { renderUrg(); if (live()) loadMine().then(() => { if (S.cur === 'urg') renderUrg(); }).catch(err); }
    return r;
  });

  /* ================= نیرو: کار فوری ================= */
  const DEMO_OFFER = () => ({ id: 'demo-u1', title: 'بلوک‌چینی دیوار طبقهٔ دوم', city: 'درگهان', startWhen: 'فردا ۷ صبح', dailyWage: 2200000, days: 3, total: 6600000, needCount: 1, expiresAt: new Date(Date.now() + 2.5 * 3600e3).toISOString(), client: { name: 'گروه ساختمانی توکلی', trust: 92, verified: true }, demo: true });
  async function loadInbox() {
    if (!live()) { if (!S.ug.demoInbox) S.ug.demoInbox = [DEMO_OFFER()]; S.ug.inbox = S.ug.demoInbox; return; }
    const d = await api('GET', '/urgent/inbox'); S.ug.inbox = d.items;
  }
  window.urgOffer = function (id) {
    const o = (S.ug.inbox || []).find((x) => x.id === id); if (!o) { toast('این کار دیگر باز نیست'); return; }
    S.ug.seen[id] = 1;
    sb.innerHTML = `<div class="grab"></div><div class="ug-offer"><span class="tag">⚡ کار فوری</span>
      <h2 id="sheetTitle">${esc(o.title)}</h2><div class="sub">${esc(o.client.name)}${o.client.verified ? ' ✓' : ''}${o.client.trust != null ? '، اعتبار ' + fa(o.client.trust) : ''}، ${esc(o.city)}، ${esc(o.startWhen)}</div>
      <div class="ug-sum"><small>${moneyFa(o.dailyWage)} تومان روزانه × ${fa(o.days)} روز</small><b class="num">${moneyFa(o.total)} تومان</b><span>${numWordsT(o.total)}</span></div>
      ${o.note ? `<p style="margin:10px 0 0;font-size:13.5px;color:var(--concrete)">${esc(o.note)}</p>` : ''}
      <div class="ug-acts"><button class="yes" id="ugYes">قبول می‌کنم</button><button class="no" id="ugNo">نه</button></div>
      <div class="ug-time">${o.needCount > 1 ? fa(o.needCount) + ' نفر لازم است، ' : ''}اولین کسی که قبول کند برنده است، ${left(o.expiresAt)} وقت</div></div>`;
    show();
    $('ugYes').onclick = () => urgAnswer(o, true);
    $('ugNo').onclick = () => urgAnswer(o, false);
  };
  async function urgAnswer(o, yes) {
    const b = $('ugYes'); if (b) b.disabled = true;
    const drop = () => { S.ug.inbox = S.ug.inbox.filter((x) => x.id !== o.id); if (S.ug.demoInbox) S.ug.demoInbox = S.ug.demoInbox.filter((x) => x.id !== o.id); };
    if (!live() || o.demo) {
      closeSheet(); drop();
      if (yes) { toast('⚡ کار مال تو شد! پروژه ساخته شد؛ قرارداد را امضا کن'); } else toast('رد شد');
      if (S.cur === 'home') renderHome();
      return;
    }
    try {
      if (!yes) { await api('POST', `/urgent/${o.id}/decline`); closeSheet(); drop(); toast('رد شد'); if (S.cur === 'home') renderHome(); return; }
      const d = await api('POST', `/urgent/${o.id}/accept`);
      closeSheet(); drop();
      toast('⚡ کار مال تو شد! پروژه ساخته شد؛ قرارداد را امضا کن');
      // سرور آگهی آمادگی را با این قرارداد خاموش کرد؛ اپ هم همین را نشان دهد
      ADS.forEach((x) => { if (x.who === 'me' && x.type === 'work' && (x.st || 'active') === 'active') x.st = 'closed'; });
      if (LIVE.loadProjects) await LIVE.loadProjects(true).catch(() => {});
      if (d.conversationId && LIVE.openConv) LIVE.openConv(d.conversationId); else go('proj');
    } catch (e) {
      closeSheet(); drop(); if (S.cur === 'home') renderHome();
      if (e && (e.code === 'URGENT_CLOSED' || /دیر رسیدی/.test(e.message || ''))) toast('دیر رسیدی؛ نفر دیگری زودتر قبول کرد'); else err(e);
    }
  }
  window.openUrgent = async function (id) {
    try { await loadInbox(); } catch (e) {}
    if ((S.ug.inbox || []).some((x) => x.id === id)) { go('home'); urgOffer(id); return; }
    go('urg');
  };

  /* ================= خانه ================= */
  function offersHTML() {
    const L = S.ug.inbox || [];
    if (!L.length) return '';
    return `<div class="section" id="ugIn"><div class="sec-head"><h3>⚡ کار فوری برای تو${L.length > 1 ? ' (' + fa(L.length) + ')' : ''}</h3><span>اولین قبول برنده است</span></div>
      ${L.map((o) => `<button class="ug-mini" onclick="urgOffer('${o.id}')"><span class="t"><b>${esc(o.title)}</b><small>${esc(o.city)}، ${esc(o.startWhen)}، ${esc(o.client.name)}</small></span><em class="num">${moneyM(o.total)}</em></button>`).join('')}</div>`;
  }

  wrapW('renderHome', function (prev, ...a) {
    const r = prev(...a);
    const host = $('s-home');
    if (!S.auth || !host) return r;
    ['ugBtnSec', 'ugIn'].forEach((id) => { const o = $(id); if (o) o.remove(); });
    const after = $('rdSec') || host.querySelector(':scope > header');
    if (CLIENTS.includes(S.role)) {
      const open = (S.ug.mine || []).find((x) => x.status === 'open');
      const html = `<div class="section" id="ugBtnSec"><button class="ug-btn" onclick="${open ? "go('urg')" : 'urgSheet()'}"><span class="bolt">⚡</span><span class="t"><b>${open ? 'درخواست فوری در جریان' : 'نیروی فوری'}</b><small>${open ? `${fa(open.counts.accepted)} از ${fa(open.needCount)} نفر پیدا شده، ببین` : 'یک درخواست، به همهٔ نیروهای آماده نزدیک؛ اولین قبول برنده'}</small></span></button></div>`;
      if (after) after.insertAdjacentHTML('afterend', html); else host.insertAdjacentHTML('afterbegin', html);
    }
    if (CREW.includes(S.role)) {
      const html = offersHTML();
      if (html) { const at = $('rdSec') || after; if (at) at.insertAdjacentHTML('afterend', html); }
      // نسخهٔ نمایشی: یک پیشنهاد نمونه
      if (!live() && !S.ug.demoInbox) { loadInbox().then(() => { if (S.cur === 'home') renderHome(); }); }
    }
    return r;
  });
  // بارگذاری با «دادهٔ خانه یک‌جا» (homeSync در work.js)
  window.urgSync = function () {
    if (!live()) return Promise.resolve();
    return Promise.all([CLIENTS.includes(S.role) ? loadMine() : null, CREW.includes(S.role) ? loadInbox() : null]);
  };
  window.urgAfterSync = function () {
    // پیشنهاد تازه‌ای که هنوز ندیده ← خودش باز شود (مثل اسنپ)
    if (S.cur !== 'home' || !CREW.includes(S.role) || !live()) return;
    const fresh = (S.ug.inbox || []).find((x) => !S.ug.seen[x.id]);
    if (fresh && !document.querySelector('#sheet.on')) urgOffer(fresh.id);
  };
  // کاوش (حالت نیرو): میان‌بر نیروی فوری برای کارفرماها
  wrapW('renderExplore', function (prev, ...a) {
    const r = prev(...a);
    const st = document.querySelector('#s-explore .rd-strip');
    if (st && CLIENTS.includes(S.role) && S.auth && !st.querySelector('.ug-ex')) st.insertAdjacentHTML('beforeend', '<button class="chip ug-ex" style="margin-inline-start:auto;min-height:36px" onclick="urgSheet()">⚡ نیروی فوری</button>');
    return r;
  });

  /* ================= رویداد لحظه‌ای ================= */
  setInterval(() => {
    const es = window.LIVE && LIVE.es;
    if (!es || es._ug) return;
    es._ug = 1;
    es.addEventListener('urgent', (e) => {
      let d = {}; try { d = JSON.parse(e.data); } catch (x) {}
      if (d.offer && CREW.includes(S.role)) {

      } else if (d.closed) {
        S.ug.inbox = (S.ug.inbox || []).filter((x) => !d.closed.includes(x.id));
        if (S.cur === 'home') renderHome();
      } else if (d.request) {
        loadMine().then(() => { if (S.cur === 'urg') renderUrg(); else if (S.cur === 'home') renderHome(); }).catch(() => {});
      }
    });
  }, 2000);
})();
