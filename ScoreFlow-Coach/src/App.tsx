import { useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useWorkspace } from './context/WorkspaceContext';
import SchedulePage from './pages/SchedulePage';
import PracticePage from './pages/PracticePage';
import TeamsPage from './pages/TeamsPage';
import PlayersPage from './pages/PlayersPage';
import RosterPage from './pages/RosterPage';
import LiveMatchPage from './pages/LiveMatchPage';
import RotationPage from './pages/RotationPage';

const navigationItems = [
  { path: '/', label: 'Hub', icon: '⌂' },
  { path: '/schedule', label: 'Schedule', icon: '▦' },
  { path: '/practice', label: 'Practice', icon: '◇' },
  { path: '/rosters', label: 'Roster', icon: '≡' },
  { path: '/live-match', label: 'Live', icon: '▶' },
  { path: '/rotations', label: 'Rotation Studio', icon: '↻' },
  { path: '/reports', label: 'Reports', icon: '▥' },
  { path: '/teams', label: 'Teams', icon: '◆' },
  { path: '/players', label: 'Players', icon: '●' },
  { path: '/settings', label: 'Settings', icon: '⚙' }
] as const;

type NavigationItem = (typeof navigationItems)[number];
type PlaceholderPageProps = { item: NavigationItem };

const quickActions = [
  { label: 'Schedule', detail: 'Plan team events', path: '/schedule', tone: 'blue' },
  { label: 'Practice', detail: 'Build today’s plan', path: '/practice', tone: 'green' },
  { label: 'Team HQ', detail: 'Lineup and performance', path: '/rosters', tone: 'gold' },
  { label: 'Start Match', detail: 'Fullscreen score + stats', path: '/live-match', tone: 'red' }
] as const;

function HomePage() {
  const { activeOrganization, activeTeam, activeSeason, rosterMemberships, scheduleEvents } = useWorkspace();
  const teamLabel = activeTeam ? `${activeTeam.name} · ${activeTeam.level}` : 'No active team selected';
  const initials = activeTeam?.abbreviation || 'SF';
  const roster = rosterMemberships.filter((item) => item.teamId === activeTeam?.id && item.seasonId === activeSeason?.id);
  const available = roster.filter((item) => item.status === 'active').length;
  const starters = roster.filter((item) => item.starter).length;
  const upcomingEvents = scheduleEvents.filter((item) => item.teamId === activeTeam?.id && item.seasonId === activeSeason?.id && item.date >= todayValue()).sort((a, b) => a.date.localeCompare(b.date));
  const nextEvent = upcomingEvents[0];
  return <div className="dashboard-grid">
    <section className="hero-card panel"><div className="hero-copy"><div className="status-line"><span className="live-dot" /><span>Coach workspace · {activeSeason?.name ?? 'Season not selected'}</span></div><p className="eyebrow">{teamLabel}</p><h2>{nextEvent ? nextEvent.title : activeTeam ? 'Ready for the next point.' : 'Build your volleyball program.'}</h2><p className="hero-summary">{nextEvent ? `${formatDate(nextEvent.date)}${nextEvent.startTime ? ` at ${formatTime(nextEvent.startTime)}` : ''} · ${nextEvent.venue || 'Location not set'}` : activeTeam ? `Working inside ${activeOrganization?.name ?? 'your program'}. Schedules, practices, rosters, matches, and reports use this active team and season.` : 'Create an organization, team, and season to establish the shared context for every Coach tool.'}</p><div className="hero-actions"><NavLink className="button button-primary" to={nextEvent?.type === 'match' ? '/live-match' : nextEvent?.type === 'practice' ? '/practice' : '/schedule'}>{nextEvent?.type === 'match' ? 'Enter Match Mode' : nextEvent?.type === 'practice' ? 'Open practice plan' : nextEvent ? 'View schedule' : 'Add schedule event'}</NavLink><NavLink className="button button-quiet" to="/rosters">Open Team HQ</NavLink></div></div><div className="match-preview" aria-label="Active team preview"><span className="card-kicker">Active context</span><div className="match-teams"><div><span className="team-badge" style={{ background: activeTeam ? `linear-gradient(145deg, ${activeTeam.primaryColor}, #6f101c)` : undefined }}>{initials}</span><strong>{activeTeam?.name ?? 'Your team'}</strong></div><span className="versus">›</span><div><span className="team-badge opponent">{available || '—'}</span><strong>{available ? `${available} available` : 'Build roster'}</strong></div></div><div className="match-meta"><span>{activeOrganization?.type ?? 'Program'}</span><strong>{activeTeam?.level ?? 'Team'}</strong><span>{roster.length} players</span></div></div></section>
    <section className="quick-panel panel"><div className="panel-heading"><div><p className="eyebrow">Quick access</p><h3>Coach tools</h3></div><span className="sync-pill"><span /> Saved on device</span></div><div className="quick-grid">{quickActions.map((action) => <NavLink className={`quick-card tone-${action.tone}`} key={action.path} to={action.path}><span className="quick-icon" aria-hidden="true">{navigationItems.find((item) => item.path === action.path)?.icon}</span><span><strong>{action.label}</strong><small>{action.detail}</small></span><span className="arrow" aria-hidden="true">›</span></NavLink>)}</div></section>
    <section className="today-panel panel"><div className="panel-heading compact"><div><p className="eyebrow">Upcoming</p><h3>Team schedule</h3></div><NavLink className="text-link" to="/schedule">View all</NavLink></div><div className="practice-list">{upcomingEvents.slice(0, 4).map((event, index) => <div className={`practice-row${index === 0 ? ' is-active' : ''}`} key={event.id}><span>{index + 1}</span><div><strong>{event.title}</strong><small>{formatDate(event.date)} · {formatTime(event.startTime)}</small></div>{index === 0 && <em>Next</em>}</div>)}{upcomingEvents.length === 0 && <div className="practice-row is-active"><span>＋</span><div><strong>No events scheduled</strong><small>Add your first match or practice</small></div><em>Next</em></div>}</div></section>
    <section className="insight-panel panel"><div className="panel-heading compact"><div><p className="eyebrow">Live Match</p><h3>Score while tracking</h3></div><NavLink className="text-link" to="/live-match">Enter</NavLink></div><div className="metric-grid"><div><span>Players</span><strong>{roster.length}</strong></div><div><span>Available</span><strong className="success-text">{available}</strong></div><div><span>Starters</span><strong>{starters}</strong></div><div><span>Out</span><strong>{roster.filter((item) => ['injured', 'away', 'inactive'].includes(item.status)).length}</strong></div></div><div className="insight-note"><span>▶</span><p><strong>The court is the interface.</strong> Score controls stay separate while two-touch stats record what happened.</p></div></section>
  </div>;
}

