import { useState, useEffect, useCallback } from 'react';
import apiClient from '../utils/apiClient';

const ROLES = ['Staff', 'Supervisor', 'Manager'];

const Staff = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Staff modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', pin: '', role: 'Staff' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // Reset PIN modal
  const [resetTarget, setResetTarget] = useState(null); // staff object
  const [newPin, setNewPin] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.get('/admin/staff');
      setStaffList(Array.isArray(data) ? data : (data.staff || []));
    } catch (e) {
      setError(e.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const validatePin = (pin) => /^\d{4}$/.test(pin);

  // Add staff
  const handleAdd = async (e) => {
    e.preventDefault();
    setAddError('');
    if (!addForm.name.trim()) { setAddError('Name is required'); return; }
    if (!validatePin(addForm.pin)) { setAddError('PIN must be exactly 4 digits'); return; }
    setAddLoading(true);
    try {
      await apiClient.post('/admin/staff', {
        name: addForm.name.trim(),
        pin: addForm.pin,
        role: addForm.role,
      });
      setShowAdd(false);
      setAddForm({ name: '', pin: '', role: 'Staff' });
      await fetchStaff();
    } catch (e) {
      setAddError(e.message || 'Failed to create staff user');
    } finally {
      setAddLoading(false);
    }
  };

  // Reset PIN
  const handleResetPin = async (e) => {
    e.preventDefault();
    setResetError('');
    if (!validatePin(newPin)) { setResetError('PIN must be exactly 4 digits'); return; }
    setResetLoading(true);
    try {
      await apiClient.put(`/admin/staff/${resetTarget.id}/reset-pin`, { pin: newPin });
      setResetTarget(null);
      setNewPin('');
      await fetchStaff();
    } catch (e) {
      setResetError(e.message || 'Failed to reset PIN');
    } finally {
      setResetLoading(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/admin/staff/${deleteTarget.id}`);
      setDeleteTarget(null);
      await fetchStaff();
    } catch (e) {
      setError(e.message || 'Failed to delete staff user');
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const roleBadge = (role) => {
    const map = {
      Manager: 'bg-purple-100 text-purple-700',
      Supervisor: 'bg-blue-100 text-blue-700',
      Staff: 'bg-green-100 text-green-700',
    };
    return map[role] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage kiosk staff who can unlock and operate kiosks using their PIN</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setAddError(''); setAddForm({ name: '', pin: '', role: 'Staff' }); }}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <span>+</span>
          <span>Add Staff User</span>
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 ml-4">✕</button>
        </div>
      )}

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Staff', value: staffList.length },
          { label: 'Managers', value: staffList.filter(s => s.role === 'Manager').length },
          { label: 'Active This Month', value: staffList.length },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['ID', 'Name', 'Role', 'Created', 'Actions'].map(h => (
                <th key={h} className={`text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${h === 'Actions' ? 'w-48' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                    <span>Loading staff...</span>
                  </div>
                </td>
              </tr>
            ) : staffList.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <p className="text-gray-400 text-sm">No staff users found.</p>
                  <p className="text-gray-300 text-xs mt-1">Add staff users who will use kiosks with their PIN.</p>
                </td>
              </tr>
            ) : (
              staffList.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">#{s.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${roleBadge(s.role)}`}>
                      {s.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(s.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => { setResetTarget(s); setNewPin(''); setResetError(''); }}
                        className="px-3 py-1.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors font-medium"
                      >
                        🔑 Reset PIN
                      </button>
                      <button
                        onClick={() => setDeleteTarget(s)}
                        className="px-3 py-1.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium"
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Add Staff User</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleAdd} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. Ravi Kumar"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">4-Digit PIN <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={addForm.pin}
                  onChange={e => setAddForm({ ...addForm, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  placeholder="••••"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono tracking-widest"
                />
                <p className="mt-1 text-xs text-gray-400">The staff member will use this PIN to unlock the kiosk</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={addForm.role}
                  onChange={e => setAddForm({ ...addForm, role: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {addError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{addError}</p>}
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={addLoading} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center space-x-2">
                  {addLoading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>{addLoading ? 'Creating...' : 'Create Staff User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset PIN Modal */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Reset PIN</h2>
              <button onClick={() => setResetTarget(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleResetPin} className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-600">
                Resetting PIN for <strong>{resetTarget.name}</strong>. The old PIN will be replaced immediately.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New 4-Digit PIN <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono tracking-widest"
                  autoFocus
                />
              </div>
              {resetError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{resetError}</p>}
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setResetTarget(null)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={resetLoading} className="px-4 py-2 text-sm text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-60 flex items-center space-x-2">
                  {resetLoading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>{resetLoading ? 'Resetting...' : 'Reset PIN'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-5">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🗑</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Staff User</h2>
              <p className="text-sm text-gray-600 text-center">
                Are you sure you want to delete <strong>{deleteTarget.name}</strong>? 
                They will no longer be able to authenticate at any kiosk.
              </p>
              <div className="flex space-x-3 mt-6">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleteLoading} className="flex-1 px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center space-x-2">
                  {deleteLoading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>{deleteLoading ? 'Deleting...' : 'Yes, Delete'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
