import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import ContextBar from '../components/ContextBar';
import SlideOver from '../components/SlideOver';
import { useWorkspace } from '../context/WorkspaceContext';
import type { Player, PlayerStatus, RosterMembership, RosterMembershipInput } from '../types/workspace';

type RosterView = 'players' | 'lineup' | 'stats';
type RosterRow = { player: Player; membership: RosterMembership };
type DropZone = 'starters' | 'bench';

type Performance = {
  kills: number;
  aces: number;
  digs: number;
  blocks: number;
  assists: number;
  hitting: string;
};

const seededPerformance: Record<string, Performance> = {
  'player-ava': { kills: 128, aces: 31, digs: 94, blocks: 18, assists: 7, hitting: '.284' },
  'player-mia': { kills: 22, aces: 26, digs: 61, blocks: 8, assists: 286, hitting: '.211' },
  'player-zoe': { kills: 4, aces: 18, digs: 203, blocks: 1, assists: 21, hitting: '.118' }
};

export default function RosterPage() {
  const workspace = useWorkspace();
  const [view, setView] = useState<RosterView>('players');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [mobileFocusOpen, setMobileFocusOpen] = useState(false);
  const [isPhonePortrait, setIsPhonePortrait] = useState(false);

  const rows = useMemo<RosterRow[]>(() => workspace.rosterMemberships
    .filter((membership) => membership.teamId === workspace.activeTeamId && membership.seasonId === workspace.activeSeasonId)
    .map((membership) => ({ membership, player: workspace.players.find((player) => player.id === membership.playerId) }))
    .filter((row): row is RosterRow => Boolean(row.player && !row.player.archived))
    .sort((a, b) => Number(a.membership.jerseyNumber || 999) - Number(b.membership.jerseyNumber || 999)),
  [workspace.rosterMemberships, workspace.players, workspace.activeTeamId, workspace.activeSeasonId]);

  useEffect(() => {
    if (!rows.some((row) => row.player.id === selectedPlayerId)) setSelectedPlayerId(rows[0]?.player.id ?? null);
  }, [rows, selectedPlayerId]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 700px) and (orientation: portrait)');
    const sync = () => setIsPhonePortrait(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const selected = rows.find((row) => row.player.id === selectedPlayerId) ?? rows[0];
  const starters = rows.filter((row) => row.membership.starter && !row.membership.libero);
  const libero = rows.find((row) => row.membership.libero);
  const available = rows.filter((row) => row.membership.status === 'active').length;
  const nextMatch = workspace.scheduleEvents
    .filter((event) => event.teamId === workspace.activeTeamId && event.seasonId === workspace.activeSeasonId && event.type === 'match' && event.date >= todayValue())
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))[0];
  const teamStyle = {
    '--team-primary': workspace.activeTeam?.primaryColor ?? '#ef3340',
    '--team-secondary': workspace.activeTeam?.secondaryColor ?? '#5d9df5'
  } as CSSProperties;

  function updateMembership(membership: RosterMembership, patch: Partial<RosterMembershipInput>) {
    workspace.updateRosterMembership(membership.id, {
      playerId: membership.playerId,
      teamId: membership.teamId,
      seasonId: membership.seasonId,
      jerseyNumber: membership.jerseyNumber,
      position: membership.position,
      status: membership.status,
      captain: membership.captain,
      libero: membership.libero,
      starter: membership.starter,
      notes: membership.notes,
      ...patch
    });
  }

  function selectPlayer(id: string) {
    setSelectedPlayerId(id);
    if (isPhonePortrait) setMobileFocusOpen(true);
  }

  return <div className="team-hq" style={teamStyle}>
    <ContextBar label="Roster context" />
    <section className="team-hq-header panel">
      <div><p className="eyebrow">Team HQ</p><h2>{workspace.activeTeam?.name ?? 'Select a team'}</h2><p>{workspace.activeSeason?.name ?? 'Select a season'} · {rows.length} players · {available} available</p></div>
      <div className="next-match-summary"><span>Next match</span><strong>{nextMatch?.title ?? 'No match scheduled'}</strong><small>{nextMatch ? `${formatDate(nextMatch.date)} · ${formatTime(nextMatch.startTime)}` : 'Add one from Schedule'}</small></div>
      <div className="roster-view-tabs" aria-label="Roster view">{(['players', 'lineup', 'stats'] as const).map((item) => <button className={view === item ? 'is-active' : ''} key={item} onClick={() => setView(item)} type="button">{item}</button>)}</div>
    </section>

    <section className="team-hq-body">
      <div className="team-hq-main panel">
        {view === 'players' && <PlayerGrid rows={rows} selectedId={selected?.player.id} onSelect={selectPlayer} />}
        {view === 'lineup' && <LineupView rows={rows} starters={starters} libero={libero} onSelect={selectPlayer} onUpdate={updateMembership} />}
        {view === 'stats' && <StatsView rows={rows} onSelect={selectPlayer} />}
      </div>
      <aside className="player-focus panel">{selected ? <PlayerFocus row={selected} performance={performanceFor(selected.player.id)} onUpdate={(patch) => updateMembership(selected.membership, patch)} /> : <div className="team-hq-empty"><span>◇</span><p>Add players from the Players page to build this roster.</p></div>}</aside>
    </section>

    <SlideOver open={mobileFocusOpen && Boolean(selected)} title="Player details" onClose={() => setMobileFocusOpen(false)}>
      {selected && <PlayerFocus row={selected} performance={performanceFor(selected.player.id)} onUpdate={(patch) => updateMembership(selected.membership, patch)} />}
    </SlideOver>
  </div>;
}

