import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import EventFeed from './pages/EventFeed';
import OrganizerDashboard from './pages/OrganizerDashboard';
import MyTickets from './pages/MyTickets';
import Login from './pages/Login';

function Navigation() {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const navigate = useNavigate();

  const checkUser = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    else setUser(null);
  };

  useEffect(() => {
    checkUser();
    window.addEventListener('auth-change', checkUser);
    return () => window.removeEventListener('auth-change', checkUser);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.body.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new Event('auth-change'));
    navigate('/login');
  };

  return (
    <nav className={`navbar navbar-expand-lg ${darkMode ? 'navbar-dark bg-dark border-bottom border-secondary' : 'navbar-dark bg-dark'} shadow-sm mb-4 py-3 transition-theme`} style={{ background: darkMode ? '#18181b !important' : '#0f172a !important' }}>
      <div className="container-fluid px-4">
        <Link className="navbar-brand fw-bold text-info fs-4" to="/">🎓 CampusPulse</Link>
        <div className="d-flex gap-2 align-items-center">
          <Link className="btn btn-outline-light btn-sm px-3 fw-semibold" to="/">Home</Link>
          
          {user?.role === 'student' && (
            <Link className="btn btn-outline-success btn-sm px-3 fw-semibold" to="/tickets">My Tickets</Link>
          )}
          
          {user?.role === 'organizer' && (
            <Link className="btn btn-warning btn-sm px-3 text-dark fw-bold" to="/dashboard">Dashboard</Link>
          )}

          {/* Dark Mode Toggle Button */}
          <button 
            className="btn btn-outline-secondary btn-sm px-3 text-white fw-semibold" 
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle Dark/Light Mode"
          >
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          
          {user ? (
            <div className="d-flex align-items-center ms-2 gap-2">
              <span className="badge bg-secondary p-2">👤 {user.name}</span>
              <button className="btn btn-danger btn-sm px-3 fw-semibold" onClick={handleLogout}>Sign Out</button>
            </div>
          ) : (
            <Link className="btn btn-primary btn-sm px-4 ms-2 fw-bold" to="/login">Login / Sign Up</Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <>
      <style>{`
        :root {
          --bg-color: #f8fafc;
          --text-color: #1e293b;
          --card-bg: #ffffff;
          --modal-bg: #ffffff;
          --input-bg: #ffffff;
          --input-text: #1e293b;
          --border-color: #e2e8f0;
          --shadow-subtle: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          --shadow-hover: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
        }

        [data-theme="dark"] {
          --bg-color: #090d16;
          --text-color: #f1f5f9;
          --card-bg: #111827;
          --modal-bg: #111827;
          --input-bg: #1f2937;
          --input-text: #f1f5f9;
          --border-color: #374151;
          --shadow-subtle: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
          --shadow-hover: 0 10px 20px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
        }

        body { 
          background-color: var(--bg-color); 
          color: var(--text-color);
          font-family: 'Inter', system-ui, -apple-system, sans-serif; 
          transition: background-color 0.25s ease, color 0.25s ease;
        }

        .event-card { 
          background: var(--card-bg) !important;
          color: var(--text-color) !important;
          transition: transform 0.2s ease, box-shadow 0.2s ease; 
          border: 1px solid var(--border-color) !important; 
          border-radius: 16px; 
          overflow: hidden; 
          box-shadow: var(--shadow-subtle);
        }
        .event-card:hover { 
          transform: translateY(-4px); 
          box-shadow: var(--shadow-hover); 
        }
        
        .modal-overlay { 
          position: fixed; 
          top: 0; 
          left: 0; 
          width: 100%; 
          height: 100%; 
          background: rgba(0, 0, 0, 0.6); 
          z-index: 1050; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          backdrop-filter: blur(6px); 
        }
        
        .modal-custom { 
          background: var(--modal-bg); 
          color: var(--text-color); 
          padding: 2.5rem; 
          border-radius: 20px; 
          width: 90%; 
          max-width: 520px; 
          max-height: 90vh; 
          overflow-y: auto; 
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
          border: 1px solid var(--border-color);
        }
        
        .dashboard-header { 
          background: linear-gradient(135deg, #3b82f6, #6366f1); 
          color: white; 
          padding: 2.5rem; 
          border-radius: 20px; 
          margin-bottom: 2rem; 
          box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.3); 
        }
        
        .countdown-badge { 
          background: #fef3c7; 
          color: #92400e; 
          font-weight: 600; 
          font-size: 0.75rem; 
          padding: 6px 12px; 
          border-radius: 20px; 
          display: inline-block; 
          border: 1px solid #fde68a; 
        }
        [data-theme="dark"] .countdown-badge { 
          background: #451a03; 
          color: #fcd34d; 
          border-color: #78350f; 
        }

        /* Form Controls & Dropdowns Fix for Dark Mode */
        .form-control, .form-select {
          background-color: var(--input-bg);
          color: var(--input-text);
          border-color: var(--border-color);
          border-radius: 10px;
          padding: 0.75rem 1rem;
        }
        .form-control:focus, .form-select:focus {
          background-color: var(--input-bg);
          color: var(--input-text);
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }

        /* Fix Dropdown options camouflage in dark mode */
        [data-theme="dark"] select option {
          background-color: #1f2937;
          color: #f1f5f9;
          padding: 10px;
        }

        [data-theme="dark"] .bg-light { 
          background-color: #1a2234 !important; 
          color: #f1f5f9 !important; 
          border-color: var(--border-color) !important;
        }
        [data-theme="dark"] .text-muted { 
          color: #94a3b8 !important; 
        }
        [data-theme="dark"] .table { 
          color: var(--text-color); 
        }
        [data-theme="dark"] .table-light { 
          background-color: #1f2937; 
          color: #f1f5f9; 
        }
      `}</style>

      <Navigation />
      <div className="container-fluid px-4 pb-5">
        <Routes>
          <Route path="/" element={<EventFeed />} />
          <Route path="/login" element={<Login />} />
          <Route path="/tickets" element={<MyTickets />} />
          <Route path="/dashboard" element={<OrganizerDashboard />} />
        </Routes>
      </div>
    </>
  );
}