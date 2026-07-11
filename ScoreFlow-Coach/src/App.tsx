import { useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useWorkspace } from './context/WorkspaceContext';
import TeamsPage from './pages/TeamsPage';

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
  { label: 'Team Roster', detail: 'Build active roster', path: '/rosters', tone: 'gold' },
  { label: 'Rotations', detail: 'Review serve receive', path: '/rotations', tone: 'green' },
  { label: 'Reports', detail: 'Last match analysis', path: '/reports', tone: 'blue' }
] as const;

function HomePage() {
  const { activeOrganization, activeTeam, activeSeason } = useWorkspace();
  const teamLabel = activeTeam ? `${activeTeam.name} · ${activeTeam.level}` : 'No active team selected';
  const initials = activeTeam?.abbreviation || 'SF';

  return (
    <div className="dashboard-grid">
      <section className="hero-card panel">
        <div className="hero-copy">
          <div className="status-line">
            <span className="live-dot" />
            <span>Coach workspace · {activeSeason?.name ?? 'Season not selected'}</span>
          </div>
          <p className="eyebrow">{teamLabel}</p>
          <h2>{activeTeam ? 'Ready for the next point.' : 'Build your volleyball program.'}</h2>
          <p className="hero-summary">
            {activeTeam
              ? `Working inside ${activeOrganization?.name ?? 'your program'}. Future schedules, rosters, matches, and reports will use this active team and season.`
              : 'Create an organization, team, and season to establish the shared context for every Coach tool.'}
          </p>
          <div className="hero-actions">
            {activeTeam ? <NavLink className="button button-primary" to="/live-match">Start live match</NavLink> : null}
            <NavLink className={`button ${activeTeam ? 'button-quiet' : 'button-primary'}`} to="/teams">
              {activeTeam ? 'Manage program' : 'Set up program'}
            </NavLink>
          </div>
        </div>

        <div className="match-preview" aria-label="Active team preview">
          <span className="card-kicker">Active context</span>
          <div className="match-teams">
            <div><span className="team-badge" style={{ background: activeTeam ? `linear-gradient(145deg, ${activeTeam.primaryColor}, #6f101c)` : undefined }}>{initials}</span><strong>{activeTeam?.name ?? 'Your team'}</strong></div>
            <span className="versus">›</span>
            <div><span className="team-badge opponent">{activeSeason ? '26' : '—'}</span><strong>{activeSeason?.name ?? 'Add season'}</strong></div>
          </div>
          <div className="match-meta"><span>{activeOrganization?.type ?? 'Program'}</span><strong>{activeTeam?.level ?? 'Team'}</strong><span>{activeOrganization?.state ?? 'Local'}</span></div>
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
          <span className="time-chip">Future schedule</span>
        </div>
        <div className="practice-list">
          <div className="practice-row is-complete"><span>✓</span><div><strong>Program selected</strong><small>{activeOrganization?.name ?? 'Create an organization'}</small></div></div>
          <div className={`practice-row${activeTeam ? ' is-complete' : ' is-active'}`}><span>{activeTeam ? '✓' : '2'}</span><div><strong>Team selected</strong><small>{activeTeam?.name ?? 'Add your first team'}</small></div>{!activeTeam && <em>Next</em>}</div>
          <div className={`practice-row${activeSeason ? ' is-complete' : activeTeam ? ' is-active' : ''}`}><span>{activeSeason ? '✓' : '3'}</span><div><strong>Season selected</strong><small>{activeSeason?.name ?? 'Create the current season'}</small></div>{activeTeam && !activeSeason && <em>Next</em>}</div>
          <div className="practice-row"><span>4</span><div><strong>Build roster</strong><small>Planned for the next foundation milestone</small></div></div>
        </div>
      </section>

      <section className="insight-panel panel">
        <div className="panel-heading compact">
          <div><p className="eyebrow">Program</p><h3>Current structure</h3></div>
          <NavLink className="text-link" to="/teams">Manage</NavLink>
        </div>
        <div className="metric-grid">
          <div><span>Program</span><strong>{activeOrganization ? '1' : '0'}</strong></div>
          <div><span>Team</span><strong>{activeTeam ? '1' : '0'}</strong></div>
          <div><span>Season</span><strong>{activeSeason ? '1' : '0'}</strong></div>
          <div><span>Storage</span><strong className="success-text">Local</strong></div>
        </div>
        <div className="insight-note"><span>↗</span><p><strong>One shared context.</strong> Future schedules, matches, rosters, and reports will reference the selected team and season.</p></div>
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
      <p>This workspace is reserved for the focused {item.label.toLowerCase()} milestone. The design system and active organization, team, and season context are ready for its working features.</p>
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
            <Route path="/teams" element={<TeamsPage />} />
            {navigationItems.slice(2).map((item) => (
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
