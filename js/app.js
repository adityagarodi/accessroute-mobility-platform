/* ============================================================
   AccessRoute — app.js  (shared across all pages)
   Sidebar, toast, voice, translations, preferences, service layer
   ============================================================ */
'use strict';

/* ── Translations ────────────────────────────────────────── */
const T = {
  en:{
    dashboard:'Dashboard',planRoute:'Plan Route',liveMap:'Live Map',
    iotMonitor:'IoT Monitoring',facilities:'Facilities',transport:'Transport',
    alerts:'Live Alerts',profile:'Accessibility Profile',analytics:'Analytics',
    settings:'Settings',findRoute:'Find Accessible Route',startJourney:'Start Journey',
    recalculate:'Recalculate Route',viewDetails:'View Details',
    shareJourney:'Share Journey',shareLocation:'Share Location',sendAlert:'Send Alert',
    available:'Available',limited:'Limited',unavailable:'Unavailable',
    verified:'Verified',community:'Community Report',unconfirmed:'Unconfirmed',
    goodMorning:'Good morning',goodAfternoon:'Good afternoon',goodEvening:'Good evening',
    yourOverview:'Your personalized accessibility and mobility overview.'
  },
  hi:{
    dashboard:'डैशबोर्ड',planRoute:'रूट प्लान करें',liveMap:'लाइव मैप',
    iotMonitor:'IoT मॉनिटरिंग',facilities:'सुविधाएं',transport:'परिवहन',
    alerts:'लाइव अलर्ट',profile:'प्रोफ़ाइल',analytics:'विश्लेषण',
    settings:'सेटिंग्स',findRoute:'सुलभ रूट खोजें',startJourney:'यात्रा शुरू करें',
    recalculate:'रूट पुनः गणना',viewDetails:'विवरण देखें',
    shareJourney:'यात्रा साझा करें',shareLocation:'स्थान साझा करें',sendAlert:'अलर्ट भेजें',
    available:'उपलब्ध',limited:'सीमित',unavailable:'अनुपलब्ध',
    verified:'सत्यापित',community:'सामुदायिक रिपोर्ट',unconfirmed:'अपुष्ट',
    goodMorning:'शुभ प्रभात',goodAfternoon:'नमस्ते',goodEvening:'शुभ संध्या',
    yourOverview:'आपका व्यक्तिगत प्रवेशयोग्यता और गतिशीलता अवलोकन।'
  },
  mr:{
    dashboard:'डॅशबोर्ड',planRoute:'मार्ग नियोजन',liveMap:'थेट नकाशा',
    iotMonitor:'IoT देखरेख',facilities:'सुविधा',transport:'वाहतूक',
    alerts:'थेट सूचना',profile:'प्रोफाइल',analytics:'विश्लेषण',
    settings:'सेटिंग्ज',findRoute:'सुलभ मार्ग शोधा',startJourney:'प्रवास सुरू करा',
    recalculate:'मार्ग पुन्हा मोजा',viewDetails:'तपशील पाहा',
    shareJourney:'प्रवास शेअर करा',shareLocation:'स्थान शेअर करा',sendAlert:'सूचना पाठवा',
    available:'उपलब्ध',limited:'मर्यादित',unavailable:'अनुपलब्ध',
    verified:'सत्यापित',community:'सामुदायिक अहवाल',unconfirmed:'अपुष्ट',
    goodMorning:'शुभ प्रभात',goodAfternoon:'नमस्कार',goodEvening:'शुभ संध्याकाळ',
    yourOverview:'तुमचे वैयक्तिक प्रवेशयोग्यता आणि गतिशीलता विहंगावलोकन।'
  }
};

/* ── Preferences ────────────────────────────────────────── */
const PREFS_KEY = 'ar_prefs';
const DEFAULT_PREFS = {
  fontSize:'normal', contrast:'normal', motion:'normal',
  voice:false, visual:true, screenReader:false, language:'en'
};

