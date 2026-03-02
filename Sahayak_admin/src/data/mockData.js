/**
 * Mock Data for Sahayak Bank Admin Portal
 * This file contains all the sample data for demonstration purposes
 * In production, this would be fetched from backend APIs
 */

// KPI Dashboard Data
export const kpiData = {
  totalKiosks: 847,
  activeKiosks: 783,
  formsProcessedToday: 12453,
  errorRate: 0.8, // percentage
  offlineKiosks: 64,
  pendingUpdates: 23,
  activeAdmins: 45,
  systemUptime: 99.7 // percentage
};

// Forms and Templates Data
export const formsData = [
  {
    id: 'F001',
    name: 'Account Opening Form',
    version: '3.2.1',
    status: 'Published',
    category: 'Account Services',
    lastUpdated: '2026-01-28',
    publishedDate: '2026-01-28',
    totalVersions: 12,
    deployedTo: 847,
    description: 'Standard form for new savings and current account opening',
    compliance: 'RBI Approved',
    languages: ['English', 'Hindi', 'Tamil', 'Telugu']
  },
  {
    id: 'F002',
    name: 'Loan Application Form',
    version: '2.5.0',
    status: 'Published',
    category: 'Lending',
    lastUpdated: '2026-01-25',
    publishedDate: '2026-01-25',
    totalVersions: 8,
    deployedTo: 847,
    description: 'Personal, home, and vehicle loan application',
    compliance: 'RBI Approved',
    languages: ['English', 'Hindi', 'Marathi', 'Gujarati']
  },
  {
    id: 'F003',
    name: 'KYC Verification Form',
    version: '4.1.2',
    status: 'Published',
    category: 'Compliance',
    lastUpdated: '2026-02-01',
    publishedDate: '2026-02-01',
    totalVersions: 15,
    deployedTo: 847,
    description: 'Know Your Customer verification and documentation',
    compliance: 'PMLA Compliant',
    languages: ['English', 'Hindi', 'Bengali', 'Kannada']
  },
  {
    id: 'F004',
    name: 'Fixed Deposit Form',
    version: '1.8.0',
    status: 'Draft',
    category: 'Deposits',
    lastUpdated: '2026-02-03',
    publishedDate: null,
    totalVersions: 5,
    deployedTo: 0,
    description: 'Fixed deposit account opening and renewal',
    compliance: 'Under Review',
    languages: ['English', 'Hindi']
  },
  {
    id: 'F005',
    name: 'Cheque Book Request',
    version: '2.0.1',
    status: 'Published',
    category: 'Account Services',
    lastUpdated: '2026-01-20',
    publishedDate: '2026-01-20',
    totalVersions: 6,
    deployedTo: 847,
    description: 'Request for new cheque book issuance',
    compliance: 'RBI Approved',
    languages: ['English', 'Hindi', 'Tamil', 'Malayalam']
  },
  {
    id: 'F006',
    name: 'ATM Card Application',
    version: '3.0.0',
    status: 'Published',
    category: 'Cards',
    lastUpdated: '2026-01-30',
    publishedDate: '2026-01-30',
    totalVersions: 10,
    deployedTo: 847,
    description: 'Debit/ATM card issuance and replacement',
    compliance: 'RBI Approved',
    languages: ['English', 'Hindi', 'Punjabi', 'Urdu']
  },
  {
    id: 'F007',
    name: 'Nomination Form',
    version: '1.5.0',
    status: 'Published',
    category: 'Account Services',
    lastUpdated: '2026-01-15',
    publishedDate: '2026-01-15',
    totalVersions: 4,
    deployedTo: 847,
    description: 'Nomination registration and updates',
    compliance: 'RBI Approved',
    languages: ['English', 'Hindi', 'Odia']
  },
  {
    id: 'F008',
    name: 'Account Closure Form',
    version: '2.2.0',
    status: 'Archived',
    category: 'Account Services',
    lastUpdated: '2025-12-10',
    publishedDate: '2025-12-10',
    totalVersions: 7,
    deployedTo: 0,
    description: 'Account closure and final settlement',
    compliance: 'Superseded',
    languages: ['English', 'Hindi']
  },
  {
    id: 'F009',
    name: 'Standing Instructions Form',
    version: '1.2.0',
    status: 'Draft',
    category: 'Payments',
    lastUpdated: '2026-02-02',
    publishedDate: null,
    totalVersions: 2,
    deployedTo: 0,
    description: 'Setup recurring payments and transfers',
    compliance: 'Under Review',
    languages: ['English', 'Hindi']
  },
  {
    id: 'F010',
    name: 'Credit Card Application',
    version: '2.8.1',
    status: 'Published',
    category: 'Cards',
    lastUpdated: '2026-01-22',
    publishedDate: '2026-01-22',
    totalVersions: 9,
    deployedTo: 847,
    description: 'Credit card issuance application',
    compliance: 'RBI Approved',
    languages: ['English', 'Hindi', 'Tamil', 'Telugu']
  },
  {
    id: 'F011',
    name: 'Complaint Registration Form',
    version: '1.0.5',
    status: 'Published',
    category: 'Support',
    lastUpdated: '2026-01-18',
    publishedDate: '2026-01-18',
    totalVersions: 3,
    deployedTo: 847,
    description: 'Customer grievance and complaint logging',
    compliance: 'RBI Approved',
    languages: ['English', 'Hindi', 'Bengali', 'Marathi']
  },
  {
    id: 'F012',
    name: 'Mobile Banking Registration',
    version: '3.5.0',
    status: 'Published',
    category: 'Digital Services',
    lastUpdated: '2026-02-01',
    publishedDate: '2026-02-01',
    totalVersions: 11,
    deployedTo: 847,
    description: 'Mobile and internet banking enrollment',
    compliance: 'RBI Approved',
    languages: ['English', 'Hindi', 'Kannada', 'Malayalam']
  }
];

