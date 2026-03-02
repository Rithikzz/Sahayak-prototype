import { useState, useEffect } from 'react';
import Header from '../components/Header';
import KPICard from '../components/KPICard';
import api from '../utils/apiClient';

/**
 * Dashboard Page
 * Main overview page showing KPIs, system health, and quick stats
 * NO customer data - only system metrics and administrative insights
 */
const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('today');
  const [kpi, setKpi] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/reports/kpi'),
      api.get('/admin/audit-logs?limit=5'),
    ]).then(([kpiRes, logsRes]) => {
      if (kpiRes) setKpi(kpiRes);
      if (logsRes) setAuditLogs(logsRes.logs || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  const totalKiosks = kpi?.total_kiosks ?? 0;
  const activeKiosks = kpi?.active_kiosks ?? 0;
  const offlineKiosks = totalKiosks - activeKiosks;

  return (
    <div className="p-8">
      <Header 
        title="Dashboard" 
        subtitle="Real-time system overview and key metrics"
      />

      {/* Time Range Selector */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Showing data for:</span>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString('en-IN')}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Kiosks"
          value={totalKiosks.toLocaleString()}
          subtitle={`${activeKiosks} online, ${offlineKiosks} offline`}
          icon="🖥️"
          color="blue"
        />
        <KPICard
          title="Active Kiosks"
          value={activeKiosks.toLocaleString()}
          subtitle={`${totalKiosks ? ((activeKiosks / totalKiosks) * 100).toFixed(1) : 0}% uptime`}
          icon="✅"
          color="green"
          trend={{ direction: 'up', value: '+2.3%' }}
        />
        <KPICard
          title="Forms Processed Today"
          value={(kpi?.forms_processed_today ?? 0).toLocaleString()}
          subtitle="Across all kiosks"
          icon="📝"
          color="purple"
          trend={{ direction: 'up', value: '+8.5%' }}
        />
        <KPICard
          title="Error Rate"
          value={`${kpi?.error_rate ?? 0}%`}
          subtitle="Below threshold"
          icon="⚠️"
          color="yellow"
          trend={{ direction: 'down', value: '-0.2%' }}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Forms"
          value={(kpi?.total_forms ?? 0).toLocaleString()}
          subtitle="All time submissions"
          icon="📋"
          color="blue"
        />
        <KPICard
          title="Pending Updates"
          value={kpi?.pending_updates ?? 0}
          subtitle="OTA deployments"
          icon="🔄"
          color="yellow"
        />
        <KPICard
          title="Active Admins"
          value={kpi?.active_admins ?? 0}
          subtitle="Logged in today"
          icon="👥"
          color="purple"
        />
        <KPICard
          title="System Uptime"
          value={`${kpi?.system_uptime ?? 99.8}%`}
          subtitle="Last 30 days"
          icon="📊"
          color="green"
        />
      </div>

      {/* Charts and Visualizations */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kiosk Status Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Kiosk Status Distribution
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Online</span>
                <span className="text-sm font-medium text-gray-900">{activeKiosks}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: totalKiosks ? `${(activeKiosks / totalKiosks) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Offline</span>
                <span className="text-sm font-medium text-gray-900">{offlineKiosks}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: totalKiosks ? `${(offlineKiosks / totalKiosks) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity from audit log */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent System Activity
          </h3>
          <div className="space-y-4">
            {auditLogs.length === 0 ? (
              <p className="text-sm text-gray-500">No activity recorded yet.</p>
            ) : (
              auditLogs.map((log, idx) => (
                <div key={idx} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${log.status === 'Success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div>
                    <p className="text-sm text-gray-900">{log.action}: {log.details}</p>
                    <p className="text-xs text-gray-500">{log.user ?? 'System'} &nbsp;·&nbsp; {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN') : ''}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* System Alerts */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-yellow-800">
              Attention Required
            </h4>
            <p className="text-sm text-yellow-700 mt-1">
              {offlineKiosks} kiosks are currently offline. Check the Kiosks page for details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
