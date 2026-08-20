/* ============================================================
   AccessRoute — dashboard.js
   Map, charts, timeline, real-time simulation, rerouting
   ============================================================ */
'use strict';

const AR_Dashboard = (() => {
  let map = null, mainLine = null, altLine = null, sensorMarkers = [];
  let disruptionActive = false, rerouteComplete = false;
  let simTick = 0;

  // ── Nav inject ────────────────────────────────────────
  if(typeof injectNav === 'function') injectNav('dashboard','Dashboard');

  // ── Map ───────────────────────────────────────────────
  function initMap() {
    const el = document.getElementById('main-map'); if(!el) return;
    map = L.map('main-map', { center:[18.522,73.862], zoom:14, zoomControl:true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
    drawRoute(AR_ROUTES[0]);
    drawAltRoute();
    drawSensors();
  }

  function drawRoute(r) {
    if(mainLine) map.removeLayer(mainLine);
    const pts = r.waypoints.map(p=>[p.lat,p.lng]);
    mainLine = L.polyline(pts,{color:'#0d9488',weight:5,opacity:.9}).addTo(map);
    L.marker([r.waypoints[0].lat,r.waypoints[0].lng],{icon:makeMapIcon('#1e3a5f','⊙')}).addTo(map).bindPopup(`<strong>${r.origin}</strong><br>Current Location`);
    const last = r.waypoints[r.waypoints.length-1];
    L.marker([last.lat,last.lng],{icon:makeMapIcon('#dc2626','★')}).addTo(map).bindPopup(`<strong>${r.destination}</strong>`);
  }

  function drawAltRoute() {
    if(altLine) map.removeLayer(altLine);
    const pts = AR_ROUTES[2].waypoints.map(p=>[p.lat,p.lng]);
    altLine = L.polyline(pts,{color:'#94a3b8',weight:3,opacity:.5,dashArray:'8 5'}).addTo(map).bindPopup('Alternative – Least Walking');
  }

  function drawSensors() {
    sensorMarkers.forEach(m=>map.removeLayer(m)); sensorMarkers=[];
    AR_SENSORS.forEach(s=>{
      const color = !s.online?'#94a3b8':s.status==='obstacle'?'#dc2626':s.status==='warning'?'#d97706':'#2563eb';
      const m = L.marker([s.lat,s.lng],{icon:makeMapIcon(color,'⚡')})
        .addTo(map)
        .bindPopup(`<strong>${s.deviceId}</strong><br>${s.facilityName}<br>Status: <strong style="color:${color}">${s.status.toUpperCase()}</strong><br>Reading: ${s.reading} ${s.unit}`);
      sensorMarkers.push(m);
    });
  }

  function centerMap() { map&&map.setView([18.5284,73.8742],15); }

  // ── Charts ────────────────────────────────────────────
  function initCharts() {
    const d = AR_ANALYTICS, font={family:'Inter, sans-serif',size:11};

    new Chart(document.getElementById('chart-facilities'),{
      type:'bar',
      data:{labels:d.facilityAvailability.labels,datasets:[
        {label:'Available',data:d.facilityAvailability.available,backgroundColor:'#16a34a',borderRadius:4},
        {label:'Limited',  data:d.facilityAvailability.limited,  backgroundColor:'#d97706',borderRadius:4},
        {label:'Unavailable',data:d.facilityAvailability.unavailable,backgroundColor:'#dc2626',borderRadius:4}
      ]},
      options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{position:'top',labels:{font}}},
        scales:{x:{stacked:true,grid:{display:false},ticks:{font}},y:{stacked:true,beginAtZero:true,ticks:{font},grid:{color:'#e2e8f0'}}}}
    });

    new Chart(document.getElementById('chart-weekly'),{
      type:'bar',
      data:{labels:d.weeklyJourneys.labels,datasets:[
        {label:'Journeys',data:d.weeklyJourneys.journeys,backgroundColor:'rgba(30,58,95,.15)',borderColor:'#1e3a5f',borderWidth:2,borderRadius:6,yAxisID:'y'},
        {label:'Avg Score %',data:d.weeklyJourneys.scores,type:'line',borderColor:'#0d9488',backgroundColor:'rgba(13,148,136,.1)',borderWidth:2.5,tension:.4,fill:true,pointRadius:4,pointBackgroundColor:'#0d9488',yAxisID:'y2'}
      ]},
      options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{position:'top',labels:{font}}},
        scales:{x:{grid:{display:false},ticks:{font}},y:{position:'left',beginAtZero:true,grid:{color:'#e2e8f0'},ticks:{font}},y2:{position:'right',min:60,max:100,grid:{display:false},ticks:{font,callback:v=>v+'%'}}}}
    });
  }

  // ── Timeline ──────────────────────────────────────────
  function renderTimeline() {
    const el = document.getElementById('timeline'); if(!el) return;
    const typeMap={success:{cls:'tl-ok',icon:'fa-circle-check'},warning:{cls:'tl-warn',icon:'fa-triangle-exclamation'},danger:{cls:'tl-bad',icon:'fa-microchip'},info:{cls:'tl-info',icon:'fa-rotate'}};
    el.innerHTML = AR_TIMELINE.map(item=>{
      const t=typeMap[item.type]||typeMap.info;
      return `<div class="tl-item"><div class="tl-dot ${t.cls}" aria-hidden="true"><i class="fa-solid ${t.icon}"></i></div><div><div class="tl-time">${item.time}</div><div class="tl-msg">${item.message}</div></div></div>`;
    }).join('');
  }

  function addTimelineEvent(type,msg) {
    const now=new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
    AR_TIMELINE.push({id:'tl_'+Date.now(),time:now,type,message:msg});
    renderTimeline();
  }

  // ── Score Ring ────────────────────────────────────────
  function animateRing(score) {
    const fill=document.getElementById('score-ring'), num=document.getElementById('ring-num');
    if(!fill||!num) return;
    const c=2*Math.PI*35;
    fill.style.strokeDasharray=c;
    fill.style.strokeDashoffset=c-(score/100)*c;
    num.textContent=score+'%';
  }

  // ── Rerouting ─────────────────────────────────────────
  function triggerDisruption() {
    if(disruptionActive) return;
    disruptionActive=true;
    const sensor=AR_SENSORS.find(s=>s.id==='s003');
    if(sensor){ sensor.status='obstacle'; sensor.reading=8; }
    const fac=AR_FACILITIES.find(f=>f.id==='f003');
    if(fac) fac.status='obstacle';
    document.getElementById('disruption-banner').classList.add('show');
    toast('ESP32-003 detected obstacle. Route affected.','danger','IoT Alert',8000);
    speak('Warning. Obstacle detected on accessible pathway. Please recalculate your route.');
    addTimelineEvent('danger','ESP32-003 detected obstacle on Platform Pathway (8cm clearance)');
    addTimelineEvent('info','AI Route Engine analyzing alternative accessible routes…');
    drawSensors();
    document.getElementById('stat-alerts').textContent='4';
    document.getElementById('stat-alerts-meta').textContent='2 affecting your route';
  }

  function recalculate() {
    if(rerouteComplete) return; rerouteComplete=true;
    document.getElementById('disruption-banner').classList.remove('show');
    const alt=AR_ROUTES[3];
    document.getElementById('jc-eta').textContent='29';
    document.getElementById('jc-score').textContent='92%';
    document.getElementById('stat-score').textContent='92%';
    document.getElementById('stat-eta').textContent='ETA: 29 min · Step-free';
    animateRing(92);
    drawRoute(alt);
    document.getElementById('success-banner').classList.add('show');
    toast('Route recalculated. Alternative accessible route found via North Exit Ramp.','success','Route Recalculated',6000);
    speak('Route recalculated. Alternative accessible route found. New estimated time: 29 minutes.');
    addTimelineEvent('success','AI Route Engine: alternative accessible route confirmed – 92%');
    document.getElementById('stat-alerts').textContent='2';
    document.getElementById('stat-alerts-meta').textContent='0 affecting new route';
    const badge=document.getElementById('alerts-badge');
    if(badge){badge.className='stat-badge sb-ok';badge.innerHTML='<i class="fa-solid fa-circle-check"></i> Route clear';}
  }

  // ── Data Flow Animation ───────────────────────────────
  function animateDataFlow() {
    const nodes=['df-iot','df-gw','df-data','df-fac','df-ai','df-score','df-route','df-user'];
    let i=0;
    setInterval(()=>{
      nodes.forEach(n=>document.getElementById(n)&&document.getElementById(n).classList.remove('active'));
      const el=document.getElementById(nodes[i%nodes.length]);
      if(el) el.classList.add('active');
      i++;
    },900);
  }

  // ── Simulation ────────────────────────────────────────
  function startSimulation() {
    setInterval(()=>{
      simTick++;
      // trigger disruption after ~15s
      if(simTick===3 && !disruptionActive) triggerDisruption();
      // progress bar
      const prog=document.getElementById('jc-prog');
      if(prog){ const w=Math.min((parseInt(prog.style.width)||35)+2,95); prog.style.width=w+'%'; }
    },5000);
  }

  // ── Init ──────────────────────────────────────────────
  function init() {
    initMap();
    initCharts();
    renderTimeline();
    animateRing(94);
    animateDataFlow();
    startSimulation();
  }

  document.addEventListener('DOMContentLoaded', init);
  return { centerMap, recalculate, triggerDisruption };
})();