// Kiosks Data
export const kiosksData = [
  {
    id: 'K-MUM-001',
    branchName: 'Mumbai Central',
    branchCode: 'MUM001',
    region: 'West',
    status: 'Online',
    lastHeartbeat: '2026-02-04T04:55:00Z',
    installedVersion: '3.2.1',
    lastSyncTime: '2026-02-04T04:50:00Z',
    formsProcessedToday: 156,
    uptime: 99.8,
    ipAddress: '192.168.1.101',
    diskSpace: 75, // GB free
    memoryUsage: 45, // percentage
    cpuUsage: 32 // percentage
  },
  {
    id: 'K-MUM-002',
    branchName: 'Mumbai Central',
    branchCode: 'MUM001',
    region: 'West',
    status: 'Online',
    lastHeartbeat: '2026-02-04T04:54:00Z',
    installedVersion: '3.2.1',
    lastSyncTime: '2026-02-04T04:48:00Z',
    formsProcessedToday: 142,
    uptime: 99.5,
    ipAddress: '192.168.1.102',
    diskSpace: 82,
    memoryUsage: 38,
    cpuUsage: 28
  },
  {
    id: 'K-DEL-001',
    branchName: 'Delhi Connaught Place',
    branchCode: 'DEL001',
    region: 'North',
    status: 'Offline',
    lastHeartbeat: '2026-02-04T02:30:00Z',
    installedVersion: '3.1.5',
    lastSyncTime: '2026-02-04T02:25:00Z',
    formsProcessedToday: 98,
    uptime: 97.2,
    ipAddress: '192.168.2.101',
    diskSpace: 68,
    memoryUsage: 0,
    cpuUsage: 0
  },
  {
    id: 'K-BLR-001',
    branchName: 'Bangalore MG Road',
    branchCode: 'BLR001',
    region: 'South',
    status: 'Online',
    lastHeartbeat: '2026-02-04T04:56:00Z',
    installedVersion: '3.2.1',
    lastSyncTime: '2026-02-04T04:52:00Z',
    formsProcessedToday: 187,
    uptime: 99.9,
    ipAddress: '192.168.3.101',
    diskSpace: 91,
    memoryUsage: 42,
    cpuUsage: 35
  },
  {
    id: 'K-BLR-002',
    branchName: 'Bangalore Whitefield',
    branchCode: 'BLR002',
    region: 'South',
    status: 'Online',
    lastHeartbeat: '2026-02-04T04:57:00Z',
    installedVersion: '3.2.1',
    lastSyncTime: '2026-02-04T04:51:00Z',
    formsProcessedToday: 165,
    uptime: 99.6,
    ipAddress: '192.168.3.201',
    diskSpace: 78,
    memoryUsage: 48,
    cpuUsage: 40
  },
  {
    id: 'K-KOL-001',
    branchName: 'Kolkata Park Street',
    branchCode: 'KOL001',
    region: 'East',
    status: 'Online',
    lastHeartbeat: '2026-02-04T04:53:00Z',
    installedVersion: '3.2.0',
    lastSyncTime: '2026-02-04T04:47:00Z',
    formsProcessedToday: 134,
    uptime: 99.3,
    ipAddress: '192.168.4.101',
    diskSpace: 85,
    memoryUsage: 41,
    cpuUsage: 30
  },
  {
    id: 'K-HYD-001',
    branchName: 'Hyderabad Hitech City',
    branchCode: 'HYD001',
    region: 'South',
    status: 'Idle',
    lastHeartbeat: '2026-02-04T04:40:00Z',
    installedVersion: '3.2.1',
    lastSyncTime: '2026-02-04T04:35:00Z',
    formsProcessedToday: 45,
    uptime: 98.8,
    ipAddress: '192.168.5.101',
    diskSpace: 72,
    memoryUsage: 25,
    cpuUsage: 15
  },
  {
    id: 'K-CHE-001',
    branchName: 'Chennai T Nagar',
    branchCode: 'CHE001',
    region: 'South',
    status: 'Online',
    lastHeartbeat: '2026-02-04T04:58:00Z',
    installedVersion: '3.2.1',
    lastSyncTime: '2026-02-04T04:53:00Z',
    formsProcessedToday: 178,
    uptime: 99.7,
    ipAddress: '192.168.6.101',
    diskSpace: 88,
    memoryUsage: 44,
    cpuUsage: 33
  },
  {
    id: 'K-PUN-001',
    branchName: 'Pune Shivaji Nagar',
    branchCode: 'PUN001',
    region: 'West',
    status: 'Online',
    lastHeartbeat: '2026-02-04T04:55:00Z',
    installedVersion: '3.2.1',
    lastSyncTime: '2026-02-04T04:49:00Z',
    formsProcessedToday: 152,
    uptime: 99.4,
    ipAddress: '192.168.7.101',
    diskSpace: 80,
    memoryUsage: 39,
    cpuUsage: 31
  },
  {
    id: 'K-AHM-001',
    branchName: 'Ahmedabad CG Road',
    branchCode: 'AHM001',
    region: 'West',
    status: 'Offline',
    lastHeartbeat: '2026-02-04T01:15:00Z',
    installedVersion: '3.1.8',
    lastSyncTime: '2026-02-04T01:10:00Z',
    formsProcessedToday: 67,
    uptime: 96.5,
    ipAddress: '192.168.8.101',
    diskSpace: 65,
    memoryUsage: 0,
    cpuUsage: 0
  }
];

