/* ============================================================
   AccessRoute – app.js
   Shared utilities: sidebar, toast, voice guidance, translations,
   settings application, and page bootstrap.
   Loaded on every page before page-specific scripts.
   ============================================================ */

'use strict';

// ── Translations ─────────────────────────────────────────
const AR_TRANSLATIONS = {
  en: {
    dashboard:        'Dashboard',
    planRoute:        'Plan Route',
    facilities:       'Facilities',
    liveAlerts:       'Live Alerts',
    profile:          'Accessibility Profile',
    settings:         'Settings',
    helpSupport:      'Help & Support',
    trustedContact:   'Trusted Contact',
    findRoute:        'Find Accessible Route',
    startJourney:     'Start Journey',
    recalculate:      'Recalculate Route',
    viewDetails:      'View Details',
    shareJourney:     'Share Journey',
    shareLocation:    'Share Location',
    sendAlert:        'Send Alert',
    available:        'Available',
    limited:          'Limited',
    unavailable:      'Unavailable',
    verified:         'Verified',
    communityReport:  'Community Report',
    needsVerify:      'Needs Verification',
    stepFree:         'Step-free',
    lowFloor:         'Low-floor transport',
    elevatorOK:       'Elevator available',
    accessible:       'Accessible station',
    goodMorning:      'Good morning',
    yourOverview:     'Your personalized accessibility and mobility overview',
    activeJourney:    'Active Journey',
    accessScore:      'Accessibility Score',
    nearbyFacilities: 'Nearby Facilities',
    activeDisruptions:'Active Disruptions',
    searchPlaceholder:'Search facilities…',
  },
  hi: {
    dashboard:        'डैशबोर्ड',
    planRoute:        'रूट प्लान करें',
    facilities:       'सुविधाएं',
    liveAlerts:       'लाइव अलर्ट',
    profile:          'एक्सेसिबिलिटी प्रोफ़ाइल',
    settings:         'सेटिंग्स',
    helpSupport:      'सहायता',
    trustedContact:   'विश्वस्त संपर्क',
    findRoute:        'सुलभ रूट खोजें',
    startJourney:     'यात्रा शुरू करें',
    recalculate:      'रूट पुनः गणना करें',
    viewDetails:      'विवरण देखें',
    shareJourney:     'यात्रा साझा करें',
    shareLocation:    'स्थान साझा करें',
    sendAlert:        'अलर्ट भेजें',
    available:        'उपलब्ध',
    limited:          'सीमित',
    unavailable:      'अनुपलब्ध',
    verified:         'सत्यापित',
    communityReport:  'सामुदायिक रिपोर्ट',
    needsVerify:      'सत्यापन आवश्यक',
    stepFree:         'सीढ़ी-मुक्त',
    lowFloor:         'लो-फ्लोर परिवहन',
    elevatorOK:       'लिफ्ट उपलब्ध',
    accessible:       'सुलभ स्टेशन',
    goodMorning:      'सुप्रभात',
    yourOverview:     'आपका व्यक्तिगत एक्सेसिबिलिटी और गतिशीलता अवलोकन',
    activeJourney:    'सक्रिय यात्रा',
    accessScore:      'एक्सेसिबिलिटी स्कोर',
    nearbyFacilities: 'नज़दीकी सुविधाएं',
    activeDisruptions:'सक्रिय व्यवधान',
    searchPlaceholder:'सुविधाएं खोजें…',
  },
  mr: {
    dashboard:        'डॅशबोर्ड',
    planRoute:        'मार्ग नियोजन',
    facilities:       'सुविधा',
    liveAlerts:       'थेट सूचना',
    profile:          'प्रवेशयोग्यता प्रोफाइल',
    settings:         'सेटिंग्ज',
    helpSupport:      'मदत',
    trustedContact:   'विश्वासू संपर्क',
    findRoute:        'सुलभ मार्ग शोधा',
    startJourney:     'प्रवास सुरू करा',
    recalculate:      'मार्ग पुन्हा मोजा',
    viewDetails:      'तपशील पाहा',
    shareJourney:     'प्रवास शेअर करा',
    shareLocation:    'स्थान शेअर करा',
    sendAlert:        'सूचना पाठवा',
    available:        'उपलब्ध',
    limited:          'मर्यादित',
    unavailable:      'अनुपलब्ध',
    verified:         'सत्यापित',
    communityReport:  'सामुदायिक अहवाल',
    needsVerify:      'सत्यापन आवश्यक',
    stepFree:         'पायरी-मुक्त',
    lowFloor:         'लो-फ्लोर वाहतूक',
    elevatorOK:       'लिफ्ट उपलब्ध',
    accessible:       'सुलभ स्थानक',
    goodMorning:      'शुभ प्रभात',
    yourOverview:     'तुमचे वैयक्तिक प्रवेशयोग्यता आणि गतिशीलता विहंगावलोकन',
    activeJourney:    'सक्रिय प्रवास',
    accessScore:      'प्रवेशयोग्यता गुण',
    nearbyFacilities: 'जवळची सुविधा',
    activeDisruptions:'सक्रिय व्यत्यय',
    searchPlaceholder:'सुविधा शोधा…',
  }
};