function getPrefs(){
  try{ return {...DEFAULT_PREFS,...JSON.parse(localStorage.getItem(PREFS_KEY)||'{}')}; }
  catch(e){ return {...DEFAULT_PREFS}; }
}
function savePrefs(p){ try{ localStorage.setItem(PREFS_KEY,JSON.stringify(p)); }catch(e){} }
function setPref(k,v){ const p=getPrefs(); p[k]=v; savePrefs(p); applyPrefs(p); return p; }
function applyPrefs(p){
  if(!p) p=getPrefs();
  const b=document.body;
  b.classList.remove('font-small','font-normal','font-large');
  b.classList.add('font-'+p.fontSize);
  b.classList.toggle('high-contrast', p.contrast==='high');
  b.classList.toggle('reduced-motion', p.motion==='reduced');
  document.documentElement.lang=p.language;
}
function t(key){ const p=getPrefs(); return (T[p.language]||T.en)[key]||(T.en[key]||key); }

function applyTranslations(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const k=el.getAttribute('data-i18n'), v=t(k);
    if(el.tagName==='INPUT') el.placeholder=v; else el.textContent=v;
  });
}

/* ── Toast ───────────────────────────────────────────────── */
function toast(msg, type='info', title='', duration=4500){
  const c=document.getElementById('toast-container'); if(!c) return;
  const icons={success:'fa-circle-check',warning:'fa-triangle-exclamation',danger:'fa-circle-xmark',info:'fa-circle-info'};
  const el=document.createElement('div');
  el.className=`toast t-${type}`;
  el.setAttribute('role','alert'); el.setAttribute('aria-live','polite');
  el.innerHTML=`<i class="fa-solid ${icons[type]||icons.info} toast-icon"></i>
    <div class="toast-body">${title?`<div class="toast-title">${title}</div>`:''}
    <div class="toast-msg">${msg}</div></div>
    <button class="toast-close" aria-label="Dismiss"><i class="fa-solid fa-xmark"></i></button>`;
  c.appendChild(el);
  el.querySelector('.toast-close').onclick=()=>dismissToast(el);
  const timer=setTimeout(()=>dismissToast(el),duration);
  el._t=timer;
}
function dismissToast(el){
  clearTimeout(el._t); el.classList.add('removing');
  el.addEventListener('animationend',()=>el.remove(),{once:true});
}

/* ── Voice Guidance ─────────────────────────────────────── */
let voiceOn=false;
let synth=window.speechSynthesis||null;

function speak(text){
  if(!voiceOn) return;
  if(!synth){ toast('Voice guidance not supported in this browser.','warning','Voice'); return; }
  synth.cancel();
  const u=new SpeechSynthesisUtterance(text);
  const lang=getPrefs().language;
  u.lang = lang==='hi'?'hi-IN': lang==='mr'?'mr-IN':'en-IN';
  u.rate=0.95; u.pitch=1.0;
  synth.speak(u);
}

function toggleVoice(btn){
  voiceOn=!voiceOn; setPref('voice',voiceOn);
  if(btn){
    btn.setAttribute('aria-pressed',String(voiceOn));
    btn.querySelector('i').className=voiceOn?'fa-solid fa-volume-high':'fa-solid fa-volume-xmark';
  }
  if(voiceOn){ speak('Voice guidance enabled.'); toast('Voice guidance enabled.','success','Voice'); }
  else{ synth&&synth.cancel(); toast('Voice guidance disabled.','info','Voice'); }
}

/* ── Sidebar ────────────────────────────────────────────── */
function initSidebar(){
  const sb=document.getElementById('sidebar');
  const ov=document.getElementById('sidebar-overlay');
  const hb=document.getElementById('hamburger-btn');
  if(!sb) return;
  const open=()=>{ sb.classList.add('open'); ov&&ov.classList.add('active'); hb&&hb.setAttribute('aria-expanded','true'); document.body.style.overflow='hidden'; };
  const close=()=>{ sb.classList.remove('open'); ov&&ov.classList.remove('active'); hb&&hb.setAttribute('aria-expanded','false'); document.body.style.overflow=''; };
  hb&&hb.addEventListener('click',()=>sb.classList.contains('open')?close():open());
  ov&&ov.addEventListener('click',close);
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&sb.classList.contains('open')) close(); });
}

function setActiveNav(){
  const page=location.pathname.split('/').pop()||'index.html';
  document.querySelectorAll('.nav-item[data-page]').forEach(el=>{
    el.classList.toggle('active',el.dataset.page===page);
  });
  document.querySelectorAll('.bnav-item[data-page]').forEach(el=>{
    el.classList.toggle('active',el.dataset.page===page);
  });
}

