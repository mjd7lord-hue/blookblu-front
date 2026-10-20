/* =====================================================================
 * trust36.js — دور ۳۶ (بعد از i18n-extra.js، قبل از desktop.js)
 *   ۱) خوش‌قولی: ثبت «بدقولی طرف مقابل»، جواب ۲۴ ساعته (قبول/اعتراض)، لغو با توافق یا یک‌طرفه، صفحهٔ «خوش‌قولی و اخطارها»
 *   ۲) قیم معتبر: شرط‌ها، «من می‌توانم قیم باشم؟»، تأیید ضمانت با کد پیامکی، پس گرفتن ضمانت
 *   ۳) قراردادهای من: بایگانی همهٔ قراردادها (همهٔ نقش‌ها) با نسخهٔ چاپی
 *   ۴) عکس پروفایل مثل لینکدین: گرفتن عکس / گالری / حذف ← ویرایشگر (برش دایره، زوم، چرخش، صاف کردن، نور)
 *   ۵) قفل اطلاعات اصلی بعد از ثبت‌نام (هم‌تراز با forms.ts بک‌اند: locked)
 *   ۶) آشنایی اول کار + علامت آموزش «؟» همه‌جا: آموزش متحرک با اجزای واقعی اپ و «نشانم بده» روی صفحهٔ واقعی
 * ===================================================================== */
