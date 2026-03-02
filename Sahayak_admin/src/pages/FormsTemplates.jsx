import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import api from '../utils/apiClient';

const formatDate = (iso) => {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/**
 * Forms & Templates Page
 * MOST CRITICAL PAGE - Centralized control for all official bank forms
 */
const FormsTemplates = () => {
  const [formsData, setFormsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedForm, setSelectedForm] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // OCR upload state
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [ocrFile, setOcrFile] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState('');

  // Create/edit template state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formDraft, setFormDraft] = useState({ name: '', category: '', languages: 'English,Hindi', field_definitions: '{}' });
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchForms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/admin/forms');
      setFormsData(data.forms || data || []);
    } catch (err) {
      console.error('Forms fetch error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchForms(); }, [fetchForms]);

  // Normalise a form row for display
  const norm = (f) => ({
    id: f.id,
    name: f.name,
    category: f.category,
    version: f.version || '1.0',
    status: f.status,
    languages: Array.isArray(f.languages) ? f.languages : (f.languages || 'English').split(','),
    compliance: f.compliance || 'Pending Review',
    deployedTo: f.deployed_to ?? 0,
    totalVersions: f.total_versions ?? 1,
    lastUpdated: f.updated_at,
    publishedDate: f.published_at,
    description: f.description || '',
    field_definitions: f.field_definitions,
  });

  const normalised = formsData.map(norm);

  const filteredForms = normalised.filter(form => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = form.name.toLowerCase().includes(q) || String(form.id).includes(q);
    const matchesStatus = statusFilter === 'all' || form.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const map = { 'Published': 'success', 'Draft': 'warning', 'Archived': 'default' };
    return <Badge variant={map[status] || 'default'}>{status}</Badge>;
  };

  const handlePublish = async (id) => {
    try {
      await api.post(`/api/admin/forms/${id}/publish`);
      fetchForms();
      setShowModal(false);
    } catch (err) { alert(err.message || 'Publish failed'); }
  };

  const handleArchive = async (id) => {
    if (!window.confirm('Archive this form? It will no longer be deployed to kiosks.')) return;
    try {
      await api.post(`/api/admin/forms/${id}/archive`);
      fetchForms();
      setShowModal(false);
    } catch (err) { alert(err.message || 'Archive failed'); }
  };

  const handleOcrUpload = async () => {
    if (!ocrFile) return;
    setOcrLoading(true);
    setOcrError('');
    setOcrResult(null);
    try {
      const result = await api.upload('/api/admin/forms/ocr', ocrFile);
      setOcrResult(result);
    } catch (err) {
      setOcrError(err.message || 'OCR extraction failed');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    setSaveError('');
    if (!formDraft.name.trim()) { setSaveError('Name is required.'); return; }
    setSaving(true);
    try {
      let fd;
      try { fd = JSON.parse(formDraft.field_definitions); } catch { fd = {}; }
      const payload = {
        name: formDraft.name,
        category: formDraft.category,
        languages: formDraft.languages.split(',').map(l => l.trim()).filter(Boolean),
        field_definitions: fd,
      };
      if (editMode && selectedForm) {
        await api.put(`/api/admin/forms/${selectedForm.id}`, payload);
      } else {
        await api.post('/api/admin/forms', payload);
      }
      setShowCreateModal(false);
      fetchForms();
    } catch (err) {
      setSaveError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (form) => {
    setSelectedForm(form);
    setFormDraft({
      name: form.name,
      category: form.category,
      languages: Array.isArray(form.languages) ? form.languages.join(', ') : form.languages,
      field_definitions: JSON.stringify(form.field_definitions || {}, null, 2),
    });
    setEditMode(true);
    setSaveError('');
    setShowCreateModal(true);
  };

  const openCreate = () => {
    setSelectedForm(null);
    setFormDraft({ name: '', category: '', languages: 'English,Hindi', field_definitions: '{}' });
    setEditMode(false);
    setSaveError('');
    setShowCreateModal(true);
  };

  const columns = [
    {
      header: 'Form ID',
      accessor: 'id',
      render: (row) => <span className="font-mono text-xs">{row.id}</span>
    },
    {
      header: 'Form Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          <div className="text-xs text-gray-500">{row.category}</div>
        </div>
      )
    },
    {
      header: 'Version',
      accessor: 'version',
      render: (row) => (
        <div>
          <div className="font-mono text-sm">{row.version}</div>
          <div className="text-xs text-gray-500">{row.totalVersions} version{row.totalVersions !== 1 ? 's' : ''}</div>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => getStatusBadge(row.status)
    },
    {
      header: 'Deployed To',
      accessor: 'deployedTo',
      render: (row) => (
        <div>
          <div className="font-medium">{row.deployedTo.toLocaleString()}</div>
          <div className="text-xs text-gray-500">kiosks</div>
        </div>
      )
    },
    {
      header: 'Compliance',
      accessor: 'compliance',
      render: (row) => (
        <Badge variant={row.compliance === 'RBI Approved' ? 'success' : 'warning'}>
          {row.compliance}
        </Badge>
      )
    },
    {
      header: 'Last Updated',
      accessor: 'lastUpdated',
      render: (row) => <div className="text-sm text-gray-600">{formatDate(row.lastUpdated)}</div>
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedForm(row); setShowModal(true); }}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(row); }}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Edit
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-8">
      <Header 
        title="Forms & Templates" 
        subtitle="Centralized control and version management for official bank forms"
      />

      {/* Important Notice */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900 mb-1">📋 Centralized Form Control System</h4>
            <p className="text-sm text-blue-800">
              <strong>Purpose:</strong> Single source of truth for all official bank forms. Only "Published" forms
              are distributed to kiosks. All changes are version-controlled.
            </p>
            <p className="text-sm text-blue-800 mt-2">
              <strong>Workflow:</strong> Upload / Create → Draft → Publish → Deploy to Kiosks
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="md" onClick={() => { setOcrFile(null); setOcrResult(null); setOcrError(''); setShowOcrModal(true); }}>
            🔍 OCR Extract
          </Button>
          <Button variant="primary" size="md" onClick={openCreate}>
            ➕ New Template
          </Button>
          <button onClick={fetchForms} disabled={loading} className="text-sm text-indigo-600 hover:text-indigo-800">
            {loading ? 'Loading…' : '↻'}
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Total Forms</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{normalised.length}</div>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <div className="text-sm text-green-700">Published</div>
          <div className="text-2xl font-bold text-green-900 mt-1">{normalised.filter(f => f.status === 'Published').length}</div>
        </div>
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
          <div className="text-sm text-yellow-700">Draft</div>
          <div className="text-2xl font-bold text-yellow-900 mt-1">{normalised.filter(f => f.status === 'Draft').length}</div>
        </div>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Archived</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{normalised.filter(f => f.status === 'Archived').length}</div>
        </div>
      </div>

      {/* Forms Table */}
      <div className="mt-6">
        <Table
          columns={columns}
          data={filteredForms}
          onRowClick={(form) => { setSelectedForm(form); setShowModal(true); }}
        />
      </div>

      {/* Form Details Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Form Details" size="lg">
        {selectedForm && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-500">Form ID</label><p className="text-sm font-mono mt-1">{selectedForm.id}</p></div>
                <div><label className="text-xs text-gray-500">Form Name</label><p className="text-sm font-medium mt-1">{selectedForm.name}</p></div>
                <div><label className="text-xs text-gray-500">Version</label><p className="text-sm font-mono mt-1">{selectedForm.version}</p></div>
                <div><label className="text-xs text-gray-500">Category</label><p className="text-sm mt-1">{selectedForm.category}</p></div>
                <div><label className="text-xs text-gray-500">Status</label><div className="mt-1">{getStatusBadge(selectedForm.status)}</div></div>
                <div><label className="text-xs text-gray-500">Compliance</label>
                  <div className="mt-1"><Badge variant={selectedForm.compliance === 'RBI Approved' ? 'success' : 'warning'}>{selectedForm.compliance}</Badge></div>
                </div>
              </div>
            </div>

            {selectedForm.description && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-sm text-gray-600">{selectedForm.description}</p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Deployment</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-blue-700">Deployed To</div>
                  <div className="text-lg font-bold text-blue-900 mt-1">{selectedForm.deployedTo}</div>
                  <div className="text-xs text-blue-600">kiosks</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-xs text-green-700">Total Versions</div>
                  <div className="text-lg font-bold text-green-900 mt-1">{selectedForm.totalVersions}</div>
                  <div className="text-xs text-green-600">historical</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-xs text-purple-700">Languages</div>
                  <div className="text-lg font-bold text-purple-900 mt-1">{selectedForm.languages.length}</div>
                  <div className="text-xs text-purple-600">supported</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Languages</h4>
              <div className="flex flex-wrap gap-2">
                {selectedForm.languages.map((lang, idx) => <Badge key={idx} variant="info">{lang.trim()}</Badge>)}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Timeline</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Last Updated:</span><span className="font-medium">{formatDate(selectedForm.lastUpdated)}</span></div>
                {selectedForm.publishedDate && (
                  <div className="flex justify-between"><span className="text-gray-600">Published Date:</span><span className="font-medium">{formatDate(selectedForm.publishedDate)}</span></div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
              <Button variant="outline" onClick={() => { setShowModal(false); openEdit(selectedForm); }}>✏️ Edit</Button>
              {selectedForm.status === 'Draft' && (
                <Button variant="success" onClick={() => handlePublish(selectedForm.id)}>✅ Publish</Button>
              )}
              {selectedForm.status === 'Published' && (
                <Button variant="outline" onClick={() => handleArchive(selectedForm.id)}>📦 Archive</Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* OCR Modal */}
      <Modal isOpen={showOcrModal} onClose={() => setShowOcrModal(false)} title="OCR Field Extraction" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Upload a PDF or image of a bank form to extract field definitions using Tesseract OCR.</p>
          <div>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setOcrFile(e.target.files[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
          {ocrError && <p className="text-sm text-red-600">{ocrError}</p>}
          {ocrResult && (
            <div className="bg-gray-50 rounded p-3 max-h-64 overflow-y-auto">
              <div className="text-xs font-medium text-gray-700 mb-2">Extracted Fields ({Object.keys(ocrResult.detected_fields || {}).length})</div>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap">{JSON.stringify(ocrResult.detected_fields, null, 2)}</pre>
              <div className="mt-3 text-xs font-medium text-gray-700 mb-1">Raw Text (first 500 chars)</div>
              <p className="text-xs text-gray-500">{(ocrResult.raw_text || '').substring(0, 500)}</p>
            </div>
          )}
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" onClick={() => setShowOcrModal(false)}>Close</Button>
            <Button variant="primary" onClick={handleOcrUpload} disabled={!ocrFile || ocrLoading}>
              {ocrLoading ? 'Extracting…' : '🔍 Extract'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create/Edit Template Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title={editMode ? 'Edit Template' : 'New Template'} size="lg">
        <div className="space-y-4">
          {saveError && <p className="text-sm text-red-600">{saveError}</p>}
          <div>
            <label className="form-label">Form Name *</label>
            <input type="text" className="form-input" value={formDraft.name} onChange={(e) => setFormDraft(d => ({ ...d, name: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Category</label>
            <input type="text" className="form-input" placeholder="e.g. Account Opening" value={formDraft.category} onChange={(e) => setFormDraft(d => ({ ...d, category: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Languages (comma-separated)</label>
            <input type="text" className="form-input" value={formDraft.languages} onChange={(e) => setFormDraft(d => ({ ...d, languages: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Field Definitions (JSON)</label>
            <textarea className="form-input font-mono text-xs" rows={6} value={formDraft.field_definitions} onChange={(e) => setFormDraft(d => ({ ...d, field_definitions: e.target.value }))} />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveTemplate} disabled={saving}>
              {saving ? 'Saving…' : editMode ? '💾 Update' : '➕ Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Compliance Notice */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">🔒 Compliance & Version Control Notes</h4>
        <ul className="text-sm text-gray-600 space-y-1 ml-4">
          <li className="list-disc">All forms undergo regulatory compliance review before publishing</li>
          <li className="list-disc">Version history is maintained for audit purposes</li>
          <li className="list-disc">Only "Published" status forms are visible to kiosk users</li>
          <li className="list-disc">Form updates automatically notify all affected kiosks for OTA sync</li>
          <li className="list-disc">Archived forms are kept for regulatory compliance but not deployed</li>
        </ul>
      </div>
    </div>
  );
};

export default FormsTemplates;
