import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import {
   AreaChart, Area,
   BarChart, Bar,
   LineChart, Line,        // ← add this
   PieChart, Pie, Cell, Tooltip,
   XAxis, YAxis, CartesianGrid,
   ResponsiveContainer, Legend,
 } from 'recharts';
import '../styles/app.css';
import '../styles/dashboard.css';
import { getDashboard, getSavingsTrend } from '../api/api';
// ── Constants ──────────────────────────────────────────────────
const MONTH_NAMES = [
  '', 'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const PIE_COLORS = [
  '#1a4f8a','#27ae60','#e67e22','#e74c3c','#9b59b6','#16a085',
];

// ── Helpers ────────────────────────────────────────────────────
function getDateRange(filter, customMonth, customYear) {
  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  if (filter === 'this_month') {
    const start = `${year}-${String(month).padStart(2,'0')}-01`;
    const end   = `${year}-${String(month).padStart(2,'0')}-${new Date(year,month,0).getDate()}`;
    return { start, end, label: `${MONTH_NAMES[month]} ${year}` };
  }
  if (filter === 'last_month') {
    const d = new Date(year, month - 2, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const start = `${y}-${String(m).padStart(2,'0')}-01`;
    const end   = `${y}-${String(m).padStart(2,'0')}-${new Date(y,m,0).getDate()}`;
    return { start, end, label: `${MONTH_NAMES[m]} ${y}` };
  }
  if (filter === 'this_year') {
    return {
      start: `${year}-01-01`,
      end:   `${year}-12-31`,
      label: `Year ${year}`,
    };
  }
  if (filter === 'all_time') {
    return {
      start: '2000-01-01',
      end:   `${year}-12-31`,
      label: 'All Time',
    };
  }
  if (filter === 'custom' && customMonth && customYear) {
    const start = `${customYear}-${String(customMonth).padStart(2,'0')}-01`;
    const end   = `${customYear}-${String(customMonth).padStart(2,'0')}-${new Date(customYear, customMonth, 0).getDate()}`;
    return {
      start, end,
      label: `${MONTH_NAMES[customMonth]} ${customYear}`,
    };
  }
  // fallback
  const start = `${year}-${String(month).padStart(2,'0')}-01`;
  const end   = `${year}-${String(month).padStart(2,'0')}-${new Date(year,month,0).getDate()}`;
  return { start, end, label: `${MONTH_NAMES[month]} ${year}` };
}

function fmt(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── Custom Tooltip for Area chart ──────────────────────────────
function AreaTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="dash-tooltip">
      <p className="dash-tooltip-label">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, margin: '2px 0', fontSize: 12 }}>
          {p.name}: ₹{Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
}

