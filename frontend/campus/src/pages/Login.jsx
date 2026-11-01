import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { toast } from '../components/Toast';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'student' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        await axios.post('https://campus-event-portal-seven.vercel.app/auth/signup', formData);
        toast.success('Account created! Please sign in.');
        setIsSignup(false);
      } else {
        const res = await axios.post('https://campus-event-portal-seven.vercel.app/auth/login', { email: formData.email, password: formData.password });
        localStorage.setItem('user', JSON.stringify(res.data));

        // Trigger global auth event so the navbar instantly detects the logged-in user
        window.dispatchEvent(new Event('auth-change'));

        toast.success(`Welcome back, ${res.data.name}!`);
        navigate(res.data.role === 'organizer' ? '/dashboard' : '/');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setFormData({ ...formData, [k]: e.target.value });

  return (
    <div className="auth-shell">
      <aside className="auth-side">
        <div>
          <span className="hero__eyebrow">CampusPulse</span>
          <h2>Everything happening on campus, in one place.</h2>
          <p>Discover events, grab your pass in seconds and earn rewards for showing up.</p>
          <ul className="auth-points">
            <li><span className="dot"><Icon name="search" /></span> Browse technical, cultural, sports & workshops</li>
            <li><span className="dot"><Icon name="ticket" /></span> Instant QR passes for gate check-in</li>
            <li><span className="dot"><Icon name="gift" /></span> Earn points and redeem campus perks</li>
          </ul>
        </div>
        <small style={{ color: '#a5b4fc' }}>Built for students & organizers</small>
      </aside>

      <section className="auth-form">
        <h3 className="mb-1">{isSignup ? 'Create your account' : 'Welcome back'}</h3>
        <p className="text-muted mb-4">{isSignup ? 'Join CampusPulse to register for events.' : 'Sign in to manage your tickets and rewards.'}</p>

        <div className="segmented mb-4" role="tablist">
          <button type="button" className={!isSignup ? 'active' : ''} onClick={() => setIsSignup(false)}>Sign in</button>
          <button type="button" className={isSignup ? 'active' : ''} onClick={() => setIsSignup(true)}>Sign up</button>
        </div>

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <>
              <div className="mb-3">
                <label className="form-label">Full name</label>
                <input type="text" className="form-control" placeholder="Aryan Sharma" required value={formData.name} onChange={set('name')} />
              </div>
              <div className="mb-3">
                <label className="form-label">I am a</label>
                <div className="segmented">
                  <button type="button" className={formData.role === 'student' ? 'active' : ''} onClick={() => setFormData({ ...formData, role: 'student' })}>
                    <Icon name="cap" /> Student
                  </button>
                  <button type="button" className={formData.role === 'organizer' ? 'active' : ''} onClick={() => setFormData({ ...formData, role: 'organizer' })}>
                    <Icon name="dashboard" /> Organizer
                  </button>
                </div>
              </div>
            </>
          )}
          <div className="mb-3">
            <label className="form-label">Email address</label>
            <input type="email" className="form-control" placeholder="you@college.edu" required value={formData.email} onChange={set('email')} />
          </div>
          <div className="mb-4">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" placeholder="••••••••" required value={formData.password} onChange={set('password')} />
          </div>
          <button type="submit" className="btn btn-primary btn-lg w-100" disabled={loading}>
            {loading && <span className="spinner-border spinner-border-sm" />}
            {isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-muted small mt-4 mb-0">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" className="link-btn" onClick={() => setIsSignup(!isSignup)}>{isSignup ? 'Sign in' : 'Sign up'}</button>
        </p>
      </section>
    </div>
  );
}