import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/api';
import Field from '../components/Field';
import '../styles/auth.css';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const sendOtp = async (e) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Enter a valid email address');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await API.post('/auth/forgot-password', { email });
      setInfo(`OTP sent to ${email}. Check your inbox.`);
      setStep(2);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Could not send OTP. Check your email.'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Enter the 6-digit OTP');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await API.post('/auth/verify-otp', {
        email,
        otp,
        newPassword,
        confirmPassword,
      });
      navigate('/signin');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Invalid or expired OTP. Try again.'
      );
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

      <div className="step-bar">
        {[1, 2].map((s) => (
          <div
            key={s}
            className="step-dot"
            style={{ background: step >= s ? '#1a4f8a' : '#dde3ea' }}
          />
        ))}
      </div>

      <div className="auth-card">
        {step === 1 ? (
          <>
            <h2 className="auth-card-title">Forgot Password</h2>
            <p className="auth-card-sub">
              Enter your registered email to receive a security code.
            </p>
            {error && <div className="error-banner">{error}</div>}
            <form onSubmit={sendOtp} noValidate>
              <Field label="EMAIL ADDRESS">
                <input
                  className="field-input"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="auth-card-title">Reset Password</h2>
            <p className="auth-card-sub" style={{ color: '#27ae60' }}>{info}</p>
            {error && <div className="error-banner">{error}</div>}
            <form onSubmit={resetPassword} noValidate>
              <Field label="OTP CODE">
                <input
                  className="field-input"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  maxLength={6}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </Field>
              <Field label="NEW PASSWORD">
                <input
                  className="field-input"
                  type="password"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </Field>
              <Field label="CONFIRM PASSWORD">
                <input
                  className="field-input"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </Field>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>

      <p className="auth-footer">
        <Link to="/signin">← Back to Sign In</Link>
      </p>
      <p className="secured-label">SECURED BY MONEYMANAGER INTELLIGENCE</p>
    </div>
  );
}