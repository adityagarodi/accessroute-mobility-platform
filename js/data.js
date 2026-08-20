/* ============================================================
   AccessRoute – Central Data Store
   Team: IntelliVision | PS-B04
   All data is simulated for prototype. Replace service functions
   with REST/MQTT/Firebase calls to connect a real backend.
   ============================================================ */
'use strict';

// ── App-wide state ────────────────────────────────────────
const AR = {
  version: '1.0.0-prototype',
  demoMode: false,
  currentUser: null,
  activeJourney: null,
  systemStatus: {
    iot: 'online', gps: 'connected',
    transport: 'connected', map: 'online',
    ai: 'active', alerts: 'monitoring'
  }
};

// ── User ──────────────────────────────────────────────────
const AR_USER = {
  id: 'u001', name: 'Aditya', email: 'aditya@intellivision.in',
  phone: '+91 98765 43210', joinDate: '2026-01-15',
  accessibilityScore: 94, totalJourneys: 148,
  prefs: {
    wheelchair: true, stepFree: true, avoidStairs: true,
    reducedWalking: false, lowFloorBuses: true,
    accessibleToilets: true, elevatorRequired: true,
    visualGuidance: true, voiceGuidance: true,
    hearingAssistance: false, cognitiveFriendly: false,
    simpleInstructions: true, fewerTransfers: true,
    largeText: false, transportMode: 'mostAccessible'
  },
  trustedContact: {
    name: 'Priya Sharma', relation: 'Sister',
    phone: '+91 97654 32109', email: 'priya@example.com'
  }
};

