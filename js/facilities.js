/* ============================================================
   AccessRoute – facilities.js
   Facility filtering, search, rendering, and simulated updates.
   ============================================================ */

'use strict';

const AR_Facilities = (() => {

  let activeStatusFilter = 'all';
  let activeTypeFilter   = 'all';
  let activeSearch       = '';

  const typeLabels = {
    elevator: 'Elevator', ramp: 'Ramp', toilet: 'Accessible Toilet',
    bus: 'Low-floor Bus Stop', crossing: 'Pedestrian Crossing', footpath: 'Footpath'
  };

  // ── Render ─────────────────────────────────────────────
  function render() {
    const list  = document.getElementById('facilities-list');
    const empty = document.getElementById('facilities-empty');
    if (!list) return;

    let data = [...AR_FACILITIES];

    // Status filter
    if (activeStatusFilter === 'verified')  data = data.filter(f => f.verified);
    else if (activeStatusFilter === 'community') data = data.filter(f => !f.verified);
    else if (activeStatusFilter !== 'all')  data = data.filter(f => f.status === activeStatusFilter);

    // Type filter
    if (activeTypeFilter !== 'all') data = data.filter(f => f.type === activeTypeFilter);

    // Search
    if (activeSearch) {
      const q = activeSearch.toLowerCase();
      data = data.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.type.toLowerCase().includes(q) ||
        (f.notes || '').toLowerCase().includes(q)
      );
    }

    list.innerHTML = '';

    if (!data.length) {
      empty && empty.classList.remove('hidden');
      return;
    }
    empty && empty.classList.add('hidden');

    data.forEach(facility => {
      const card = document.createElement('div');
      card.className = 'facility-card';
      card.setAttribute('role', 'listitem');
      card.setAttribute('aria-label', `${facility.name}, ${facility.status}`);

      const statusClass = `status-${facility.status}`;
      const sourceHtml  = facility.verified
        ? `<span class="badge badge-verified"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Verified</span>`
        : `<span class="badge badge-community"><i class="fa-solid fa-circle" aria-hidden="true"></i> Community Report</span>`;

      const updatedAgo  = timeAgo(facility.lastUpdated);
      const iconClass   = facilityIcon(facility.type);
      const typeWrap    = facility.type;

      card.innerHTML = `
        <div class="facility-icon-wrap ${typeWrap}" aria-hidden="true">
          <i class="fa-solid ${iconClass}"></i>
        </div>

        <div class="facility-body">
          <div class="facility-name">${facility.name}</div>
          <div class="facility-location">
            <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
            ${facility.floor || typeLabels[facility.type] || facility.type}
          </div>
          ${facility.notes ? `<div class="facility-notes">${facility.notes}</div>` : ''}
          <div class="facility-meta">
            ${sourceHtml}
            <span class="text-xs text-muted">
              <i class="fa-regular fa-clock" aria-hidden="true"></i> ${updatedAgo}
            </span>
          </div>
        </div>

        <div class="facility-status-side">
          <span class="status-pill ${statusClass}" role="status" aria-label="Status: ${facility.status}">
            <span class="status-dot ${facility.status}" aria-hidden="true"></span>
            ${facility.status.charAt(0).toUpperCase() + facility.status.slice(1)}
          </span>
          <div class="facility-updated">${new Date(facility.lastUpdated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
          <button class="btn btn-outline btn-sm"
            onclick="AR_Facilities.reportIssue('${facility.id}')"
            aria-label="Report issue with ${facility.name}">
            <i class="fa-solid fa-flag" aria-hidden="true"></i> Report
          </button>
        </div>
      `;

      list.appendChild(card);
    });

    updateSummary();
  }

  // ── Filters ────────────────────────────────────────────
  function filter(status) {
    activeStatusFilter = status;
    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-filter') === status);
    });
    render();
  }

  function filterType(type) {
    activeTypeFilter = type;
    document.querySelectorAll('[data-type]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-type') === type);
    });
    render();
  }

  function search(query) {
    activeSearch = query;
    render();
  }

  function reset() {
    activeStatusFilter = 'all';
    activeTypeFilter   = 'all';
    activeSearch       = '';
    const searchInput  = document.getElementById('facility-search');
    if (searchInput) searchInput.value = '';
    document.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('active', b.getAttribute('data-filter') === 'all'));
    document.querySelectorAll('[data-type]').forEach(b => b.classList.toggle('active', b.getAttribute('data-type') === 'all'));
    render();
  }

  // ── Summary badges ────────────────────────────────────
  function updateSummary() {
    const avail  = AR_FACILITIES.filter(f => f.status === 'available').length;
    const limited = AR_FACILITIES.filter(f => f.status === 'limited').length;
    const unavail = AR_FACILITIES.filter(f => f.status === 'unavailable').length;

    const sa = document.getElementById('summary-available');
    const sl = document.getElementById('summary-limited');
    const su = document.getElementById('summary-unavail');
    if (sa) sa.innerHTML = `<span class="status-dot available" aria-hidden="true"></span> ${avail} Available`;
    if (sl) sl.innerHTML = `<span class="status-dot limited"   aria-hidden="true"></span> ${limited} Limited`;
    if (su) su.innerHTML = `<span class="status-dot unavailable" aria-hidden="true"></span> ${unavail} Unavailable`;
  }

  // ── Report Issue ───────────────────────────────────────
  function reportIssue(facilityId) {
    const facility = AR_FACILITIES.find(f => f.id === facilityId);
    if (!facility) return;
    toast(`Report submitted for "${facility.name}". Thank you for helping keep the map accurate.`, 'success', 'Report Submitted');
  }

  // ── Simulated Real-time Updates ───────────────────────
  function startSimulation() {
    setInterval(() => {
      const facilities = AR_FACILITIES;
      const idx = Math.floor(Math.random() * facilities.length);
      const f   = facilities[idx];
      const prev = f.status;
      const statuses = ['available', 'available', 'available', 'limited', 'unavailable'];
      f.status = statuses[Math.floor(Math.random() * statuses.length)];
      f.lastUpdated = new Date().toISOString();

      if (prev !== f.status) {
        toast(`${f.name} is now ${f.status}.`,
          f.status === 'unavailable' ? 'danger' : f.status === 'limited' ? 'warning' : 'success',
          'Facility Update');
        render();
      }
    }, 22000);
  }

  // ── Init ──────────────────────────────────────────────
  function init() {
    render();
    startSimulation();
  }

  document.addEventListener('DOMContentLoaded', init);

  return { filter, filterType, search, reset, reportIssue, render };
})();
