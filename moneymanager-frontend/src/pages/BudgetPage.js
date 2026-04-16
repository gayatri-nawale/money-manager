import { useState, useEffect, useCallback } from 'react';
import AppShell from '../components/AppShell';
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from '../api/api';
import '../styles/app.css';
import '../styles/budget.css';

// ── Category icons map ─────────────────────────────────────────
const CAT_ICONS = {
  'Food & Dining':      '🍽️',
  'Transportation':     '🚗',
  'Utilities':          '🏠',
  'Entertainment':      '🎬',
  'Health & Wellness':  '💪',
  'Personal Shopping':  '🛍️',
  'Rent & Housing':     '🏡',
  'Education':          '📚',
  'Travel':             '✈️',
  'Salary':             '💰',
  'Freelance':          '💻',
  'Business':           '💼',
  'Investment':         '📈',
  'Emergency Fund':     '🛡️',
  'Other':              '📦',
};

const CATEGORIES = Object.keys(CAT_ICONS);

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December',
];

// ── Progress bar color based on % ─────────────────────────────
function barColor(pct, isOver) {
  if (isOver)  return '#e74c3c';
  if (pct > 80) return '#e67e22';
  if (pct > 50) return '#f1c40f';
  return '#27ae60';
}

// ── Health score = avg of all (1 - pct/100), clamped 0-100 ────
function calcHealth(budgets) {
  if (!budgets.length) return 100;
  const avg =
    budgets.reduce((sum, b) => {
      const safe = Math.min(b.percentageUsed, 100);
      return sum + (100 - safe);
    }, 0) / budgets.length;
  return Math.round(avg);
}

