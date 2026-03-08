import { useState, useEffect, useCallback, useRef } from 'react';
import Header from '../components/Header';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import api from '../utils/apiClient';
import PdfFieldEditor from '../components/PdfFieldEditor';

// ---- Constants ---------------------------------------------------------------

const SERVICE_KEYS = [
  { value: 'accountOpeningForms',      label: 'Account Opening Forms' },
  { value: 'transactionForms',         label: 'Transaction Forms' },
  { value: 'loanApplicationForms',     label: 'Loan Application Forms' },
  { value: 'kycForms',                 label: 'KYC Forms' },
  { value: 'serviceRequestForms',      label: 'Service Request Forms' },
  { value: 'transferRemittanceForms',  label: 'Transfer & Remittance Forms' },
  { value: 'investmentWealthForms',    label: 'Investment & Wealth Forms' },
  { value: 'enquiryDisputeForms',      label: 'Enquiry & Dispute Forms' },
  { value: 'closureNominationForms',   label: 'Closure & Nomination Forms' },
];

const FIELD_TYPES = [
  { value: 'text',   label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'tel',    label: 'Phone' },
  { value: 'email',  label: 'Email' },
  { value: 'date',   label: 'Date' },
];

const makeFieldId = () => `f_${Math.random().toString(36).slice(2, 8)}`;

const blankField = () => ({ id: makeFieldId(), label: '', type: 'text', required: false });

// ---- Helpers -----------------------------------------------------------------

const formatDate = (iso) => {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const serviceLabelFor = (key) => SERVICE_KEYS.find(s => s.value === key)?.label || key || '—';

// ---- FieldBuilder sub-component ----------------------------------------------

const FieldBuilder = ({ fields, onChange }) => {
  const moveField = (index, dir) => {
    const next = [...fields];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    onChange(next);
  };

  const updateField = (index, key, value) => {
    const next = fields.map((f, i) => i === index ? { ...f, [key]: value } : f);
    onChange(next);
  };

  const removeField = (index) => onChange(fields.filter((_, i) => i !== index));

  const addField = () => onChange([...fields, blankField()]);

  return (
    <div>
      {fields.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-lg py-8 text-center">
          <p className="text-sm text-gray-400 mb-3">No fields yet. Add a field below or use OCR Scan to auto-detect.</p>
          <button type="button" onClick={addField}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            + Add First Field
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Column headers */}
          <div className="grid grid-cols-12 gap-2 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-100">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5">Label / Field Name</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2 text-center">Required</div>
            <div className="col-span-2 text-center">Actions</div>
          </div>

          {fields.map((field, i) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg px-2 py-1.5 border border-gray-100">
              {/* Order control */}
              <div className="col-span-1 flex flex-col items-center gap-0.5">
                <button type="button" onClick={() => moveField(i, -1)} disabled={i === 0}
                  className="text-gray-300 hover:text-gray-600 disabled:invisible text-xs leading-none px-1">▲</button>
                <span className="text-xs text-gray-400 font-mono">{i + 1}</span>
                <button type="button" onClick={() => moveField(i, 1)} disabled={i === fields.length - 1}
                  className="text-gray-300 hover:text-gray-600 disabled:invisible text-xs leading-none px-1">▼</button>
              </div>

              {/* Label */}
              <div className="col-span-5">
                <input
                  type="text"
                  value={field.label}
                  placeholder={`Field ${i + 1} label`}
                  onChange={e => updateField(i, 'label', e.target.value)}
                  className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                />
              </div>

              {/* Type */}
              <div className="col-span-2">
                <select
                  value={field.type}
                  onChange={e => updateField(i, 'type', e.target.value)}
                  className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                >
                  {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {/* Required toggle */}
              <div className="col-span-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => updateField(i, 'required', !field.required)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${field.required ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${field.required ? 'translate-x-4' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Delete */}
              <div className="col-span-2 flex justify-center">
                <button type="button" onClick={() => removeField(i)}
                  className="text-red-400 hover:text-red-600 text-sm px-2 py-0.5 rounded hover:bg-red-50 transition-colors">
                  ✕
                </button>
              </div>
            </div>
          ))}

          {/* Add Field button */}
          <button type="button" onClick={addField}
            className="w-full mt-2 py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
            + Add Field
          </button>
        </div>
      )}
    </div>
  );
};

// ---- Main Component ----------------------------------------------------------

