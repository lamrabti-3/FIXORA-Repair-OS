(() => {
  'use strict';

  const APP = {
    name: 'FIXORA',
    version: '2.0.0',
    storage: 'fixora_state_v2',
    currency: 'MAD'
  };

  const NAV = [
    {id:'home', label:'الرئيسية', sub:'مركز التحكم', icon:'⌂'},
    {id:'jobs', label:'الإصلاحات', sub:'أوامر الصيانة', icon:'▣'},
    {id:'customers', label:'العملاء', sub:'ملفات العملاء', icon:'♙'},
    {id:'inventory', label:'المخزون', sub:'القطع والأسعار', icon:'▤'},
    {id:'finance', label:'المالية', sub:'الدخل والمصاريف', icon:'◫'},
    {id:'knowledge', label:'المعرفة', sub:'حلول وملاحظات', icon:'✦'},
    {id:'tools', label:'الأدوات', sub:'حاسبات وفحوصات', icon:'⌁'},
    {id:'settings', label:'الإعدادات', sub:'النسخ والهوية', icon:'⚙'}
  ];

  const JOB_STATUS = {
    received: {label:'مستلم', cls:'blue'},
    diagnosis: {label:'تشخيص', cls:'amber'},
    waiting: {label:'في انتظار قطعة', cls:'purple'},
    repair: {label:'قيد الإصلاح', cls:'red'},
    ready: {label:'جاهز', cls:'green'},
    delivered: {label:'تم التسليم', cls:'muted'},
    canceled: {label:'ملغى', cls:'muted'}
  };

  const PRIORITY = {low:'عادي', high:'مهم', urgent:'عاجل'};
  const CHECKS = [
    ['power','التشغيل والطاقة'],['charging','الشحن'],['display','الشاشة'],['touch','اللمس'],
    ['camera','الكاميرا'],['audio','السماعة والميكروفون'],['wifi','Wi‑Fi / Bluetooth'],['network','الشبكة / SIM'],
    ['buttons','الأزرار'],['biometric','البصمة / Face ID'],['sensors','الحساسات'],['software','النظام والبرمجيات']
  ];

  const state = loadState();
  let route = state.ui?.route || 'home';
  let searchTimer;

  const $ = id => document.getElementById(id);
  const qs = (s,r=document) => r.querySelector(s);
  const qsa = (s,r=document) => [...r.querySelectorAll(s)];

  function defaultState(){
    return {
      version: APP.version,
      profile:{shopName:'', technician:'', phone:'', address:'', bio:'', avatar:''},
      settings:{currency:'MAD', language:'ar', notifications:true, demo:false},
      ui:{route:'home'},
      jobs:[], customers:[], parts:[], transactions:[], notes:[], tasks:[], alerts:[], activity:[]
    };
  }

  function loadState(){
    try {
      const raw = localStorage.getItem(APP.storage);
      if(!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return merge(defaultState(), parsed);
    } catch(e) {
      console.warn('FIXORA state reset', e);
      return defaultState();
    }
  }

  function merge(base, incoming){
    Object.keys(incoming || {}).forEach(k => {
      if(base[k] && typeof base[k]==='object' && !Array.isArray(base[k]) && incoming[k] && typeof incoming[k]==='object' && !Array.isArray(incoming[k])) merge(base[k], incoming[k]);
      else base[k]=incoming[k];
    });
    return base;
  }

  function save(){
    state.version=APP.version;
    localStorage.setItem(APP.storage, JSON.stringify(state));
  }

  function uid(p='id'){return `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;}
  function now(){return new Date().toISOString();}
  function esc(v){return String(v ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function fmtDate(v){
    if(!v) return '—'; const d=new Date(v); if(Number.isNaN(d.getTime())) return String(v);
    return new Intl.DateTimeFormat(state.settings.language==='ar'?'ar-MA':'en', {day:'2-digit',month:'short',year:'numeric'}).format(d);
  }
  function fmtTime(v){
    const d=new Date(v); if(Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat(state.settings.language==='ar'?'ar-MA':'en',{hour:'2-digit',minute:'2-digit'}).format(d);
  }
  function money(v){
    const n=Number(v||0); return `${new Intl.NumberFormat(state.settings.language==='ar'?'ar-MA':'en-US',{maximumFractionDigits:2}).format(n)} ${state.settings.currency||APP.currency}`;
  }
  function sum(arr,key){return arr.reduce((a,x)=>a+Number(x[key]||0),0);}
  function initials(s){return (String(s||'F').trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('')||'F').toUpperCase();}
  function toast(msg,type='info'){
    const root=$('toast-root'), n=document.createElement('div'); n.className=`toast ${type}`; n.innerHTML=`<span class="toast-dot"></span><span>${esc(msg)}</span>`; root.appendChild(n); setTimeout(()=>n.remove(),3200);
  }
  function addActivity(kind,title,meta=''){
    state.activity.unshift({id:uid('act'),kind,title,meta,createdAt:now()}); state.activity=state.activity.slice(0,60);
  }

  function nav(){
    $('side-nav').innerHTML=NAV.map(n=>`<button class="nav ${route===n.id?'active':''}" data-nav="${n.id}"><span class="nav-ico">${n.icon}</span><span><b>${n.label}</b><small>${n.sub}</small></span></button>`).join('');
    const bottom=[NAV[0],NAV[1],NAV[3],NAV[4],NAV[7]];
    $('bottom-nav').innerHTML=bottom.map(n=>`<button class="bottom-item ${route===n.id?'active':''}" data-nav="${n.id}"><span>${n.icon}</span><small>${n.label}</small></button>`).join('');
    $('drawer').innerHTML=`<div class="drawer-head"><strong>FIXORA</strong><button class="icon-btn" data-action="close-drawer">×</button></div>${NAV.map(n=>`<button class="nav ${route===n.id?'active':''}" data-nav="${n.id}"><span class="nav-ico">${n.icon}</span><span><b>${n.label}</b><small>${n.sub}</small></span></button>`).join('')}`;
  }

  function shell(){
    nav();
    const first = state.profile.technician || 'فني';
    $('shop-name-side').textContent=state.profile.shopName || 'محل الصيانة';
    $('shop-mode-side').textContent=state.profile.shopName?'FIXORA Workspace':'وضع الفني';
    $('user-name-side').textContent=first;
    $('user-avatar-side').textContent=initials(first);
    $('shop-avatar').textContent=initials(state.profile.shopName || 'F');
    $('crumb').textContent=`FIXORA / ${route.toUpperCase()}`;
    $('page-title').textContent=(NAV.find(n=>n.id===route)||NAV[0]).label;
    render();
  }

  function render(){
    if(!state.profile.technician){ renderOnboarding(); return; }
    const fn={home:renderHome,jobs:renderJobs,customers:renderCustomers,inventory:renderInventory,finance:renderFinance,knowledge:renderKnowledge,tools:renderTools,settings:renderSettings}[route]||renderHome;
    $('view').innerHTML=fn();
    bindCheckUI();
  }

  function renderOnboarding(){
    $('crumb').textContent='FIXORA / SETUP'; $('page-title').textContent='تهيئة مساحة العمل';
    $('view').innerHTML=`<div class="setup-wrap"><div class="setup-card">
      <div class="brand-large"><img src="assets/icon.svg" alt="FIXORA"><div><strong>FIXORA</strong><span>Mobile Repair Business OS</span></div></div>
      <div class="eyebrow">READY TO WORK</div><h2>حوّل الفوضى إلى ورشة منظمة.</h2>
      <p>سجّل أول معلومات فقط. بعدها ستفتح أمامك أوامر الإصلاح، العملاء، القطع، الأرباح، والفحوصات في مكان واحد. البيانات تُحفظ محلياً على الجهاز.</p>
      <form id="setup-form" class="form-grid">
        <div class="field-wrap full"><label>اسم الفني</label><input class="field" name="technician" required placeholder="مثلاً: Said"></div>
        <div class="field-wrap"><label>اسم المحل</label><input class="field" name="shopName" placeholder="مثلاً: Lamrabti Mobile"></div>
        <div class="field-wrap"><label>هاتف المحل</label><input class="field" name="phone" inputmode="tel" placeholder="06…"></div>
        <div class="field-wrap"><label>المدينة / العنوان</label><input class="field" name="address" placeholder="Dakhla"></div>
        <div class="field-wrap"><label>العملة</label><select class="field" name="currency"><option value="MAD">MAD — الدرهم</option><option value="USD">USD</option><option value="EUR">EUR</option></select></div>
        <div class="full"><button class="btn primary wide">فتح FIXORA</button></div>
      </form>
      <button class="link-button" data-action="demo-setup">أرني نسخة تجريبية ببيانات وهمية</button>
    </div></div>`;
    const f=$('setup-form'); if(f) f.addEventListener('submit',e=>{e.preventDefault(); const fd=new FormData(f); state.profile.technician=String(fd.get('technician')||'').trim(); state.profile.shopName=String(fd.get('shopName')||'').trim(); state.profile.phone=String(fd.get('phone')||'').trim(); state.profile.address=String(fd.get('address')||'').trim(); state.settings.currency=String(fd.get('currency')||'MAD'); addActivity('profile','تم إعداد مساحة العمل'); save(); route='home'; state.ui.route='home'; shell(); toast('تم إنشاء مساحة FIXORA','success');});
  }

  function kpi(label,value,sub,icon,cls=''){
    return `<div class="kpi"><div><span class="kpi-label">${esc(label)}</span><strong class="kpi-value ${cls}">${esc(value)}</strong><small>${esc(sub)}</small></div><div class="kpi-ico">${icon}</div></div>`;
  }

  function statusPill(status){const s=JOB_STATUS[status]||JOB_STATUS.received; return `<span class="pill ${s.cls}">${s.label}</span>`;}
  function jobNo(){
    const n=state.jobs.length+1; const date=new Date(); return `FX-${date.getFullYear().toString().slice(-2)}${String(date.getMonth()+1).padStart(2,'0')}-${String(n).padStart(4,'0')}`;
  }

  function renderHome(){
    const active=state.jobs.filter(j=>!['delivered','canceled'].includes(j.status));
    const ready=state.jobs.filter(j=>j.status==='ready');
    const today=new Date().toISOString().slice(0,10);
    const todayIncome=state.transactions.filter(t=>t.type==='income' && String(t.date||'').slice(0,10)===today).reduce((a,t)=>a+Number(t.amount||0),0);
    const low=state.parts.filter(p=>Number(p.qty||0)<=Number(p.min||0));
    const pendingTasks=state.tasks.filter(t=>!t.done).sort((a,b)=>String(a.due||'9999').localeCompare(String(b.due||'9999'))).slice(0,5);
    const recent=state.jobs.slice(0,6);
    const flow=['received','diagnosis','waiting','repair','ready'];
    return `<div class="page-stack">
      <section class="hero">
        <div class="hero-copy"><span class="badge solid">FIXORA OS 2.0</span><h2>${esc(state.profile.shopName||'ورشة الصيانة')} <span>جاهزة للعمل.</span></h2><p>أدر الأجهزة من لحظة الاستلام حتى التسليم، مع تكلفة القطع، الربح، الفحص، العملاء والمخزون في مكان واحد.</p>
          <div class="hero-actions"><button class="btn primary" data-action="new-job">+ استقبال جهاز</button><button class="btn secondary" data-nav="inventory">مراجعة المخزون</button><button class="btn ghost" data-nav="tools">أدوات الفني</button></div>
        </div><div class="hero-orb"><div class="orb-ring"><span>${active.length}</span><small>أعمال نشطة</small></div></div>
      </section>
      <section class="grid four">${kpi('أعمال نشطة',active.length,`${ready.length} جاهزة للتسليم`,'▣')}${kpi('دخل اليوم',money(todayIncome),'مبيعات مسجلة اليوم','↗','good')}${kpi('قطع منخفضة',low.length,low.length?'تحتاج شراء':'المخزون مستقر', '▤', low.length?'warn':'good')}${kpi('العملاء',state.customers.length,'ملفات محفوظة محلياً','♙')}</section>

      <section class="grid main-grid">
        <div class="panel"><div class="panel-head"><div><h3>مسار الإصلاحات</h3><p>نظرة سريعة على حالة كل جهاز.</p></div><button class="text-btn" data-nav="jobs">عرض الكل ←</button></div>
          <div class="status-flow">${flow.map(s=>`<button class="flow-cell" data-nav="jobs" data-filter-status="${s}"><span>${JOB_STATUS[s].label}</span><strong>${state.jobs.filter(j=>j.status===s).length}</strong></button>`).join('')}</div>
          ${recent.length?`<div class="job-list">${recent.map(jobRow).join('')}</div>`:empty('لا توجد إصلاحات بعد','ابدأ بأول جهاز واستعمل رقم أمر الصيانة لتتبع العمل.','new-job')}
        </div>
        <div class="panel"><div class="panel-head"><div><h3>اليوم</h3><p>المهام والأشياء التي تستحق الانتباه.</p></div><button class="text-btn" data-nav="jobs">الإصلاحات</button></div>
          ${pendingTasks.length?`<div class="task-list">${pendingTasks.map(t=>`<label class="task"><input type="checkbox" data-task-id="${t.id}" ${t.done?'checked':''}><span><b>${esc(t.title)}</b><small>${t.due?fmtDate(t.due):'بدون موعد'}</small></span></label>`).join('')}</div>`:empty('لا توجد مهام معلقة','كل شيء منظم حالياً.','new-task')}
          <div class="divider"></div><h4 class="section-mini-title">تنبيهات المخزون</h4>${low.length?low.slice(0,4).map(p=>`<div class="stock-alert"><span>${esc(p.name)}</span><b>${Number(p.qty||0)} متبقي</b></div>`).join(''):('<div class="muted-box">المخزون فوق الحد الأدنى.</div>')}
        </div>
      </section>
      <section class="grid three"><div class="panel mini-action" data-action="new-job"><span class="action-ico">＋</span><div><b>استلام جهاز</b><small>رقم أمر تلقائي + فحص شامل</small></div></div><div class="panel mini-action" data-action="new-part"><span class="action-ico">▤</span><div><b>إضافة قطعة</b><small>مخزون، تكلفة، سعر، حد أدنى</small></div></div><div class="panel mini-action" data-action="new-note"><span class="action-ico">✦</span><div><b>حفظ حل</b><small>ابنِ قاعدة معرفة خاصة بك</small></div></div></section>
    </div>`;
  }

  function jobRow(j){
    const customer=state.customers.find(c=>c.id===j.customerId);
    const name=customer?.name || j.customerName || 'عميل غير مسجل';
    return `<button class="job-row" data-action="job-details" data-id="${j.id}"><div class="job-device"><span>${esc((j.brand||'').slice(0,1)||'F')}</span><div><b>${esc(j.brand||'هاتف')} ${esc(j.model||'')}</b><small>${esc(j.number||'')} · ${esc(name)}</small></div></div><div class="job-issue">${esc(j.issue||'بدون وصف')}</div><div>${statusPill(j.status)}</div><div class="job-money">${money(j.finalPrice||j.estimate||0)}</div><div class="job-date">${j.dueDate?fmtDate(j.dueDate):fmtDate(j.createdAt)}</div></button>`;
  }

  function renderJobs(){
    const jobFilter=state.ui?.jobFilter||{};
    const active=state.jobs.filter(j=>!['delivered','canceled'].includes(j.status)).length;
    return `<div class="page-stack"><div class="page-head"><div><span class="eyebrow">REPAIR DESK</span><h2>أوامر الإصلاح</h2><p>استقبال، تشخيص، إصلاح، تسليم — بدون دفاتر متناثرة.</p></div><button class="btn primary" data-action="new-job">+ أمر إصلاح</button></div>
      <div class="grid four">${kpi('كل الأوامر',state.jobs.length,'سجل كامل','▣')}${kpi('نشطة',active,'غير مسلّمة','◌')}${kpi('جاهزة',state.jobs.filter(j=>j.status==='ready').length,'للتسليم','✓','good')}${kpi('ربح متوقع',money(state.jobs.reduce((a,j)=>a+Number(j.finalPrice||j.estimate||0)-Number(j.partsCost||0),0)),'كل الأوامر','↗')}</div>
      <div class="panel"><div class="toolbar"><input id="job-search" class="field" placeholder="ابحث بالرقم، العميل، IMEI، الموديل أو العطل…"><select id="job-status" class="field compact"><option value="">كل الحالات</option>${Object.entries(JOB_STATUS).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}</select><select id="job-priority" class="field compact"><option value="">كل الأولويات</option>${Object.entries(PRIORITY).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></div><div class="table-head job-grid"><span>الجهاز / العميل</span><span>العطل</span><span>الحالة</span><span>القيمة</span><span>التاريخ</span></div><div id="job-list">${(() => { const q=String(jobFilter.q||'').toLowerCase(); const list=state.jobs.filter(j=>{const c=state.customers.find(x=>x.id===j.customerId); const hay=[j.number,j.customerName,c?.name,j.customerPhone,c?.phone,j.imei,j.deviceId,j.brand,j.model,j.issue].join(' ').toLowerCase(); return (!q||hay.includes(q))&&(!jobFilter.status||j.status===jobFilter.status)&&(!jobFilter.priority||j.priority===jobFilter.priority);}); return list.length?list.map(jobRow).join(''):empty('لا توجد نتائج','غيّر البحث أو الفلاتر.','new-job'); })()}</div></div>
    </div>`;
  }

  function renderCustomers(){
    return `<div class="page-stack"><div class="page-head"><div><span class="eyebrow">CUSTOMERS</span><h2>العملاء</h2><p>ملف بسيط لكل عميل مع تاريخ أجهزته.</p></div><button class="btn primary" data-action="new-customer">+ عميل</button></div>
      <div class="panel"><div class="toolbar"><input id="customer-search" class="field" placeholder="ابحث عن الاسم أو الهاتف…"></div><div id="customer-grid" class="customer-grid">${customerCards(state.customers)}</div></div>
    </div>`;
  }
  function customerCards(list){
    if(!list.length) return empty('لا توجد ملفات عملاء','أضف العملاء لتظهر لك أجهزتهم وتاريخ الإصلاح.', 'new-customer');
    return list.map(c=>{const jobs=state.jobs.filter(j=>j.customerId===c.id); const total=jobs.reduce((a,j)=>a+Number(j.finalPrice||0),0); return `<article class="customer-card"><div class="customer-top"><span class="avatar big">${esc(initials(c.name))}</span><div><h3>${esc(c.name)}</h3><p>${esc(c.phone||'بدون هاتف')}</p></div></div><div class="customer-meta"><span>${jobs.length} أجهزة</span><b>${money(total)}</b></div><div class="card-actions"><button class="text-btn" data-action="customer-details" data-id="${c.id}">فتح</button><button class="text-btn" data-action="edit-customer" data-id="${c.id}">تعديل</button><button class="text-btn danger" data-action="delete-customer" data-id="${c.id}">حذف</button></div></article>`;}).join('');
  }

  function renderInventory(){
    const low=state.parts.filter(p=>Number(p.qty||0)<=Number(p.min||0));
    const value=state.parts.reduce((a,p)=>a+Number(p.qty||0)*Number(p.buy||0),0);
    return `<div class="page-stack"><div class="page-head"><div><span class="eyebrow">PARTS & STOCK</span><h2>المخزون</h2><p>اعرف القطعة التي تنقص قبل أن تتعطل عملية الإصلاح.</p></div><button class="btn primary" data-action="new-part">+ قطعة</button></div>
      <div class="grid four">${kpi('القطع',state.parts.length,'أصناف','▤')}${kpi('قيمة الشراء',money(value),'المخزون الحالي','◫')}${kpi('منخفضة',low.length,'تحت الحد الأدنى','!',low.length?'warn':'good')}${kpi('وحدات',sum(state.parts,'qty'),'كل الأصناف','+')}</div>
      <div class="panel"><div class="toolbar"><input id="part-search" class="field" placeholder="بحث بالقطعة، SKU، التوافق أو المورد…"><select id="part-stock" class="field compact"><option value="">كل المخزون</option><option value="low">منخفض</option><option value="ok">متوفر</option></select></div><div id="parts-table">${partsTable(state.parts)}</div></div>
    </div>`;
  }
  function partsTable(list){
    if(!list.length) return empty('لا توجد قطع','أضف أول قطعة إلى مخزونك.','new-part');
    return `<div class="table-head part-grid"><span>القطعة</span><span>SKU / التوافق</span><span>الكمية</span><span>شراء</span><span>بيع</span><span></span></div>${list.map(p=>`<div class="part-row"><div><b>${esc(p.name)}</b><small>${esc(p.category||'')}</small></div><div><b>${esc(p.sku||'—')}</b><small>${esc(p.compatible||'عام')}</small></div><div><span class="stock-number ${Number(p.qty)<=Number(p.min)?'low':''}">${Number(p.qty||0)}</span><small>حد أدنى ${Number(p.min||0)}</small></div><div>${money(p.buy)}</div><div>${money(p.sell)}</div><div><button class="text-btn" data-action="stock-adjust" data-id="${p.id}">±</button><button class="text-btn" data-action="edit-part" data-id="${p.id}">تعديل</button><button class="text-btn danger" data-action="delete-part" data-id="${p.id}">حذف</button></div></div>`).join('')}`;
  }

  function renderFinance(){
    const income=sum(state.transactions.filter(t=>t.type==='income'),'amount');
    const expense=sum(state.transactions.filter(t=>t.type==='expense'),'amount');
    const profit=income-expense;
    const monthKeys=[]; const d0=new Date();
    for(let i=5;i>=0;i--){const d=new Date(d0.getFullYear(),d0.getMonth()-i,1); monthKeys.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);}
    const vals=monthKeys.map(k=>state.transactions.filter(t=>String(t.date||'').slice(0,7)===k&&t.type==='income').reduce((a,t)=>a+Number(t.amount||0),0));
    const max=Math.max(...vals,1);
    return `<div class="page-stack"><div class="page-head"><div><span class="eyebrow">CASHBOOK</span><h2>المالية</h2><p>افصل دخل الإصلاحات عن المصاريف واعرف ربحك الحقيقي.</p></div><button class="btn primary" data-action="new-transaction">+ عملية</button></div>
      <div class="grid four">${kpi('الدخل',money(income),'كل الوقت','↗','good')}${kpi('المصاريف',money(expense),'كل الوقت','↘','warn')}${kpi('الصافي',money(profit),'دخل - مصاريف',profit>=0?'✓':'! ',profit>=0?'good':'bad')}${kpi('عمليات',state.transactions.length,'السجل المالي','◫')}</div>
      <div class="grid two"><div class="panel"><div class="panel-head"><div><h3>الدخل آخر 6 أشهر</h3><p>مخطط بسيط من سجلك المحلي.</p></div></div><div class="bars">${vals.map((v,i)=>`<div class="bar-col"><div class="bar-value">${v?money(v):''}</div><div class="bar" style="height:${Math.max(4,Math.round(v/max*100))}%"></div><small>${fmtMonth(monthKeys[i])}</small></div>`).join('')}</div></div>
      <div class="panel"><div class="panel-head"><div><h3>ملخص اليوم</h3><p>الأعمال المالية المسجلة اليوم.</p></div></div>${financeSummary()}</div></div>
      <div class="panel"><div class="panel-head"><div><h3>سجل العمليات</h3><p>يمكنك تعديل أو حذف أي عملية.</p></div></div><div class="table-head finance-grid"><span>الوصف</span><span>النوع</span><span>المبلغ</span><span>التاريخ</span><span></span></div>${state.transactions.length?state.transactions.slice(0,80).map(t=>`<div class="txn-row"><div><b>${esc(t.note||t.category||'عملية')}</b><small>${esc(t.jobId?'أمر '+t.jobId:'')}</small></div><span class="pill ${t.type==='income'?'green':'amber'}">${t.type==='income'?'دخل':'مصروف'}</span><strong class="${t.type==='income'?'good':'bad'}">${t.type==='income'?'+':'-'}${money(t.amount)}</strong><span>${fmtDate(t.date)}</span><div><button class="text-btn" data-action="edit-transaction" data-id="${t.id}">تعديل</button><button class="text-btn danger" data-action="delete-transaction" data-id="${t.id}">حذف</button></div></div>`).join(''):empty('لا توجد عمليات','ابدأ بتسجيل أول دخل أو مصروف.','new-transaction')}</div>
    </div>`;
  }
  function fmtMonth(k){const d=new Date(`${k}-01T00:00:00`);return new Intl.DateTimeFormat(state.settings.language==='ar'?'ar-MA':'en',{month:'short'}).format(d);}
  function financeSummary(){const today=new Date().toISOString().slice(0,10);const a=state.transactions.filter(t=>String(t.date||'').slice(0,10)===today);const inc=sum(a.filter(t=>t.type==='income'),'amount');const exp=sum(a.filter(t=>t.type==='expense'),'amount');return `<div class="summary-stack"><div><span>دخل اليوم</span><b class="good">${money(inc)}</b></div><div><span>مصاريف اليوم</span><b class="bad">${money(exp)}</b></div><div><span>صافي اليوم</span><b>${money(inc-exp)}</b></div></div>`;}

  function renderKnowledge(){return `<div class="page-stack"><div class="page-head"><div><span class="eyebrow">KNOWLEDGE BASE</span><h2>قاعدة المعرفة</h2><p>سجل الأعطال والحلول والأوامر التي لا تريد نسيانها.</p></div><button class="btn primary" data-action="new-note">+ ملاحظة</button></div><div class="panel"><div class="toolbar"><input id="note-search" class="field" placeholder="ابحث في الحلول والـTags…"><select id="note-cat" class="field compact"><option value="">كل التصنيفات</option><option>Phone Repair</option><option>Electronics</option><option>Software</option><option>Networking</option><option>AI</option><option>Other</option></select></div><div id="notes-grid" class="note-grid">${noteCards(state.notes)}</div></div></div>`;}
  function noteCards(list){if(!list.length)return empty('لا توجد ملاحظات','احفظ أول تشخيص أو حل مهم.','new-note');return list.map(n=>`<article class="note-card"><div class="note-top"><span class="note-icon">✦</span><div><span class="tiny-tag">${esc(n.category||'Other')}</span><h3>${esc(n.title)}</h3></div></div><p>${esc(n.body||'')}</p><div class="tags">${(n.tags||[]).slice(0,5).map(t=>`<span>${esc(t)}</span>`).join('')}</div><div class="card-actions"><small>${fmtDate(n.updatedAt||n.createdAt)}</small><span><button class="text-btn" data-action="edit-note" data-id="${n.id}">تعديل</button><button class="text-btn danger" data-action="delete-note" data-id="${n.id}">حذف</button></span></div></article>`).join('');}

  function renderTools(){
    return `<div class="page-stack"><div class="page-head"><div><span class="eyebrow">TECHNICIAN TOOLS</span><h2>أدوات الفني</h2><p>حاسبات صغيرة لتسعير الخدمة، الربح، وهامش القطعة.</p></div></div>
      <div class="grid two"><div class="panel tool-card"><div class="tool-head"><span class="tool-icon">↗</span><div><h3>حاسبة ربح الإصلاح</h3><p>أدخل تكلفة القطع وسعر الخدمة.</p></div></div><div class="form-grid"><div class="field-wrap"><label>تكلفة القطع</label><input id="calc-parts" class="field" type="number" min="0" value="50"></div><div class="field-wrap"><label>سعر الإصلاح</label><input id="calc-price" class="field" type="number" min="0" value="150"></div></div><div class="calc-result"><span>الربح</span><strong id="calc-profit">${money(100)}</strong></div></div>
      <div class="panel tool-card"><div class="tool-head"><span class="tool-icon">%</span><div><h3>حاسبة هامش البيع</h3><p>فرق سعر الشراء والبيع كنسبة.</p></div></div><div class="form-grid"><div class="field-wrap"><label>سعر الشراء</label><input id="calc-buy" class="field" type="number" min="0" value="100"></div><div class="field-wrap"><label>سعر البيع</label><input id="calc-sell" class="field" type="number" min="0" value="160"></div></div><div class="calc-result"><span>الهامش</span><strong id="calc-margin">37.5%</strong></div></div></div>
      <div class="panel"><div class="panel-head"><div><h3>فحص استلام سريع</h3><p>استخدم هذه القائمة مع كل جهاز قبل فتحه.</p></div><button class="btn secondary" data-action="new-job">فتح أمر إصلاح</button></div><div class="bench-checks">${CHECKS.map(([id,label])=>`<label class="bench-check"><input type="checkbox"><span>${esc(label)}</span></label>`).join('')}</div></div>
    </div>`;
  }

  function renderSettings(){
    return `<div class="page-stack"><div class="page-head"><div><span class="eyebrow">SYSTEM</span><h2>الإعدادات</h2><p>هوية الورشة، اللغة، العملة والنسخ الاحتياطي.</p></div><span class="version-badge">v${APP.version}</span></div>
      <div class="grid two"><div class="panel"><div class="panel-head"><div><h3>هوية الورشة</h3><p>هذه المعلومات تظهر في مساحة العمل والتذاكر المطبوعة.</p></div></div><form id="profile-form" class="form-grid">${f('technician','اسم الفني',state.profile.technician)}${f('shopName','اسم المحل',state.profile.shopName)}${f('phone','هاتف',state.profile.phone,'tel')}${f('address','العنوان',state.profile.address)}${ta('bio','نبذة',state.profile.bio)}<div class="full"><button class="btn primary">حفظ الهوية</button></div></form></div>
      <div class="panel"><div class="panel-head"><div><h3>تفضيلات النظام</h3><p>تُحفظ على هذا الجهاز.</p></div></div><div class="settings-list"><div class="setting"><div><b>العملة</b><small>تُستخدم في كل الحسابات.</small></div><select id="setting-currency" class="field compact"><option ${state.settings.currency==='MAD'?'selected':''}>MAD</option><option ${state.settings.currency==='USD'?'selected':''}>USD</option><option ${state.settings.currency==='EUR'?'selected':''}>EUR</option></select></div><div class="setting"><div><b>الإشعارات</b><small>تنبيهات محلية داخل التطبيق.</small></div><label class="switch"><input id="setting-notifications" type="checkbox" ${state.settings.notifications?'checked':''}><span></span></label></div></div></div></div>
      <div class="grid three"><div class="panel settings-action" data-action="export"><span>↓</span><div><b>تصدير النسخة الاحتياطية</b><small>ملف JSON يحتوي بياناتك.</small></div></div><div class="panel settings-action" data-action="import"><span>↑</span><div><b>استيراد نسخة</b><small>استرجاع البيانات على جهاز آخر.</small></div></div><div class="panel settings-action danger-action" data-action="reset"><span>!</span><div><b>مسح بيانات FIXORA</b><small>حذف البيانات المحلية فقط.</small></div></div></div>
      <div class="privacy-box"><b>الخصوصية</b><p>FIXORA في هذه النسخة لا يرسل سجلات الإصلاح أو العملاء أو المالية إلى خادم. البيانات المحلية تبقى داخل متصفح/بيئة التطبيق. تجنب حفظ كلمات مرور الأجهزة أو رموز فتحها داخل التطبيق.</p><a href="privacy-policy.html" target="_blank">فتح سياسة الخصوصية</a></div>
      <input id="backup-input" type="file" accept="application/json" hidden>
    </div>`;
  }

  const f=(name,label,value='',type='text')=>`<div class="field-wrap"><label>${esc(label)}</label><input class="field" name="${name}" type="${type}" value="${esc(value)}"></div>`;
  const ta=(name,label,value='')=>`<div class="field-wrap full"><label>${esc(label)}</label><textarea class="field textarea" name="${name}">${esc(value)}</textarea></div>`;
  function empty(title,body,action){return `<div class="empty"><span class="empty-icon">◌</span><b>${esc(title)}</b><p>${esc(body)}</p>${action?`<button class="btn secondary" data-action="${action}">ابدأ</button>`:''}</div>`;}

  function openModal(title,body,saveAction=''){
    $('modal-root').innerHTML=`<div class="modal-back" data-action="close-modal"><section class="modal" role="dialog" aria-modal="true"><header><h3>${esc(title)}</h3><button class="icon-btn" data-action="close-modal">×</button></header><div class="modal-body">${body}</div>${saveAction?`<footer><button class="btn primary" data-action="${saveAction}">حفظ</button><button class="btn secondary" data-action="close-modal">إلغاء</button></footer>`:''}</section></div>`;
    document.body.classList.add('locked');
  }
  function closeModal(){ $('modal-root').innerHTML=''; document.body.classList.remove('locked'); }

  function newJob(existing=null){
    const x=existing||{}; const id=x.id||'';
    const check=x.checklist||{};
    const checks=CHECKS.map(([k,l])=>`<label class="check-row"><input type="checkbox" name="check_${k}" ${check[k]?'checked':''}><span>${l}</span></label>`).join('');
    const customers=state.customers.map(c=>`<option value="${c.id}" ${x.customerId===c.id?'selected':''}>${esc(c.name)}${c.phone?' — '+esc(c.phone):''}</option>`).join('');
    openModal(id?'تعديل أمر الإصلاح':'استقبال جهاز جديد',`<form id="job-form" data-id="${id}" class="form-grid">
      <div class="info-strip full"><b>${esc(x.number||jobNo())}</b><span>سيتم حفظ رقم الأمر تلقائياً</span></div>
      <div class="field-wrap"><label>العميل</label><select class="field" name="customerId"><option value="">عميل جديد / غير مسجل</option>${customers}</select></div>
      <div class="field-wrap"><label>اسم العميل</label><input class="field" name="customerName" value="${esc(x.customerName||'')}" placeholder="عند عدم اختيار ملف"></div>
      <div class="field-wrap"><label>هاتف العميل</label><input class="field" name="customerPhone" inputmode="tel" value="${esc(x.customerPhone||'')}"></div>
      <div class="field-wrap"><label>الأولوية</label><select class="field" name="priority">${Object.entries(PRIORITY).map(([k,v])=>`<option value="${k}" ${x.priority===k?'selected':''}>${v}</option>`).join('')}</select></div>
      <div class="field-wrap"><label>العلامة التجارية</label><input class="field" name="brand" required value="${esc(x.brand||'')}" placeholder="Samsung / iPhone…"></div>
      <div class="field-wrap"><label>الموديل</label><input class="field" name="model" required value="${esc(x.model||'')}" placeholder="Galaxy A54…"></div>
      <div class="field-wrap"><label>IMEI / Serial (اختياري)</label><input class="field" name="deviceId" value="${esc(x.deviceId||'')}" inputmode="numeric"></div>
      <div class="field-wrap"><label>النظام</label><select class="field" name="os"><option ${x.os==='Android'?'selected':''}>Android</option><option ${x.os==='iOS'?'selected':''}>iOS</option><option ${x.os==='Other'?'selected':''}>Other</option></select></div>
      <div class="field-wrap full"><label>العطل الرئيسي</label><input class="field" name="issue" required value="${esc(x.issue||'')}" placeholder="مثلاً: لا يشحن / الشاشة سوداء"></div>
      <div class="field-wrap full"><label>أعراض الجهاز عند الاستلام</label><textarea class="field textarea" name="symptoms" placeholder="ما الذي لاحظته قبل التشخيص؟">${esc(x.symptoms||'')}</textarea></div>
      <div class="field-wrap"><label>الحالة</label><select class="field" name="status">${Object.entries(JOB_STATUS).map(([k,v])=>`<option value="${k}" ${x.status===k?'selected':''}>${v.label}</option>`).join('')}</select></div>
      <div class="field-wrap"><label>موعد التسليم المتوقع</label><input class="field" name="dueDate" type="date" value="${esc((x.dueDate||'').slice(0,10))}"></div>
      <div class="field-wrap"><label>التكلفة المتوقعة للقطع</label><input class="field" name="partsCost" type="number" min="0" step="0.01" value="${Number(x.partsCost||0)}"></div>
      <div class="field-wrap"><label>سعر الخدمة / النهائي</label><input class="field" name="finalPrice" type="number" min="0" step="0.01" value="${Number(x.finalPrice||0)}"></div>
      <div class="field-wrap full"><label>التشخيص</label><textarea class="field textarea" name="diagnosis">${esc(x.diagnosis||'')}</textarea></div>
      <div class="field-wrap full"><label>الحل / ما تم تغييره</label><textarea class="field textarea" name="solution">${esc(x.solution||'')}</textarea></div>
      <div class="field-wrap full"><label>ملاحظات داخلية</label><textarea class="field textarea" name="notes">${esc(x.notes||'')}</textarea></div>
      <div class="full"><div class="form-section-title">فحص الاستلام 12 نقطة</div><div class="checks-grid">${checks}</div></div>
    </form>`, 'save-job');
  }

  function saveJob(){
    const form=$('job-form'); if(!form||!form.reportValidity())return;
    const id=form.dataset.id; const fd=new FormData(form); const data=Object.fromEntries(fd.entries());
    data.partsCost=Number(data.partsCost||0); data.finalPrice=Number(data.finalPrice||0); data.checklist={}; CHECKS.forEach(([k])=>{data.checklist[k]=fd.get(`check_${k}`)==='on';});
    if(data.customerId){const c=state.customers.find(x=>x.id===data.customerId); if(c){data.customerName=c.name;data.customerPhone=c.phone||data.customerPhone;}}
    else if(String(data.customerName||'').trim()){const c={id:uid('cus'),name:String(data.customerName).trim(),phone:String(data.customerPhone||'').trim(),email:'',notes:'أُضيف تلقائياً من أمر إصلاح',createdAt:now(),updatedAt:now()};state.customers.unshift(c);data.customerId=c.id;data.customerName=c.name;data.customerPhone=c.phone;}
    let job;
    if(id){job=state.jobs.find(j=>j.id===id); if(job)Object.assign(job,data,{updatedAt:now()});}
    else {job={...data,id:uid('job'),number:jobNo(),createdAt:now(),updatedAt:now(),history:[{at:now(),status:data.status||'received',note:'تم إنشاء أمر الإصلاح'}]}; state.jobs.unshift(job);}
    if(!job)return;
    addActivity('job',`${job.number} · ${job.brand} ${job.model}`,id?'تم التعديل':'تم إنشاء أمر'); save(); closeModal(); render(); toast(id?'تم تحديث الأمر':'تم إنشاء أمر الإصلاح','success');
  }

  function jobDetails(id){
    const j=state.jobs.find(x=>x.id===id);if(!j)return;const profit=Number(j.finalPrice||0)-Number(j.partsCost||0);const customer=state.customers.find(c=>c.id===j.customerId);
    const checks=CHECKS.map(([k,l])=>`<label class="check-row"><input type="checkbox" data-detail-check="${k}" ${j.checklist?.[k]?'checked':''}><span class="${j.checklist?.[k]?'done':''}">${l}</span></label>`).join('');
    openModal(`أمر ${j.number}`,`<div class="ticket-head"><div class="device-badge">${esc((j.brand||'F').slice(0,1))}</div><div><span class="eyebrow">${esc(j.number)}</span><h3>${esc(j.brand)} ${esc(j.model)}</h3><p>${esc(j.customerName||customer?.name||'عميل غير مسجل')} ${j.customerPhone?'· '+esc(j.customerPhone):''}</p></div><div class="ticket-status">${statusPill(j.status)}</div></div>
      <div class="grid three metrics-inline"><div><small>الخدمة</small><b>${money(j.finalPrice)}</b></div><div><small>القطع</small><b>${money(j.partsCost)}</b></div><div><small>الربح</small><b class="${profit>=0?'good':'bad'}">${money(profit)}</b></div></div>
      <div class="detail-section"><div class="detail-label">العطل</div><p>${esc(j.issue||'—')}</p></div><div class="detail-section"><div class="detail-label">الأعراض</div><p>${esc(j.symptoms||'—')}</p></div><div class="detail-section"><div class="detail-label">التشخيص</div><p>${esc(j.diagnosis||'—')}</p></div><div class="detail-section"><div class="detail-label">الحل</div><p>${esc(j.solution||'—')}</p></div>
      <div class="detail-section"><div class="detail-label">فحص الاستلام</div><div class="checks-grid">${checks}</div></div>
      <div class="modal-tools"><button class="btn secondary" data-action="edit-job" data-id="${j.id}">تعديل</button><button class="btn secondary" data-action="change-job-status" data-id="${j.id}">تغيير الحالة</button><button class="btn secondary" data-action="print-job" data-id="${j.id}">طباعة تذكرة</button><button class="btn danger" data-action="delete-job" data-id="${j.id}">حذف</button></div>
    `);
    qsa('[data-detail-check]', $('modal-root')).forEach(cb=>cb.addEventListener('change',e=>{j.checklist=j.checklist||{};j.checklist[e.target.dataset.detailCheck]=e.target.checked;j.updatedAt=now();save(); e.target.nextElementSibling.classList.toggle('done',e.target.checked);}));
  }

  function customerModal(c=null){
    const x=c||{};openModal(c?'تعديل العميل':'إضافة عميل',`<form id="customer-form" data-id="${c?.id||''}" class="form-grid">${f('name','الاسم',x.name)}${f('phone','الهاتف',x.phone,'tel')}${f('email','البريد',x.email,'email')}${ta('notes','ملاحظات',x.notes)}</form>`,'save-customer');
  }
  function saveCustomer(){const form=$('customer-form');if(!form||!form.reportValidity())return;const fd=new FormData(form),data=Object.fromEntries(fd.entries()),id=form.dataset.id;if(id){Object.assign(state.customers.find(c=>c.id===id),data,{updatedAt:now()});}else{state.customers.unshift({...data,id:uid('cus'),createdAt:now(),updatedAt:now()});}save();closeModal();render();toast('تم حفظ العميل','success');}
  function customerDetails(id){const c=state.customers.find(x=>x.id===id);if(!c)return;const jobs=state.jobs.filter(j=>j.customerId===id);openModal(c.name,`<div class="profile-hero"><span class="avatar huge">${esc(initials(c.name))}</span><div><h3>${esc(c.name)}</h3><p>${esc(c.phone||'بدون هاتف')} ${c.email?'· '+esc(c.email):''}</p></div></div><div class="grid three metrics-inline"><div><small>الأجهزة</small><b>${jobs.length}</b></div><div><small>إجمالي الإنفاق</small><b>${money(sum(jobs,'finalPrice'))}</b></div><div><small>آخر إصلاح</small><b>${jobs[0]?fmtDate(jobs[0].createdAt):'—'}</b></div></div><div class="detail-section"><div class="detail-label">الملاحظات</div><p>${esc(c.notes||'—')}</p></div><div class="mini-job-list">${jobs.length?jobs.map(j=>jobRow(j)).join(''):empty('لا توجد إصلاحات','لم يتم تسجيل أي جهاز لهذا العميل.')}</div>`);}

  function partModal(p=null){const x=p||{};openModal(p?'تعديل قطعة':'إضافة قطعة',`<form id="part-form" data-id="${p?.id||''}" class="form-grid">${f('name','اسم القطعة',x.name)}${f('sku','SKU / كود',x.sku)}${f('category','التصنيف',x.category||'Screen')}${f('compatible','التوافق',x.compatible)}${f('qty','الكمية',x.qty||0,'number')}${f('min','الحد الأدنى',x.min||0,'number')}${f('buy','سعر الشراء',x.buy||0,'number')}${f('sell','سعر البيع',x.sell||0,'number')}${f('supplier','المورد',x.supplier)}${ta('notes','ملاحظات',x.notes)}</form>`,'save-part');}
  function savePart(){const form=$('part-form');if(!form||!form.reportValidity())return;const fd=new FormData(form),d=Object.fromEntries(fd.entries()),id=form.dataset.id;['qty','min','buy','sell'].forEach(k=>d[k]=Number(d[k]||0));if(id)Object.assign(state.parts.find(p=>p.id===id),d,{updatedAt:now()});else state.parts.unshift({...d,id:uid('part'),createdAt:now(),updatedAt:now()});save();closeModal();render();toast('تم حفظ القطعة','success');}
  function stockAdjust(id){const p=state.parts.find(x=>x.id===id);if(!p)return;openModal(`تعديل مخزون · ${p.name}`,`<div class="stock-adjust"><div class="stock-big">${Number(p.qty||0)}</div><p>الكمية الحالية</p><div class="adjust-row"><button class="btn secondary" data-action="adjust-stock" data-id="${id}" data-delta="-10">−10</button><button class="btn secondary" data-action="adjust-stock" data-id="${id}" data-delta="-1">−1</button><button class="btn primary" data-action="adjust-stock" data-id="${id}" data-delta="1">+1</button><button class="btn secondary" data-action="adjust-stock" data-id="${id}" data-delta="10">+10</button></div></div>`);}
  function adjustStock(id,delta){const p=state.parts.find(x=>x.id===id);if(!p)return;p.qty=Math.max(0,Number(p.qty||0)+Number(delta));p.updatedAt=now();save();closeModal();render();toast('تم تحديث المخزون','success');}

  function transactionModal(t=null){const x=t||{};openModal(t?'تعديل عملية':'إضافة عملية',`<form id="txn-form" data-id="${t?.id||''}" class="form-grid">${`<div class="field-wrap"><label>النوع</label><select class="field" name="type"><option value="income" ${x.type==='income'?'selected':''}>دخل</option><option value="expense" ${x.type==='expense'?'selected':''}>مصروف</option></select></div>`}${f('amount','المبلغ',x.amount||0,'number')}${f('category','التصنيف',x.category||'Repair')}${f('date','التاريخ',(x.date||new Date().toISOString()).slice(0,10),'date')}${f('jobId','رقم أمر الإصلاح',x.jobId||'')}${ta('note','الوصف',x.note)}</form>`,'save-transaction');}
  function saveTransaction(){const form=$('txn-form');if(!form||!form.reportValidity())return;const fd=new FormData(form),d=Object.fromEntries(fd.entries());d.amount=Number(d.amount||0);const id=form.dataset.id;if(id)Object.assign(state.transactions.find(t=>t.id===id),d,{updatedAt:now()});else state.transactions.unshift({...d,id:uid('txn'),createdAt:now(),updatedAt:now()});save();closeModal();render();toast('تم حفظ العملية','success');}

  function noteModal(n=null){const x=n||{};openModal(n?'تعديل ملاحظة':'حفظ ملاحظة',`<form id="note-form" data-id="${n?.id||''}" class="form-grid">${f('title','العنوان',x.title)}${f('category','التصنيف',x.category||'Phone Repair')}${f('tags','Tags',(x.tags||[]).join(', '))}${ta('body','الحل / المحتوى',x.body)}</form>`,'save-note');}
  function saveNote(){const form=$('note-form');if(!form||!form.reportValidity())return;const fd=new FormData(form),d=Object.fromEntries(fd.entries());d.tags=(d.tags||'').split(',').map(x=>x.trim()).filter(Boolean);const id=form.dataset.id;if(id)Object.assign(state.notes.find(n=>n.id===id),d,{updatedAt:now()});else state.notes.unshift({...d,id:uid('note'),createdAt:now(),updatedAt:now()});save();closeModal();render();toast('تم حفظ الملاحظة','success');}

  function globalSearch(q){
    const root=document.querySelector('.search-results');if(root)root.remove();q=String(q||'').trim().toLowerCase();if(!q)return;
    const groups=[['jobs',state.jobs,j=>`${j.number} ${j.brand} ${j.model} ${j.issue} ${j.deviceId} ${j.customerName}`],['customers',state.customers,j=>`${j.name} ${j.phone} ${j.email}`],['parts',state.parts,j=>`${j.name} ${j.sku} ${j.compatible} ${j.supplier}`],['notes',state.notes,j=>`${j.title} ${j.body} ${(j.tags||[]).join(' ')}`]];
    const results=[];for(const [type,arr,hay] of groups){for(const x of arr){if(hay(x).toLowerCase().includes(q)){results.push({type,id:x.id,title:x.number||x.name||x.title,meta:type});if(results.length>=12)break;}}if(results.length>=12)break;}
    const box=document.createElement('div');box.className='search-results';box.innerHTML=`<div class="search-head">${results.length} نتيجة</div>${results.length?results.map(r=>`<button data-action="search-result" data-type="${r.type}" data-id="${r.id}"><span>${r.type==='jobs'?'▣':r.type==='parts'?'▤':r.type==='customers'?'♙':'✦'}</span><div><b>${esc(r.title)}</b><small>${esc(r.meta)}</small></div></button>`).join(''):empty('لا نتائج','جرّب كلمة أخرى.')}`;document.body.appendChild(box);
  }

  function searchOpen(type,id){document.querySelector('.search-results')?.remove();if(type==='jobs')jobDetails(id);else if(type==='customers')customerDetails(id);else if(type==='parts'){const p=state.parts.find(x=>x.id===id);if(p)partModal(p);}else if(type==='notes'){const n=state.notes.find(x=>x.id===id);if(n)noteModal(n);}}

  function printJob(id){const j=state.jobs.find(x=>x.id===id);if(!j)return; const w=window.open('','_blank','noopener'); if(!w){toast('المتصفح منع نافذة الطباعة','danger');return;}const profit=Number(j.finalPrice||0)-Number(j.partsCost||0);w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>${esc(j.number)}</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#111}h1{margin:0 0 4px}.top{display:flex;justify-content:space-between;border-bottom:2px solid #111;padding-bottom:14px}.box{border:1px solid #ccc;border-radius:12px;padding:14px;margin-top:14px}.row{display:flex;gap:20px;margin:7px 0}.label{color:#666}.price{font-size:22px;font-weight:bold}</style></head><body><div class="top"><div><h1>${esc(state.profile.shopName||'FIXORA')}</h1><div>أمر إصلاح: ${esc(j.number)}</div></div><div>${esc(fmtDate(j.createdAt))}</div></div><div class="box"><b>${esc(j.brand)} ${esc(j.model)}</b><div class="row"><span class="label">العميل:</span><span>${esc(j.customerName||'—')}</span></div><div class="row"><span class="label">الهاتف:</span><span>${esc(j.customerPhone||'—')}</span></div><div class="row"><span class="label">IMEI/Serial:</span><span>${esc(j.deviceId||'—')}</span></div></div><div class="box"><div class="row"><span class="label">العطل:</span><span>${esc(j.issue||'—')}</span></div><div class="row"><span class="label">التشخيص:</span><span>${esc(j.diagnosis||'—')}</span></div><div class="row"><span class="label">الحل:</span><span>${esc(j.solution||'—')}</span></div></div><div class="box"><div class="row"><span class="label">سعر الخدمة:</span><span class="price">${money(j.finalPrice)}</span></div><div class="row"><span class="label">تكلفة القطع:</span><span>${money(j.partsCost)}</span></div><div class="row"><span class="label">الربح الداخلي:</span><span>${money(profit)}</span></div></div><p style="margin-top:24px;color:#666">تم إنشاء هذه التذكرة بواسطة FIXORA.</p><script>window.print();</script></body></html>`);w.document.close();}

  function changeJobStatus(id){const j=state.jobs.find(x=>x.id===id);if(!j)return;const current=j.status;openModal('تغيير حالة الإصلاح',`<div class="status-chooser">${Object.entries(JOB_STATUS).map(([k,v])=>`<button class="status-choice ${k===current?'selected':''}" data-action="set-job-status" data-id="${id}" data-status="${k}"><span>${v.label}</span><b>${k}</b></button>`).join('')}</div>`);}
  function setJobStatus(id,status){const j=state.jobs.find(x=>x.id===id);if(!j)return;j.status=status;j.updatedAt=now();j.history=j.history||[];j.history.unshift({at:now(),status,note:`انتقلت الحالة إلى ${JOB_STATUS[status].label}`});addActivity('job',`${j.number} · ${JOB_STATUS[status].label}`);save();closeModal();render();toast('تم تحديث حالة الأمر','success');}

  function bindCheckUI(){
    qsa('input[type="checkbox"]').forEach(inp=>{if(inp.dataset.bound)return;inp.dataset.bound='1'; if(inp.dataset.taskId) inp.addEventListener('change',()=>{const t=state.tasks.find(x=>x.id===inp.dataset.taskId);if(t){t.done=inp.checked;save();render();}});});
    const pc=$('calc-parts'),pr=$('calc-price'),cb=$('calc-buy'),cs=$('calc-sell');
    const calc=()=>{if(pc&&pr)$('calc-profit').textContent=money(Math.max(0,Number(pr.value||0)-Number(pc.value||0)));if(cb&&cs){const b=Number(cb.value||0),s=Number(cs.value||0);$('calc-margin').textContent=s>0?`${Math.round(((s-b)/s)*1000)/10}%`:'0%';}};[pc,pr,cb,cs].filter(Boolean).forEach(x=>x.addEventListener('input',calc));calc();
  }

  function bind(){
    document.addEventListener('click',onClick);
    document.addEventListener('input',onInput);
    document.addEventListener('change',onChange);
    document.addEventListener('submit',onSubmit);
    document.addEventListener('keydown',onKey);
    $('menu-btn').addEventListener('click',()=>{$('drawer').classList.add('open');$('drawer-overlay').classList.remove('hidden');});
    $('drawer-overlay').addEventListener('click',closeDrawer);
    $('alerts-btn').addEventListener('click',showAlerts);
    $('global-search').addEventListener('input',e=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>globalSearch(e.target.value),120);});
  }
  function closeDrawer(){$('drawer').classList.remove('open');$('drawer-overlay').classList.add('hidden');}

  function onClick(e){
    const navBtn=e.target.closest('[data-nav]');if(navBtn){const target=navBtn.dataset.nav;route=target;state.ui.route=target;save();closeDrawer();shell();return;}
    const a=e.target.closest('[data-action]');if(!a)return;const action=a.dataset.action;
    if(action==='close-modal'){ if(a.classList.contains('modal-back') && e.target!==a){} else {closeModal();} return;}
    if(action==='close-drawer'){closeDrawer();return;}
    if(action==='new-job')newJob();
    else if(action==='save-job')saveJob();
    else if(action==='job-details')jobDetails(a.dataset.id);
    else if(action==='edit-job')newJob(state.jobs.find(j=>j.id===a.dataset.id));
    else if(action==='delete-job')deleteJob(a.dataset.id);
    else if(action==='change-job-status')changeJobStatus(a.dataset.id);
    else if(action==='set-job-status')setJobStatus(a.dataset.id,a.dataset.status);
    else if(action==='print-job')printJob(a.dataset.id);
    else if(action==='new-customer')customerModal();
    else if(action==='save-customer')saveCustomer();
    else if(action==='customer-details')customerDetails(a.dataset.id);
    else if(action==='edit-customer')customerModal(state.customers.find(c=>c.id===a.dataset.id));
    else if(action==='delete-customer')deleteCustomer(a.dataset.id);
    else if(action==='new-part')partModal();
    else if(action==='save-part')savePart();
    else if(action==='edit-part')partModal(state.parts.find(p=>p.id===a.dataset.id));
    else if(action==='delete-part')deletePart(a.dataset.id);
    else if(action==='stock-adjust')stockAdjust(a.dataset.id);
    else if(action==='adjust-stock')adjustStock(a.dataset.id,a.dataset.delta);
    else if(action==='new-transaction')transactionModal();
    else if(action==='save-transaction')saveTransaction();
    else if(action==='edit-transaction')transactionModal(state.transactions.find(t=>t.id===a.dataset.id));
    else if(action==='delete-transaction')deleteTransaction(a.dataset.id);
    else if(action==='new-note')noteModal();
    else if(action==='save-note')saveNote();
    else if(action==='edit-note')noteModal(state.notes.find(n=>n.id===a.dataset.id));
    else if(action==='delete-note')deleteNote(a.dataset.id);
    else if(action==='search-result')searchOpen(a.dataset.type,a.dataset.id);
    else if(action==='export')exportBackup();
    else if(action==='import')$('backup-input')?.click();
    else if(action==='reset')resetApp();
    else if(action==='demo-setup')loadDemo(true);
    else if(action==='job-filter') { state.ui.jobFilter={q:document.querySelector('#job-search')?.value||'', status:document.querySelector('#job-status')?.value||'', priority:document.querySelector('#job-priority')?.value||''}; save(); render(); }
    else if(action==='new-task')quickTask();
    else if(action==='save-task')saveTask();
  }
  function onSubmit(e){
    if(e.target.id==='profile-form'){e.preventDefault();const fd=new FormData(e.target);Object.assign(state.profile,Object.fromEntries(fd.entries()));save();render();toast('تم حفظ هوية الورشة','success');}
    if(e.target.id==='task-form'){e.preventDefault();saveTask();}
  }

  function saveTask(){const form=$('task-form');if(!form||!form.reportValidity())return;const fd=new FormData(form);state.tasks.unshift({id:uid('task'),title:String(fd.get('title')||'').trim(),due:String(fd.get('due')||''),done:false,createdAt:now(),updatedAt:now()});save();closeModal();render();toast('تمت إضافة المهمة','success');}

  function onInput(e){
    if(e.target.id==='job-search')filterJobs();
    if(e.target.id==='customer-search')filterCustomers();
    if(e.target.id==='part-search')filterParts();
    if(e.target.id==='note-search')filterNotes();
  }
  function onChange(e){
    if(e.target.id==='job-status'||e.target.id==='job-priority')filterJobs();
    if(e.target.id==='part-stock')filterParts();
    if(e.target.id==='note-cat')filterNotes();
    if(e.target.id==='setting-currency'){state.settings.currency=e.target.value;save();render();}
    if(e.target.id==='setting-notifications'){state.settings.notifications=e.target.checked;save();}
    if(e.target.id==='backup-input')importBackup(e.target.files?.[0]);
    if(e.target.id==='profile-form'){}
  }
  function onKey(e){if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('global-search').focus();}if(e.key==='Escape'){closeModal();document.querySelector('.search-results')?.remove();closeDrawer();}}

  function filterJobs(){const q=($('job-search')?.value||'').toLowerCase();const s=$('job-status')?.value||'';const p=$('job-priority')?.value||'';const list=state.jobs.filter(j=>(!s||j.status===s)&&(!p||j.priority===p)&&JSON.stringify(j).toLowerCase().includes(q));const root=$('job-list');if(root)root.innerHTML=list.length?list.map(jobRow).join(''):empty('لا توجد نتائج','جرّب فلتر أو كلمة أخرى.','new-job');}
  function filterCustomers(){const q=($('customer-search')?.value||'').toLowerCase();const l=state.customers.filter(c=>JSON.stringify(c).toLowerCase().includes(q));const r=$('customer-grid');if(r)r.innerHTML=customerCards(l);}
  function filterParts(){const q=($('part-search')?.value||'').toLowerCase(),s=$('part-stock')?.value||'';const l=state.parts.filter(p=>(!s||(s==='low'?Number(p.qty)<=Number(p.min):Number(p.qty)>Number(p.min)))&&JSON.stringify(p).toLowerCase().includes(q));const r=$('parts-table');if(r)r.innerHTML=partsTable(l);}
  function filterNotes(){const q=($('note-search')?.value||'').toLowerCase(),c=$('note-cat')?.value||'';const l=state.notes.filter(n=>(!c||n.category===c)&&JSON.stringify(n).toLowerCase().includes(q));const r=$('notes-grid');if(r)r.innerHTML=noteCards(l);}

  function deleteJob(id){if(!confirm('حذف أمر الإصلاح؟'))return;state.jobs=state.jobs.filter(j=>j.id!==id);save();closeModal();render();toast('تم حذف الأمر','success');}
  function deleteCustomer(id){const linked=state.jobs.some(j=>j.customerId===id);const msg=linked?'هذا العميل مرتبط بإصلاحات. حذف الملف سيبقي الإصلاحات بدون ملف عميل. متابعة؟':'حذف ملف العميل؟';if(!confirm(msg))return;state.customers=state.customers.filter(c=>c.id!==id);state.jobs.forEach(j=>{if(j.customerId===id)j.customerId='';});save();render();toast('تم حذف العميل','success');}
  function deletePart(id){if(!confirm('حذف القطعة من المخزون؟'))return;state.parts=state.parts.filter(p=>p.id!==id);save();render();toast('تم حذف القطعة','success');}
  function deleteTransaction(id){if(!confirm('حذف العملية المالية؟'))return;state.transactions=state.transactions.filter(t=>t.id!==id);save();render();toast('تم حذف العملية','success');}
  function deleteNote(id){if(!confirm('حذف الملاحظة؟'))return;state.notes=state.notes.filter(n=>n.id!==id);save();render();toast('تم حذف الملاحظة','success');}

  function showAlerts(){
    const low=state.parts.filter(p=>Number(p.qty)<=Number(p.min));const ready=state.jobs.filter(j=>j.status==='ready');
    let list=[...low.map(p=>({title:`مخزون منخفض: ${p.name}`,body:`المتبقي ${p.qty} · الحد الأدنى ${p.min}`})),...ready.map(j=>({title:`جهاز جاهز: ${j.number}`,body:`${j.brand} ${j.model} · جاهز للتسليم`}))];
    openModal('التنبيهات المحلية',list.length?`<div class="alert-list">${list.map(x=>`<div class="alert-row"><span>!</span><div><b>${esc(x.title)}</b><small>${esc(x.body)}</small></div></div>`).join('')}</div>`:empty('لا توجد تنبيهات','كل شيء تحت السيطرة.'));
  }

  function quickTask(){openModal('إضافة مهمة',`<form id="task-form" class="form-grid">${f('title','عنوان المهمة','')}${f('due','الموعد','', 'date')}</form>`,'save-task');}

  function exportBackup(){const payload={...state,exportedAt:now(),app:APP.name,appVersion:APP.version};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`fixora-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);toast('تم تصدير النسخة الاحتياطية','success');}
  function importBackup(file){if(!file)return;const r=new FileReader();r.onload=()=>{try{const parsed=JSON.parse(r.result);Object.keys(state).forEach(k=>delete state[k]);Object.assign(state,merge(defaultState(),parsed));save();shell();toast('تم استيراد النسخة','success');}catch(e){toast('النسخة الاحتياطية غير صالحة','danger');}};r.readAsText(file);}
  function resetApp(){if(!confirm('سيتم حذف بيانات FIXORA المحلية من هذا الجهاز. هل أنت متأكد؟'))return;localStorage.removeItem(APP.storage);location.reload();}

  function loadDemo(instant=false){
    const demo=defaultState();demo.settings.demo=true;demo.profile={shopName:'FIXORA Demo Workshop',technician:'Demo Tech',phone:'0600000000',address:'Dakhla',bio:'ورشة تجريبية لعرض إمكانيات FIXORA.'};
    const c1={id:uid('cus'),name:'Yassine',phone:'0612345678',email:'',notes:'عميل دائم',createdAt:now()};const c2={id:uid('cus'),name:'Ahmed',phone:'0623456789',email:'',notes:'',createdAt:now()};demo.customers=[c1,c2];
    demo.jobs=[
      {id:uid('job'),number:'FX-2609-0001',customerId:c1.id,customerName:c1.name,customerPhone:c1.phone,brand:'Samsung',model:'Galaxy A54',deviceId:'35•••••••••••',os:'Android',issue:'لا يشحن',symptoms:'يظهر رمز الشحن ثم ينقطع.',priority:'high',status:'ready',dueDate:todayPlus(1),partsCost:90,finalPrice:260,diagnosis:'فحص منفذ USB-C وتنظيفه وتغيير البورد الصغير.',solution:'تغيير Sub-board + اختبار الشحن السريع.',notes:'تم اختبار الكاميرا والشبكة.',checklist:Object.fromEntries(CHECKS.map(([k])=>[k,true])),createdAt:daysAgo(2),updatedAt:now()},
      {id:uid('job'),number:'FX-2609-0002',customerId:c2.id,customerName:c2.name,customerPhone:c2.phone,brand:'Apple',model:'iPhone 11',deviceId:'35•••••••••••',os:'iOS',issue:'الشاشة لا تستجيب',symptoms:'صورة موجودة لكن اللمس متقطع.',priority:'urgent',status:'repair',dueDate:todayPlus(2),partsCost:310,finalPrice:650,diagnosis:'شاشة تالفة بعد سقوط.',solution:'جاري تركيب شاشة اختبار.',notes:'لا يوجد رمز فتح مخزن.',checklist:{power:true,display:true}},
      {id:uid('job'),number:'FX-2609-0003',customerName:'Client #3',customerPhone:'0633333333',brand:'Xiaomi',model:'Redmi Note 12',os:'Android',issue:'Restart loop',priority:'low',status:'diagnosis',partsCost:0,finalPrice:180,diagnosis:'في انتظار اختبار Software.',solution:'',notes:'',checklist:{power:true,software:false},createdAt:daysAgo(1),updatedAt:now()}
    ];
    demo.parts=[{id:uid('part'),name:'USB-C Sub-board A54',sku:'SBA54-USBC',category:'Charging',compatible:'Galaxy A54',qty:2,min:3,buy:70,sell:130,supplier:'Supplier A'}, {id:uid('part'),name:'iPhone 11 Display',sku:'IP11-DSP',category:'Screen',compatible:'iPhone 11',qty:4,min:2,buy:250,sell:420,supplier:'Supplier B'},{id:uid('part'),name:'B7000 Glue',sku:'GL-B7000',category:'Consumable',compatible:'Universal',qty:12,min:5,buy:12,sell:25,supplier:'Supplier C'}];
    demo.transactions=[{id:uid('txn'),type:'income',amount:260,category:'Repair',date:today(),jobId:demo.jobs[0].number,note:'إصلاح Galaxy A54',createdAt:now()},{id:uid('txn'),type:'expense',amount:70,category:'Parts',date:today(),jobId:'',note:'شراء قطعة USB-C',createdAt:now()},{id:uid('txn'),type:'income',amount:650,category:'Repair',date:daysAgo(4).slice(0,10),jobId:demo.jobs[1].number,note:'إصلاح iPhone 11',createdAt:daysAgo(4)}];
    demo.notes=[{id:uid('note'),title:'No charge — خطوات التشخيص',category:'Phone Repair',tags:['charging','usb-c','power'],body:'ابدأ بكيبل وشاحن معروفين، ثم نظف المنفذ، راقب current draw، جرّب sub-board قبل تغيير IC.',createdAt:daysAgo(3),updatedAt:now()},{id:uid('note'),title:'Restart loop',category:'Software',tags:['bootloop','android'],body:'تحقق من الحرارة والطاقة، ثم Safe Mode وRecovery قبل أي مسح بيانات.',createdAt:daysAgo(1),updatedAt:now()}];
    demo.tasks=[{id:uid('task'),title:'طلب شاشة iPhone 11',due:todayPlus(1),done:false},{id:uid('task'),title:'التواصل مع عميل Galaxy A54',due:today(),done:false}];
    demo.activity=[{id:uid('act'),kind:'job',title:'FX-2609-0001 · جاهز للتسليم',meta:'Demo',createdAt:now()}];
    Object.keys(state).forEach(k=>delete state[k]);Object.assign(state,demo);save();route='home';state.ui.route='home';shell();toast('تم تحميل النسخة التجريبية','success');
  }
  function today(){return new Date().toISOString().slice(0,10);}function daysAgo(n){return new Date(Date.now()-n*864e5).toISOString();}function todayPlus(n){return new Date(Date.now()+n*864e5).toISOString().slice(0,10);}

  function registerSW(){if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});}

  function init(){
    document.documentElement.lang='ar';document.documentElement.dir='rtl';bind();
    const params=new URLSearchParams(location.search);
    registerSW();
    if(params.get('demo')==='1' && !state.profile.technician){ loadDemo(true); return; }
    shell();
    $('global-search').value='';
  }
  init();
})();
