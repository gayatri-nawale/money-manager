import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/api';
import Field from '../components/Field';
import '../styles/auth.css';

export default function SigninPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/auth/signin', {
        email: form.email,
        password: form.password,
      });
      login(res.data.token, res.data.user);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-logo">
        <div className="auth-logo-icon">💰</div>
        <h1 className="auth-logo-name">MoneyManager</h1>
        <p className="auth-logo-sub">Financial Intelligence</p>
      </div>

      <div className="auth-card">
        <h2 className="auth-card-title">Sign In</h2>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <Field label="EMAIL ADDRESS">
            <input
              className="field-input"
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={set('email')}
            />
          </Field>

          <Field
            label="PASSWORD"
            rightLabel={
              <Link to="/forgot-password" className="field-link">
                Forgot password?
              </Link>
            }
          >
            <div className="field-input-wrap">
              <input
                className="field-input"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                className="field-eye-btn"
                onClick={() => setShowPw(!showPw)}
              >
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </Field>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>

      <p className="auth-footer">
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
}