function PlayerGrid({ rows, selectedId, onSelect }: { rows: RosterRow[]; selectedId?: string; onSelect: (id: string) => void }) {
  return <div className="hq-player-grid">
    {rows.map((row) => { const stats = performanceFor(row.player.id); return <button className={`hq-player-card${selectedId === row.player.id ? ' is-selected' : ''}`} key={row.membership.id} onClick={() => onSelect(row.player.id)} type="button">
      <span className="hq-player-number">#{row.membership.jerseyNumber || '—'}</span>
      <span className="hq-player-card-copy"><strong>{row.player.preferredName || row.player.firstName} {row.player.lastName}</strong><small>{row.membership.position || row.player.primaryPosition || 'Position not set'}</small></span>
      <span className="hq-card-stats"><em><b>{stats.kills || '—'}</b>Kills</em><em><b>{stats.digs || '—'}</b>Digs</em><em><b>{stats.aces || '—'}</b>Aces</em></span>
      <span className="hq-card-footer"><span className={`availability-dot status-${row.membership.status}`} />{statusLabel(row.membership.status)}{row.membership.captain && <b>Captain</b>}{row.membership.libero && <b className="is-libero">Libero</b>}</span>
    </button>; })}
    {rows.length === 0 && <div className="team-hq-empty"><span>◇</span><p>No players are assigned to this team and season.</p></div>}
  </div>;
}

