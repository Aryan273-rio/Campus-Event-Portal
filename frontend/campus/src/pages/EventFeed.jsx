import { useState, useEffect } from 'react';
import axios from 'axios';
import QRCode from 'react-qr-code';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import PageHeader, { Stat } from '../components/PageHeader';
import { toast } from '../components/Toast';

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Workshop'];
const CAT_META = {
  Technical: { pill: 'pill-tech', card: 'cat-tech', icon: 'code' },
  Cultural: { pill: 'pill-cultural', card: 'cat-cultural', icon: 'music' },
  Sports: { pill: 'pill-sports', card: 'cat-sports', icon: 'trophy' },
  Workshop: { pill: 'pill-workshop', card: 'cat-workshop', icon: 'wrench' },
};

const fmtDate = (d) => new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

function CountdownTimer({ targetDate }) {
  const compute = () => {
    const diff = new Date(targetDate) - new Date();
    if (diff <= 0) return { live: true, text: 'Happening now' };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    return { live: false, text: `Starts in ${days}d ${hours}h ${minutes}m` };
  };
  const [state, setState] = useState(compute);

  useEffect(() => {
    const interval = setInterval(() => setState(compute()), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className={`countdown ${state.live ? 'live' : ''}`}>
      <Icon name="clock" size={13} /> {state.text}
    </div>
  );
}

export default function EventFeed() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [regData, setRegData] = useState({ student_name: '', student_email: '', usn: '', payment_method: 'Free' });
  const [ticket, setTicket] = useState(null);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('https://campus-event-portal-seven.vercel.app/events', { params: { search, category } });
      setEvents(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
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
      payment_method: event.price > 0 ? 'UPI / QR' : 'Free',
    });
    setSelectedEvent(event);
  };

  const handleProceedToRegistration = (e) => {
    e.preventDefault();
    if (selectedEvent.price > 0) setShowPaymentModal(true);
    else executeFinalRegistration('Free Event');
  };

  const executeFinalRegistration = async (method) => {
    setSubmitting(true);
    try {
      const payload = { ...regData, payment_method: method };
      const response = await axios.post(`https://campus-event-portal-seven.vercel.app/events/${selectedEvent.id}/register`, payload);
      setTicket({ eventName: selectedEvent.title, studentName: regData.student_name, qrValue: response.data.registration_id });
      setShowPaymentModal(false);
      setSelectedEvent(null);
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const closeRegistration = () => { setSelectedEvent(null); setShowPaymentModal(false); };

  const now = new Date();
  const liveEvents = events.filter((e) => new Date(e.date) <= now);
  const upcomingEvents = events.filter((e) => new Date(e.date) > now);
  const seatsLeft = events.reduce((sum, e) => sum + Math.max(0, e.max_capacity - e.registered_count), 0);

  const renderEventCard = (event) => {
    const isFull = event.registered_count >= event.max_capacity;
    const pct = Math.min(100, Math.round((event.registered_count / event.max_capacity) * 100)) || 0;
    const meta = CAT_META[event.category] || { pill: 'pill-default', card: '', icon: 'star' };
    const left = Math.max(0, event.max_capacity - event.registered_count);

    return (
      <div key={event.id} className="col-md-6 col-lg-4">
        <article className={`event-card ${meta.card}`}>
          <div className="event-card__top">
            <span className={`pill ${meta.pill}`}><Icon name={meta.icon} size={12} /> {event.category}</span>
            <span className={`price-tag ${event.price > 0 ? '' : 'free'}`}>{event.price > 0 ? `₹${event.price}` : 'Free'}</span>
          </div>

          {new Date(event.date) > now && <CountdownTimer targetDate={event.date} />}
          {new Date(event.date) <= now && <div className="countdown live"><span className="live-dot" style={{ width: 7, height: 7 }} /> Happening now</div>}

          <h4 className="event-card__title">{event.title}</h4>
          <p className="event-card__desc">{event.description}</p>

          <div className="meta-list">
            <div className="meta-row"><Icon name="calendar" /> <span>{fmtDate(event.date)}</span></div>
            <div className="meta-row"><Icon name="pin" /> <span>{event.venue}</span></div>
          </div>

          <div className="capacity">
            <div className="capacity__bar">
              <div className={`capacity__fill ${isFull ? 'full' : pct >= 80 ? 'warn' : ''}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="capacity__text">
              <span><Icon name="users" size={12} /> {event.registered_count} / {event.max_capacity} registered</span>
              <span>{isFull ? 'Sold out' : `${left} left`}</span>
            </div>
          </div>

          <button
            className={`btn w-100 ${isFull ? 'btn-soft' : 'btn-primary'}`}
            disabled={isFull}
            onClick={() => !isFull && handleBookClick(event)}
          >
            {isFull ? 'Event full' : event.price > 0 ? <><Icon name="card" /> Register · ₹{event.price}</> : <><Icon name="ticket" /> Get free ticket</>}
          </button>
        </article>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        eyebrow="Campus Events"
        title="Discover what's happening on campus"
        subtitle="Workshops, technical competitions, sports and cultural fests, all in one place."
      >
        <Stat value={events.length} label="Events" />
        <Stat value={liveEvents.length} label="Live now" />
        <Stat value={seatsLeft} label="Seats open" />
      </PageHeader>

      <div className="surface toolbar">
        <div className="search-box">
          <Icon name="search" size={17} />
          <input type="text" className="form-control" placeholder="Search events by name…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search events" />
        </div>
        <div className="chips" role="group" aria-label="Filter by category">
          <button className={`chip ${category === '' ? 'active' : ''}`} onClick={() => setCategory('')}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c} className={`chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
              <Icon name={CAT_META[c].icon} size={13} /> {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><div className="spinner-border text-primary" role="status" /><p className="mt-3">Loading events…</p></div>
      ) : (
        <>
          {liveEvents.length > 0 && (
            <>
              <div className="section-head">
                <h3 className="section-title"><span className="live-dot" /> Live &amp; ongoing <span className="section-count">{liveEvents.length}</span></h3>
              </div>
              <div className="row g-4">{liveEvents.map(renderEventCard)}</div>
            </>
          )}

          <div className="section-head">
            <h3 className="section-title"><Icon name="calendar" size={18} /> Upcoming events <span className="section-count">{upcomingEvents.length}</span></h3>
          </div>
          {upcomingEvents.length > 0 ? (
            <div className="row g-4">{upcomingEvents.map(renderEventCard)}</div>
          ) : (
            liveEvents.length === 0 && (
              <div className="empty-state surface">
                <div className="empty-state__icon"><Icon name="search" size={24} /></div>
                <h5>No events found</h5>
                <p>Try a different search term or category.</p>
              </div>
            )
          )}
        </>
      )}

      {/* Login required */}
      {showLoginPrompt && (
        <Modal size="sm" center onClose={() => setShowLoginPrompt(false)}>
          <div className="modal-icon danger"><Icon name="lock" size={24} /></div>
          <h4 className="mb-2">Sign in required</h4>
          <p className="text-muted mb-4">You need to be signed in to register for campus events.</p>
          <div className="d-grid gap-2">
            <Link to="/login" className="btn btn-primary">Go to sign in</Link>
            <button className="btn btn-soft" onClick={() => setShowLoginPrompt(false)}>Maybe later</button>
          </div>
        </Modal>
      )}

      {/* Step 1: registration details */}
      {selectedEvent && !showPaymentModal && (
        <Modal
          title={`Register for ${selectedEvent.title}`}
          subtitle={selectedEvent.price > 0 ? `Entry fee ₹${selectedEvent.price}` : 'This event is free to attend'}
          onClose={closeRegistration}
        >
          <form onSubmit={handleProceedToRegistration}>
            <div className="mb-3">
              <label className="form-label">Full name</label>
              <input type="text" className="form-control" required value={regData.student_name} onChange={(e) => setRegData({ ...regData, student_name: e.target.value })} />
            </div>
            <div className="mb-3">
              <label className="form-label">College email</label>
              <input type="email" className="form-control" required value={regData.student_email} onChange={(e) => setRegData({ ...regData, student_email: e.target.value })} />
            </div>
            <div className="mb-4">
              <label className="form-label">USN (University Student Number)</label>
              <input type="text" className="form-control" placeholder="e.g. 1BM23CS001" value={regData.usn} onChange={(e) => setRegData({ ...regData, usn: e.target.value })} />
            </div>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-soft flex-fill" onClick={closeRegistration}>Cancel</button>
              <button type="submit" className="btn btn-primary flex-fill" disabled={submitting}>
                {submitting && <span className="spinner-border spinner-border-sm" />}
                {selectedEvent.price > 0 ? 'Continue to payment' : 'Confirm registration'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Step 2: payment (paid events) */}
      {showPaymentModal && selectedEvent && (
        <Modal
          center
          size="sm"
          title="Complete payment"
          subtitle={`Amount due: ₹${selectedEvent.price}`}
          onClose={() => setShowPaymentModal(false)}
        >
          <p className="text-muted small mb-3">Scan with Google Pay, PhonePe or Paytm</p>
          <div className="qr-frame mb-3">
            <QRCode value={`upi://pay?pa=campuspulse@ybl&pn=CampusEventPortal&am=${selectedEvent.price}&cu=INR`} size={150} />
          </div>
          <div className="mb-4"><span className="pill pill-default">UPI ID · campuspulse@ybl</span></div>
          <div className="d-grid gap-2">
            <button className="btn btn-success" disabled={submitting} onClick={() => executeFinalRegistration('UPI / QR')}>
              {submitting ? <span className="spinner-border spinner-border-sm" /> : <Icon name="checkCircle" />} I've paid · Confirm
            </button>
            <button className="btn btn-ghost-danger btn-sm" onClick={() => setShowPaymentModal(false)}>Cancel payment</button>
          </div>
        </Modal>
      )}

      {/* Success ticket */}
      {ticket && (
        <Modal size="sm" center onClose={() => setTicket(null)}>
          <div className="modal-icon success"><Icon name="check" size={26} /></div>
          <h4 className="mb-1">You're registered!</h4>
          <p className="text-muted mb-3">{ticket.eventName}</p>
          <div className="qr-frame mb-3"><QRCode value={ticket.qrValue} size={160} /></div>
          <p className="small mb-1">Pass issued to <strong>{ticket.studentName}</strong></p>
          <p className="small text-muted mb-4">Screenshot this QR code for gate check-in. You can also find it under My Tickets.</p>
          <button className="btn btn-primary w-100" onClick={() => setTicket(null)}>Done</button>
        </Modal>
      )}
    </div>
  );
}