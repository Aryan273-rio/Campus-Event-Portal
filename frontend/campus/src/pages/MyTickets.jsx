import { useState, useEffect } from 'react';
import axios from 'axios';
import QRCode from 'react-qr-code';

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [profile, setProfile] = useState({ points: 0, category_points: {}, redemption_history: [] });
  const [activeTab, setActiveTab] = useState('tickets');
  const [redeemedRewards, setRedeemedRewards] = useState([]);
  
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (user?.email) {
      fetchTickets();
      fetchProfile();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/tickets/${user.email}`);
      setTickets(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/users/${user.email}/profile`);
      setProfile(res.data);
    } catch (err) { console.error(err); }
  };

  const handleRedeem = async (rewardName, cost, multipleUse) => {
    try {
      const res = await axios.post('http://localhost:8000/rewards/redeem', {
        email: user.email,
        reward_cost: cost,
        reward_name: rewardName,
        multiple_use: multipleUse
      });
      alert(res.data.message);
      
      // If it's single-use, track it in local state so it hides immediately
      if (!multipleUse) {
        setRedeemedRewards(prev => [...prev, rewardName]);
      }

      fetchProfile();
    } catch (err) {
      alert(err.response?.data?.detail || 'Redemption failed');
    }
  };

  if (!user) {
    return <div className="text-center py-5"><h4>Please login to view your tickets and rewards.</h4></div>;
  }

  return (
    <div className="py-2">
      <div className="dashboard-header shadow text-center">
        <h1 className="fw-bold display-5">Student Portal & Rewards</h1>
        <p className="lead mb-0">Track your event tickets, attendance status, and claim exclusive perks!</p>
      </div>

      {/* Points Summary Banner with Colored Categories */}
      <div className="card shadow-sm border-0 p-4 mb-4 rounded-4 bg-primary text-white">
        <div className="row align-items-center">
          <div className="col-md-5">
            <h4 className="fw-bold mb-1">⭐ Total Reward Points: {profile.points || 0} pts</h4>
            <p className="mb-0 small text-white-50">Attend technical, cultural, workshop, and sports events to earn points!</p>
          </div>
          <div className="col-md-7 text-md-end mt-3 mt-md-0">
            <div className="d-flex justify-content-md-end gap-2 flex-wrap">
              <span className="badge bg-primary text-white border border-light p-2">💻 Tech: {profile.category_points?.Technical || 0} pts</span>
              <span className="badge bg-danger text-white border border-light p-2">🎭 Cultural: {profile.category_points?.Cultural || 0} pts</span>
              <span className="badge bg-warning text-dark border border-light p-2">🛠️ Workshop: {profile.category_points?.Workshop || 0} pts</span>
              <span className="badge bg-success text-white border border-light p-2">⚽ Sports: {profile.category_points?.Sports || 0} pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-pills mb-4 gap-2">
        <li className="nav-item">
          <button className={`nav-link fw-bold px-4 ${activeTab === 'tickets' ? 'active' : ''}`} onClick={() => setActiveTab('tickets')}>
            🎟️ My Event Passes
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link fw-bold px-4 ${activeTab === 'rewards' ? 'active' : ''}`} onClick={() => setActiveTab('rewards')}>
            🎁 Rewards & Coupons Hub
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link fw-bold px-4 ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            📜 Redemption History
          </button>
        </li>
      </ul>

      {activeTab === 'tickets' ? (
        <div className="row g-4">
          {tickets.length > 0 ? (
            tickets.map(t => (
              <div key={t.registration_id} className="col-md-6 col-lg-4">
                <div className="card shadow-sm border-0 p-4 rounded-4 event-card text-center">
                  <h5 className="fw-bold">{t.event_name}</h5>
                  <p className="text-muted small mb-2">📍 {t.venue} | 📅 {new Date(t.date).toLocaleDateString()}</p>
                  <div className="bg-light p-3 d-inline-block rounded-3 border my-2">
                    <QRCode value={t.registration_id} size={130} />
                  </div>
                  <div className="mt-2">
                    <span className={`badge px-3 py-2 ${t.status === 'checked-in' ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {t.status === 'checked-in' ? '✓ Attended & Points Claimed' : 'Registered (Pending Check-in)'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted py-5"><h5>You haven't registered for any events yet.</h5></div>
          )}
        </div>
      ) : activeTab === 'rewards' ? (
        <div>
          <h3 className="fw-bold mb-4">Available Rewards & Offers</h3>
          <div className="row g-4">
            {/* Reward 1: Single Use */}
            {!redeemedRewards.includes('Free Paid Event Ticket') && (
              <div className="col-md-4">
                <div className="card shadow-sm border-0 p-4 rounded-4 h-100 event-card">
                  <span className="badge bg-success mb-2 w-50">Free Pass (Single Use)</span>
                  <h5 className="fw-bold">Free Paid Event Ticket</h5>
                  <p className="text-muted small flex-grow-1">Redeem this coupon to register for any paid campus event completely free of charge.</p>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <span className="fw-bold text-primary">150 Points</span>
                    <button className="btn btn-outline-success btn-sm fw-bold" onClick={() => handleRedeem('Free Paid Event Ticket', 150, false)}>Redeem</button>
                  </div>
                </div>
              </div>
            )}

            {/* Reward 2: Multiple Use */}
            <div className="col-md-4">
              <div className="card shadow-sm border-0 p-4 rounded-4 h-100 event-card">
                <span className="badge bg-warning text-dark mb-2 w-50">Canteen Perk (Multi-Use)</span>
                <h5 className="fw-bold">₹50 Canteen Voucher</h5>
                <p className="text-muted small flex-grow-1">Enjoy a snack or beverage at the campus cafeteria on us! Can be claimed multiple times.</p>
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <span className="fw-bold text-primary">100 Points</span>
                  <button className="btn btn-outline-warning btn-sm fw-bold text-dark" onClick={() => handleRedeem('₹50 Canteen Voucher', 100, true)}>Redeem</button>
                </div>
              </div>
            </div>

            {/* Reward 3: Single Use */}
            {!redeemedRewards.includes('Campus Hackathon T-Shirt') && (
              <div className="col-md-4">
                <div className="card shadow-sm border-0 p-4 rounded-4 h-100 event-card">
                  <span className="badge bg-info text-dark mb-2 w-50">Merchandise (Single Use)</span>
                  <h5 className="fw-bold">Campus Hackathon T-Shirt</h5>
                  <p className="text-muted small flex-grow-1">Exclusive limited edition event merchandise delivered to your department.</p>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <span className="fw-bold text-primary">300 Points</span>
                    <button className="btn btn-outline-info btn-sm fw-bold" onClick={() => handleRedeem('Campus Hackathon T-Shirt', 300, false)}>Redeem</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <h3 className="fw-bold mb-4">📜 Redemption History</h3>
          <div className="card shadow-sm border-0 p-4 rounded-4 event-card">
            {profile.redemption_history && profile.redemption_history.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Reward Name</th>
                      <th>Points Spent</th>
                      <th>Date & Time</th>
                      <th>Usage Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.redemption_history.map((item, index) => (
                      <tr key={index}>
                        <td className="fw-semibold">🎁 {item.reward_name}</td>
                        <td className="text-danger fw-bold">-{item.cost} pts</td>
                        <td className="text-muted small">{item.redeemed_at}</td>
                        <td>
                          <span className={`badge ${item.multiple_use ? 'bg-info text-dark' : 'bg-secondary'}`}>
                            {item.multiple_use ? 'Multiple Use' : 'Single Use'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-muted py-4"><h5>No redemption history found yet.</h5></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}