/* ============================================================
   AccessRoute — routes.js
   ============================================================ */
'use strict';
if(typeof injectNav==='function') injectNav('routes','Plan Route');

const AR_Routes = (() => {
  let rMap=null, routeLayers=[], selectedId=null, pref='mostAccessible';

  function initMap(){
    const el=document.getElementById('route-map'); if(!el) return;
    rMap=L.map('route-map',{center:[18.522,73.860],zoom:13});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(rMap);
    drawRoute(AR_ROUTES[0],'#0d9488',true);
  }

  function clearLayers(){ routeLayers.forEach(l=>rMap&&rMap.removeLayer(l)); routeLayers=[]; }

  function drawRoute(r,color,primary){
    if(!rMap) return;
    const pts=r.waypoints.map(p=>[p.lat,p.lng]);
    const line=L.polyline(pts,{color,weight:primary?5:3,opacity:primary?.9:.5,dashArray:primary?null:'8 5'}).addTo(rMap);
    routeLayers.push(line);
    if(primary){
      const mo=L.circleMarker([r.waypoints[0].lat,r.waypoints[0].lng],{radius:9,color:'#1e3a5f',fillColor:'#1e3a5f',fillOpacity:1}).addTo(rMap).bindPopup(`<strong>${r.origin}</strong>`);
      const last=r.waypoints[r.waypoints.length-1];
      const md=L.circleMarker([last.lat,last.lng],{radius:9,color:'#dc2626',fillColor:'#dc2626',fillOpacity:1}).addTo(rMap).bindPopup(`<strong>${r.destination}</strong>`);
      routeLayers.push(mo,md);
      rMap.fitBounds(line.getBounds(),{padding:[30,30]});
    }
  }

  function find(){
    const to=document.getElementById('inp-to');
    if(!to||!to.value.trim()){ toast('Please enter a destination.','warning','Missing Destination'); to&&to.focus(); return; }
    const loading=document.getElementById('routes-loading'), results=document.getElementById('route-results');
    loading.style.display='block'; results.innerHTML='';
    speak('Calculating accessible routes. Please wait.');
    const stepFree=document.getElementById('r-stepfree')?.checked;
    setTimeout(()=>{
      loading.style.display='none';
      let sorted=[...AR_ROUTES].filter(r=>r.id!=='r004');
      if(pref==='fastest') sorted.sort((a,b)=>a.duration-b.duration);
      else if(pref==='leastWalking') sorted.sort((a,b)=>parseFloat(a.walkingDistance)-parseFloat(b.walkingDistance));
      else sorted.sort((a,b)=>b.accessibilityScore-a.accessibilityScore);
      if(stepFree) sorted=sorted.filter(r=>r.stepFree);
      if(!sorted.length) sorted=AR_ROUTES.slice(0,3);
      renderResults(sorted);
      clearLayers();
      const cols=['#0d9488','#94a3b8','#3b82f6'];
      sorted.forEach((r,i)=>drawRoute(r,cols[i]||'#94a3b8',i===0));
      toast('Accessible routes found.','success','Routes Ready');
      speak(`Found ${sorted.length} accessible routes. Top route: ${sorted[0].label}, ${sorted[0].duration} minutes.`);
    },1200);
  }

  function renderResults(routes){
    const c=document.getElementById('route-results'); if(!c) return;
    c.innerHTML='';
    routes.forEach((r,i)=>{
      const cls=r.accessibilityScore>=90?'sf-high':r.accessibilityScore>=70?'sf-mid':'sf-low';
      const tagCls=i===0?'rrt-best':r.label.includes('Fast')?'rrt-fast':r.label.includes('Walking')?'rrt-walk':'rrt-alt';
      const div=document.createElement('div');
      div.className=`rr-card${i===0?' selected recommended':''}`;
      div.setAttribute('role','listitem'); div.tabIndex=0;
      div.dataset.routeId=r.id;
      div.innerHTML=`
        <div class="rr-head">
          <div><div class="rr-name">${r.label}</div><div style="font-size:.75rem;color:var(--text-m);margin-top:2px;">${r.origin} → ${r.destination}</div></div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.25rem;">
            ${i===0?`<span class="rr-tag rrt-best">✓ Recommended</span>`:`<span class="rr-tag ${tagCls}">${r.label}</span>`}
            ${r.disruptions>0?`<span class="rr-tag" style="background:var(--warning-bg);color:var(--warning);">⚠ ${r.disruptions} Disruption</span>`:''}
          </div>
        </div>
        <div class="rr-stats">
          <div><span class="rr-sv">${r.duration}</span><span class="rr-sl">min</span></div>
          <div><span class="rr-sv">${r.walkingDistance}</span><span class="rr-sl">walking</span></div>
          <div><span class="rr-sv">${r.transfers}</span><span class="rr-sl">transfer${r.transfers!==1?'s':''}</span></div>
          <div><span class="rr-sv">${r.accessibilityScore}%</span><span class="rr-sl">score</span></div>
        </div>
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.75rem;">
          <div class="score-bar"><div class="score-fill ${cls}" style="width:${r.accessibilityScore}%;"></div></div>
          <span style="font-size:.75rem;font-weight:700;color:${r.accessibilityScore>=90?'var(--success)':r.accessibilityScore>=70?'var(--warning)':'var(--danger)'};">${r.accessibilityScore}% accessible</span>
        </div>
        <div class="rr-feats">
          <span class="rrf ${r.stepFree?'rrf-yes':'rrf-no'}"><i class="fa-solid ${r.stepFree?'fa-circle-check':'fa-circle-xmark'}"></i> Step-free</span>
          <span class="rrf ${r.elevatorAvailable?'rrf-yes':'rrf-no'}"><i class="fa-solid ${r.elevatorAvailable?'fa-circle-check':'fa-circle-xmark'}"></i> Elevator</span>
          <span class="rrf ${r.lowFloorTransport?'rrf-yes':'rrf-no'}"><i class="fa-solid ${r.lowFloorTransport?'fa-circle-check':'fa-circle-xmark'}"></i> Low-floor bus</span>
          <span class="rrf ${r.rampAvailable?'rrf-yes':'rrf-no'}"><i class="fa-solid ${r.rampAvailable?'fa-circle-check':'fa-circle-xmark'}"></i> Ramp</span>
          <span class="rrf ${r.accessibleToilet?'rrf-yes':'rrf-warn'}"><i class="fa-solid ${r.accessibleToilet?'fa-circle-check':'fa-triangle-exclamation'}"></i> Toilet</span>
        </div>
        <div style="display:flex;gap:.75rem;flex-wrap:wrap;">
          <button class="btn btn-accent" style="flex:1;" onclick="AR_Routes.startJourney('${r.id}')"><i class="fa-solid fa-play"></i> Start Journey</button>
          <button class="btn btn-outline btn-sm" onclick="AR_Routes.preview('${r.id}')"><i class="fa-solid fa-map"></i> Preview</button>
        </div>`;
      div.addEventListener('click',e=>{ if(!e.target.closest('button')) AR_Routes.preview(r.id); });
      c.appendChild(div);
    });
  }

  function preview(id){
    selectedId=id;
    const r=AR_ROUTES.find(x=>x.id===id); if(!r) return;
    document.querySelectorAll('.rr-card').forEach(c=>c.classList.toggle('selected',c.dataset.routeId===id));
    clearLayers();
    drawRoute(r,'#0d9488',true);
    AR_ROUTES.filter(x=>x.id!==id&&x.id!=='r004').slice(0,2).forEach(x=>drawRoute(x,'#94a3b8',false));
    toast(`Route preview: ${r.label}`,'info');
  }

  function startJourney(id){
    const r=AR_ROUTES.find(x=>x.id===id)||AR_ROUTES[0];
    toast(`Journey started: ${r.label}. ETA ${r.duration} min.`,'success','Journey Started',6000);
    speak(`Starting journey. ${r.label}. Estimated time: ${r.duration} minutes. ${r.stepFree?'This is a step-free route.':''} Continue straight for 200 meters to reach the bus stop.`);
  }

  function swap(){
    const f=document.getElementById('inp-from'),t=document.getElementById('inp-to');
    if(!f||!t) return; const tmp=f.value; f.value=t.value; t.value=tmp;
    toast('Origin and destination swapped.','info');
  }

  function setPref(el,val){
    pref=val;
    document.querySelectorAll('.radio-opt').forEach(o=>o.classList.remove('checked'));
    el.classList.add('checked');
  }

  document.addEventListener('DOMContentLoaded',initMap);
  return {find,preview,startJourney,swap,setPref};
})();
