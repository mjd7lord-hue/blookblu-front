/* =====================================================================
 * i18n-extra.js — ترجمهٔ انگلیسی قسمت‌های دور ۲۸ تا ۳۲ (بعد از explore.js)
 *   ۱) فرهنگ لغت متن‌های تازه (کارت پروژه، آماده به کار، نیروی فوری، قرارداد ساده، صورت‌وضعیت، …)
 *   ۲) قاعدهٔ کلی برای متن‌های ترکیبی: «✓ اسکلت»، «پیمانکار ⇄»، «تقویم، حل اختلاف» و …
 *      متن از جداکننده‌ها و علامت‌ها تکه می‌شود، هر تکه جدا ترجمه و دوباره چسبانده می‌شود.
 * متن تازه‌ای که در اپ اضافه می‌شود: ترجمه‌اش را همین‌جا بگذار (کلید = متن فارسی؛ عدد = {#}، نام = {@}).
 * ===================================================================== */
(function () {
  if (typeof I18N !== 'object' || typeof tr !== 'function') return;
  Object.assign(I18N.dict, {
    // ---- خانه: کارت اصلی پروژه و فهرست پروژه‌ها ----
    'پروژهٔ در جریان': 'Project in progress',
    'پروژهٔ {#} از {#} در جریان': 'Project {#} of {#} in progress',
    'پروژه‌های در جریان': 'Projects in progress',
    'پروژه‌های دیگر': 'Other projects',
    'پروژهٔ قبلی': 'Previous project',
    'پروژهٔ بعدی': 'Next project',
    'ادامهٔ کار ‹': 'Continue ›', 'ادامهٔ کار ›': 'Continue ›',
    'پیشرفت': 'Progress', 'پیشرفت {#} درصد': 'Progress {#}%', 'پیشرفت کار': 'Work progress', 'پیشرفت کار {#} درصد': 'Work progress {#}%',
    'پیشرفت کار: {#} از {#}': 'Work progress: {#} of {#}', '{#} از {#}، {#}٪': '{#} of {#}, {#}%',
    'دریافت شده': 'Received', 'دریافت شده از {#} میلیون': 'Received of {#} million', 'دریافت از {#} میلیون': 'Received of {#} million',
    'دریافت از {#} میلیارد': 'Received of {#} billion', 'از مبلغ پرداخت شده': 'of the amount paid', 'منتظر تأیید دریافت': 'Awaiting receipt confirmation',
    'مانده': 'Left', 'مانده تا پایان': 'Days left', 'مدت قرارداد': 'Contract length', 'تأخیر': 'Delay',
    'منتظر شروع': 'Not started', 'در حال اجرا': 'In progress', 'شروع کار را بزنید': 'Tap “Start work”',
    'همهٔ کارها تیک خورد': 'All tasks ticked', 'آخرین فعالیت': 'Latest activity', 'در حال انجام': 'In progress',
    'بعدی': 'Next', 'کار در جریان': 'Work in progress',
    // ---- فهرست کار (پیشرفت) ----
    'فهرست کار': 'Task list', 'ویرایش فهرست کار': 'Edit task list', '+ ساخت فهرست کار': '+ Create task list',
    'فهرست فعلی (هر خط یک ردیف)': 'Current list (one item per line)', 'یا از الگو بساز': 'or build from a template', 'الگو': 'Template',
    'هر ردیف یک تیک است؛ با هر تیک، طرف مقابل پیشرفت را می‌بیند.': 'Each item is one tick; with every tick the other side sees the progress.',
    'هر بار کاری تمام شد تیکش را بزن؛ کارفرما در چت و اعلان‌ها می‌بیند.': 'Tick each task when it is done; the employer sees it in chat and notifications.',
    'مجری با تمام شدن هر ردیف تیک می‌زند.': 'The provider ticks each item when it is finished.',
    'پیشرفت کار را چطور نشان بدهیم؟': 'How should we show work progress?',
    'پیشرفت فقط با مرحلهٔ پروژه (توافق، در حال اجرا، تمام) نشان داده می‌شود.': 'Progress is shown only by project stage (agreed, in progress, done).',
    'تیک‌ها': 'Ticks', 'هر واحد یک تیک': 'One tick per unit', 'هر روز یک تیک': 'One tick per day', 'بدون فهرست': 'No list',
    'واحد': 'Unit', 'واحد {#}': 'Unit {#}', 'روز {#}': 'Day {#}', 'هفتهٔ {#}': 'Week {#}',
    'برق‌کاری': 'Electrical', 'لوله‌کشی': 'Plumbing', 'کاشی و سرامیک': 'Tiling', 'طراحی معماری': 'Architectural design', 'محاسبات سازه': 'Structural calculations',
    'نظارت': 'Supervision', 'ساخت و سفت‌کاری': 'Construction & shell', 'بازسازی': 'Renovation',
    'لوله‌گذاری و قوطی‌گذاری': 'Conduits & boxes', 'سیم‌کشی': 'Wiring', 'نصب کلید، پریز و تابلو': 'Switches, sockets & panel', 'تست و تحویل': 'Testing & handover',
    'لوله‌کشی آب و فاضلاب': 'Water & sewage piping', 'تست فشار': 'Pressure test', 'نصب شیرآلات و تحویل': 'Fixtures & handover',
    'زیرسازی': 'Base preparation', 'کاشی دیوار': 'Wall tiles', 'سرامیک کف': 'Floor tiles', 'بندکشی و تحویل': 'Grouting & handover',
    'برداشت و نقشهٔ وضع موجود': 'Survey & as-is drawing', 'طرح اولیه (پلان و نما)': 'Concept (plan & facade)', 'نقشه‌های نهایی': 'Final drawings', 'تحویل و تأیید': 'Delivery & approval',
    'بررسی نقشهٔ معماری': 'Review architectural plans', 'محاسبات و مدل': 'Calculations & model', 'نقشه‌های سازه': 'Structural drawings', 'کنترل و تحویل': 'Check & delivery',
    'فونداسیون': 'Foundation', 'اسکلت': 'Frame', 'سقف‌ها': 'Slabs', 'سفت‌کاری': 'Shell work', 'نازک‌کاری و پایان‌کار': 'Finishing & completion',
    'گودبرداری و فونداسیون': 'Excavation & foundation', 'دیوارچینی': 'Masonry walls', 'تحویل': 'Handover',
    'تخریب': 'Demolition', 'تأسیسات': 'Installations', 'کاشی و کف': 'Tiles & flooring', 'رنگ و تحویل': 'Painting & handover',
    // ---- آماده به کار ----
    'آماده به کار': 'Ready to work', 'روشن': 'On', 'خاموش': 'Off',
    'کارفرماها الان در کاوش تو را با نشان سبز می‌بینند.': 'Employers now see you in Explore with a green badge.',
    'خاموشی؛ در کاوش دیده نمی‌شوی. روشنش کن تا کار پیدا کنی.': 'You are off and hidden in Explore. Turn it on to find work.',
    'سر کاری؛ بعد از قرارداد خودکار خاموش شد. کار که تمام شد روشنش کن.': 'You are on a job; it switched off after the contract. Turn it on when the job ends.',
    'یک بار در یک صفحهٔ کوتاه بساز؛ بعد فقط این کلید را روشن و خاموش کن.': 'Create it once on one short page; then just switch it on and off.',
    'ساخت آگهی آمادگی ({#} دقیقه)': 'Create ready-to-work ad ({#} min)',
    'کارفرماها تو را این‌طور می‌بینند:': 'Employers see you like this:', 'وقتی روشن باشی این‌طور دیده می‌شوی:': 'When on, you appear like this:',
    'بازدید': 'views', 'درخواست': 'requests', 'روشن تا {#} روز دیگر': 'On for {#} more days',
    'ببین در کاوش ‹': 'See in Explore ›', 'ببین در کاوش ›': 'See in Explore ›', '✎ ویرایش': '✎ Edit', 'ویرایش ‹': 'Edit ›', 'ویرایش ›': 'Edit ›',
    'آگهی آمادگی': 'Ready-to-work ad', 'ویرایش آگهی آمادگی': 'Edit ready-to-work ad',
    'همین یک صفحه؛ بعد فقط کلید «آماده به کار» را روشن و خاموش کن.': 'Just this one page; then simply switch “Ready to work” on and off.',
    'چه کاری بلدی؟ (تا {#} تا)': 'What can you do? (up to {#})', 'دستمزد': 'Pay', 'روزانه': 'Daily', 'متری': 'Per meter', 'توافقی': 'Negotiable',
    'مثلاً {#} در روز': 'e.g. {#} per day', 'مثلاً {#} هر متر': 'e.g. {#} per meter', 'کجا کار می‌کنی؟': 'Where do you work?', 'شهر': 'City',
    'فقط شهر خودم': 'My city only', 'کل استان': 'Whole province', 'روزهای آزاد این هفته': 'Free days this week',
    'یک جملهٔ کوتاه (اختیاری)': 'A short sentence (optional)', 'مثلاً {#} سال سابقه، ابزار کامل دارم': 'e.g. {#} years of experience, full tools',
    'ساختن و روشن کردن': 'Create & switch on', 'ذخیرهٔ تغییرات': 'Save changes', 'حذف آگهی آمادگی': 'Delete ready-to-work ad',
    'حداقل یک مهارت انتخاب کن': 'Pick at least one skill', 'حداکثر {#} مهارت': 'At most {#} skills', 'مبلغ دستمزد را بنویس': 'Enter the pay amount',
    'ذخیره شد': 'Saved', 'ساخته شد و روشن است!': 'Created and switched on!', 'ساخته شد و روشن است! کارفرماها تو را در کاوش می‌بینند': 'Created and on! Employers can see you in Explore',
    'آگهی آمادگی حذف شد': 'Ready-to-work ad deleted', 'یک آگهی فعال دیگر داری': 'You have another active ad',
    'با آگهی رایگان فقط یک آگهی فعال می‌شود. آگهی قبلی را ببندم و آگهی آمادگی را بسازم؟ (بعداً از «آگهی‌های من» دوباره فعال می‌شود)': 'A free plan allows one active ad. Close the previous ad and create the ready-to-work ad? (You can reactivate it later from “My ads”)',
    'بله، قبلی بسته شود': 'Yes, close the previous one', 'نه': 'No',
    'خاموش شدی؛ در کاوش دیده نمی‌شوی': 'You are off and hidden in Explore', 'روشن شدی! کارفرماها الان تو را با نشان سبز می‌بینند': 'You are on! Employers now see you with a green badge',
    'این تویی؛ کارفرماها این‌طور می‌بینند': 'This is you — how employers see you', 'خاموش کن': 'Switch off',
    'نیرو همین الان آماده به کار است؛ روی هر کارت «چت» را بزن.': 'workers are ready to work right now; tap “Chat” on any card.',
    // ---- نیروی فوری ----
    'نیروی فوری': 'Urgent hire', '⚡ نیروی فوری': '⚡ Urgent hire', '⚡ درخواست نیروی فوری': '⚡ Request urgent hire', '⚡ درخواست تازه': '⚡ New request',
    'یک درخواست، به همهٔ نیروهای آماده نزدیک؛ اولین قبول برنده': 'One request to every ready worker nearby; first to accept wins',
    'درخواست فوری در جریان': 'Urgent request in progress', '{#} از {#} نفر پیدا شده، ببین': '{#} of {#} found — view',
    'به همهٔ نیروهای «آماده به کار» استانت می‌رسد؛ اولین کسی که قبول کند، کار مال اوست.': 'Goes to every “ready to work” worker in your province; the first to accept gets the job.',
    'چه کاری؟': 'What job?', 'مهارت لازم': 'Skill needed', 'چه کسی؟': 'Who?', 'هر دو': 'Both', 'چند نفر؟': 'How many people?', 'نفر': 'people',
    'کی؟': 'When?', 'همین الان': 'Right now', 'امروز عصر': 'This evening', 'فردا {#} صبح': 'Tomorrow {#} am', 'پس‌فردا': 'Day after tomorrow',
    'دستمزد روزانهٔ هر نفر (تومان)': 'Daily pay per person (tomans)', 'چند روز؟': 'How many days?', 'روز': 'days',
    'جمع کل': 'Total', 'در حال شمردن نیروهای آماده…': 'Counting ready workers…', '⚡ ارسال درخواست': '⚡ Send request',
    'بنویس چه کاری است': 'Write what the job is', 'دستمزد روزانه را بنویس': 'Enter the daily pay',
    '⚡ درخواست به {#} نیروی آماده رسید': '⚡ Request reached {#} ready workers',
    'الان نیروی آماده با این مهارت نیست؛ مهارت را بردار یا «هر دو» را بزن.': 'No ready worker with this skill right now; remove the skill or choose “Both”.',
    'در حال جست‌وجو': 'Searching', 'پیدا شد ✓': 'Found ✓', 'لغو شد': 'Cancelled', 'تمام شد': 'Ended',
    'دیدند': 'Saw it', 'قبول کردند': 'Accepted', 'منتظر جواب': 'Waiting', 'نیروهای تو': 'Your workers',
    'پروژه و قرارداد آماده است': 'Project and contract are ready', 'قبول کرد، قرارداد را امضا کنید': 'Accepted — sign the contract',
    'لغو درخواست': 'Cancel request', 'درخواست لغو شد': 'Request cancelled', 'درخواست‌های قبلی': 'Earlier requests',
    'هنوز درخواست فوری نداری.': 'You have no urgent requests yet.',
    'تا {#} ساعت دیگر باز است، {#} از {#} نفر پیدا شده': 'Open for {#} more hours, {#} of {#} found',
    '⚡ کار فوری': '⚡ Urgent job', '⚡ کار فوری برای تو': '⚡ Urgent job for you', 'اولین قبول برنده است': 'First to accept wins',
    'قبول می‌کنم': 'I accept', 'این کار دیگر باز نیست': 'This job is no longer open', 'رد شد': 'Declined',
    '⚡ کار مال تو شد! پروژه ساخته شد؛ قرارداد را امضا کن': '⚡ The job is yours! Project created — sign the contract',
    'دیر رسیدی؛ نفر دیگری زودتر قبول کرد': 'Too late — someone else accepted first',
    'اولین کسی که قبول کند برنده است، {#} ساعت و {#} دقیقه وقت': 'First to accept wins, {#} h {#} min left',
    'اولین کسی که قبول کند برنده است، {#} ساعت وقت': 'First to accept wins, {#} h left',
    'اول وارد شو': 'Log in first',
    // ---- قرارداد ----
    'ثبت قرارداد': 'Register contract', 'شرح کار و مبلغ': 'Work & amount', 'پرداخت و مدت': 'Payment & duration', 'بررسی و ارسال': 'Review & send',
    'مقدار کار (اختیاری)': 'Quantity (optional)', 'مبلغ کل قرارداد (تومان)': 'Total contract amount (tomans)', 'نرخ یا توضیح مبلغ (اختیاری)': 'Rate or amount note (optional)',
    'مثلاً {#} تومان هر تن': 'e.g. {#} tomans per ton', 'مثلاً حدود {#} تن یا {#} متر': 'e.g. about {#} tons or {#} m',
    'مبلغ کل': 'Total amount', 'مبلغ کل قرارداد را بنویس تا پول دریافتی و مانده درست حساب شود': 'Enter the total amount so received and remaining money are calculated correctly',
    'با {@} · اطلاعات از آگهی و گفت‌وگو پر شده؛ فقط بررسی و اصلاح کن.': 'With {@} · filled from the ad and chat; just review and edit.',
    'قرارداد ساده با {@}': 'Simple contract with {@}', 'چند سؤال کوتاه؛ جمع مبلغ خودکار حساب می‌شود.': 'A few short questions; the total is calculated automatically.',
    'دستمزد چطور حساب شود؟': 'How is pay calculated?', 'روزمزد': 'Daily wage', 'کل کار': 'Whole job',
    'دستمزد هر روز (تومان)': 'Pay per day (tomans)', 'دستمزد هر متر (تومان)': 'Pay per meter (tomans)', 'مبلغ کل کار (تومان)': 'Whole-job amount (tomans)',
    'چقدر طول می‌کشد؟': 'How long will it take?', 'کی شروع؟': 'When does it start?', 'پول کی پرداخت شود؟': 'When is it paid?',
    'پایان کار': 'End of job', 'نصف اول، نصف آخر': 'Half at start, half at end', 'آخر هر هفته': 'End of each week', 'شروع کار': 'Start of work',
    'جمع کل قرارداد': 'Contract total', 'مبلغ را بنویس': 'Enter the amount', 'هماهنگ می‌شود': 'To be arranged',
    'پول را بعد از هر پرداخت در «دفترچهٔ پرداخت» پروژه ثبت کنید و رسید بگیرید. اگر کسی خواست مبلغ را بیرون از بلوک عوض کند، قبول نکن.': 'Record every payment in the project’s payment log and get a receipt. If anyone wants to change the amount outside Blook, refuse.',
    'قرارداد فعال است': 'Contract is active', 'رفتن به پروژه': 'Go to project', 'امضای قرارداد': 'Sign contract',
    'قدم بعد: «شروع کار» را بزنید': 'Next step: tap “Start work”', 'قدم بعد: هر کاری تمام شد تیکش را بزن': 'Next step: tick each task when done',
    'قدم بعد: پرداخت‌ها را ثبت کن و پیشرفت را ببین': 'Next step: record payments and follow progress', 'پروژه تمام شده': 'Project finished',
    // ---- پرداخت ----
    'کارفرما ثبت می‌کند · تو تأیید می‌کنی': 'Employer records · you confirm',
    'پرداخت را کارفرما ثبت می‌کند؛ تو فقط دریافت را تأیید می‌کنی': 'The employer records payments; you only confirm receipt',
    'بلوک پول جابه‌جا نمی‌کند؛ پرداختت را با رسید ثبت کن تا بعد از تأیید طرف مقابل، در قرارداد مستند شود.': 'Blook does not move money; record your payment with a receipt so it is documented in the contract after the other side confirms.',
    'رسید واریز (اسکرین‌شات یا عکس)': 'Transfer receipt (screenshot or photo)', 'انتخاب رسید از گالری': 'Choose receipt from gallery',
    'شمارهٔ پیگیری یا مرجع (از پیامک بانک)': 'Tracking or reference number (from the bank SMS)',
    'هر رسید و هر شمارهٔ پیگیری فقط یک بار در بلوک قبول می‌شود و طرف مقابل باید رسیدن پول را تأیید کند؛ رسید جعلی یعنی مسدود شدن حساب.': 'Each receipt and tracking number is accepted only once in Blook, and the other side must confirm the money arrived; a fake receipt means the account is blocked.',
    // ---- صورت‌وضعیت ----
    'صورت‌وضعیت چطور کار می‌کند؟': 'How does a progress statement work?', 'راهنما': 'Guide',
    'کارها را با مبلغشان بنویس': 'Write the tasks with their amounts', 'مثلاً «سیم‌کشی واحد {#} — {#} میلیون». یا با یک دکمه از قرارداد بساز.': 'e.g. “Wiring unit {#} — {#} million”, or build it from the contract with one tap.',
    'بگو هر کار چند درصد تمام شده': 'Say what percent of each task is done', 'با دکمه‌های + و −. بخش طلایی نوار = کار همین دوره که پولش را می‌خواهی.': 'With the + and − buttons. The gold part of the bar = this period’s work you are claiming.',
    'بفرست': 'Send', 'کارفرما تأیید می‌کند و مبلغ را پرداخت و در دفترچه ثبت می‌کند؛ تو دریافت را تأیید می‌کنی.': 'The employer approves, pays and records it in the log; you confirm receipt.',
    'شروع با یک لمس': 'Start with one tap', 'از قرارداد': 'from the contract', 'یک ردیف: کل کار': 'One row: whole job',
    'به مبلغ {#} تومان؛ فقط بگو چند درصد تمام شده.': 'Amount {#} tomans; just say what percent is done.', 'فقط بگو چند درصد تمام شده.': 'Just say what percent is done.',
    'از فهرست کار ({#} ردیف)': 'From the task list ({#} rows)', 'آماده شد؛ درصدها را درست کن و بفرست': 'Ready — adjust the percentages and send',
    'کارها': 'Tasks', 'با + و − بگو چند درصد تمام شده': 'Use + and − to say what percent is done', 'انجام شده': 'done', 'قبلاً': 'previously',
    'این دوره': 'This period', '+ افزودن کار': '+ Add task', 'افزودن کار': 'Add task', 'هنوز کاری اضافه نشده.': 'No tasks added yet.', 'مجری هنوز کاری ثبت نکرده.': 'The provider has not added any tasks yet.',
    'فقط اسم کار، مبلغش و اینکه چقدرش تمام شده.': 'Just the task name, its amount and how much is done.', 'مبلغ این کار (تومان)': 'Amount for this task (tomans)',
    'تا امروز چند درصد تمام شده؟': 'What percent is done so far?', 'افزودن': 'Add', 'اسم کار را بنویس': 'Write the task name', 'مبلغ این کار را بنویس': 'Enter the amount for this task',
    'قابل پرداخت این صورت‌وضعیت': 'Payable for this statement', 'هنوز کاری برای این دوره ثبت نشده': 'Nothing recorded for this period yet', 'جزئیات و کسورات': 'Details & deductions',
    '«حسن انجام کار» بخشی است که کارفرما تا پایان کار نگه می‌دارد؛ «بیمه» سهم بیمهٔ کارگاه است.': '“Retention” is the part the employer holds until the job ends; “insurance” is the site insurance share.',
    'تأیید شد ✓ کارفرما پرداخت را ثبت می‌کند؛ بعد در «دفترچهٔ پرداخت» دریافت را تأیید کن.': 'Approved ✓ The employer records the payment; then confirm receipt in the “payment log”.',
    'پرداخت کردم؛ ثبت در دفترچهٔ پرداخت': 'I paid — record in the payment log',
    'مبلغ کل قرارداد ثبت نشده؛ کار را با «+ افزودن کار» اضافه کن': 'No total contract amount; add tasks with “+ Add task”', 'درصد': 'percent', 'مرحله': 'stage',
    // ---- صفحهٔ «من» و نقش‌ها ----
    'دسترسی سریع': 'Quick access', 'کار و پروژه': 'Work & projects', 'پروفایل و اعتبار': 'Profile & credibility', 'ابزارها و یادگیری': 'Tools & learning', 'حساب و تنظیمات': 'Account & settings',
    'ویرایش همهٔ اطلاعات پروفایل': 'Edit all profile information', 'نقش‌های من': 'My roles', 'نقش من': 'My role',
    'بزن تا آن نقش فعال شود؛ خانه، کاوش و پروژه‌ها با نقش فعال عوض می‌شوند.': 'Tap to activate that role; Home, Explore and Projects follow the active role.',
    'بزن تا فعال شود': 'Tap to activate', 'فعال کن': 'Activate', 'نقش فعال': 'Active role', 'فعال ✓': 'Active ✓',
    'درخواست تغییر نقش': 'Request role change', 'نقش هنگام ثبت‌نام انتخاب شده و ثابت است.': 'The role is chosen at sign-up and is fixed.',
    'اگر نقشت را اشتباه انتخاب کرده‌ای یا کارت عوض شده، پشتیبانی بررسی و تغییرش می‌دهد.': 'If you picked the wrong role or your work changed, support will review and change it.',
    'پروفایلت در کاوش دیده می‌شود': 'Your profile is visible in Explore', 'پروفایلت خصوصی شد': 'Your profile is now private',
    'شماره روی کارت نمایش داده می‌شود': 'Your number is shown on the card', 'شماره پنهان شد': 'Your number is hidden',
    // ---- کاوش، پیام‌ها و عمومی ----
    'تازه‌سازی': 'Refresh', 'به‌روز شد': 'Updated', 'به‌روز است': 'Up to date', 'بستن نقشه': 'Close map', 'نمایش نقشه': 'Show map', 'نقشه': 'Map',
    'فقط استان {@}': 'Only {@} province', '{#} آگهی اینجا': '{#} ads here', '{#} آگهی': '{#} ads',
    'استان {@} · این هفته': '{@} province · this week', 'استان {@} · متناسب با مهارت‌های تو': '{@} province · matching your skills', 'استان {@} · اگر بلدی، جواب بده': '{@} province · answer if you know',
    'اعتبار': 'Credibility', 'اعتبار {#} از {#}': 'Credibility {#} of {#}', 'امتیاز اعتبار از {#}': 'Credibility score of {#}', 'امتیاز اعتبار بلوک از {#}': 'Blook credibility score of {#}',
    'روزهای این هفته': 'This week’s days', 'شهر یا روستای دیگر…': 'Another city or village…', 'انتخاب شهر': 'Choose city',
    'یک گفت‌وگو را انتخاب کن': 'Select a conversation', 'فهرست گفت‌وگوها سمت راست است؛ همهٔ هماهنگی‌ها داخل بلوک، بدون شماره.': 'Conversations are listed on the side; all coordination stays inside Blook, no phone numbers.',
    'ذخیره‌ها': 'Saved', 'همکاری': 'Collaboration', 'تأیید و معرف': 'Approval & referral', 'پوسته': 'Theme', 'روشن / تیره': 'Light / dark',
    'سال تولد (اختیاری)': 'Birth year (optional)', 'سنت روی شناسنامهٔ کاری نمایش داده می‌شود': 'Your age is shown on your work record',
    'سرور بلوک در دسترس نیست؛ نسخهٔ نمایشی': 'Blook server is unavailable; demo version', 'بلوک — خانه': 'Blook — Home', 'بلوک کاوش و اعتبار': 'Blook explore & credibility',
    'ورود / ثبت‌نام': 'Log in / Sign up', 'ویرایش آگهی فعلی': 'Edit current ad', 'بستن آن': 'Close it',
    'یک آگهی فعال داری': 'You have an active ad', 'یک آگهی فعال داری. آن را ویرایش کن، ببند، یا برای آگهی بیشتر ارتقا بده.': 'You have an active ad. Edit it, close it, or upgrade for more ads.',
    'هزینهٔ تقریبی': 'Approximate cost', 'نیروی این پروژه را پیدا کن': 'Find workers for this project', 'نوع پروژه': 'Project type', 'نوع درخواست': 'Request type',
    'ساخت ساختمان': 'Building construction', 'بازسازی واحد مسکونی': 'Apartment renovation', 'بازسازی آشپزخانه': 'Kitchen renovation', 'بازسازی سرویس بهداشتی و حمام': 'Bathroom & toilet renovation',
    'کیسهٔ {#} کیلویی': '{#} kg bag', 'نمایش نتیجه‌ها': 'Show results', 'فهرست': 'List', 'وقتی آگهی تازه آمد خبرم کن': 'Notify me about new ads',
    'این برآورد با ضرایب میانگین بازار محاسبه شده و جای متره و برآورد مهندس را نمی‌گیرد. قیمت روز مصالح را از فروشنده بپرسید.': 'This estimate uses average market rates and does not replace an engineer’s quantity survey. Ask suppliers for current material prices.',
    'روی عدد هر استان بزن تا فقط آگهی‌های همان‌جا بیاید؛ با «همهٔ آگهی‌ها» برمی‌گردی.': 'Tap a province’s number to see only its ads; “All ads” brings everything back.',
    'درآمد تأییدشدهٔ این ماه': 'Confirmed income this month', 'مهارت‌های پرتقاضا': 'Most-demanded skills', 'تقاضا در استان {@} · {#} روز اخیر': 'Demand in {@} province · last {#} days',
    '{#} بازدید پروفایل در این ماه': '{#} profile views this month', 'داشت': 'had',
    '{#} روز آزاد؛ کارفرماها فقط روزهای سبز را برای درخواست می‌بینند.': '{#} free days; employers only see the green days for requests.',
    'جواب خوب، اعتبار می‌آورد': 'Good answers build credibility', 'پرسش‌هایی که شاید بلدی': 'Questions you might know', 'کار مناسب مهارت‌هایت': 'Jobs matching your skills',
    'حل‌کنندهٔ حضوری بلوک شو': 'Become a Blook on-site resolver', 'یک مهندس ناظر نزدیک پیدا کن و بازدید رزرو کن': 'Find a nearby supervising engineer and book a visit',
    'پیش از بتن‌ریزی: کنترل آرماتور را رزرو کن': 'Before pouring concrete: book a rebar check',
    '{#} درخواست منتظر توست': '{#} requests waiting for you', 'همکاری، بازدید، تأیید و امضای قرارداد در یک جا': 'Collaboration, visits, approvals and contract signing in one place',
    'تأیید به‌عنوان معرف: {@}': 'Approve as referrer: {@}', 'از {@} · نسبت: همکار {#} ساله': 'From {@} · relation: colleague of {#} years',
    'راهنمای قرارداد': 'Contract guide', 'قرارداد را چطور تنظیم کنم؟': 'How do I set up a contract?', 'مراحل تنظیم قرارداد': 'Contract steps',
    'قرارداد هر پروژه از توافق داخل چت ساخته و با کد پیامکی امضا می‌شود.': 'Each project’s contract is built from the agreement in chat and signed with an SMS code.',
    'در گفت‌وگوی آگهی یا پروفایل، دکمهٔ «پیشنهاد توافق» را بزن: کار، مقدار، مبلغ، روز شروع و مراحل پرداخت را بنویس.': 'In the ad or profile chat, tap “Propose agreement”: write the job, quantity, amount, start day and payment stages.',
    'طرف مقابل پیشنهاد را تأیید کند؛ پروژه خودکار در «پروژه‌های من» ساخته می‌شود.': 'The other side approves; the project is created automatically in “My projects”.',
    'در صفحهٔ پروژه، «قرارداد» را باز کن؛ متن قرارداد از همان توافق ساخته شده (با مادهٔ داوری).': 'On the project page, open “Contract”; its text is built from the agreement (with the arbitration clause).',
    'هر دو طرف با کد پیامکی امضا می‌کنند؛ قرارداد فعال و نسخهٔ چاپی آماده می‌شود. هر تغییر = نسخهٔ تازه و امضای دوباره.': 'Both sides sign with an SMS code; the contract becomes active and a printable copy is ready. Any change = new version and new signatures.',
    'قرارداد و داوری بلوک': 'Blook contract & arbitration', 'پرداخت امن': 'Secure payment', 'هویت و سابقهٔ واقعی': 'Real identity & record', 'بدون واسطه': 'No middlemen', 'مستقیم با نیرو و کارفرما': 'Directly between worker and employer',
    'شناسنامهٔ کاری تأییدشده': 'Verified work record', 'پرسش تخصصی می‌پرسم (رایگان و بی‌محدودیت)': 'I’ll ask an expert question (free and unlimited)',
    'این برآورد با قیمت‌های میانگین بازار (مهر {#}: میلگرد حدود {#} هزار تومان هر کیلو، سیمان پاکتی حدود {#} هزار تومان) محاسبه شده و جای متره و برآورد مهندس را نمی‌گیرد. قیمت روز مصالح را از فروشنده بپرسید.': 'This estimate uses average market prices (Mehr {#}: rebar about {#} thousand tomans per kg, bagged cement about {#} thousand tomans) and does not replace an engineer’s quantity survey. Ask suppliers for current prices.',
    'شروع کار': 'Start work', 'تیک کار بعدی': 'Tick next task', 'گزارش امروز': 'Today’s report', 'صورت‌وضعیت': 'Statement', 'ثبت پرداخت': 'Record payment', 'پایان کار': 'Finish job', 'چت': 'Chat', 'همهٔ جزئیات ‹': 'All details ›', 'همهٔ جزئیات ›': 'All details ›', 'همهٔ کارها تیک خورده': 'All tasks are ticked',
    'تغییر نقش به…': 'Change role to…', 'درخواست به مدیران بلوک می‌رود؛ بعد از تأیید، فرم نقش تازه را پر می‌کنی.': 'The request goes to Blook admins; once approved, you fill in the new role’s form.',
    'نقش فعلی هم بماند (هر دو نقش را دارم)': 'Keep my current role too (I have both roles)', 'توضیح کوتاه (اختیاری)': 'Short note (optional)', 'ارسال درخواست': 'Send request',
    'درخواست فرستاده شد؛ نتیجه با اعلان می‌آید': 'Request sent; the result comes as a notification', 'نتیجه با اعلان می‌آید.': 'The result will come as a notification.',
    'درخواست تغییر به «{@}» در حال بررسی': 'Request to change to “{@}” is under review', 'لغو درخواست': 'Cancel request', 'درخواست لغو شد': 'Request cancelled',
    'یک بار فرم همین نقش را پر کن؛ بعد از ثبت، نقش تازه فعال می‌شود.': 'Fill in this role’s form once; after that, the new role becomes active.', 'پیام مدیر': 'Admin’s message',
    'در حال وصل شدن به سرور… آخرین اطلاعات ذخیره‌شده را می‌بینی': 'Connecting to the server… you are seeing the last saved data', 'در حال وصل شدن به سرور بلوک…': 'Connecting to the Blook server…',
    'نقش تو': 'Your role', 'هر ستاره': 'per star', 'ثبت آگهی': 'Post ad',
    'شنبه': 'Saturday', 'یکشنبه': 'Sunday', 'دوشنبه': 'Monday', 'سه‌شنبه': 'Tuesday', 'چهارشنبه': 'Wednesday', 'پنجشنبه': 'Thursday', 'جمعه': 'Friday',
    'آزاد': 'Free', 'رزرو': 'Booked', 'تعطیل': 'Off', '٪': '%',
    '{#} تومان روزانه': '{#} tomans/day', '{#} تومان روزانه × {#} روز': '{#} tomans/day × {#} days', '{#} تومان هر متر': '{#} tomans per meter',
    '{#} تومان کل کار': '{#} tomans, whole job', '{#} میلیارد تومان': '{#} billion tomans', '{#} میلیون تومان': '{#} million tomans', '+{#} تومان': '+{#} tomans', '{#} روز': '{#} days',
    'اعتبار {#}': 'Credibility {#}', 'از {@}': 'From {@}', 'ناظر پروژهٔ {@}': 'Supervisor of the {@} project', 'تأیید به‌عنوان معرف': 'Approve as referrer',
    'طرفین می‌پذیرند هر اختلاف ابتدا با گفت‌وگو در چت بلوک ({#} ساعت) و در صورت حل نشدن، با': 'The parties agree that any dispute is first handled by conversation in Blook chat ({#} hours) and, if unresolved, by',
    'مثلاً بلوک‌چینی دیوار طبقهٔ دوم': 'e.g. second-floor wall blockwork', 'بلوک‌چینی دیوار طبقهٔ دوم': 'Second-floor wall blockwork', 'مثلاً بلوک‌چینی طبقهٔ دوم': 'e.g. second-floor blockwork',
    'مثلاً سیم‌کشی واحد {#}': 'e.g. wiring unit {#}', 'مثلاً شنبه {#} صبح': 'e.g. Saturday {#} am', 'مثلاً آرماتوربندی سقف دوم ویلای {@}': 'e.g. second-slab rebar, {@} villa',
  });
  // نام‌های نمونه و نقش‌ها در متن‌های ترکیبی
  Object.assign(I18N.names, { 'رمکان': 'Ramkan', 'مهندس سلیمانی': 'Eng. Soleimani', 'حسین صالحی': 'Hossein Salehi', 'آزمایش بلوک': 'Blook Test', 'شرکت آزمایشی بلوک': 'Blook Test Co.', 'ساحل‌سازان': 'Sahelsazan' });

  I18N.re = null; // فهرست نام‌ها دوباره ساخته شود (نام‌های تازهٔ بالا)

  /* ---- قاعدهٔ کلی برای متن ترکیبی ---- */
  const base = window.tr;
  const SEP = /( · |، |؛ | — |: | × | ‹ | › )/;
  const SEP_EN = { ' · ': ' · ', '، ': ', ', '؛ ': '; ', ' — ': ' — ', ': ': ': ', ' × ': ' × ', ' ‹ ': ' › ', ' › ': ' › ' };
  const fa = (s) => /[؀-ۿ]/.test(s);
  let depth = 0;
  window.tr = function (s) {
    const r = base(s);
    // متن خیلی بلند = محتوای <script>/<style> یا پاراگراف؛ تکه‌تکه نشود (هزینه و خطا)
    if (r !== s || !s || s.length > 240 || !fa(s) || depth > 3) return r;
    const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0], core = s.trim();
    depth++;
    try {
      // علامت اول/آخر: «✓ اسکلت»، «پیمانکار ⇄»، «همه ‹»
      // «۱. چه کاری؟» ← «1. What job?»
      let m = core.match(/^([0-9۰-۹]+\.\s+)([\s\S]+)$/);
      if (m) { const t = window.tr(m[2]); if (t !== m[2]) return lead + m[1].replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)) + t + trail; }
      m = core.match(/^([✓○⚡✎📍🗺•\-+]+\s*)([\s\S]+)$/);
      if (m) { const t = window.tr(m[2]); if (t !== m[2]) return lead + m[1] + t + trail; }
      m = core.match(/^([\s\S]+?)(\s*[✓⇄‹›×…!؟?:،]+)$/);
      if (m) { const t = window.tr(m[1]); if (t !== m[1]) return lead + t + m[2].replace('‹', '›').replace('؟', '?').replace('،', ',') + trail; }
      // تکه‌تکه با جداکننده‌ها؛ هر تکه جدا ترجمه
      const parts = core.split(SEP);
      if (parts.length > 1) {
        let changed = false;
        const out = parts.map((p) => { if (SEP_EN[p] !== undefined) return SEP_EN[p]; const t = window.tr(p); if (t !== p) changed = true; return t; }).join('');
        if (changed) return lead + out + trail;
      }
      return r;
    } finally { depth--; }
  };
})();
