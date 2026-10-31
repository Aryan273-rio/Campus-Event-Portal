import { useState, useEffect } from 'react';
import axios from 'axios';

export default function OrganizerDashboard() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', date: '', venue: '', category: 'Technical', max_capacity: 50, price: 0 });
  const [editingId, setEditingId] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEventTitle, setSelectedEventTitle] = useState('');
  const [participants, setParticipants] = useState([]);
  const [rosterSearch, setRosterSearch] = useState('');

  const fetchEvents = async () => {
    try {
      const res = await axios.get('http://localhost:8000/events/');
      setEvents(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleAiGenerate = async () => {
    if (!form.title) { alert('Please enter a title first'); return; }
    try {
      const res = await axios.get('http://localhost:8000/generate-description/', { params: { title: form.title, category: form.category } });
      setForm(prev => ({ ...prev, description: res.data.description }));
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`http://localhost:8000/events/${editingId}`, form);
        alert('Event updated successfully!');
        setEditingId(null);
      } else {
        await axios.post('http://localhost:8000/events/', form);
        alert('Event published successfully!');
      }
      setForm({ title: '', description: '', date: '', venue: '', category: 'Technical', max_capacity: 50, price: 0 });
      fetchEvents();
    } catch (err) { alert('Operation failed'); }
  };

  const handleEdit = (event) => {
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description,
      date: event.date.slice(0, 16),
      venue: event.venue,
      category: event.category,
      max_capacity: event.max_capacity,
      price: event.price || 0
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this event?')) {
      await axios.delete(`http://localhost:8000/events/${id}`);
      fetchEvents();
    }
  };

  const openParticipantsModal = async (event) => {
    setSelectedEventId(event.id);
    setSelectedEventTitle(event.title);
    fetchParticipants(event.id, '');
  };

  const fetchParticipants = async (eventId, query = '') => {
    try {
      const res = await axios.get(`http://localhost:8000/events/${eventId}/participants`, { params: { search: query } });
      setParticipants(res.data);
    } catch (err) { console.error(err); }
  };

  const handleCheckIn = async (eventId, regId) => {
    await axios.put(`http://localhost:8000/events/${eventId}/checkin/${regId}`);
    fetchParticipants(selectedEventId, rosterSearch);
  };

  const exportToCSV = () => {
    if (participants.length === 0) {
      alert('No participants to export!');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Student Name,Email,USN,Payment Method,Status\n";
    participants.forEach(p => {
      const row = [
        `"${p.student_name || ''}"`,
        `"${p.student_email || ''}"`,
        `"${p.usn || 'N/A'}"`,
        `"${p.payment_method || 'Free'}"`,
        `"${p.status || 'registered'}"`
      ];
      csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedEventTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="py-2">
      <div className="dashboard-header shadow">
        <h1 className="fw-bold display-5">Organizer Control Center</h1>
        <p className="lead mb-0">Publish new events, manage registrations, and check in participants.</p>
      </div>

      {/* Create / Edit Form */}
      <div className="card shadow-sm border-0 p-4 mb-5 rounded-4 event-card">
        <h3 className="fw-bold mb-4">{editingId ? '✏️ Edit Event' : '➕ Create New Event'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-5 mb-3">
              <label className="form-label fw-semibold">Event Title</label>
              <input type="text" className="form-control" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label fw-semibold">Category</label>
              <select className="form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option value="Technical">Technical</option>
                <option value="Cultural">Cultural</option>
                <option value="Sports">Sports</option>
                <option value="Workshop">Workshop</option>
              </select>
            </div>
            <div className="col-md-2 mb-3">
              <label className="form-label fw-semibold">Max Capacity</label>
              <input type="number" className="form-control" required min="1" value={form.max_capacity} onChange={e => setForm({...form, max_capacity: parseInt(e.target.value)})} />
            </div>
            <div className="col-md-2 mb-3">
              <label className="form-label fw-semibold">Price (₹)</label>
              <input type="number" className="form-control" required min="0" step="0.5" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} />
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Date & Time</label>
              <input type="datetime-local" className="form-control" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Venue</label>
              <input type="text" className="form-control" required value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} />
            </div>
          </div>
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label fw-semibold mb-0">Description</label>
              <button type="button" className="btn btn-sm btn-outline-info fw-semibold" onClick={handleAiGenerate}>✨ AI Generate Description</button>
            </div>
            <textarea className="form-control" rows="3" required value={form.description} onChange={e => setForm({...form, description: e.target.value})}></textarea>
          </div>
          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-primary px-4 fw-bold">{editingId ? 'Update Event' : 'Publish Event'}</button>
            {editingId && <button type="button" className="btn btn-secondary px-4" onClick={() => { setEditingId(null); setForm({ title: '', description: '', date: '', venue: '', category: 'Technical', max_capacity: 50, price: 0 }); }}>Cancel</button>}
          </div>
        </form>
      </div>

      {/* Events Management List */}
      <h3 className="fw-bold mb-4">📋 Manage Published Events</h3>
      <div className="row g-4">
        {events.map(event => (
          <div key={event.id} className="col-md-6 col-lg-4">
            <div className="card shadow-sm border-0 h-100 p-4 rounded-4 d-flex flex-column event-card">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="badge bg-secondary px-3 py-2 rounded-pill">{event.category}</span>
                <span className="badge bg-success">₹ {event.price > 0 ? event.price : 'Free'}</span>
              </div>
              <h4 className="fw-bold">{event.title}</h4>
              <p className="text-muted small flex-grow-1">{event.description}</p>
              <div className="small text-secondary mb-3">
                <div>📅 {new Date(event.date).toLocaleString()}</div>
                <div>📍 {event.venue}</div>
                <div>👥 Capacity: {event.registered_count} / {event.max_capacity}</div>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-info flex-grow-1 fw-bold" onClick={() => openParticipantsModal(event)}>👥 Roster</button>
                <button className="btn btn-sm btn-outline-warning flex-grow-1 fw-bold" onClick={() => handleEdit(event)}>✏️ Edit</button>
                <button className="btn btn-sm btn-outline-danger flex-grow-1 fw-bold" onClick={() => handleDelete(event.id)}>🗑️ Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Participants Roster Modal */}
      {selectedEventId && (
        <div className="modal-overlay">
          <div className="modal-custom shadow-lg" style={{ maxWidth: '800px' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="fw-bold mb-0">Participant Roster: {selectedEventTitle}</h3>
              <button className="btn-close" onClick={() => { setSelectedEventId(null); setRosterSearch(''); }}></button>
            </div>

            <div className="d-flex gap-2 mb-3">
              <input 
                type="text" 
                className="form-control" 
                placeholder="🔍 Search by name, email, or USN..." 
                value={rosterSearch} 
                onChange={e => {
                  setRosterSearch(e.target.value);
                  fetchParticipants(selectedEventId, e.target.value);
                }} 
              />
              <button className="btn btn-success fw-bold text-nowrap" onClick={exportToCSV}>
                📊 Export Excel / CSV
              </button>
            </div>

            <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>USN</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.length > 0 ? (
                    participants.map(p => (
                      <tr key={p.id}>
                        <td className="fw-semibold">{p.student_name}</td>
                        <td className="text-muted small">{p.student_email}</td>
                        <td><span className="badge bg-secondary">{p.usn || 'N/A'}</span></td>
                        <td><span className="badge bg-info text-dark">{p.payment_method || 'Free'}</span></td>
                        <td>
                          <span className={`badge ${p.status === 'checked-in' ? 'bg-success' : 'bg-warning text-dark'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td>
                          {p.status !== 'checked-in' ? (
                            <button className="btn btn-sm btn-success fw-bold" onClick={() => handleCheckIn(selectedEventId, p.id)}>Check In</button>
                          ) : (
                            <span className="text-success small fw-bold">✓ Checked In</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="6" className="text-center text-muted py-4">No participants found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <button className="btn btn-secondary w-100 mt-3 fw-bold" onClick={() => { setSelectedEventId(null); setRosterSearch(''); }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}