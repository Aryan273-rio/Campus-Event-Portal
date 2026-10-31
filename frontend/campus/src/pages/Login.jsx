import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'student' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isSignup) {
        await axios.post('http://localhost:8000/auth/signup', formData);
        alert('Account created! Please log in.');
        setIsSignup(false);
      } else {
        const res = await axios.post('http://localhost:8000/auth/login', { email: formData.email, password: formData.password });
        localStorage.setItem('user', JSON.stringify(res.data));
        
        // Trigger global auth event so the navbar instantly detects the logged-in user
        window.dispatchEvent(new Event('auth-change'));

        alert(`Welcome back, ${res.data.name}!`);
        navigate(res.data.role === 'organizer' ? '/dashboard' : '/');
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Authentication failed');
    }
  };

  return (
    <div className="row justify-content-center mt-5">
      <div className="col-md-5">
        <div className="card shadow-sm p-4 border-0 rounded-4">
          <h3 className="fw-bold mb-4 text-center">{isSignup ? 'Create Account' : 'Portal Login'}</h3>
          <form onSubmit={handleSubmit}>
            {isSignup && (
              <>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Full Name</label>
                  <input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Role</label>
                  <select className="form-select" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="student">Student</option>
                    <option value="organizer">Organizer</option>
                  </select>
                </div>
              </>
            )}
            <div className="mb-3">
              <label className="form-label fw-semibold">Email Address</label>
              <input type="email" className="form-control" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="mb-4">
              <label className="form-label fw-semibold">Password</label>
              <input type="password" className="form-control" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary w-100 py-2 fw-bold mb-3">{isSignup ? 'Sign Up' : 'Login'}</button>
            <p className="text-center text-muted small mb-0" role="button" onClick={() => setIsSignup(!isSignup)}>
              {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}