// ── Preferences (localStorage) ───────────────────────────
const AR_PREFS_KEY = 'ar_preferences';

const AR_DEFAULT_PREFS = {
  fontSize:             'normal',   // small | normal | large
  contrast:             'normal',   // normal | high
  motion:               'normal',   // normal | reduced
  voiceGuidance:        false,
  visualGuidance:       true,
  screenReaderOpt:      false,
  language:             'en',
  theme:                'light'
};

function AR_getPrefs() {
  try {
    const stored = localStorage.getItem(AR_PREFS_KEY);
    return stored ? { ...AR_DEFAULT_PREFS, ...JSON.parse(stored) } : { ...AR_DEFAULT_PREFS };
  } catch { return { ...AR_DEFAULT_PREFS }; }
}

function AR_savePrefs(prefs) {
  try { localStorage.setItem(AR_PREFS_KEY, JSON.stringify(prefs)); } catch { /* no-op */ }
}

function AR_updatePref(key, value) {
  const prefs = AR_getPrefs();
  prefs[key] = value;
  AR_savePrefs(prefs);
  AR_applyPrefs(prefs);
  return prefs;
}

// ── Apply preferences to <body> ──────────────────────────
function AR_applyPrefs(prefs) {
  if (!prefs) prefs = AR_getPrefs();
  const body = document.body;

  // Font size
  body.classList.remove('font-small', 'font-normal', 'font-large');
  body.classList.add(`font-${prefs.fontSize}`);

  // Contrast
  body.classList.toggle('high-contrast', prefs.contrast === 'high');

  // Reduced motion
  body.classList.toggle('reduced-motion', prefs.motion === 'reduced');

  // Language – update data-lang attr for CSS hooks if needed
  document.documentElement.lang = prefs.language;
}

// ── Translation helper ───────────────────────────────────
function AR_t(key) {
  const prefs = AR_getPrefs();
  const lang  = prefs.language || 'en';
  return (AR_TRANSLATIONS[lang] && AR_TRANSLATIONS[lang][key])
       || AR_TRANSLATIONS.en[key]
       || key;
}

// Apply translations to elements with data-i18n attribute
function AR_applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = AR_t(key);
    if (el.tagName === 'INPUT' && el.placeholder !== undefined) {
      el.placeholder = val;
    } else {
      el.textContent = val;
    }
  });
}

// ── Toast Notifications ──────────────────────────────────
function AR_toast(message, type = 'info', title = '', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: 'fa-circle-check',
    warning: 'fa-triangle-exclamation',
    danger:  'fa-circle-xmark',
    info:    'fa-circle-info'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');

  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.info} toast-icon" aria-hidden="true"></i>
    <div class="toast-body">
      ${title ? `<div class="toast-title">${title}</div>` : ''}
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" aria-label="Dismiss notification">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  container.appendChild(toast);

  // Dismiss button
  toast.querySelector('.toast-close').addEventListener('click', () => AR_dismissToast(toast));

  // Auto-dismiss
  const timer = setTimeout(() => AR_dismissToast(toast), duration);
  toast._timer = timer;
}

function AR_dismissToast(toast) {
  clearTimeout(toast._timer);
  toast.classList.add('removing');
  toast.addEventListener('animationend', () => toast.remove(), { once: true });
}

// ── Voice Guidance ───────────────────────────────────────
let AR_speechSynthesis = null;
let AR_voiceEnabled    = false;

function AR_initVoice() {
  if ('speechSynthesis' in window) {
    AR_speechSynthesis = window.speechSynthesis;
    return true;
  }
  return false;
}

function AR_speak(text) {
  if (!AR_voiceEnabled) return;
  if (!AR_speechSynthesis) {
    if (!AR_initVoice()) {
      AR_toast('Voice guidance is not supported in this browser.', 'warning', 'Voice Guidance');
      return;
    }
  }
  // Cancel any current utterance
  AR_speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang  = AR_getPrefs().language === 'hi' ? 'hi-IN'
                  : AR_getPrefs().language === 'mr' ? 'mr-IN'
                  : 'en-IN';
  utterance.rate  = 0.95;
  utterance.pitch = 1.0;
  AR_speechSynthesis.speak(utterance);
}

function AR_toggleVoice(btn) {
  AR_voiceEnabled = !AR_voiceEnabled;
  AR_updatePref('voiceGuidance', AR_voiceEnabled);
  if (btn) {
    btn.setAttribute('aria-pressed', String(AR_voiceEnabled));
    btn.title = AR_voiceEnabled ? 'Voice guidance ON' : 'Voice guidance OFF';
    btn.querySelector('i').className = AR_voiceEnabled
      ? 'fa-solid fa-volume-high'
      : 'fa-solid fa-volume-xmark';
  }
  if (AR_voiceEnabled) {
    AR_initVoice();
    AR_speak('Voice guidance is now enabled.');
    AR_toast('Voice guidance enabled.', 'success', 'Voice');
  } else {
    AR_speechSynthesis && AR_speechSynthesis.cancel();
    AR_toast('Voice guidance disabled.', 'info', 'Voice');
  }
}