// ── IoT Sensors ────────────────────────────────────────────
const AR_SENSORS = [
  {
    id: 's001', deviceId: 'ESP32-001', facilityId: 'f001',
    facilityName: 'Pune Station – Ramp A',
    sensorType: 'Ultrasonic Distance', unit: 'cm',
    lat: 18.5284, lng: 73.8745,
    reading: 38, threshold: 20, status: 'normal',
    battery: 87, signal: 92, online: true,
    lastUpdated: new Date(Date.now() - 2000).toISOString(),
    history: [42, 41, 40, 39, 38, 38, 37, 38],
    notes: 'Monitors clearance on accessible ramp. Alert if < 20cm.'
  },
  {
    id: 's002', deviceId: 'ESP32-002', facilityId: 'f002',
    facilityName: 'Pune Station – Elevator #2',
    sensorType: 'Digital Facility Status', unit: 'status',
    lat: 18.5288, lng: 73.8748,
    reading: 'AVAILABLE', threshold: null, status: 'normal',
    battery: 92, signal: 89, online: true,
    lastUpdated: new Date(Date.now() - 4000).toISOString(),
    history: ['AVAILABLE','AVAILABLE','AVAILABLE','AVAILABLE','AVAILABLE','AVAILABLE','AVAILABLE','AVAILABLE'],
    notes: 'Reed sensor on elevator door. Reports open/closed/fault.'
  },
  {
    id: 's003', deviceId: 'ESP32-003', facilityId: 'f003',
    facilityName: 'Platform Pathway – Section B',
    sensorType: 'Ultrasonic Distance', unit: 'cm',
    lat: 18.5282, lng: 73.8740,
    reading: 8, threshold: 20, status: 'obstacle',
    battery: 78, signal: 95, online: true,
    lastUpdated: new Date(Date.now() - 1000).toISOString(),
    history: [44, 43, 42, 30, 18, 12, 9, 8],
    notes: 'Critical pathway sensor. Obstacle detected – route affected.'
  },
  {
    id: 's004', deviceId: 'ESP32-004', facilityId: 'f004',
    facilityName: 'Bus Stop #12 – Low Floor Bay',
    sensorType: 'IR Proximity', unit: 'status',
    lat: 18.5196, lng: 73.8553,
    reading: 'NORMAL', threshold: null, status: 'normal',
    battery: 91, signal: 87, online: true,
    lastUpdated: new Date(Date.now() - 5000).toISOString(),
    history: ['NORMAL','NORMAL','NORMAL','NORMAL','NORMAL','NORMAL','NORMAL','NORMAL'],
    notes: 'Detects obstructions at accessible bus boarding area.'
  },
  {
    id: 's005', deviceId: 'ESP32-005', facilityId: 'f005',
    facilityName: 'Shivajinagar – Elevator',
    sensorType: 'Accelerometer/Vibration', unit: 'mg',
    lat: 18.5308, lng: 73.8474,
    reading: 0.02, threshold: 1.5, status: 'normal',
    battery: 85, signal: 88, online: true,
    lastUpdated: new Date(Date.now() - 3000).toISOString(),
    history: [0.01,0.02,0.01,0.02,0.02,0.01,0.02,0.02],
    notes: 'Vibration monitor on elevator motor. Alert if abnormal.'
  },
  {
    id: 's006', deviceId: 'ESP32-006', facilityId: 'f006',
    facilityName: 'FC Road – Accessible Toilet',
    sensorType: 'Reed/Magnetic', unit: 'status',
    lat: 18.5236, lng: 73.8478,
    reading: 'CLOSED', threshold: null, status: 'normal',
    battery: 65, signal: 76, online: true,
    lastUpdated: new Date(Date.now() - 8000).toISOString(),
    history: ['CLOSED','CLOSED','OPEN','CLOSED','CLOSED','CLOSED','CLOSED','CLOSED'],
    notes: 'Door state sensor. OPEN = accessible. CLOSED = in use.'
  },
  {
    id: 's007', deviceId: 'ESP32-007', facilityId: 'f007',
    facilityName: 'Deccan – Ramp East Side',
    sensorType: 'Ultrasonic Distance', unit: 'cm',
    lat: 18.5174, lng: 73.8486,
    reading: 35, threshold: 20, status: 'normal',
    battery: 72, signal: 81, online: true,
    lastUpdated: new Date(Date.now() - 6000).toISOString(),
    history: [38,37,36,36,35,35,35,35],
    notes: 'Clearance monitor on community-reported ramp.'
  },
  {
    id: 's008', deviceId: 'ESP32-008', facilityId: 'f008',
    facilityName: 'Swargate – Bus Stand Ramp',
    sensorType: 'IR Proximity', unit: 'status',
    lat: 18.5018, lng: 73.8601,
    reading: 'NORMAL', threshold: null, status: 'normal',
    battery: 88, signal: 90, online: true,
    lastUpdated: new Date(Date.now() - 2500).toISOString(),
    history: ['NORMAL','NORMAL','NORMAL','NORMAL','NORMAL','NORMAL','NORMAL','NORMAL'],
    notes: 'Entry proximity sensor at Swargate accessible ramp.'
  },
  {
    id: 's009', deviceId: 'ESP32-009', facilityId: 'f009',
    facilityName: 'Hadapsar – Station Elevator',
    sensorType: 'Digital Facility Status', unit: 'status',
    lat: 18.5025, lng: 73.9330,
    reading: 'AVAILABLE', threshold: null, status: 'normal',
    battery: 0, signal: 0, online: false,
    lastUpdated: new Date(Date.now() - 900000).toISOString(),
    history: ['AVAILABLE','AVAILABLE','AVAILABLE','OFFLINE','OFFLINE','OFFLINE','OFFLINE','OFFLINE'],
    notes: 'OFFLINE – battery depleted. Last known: AVAILABLE.'
  },
  {
    id: 's010', deviceId: 'ESP32-010', facilityId: 'f010',
    facilityName: 'JM Road – Pedestrian Crossing',
    sensorType: 'Ultrasonic Distance', unit: 'cm',
    lat: 18.5210, lng: 73.8450,
    reading: 55, threshold: 20, status: 'normal',
    battery: 93, signal: 96, online: true,
    lastUpdated: new Date(Date.now() - 1500).toISOString(),
    history: [58,57,57,56,55,55,55,55],
    notes: 'Monitors pedestrian crossing clearance.'
  }
];