// ── Filter dropdown ────────────────────────────────────────────
function FilterDropdown({
  filter, setFilter,
  customMonth, setCustomMonth,
  customYear, setCustomYear,
  label,
}) {
  const [open, setOpen] = useState(false);
  const now = new Date();

  const options = [
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_year',  label: 'This Year'  },
    { value: 'all_time',   label: 'All Time'   },
    { value: 'custom',     label: 'Custom Month' },
  ];

  return (
    <div className="dash-filter-wrap">
      <button
        className="dash-filter-btn"
        onClick={() => setOpen((o) => !o)}
      >
        📅 {label} ▾
      </button>

      {open && (
        <div className="dash-filter-dropdown">
          {options.map((o) => (
            <button
              key={o.value}
              className={`dash-filter-opt ${filter === o.value ? 'active' : ''}`}
              onClick={() => {
                setFilter(o.value);
                if (o.value !== 'custom') setOpen(false);
              }}
            >
              {o.label}
            </button>
          ))}

          {filter === 'custom' && (
            <div className="dash-custom-picker">
              <select
                value={customMonth}
                onChange={(e) => setCustomMonth(Number(e.target.value))}
                className="dash-custom-select"
              >
                {MONTH_NAMES.slice(1).map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <input
                type="number"
                className="dash-custom-year"
                value={customYear}
                min="2000"
                max={now.getFullYear()}
                onChange={(e) => setCustomYear(Number(e.target.value))}
              />
              <button
                className="btn-blue"
                style={{ padding: '7px 14px', fontSize: 12 }}
                onClick={() => setOpen(false)}
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function HomePage() {
const [savingsData, setSavingsData] = useState([]);

  const { user }   = useAuth();
  const navigate   = useNavigate();
  const now        = new Date();

  const [filter,       setFilter]       = useState('this_month');
  const [customMonth,  setCustomMonth]  = useState(now.getMonth() + 1);
  const [customYear,   setCustomYear]   = useState(now.getFullYear());
  const [trendView,    setTrendView]    = useState('6M'); // '6M' | '1Y'
  const [data,         setData]         = useState(null);
  const [loading,      setLoading]      = useState(true);

  const firstName = (user?.fullName || user?.fullname || 'User').split(' ')[0];

  // ── Date range from filter ────────────────────────────────
  const range = getDateRange(filter, customMonth, customYear);

  // ── Fetch dashboard data ──────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDashboard(range.start, range.end);
      setData(res.data);

      const savRes = await getSavingsTrend();
            setSavingsData(savRes.data);
    } catch {
      // silent fail — show zeros
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [range.start, range.end]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Trend data slice ──────────────────────────────────────
// Slice trend data based on trendView toggle
  const trendData = trendView === '6M'
    ? (data?.monthlyTrend || []).slice(-6)
    : (data?.monthlyTrend || []);
  return (
    <AppShell>
      {/* ── Page header ──────────────────────────────────── */}
      <div className="dash-header">
        <div>
          <h1 className="page-title">Financial Overview</h1>
          <p className="page-sub">
            Welcome back, {firstName} 👋
          </p>
        </div>
        <FilterDropdown
          filter={filter}
          setFilter={setFilter}
          customMonth={customMonth}
          setCustomMonth={setCustomMonth}
          customYear={customYear}
          setCustomYear={setCustomYear}
          label={range.label}
        />
      </div>

      {loading ? (
        <div className="dash-loading">Loading dashboard...</div>
      ) : (
        <>
          {/* ── Top cards ──────────────────────────────────── */}
          <div className="dash-cards">
            {/* Balance */}
            <div className="dash-card dash-card-blue">
              <p className="dash-card-label">NET BALANCE</p>
              <p className="dash-card-value">
                {fmt(data?.netBalance)}
              </p>
              <p className="dash-card-hint">{range.label}</p>
            </div>

            {/* Income */}
            <div className="dash-card">
              <p className="dash-card-label">TOTAL INCOME</p>
              <p className="dash-card-value dash-green">
                {fmt(data?.totalIncome)}
              </p>
              <div className="dash-card-bar">
                <div
                  className="dash-card-bar-fill green"
                  style={{ width: '75%' }}
                />
              </div>
              <p className="dash-card-hint">75% of monthly target</p>
            </div>

            {/* Expenses */}
            <div className="dash-card">
              <p className="dash-card-label">TOTAL EXPENSES</p>
              <p className="dash-card-value dash-red">
                {fmt(data?.totalExpenses)}
              </p>
              <div className="dash-card-bar">
                <div
                  className="dash-card-bar-fill red"
                  style={{
                    width: data?.totalIncome > 0
                      ? `${Math.min((data.totalExpenses / data.totalIncome) * 100, 100)}%`
                      : '0%',
                  }}
                />
              </div>
              <p className="dash-card-hint">
                {data?.totalIncome > 0
                  ? `${((data.totalExpenses / data.totalIncome) * 100).toFixed(0)}% of income`
                  : '—'}
              </p>
            </div>

            {/* Savings */}
            <div className="dash-card">
              <p className="dash-card-label">TOTAL SAVINGS</p>
              <p className="dash-card-value dash-blue">
                {fmt(data?.totalSavings)}
              </p>
              <div className="dash-card-bar">
                <div
                  className="dash-card-bar-fill blue"
                  style={{
                    width: data?.totalIncome > 0
                      ? `${Math.min((data.totalSavings / data.totalIncome) * 100, 100)}%`
                      : '0%',
                  }}
                />
              </div>
              <p className="dash-card-hint">
                {data?.totalIncome > 0
                  ? `${((data.totalSavings / data.totalIncome) * 100).toFixed(0)}% of income saved`
                  : '—'}
              </p>
            </div>
          </div>

          {/* ── Spending trend chart ───────────────────────── */}
        {/* ── Spending trend chart ───────────────────────── */}
                  <div className="dash-section-card" style={{ marginBottom: 20 }}>
                    <div className="dash-section-header">
                      <div>
                        <p className="dash-section-title">Spending Trends</p>
                        <p className="dash-section-sub">
                          Monthly income, expenses, saving
                        </p>
                      </div>
                      <div className="dash-trend-toggle">
                        {['6M', '1Y'].map((v) => (
                          <button
                            key={v}
                            className={`dash-trend-btn ${trendView === v ? 'active' : ''}`}
                            onClick={() => setTrendView(v)}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Legend — manual so it's always visible */}
                    <div className="dash-trend-legend">
                      <span className="dash-legend-dot" style={{ background: '#27ae60' }} />
                      <span className="dash-legend-label">Income</span>
                      <span className="dash-legend-dot" style={{ background: '#e74c3c' }} />
                      <span className="dash-legend-label">Expenses</span>
                      <span className="dash-legend-dot" style={{ background: '#1a4f8a' }} />
                      <span className="dash-legend-label">Savings</span>
                    </div>

                    {trendData.length === 0 ||
                     trendData.every(d => !d.income && !d.expenses && !d.savings) ? (
                      <div className="dash-empty-chart">
                        No data yet — add transactions to see trends
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart
                          data={trendData}
                          margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                          barCategoryGap="25%"
                          barGap={3}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f0f3f7"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 12, fill: '#8a9bb0' }}
                            axisLine={false}
                            tickLine={false}
                            /* Show full month label e.g. "Apr 2026" */
                         tickFormatter={(val) => {
                                               // val is "Apr 26" → show as "Apr 2026"
                                               const parts = val.split(' ');
                                               return parts.length === 2
                                                 ? `${parts[0]} 20${parts[1]}`
                                                 : val;
                                             }}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: '#8a9bb0' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => {
                              if (v === 0) return '₹0';
                              if (v >= 100000) return `₹${(v/100000).toFixed(1)}L`;
                              if (v >= 1000)   return `₹${(v/1000).toFixed(0)}k`;
                              return `₹${v}`;
                            }}
                          />
                          <Tooltip
                            formatter={(value, name) => [
                              `₹${Number(value).toLocaleString('en-IN')}`,
                              name,
                            ]}
                  labelFormatter={(label) => {
                                        // "Apr 26" → "April 2026 (01 Apr – 30 Apr)"
                                        const monthMap = {
                                          Jan:'January', Feb:'February', Mar:'March',
                                          Apr:'April',   May:'May',      Jun:'June',
                                          Jul:'July',    Aug:'August',   Sep:'September',
                                          Oct:'October', Nov:'November', Dec:'December',
                                        };
                                        const monthDays = {
                                          Jan:31, Feb:28, Mar:31, Apr:30, May:31, Jun:30,
                                          Jul:31, Aug:31, Sep:30, Oct:31, Nov:30, Dec:31,
                                        };
                                        const parts = label.split(' ');
                                        if (parts.length === 2) {
                                          const fullMonth = monthMap[parts[0]] || parts[0];
                                          const fullYear  = `20${parts[1]}`;
                                          const days      = monthDays[parts[0]] || 30;
                                          // Handle leap year Feb
                                          const yr = parseInt(fullYear);
                                          const febDays = (yr % 4 === 0 && (yr % 100 !== 0 || yr % 400 === 0)) ? 29 : 28;
                                          const lastDay = parts[0] === 'Feb' ? febDays : days;
                                          return `  01 – ${lastDay} ${parts[0]} ${fullYear}`;
                                        }
                                        return label;
                                      }}
                            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                            contentStyle={{
                              borderRadius: 10,
                              border: '1px solid #e8edf3',
                              fontSize: 13,
                            }}
                          />
                          <Bar
                            dataKey="income"
                            name="Income"
                            fill="#27ae60"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={28}
                          />
                          <Bar
                            dataKey="expenses"
                            name="Expenses"
                            fill="#e74c3c"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={28}
                          />
                          <Bar
                            dataKey="savings"
                            name="Savings"
                            fill="#1a4f8a"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={28}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}


                  </div>

          {/* ── Bottom row: Category flow + Weekly ─────────── */}
          <div className="dash-bottom-row">

            {/* Category flow — Pie chart */}
            <div className="dash-section-card dash-half">
              <p className="dash-section-title">Category Flow</p>

              {data?.categoryFlow?.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={data.categoryFlow}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {data.categoryFlow.map((_, i) => (
                          <Cell
                            key={i}
                            fill={PIE_COLORS[i % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) => `₹${Number(v).toLocaleString()}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Legend */}
                  <div className="dash-pie-legend">
                    {data.categoryFlow.map((c, i) => (
                      <div key={c.category} className="dash-pie-row">
                        <span
                          className="dash-pie-dot"
                          style={{
                            background: PIE_COLORS[i % PIE_COLORS.length],
                          }}
                        />
                        <span className="dash-pie-name">{c.category}</span>
                        <span className="dash-pie-amt">
                          ₹{Number(c.amount).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="dash-empty-chart">No expense data</div>
              )}
            </div>

            {/* Weekly income vs expenses — Bar chart */}
            <div className="dash-section-card dash-half">
              <p className="dash-section-title">Weekly Income vs Expenses</p>

              {data?.weeklyComparison?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={data.weeklyComparison}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    barCategoryGap="30%"
                    barGap={4}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f3f7"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 12, fill: '#8a9bb0' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#8a9bb0' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) =>
                        v === 0 ? '0' : `₹${(v / 1000).toFixed(0)}k`
                      }
                    />
                    <Tooltip
                      formatter={(v, name) => [
                        `₹${Number(v).toLocaleString()}`,
                        name,
                      ]}
                      cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                    />
                    <Bar
                      dataKey="income"
                      name="Income"
                      fill="#27ae60"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                    <Bar
                      dataKey="expenses"
                      name="Expenses"
                      fill="#e74c3c"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="dash-empty-chart">No data this period</div>
              )}
            </div>
          </div>
{/* ── Savings Trend ──────────────────────────────── */}
          <div className="dash-section-card" style={{ margin: '20px 0' }}>
            <div className="dash-section-header">
              <div>
                <p className="dash-section-title">Savings Trend</p>
                <p className="dash-section-sub">
                  Cumulative savings growth over the last 12 months
                </p>
              </div>
              <div className="dash-savings-total">
                <span className="dash-savings-label">TOTAL SAVED</span>
                <span className="dash-savings-value">
                  ₹{Number(
                    savingsData[savingsData.length - 1]?.totalSaved || 0
                  ).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {savingsData.every(d => d.totalSaved === 0) ? (
              <div className="dash-empty-chart">
                No savings yet — add saving entries to see your trend
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={savingsData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="savingsGrad" x1="0" y1="0" x2="0" y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#1a4f8a"
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="95%"
                        stopColor="#1a4f8a"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f3f7"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#8a9bb0' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => {
                      const parts = val.split(' ');
                      return parts.length === 2
                        ? `${parts[0]} 20${parts[1]}`
                        : val;
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#8a9bb0' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => {
                      if (v === 0)        return '₹0';
                      if (v >= 100000)    return `₹${(v/100000).toFixed(1)}L`;
                      if (v >= 1000)      return `₹${(v/1000).toFixed(0)}k`;
                      return `₹${v}`;
                    }}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      `₹${Number(value).toLocaleString('en-IN')}`,
                      name === 'totalSaved' ? 'Total Saved' : 'This Month',
                    ]}
                    labelFormatter={(label) => {
                      const monthMap = {
                        Jan:'January', Feb:'February', Mar:'March',
                        Apr:'April',   May:'May',      Jun:'June',
                        Jul:'July',    Aug:'August',   Sep:'September',
                        Oct:'October', Nov:'November', Dec:'December',
                      };
                      const parts = label.split(' ');
                      return parts.length === 2
                        ? `${monthMap[parts[0]] || parts[0]} 20${parts[1]}`
                        : label;
                    }}
                    contentStyle={{
                      borderRadius: 10,
                      border: '1px solid #e8edf3',
                      fontSize: 13,
                    }}
                  />
                  {/* Cumulative line — main story */}
                  <Area
                    type="monotone"
                    dataKey="totalSaved"
                    name="totalSaved"
                    stroke="#1a4f8a"
                    strokeWidth={2.5}
                    fill="url(#savingsGrad)"
                    dot={false}
                    activeDot={{ r: 5, fill: '#1a4f8a' }}
                  />
                  {/* Monthly bars — secondary context */}
                  <Line
                    type="monotone"
                    dataKey="monthlySaved"
                    name="monthlySaved"
                    stroke="#27ae60"
                    strokeWidth={1.5}
                    dot={false}
                    strokeDasharray="4 3"
                    activeDot={{ r: 4, fill: '#27ae60' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {/* Legend */}
            <div className="dash-trend-legend" style={{ marginTop: 12 }}>
              <span className="dash-legend-dot"
                style={{ background: '#1a4f8a' }} />
              <span className="dash-legend-label">
                Cumulative Total Saved
              </span>
              <span className="dash-legend-dot"
                style={{ background: '#27ae60' }} />
              <span className="dash-legend-label">
                Monthly Saving (dashed)
              </span>
            </div>
          </div>
          {/* ── Recent transactions ────────────────────────── */}
          <div className="dash-section-card" style={{ marginTop: 20 }}>
            <div className="dash-section-header">
              <div>
                <p className="dash-section-title">Recent Transactions</p>
              </div>
              <button
                className="dash-view-all"
                onClick={() => navigate('/transactions')}
              >
                View All →
              </button>
            </div>

            {data?.recentTransactions?.length > 0 ? (
              <table className="dash-tx-table">
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>DESCRIPTION</th>
                    <th>CATEGORY</th>
                    <th>TYPE</th>
                    <th>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTransactions.map((tx) => {
                    const isIncome  = tx.type === 'INCOME';
                    const isExpense = tx.type === 'EXPENSE';
                    const amtColor  = isIncome ? '#27ae60' : isExpense ? '#e74c3c' : '#1a4f8a';
                    const amtPrefix = isIncome ? '+' : '-';
                    const typeStyle = isIncome
                      ? { background: '#e8f8ef', color: '#27ae60' }
                      : isExpense
                      ? { background: '#fde8e8', color: '#e74c3c' }
                      : { background: '#e8f0fa', color: '#1a4f8a' };

                    return (
                      <tr key={tx.id}>
                        <td className="dash-tx-date">
                          {formatDate(tx.date)}
                        </td>
                        <td className="dash-tx-name">
                          {tx.description || tx.category}
                        </td>
                        <td>
                          <span className="dash-tx-cat">{tx.category}</span>
                        </td>
                        <td>
                          <span className="dash-tx-type" style={typeStyle}>
                            {tx.type}
                          </span>
                        </td>
                        <td
                          className="dash-tx-amt"
                          style={{ color: amtColor }}
                        >
                          {amtPrefix}₹{Number(tx.amount).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="dash-empty-chart">No recent transactions</div>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}