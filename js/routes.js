/* ============================================================
   AccessRoute – routes.js
   Route planning interactions, map rendering, and results.
   ============================================================ */

'use strict';

const AR_Routes = (() => {

  let routeMap = null;
  let routeLayers = [];
  let selectedRouteId = null;

  // ── Map Setup ──────────────────────────────────────────
  function initRouteMap() {
    const el = document.getElementById('route-map');
    if (!el) return;

    routeMap = L.map('route-map', {
      center: [18.522, 73.860],
      zoom: 13,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(routeMap);

    // Draw default accessible route
    drawRouteOnMap(AR_DATA.routes[0], '#0d9488', true);
  }

  function clearRouteLayers() {
    routeLayers.forEach(l => routeMap && routeMap.removeLayer(l));
    routeLayers = [];
  }

  function drawRouteOnMap(route, color, primary) {
    if (!routeMap) return;
    const pts = route.waypoints.map(p => [p.lat, p.lng]);
    const line = L.polyline(pts, {
      color,
      weight: primary ? 5 : 3,
      opacity: primary ? 0.9 : 0.5,
      dashArray: primary ? null : '8 5'
    }).addTo(routeMap);
    routeLayers.push(line);

    if (primary) {
      const mkOrigin = L.circleMarker([route.waypoints[0].lat, route.waypoints[0].lng], {
        radius: 9, color: '#1e3a5f', fillColor: '#1e3a5f', fillOpacity: 1, weight: 2
      }).addTo(routeMap).bindPopup(`<strong>${route.origin}</strong>`);

      const last = route.waypoints[route.waypoints.length - 1];
      const mkDest = L.circleMarker([last.lat, last.lng], {
        radius: 9, color: '#dc2626', fillColor: '#dc2626', fillOpacity: 1, weight: 2
      }).addTo(routeMap).bindPopup(`<strong>${route.destination}</strong>`);

      routeLayers.push(mkOrigin, mkDest);
      routeMap.fitBounds(line.getBounds(), { padding: [30, 30] });
    }
  }

  // ── Find Routes ────────────────────────────────────────
  function findRoutes() {
    const from = document.getElementById('input-from');
    const to   = document.getElementById('input-to');

    if (!to || !to.value.trim()) {
      AR_toast('Please enter a destination.', 'warning', 'Missing Destination');
      to && to.focus();
      return;
    }

    // Show loading
    const loading = document.getElementById('routes-loading');
    const results = document.getElementById('route-results');
    if (loading) loading.style.display = 'block';
    if (results) results.innerHTML = '';

    AR_speak('Calculating accessible routes. Please wait.');

    // Read preferences from form
    const stepFree  = document.getElementById('req-stepfree')?.checked;
    const lowFloor  = document.getElementById('req-lowfloor')?.checked;
    const transport = document.querySelector('input[name="transport"]:checked')?.value || 'mostAccessible';

    // Simulate async route calculation
    setTimeout(() => {
      if (loading) loading.style.display = 'none';

      // Sort routes by transport preference
      let sorted = [...AR_DATA.routes].filter(r => r.id !== 'r004');
      if (transport === 'fastest')       sorted.sort((a, b) => a.duration - b.duration);
      else if (transport === 'leastWalking') sorted.sort((a, b) => parseFloat(a.walkingDistance) - parseFloat(b.walkingDistance));
      else sorted.sort((a, b) => b.accessibilityScore - a.accessibilityScore);

      // Filter by step-free if required
      if (stepFree) sorted = sorted.filter(r => r.stepFree);
      if (!sorted.length) sorted = AR_DATA.routes.slice(0, 3);

      renderRouteResults(sorted);
      drawAllRoutes(sorted);

      AR_toast('Accessible routes found.', 'success', 'Routes Ready');
      AR_speak(`Found ${sorted.length} accessible routes. Top route: ${sorted[0].label}, ${sorted[0].duration} minutes.`);
    }, 1400);
  }

  function drawAllRoutes(routes) {
    clearRouteLayers();
    const colours = ['#0d9488', '#94a3b8', '#3b82f6'];
    routes.forEach((route, i) => drawRouteOnMap(route, colours[i] || '#94a3b8', i === 0));
  }

  // ── Render Route Cards ─────────────────────────────────
  function renderRouteResults(routes) {
    const container = document.getElementById('route-results');
    if (!container) return;
    container.innerHTML = '';

    routes.forEach((route, index) => {
      const scoreClass = AR_scoreClass(route.accessibilityScore);
      const isFirst    = index === 0;

      const card = document.createElement('div');
      card.className = `route-result-card${isFirst ? ' selected recommended' : ''}`;
      card.setAttribute('role', 'listitem');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Route option: ${route.label}, ${route.duration} minutes, ${route.accessibilityScore}% accessible`);
      card.dataset.routeId = route.id;

      card.innerHTML = `
        <div class="rr-header">
          <div>
            <div class="rr-label">${route.label}</div>
            <div style="font-size:0.75rem;color:var(--color-text-muted);margin-top:2px;">
              ${route.origin} → ${route.destination}
            </div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.25rem;">
            ${isFirst ? '<span class="rr-tag best">✓ Recommended</span>' : ''}
            ${route.disruptions > 0 ? `<span class="rr-tag" style="background:var(--color-warning-bg);color:var(--color-warning);">⚠ ${route.disruptions} Disruption</span>` : ''}
          </div>
        </div>

        <div class="rr-stats">
          <div class="rr-stat"><span class="rr-stat-val">${route.duration}</span><span class="rr-stat-label">min</span></div>
          <div class="rr-stat"><span class="rr-stat-val">${route.walkingDistance}</span><span class="rr-stat-label">walking</span></div>
          <div class="rr-stat"><span class="rr-stat-val">${route.transfers}</span><span class="rr-stat-label">transfer${route.transfers !== 1 ? 's' : ''}</span></div>
          <div class="rr-stat"><span class="rr-stat-val">${route.accessibilityScore}%</span><span class="rr-stat-label">accessible</span></div>
        </div>

        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem;">
          <div class="score-bar" style="flex:1;">
            <div class="score-bar-fill ${scoreClass}" style="width:${route.accessibilityScore}%;"></div>
          </div>
          <span style="font-size:0.75rem;font-weight:600;color:var(--color-${scoreClass === 'high' ? 'success' : scoreClass === 'medium' ? 'warning' : 'danger'});">
            ${route.accessibilityScore}% accessible
          </span>
        </div>

        <div class="rr-features" role="list" aria-label="Accessibility features">
          <span class="rr-feature ${route.stepFree ? 'yes' : 'no'}" role="listitem">
            <i class="fa-solid ${route.stepFree ? 'fa-circle-check' : 'fa-circle-xmark'}" aria-hidden="true"></i> Step-free
          </span>
          <span class="rr-feature ${route.elevatorAvailable ? 'yes' : 'no'}" role="listitem">
            <i class="fa-solid ${route.elevatorAvailable ? 'fa-circle-check' : 'fa-circle-xmark'}" aria-hidden="true"></i> Elevator
          </span>
          <span class="rr-feature ${route.lowFloorTransport ? 'yes' : 'no'}" role="listitem">
            <i class="fa-solid ${route.lowFloorTransport ? 'fa-circle-check' : 'fa-circle-xmark'}" aria-hidden="true"></i> Low-floor bus
          </span>
          <span class="rr-feature ${route.rampAvailable ? 'yes' : 'no'}" role="listitem">
            <i class="fa-solid ${route.rampAvailable ? 'fa-circle-check' : 'fa-circle-xmark'}" aria-hidden="true"></i> Ramp
          </span>
          <span class="rr-feature ${route.accessibleToilet ? 'yes' : 'warn'}" role="listitem">
            <i class="fa-solid ${route.accessibleToilet ? 'fa-circle-check' : 'fa-triangle-exclamation'}" aria-hidden="true"></i> Accessible toilet
          </span>
        </div>

        ${route.disruptions > 0 ? `
        <div class="rr-disruption" role="alert">
          <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
          ${route.disruptions} known disruption on this route. May affect journey.
        </div>` : ''}

        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
          <button class="btn btn-accent" style="flex:1;" onclick="AR_Routes.startJourney('${route.id}')" aria-label="Start journey on ${route.label}">
            <i class="fa-solid fa-play" aria-hidden="true"></i> Start Journey
          </button>
          <button class="btn btn-outline btn-sm" onclick="AR_Routes.selectRoute('${route.id}')" aria-label="Preview ${route.label} on map">
            <i class="fa-solid fa-map" aria-hidden="true"></i> Preview
          </button>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (!e.target.closest('button')) AR_Routes.selectRoute(route.id);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') AR_Routes.selectRoute(route.id);
      });

      container.appendChild(card);
    });
  }

  // ── Select Route ───────────────────────────────────────
  function selectRoute(routeId) {
    selectedRouteId = routeId;
    const route = AR_DATA.routes.find(r => r.id === routeId);
    if (!route) return;

    // Highlight selected card
    document.querySelectorAll('.route-result-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.routeId === routeId);
    });

    // Redraw map with selected route as primary
    const others = AR_DATA.routes.filter(r => r.id !== routeId && r.id !== 'r004');
    clearRouteLayers();
    drawRouteOnMap(route, '#0d9488', true);
    others.slice(0, 2).forEach(r => drawRouteOnMap(r, '#94a3b8', false));

    AR_toast(`Route selected: ${route.label}`, 'info', 'Route Selected');
  }

  // ── Start Journey ──────────────────────────────────────
  function startJourney(routeId) {
    const route = AR_DATA.routes.find(r => r.id === routeId) || AR_DATA.routes[0];
    AR_speak(`Starting journey. ${route.label}. Estimated time: ${route.duration} minutes. ${route.stepFree ? 'This is a step-free route.' : ''}`);
    AR_toast(`Journey started: ${route.label}. ETA ${route.duration} min.`, 'success', 'Journey Started', 6000);

    setTimeout(() => {
      AR_speak('Continue straight for 200 meters to reach the bus stop.');
    }, 3000);
  }

  // ── Swap Locations ─────────────────────────────────────
  function swapLocations() {
    const from = document.getElementById('input-from');
    const to   = document.getElementById('input-to');
    if (!from || !to) return;
    const temp = from.value;
    from.value = to.value;
    to.value = temp;
    AR_toast('Origin and destination swapped.', 'info');
  }

  // ── Radio styling ──────────────────────────────────────
  function initRadioGroup() {
    document.querySelectorAll('.radio-option input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', () => {
        document.querySelectorAll('.radio-option').forEach(opt => opt.classList.remove('selected'));
        radio.closest('.radio-option').classList.add('selected');
      });
    });
  }

  // ── Init ──────────────────────────────────────────────
  function init() {
    initRouteMap();
    initRadioGroup();
  }

  document.addEventListener('DOMContentLoaded', init);

  return { findRoutes, selectRoute, startJourney, swapLocations };
})();
