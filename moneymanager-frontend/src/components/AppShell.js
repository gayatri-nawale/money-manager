import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/app.css';

const NAV = [
  { label: 'Overview',     icon: '⊞', path: '/home' },
  { label: 'Transactions', icon: '⊟', path: '/transactions' },
  { label: 'Budgets',      icon: '⊠', path: '/budgets' },
  { label: 'Goals',        icon: '◎', path: '/goals' },
  { label: 'Settings',     icon: '⚙', path: '/profile' },
];

export default function AppShell({ children, activeRoute }) {
  const { user } = useAuth();
  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-name">MoneyManager</div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`sidebar-link ${activeRoute === item.label ? 'active' : ''}`}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-avatar">{initials}</div>
          <div>
            <div className="sidebar-user-name">{user?.fullName}</div>
            <div className="sidebar-user-plan">Free Plan</div>
          </div>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}