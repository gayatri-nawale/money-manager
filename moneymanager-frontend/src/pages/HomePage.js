import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import '../styles/app.css';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <AppShell activeRoute="Overview">
      <div className="page-header">
        <h1 className="page-title">Overview</h1>
   <p className="page-sub">
     Welcome back, {user?.fullname?.split(' ')[0] || "User"} 👋
   </p>
      </div>
      <div className="card">
        <p style={{ color: '#8a9bb0', fontSize: 14 }}>
          Dashboard content coming in Phase 2 — transactions, charts, budgets.
        </p>
      </div>
    </AppShell>
  );
}