// ── Facilities ────────────────────────────────────────────
const AR_FACILITIES = [
  {
    id: 'f001', name: 'Pune Station – Ramp A', type: 'ramp',
    lat: 18.5284, lng: 73.8745, status: 'available',
    verified: true, source: 'iot', sensorId: 's001',
    floor: 'Main entrance', lastUpdated: new Date().toISOString(),
    notes: 'Grade 1:12. Non-slip. IoT monitored.'
  },
  {
    id: 'f002', name: 'Pune Station – Elevator #2', type: 'elevator',
    lat: 18.5288, lng: 73.8748, status: 'available',
    verified: true, source: 'iot', sensorId: 's002',
    floor: 'Platform 3–4', lastUpdated: new Date().toISOString(),
    notes: 'Fully operational. IoT door sensor active.'
  },
  {
    id: 'f003', name: 'Platform Pathway – Section B', type: 'pathway',
    lat: 18.5282, lng: 73.8740, status: 'obstacle',
    verified: true, source: 'iot', sensorId: 's003',
    floor: 'Platform level', lastUpdated: new Date().toISOString(),
    notes: 'OBSTACLE DETECTED by IoT sensor. Route affected.'
  },
  {
    id: 'f004', name: 'Bus Stop #12 – Low Floor Bay', type: 'bus',
    lat: 18.5196, lng: 73.8553, status: 'available',
    verified: true, source: 'iot', sensorId: 's004',
    floor: 'Ground', lastUpdated: new Date().toISOString(),
    notes: 'IoT proximity sensor active. Boarding area clear.'
  },
  {
    id: 'f005', name: 'Shivajinagar – Elevator', type: 'elevator',
    lat: 18.5308, lng: 73.8474, status: 'available',
    verified: true, source: 'iot', sensorId: 's005',
    floor: 'All platforms', lastUpdated: new Date().toISOString(),
    notes: 'Vibration sensor active. Normal operation.'
  },
  {
    id: 'f006', name: 'FC Road – Accessible Toilet', type: 'toilet',
    lat: 18.5236, lng: 73.8478, status: 'available',
    verified: true, source: 'iot', sensorId: 's006',
    floor: 'Ground level', lastUpdated: new Date().toISOString(),
    notes: 'Door state: CLOSED (available). IoT monitored.'
  },
  {
    id: 'f007', name: 'Deccan – Ramp East Side', type: 'ramp',
    lat: 18.5174, lng: 73.8486, status: 'limited',
    verified: false, source: 'community', sensorId: 's007',
    floor: 'Street level', lastUpdated: new Date().toISOString(),
    notes: 'Surface cracking reported. Community + IoT.'
  },
  {
    id: 'f008', name: 'Swargate Bus Stand – Ramp', type: 'ramp',
    lat: 18.5018, lng: 73.8601, status: 'available',
    verified: true, source: 'iot', sensorId: 's008',
    floor: 'Main entrance', lastUpdated: new Date().toISOString(),
    notes: 'Wide ramp. IoT proximity sensor normal.'
  },
  {
    id: 'f009', name: 'Hadapsar – Station Elevator', type: 'elevator',
    lat: 18.5025, lng: 73.9330, status: 'available',
    verified: false, source: 'unconfirmed', sensorId: 's009',
    floor: 'All floors', lastUpdated: new Date(Date.now()-900000).toISOString(),
    notes: 'IoT sensor OFFLINE. Last verified status: Available.'
  },
  {
    id: 'f010', name: 'JM Road – Pedestrian Crossing', type: 'crossing',
    lat: 18.5210, lng: 73.8450, status: 'available',
    verified: true, source: 'iot', sensorId: 's010',
    floor: 'Street level', lastUpdated: new Date().toISOString(),
    notes: 'Audio signals. Tactile paving. IoT monitored.'
  },
  {
    id: 'f011', name: 'Pune Station – Elevator #1', type: 'elevator',
    lat: 18.5284, lng: 73.8742, status: 'available',
    verified: true, source: 'official', sensorId: null,
    floor: 'Platform 1–2', lastUpdated: new Date().toISOString(),
    notes: 'Official report. No IoT sensor yet.'
  },
  {
    id: 'f012', name: 'Aundh Road – Footpath', type: 'footpath',
    lat: 18.5590, lng: 73.8080, status: 'available',
    verified: true, source: 'official', sensorId: null,
    floor: 'Street level', lastUpdated: new Date().toISOString(),
    notes: 'Wide, smooth. Tactile tiles present.'
  }
];

