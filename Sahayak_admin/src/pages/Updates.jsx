import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Button from '../components/Button';
import api from '../utils/apiClient';

/**
 * Updates Page (OTA Control)
 * Manage over-the-air updates to kiosks
 * Push forms, system updates, and configurations to selected kiosks or regions
 */
const formatDate = (iso) => {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const Updates = () => {
  const [updatesData, setUpdatesData] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedVersion, setSelectedVersion] = useState('3.2.1');
  const [deployUpdateName, setDeployUpdateName] = useState('');
  const [deployType, setDeployType] = useState('form_update');
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState('');

  const fetchUpdates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/admin/updates');
      const list = (data.updates || data || []).map(u => ({
        id: u.id,
        updateName: u.update_name,
        type: u.update_type || u.type,
        version: u.version,
        status: u.status,
        progress: u.progress ?? 0,
        targetKiosks: u.target_kiosks ?? 0,
        successfulKiosks: u.successful_kiosks ?? 0,
        failedKiosks: u.failed_kiosks ?? 0,
        deployedDate: u.deployed_at || u.created_at,
        targetRegion: u.target_region,
      }));
      setUpdatesData(list);
      const uniqueRegions = [...new Set(list.map(u => u.targetRegion).filter(Boolean))];
      setRegions(uniqueRegions);
    } catch (err) {
      console.error('Failed to fetch updates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUpdates(); }, [fetchUpdates]);

  const handleDeploy = async () => {
    setDeployError('');
    if (!deployUpdateName.trim()) { setDeployError('Update name is required.'); return; }
    setDeploying(true);
    try {
      await api.post('/api/admin/updates', {
        update_name: deployUpdateName.trim(),
        update_type: deployType,
        version: selectedVersion,
        target_region: selectedRegion === 'all' ? null : selectedRegion,
      });
      setDeployUpdateName('');
      fetchUpdates();
    } catch (err) {
      setDeployError(err.message || 'Deploy failed');
    } finally {
      setDeploying(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this update?')) return;
    try {
      await api.patch(`/api/admin/updates/${id}/cancel`);
      fetchUpdates();
    } catch (err) {
      alert(err.message || 'Failed to cancel update');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'Completed': 'success',
      'In Progress': 'info',
      'Scheduled': 'warning',
      'Failed': 'error'
    };
    return <Badge variant={statusMap[status] || 'default'}>{status}</Badge>;
  };

  const columns = [
    {
      header: 'Update ID',
      accessor: 'id',
      render: (row) => <span className="font-mono text-xs">{row.id}</span>
    },
    {
      header: 'Update Name',
      accessor: 'updateName',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.updateName}</div>
          <div className="text-xs text-gray-500">{row.type}</div>
        </div>
      )
    },
    {
      header: 'Version',
      accessor: 'version',
      render: (row) => <span className="font-mono text-sm">{row.version}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => getStatusBadge(row.status)
    },
    {
      header: 'Progress',
      accessor: 'progress',
      render: (row) => (
        <div className="w-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">{row.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                row.progress === 100 ? 'bg-green-500' :
                row.progress > 50 ? 'bg-blue-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${row.progress}%` }}
            ></div>
          </div>
        </div>
      )
    },
    {
      header: 'Target / Success / Failed',
      accessor: 'stats',
      render: (row) => (
        <div className="text-sm">
          <span className="font-medium">{row.targetKiosks}</span>
          {' / '}
          <span className="text-green-600">{row.successfulKiosks}</span>
          {' / '}
          <span className="text-red-600">{row.failedKiosks}</span>
        </div>
      )
    },
    {
      header: 'Deployed Date',
      accessor: 'deployedDate',
      render: (row) => (
        <span className="text-sm text-gray-600">
          {row.deployedDate ? formatDate(row.deployedDate) : 'Not deployed'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        row.status === 'Scheduled' || row.status === 'In Progress' ? (
          <button
            onClick={() => handleCancel(row.id)}
            className="text-xs text-red-600 hover:text-red-800 font-medium"
          >
            Cancel
          </button>
        ) : <span className="text-gray-400 text-xs">—</span>
      )
    }
  ];

  return (
    <div className="p-8">
      <Header 
        title="Updates & OTA Control" 
        subtitle="Manage over-the-air updates and deployments"
      />

      {/* Create New Update */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🚀 Create New Update Deployment
        </h3>
        {deployError && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{deployError}</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="form-label">Update Name</label>
            <input
              type="text"
              value={deployUpdateName}
              onChange={(e) => setDeployUpdateName(e.target.value)}
              placeholder="e.g. Form Pack v3.2.1"
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Update Type</label>
            <select value={deployType} onChange={(e) => setDeployType(e.target.value)} className="form-input">
              <option value="form_update">Form Update</option>
              <option value="system_update">System Update</option>
              <option value="config_update">Config Update</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Version</label>
            <input
              type="text"
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              placeholder="e.g. 3.2.1"
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Target Region</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="form-input"
            >
              <option value="all">All Regions</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="primary" size="md" className="w-full" onClick={handleDeploy} disabled={deploying}>
              {deploying ? 'Deploying…' : '📤 Deploy Update'}
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Updates will be pushed to selected kiosks. Kiosks will download and apply updates during their next sync cycle.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <div className="text-sm text-green-700">Completed</div>
          <div className="text-2xl font-bold text-green-900 mt-1">
            {updatesData.filter(u => u.status === 'Completed').length}
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="text-sm text-blue-700">In Progress</div>
          <div className="text-2xl font-bold text-blue-900 mt-1">
            {updatesData.filter(u => u.status === 'In Progress').length}
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
          <div className="text-sm text-yellow-700">Scheduled</div>
          <div className="text-2xl font-bold text-yellow-900 mt-1">
            {updatesData.filter(u => u.status === 'Scheduled').length}
          </div>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <div className="text-sm text-red-700">Failed</div>
          <div className="text-2xl font-bold text-red-900 mt-1">
            {updatesData.filter(u => u.status === 'Failed').length}
          </div>
        </div>
      </div>

      {/* Updates History Table */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Update History</h3>
          <button onClick={fetchUpdates} disabled={loading} className="text-sm text-indigo-600 hover:text-indigo-800">
            {loading ? 'Loading…' : '↻ Refresh'}
          </button>
        </div>
        <Table columns={columns} data={updatesData} />
      </div>

      {/* Information Notice */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          📡 OTA Update Mechanism
        </h4>
        <ul className="text-sm text-blue-800 space-y-1 ml-4">
          <li className="list-disc">Updates are deployed region-wise or to specific kiosks</li>
          <li className="list-disc">Kiosks check for updates every 5 minutes during sync</li>
          <li className="list-disc">Updates are applied automatically without user intervention</li>
          <li className="list-disc">Failed updates are retried automatically up to 3 times</li>
          <li className="list-disc">Rollback is available for critical failures</li>
        </ul>
      </div>
    </div>
  );
};

export default Updates;