// Generate additional kiosks to reach 50 total
const generateKiosks = () => {
  const regions = ['North', 'South', 'East', 'West'];
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'];
  const statuses = ['Online', 'Offline', 'Idle'];
  const statusWeights = [0.85, 0.10, 0.05]; // 85% online, 10% offline, 5% idle
  
  for (let i = kiosksData.length + 1; i <= 50; i++) {
    const city = cities[Math.floor(Math.random() * cities.length)];
    const cityCode = city.substring(0, 3).toUpperCase();
    const branchNum = Math.floor(Math.random() * 5) + 1;
    const random = Math.random();
    let status = 'Online';
    if (random > statusWeights[0] + statusWeights[1]) {
      status = 'Idle';
    } else if (random > statusWeights[0]) {
      status = 'Offline';
    }
    
    const now = new Date();
    const heartbeatMinutesAgo = status === 'Online' ? Math.floor(Math.random() * 5) : Math.floor(Math.random() * 120) + 60;
    const lastHeartbeat = new Date(now.getTime() - heartbeatMinutesAgo * 60000).toISOString();
    
    kiosksData.push({
      id: `K-${cityCode}-${String(i).padStart(3, '0')}`,
      branchName: `${city} Branch ${branchNum}`,
      branchCode: `${cityCode}${String(branchNum).padStart(3, '0')}`,
      region: regions[Math.floor(Math.random() * regions.length)],
      status,
      lastHeartbeat,
      installedVersion: status === 'Offline' ? '3.1.5' : '3.2.1',
      lastSyncTime: new Date(now.getTime() - (heartbeatMinutesAgo + 5) * 60000).toISOString(),
      formsProcessedToday: status === 'Offline' ? Math.floor(Math.random() * 50) : Math.floor(Math.random() * 150) + 50,
      uptime: status === 'Offline' ? Math.floor(Math.random() * 5) + 95 : Math.floor(Math.random() * 2) + 98,
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      diskSpace: Math.floor(Math.random() * 40) + 60,
      memoryUsage: status === 'Offline' ? 0 : Math.floor(Math.random() * 30) + 30,
      cpuUsage: status === 'Offline' ? 0 : Math.floor(Math.random() * 30) + 20
    });
  }
};