// ── Routes ────────────────────────────────────────────────
const AR_ROUTES = [
  {
    id: 'r001', label: 'Most Accessible', tag: 'recommended',
    origin: 'Pune Station', destination: 'Fergusson College',
    duration: 28, walkingDistance: '1.2 km', walkingMin: 8, transfers: 1,
    accessibilityScore: 94, stepFree: true, elevatorAvailable: true,
    lowFloorTransport: true, rampAvailable: true, accessibleToilet: true,
    status: 'active', disruptions: 0,
    segments: [
      { mode:'walk', label:'Walk to Bus Stop A', duration:5, distance:'400m' },
      { mode:'bus',  label:'Bus 15 (Low-floor)', duration:14, distance:'3.8km', route:'Bus 15' },
      { mode:'walk', label:'Walk to College', duration:9, distance:'800m' }
    ],
    waypoints:[{lat:18.5284,lng:73.8742},{lat:18.5270,lng:73.8690},{lat:18.5240,lng:73.8580},{lat:18.5210,lng:73.8490},{lat:18.5190,lng:73.8450}],
    aiScore: { stepFree:25, elevator:20, ramp:20, lowFloor:15, lowWalking:10, noObstacle:4 }
  },
  {
    id: 'r002', label: 'Fastest', tag: 'fast',
    origin: 'Pune Station', destination: 'Fergusson College',
    duration: 24, walkingDistance: '1.8 km', walkingMin: 14, transfers: 1,
    accessibilityScore: 78, stepFree: false, elevatorAvailable: false,
    lowFloorTransport: true, rampAvailable: true, accessibleToilet: false,
    status: 'available', disruptions: 1,
    segments: [
      { mode:'walk', label:'Walk to Metro', duration:8, distance:'700m' },
      { mode:'metro', label:'Metro Line 1', duration:6, distance:'2.1km', route:'Metro L1' },
      { mode:'walk', label:'Walk to College', duration:10, distance:'1.1km' }
    ],
    waypoints:[{lat:18.5284,lng:73.8742},{lat:18.5308,lng:73.8474},{lat:18.5174,lng:73.8486},{lat:18.5190,lng:73.8450}],
    aiScore: { stepFree:0, elevator:0, ramp:15, lowFloor:15, lowWalking:5, noObstacle:4 }
  },
  {
    id: 'r003', label: 'Least Walking', tag: 'walking',
    origin: 'Pune Station', destination: 'Fergusson College',
    duration: 32, walkingDistance: '0.7 km', walkingMin: 5, transfers: 2,
    accessibilityScore: 91, stepFree: true, elevatorAvailable: true,
    lowFloorTransport: true, rampAvailable: true, accessibleToilet: true,
    status: 'available', disruptions: 0,
    segments: [
      { mode:'walk', label:'Walk to Bus Stop B', duration:3, distance:'250m' },
      { mode:'bus',  label:'Bus 32 (Low-floor)', duration:16, distance:'4.2km', route:'Bus 32' },
      { mode:'bus',  label:'Bus 11', duration:9, distance:'1.8km', route:'Bus 11' },
      { mode:'walk', label:'Walk to College', duration:4, distance:'450m' }
    ],
    waypoints:[{lat:18.5284,lng:73.8742},{lat:18.5280,lng:73.8700},{lat:18.5174,lng:73.8486},{lat:18.5210,lng:73.8460},{lat:18.5190,lng:73.8450}],
    aiScore: { stepFree:25, elevator:20, ramp:20, lowFloor:15, lowWalking:7, noObstacle:4 }
  },
  {
    id: 'r004', label: 'Alternative (Rerouted)', tag: 'rerouted',
    origin: 'Pune Station', destination: 'Fergusson College',
    duration: 29, walkingDistance: '1.4 km', walkingMin: 10, transfers: 1,
    accessibilityScore: 92, stepFree: true, elevatorAvailable: true,
    lowFloorTransport: true, rampAvailable: true, accessibleToilet: true,
    status: 'available', disruptions: 0,
    segments: [
      { mode:'walk', label:'North Exit → Bus Stop C', duration:6, distance:'500m' },
      { mode:'bus',  label:'Bus 11 (Low-floor)', duration:15, distance:'4.0km', route:'Bus 11' },
      { mode:'walk', label:'Walk to College', duration:8, distance:'900m' }
    ],
    waypoints:[{lat:18.5284,lng:73.8742},{lat:18.5295,lng:73.8780},{lat:18.5260,lng:73.8620},{lat:18.5220,lng:73.8500},{lat:18.5190,lng:73.8450}],
    aiScore: { stepFree:25, elevator:20, ramp:20, lowFloor:15, lowWalking:8, noObstacle:4 }
  },
  {
    id: 'r005', label: 'Community Verified', tag: 'community',
    origin: 'Pune Station', destination: 'FC Road Stop',
    duration: 18, walkingDistance: '0.9 km', walkingMin: 6, transfers: 0,
    accessibilityScore: 88, stepFree: true, elevatorAvailable: false,
    lowFloorTransport: true, rampAvailable: true, accessibleToilet: false,
    status: 'available', disruptions: 0,
    segments: [
      { mode:'walk', label:'Walk to Bus Stop A', duration:5, distance:'400m' },
      { mode:'bus',  label:'Bus 15 (Low-floor)', duration:13, distance:'3.2km', route:'Bus 15' }
    ],
    waypoints:[{lat:18.5284,lng:73.8742},{lat:18.5270,lng:73.8690},{lat:18.5230,lng:73.8560}],
    aiScore: { stepFree:25, elevator:0, ramp:20, lowFloor:15, lowWalking:10, noObstacle:4 }
  }
];

