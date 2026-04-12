import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import API from '../api/api';
import '../styles/app.css';

function Toast({ msg, type }) {
  if (!msg) return null;
  return <div className={`toast ${type === 'error' ? 'error' : ''}`}>{msg}</div>;
}

function getStrength(pw) {
  let s = 0;
  if (pw.length >= 6) s++;       // ← 6 not 8
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.fullName || '');
  const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' });
  const [toast, setToast] = useState({ msg: '', type: '' });
  const [showDelete, setShowDelete] = useState(false);
const handleDeleteAccount = async () => {
  try {
    await API.delete('/auth/delete-account'); // backend endpoint
    showToast('Account deleted successfully');

    logout();              // clear auth
    navigate('/signup');   // redirect

  } catch (err) {
    showToast(err.response?.data?.message || 'Delete failed', 'error');
  }
};
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3000);
  };

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

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  const strength = getStrength(pw.newPw);
  const strengthColors = ['#dde3ea', '#e74c3c', '#e67e22', '#f1c40f', '#27ae60'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  const initials =
    user?.fullName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

  return (
 <AppShell activeRoute="Settings">
   <div className="page-header">
     <h1 className="page-title">Profile</h1>
     <p className="page-sub">Manage your editorial financial identity</p>
   </div>

   <div className="profile-grid">

     {/* LEFT */}
     <div>
       <div className="card">
         <div className="profile-avatar-large">{initials}</div>
         <p className="profile-name">{user?.fullName}</p>
         <p className="profile-email">🔒 {user?.email}</p>
       </div>

       <div className="card" style={{ marginTop: 16 }}>
         <p className="card-title">Personal Details</p>
         <div style={{ marginTop: 16 }}>
           <p className="profile-field-label">DISPLAY NAME</p>
           <input
             className="profile-input"
             value={name}
             onChange={(e) => setName(e.target.value)}
           />
           <button className="btn-blue" onClick={updateName}>
             Update Name
           </button>
         </div>
       </div>
     </div>

     {/* RIGHT */}
     <div>
       <div className="danger-card">
         <button className="btn-outline" onClick={handleLogout}>
           ↪ Logout from session
         </button>

         <div style={{ textAlign: 'right' }}>
           <button className="btn-danger" onClick={() => setShowDelete(true)}>
             ✖ Delete Account
           </button>
           <p className="danger-sub">
             This action is permanent and will erase all your financial data.
           </p>
         </div>
       </div>
     </div>

   </div>

   <Toast msg={toast.msg} type={toast.type} />

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
           <button className="btn-outline" onClick={() => setShowDelete(false)}>
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