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
 * Users Page
 * Manage admin users and their roles
 * Role-based access control (visual only in this demo)
 */
const Users = () => {
  const [usersData, setUsersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', role: 'Regional Admin', region: 'All Regions' });
  const [addError, setAddError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const data = await api.get('/admin/users');
    if (data) setUsersData(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAddError('');
    try {
      await api.post('/admin/users', addForm);
      setShowAddModal(false);
      setAddForm({ name: '', email: '', password: '', role: 'Regional Admin', region: 'All Regions' });
      fetchUsers();
    } catch (err) {
      setAddError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (userId) => {
    if (!confirm('Deactivate this user?')) return;
    await api.delete(`/admin/users/${userId}`);
    fetchUsers();
    setShowModal(false);
  };

  const roles = [...new Set(usersData.map(u => u.role))];

  const filteredUsers = usersData.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role) => {
    const roleMap = {
      'Super Admin': 'error',
      'Regional Admin': 'info',
      'Read-Only': 'default'
    };
    return <Badge variant={roleMap[role] || 'default'}>{role}</Badge>;
  };

  const getStatusBadge = (status) => {
    return <Badge variant={status === 'Active' ? 'success' : 'default'}>{status}</Badge>;
  };

  const columns = [
    {
      header: 'User ID',
      accessor: 'id',
      render: (row) => <span className="font-mono text-xs">{row.id}</span>
    },
    {
      header: 'Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          <div className="text-xs text-gray-500">{row.email}</div>
        </div>
      )
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (row) => getRoleBadge(row.role)
    },
    {
      header: 'Region',
      accessor: 'region',
      render: (row) => <span className="text-sm">{row.region}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => getStatusBadge(row.status)
    },
    {
      header: 'Last Login',
      accessor: 'lastLogin',
      render: (row) => (
        <span className="text-sm text-gray-600">
          {formatTimeAgo(row.lastLogin)}
        </span>
      )
    }
  ];

  return (
    <div className="p-8">
      <Header 
        title="Users & Roles" 
        subtitle="Manage admin users and access control"
      />

      {/* Role Explanation */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">👥 Role-Based Access Control</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <div><strong>Super Admin:</strong> Full system access - manage all kiosks, forms, users, and settings</div>
          <div><strong>Regional Admin:</strong> Manage kiosks and forms within assigned region only</div>
          <div><strong>Read-Only:</strong> View reports and analytics, no modification permissions</div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Total Users</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{usersData.length}</div>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <div className="text-sm text-red-700">Super Admins</div>
          <div className="text-2xl font-bold text-red-900 mt-1">
            {usersData.filter(u => u.role === 'Super Admin').length}
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="text-sm text-blue-700">Regional Admins</div>
          <div className="text-2xl font-bold text-blue-900 mt-1">
            {usersData.filter(u => u.role === 'Regional Admin').length}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Read-Only</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {usersData.filter(u => u.role === 'Read-Only').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            {roles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        <Button variant="primary" size="md" onClick={() => setShowAddModal(true)}>
          ➕ Add New User
        </Button>
      </div>

      {/* Users Table */}
      <div className="mt-6">
        <Table
          columns={columns}
          data={filteredUsers}
          onRowClick={(user) => {
            setSelectedUser(user);
            setShowModal(true);
          }}
        />
      </div>

      {/* User Detail Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="User Details"
        size="md"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">User ID</label>
                <p className="text-sm font-mono mt-1">{selectedUser.id}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Status</label>
                <div className="mt-1">{getStatusBadge(selectedUser.status)}</div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Name</label>
                <p className="text-sm font-medium mt-1">{selectedUser.name}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Email</label>
                <p className="text-sm mt-1">{selectedUser.email}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Role</label>
                <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Region</label>
                <p className="text-sm mt-1">{selectedUser.region}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Permissions</h4>
              <div className="flex flex-wrap gap-2">
                {selectedUser.permissions.map((perm, idx) => (
                  <Badge key={idx} variant="info">{perm}</Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
              {selectedUser.status === 'Active' && (
                <Button variant="danger" onClick={() => handleDeactivate(selectedUser.id)}>🗑️ Deactivate</Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add User Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Admin User" size="md">
        <form onSubmit={handleAddUser} className="space-y-4">
          {addError && <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{addError}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={addForm.name} onChange={e => setAddForm(f => ({...f, name: e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input required type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={addForm.email} onChange={e => setAddForm(f => ({...f, email: e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input required type="password" minLength={6} className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={addForm.password} onChange={e => setAddForm(f => ({...f, password: e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={addForm.role} onChange={e => setAddForm(f => ({...f, role: e.target.value}))}>
              <option>Super Admin</option>
              <option>Regional Admin</option>
              <option>Read-Only</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={addForm.region} onChange={e => setAddForm(f => ({...f, region: e.target.value}))} />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Creating...' : 'Create User'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