generateKiosks();

// OTA Updates Data
export const updatesData = [
  {
    id: 'UPD-001',
    updateName: 'Form Package v3.2.1',
    type: 'Forms',
    version: '3.2.1',
    createdDate: '2026-01-28',
    deployedDate: '2026-01-30',
    status: 'Completed',
    targetKiosks: 847,
    successfulKiosks: 847,
    failedKiosks: 0,
    progress: 100,
    description: 'Major update including new KYC forms and updated loan applications'
  },
  {
    id: 'UPD-002',
    updateName: 'System Security Patch',
    type: 'System',
    version: '3.2.0',
    createdDate: '2026-01-20',
    deployedDate: '2026-01-22',
    status: 'Completed',
    targetKiosks: 847,
    successfulKiosks: 843,
    failedKiosks: 4,
    progress: 99.5,
    description: 'Critical security updates and bug fixes'
  },
  {
    id: 'UPD-003',
    updateName: 'Language Pack Update',
    type: 'Localization',
    version: '2.5.0',
    createdDate: '2026-02-01',
    deployedDate: '2026-02-03',
    status: 'In Progress',
    targetKiosks: 250,
    successfulKiosks: 187,
    failedKiosks: 2,
    progress: 75,
    description: 'Regional language translations and voice packs for South region'
  },
  {
    id: 'UPD-004',
    updateName: 'Mobile Banking Forms',
    type: 'Forms',
    version: '3.5.0',
    createdDate: '2026-02-02',
    deployedDate: null,
    status: 'Scheduled',
    targetKiosks: 847,
    successfulKiosks: 0,
    failedKiosks: 0,
    progress: 0,
    description: 'New mobile banking registration and digital services forms'
  },
  {
    id: 'UPD-005',
    updateName: 'UI Enhancement Pack',
    type: 'UI/UX',
    version: '3.3.0',
    createdDate: '2026-01-15',
    deployedDate: '2026-01-18',
    status: 'Failed',
    targetKiosks: 100,
    successfulKiosks: 78,
    failedKiosks: 22,
    progress: 78,
    description: 'Accessibility improvements and new theme'
  }
];

