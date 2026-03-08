import { useState, useEffect, useCallback } from 'react';
import apiClient, { getToken } from '../utils/apiClient';

const SERVICE_TYPE_LABELS = {
  accountOpeningForms: 'Account Opening',
  transactionForms: 'Transaction',
  loanApplicationForms: 'Loan Application',
  kycForms: 'KYC',
  serviceRequestForms: 'Service Request',
  transferRemittanceForms: 'Transfer / Remittance',
  investmentWealthForms: 'Investment & Wealth',
  enquiryDisputeForms: 'Enquiry & Dispute',
  closureNominationForms: 'Closure & Nomination',
  deposit: 'Deposit (Legacy)',
  withdrawal: 'Withdrawal (Legacy)',
  accountOpening: 'Account Opening (Legacy)',
  addressUpdate: 'Address Update (Legacy)',
};

const STATUS_BADGE = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  in_progress: 'bg-blue-100 text-blue-700',
};

const LIMIT = 50;

const Submissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(null); // for detail modal

  const fetchSubmissions = useCallback(async (off = 0, svc = '') => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: LIMIT, offset: off });
      if (svc) params.set('service_type', svc);
      const data = await apiClient.get(`/admin/reports/submissions?${params.toString()}`);
      setSubmissions(data.submissions || []);
      setTotal(data.total || 0);
      setOffset(off);
    } catch (e) {
      setError(e.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubmissions(0, serviceFilter); }, [fetchSubmissions, serviceFilter]);

  const handleFilterChange = (val) => {
    setServiceFilter(val);
    setOffset(0);
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Form Submissions</h1>
          <p className="text-sm text-gray-500 mt-1">All form submissions received from kiosk terminals</p>
        </div>
        <button
          onClick={() => fetchSubmissions(offset, serviceFilter)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          <span>🔄</span>
          <span>Refresh</span>
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 ml-4">✕</button>
        </div>
      )}

      {/* Stats + Filter row */}
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="flex items-center space-x-4">
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm">
            <span className="font-bold text-gray-900">{total.toLocaleString()}</span>
            <span className="text-gray-500 ml-1">total submissions</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <label className="text-sm text-gray-600 font-medium whitespace-nowrap">Filter by service:</label>
          <select
            value={serviceFilter}
            onChange={e => handleFilterChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Services</option>
            {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['#', 'Service', 'Account / Phone', 'Verified By', 'Status', 'Submitted At', ''].map((h, i) => (
                <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                    <span>Loading submissions...</span>
                  </div>
                </td>
              </tr>
            ) : submissions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <p className="text-gray-400 text-sm">No submissions found.</p>
                  {serviceFilter && (
                    <button onClick={() => handleFilterChange('')} className="mt-2 text-xs text-blue-600 hover:underline">
                      Clear filter
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              submissions.map((sub) => (
                <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-gray-400">#{sub.id}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-900">
                      {SERVICE_TYPE_LABELS[sub.service_type] || sub.service_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-700">{sub.account_number || sub.phone_number || '—'}</div>
                    {sub.account_number && sub.phone_number && (
                      <div className="text-xs text-gray-400">{sub.phone_number}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{sub.verified_by || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_BADGE[sub.status] || 'bg-gray-100 text-gray-600'}`}>
                      {sub.status || 'unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(sub.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setSelected(sub)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                      >
                        View Details
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const token = getToken();
                            const res = await fetch(`/api/admin/forms/submissions/${sub.id}/pdf`, {
                              headers: token ? { Authorization: `Bearer ${token}` } : {},
                            });
                            if (!res.ok) { alert('PDF not available for this submission'); return; }
                            const blob = await res.blob();
                            const url = URL.createObjectURL(blob);
                            window.open(url, '_blank');
                          } catch (e) { alert('Failed to load PDF'); }
                        }}
                        className="text-xs text-emerald-600 hover:text-emerald-800 font-medium hover:underline"
                      >
                        📄 PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && total > LIMIT && (
          <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {offset + 1}–{Math.min(offset + LIMIT, total)} of {total.toLocaleString()} submissions
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchSubmissions(offset - LIMIT, serviceFilter)}
                disabled={offset === 0 || loading}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-600">{currentPage} / {totalPages}</span>
              <button
                onClick={() => fetchSubmissions(offset + LIMIT, serviceFilter)}
                disabled={offset + LIMIT >= total || loading}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Submission #{selected.id}</h2>
                <p className="text-sm text-gray-500">{SERVICE_TYPE_LABELS[selected.service_type] || selected.service_type} · {formatDate(selected.created_at)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl flex-shrink-0">✕</button>
            </div>
            <div className="overflow-y-auto px-6 py-5 space-y-4">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Account Number', value: selected.account_number },
                  { label: 'Phone Number', value: selected.phone_number },
                  { label: 'Verified By', value: selected.verified_by },
                  { label: 'Status', value: selected.status },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-sm text-gray-900">{value || '—'}</p>
                  </div>
                ))}
              </div>

              {/* Form Fields */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Form Data</p>
                {selected.form_data && typeof selected.form_data === 'object' && Object.keys(selected.form_data).length > 0 ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 w-1/3">Field</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(selected.form_data).map(([key, val], i) => (
                          <tr key={key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2 font-medium text-gray-700 capitalize">{key.replace(/_/g, ' ')}</td>
                            <td className="px-4 py-2 text-gray-900">{String(val || '—')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg">
                    <pre className="px-4 py-3 text-xs text-gray-600 font-mono overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(selected.form_data, null, 2) || 'No form data available'}
                    </pre>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 flex justify-end">
              <button onClick={() => setSelected(null)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Submissions;
