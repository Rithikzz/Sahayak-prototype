import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import api from '../utils/apiClient';

const PERIODS = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 3 Months', value: '90d' },
];

/**
 * Reports Page
 * Analytics and statistics for system usage and performance
 */
const Reports = () => {
  const [period, setPeriod] = useState('30d');
  const [kpi, setKpi] = useState(null);
  const [usage, setUsage] = useState([]);
  const [errors, setErrors] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [kpiData, usageData, errData, regData] = await Promise.all([
        api.get('/api/admin/reports/kpi'),
        api.get(`/api/admin/reports/usage?period=${period}`),
        api.get(`/api/admin/reports/errors?period=${period}`),
        api.get('/api/admin/reports/regions'),
      ]);
      setKpi(kpiData);
      setUsage(usageData.usage || usageData || []);
      setErrors(errData.errors || errData || []);
      setRegions(regData.regions || regData || []);
    } catch (err) {
      console.error('Reports fetch error', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const totalForms = usage.reduce((s, u) => s + (u.count || 0), 0);
  const maxUsage = Math.max(...usage.map(u => u.count || 0), 1);

  return (
    <div className="p-8">
      <Header 
        title="Reports & Analytics" 
        subtitle="Usage statistics, trends, and performance insights"
      />

      {/* Export Actions */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Report Period:</span>
          <select
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          {loading && <span className="text-xs text-gray-400 ml-2">Loading…</span>}
        </div>
        <button className="btn btn-secondary" onClick={fetchAll}>
          ↻ Refresh
        </button>
      </div>

      {/* Usage Statistics */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Usage Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm text-gray-500">Total Forms Processed</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {(kpi?.forms_processed_today ?? totalForms).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">Across all kiosks</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm text-gray-500">Active Kiosks</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {kpi?.active_kiosks ?? '—'}
            </div>
            <div className="text-sm text-gray-600 mt-1">Currently online</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm text-gray-500">Error Rate</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {kpi ? `${kpi.error_rate}%` : '—'}
            </div>
            <div className="text-sm text-gray-600 mt-1">System-wide</div>
          </div>
        </div>
      </div>

      {/* Top Service Types */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Usage by Service Type</h3>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-4">
            {usage.length === 0 ? (
              <p className="text-sm text-gray-400">No data for selected period.</p>
            ) : usage.map((u, idx) => {
              const pct = Math.round((u.count / maxUsage) * 100);
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{u.service_type || u.name}</span>
                    <span className="text-sm text-gray-600">
                      {(u.count || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error Trends */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📉 Error Trends</h3>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-3">
              {errors.length === 0 ? (
                <p className="text-sm text-gray-400">No error data.</p>
              ) : errors.map((day, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{day.date || day.day}</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900">
                      {day.errors || day.count || 0} errors
                    </span>
                    {day.total ? (
                      <span className="text-xs text-gray-500">
                        {(((day.errors || 0) / day.total) * 100).toFixed(2)}%
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending updates stat */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔄 System Health</h3>
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Kiosks</span>
              <span className="text-sm font-bold">{kpi?.total_kiosks ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Online Now</span>
              <span className="text-sm font-bold text-green-600">{kpi?.active_kiosks ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pending Updates</span>
              <span className="text-sm font-bold text-yellow-600">{kpi?.pending_updates ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active Admins</span>
              <span className="text-sm font-bold">{kpi?.active_admins ?? '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Regional Performance */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🗺️ Regional Performance</h3>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kiosks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Forms Processed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Online</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {regions.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-4 text-sm text-gray-400">No regional data.</td></tr>
              ) : regions.map((region, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {region.region}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {region.kiosks || region.total_kiosks}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {(region.forms || region.forms_processed || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-green-600">
                      {region.online_kiosks ?? '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
