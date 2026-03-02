import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import api from '../utils/apiClient';

const formatTimeAgo = (isoStr) => {
  if (!isoStr) return 'Never';
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

/**
 * Kiosks Page
 * Monitor and manage all deployed kiosks across branches
 * Real-time status tracking, health metrics, and deployment information
 */
const Kiosks = () => {
  const [kiosksData, setKiosksData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [selectedKiosk, setSelectedKiosk] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchKiosks = useCallback(async () => {
    setLoading(true);
    const data = await api.get('/admin/kiosks');
    if (data) setKiosksData(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchKiosks(); }, [fetchKiosks]);

  // Normalise field names: backend uses snake_case
  const normalise = (k) => ({
    ...k,
    branchName: k.branch_name,
    branchCode: k.branch_code,
    lastHeartbeat: k.last_heartbeat,
    installedVersion: k.installed_version,
    lastSyncTime: k.last_sync,
    formsProcessedToday: k.forms_today,
    ipAddress: k.ip_address,
    // placeholders for fields not in heartbeat
    cpuUsage: 0,
    memoryUsage: 0,
    diskSpace: 0,
    uptime: 99.9,
  });

  const normalised = kiosksData.map(normalise);

  // Get unique regions
  const regions = [...new Set(normalised.map(k => k.region))];

  // Filter kiosks
  const filteredKiosks = normalised.filter(kiosk => {
    const matchesSearch = (kiosk.device_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (kiosk.branchName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || kiosk.status === statusFilter;
    const matchesRegion = regionFilter === 'all' || kiosk.region === regionFilter;
    return matchesSearch && matchesStatus && matchesRegion;
  });

  // Status badge mapping (backend returns lowercase)
  const getStatusBadge = (status) => {
    const statusMap = {
      'online': 'success',
      'offline': 'error',
      'maintenance': 'warning'
    };
    return <Badge variant={statusMap[status?.toLowerCase()] || 'default'}>{status}</Badge>;
  };

  // Table columns
  const columns = [
    {
      header: 'Kiosk ID',
      accessor: 'id',
      render: (row) => <span className="font-mono text-xs font-medium">{row.id}</span>
    },
    {
      header: 'Branch',
      accessor: 'branchName',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.branchName}</div>
          <div className="text-xs text-gray-500">{row.branchCode}</div>
        </div>
      )
    },
    {
      header: 'Region',
      accessor: 'region',
      render: (row) => <span className="text-sm">{row.region}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <span className={`inline-block w-2 h-2 rounded-full ${
            row.status === 'online' ? 'bg-green-500' :
            row.status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
          }`}></span>
          {getStatusBadge(row.status)}
        </div>
      )
    },
    {
      header: 'Last Heartbeat',
      accessor: 'lastHeartbeat',
      render: (row) => (
        <div className="text-sm text-gray-600">
          {formatTimeAgo(row.lastHeartbeat)}
        </div>
      )
    },
    {
      header: 'Version',
      accessor: 'installedVersion',
      render: (row) => <span className="font-mono text-xs">{row.installedVersion}</span>
    },
    {
      header: 'Forms Today',
      accessor: 'formsProcessedToday',
      render: (row) => (
        <span className="font-medium">{row.formsProcessedToday.toLocaleString()}</span>
      )
    },
    {
      header: 'Uptime',
      accessor: 'uptime',
      render: (row) => (
        <span className={`text-sm ${row.uptime >= 99 ? 'text-green-600' : 'text-yellow-600'}`}>
          {row.uptime}%
        </span>
      )
    }
  ];

  return (
    <div className="p-8">
      <Header 
        title="Kiosks" 
        subtitle="Monitor and manage deployed kiosks across all branches"
      />

      {/* Summary Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Total Kiosks</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {normalised.length}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <div className="text-sm text-green-700">Online</div>
          <div className="text-2xl font-bold text-green-900 mt-1">
            {normalised.filter(k => k.status === 'online').length}
          </div>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <div className="text-sm text-red-700">Offline</div>
          <div className="text-2xl font-bold text-red-900 mt-1">
            {normalised.filter(k => k.status === 'offline').length}
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
          <div className="text-sm text-yellow-700">Maintenance</div>
          <div className="text-2xl font-bold text-yellow-900 mt-1">
            {normalised.filter(k => k.status === 'maintenance').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search kiosks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
            <option value="Idle">Idle</option>
          </select>

          {/* Region Filter */}
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Regions</option>
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="md">
            📥 Export Data
          </Button>
          <Button variant="primary" size="md" onClick={fetchKiosks}>
            🔄 {loading ? 'Loading...' : 'Refresh Status'}
          </Button>
        </div>
      </div>

      {/* Kiosks Table */}
      <div className="mt-6">
        <Table
          columns={columns}
          data={filteredKiosks}
          onRowClick={(kiosk) => {
            setSelectedKiosk(kiosk);
            setShowModal(true);
          }}
        />
      </div>

      {/* Kiosk Detail Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Kiosk Details - ${selectedKiosk?.id}`}
        size="lg"
      >
        {selectedKiosk && (
          <div className="space-y-6">
            {/* Status Overview */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Current Status</h4>
                <div className="mt-2 flex items-center space-x-3">
                  {getStatusBadge(selectedKiosk.status)}
                  <span className="text-sm text-gray-600">
                    Last heartbeat: {formatTimeAgo(selectedKiosk.lastHeartbeat)}
                  </span>
                </div>
              </div>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                selectedKiosk.status === 'online' ? 'bg-green-100' :
                selectedKiosk.status === 'offline' ? 'bg-red-100' : 'bg-yellow-100'
              }`}>
                <span className={`w-8 h-8 rounded-full ${
                  selectedKiosk.status === 'online' ? 'bg-green-500' :
                  selectedKiosk.status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></span>
              </div>
            </div>

            {/* Location Info */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Location Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Branch Name</label>
                  <p className="text-sm font-medium mt-1">{selectedKiosk.branchName}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Branch Code</label>
                  <p className="text-sm font-mono mt-1">{selectedKiosk.branchCode}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Region</label>
                  <p className="text-sm mt-1">{selectedKiosk.region}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">IP Address</label>
                  <p className="text-sm font-mono mt-1">{selectedKiosk.ipAddress}</p>
                </div>
              </div>
            </div>

            {/* Health Metrics */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Health Metrics</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">CPU Usage</span>
                    <span className="text-sm font-medium">{selectedKiosk.cpuUsage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        selectedKiosk.cpuUsage > 80 ? 'bg-red-500' :
                        selectedKiosk.cpuUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${selectedKiosk.cpuUsage}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Memory Usage</span>
                    <span className="text-sm font-medium">{selectedKiosk.memoryUsage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        selectedKiosk.memoryUsage > 80 ? 'bg-red-500' :
                        selectedKiosk.memoryUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${selectedKiosk.memoryUsage}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Disk Space Available</span>
                    <span className="text-sm font-medium">{selectedKiosk.diskSpace} GB</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(selectedKiosk.diskSpace / 100) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Performance Statistics</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-blue-700">Forms Processed Today</div>
                  <div className="text-2xl font-bold text-blue-900 mt-1">
                    {selectedKiosk.formsProcessedToday}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-xs text-green-700">Uptime</div>
                  <div className="text-2xl font-bold text-green-900 mt-1">
                    {selectedKiosk.uptime}%
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-xs text-purple-700">Version</div>
                  <div className="text-xl font-mono font-bold text-purple-900 mt-1">
                    {selectedKiosk.installedVersion}
                  </div>
                </div>
              </div>
            </div>

            {/* Sync Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Synchronization</h4>
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Last Sync:</span>
                  <span className="font-medium">{formatTimeAgo(selectedKiosk.lastSyncTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Installed Version:</span>
                  <span className="font-mono font-medium">{selectedKiosk.installedVersion}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Close
              </Button>
              <Button variant="outline">
                📊 View Logs
              </Button>
              <Button variant="primary">
                🔄 Force Sync
              </Button>
              {selectedKiosk.status === 'offline' && (
                <Button variant="danger">
                  🔧 Troubleshoot
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Kiosks;