(function () {
  const live = () => !!(window.LIVE && LIVE.on && S.auth);
  const wrapW = (name, fn) => { const prev = window[name]; if (typeof prev !== 'function') return; window[name] = function (...a) { return fn.call(this, prev, ...a); }; };
  const api = (m, p, b) => LIVE.api(m, p, b);
  const err = (e) => (window.LIVE && LIVE.err ? LIVE.err(e) : toast((e && e.message) || 'خطا'));
  const en = () => !!(S.prefs && S.prefs.lang === 'en');
  const i18n = (el) => { try { if (el && typeof i18nNode === 'function' && (en() || (S.prefs && S.prefs.latin))) i18nNode(el); } catch (e) {} };
  const jsdom = /jsdom/i.test(navigator.userAgent || '');
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const mkScreen = (id, label) => {
    if (document.getElementById('s-' + id)) return;
    const s = document.createElement('section'); s.className = 'screen'; s.id = 's-' + id; s.setAttribute('aria-label', label);
    const any = document.querySelector('.screen'); if (any) any.parentElement.appendChild(s);
  };

  /* ---------- علامت آموزش (یکسان در همهٔ اپ) ---------- */
  const HQ_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.3 9.2a2.8 2.8 0 0 1 5.4 1c0 1.9-2.7 2.4-2.7 4"/><circle cx="12" cy="17.6" r=".6" fill="currentColor"/></svg>';
  const hq = (topics, cls) => `<button class="hq ${cls || ''}" aria-label="آموزش" onclick="event.stopPropagation();tutOpen('${topics}')">${HQ_SVG}</button>`;
  window.hqBtn = hq;

  const css = document.createElement('style');
  css.textContent = `
  .hq{flex:none;width:34px;height:34px;border-radius:50%;border:0;background:color-mix(in srgb,var(--gold) 16%,transparent);color:var(--gold);display:inline-grid;place-items:center;padding:0;cursor:pointer;position:relative}
  .hq svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
  .hq::after{content:"";position:absolute;inset:-3px;border-radius:50%;border:2px solid var(--gold);opacity:0;animation:hqPing 3.2s 1.2s 2}
  @keyframes hqPing{0%{opacity:.7;transform:scale(.8)}70%,100%{opacity:0;transform:scale(1.35)}}
  #qa42 .qa42{grid-template-columns:repeat(4,1fr)}#qa42 .qa42 button{padding:10px 2px;font-size:12px;position:relative}
  #qa42 .qa42 em{position:absolute;top:4px;inset-inline-end:8px;background:#EF4444;color:#fff;border-radius:9px;min-width:18px;height:18px;padding:0 5px;font:700 11px/18px inherit;font-style:normal}
  .est42{display:flex;align-items:center;gap:12px;width:100%;text-align:start;font:inherit;color:inherit;border:1px solid var(--line);background:var(--surface);border-radius:18px;padding:12px 14px;cursor:pointer}
  .est42 .ic{flex:none;width:46px;height:46px;border-radius:14px;display:grid;place-items:center;background:color-mix(in srgb,var(--gold) 18%,var(--surface));color:var(--gold)}
  .est42 .ic svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round}
  .est42 .t{flex:1;min-width:0}.est42 b{display:block;font-size:15px}.est42 small{display:block;font-size:12.5px;color:var(--muted)}.est42 .go{color:var(--muted);font-size:18px}
  .hq.on-dark{background:rgba(255,255,255,.12);color:#FFD27A}
  .bar .hq{margin-inline-start:4px}
  #phHero .hq.ph-hq{position:absolute;top:10px;inset-inline-end:10px;z-index:3;width:30px;height:30px}
  .tr-row{display:flex;gap:10px;align-items:flex-start;padding:10px 0}.tr-row+.tr-row{border-top:1px solid var(--line)}
  .tr-row .n{flex:none;width:34px;height:34px;border-radius:11px;display:grid;place-items:center;font-weight:900;background:var(--soft)}
  .tr-row b{display:block;font-size:14.5px}.tr-row span{display:block;font-size:13px;color:var(--muted);line-height:1.7}
  .stk{border:1px solid var(--line);border-radius:16px;padding:12px 14px;margin-bottom:10px;background:var(--surface)}
  .stk .h{display:flex;justify-content:space-between;gap:8px;align-items:center}.stk .h b{font-size:14.5px}
  .stk .tag{font-size:12px;border-radius:8px;padding:3px 8px;font-weight:700;white-space:nowrap}
  .stk .tag.pending{background:#FEF3C7;color:#92400E}.stk .tag.disputed{background:#DBEAFE;color:#1E40AF}.stk .tag.confirmed{background:#FEE2E2;color:#991B1B}.stk .tag.dismissed{background:#DCFCE7;color:#166534}
  .stk p{margin:6px 0 0;font-size:13.5px;line-height:1.8;color:var(--muted)}
  .stk .acts{display:flex;gap:8px;margin-top:10px}.stk .acts button{flex:1;min-height:42px;border-radius:12px;font-family:inherit;font-weight:700;border:1px solid var(--line);background:var(--surface)}
  .stk .acts .y{background:var(--accent);color:#fff;border-color:var(--accent)}
  .cq-ban{border-radius:16px;padding:12px 14px;background:color-mix(in srgb,#F59E0B 14%,var(--surface));border:1px solid color-mix(in srgb,#F59E0B 40%,transparent)}
  .cq-ban b{display:block}.cq-ban p{margin:4px 0 8px;font-size:13.5px;color:var(--muted)}
  .cq-ban .row{display:flex;gap:8px}.cq-ban .row button{flex:1;min-height:42px;border-radius:12px;font-family:inherit;font-weight:700;border:1px solid var(--line);background:var(--surface)}
  .cq-ban .row .y{background:var(--accent);color:#fff;border-color:var(--accent)}
  .ctr-card{display:block;width:100%;text-align:start;border:1px solid var(--line);border-radius:18px;padding:14px;background:var(--surface);margin-bottom:10px;font-family:inherit;color:inherit}
  .ctr-card .h{display:flex;justify-content:space-between;align-items:center;gap:8px}
  .ctr-card .no{font-size:12px;color:var(--muted);direction:ltr;unicode-bidi:isolate}
  .ctr-card b.t{display:block;font-size:15.5px;margin:4px 0}
  .ctr-card .m{font-size:13px;color:var(--muted)}
  .ctr-card .sig{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}.ctr-card .sig span{font-size:12px;border-radius:8px;padding:3px 8px;background:var(--soft)}
  .ctr-card .sig span.ok{background:#DCFCE7;color:#166534}
  .ctr-card .acts{display:flex;gap:8px;margin-top:10px}.ctr-card .acts button{flex:1;min-height:40px;border-radius:12px;border:1px solid var(--line);background:var(--surface);font-family:inherit;font-weight:700}
  .st-active{background:#DCFCE7;color:#166534}.st-signing,.st-draft{background:#FEF3C7;color:#92400E}.st-void{background:var(--soft);color:var(--muted)}
  .elig{display:grid;gap:6px;margin-top:8px}.elig div{display:flex;gap:8px;align-items:center;font-size:13.5px}
  .elig i{flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:12px;font-weight:900}
  .elig i.y{background:#DCFCE7;color:#166534}.elig i.n{background:#FEE2E2;color:#991B1B}
  .lkf{display:flex;align-items:center;gap:10px;padding:10px 0}.lkf+.lkf{border-top:1px solid var(--line)}
  .lkf span{flex:1;font-size:13px;color:var(--muted)}.lkf b{font-size:14.5px}.lkf svg{width:16px;height:16px;flex:none;color:var(--muted)}
  /* عکس پروفایل */
  #s-edit .avup .hex{clip-path:none!important;border-radius:50%!important;width:104px!important;height:104px!important;box-shadow:0 0 0 4px var(--surface),0 0 0 6px color-mix(in srgb,var(--accent) 35%,transparent)}
  #s-edit .avup .avcam{border-radius:50%}
  .av-cur{width:148px;height:148px;border-radius:50%;margin:6px auto 14px;display:grid;place-items:center;font-size:44px;font-weight:900;color:#fff;background-size:cover;background-position:center;box-shadow:0 10px 30px rgba(0,0,0,.18)}
  .av-acts{display:flex;justify-content:center;gap:10px}
  .av-acts>*{flex:1;max-width:120px;display:flex;flex-direction:column;align-items:center;gap:8px;border:0;background:none;font-family:inherit;color:inherit;cursor:pointer;padding:6px 0}
  .av-acts .ic{width:56px;height:56px;border-radius:50%;display:grid;place-items:center;background:var(--soft)}
  .av-acts .ic svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  .av-acts b{font-size:13px;font-weight:700}.av-acts .del{color:var(--bad)}
  .ave{position:fixed;inset:0;z-index:300;background:#000;color:#fff;display:flex;flex-direction:column;touch-action:none}
  .ave-top{display:flex;align-items:center;justify-content:space-between;padding:calc(10px + env(safe-area-inset-top,0px)) 12px 10px}
  .ave-top b{font-size:16px}.ave-top button{border:0;background:none;color:#fff;font:inherit;font-size:15px;min-width:64px;min-height:40px;cursor:pointer}
  .ave-top .ave-sv{color:#7CC4FF;font-weight:800}
  .ave-stage{position:relative;flex:1;min-height:0;display:grid;place-items:center;overflow:hidden}
  .ave-stage canvas{width:min(100vw,100%);max-width:520px;aspect-ratio:1;display:block}
  .ave-mask{position:absolute;pointer-events:none;width:min(100vw,520px);aspect-ratio:1}
  .ave-mask svg{width:100%;height:100%;display:block}
  .ave-mask .grid{opacity:0;transition:opacity .2s}.ave.drag .ave-mask .grid{opacity:.55}
  .ave-ctl{padding:10px 18px calc(14px + env(safe-area-inset-bottom,0px));background:#0d0d0d}
  .ave-tabs{display:flex;justify-content:center;gap:28px;margin-bottom:12px}
  .ave-tabs button{border:0;background:none;color:#aaa;font:inherit;font-size:14px;padding:6px 2px;border-bottom:2px solid transparent;cursor:pointer}
  .ave-tabs button[aria-pressed=true]{color:#fff;border-color:#fff}
  .ave-row{display:flex;align-items:center;gap:10px;margin:8px 0}.ave-row label{width:74px;font-size:13px;color:#ccc}
  .ave-row input[type=range]{flex:1;accent-color:#fff}
  .ave-row .rb{border:1px solid #444;background:none;color:#fff;border-radius:10px;min-height:36px;padding:0 12px;font:inherit;font-size:13px;cursor:pointer}
  .ave-cam{position:absolute;inset:0;display:grid;place-items:center;background:#000}
  .ave-cam video{width:100%;max-width:520px;aspect-ratio:1;object-fit:cover;transform:scaleX(-1)}
  .ave-shot{position:absolute;bottom:22px;left:50%;transform:translateX(-50%);width:72px;height:72px;border-radius:50%;border:5px solid #fff;background:rgba(255,255,255,.25);cursor:pointer}
  /* آموزش */
  .tut-ph{position:relative;width:250px;max-width:78%;aspect-ratio:9/12;margin:4px auto 10px;border-radius:30px;border:7px solid #1f2937;background:var(--bg,#faf9f5);overflow:hidden;box-shadow:0 14px 34px rgba(0,0,0,.22)}
  .tut-ph .scr{position:absolute;inset:0;padding:12px 10px;overflow:hidden;font-size:11px;animation:tutIn .45s both}
  .tut-ph .scr *{pointer-events:none}
  @keyframes tutIn{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:none}}
  .tut-f{position:absolute;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.55);border:2px solid rgba(0,0,0,.35);box-shadow:0 2px 8px rgba(0,0,0,.25);z-index:5;transform:translate(-50%,-50%);animation:tutTap 1.8s .5s infinite}
  .tut-f::after{content:"";position:absolute;inset:-8px;border-radius:50%;border:2px solid var(--gold);opacity:0;animation:tutRip 1.8s .5s infinite}
  @keyframes tutTap{0%{opacity:0;transform:translate(-20%,10%) scale(1)}25%{opacity:1;transform:translate(-50%,-50%) scale(1)}35%{transform:translate(-50%,-50%) scale(.82)}45%,80%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0}}
  @keyframes tutRip{30%{opacity:0;transform:scale(.6)}38%{opacity:.9}70%{opacity:0;transform:scale(1.5)}}
  .tut-f.swipe{animation:tutSwipe 2.2s .4s infinite}.tut-f.swipe::after{display:none}
  @keyframes tutSwipe{0%{opacity:0;transform:translate(-50%,-50%) translateX(50px)}15%{opacity:1}70%{opacity:1;transform:translate(-50%,-50%) translateX(-50px)}100%{opacity:0;transform:translate(-50%,-50%) translateX(-50px)}}
  .tut-cap{text-align:center;font-size:15px;line-height:1.9;min-height:58px;margin:0 6px}
  .tut-dots{display:flex;justify-content:center;gap:6px;margin:8px 0 12px}.tut-dots i{width:7px;height:7px;border-radius:5px;background:var(--line);transition:width .3s}.tut-dots i.on{width:20px;background:var(--gold)}
  .tut-nav{display:flex;gap:8px}.tut-nav button{flex:1}
  .tut-list button{display:flex;align-items:center;gap:12px;width:100%;border:0;background:none;font:inherit;color:inherit;text-align:start;padding:12px 2px;min-height:58px;cursor:pointer}
  .tut-list button+button{border-top:1px solid var(--line)}
  .tut-list .ic{flex:none;width:42px;height:42px;border-radius:13px;display:grid;place-items:center;font-size:20px;background:color-mix(in srgb,var(--gold) 16%,var(--surface))}
  .tut-list b{display:block;font-size:15px}.tut-list small{display:block;font-size:12.5px;color:var(--muted)}
  .sp-ov{position:fixed;inset:0;z-index:400}
  .sp-hole{position:fixed;border-radius:16px;box-shadow:0 0 0 9999px rgba(8,12,11,.72);transition:all .35s cubic-bezier(.3,1,.4,1);pointer-events:none}
  .sp-hole::after{content:"";position:absolute;inset:-4px;border-radius:20px;border:2px solid var(--gold);animation:hqPing 1.6s infinite}
  .sp-tip{position:fixed;left:16px;right:16px;max-width:420px;margin:auto;background:var(--surface);color:var(--ink,inherit);border-radius:18px;padding:14px 16px;box-shadow:0 12px 30px rgba(0,0,0,.3);transition:top .35s}
  .sp-tip p{margin:0 0 10px;font-size:14.5px;line-height:1.85}.sp-tip .row{display:flex;justify-content:space-between;align-items:center}
  .sp-tip small{color:var(--muted)}
  .onb{position:fixed;inset:0;z-index:500;background:#0B1412;color:#fff;display:flex;flex-direction:column;padding:calc(18px + env(safe-area-inset-top,0px)) 22px calc(20px + env(safe-area-inset-bottom,0px))}
  .onb .skip{align-self:flex-end;border:0;background:none;color:#9CA3AF;font:inherit;font-size:14px;min-height:40px;cursor:pointer}
  .onb .art{flex:1;display:grid;place-items:center;min-height:0}
  .onb .art svg{width:min(78vw,300px);height:auto}
  .onb h2{font-size:22px;margin:6px 0 8px;text-align:center}.onb p{font-size:15px;line-height:1.9;text-align:center;color:#D1D5DB;margin:0 auto 18px;max-width:420px;min-height:58px}
  .onb .dots{display:flex;justify-content:center;gap:6px;margin-bottom:16px}.onb .dots i{width:7px;height:7px;border-radius:5px;background:#374151;transition:width .3s}.onb .dots i.on{width:22px;background:#F2B53A}
  .onb .go{width:100%;min-height:54px;border:0;border-radius:16px;background:#F2B53A;color:#1a1205;font:inherit;font-weight:800;font-size:16px;cursor:pointer}
  .onb .alt{width:100%;min-height:46px;border:0;background:none;color:#D1D5DB;font:inherit;margin-top:6px;cursor:pointer}
  .onb .stage{animation:tutIn .45s both}
  .onb .hqbig{width:96px;height:96px;border-radius:50%;display:grid;place-items:center;background:rgba(242,181,58,.15);color:#F2B53A;animation:onbPulse 1.8s infinite}
  .onb .hqbig svg{width:60px;height:60px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
  @keyframes onbPulse{50%{box-shadow:0 0 0 18px rgba(242,181,58,0)}0%{box-shadow:0 0 0 0 rgba(242,181,58,.45)}}
  @media (prefers-reduced-motion:reduce){.tut-f,.tut-f::after,.hq::after,.onb .hqbig{animation:none}.tut-f{opacity:1}}`;
  document.head.appendChild(css);

  /* ================= ۱) خوش‌قولی ================= */
  const KIND = { no_show: 'سر کار نیامد', cancel: 'لغو یک‌طرفهٔ قرارداد', breach: 'عمل نکردن به قرارداد' };
  const STF = { pending: 'منتظر جواب', disputed: 'اعتراض؛ در بررسی مدیر', confirmed: 'اخطار ثبت شد', dismissed: 'رد شد' };
  const left24 = (iso) => { const m = Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 60000)); return m >= 60 ? `${fa(Math.floor(m / 60))} ساعت` : `${fa(m)} دقیقه`; };
  const RULES = [
    ['۱', 'ثبت بدقولی', 'اگر طرف مقابل سر کار نیامد یا به قرارداد عمل نکرد، در صفحهٔ پروژه «بدقولی طرف مقابل» را بزن.'],
    ['۲', '۲۴ ساعت فرصت جواب', 'او می‌تواند قبول کند یا اعتراض بنویسد؛ اعتراض را مدیر بلوک بررسی می‌کند. بی‌جواب بماند، اخطار ثبت می‌شود.'],
    ['۳', 'اخطار: ۱۰ امتیاز کم تا ۱ ماه', 'روی شناسنامهٔ کاری دیده می‌شود. قیم‌های او هم هر کدام ۵ امتیاز از دست می‌دهند.'],
    ['۴', '۳ اخطار در ۲ ماه', '«آماده به کار» و نیروی فوری ۷ روز بسته می‌شود. ۵ اخطار فعال = تعلیق حساب تا بررسی مدیر.'],
    ['۵', 'لغو قرارداد امضاشده', 'لغو با توافق هر دو طرف اخطار ندارد. لغو یک‌طرفه برای لغوکننده اخطار دارد. خسارت مالی از راه حل اختلاف.'],
  ];
  const rulesHTML = () => `<div class="card" style="padding:4px 14px">${RULES.map((r) => `<div class="tr-row"><span class="n num">${r[0]}</span><div><b>${r[1]}</b><span>${r[2]}</span></div></div>`).join('')}</div>`;

  S.stk = S.stk || { against: [], byMe: [], at: 0 };
  async function loadStrikes(force) {
    if (!live()) return;
    if (!force && Date.now() - S.stk.at < 20000) return;
    const d = await api('GET', '/strikes');
    S.stk = { against: d.against || [], byMe: d.byMe || [], at: Date.now() };
  }
  const stkCard = (s, mine) => `<div class="stk"><div class="h"><b>${esc(KIND[s.kind] || s.kind)}</b><span class="tag ${s.status}">${STF[s.status]}</span></div>
    <p>${s.project ? `پروژه: ${esc(s.project)} · ` : ''}${mine ? (s.by ? 'ثبت‌کننده: ' + esc(s.by) : 'لغو یک‌طرفه') : 'برای: ' + esc(s.to || '')}${s.note ? '<br>«' + esc(s.note) + '»' : ''}${s.reply ? '<br>جواب: «' + esc(s.reply) + '»' : ''}
    ${s.status === 'pending' && s.respondBy ? `<br>مهلت جواب: ${left24(s.respondBy)}` : ''}${s.status === 'confirmed' && s.expiresAt ? `<br>تا ${new Date(s.expiresAt).toLocaleDateString('fa-IR')} روی اعتبار اثر دارد` : ''}</p>
    ${mine && s.status === 'pending' ? `<div class="acts"><button class="y" onclick="stkAnswer('${s.id}',true)">قبول دارم</button><button onclick="stkDispute('${s.id}')">اعتراض دارم</button></div>` : ''}</div>`;
  mkScreen('strikes', 'خوش‌قولی و اخطارها');
  window.renderStrikes = function () {
    const el = $('s-strikes'); if (!el) return;
    const a = S.stk.against, b = S.stk.byMe, act = a.filter((s) => s.status === 'confirmed').length;
    el.innerHTML = `${pageBar('خوش‌قولی و اخطارها', hq('strike'))}
      <div class="section" style="margin-top:10px"><div class="hcard"><small>قانون بلوک</small><h2>${act ? `${fa(act)} اخطار فعال داری` : 'قول، قول است'}</h2><p style="margin:6px 0 0;font-size:13.5px;line-height:1.8;opacity:.85">${act ? 'هر اخطار ۱ ماه بعد خودکار از امتیازت برمی‌گردد.' : 'تا حالا اخطار بدقولی نداری. همین‌طور بمان؛ خوش‌قولی اعتبارت را بالا نگه می‌دارد.'}</p></div></div>
      ${a.length ? `<div class="section"><div class="sec-head"><h3>ثبت‌شده برای من</h3></div>${a.map((s) => stkCard(s, true)).join('')}</div>` : ''}
      ${b.length ? `<div class="section"><div class="sec-head"><h3>ثبت‌شده توسط من</h3></div>${b.map((s) => stkCard(s, false)).join('')}</div>` : ''}
      <div class="section"><div class="sec-head"><h3>اگر کسی بدقولی کند چه می‌شود؟</h3></div>${rulesHTML()}</div><div style="height:20px"></div>`;
    i18n(el);
    if (live() && Date.now() - S.stk.at > 20000) loadStrikes().then(() => { if (S.cur === 'strikes') renderStrikes(); }).catch(() => {});
  };
  wrapW('render', function (prev, ...a) {
    if (S.cur === 'strikes') return renderStrikes();
    if (S.cur === 'ctrs') return renderCtrs();
    return prev(...a);
  });
  window.stkAnswer = function (id, accept, reply) {
    api('POST', '/strikes/' + id + '/respond', { accept, reply })
      .then(() => { closeSheet(); toast(accept ? 'ثبت شد؛ خوش‌قولی از امروز' : 'اعتراض ثبت شد؛ مدیر بلوک بررسی می‌کند'); return loadStrikes(true); })
      .then(() => { if (S.cur === 'strikes') renderStrikes(); })
      .catch(err);
  };
  window.stkDispute = function (id) {
    sb.innerHTML = `<div class="grab"></div><h3 id="sheetTitle">اعتراض به بدقولی</h3><p class="sub">بنویس چه شد؛ اگر مدرک داری (پیام، عکس) در چت پروژه بفرست. مدیر بلوک هر دو طرف را می‌بیند و تصمیم می‌گیرد.</p>
      <textarea class="field" id="stkR" maxlength="600" placeholder="مثلاً کارفرما روز کار را عوض کرد و خبر نداد"></textarea>
      <button class="cta" onclick="const v=$('stkR').value.trim();if(v.length<5){toast('توضیح را کامل‌تر بنویس');return}stkAnswer('${id}',false,v)">ثبت اعتراض</button>`;
    show(); i18n(sb);
  };

  /* --- صفحهٔ پروژه: درخواست لغو، بدقولی، لغو --- */
  const curProj = () => (S.projs && S.projs[S.role] ? S.projs[S.role][S.pi] : null);
  const afterProj = (d, msg) => {
    closeSheet(); toast(msg);
    const pr = LIVE.loadProjects ? LIVE.loadProjects(true) : Promise.resolve();
    return pr.then(() => {
      if (d && d.project && d.project.status === 'cancelled') { go('proj'); return; }
      const i = (S.projs[S.role] || []).findIndex((p) => p._id === (d && d.project && d.project.id));
      if (i > -1) S.pi = i;
      if (S.cur === 'pdet') renderPdet();
    }).catch(() => {});
  };
  window.pjReport = function () {
    const p = curProj(); if (!p) return;
    const w = person(p.who);
    S.pjk = 'no_show';
    sb.innerHTML = `<div class="grab"></div><h3 id="sheetTitle">بدقولی ${esc(w ? w.name : 'طرف مقابل')}</h3>
      <p class="sub">فقط بعد از امضای قرارداد توسط هر دو طرف. او ۲۴ ساعت فرصت دارد قبول یا اعتراض کند.</p>
      <span class="label">چه شد؟</span><div class="chips">${[['no_show', 'سر کار نیامد'], ['breach', 'به قرارداد عمل نکرد']].map((x, k) => `<button class="chip" aria-pressed="${k === 0}" onclick="S.pjk='${x[0]}';pickOne(this)">${x[1]}</button>`).join('')}</div>
      <span class="label">توضیح کوتاه</span><textarea class="field" id="pjN" maxlength="600" placeholder="مثلاً قرار بود دوشنبه ۷ صبح بیاید؛ نیامد و جواب تلفن نداد"></textarea>
      <div class="note" style="margin-top:10px">${I.warn}<span>ثبت ناروا را مدیر بلوک رد می‌کند. اول در چت با هم صحبت کنید.</span></div>
      <button class="cta" onclick="pjReportGo()">ثبت بدقولی</button>`;
    show(); i18n(sb);
  };
  window.pjReportGo = function () {
    const p = curProj(); const note = ($('pjN') && $('pjN').value.trim()) || '';
    if (note.length < 5) { toast('بنویس چه شد'); return; }
    api('POST', '/projects/' + p._id + '/report', { kind: S.pjk || 'no_show', note })
      .then(() => { S.stk.at = 0; afterProj(null, 'ثبت شد؛ طرف مقابل ۲۴ ساعت فرصت جواب دارد'); })
      .catch(err);
  };
  window.pjCancel = function () {
    const p = curProj(); if (!p) return;
    sb.innerHTML = `<div class="grab"></div><h3 id="sheetTitle">لغو قرارداد</h3>
      <p class="sub">اگر قرارداد را هر دو امضا کرده‌اید: لغو با توافق اخطار ندارد؛ لغو یک‌طرفه برای تو اخطار بدقولی دارد (۱۰ امتیاز تا ۱ ماه). قبل از امضا، لغو آزاد است.</p>
      <span class="label">دلیل لغو</span><textarea class="field" id="pjC" maxlength="500" placeholder="مثلاً کارفرما نقشه را عوض کرد"></textarea>
      <button class="cta" onclick="pjCancelGo(false)">درخواست لغو با توافق</button>
      <button class="ghost" style="width:100%;margin-top:8px;color:var(--bad)" onclick="pjCancelGo(true)">لغو یک‌طرفه (اخطار برای من)</button>`;
    show(); i18n(sb);
  };
  window.pjCancelGo = function (force) {
    const p = curProj(); const reason = ($('pjC') && $('pjC').value.trim()) || '';
    if (reason.length < 3) { toast('دلیل لغو را بنویس'); return; }
    if (force && !confirm(en() ? 'Cancel one-sidedly? A bad-faith warning will be recorded for you.' : 'لغو یک‌طرفه؟ برای تو اخطار بدقولی ثبت می‌شود.')) return;
    api('POST', '/projects/' + p._id + '/cancel', force ? { reason, force: true } : { reason })
      .then((d) => afterProj(d, d.requested ? 'درخواست لغو فرستاده شد؛ اگر قبول کند، بدون اخطار لغو می‌شود' : d.strike ? 'لغو شد؛ اخطار بدقولی برایت ثبت شد' : 'پروژه لغو شد'))
      .catch(err);
  };
  window.pjCancelAns = function (accept) {
    const p = curProj(); if (!p) return;
    api('POST', '/projects/' + p._id + '/cancel/answer', { accept })
      .then((d) => afterProj(d, d.mutual ? 'با توافق لغو شد؛ بدون اخطار' : accept ? 'انجام شد' : 'قرارداد ادامه دارد'))
      .catch(err);
  };
  wrapW('renderPdet', function (prev, ...a) {
    const r = prev(...a);
    try {
      const el = $('s-pdet'), p = curProj(); if (!el || !p) return r;
      const bar = el.querySelector('.bar'); if (bar && !bar.querySelector('.hq')) bar.insertAdjacentHTML('beforeend', hq('contract,pay,strike'));
      if (!p._live || !p._x || p._x.status !== 'active' || el.querySelector('.pj36')) return r;
      const cq = p._x.cancelReq, w = person(p.who);
      const html = `<div class="section pj36">${cq ? `<div class="cq-ban" style="margin-bottom:10px">${cq.mine
        ? `<b>درخواست لغو فرستادی</b><p>دلیل: ${esc(cq.reason || '')}. اگر ${esc(w ? w.name : 'طرف مقابل')} قبول کند، بدون اخطار لغو می‌شود.</p><div class="row"><button onclick="pjCancelAns(false)">پس گرفتن درخواست</button></div>`
        : `<b>${esc(w ? w.name : 'طرف مقابل')} درخواست لغو داده</b><p>دلیل: ${esc(cq.reason || '')}. قبول کنی، پروژه بدون اخطار برای هیچ‌کس لغو می‌شود.</p><div class="row"><button class="y" onclick="pjCancelAns(true)">قبول لغو</button><button onclick="pjCancelAns(false)">ادامهٔ قرارداد</button></div>`}</div>` : ''}
        <div class="card" style="padding:2px 16px"><button class="linkrow" onclick="pjReport()"><span class="ic">⚠</span><span>طرف مقابل بدقولی کرد؟</span><small>‹</small></button>
        ${cq ? '' : `<button class="linkrow" onclick="pjCancel()"><span class="ic">✕</span><span>لغو قرارداد</span><small>‹</small></button>`}
        <button class="linkrow" onclick="go('strikes')"><span class="ic">⚖</span><span>قانون خوش‌قولی بلوک</span><small>‹</small></button></div></div>`;
      const secs = el.querySelectorAll(':scope > .section');
      (secs[1] || secs[0] || bar).insertAdjacentHTML('afterend', html);
      i18n(el.querySelector('.pj36'));
    } catch (e) {}
    return r;
  });

  /* --- شناسنامه و پروفایل: اخطار و قیم شفاف --- */
  wrapW('renderTrust', function (prev, ...a) {
    const r = prev(...a);
    try {
      const p = person(S.tid), el = $('s-trust'); if (!p || !el) return r;
      const adj = p.adj || 0, n = p.strikes || 0;
      const brk = el.querySelector('.card.brk');
      // دور ۴۱: امتیاز شروع — ثبت‌نام +۱۰، مدرک تأییدشده +۵ (با تأیید هویت دست‌کم ۲۵)
      const tt = trustOf(p);
      if (brk && !brk.querySelector('.st41')) {
        brk.insertAdjacentHTML('afterbegin', `<div class="st41"><div class="h"><span>ثبت‌نام کامل</span><b>${fa(tt.st)} از ${fa(10)}</b></div><div class="bars"><i data-w="100" style="background:var(--ok)"></i></div><div style="font-size:12.5px;color:var(--muted);margin-top:4px">برای همه از روز اول</div></div>
          <div class="st41"><div class="h"><span>مدرک تأییدشده</span><b>${fa(tt.dc)} از ${fa(5)}</b></div><div class="bars"><i data-w="${tt.dc ? 100 : 0}" style="background:#5EEAD4"></i></div><div style="font-size:12.5px;color:var(--muted);margin-top:4px">${tt.dc ? 'نشان «مدرک‌دار» گرفته' : 'یک مدرک (کارت مهارت، پروانه…) بفرست'}</div></div>`);
        requestAnimationFrame(() => brk.querySelectorAll('.st41 .bars i').forEach((i) => (i.style.width = i.dataset.w + '%')));
      }
      if (brk && (adj || n || (p.guar && p.guar.length))) {
        brk.insertAdjacentHTML('beforeend', `<div><div class="h"><span>قیم، پاسخ مفید و خوش‌قولی</span><b class="num" style="color:${adj < 0 ? 'var(--bad)' : 'var(--ok)'}">${adj > 0 ? '+' : adj < 0 ? '−' : ''}${fa(Math.abs(adj))}</b></div><div style="font-size:12.5px;color:var(--muted);margin-top:4px">${n ? `${fa(n)} اخطار بدقولی فعال (هر کدام −۱۰) · ` : ''}قیم معتبر +۵ · هر پاسخ تخصصی با لایک +۱ (تا ۵)</div></div>`);
      }
      if (n) {
        const sec = el.querySelector('.flip-hint');
        if (sec) sec.insertAdjacentHTML('afterend', `<div class="section"><button class="note" style="width:100%;border:0;text-align:start;font:inherit;color:#991B1B;background:#FEE2E2" onclick="${p === ME() || S.tid === 'me' ? "go('strikes')" : ''}">${I.warn}<span>${fa(n)} اخطار بدقولی در ماه اخیر</span></button></div>`);
      }
      const g = el.querySelector('details.guide');
      if (g && !g.querySelector('.g41')) g.insertAdjacentHTML('beforeend', '<p class="g41"><b>شروع:</b> با ثبت‌نام کامل ۱۰ امتیاز، با تأیید هویت ۱۰ و با اولین مدرک تأییدشده ۵ امتیاز؛ یعنی از روز اول دست‌کم ۲۵.</p>');
      if (g && !g.querySelector('.g36')) g.insertAdjacentHTML('beforeend', '<p class="g36"><b>۵. قیم، پاسخ مفید و خوش‌قولی:</b> قیم معتبر ۵ امتیاز اضافه می‌کند. هر پاسخ تو به پرسش تخصصی که اولین «مفید بود» را بگیرد ۱ امتیاز (تا ۵). هر اخطار بدقولی ۱۰ امتیاز تا ۱ ماه کم می‌کند؛ اگر کسی که قیمش هستی بدقولی کند، تو ۵ امتیاز از دست می‌دهی.</p>');
      i18n(el);
    } catch (e) {}
    return r;
  });
  wrapW('renderProfile', function (prev, ...a) {
    const r = prev(...a);
    try {
      const p = person(S.pid), el = $('s-profile');
      if (p && el && p.strikes && !el.querySelector('.stk36')) {
        const s = el.querySelectorAll(':scope > .section')[0];
        if (s) s.insertAdjacentHTML('afterend', `<div class="section stk36"><div class="note" style="color:#991B1B;background:#FEE2E2">${I.warn}<span>${fa(p.strikes)} اخطار بدقولی در ماه اخیر</span></div></div>`);
        i18n(el.querySelector('.stk36'));
      }
    } catch (e) {}
    return r;
  });

  /* ================= ۲) قیم معتبر ================= */
  S.guarX = S.guarX || { at: 0, elig: null, rules: null, inc: [] };
  const RULE0 = { minDone: 3, minTrust: 70, minDays: 30, max: 5 };
  async function loadGuarX(force) {
    if (!live() || (!force && Date.now() - S.guarX.at < 20000)) return;
    const d = await api('GET', '/guarantees');
    S.guarX = { at: Date.now(), elig: d.eligibility || null, rules: d.rules || null, inc: d.incoming || [] };
  }
  const eligHTML = () => {
    const R = S.guarX.rules || RULE0, e = S.guarX.elig, st = e && e.stats;
    const rows = [
      ['هویت تأییدشده', st ? st.kyc : null],
      [`حداقل ${fa(R.minDone)} پروژهٔ تمام‌شده`, st ? st.done >= R.minDone : null],
      [`امتیاز اعتبار ${fa(R.minTrust)} یا بیشتر`, st ? st.trust >= R.minTrust : null],
      [`${fa(R.minDays)} روز سابقه در بلوک`, st ? st.days >= R.minDays : null],
      ['بدون اخطار بدقولی فعال', st ? !st.strikes : null],
      [`حداکثر ضمانت برای ${fa(R.max)} نفر`, st ? st.active < R.max : null],
    ];
    return `<div class="card"><b style="display:block">${e ? (e.ok ? 'تو می‌توانی قیم دیگران باشی ✓' : 'هنوز نمی‌توانی قیم باشی') : 'چه کسی می‌تواند قیم باشد؟'}</b>
      <div class="elig">${rows.map((x) => `<div><i class="${x[1] === null ? '' : x[1] ? 'y' : 'n'}" style="${x[1] === null ? 'background:var(--soft)' : ''}">${x[1] === null ? '•' : x[1] ? '✓' : '✕'}</i><span>${x[0]}</span></div>`).join('')}</div></div>`;
  };
  wrapW('renderGuar', function (prev, ...a) {
    const r = prev(...a);
    try {
      const el = $('s-guar'); if (!el) return r;
      const bar = el.querySelector('.bar'); if (bar && !bar.querySelector('.hq')) bar.insertAdjacentHTML('beforeend', hq('guar'));
      const pp = el.querySelector('.gq-p');
      if (pp) pp.textContent = 'قیم کسی است که خودش در بلوک خوش‌سابقه است و با کد پیامکی تضمین می‌کند تو را می‌شناسد و خوش‌قولی. قیم معتبر ۵ امتیاز به اعتبارت اضافه می‌کند؛ اگر بدقولی کنی، او هم ۵ امتیاز از دست می‌دهد.';
      const h = el.querySelector('.hcard.gq h2'); if (h) h.textContent = 'ضامن خوش‌قولی تو در بلوک';
      const first = el.querySelector(':scope > .section');
      if (first && !el.querySelector('.elig36')) first.insertAdjacentHTML('afterend', `<div class="section elig36">${eligHTML()}</div>`);
      // ضمانت‌های فعالی که من داده‌ام: امکان پس گرفتن
      if (live()) {
        el.querySelectorAll('.greq').forEach((row, i) => {
          const g = S.me && S.me.guarReq && S.me.guarReq[i];
          if (g && g.st === 'ok' && g._g && !row.querySelector('.rvk')) row.insertAdjacentHTML('beforeend', `<button class="mbtn rvk" onclick="guarRevoke('${g._g}')">پس گرفتن</button>`);
        });
      }
      i18n(el);
      if (live() && Date.now() - S.guarX.at > 20000) loadGuarX().then(() => { const b = el.querySelector('.elig36'); if (b && S.cur === 'guar') { b.innerHTML = eligHTML(); i18n(b); } }).catch(() => {});
    } catch (e) {}
    return r;
  });
  // قبول ضمانت = تعهد + کد پیامکی
  wrapW('guarAns', function (prev, i, st) {
    const r = S.me && S.me.guarReq && S.me.guarReq[i];
    if (!live() || !r || !r._g || st !== 'ok') return prev(i, st);
    S.gAns = r;
    sb.innerHTML = `<div class="grab"></div><h3 id="sheetTitle">قیم ${esc(r.n)} می‌شوی؟</h3>
      <div class="card" style="margin:6px 0 12px;line-height:1.9;font-size:14px">«من ${esc(r.n)} را می‌شناسم و خوش‌قولی‌اش در کار را تضمین می‌کنم. می‌دانم اگر بدقولی کند، ۵ امتیاز از اعتبار من هم کم می‌شود.»</div>
      <button class="cta" id="gCodeB" onclick="guarCode()">فرستادن کد تأیید</button>
      <div id="gCodeBox" hidden><span class="label">کد ۵ رقمی پیامک‌شده</span><input class="field num" id="gCode" inputmode="numeric" maxlength="5" dir="ltr" style="text-align:center;letter-spacing:8px;font-size:20px">
      <button class="cta" onclick="guarConfirm()">تأیید و قیم شدن</button></div>
      <button class="ghost" style="width:100%;margin-top:8px" onclick="closeSheet()">فعلاً نه</button>`;
    show(); i18n(sb);
  });
  window.guarCode = function () {
    const r = S.gAns; if (!r) return;
    api('POST', '/guarantees/' + r._g + '/code').then((d) => {
      $('gCodeBox').hidden = false; $('gCodeB').hidden = true;
      if (d.devCode) $('gCode').value = d.devCode;
      setTimeout(() => $('gCode') && $('gCode').focus(), 50);
    }).catch(err);
  };
  window.guarConfirm = function () {
    const r = S.gAns, code = ($('gCode') && $('gCode').value) || '';
    if (!r) return;
    api('PATCH', '/guarantees/' + r._g, { status: 'accepted', code: LIVE.toEn ? LIVE.toEn(code) : code })
      .then(() => { r.st = 'ok'; closeSheet(); toast('قیم شدی؛ ۵ امتیاز به اعتبار او اضافه شد'); S.guarX.at = 0; render(); if (S.cur === 'guar') renderGuar(); })
      .catch(err);
  };
  window.guarRevoke = function (id) {
    if (!confirm(en() ? 'Withdraw your guarantee?' : 'ضمانتت را پس می‌گیری؟')) return;
    api('POST', '/guarantees/' + id + '/revoke').then(() => {
      const g = S.me.guarReq.find((x) => x._g === id); if (g) g.st = 'no';
      S.guarX.at = 0; toast('ضمانت پس گرفته شد'); if (S.cur === 'guar') renderGuar();
    }).catch(err);
  };

  /* ================= ۳) قراردادهای من ================= */
  S.ctrs = S.ctrs || { items: null, f: 'all', at: 0 };
  const CST = { active: 'فعال (امضای هر دو)', signing: 'منتظر امضا', draft: 'پیش‌نویس', void: 'باطل' };
  const RFA = { worker: 'کارگر', specialist: 'متخصص', engineer: 'مهندس', contractor: 'پیمانکار', company: 'شرکت', general: 'کارفرما' };
  mkScreen('ctrs', 'قراردادهای من');
  function demoCtrs() {
    const out = [];
    Object.entries(S.projs || {}).forEach(([role, L]) => (L || []).forEach((p, i) => {
      if (p.stage < 1) return;
      const w = person(p.who);
      out.push({ id: role + i, number: 'BLK-1405-' + String(120 + out.length).padStart(6, '0'), status: p.stage >= 2 ? 'active' : 'signing', title: p.t, dateFa: '۱۲ مهر ۱۴۰۵', priceText: p.amt, amount: null,
        myRole: p.meClient ? 'client' : 'provider', myProfileRole: role, other: { name: w ? w.name : '' }, signed: { client: true, provider: p.stage >= 2 }, project: { stage: p.stage }, _demo: { role, i } });
    }));
    return out;
  }
  async function loadCtrs(force) {
    if (!live()) { S.ctrs.items = demoCtrs(); return; }
    if (!force && S.ctrs.items && Date.now() - S.ctrs.at < 20000) return;
    const d = await api('GET', '/me/contracts');
    S.ctrs.items = d.items || []; S.ctrs.at = Date.now();
  }
  window.ctrsF = (f) => { S.ctrs.f = f; renderCtrs(); };
  window.renderCtrs = function () {
    const el = $('s-ctrs'); if (!el) return;
    const all = S.ctrs.items, f = S.ctrs.f;
    const L = (all || []).filter((c) => f === 'all' || (f === 'wait' ? ['draft', 'signing'].includes(c.status) : c.status === f));
    const cnt = (k) => (all || []).filter((c) => (k === 'wait' ? ['draft', 'signing'].includes(c.status) : c.status === k)).length;
    el.innerHTML = `${pageBar('قراردادهای من', hq('contract'))}
      <div class="section" style="margin-top:8px"><div class="chips">${[['all', 'همه'], ['active', 'فعال'], ['wait', 'منتظر امضا'], ['void', 'باطل']].map(([k, t]) => `<button class="chip" aria-pressed="${f === k}" onclick="ctrsF('${k}')">${t}${all && k !== 'all' ? ` <span class="num">${fa(cnt(k))}</span>` : ''}</button>`).join('')}</div></div>
      <div class="section">${all == null ? '<p class="hint center">در حال بارگذاری…</p>' : L.length ? L.map((c, k) => `<div class="ctr-card" style="animation:up .3s ${k * 40}ms both">
        <div class="h"><span class="tag st-${c.status}" style="font-size:12px;border-radius:8px;padding:3px 8px;font-weight:700">${CST[c.status] || c.status}</span><span class="no num">${esc(c.number)}</span></div>
        <b class="t">${esc(c.title)}</b>
        <div class="m">${c.myRole === 'client' ? 'مجری' : 'کارفرما'}: ${esc(c.other.name)} · ${esc(c.dateFa || '')} · نقش من: ${RFA[c.myProfileRole] || c.myProfileRole || ''}</div>
        <div class="m num" style="margin-top:2px">${c.amount ? (typeof faNum === 'function' ? faNum(c.amount) : fa(c.amount)) + ' تومان' : esc(c.priceText || '')}</div>
        <div class="sig"><span class="${c.signed.client ? 'ok' : ''}">${c.signed.client ? '✓' : '○'} امضای کارفرما</span><span class="${c.signed.provider ? 'ok' : ''}">${c.signed.provider ? '✓' : '○'} امضای مجری</span></div>
        <div class="acts"><button onclick="ctrOpen(${all.indexOf(c)})">نسخهٔ چاپی</button><button onclick="ctrProj(${all.indexOf(c)})">رفتن به پروژه</button></div></div>`).join('')
        : `<div class="empty"><b>${all.length ? 'در این دسته قراردادی نیست' : 'هنوز قراردادی نداری'}</b><p style="margin:4px 0 0">هر قراردادی که در چت ثبت و امضا کنی، خودکار اینجا بایگانی می‌شود.</p></div>`}</div><div style="height:20px"></div>`;
    i18n(el);
    if (all == null || (live() && Date.now() - S.ctrs.at > 20000)) loadCtrs().then(() => { if (S.cur === 'ctrs') renderCtrs(); }).catch(err);
  };
  window.ctrOpen = function (k) {
    const c = S.ctrs.items[k]; if (!c) return;
    if (c.printUrl) { const u = LIVE.abs ? LIVE.abs(c.printUrl) : c.printUrl; window.open(u, '_blank', 'noopener'); return; }
    toast('نسخهٔ چاپی بعد از اتصال به سرور');
  };
  window.ctrProj = function (k) {
    const c = S.ctrs.items[k]; if (!c) return;
    const role = c._demo ? c._demo.role : c.myProfileRole;
    if (role && role !== S.role) { toast('این قرارداد مال نقش «' + (RFA[role] || role) + '» توست؛ از «نقش‌های من» جابه‌جا شو'); return; }
    if (c._demo) { openProjPage(c._demo.i); return; }
    const go2 = () => { const i = (S.projs[S.role] || []).findIndex((p) => p._id === c.project.id); if (i > -1) openProjPage(i); else toast(c.project.status === 'cancelled' ? 'این پروژه لغو شده است' : 'پروژه پیدا نشد'); };
    if (LIVE.loadProjects) LIVE.loadProjects(true).then(go2).catch(go2); else go2();
  };

  /* ================= منوی «من»: میان‌برهای تازه ================= */
  const ICN = {
    ctr: '<svg class="ico" viewBox="0 0 24 24"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h4"/></svg>',
    stk: '<svg class="ico" viewBox="0 0 24 24"><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/><path d="M9 12l2 2 4-4"/></svg>',
    tut: '<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 4.8.9c0 1.7-2.3 2.1-2.3 3.6"/><path d="M12 17.2v.1"/></svg>',
  };
  wrapW('renderMe', function (prev, ...a) {
    const r = prev(...a);
    try {
      const root = $('s-me'); if (!root || !S.auth || root.querySelector('.m36')) return r;
      const tile = (fn, c, ic, t) => `<button class="m36" onclick="${fn}"><span class="ic" style="--c:${c}">${ic}</span>${t}</button>`;
      const put = (k, html) => { const g = root.querySelector(`details[data-k="${k}"] .mygrid`) || root.querySelector('.mygrid'); if (g) g.insertAdjacentHTML('beforeend', html); };
      put('work', tile("go('ctrs')", 'var(--accent)', ICN.ctr, 'قراردادهای من'));
      put('prof', tile("go('strikes')", 'var(--ok)', ICN.stk, 'خوش‌قولی'));
      put('tools', tile("tutOpen('all')", 'var(--gold)', ICN.tut, 'راهنمای بلوک'));
      i18n(root);
      // عکس پروفایل از سربرگ «من»
      const av = root.querySelector('header .avatar');
      if (av) { av.style.cursor = 'pointer'; av.setAttribute('role', 'button'); av.setAttribute('aria-label', 'عکس پروفایل'); av.onclick = () => avOpen(); }
    } catch (e) {}
    return r;
  });
  /* ================= ۴) عکس پروفایل (مثل لینکدین) ================= */
  const AVS = 640;
  const ED = { img: null, zoom: 1, x: 0, y: 0, rot: 0, tilt: 0, bri: 100, con: 100, tab: 'crop', stream: null };
  const SVG = {
    cam: '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    gal: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/></svg>',
    del: '<svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/></svg>',
  };
  const touch = () => { try { return matchMedia('(pointer:coarse)').matches; } catch (e) { return false; } };
  function avOpen() {
    if (!S.auth) { toast('اول وارد شو'); return; }
    const me = ME(), has = !!me.avatar;
    sb.innerHTML = `<div class="grab"></div><h3 id="sheetTitle" style="text-align:center">عکس پروفایل</h3>
      <div class="av-cur" style="background-color:${ROLES[S.role].c};${has ? `background-image:url('${String(me.avatar).replace(/['"()]/g, '')}')` : ''}">${has ? '' : esc((me.ini || 'م')[0])}</div>
      <p class="sub" style="text-align:center">عکس واضح از چهره، رو به نور. کارفرماها به پروفایل با عکس بیشتر اعتماد می‌کنند. شرکت‌ها: لوگو.</p>
      <div class="av-acts">
        ${touch() ? `<label><span class="ic">${SVG.cam}</span><b>گرفتن عکس</b><input type="file" accept="image/*" capture="user" hidden onchange="avFile(this)"></label>` : `<button onclick="avCam()"><span class="ic">${SVG.cam}</span><b>گرفتن عکس</b></button>`}
        <label><span class="ic">${SVG.gal}</span><b>انتخاب از گالری</b><input type="file" accept="image/*" hidden onchange="avFile(this)"></label>
        ${has ? `<button class="del" onclick="avDel()"><span class="ic">${SVG.del}</span><b>حذف عکس</b></button>` : ''}
      </div>`;
    show(); i18n(sb);
  }
  window.avOpen = avOpen;
  window.avFile = function (inp) {
    const f = inp.files && inp.files[0]; if (!f) return;
    if (!/^image\//.test(f.type)) { toast('فقط عکس'); return; }
    const im = new Image();
    im.onload = () => { closeSheet(); edOpen(im); };
    im.onerror = () => toast('این عکس باز نشد؛ عکس دیگری انتخاب کن');
    im.src = URL.createObjectURL(f);
  };
  window.avCam = function () {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { toast('این مرورگر دوربین ندارد؛ از گالری انتخاب کن'); return; }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false }).then((stream) => {
      closeSheet(); ED.stream = stream;
      const ov = document.createElement('div'); ov.className = 'ave'; ov.id = 'aveCam';
      ov.innerHTML = `<div class="ave-top"><button onclick="avCamStop()">انصراف</button><b>گرفتن عکس</b><span style="min-width:64px"></span></div><div class="ave-stage"><div class="ave-cam"><video playsinline autoplay muted></video><button class="ave-shot" aria-label="گرفتن عکس" onclick="avShot()"></button></div></div>`;
      document.body.appendChild(ov); i18n(ov);
      const v = ov.querySelector('video'); v.srcObject = stream; v.play().catch(() => {});
    }).catch(() => toast('برای عکس گرفتن، به بلوک اجازهٔ دوربین بده'));
  };
  const camStop = () => { if (ED.stream) ED.stream.getTracks().forEach((t) => t.stop()); ED.stream = null; const o = $('aveCam'); if (o) o.remove(); };
  window.avCamStop = camStop;
  window.avShot = function () {
    const v = document.querySelector('#aveCam video'); if (!v || !v.videoWidth) return;
    const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight;
    const x = c.getContext('2d'); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(v, 0, 0);
    camStop(); edOpen(c);
  };
  window.avDel = function () {
    if (!confirm(en() ? 'Remove profile photo?' : 'عکس پروفایل حذف شود؟')) return;
    closeSheet();
    if (!live()) { const m = ME(); m.avatar = null; render(); toast('عکس حذف شد'); return; }
    api('DELETE', '/me/roles/' + S.role + '/avatar').then(() => LIVE.loadMe()).then(() => { try { render(); } catch (e) {} if (LIVE.saveSnap) LIVE.saveSnap(); toast('عکس حذف شد'); }).catch(err);
  };
  const dims = (im) => [im.naturalWidth || im.videoWidth || im.width, im.naturalHeight || im.videoHeight || im.height];
  // کشیدن عکس روی بوم مربع: مرکز + جابه‌جایی، چرخش ۹۰ درجه و صاف کردن، «پوشاندن» کامل
  function draw(ctx, size, filt) {
    const im = ED.img; if (!im) return;
    const [iw, ih] = dims(im), q = ((ED.rot % 360) + 360) % 360, sw = q % 180 ? ih : iw, sh = q % 180 ? iw : ih;
    const tiltK = 1 + Math.abs(Math.sin((ED.tilt * Math.PI) / 180)) * 1.2;
    const k = Math.max(size / sw, size / sh) * ED.zoom * tiltK;
    ctx.save();
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, size, size);
    if (filt && 'filter' in ctx) ctx.filter = `brightness(${ED.bri}%) contrast(${ED.con}%)`;
    ctx.translate(size / 2 + ED.x * (size / AVS), size / 2 + ED.y * (size / AVS));
    ctx.rotate(((ED.rot + ED.tilt) * Math.PI) / 180);
    ctx.drawImage(im, (-iw * k) / 2, (-ih * k) / 2, iw * k, ih * k);
    ctx.restore();
  }
  function paint() {
    const cv = document.querySelector('#aveEd canvas'); if (!cv) return;
    draw(cv.getContext('2d'), cv.width, true);
  }
  const MASK = `<svg viewBox="0 0 100 100"><defs><mask id="avm36"><rect width="100" height="100" fill="#fff"/><circle cx="50" cy="50" r="46" fill="#000"/></mask></defs>
    <rect width="100" height="100" fill="rgba(0,0,0,.62)" mask="url(#avm36)"/><circle cx="50" cy="50" r="46" fill="none" stroke="#fff" stroke-width=".5"/>
    <g class="grid" stroke="#fff" stroke-width=".25"><line x1="35.3" y1="4" x2="35.3" y2="96"/><line x1="64.7" y1="4" x2="64.7" y2="96"/><line x1="4" y1="35.3" x2="96" y2="35.3"/><line x1="4" y1="64.7" x2="96" y2="64.7"/></g></svg>`;
  function ctlHTML() {
    const t = ED.tab;
    return `<div class="ave-tabs"><button aria-pressed="${t === 'crop'}" onclick="edTab('crop')">برش</button><button aria-pressed="${t === 'adj'}" onclick="edTab('adj')">نور و رنگ</button></div>
      ${t === 'crop' ? `<div class="ave-row"><label>بزرگ‌نمایی</label><input type="range" dir="ltr" min="1" max="4" step="0.01" value="${ED.zoom}" oninput="edSet('zoom',this.value)"></div>
        <div class="ave-row"><label>صاف کردن</label><input type="range" dir="ltr" min="-30" max="30" step="0.5" value="${ED.tilt}" oninput="edSet('tilt',this.value)"><button class="rb" onclick="edRot()" aria-label="چرخش ۹۰ درجه">⟲ ۹۰°</button></div>`
      : `<div class="ave-row"><label>روشنایی</label><input type="range" dir="ltr" min="60" max="150" value="${ED.bri}" oninput="edSet('bri',this.value)"></div>
        <div class="ave-row"><label>کنتراست</label><input type="range" dir="ltr" min="60" max="150" value="${ED.con}" oninput="edSet('con',this.value)"></div>
        <div class="ave-row" style="justify-content:center"><button class="rb" onclick="edReset()">برگرداندن به حالت اول</button></div>`}`;
  }
  function edOpen(im) {
    Object.assign(ED, { img: im, zoom: 1, x: 0, y: 0, rot: 0, tilt: 0, bri: 100, con: 100, tab: 'crop' });
    const old = $('aveEd'); if (old) old.remove();
    const ov = document.createElement('div'); ov.className = 'ave'; ov.id = 'aveEd';
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'ویرایش عکس پروفایل');
    ov.innerHTML = `<div class="ave-top"><button onclick="edClose()">انصراف</button><b>ویرایش عکس</b><button class="ave-sv" onclick="edSave()">ذخیره</button></div>
      <div class="ave-stage"><canvas width="${AVS}" height="${AVS}"></canvas><div class="ave-mask">${MASK}</div></div>
      <div class="ave-ctl">${ctlHTML()}</div>`;
    document.body.appendChild(ov); i18n(ov);
    bindEd(ov); paint();
  }
  window.avEdit = edOpen;
  window.edClose = () => { const o = $('aveEd'); if (o) o.remove(); };
  window.edTab = (t) => { ED.tab = t; const c = document.querySelector('#aveEd .ave-ctl'); if (c) { c.innerHTML = ctlHTML(); i18n(c); } };
  window.edSet = (k, v) => { ED[k] = +v; paint(); };
  window.edRot = () => { ED.rot = (ED.rot - 90) % 360; paint(); };
  window.edReset = () => { Object.assign(ED, { bri: 100, con: 100 }); edTab('adj'); paint(); };
  function bindEd(ov) {
    const cv = ov.querySelector('canvas'), pts = new Map();
    let base = null;
    const k = () => AVS / (cv.clientWidth || AVS);
    cv.addEventListener('pointerdown', (e) => {
      cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      ov.classList.add('drag');
      base = { x: ED.x, y: ED.y, zoom: ED.zoom, pts: new Map(pts) };
    });
    cv.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId) || !base) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size >= 2 && base.pts.size >= 2) {
        const [a, b] = [...pts.values()], [a0, b0] = [...base.pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y), d0 = Math.hypot(a0.x - b0.x, a0.y - b0.y) || 1;
        ED.zoom = Math.min(4, Math.max(1, (base.zoom * d) / d0));
      } else {
        const p0 = base.pts.get(e.pointerId); if (!p0) return;
        ED.x = base.x + (e.clientX - p0.x) * k(); ED.y = base.y + (e.clientY - p0.y) * k();
      }
      paint();
    });
    const up = (e) => { pts.delete(e.pointerId); base = pts.size ? { x: ED.x, y: ED.y, zoom: ED.zoom, pts: new Map(pts) } : null; if (!pts.size) { ov.classList.remove('drag'); const z = ov.querySelector('input[type=range]'); if (z && ED.tab === 'crop') z.value = ED.zoom; } };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', (e) => { e.preventDefault(); ED.zoom = Math.min(4, Math.max(1, ED.zoom * (e.deltaY < 0 ? 1.06 : 0.94))); paint(); }, { passive: false });
  }
  // نور و رنگ برای مرورگرهایی که filter روی بوم ندارند (سافاری قدیمی)
  function pixels(cv) {
    if (ED.bri === 100 && ED.con === 100) return;
    const x = cv.getContext('2d'), d = x.getImageData(0, 0, cv.width, cv.height), a = d.data, b = ED.bri / 100, c = ED.con / 100;
    for (let i = 0; i < a.length; i += 4) for (let j = 0; j < 3; j++) a[i + j] = Math.max(0, Math.min(255, ((a[i + j] * b - 128) * c) + 128));
    x.putImageData(d, 0, 0);
  }
  window.edSave = function () {
    const cv = document.createElement('canvas'); cv.width = cv.height = AVS;
    const ctx = cv.getContext('2d');
    const hasF = 'filter' in ctx;
    draw(ctx, AVS, hasF);
    if (!hasF) pixels(cv);
    cv.toBlob((blob) => {
      if (!blob) return;
      edClose();
      const url = URL.createObjectURL(blob);
      const h = $('avH'); if (h) { h.style.background = 'url(' + url + ') center/cover'; h.textContent = ''; }
      if (!live()) { ME().avatar = url; try { render(); } catch (e) {} toast('عکس پروفایل عوض شد'); return; }
      const fd = new FormData(); fd.append('file', new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
      api('PUT', '/me/roles/' + S.role + '/avatar', fd).then(() => LIVE.loadMe()).then(() => { try { render(); } catch (e) {} if (LIVE.saveSnap) LIVE.saveSnap(); toast('عکس پروفایل ذخیره شد'); }).catch(err);
    }, 'image/jpeg', 0.88);
  };
  // جای «استودیوی» قبلی: کلیک روی عکس صفحهٔ ویرایش ← برگهٔ لینکدینی (قبل از شنوندهٔ قبلی روی document)
  window.addEventListener('click', (e) => {
    const lab = e.target.closest && e.target.closest('.avup');
    if (!lab) return;
    e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation();
    avOpen();
  }, true);

  /* ================= ۵) قفل اطلاعات اصلی ================= */
  const LOCKK = (role) => (role === 'company' ? ['cname', 'ctype', 'nid', 'reg'] : ['fn', 'ln', 'nat', 'natc', 'idType', 'idNo', 'by', 'nezam']);
  const LOCK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  const filledV = (v) => v != null && v !== '' && !(Array.isArray(v) && !v.length);
  wrapW('fieldHTML', function (prev, f, d) {
    try {
      if (S.reg && S.reg.step === 'edit' && S.profile && S.profile.d && LOCKK(S.reg.role).includes(f.k) && filledV(S.profile.d[f.k])) {
        const v = S.profile.d[f.k];
        return `<div class="lkf">${LOCK_SVG}<span>${f.label}</span><b>${esc(Array.isArray(v) ? v.join('، ') : String(v))}</b></div>`;
      }
    } catch (e) {}
    return prev(f, d);
  });
  wrapW('renderEditAll', function (prev, ...a) {
    const r = prev(...a);
    try {
      const n = document.querySelector('#s-edit .note span');
      if (n) n.textContent = 'اطلاعات اصلی (نام، تابعیت، سال تولد، شمارهٔ نظام مهندسی، مشخصات ثبتی شرکت) بعد از ثبت‌نام قفل است؛ برای اصلاح به پشتیبانی پیام بده. بقیه را هر وقت خواستی عوض کن.';
      const hint = document.querySelector('#s-edit .avup + .hint, #s-edit .section .hint');
      if (hint && /هر چیزی که روی پروفایل/.test(hint.textContent)) hint.textContent = 'روی عکس بزن: گرفتن عکس، انتخاب از گالری یا حذف';
      i18n($('s-edit'));
    } catch (e) {}
    return r;
  });

  /* ================= ۶) آموزش‌ها: صحنه‌های متحرک با اجزای واقعی اپ ================= */
  const F = (x, y, cls) => `<i class="tut-f ${cls || ''}" style="left:${x}%;top:${y}%"></i>`;
  const heroMini = (pct, extra) => `<div class="hcard ph-hero" style="margin:0;padding:12px;border-radius:16px;font-size:10px"><div class="stars"></div>
      <small style="font-size:9px">حسین صالحی</small><h2 style="font-size:13px;margin:2px 0">آرماتوربندی سقف دوم</h2><div class="ph-who" style="font-size:9px">بعدی: واحد ۳</div>
      <div class="ph-bar" style="margin:8px 0"><i style="width:${pct}%;transition:width 1.2s .6s"></i></div>
      <div class="ph-kpi" style="font-size:9px"><div><b class="num">${fa(pct)}٪</b><small>پیشرفت</small></div><div><b class="num">۸.۵ م</b><small>دریافت</small></div><div><b class="num">۳ روز</b><small>مانده</small></div></div>${extra || ''}</div>`;
  const actsMini = `<div class="ph-acts" style="margin-top:10px">${[['✓', 'تیک', 1], ['✎', 'گزارش'], ['₮', 'پرداخت'], ['…', 'چت']].map((x) => `<span class="pa ${x[2] ? 'm' : ''}"><span style="width:30px;height:30px;font-size:13px">${x[0]}</span><small style="font-size:9px">${x[1]}</small></span>`).join('')}</div>`;
  const chatMini = (extra) => `<div style="display:grid;gap:6px"><div class="card" style="padding:8px;border-radius:12px;font-size:10px;justify-self:start;max-width:80%">سلام، فردا ۷ صبح می‌آیم برای آرماتوربندی</div>
      <div class="card" style="padding:8px;border-radius:12px;font-size:10px;justify-self:end;max-width:80%;background:var(--accent);color:#fff">قبول؛ قیمت تُنی ۹.۵ میلیون</div>${extra || ''}</div>`;
  const btnMini = (t, cls) => `<div class="${cls || 'cta'}" style="min-height:32px;font-size:11px;border-radius:10px;display:grid;place-items:center;margin-top:8px">${t}</div>`;
  const toggleMini = (on) => `<div class="rd-box ${on ? 'on' : ''}" style="padding:10px;border-radius:14px;font-size:10px"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:12px">آماده به کار</b><span class="tog" role="switch" aria-checked="${on}" style="transform:scale(.8)"></span></div><small style="display:block;margin-top:4px;color:var(--muted)">${on ? 'کارفرماها در کاوش تو را با نشان سبز می‌بینند' : 'خاموش'}</small></div>`;
  const scoreMini = (from, to) => `<div class="card" style="text-align:center;padding:14px;border-radius:14px"><small style="color:var(--muted)">امتیاز اعتبار</small><b class="num tut-cnt" data-from="${from}" data-to="${to}" style="display:block;font-size:30px;color:${to < from ? 'var(--bad)' : 'var(--ok)'}">${fa(from)}</b><small>${to < from ? 'اخطار بدقولی: −۱۰' : 'قیم معتبر: +۵'}</small></div>`;
  const TOP = {
    home: { ic: '🏠', t: 'مدیریت صفحهٔ خانه', d: 'کارت پروژه، دکمه‌های سریع، آماده به کار', page: 'home',
      steps: [
        { t: 'کارت بزرگ بالای خانه، پروژه‌های در جریان توست؛ هر پروژه یک برگ. با انگشت به چپ و راست بکش.', s: heroMini(40, '<div class="ph-dots" style="margin-top:8px"><button aria-current="true"></button><button></button><button></button></div>') + F(55, 30, 'swipe'), sel: '#phHero' },
        { t: 'دکمه‌های گرد زیر کارت، کار روزانه را بدون رفتن به صفحهٔ پروژه انجام می‌دهند: تیک، گزارش، پرداخت، چت.', s: heroMini(40, actsMini) + F(14, 76), sel: '#phHero .ph-acts' },
        { t: 'کلید «آماده به کار» را روشن کن تا کارفرماها در کاوش پیدایت کنند.', s: toggleMini(true) + F(84, 13), sel: '#rdSec' },
        { t: 'روی خود کارت بزن تا صفحهٔ کامل پروژه باز شود: قرارداد، پرداخت‌ها، گزارش‌ها، فایل‌ها.', s: heroMini(60) + F(50, 22) },
      ] },
    hero: { ic: '🧱', t: 'ویرایش کارت بزرگ خانه', d: 'فهرست کار، تیک زدن، پیشرفت', page: 'home',
      steps: [
        { t: 'دکمهٔ «☰ فهرست»: کارها را ردیف‌به‌ردیف بنویس (واحد ۱، واحد ۲ …)؛ هر ردیف یک تیک است.', s: `<div class="card" style="padding:10px;border-radius:14px;font-size:10.5px;line-height:2.1">✓ واحد ۱<br>✓ واحد ۲<br>○ واحد ۳<br>○ واحد ۴</div>` + btnMini('ذخیرهٔ فهرست') + F(50, 50) },
        { t: 'هر کار تمام شد، «✓ تیک» را بزن؛ نوار پیشرفت و درصد خودکار بالا می‌رود و کارفرما در چت خبردار می‌شود.', s: heroMini(75, actsMini) + F(14, 76), sel: '#phHero .ph-acts .pa' },
        { t: 'نوار پیشرفت و «مانده» همیشه به‌روز است؛ عدد قرمز یعنی از مدت قرارداد گذشته‌ای.', s: heroMini(75), sel: '#phHero .ph-kpi' },
        { t: 'برگ آخر کارت، کارت نقش توست (مثل تقاضاها)؛ چند پروژهٔ همزمان = چند برگ.', s: heroMini(30, '<div class="ph-dots" style="margin-top:8px"><button></button><button></button><button aria-current="true"></button></div>') + F(50, 30, 'swipe') },
      ] },
    contract: { ic: '✍️', t: 'ثبت قرارداد', d: 'از چت تا امضای پیامکی و بایگانی',
      steps: [
        { t: 'در چت با طرف مقابل، دکمهٔ «ثبت قرارداد» را بزن.', s: chatMini(btnMini('ثبت قرارداد')) + F(50, 52) },
        { t: 'کار، مبلغ، مدت و مراحل پرداخت را در ۳ گام پر کن؛ مبلغ با حروف هم نوشته می‌شود تا اشتباه نشود.', s: `<div class="card" style="padding:10px;border-radius:14px;font-size:10.5px"><small style="color:var(--muted)">مبلغ کل</small><div class="field num" style="min-height:30px;font-size:13px;display:flex;align-items:center;padding:0 8px">۲۸.۵۰۰.۰۰۰</div><small style="display:block;margin-top:4px;color:var(--accent)">بیست و هشت میلیون و پانصد هزار تومان</small></div>` + btnMini('مرحلهٔ بعد') + F(50, 58) },
        { t: 'هر دو با کد پیامکی امضا می‌کنید؛ متن قرارداد قفل و قابل چاپ است.', s: `<div class="card" style="padding:12px;border-radius:14px;text-align:center"><small>کد ۵ رقمی</small><div class="num" style="font-size:20px;letter-spacing:8px;margin:6px 0">۴۸۲۱۷</div><span style="color:var(--ok);font-weight:800">✓ امضا شد</span></div>` },
        { t: 'همهٔ قراردادها در «من ← قراردادهای من» بایگانی می‌شوند؛ با نسخهٔ چاپی و وضعیت امضای هر دو طرف.', s: `<div class="ctr-card" style="font-size:10px;padding:10px"><div class="h"><span class="tag st-active" style="font-size:9px;border-radius:6px;padding:2px 6px">فعال</span><span class="no">BLK-1405-000123</span></div><b class="t" style="font-size:12px">آرماتوربندی سقف دوم</b><div class="sig"><span class="ok" style="font-size:9px">✓ کارفرما</span><span class="ok" style="font-size:9px">✓ مجری</span></div></div>` },
      ] },
    strike: { ic: '⚖️', t: 'خوش‌قولی و لغو قرارداد', d: 'اگر کسی سر کار نیامد چه می‌شود؟', page: 'strikes',
      steps: [
        { t: 'طرف مقابل سر کار نیامد؟ در صفحهٔ پروژه «طرف مقابل بدقولی کرد؟» را بزن و بنویس چه شد.', s: `<div class="card" style="padding:4px 10px;border-radius:14px;font-size:11px"><div class="linkrow" style="min-height:38px;font-size:11px"><span class="ic" style="width:26px;height:26px">⚠</span><span>طرف مقابل بدقولی کرد؟</span></div><div class="linkrow" style="min-height:38px;font-size:11px"><span class="ic" style="width:26px;height:26px">✕</span><span>لغو قرارداد</span></div></div>` + F(50, 18) },
        { t: 'او ۲۴ ساعت فرصت دارد قبول یا اعتراض کند. اعتراض را مدیر بلوک بررسی می‌کند.', s: `<div class="stk" style="font-size:10px"><div class="h"><b style="font-size:11px">سر کار نیامد</b><span class="tag pending" style="font-size:9px">منتظر جواب</span></div><p style="font-size:10px">مهلت جواب: ۲۳ ساعت</p><div class="acts"><button class="y" style="min-height:28px;font-size:10px">قبول دارم</button><button style="min-height:28px;font-size:10px">اعتراض دارم</button></div></div>` },
        { t: 'اخطار ثبت شود: ۱۰ امتیاز کم تا ۱ ماه. ۳ اخطار در ۲ ماه: «آماده به کار» ۷ روز بسته. ۵ اخطار: تعلیق.', s: scoreMini(78, 68) },
        { t: 'لغو با توافق هر دو طرف اخطار ندارد؛ لغو یک‌طرفه برای لغوکننده اخطار دارد.', s: `<div class="cq-ban" style="font-size:10px;padding:10px"><b style="font-size:11px">حسین صالحی درخواست لغو داده</b><p style="font-size:10px">قبول کنی، بدون اخطار لغو می‌شود.</p><div class="row"><button class="y" style="min-height:28px;font-size:10px">قبول لغو</button><button style="min-height:28px;font-size:10px">ادامه</button></div></div>` + F(30, 70) },
      ] },
    guar: { ic: '🤝', t: 'قیم چیست؟', d: 'چه کسی قیم می‌شود و چه اثری دارد', page: 'guar',
      steps: [
        { t: 'قیم کسی است که خودش در بلوک خوش‌سابقه است و خوش‌قولی تو را تضمین می‌کند.', s: `<div class="hcard gq" style="margin:0;padding:12px;border-radius:16px"><small style="font-size:9px">قیم در بلوک</small><h2 style="font-size:13px">ضامن خوش‌قولی تو</h2></div>` },
        { t: 'شرط قیم شدن: هویت تأییدشده، ۳ پروژهٔ تمام‌شده، اعتبار ۷۰ یا بیشتر، ۳۰ روز سابقه، بدون اخطار.', s: `<div class="card" style="padding:10px;border-radius:14px"><div class="elig" style="font-size:10px">${['هویت تأییدشده', '۳ پروژهٔ تمام‌شده', 'اعتبار ۷۰+', '۳۰ روز سابقه'].map((x) => `<div><i class="y" style="width:18px;height:18px">✓</i><span>${x}</span></div>`).join('')}</div></div>`, sel: '.elig36' },
        { t: 'قیم با کد پیامکی تأیید می‌کند؛ ۵ امتیاز به اعتبار تو اضافه می‌شود.', s: scoreMini(72, 77) },
        { t: 'اگر بدقولی کنی، قیمت هم ۵ امتیاز از دست می‌دهد؛ پس فقط کسی را ضمانت کن که واقعاً می‌شناسی.', s: scoreMini(81, 76) },
      ] },
    pay: { ic: '💳', t: 'پرداخت و صورت‌وضعیت', d: 'ثبت پرداخت، تأیید دریافت، صورت‌وضعیت ساده',
      steps: [
        { t: 'فقط کارفرما پرداخت را ثبت می‌کند (با رسید یا شمارهٔ پیگیری)؛ مجری دریافت را تأیید می‌کند.', s: heroMini(50, `<div class="ph-acts" style="margin-top:10px"><span class="pa m"><span style="width:30px;height:30px;font-size:13px">₮</span><small style="font-size:9px">پرداخت</small></span></div>`) + F(50, 78) },
        { t: 'صورت‌وضعیت ساده: هر ردیف = کار + مبلغ + درصد انجام. جمع خودکار حساب می‌شود.', s: `<div class="card" style="padding:10px;border-radius:14px;font-size:10px;line-height:2.1"><div style="display:flex;justify-content:space-between"><span>آرماتور واحد ۱</span><b class="num">۱۰۰٪</b></div><div style="display:flex;justify-content:space-between"><span>آرماتور واحد ۲</span><b class="num">۶۰٪</b></div><hr style="border:0;border-top:1px solid var(--line)"><div style="display:flex;justify-content:space-between"><span>جمع</span><b class="num">۱۵.۲۰۰.۰۰۰</b></div></div>` },
        { t: 'بلوک واسطهٔ مالی نیست؛ پول مستقیم بین شما جابه‌جا می‌شود و بلوک فقط ثبت و تأیید را نگه می‌دارد.', s: `<div class="note" style="font-size:10.5px">بلوک واسطهٔ مالی نیست</div>` },
      ] },
    ready: { ic: '🟢', t: 'آماده به کار', d: 'دیده شدن در کاوش با یک کلید', page: 'home',
      steps: [
        { t: 'در خانه کلید «آماده به کار» را روشن کن؛ یک آگهی کوتاه با مهارت و دستمزدت ساخته می‌شود.', s: toggleMini(false) + F(84, 13), sel: '#rdSec' },
        { t: 'کارفرماها در کاوش تو را با نشان سبز «آماده» می‌بینند و نیروی فوری هم به تو می‌رسد.', s: toggleMini(true) },
        { t: 'بعد از قرارداد خاموش می‌شود؛ کار که تمام شد، با یک لمس دوباره روشنش کن.', s: toggleMini(true) + F(84, 13) },
      ] },
    urgent: { ic: '⚡', t: 'نیروی فوری', d: 'نیرو برای همین امروز و فردا', page: 'home',
      steps: [
        { t: 'کارفرما: دکمهٔ ⚡ نیروی فوری را بزن؛ کار، دستمزد روزانه و زمان شروع را بنویس.', s: `<div class="ug-btn" style="padding:10px;border-radius:14px"><span class="bolt" style="width:32px;height:32px;font-size:18px">⚡</span><span class="t"><b style="font-size:12px">نیروی فوری</b><small style="font-size:9px">برای همین امروز و فردا</small></span></div>` + F(50, 14), sel: '#ugBtnSec' },
        { t: 'درخواست همزمان به همهٔ نیروهای «آماده به کار» استان می‌رسد؛ هم‌شهری‌ها اول.', s: `<div class="ug-radar" style="width:130px;height:130px"><i></i><i></i><i></i><b style="inset:42px;font-size:20px">⚡</b></div>` },
        { t: 'اولین نفری که قبول کند، کار مال اوست؛ گفت‌وگو، توافق و پروژه خودکار ساخته می‌شود.', s: chatMini(btnMini('✓ قبول کرد؛ پروژه ساخته شد', 'ghost')) },
      ] },
  };
  const ORDER = ['home', 'hero', 'contract', 'strike', 'guar', 'pay', 'ready', 'urgent'];
  const T = { k: null, i: 0, timer: 0 };
  function countAnim(root) {
    root.querySelectorAll('.tut-cnt').forEach((el) => {
      const a = +el.dataset.from, b = +el.dataset.to, t0 = performance.now() + 700;
      const step = (t) => { const p = Math.min(1, Math.max(0, (t - t0) / 900)); el.textContent = fa(Math.round(a + (b - a) * p)); if (p < 1 && document.body.contains(el)) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }
  function tutStep() {
    const tp = TOP[T.k], st = tp.steps[T.i], last = T.i === tp.steps.length - 1;
    sb.innerHTML = `<div class="grab"></div><h3 id="sheetTitle" style="text-align:center">${tp.t}</h3>
      <div class="tut-ph" aria-hidden="true"><div class="scr" key="${T.i}">${st.s}</div></div>
      <p class="tut-cap">${st.t}</p>
      <div class="tut-dots">${tp.steps.map((_, j) => `<i class="${j === T.i ? 'on' : ''}"></i>`).join('')}</div>
      <div class="tut-nav">${T.i ? '<button class="ghost" onclick="tutGo(-1)">قبلی</button>' : ''}<button class="cta" style="margin:0" onclick="${last ? 'closeSheet()' : 'tutGo(1)'}">${last ? 'فهمیدم' : 'بعدی'}</button></div>
      ${tp.page && tp.steps.some((s) => s.sel) && S.auth ? '<button class="ghost" style="width:100%;margin-top:8px" onclick="tutShow()">نشانم بده در خود اپ</button>' : ''}
      <button class="ghost" style="width:100%;margin-top:4px;font-size:13px" onclick="tutOpen(\'all\')">همهٔ آموزش‌ها</button>`;
    show(); i18n(sb); countAnim(sb);
    const bar = sb.querySelector('.ph-bar i'); if (bar) { const w = bar.style.width; bar.style.width = '0'; requestAnimationFrame(() => requestAnimationFrame(() => (bar.style.width = w))); }
  }
  window.tutGo = (d) => { T.i = Math.max(0, Math.min(TOP[T.k].steps.length - 1, T.i + d)); tutStep(); };
  window.tutOpen = function (topics) {
    const list = String(topics || 'all') === 'all' ? ORDER : String(topics).split(',').filter((k) => TOP[k]);
    if (list.length === 1) { T.k = list[0]; T.i = 0; tutStep(); return; }
    sb.innerHTML = `<div class="grab"></div><h3 id="sheetTitle">راهنمای بلوک</h3><p class="sub">آموزش کوتاه هر بخش با مثال واقعی؛ هر جا علامت ${HQ_SVG.replace('<svg', '<svg style="width:18px;height:18px;vertical-align:-4px;fill:none;stroke:var(--gold);stroke-width:2;stroke-linecap:round"')} را دیدی، آموزش همان بخش است.</p>
      <div class="tut-list">${list.map((k) => `<button onclick="tutOpen('${k}')"><span class="ic">${TOP[k].ic}</span><span><b>${TOP[k].t}</b><small>${TOP[k].d}</small></span></button>`).join('')}</div>
      ${String(topics) === 'all' ? '<button class="ghost" style="width:100%;margin-top:8px" onclick="closeSheet();onbOpen()">دیدن دوبارهٔ آشنایی با بلوک</button>' : ''}`;
    show(); i18n(sb);
  };
  // «نشانم بده»: همان مراحل روی صفحهٔ واقعی با نورافکن
  window.tutShow = function () {
    const tp = TOP[T.k]; const steps = tp.steps.filter((s) => s.sel);
    closeSheet();
    if (tp.page && S.cur !== tp.page) go(tp.page);
    setTimeout(() => spot(steps, 0), 450);
  };
  function spot(steps, i) {
    const old = document.querySelector('.sp-ov'); if (old) old.remove();
    if (i >= steps.length) return;
    const el = document.querySelector(steps[i].sel);
    if (!el || !el.getClientRects().length) { if (i + 1 < steps.length) return spot(steps, i + 1); toast('این بخش الان در صفحه نیست؛ اول پروژه یا آگهی بساز'); return; }
    el.scrollIntoView({ block: 'center' });
    setTimeout(() => {
      const r = el.getBoundingClientRect(), pad = 6;
      const ov = document.createElement('div'); ov.className = 'sp-ov';
      const below = r.bottom + 170 < innerHeight;
      ov.innerHTML = `<div class="sp-hole" style="left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px"></div>
        <div class="sp-tip" style="top:${below ? r.bottom + 16 : Math.max(16, r.top - 160)}px"><p>${steps[i].t}</p><div class="row"><small class="num">${fa(i + 1)} از ${fa(steps.length)}</small><button class="mbtn">${i + 1 < steps.length ? 'بعدی' : 'تمام'}</button></div></div>`;
      ov.onclick = () => spot(steps, i + 1);
      document.body.appendChild(ov); i18n(ov);
    }, 260);
  }

  /* --- علامت آموزش در صفحه‌ها --- */
  const addHq = (sel, topics, where) => { const el = document.querySelector(sel); if (el && !el.querySelector(':scope > .hq')) el.insertAdjacentHTML(where || 'beforeend', hq(topics)); };
  wrapW('renderHome', function (prev, ...a) {
    const r = prev(...a);
    try {
      const host = $('s-home'); if (!host) return r;
      const top = host.querySelector(':scope > header'); if (top && !top.querySelector('.hq')) top.insertAdjacentHTML('beforeend', hq('home,hero,ready,urgent'));
      const ph = $('phHero'); if (ph && !ph.querySelector('.ph-hq')) ph.insertAdjacentHTML('afterbegin', hq('hero', 'on-dark ph-hq'));
      // دور ۳۷: خانه فقط کار خود کاربر؛ درخواست‌های تازه، کاوش و تبلیغ‌های نامرتبط نه
      const head = (s) => { const h = s.querySelector(':scope > .sec-head h3'); return h ? h.textContent.trim() : ''; };
      host.querySelectorAll(':scope > .section').forEach((s) => {
        const t = head(s);
        if (/^درخواست‌های تازه|^پیشنهادها برای/.test(t) || s.querySelector('.est-promo') || /ساختمانت چقدر خرج دارد|حل‌کنندهٔ حضوری بلوک شو/.test(s.textContent) && !s.querySelector('.hcard, #phHero')) s.remove();
      });
      // دور ۴۲: یک «دسترسی سریع» یکسان برای همهٔ نقش‌ها (به‌جای کاشی‌های پراکندهٔ هر نقش)
      if (S.auth) {
        host.querySelectorAll(':scope > .section .qa').forEach((q) => { const s = q.closest('.section'); if (s && s.id !== 'qa42') s.remove(); });
        if (!$('qa42')) {
          const L = (S.req && S.req[S.role]) || [];
          const pend = L.filter((x) => x && !x.st).length, un = (S.notifs || []).filter((n) => !n.read).length;
          const msgN = (S.convs || []).reduce((n, c) => n + (c.unread || 0), 0);
          const IC = {
            req: '<svg class="ico" viewBox="0 0 24 24"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h4"/></svg>',
            proj: '<svg class="ico" viewBox="0 0 24 24"><path d="M3 21h18M5 21V10l7-5 7 5v11"/><path d="M9 21v-6h6v6"/></svg>',
            ctr: '<svg class="ico" viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"/><path d="M9 15c1.5-2 2.5 1 4-1s2 1 3 0"/></svg>',
            msg: '<svg class="ico" viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></svg>',
            ads: '<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h5"/></svg>',
            post: '<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>',
            id: '<svg class="ico" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="12" r="2.5"/><path d="M14 10h4M14 14h3"/></svg>',
            bell: '<svg class="ico" viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
          };
          const t = (fn, c, ic, label, n) => `<button onclick="${fn}"><span class="ic" style="--c:${c}">${ic}</span>${label}${n ? `<em class="num">${fa(n)}</em>` : ''}</button>`;
          const html = `<div class="section" id="qa42"><div class="sec-head"><h3>دسترسی سریع</h3></div><div class="qa qa42">${[
            t("go('req')", 'var(--gold)', IC.req, 'درخواست‌ها', pend),
            t("go('proj')", 'var(--accent)', IC.proj, 'پروژه‌ها'),
            t("go('ctrs')", 'var(--r-engineer)', IC.ctr, 'قراردادها'),
            t("go('msg')", 'var(--r-specialist)', IC.msg, 'پیام‌ها', msgN),
            t("go('myads')", 'var(--r-contractor)', IC.ads, 'آگهی‌های من'),
            t("gate('post',()=>openWizard())", 'var(--ok)', IC.post, 'ثبت آگهی'),
            t("openTrust('me')", 'var(--r-worker)', IC.id, 'شناسنامهٔ کاری'),
            t("go('notif')", 'var(--r-company)', IC.bell, 'اعلان‌ها', un),
          ].join('')}</div></div>`;
          const after = $('phHero') || $('ugIn') || $('ugBtnSec') || host.querySelector(':scope > header');
          if (after) after.insertAdjacentHTML('afterend', html); else host.insertAdjacentHTML('afterbegin', html);
        }
      }
      // ابزار برآورد هزینه برای همه (کاربر و مهمان)، پایین خانه
      if (!$('est42')) {
        host.insertAdjacentHTML('beforeend', `<div class="section" id="est42"><button class="card est42" onclick="go('est')"><span class="ic">${'<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M8 18h2M12 18h4"/></svg>'}</span><span class="t"><b>برآورد هزینه</b><small>هزینهٔ ساخت، بازسازی و دستمزد؛ قیمت به‌روز، در ۳۰ ثانیه</small></span><span class="go">‹</span></button></div>`);
      }
      // کارت «آماده به کار» پایین خانه
      const rdS = $('rdSec');
      if (rdS && rdS.parentElement === host) { const tail = [...host.children].reverse().find((c) => c.classList.contains('section') || c.id === 'phHero'); if (tail && tail !== rdS) tail.after(rdS); }
    } catch (e) {}
    return r;
  });
  wrapW('renderUrg', function (prev, ...a) { const r = prev(...a); try { addHq('#s-urg .bar', 'urgent'); } catch (e) {} return r; });
  ['renderChat'].forEach((n) => wrapW(n, function (prev, ...a) { const r = prev(...a); try { addHq('#s-chat .bar', 'contract'); } catch (e) {} return r; }));

  /* ================= آشنایی اول کار ================= */
  const ONB = [
    { h: 'به بلوک خوش آمدی', p: 'کارگر، متخصص، مهندس، پیمانکار و کارفرما؛ همه در یک جا، در سراسر ایران.', art: 'hex' },
    { h: 'پیدا کن یا پیدا شو', p: 'در کاوش آگهی‌ها و نیروهای آماده به کار را ببین؛ یا خودت «آماده به کار» شو تا پیدایت کنند.', art: 'find' },
    { h: 'قرارداد واقعی با امضای پیامکی', p: 'توافق در چت، قرارداد با کد پیامکی، و پرداخت و پیشرفت کار همه ثبت می‌شود.', art: 'sign' },
    { h: 'خوش‌قولی = اعتبار', p: 'هر کار تمام‌شده و هر ستاره اعتبارت را بالا می‌برد؛ بدقولی ۱۰ امتیاز کمش می‌کند.', art: 'score' },
    { h: 'هر جا این علامت را دیدی', p: 'روی آن بزن تا آموزش کوتاه همان بخش را با مثال واقعی ببینی.', art: 'hq' },
  ];
  const ART = {
    hex: `<svg viewBox="0 0 200 160"><g fill="none" stroke-width="3">${[[100, 80, '#F2B53A'], [60, 56, '#0F766E'], [140, 56, '#5EA8FF'], [60, 104, '#F97316'], [140, 104, '#A78BFA']].map(([x, y, c], k) => `<polygon points="${x},${y - 22} ${x + 19},${y - 11} ${x + 19},${y + 11} ${x},${y + 22} ${x - 19},${y + 11} ${x - 19},${y - 11}" stroke="${c}" fill="${k ? 'none' : c}" style="animation:tutIn .5s ${k * 0.15}s both"/>`).join('')}</g></svg>`,
    find: `<svg viewBox="0 0 200 160"><circle cx="90" cy="75" r="38" fill="none" stroke="#F2B53A" stroke-width="5"/><path d="M118 103l30 30" stroke="#F2B53A" stroke-width="8" stroke-linecap="round"/><circle cx="90" cy="75" r="9" fill="#22C55E"><animate attributeName="r" values="7;12;7" dur="1.6s" repeatCount="indefinite"/></circle></svg>`,
    sign: `<svg viewBox="0 0 200 160"><rect x="55" y="20" width="90" height="120" rx="10" fill="#1F2937" stroke="#374151"/><path d="M70 50h60M70 66h60M70 82h40" stroke="#6B7280" stroke-width="4" stroke-linecap="round"/><path d="M70 115c10-14 18 8 28-4s14 6 26-6" fill="none" stroke="#F2B53A" stroke-width="4" stroke-linecap="round" stroke-dasharray="120" stroke-dashoffset="120"><animate attributeName="stroke-dashoffset" from="120" to="0" dur="1.4s" fill="freeze" repeatCount="indefinite"/></path></svg>`,
    score: `<svg viewBox="0 0 200 160"><circle cx="100" cy="80" r="52" fill="none" stroke="#1F2937" stroke-width="12"/><circle cx="100" cy="80" r="52" fill="none" stroke="#22C55E" stroke-width="12" stroke-linecap="round" stroke-dasharray="327" stroke-dashoffset="327" transform="rotate(-90 100 80)"><animate attributeName="stroke-dashoffset" from="327" to="70" dur="1.4s" fill="freeze"/></circle><text x="100" y="90" text-anchor="middle" font-size="30" font-weight="900" fill="#fff">۷۸</text></svg>`,
    hq: `<div class="hqbig">${HQ_SVG}</div>`,
  };
  const O = { i: 0 };
  function onbRender() {
    const ov = $('onb36'); if (!ov) return;
    const s = ONB[O.i], last = O.i === ONB.length - 1;
    ov.innerHTML = `<button class="skip" onclick="onbClose()">${last ? '' : 'رد شدن'}</button>
      <div class="art stage" key="${O.i}">${ART[s.art]}</div>
      <div class="stage"><h2>${s.h}</h2><p>${s.p}</p></div>
      <div class="dots">${ONB.map((_, j) => `<i class="${j === O.i ? 'on' : ''}"></i>`).join('')}</div>
      <button class="go" onclick="${last ? 'onbClose()' : 'onbNext()'}">${last ? 'شروع' : 'بعدی'}</button>
      ${last ? `<button class="alt" onclick="onbClose();tutOpen('all')">دیدن همهٔ آموزش‌ها</button>` : ''}`;
    i18n(ov);
  }
  window.onbOpen = function () {
    if ($('onb36')) return;
    O.i = 0;
    const ov = document.createElement('div'); ov.className = 'onb'; ov.id = 'onb36'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'آشنایی با بلوک');
    document.body.appendChild(ov);
    let x0 = null;
    ov.addEventListener('pointerdown', (e) => (x0 = e.clientX));
    ov.addEventListener('pointerup', (e) => { if (x0 == null) return; const d = e.clientX - x0; x0 = null; if (Math.abs(d) > 50) { const fwd = en() ? d < 0 : d > 0; O.i = Math.max(0, Math.min(ONB.length - 1, O.i + (fwd ? 1 : -1))); onbRender(); } });
    onbRender();
  };
  window.onbNext = () => { O.i = Math.min(ONB.length - 1, O.i + 1); onbRender(); };
  window.onbClose = () => { ls.set('blk-onb1', '1'); const o = $('onb36'); if (o) o.remove(); };
  if (!jsdom && !ls.get('blk-onb1')) setTimeout(() => { if (!ls.get('blk-onb1')) onbOpen(); }, 700);

  /* ================= ترجمهٔ انگلیسی ================= */
  if (typeof I18N === 'object') {
    Object.assign(I18N.dict, {
      'آموزش': 'Tutorial', 'دسترسی سریع': 'Quick access', 'برآورد هزینه': 'Cost estimate', 'هزینهٔ ساخت، بازسازی و دستمزد؛ قیمت به‌روز، در ۳۰ ثانیه': 'Build, renovation and labour costs; current prices, in 30 seconds', 'قراردادها': 'Contracts', 'پیام‌ها': 'Messages', 'ثبت آگهی': 'Post an ad', 'پروژه‌ها': 'Projects', 'ثبت‌نام کامل': 'Complete sign-up', 'برای همه از روز اول': 'For everyone from day one', 'مدرک تأییدشده': 'Approved document', 'نشان «مدرک‌دار» گرفته': 'Has the “Documented” badge', 'یک مدرک (کارت مهارت، پروانه…) بفرست': 'Send one document (skill card, licence…)', 'شروع:': 'Start:', 'با ثبت‌نام کامل ۱۰ امتیاز، با تأیید هویت ۱۰ و با اولین مدرک تأییدشده ۵ امتیاز؛ یعنی از روز اول دست‌کم ۲۵.': 'Complete sign-up 10 points, identity check 10, first approved document 5; at least 25 from day one.', 'راهنمای بلوک': 'Blook guide', 'همهٔ آموزش‌ها': 'All tutorials', 'دیدن همهٔ آموزش‌ها': 'See all tutorials', 'نشانم بده در خود اپ': 'Show me in the app',
      'فهمیدم': 'Got it', 'بعدی': 'Next', 'قبلی': 'Back', 'تمام': 'Done', 'شروع': 'Start', 'رد شدن': 'Skip', 'دیدن دوبارهٔ آشنایی با بلوک': 'Replay the Blook intro',
      'خوش‌قولی': 'Reliability', 'خوش‌قولی و اخطارها': 'Reliability & warnings', 'قانون بلوک': 'Blook rule', 'قول، قول است': 'A promise is a promise',
      '{#} اخطار فعال داری': 'You have {#} active warnings', 'هر اخطار ۱ ماه بعد خودکار از امتیازت برمی‌گردد.': 'Each warning is automatically lifted from your score after 1 month.',
      'تا حالا اخطار بدقولی نداری. همین‌طور بمان؛ خوش‌قولی اعتبارت را بالا نگه می‌دارد.': 'No bad-faith warnings so far. Keep it that way; reliability keeps your score high.',
      'ثبت‌شده برای من': 'Recorded against me', 'ثبت‌شده توسط من': 'Recorded by me', 'اگر کسی بدقولی کند چه می‌شود؟': 'What happens if someone breaks their word?',
      'ثبت بدقولی': 'Report bad faith', '۲۴ ساعت فرصت جواب': '24 hours to respond', 'اخطار: ۱۰ امتیاز کم تا ۱ ماه': 'Warning: −10 points for 1 month', '۳ اخطار در ۲ ماه': '3 warnings in 2 months', 'لغو قرارداد امضاشده': 'Cancelling a signed contract',
      'اگر طرف مقابل سر کار نیامد یا به قرارداد عمل نکرد، در صفحهٔ پروژه «بدقولی طرف مقابل» را بزن.': 'If the other side did not show up or broke the contract, tap “Report bad faith” on the project page.',
      'او می‌تواند قبول کند یا اعتراض بنویسد؛ اعتراض را مدیر بلوک بررسی می‌کند. بی‌جواب بماند، اخطار ثبت می‌شود.': 'They can accept or object; a Blook admin reviews objections. No answer means the warning is recorded.',
      'روی شناسنامهٔ کاری دیده می‌شود. قیم‌های او هم هر کدام ۵ امتیاز از دست می‌دهند.': 'It shows on the work ID. Each of their guarantors also loses 5 points.',
      '«آماده به کار» و نیروی فوری ۷ روز بسته می‌شود. ۵ اخطار فعال = تعلیق حساب تا بررسی مدیر.': '“Ready to work” and urgent hire are blocked for 7 days. 5 active warnings = account suspended until admin review.',
      'لغو با توافق هر دو طرف اخطار ندارد. لغو یک‌طرفه برای لغوکننده اخطار دارد. خسارت مالی از راه حل اختلاف.': 'Mutual cancellation has no warning. One-sided cancellation gives the canceller a warning. Damages go through dispute resolution.',
      'سر کار نیامد': 'Did not show up', 'لغو یک‌طرفهٔ قرارداد': 'One-sided cancellation', 'عمل نکردن به قرارداد': 'Breach of contract', 'به قرارداد عمل نکرد': 'Broke the contract',
      'منتظر جواب': 'Awaiting reply', 'اعتراض؛ در بررسی مدیر': 'Objected; under admin review', 'اخطار ثبت شد': 'Warning recorded', 'رد شد': 'Dismissed',
      'پروژه': 'Project', 'ثبت‌کننده': 'Reported by', 'لغو یک‌طرفه': 'One-sided cancel', 'برای': 'For', 'جواب': 'Reply', 'مهلت جواب': 'Reply deadline',
      'قبول دارم': 'I accept', 'اعتراض دارم': 'I object', 'اعتراض به بدقولی': 'Object to the report', 'ثبت اعتراض': 'Submit objection',
      'بنویس چه شد؛ اگر مدرک داری (پیام، عکس) در چت پروژه بفرست. مدیر بلوک هر دو طرف را می‌بیند و تصمیم می‌گیرد.': 'Explain what happened; send any evidence (messages, photos) in the project chat. A Blook admin sees both sides and decides.',
      'ثبت شد؛ خوش‌قولی از امروز': 'Recorded; reliability from today on', 'اعتراض ثبت شد؛ مدیر بلوک بررسی می‌کند': 'Objection submitted; a Blook admin will review it',
      'بدقولی {@}': 'Bad faith: {@}', 'فقط بعد از امضای قرارداد توسط هر دو طرف. او ۲۴ ساعت فرصت دارد قبول یا اعتراض کند.': 'Only after both sides signed the contract. They have 24 hours to accept or object.',
      'چه شد؟': 'What happened?', 'توضیح کوتاه': 'Short note', 'ثبت ناروا را مدیر بلوک رد می‌کند. اول در چت با هم صحبت کنید.': 'False reports are dismissed by the admin. Talk in the chat first.',
      'ثبت شد؛ طرف مقابل ۲۴ ساعت فرصت جواب دارد': 'Recorded; the other side has 24 hours to reply', 'بنویس چه شد': 'Describe what happened',
      'لغو قرارداد': 'Cancel contract', 'دلیل لغو': 'Reason for cancelling', 'درخواست لغو با توافق': 'Request mutual cancellation', 'لغو یک‌طرفه (اخطار برای من)': 'Cancel one-sidedly (warning for me)',
      'اگر قرارداد را هر دو امضا کرده‌اید: لغو با توافق اخطار ندارد؛ لغو یک‌طرفه برای تو اخطار بدقولی دارد (۱۰ امتیاز تا ۱ ماه). قبل از امضا، لغو آزاد است.': 'If you both signed: mutual cancellation has no warning; one-sided cancellation gives you a bad-faith warning (10 points for 1 month). Before signing, cancelling is free.',
      'درخواست لغو فرستاده شد؛ اگر قبول کند، بدون اخطار لغو می‌شود': 'Cancellation request sent; if accepted, it is cancelled with no warning', 'لغو شد؛ اخطار بدقولی برایت ثبت شد': 'Cancelled; a bad-faith warning was recorded for you', 'پروژه لغو شد': 'Project cancelled',
      'با توافق لغو شد؛ بدون اخطار': 'Cancelled by agreement; no warning', 'قرارداد ادامه دارد': 'The contract continues', 'انجام شد': 'Done',
      'درخواست لغو فرستادی': 'You requested cancellation', 'پس گرفتن درخواست': 'Withdraw request', '{@} درخواست لغو داده': '{@} asked to cancel', 'قبول لغو': 'Accept cancellation', 'ادامهٔ قرارداد': 'Continue the contract',
      'طرف مقابل بدقولی کرد؟': 'Other side broke their word?', 'قانون خوش‌قولی بلوک': 'Blook reliability rule', 'قیم و خوش‌قولی': 'Guarantor & reliability', 'قیم معتبر +۵': 'Valid guarantor +5', 'قیم، پاسخ مفید و خوش‌قولی': 'Guarantor, helpful answers & reliability', 'قیم معتبر +۵ · هر پاسخ تخصصی با لایک +۱ (تا ۵)': 'Valid guarantor +5 · each liked expert answer +1 (up to 5)', '۵. قیم، پاسخ مفید و خوش‌قولی:': '5. Guarantor, helpful answers & reliability:', 'هر پاسخ تو به پرسش تخصصی که اولین «مفید بود» را بگیرد ۱ امتیاز (تا ۵).': 'Each of your expert answers that gets its first “helpful” earns 1 point (up to 5).',
      '{#} اخطار بدقولی فعال (هر کدام −۱۰)': '{#} active bad-faith warnings (−10 each)', '{#} اخطار بدقولی در ماه اخیر': '{#} bad-faith warnings in the last month',
      'ضامن خوش‌قولی تو در بلوک': 'Your reliability guarantor in Blook',
      'قیم کسی است که خودش در بلوک خوش‌سابقه است و با کد پیامکی تضمین می‌کند تو را می‌شناسد و خوش‌قولی. قیم معتبر ۵ امتیاز به اعتبارت اضافه می‌کند؛ اگر بدقولی کنی، او هم ۵ امتیاز از دست می‌دهد.': 'A guarantor is someone with a good record in Blook who confirms by SMS code that they know you and you keep your word. A valid guarantor adds 5 points; if you break your word, they lose 5 points too.',
      'تو می‌توانی قیم دیگران باشی ✓': 'You can be a guarantor ✓', 'هنوز نمی‌توانی قیم باشی': 'You cannot be a guarantor yet', 'چه کسی می‌تواند قیم باشد؟': 'Who can be a guarantor?',
      'هویت تأییدشده': 'Verified identity', 'حداقل {#} پروژهٔ تمام‌شده': 'At least {#} completed projects', 'امتیاز اعتبار {#} یا بیشتر': 'Trust score {#} or more', '{#} روز سابقه در بلوک': '{#} days in Blook',
      'بدون اخطار بدقولی فعال': 'No active bad-faith warning', 'حداکثر ضمانت برای {#} نفر': 'Guarantee at most {#} people', 'پس گرفتن': 'Withdraw',
      'قیم {@} می‌شوی؟': 'Become {@}’s guarantor?', 'فرستادن کد تأیید': 'Send confirmation code', 'کد ۵ رقمی پیامک‌شده': '5-digit SMS code', 'تأیید و قیم شدن': 'Confirm and guarantee', 'فعلاً نه': 'Not now',
      'قیم شدی؛ ۵ امتیاز به اعتبار او اضافه شد': 'You are now a guarantor; 5 points added to their score', 'ضمانت پس گرفته شد': 'Guarantee withdrawn',
      'قراردادهای من': 'My contracts', 'همه': 'All', 'فعال': 'Active', 'منتظر امضا': 'Awaiting signature', 'باطل': 'Void', 'پیش‌نویس': 'Draft', 'فعال (امضای هر دو)': 'Active (both signed)',
      'مجری': 'Provider', 'کارفرما': 'Employer', 'نقش من': 'My role', 'امضای کارفرما': 'Employer signature', 'امضای مجری': 'Provider signature', 'نسخهٔ چاپی': 'Printable copy', 'رفتن به پروژه': 'Go to project',
      'در این دسته قراردادی نیست': 'No contracts in this category', 'هنوز قراردادی نداری': 'No contracts yet', 'هر قراردادی که در چت ثبت و امضا کنی، خودکار اینجا بایگانی می‌شود.': 'Every contract you create and sign in chat is archived here automatically.',
      'در حال بارگذاری…': 'Loading…', 'این پروژه لغو شده است': 'This project was cancelled', 'پروژه پیدا نشد': 'Project not found',
      'عکس پروفایل': 'Profile photo', 'گرفتن عکس': 'Take photo', 'انتخاب از گالری': 'Choose from gallery', 'حذف عکس': 'Remove photo', 'عکس حذف شد': 'Photo removed',
      'عکس واضح از چهره، رو به نور. کارفرماها به پروفایل با عکس بیشتر اعتماد می‌کنند. شرکت‌ها: لوگو.': 'A clear face photo, facing the light. Employers trust profiles with photos more. Companies: logo.',
      'ویرایش عکس': 'Edit photo', 'ذخیره': 'Save', 'انصراف': 'Cancel', 'برش': 'Crop', 'نور و رنگ': 'Light', 'بزرگ‌نمایی': 'Zoom', 'صاف کردن': 'Straighten', 'روشنایی': 'Brightness', 'کنتراست': 'Contrast', 'برگرداندن به حالت اول': 'Reset',
      'عکس پروفایل ذخیره شد': 'Profile photo saved', 'عکس پروفایل عوض شد': 'Profile photo changed', 'روی عکس بزن: گرفتن عکس، انتخاب از گالری یا حذف': 'Tap the photo: take, choose from gallery or remove',
      'اطلاعات اصلی (نام، تابعیت، سال تولد، شمارهٔ نظام مهندسی، مشخصات ثبتی شرکت) بعد از ثبت‌نام قفل است؛ برای اصلاح به پشتیبانی پیام بده. بقیه را هر وقت خواستی عوض کن.': 'Core details (name, nationality, birth year, engineering membership, company registration) are locked after sign-up; contact support to correct them. Change everything else any time.',
      'مدیریت صفحهٔ خانه': 'Managing the home page', 'کارت پروژه، دکمه‌های سریع، آماده به کار': 'Project card, quick buttons, ready to work', 'ویرایش کارت بزرگ خانه': 'Editing the big home card', 'فهرست کار، تیک زدن، پیشرفت': 'Task list, ticking, progress',
      'ثبت قرارداد': 'Creating a contract', 'از چت تا امضای پیامکی و بایگانی': 'From chat to SMS signature and archive', 'خوش‌قولی و لغو قرارداد': 'Reliability & cancellation', 'اگر کسی سر کار نیامد چه می‌شود؟': 'What if someone does not show up?',
      'قیم چیست؟': 'What is a guarantor?', 'چه کسی قیم می‌شود و چه اثری دارد': 'Who can guarantee and what it does', 'پرداخت و صورت‌وضعیت': 'Payments & statements', 'ثبت پرداخت، تأیید دریافت، صورت‌وضعیت ساده': 'Record payments, confirm receipt, simple statements',
      'آماده به کار': 'Ready to work', 'دیده شدن در کاوش با یک کلید': 'Get seen in Explore with one switch', 'نیروی فوری': 'Urgent hire', 'نیرو برای همین امروز و فردا': 'Workers for today and tomorrow',
      'کارت بزرگ بالای خانه، پروژه‌های در جریان توست؛ هر پروژه یک برگ. با انگشت به چپ و راست بکش.': 'The big card on top of Home holds your running projects, one slide each. Swipe left and right.',
      'دکمه‌های گرد زیر کارت، کار روزانه را بدون رفتن به صفحهٔ پروژه انجام می‌دهند: تیک، گزارش، پرداخت، چت.': 'The round buttons under the card do daily work without opening the project: tick, report, pay, chat.',
      'کلید «آماده به کار» را روشن کن تا کارفرماها در کاوش پیدایت کنند.': 'Turn on “Ready to work” so employers find you in Explore.',
      'روی خود کارت بزن تا صفحهٔ کامل پروژه باز شود: قرارداد، پرداخت‌ها، گزارش‌ها، فایل‌ها.': 'Tap the card to open the full project: contract, payments, reports, files.',
      'دکمهٔ «☰ فهرست»: کارها را ردیف‌به‌ردیف بنویس (واحد ۱، واحد ۲ …)؛ هر ردیف یک تیک است.': '“☰ List”: write tasks line by line (Unit 1, Unit 2 …); each line is one tick.',
      'هر کار تمام شد، «✓ تیک» را بزن؛ نوار پیشرفت و درصد خودکار بالا می‌رود و کارفرما در چت خبردار می‌شود.': 'When a task is done, tap “✓ Tick”; the progress bar rises and the employer is told in chat.',
      'نوار پیشرفت و «مانده» همیشه به‌روز است؛ عدد قرمز یعنی از مدت قرارداد گذشته‌ای.': 'Progress and “left” are always up to date; red means you are past the contract length.',
      'برگ آخر کارت، کارت نقش توست (مثل تقاضاها)؛ چند پروژهٔ همزمان = چند برگ.': 'The last slide is your role card (like requests); several projects = several slides.',
      'در چت با طرف مقابل، دکمهٔ «ثبت قرارداد» را بزن.': 'In the chat with the other side, tap “Create contract”.',
      'کار، مبلغ، مدت و مراحل پرداخت را در ۳ گام پر کن؛ مبلغ با حروف هم نوشته می‌شود تا اشتباه نشود.': 'Fill in the job, amount, duration and payment steps in 3 steps; the amount is also written in words to avoid mistakes.',
      'هر دو با کد پیامکی امضا می‌کنید؛ متن قرارداد قفل و قابل چاپ است.': 'Both sign with an SMS code; the text is locked and printable.',
      'همهٔ قراردادها در «من ← قراردادهای من» بایگانی می‌شوند؛ با نسخهٔ چاپی و وضعیت امضای هر دو طرف.': 'All contracts are archived in “Me → My contracts”, with a printable copy and both signatures.',
      'طرف مقابل سر کار نیامد؟ در صفحهٔ پروژه «طرف مقابل بدقولی کرد؟» را بزن و بنویس چه شد.': 'Other side did not show up? On the project page tap “Other side broke their word?” and describe it.',
      'او ۲۴ ساعت فرصت دارد قبول یا اعتراض کند. اعتراض را مدیر بلوک بررسی می‌کند.': 'They have 24 hours to accept or object. A Blook admin reviews objections.',
      'اخطار ثبت شود: ۱۰ امتیاز کم تا ۱ ماه. ۳ اخطار در ۲ ماه: «آماده به کار» ۷ روز بسته. ۵ اخطار: تعلیق.': 'A recorded warning: −10 points for 1 month. 3 warnings in 2 months: “Ready to work” blocked 7 days. 5 warnings: suspension.',
      'لغو با توافق هر دو طرف اخطار ندارد؛ لغو یک‌طرفه برای لغوکننده اخطار دارد.': 'Mutual cancellation has no warning; one-sided cancellation gives the canceller a warning.',
      'قیم کسی است که خودش در بلوک خوش‌سابقه است و خوش‌قولی تو را تضمین می‌کند.': 'A guarantor has a good record in Blook and vouches that you keep your word.',
      'شرط قیم شدن: هویت تأییدشده، ۳ پروژهٔ تمام‌شده، اعتبار ۷۰ یا بیشتر، ۳۰ روز سابقه، بدون اخطار.': 'To be a guarantor: verified identity, 3 completed projects, trust 70+, 30 days in Blook, no warnings.',
      'قیم با کد پیامکی تأیید می‌کند؛ ۵ امتیاز به اعتبار تو اضافه می‌شود.': 'The guarantor confirms with an SMS code; you gain 5 trust points.',
      'اگر بدقولی کنی، قیمت هم ۵ امتیاز از دست می‌دهد؛ پس فقط کسی را ضمانت کن که واقعاً می‌شناسی.': 'If you break your word, your guarantor loses 5 points too; only vouch for people you really know.',
      'فقط کارفرما پرداخت را ثبت می‌کند (با رسید یا شمارهٔ پیگیری)؛ مجری دریافت را تأیید می‌کند.': 'Only the employer records payments (with receipt or tracking number); the provider confirms receipt.',
      'صورت‌وضعیت ساده: هر ردیف = کار + مبلغ + درصد انجام. جمع خودکار حساب می‌شود.': 'Simple statement: each row = task + amount + % done. The total is calculated automatically.',
      'بلوک واسطهٔ مالی نیست؛ پول مستقیم بین شما جابه‌جا می‌شود و بلوک فقط ثبت و تأیید را نگه می‌دارد.': 'Blook does not handle money; you pay each other directly and Blook keeps the record and confirmations.',
      'در خانه کلید «آماده به کار» را روشن کن؛ یک آگهی کوتاه با مهارت و دستمزدت ساخته می‌شود.': 'Turn on “Ready to work” on Home; a short ad with your skills and wage is created.',
      'کارفرماها در کاوش تو را با نشان سبز «آماده» می‌بینند و نیروی فوری هم به تو می‌رسد.': 'Employers see you in Explore with a green “Ready” badge, and urgent requests reach you.',
      'بعد از قرارداد خاموش می‌شود؛ کار که تمام شد، با یک لمس دوباره روشنش کن.': 'It turns off after a contract; when the job ends, turn it on again with one tap.',
      'کارفرما: دکمهٔ ⚡ نیروی فوری را بزن؛ کار، دستمزد روزانه و زمان شروع را بنویس.': 'Employer: tap ⚡ Urgent hire; enter the job, daily wage and start time.',
      'درخواست همزمان به همهٔ نیروهای «آماده به کار» استان می‌رسد؛ هم‌شهری‌ها اول.': 'The request reaches every “Ready to work” worker in the province at once; same city first.',
      'اولین نفری که قبول کند، کار مال اوست؛ گفت‌وگو، توافق و پروژه خودکار ساخته می‌شود.': 'The first to accept gets the job; chat, agreement and project are created automatically.',
      'به بلوک خوش آمدی': 'Welcome to Blook', 'کارگر، متخصص، مهندس، پیمانکار و کارفرما؛ همه در یک جا، در سراسر ایران.': 'Workers, specialists, engineers, contractors and employers, all in one place, across Iran.',
      'نزدیک تو': 'Near you', 'نزدیک من': 'Near me', 'استان {@} ×': 'Province {@} ×', 'برای همهٔ ایران ساخته شده و در همهٔ استان‌ها فعال است.': 'Built for all of Iran and active in every province.', 'ساخته‌شده در ایران · ۱۴۰۵': 'Made in Iran · 1405', 'نقشه نزدیک تو را نشان می‌دهد؛ {#} آگهی بیرون از این نقشه است': 'The map shows your area; {#} ads are outside it',
      'پیدا کن یا پیدا شو': 'Find or be found', 'در کاوش آگهی‌ها و نیروهای آماده به کار را ببین؛ یا خودت «آماده به کار» شو تا پیدایت کنند.': 'Browse ads and ready workers in Explore, or turn on “Ready to work” so others find you.',
      'قرارداد واقعی با امضای پیامکی': 'Real contracts with SMS signatures', 'توافق در چت، قرارداد با کد پیامکی، و پرداخت و پیشرفت کار همه ثبت می‌شود.': 'Agree in chat, sign with an SMS code, and payments and progress are all recorded.',
      'خوش‌قولی = اعتبار': 'Reliability = trust', 'هر کار تمام‌شده و هر ستاره اعتبارت را بالا می‌برد؛ بدقولی ۱۰ امتیاز کمش می‌کند.': 'Every finished job and every star raises your trust; breaking your word costs 10 points.',
      'هر جا این علامت را دیدی': 'Wherever you see this sign', 'روی آن بزن تا آموزش کوتاه همان بخش را با مثال واقعی ببینی.': 'Tap it for a short tutorial of that section with a real example.',
      'آموزش کوتاه هر بخش با مثال واقعی؛ هر جا علامت': 'A short tutorial for each section with a real example; wherever you see', 'را دیدی، آموزش همان بخش است.': ', it is that section’s tutorial.',
      '۵. قیم و خوش‌قولی:': '5. Guarantor & reliability:',
      'قیم معتبر ۵ امتیاز اضافه می‌کند. هر اخطار بدقولی ۱۰ امتیاز تا ۱ ماه کم می‌کند؛ اگر کسی که قیمش هستی بدقولی کند، تو ۵ امتیاز از دست می‌دهی.': 'A valid guarantor adds 5 points. Each bad-faith warning removes 10 points for 1 month; if someone you guarantee breaks their word, you lose 5 points.',
      'این بخش الان در صفحه نیست؛ اول پروژه یا آگهی بساز': 'This part is not on the page yet; create a project or ad first', 'نیروی فوری در حال': 'Urgent hire',
    });
    I18N.re = null;
  }
})();