// ── Alerts ────────────────────────────────────────────────
const AR_ALERTS = [
  {
    id: 'a001', title: 'Obstacle on Accessible Pathway',
    severity: 'high', type: 'sensor',
    location: 'Pune Station – Platform Section B',
    sensorId: 's003', facilityId: 'f003',
    detectedAt: new Date(Date.now()-120000).toISOString(),
    affectsRoute: true, affectedRouteId: 'r001',
    message: 'IoT sensor ESP32-003 detected an obstacle (8cm clearance) on the accessible pathway at Platform Section B. Route via Platform B is blocked.',
    status: 'active', actionTaken: false, source: 'iot'
  },
  {
    id: 'a002', title: 'Station Elevator #2 – Status Check',
    severity: 'medium', type: 'facility',
    location: 'Pune Station – Platform 3/4',
    sensorId: 's002', facilityId: 'f002',
    detectedAt: new Date(Date.now()-300000).toISOString(),
    affectsRoute: false,
    message: 'Elevator #2 reported a brief communication delay. Current status confirmed AVAILABLE by IoT sensor.',
    status: 'active', actionTaken: false, source: 'iot'
  },
  {
    id: 'a003', title: 'Community Report – Deccan Ramp',
    severity: 'medium', type: 'community',
    location: 'Deccan – East Side Ramp',
    sensorId: 's007', facilityId: 'f007',
    detectedAt: new Date(Date.now()-600000).toISOString(),
    affectsRoute: false,
    message: 'Community report: Surface cracking on the east ramp at Deccan. IoT sensor shows normal clearance (35cm). Usable with caution.',
    status: 'active', actionTaken: false, source: 'community'
  },
  {
    id: 'a004', title: 'IoT Sensor Offline – Hadapsar',
    severity: 'low', type: 'sensor',
    location: 'Hadapsar Station – Elevator',
    sensorId: 's009', facilityId: 'f009',
    detectedAt: new Date(Date.now()-900000).toISOString(),
    affectsRoute: false,
    message: 'ESP32-009 at Hadapsar Station elevator went offline (battery depleted). Last verified status was AVAILABLE. Showing cached data.',
    status: 'active', actionTaken: false, source: 'iot'
  },
  {
    id: 'a005', title: 'Bus 15 – Low Floor Bus Delayed',
    severity: 'medium', type: 'transport',
    location: 'PMC Bus Stop – JM Road',
    sensorId: null, facilityId: null,
    detectedAt: new Date(Date.now()-180000).toISOString(),
    affectsRoute: true, affectedRouteId: 'r001',
    message: 'Low-floor Bus 15 is running 12 minutes late due to traffic at Shivajinagar. Next accessible bus in 18 minutes.',
    status: 'active', actionTaken: false, source: 'gtfs'
  }
];

