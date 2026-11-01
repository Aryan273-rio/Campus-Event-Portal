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
    <nav className={`navbar navbar-expand-lg ${darkMode ? 'navbar-dark bg-black border-bottom border-secondary' : 'navbar-dark bg-dark'} shadow-sm mb-4 py-3 transition-theme`}>
      {/* Changed to container-fluid for full width */}
      <div className="container-fluid px-4">
        <Link className="navbar-brand fw-bold text-info" to="/">🎓 CampusPulse</Link>
        <div className="d-flex gap-2 align-items-center">
          <Link className="btn btn-outline-light btn-sm px-3" to="/">Home</Link>
          
          {user?.role === 'student' && (
            <Link className="btn btn-outline-success btn-sm px-3" to="/tickets">My Tickets</Link>
          )}
          
          {user?.role === 'organizer' && (
            <Link className="btn btn-warning btn-sm px-3 text-dark fw-bold" to="/dashboard">Dashboard</Link>
          )}

          {/* Dark Mode Toggle Button */}
          <button 
            className="btn btn-outline-secondary btn-sm px-3 text-white" 
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle Dark/Light Mode"
          >
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
          
          {user ? (
            <div className="d-flex align-items-center ms-2 gap-2">
              <span className="badge bg-secondary p-2">👤 {user.name}</span>
              <button className="btn btn-danger btn-sm px-3" onClick={handleLogout}>Sign Out</button>
            </div>
          ) : (
            <Link className="btn btn-primary btn-sm px-4 ms-2" to="/login">Login / Sign Up</Link>
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
          --bg-color: #f4f7f6;
          --text-color: #212529;
          --card-bg: #ffffff;
          --modal-bg: #ffffff;
          --input-bg: #f8f9fa;
          --input-text: #212529;
        }

        [data-theme="dark"] {
          --bg-color: #121212;
          --text-color: #e0e0e0;
          --card-bg: #1e1e1e;
          --modal-bg: #1e1e1e;
          --input-bg: #2d2d2d;
          --input-text: #ffffff;
        }

        body { 
          background-color: var(--bg-color); 
          color: var(--text-color);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        .event-card { 
          background: var(--card-bg) !important;
          color: var(--text-color) !important;
          transition: transform 0.2s ease-in-out, box-shadow 0.2s; 
          border: none; 
          border-radius: 12px; 
          overflow: hidden; 
        }
        .event-card:hover { transform: translateY(-5px); box-shadow: 0 12px 24px rgba(0,0,0,0.2); }
        
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 1050; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .modal-custom { background: var(--modal-bg); color: var(--text-color); padding: 2.5rem; border-radius: 16px; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        
        .dashboard-header { background: linear-gradient(135deg, #4e54c8, #8f94fb); color: white; padding: 2.5rem; border-radius: 16px; margin-bottom: 2rem; box-shadow: 0 8px 20px rgba(78,84,200,0.2); }
        
        .countdown-badge { background: #fff3cd; color: #856404; font-weight: 600; font-size: 0.75rem; padding: 5px 10px; border-radius: 20px; display: inline-block; border: 1px solid #ffeeba; }
        [data-theme="dark"] .countdown-badge { background: #332701; color: #ffda6a; border-color: #664d03; }

        [data-theme="dark"] .form-control, [data-theme="dark"] .form-select {
          background-color: var(--input-bg);
          color: var(--input-text);
          border-color: #444;
        }
        [data-theme="dark"] .form-control:focus, [data-theme="dark"] .form-select:focus {
          background-color: var(--input-bg);
          color: var(--input-text);
          border-color: #0d6efd;
        }
        [data-theme="dark"] .bg-light { background-color: #252525 !important; color: #fff !important; }
        [data-theme="dark"] .text-muted { color: #aaa !important; }
        [data-theme="dark"] .table { color: #fff; }
        [data-theme="dark"] .table-light { background-color: #2a2a2a; color: #fff; }
      `}</style>

      <Navigation />
      {/* Changed to container-fluid for full width */}
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