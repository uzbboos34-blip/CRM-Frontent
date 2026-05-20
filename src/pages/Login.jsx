import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Keyframe CSS injected once ──────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body { font-family: 'Inter', sans-serif; }

  @keyframes bgFloat {
    0%   { transform: translate(0, 0) scale(1); }
    33%  { transform: translate(30px, -40px) scale(1.05); }
    66%  { transform: translate(-20px, 20px) scale(0.97); }
    100% { transform: translate(0, 0) scale(1); }
  }
  @keyframes orb1 {
    0%,100% { transform: translate(0,0); }
    50%     { transform: translate(60px, -80px); }
  }
  @keyframes orb2 {
    0%,100% { transform: translate(0,0); }
    50%     { transform: translate(-50px, 60px); }
  }
  @keyframes orb3 {
    0%,100% { transform: translate(0,0); }
    50%     { transform: translate(40px, 40px); }
  }
  @keyframes slideRight {
    from { opacity: 0; transform: translateX(-40px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeInScale {
    from { opacity: 0; transform: scale(0.95); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%,60% { transform: translateX(-6px); }
    40%,80% { transform: translateX(6px); }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(0.8); opacity: 0.8; }
    100% { transform: scale(2.4); opacity: 0; }
  }
  @keyframes countUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes iconFloat {
    0%,100% { transform: translateY(0); }
    50%     { transform: translateY(-8px); }
  }
  @keyframes fadeOut {
    from { opacity: 1; }
    to   { opacity: 0; pointer-events: none; }
  }

  .login-root {
    display: flex;
    min-height: 100vh;
    width: 100vw;
    overflow: hidden;
    font-family: 'Inter', sans-serif;
  }

  /* ── Left panel ──────────────────────────────────────────── */
  .login-left {
    flex: 0 0 48%;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: #0a0f1e;
  }
  @media (max-width: 900px) { .login-left { display: none; } }

  .left-bg {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 20% 50%, #1a2744 0%, #0a0f1e 60%),
                radial-gradient(ellipse at 80% 20%, #0d1b3e 0%, transparent 50%);
  }

  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.45;
  }
  .orb-1 {
    width: 380px; height: 380px;
    background: radial-gradient(circle, #3b82f6 0%, #1d4ed8 100%);
    top: -80px; left: -80px;
    animation: orb1 12s ease-in-out infinite;
  }
  .orb-2 {
    width: 300px; height: 300px;
    background: radial-gradient(circle, #8b5cf6 0%, #6d28d9 100%);
    bottom: -60px; right: -40px;
    animation: orb2 15s ease-in-out infinite;
  }
  .orb-3 {
    width: 200px; height: 200px;
    background: radial-gradient(circle, #06b6d4 0%, #0891b2 100%);
    top: 55%; left: 55%;
    animation: orb3 10s ease-in-out infinite;
  }

  /* Grid overlay */
  .grid-overlay {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .left-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48px;
    animation: slideRight 0.9s ease-out both;
  }

  /* Logo mark */
  .logo-ring {
    position: relative;
    width: 88px; height: 88px;
    margin-bottom: 32px;
  }
  .logo-ring-bg {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    opacity: 0.18;
    animation: pulse-ring 2.5s ease-out infinite;
  }
  .logo-ring-inner {
    position: absolute;
    inset: 8px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 32px rgba(59,130,246,0.4);
    animation: iconFloat 3s ease-in-out infinite;
  }

  .left-title {
    font-size: 1.75rem;
    font-weight: 800;
    color: #fff;
    text-align: center;
    line-height: 1.3;
    margin-bottom: 12px;
  }
  .left-title span {
    background: linear-gradient(90deg, #60a5fa, #a78bfa, #34d399);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 4s linear infinite;
  }
  .left-subtitle {
    font-size: 0.9rem;
    color: rgba(255,255,255,0.5);
    text-align: center;
    max-width: 280px;
    line-height: 1.6;
    margin-bottom: 48px;
  }

  /* Stats */
  .stats-row {
    display: flex;
    gap: 20px;
    margin-bottom: 40px;
  }
  .stat-card {
    flex: 1;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 16px 20px;
    text-align: center;
    backdrop-filter: blur(10px);
    animation: countUp 0.6s ease-out both;
  }
  .stat-card:nth-child(2) { animation-delay: 0.1s; }
  .stat-card:nth-child(3) { animation-delay: 0.2s; }
  .stat-num {
    font-size: 1.4rem;
    font-weight: 800;
    color: #fff;
  }
  .stat-label {
    font-size: 0.72rem;
    color: rgba(255,255,255,0.45);
    margin-top: 3px;
    font-weight: 500;
    letter-spacing: 0.3px;
  }

  /* Feature list */
  .feature-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: 320px;
  }
  .feature-item {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    padding: 12px 16px;
    animation: slideRight 0.7s ease-out both;
  }
  .feature-item:nth-child(2) { animation-delay: 0.1s; }
  .feature-item:nth-child(3) { animation-delay: 0.2s; }
  .feature-icon {
    width: 34px; height: 34px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 16px;
  }
  .feature-text {
    font-size: 0.82rem;
    color: rgba(255,255,255,0.75);
    font-weight: 500;
    line-height: 1.4;
  }

  /* ── Right panel ─────────────────────────────────────────── */
  .login-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #f8fafc;
    position: relative;
    padding: 40px 24px;
  }

  /* Subtle background shapes */
  .right-bg-circle-1 {
    position: absolute;
    width: 600px; height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%);
    top: -200px; right: -200px;
    pointer-events: none;
  }
  .right-bg-circle-2 {
    position: absolute;
    width: 400px; height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%);
    bottom: -100px; left: -100px;
    pointer-events: none;
  }

  .form-card {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 400px;
    background: #fff;
    border-radius: 24px;
    padding: 40px 40px 36px;
    box-shadow:
      0 1px 3px rgba(0,0,0,0.06),
      0 4px 16px rgba(0,0,0,0.06),
      0 16px 48px rgba(0,0,0,0.06);
    border: 1px solid rgba(0,0,0,0.06);
    animation: fadeInScale 0.7s ease-out both;
  }
  @media (max-width: 480px) {
    .form-card { padding: 28px 20px 24px; border-radius: 20px; }
  }

  /* Brand row */
  .brand-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 28px;
  }
  .brand-dot {
    width: 36px; height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(59,130,246,0.35);
  }
  .brand-name {
    font-size: 1.05rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.3px;
  }
  .brand-tag {
    font-size: 0.68rem;
    font-weight: 600;
    color: #3b82f6;
    background: #eff6ff;
    border-radius: 6px;
    padding: 2px 7px;
    letter-spacing: 0.5px;
    margin-left: 4px;
  }

  .form-heading {
    font-size: 1.5rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.5px;
    margin-bottom: 4px;
  }
  .form-sub {
    font-size: 0.85rem;
    color: #64748b;
    margin-bottom: 28px;
    font-weight: 400;
  }

  /* Field groups */
  .field-group {
    margin-bottom: 16px;
  }
  .field-label {
    display: block;
    font-size: 0.78rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 6px;
    letter-spacing: 0.1px;
  }
  .field-wrapper {
    position: relative;
  }
  .field-icon {
    position: absolute;
    left: 13px;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
    display: flex;
    align-items: center;
    font-size: 16px;
    pointer-events: none;
    transition: color 0.2s;
  }
  .field-input {
    width: 100%;
    height: 44px;
    padding: 0 42px;
    border: 1.5px solid #e5e7eb;
    border-radius: 10px;
    font-size: 0.88rem;
    color: #0f172a;
    background: #f9fafb;
    font-family: 'Inter', sans-serif;
    outline: none;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  }
  .field-input::placeholder { color: #9ca3af; }
  .field-input:focus {
    border-color: #3b82f6;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
  }
  .field-input:focus + .field-focus-line,
  .field-wrapper:focus-within .field-icon { color: #3b82f6; }

  .field-input.has-error {
    border-color: #ef4444;
    background: #fff;
    animation: shake 0.4s ease-in-out;
  }
  .field-input.has-error:focus {
    box-shadow: 0 0 0 3px rgba(239,68,68,0.12);
  }

  .toggle-pw-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: #9ca3af;
    display: flex;
    align-items: center;
    padding: 4px;
    border-radius: 6px;
    transition: color 0.2s, background 0.2s;
  }
  .toggle-pw-btn:hover { color: #374151; background: #f3f4f6; }

  /* Error message */
  .error-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 10px;
    padding: 10px 14px;
    margin-bottom: 16px;
    font-size: 0.82rem;
    color: #dc2626;
    font-weight: 500;
    animation: shake 0.4s ease-in-out;
  }

  /* Submit button */
  .submit-btn {
    width: 100%;
    height: 46px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #1d4ed8 100%);
    background-size: 200% auto;
    color: #fff;
    font-size: 0.92rem;
    font-weight: 700;
    font-family: 'Inter', sans-serif;
    letter-spacing: 0.3px;
    cursor: pointer;
    transition: background-position 0.4s, box-shadow 0.2s, transform 0.15s;
    box-shadow: 0 4px 16px rgba(59,130,246,0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 24px;
  }
  .submit-btn:hover:not(:disabled) {
    background-position: right center;
    box-shadow: 0 6px 24px rgba(59,130,246,0.45);
    transform: translateY(-1px);
  }
  .submit-btn:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(59,130,246,0.3);
  }
  .submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
  .submit-btn.success {
    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
    box-shadow: 0 4px 16px rgba(16,185,129,0.4);
  }

  .spinner {
    width: 20px; height: 20px;
    border: 2.5px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  /* Success overlay */
  .success-tick {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  /* Footer */
  .form-footer {
    margin-top: 24px;
    text-align: center;
    font-size: 0.76rem;
    color: #94a3b8;
  }
  .form-footer a {
    color: #3b82f6;
    font-weight: 600;
    text-decoration: none;
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 20px 0 0;
    color: #cbd5e1;
    font-size: 0.75rem;
  }
  .divider::before, .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e5e7eb;
  }

  .copyright {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.72rem;
    color: #cbd5e1;
    white-space: nowrap;
    font-family: 'Inter', sans-serif;
  }
`;

// ── SVG icons ──────────────────────────────────────────────────────────────
const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const LogoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
  </svg>
);

// ── Features data ──────────────────────────────────────────────────────────
const FEATURES = [
  { icon: '📊', bg: 'rgba(59,130,246,0.15)', text: "O'quvchilar davomati va statistikasi" },
  { icon: '📝', bg: 'rgba(139,92,246,0.15)', text: "Vazifalar, imtihonlar va baholar" },
  { icon: '💳', bg: 'rgba(16,185,129,0.15)', text: "To'lovlar va moliyaviy hisobot" },
];

const STATS = [
  { num: '2K+', label: "O'quvchilar" },
  { num: '50+', label: 'Guruhlar' },
  { num: '99%', label: 'Faollik' },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [shakeField, setShakeField] = useState(false);
  const navigate = useNavigate();

  // Inject CSS once
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const triggerShake = () => {
    setShakeField(true);
    setTimeout(() => setShakeField(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone || !password) {
      setError("Phone va parolni to'liq kiriting");
      triggerShake();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('https://crm-backend-l7jq.onrender.com/api/v1/auth/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        let msg = data.message || 'Login xatosi yuz berdi';
        if (
          msg.includes('Unauthorized') ||
          msg.includes('Incorrect') ||
          msg.toLowerCase().includes('invalid')
        ) {
          msg = 'Login yoki parol xato kiritildi';
        } else if (msg.includes('User not found')) {
          msg = 'Bunday foydalanuvchi mavjud emas';
        }
        throw new Error(msg);
      }

      localStorage.setItem('token', data.token);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 900);
    } catch (err) {
      setError(err.message);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      {/* ═══ LEFT PANEL ═══════════════════════════════════════════════════ */}
      <div className="login-left">
        <div className="left-bg" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="grid-overlay" />

        <div className="left-content">
          {/* Logo ring */}
          <div className="logo-ring">
            <div className="logo-ring-bg" />
            <div className="logo-ring-inner">
              <LogoIcon />
            </div>
          </div>

          {/* Title */}
          <h1 className="left-title">
            O'quv Markazi <br />
            <span>Boshqaruv Tizimi</span>
          </h1>
          <p className="left-subtitle">
            Zamonaviy CRM tizimi orqali o'quvchilar, o'qituvchilar
            va kurslarni oson boshqaring.
          </p>

          {/* Stats */}
          <div className="stats-row">
            {STATS.map((s) => (
              <div key={s.label} className="stat-card">
                <div className="stat-num">{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="feature-list">
            {FEATURES.map((f) => (
              <div key={f.text} className="feature-item">
                <div className="feature-icon" style={{ background: f.bg }}>
                  {f.icon}
                </div>
                <span className="feature-text">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ RIGHT PANEL ══════════════════════════════════════════════════ */}
      <div className="login-right">
        <div className="right-bg-circle-1" />
        <div className="right-bg-circle-2" />

        <div className="form-card">
          {/* Brand */}
          <div className="brand-row">
            <div className="brand-dot">
              <LogoIcon />
            </div>
            <span className="brand-name">Najot Ta'lim</span>
            <span className="brand-tag">CRM</span>
          </div>

          <h2 className="form-heading">Xush kelibsiz! 👋</h2>
          <p className="form-sub">Davom etish uchun tizimga kiring</p>

          {/* Error banner */}
          {error && (
            <div className="error-banner">
              <AlertIcon />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Phone field */}
            <div className="field-group">
              <label className="field-label" htmlFor="login-phone">
                Telefon raqam
              </label>
              <div className="field-wrapper">
                <span className="field-icon">
                  <PhoneIcon />
                </span>
                <input
                  id="login-phone"
                  type="tel"
                  className={`field-input${shakeField && !phone ? ' has-error' : ''}`}
                  placeholder="+998 90 123 45 67"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (error) setError(null);
                  }}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="field-group">
              <label className="field-label" htmlFor="login-password">
                Parol
              </label>
              <div className="field-wrapper">
                <span className="field-icon">
                  <LockIcon />
                </span>
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  className={`field-input${shakeField && !password ? ' has-error' : ''}`}
                  placeholder="Parolni kiriting"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-pw-btn"
                  onClick={() => setShowPw((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPw ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                >
                  {showPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              className={`submit-btn${success ? ' success' : ''}`}
              disabled={loading || success}
            >
              {loading ? (
                <div className="spinner" />
              ) : success ? (
                <span className="success-tick">
                  <CheckIcon />
                  Muvaffaqiyatli kirdingiz!
                </span>
              ) : (
                'Kirish →'
              )}
            </button>
          </form>

          <div className="divider">CRM v2.0</div>

          <div className="form-footer">
            Muammo bormi?{' '}
            <a href="mailto:support@najotnajot.uz">support@najotnajot.uz</a>
          </div>
        </div>

        <span className="copyright">
          © 2024 Najot Ta'lim. Barcha huquqlar himoyalangan.
        </span>
      </div>
    </div>
  );
}
