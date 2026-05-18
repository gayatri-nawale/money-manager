import { useState, useEffect, useCallback } from 'react';
import AppShell from '../components/AppShell';
import {
  getTransactions,
  deleteTransaction,
  updateTransaction,
  exportExcel,
  exportPdf,
} from '../api/api';
import '../styles/app.css';
import '../styles/transactions.css';

// ── Helpers ────────────────────────────────────────────────────
const TYPE_COLORS = {
  EXPENSE: { bg: '#fde8e8', color: '#c0392b' },
  INCOME:  { bg: '#e8f8ef', color: '#27ae60' },
  SAVING:  { bg: '#e8f0fa', color: '#1a4f8a' },
};

const CATEGORIES = [
  'All Categories',
  'Food & Dining','Transportation','Utilities','Entertainment',
  'Health & Wellness','Personal Shopping','Rent & Housing',
  'Education','Travel','Salary','Freelance','Business',
  'Investment','Rental Income','Gift','Emergency Fund',
  'Retirement','Vacation Fund','Home Fund','Education Fund','Other',
];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatAmount(amount, type) {
  const prefix = type === 'INCOME' ? '+' : '-';
  const color  = type === 'INCOME' ? '#27ae60' : type === 'SAVING' ? '#1a4f8a' : '#c0392b';
  return { text: `${prefix}₹${Number(amount).toFixed(2)}`, color };
}

const PAGE_SIZE = 8;