// ── Sidebar Toggle ────────────────────────────────────────
function AR_initSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  const hamburger = document.getElementById('hamburger-btn');

  if (!sidebar) return;

  function openSidebar() {
    sidebar.classList.add('open');
    overlay && overlay.classList.add('active');
    hamburger && hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay && overlay.classList.remove('active');
    hamburger && hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger && hamburger.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });

  overlay && overlay.addEventListener('click', closeSidebar);

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) closeSidebar();
  });
}

// ── Active nav item highlight ─────────────────────────────
function AR_setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-page') === page);
    item.setAttribute('aria-current', item.getAttribute('data-page') === page ? 'page' : 'false');
  });
  document.querySelectorAll('.bottom-nav-item[data-page]').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-page') === page);
  });
}

// ── Trusted Contact actions ───────────────────────────────
function AR_shareJourney() {
  AR_toast(`Journey shared with ${AR_DATA.user.trustedContact.name}.`, 'success', 'Journey Shared');
  AR_speak('Your journey has been shared with your trusted contact.');
}

function AR_shareLocation() {
  AR_toast(`Current location shared with ${AR_DATA.user.trustedContact.name}.`, 'success', 'Location Shared');
}

function AR_sendContactAlert() {
  AR_toast(`Emergency alert sent to ${AR_DATA.user.trustedContact.name}.`, 'danger', 'Alert Sent');
  AR_speak('Emergency alert sent to your trusted contact.');
}

// ── Notification Bell ─────────────────────────────────────
function AR_updateAlertBadge() {
  const count = getActiveAlerts().length;
  document.querySelectorAll('.alert-count').forEach(el => {
    el.textContent = count > 0 ? count : '';
    el.style.display = count > 0 ? 'inline-flex' : 'none';
  });
  // Badge dot on bell icon
  document.querySelectorAll('.notif-badge-dot').forEach(dot => {
    dot.style.display = count > 0 ? 'block' : 'none';
  });
}

// ── Language Switcher ─────────────────────────────────────
function AR_setLanguage(lang) {
  AR_updatePref('language', lang);
  AR_applyTranslations();
  AR_toast(`Language changed to ${lang === 'hi' ? 'Hindi' : lang === 'mr' ? 'Marathi' : 'English'}.`, 'success', 'Language');
}

// ── Format duration helper ────────────────────────────────
function AR_formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ── Accessibility score colour ────────────────────────────
function AR_scoreClass(score) {
  if (score >= 90) return 'high';
  if (score >= 70) return 'medium';
  return 'low';
}

// ── Facility type icon ────────────────────────────────────
function AR_facilityIcon(type) {
  const icons = {
    elevator: 'fa-elevator',
    ramp:     'fa-road',
    toilet:   'fa-restroom',
    bus:      'fa-bus',
    crossing: 'fa-person-walking',
    footpath: 'fa-route'
  };
  return icons[type] || 'fa-circle-info';
}

// ── Page Bootstrap ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Apply saved preferences
  const prefs = AR_getPrefs();
  AR_applyPrefs(prefs);

  // Voice guidance state from prefs
  AR_voiceEnabled = prefs.voiceGuidance || false;

  // Sidebar
  AR_initSidebar();

  // Active nav
  AR_setActiveNav();

  // Translations
  AR_applyTranslations();

  // Alert badge
  AR_updateAlertBadge();

  // Language selector (if present on page)
  document.querySelectorAll('.lang-selector').forEach(sel => {
    sel.value = prefs.language || 'en';
    sel.addEventListener('change', e => AR_setLanguage(e.target.value));
  });

  // Voice button (if present)
  const voiceBtn = document.getElementById('voice-toggle-btn');
  if (voiceBtn) {
    voiceBtn.setAttribute('aria-pressed', String(AR_voiceEnabled));
    voiceBtn.querySelector('i').className = AR_voiceEnabled
      ? 'fa-solid fa-volume-high'
      : 'fa-solid fa-volume-xmark';
    voiceBtn.addEventListener('click', () => AR_toggleVoice(voiceBtn));
  }

  // Trusted contact buttons
  const shareJourneyBtns = document.querySelectorAll('[data-action="share-journey"]');
  shareJourneyBtns.forEach(b => b.addEventListener('click', AR_shareJourney));

  const shareLocBtns = document.querySelectorAll('[data-action="share-location"]');
  shareLocBtns.forEach(b => b.addEventListener('click', AR_shareLocation));

  const sendAlertBtns = document.querySelectorAll('[data-action="send-alert"]');
  sendAlertBtns.forEach(b => b.addEventListener('click', AR_sendContactAlert));
});
