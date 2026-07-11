import { useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';

const navigationItems = [
  { path: '/', label: 'Home' },
  { path: '/teams', label: 'Teams' },
  { path: '/players', label: 'Players' },
  { path: '/rosters', label: 'Rosters' },
  { path: '/live-match', label: 'Live Match' },
  { path: '/rotations', label: 'Rotations' },
  { path: '/reports', label: 'Reports' },
  { path: '/settings', label: 'Settings' }
] as const;

type NavigationItem = (typeof navigationItems)[number];

type PlaceholderPageProps = {
  title: NavigationItem['label'];
};

function HomePage() {
  return (
    <div className="content-panel">
      <section className="welcome-card">
        <p className="eyebrow">Welcome to ScoreFlow Coach</p>
        <h2>Your team workspace starts here.</h2>
        <p>
          This React and TypeScript foundation keeps the coach experience separate from the existing
          scoreboard while giving future team, roster, match, rotation, and reporting tools a scalable home.
        </p>
        <NavLink className="primary-button" to="/teams">
          Set up a team
        </NavLink>
      </section>

      <div className="section-heading">
        <div>
          <p className="eyebrow">Workspace</p>
          <h2>Coach tools</h2>
        </div>
        <span className="status-pill">Foundation</span>
      </div>

      <div className="tool-grid">
        <article className="tool-card"><span>01</span><h3>Teams</h3><p>Create and manage clubs, teams, and seasons.</p></article>
        <article className="tool-card"><span>02</span><h3>Players</h3><p>Build player profiles and organize roster details.</p></article>
        <article className="tool-card"><span>03</span><h3>Live Match</h3><p>Launch the coach-side match workflow when it is ready.</p></article>
        <article className="tool-card"><span>04</span><h3>Reports</h3><p>Review match history, trends, and team performance.</p></article>
      </div>
    </div>
  );
}

function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="placeholder-view">
      <p className="eyebrow">ScoreFlow Coach</p>
      <h2>{title}</h2>
      <p>This route is part of the Coach app foundation. Its working features and data model will be added in a dedicated pull request.</p>
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
          <div className="brand-mark" aria-hidden="true">SF</div>
          <div><strong>ScoreFlow</strong><span>Coach</span></div>
        </div>

        <nav className="nav-list">
          {navigationItems.map((item) => (
            <NavLink
              className={({ isActive }) => `nav-item${isActive ? ' is-active' : ''}`}
              end={item.path === '/'}
              key={item.path}
              to={item.path}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer"><span>Coach workspace</span><small>React + TypeScript</small></div>
      </aside>

      {isMenuOpen && <button className="menu-backdrop" type="button" aria-label="Close navigation" onClick={() => setIsMenuOpen(false)} />}

      <main className="main-content">
        <header className="topbar">
          <button
            className="menu-button"
            type="button"
            aria-label="Open navigation"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            ☰
          </button>
          <div><p className="eyebrow">Coach Dashboard</p><h1>{currentItem.label}</h1></div>
          <button className="profile-button" type="button" aria-label="Coach profile">RG</button>
        </header>

        <Routes>
          <Route path="/" element={<HomePage />} />
          {navigationItems.slice(1).map((item) => (
            <Route key={item.path} path={item.path} element={<PlaceholderPage title={item.label} />} />
          ))}
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
