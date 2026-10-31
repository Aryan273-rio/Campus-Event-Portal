import { useState, useEffect } from 'react';
import axios from 'axios';
import QRCode from 'react-qr-code';
import { Link } from 'react-router-dom';

function CountdownTimer({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) {
        setTimeLeft('🔴 Live / Happening Now');
        clearInterval(interval);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      setTimeLeft(`⏳ Starts in: ${days}d ${hours}h ${minutes}m`);
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return <div className="countdown-badge shadow-sm">{timeLeft}</div>;
}

export default function EventFeed() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  const [regData, setRegData] = useState({ 
    student_name: '', 
    student_email: '',
    usn: '',
    payment_method: 'Free'
  });
  const [ticket, setTicket] = useState(null);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:8000/events/', { params: { search, category } });
      setEvents(response.data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchEvents(); }, [search, category]);

  const handleBookClick = (event) => {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) {
      setShowLoginPrompt(true);
      return;
    }
    setRegData({
      student_name: currentUser.name || '',
      student_email: currentUser.email || '',
      usn: '',
      payment_method: event.price > 0 ? 'UPI / QR' : 'Free'
    });
    setSelectedEvent(event);
  };

  const handleProceedToRegistration = (e) => {
    e.preventDefault();
    setSelectedEvent(null);
    if (selectedEvent.price > 0) {
      setShowPaymentModal(true);
    } else {
      executeFinalRegistration('Free Event');
    }
  };

  const executeFinalRegistration = async (method) => {
    try {
      const payload = { ...regData, payment_method: method };
      const response = await axios.post(`http://localhost:8000/events/${selectedEvent.id}/register`, payload);
      setTicket({ eventName: selectedEvent.title, studentName: regData.student_name, qrValue: response.data.registration_id });
      setShowPaymentModal(false);
      setSelectedEvent(null);
      fetchEvents(); 
    } catch (error) {
      alert(error.response?.data?.detail || 'Registration failed');
    }
  };

  const getCategoryColor = (cat) => {
    switch(cat) {
      case 'Technical': return 'bg-primary text-white fw-bold';
      case 'Cultural': return 'bg-danger text-white fw-bold';
      case 'Sports': return 'bg-success text-white fw-bold';
      case 'Workshop': return 'bg-warning text-dark fw-bold';
      default: return 'bg-secondary text-white fw-bold';
    }
  };

  const now = new Date();
  const liveEvents = events.filter(e => new Date(e.date) <= now);
  const upcomingEvents = events.filter(e => new Date(e.date) > now);

  const renderEventCard = (event) => {
    const isFull = event.registered_count >= event.max_capacity;
    return (
      <div key={event.id} className="col-md-6 col-lg-4">
        <div className="card event-card h-100 shadow-sm p-4 d-flex flex-column border-top border-4 border-primary">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <span className={`badge ${getCategoryColor(event.category)} px-3 py-2 rounded-pill shadow-sm`}>{event.category}</span>
            <span className="badge bg-success px-3 py-1 fw-bold">₹ {event.price > 0 ? event.price : 'Free'}</span>
          </div>
          <h4 className="card-title fw-bold mt-2">{event.title}</h4>
          <p className="card-text text-muted flex-grow-1 small">{event.description}</p>
          
          <div className="bg-light p-3 rounded-3 mb-3 small text-secondary">
            <div>📅 <strong>Date:</strong> {new Date(event.date).toLocaleString()}</div>
            <div>📍 <strong>Venue:</strong> {event.venue}</div>
            <div className="mt-1">
              👥 <strong>Registered:</strong> <span className="fw-bold">{event.registered_count} / {event.max_capacity}</span>
            </div>
          </div>

          <button 
            className={`btn w-100 fw-bold py-2 ${isFull ? 'btn-secondary disabled' : 'btn-outline-primary'}`} 
            onClick={() => !isFull && handleBookClick(event)}
          >
            {isFull ? '🚫 Event Full' : (event.price > 0 ? `💳 Register & Pay ₹${event.price}` : '🎟️ Book Ticket')}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="py-2">
      <div className="dashboard-header text-center shadow">
        <h1 className="fw-bold display-5">Explore Campus Events</h1>
        <p className="lead mb-0">Discover exciting workshops, technical competitions, sports, and cultural fests.</p>
      </div>

      <div className="row mb-5 p-3 rounded-4 shadow-sm align-items-center" style={{ background: 'var(--card-bg)', border: '1px solid rgba(0,0,0,0.08)' }}>
        <div className="col-md-8 mb-3 mb-md-0">
          <div className="input-group input-group-lg">
            <span className="input-group-text bg-transparent border-end-0 text-muted ps-3">🔍</span>
            <input 
              type="text" 
              className="form-control border-start-0 ps-2 bg-transparent shadow-none" 
              placeholder="Search events by name..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
        </div>
        <div className="col-md-4">
          <div className="input-group input-group-lg">
            <span className="input-group-text bg-transparent border-end-0 ps-3">📂</span>
            <select 
              className="form-select border-start-0 ps-2 bg-transparent shadow-none" 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Technical">Technical</option>
              <option value="Cultural">Cultural</option>
              <option value="Sports">Sports</option>
              <option value="Workshop">Workshop</option>
            </select>
          </div>
        </div>
      </div>

      {liveEvents.length > 0 && (
        <div className="mb-5">
          <h3 className="fw-bold text-danger mb-4 d-flex align-items-center gap-2">
            <span className="spinner-grow spinner-grow-sm text-danger"></span> Live & Ongoing Events
          </h3>
          <div className="row g-4">
            {liveEvents.map(renderEventCard)}
          </div>
        </div>
      )}

      <div className="mb-5">
        <h3 className="fw-bold mb-4">🚀 Upcoming Events</h3>
        {upcomingEvents.length > 0 ? (
          <div className="row g-4">
            {upcomingEvents.map(renderEventCard)}
          </div>
        ) : (
          liveEvents.length === 0 && <div className="text-center text-muted py-5"><h5>No events found matching your search.</h5></div>
        )}
      </div>

      {showLoginPrompt && (
        <div className="modal-overlay">
          <div className="modal-custom shadow-lg text-center">
            <h3 className="fw-bold text-danger mb-2">🔒 Authentication Required</h3>
            <p className="text-muted mb-4">You need to be signed into your account to register and book tickets for college events.</p>
            <div className="d-flex flex-column gap-2">
              <Link to="/login" className="btn btn-primary fw-bold py-2">Go to Login / Sign Up</Link>
              <button className="btn btn-light py-2" onClick={() => setShowLoginPrompt(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Registration Details Modal */}
      {selectedEvent && !showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-custom shadow-lg">
            <h3 className="fw-bold mb-1 text-primary">Register for {selectedEvent.title}</h3>
            <p className="text-muted small mb-3">Fee: <strong className="text-success">₹ {selectedEvent.price > 0 ? selectedEvent.price : 'Free'}</strong></p>
            <form onSubmit={handleProceedToRegistration}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Full Name</label>
                <input type="text" className="form-control" required value={regData.student_name} onChange={e => setRegData({...regData, student_name: e.target.value})} />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">College Email</label>
                <input type="email" className="form-control" required value={regData.student_email} onChange={e => setRegData({...regData, student_email: e.target.value})} />
              </div>
              <div className="mb-4">
                <label className="form-label fw-semibold">USN (University Student Number)</label>
                <input type="text" className="form-control" placeholder="e.g. 1BM23CS001" value={regData.usn} onChange={e => setRegData({...regData, usn: e.target.value})} />
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-success w-50 fw-bold py-2">
                  {selectedEvent.price > 0 ? 'Proceed to Payment' : 'Confirm Registration'}
                </button>
                <button type="button" className="btn btn-light w-50 py-2" onClick={() => setSelectedEvent(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Step 2: Secure Payment Modal (For Paid Events) */}
      {showPaymentModal && selectedEvent && (
        <div className="modal-overlay">
          <div className="modal-custom shadow-lg text-center">
            <h3 className="fw-bold text-dark mb-1">Secure Payment</h3>
            <p className="text-muted small mb-3">Amount to Pay: <strong className="text-success fs-5">₹ {selectedEvent.price}</strong></p>
            
            <div className="bg-light p-3 rounded-3 border mb-4">
              <p className="small text-muted mb-2">Scan QR code using Google Pay / PhonePe / Paytm</p>
              {/* Mock QR code representing UPI gateway */}
              <div className="d-flex justify-content-center mb-2">
                <QRCode value={`upi://pay?pa=campuspulse@ybl&pn=CampusEventPortal&am=${selectedEvent.price}&cu=INR`} size={130} />
              </div>
              <span className="badge bg-secondary">UPI ID: campuspulse@ybl</span>
            </div>

            <div className="d-flex flex-column gap-2">
              <button className="btn btn-success fw-bold py-2" onClick={() => executeFinalRegistration('UPI / QR')}>
                ✅ Simulate Successful Payment
              </button>
              <button className="btn btn-outline-danger btn-sm" onClick={() => setShowPaymentModal(false)}>Cancel Payment</button>
            </div>
          </div>
        </div>
      )}

      {ticket && (
        <div className="modal-overlay">
          <div className="modal-custom shadow-lg text-center">
            <h2 className="text-success fw-bold mb-2">🎉 Registered Successfully!</h2>
            <h5 className="text-muted mb-4">{ticket.eventName}</h5>
            <div className="bg-light p-4 d-inline-block rounded-4 border mb-3 shadow-sm">
              <QRCode value={ticket.qrValue} size={160} />
            </div>
            <p className="text-secondary small">Pass issued to: <strong>{ticket.studentName}</strong></p>
            <p className="text-danger small fw-semibold">Take a screenshot of this QR code for gate check-in.</p>
            <button className="btn btn-primary w-100 py-2 fw-bold mt-2" onClick={() => setTicket(null)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}