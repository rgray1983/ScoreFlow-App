import { useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';

const navigationItems = [
  { path: '/', label: 'Hub', icon: '⌂' },
  { path: '/teams', label: 'Teams', icon: '◆' },
  { path: '/players', label: 'Players', icon: '●' },
  { path: '/rosters', label: 'Roster', icon: '≡' },
  { path: '/live-match', label: 'Live', icon: '▶' },
  { path: '/rotations', label: 'Rotate', icon: '↻' },
  { path: '/reports', label: 'Reports', icon: '▥' },
  { path: '/settings', label: 'Settings', icon: '⚙' }
] as const;

type NavigationItem = (typeof navigationItems)[number];

type PlaceholderPageProps = {
  item: NavigationItem;
};

const quickActions = [
  { label: 'Start Match', detail: 'Open live controls', path: '/live-match', tone: 'red' },
  { label: 'Team Roster', detail: '14 active players', path: '/rosters', tone: 'gold' },
  { label: 'Rotations', detail: 'Review serve receive', path: '/rotations', tone: 'green' },
  { label: 'Reports', detail: 'Last match analysis', path: '/reports', tone: 'blue' }
] as const;

function HomePage() {
  return (
    <div className="dashboard-grid">
      <section className="hero-card panel">
        <div className="hero-copy">
          <div className="status-line">
            <span className="live-dot" />
            <span>Coach workspace</span>
          </div>
          <p className="eyebrow">Hartsville Varsity Volleyball</p>
          <h2>Ready for the next point.</h2>
          <p className="hero-summary">
            Everything needed for today’s team, match, and practice work—without slowing the coach down.
          </p>
          <div className="hero-actions">
            <NavLink className="button button-primary" to="/live-match">Start live match</NavLink>
            <NavLink className="button button-quiet" to="/teams">Open team</NavLink>
          </div>
        </div>

        <div className="match-preview" aria-label="Next match preview">
          <span className="card-kicker">Next match</span>
          <div className="match-teams">
            <div><span className="team-badge">HF</span><strong>Hartsville</strong></div>
            <span className="versus">VS</span>
            <div><span className="team-badge opponent">WF</span><strong>West Florence</strong></div>
          </div>
          <div className="match-meta"><span>Thursday</span><strong>6:00 PM</strong><span>Home</span></div>
        </div>
      </section>

      <section className="quick-panel panel">
        <div className="panel-heading">
          <div><p className="eyebrow">Quick access</p><h3>Coach tools</h3></div>
          <span className="sync-pill"><span /> Saved on device</span>
        </div>
        <div className="quick-grid">
          {quickActions.map((action) => (
            <NavLink className={`quick-card tone-${action.tone}`} key={action.path} to={action.path}>
              <span className="quick-icon" aria-hidden="true">{navigationItems.find((item) => item.path === action.path)?.icon}</span>
              <span><strong>{action.label}</strong><small>{action.detail}</small></span>
              <span className="arrow" aria-hidden="true">›</span>
            </NavLink>
          ))}
        </div>
      </section>

      <section className="today-panel panel">
        <div className="panel-heading compact">
          <div><p className="eyebrow">Today</p><h3>Practice plan</h3></div>
          <span className="time-chip">4:00–5:45</span>
        </div>
        <div className="practice-list">
          <div className="practice-row is-complete"><span>✓</span><div><strong>Dynamic warmup</strong><small>10 minutes</small></div></div>
          <div className="practice-row is-active"><span>2</span><div><strong>Serve receive</strong><small>Three-player lanes</small></div><em>Now</em></div>
          <div className="practice-row"><span>3</span><div><strong>Rotation five</strong><small>Base defense</small></div></div>
          <div className="practice-row"><span>4</span><div><strong>Six-on-six</strong><small>Game-speed finish</small></div></div>
        </div>
      </section>

      <section className="insight-panel panel">
        <div className="panel-heading compact">
          <div><p className="eyebrow">Last match</p><h3>Performance</h3></div>
          <NavLink className="text-link" to="/reports">View report</NavLink>
        </div>
        <div className="metric-grid">
          <div><span>Result</span><strong className="success-text">W 3–1</strong></div>
          <div><span>Side-out</span><strong>58%</strong></div>
          <div><span>Aces</span><strong>11</strong></div>
          <div><span>Best run</span><strong>6 pts</strong></div>
        </div>
        <div className="insight-note"><span>↗</span><p><strong>Rotation 2 improved.</strong> Side-out rose 12% from the previous match.</p></div>
      </section>
    </div>
  );
}

function PlaceholderPage({ item }: PlaceholderPageProps) {
  return (
    <section className="placeholder-view panel">
      <span className="placeholder-icon" aria-hidden="true">{item.icon}</span>
      <p className="eyebrow">ScoreFlow Coach</p>
      <h2>{item.label}</h2>
      <p>This workspace is reserved for the focused {item.label.toLowerCase()} milestone. The design system and viewport-safe shell are ready for its working features.</p>
      <NavLink className="button button-primary" to="/">Back to Coach Hub</NavLink>
    </section>
  );
}

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const currentItem = navigationItems.find((item) => item.path === location.pathname) ?? navigationItems[0];

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <aside className={`sidebar${isMenuOpen ? ' is-open' : ''}`} aria-label="Primary navigation">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true"><span>S</span></div>
          <div className="brand-copy"><strong>ScoreFlow</strong><span>Coach</span></div>
        </div>

        <nav className="nav-list">
          {navigationItems.map((item) => (
            <NavLink
              className={({ isActive }) => `nav-item${isActive ? ' is-active' : ''}`}
              end={item.path === '/'}
              key={item.path}
              to={item.path}
              title={item.label}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer"><span className="avatar">RG</span><div><strong>Richie</strong><small>Head Coach</small></div></div>
      </aside>

      {isMenuOpen && <button className="menu-backdrop" type="button" aria-label="Close navigation" onClick={() => setIsMenuOpen(false)} />}

      <main className="main-content">
        <header className="topbar">
          <button className="menu-button" type="button" aria-label="Open navigation" aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen((open) => !open)}>☰</button>
          <div className="page-title"><p className="eyebrow">ScoreFlow Coach</p><h1>{currentItem.label}</h1></div>
          <div className="topbar-actions">
            <button className="icon-button" type="button" aria-label="Search">⌕</button>
            <button className="icon-button notification-button" type="button" aria-label="Notifications">●</button>
            <button className="profile-button" type="button" aria-label="Coach profile">RG</button>
          </div>
        </header>

        <div className="route-viewport">
          <Routes>
            <Route path="/" element={<HomePage />} />
            {navigationItems.slice(1).map((item) => (
              <Route key={item.path} path={item.path} element={<PlaceholderPage item={item} />} />
            ))}
            <Route path="*" element={<Navigate replace to="/" />} />
          </Routes>
        </div>
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigationItems.slice(0, 5).map((item) => (
          <NavLink className={({ isActive }) => `mobile-nav-item${isActive ? ' is-active' : ''}`} end={item.path === '/'} key={item.path} to={item.path}>
            <span aria-hidden="true">{item.icon}</span><small>{item.label}</small>
          </NavLink>
        ))}
        <button className="mobile-nav-item" type="button" onClick={() => setIsMenuOpen(true)}><span aria-hidden="true">•••</span><small>More</small></button>
      </nav>
    </div>
  );
}

export default App;
