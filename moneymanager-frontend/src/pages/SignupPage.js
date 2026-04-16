import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/api';
import Field from '../components/Field';
import '../styles/auth.css';

function getStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let s = 0;
  if (pw.length >= 6) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#e74c3c', '#e67e22', '#f1c40f', '#27ae60'];
  return { score: s, label: labels[s], color: colors[s] };
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.fullName || form.fullName.trim().length < 3)
      e.fullName = 'Name must be at least 3 characters';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email))
      e.email = 'Enter a valid email address';
    if (!form.password || form.password.length < 6)
      e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword)
      e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError('');
    try {
      // sends { fullName, email, password, confirmPassword }
      // backend @JsonProperty("fullName") maps it correctly
      const res = await API.post('/auth/signup', {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      login(res.data.token, res.data.user);
      navigate('/home');
    } catch (err) {
      const data = err.response?.data;
      // backend validation errors come as { fullName: "...", email: "..." }
      if (typeof data === 'object' && !data.message) {
        const firstError = Object.values(data)[0];
        setServerError(firstError);
      } else {
        setServerError(data?.message || 'Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const strength = getStrength(form.password);

  return (
    <div className="auth-bg">
      <div className="auth-logo">
        <div className="auth-logo-icon">💰</div>
        <h1 className="auth-logo-name">MoneyManager</h1>
      </div>

      <div className="auth-card">
        <h2 className="auth-card-title">Create Account</h2>

        {serverError && <div className="error-banner">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <Field label="FULL NAME" error={errors.fullName}>
            <input
              className={`field-input ${errors.fullName ? 'error' : ''}`}
              placeholder="John Doe"
              value={form.fullName}
              onChange={set('fullName')}
            />
          </Field>

          <Field label="EMAIL" error={errors.email}>
            <input
              className={`field-input ${errors.email ? 'error' : ''}`}
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={set('email')}
            />
          </Field>

          <Field label="PASSWORD" error={errors.password}>
            <input
              className={`field-input ${errors.password ? 'error' : ''}`}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
            />
            {form.password && (
              <>
                <div className="strength-bar">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="strength-seg"
                      style={{
                        background: i <= strength.score ? strength.color : '#dde3ea',
                      }}
                    />
                  ))}
                </div>
                <p className="strength-label" style={{ color: strength.color }}>
                  {strength.label}:{' '}
                  {strength.label === 'Weak'
                    ? 'Use at least 6 characters'
                    : 'Looking good!'}
                </p>
              </>
            )}
          </Field>

          <Field label="CONFIRM PASSWORD" error={errors.confirmPassword}>
            <input
              className={`field-input ${errors.confirmPassword ? 'error' : ''}`}
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
            />
          </Field>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>

      <p className="auth-footer">
        Already have an account? <Link to="/signin">Sign in</Link>
      </p>
    </div>
  );
}