// ── Transport Services ────────────────────────────────────
const AR_TRANSPORT = [
  {
    id: 't001', name: 'PMPML Bus 15', type: 'bus', routeNo: '15',
    origin: 'Pune Station', destination: 'FC Road',
    currentStop: 'Shivajinagar', delay: 12,
    lowFloor: true, wheelchairSpace: true, audioAnnouncements: true,
    accessibilityScore: 94, status: 'delayed',
    nextArrival: '18 min', lat: 18.5270, lng: 73.8650
  },
  {
    id: 't002', name: 'PMPML Bus 32', type: 'bus', routeNo: '32',
    origin: 'Pune Station', destination: 'Deccan',
    currentStop: 'Pune Station', delay: 0,
    lowFloor: true, wheelchairSpace: true, audioAnnouncements: false,
    accessibilityScore: 89, status: 'on-time',
    nextArrival: '6 min', lat: 18.5284, lng: 73.8742
  },
  {
    id: 't003', name: 'PMPML Bus 11', type: 'bus', routeNo: '11',
    origin: 'Deccan', destination: 'FC Road',
    currentStop: 'Deccan Bus Stop', delay: 4,
    lowFloor: false, wheelchairSpace: false, audioAnnouncements: false,
    accessibilityScore: 45, status: 'delayed',
    nextArrival: '9 min', lat: 18.5174, lng: 73.8490
  },
  {
    id: 't004', name: 'Pune Metro Line 1', type: 'metro', routeNo: 'M1',
    origin: 'PCMC', destination: 'Swargate',
    currentStop: 'Shivajinagar', delay: 0,
    lowFloor: true, wheelchairSpace: true, audioAnnouncements: true,
    accessibilityScore: 97, status: 'on-time',
    nextArrival: '4 min', lat: 18.5308, lng: 73.8474
  },
  {
    id: 't005', name: 'Pune-Mumbai Express', type: 'train', routeNo: '12124',
    origin: 'Pune Jn', destination: 'Mumbai CSMT',
    currentStop: 'Pune Station', delay: 8,
    lowFloor: false, wheelchairSpace: true, audioAnnouncements: true,
    accessibilityScore: 72, status: 'delayed',
    nextArrival: '22 min', lat: 18.5284, lng: 73.8742
  }
];

// ── Timeline events ───────────────────────────────────────
const AR_TIMELINE = [
  { id:'tl001', time:'10:42 AM', type:'success', icon:'fa-circle-check',  message:'Route verified – Pune Station → College' },
  { id:'tl002', time:'10:45 AM', type:'success', icon:'fa-circle-check',  message:'Elevator #1 confirmed AVAILABLE by IoT' },
  { id:'tl003', time:'10:47 AM', type:'warning', icon:'fa-triangle-exclamation', message:'Community report received – Deccan ramp surface' },
  { id:'tl004', time:'10:49 AM', type:'danger',  icon:'fa-microchip',     message:'ESP32-003 detected obstacle on Platform Pathway' },
  { id:'tl005', time:'10:49 AM', type:'info',    icon:'fa-rotate',        message:'AI Route Engine recalculating accessible route…' },
  { id:'tl006', time:'10:50 AM', type:'success', icon:'fa-circle-check',  message:'Alternative route confirmed – 92% accessibility' }
];

// ── Analytics Data ────────────────────────────────────────
const AR_ANALYTICS = {
  summary: {
    totalJourneys: 128, successfulJourneys: 121,
    avgScore: 92, autoReroutes: 17,
    facilityFailures: 9, sensorAlerts: 34, communityReports: 22
  },
  weeklyJourneys: {
    labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    journeys: [14,18,16,22,19,8,4],
    scores:   [91,88,95,94,90,96,89]
  },
  facilityAvailability: {
    labels: ['Elevators','Ramps','Toilets','Bus Stops','Pathways','Crossings'],
    available:   [4,6,3,8,9,7],
    limited:     [1,2,1,1,3,1],
    unavailable: [1,0,2,0,1,0]
  },
  sensorHealth: {
    labels: ['ESP32-001','ESP32-002','ESP32-003','ESP32-004','ESP32-005','ESP32-006','ESP32-007','ESP32-008','ESP32-009','ESP32-010'],
    uptime: [99,98,97,99,96,94,92,98,15,99]
  },
  disruptions: {
    labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    count: [1,3,2,4,2,1,0]
  },
  reroutes: {
    labels: ['Week 1','Week 2','Week 3','Week 4'],
    count: [3,5,4,5]
  }
};