// Users and Roles Data
export const usersData = [
  {
    id: 'U001',
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@bank.com',
    role: 'Super Admin',
    region: 'All Regions',
    status: 'Active',
    lastLogin: '2026-02-04T03:30:00Z',
    createdDate: '2024-06-15',
    permissions: ['All']
  },
  {
    id: 'U002',
    name: 'Priya Sharma',
    email: 'priya.sharma@bank.com',
    role: 'Regional Admin',
    region: 'South',
    status: 'Active',
    lastLogin: '2026-02-04T02:15:00Z',
    createdDate: '2024-08-20',
    permissions: ['Kiosks', 'Forms', 'Reports']
  },
  {
    id: 'U003',
    name: 'Amit Patel',
    email: 'amit.patel@bank.com',
    role: 'Regional Admin',
    region: 'West',
    status: 'Active',
    lastLogin: '2026-02-04T04:00:00Z',
    createdDate: '2024-09-10',
    permissions: ['Kiosks', 'Forms', 'Reports']
  },
  {
    id: 'U004',
    name: 'Sneha Reddy',
    email: 'sneha.reddy@bank.com',
    role: 'Read-Only',
    region: 'South',
    status: 'Active',
    lastLogin: '2026-02-03T08:45:00Z',
    createdDate: '2025-01-05',
    permissions: ['Reports']
  },
  {
    id: 'U005',
    name: 'Vikram Singh',
    email: 'vikram.singh@bank.com',
    role: 'Regional Admin',
    region: 'North',
    status: 'Active',
    lastLogin: '2026-02-04T01:20:00Z',
    createdDate: '2024-10-12',
    permissions: ['Kiosks', 'Forms', 'Reports']
  },
  {
    id: 'U006',
    name: 'Anita Desai',
    email: 'anita.desai@bank.com',
    role: 'Read-Only',
    region: 'West',
    status: 'Active',
    lastLogin: '2026-02-02T06:30:00Z',
    createdDate: '2025-03-18',
    permissions: ['Reports']
  },
  {
    id: 'U007',
    name: 'Suresh Nair',
    email: 'suresh.nair@bank.com',
    role: 'Regional Admin',
    region: 'East',
    status: 'Inactive',
    lastLogin: '2026-01-15T10:00:00Z',
    createdDate: '2024-07-22',
    permissions: ['Kiosks', 'Forms', 'Reports']
  },
  {
    id: 'U008',
    name: 'Kavita Menon',
    email: 'kavita.menon@bank.com',
    role: 'Read-Only',
    region: 'All Regions',
    status: 'Active',
    lastLogin: '2026-02-04T00:50:00Z',
    createdDate: '2025-05-08',
    permissions: ['Reports']
  }
];

// Reports Data
export const reportsData = {
  usageStats: {
    totalForms: 12453,
    totalKiosks: 847,
    avgFormsPerKiosk: 14.7,
    peakHours: ['10:00-12:00', '14:00-16:00'],
    topForms: [
      { name: 'Account Opening', count: 3256, percentage: 26.1 },
      { name: 'KYC Verification', count: 2834, percentage: 22.7 },
      { name: 'Loan Application', count: 2187, percentage: 17.6 },
      { name: 'ATM Card', count: 1654, percentage: 13.3 },
      { name: 'Cheque Book', count: 1342, percentage: 10.8 }
    ]
  },
  errorTrends: [
    { date: '2026-01-28', errors: 45, total: 11234 },
    { date: '2026-01-29', errors: 52, total: 11567 },
    { date: '2026-01-30', errors: 38, total: 12089 },
    { date: '2026-01-31', errors: 41, total: 11923 },
    { date: '2026-02-01', errors: 48, total: 12156 },
    { date: '2026-02-02', errors: 35, total: 11834 },
    { date: '2026-02-03', errors: 42, total: 12245 }
  ],
  languageUsage: [
    { language: 'English', percentage: 45, count: 5604 },
    { language: 'Hindi', percentage: 32, count: 3985 },
    { language: 'Tamil', percentage: 8, count: 996 },
    { language: 'Telugu', percentage: 6, count: 747 },
    { language: 'Kannada', percentage: 4, count: 498 },
    { language: 'Bengali', percentage: 3, count: 374 },
    { language: 'Marathi', percentage: 2, count: 249 }
  ],
  regionalPerformance: [
    { region: 'South', kiosks: 287, forms: 4234, uptime: 99.5 },
    { region: 'West', kiosks: 245, forms: 3678, uptime: 99.2 },
    { region: 'North', kiosks: 198, forms: 2987, uptime: 98.8 },
    { region: 'East', kiosks: 117, forms: 1554, uptime: 99.1 }
  ]
};

