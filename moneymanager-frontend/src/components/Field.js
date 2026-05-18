import '../styles/auth.css';

export default function Field({ label, children, error, rightLabel }) {
  return (
    <div className="field-wrap">
      <div className="field-top-row">
        <label className="field-label">{label}</label>
        {rightLabel && <span>{rightLabel}</span>}
      </div>
      {children}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}