// ── Map Markers metadata ──────────────────────────────────
const AR_MAP = {
  center: { lat: 18.522, lng: 73.862 },
  zoom: 14,
  origin:      { lat: 18.5284, lng: 73.8742, label: 'Pune Station (Current)' },
  destination: { lat: 18.5190, lng: 73.8450, label: 'Fergusson College' }
};

// ============================================================
// SERVICE LAYER – replace with API/MQTT calls later
// ============================================================

function getSensors()            { return Promise.resolve([...AR_SENSORS]); }
function getSensor(id)           { return Promise.resolve(AR_SENSORS.find(s=>s.id===id)||null); }
function getFacilities()         { return Promise.resolve([...AR_FACILITIES]); }
function getFacility(id)         { return Promise.resolve(AR_FACILITIES.find(f=>f.id===id)||null); }
function getRoutes()             { return Promise.resolve([...AR_ROUTES]); }
function getRoute(id)            { return Promise.resolve(AR_ROUTES.find(r=>r.id===id)||null); }
function getAlerts()             { return Promise.resolve(AR_ALERTS.filter(a=>a.status==='active')); }
function getTransportStatus()    { return Promise.resolve([...AR_TRANSPORT]); }
function getTimeline()           { return Promise.resolve([...AR_TIMELINE]); }
function getAnalytics()          { return Promise.resolve({...AR_ANALYTICS}); }
function getUser()               { return Promise.resolve({...AR_USER}); }

function calculateRoute(prefs)   {
  // Simulated AI scoring – replace with ML model later
  const sorted = AR_ROUTES.filter(r=>r.id!=='r004').map(r => {
    let score = r.accessibilityScore;
    if (prefs.wheelchair && !r.stepFree)         score -= 20;
    if (prefs.elevatorRequired && !r.elevatorAvailable) score -= 15;
    if (prefs.lowFloorBuses && !r.lowFloorTransport)    score -= 10;
    return { ...r, aiAdjustedScore: Math.max(0, score) };
  });
  return Promise.resolve(sorted.sort((a,b) => b.aiAdjustedScore - a.aiAdjustedScore));
}

function recalculateRoute(reason) {
  const alt = AR_ROUTES.find(r=>r.id==='r004');
  return Promise.resolve(alt);
}

function updateFacilityStatus(id, status) {
  const f = AR_FACILITIES.find(f=>f.id===id);
  if (f) { f.status = status; f.lastUpdated = new Date().toISOString(); }
  return Promise.resolve(f);
}

function updateSensorReading(id, reading, status) {
  const s = AR_SENSORS.find(s=>s.id===id);
  if (s) {
    s.reading = reading; s.status = status;
    s.lastUpdated = new Date().toISOString();
    s.history = [...s.history.slice(1), reading];
  }
  return Promise.resolve(s);
}

function saveUserPreferences(prefs) {
  try { localStorage.setItem('ar_user_prefs', JSON.stringify(prefs)); } catch(e){}
  Object.assign(AR_USER.prefs, prefs);
  return Promise.resolve(true);
}

function sendSensorData(data)   { console.log('[MQTT-SIM] Sensor data:', data); return Promise.resolve(true); }
function addAlert(alert)        { AR_ALERTS.unshift(alert); return Promise.resolve(alert); }
function addTimelineEvent(evt)  { AR_TIMELINE.push(evt); return Promise.resolve(evt); }

// ── Helpers ───────────────────────────────────────────────
function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

function facilityIcon(type) {
  return {elevator:'fa-elevator',ramp:'fa-road',toilet:'fa-restroom',bus:'fa-bus',
          crossing:'fa-person-walking',footpath:'fa-route',pathway:'fa-person-walking-dashed-line-arrow-right'}[type]||'fa-circle-info';
}

function sensorStatusClass(status) {
  return {normal:'success',obstacle:'danger',offline:'secondary',warning:'warning',fault:'danger'}[status]||'info';
}

function scoreColor(score) {
  if (score>=90) return 'var(--color-success)';
  if (score>=75) return 'var(--color-warning)';
  return 'var(--color-danger)';
}
