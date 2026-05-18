import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/app.css';

const NAV = [
  { label: 'Dashboard',    icon: '⊞', path: '/home' },
  { label: 'Transactions', icon: '⊟', path: '/transactions' },
  { label: 'Add Entry',    icon: '＋', path: '/add-entry' },
  { label: 'Budgets',      icon: '⊠', path: '/budgets' },
];

export default function AppShell({ children }) {
  const { user } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Initials from fullName or fullname ─────────────────────
  const rawName = user?.fullName || user?.fullname || '';
  const initials = rawName
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0].toUpperCase())
    .slice(0, 2)
    .join('') || '?';

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="shell">

      {/* ── Mobile overlay backdrop ──────────────────────────── */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>

        {/* Logo — clicks to home */}
        <div
          className="sidebar-brand"
          style={{ cursor: 'pointer' }}
          onClick={() => { navigate('/home'); closeSidebar(); }}
        >
          <div className="sidebar-brand-name">MoneyManager</div>
        </div>

        {/* Nav links */}
        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`sidebar-link ${
                location.pathname === item.path ? 'active' : ''
              }`}
              onClick={closeSidebar}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

      </aside>

      {/* ── Right side: topbar + page content ───────────────── */}
      <div className="main-wrapper">

        {/* ── Top navbar ──────────────────────────────────────── */}
        <header className="topbar">
          {/* Hamburger — visible only on mobile */}
          <button
            className="topbar-hamburger"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          {/* Brand name in topbar — mobile only */}
          <div
            className="topbar-brand-mobile"
            onClick={() => { navigate('/home'); closeSidebar(); }}
          >
            MoneyManager
          </div>

          <div className="topbar-right">
            {/* Avatar → clicks to profile */}
            <div
              className="topbar-avatar"
              onClick={() => navigate('/profile')}
              title="Go to profile"
            >
              {initials}
            </div>
          </div>
        </header>

        {/* ── Page content ──────────────────────────────────── */}
        <main className="main-content">
          {children}
        </main>

      </div>
    </div>
  );
}