const FormsTemplates = () => {
  const [formsData, setFormsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedForm, setSelectedForm] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Create/Edit modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formDraft, setFormDraft] = useState({ name: '', category: '', languages: 'English,Hindi' });
  const [fieldRows, setFieldRows] = useState([]); // visual field list
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  // OCR state (embedded inside create/edit modal)
  const [ocrTab, setOcrTab] = useState('builder'); // 'builder' | 'ocr'
  const [ocrFile, setOcrFile] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [ocrRawText, setOcrRawText] = useState('');
  const [ocrCoordinates, setOcrCoordinates] = useState({});    // { field_id: {page,x,y,...} }
  const [ocrOriginalPdf, setOcrOriginalPdf] = useState(null);  // legacy base64
  const [ocrPdfFilename, setOcrPdfFilename] = useState(null);  // disk-based filename
  const [ocrPdfUrl, setOcrPdfUrl] = useState(null);            // URL for PDF viewer
  const fileInputRef = useRef(null);

  // Fetch forms
  const fetchForms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/forms');
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
    field_coordinates: f.field_coordinates,
    has_pdf: f.has_pdf,
    pdf_filename: f.pdf_filename,
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

  // Derive initial field rows from a stored field_definitions value
  const parseToFieldRows = (raw) => {
    if (!raw) return [];
    try {
      const parsed = Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : []);
      if (Array.isArray(parsed)) {
        return parsed.map(f => ({
          id: f.id || makeFieldId(),
          label: f.label || '',
          type: f.type || 'text',
          required: !!f.required,
        }));
      }
      // Legacy: dict-style { fieldName: { type, required } }
      if (typeof parsed === 'object') {
        return Object.entries(parsed).map(([key, val]) => ({
          id: makeFieldId(),
          label: typeof val === 'object' ? (val.label || key) : key,
          type: typeof val === 'object' ? (val.type || 'text') : 'text',
          required: typeof val === 'object' ? !!val.required : false,
        }));
      }
    } catch (_) {}
    return [];
  };

  const openEdit = (form) => {
    setSelectedForm(form);
    setFormDraft({
      name: form.name,
      category: form.category,
      languages: Array.isArray(form.languages) ? form.languages.join(', ') : form.languages,
    });
    setFieldRows(parseToFieldRows(form.field_definitions));
    setEditMode(true);
    setSaveError('');
    setOcrTab('builder');
    setOcrFile(null);
    setOcrRawText('');
    setOcrError('');
    // Load existing coordinate data from the server
    const rawForm = formsData.find(f => f.id === form.id);
    const existingCoords = rawForm?.field_coordinates;
    if (existingCoords && typeof existingCoords === 'object' && Object.keys(existingCoords).length > 0) {
      setOcrCoordinates(typeof existingCoords === 'string' ? JSON.parse(existingCoords) : existingCoords);
    } else {
      setOcrCoordinates({});
    }
    // Set PDF URL for the visual editor
    if (rawForm?.has_pdf) {
      setOcrPdfUrl(`/api/admin/forms/${form.id}/pdf`);
      setOcrPdfFilename(rawForm.pdf_filename || null);
    } else {
      setOcrPdfUrl(null);
      setOcrPdfFilename(null);
    }
    setOcrOriginalPdf(null);
    setShowCreateModal(true);
  };

  const openCreate = () => {
    setSelectedForm(null);
    setFormDraft({ name: '', category: '', languages: 'English,Hindi' });
    setFieldRows([]);
    setEditMode(false);
    setSaveError('');
    setOcrTab('builder');
    setOcrFile(null);
    setOcrRawText('');
    setOcrError('');
    setOcrCoordinates({});
    setOcrOriginalPdf(null);
    setOcrPdfFilename(null);
    setOcrPdfUrl(null);
    setShowCreateModal(true);
  };

  const handlePublish = async (id) => {
    try {
      await api.post(`/admin/forms/${id}/publish`);
      fetchForms();
      setShowModal(false);
    } catch (err) { alert(err.message || 'Publish failed'); }
  };

  const handleArchive = async (id) => {
    if (!window.confirm('Archive this form? It will no longer be deployed to kiosks.')) return;
    try {
      await api.post(`/admin/forms/${id}/archive`);
      fetchForms();
      setShowModal(false);
    } catch (err) { alert(err.message || 'Archive failed'); }
  };

  // OCR upload — result auto-populates the field builder
  const handleOcrScan = async () => {
    if (!ocrFile) return;
    setOcrLoading(true);
    setOcrError('');
    setOcrRawText('');
    try {
      // Wrap file in FormData for proper multipart/form-data request
      const formData = new FormData();
      formData.append('file', ocrFile);
      
      const result = await api.upload('/admin/forms/ocr', formData);
      const detected = Array.isArray(result.detected_fields) ? result.detected_fields : [];
      if (detected.length > 0) {
        const rows = detected.map(f => ({
          id: f.id || makeFieldId(),
          label: f.label || '',
          type: ['text','number','tel','email','date'].includes(f.type) ? f.type : 'text',
          required: !!f.required,
        }));
        setFieldRows(rows);
        setOcrRawText(result.raw_text || '');
        // Store coordinates for the visual editor
        if (result.field_coordinates && Object.keys(result.field_coordinates).length > 0) {
          setOcrCoordinates(result.field_coordinates);
        }
        // Store PDF reference (disk-based filename)
        if (result.pdf_filename) {
          setOcrPdfFilename(result.pdf_filename);
          setOcrPdfUrl(result.pdf_temp_url || `/api/admin/forms/temp-pdf/${result.pdf_filename}`);
        } else if (result.original_pdf_base64) {
          // Legacy fallback
          setOcrOriginalPdf(result.original_pdf_base64);
        }
        setOcrTab('builder');
      } else {
        setOcrError('No fields detected. Try a clearer scan or add fields manually.');
      }
    } catch (err) {
      // Guarantee ocrError is always a plain readable string
      let msg = 'OCR extraction failed. Please try again.';
      try {
        if (err instanceof Error) {
          msg = err.message || msg;
        } else if (typeof err === 'string') {
          msg = err;
        } else if (err && typeof err === 'object') {
          msg = JSON.stringify(err);
        }
      } catch (_) {}
      setOcrError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    setSaveError('');
    if (!formDraft.name.trim()) { setSaveError('Form name is required.'); return; }
    if (!formDraft.category) { setSaveError('Please select a service category.'); return; }

    // Validate field rows
    const emptyLabels = fieldRows.filter(f => !f.label.trim());
    if (emptyLabels.length > 0) { setSaveError('All fields must have a label.'); return; }

    setSaving(true);
    try {
      const payload = {
        name: formDraft.name.trim(),
        category: formDraft.category,
        languages: formDraft.languages.split(',').map(l => l.trim()).filter(Boolean),
        field_definitions: fieldRows.map(({ id, label, type, required }) => ({ id, label, type, required })),
        ...(ocrCoordinates && Object.keys(ocrCoordinates).length > 0 ? { field_coordinates: ocrCoordinates } : {}),
        ...(ocrPdfFilename ? { pdf_filename: ocrPdfFilename } : {}),
        ...(ocrOriginalPdf && !ocrPdfFilename ? { original_pdf: ocrOriginalPdf } : {}),
      };
      if (editMode && selectedForm) {
        await api.put(`/admin/forms/${selectedForm.id}`, payload);
      } else {
        await api.post('/admin/forms', payload);
      }
      setShowCreateModal(false);
      fetchForms();
    } catch (err) {
      setSaveError(err.message || 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      header: 'Form ID',
      accessor: 'id',
      render: (row) => <span className="font-mono text-xs text-gray-500">#{row.id}</span>
    },
    {
      header: 'Form Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          <div className="text-xs text-gray-500">{serviceLabelFor(row.category)}</div>
        </div>
      )
    },
    {
      header: 'Fields',
      accessor: 'field_definitions',
      render: (row) => {
        const fields = Array.isArray(row.field_definitions) ? row.field_definitions : [];
        return <span className="text-sm text-gray-700">{fields.length} field{fields.length !== 1 ? 's' : ''}</span>;
      }
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
      header: 'Deployed To',
      accessor: 'deployedTo',
      render: (row) => <span className="text-sm">{row.deployedTo} kiosks</span>
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

  // ---- Render ----------------------------------------------------------------

  return (
    <div className="p-8">
      <Header
        title="Forms & Templates"
        subtitle="Design, manage and publish form templates that appear on kiosk terminals"
      />

      {/* Stats */}
      <div className="mt-6 grid grid-cols-4 gap-4">
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

      {/* Filters row */}
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
          <button onClick={fetchForms} disabled={loading} className="text-sm text-indigo-600 hover:text-indigo-800">
            {loading ? 'Loading…' : '↻ Refresh'}
          </button>
          <Button variant="primary" size="md" onClick={openCreate}>
            ➕ New Template
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6">
        <Table
          columns={columns}
          data={filteredForms}
          onRowClick={(form) => { setSelectedForm(form); setShowModal(true); }}
        />
      </div>

      {/* ---- Form Details Modal ---------------------------------------- */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Form Details" size="lg">
        {selectedForm && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Form ID', value: `#${selectedForm.id}` },
                { label: 'Form Name', value: selectedForm.name },
                { label: 'Service Category', value: serviceLabelFor(selectedForm.category) },
                { label: 'Version', value: selectedForm.version },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-0.5">{label}</p>
                  <p className="text-sm font-medium text-gray-900">{value}</p>
                </div>
              ))}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Status</p>
                {getStatusBadge(selectedForm.status)}
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Compliance</p>
                <Badge variant={selectedForm.compliance === 'RBI Approved' ? 'success' : 'warning'}>
                  {selectedForm.compliance}
                </Badge>
              </div>
            </div>

            {/* Fields preview */}
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">Form Fields</p>
              {(() => {
                const fields = Array.isArray(selectedForm.field_definitions) ? selectedForm.field_definitions : parseToFieldRows(selectedForm.field_definitions);
                return fields.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No fields defined.</p>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {['#', 'Label', 'Type', 'Required'].map(h => (
                            <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-gray-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {fields.map((f, i) => (
                          <tr key={f.id || i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2 text-gray-400 text-xs font-mono">{i + 1}</td>
                            <td className="px-4 py-2 font-medium text-gray-800">{f.label}</td>
                            <td className="px-4 py-2 capitalize text-gray-600">{f.type}</td>
                            <td className="px-4 py-2">
                              {f.required
                                ? <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">Required</span>
                                : <span className="text-xs text-gray-400">Optional</span>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-xs text-blue-700">Deployed To</div>
                <div className="text-lg font-bold text-blue-900 mt-1">{selectedForm.deployedTo}</div>
                <div className="text-xs text-blue-600">kiosks</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-xs text-green-700">Total Versions</div>
                <div className="text-lg font-bold text-green-900 mt-1">{selectedForm.totalVersions}</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-xs text-purple-700">Languages</div>
                <div className="text-lg font-bold text-purple-900 mt-1">{selectedForm.languages.length}</div>
                <div className="text-xs text-purple-600">{selectedForm.languages.join(', ')}</div>
              </div>
            </div>

            <div className="text-sm text-gray-500 space-y-1">
              <div className="flex justify-between"><span>Last Updated:</span><span className="font-medium text-gray-700">{formatDate(selectedForm.lastUpdated)}</span></div>
              {selectedForm.publishedDate && (
                <div className="flex justify-between"><span>Published:</span><span className="font-medium text-gray-700">{formatDate(selectedForm.publishedDate)}</span></div>
              )}
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

      {/* ---- Create / Edit Template Modal --------------------------------- */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={editMode ? `Edit Template — ${selectedForm?.name || ''}` : 'New Form Template'}
        size="xl"
      >
        <div className="space-y-5">
          {saveError && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
              <span>{saveError}</span>
              <button onClick={() => setSaveError('')} className="text-red-400 hover:text-red-600">✕</button>
            </div>
          )}

          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Form Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formDraft.name}
                onChange={(e) => setFormDraft(d => ({ ...d, name: e.target.value }))}
                placeholder="e.g. Savings Account Opening Form"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formDraft.category}
                onChange={(e) => setFormDraft(d => ({ ...d, category: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Select category —</option>
                {SERVICE_KEYS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-400">
                This must exactly match the kiosk service key so forms appear in the right menu.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Languages (comma-separated)</label>
            <input
              type="text"
              value={formDraft.languages}
              onChange={(e) => setFormDraft(d => ({ ...d, languages: e.target.value }))}
              placeholder="English, Hindi, Tamil"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <hr className="border-gray-100" />

          {/* Field Builder / OCR tabs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setOcrTab('builder')}
                  className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${ocrTab === 'builder' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  🏗️ Field Builder
                  {fieldRows.length > 0 && (
                    <span className="ml-1.5 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">{fieldRows.length}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setOcrTab('ocr')}
                  className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${ocrTab === 'ocr' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  🔍 OCR Scan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Auto-place all fields as a starting point if the PDF is loaded
                    // but no coordinates have been set yet.
                    if (ocrPdfUrl && fieldRows.length > 0 && Object.keys(ocrCoordinates).length === 0) {
                      const auto = {};
                      let y = 50;
                      fieldRows.forEach((f) => {
                        auto[f.id] = { page: 0, x: 60, y, input_y: y, box_width: 200, box_height: 16 };
                        y += 28;
                      });
                      setOcrCoordinates(auto);
                    }
                    setOcrTab('position');
                  }}
                  className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${ocrTab === 'position' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  🎯 Position Fields
                </button>
                <button
                  type="button"
                  onClick={() => setOcrTab('preview')}
                  className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${ocrTab === 'preview' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  👁 Preview
                </button>
              </div>
            </div>

            {/* BUILDER TAB */}
            {ocrTab === 'builder' && (
              <FieldBuilder fields={fieldRows} onChange={setFieldRows} />
            )}

            {/* OCR TAB */}
            {ocrTab === 'ocr' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                  <strong>How it works:</strong> Upload a scanned PDF or image of a bank form. The OCR engine will detect the field labels and types. Detected fields will be automatically added to the Field Builder — you can review and edit them before saving.
                </div>
                <div className="flex items-center space-x-3">
                  <label className="flex-1">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg px-4 py-6 text-center cursor-pointer transition-colors ${ocrFile ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-400'}`}
                    >
                      {ocrFile ? (
                        <div>
                          <p className="text-sm font-medium text-blue-700">📄 {ocrFile.name}</p>
                          <p className="text-xs text-blue-500 mt-1">{(ocrFile.size / 1024).toFixed(1)} KB — click to change</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-gray-500">Click to upload a PDF or image</p>
                          <p className="text-xs text-gray-400 mt-1">Supported: PDF, JPG, PNG, TIFF</p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={e => { setOcrFile(e.target.files[0] || null); setOcrError(''); }}
                    />
                  </label>
                </div>

                {ocrError && (
                  <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{String(ocrError)}</p>
                )}

                {ocrRawText && (
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer font-medium text-gray-600 mb-1">Raw extracted text (preview)</summary>
                    <div className="bg-gray-50 rounded p-2 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {ocrRawText.substring(0, 800)}{ocrRawText.length > 800 ? '…' : ''}
                    </div>
                  </details>
                )}

                <button
                  type="button"
                  onClick={handleOcrScan}
                  disabled={!ocrFile || ocrLoading}
                  className="inline-flex items-center space-x-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ocrLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Scanning…</span>
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      <span>Scan &amp; Auto-Populate Fields</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* POSITION FIELDS TAB */}
            {ocrTab === 'position' && (
              <div className="space-y-3">
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm text-indigo-700">
                  <strong>Visual Position Editor:</strong> Drag field boxes on the PDF to set where values will be printed.
                  Select a field in the sidebar, then click the PDF to place it. Drag to move, use the corner handle to resize.
                </div>
                <PdfFieldEditor
                  pdfUrl={ocrPdfUrl}
                  fields={fieldRows}
                  coordinates={ocrCoordinates}
                  onChange={setOcrCoordinates}
                />
              </div>
            )}

            {/* PREVIEW TAB */}
            {ocrTab === 'preview' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 italic">This is how the form will appear to kiosk users.</p>
                {fieldRows.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No fields added yet.</p>
                ) : (
                  <div className="bg-gray-900 rounded-xl p-5 space-y-4 max-h-80 overflow-y-auto">
                    <h3 className="text-white text-base font-semibold text-center">{formDraft.name || 'Form Preview'}</h3>
                    {fieldRows.map((field) => (
                      <div key={field.id}>
                        <label className="block text-xs text-gray-400 mb-1">
                          {field.label || 'Untitled Field'}
                          {field.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        <div className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-300">
                          {field.type === 'date' ? 'DD / MM / YYYY' : field.type === 'tel' ? '+91 _____' : field.type === 'number' ? '0' : '——'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveTemplate} disabled={saving}>
              {saving
                ? <span className="flex items-center space-x-2"><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /><span>Saving…</span></span>
                : editMode ? '💾 Save Changes' : '➕ Create Template'
              }
            </Button>
          </div>
        </div>
      </Modal>

      {/* Compliance notice */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">🔒 Workflow &amp; Compliance Notes</h4>
        <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
          <li>Only <strong>Published</strong> templates are distributed to kiosks.</li>
          <li>The <strong>Service Category</strong> field must exactly match the kiosk service key so the form appears in the correct menu.</li>
          <li>Use <strong>OCR Scan</strong> to rapidly import field definitions from scanned bank forms.</li>
          <li>All template changes are version-controlled and audited.</li>
          <li>Archived templates are retained for compliance but not deployed.</li>
        </ul>
      </div>
    </div>
  );
};

export default FormsTemplates;
