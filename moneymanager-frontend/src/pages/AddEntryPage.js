import { useState } from 'react';
import AppShell from '../components/AppShell';
import { addTransaction } from '../api/api';
import '../styles/app.css';
import '../styles/addentry.css';

// ── Default categories per type ────────────────────────────────
const CATEGORIES = {
  EXPENSE: [
    'Food & Dining',
    'Transportation',
    'Utilities',
    'Entertainment',
    'Health & Wellness',
    'Personal Shopping',
    'Rent & Housing',
    'Education',
    'Travel',
    'Other',
  ],
  INCOME: [
    'Salary',
    'Freelance',
    'Business',
    'Investment',
    'Rental Income',
    'Gift',
    'Other',
  ],
  SAVING: [
    'Emergency Fund',
    'Retirement',
    'Vacation Fund',
    'Home Fund',
    'Education Fund',
    'Other',
  ],
};

const TABS = ['EXPENSE', 'INCOME', 'SAVING'];

const TAB_LABELS = {
  EXPENSE: 'Expense',
  INCOME: 'Income',
  SAVING: 'Saving',
};

// Tab accent colors matching your design
const TAB_COLORS = {
  EXPENSE: '#e74c3c',
  INCOME: '#27ae60',
  SAVING: '#1a4f8a',
};

export default function AddEntryPage() {
  const [activeTab, setActiveTab] = useState('EXPENSE');
  const [amount, setAmount]       = useState('');
  const [date, setDate]           = useState('');
  const [category, setCategory]   = useState(CATEGORIES.EXPENSE[0]);
  const [description, setDesc]    = useState('');
  const [loading, setLoading]     = useState(false);
  const [toast, setToast]         = useState(null); // { msg, type }
  const [newCat, setNewCat]       = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [customCats, setCustomCats] = useState({
    EXPENSE: [], INCOME: [], SAVING: [],
  });

  // ── Switch tab → reset form ────────────────────────────────
  const switchTab = (tab) => {
    setActiveTab(tab);
    setAmount('');
    setDate('');
    setCategory(CATEGORIES[tab][0]);
    setDesc('');
    setShowNewCat(false);
    setNewCat('');
  };

  // ── All categories for current tab ────────────────────────
  const allCategories = [
    ...CATEGORIES[activeTab],
    ...customCats[activeTab],
  ];

  // ── Add custom category ────────────────────────────────────
  const handleAddCategory = () => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    setCustomCats((prev) => ({
      ...prev,
      [activeTab]: [...prev[activeTab], trimmed],
    }));
    setCategory(trimmed);
    setNewCat('');
    setShowNewCat(false);
  };

  // ── Show toast then auto-hide ──────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    if (!date) {
      showToast('Please select a date', 'error');
      return;
    }

    setLoading(true);
    try {
      await addTransaction({
        amount: parseFloat(amount),
        type: activeTab,         // EXPENSE | INCOME | SAVING
        category,
        date,                    // "YYYY-MM-DD" — backend expects LocalDate
        description,
      });
      showToast(
        `${TAB_LABELS[activeTab]} of ₹${amount} saved successfully!`
      );
      // Reset form
      setAmount('');
      setDate('');
      setCategory(CATEGORIES[activeTab][0]);
      setDesc('');
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Something went wrong',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const accentColor = TAB_COLORS[activeTab];

return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Add Entry</h1>
      </div>

      {/* ── Centered form wrapper ──────────────────────────── */}
      <div className="entry-center">
        <div className="entry-card">

          {/* ── Tabs ──────────────────────────────────────── */}
          <div className="entry-tabs">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`entry-tab ${activeTab === tab ? 'active' : ''}`}
                style={
                  activeTab === tab
                    ? { color: TAB_COLORS[tab], borderBottomColor: TAB_COLORS[tab] }
                    : {}
                }
                onClick={() => switchTab(tab)}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>

          {/* ── Amount ────────────────────────────────────── */}
          <div className="entry-field">
            <label className="entry-label">AMOUNT</label>
            <div className="entry-amount-wrap">
              <span className="entry-currency">₹</span>
              <input
                className="entry-amount-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          {/* ── Date ──────────────────────────────────────── */}
          <div className="entry-field">
            <label className="entry-label">DATE</label>
            <input
              className="entry-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* ── Category ──────────────────────────────────── */}
          <div className="entry-field">
            <label className="entry-label">CATEGORY</label>
            <select
              className="entry-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {!showNewCat ? (
              <button
                className="entry-new-cat-btn"
                onClick={() => setShowNewCat(true)}
              >
                ⊕ Create New Category
              </button>
            ) : (
              <div className="entry-new-cat-row">
                <input
                  className="entry-input"
                  placeholder="Category name..."
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <button
                  className="btn-blue"
                  onClick={handleAddCategory}
                  style={{ marginTop: 6 }}
                >
                  Add
                </button>
                <button
                  className="btn-outline"
                  onClick={() => { setShowNewCat(false); setNewCat(''); }}
                  style={{ marginTop: 6, marginLeft: 8 }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* ── Description ───────────────────────────────── */}
          <div className="entry-field">
            <label className="entry-label">DESCRIPTION</label>
            <textarea
              className="entry-input entry-textarea"
              placeholder="Add a note about this entry..."
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
            />
          </div>

          {/* ── Submit ────────────────────────────────────── */}
          <button
            className="entry-submit"
            style={{ background: accentColor }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Saving...' : `✓  Save ${TAB_LABELS[activeTab]}`}
          </button>

        </div>
      </div>

      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'error' : ''}`}>
          {toast.msg}
        </div>
      )}
    </AppShell>
  );
}