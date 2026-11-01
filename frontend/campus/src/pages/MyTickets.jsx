import { useState, useEffect } from 'react';
import axios from 'axios';
import QRCode from 'react-qr-code';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import { toast } from '../components/Toast';

const REWARDS = [
  { name: 'Free Paid Event Ticket', cost: 150, multi: false, tag: 'Free pass', desc: 'Redeem this coupon to register for any paid campus event completely free of charge.', icon: 'ticket', tone: 'success' },
  { name: '₹50 Canteen Voucher', cost: 100, multi: true, tag: 'Canteen perk', desc: 'Enjoy a snack or beverage at the campus cafeteria on us. Can be claimed multiple times.', icon: 'gift', tone: 'warning' },
  { name: 'Campus Hackathon T-Shirt', cost: 300, multi: false, tag: 'Merchandise', desc: 'Exclusive limited edition event merchandise delivered to your department.', icon: 'star', tone: 'info' },
];

const CAT_TILES = [
  { key: 'Technical', label: 'Technical', icon: 'code' },
  { key: 'Cultural', label: 'Cultural', icon: 'music' },
  { key: 'Workshop', label: 'Workshop', icon: 'wrench' },
  { key: 'Sports', label: 'Sports', icon: 'trophy' },
];

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [profile, setProfile] = useState({ points: 0, category_points: {}, redemption_history: [] });
  const [activeTab, setActiveTab] = useState('tickets');
  const [redeemedRewards, setRedeemedRewards] = useState([]);

  const user = JSON.parse(localStorage.getItem('user'));
  const email = user?.email;

  useEffect(() => {
    if (email) {
      fetchTickets();
      fetchProfile();
    }
  }, [email]);

  const fetchTickets = async () => {
    try {
      const res = await axios.get(`https://campus-event-portal-seven.vercel.app/tickets/${email}`);
      setTickets(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`https://campus-event-portal-seven.vercel.app/users/${email}/profile`);
      setProfile(res.data);
    } catch (err) { console.error(err); }
  };

  const handleRedeem = async (rewardName, cost, multipleUse) => {
    try {
      const res = await axios.post('https://campus-event-portal-seven.vercel.app/rewards/redeem', {
        email,
        reward_cost: cost,
        reward_name: rewardName,
        multiple_use: multipleUse,
      });
      toast.success(res.data.message);
      // Single-use rewards are hidden immediately
      if (!multipleUse) setRedeemedRewards((prev) => [...prev, rewardName]);
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Redemption failed');
    }
  };

  if (!user) {
    return (
      <div className="empty-state surface mt-4">
        <div className="empty-state__icon"><Icon name="lock" size={24} /></div>
        <h5>Please sign in</h5>
        <p className="mb-3">Sign in to view your tickets and rewards.</p>
        <Link to="/login" className="btn btn-primary">Go to sign in</Link>
      </div>
    );
  }

  const points = profile.points || 0;
  const history = profile.redemption_history || [];

  return (
    <div>
      <PageHeader
        eyebrow="Student Portal"
        title="My tickets & rewards"
        subtitle="Track your event passes, attendance status and claim exclusive perks."
      />

      <section className="points-card">
        <div>
          <div className="points-card__label">Total reward points</div>
          <div className="points-card__value">{points}<small>pts</small></div>
          <p className="points-card__hint">Attend events across all categories to earn more.</p>
        </div>
        <div className="cat-tiles">
          {CAT_TILES.map((c) => (
            <div key={c.key} className="cat-tile">
              <div className="cat-tile__label"><Icon name={c.icon} size={13} /> {c.label}</div>
              <div className="cat-tile__value">{profile.category_points?.[c.key] || 0}<small style={{ fontSize: '0.7rem', opacity: 0.7 }}> pts</small></div>
            </div>
          ))}
        </div>
      </section>

      <div className="tabs" role="tablist">
        <button className={`tab ${activeTab === 'tickets' ? 'active' : ''}`} onClick={() => setActiveTab('tickets')}><Icon name="ticket" /> My passes</button>
        <button className={`tab ${activeTab === 'rewards' ? 'active' : ''}`} onClick={() => setActiveTab('rewards')}><Icon name="gift" /> Rewards</button>
        <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}><Icon name="history" /> History</button>
      </div>

      {activeTab === 'tickets' && (
        <div className="row g-4">
          {tickets.length > 0 ? (
            tickets.map((t) => {
              const attended = t.status === 'checked-in';
              return (
                <div key={t.registration_id} className="col-md-6 col-lg-4">
                  <article className="ticket">
                    <div className="ticket__head">
                      <h5>{t.event_name}</h5>
                      <div className="meta-row"><Icon name="pin" size={13} /> {t.venue}</div>
                      <div className="meta-row mt-1"><Icon name="calendar" size={13} /> {new Date(t.date).toLocaleDateString([], { dateStyle: 'medium' })}</div>
                    </div>
                    <div className="ticket__tear" />
                    <div className="ticket__body">
                      <div className="qr-frame"><QRCode value={t.registration_id} size={130} /></div>
                      <span className={`pill ${attended ? 'pill-success' : 'pill-warning'}`}>
                        <Icon name={attended ? 'checkCircle' : 'clock'} size={12} />
                        {attended ? 'Attended · points claimed' : 'Registered · pending check-in'}
                      </span>
                    </div>
                  </article>
                </div>
              );
            })
          ) : (
            <div className="col-12">
              <div className="empty-state surface">
                <div className="empty-state__icon"><Icon name="ticket" size={24} /></div>
                <h5>No passes yet</h5>
                <p className="mb-3">You haven't registered for any events.</p>
                <Link to="/" className="btn btn-primary btn-sm">Browse events</Link>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'rewards' && (
        <div className="row g-4">
          {REWARDS.filter((r) => r.multi || !redeemedRewards.includes(r.name)).map((r) => {
            const canAfford = points >= r.cost;
            return (
              <div className="col-md-4" key={r.name}>
                <div className="reward-card">
                  <div className="reward-card__icon" style={{ background: `var(--${r.tone}-bg)`, color: `var(--${r.tone})` }}>
                    <Icon name={r.icon} size={22} />
                  </div>
                  <div className="mb-2"><span className={`pill pill-${r.tone}`}>{r.tag} · {r.multi ? 'multi-use' : 'single use'}</span></div>
                  <h5 className="mb-2">{r.name}</h5>
                  <p className="text-muted small flex-grow-1 mb-0">{r.desc}</p>
                  <div className="reward-card__foot">
                    <span className="reward-cost"><Icon name="star" size={15} /> {r.cost} pts</span>
                    <button className="btn btn-primary btn-sm" disabled={!canAfford} title={canAfford ? '' : `You need ${r.cost - points} more points`} onClick={() => handleRedeem(r.name, r.cost, r.multi)}>
                      {canAfford ? 'Redeem' : `${r.cost - points} pts to go`}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="surface surface-pad">
          {history.length > 0 ? (
            <div className="table-wrap flat">
              <table className="data-table">
                <thead>
                  <tr><th>Reward</th><th>Points spent</th><th>Date &amp; time</th><th>Usage</th></tr>
                </thead>
                <tbody>
                  {history.map((item, index) => (
                    <tr key={index}>
                      <td className="fw-semibold"><Icon name="gift" className="me-2 text-muted" />{item.reward_name}</td>
                      <td className="fw-bold" style={{ color: 'var(--danger)' }}>−{item.cost} pts</td>
                      <td className="text-muted">{item.redeemed_at}</td>
                      <td><span className={`pill ${item.multiple_use ? 'pill-info' : 'pill-default'}`}>{item.multiple_use ? 'Multi-use' : 'Single use'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state__icon"><Icon name="history" size={24} /></div>
              <h5>No redemptions yet</h5>
              <p>Rewards you redeem will show up here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}