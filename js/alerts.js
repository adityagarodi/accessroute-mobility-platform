/* ============================================================
   AccessRoute – alerts.js
   Alert rendering, filtering, simulated updates, rerouting demo.
   ============================================================ */

'use strict';

const AR_Alerts = (() => {

  let activeFilter = 'all';

  const typeIcons = {
    facility:  'fa-elevator',
    community: 'fa-people-group',
    transport: 'fa-bus',
    weather:   'fa-cloud-rain'
  };

  // ── Render Alerts ──────────────────────────────────────
  function render() {
    const list = document.getElementById('alerts-list');
    if (!list) return;

    let data = getActiveAlerts();

    if (activeFilter === 'high')   data = data.filter(a => a.severity === 'high');
    else if (activeFilter === 'medium') data = data.filter(a => a.severity === 'medium');
    else if (activeFilter === 'low')    data = data.filter(a => a.severity === 'low');
    else if (activeFilter === 'route')  data = data.filter(a => a.affectsRoute);

    list.innerHTML = '';

    if (!data.length) {
      list.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-bell-slash" aria-hidden="true"></i>
          <h3>No active alerts</h3>
          <p>All accessibility infrastructure on your route is currently operational.</p>
        </div>`;
      return;
    }

    data.forEach(alert => {
      const card = document.createElement('div');
      card.className = `alert-card severity-${alert.severity}`;
      card.setAttribute('role', 'listitem');
      card.id = `alert-${alert.id}`;

      const icon = typeIcons[alert.type] || 'fa-circle-info';
      const detectedAgo = timeAgo(alert.detectedAt);

      card.innerHTML = `
        <div class="alert-header">
          <div style="display:flex;align-items:flex-start;gap:0.75rem;flex:1;">
            <div style="width:36px;height:36px;border-radius:var(--radius-md);
              background:${alert.severity==='high'?'var(--color-danger-bg)':alert.severity==='medium'?'var(--color-warning-bg)':'var(--color-success-bg)'};
              display:flex;align-items:center;justify-content:center;flex-shrink:0;" aria-hidden="true">
              <i class="fa-solid ${icon}"
                style="color:${alert.severity==='high'?'var(--color-danger)':alert.severity==='medium'?'var(--color-warning)':'var(--color-success)'};">
              </i>
            </div>
            <div style="flex:1;">
              <div class="alert-title">${alert.title}</div>
            </div>
          </div>
          <span class="severity-badge ${alert.severity}" aria-label="Severity: ${alert.severity}">${alert.severity.toUpperCase()}</span>
        </div>

        <div class="alert-meta">
          <span class="alert-meta-item">
            <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
            ${alert.location}
          </span>
          <span class="alert-meta-item">
            <i class="fa-regular fa-clock" aria-hidden="true"></i>
            ${detectedAgo}
          </span>
          <span class="alert-meta-item">
            <i class="fa-solid fa-tag" aria-hidden="true"></i>
            ${alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
          </span>
        </div>

        <p class="alert-message">${alert.message}</p>

        ${alert.affectsRoute ? `
        <div class="alert-route-impact" role="alert">
          <i class="fa-solid fa-route" aria-hidden="true"></i>
          <strong>Your current route is affected.</strong>
        </div>` : ''}

        <div class="alert-actions">
          ${alert.affectsRoute ? `
          <a href="routes.html" class="btn btn-danger btn-sm" aria-label="Recalculate route due to ${alert.title}">
            <i class="fa-solid fa-rotate" aria-hidden="true"></i>
            <span data-i18n="recalculate">Recalculate Route</span>
          </a>` : ''}
          <button class="btn btn-outline btn-sm" onclick="AR_Alerts.viewDetails('${alert.id}')" aria-label="View details for ${alert.title}">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span data-i18n="viewDetails">View Details</span>
          </button>
          <button class="btn btn-outline btn-sm" onclick="AR_Alerts.dismissAlert('${alert.id}')" aria-label="Dismiss alert: ${alert.title}">
            <i class="fa-solid fa-xmark" aria-hidden="true"></i> Dismiss
          </button>
        </div>
      `;

      list.appendChild(card);
    });
  }

  // ── Filters ────────────────────────────────────────────
  function filter(type) {
    activeFilter = type;
    document.querySelectorAll('[data-alert-filter]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-alert-filter') === type);
    });
    render();
  }

  // ── Dismiss ────────────────────────────────────────────
  function dismissAlert(alertId) {
    const alert = AR_DATA.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'resolved';
      AR_toast(`Alert dismissed: "${alert.title}"`, 'success', 'Alert Dismissed');
      AR_updateAlertBadge();
      render();
    }
  }

  function dismissAll() {
    AR_DATA.alerts.forEach(a => { a.status = 'resolved'; });
    AR_toast('All alerts marked as read.', 'success', 'Alerts Cleared');
    AR_updateAlertBadge();
    render();
  }

  // ── View Details ───────────────────────────────────────
  function viewDetails(alertId) {
    const alert = AR_DATA.alerts.find(a => a.id === alertId);
    if (!alert) return;
    const facility = alert.affectedFacilityId ? getFacilityById(alert.affectedFacilityId) : null;
    AR_toast(
      `${alert.message}${facility ? ` Last updated: ${timeAgo(facility.lastUpdated)}.` : ''}`,
      alert.severity === 'high' ? 'danger' : alert.severity === 'medium' ? 'warning' : 'info',
      alert.title,
      7000
    );
    if (AR_voiceEnabled) AR_speak(alert.message);
  }

  // ── Rerouting Demo ─────────────────────────────────────
  function triggerDemo() {
    const step1 = document.getElementById('demo-step-1');
    const step2 = document.getElementById('demo-step-2');
    const btn   = document.getElementById('btn-trigger-demo');

    if (btn) btn.disabled = true;

    // Update facility
    const elev = getFacilityById('f002');
    if (elev) {
      elev.status = 'unavailable';
      elev.lastUpdated = new Date().toISOString();
    }

    // Add new alert to list
    const newAlert = {
      id: 'a_demo',
      title: 'Station Elevator #2 Unavailable',
      severity: 'high',
      type: 'facility',
      location: 'Pune Station – Platform 3/4',
      affectedFacilityId: 'f002',
      detectedAt: new Date().toISOString(),
      affectsRoute: true,
      affectedRouteId: 'r001',
      message: 'Elevator #2 at Pune Station (Platform 3–4) just went out of service. Your route via Platform 3 is no longer accessible.',
      status: 'active',
      actionTaken: false
    };
    AR_DATA.alerts.unshift(newAlert);
    AR_updateAlertBadge();
    render();

    // Toast + voice
    AR_toast('Station Elevator #2 has become unavailable. Your route is affected.', 'danger', 'Infrastructure Alert', 8000);
    AR_speak('Warning. Elevator unavailable. Your current accessible route is no longer available. Please recalculate.');

    // Transition steps
    setTimeout(() => {
      step1 && step1.classList.add('hidden');
      step2 && step2.classList.remove('hidden');
      step2 && step2.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 800);
  }

  function recalculateDemo() {
    const step2 = document.getElementById('demo-step-2');
    const step3 = document.getElementById('demo-step-3');

    step2 && step2.classList.add('hidden');
    step3 && step3.classList.remove('hidden');
    step3 && step3.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    AR_toast('Route recalculated. New accessible route via North Exit Ramp found.', 'success', 'Route Recalculated', 6000);
    AR_speak('Route recalculated. Alternative accessible route found via North Exit ramp. New estimated time is 29 minutes. Accessibility score: 92 percent.');
  }

  function resetDemo() {
    const step1 = document.getElementById('demo-step-1');
    const step2 = document.getElementById('demo-step-2');
    const step3 = document.getElementById('demo-step-3');
    const btn   = document.getElementById('btn-trigger-demo');

    step1 && step1.classList.remove('hidden');
    step2 && step2.classList.add('hidden');
    step3 && step3.classList.add('hidden');
    if (btn) btn.disabled = false;

    // Restore elevator
    const elev = getFacilityById('f002');
    if (elev) elev.status = 'unavailable'; // keep as-is

    // Remove demo alert
    const idx = AR_DATA.alerts.findIndex(a => a.id === 'a_demo');
    if (idx > -1) AR_DATA.alerts.splice(idx, 1);
    AR_updateAlertBadge();
    render();

    AR_toast('Demo reset. Ready to simulate again.', 'info', 'Demo Reset');
  }

  // ── Simulated New Alert ────────────────────────────────
  function startSimulation() {
    // Every 35 seconds, add a random community report
    setTimeout(() => {
      const newAlert = {
        id: `a_sim_${Date.now()}`,
        title: 'Community Report: Footpath Obstruction',
        severity: 'low',
        type: 'community',
        location: 'FC Road near Vaishali Hotel',
        affectedFacilityId: null,
        detectedAt: new Date().toISOString(),
        affectsRoute: false,
        message: 'Community report: A street vendor has temporarily blocked the accessible footpath near Vaishali Hotel on FC Road. An alternative path is available on the left side.',
        status: 'active',
        actionTaken: false
      };
      AR_DATA.alerts.push(newAlert);
      AR_updateAlertBadge();
      render();
      AR_toast('New community report: Footpath obstruction on FC Road.', 'warning', 'New Report');
    }, 35000);
  }

  // ── Init ──────────────────────────────────────────────
  function init() {
    render();
    startSimulation();
  }

  document.addEventListener('DOMContentLoaded', init);

  return { filter, dismissAlert, dismissAll, viewDetails, triggerDemo, recalculateDemo, resetDemo };
})();
