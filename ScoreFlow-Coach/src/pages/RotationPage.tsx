import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import type { Player, RosterMembership } from '../types/workspace';

type RotationPlayer = {
  id: string;
  name: string;
  number: string;
  position: string;
  captain: boolean;
  libero: boolean;
  photoUrl?: string;
};

type Point = { x: number; y: number };

const rotationPoints: Point[] = [
  { x: 18, y: 24 },
  { x: 36, y: 24 },
  { x: 36, y: 72 },
  { x: 18, y: 72 },
  { x: 8, y: 72 },
  { x: 8, y: 24 }
];

export default function RotationPage() {
  const workspace = useWorkspace();
  const roster = useMemo(() => workspace.rosterMemberships
    .filter((membership) => membership.teamId === workspace.activeTeamId && membership.seasonId === workspace.activeSeasonId)
    .map((membership) => ({ membership, player: workspace.players.find((player) => player.id === membership.playerId) }))
    .filter((row): row is { membership: RosterMembership; player: Player } => row.player !== undefined)
    .filter((row) => !row.player.archived && row.membership.status === 'active'),
  [workspace.activeSeasonId, workspace.activeTeamId, workspace.players, workspace.rosterMemberships]);

  const players = useMemo<RotationPlayer[]>(() => roster
    .filter(({ membership }) => membership.starter && !membership.libero)
    .slice(0, 6)
    .map(({ membership, player }) => ({
      id: player.id,
      name: player.preferredName || player.firstName,
      number: membership.jerseyNumber || '—',
      position: membership.position || player.primaryPosition || '—',
      captain: membership.captain,
      libero: membership.libero,
      photoUrl: player.photoUrl || undefined
    })), [roster]);

  const fallbackPlayers = useMemo<RotationPlayer[]>(() => roster
    .filter(({ membership }) => !membership.libero)
    .slice(0, 6)
    .map(({ membership, player }) => ({
      id: player.id,
      name: player.preferredName || player.firstName,
      number: membership.jerseyNumber || '—',
      position: membership.position || player.primaryPosition || '—',
      captain: membership.captain,
      libero: membership.libero,
      photoUrl: player.photoUrl || undefined
    })), [roster]);

  const lineup = players.length === 6 ? players : fallbackPlayers;
  const [rotation, setRotation] = useState(1);
  const [showArrows, setShowArrows] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [note, setNote] = useState('Base serve-receive alignment.');
  const [flash, setFlash] = useState('');
  const style = {
    '--rotation-primary': workspace.activeTeam?.primaryColor ?? '#ef3340',
    '--rotation-secondary': workspace.activeTeam?.secondaryColor ?? '#f4c95d'
  } as CSSProperties;

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => setRotation((current) => current === 6 ? 1 : current + 1), 1200);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const arranged = lineup.map((player, index) => {
    const pointIndex = (index + rotation - 1) % 6;
    return { player, point: rotationPoints[pointIndex], pointIndex };
  });

  function changeRotation(next: number) {
    setRotation(next < 1 ? 6 : next > 6 ? 1 : next);
  }

  function exportRotation() {
    window.print();
  }

  async function shareRotation() {
    const text = `${workspace.activeTeam?.name ?? 'Team'} · Rotation ${rotation}\n${arranged.map(({ player, pointIndex }) => `P${pointIndex + 1}: #${player.number} ${player.name} (${player.position})`).join('\n')}\n\n${note}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${workspace.activeTeam?.name ?? 'Team'} Rotation ${rotation}`, text });
        setFlash('Rotation shared');
      } else {
        await navigator.clipboard.writeText(text);
        setFlash('Rotation copied to clipboard');
      }
    } catch {
      return;
    }
    window.setTimeout(() => setFlash(''), 1200);
  }

  return <div className="rotation-studio" style={style}>
    <section className="rotation-toolbar panel">
      <div>
        <p className="eyebrow">Rotation studio</p>
        <h2>{workspace.activeTeam?.name ?? 'Active team'}</h2>
        <span>{workspace.activeSeason?.name ?? 'Season not selected'}</span>
      </div>
      <div className="rotation-toolbar-actions">
        <button className="button button-quiet" type="button" onClick={exportRotation}>Export</button>
        <button className="button button-primary" type="button" onClick={shareRotation}>Send to team</button>
      </div>
    </section>

    <div className="rotation-workspace">
      <section className="rotation-court-card panel">
        <div className="rotation-court-heading">
          <div><p className="eyebrow">Court view</p><h3>Rotation {rotation}</h3></div>
          <span className="rotation-status"><i /> Animated preview</span>
        </div>
        <div className={`rotation-court${showArrows ? ' show-arrows' : ''}`}>
          <div className="rotation-home-label">{workspace.activeTeam?.name ?? 'Home team'}</div>
          <div className="rotation-opponent-label">Opponent</div>
          <div className="rotation-net"><span>NET</span></div>
          <div className="rotation-attack-line" />
          {showArrows && arranged.map(({ player, point, pointIndex }) => {
            const nextPoint = rotationPoints[(pointIndex + 1) % 6];
            const dx = nextPoint.x - point.x;
            const dy = nextPoint.y - point.y;
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            const length = Math.hypot(dx, dy);
            return <span className="rotation-arrow" key={`arrow-${player.id}`} style={{ left: `${point.x}%`, top: `${point.y}%`, width: `${length}%`, transform: `rotate(${angle}deg)` }}><i /></span>;
          })}
          {arranged.map(({ player, point, pointIndex }) => <div className="rotation-player-wrap" key={player.id} style={{ left: `${point.x}%`, top: `${point.y}%` }}>
            <button className={`rotation-player${player.photoUrl ? ' has-photo' : ''}`} type="button" aria-label={`${player.name}, position ${pointIndex + 1}`}>
              {player.photoUrl && <img src={player.photoUrl} alt="" />}
              <span className="rotation-player-copy"><b>#{player.number}</b><strong>{player.name}</strong><small>{player.position}</small></span>
              <em>P{pointIndex + 1}</em>
              <span className="rotation-player-badges">{player.captain && <i className="captain">C</i>}{player.libero && <i className="libero">L</i>}</span>
            </button>
          </div>)}
        </div>
      </section>

      <aside className="rotation-controls panel">
        <div className="rotation-control-heading"><div><p className="eyebrow">Controls</p><h3>Rotation sequence</h3></div><strong>R{rotation}</strong></div>
        <div className="rotation-stepper">
          <button type="button" onClick={() => changeRotation(rotation - 1)} aria-label="Previous rotation">‹</button>
          <div>{[1,2,3,4,5,6].map((value) => <button className={rotation === value ? 'is-active' : ''} key={value} onClick={() => changeRotation(value)} type="button">R{value}</button>)}</div>
          <button type="button" onClick={() => changeRotation(rotation + 1)} aria-label="Next rotation">›</button>
        </div>
        <div className="rotation-playback">
          <button className={isPlaying ? 'is-active' : ''} type="button" onClick={() => setIsPlaying((current) => !current)}>{isPlaying ? 'Pause animation' : 'Play rotation'}</button>
          <button className={showArrows ? 'is-active' : ''} type="button" onClick={() => setShowArrows((current) => !current)}>{showArrows ? 'Hide arrows' : 'Show arrows'}</button>
        </div>
        <section className="rotation-lineup-list">
          <header><span>Current order</span><small>Positions rotate clockwise</small></header>
          {arranged.map(({ player, pointIndex }) => <article key={player.id}><span>P{pointIndex + 1}</span><div><strong>#{player.number} {player.name}</strong><small>{player.position}</small></div>{player.captain && <em>Captain</em>}</article>)}
        </section>
        <label className="rotation-note"><span>Coach note</span><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} /></label>
        <div className="rotation-share-actions"><button type="button" onClick={exportRotation}>Export rotation</button><button type="button" onClick={shareRotation}>Send to team</button></div>
      </aside>
    </div>
    {flash && <div className="rotation-flash">{flash}</div>}
  </div>;
}