function PlaceholderPage({ item }: PlaceholderPageProps) { return <section className="placeholder-view panel"><span className="placeholder-icon" aria-hidden="true">{item.icon}</span><p className="eyebrow">ScoreFlow Coach</p><h2>{item.label}</h2><p>This workspace is reserved for the focused {item.label.toLowerCase()} milestone.</p><NavLink className="button button-primary" to="/">Back to Coach Hub</NavLink></section>; }

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const currentItem = navigationItems.find((item) => item.path === location.pathname) ?? navigationItems[0];
  const isLiveMatch = location.pathname === '/live-match';
  useEffect(() => setIsMenuOpen(false), [location.pathname]);
  return <div className={`app-shell${isLiveMatch ? ' is-live-match' : ''}`}>
    <aside className={`sidebar${isMenuOpen ? ' is-open' : ''}`} aria-label="Primary navigation"><div className="brand"><div className="brand-mark" aria-hidden="true"><span>S</span></div><div className="brand-copy"><strong>ScoreFlow</strong><span>Coach</span></div></div><nav className="nav-list">{navigationItems.map((item) => <NavLink className={({ isActive }) => `nav-item${isActive ? ' is-active' : ''}`} end={item.path === '/'} key={item.path} to={item.path} title={item.label}><span className="nav-icon" aria-hidden="true">{item.icon}</span><span className="nav-label">{item.label}</span></NavLink>)}</nav><div className="sidebar-footer"><span className="avatar">RG</span><div><strong>Richie</strong><small>Head Coach</small></div></div></aside>
    {isMenuOpen && <button className="menu-backdrop" type="button" aria-label="Close navigation" onClick={() => setIsMenuOpen(false)} />}
    <main className="main-content"><header className="topbar"><button className="menu-button" type="button" aria-label="Open navigation" aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen((open) => !open)}>☰</button><div className="page-title"><p className="eyebrow">ScoreFlow Coach</p><h1>{currentItem.label}</h1></div><div className="topbar-actions"><button className="icon-button" type="button" aria-label="Search">⌕</button><button className="icon-button notification-button" type="button" aria-label="Notifications">●</button><button className="profile-button" type="button" aria-label="Coach profile">RG</button></div></header><div className="route-viewport"><Routes><Route path="/" element={<HomePage />} /><Route path="/schedule" element={<SchedulePage />} /><Route path="/practice" element={<PracticePage />} /><Route path="/rosters" element={<RosterPage />} /><Route path="/players" element={<PlayersPage />} /><Route path="/teams" element={<TeamsPage />} /><Route path="/live-match" element={<LiveMatchPage />} /><Route path="/rotations" element={<RotationPage />} />{navigationItems.filter((item) => !['/', '/schedule', '/practice', '/rosters', '/players', '/teams', '/live-match', '/rotations'].includes(item.path)).map((item) => <Route key={item.path} path={item.path} element={<PlaceholderPage item={item} />} />)}<Route path="*" element={<Navigate replace to="/" />} /></Routes></div></main>
    <nav className="mobile-nav" aria-label="Mobile navigation">{navigationItems.slice(0, 5).map((item) => <NavLink className={({ isActive }) => `mobile-nav-item${isActive ? ' is-active' : ''}`} end={item.path === '/'} key={item.path} to={item.path}><span aria-hidden="true">{item.icon}</span><small>{item.label}</small></NavLink>)}<button className="mobile-nav-item" type="button" onClick={() => setIsMenuOpen(true)}><span aria-hidden="true">•••</span><small>More</small></button></nav>
  </div>;
}

function todayValue() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; }
function formatDate(value: string) { return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`)); }
function formatTime(value: string) { if (!value) return 'TBD'; const [hours, minutes] = value.split(':').map(Number); return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, hours, minutes)); }

export default App;
