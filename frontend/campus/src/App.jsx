import { Routes, Route, Link, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import EventFeed from './pages/EventFeed';
import OrganizerDashboard from './pages/OrganizerDashboard';
import MyTickets from './pages/MyTickets';
import Login from './pages/Login';
import Icon from './components/Icon';
import { ToastHost } from './components/Toast';

function Navigation() {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const navigate = useNavigate();

  const checkUser = () => {
    const storedUser = localStorage.getItem('user');
    setUser(storedUser ? JSON.parse(storedUser) : null);
  };

  useEffect(() => {
    checkUser();
    window.addEventListener('auth-change', checkUser);
    return () => window.removeEventListener('auth-change', checkUser);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.setAttribute('data-bs-theme', 'dark');
    else root.removeAttribute('data-bs-theme');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new Event('auth-change'));
    navigate('/login');
  };

  const linkClass = ({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`;

  return (
    <nav className="app-nav">
      <div className="app-nav__inner">
        <Link className="brand" to="/">
          <span className="brand-mark"><Icon name="zap" size={18} /></span>
          <span className="brand-text">CampusPulse</span>
        </Link>

        <div className="nav-links">
          <NavLink to="/" end className={linkClass}>
            <Icon name="home" /> <span className="nav-label">Events</span>
          </NavLink>
          {/* My Tickets is now available to all logged-in users */}
          {user && (
            <NavLink to="/tickets" className={linkClass}>
              <Icon name="ticket" /> <span className="nav-label">My Tickets</span>
            </NavLink>
          )}
          {user?.role === 'organizer' && (
            <NavLink to="/dashboard" className={linkClass}>
              <Icon name="dashboard" /> <span className="nav-label">Dashboard</span>
            </NavLink>
          )}
        </div>

        <div className="nav-right">
          <button
            className="icon-btn"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            <Icon name={darkMode ? 'sun' : 'moon'} size={18} />
          </button>

          {user ? (
            <>
              <div className="user-chip">
                <span className="avatar">{(user.name || '?').trim().charAt(0)}</span>
                <span className="user-chip__text">
                  <div className="user-chip__name">{user.name}</div>
                  <div className="user-chip__role">{user.role}</div>
                </span>
              </div>
              <button className="icon-btn" onClick={handleLogout} title="Sign out" aria-label="Sign out">
                <Icon name="logout" size={18} />
              </button>
            </>
          ) : (
            <Link className="btn btn-primary btn-sm" to="/login">
              <Icon name="login" /> Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <>
      <Navigation />
      <ToastHost />
      <main className="page">
        <Routes>
          <Route path="/" element={<EventFeed />} />
          <Route path="/login" element={<Login />} />
          <Route path="/tickets" element={<MyTickets />} />
          <Route path="/dashboard" element={<OrganizerDashboard />} />
        </Routes>
      </main>
      <footer className="app-footer">© {new Date().getFullYear()} CampusPulse · Campus Event Portal</footer>
    </>
  );
}