function LineupView({ rows, starters, libero, onSelect, onUpdate }: { rows: RosterRow[]; starters: RosterRow[]; libero?: RosterRow; onSelect: (id: string) => void; onUpdate: (membership: RosterMembership, patch: Partial<RosterMembershipInput>) => void }) {
  const slots = Array.from({ length: 6 }, (_, index) => starters[index]);
  const reserves = rows.filter((row) => !row.membership.starter && !row.membership.libero);
  const [activeZone, setActiveZone] = useState<DropZone | null>(null);

  function movePlayer(row: RosterRow, zone: DropZone) {
    if (zone === 'bench') { onUpdate(row.membership, { starter: false }); return; }
    if (row.membership.starter || starters.length >= 6) return;
    onUpdate(row.membership, { starter: true, libero: false });
  }

  return <div className="lineup-workspace">
    <div className="lineup-heading"><div><p className="eyebrow">Starting lineup</p><h3>Match-ready six</h3></div><span>{starters.length}/6 assigned</span></div>
    <div className={`lineup-court drop-zone${activeZone === 'starters' ? ' is-drop-active' : ''}`} data-drop-zone="starters">
      {slots.map((row, index) => row ? <TouchDragPlayer key={row.membership.id} row={row} onSelect={onSelect} onDrop={movePlayer} onZoneChange={setActiveZone} className="lineup-slot is-filled"><span>{index + 1}</span><strong>#{row.membership.jerseyNumber} {row.player.preferredName || row.player.firstName}</strong><small>{row.membership.position || row.player.primaryPosition}</small></TouchDragPlayer> : <div className="lineup-slot" key={`open-${index}`}><span>{index + 1}</span><strong>Open position</strong><small>Drag a bench player here</small></div>)}
    </div>
    <div className="lineup-lower">
      <section><p className="eyebrow">Libero</p>{libero ? <button className="lineup-person" onClick={() => onSelect(libero.player.id)} type="button"><b>#{libero.membership.jerseyNumber}</b><span><strong>{libero.player.preferredName || libero.player.firstName} {libero.player.lastName}</strong><small>{libero.membership.position || 'L'}</small></span></button> : <div className="lineup-placeholder">No libero assigned</div>}</section>
      <section className={`drop-zone${activeZone === 'bench' ? ' is-drop-active' : ''}`} data-drop-zone="bench"><p className="eyebrow">Bench</p><div className="bench-list">{reserves.map((row) => <TouchDragPlayer key={row.membership.id} row={row} onSelect={onSelect} onDrop={movePlayer} onZoneChange={setActiveZone} className="bench-player"><b>#{row.membership.jerseyNumber}</b><span>{row.player.preferredName || row.player.firstName} {row.player.lastName}</span><small>{row.membership.position}</small></TouchDragPlayer>)}</div></section>
    </div>
    <p className="lineup-drag-help">Drag players between Match-Ready Six and Bench. Touch and move on iPad.</p>
  </div>;
}

function TouchDragPlayer({ row, onSelect, onDrop, onZoneChange, className, children }: { row: RosterRow; onSelect: (id: string) => void; onDrop: (row: RosterRow, zone: DropZone) => void; onZoneChange: (zone: DropZone | null) => void; className: string; children: ReactNode }) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  function zoneAt(x: number, y: number): DropZone | null { const value = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-drop-zone]')?.dataset.dropZone; return value === 'starters' || value === 'bench' ? value : null; }
  function pointerDown(event: ReactPointerEvent<HTMLButtonElement>) { start.current = { x: event.clientX, y: event.clientY }; dragging.current = false; event.currentTarget.setPointerCapture(event.pointerId); }
  function pointerMove(event: ReactPointerEvent<HTMLButtonElement>) { if (!start.current) return; if (Math.hypot(event.clientX - start.current.x, event.clientY - start.current.y) > 7) dragging.current = true; if (!dragging.current) return; event.preventDefault(); onZoneChange(zoneAt(event.clientX, event.clientY)); event.currentTarget.classList.add('is-dragging'); }
  function pointerUp(event: ReactPointerEvent<HTMLButtonElement>) { const wasDragging = dragging.current; const zone = wasDragging ? zoneAt(event.clientX, event.clientY) : null; event.currentTarget.classList.remove('is-dragging'); onZoneChange(null); start.current = null; dragging.current = false; if (wasDragging && zone) onDrop(row, zone); else if (!wasDragging) onSelect(row.player.id); }
  function pointerCancel(event: ReactPointerEvent<HTMLButtonElement>) { event.currentTarget.classList.remove('is-dragging'); onZoneChange(null); start.current = null; dragging.current = false; }
  return <button className={`${className} touch-drag-player`} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerCancel} type="button">{children}</button>;
}

function StatsView({ rows, onSelect }: { rows: RosterRow[]; onSelect: (id: string) => void }) {
  const categories: { key: keyof Performance; label: string }[] = [{ key: 'kills', label: 'Kills' }, { key: 'aces', label: 'Aces' }, { key: 'digs', label: 'Digs' }, { key: 'blocks', label: 'Blocks' }, { key: 'assists', label: 'Assists' }];
  return <div className="leaderboard-grid">{categories.map(({ key, label }) => { const ranked = [...rows].sort((a, b) => Number(performanceFor(b.player.id)[key]) - Number(performanceFor(a.player.id)[key])).slice(0, 5); return <section className="leaderboard-card" key={key}><div><p className="eyebrow">Season leaders</p><h3>{label}</h3></div>{ranked.map((row, index) => <button key={row.membership.id} onClick={() => onSelect(row.player.id)} type="button"><span>{index + 1}</span><strong>{row.player.preferredName || row.player.firstName} {row.player.lastName}</strong><b>{performanceFor(row.player.id)[key] || '—'}</b></button>)}</section>; })}</div>;
}

function PlayerFocus({ row, performance, onUpdate }: { row: RosterRow; performance: Performance; onUpdate: (patch: Partial<RosterMembershipInput>) => void }) {
  const { player, membership } = row;
  return <div className="player-focus-inner">
    <div className="player-focus-hero"><span>#{membership.jerseyNumber || '—'}</span><div><p className="eyebrow">Player focus</p><h3>{player.preferredName || player.firstName} {player.lastName}</h3><small>{membership.position || player.primaryPosition || 'Position not set'} · Class of {player.graduationYear || '—'}</small></div></div>
    <div className="focus-badges">{membership.captain && <span className="role-captain">Captain</span>}{membership.libero && <span className="role-libero">Libero</span>}{membership.starter && <span className="role-starter">Starter</span>}<span className={`focus-status status-${membership.status}`}>{statusLabel(membership.status)}</span></div>
    <div className="focus-stat-grid"><div><span>Kills</span><strong>{performance.kills || '—'}</strong></div><div><span>Aces</span><strong>{performance.aces || '—'}</strong></div><div><span>Digs</span><strong>{performance.digs || '—'}</strong></div><div><span>Blocks</span><strong>{performance.blocks || '—'}</strong></div><div><span>Assists</span><strong>{performance.assists || '—'}</strong></div><div><span>Hitting</span><strong>{performance.hitting}</strong></div></div>
    <section className="focus-actions"><p className="eyebrow">Lineup controls</p><div><button className={membership.starter ? 'is-active' : ''} onClick={() => onUpdate({ starter: !membership.starter })} type="button">{membership.starter ? 'Move to bench' : 'Move to six'}</button><button className={membership.libero ? 'is-active' : ''} onClick={() => onUpdate({ libero: !membership.libero })} type="button">{membership.libero ? 'Remove libero' : 'Set libero'}</button><button className={membership.captain ? 'is-active' : ''} onClick={() => onUpdate({ captain: !membership.captain })} type="button">{membership.captain ? 'Remove captain' : 'Set captain'}</button></div></section>
    <section className="focus-availability"><p className="eyebrow">Availability</p><div>{(['active', 'limited', 'injured', 'away', 'inactive'] as PlayerStatus[]).map((status) => <button className={membership.status === status ? 'is-active' : ''} key={status} onClick={() => onUpdate({ status })} type="button">{statusLabel(status)}</button>)}</div></section>
    <section className="focus-note"><p className="eyebrow">Coach note</p><p>{membership.notes || player.notes || 'No notes added for this player.'}</p></section>
  </div>;
}

function performanceFor(playerId: string): Performance { return seededPerformance[playerId] ?? { kills: 0, aces: 0, digs: 0, blocks: 0, assists: 0, hitting: '—' }; }
function statusLabel(status: PlayerStatus) { return status === 'active' ? 'Available' : status[0].toUpperCase() + status.slice(1); }
function todayValue() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; }
function formatDate(value: string) { return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`)); }
function formatTime(value: string) { if (!value) return 'TBD'; const [hours, minutes] = value.split(':').map(Number); return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, hours, minutes)); }