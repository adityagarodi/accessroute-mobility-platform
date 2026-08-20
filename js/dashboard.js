/* ============================================================
   AccessRoute – dashboard.js
   Map initialisation, Chart.js charts, real-time simulation,
   disruption detection, and automatic rerouting demo.
   ============================================================ */

'use strict';

const AR_Dashboard = (() => {

  // ── State ──────────────────────────────────────────────
  let map = null;
  let mainRouteLayer   = null;
  let altRouteLayer    = null;
  let markerLayers     = {};
  let filterState      = { elevator: true, ramp: true };
  let currentRoute     = AR_DATA.routes[0];
  let reroutedRoute    = AR_DATA.routes[3];
  let disruptionActive = false;
  let rerouteComplete  = false;
  let simInterval      = null;

  // ── Map ────────────────────────────────────────────────
  function initMap() {
    const mapEl = document.getElementById('main-map');
    if (!mapEl) return;

    map = L.map('main-map', {
      center: [18.522, 73.862],
      zoom: 14,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    drawMainRoute(currentRoute);
    drawAltRoute();
    addFacilityMarkers();
    addTransportMarkers();
  }

  function makeIcon(color, symbol) {
    return L.divIcon({
      className: '',
      html: `<div style="
        background:${color};color:white;width:32px;height:32px;
        border-radius:50%;display:flex;align-items:center;justify-content:center;
        font-size:14px;border:2.5px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);" aria-hidden="true">${symbol}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });
  }

  function drawMainRoute(route) {
    if (mainRouteLayer) map.removeLayer(mainRouteLayer);
    const pts = route.waypoints.map(p => [p.lat, p.lng]);
    mainRouteLayer = L.polyline(pts, {
      color: '#0d9488', weight: 5, opacity: 0.9, lineCap: 'round'
    }).addTo(map);

    // Origin
    L.marker([route.waypoints[0].lat, route.waypoints[0].lng], {
      icon: makeIcon('#1e3a5f', '⊙')
    }).addTo(map).bindPopup(`<strong>${route.origin}</strong><br>Current Location`);

    // Destination
    const last = route.waypoints[route.waypoints.length - 1];
    L.marker([last.lat, last.lng], {
      icon: makeIcon('#dc2626', '★')
    }).addTo(map).bindPopup(`<strong>${route.destination}</strong><br>Destination`);
  }

  function drawAltRoute() {
    if (altRouteLayer) map.removeLayer(altRouteLayer);
    const pts = AR_DATA.routes[2].waypoints.map(p => [p.lat, p.lng]);
    altRouteLayer = L.polyline(pts, {
      color: '#94a3b8', weight: 3, opacity: 0.6,
      dashArray: '8 6'
    }).addTo(map).bindPopup('Alternative route – Least Walking');
  }

  function addFacilityMarkers() {
    const colors = {
      elevator: '#2563eb',
      ramp:     '#16a34a',
      toilet:   '#7c3aed',
      bus:      '#d97706',
      crossing: '#0d9488',
      footpath: '#c2410c'
    };
    const symbols = {
      elevator: '▲', ramp: '↗', toilet: '⊕', bus: '⊡', crossing: '↔', footpath: '—'
    };

    markerLayers = {};
    AR_DATA.facilities.forEach(f => {
      const color = f.status === 'unavailable' ? '#dc2626'
                  : f.status === 'limited'     ? '#d97706'
                  : colors[f.type] || '#64748b';

      const marker = L.marker([f.lat, f.lng], {
        icon: makeIcon(color, symbols[f.type] || '●')
      }).addTo(map).bindPopup(`
        <strong>${f.name}</strong><br>
        Status: <span style="color:${color};font-weight:600;">${f.status}</span><br>
        ${f.verified ? '✓ Verified' : '◉ Community report'}<br>
        <small style="color:#64748b;">Updated: ${new Date(f.lastUpdated).toLocaleTimeString()}</small>
      `);

      if (!markerLayers[f.type]) markerLayers[f.type] = [];
      markerLayers[f.type].push(marker);
    });
  }

  function addTransportMarkers() {
    AR_DATA.mapMarkers.busStops.forEach(stop => {
      L.marker([stop.lat, stop.lng], {
        icon: makeIcon('#d97706', '⊡')
      }).addTo(map).bindPopup(`<strong>${stop.label}</strong>`);
    });
  }

  function toggleMapFilter(type) {
    if (!markerLayers[type]) return;
    filterState[type] = !filterState[type];
    markerLayers[type].forEach(m => {
      filterState[type] ? m.addTo(map) : map.removeLayer(m);
    });
    const btnId = type === 'elevator' ? 'btn-filter-elevators' : 'btn-filter-ramps';
    const btn = document.getElementById(btnId);
    if (btn) btn.classList.toggle('btn-accent', filterState[type]);
    AR_toast(`${type.charAt(0).toUpperCase()+type.slice(1)} markers ${filterState[type] ? 'shown' : 'hidden'}.`, 'info');
  }

  function centerMap() {
    if (!map) return;
    map.setView([18.5284, 73.8742], 15);
    AR_toast('Map centred on your location.', 'info', 'Location');
  }

  // ── Charts ─────────────────────────────────────────────
  function initCharts() {
    const d = AR_DATA.charts;
    const font = { family: 'Inter, sans-serif', size: 12 };

    // 1. Facility Availability – stacked bar
    new Chart(document.getElementById('chart-facilities'), {
      type: 'bar',
      data: {
        labels: d.facilityAvailability.labels,
        datasets: [
          { label: 'Available', data: d.facilityAvailability.available, backgroundColor: '#16a34a', borderRadius: 4 },
          { label: 'Limited',   data: d.facilityAvailability.limited,   backgroundColor: '#d97706', borderRadius: 4 },
          { label: 'Unavailable', data: d.facilityAvailability.unavailable, backgroundColor: '#dc2626', borderRadius: 4 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        plugins: { legend: { position: 'top', labels: { font } } },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { font } },
          y: { stacked: true, beginAtZero: true, ticks: { font, stepSize: 2 }, grid: { color: '#e2e8f0' } }
        }
      }
    });

    // 2. Weekly Journeys – combo bar + line
    new Chart(document.getElementById('chart-weekly'), {
      type: 'bar',
      data: {
        labels: d.weeklyJourneys.labels,
        datasets: [
          {
            label: 'Journeys', data: d.weeklyJourneys.journeys,
            backgroundColor: 'rgba(30,58,95,0.15)', borderColor: '#1e3a5f',
            borderWidth: 2, borderRadius: 6, yAxisID: 'y'
          },
          {
            label: 'Avg Score %', data: d.weeklyJourneys.avgScore,
            type: 'line', borderColor: '#0d9488', backgroundColor: 'rgba(13,148,136,0.1)',
            borderWidth: 2.5, tension: 0.4, fill: true, pointRadius: 4,
            pointBackgroundColor: '#0d9488', yAxisID: 'y2'
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        plugins: { legend: { position: 'top', labels: { font } } },
        scales: {
          x: { grid: { display: false }, ticks: { font } },
          y:  { position: 'left',  beginAtZero: true, grid: { color: '#e2e8f0' }, ticks: { font } },
          y2: { position: 'right', min: 60, max: 100, grid: { display: false }, ticks: { font, callback: v => v + '%' } }
        }
      }
    });

    // 3. Journey Breakdown – doughnut
    new Chart(document.getElementById('chart-breakdown'), {
      type: 'doughnut',
      data: {
        labels: d.journeyBreakdown.labels,
        datasets: [{ data: d.journeyBreakdown.values, backgroundColor: d.journeyBreakdown.colors, borderWidth: 2, borderColor: '#fff' }]
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        cutout: '60%',
        plugins: {
          legend: { position: 'right', labels: { font, padding: 14 } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}%` } }
        }
      }
    });

    // 4. Accessibility Status – horizontal bar
    new Chart(document.getElementById('chart-status'), {
      type: 'bar',
      data: {
        labels: d.accessibilityStatus.labels,
        datasets: [{
          label: 'Availability %',
          data: d.accessibilityStatus.values,
          backgroundColor: d.accessibilityStatus.values.map(v => v >= 90 ? '#16a34a' : v >= 75 ? '#d97706' : '#dc2626'),
          borderRadius: 6
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, max: 100, grid: { color: '#e2e8f0' }, ticks: { font, callback: v => v + '%' } },
          y: { grid: { display: false }, ticks: { font } }
        }
      }
    });
  }

  // ── Activity Timeline ──────────────────────────────────
  function renderTimeline(items) {
    const container = document.getElementById('activity-timeline');
    if (!container) return;
    container.innerHTML = '';

    const typeMap = {
      success: { cls: 'success', icon: 'fa-circle-check' },
      warning: { cls: 'warning', icon: 'fa-triangle-exclamation' },
      info:    { cls: 'info',    icon: 'fa-rotate' },
      danger:  { cls: 'danger',  icon: 'fa-circle-xmark' }
    };

    items.forEach(item => {
      const t = typeMap[item.type] || typeMap.info;
      const el = document.createElement('div');
      el.className = 'timeline-item';
      el.innerHTML = `
        <div class="timeline-dot ${t.cls}" aria-hidden="true">
          <i class="fa-solid ${t.icon}"></i>
        </div>
        <div class="timeline-content">
          <div class="timeline-time">${item.time}</div>
          <div class="timeline-message">${item.message}</div>
        </div>
      `;
      container.appendChild(el);
    });
  }

  // ── Rerouting Demo ─────────────────────────────────────
  function triggerDisruption() {
    if (disruptionActive) return;
    disruptionActive = true;

    // Update facility status in data
    const elev = getFacilityById('f002');
    if (elev) elev.status = 'unavailable';

    // Show disruption banner
    const banner = document.getElementById('disruption-banner');
    if (banner) banner.classList.add('visible');

    // Toast + voice
    AR_toast('Station Elevator #2 has become unavailable.', 'danger', 'Infrastructure Alert', 8000);
    AR_speak('Warning. Elevator unavailable. Please recalculate your accessible route.');

    // Update stat card
    const disStat = document.getElementById('stat-disruptions');
    const dissMeta = document.getElementById('stat-disruptions-meta');
    if (disStat) disStat.textContent = '3';
    if (dissMeta) dissMeta.textContent = '2 affecting your route';

    // Add to timeline
    const now = new Date();
    AR_DATA.timeline.push({
      id: 'tl_auto', time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      icon: 'warning', type: 'warning', message: 'Elevator #2 unavailable – disruption detected'
    });
    renderTimeline(AR_DATA.timeline);
  }

  function recalculateRoute() {
    if (rerouteComplete) return;
    rerouteComplete = true;

    const banner = document.getElementById('disruption-banner');
    const success = document.getElementById('reroute-success');

    if (banner) banner.classList.remove('visible');

    // Update route info on page
    currentRoute = reroutedRoute;
    document.getElementById('jc-eta')     && (document.getElementById('jc-eta').textContent     = '29');
    document.getElementById('jc-score')   && (document.getElementById('jc-score').textContent   = '92%');
    document.getElementById('route-eta')  && (document.getElementById('route-eta').textContent  = '29');
    document.getElementById('stat-score') && (document.getElementById('stat-score').textContent = '92%');
    document.getElementById('stat-journey-meta') && (document.getElementById('stat-journey-meta').textContent = 'ETA: 29 min · Step-free');

    // Score ring
    animateScoreRing(92);

    // Elevator check becomes warning
    const elevCheck = document.getElementById('elevator-check');
    if (elevCheck) {
      elevCheck.className = 'access-check-item no';
      elevCheck.innerHTML = '<i class="fa-solid fa-circle-xmark" aria-hidden="true"></i> Elevator #2 unavailable – using ramp';
    }

    // Redraw map route
    drawMainRoute(reroutedRoute);

    // Show success banner
    if (success) success.classList.add('visible');

    // Toast + voice
    AR_toast('Route recalculated. New accessible route found via North Exit ramp.', 'success', 'Route Recalculated', 6000);
    AR_speak('Route recalculated. Alternative accessible route found. New estimated time: 29 minutes.');

    // Timeline update
    const now = new Date();
    AR_DATA.timeline.push({
      id: 'tl_reroute', time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      icon: 'sync', type: 'info', message: 'Route recalculated – alternative accessible route via North Exit'
    });
    AR_DATA.timeline.push({
      id: 'tl_confirm', time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      icon: 'check', type: 'success', message: 'Accessible alternative confirmed – 92% accessibility score'
    });
    renderTimeline(AR_DATA.timeline);

    // Reset disruptions stat
    document.getElementById('stat-disruptions') && (document.getElementById('stat-disruptions').textContent = '2');
    document.getElementById('stat-disruptions-meta') && (document.getElementById('stat-disruptions-meta').textContent = '0 affecting new route');
    const badge = document.getElementById('stat-disruptions-badge');
    if (badge) {
      badge.className = 'stat-badge success';
      badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Route clear';
    }
  }

  // ── Score Ring Animation ───────────────────────────────
  function animateScoreRing(score) {
    const fill   = document.getElementById('score-ring-fill');
    const number = document.getElementById('score-ring-number');
    if (!fill || !number) return;
    const circumference = 2 * Math.PI * 35; // r=35
    const offset = circumference - (score / 100) * circumference;
    fill.style.strokeDasharray  = circumference;
    fill.style.strokeDashoffset = offset;
    number.textContent = score + '%';
  }

  // ── Simulated Real-time Updates ───────────────────────
  function startRealTimeSimulation() {
    let tick = 0;

    simInterval = setInterval(() => {
      tick++;

      // After ~18 seconds, trigger the elevator disruption demo
      if (tick === 3 && !disruptionActive) {
        triggerDisruption();
        return;
      }

      // Randomly update a non-critical facility every ~30s
      if (tick % 5 === 0) {
        const nonCritical = AR_DATA.facilities.filter(f => f.id !== 'f002');
        const random = nonCritical[Math.floor(Math.random() * nonCritical.length)];
        const statuses = ['available', 'available', 'available', 'limited'];
        const prevStatus = random.status;
        random.status = statuses[Math.floor(Math.random() * statuses.length)];
        random.lastUpdated = new Date().toISOString();
        if (prevStatus !== random.status) {
          AR_toast(`${random.name} status updated to ${random.status}.`, 'info', 'Facility Update');
        }
      }

      // Animate progress bar
      const fill = document.getElementById('journey-progress-fill');
      if (fill) {
        const current = parseInt(fill.style.width) || 35;
        const next = Math.min(current + 2, 95);
        fill.style.width = next + '%';
        const progressBar = fill.closest('[role="progressbar"]');
        if (progressBar) progressBar.setAttribute('aria-valuenow', next);
      }

    }, 6000); // every 6s (3 ticks = ~18s for disruption)
  }

  // ── Greeting by time ──────────────────────────────────
  function setGreeting() {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning'
                   : hour < 17 ? 'Good afternoon'
                   : 'Good evening';
    const el = document.getElementById('dashboard-greeting');
    if (el) el.textContent = `${greeting}, ${AR_DATA.user.name} 👋`;
  }

  // ── Init ──────────────────────────────────────────────
  function init() {
    setGreeting();
    initMap();
    initCharts();
    renderTimeline(AR_DATA.timeline);
    animateScoreRing(94);
    startRealTimeSimulation();
  }

  document.addEventListener('DOMContentLoaded', init);

  // Public API
  return { toggleMapFilter, centerMap, recalculateRoute, triggerDisruption };

})();
