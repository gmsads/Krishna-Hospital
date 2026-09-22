import React, { useState } from 'react';
import { 
  Activity, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  UserRound, 
  Building2, 
  Phone, 
  Stethoscope, 
  ClipboardList, 
  FlaskConical, 
  ShieldCheck,
  Crown
} from 'lucide-react';
import { useAuth } from '../lib/auth';

const roleOptions = [
  { value: 'Super Admin', label: 'Super Admin', icon: Crown },
  { value: 'Admin', label: 'Administrator', icon: ShieldCheck },
  { value: 'Doctor', label: 'Doctor', icon: Stethoscope },
  { value: 'Front Desk', label: 'Front Desk', icon: ClipboardList },
  { value: 'Lab Assistant', label: 'Lab Assistant', icon: FlaskConical },
];

export default function AuthScreen({ path = window.location.pathname, navigate }) {
  const { signIn, signUp, loginAsDemoUser } = useAuth();
  const mode = path === '/register' ? 'signup' : 'login';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Front Desk');
  const [department, setDepartment] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('Central Campus');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setError('');
    setEmail('');
    setPassword('');
    setFullName('');
    setRole('Front Desk');
    setDepartment('');
    setSelectedBranch('Central Campus');
    setPhone('');
  };

  const switchMode = (next) => {
    reset();
    const targetPath = next === 'signup' ? '/register' : '/login';
    if (navigate) {
      navigate(targetPath);
    } else {
      window.history.pushState({}, '', targetPath);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please fill in email and password.');
      return;
    }
    if (mode === 'signup' && !fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setBusy(true);
    if (mode === 'login') {
      const { error: err } = await signIn(email.trim(), password);
      if (err) {
        setError(err.includes('Invalid login credentials') ? 'Incorrect email or password.' : err);
        setBusy(false);
      }
    } else {
      const { error: err } = await signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        role,
        department: department.trim() || undefined,
        phone: phone.trim() || undefined,
        branch: role === 'Super Admin' ? 'All' : selectedBranch,
      });
      if (err) {
        setError(err.includes('already registered') ? 'An account with this email already exists. Please sign in.' : err);
        setBusy(false);
      }
    }
  };

  return (
    <div className="auth-shell">
      {/* Left Panel - Brand Section */}
      <div className="auth-brand-panel">
        <div className="auth-brand-top">
          <div className="auth-brand-mark">
            <Activity size={26} strokeWidth={2.5} />
          </div>
          <div>
            <strong>KRISHNA</strong>
            <span>HOSPITALS</span>
          </div>
        </div>
        
        <div className="auth-brand-copy">
          <h1>Hospital CRM, reimagined for your team.</h1>
          <p>One workspace for patient care, outpatient records, laboratory workflows, and financial visibility — built for every role in the hospital.</p>
          
          <div className="auth-feature-list">
            <div>
              <ShieldCheck size={18} />
              <span>Role-based dashboards for every staff member</span>
            </div>
            <div>
              <ClipboardList size={18} />
              <span>Live OP tracking and patient registration</span>
            </div>
            <div>
              <FlaskConical size={18} />
              <span>End-to-end laboratory test management</span>
            </div>
          </div>
        </div>
        
        <div className="auth-brand-foot">© 2026 Krishna Hospitals · Central Campus</div>
      </div>

      {/* Right Panel - Form Section */}
      <div className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="auth-form-head">
            <div className="auth-mobile-brand">
              <div className="auth-brand-mark small">
                <Activity size={20} strokeWidth={2.5} />
              </div>
              <strong>KRISHNA HOSPITALS</strong>
            </div>
            <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
            <p>{mode === 'login' ? 'Sign in to access your hospital workspace.' : 'Join the Krishna Hospitals team in seconds.'}</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'signup' && (
              <Field icon={<UserRound size={16} />} label="Full name">
                <input 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  placeholder="Dr. Meera Nair" 
                  autoComplete="name" 
                />
              </Field>
            )}

            <Field icon={<Mail size={16} />} label="Email address">
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="you@krishnahospitals.in" 
                autoComplete="email" 
              />
            </Field>

            <Field icon={<Lock size={16} />} label="Password">
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Min. 6 characters" 
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'} 
              />
              <button 
                type="button" 
                className="field-toggle" 
                onClick={() => setShowPassword((v) => !v)} 
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </Field>

            {mode === 'signup' && (
              <>
                <div className="field-group">
                  <label>Select your role</label>
                  <div className="role-grid">
                    {roleOptions.map(({ value, label, icon: Icon }) => (
                      <button 
                        type="button" 
                        key={value} 
                        className={`role-option ${role === value ? 'selected' : ''}`} 
                        onClick={() => setRole(value)}
                      >
                        <Icon size={17} />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {role !== 'Super Admin' && (
                  <Field icon={<Building2 size={16} />} label="Assigned Hospital Branch *">
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px', background: 'transparent', cursor: 'pointer' }}
                    >
                      <option value="Central Campus">Central Campus (Central City)</option>
                      <option value="City Extension">City Extension (Lakeview Enclave)</option>
                      <option value="North Hospital">North Hospital (Sunrise Gardens)</option>
                    </select>
                  </Field>
                )}

                <div className="field-row">
                  <Field icon={<Building2 size={16} />} label="Department (optional)">
                    <input 
                      value={department} 
                      onChange={(e) => setDepartment(e.target.value)} 
                      placeholder="General medicine" 
                    />
                  </Field>
                  <Field icon={<Phone size={16} />} label="Phone (optional)">
                    <input 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="+91 00000 00000" 
                    />
                  </Field>
                </div>
              </>
            )}

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="auth-submit" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
              {!busy && <ArrowRight size={17} />}
            </button>
          </form>

          <div className="auth-switch">
            {mode === 'login' ? (
              <>Don't have an account? <button onClick={() => switchMode('signup')}>Create one</button></>
            ) : (
              <>Already on the team? <button onClick={() => switchMode('login')}>Sign in</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Field component
function Field({ icon, label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="field-input">
        <span className="field-icon">{icon}</span>
        {children}
      </div>
    </label>
  );
}