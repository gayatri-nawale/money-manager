import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import API from '../api/api';
import '../styles/app.css';
import '../styles/profile.css';

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div className={`toast ${type === 'error' ? 'error' : ''}`}>{msg}</div>
  );
}

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName]           = useState(user?.fullName || user?.fullname || '');
  const [toast, setToast]         = useState({ msg: '', type: '' });
  const [showDelete, setShowDelete] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3000);
  };

  // ── Initials ──────────────────────────────────────────────
  const rawName = user?.fullName || user?.fullname || '';
  const initials = rawName
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0].toUpperCase())
    .slice(0, 2)
    .join('') || '?';

  // ── Update name ───────────────────────────────────────────
  const updateName = async () => {
    if (!name.trim() || name.trim().length < 3) {
      showToast('Name must be at least 3 characters', 'error');
      return;
    }
    try {
      const res = await API.put('/auth/update-name', { fullName: name.trim() });
      setUser(res.data);
      showToast('Name updated successfully!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update name', 'error');
    }
  };

  // ── Logout ────────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  // ── Delete account ────────────────────────────────────────
  const handleDeleteAccount = async () => {
    try {
      await API.delete('/auth/delete-account');
      logout();
      navigate('/signup');
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  return (
    <AppShell>

      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-sub">Manage your account details</p>
      </div>

      <div className="prof-page">

        {/* ── Avatar card ─────────────────────────────────── */}
        <div className="prof-avatar-card">
          <div className="prof-avatar-circle">{initials}</div>
          <p className="prof-fullname">
            {user?.fullName || user?.fullname || 'User'}
          </p>
          <p className="prof-email"> {user?.email}</p>
        </div>

        {/* ── Personal details card ────────────────────────── */}
        <div className="prof-card">
          <p className="prof-card-title">Personal Details</p>
          <p className="prof-card-sub">Update your display name</p>

          <input
            className="prof-input"
            value={name}
            placeholder="Enter your name"
            onChange={(e) => setName(e.target.value)}
          />
          <button className="prof-btn-primary" onClick={updateName}>
            Update Name
          </button>
        </div>

        {/* ── Session & danger card ────────────────────────── */}
        <div className="prof-card">
          <p className="prof-card-title">Account Actions</p>

          <div className="prof-actions-row">
            <button className="prof-btn-outline" onClick={handleLogout}>
              ↪ Logout
            </button>
            <button
              className="prof-btn-danger"
              onClick={() => setShowDelete(true)}
            >
              ✖ Delete Account
            </button>
          </div>
          <p className="prof-danger-note">
            Deleting your account is permanent and cannot be undone.
          </p>
        </div>

      </div>

      <Toast msg={toast.msg} type={toast.type} />

      {/* ── Delete confirm modal ─────────────────────────── */}
      {showDelete && (
        <div className="modal-overlay">
          <div className="modal">
            <p className="modal-title" style={{ color: '#c0392b' }}>
              Delete Account?
            </p>
            <p className="modal-sub">
              This is permanent. All your data will be erased. Are you sure?
            </p>
            <div className="modal-actions">
              <button
                className="btn-outline"
                onClick={() => setShowDelete(false)}
              >
                Cancel
              </button>
              <button className="btn-danger" onClick={handleDeleteAccount}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </AppShell>
  );
}