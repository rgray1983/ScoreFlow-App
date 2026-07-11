import { useMemo, useState, type FormEvent } from 'react';
import ContextBar from '../components/ContextBar';
import SlideOver from '../components/SlideOver';
import { useWorkspace } from '../context/WorkspaceContext';
import type { DominantHand, Player, PlayerStatus } from '../types/workspace';

const positions = ['Outside Hitter', 'Middle Blocker', 'Opposite', 'Setter', 'Libero', 'Defensive Specialist'];
const rosterStatuses: PlayerStatus[] = ['active', 'injured', 'inactive', 'guest'];

export default function PlayersPage() {
  const workspace = useWorkspace();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const selectedPlayer = workspace.players.find((player) => player.id === selectedPlayerId);
  const players = workspace.players.filter((player) => !player.archived && player.organizationId === workspace.activeOrganizationId);
  const roster = workspace.rosterMemberships.filter((item) => item.teamId === workspace.activeTeamId && item.seasonId === workspace.activeSeasonId);
  const canAddPlayer = Boolean(workspace.activeOrganizationId && workspace.activeTeamId && workspace.activeSeasonId);

  const rosterRows = useMemo(() => roster.map((membership) => ({
    membership,
    player: workspace.players.find((player) => player.id === membership.playerId)
  })).filter((row): row is { membership: typeof roster[number]; player: Player } => Boolean(row.player)), [roster, workspace.players]);

  return (
    <div className="players-workspace">
      <ContextBar label="Player context" />

      <section className="players-summary panel">
        <div><p className="eyebrow">Active roster</p><h2>{workspace.activeTeam?.name ?? 'Select a team'}</h2><p>{workspace.activeSeason?.name ?? 'Select a season'} · {rosterRows.length} players</p></div>
        <button className="button button-primary" disabled={!canAddPlayer} type="button" onClick={() => setCreating(true)}>＋ Add player</button>
      </section>

      <section className="players-grid panel">
        <header><div><p className="eyebrow">Player directory</p><h3>Players</h3></div><span className="sync-pill"><span /> Saved on device</span></header>
        <div className="player-card-grid">
          {players.length === 0 ? (
            <div className="players-empty"><span>●</span><p>No players in this organization yet.</p></div>
          ) : players.map((player) => {
            const membership = roster.find((item) => item.playerId === player.id);
            return (
              <button className="player-card" key={player.id} type="button" onClick={() => setSelectedPlayerId(player.id)}>
                <span className="player-number">{membership?.jerseyNumber || '—'}</span>
                <span className="player-avatar">{player.firstName[0]}{player.lastName[0]}</span>
                <span className="player-copy"><strong>{player.preferredName || player.firstName} {player.lastName}</strong><small>{membership?.position || player.primaryPosition || 'Position not set'} · Class of {player.graduationYear || '—'}</small></span>
                <span className="player-badges">{membership?.captain && <em>C</em>}{membership?.libero && <em>L</em>}</span>
              </button>
            );
          })}
        </div>
      </section>

      <SlideOver open={creating || Boolean(selectedPlayer)} title={creating ? 'Add player' : 'Edit player'} onClose={() => { setCreating(false); setSelectedPlayerId(null); }}>
        <PlayerForm player={selectedPlayer} onDone={() => { setCreating(false); setSelectedPlayerId(null); }} />
      </SlideOver>
    </div>
  );
}

function PlayerForm({ player, onDone }: { player?: Player; onDone: () => void }) {
  const workspace = useWorkspace();
  const membership = workspace.rosterMemberships.find((item) => item.playerId === player?.id && item.teamId === workspace.activeTeamId && item.seasonId === workspace.activeSeasonId);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const playerInput = {
      organizationId: workspace.activeOrganizationId,
      firstName: String(data.get('firstName') ?? '').trim(),
      lastName: String(data.get('lastName') ?? '').trim(),
      preferredName: String(data.get('preferredName') ?? '').trim(),
      graduationYear: String(data.get('graduationYear') ?? '').trim(),
      height: String(data.get('height') ?? '').trim(),
      dominantHand: String(data.get('dominantHand')) as DominantHand,
      primaryPosition: String(data.get('primaryPosition') ?? ''),
      secondaryPosition: String(data.get('secondaryPosition') ?? ''),
      notes: String(data.get('notes') ?? '').trim()
    };
    const playerId = player?.id ?? workspace.addPlayer(playerInput);
    if (player) workspace.updatePlayer(player.id, playerInput);
    const rosterInput = {
      playerId,
      teamId: workspace.activeTeamId,
      seasonId: workspace.activeSeasonId,
      jerseyNumber: String(data.get('jerseyNumber') ?? '').trim(),
      position: String(data.get('rosterPosition') ?? ''),
      status: String(data.get('status')) as PlayerStatus,
      captain: data.get('captain') === 'on',
      libero: data.get('libero') === 'on',
      starter: data.get('starter') === 'on',
      notes: String(data.get('rosterNotes') ?? '').trim()
    };
    if (membership) workspace.updateRosterMembership(membership.id, rosterInput);
    else if (workspace.activeTeamId && workspace.activeSeasonId) workspace.addRosterMembership(rosterInput);
    onDone();
  }

  return (
    <form className="player-editor-form" onSubmit={submit}>
      <section><p className="form-section-title">Player profile</p><div className="editor-grid">
        <label><span>First name</span><input autoFocus name="firstName" defaultValue={player?.firstName} required /></label>
        <label><span>Last name</span><input name="lastName" defaultValue={player?.lastName} required /></label>
        <label><span>Preferred name</span><input name="preferredName" defaultValue={player?.preferredName} /></label>
        <label><span>Graduation year</span><input name="graduationYear" inputMode="numeric" maxLength={4} defaultValue={player?.graduationYear} /></label>
        <label><span>Height</span><input name="height" defaultValue={player?.height} placeholder="5′10″" /></label>
        <label><span>Dominant hand</span><select name="dominantHand" defaultValue={player?.dominantHand ?? 'right'}><option value="right">Right</option><option value="left">Left</option><option value="ambidextrous">Ambidextrous</option></select></label>
        <label><span>Primary position</span><select name="primaryPosition" defaultValue={player?.primaryPosition}><option value="">Select position</option>{positions.map((position) => <option key={position}>{position}</option>)}</select></label>
        <label><span>Secondary position</span><select name="secondaryPosition" defaultValue={player?.secondaryPosition}><option value="">None</option>{positions.map((position) => <option key={position}>{position}</option>)}</select></label>
      </div></section>
      <section><p className="form-section-title">Season roster</p><div className="editor-grid">
        <label><span>Jersey number</span><input name="jerseyNumber" inputMode="numeric" defaultValue={membership?.jerseyNumber} /></label>
        <label><span>Roster position</span><input name="rosterPosition" defaultValue={membership?.position} placeholder="OH" /></label>
        <label><span>Status</span><select name="status" defaultValue={membership?.status ?? 'active'}>{rosterStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
      </div><div className="role-checks"><label><input type="checkbox" name="captain" defaultChecked={membership?.captain} /> Captain</label><label><input type="checkbox" name="libero" defaultChecked={membership?.libero} /> Libero</label><label><input type="checkbox" name="starter" defaultChecked={membership?.starter} /> Starter</label></div></section>
      <label className="notes-field"><span>Coach notes</span><textarea name="notes" defaultValue={player?.notes} rows={3} /></label>
      <div className="slide-form-actions"><button className="button button-quiet" type="button" onClick={onDone}>Cancel</button><button className="button button-primary" type="submit">Save player</button></div>
    </form>
  );
}
