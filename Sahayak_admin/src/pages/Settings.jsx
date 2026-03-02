import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import Badge from '../components/Badge';
import Button from '../components/Button';
import api from '../utils/apiClient';

const formatTimeAgo = (iso) => {
  if (!iso) return 'N/A';
  const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
};

const DEFAULTS = {
  offline_mode: true,
  hybrid_mode: false,
  voice_verification: false,
  auto_sync: true,
  sync_interval: 300,
  data_retention: 90,
};

/**
 * Settings Page
 * System configuration, compliance settings, and audit logs
 */
const Settings = () => {
  const [settings, setSettings] = useState(DEFAULTS);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [sData, aData] = await Promise.all([
        api.get('/api/admin/settings'),
        api.get('/api/admin/audit-logs?limit=20'),
      ]);
      setSettings({ ...DEFAULTS, ...sData });
      setAuditLogs(aData.logs || aData || []);
    } catch (err) {
      console.error('Settings fetch error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleToggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }));
  const handleNum = (key, val) => setSettings(s => ({ ...s, [key]: Number(val) }));

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      await api.put('/api/admin/settings', { settings });
      setSaveMsg('Settings saved successfully.');
    } catch (err) {
      setSaveMsg('Failed to save: ' + (err.message || 'unknown error'));
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  return (
    <div className="p-8">
      <Header 
        title="Settings & Compliance" 
        subtitle="System configuration and audit management"
      />

      {/* Language Configuration (static — actual language toggles are per-kiosk OTA, not a global DB setting) */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🌐 Language Support</h3>
        <p className="text-sm text-gray-600 mb-4">
          These are the languages supported by the OCR and TTS microservices.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[{ name: 'English', code: 'en', voice: true }, { name: 'Hindi', code: 'hi', voice: true }, { name: 'Tamil', code: 'ta', voice: true }].map(lang => (
            <div key={lang.code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">{lang.name}</div>
                <div className="text-xs text-gray-500">Code: {lang.code}</div>
              </div>
              {lang.voice && <Badge variant="success">🎤 Voice</Badge>}
            </div>
          ))}
        </div>
      </div>

      {/* System Settings */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ System Settings</h3>
        {loading && <p className="text-sm text-gray-400 mb-4">Loading…</p>}
        
        <div className="space-y-6">
          {[
            { key: 'offline_mode', label: 'Offline-First Mode', desc: 'Kiosks operate primarily offline, syncing when internet is available.', trueLabel: 'Enabled', falseLabel: 'Disabled' },
            { key: 'hybrid_mode', label: 'Hybrid Mode', desc: 'Enhanced online features when internet is available.', trueLabel: 'Enabled', falseLabel: 'Disabled' },
            { key: 'voice_verification', label: 'Voice Verification', desc: 'Biometric voice authentication at kiosks.', trueLabel: 'Active', falseLabel: 'Inactive' },
            { key: 'auto_sync', label: 'Automatic Synchronisation', desc: 'Kiosks automatically sync periodically.', trueLabel: 'Enabled', falseLabel: 'Disabled' },
          ].map(({ key, label, desc, trueLabel, falseLabel }) => (
            <div key={key} className="flex items-start justify-between pb-4 border-b border-gray-200">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">{label}</h4>
                <p className="text-sm text-gray-600 mt-1">{desc}</p>
              </div>
              <div className="ml-4 flex items-center space-x-2">
                <Badge variant={settings[key] ? 'success' : 'default'}>
                  {settings[key] ? trueLabel : falseLabel}
                </Badge>
                <button
                  onClick={() => handleToggle(key)}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Toggle
                </button>
              </div>
            </div>
          ))}

          <div className="flex items-start justify-between pb-4 border-b border-gray-200">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Sync Interval (seconds)</h4>
              <p className="text-sm text-gray-600 mt-1">How often kiosks sync with the server.</p>
            </div>
            <input
              type="number"
              min={60}
              className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
              value={settings.sync_interval ?? 300}
              onChange={(e) => handleNum('sync_interval', e.target.value)}
            />
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Data Retention Period (days)</h4>
              <p className="text-sm text-gray-600 mt-1">Audit trails retained for compliance.</p>
            </div>
            <input
              type="number"
              min={7}
              className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
              value={settings.data_retention ?? 90}
              onChange={(e) => handleNum('data_retention', e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center space-x-4">
          <Button variant="primary" size="md" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : '💾 Save Settings'}
          </Button>
          {saveMsg && <span className="text-sm text-green-600">{saveMsg}</span>}
        </div>
      </div>

      {/* Compliance Information */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔒 Compliance & Security</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <div className="text-sm text-green-700 mb-1">RBI Compliance</div>
            <Badge variant="success">✓ Certified</Badge>
          </div>
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <div className="text-sm text-green-700 mb-1">PMLA Standards</div>
            <Badge variant="success">✓ Compliant</Badge>
          </div>
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <div className="text-sm text-green-700 mb-1">Data Privacy</div>
            <Badge variant="success">✓ ISO 27001</Badge>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">🛡️ Security Features</h4>
          <ul className="text-sm text-blue-800 space-y-1 ml-4">
            <li className="list-disc">End-to-end encryption for all data transmission</li>
            <li className="list-disc">Biometric authentication at kiosks</li>
            <li className="list-disc">Multi-factor authentication for admin users</li>
            <li className="list-disc">Comprehensive audit logging of all actions</li>
            <li className="list-disc">Regular security audits and penetration testing</li>
          </ul>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">📋 Recent Audit Logs</h3>
          <Button variant="outline" size="sm" onClick={fetchSettings}>↻ Refresh</Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditLogs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-4 text-sm text-gray-400">No audit logs.</td></tr>
              ) : auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                    {formatTimeAgo(log.created_at || log.timestamp)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {log.admin_name || log.user || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {log.action}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {log.details}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge variant={log.status === 'success' || log.status === 'Success' ? 'success' : 'error'}>
                      {log.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Information */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">ℹ️ System Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Platform Version:</span>
            <span className="ml-2 font-mono font-medium">v1.0.0</span>
          </div>
          <div>
            <span className="text-gray-600">Database:</span>
            <span className="ml-2 font-medium">PostgreSQL 15</span>
          </div>
          <div>
            <span className="text-gray-600">OCR Engine:</span>
            <span className="ml-2 font-medium">Tesseract (eng+hin+tam)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Settings Page
 * System configuration, compliance settings, and audit logs
 */

export default Settings;
