/* =================== بلوک · اتصال بخش ۲: پروژه، قرارداد، پرداخت، صورت‌وضعیت، گزارش روزانه، داوری، مدارک، نمونه‌کار ===================
 * بعد از live.js بار می‌شود و فقط وقتی سرور وصل است (LIVE.on) کار می‌کند.
 * روش: دادهٔ API به شکل مخزن‌های نمایشی درمی‌آید (S.projs، S.pays، S.ctr، S.sov، S.daily، S.disp، S.docs، S.pfItems، S.arbMe، S.arbJobs)
 * تا صفحه‌های موجود بدون تغییر ظاهر کار کنند؛ دکمه‌های عمل به API وصل می‌شوند.
 */
(function () {
  'use strict';
  const L = window.LIVE;
  if (!L) return;
  const on = () => L.on && S.auth;
  const api = (...a) => L.api(...a);
  const err = (e) => L.err(e);
  const wrap = (name, fn) => { const prev = window[name]; if (typeof prev !== 'function') return; window[name] = function () { return fn.call(this, prev, ...arguments); }; };
  const key = (i = S.pi) => S.role + ':' + i;
  const cur = (i = S.pi) => (S.projs[S.role] || [])[i];
  const isLive = (i) => { const p = cur(i); return on() && p && p._live; };
  const fresh = (k, ms = 30000) => L.loaded[k] && Date.now() - L.loaded[k] < ms;
  const toEn = (s) => L.toEn(s);
  const fDate = (d) => (d ? L.faDate(d, { day: 'numeric', month: 'long' }) : '');
  const sel = (id) => document.querySelector('#' + id + ' .chip[aria-pressed=true]');
  const chosen = () => document.querySelector('#sb .chip[aria-pressed=true]');

  /* ---------- وقتی به سرور وصل شد: دادهٔ نمایشی کنار می‌رود ---------- */
  function resetStores() {
    S.projs = {}; S.pays = {}; S.ctr = {}; S.sov = {}; S.daily = {};
    S.disp = []; S.docs = {}; S.pfItems = [];
    S.arbMe = null; S.arbJobs = []; S.arbEarn = 0;
  }
  L.onLive = (L.onLive || []).concat(resetStores);
  L.onEnd = (L.onEnd || []).concat(resetStores);

  /* ================= پروژه‌ها ================= */

  function mapProject(x) {
    const who = L.upsertPerson(x.other);
    return {
      t: x.title, who, stage: x.status === 'done' ? 3 : x.stage,
      amt: (x.quantity ? x.quantity + ' · ' : '') + (x.amount ? L.money(x.amount) : x.priceText),
      rating: x.myRating || 0,
      deal: { job: x.title, qty: x.quantity || '—', price: x.priceText, start: x.startText || '', dur: fa(x.durationDays || 0) + ' روز' },
      cid: x.conversationId, meClient: x.myRole === 'client', _id: x.id, _live: true, status: x.status, can: x.can,
      retentionPct: x.retentionPct, _x: x,
    };
  }
  async function loadProjects(force) {
    const k = 'projs:' + S.role;
    if (!force && fresh(k)) return;
    L.loaded[k] = Date.now();
    const d = await api('GET', '/projects?role=' + S.role);
    const old = S.projs[S.role] || [];
    const list = d.items.filter((x) => x.status !== 'cancelled').map(mapProject);
    // داده‌های کلیددار (نقش:شماره) با ترتیب تازه جابه‌جا نشوند
    if (old.map((p) => p._id).join() !== list.map((p) => p._id).join()) {
      [S.pays, S.ctr, S.sov, S.daily].forEach((st) => Object.keys(st).forEach((kk) => { if (kk.startsWith(S.role + ':')) delete st[kk]; }));
    }
    S.projs[S.role] = list;
  }
  L.loadProjects = loadProjects;
  const indexOf = (id) => (S.projs[S.role] || []).findIndex((p) => p._id === id);

  wrap('renderProj', function (prev) {
    if (!on()) return prev();
    if (!S.projs[S.role]) S.projs[S.role] = [];
    prev();
    if (!fresh('projs:' + S.role)) loadProjects().then(() => { if (S.cur === 'proj') prev(); }).catch(err);
  });
  wrap('go', function (prev, name, noPush) {
    // صفحه‌هایی که به فهرست پروژه‌ها تکیه دارند
    if (on() && ['proj', 'disp'].includes(name) && !fresh('projs:' + S.role)) loadProjects().catch(() => {});
    return prev(name, noPush);
  });

  /** همهٔ داده‌های صفحهٔ پروژه: پرداخت، گزارش روزانه، قرارداد، صورت‌وضعیت، فایل‌ها */
  async function loadProjectPage(i) {
    const p = cur(i), k = key(i);
    const [pays, daily, ctr, sts, files] = await Promise.all([
      api('GET', '/projects/' + p._id + '/payments'),
      api('GET', '/projects/' + p._id + '/daily?limit=30'),
      api('GET', '/projects/' + p._id + '/contract').catch(() => null),
      api('GET', '/projects/' + p._id + '/statements'),
      api('GET', '/projects/' + p._id + '/files'),
    ]);
    p._pays = pays; p._files = files.items; p._sts = sts;
    S.pays[k] = pays.items.map((x) => ({
      a: faNum(x.amount),
      f: x.label + ({ recorded: x.recordedByMe ? ' · منتظر تأیید طرف مقابل' : ' · تأیید کن', confirmed: ' · تأیید شد', disputed: ' · اعتراض: ' + (x.disputeReason || '') }[x.status] || ''),
      d: fDate(x.paidOn + 'T12:00:00Z'), _x: x,
    }));
    S.daily[k] = daily.items.map((r) => ({ d: L.dayLabel(r.date + 'T12:00:00Z'), w: r.weather || '—', crew: r.crew, done: r.done, issue: r.issues || '', _x: r }));
    if (ctr) hydrateContract(i, ctr.contract);
    hydrateSov(i, sts);
  }
  wrap('openProjPage', function (prev, i) {
    if (!isLive(i)) return prev(i);
    loadProjectPage(i).then(() => prev(i)).catch(err);
  });
  wrap('openProjByTitle', function (prev, t) {
    if (!on()) return prev(t);
    loadProjects().then(() => prev(t)).catch(err);
  });
  wrap('projSheet', function (prev, i) {
    prev(i);
    if (!isLive(i)) return;
    const p = cur(i);
    const b = document.querySelector('#sb .cta');
    if (b && p.stage === 2 && !p.meClient) { b.textContent = 'پایان کار را کارفرما تأیید می‌کند'; b.disabled = true; }
  });
  async function reloadAfterChange(i, id) {
    await loadProjects(true);
    const j = indexOf(id);
    if (S.cur === 'pdet' && j > -1) { S.pi = j; await loadProjectPage(j); renderPdet(); }
    else { renderProj(); if (j > -1) projSheet(j); }
  }
  wrap('advProj', function (prev, i) {
    if (!isLive(i)) return prev(i);
    const p = cur(i);
    const act = p.stage === 1 ? 'start' : p.stage === 2 ? 'finish' : null;
    if (!act) return;
    api('POST', '/projects/' + p._id + '/' + act)
      .then(async () => {
        toast(act === 'start' ? 'کار شروع شد؛ مرحله: در حال اجرا' : 'پروژه تمام شد؛ حالا امتیاز بده');
        await reloadAfterChange(i, p._id);
        if (act === 'finish') { const j = indexOf(p._id); if (j > -1) setTimeout(() => rateSheet(j), 700); }
      })
      .catch(err);
  });
  wrap('rateSheet', function (prev, i) {
    prev(i);
    if (!isLive(i)) return;
    const b = $('rateB'); if (!b) return;
    b.removeAttribute('onclick');
    b.onclick = async () => {
      const p = cur(i), text = (document.querySelector('#sb textarea') || {}).value || '';
      b.disabled = true;
      try { await api('POST', '/projects/' + p._id + '/review', { rating: S.rv, text: text.trim() || undefined }); closeSheet(); toast('امتیاز ثبت شد'); await reloadAfterChange(i, p._id); }
      catch (e) { err(e); b.disabled = false; }
    };
  });

  /* ---- صفحهٔ پروژه: پرداخت، فایل‌ها، صورت‌وضعیت برای هر دو طرف ---- */
  wrap('renderPdet', function (prev) {
    const i = S.pi;
    if (!isLive(i)) return prev();
    const p = cur(i), k = key(i);
    if (!S.pays[k]) S.pays[k] = [];
    if (!S.daily[k]) S.daily[k] = [];
    prev();
    const root = $('s-pdet');
    // تأیید یا اعتراض به پرداخت‌هایی که طرف مقابل ثبت کرده
    const paySec = [...root.querySelectorAll('.section')].find((s) => s.textContent.includes('دفترچهٔ پرداخت'));
    if (paySec) {
      const rows = paySec.querySelectorAll('.card .need');
      S.pays[k].forEach((x, n) => {
        if (!x._x.can.respond || !rows[n]) return;
        rows[n].insertAdjacentHTML('beforeend', `<span style="display:flex;gap:6px"><button class="mini yes" data-pay="${x._x.id}" data-act="confirm">تأیید</button><button class="mini" data-pay="${x._x.id}" data-act="dispute">اعتراض</button></span>`);
      });
      paySec.querySelectorAll('[data-pay]').forEach((b) => (b.onclick = () => answerPay(b.dataset.pay, b.dataset.act)));
      const s = p._pays && p._pays.summary;
      if (s && s.total) paySec.querySelector('.card').insertAdjacentHTML('afterbegin', `<div class="est-leg"><span>تأییدشده از ${faNum(s.total)}</span><b class="num">${faNum(s.confirmed)} تومان</b></div>`);
    }
    // فایل‌های واقعی پروژه
    const fileSec = [...root.querySelectorAll('.section')].find((s) => s.textContent.includes('فایل‌های پروژه'));
    if (fileSec) {
      const L2 = p._files || [];
      fileSec.querySelector('.card').innerHTML = (L2.length ? L2.map((f) => `<div class="filec" style="padding:8px 0"><span class="fi">${esc((f.name || 'file').split('.').pop().toUpperCase().slice(0, 4))}</span><div style="flex:1;min-width:0"><b>${esc(f.name || 'فایل')}</b><span>${esc(L.fsize(f.size))} · ${esc(L.rel(f.createdAt))}</span></div><button class="mbtn" onclick="window.open('${esc(L.abs(f.url))}','_blank')">دریافت</button>${f.mine ? `<button class="mbtn" data-del="${f.id}">حذف</button>` : ''}</div>`).join('') : '<p style="color:var(--muted);font-size:14px">هنوز فایلی نیست.</p>')
        + `<label class="upl" style="margin-top:8px"><span class="upl-ic">${QI.plus}</span><span>افزودن فایل (عکس یا PDF)</span><input type="file" hidden accept="image/*,.pdf" id="pjFile"></label>`;
      const inp = $('pjFile');
      if (inp) inp.onchange = () => uploadProjectFile(inp);
      fileSec.querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => api('DELETE', '/projects/' + p._id + '/files/' + b.dataset.del).then(refreshPdet).catch(err)));
    }
    // صورت‌وضعیت: فرانت فقط برای پیمانکار/شرکت پیوند دارد؛ کارفرما هم باید ببیند و تأیید کند
    const ctrLink = root.querySelector('.ctr-link');
    if (ctrLink && !root.querySelector('[onclick^="openSov"]') && (!p.meClient || (p._sts && p._sts.items.length))) {
      const v = S.sov[k];
      ctrLink.insertAdjacentHTML('afterend', `<button class="card ctr-link" style="margin-top:8px" onclick="openSov(${i})"><span class="nt-ic">${I.cash}</span><div style="flex:1;text-align:right"><b style="display:block">صورت‌وضعیت</b><span style="font-size:13px;color:var(--muted)">متره × فی${v && v.no ? ' · شمارهٔ ' + fa(v.no) : ''}</span></div><span class="tag ${v && v.st === 'ok' ? 'ok' : 'wait'}">${v ? { draft: 'پیش‌نویس', sent: 'ارسال شد', ok: 'تأیید شد' }[v.st] : 'هنوز نیست'}</span></button>`);
    }
    // عکس‌های گزارش روزانه
    root.querySelectorAll('.dl .dr').forEach((el, n) => {
      const r = S.daily[k][n] && S.daily[k][n]._x;
      if (r && r.photos && r.photos.length) el.insertAdjacentHTML('beforeend', `<div style="display:flex;gap:6px;margin-top:8px;overflow-x:auto">${r.photos.map((u) => `<img src="${esc(L.abs(u))}" alt="" loading="lazy" style="width:72px;height:72px;object-fit:cover;border-radius:10px" onclick="window.open('${esc(L.abs(u))}','_blank')">`).join('')}</div>`);
    });
  });
  async function refreshPdet() { const i = S.pi; await loadProjectPage(i); if (S.cur === 'pdet') renderPdet(); }
  function uploadProjectFile(inp) {
    const f = inp.files && inp.files[0]; if (!f) return;
    const fd = new FormData(); fd.append('file', f);
    toast('در حال بارگذاری…');
    api('POST', '/projects/' + cur()._id + '/files', fd).then(() => { toast('فایل به پروژه اضافه شد'); return refreshPdet(); }).catch(err);
  }
  function answerPay(id, act) {
    if (act === 'dispute') {
      sb.innerHTML = `<div class="grab"></div><h3 id="sheetTitle">اعتراض به پرداخت</h3><p class="sub">چرا این پرداخت درست نیست؟</p><textarea class="field" id="pdR" placeholder="مثلاً: این مبلغ به حسابم نرسیده"></textarea><button class="cta" id="pdGo">ثبت اعتراض</button>`;
      show();
      $('pdGo').onclick = () => { const r = $('pdR').value.trim(); if (r.length < 3) { toast('دلیل را بنویس'); return; } api('POST', '/payments/' + id + '/dispute', { reason: r }).then(() => { closeSheet(); toast('اعتراض ثبت شد'); return refreshPdet(); }).catch(err); };
      return;
    }
    api('POST', '/payments/' + id + '/confirm').then(() => { toast('پرداخت تأیید شد'); return refreshPdet(); }).catch(err);
  }
  wrap('addPay', function (prev, k) {
    prev(k);
    const i = +String(k).split(':')[1];
    if (!isLive(i)) return;
    const b = document.querySelector('#sb .cta'); if (!b) return;
    b.removeAttribute('onclick');
    b.onclick = async () => {
      const a = $('payA').value.trim(); if (!a) { toast('مبلغ را بنویس'); return; }
      b.disabled = true;
      try {
        await api('POST', '/projects/' + cur(i)._id + '/payments', { amount: a, label: (chosen() || {}).textContent || 'سایر' });
        closeSheet(); toast('پرداخت ثبت شد؛ طرف مقابل تأیید می‌کند'); await refreshPdet();
      } catch (e) { err(e); b.disabled = false; }
    };
  });
  wrap('addDaily', function (prev, k) {
    prev(k);
    const i = +String(k).split(':')[1];
    if (!isLive(i)) return;
    const b = document.querySelector('#sb .cta'); if (!b) return;
    b.removeAttribute('onclick');
    b.onclick = async () => {
      const t = $('dDone').value.trim(); if (!t) { toast('کارهای امروز را بنویس'); return; }
      const fd = new FormData();
      fd.append('done', t);
      fd.append('weather', (chosen() || {}).textContent || '');
      fd.append('crew', toEn($('crewN').value) || '0');
      if ($('dIss').value.trim()) fd.append('issues', $('dIss').value.trim());
      const ph = document.querySelector('#sb input[type=file]');
      if (ph && ph.files[0]) fd.append('photos', ph.files[0]);
      b.disabled = true;
      try { await api('POST', '/projects/' + cur(i)._id + '/daily', fd); closeSheet(); toast('گزارش ثبت شد و برای طرف مقابل رفت'); await refreshPdet(); }
      catch (e) { err(e); b.disabled = false; }
    };
  });

  /* ================= قرارداد ================= */

  function hydrateContract(i, c) {
    const p = cur(i);
    const mine = c.signatures[c.mySide], theirs = c.signatures[c.mySide === 'client' ? 'provider' : 'client'];
    S.ctr[key(i)] = {
      ms: c.terms.milestones.map((m) => [m.title, m.pct]), days: c.terms.durationDays, ret: c.terms.retentionPct,
      me: !!mine, them: !!theirs, p, _c: c,
    };
  }
  async function loadContract(i) { const d = await api('GET', '/projects/' + cur(i)._id + '/contract'); hydrateContract(i, d.contract); return d.contract; }
  wrap('openContract', function (prev, i) {
    if (!isLive(i)) return prev(i);
    loadContract(i).then(() => prev(i)).catch(err);
  });
  wrap('renderCtr', function (prev) {
    prev();
    const c = S.ctr[key()];
    if (!isLive(S.pi) || !c || !c._c) return;
    const t = c._c.terms;
    const head = document.querySelector('#s-ctr .pp-head small');
    if (head) head.textContent = `شمارهٔ ${t.number} · ${t.dateFa}${c._c.version > 1 ? ' · نسخهٔ ' + fa(c._c.version) : ''}`;
    // متن نهایی و امضاشده همان متن سرور است
    const paper = document.querySelector('#s-ctr .paper');
    if (paper && c._c.status === 'active') paper.insertAdjacentHTML('beforeend', `<p class="hint" style="margin-top:10px;word-break:break-all">اثر انگشت متن: ${esc(c._c.contentHash.slice(0, 16))}…</p>`);
    document.querySelectorAll('#s-ctr button').forEach((b) => {
      if ((b.getAttribute('onclick') || '').includes('فایل PDF قرارداد')) { b.removeAttribute('onclick'); b.onclick = () => window.open(L.abs(c._c.printUrl), '_blank'); b.textContent = 'نسخهٔ چاپی / ذخیره به PDF'; }
    });
    if (c._c.status === 'void') { const s = document.querySelector('#s-ctr .ctr-steps'); if (s) s.insertAdjacentHTML('afterend', '<div class="note" style="margin-top:10px">این قرارداد با لغو پروژه باطل شد.</div>'); }
  });
  async function saveContract(k, body) {
    const i = +k.split(':')[1];
    try { const d = await api('PATCH', '/projects/' + cur(i)._id + '/contract', body); hydrateContract(i, d.contract); closeSheet(); renderCtr(); toast(d.contract.version > 1 && body ? 'قرارداد به‌روز شد؛ امضاهای قبلی باید تکرار شود' : 'قرارداد به‌روز شد'); }
    catch (e) { err(e); }
  }
  wrap('ctrPlanSave', function (prev, k) {
    if (!isLive(+k.split(':')[1])) return prev(k);
    if (!peValid()) return;
    saveContract(k, { milestones: PE.ms.map((m) => ({ title: String(m[0]).trim(), pct: +m[1] })), durationDays: peNum($('ctrD').value) || undefined, retentionPct: S._ret });
  });
  wrap('ctrSave', function (prev, k) {
    if (!isLive(+k.split(':')[1])) return prev(k);
    const c = S.ctr[k], n = c.ms.length;
    if (msSum(n) !== 100) { toast('جمع درصدها باید ۱۰۰ باشد'); return; }
    const ms = c.ms.map((m, j) => ({ title: $('msn' + j).value.trim() || m[0], pct: +toEn($('msp' + j).value) }));
    saveContract(k, { milestones: ms, durationDays: +toEn($('ctrD').value) || undefined, retentionPct: S._ret });
  });
  wrap('ctrSign', function (prev, k) {
    prev(k);
    const i = +k.split(':')[1];
    if (!isLive(i)) return;
    const b = document.querySelector('#sb .cta'), sub = document.querySelector('#sb .sub');
    if (!b) return;
    b.removeAttribute('onclick'); b.disabled = true;
    if (sub) sub.textContent = 'در حال فرستادن کد به موبایلت…';
    api('POST', '/projects/' + cur(i)._id + '/contract/sign-code')
      .then((d) => {
        S._sigHash = d.contentHash;
        if (sub) sub.innerHTML = 'کد ۵ رقمی پیامک‌شده را وارد کن' + (d.devCode ? ` (حالت آزمایشی سرور: <b dir="ltr">${fa(d.devCode)}</b>)` : '');
        b.disabled = false;
      })
      .catch((e) => { err(e); closeSheet(); });
    b.onclick = async () => {
      const code = toEn($('sigC').value).trim();
      if (!/^\d{5}$/.test(code)) { toast('کد ۵ رقمی است'); return; }
      b.disabled = true;
      try {
        const d = await api('POST', '/projects/' + cur(i)._id + '/contract/sign', { code, contentHash: S._sigHash });
        hydrateContract(i, d.contract); closeSheet(); renderCtr();
        toast(d.contract.status === 'active' ? 'هر دو طرف امضا کردند؛ قرارداد فعال شد' : 'امضای تو ثبت شد؛ منتظر امضای طرف مقابل');
      } catch (e) { err(e); b.disabled = false; }
    };
  });

  /* ================= صورت‌وضعیت ================= */

  function hydrateSov(i, sts) {
    const k = key(i), p = cur(i);
    const open = sts.items.find((s) => ['draft', 'sent', 'rejected'].includes(s.status));
    const last = open || sts.items[0];
    const st = (s) => ({ draft: 'draft', rejected: 'draft', sent: 'sent', approved: 'ok' }[s.status]);
    if (last) {
      // جزئیات ردیف‌ها در فهرست نیست؛ هنگام باز کردن صفحه گرفته می‌شود
      S.sov[k] = Object.assign(S.sov[k] || {}, { no: last.number, st: st(last), _id: last.id, _s: last, _new: false });
    } else {
      S.sov[k] = { no: 1, st: 'draft', items: (sts.nextBase || []).map(mapRow), _new: true, _s: null };
    }
    S.sov[k].ret = p.retentionPct || 0;
    S.sov[k].ins = 6.67;
  }
  const mapRow = (r) => ({ n: r.title, u: r.unit, q: r.qty, done: r.done, prev: r.prevDone, p: r.unitPrice, key: r.key });
  async function loadSov(i) {
    const p = cur(i);
    const sts = await api('GET', '/projects/' + p._id + '/statements');
    p._sts = sts;
    hydrateSov(i, sts);
    const v = S.sov[key(i)];
    if (v._id) {
      const d = await api('GET', '/statements/' + v._id);
      Object.assign(v, { items: d.statement.items.map(mapRow), _s: d.statement, ret: d.statement.retentionPct, ins: d.statement.insurancePct });
      // صورت‌وضعیت قبلی تأیید شده ← صورت‌وضعیت تازه از ادامهٔ همان ردیف‌ها (فقط مجری)
      if (v.st === 'ok' && !p.meClient) Object.assign(v, { no: v.no + 1, st: 'draft', _id: null, _new: true, items: (sts.nextBase || []).map(mapRow), ins: 6.67, ret: p.retentionPct || 0 });
    }
    if (!v.items) v.items = [];
  }
  wrap('openSov', function (prev, i) {
    if (!isLive(i)) return prev(i);
    S.pi = i;
    loadSov(i).then(() => prev(i)).catch(err);
  });
  const sovTotals = (v) => {
    const val = (f) => Math.round(v.items.reduce((s, r) => s + f(r) * r.p, 0));
    const doneV = val((r) => r.done), prevV = val((r) => r.prev), cur2 = doneV - prevV;
    const ret = Math.round((cur2 * (v.ret || 0)) / 100), ins = Math.round((cur2 * (v.ins || 0)) / 100);
    return { doneV, prevV, cur: cur2, ret, ins, pay: cur2 - ret - ins, tot: val((r) => r.q) };
  };
  wrap('renderSov', function (prev, soft) {
    const i = S.pi;
    if (!isLive(i)) return prev(soft);
    const p = cur(i), v = S.sov[key(i)];
    prev(soft);
    const root = $('s-sov'), T = sovTotals(v), provider = !p.meClient;
    // درصد پیشرفت و مبلغ سرِ صفحه با ردیف‌های واقعی
    const pct = T.tot ? Math.round(((T.doneV) / T.tot) * 100) : 0;
    const ring = root.querySelector('.sov-ring b'); if (ring) ring.textContent = fa(pct) + '٪';
    const h2 = root.querySelector('.sov-hero h2'); if (h2) h2.textContent = faNum(T.cur) + ' تومان';
    // خلاصهٔ مالی با درصدهای همین صورت‌وضعیت (حسن انجام کار از قرارداد)
    const card = [...root.querySelectorAll('.card')].find((c) => c.textContent.includes('خلاصهٔ مالی'));
    if (card) {
      card.innerHTML = `<span class="label" style="margin-top:0">خلاصهٔ مالی</span>` +
        [['کل کار انجام‌شده تا امروز', T.doneV], ['کسر صورت‌وضعیت‌های قبلی', -T.prevV], ['کار این دوره', T.cur], [`کسر حسن انجام کار (${fa(v.ret || 0)}٪)`, -T.ret], [`کسر سهم بیمه (${fa(String(v.ins || 0)).replace('.', '٫')}٪)`, -T.ins]]
          .map((x) => `<div class="est-leg"><span>${x[0]}</span><b class="num" style="${x[1] < 0 ? 'color:var(--bad)' : ''}">${x[1] < 0 ? '−' : ''}${faNum(Math.abs(x[1]))}</b></div>`).join('') +
        `<div class="est-leg sov-net"><span>قابل پرداخت</span><b class="num">${faNum(T.pay)} تومان</b></div>`;
    }
    if (!provider) root.querySelectorAll('.sr-st').forEach((x) => x.remove());
    const acts = [...root.querySelectorAll('.section')].pop();
    if (v._s && v._s.status === 'rejected' && v.st === 'draft') acts.insertAdjacentHTML('afterbegin', `<div class="note" style="margin-bottom:10px">${I.warn}<span>کارفرما رد کرد: ${esc(v._s.rejectReason || '')}</span></div>`);
    if (provider && v.st === 'draft') {
      acts.insertAdjacentHTML('afterbegin', `<button class="ghost" style="width:100%;margin-bottom:8px" id="sovAdd">+ ردیف کار (عنوان، واحد، مقدار، فی)</button>`);
      $('sovAdd').onclick = sovAddRow;
      if (!v.items.length) {
        const rows = [...root.querySelectorAll('.section')].find((s) => s.textContent.includes('ردیف‌های کار'));
        if (rows) rows.insertAdjacentHTML('beforeend', '<div class="empty">اولین صورت‌وضعیت است؛ ردیف‌های کار (متره) را اضافه کن.</div>');
        const send = acts.querySelector('.cta'); if (send) send.disabled = true;
      }
    }
    if (!provider && v.st === 'sent') {
      const g = acts.querySelector('.ghost'); if (g) g.remove();
      acts.insertAdjacentHTML('afterbegin', `<div style="display:flex;gap:8px"><button class="cta" style="flex:1" id="sovOk">تأیید صورت‌وضعیت</button><button class="ghost" style="flex:1" id="sovNo">رد و توضیح</button></div>`);
      $('sovOk').onclick = () => sovAnswer('approve');
      $('sovNo').onclick = () => sovAnswer('reject');
    }
    if (!provider && v.st === 'draft') { const c = acts.querySelector('.cta'); if (c) { c.disabled = true; c.textContent = 'مجری هنوز صورت‌وضعیت را نفرستاده'; } }
    if (v.st === 'ok') {
      const c = acts.querySelector('.cta');
      if (c && v._s) { c.removeAttribute('onclick'); c.onclick = () => payStatement(v); }
    }
  });
  function sovAddRow() {
    sb.innerHTML = `<div class="grab"></div><h3 id="sheetTitle">ردیف کار</h3><p class="sub">از متره یا فهرست‌بهای توافق‌شده</p>
      <span class="label">عنوان کار</span><input class="field" id="srN" placeholder="مثلاً بتن‌ریزی فونداسیون">
      <span class="label">واحد</span><div class="chips" id="srU">${['متر مربع', 'متر مکعب', 'کیلوگرم', 'متر طول', 'عدد', 'روز'].map((x, k) => `<button class="chip" aria-pressed="${k === 0}" onclick="pickOne(this)">${x}</button>`).join('')}</div>
      <span class="label">مقدار کل</span><input class="field num" inputmode="decimal" id="srQ" placeholder="مثلاً ۴۲">
      <span class="label">انجام‌شده تا امروز</span><input class="field num" inputmode="decimal" id="srD" placeholder="مثلاً ۲۰">
      <span class="label">فی (تومان)</span><div class="numf"><input class="field" inputmode="numeric" id="srP" placeholder="۴٬۲۰۰٬۰۰۰"><span>تومان</span></div>
      <button class="cta" id="srGo">افزودن</button>`;
    show();
    $('srGo').onclick = () => {
      const n = $('srN').value.trim(), num = (x) => +toEn(x).replace(/[٬,\s]/g, '').replace('٫', '.');
      const q = num($('srQ').value), d = num($('srD').value || '0'), pr = num($('srP').value);
      if (n.length < 2 || !(q > 0) || !(pr >= 0) || !(d >= 0)) { toast('عنوان، مقدار و فی را کامل بنویس'); return; }
      if (d > q) { toast('انجام‌شده از مقدار کل بیشتر است'); return; }
      S.sov[key()].items.push({ n, u: sel('srU').textContent, q, done: d, prev: 0, p: Math.round(pr) });
      closeSheet(); renderSov(true);
    };
  }
  wrap('sovSend', async function (prev, k) {
    const i = +k.split(':')[1];
    if (!isLive(i)) return prev(k);
    const v = S.sov[k], p = cur(i);
    const items = v.items.map((r) => ({ key: r.key, title: r.n, unit: r.u, qty: r.q, unitPrice: r.p, done: r.done }));
    try {
      let id = v._id;
      if (!id) id = (await api('POST', '/projects/' + p._id + '/statements', { items, insurancePct: v.ins, retentionPct: v.ret })).statement.id;
      else await api('PATCH', '/statements/' + id, { items });
      await api('POST', '/statements/' + id + '/send');
      toast('صورت‌وضعیت برای کارفرما فرستاده شد');
      await loadSov(i); renderSov(true);
    } catch (e) { err(e); }
  });
  function sovAnswer(act) {
    const v = S.sov[key()];
    if (act === 'approve') {
      api('POST', '/statements/' + v._id + '/approve', {}).then(async () => { toast('صورت‌وضعیت تأیید شد'); await loadSov(S.pi); renderSov(true); }).catch(err);
      return;
    }
    sb.innerHTML = `<div class="grab"></div><h3 id="sheetTitle">رد صورت‌وضعیت</h3><p class="sub">مجری اصلاح می‌کند و دوباره می‌فرستد</p><textarea class="field" id="svR" placeholder="کدام ردیف درست نیست؟"></textarea><button class="cta" id="svGo">ثبت</button>`;
    show();
    $('svGo').onclick = () => { const r = $('svR').value.trim(); if (r.length < 3) { toast('دلیل را بنویس'); return; } api('POST', '/statements/' + v._id + '/reject', { reason: r }).then(async () => { closeSheet(); toast('برای مجری فرستاده شد'); await loadSov(S.pi); renderSov(true); }).catch(err); };
  }
  function payStatement(v) {
    const amount = v._s.totals.payable;
    api('POST', '/projects/' + cur()._id + '/payments', { amount, label: 'صورت‌وضعیت', statementId: v._s.id })
      .then(() => toast('در دفترچهٔ پرداخت ثبت شد؛ طرف مقابل تأیید می‌کند'))
      .catch(err);
  }

  /* ================= حل اختلاف و داوری حضوری (طرفین) ================= */

  const CASE_ST = { matching: 'match', offered: 'match', assigned: 'assigned', reported: 'report', final: 'done' };
  function mapDispute(x) {
    const withId = L.upsertPerson({ code: x.other.code, name: x.other.name, role: x.other.role });
    const c = x.case;
    let arb;
    if (c) {
      const who = c.arbiter ? L.upsertPerson({ code: c.arbiter.code, name: c.arbiter.name, role: c.arbiter.role, title: c.arbiter.title, rating: c.arbiter.rating, doneCount: c.arbiter.casesDone, avatarUrl: c.arbiter.avatarUrl }, c.arbiter.city) : null;
      if (who && P[who] && !P[who].place) P[who].place = c.arbiter.city;
      arb = {
        st: c.round === 2 && c.status === 'reported' ? 'appeal' : CASE_ST[c.status] || 'match',
        paid: c.paymentStatus !== 'unpaid', field: c.field, F: c.fieldName, amt: c.amountMillion,
        fee: c.fee, travel: c.travel, total: c.total, blk: c.commission, res: c.arbiterShare - c.travel, pct: c.commissionPct,
        who, when: c.visitText || '', rej: c.rejectUsed ? 1 : 0, rated: !x.can.rate,
        rep: c.report ? { m: c.report.measure, c: c.report.compare, v: c.report.verdict + ': ' + c.report.remedy, ph: c.photos.length, photos: c.photos.map(L.abs) } : null,
        _c: c,
      };
      if (x.status === 'decided') arb.st = 'done';
    }
    return {
      id: x.id, proj: x.projectTitle, with: withId, why: x.reason, st: x.stage, desc: x.description, ask: x.ask,
      time: L.rel(x.createdAt), mine: x.mine, place: x.city, late: x.talkOver, arb, _live: true, _x: x,
    };
  }
  async function loadDisputes(force) {
    if (!force && fresh('disp', 20000)) return;
    L.loaded.disp = Date.now();
    const d = await api('GET', '/disputes');
    S.disp = d.items.map(mapDispute);
  }
  L.loadDisputes = loadDisputes;
  wrap('renderDisp', function (prev) {
    if (!on()) return prev();
    prev();
    if (!fresh('disp', 20000)) loadDisputes().then(() => { if (S.cur === 'disp') prev(); }).catch(err);
    // شبیه‌سازی بازدید در نسخهٔ واقعی نیست
    document.querySelectorAll('#s-disp button').forEach((b) => { if ((b.getAttribute('onclick') || '').startsWith('arbVisit')) b.remove(); });
  });
  const D = (id) => S.disp.find((x) => x.id === id);
  const liveD = (id) => on() && D(id) && D(id)._live;
  async function afterDisp(msg) { if (msg) toast(msg); await loadDisputes(true); if (S.cur === 'disp') renderDisp(); }
  wrap('arbBox', function (prev, d) {
    if (!d._live || !d.arb || d.arb._c.status !== 'awaiting_payment') return prev(d);
    const c = d.arb._c;
    return `<div class="arbbox"><b>${c.round === 2 ? 'اعتراض ثبت شد؛ منتظر پرداخت هزینهٔ بازبینی' : 'منتظر پرداخت امانی'}</b>
      <span>${c.paidByMe ? `مبلغ <b class="num">${mny(c.total)}</b> را طبق راهنما پرداخت کن؛ بعد از تأیید بلوک، حل‌کنندهٔ بی‌طرف تعیین می‌شود.` : 'طرف مقابل باید هزینه را پرداخت کند.'}</span>
      ${c.paidByMe ? `<button class="ghost" style="width:100%;margin-top:8px" onclick="LIVE.payInfo('${d.id}')">راهنمای پرداخت</button>` : ''}</div>`;
  });
  L.payInfo = (id) => showPayment(D(id).arb._c.total, L._payInfo && L._payInfo[id]);
  function showPayment(amount, instructions) {
    sb.innerHTML = `<div class="grab"></div><h3 id="sheetTitle">پرداخت امانی</h3><p class="sub">پیش از تعیین حل‌کننده · پول نزد بلوک امانت می‌ماند</p>
      <div class="card arb-fee"><div class="af-row tot"><span>مبلغ</span><b class="num">${mny(amount)}</b></div></div>
      <div class="note" style="margin-top:12px">${I.shield}<span>${esc(instructions || 'برای پرداخت با پشتیبانی بلوک در چت هماهنگ کن؛ بعد از تأیید پرداخت، حل‌کننده تعیین می‌شود.')}</span></div>
      <div class="note" style="margin-top:8px">${I.shield}<span>اگر حل‌کننده سر قرار نیاید، کل مبلغ برمی‌گردد.</span></div>
      <button class="cta" onclick="closeSheet()">فهمیدم</button>`;
    show();
  }
  wrap('dispSave', function (prev) {
    if (!on()) return prev();
    const pk = sel('dpP'), d = $('dpD').value.trim();
    if (!pk) { toast('پروژه‌ای برای اختلاف نداری'); return; }
    if (d.length < 10) { toast('شرح ماجرا را کمی کامل‌تر بنویس'); return; }
    const p = cur(+pk.dataset.k);
    if (!p || !p._live) { toast('پروژه پیدا نشد'); return; }
    api('POST', '/projects/' + p._id + '/disputes', { reason: sel('dpW').textContent, ask: sel('dpA').textContent, description: d })
      .then(() => { closeSheet(); return afterDisp('پرونده ثبت شد؛ ۴۸ ساعت برای گفت‌وگو فرصت دارید'); })
      .catch(err);
  });
  wrap('dispNew', function (prev) {
    if (!on()) return prev();
    if (!fresh('projs:' + S.role)) { loadProjects().then(() => prev()).catch(err); return; }
    prev();
  });
  wrap('dispClose', function (prev, id) { if (!liveD(id)) return prev(id); api('POST', '/disputes/' + id + '/settle').then(() => afterDisp('پرونده با توافق بسته شد')).catch(err); });
  wrap('arbPay', function (prev) {
    const q = S.arbQ;
    if (!q || !liveD(q.id)) return prev();
    api('POST', '/disputes/' + q.id + '/arbitration', { field: q.field, amountMillion: q.amt, multi: !!q.multi, agree: true })
      .then(async (r) => {
        L._payInfo = Object.assign(L._payInfo || {}, { [q.id]: r.payment.instructions });
        await afterDisp();
        showPayment(r.payment.amount, r.payment.instructions);
      })
      .catch(err);
  });
  /* پیش‌نمایش هزینه از سرور (رفت‌وآمد بر اساس حل‌کننده‌های واقعی در دسترس) */
  let quoteT = null;
  function serverFee() {
    const q = S.arbQ;
    if (!q || !liveD(q.id)) return;
    clearTimeout(quoteT);
    quoteT = setTimeout(() => {
      api('GET', `/disputes/${q.id}/quote?field=${q.field}&amountMillion=${q.amt}&multi=${!!q.multi}`)
        .then((r) => {
          const x = r.quote, box = $('arbFee');
          if (!box || S.arbQ !== q) return;
          const F = ARB_F.find((f) => f.k === x.field), am = ARB_AMT.find((a) => x.amountMillion <= a[0]);
          box.innerHTML = arbFeeHTML({ fee: x.fee, F, am, travel: x.travel, tvk: x.travelKind, pct: x.commissionPct, cx: x.complex ? 1 : 0, total: x.total }) +
            (x.available ? '' : '<small class="af-why" style="color:var(--warn)">فعلاً حل‌کنندهٔ تأییدشده‌ای در این حوزه آزاد نیست؛ بعد از پرداخت، بلوک یکی را تعیین می‌کند.</small>');
        })
        .catch(() => {});
    }, 250);
  }
  wrap('arbSheet', function (prev) { prev(); serverFee(); });
  wrap('arbFeeUpd', function (prev) { prev(); serverFee(); });
  wrap('docsOf', function (prev) {
    // تا مدارک واقعی نیامده، وضعیت نمایشی («تأیید شده») نشان داده نشود
    if (on() && !S.docs[S.role]) { loadDocs().catch(() => {}); return []; }
    return prev();
  });
  wrap('arbReject', function (prev, id) { if (!liveD(id)) return prev(id); api('POST', '/disputes/' + id + '/reject-arbiter').then(() => afterDisp('حل‌کنندهٔ دیگری تعیین می‌شود')).catch(err); });
  wrap('arbAccept', function (prev, id) {
    if (!liveD(id)) return prev(id);
    api('POST', '/disputes/' + id + '/accept').then((r) => afterDisp(r.dispute.status === 'decided' ? 'پرونده بسته شد؛ سهم حل‌کننده آزاد شد' : 'قبول تو ثبت شد؛ با قبول طرف مقابل یا پایان مهلت اعتراض، پرونده بسته می‌شود')).catch(err);
  });
  wrap('arbAppealGo', function (prev, id) {
    if (!liveD(id)) return prev(id);
    api('POST', '/disputes/' + id + '/appeal', { reason: $('apW').value.trim() })
      .then(async (r) => { closeSheet(); L._payInfo = Object.assign(L._payInfo || {}, { [id]: r.payment.instructions }); await afterDisp(); showPayment(r.payment.amount, r.payment.instructions); })
      .catch(err);
  });
  wrap('arbReport', function (prev, id) {
    prev(id);
    const d = D(id);
    if (!liveD(id) || !d.arb.rep) return;
    const box = document.querySelector('#sb .arb-ph');
    if (box) box.innerHTML = d.arb.rep.photos.map((u, k) => `<span style="--k:${k};padding:0;overflow:hidden"><img src="${esc(u)}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover" onclick="window.open('${esc(u)}','_blank')"></span>`).join('');
  });
  wrap('arbRate', function (prev, id) {
    prev(id);
    if (!liveD(id)) return;
    const b = document.querySelector('#sb .cta'); if (!b) return;
    b.removeAttribute('onclick');
    b.onclick = () => {
      const ch = [...document.querySelectorAll('#sb .chips')];
      const rating = +toEn((ch[0].querySelector('[aria-pressed=true]') || {}).textContent || '5').replace(/\D/g, '') || 5;
      const impartial = ((ch[1] && ch[1].querySelector('[aria-pressed=true]')) || {}).textContent !== 'نه';
      api('POST', '/disputes/' + id + '/rate', { rating, impartial }).then(() => { closeSheet(); return afterDisp('امتیاز ثبت شد'); }).catch(err);
    };
  });

  /* ================= حل‌کنندهٔ حضوری (مهندس/متخصص) ================= */

  const RANGE_A = { 'فقط شهر خودم': 'city', 'کل استان': 'province', 'استان‌های همسایه': 'neighbors' };
  const RANGE_A2 = { city: 'فقط شهر خودم', province: 'کل استان', neighbors: 'استان‌های همسایه' };
  const JOB_ST = { offered: 'new', assigned: 'acc', reported: 'done', appealed: 'done', final: 'done' };
  async function loadArb(force) {
    if (!force && fresh('arb', 20000)) return;
    L.loaded.arb = Date.now();
    const [me, jobs] = await Promise.all([api('GET', '/arbitration/me'), api('GET', '/arbitration/jobs')]);
    L.arbHome = me;
    const a = me.arbiter;
    S.arbMe = !a || a.status === 'rejected' ? null : { st: a.status === 'approved' ? 'ok' : a.status === 'pending' ? 'review' : 'form', fields: a.fields, range: RANGE_A2[a.range] || a.range };
    S.arbEarn = me.stats ? me.stats.earned : 0;
    S.arbJobs = jobs.items.map((j, n) => {
      const ps = j.dispute.parties.map((x, m) => { const id = '_arbp_' + j.id + m; P[id] = { role: 'general', name: x.name, ini: L.ini(x.name), title: '', place: j.dispute.city, week: [], rating: 0, done: 0, revN: 0 }; return id; });
      return { id: j.id, proj: j.dispute.projectTitle, a: ps[0], b: ps[1] || ps[0], field: j.field, issue: j.dispute.description, place: j.dispute.city, amt: j.amountMillion, when: j.visitText || 'بعد از قبول، زمان بازدید را تعیین می‌کنی', st: JOB_ST[j.status] || 'no', _share: j.arbiterShare, _round: j.round, _live: true, _j: j };
    });
  }
  L.loadArb = loadArb;
  // سهم واقعی حل‌کننده (با رفت‌وآمد) به‌جای محاسبهٔ نمایشی
  wrap('arbFee', function (prev, a, place) {
    const f = prev(a, place);
    if (a && a._live && a._share != null) return Object.assign({}, f, { res: a._share, travel: 0 });
    return f;
  });
  wrap('renderArbJ', function (prev) {
    if (!on()) return prev();
    prev();
    if (!fresh('arb', 20000)) { loadArb().then(() => { if (S.cur === 'arbj') renderArbJ(); }).catch(err); return; }
    const el = $('s-arbj');
    const h = L.arbHome;
    // شرایط واقعی
    if (h && el.querySelector('.arbj-c')) {
      const card = el.querySelector('.arbj-c').parentElement;
      card.innerHTML = h.checklist.map((c) => `<div class="arbj-c ${c.ok ? 'ok' : ''}"><i>${c.ok ? '✓' : '✕'}</i><span>${esc(c.label)}</span></div>`).join('') + '<p class="hint" style="margin:8px 0 0">شرایط راهنماست؛ تصمیم نهایی با بررسی بلوک است.</p>';
      if (h.arbiter && h.arbiter.status === 'rejected') card.insertAdjacentHTML('beforebegin', `<div class="note" style="margin-bottom:10px">${I.warn}<span>درخواست قبلی تأیید نشد: ${esc(h.arbiter.rejectReason || '')}</span></div>`);
    }
    // بارگذاری واقعی مدرک
    const up = el.querySelector('.arbj-up');
    if (up && S.arbQ2 && !S.arbMe) {
      up.removeAttribute('onclick');
      up.innerHTML = L.arbDoc ? '✓ ' + esc(L.arbDoc.name) : '+ بارگذاری تصویر یا PDF مدرک';
      up.onclick = () => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*,.pdf'; i.onchange = () => { if (i.files[0]) { L.arbDoc = i.files[0]; S.arbQ2.doc = true; renderArbJ(); } }; i.click(); };
    }
  });
  wrap('arbJoin', function (prev) {
    if (!on()) return prev();
    const q = S.arbQ2;
    if (!L.arbDoc) { toast('تصویر مدرک را بارگذاری کن'); return; }
    const fd = new FormData();
    fd.append('file', L.arbDoc);
    fd.append('fields', q.fields.join(','));
    fd.append('range', RANGE_A[q.range] || 'province');
    fd.append('pledge', String(!!q.pledge));
    api('POST', '/arbitration/apply', fd)
      .then(async () => { L.arbDoc = null; toast('درخواستت ثبت شد؛ بلوک مدرک و سابقه‌ات را بررسی می‌کند'); await loadArb(true); renderArbJ(); })
      .catch(err);
  });
  wrap('arbJob', function (prev, id, st) {
    const j = S.arbJobs.find((x) => x.id === id);
    if (!on() || !j || !j._live) return prev(id, st);
    if (st === 'no') { api('POST', '/arbitration/jobs/' + id + '/decline').then(async () => { toast('پرونده به حل‌کنندهٔ دیگری سپرده می‌شود'); await loadArb(true); renderArbJ(); }).catch(err); return; }
    sb.innerHTML = `<div class="grab"></div><h3 id="sheetTitle">زمان بازدید</h3><p class="sub"><span>${esc(j.proj)}</span> · <span>${esc(j.place)}</span></p>
      <span class="label">چه روز و ساعتی بازدید می‌کنی؟</span><input class="field" id="avT" placeholder="مثلاً دوشنبه ۷ مهر · ۸ صبح">
      <button class="cta" id="avGo">قبول پرونده</button>`;
    show();
    $('avGo').onclick = () => {
      const t = $('avT').value.trim(); if (t.length < 4) { toast('زمان بازدید را بنویس'); return; }
      api('POST', '/arbitration/jobs/' + id + '/accept', { visitAt: t, impartial: true })
        .then(async () => { closeSheet(); toast('پرونده قبول شد؛ زمان بازدید به طرفین اعلام شد'); await loadArb(true); renderArbJ(); })
        .catch(err);
    };
  });
  wrap('arbRepForm', function (prev, id) {
    prev(id);
    const j = S.arbJobs.find((x) => x.id === id);
    if (!on() || !j || !j._live) return;
    L.arbPhotos = [];
    const b = $('arPh');
    if (b) {
      b.removeAttribute('onclick');
      b.textContent = '+ عکس‌های محل (حداقل ۳)';
      b.onclick = () => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.multiple = true; i.onchange = () => { L.arbPhotos = L.arbPhotos.concat([...i.files]).slice(0, 8); b.textContent = '✓ ' + fa(L.arbPhotos.length) + ' عکس انتخاب شد'; b.classList.toggle('ok', L.arbPhotos.length >= 3); }; i.click(); };
    }
    if (j._round === 2) {
      const v = $('arV');
      if (v) v.insertAdjacentHTML('beforebegin', `<label class="arb-chk"><input type="checkbox" id="arUp" checked><span>رأی حل‌کنندهٔ قبلی را تأیید می‌کنم (اگر عوض شود، هزینهٔ بازبینی به معترض برمی‌گردد)</span></label>`);
    }
  });
  wrap('arbRepSave', function (prev, id) {
    const j = S.arbJobs.find((x) => x.id === id);
    if (!on() || !j || !j._live) return prev(id);
    if ((L.arbPhotos || []).length < 3) { toast('حداقل ۳ عکس لازم است'); return; }
    const m = $('arM').value.trim(), a = $('arA').value.trim();
    if (m.length < 8 || a.length < 8) { toast('اندازه‌گیری و کار اصلاحی را کامل بنویس'); return; }
    const fd = new FormData();
    L.arbPhotos.forEach((f) => fd.append('photos', f));
    fd.append('measure', m);
    fd.append('compare', sel('arC').textContent);
    fd.append('verdict', sel('arV').textContent);
    fd.append('remedy', a);
    if (j._round === 2) fd.append('upholds', String(!!($('arUp') && $('arUp').checked)));
    toast('در حال ارسال گزارش…');
    api('POST', '/arbitration/jobs/' + id + '/report', fd)
      .then(async () => { closeSheet(); toast(j._round === 2 ? 'رأی بازبینی ثبت شد (نهایی)' : 'گزارش برای طرفین فرستاده شد؛ ۷۲ ساعت مهلت اعتراض'); await loadArb(true); renderArbJ(); })
      .catch(err);
  });

  /* ================= مدارک ================= */

  async function loadDocs(force) {
    const k = 'docs:' + S.role;
    if (!force && fresh(k, 20000)) return;
    L.loaded[k] = Date.now();
    const d = await api('GET', '/me/documents');
    const mine = d.items.filter((x) => !x.role || x.role === S.role);
    const tpl = (DOCS[S.role] || []).map(([n, g]) => ({ n, g, st: 'none', exp: 0 }));
    mine.forEach((x) => {
      let t = tpl.find((y) => y.n === x.title && !y._x);
      if (!t) { t = { n: x.title, g: x.group || 'سایر' }; tpl.push(t); }
      Object.assign(t, {
        st: { approved: 'ok', pending: 'rev', rejected: 'none' }[x.status],
        exp: x.expiresAt ? Math.max(1, Math.ceil((new Date(x.expiresAt) - Date.now()) / 86400000)) : 0,
        _x: x,
      });
    });
    S.docs[S.role] = tpl;
  }
  wrap('renderDocs', function (prev) {
    if (!on()) return prev();
    if (!S.docs[S.role]) S.docs[S.role] = [];
    prev();
    if (!fresh('docs:' + S.role, 20000)) { loadDocs().then(() => { if (S.cur === 'docs') renderDocs(); }).catch(err); return; }
    // دلیل رد
    const rows = document.querySelectorAll('#s-docs .doc-row');
    S.docs[S.role].forEach((d, n) => { if (d._x && d._x.status === 'rejected' && rows[n]) rows[n].insertAdjacentHTML('beforeend', `<small style="display:block;width:100%;color:var(--bad)">رد شد: ${esc(d._x.rejectReason || '')}</small>`); });
  });
  function uploadDoc(file, title, group) {
    const fd = new FormData();
    fd.append('file', file); fd.append('title', title); fd.append('group', group || 'سایر'); fd.append('role', S.role);
    toast('در حال بارگذاری…');
    return api('POST', '/me/documents', fd).then(async () => { toast('مدرک رسید؛ بررسی معمولاً کمتر از ۲۴ ساعت طول می‌کشد'); await loadDocs(true); if (S.cur === 'docs') renderDocs(); });
  }
  wrap('docUp', function (prev, k) {
    if (!on()) return prev(k);
    const inp = window.event && window.event.target;
    const f = inp && inp.files && inp.files[0];
    const d = S.docs[S.role][k];
    if (!f || !d) return;
    // مدرک در حال بررسیِ قبلی (مثلاً برای تمدید) جایش را به نسخهٔ تازه می‌دهد
    const drop = d._x && d._x.status !== 'approved' ? api('DELETE', '/me/documents/' + d._x.id).catch(() => {}) : Promise.resolve();
    drop.then(() => uploadDoc(f, d.n, d.g)).catch(err);
  });
  wrap('docAdd', function (prev) {
    prev();
    if (!on()) return;
    const b = document.querySelector('#sb .cta'); if (!b) return;
    b.removeAttribute('onclick');
    b.onclick = () => {
      const f = document.querySelector('#sb input[type=file]').files[0];
      if (!f) { toast('تصویر یا PDF مدرک را انتخاب کن'); return; }
      const n = (chosen() || {}).textContent || 'سایر';
      closeSheet();
      uploadDoc(f, n, 'سایر').catch(err);
    };
  });

  /* ================= نمونه‌کار و عکس پروفایل ================= */

  async function loadPf(force) {
    const k = 'pf:' + S.role;
    if (!force && fresh(k, 20000)) return;
    L.loaded[k] = Date.now();
    const d = await api('GET', '/me/roles/' + S.role + '/portfolio');
    S.pfItems = d.items.map((x) => ({ t: x.title, c: x.place || '', d: x.when || L.rel(x.createdAt), src: L.abs(x.url), k: 'villa', _id: x.id }));
    S.me.pf = S.pfItems.length > 0;
  }
  wrap('renderPf', function (prev) {
    if (!on()) return prev();
    prev();
    if (!fresh('pf:' + S.role, 20000)) loadPf().then(() => { if (S.cur === 'pf') renderPf(); }).catch(err);
  });
  wrap('pfAdd', function (prev) {
    prev();
    if (!on()) return;
    L.pfFile = null;
    const inp = document.querySelector('#sb input[type=file]');
    if (inp) inp.addEventListener('change', () => { L.pfFile = inp.files[0] || null; });
    const b = document.querySelector('#sb .cta'); if (!b) return;
    b.removeAttribute('onclick');
    b.onclick = async () => {
      const t = $('pfT').value.trim();
      if (!t) { toast('عنوان را بنویس'); return; }
      if (!L.pfFile) { toast('یک عکس از کار انتخاب کن'); return; }
      const fd = new FormData();
      fd.append('file', L.pfFile); fd.append('title', t);
      fd.append('place', (chosen() || {}).textContent || '');
      fd.append('when', L.faDate(new Date(), { month: 'long', year: 'numeric' }));
      b.disabled = true;
      try { await api('POST', '/me/roles/' + S.role + '/portfolio', fd); closeSheet(); toast('نمونه‌کار اضافه شد'); await loadPf(true); await L.loadMe(); renderPf(); }
      catch (e) { err(e); b.disabled = false; }
    };
  });
  wrap('pfView', function (prev, k) {
    prev(k);
    const x = S.pfItems[k];
    if (!on() || !x || !x._id) return;
    const b = document.querySelector('#sb .ghost'); if (!b) return;
    b.removeAttribute('onclick');
    b.onclick = () => api('DELETE', '/me/portfolio/' + x._id).then(async () => { closeSheet(); toast('حذف شد'); await loadPf(true); await L.loadMe(); renderPf(); }).catch(err);
  });
  // عکس پروفایل: هر ورودی فایل داخل .avup (صفحهٔ ویرایش پروفایل)
  document.addEventListener('change', (e) => {
    const inp = e.target;
    if (!on() || !inp || !inp.closest || !inp.closest('.avup') || !inp.files || !inp.files[0]) return;
    const fd = new FormData(); fd.append('file', inp.files[0]);
    api('PUT', '/me/roles/' + S.role + '/avatar', fd).then(() => L.loadMe()).then(() => toast('عکس پروفایل ذخیره شد')).catch(err);
  }, true);
})();