function updateAlertBadge(){
  try{
    const count=(typeof AR_ALERTS!=='undefined')?AR_ALERTS.filter(a=>a.status==='active').length:0;
    document.querySelectorAll('.alert-count').forEach(el=>{ el.textContent=count||''; el.style.display=count>0?'inline-flex':'none'; });
    document.querySelectorAll('.notif-dot').forEach(d=>{ d.style.display=count>0?'block':'none'; });
  }catch(e){}
}

/* ── Greeting ────────────────────────────────────────────── */
function getGreeting(){
  const h=new Date().getHours();
  return h<12?t('goodMorning'):h<17?t('goodAfternoon'):t('goodEvening');
}

/* ── Trusted Contact Helpers ─────────────────────────────── */
function shareJourney(){ toast('Journey shared with Priya Sharma (Sister).','success','Journey Shared'); speak('Your journey has been shared with your trusted contact.'); }
function shareLocation(){ toast('Current location shared with Priya Sharma.','success','Location Shared'); }
function sendEmergencyAlert(){
  if(!confirm('Send emergency alert to Priya Sharma?')) return;
  toast('Emergency alert sent to Priya Sharma. Location and journey shared.','danger','Emergency Alert',8000);
  speak('Emergency alert sent to your trusted contact.');
}

/* ── Helper: time ago ────────────────────────────────────── */
function timeAgo(iso){
  const d=Math.floor((Date.now()-new Date(iso))/1000);
  if(d<60) return `${d}s ago`;
  if(d<3600) return `${Math.floor(d/60)}m ago`;
  if(d<86400) return `${Math.floor(d/3600)}h ago`;
  return `${Math.floor(d/86400)}d ago`;
}

/* ── Helper: facility icon ───────────────────────────────── */
function facilityIcon(type){
  return {elevator:'fa-elevator',ramp:'fa-road',toilet:'fa-restroom',bus:'fa-bus',
          crossing:'fa-person-walking',footpath:'fa-route',pathway:'fa-person-walking-dashed-line-arrow-right'}[type]||'fa-circle-info';
}

/* ── Helper: map marker ──────────────────────────────────── */
function makeMapIcon(color,symbol){
  return L.divIcon({
    className:'',
    html:`<div style="background:${color};color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25);" aria-hidden="true">${symbol}</div>`,
    iconSize:[32,32], iconAnchor:[16,32]
  });
}

/* ── Bootstrap ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded',()=>{
  const p=getPrefs(); applyPrefs(p); voiceOn=p.voice||false;
  initSidebar(); setActiveNav(); applyTranslations(); updateAlertBadge();

  // Language selectors
  document.querySelectorAll('.lang-selector').forEach(sel=>{
    sel.value=p.language;
    sel.addEventListener('change',e=>{ setPref('language',e.target.value); applyTranslations(); toast('Language updated.','success'); });
  });

  // Voice toggle button
  const vBtn=document.getElementById('voice-btn')||document.getElementById('voice-toggle-btn');
  if(vBtn){
    vBtn.setAttribute('aria-pressed',String(voiceOn));
    vBtn.querySelector('i').className=voiceOn?'fa-solid fa-volume-high':'fa-solid fa-volume-xmark';
    vBtn.addEventListener('click',()=>toggleVoice(vBtn));
  }

  // Trusted contact buttons
  document.querySelectorAll('[data-action="share-journey"]').forEach(b=>b.addEventListener('click',shareJourney));
  document.querySelectorAll('[data-action="share-location"]').forEach(b=>b.addEventListener('click',shareLocation));
  document.querySelectorAll('[data-action="send-alert"]').forEach(b=>b.addEventListener('click',sendEmergencyAlert));

  // Set greeting
  const gEl=document.getElementById('greeting-text');
  if(gEl) gEl.textContent=`${getGreeting()}, Aditya 👋`;

  // Demo mode toggle
  const dBtn=document.getElementById('demo-mode-btn');
  if(dBtn){
    dBtn.addEventListener('click',()=>{
      const on=!document.body.classList.contains('demo-active');
      document.body.classList.toggle('demo-active',on);
      dBtn.textContent=on?'🟠 DEMO ON':'⚪ Demo Mode';
      if(on) toast('Demo Mode activated. Use the simulate buttons to trigger events.','warning','Demo Mode',6000);
    });
  }
});