// ── Create / Edit Modal ────────────────────────────────────────
function BudgetModal({ existing, currentMonth, currentYear, onClose, onSave }) {
  const isEdit = !!existing;
  const [category,    setCategory]    = useState(existing?.category    || CATEGORIES[0]);
  const [limitAmount, setLimitAmount] = useState(existing?.limitAmount || '');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  const submit = async () => {
    if (!limitAmount || isNaN(limitAmount) || Number(limitAmount) <= 0) {
      setError('Please enter a valid limit amount');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        category,
        limitAmount: parseFloat(limitAmount),
        month: currentMonth,
        year:  currentYear,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal budget-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="budget-modal-header">
          <p className="modal-title">
            {isEdit ? 'Edit Budget' : '+ New Budget'}
          </p>
          <button className="tx-modal-close" onClick={onClose}>✕</button>
        </div>

        <p className="budget-modal-sub">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </p>

        {/* Category */}
        <label className="tx-edit-label">CATEGORY</label>
        <select
          className="tx-edit-input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={isEdit}  // can't change category on edit
        >
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        {/* Limit */}
        <label className="tx-edit-label">MONTHLY LIMIT (₹)</label>
        <input
          className="tx-edit-input"
          type="number"
          min="1"
          placeholder="e.g. 5000"
          value={limitAmount}
          onChange={(e) => setLimitAmount(e.target.value)}
        />

        {error && (
          <p style={{ color: '#e74c3c', fontSize: 12, marginTop: 6 }}>
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-blue"
            onClick={submit}
            disabled={saving}
          >
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create Budget'}
          </button>
        </div>

      </div>
    </div>
  );
}

// ── View Modal ─────────────────────────────────────────────────
function ViewModal({ budget, onClose, onEdit, onDelete }) {
  const pct   = Math.min(budget.percentageUsed, 100).toFixed(1);
  const color = barColor(budget.percentageUsed, budget.isOverLimit);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal budget-modal" onClick={(e) => e.stopPropagation()}>

        <div className="budget-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>
              {CAT_ICONS[budget.category] || '📦'}
            </span>
            <div>
              <p className="modal-title" style={{ margin: 0 }}>
                {budget.category}
              </p>
              <p className="budget-modal-sub" style={{ margin: 0 }}>
                {MONTH_NAMES[budget.month]} {budget.year}
              </p>
            </div>
          </div>
          <button className="tx-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Stats */}
        <div className="budget-view-stats">
          <div className="budget-stat-box">
            <span className="budget-stat-label">LIMIT</span>
            <span className="budget-stat-value">
              ₹{Number(budget.limitAmount).toLocaleString()}
            </span>
          </div>
          <div className="budget-stat-box">
            <span className="budget-stat-label">SPENT</span>
            <span
              className="budget-stat-value"
              style={{ color: budget.isOverLimit ? '#e74c3c' : '#1a2a3a' }}
            >
              ₹{Number(budget.spentAmount).toLocaleString()}
            </span>
          </div>
          <div className="budget-stat-box">
            <span className="budget-stat-label">REMAINING</span>
            <span
              className="budget-stat-value"
              style={{ color: budget.isOverLimit ? '#e74c3c' : '#27ae60' }}
            >
              {budget.isOverLimit
                ? `-₹${Math.abs(Number(budget.remainingAmount)).toLocaleString()}`
                : `₹${Number(budget.remainingAmount).toLocaleString()}`}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div style={{ margin: '20px 0' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 12, color: '#8a9bb0', marginBottom: 8,
          }}>
            <span>Usage</span>
            <span style={{ fontWeight: 700, color }}>{pct}%</span>
          </div>
          <div className="budget-bar-track">
            <div
              className="budget-bar-fill"
              style={{
                width: `${pct}%`,
                background: color,
              }}
            />
          </div>
          {budget.isOverLimit && (
            <p className="budget-over-label" style={{ marginTop: 8 }}>
              ⚠ Over limit by ₹{
                Math.abs(Number(budget.remainingAmount)).toLocaleString()
              }
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button className="btn-danger" onClick={() => onDelete(budget)}>
             Delete
          </button>
          <button className="btn-blue" onClick={() => onEdit(budget)}>
            ️ Edit Limit
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function BudgetPage() {
  const now = new Date();
  const [month,   setMonth]   = useState(now.getMonth() + 1);
  const [year,    setYear]    = useState(now.getFullYear());
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState(null);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [viewBudget, setViewBudget] = useState(null);
  const [editBudget, setEditBudget] = useState(null);
  const [deleteBudget_,setDeleteBudget] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────
  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBudgets(month, year);
      setBudgets(res.data);
    } catch {
      showToast('Failed to load budgets', 'error');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

  // ── Toast ──────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Create ─────────────────────────────────────────────────
  const handleCreate = async (data) => {
    await createBudget(data);
    setShowCreate(false);
    showToast('Budget created!');
    fetchBudgets();
  };

  // ── Update ─────────────────────────────────────────────────
  const handleUpdate = async (data) => {
    await updateBudget(editBudget.id, data);
    setEditBudget(null);
    setViewBudget(null);
    showToast('Budget updated!');
    fetchBudgets();
  };

  // ── Delete ─────────────────────────────────────────────────
  const handleDelete = async (b) => {
    try {
      await deleteBudget(b.id);
      setDeleteBudget(null);
      setViewBudget(null);
      showToast('Budget deleted');
      fetchBudgets();
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  // ── Summary stats ──────────────────────────────────────────
  const totalLimit = budgets.reduce(
    (s, b) => s + Number(b.limitAmount), 0
  );
  const totalSpent = budgets.reduce(
    (s, b) => s + Number(b.spentAmount), 0
  );
  const healthScore = calcHealth(budgets);
  const healthColor =
    healthScore >= 70 ? '#27ae60' :
    healthScore >= 40 ? '#e67e22' : '#e74c3c';

  // ── Month nav ──────────────────────────────────────────────
  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  return (
    <AppShell>

      {/* ── Header ────────────────────────────────────────── */}
      <div className="budget-header">
        <div>
          <p className="budget-header-label">MONTHLY ALLOCATION</p>
          <h1 className="page-title">Budgets</h1>
        </div>
        <button
          className="budget-new-btn"
          onClick={() => setShowCreate(true)}
        >
          + New Budget
        </button>
      </div>

      {/* ── Month navigator ───────────────────────────────── */}
      <div className="budget-month-nav">
        <button className="budget-month-btn" onClick={prevMonth}>‹</button>
        <span className="budget-month-label">
          {MONTH_NAMES[month]} {year}
        </span>
        <button className="budget-month-btn" onClick={nextMonth}>›</button>
      </div>

      {/* ── Summary bar ───────────────────────────────────── */}
      {budgets.length > 0 && (
        <div className="budget-summary">
          <div className="budget-summary-item">
            <span className="budget-summary-label">TOTAL BUDGET</span>
            <span className="budget-summary-value">
              ₹{totalLimit.toLocaleString()}
            </span>
          </div>
          <div className="budget-summary-divider" />
          <div className="budget-summary-item">
            <span className="budget-summary-label">UTILIZED</span>
            <span className="budget-summary-value">
              ₹{totalSpent.toLocaleString()}
            </span>
          </div>
          <div className="budget-summary-divider" />
          <div className="budget-summary-item">
            <span className="budget-summary-label">HEALTH SCORE</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="budget-health-track">
                <div
                  className="budget-health-fill"
                  style={{
                    width: `${healthScore}%`,
                    background: healthColor,
                  }}
                />
              </div>
              <span
                className="budget-health-pct"
                style={{ color: healthColor }}
              >
                {healthScore}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Budget cards grid ─────────────────────────────── */}
      {loading ? (
        <div className="budget-empty">Loading...</div>
      ) : (
        <div className="budget-grid">
          {budgets.map((b) => {
            const pct   = Math.min(b.percentageUsed, 100);
            const color = barColor(pct, b.isOverLimit);
            const icon  = CAT_ICONS[b.category] || '📦';

            return (
              <div
                key={b.id}
                className={`budget-card ${b.isOverLimit ? 'over' : ''}`}
                onClick={() => setViewBudget(b)}
              >
                {/* Card top row */}
                <div className="budget-card-top">
                  <div className="budget-card-icon">{icon}</div>
                  <div
                    className="budget-card-dot"
                    style={{ background: color }}
                  />
                </div>

                {/* Category name */}
                <p className="budget-card-name">{b.category}</p>
                <p className="budget-card-sub">Monthly budget</p>

                {/* Spent vs limit */}
                <div className="budget-card-amounts">
                  <span
                    className="budget-card-spent"
                    style={{ color: b.isOverLimit ? '#e74c3c' : '#1a2a3a' }}
                  >
                    ₹{Number(b.spentAmount).toLocaleString()} spent
                  </span>
                  <span className="budget-card-limit">
                    ₹{Number(b.limitAmount).toLocaleString()}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="budget-bar-track">
                  <div
                    className="budget-bar-fill"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>

                {/* Remaining / over */}
                {b.isOverLimit ? (
                  <p className="budget-over-label">
                    ⚠ ₹{Math.abs(Number(b.remainingAmount)).toLocaleString()} over limit
                  </p>
                ) : (
                  <p className="budget-remaining-label">
                    ₹{Number(b.remainingAmount).toLocaleString()} remaining
                  </p>
                )}
              </div>
            );
          })}

          {/* ── Create new card ──────────────────────────── */}
          <div
            className="budget-card budget-card-new"
            onClick={() => setShowCreate(true)}
          >
            <div className="budget-new-icon">⊕</div>
            <p className="budget-new-text">Create Budget Category</p>
          </div>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────── */}
      {!loading && budgets.length === 0 && (
        <div className="budget-empty">
          <p style={{ fontSize: 32, marginBottom: 12 }}>📊</p>
          <p style={{ fontWeight: 700, color: '#1a2a3a', marginBottom: 6 }}>
            No budgets for {MONTH_NAMES[month]} {year}
          </p>
          <p style={{ color: '#8a9bb0', fontSize: 13 }}>
            Click "+ New Budget" to set your first monthly budget
          </p>
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────── */}
      {showCreate && (
        <BudgetModal
          currentMonth={month}
          currentYear={year}
          onClose={() => setShowCreate(false)}
          onSave={handleCreate}
        />
      )}

      {viewBudget && !editBudget && (
        <ViewModal
          budget={viewBudget}
          onClose={() => setViewBudget(null)}
          onEdit={(b) => { setEditBudget(b); }}
          onDelete={(b) => setDeleteBudget(b)}
        />
      )}

      {editBudget && (
        <BudgetModal
          existing={editBudget}
          currentMonth={month}
          currentYear={year}
          onClose={() => setEditBudget(null)}
          onSave={handleUpdate}
        />
      )}

      {/* Delete confirm */}
      {deleteBudget_ && (
        <div className="modal-overlay" onClick={() => setDeleteBudget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p className="modal-title" style={{ color: '#c0392b' }}>
              Delete Budget?
            </p>
            <p className="modal-sub">
              Remove the budget for{' '}
              <strong>{deleteBudget_.category}</strong>? This cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="btn-outline"
                onClick={() => setDeleteBudget(null)}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={() => handleDelete(deleteBudget_)}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ─────────────────────────────────────────── */}
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'error' : ''}`}>
          {toast.msg}
        </div>
      )}

    </AppShell>
  );
}