// ── View Modal ─────────────────────────────────────────────────
function ViewModal({ tx, onClose }) {
  if (!tx) return null;
  const amt = formatAmount(tx.amount, tx.type);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal tx-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tx-modal-header">
          <span
            className="tx-type-badge"
            style={TYPE_COLORS[tx.type]}
          >
            {tx.type}
          </span>
          <button className="tx-modal-close" onClick={onClose}>✕</button>
        </div>
        <p className="tx-modal-amount" style={{ color: amt.color }}>
          {amt.text}
        </p>
        <div className="tx-modal-rows">
          <div className="tx-modal-row">
            <span className="tx-modal-label">Date</span>
            <span>{formatDate(tx.date)}</span>
          </div>
          <div className="tx-modal-row">
            <span className="tx-modal-label">Category</span>
            <span>{tx.category}</span>
          </div>
          <div className="tx-modal-row">
            <span className="tx-modal-label">Description</span>
            <span>{tx.description || '—'}</span>
          </div>
          <div className="tx-modal-row">
            <span className="tx-modal-label">Created</span>
            <span>{tx.createdAt ? formatDate(tx.createdAt) : '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Edit Modal ─────────────────────────────────────────────────
function EditModal({ tx, onClose, onSave }) {
  const [form, setForm] = useState({
    amount:      tx.amount,
    type:        tx.type,
    category:    tx.category,
    date:        tx.date,
    description: tx.description || '',
  });
  const [saving, setSaving] = useState(false);

  const handle = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async () => {
    setSaving(true);
    await onSave(tx.id, {
      ...form,
      amount: parseFloat(form.amount),
    });
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal tx-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tx-modal-header">
          <p className="modal-title">Edit Transaction</p>
          <button className="tx-modal-close" onClick={onClose}>✕</button>
        </div>

        <label className="tx-edit-label">TYPE</label>
        <select className="tx-edit-input" value={form.type} onChange={handle('type')}>
          <option value="EXPENSE">Expense</option>
          <option value="INCOME">Income</option>
          <option value="SAVING">Saving</option>
        </select>

        <label className="tx-edit-label">AMOUNT</label>
        <input
          className="tx-edit-input"
          type="number"
          value={form.amount}
          onChange={handle('amount')}
        />

        <label className="tx-edit-label">DATE</label>
        <input
          className="tx-edit-input"
          type="date"
          value={form.date}
          onChange={handle('date')}
        />

        <label className="tx-edit-label">CATEGORY</label>
        <select
          className="tx-edit-input"
          value={form.category}
          onChange={handle('category')}
        >
          {CATEGORIES.filter((c) => c !== 'All Categories').map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <label className="tx-edit-label">DESCRIPTION</label>
        <textarea
          className="tx-edit-input tx-edit-textarea"
          value={form.description}
          onChange={handle('description')}
          rows={2}
        />

        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button className="btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn-blue" onClick={submit} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm ─────────────────────────────────────────────
function DeleteModal({ tx, onClose, onConfirm }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <p className="modal-title" style={{ color: '#c0392b' }}>
          Delete Transaction?
        </p>
        <p className="modal-sub">
          This will permanently delete the{' '}
          <strong>₹{Number(tx.amount).toFixed(2)}</strong> {tx.type.toLowerCase()} entry
          for <strong>{tx.category}</strong>. This cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn-danger" onClick={() => onConfirm(tx.id)}>
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [toast, setToast]               = useState(null);

  // Filters
  const [typeFilter, setTypeFilter]   = useState('ALL');
  const [startDate, setStartDate]     = useState('');
  const [endDate, setEndDate]         = useState('');
  const [catFilter, setCatFilter]     = useState('All Categories');
  const [sortBy, setSortBy]           = useState('date');

  // Pagination
  const [page, setPage] = useState(1);

  // Modals
  const [viewTx, setViewTx]     = useState(null);
  const [editTx, setEditTx]     = useState(null);
  const [deleteTx, setDeleteTx] = useState(null);

  // ── Fetch ────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter !== 'ALL') params.type = typeFilter;
      if (startDate)            params.startDate = startDate;
      if (endDate)              params.endDate   = endDate;

      const res = await getTransactions(params);
      setTransactions(res.data);
      setPage(1);
    } catch {
      showToast('Failed to load transactions', 'error');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Toast ────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Delete ───────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await deleteTransaction(id);
      setDeleteTx(null);
      showToast('Transaction deleted');
      fetchData();
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  // ── Edit ─────────────────────────────────────────────────
  const handleEdit = async (id, data) => {
    try {
      await updateTransaction(id, data);
      setEditTx(null);
      showToast('Transaction updated');
      fetchData();
    } catch {
      showToast('Update failed', 'error');
    }
  };

  // ── Export ───────────────────────────────────────────────
  const handleExport = async (type) => {
    try {
      const res = type === 'excel' ? await exportExcel() : await exportPdf();
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute(
        'download',
        type === 'excel' ? 'transactions.xlsx' : 'transactions.pdf'
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showToast('Export failed', 'error');
    }
  };

  // ── Filter + Sort (client side for category + sort) ──────
  let filtered = [...transactions];

  if (catFilter !== 'All Categories') {
    filtered = filtered.filter((t) => t.category === catFilter);
  }

  if (sortBy === 'amount') {
    filtered.sort((a, b) => b.amount - a.amount);
  } else if (sortBy === 'name') {
    filtered.sort((a, b) => a.category.localeCompare(b.category));
  }
  // date is default (already sorted by backend)

  // ── Pagination ───────────────────────────────────────────
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Page numbers to show
  const getPageNums = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, '...', totalPages];
    if (page >= totalPages - 2)
      return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', page - 1, page, page + 1, '...', totalPages];
  };

  return (
    <AppShell>
      {/* ── Header ──────────────────────────────────────── */}
      <div className="tx-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-sub">
            Review and manage your financial activity with precision.
          </p>
        </div>
        <div className="tx-export-btns">
          <button
            className="tx-export-pdf"
            onClick={() => handleExport('pdf')}
          >
           Export PDF
          </button>
          <button
            className="tx-export-excel"
            onClick={() => handleExport('excel')}
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* ── Filters bar ─────────────────────────────────── */}
      <div className="tx-filters">
        {/* Type pills */}
        <div className="tx-type-pills">
          {['ALL', 'INCOME', 'EXPENSE', 'SAVING'].map((t) => (
            <button
              key={t}
              className={`tx-pill ${typeFilter === t ? 'active' : ''}`}
              onClick={() => setTypeFilter(t)}
            >
              {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div className="tx-date-range">
          <span className="tx-date-icon">📅</span>
          <input
            type="date"
            className="tx-date-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span className="tx-date-to">to</span>
          <span className="tx-date-icon">📅</span>
          <input
            type="date"
            className="tx-date-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {/* Category filter */}
        <select
          className="tx-cat-select"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* ── Sort + count ─────────────────────────────────── */}
      <div className="tx-sort-row">
        <div className="tx-sort-group">
          <span className="tx-sort-label">SORT BY</span>
          {['date', 'amount', 'name'].map((s) => (
            <button
              key={s}
              className={`tx-sort-btn ${sortBy === s ? 'active' : ''}`}
              onClick={() => setSortBy(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {sortBy === s && ' ↓'}
            </button>
          ))}
        </div>
        <span className="tx-count">
          Showing <strong>{filtered.length}</strong> transaction
          {filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Table ────────────────────────────────────────── */}
      <div className="tx-table-wrap">
        {loading ? (
          <div className="tx-empty">Loading...</div>
        ) : paginated.length === 0 ? (
          <div className="tx-empty">No transactions found.</div>
        ) : (
          <table className="tx-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>DESCRIPTION</th>
                <th>CATEGORY</th>
                <th>TYPE</th>
                <th>AMOUNT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((tx) => {
                const amt = formatAmount(tx.amount, tx.type);
                const typeStyle = TYPE_COLORS[tx.type];
                return (
                  <tr key={tx.id}>
                    <td className="tx-td-date">{formatDate(tx.date)}</td>
                    <td className="tx-td-name">
                      {tx.description || tx.category}
                    </td>
                    <td>
                      <span className="tx-cat-chip">{tx.category}</span>
                    </td>
                    <td>
                      <span
                        className="tx-type-badge"
                        style={typeStyle}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td
                      className="tx-td-amount"
                      style={{ color: amt.color }}
                    >
                      {amt.text}
                    </td>
                    <td>
                      <div className="tx-actions">
                        <button
                          className="tx-action-btn view"
                          title="View"
                          onClick={() => setViewTx(tx)}
                        >
                          👁
                        </button>
                        <button
                          className="tx-action-btn edit"
                          title="Edit"
                          onClick={() => setEditTx(tx)}
                        >
                          ✏️
                        </button>
                        <button
                          className="tx-action-btn del"
                          title="Delete"
                          onClick={() => setDeleteTx(tx)}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="tx-pagination">
          <button
            className="tx-page-btn"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ‹ Previous
          </button>

          <div className="tx-page-nums">
            {getPageNums().map((n, i) =>
              n === '...' ? (
                <span key={`dot-${i}`} className="tx-page-dots">
                  ...
                </span>
              ) : (
                <button
                  key={n}
                  className={`tx-page-num ${page === n ? 'active' : ''}`}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              )
            )}
          </div>

          <button
            className="tx-page-btn"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next ›
          </button>
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────── */}
      {viewTx   && <ViewModal   tx={viewTx}   onClose={() => setViewTx(null)} />}
      {editTx   && <EditModal   tx={editTx}   onClose={() => setEditTx(null)}   onSave={handleEdit} />}
      {deleteTx && <DeleteModal tx={deleteTx} onClose={() => setDeleteTx(null)} onConfirm={handleDelete} />}

      {/* ── Toast ────────────────────────────────────────── */}
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'error' : ''}`}>
          {toast.msg}
        </div>
      )}
    </AppShell>
  );
}