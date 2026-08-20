/* ============================================================
   AccessRoute — nav.js
   Injects shared sidebar + topbar into every app page.
   Call: injectNav('dashboard') before DOMContentLoaded runs.
   ============================================================ */
function injectNav(activePage, pageTitle){
  if(document.getElementById('sidebar')) return;
  const pageRoot=document.getElementById('page-root');
  if(!pageRoot) return;
  const pages=[
    {id:'dashboard',  href:'dashboard.html',  icon:'fa-gauge-high',    label:'Dashboard'},
    {id:'routes',     href:'routes.html',     icon:'fa-route',         label:'Plan Route'},
    {id:'map',        href:'map.html',        icon:'fa-map-location-dot',label:'Live Map'},
    {id:'iot',        href:'iot.html',        icon:'fa-microchip',     label:'IoT Monitoring'},
    {id:'facilities', href:'facilities.html', icon:'fa-building',      label:'Facilities'},
    {id:'transport',  href:'transport.html',  icon:'fa-bus',           label:'Transport'},
    {id:'alerts',     href:'alerts.html',     icon:'fa-bell',          label:'Live Alerts', badge:true},
    {id:'profile',    href:'profile.html',    icon:'fa-user-gear',     label:'Accessibility Profile'},
    {id:'analytics',  href:'analytics.html',  icon:'fa-chart-bar',     label:'Analytics'},
    {id:'settings',   href:'settings.html',   icon:'fa-sliders',       label:'Settings'},
  ];
  const support=[
    {id:'contact', href:'#', icon:'fa-heart', label:'Trusted Contact', action:"AR_shareJourney&&AR_shareJourney();return false;"},
    {id:'help',    href:'#', icon:'fa-circle-question', label:'Help & Support', action:"toast('Help centre coming soon.','info','Help');return false;"},
  ];

  const navItems=pages.map(p=>`
    <a href="${p.href}" class="nav-item${p.id===activePage?' active':''}" data-page="${p.href}" aria-label="${p.label}"${p.id===activePage?' aria-current="page"':''}>
      <span class="nav-icon"><i class="fa-solid ${p.icon}" aria-hidden="true"></i></span>
      <span class="nav-label">${p.label}</span>
      ${p.badge?`<span class="nav-badge alert-count" aria-label="active alerts" style="display:none"></span>`:''}
    </a>`).join('');

  const supportItems=support.map(s=>`
    <a href="${s.href}" class="nav-item" onclick="${s.action}" aria-label="${s.label}">
      <span class="nav-icon"><i class="fa-solid ${s.icon}" aria-hidden="true"></i></span>
      <span class="nav-label">${s.label}</span>
    </a>`).join('');

  const bnavItems=[
    {id:'dashboard',href:'dashboard.html',icon:'fa-gauge-high',label:'Home'},
    {id:'routes',   href:'routes.html',   icon:'fa-route',     label:'Routes'},
    {id:'iot',      href:'iot.html',      icon:'fa-microchip', label:'IoT'},
    {id:'alerts',   href:'alerts.html',   icon:'fa-bell',      label:'Alerts'},
    {id:'profile',  href:'profile.html',  icon:'fa-user-gear', label:'Profile'},
  ].map(p=>`<a href="${p.href}" class="bnav-item${p.id===activePage?' active':''}" data-page="${p.href}"><i class="fa-solid ${p.icon}"></i><span>${p.label}</span></a>`).join('');

  document.body.insertAdjacentHTML('afterbegin',`
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <div id="toast-container" aria-live="polite" aria-atomic="false"></div>
    <div id="sidebar-overlay" class="sidebar-overlay" aria-hidden="true"></div>

    <div class="app-shell">
      <aside id="sidebar" class="sidebar" aria-label="Main navigation">
        <div class="sidebar-logo">
          <div class="logo-icon" aria-hidden="true"><i class="fa-solid fa-route"></i></div>
          <div class="logo-text"><span class="logo-name">AccessRoute</span><span class="logo-tagline">Everyone included.</span></div>
        </div>
        <nav class="sidebar-nav" aria-label="Site navigation">
          <div class="nav-section-label">Main</div>
          ${navItems.split('</a>').slice(0,4).join('</a>')}
          <div class="nav-section-label">Monitoring</div>
          ${navItems.split('</a>').slice(4,7).join('</a>')}
          <div class="nav-section-label">Personal</div>
          ${navItems.split('</a>').slice(7).join('</a>')}
          <div class="nav-section-label">Support</div>
          ${supportItems}
        </nav>
        <div class="sidebar-bottom">
          <div class="sidebar-user" role="button" tabindex="0" onclick="window.location='profile.html'" aria-label="View profile">
            <div class="user-avatar" aria-hidden="true">A</div>
            <div><div class="user-name">Aditya</div><div class="user-role">Accessibility User</div></div>
          </div>
        </div>
      </aside>

      <div class="main-content" id="app-main-content">
        <header class="topbar" role="banner">
          <div class="topbar-left">
            <button id="hamburger-btn" class="hamburger" aria-label="Open navigation menu" aria-expanded="false" aria-controls="sidebar">
              <i class="fa-solid fa-bars" aria-hidden="true"></i>
            </button>
            <div class="topbar-title">${pageTitle||pages.find(p=>p.id===activePage)?.label||'AccessRoute'}</div>
          </div>
          <div class="topbar-right" style="display:flex;align-items:center;gap:.4rem;">
            <div style="display:flex;align-items:center;gap:.4rem;margin-right:.5rem;" class="hide-mobile">
              <span style="display:flex;align-items:center;gap:4px;font-size:.7rem;font-weight:600;color:var(--success);"><span class="status-dot sd-ok"></span> IoT</span>
              <span style="display:flex;align-items:center;gap:4px;font-size:.7rem;font-weight:600;color:var(--success);"><span class="status-dot sd-ok"></span> AI</span>
              <span style="display:flex;align-items:center;gap:4px;font-size:.7rem;font-weight:600;color:var(--success);"><span class="status-dot sd-ok"></span> GPS</span>
            </div>
            <button id="demo-mode-btn" class="btn btn-warning btn-sm" title="Toggle Demo Mode" aria-label="Toggle Demo Mode">⚪ Demo</button>
            <button id="voice-btn" class="icon-btn" title="Toggle voice guidance" aria-pressed="false" aria-label="Toggle voice guidance"><i class="fa-solid fa-volume-xmark" aria-hidden="true"></i></button>
            <a href="alerts.html" class="icon-btn" aria-label="View live alerts"><i class="fa-solid fa-bell" aria-hidden="true"></i><span class="bdot notif-dot" style="display:none;"></span></a>
            <a href="settings.html" class="icon-btn" aria-label="Settings"><i class="fa-solid fa-sliders" aria-hidden="true"></i></a>
          </div>
        </header>
      </div><!-- /main-content -->
    </div><!-- /app-shell -->

    <!-- Bottom Navigation -->
    <nav class="bottom-nav" aria-label="Mobile navigation">
      <div class="bnav-items">${bnavItems}</div>
    </nav>
  `);

  // The page content is parsed before this script. Move it into the shell
  // instead of relying on unmatched closing tags appended to the document.
  document.getElementById('app-main-content').appendChild(pageRoot);
}