// Settings Data
export const settingsData = {
  languages: [
    { code: 'en', name: 'English', enabled: true, voice: true },
    { code: 'hi', name: 'Hindi', enabled: true, voice: true },
    { code: 'ta', name: 'Tamil', enabled: true, voice: true },
    { code: 'te', name: 'Telugu', enabled: true, voice: true },
    { code: 'kn', name: 'Kannada', enabled: true, voice: false },
    { code: 'bn', name: 'Bengali', enabled: true, voice: false },
    { code: 'mr', name: 'Marathi', enabled: true, voice: false },
    { code: 'gu', name: 'Gujarati', enabled: false, voice: false },
    { code: 'ml', name: 'Malayalam', enabled: true, voice: false },
    { code: 'pa', name: 'Punjabi', enabled: false, voice: false }
  ],
  systemSettings: {
    offlineMode: true,
    hybridMode: false,
    voiceVerification: true,
    biometricAuth: true,
    autoSync: true,
    syncInterval: 300, // seconds
    maxOfflineTime: 72, // hours
    dataRetention: 90 // days
  },
  auditLogs: [
    {
      id: 'AUD-001',
      timestamp: '2026-02-04T04:30:00Z',
      user: 'Rajesh Kumar',
      action: 'Form Published',
      details: 'Published Mobile Banking Form v3.5.0',
      ipAddress: '10.20.30.40',
      status: 'Success'
    },
    {
      id: 'AUD-002',
      timestamp: '2026-02-04T03:15:00Z',
      user: 'Amit Patel',
      action: 'OTA Update Initiated',
      details: 'Started deployment of Language Pack to West region',
      ipAddress: '10.20.30.45',
      status: 'Success'
    },
    {
      id: 'AUD-003',
      timestamp: '2026-02-04T02:50:00Z',
      user: 'Priya Sharma',
      action: 'Kiosk Status Change',
      details: 'Marked K-BLR-005 as maintenance mode',
      ipAddress: '10.20.30.42',
      status: 'Success'
    },
    {
      id: 'AUD-004',
      timestamp: '2026-02-04T01:20:00Z',
      user: 'Vikram Singh',
      action: 'User Role Modified',
      details: 'Updated permissions for Suresh Nair',
      ipAddress: '10.20.30.48',
      status: 'Success'
    },
    {
      id: 'AUD-005',
      timestamp: '2026-02-04T00:45:00Z',
      user: 'System',
      action: 'Auto Sync Completed',
      details: 'Synchronized 847 kiosks with central server',
      ipAddress: 'System',
      status: 'Success'
    },
    {
      id: 'AUD-006',
      timestamp: '2026-02-03T23:30:00Z',
      user: 'Rajesh Kumar',
      action: 'Security Settings Changed',
      details: 'Enabled biometric authentication',
      ipAddress: '10.20.30.40',
      status: 'Success'
    }
  ]
};

// Helper function to format dates
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

// Helper function to format time ago
export const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return `${seconds} seconds ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
};

export default {
  kpiData,
  formsData,
  kiosksData,
  updatesData,
  usersData,
  reportsData,
  settingsData,
  formatDate,
  formatTimeAgo
};
