import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import type { Player, RosterMembership } from '../types/workspace';
import {
  FORMATION_SEQUENCE,
  SYSTEM_OPTIONS,
  createRotationPlan,
  depthScale,
  discardLegacyGhostPlans,
  ensureFormationSequence,
  formationByType,
  logicalToScreen,
  overlapWarnings,
  plansForContext,
  pointerToLogical,
  readRotationStore,
  rebuildPlanFormations,
  roleLabel,
  rolesForSystem,
  suggestRoleAssignments,
  updateBallPoint,
  updatePlayerPoint,
  upsertPlan,
  writeRotationStore,
  type Formation,
  type FormationType,
  type RotationPlan,
  type RotationSystem,
  type StudioPlayer,
  type SystemRole
} from '../features/rotation-studio';

type DragTarget =
  | { kind: 'player'; playerId: string }
  | { kind: 'ball' }
  | null;

type PreviewState = {
  from: FormationType;
  to: FormationType;
  progress: number;
} | null;

export default function RotationPage() {
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const courtRef = useRef<HTMLDivElement>(null);

  const roster = useMemo(() => {
    return workspace.rosterMemberships
      .filter((membership) => membership.teamId === workspace.activeTeamId && membership.seasonId === workspace.activeSeasonId)
      .map((membership) => ({
        membership,
        player: workspace.players.find((player) => player.id === membership.playerId)
      }))
      .filter((row): row is { membership: RosterMembership; player: Player } => Boolean(row.player) && !row.player!.archived && row.membership.status === 'active')
      .map(({ membership, player }) => toStudioPlayer(membership, player));
  }, [workspace.activeSeasonId, workspace.activeTeamId, workspace.players, workspace.rosterMemberships]);

  const [store, setStore] = useState(() => {
    discardLegacyGhostPlans();
    return readRotationStore();
  });
  const contextPlans = useMemo(
    () => plansForContext(store, workspace.activeTeamId, workspace.activeSeasonId),
    [store, workspace.activeSeasonId, workspace.activeTeamId]
  );

  const [plan, setPlan] = useState<RotationPlan | null>(null);
  const [rotationNumber, setRotationNumber] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [formationType, setFormationType] = useState<FormationType>('home');
  const [selectedId, setSelectedId] = useState('');
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const [preview, setPreview] = useState<PreviewState>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [flash, setFlash] = useState('');
  const [draftSystem, setDraftSystem] = useState<RotationSystem>('5-1');
  const [draftName, setDraftName] = useState('Varsity Rotation Plan');
  const [draftAssignments, setDraftAssignments] = useState<RotationPlan['roleAssignments']>({});
  const planRef = useRef<RotationPlan | null>(null);

  useEffect(() => {
    planRef.current = plan;
  }, [plan]);

  useEffect(() => {
    if (!workspace.activeTeamId || !workspace.activeSeasonId) {
      setPlan(null);
      return;
    }
    const active = contextPlans.find((item) => item.id === store.activePlanId) ?? contextPlans[0] ?? null;
    if (active) {
      setPlan(ensureFormationSequence(active));
      setSetupOpen(false);
    } else {
      setPlan(null);
      setSetupOpen(true);
      const suggested = suggestRoleAssignments(
        '5-1',
        roster.map((player) => ({
          id: player.id,
          position: player.position,
          primaryPosition: player.primaryPosition,
          libero: player.libero,
          starter: player.starter
        }))
      );
      setDraftAssignments(suggested);
      setDraftSystem('5-1');
      setDraftName(`${workspace.activeTeam?.name ?? 'Team'} Rotation Plan`);
    }
  }, [contextPlans, roster, store.activePlanId, workspace.activeSeasonId, workspace.activeTeam, workspace.activeTeamId]);

  const style = {
    '--rotation-primary': workspace.activeTeam?.primaryColor ?? '#ef3340',
    '--rotation-secondary': workspace.activeTeam?.secondaryColor ?? '#f4c95d'
  } as CSSProperties;

  const formation = plan ? formationByType(plan, rotationNumber, formationType) : undefined;
  const fromFormation = preview && plan ? formationByType(plan, rotationNumber, preview.from) : undefined;
  const toFormation = preview && plan ? formationByType(plan, rotationNumber, preview.to) : undefined;
  const warnings = formation ? overlapWarnings(formation.playerPositions.filter((item) => item.playerId)) : [];

  function showFlash(message: string, duration = 1200) {
    setFlash(message);
    window.setTimeout(() => setFlash(''), duration);
  }

  function persist(nextPlan: RotationPlan) {
    const stamped = { ...nextPlan, updatedAt: new Date().toISOString() };
    const nextStore = upsertPlan(store, stamped);
    setStore(nextStore);
    writeRotationStore(nextStore);
    setPlan(stamped);
  }

  function patchFormation(mutator: (current: Formation) => Formation, options?: { persist?: boolean }) {
    const currentPlan = planRef.current ?? plan;
    if (!currentPlan) return;
    const currentFormation = formationByType(currentPlan, rotationNumber, formationType);
    if (!currentFormation) return;
    const nextRotations = currentPlan.rotations.map((rotation) => {
      if (rotation.number !== rotationNumber) return rotation;
      return {
        ...rotation,
        formations: rotation.formations.map((item) => (item.type === formationType ? mutator(item) : item))
      };
    });
    const nextPlan = { ...currentPlan, rotations: nextRotations, updatedAt: new Date().toISOString() };
    planRef.current = nextPlan;
    setPlan(nextPlan);
    if (options?.persist === false) return;
    const nextStore = upsertPlan(store, nextPlan);
    setStore(nextStore);
    writeRotationStore(nextStore);
  }

  function createPlan() {
    if (!workspace.activeOrganizationId || !workspace.activeTeamId || !workspace.activeSeasonId) {
      showFlash('Select a team and season first.');
      return;
    }
    const next = createRotationPlan({
      organizationId: workspace.activeOrganizationId,
      teamId: workspace.activeTeamId,
      seasonId: workspace.activeSeasonId,
      name: draftName.trim() || 'Rotation Plan',
      system: draftSystem,
      roleAssignments: draftAssignments
    });
    persist(next);
    setSetupOpen(false);
    setFormationType('home');
    setRotationNumber(1);
    showFlash('Formation plan created.');
  }

  function rebuildFromRoles() {
    if (!plan) return;
    const next = rebuildPlanFormations({ ...plan, system: draftSystem, roleAssignments: draftAssignments, name: draftName.trim() || plan.name });
    persist(next);
    setSetupOpen(false);
    showFlash('Templates rebuilt from role assignments.');
  }

  function openSetup(edit = false) {
    if (plan && edit) {
      setDraftSystem(plan.system);
      setDraftName(plan.name);
      setDraftAssignments(plan.roleAssignments);
    } else {
      setDraftSystem('5-1');
      setDraftAssignments(
        suggestRoleAssignments(
          '5-1',
          roster.map((player) => ({
            id: player.id,
            position: player.position,
            primaryPosition: player.primaryPosition,
            libero: player.libero,
            starter: player.starter
          }))
        )
      );
    }
    setSetupOpen(true);
  }

  function onCourtPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragTarget || !courtRef.current || preview) return;
    const point = pointerToLogical(event.clientX, event.clientY, courtRef.current.getBoundingClientRect());
    if (dragTarget.kind === 'ball') {
      patchFormation((current) => updateBallPoint(current, point), { persist: false });
      return;
    }
    patchFormation((current) => updatePlayerPoint(current, dragTarget.playerId, point), { persist: false });
  }

  function endDrag() {
    const latest = planRef.current;
    if (dragTarget && latest) {
      const nextStore = upsertPlan(store, latest);
      setStore(nextStore);
      writeRotationStore(nextStore);
    }
    setDragTarget(null);
  }

  function markServer(playerId: string) {
    patchFormation((current) => ({ ...current, serverPlayerId: playerId }));
    setSelectedId('');
    showFlash('Server marked.');
  }

  function resetPlayer(playerId: string) {
    if (!plan) return;
    const template = createRotationPlan({
      organizationId: plan.organizationId,
      teamId: plan.teamId,
      seasonId: plan.seasonId,
      name: plan.name,
      system: plan.system,
      roleAssignments: plan.roleAssignments
    });
    const templateFormation = formationByType(template, rotationNumber, formationType);
    const point = templateFormation?.playerPositions.find((item) => item.playerId === playerId)?.point;
    if (!point) return;
    patchFormation((current) => updatePlayerPoint(current, playerId, point));
    setSelectedId('');
  }

  function previewTransition() {
    if (!plan || preview) return;
    const index = FORMATION_SEQUENCE.findIndex((item) => item.type === formationType);
    const next = FORMATION_SEQUENCE[(index + 1) % FORMATION_SEQUENCE.length];
    const from = formationType;
    setPreview({ from, to: next.type, progress: 0 });
    const started = performance.now();
    const duration = 1100;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      setPreview({ from, to: next.type, progress });
      if (progress < 1) {
        requestAnimationFrame(tick);
        return;
      }
      setFormationType(next.type);
      setPreview(null);
      showFlash(`${FORMATION_SEQUENCE[index].short} → ${next.short}`);
    };
    requestAnimationFrame(tick);
  }

  function playSequence() {
    if (!plan || preview) return;
    let index = FORMATION_SEQUENCE.findIndex((item) => item.type === formationType);
    const run = () => {
      const from = FORMATION_SEQUENCE[index];
      const to = FORMATION_SEQUENCE[(index + 1) % FORMATION_SEQUENCE.length];
      setPreview({ from: from.type, to: to.type, progress: 0 });
      const started = performance.now();
      const duration = 900;
      const tick = (now: number) => {
        const progress = Math.min(1, (now - started) / duration);
        setPreview({ from: from.type, to: to.type, progress });
        if (progress < 1) {
          requestAnimationFrame(tick);
          return;
        }
        setFormationType(to.type);
        index = (index + 1) % FORMATION_SEQUENCE.length;
        if (index === 0) {
          setPreview(null);
          showFlash('Sequence complete.');
          return;
        }
        window.setTimeout(run, 180);
      };
      requestAnimationFrame(tick);
    };
    run();
  }

  const visiblePositions = useMemo(() => {
    if (preview && fromFormation && toFormation) {
      return toFormation.playerPositions.map((dest) => {
        const start = fromFormation.playerPositions.find((item) => item.playerId === dest.playerId) ?? dest;
        return {
          ...dest,
          point: {
            x: start.point.x + (dest.point.x - start.point.x) * preview.progress,
            y: start.point.y + (dest.point.y - start.point.y) * preview.progress
          },
          ghost: start.point,
          showGhost: preview.progress < 1
        };
      });
    }
    return (formation?.playerPositions ?? []).map((item) => ({ ...item, ghost: item.point, showGhost: false }));
  }, [formation, fromFormation, preview, toFormation]);

  const ballPoint = useMemo(() => {
    if (preview && fromFormation && toFormation) {
      return {
        x: fromFormation.ballPosition.x + (toFormation.ballPosition.x - fromFormation.ballPosition.x) * preview.progress,
        y: fromFormation.ballPosition.y + (toFormation.ballPosition.y - fromFormation.ballPosition.y) * preview.progress
      };
    }
    return formation?.ballPosition ?? { x: 0.5, y: 0.5 };
  }, [formation, fromFormation, preview, toFormation]);

  const playerMap = useMemo(() => new Map(roster.map((player) => [player.id, player])), [roster]);

  return (
    <div className="rotation-studio" style={style}>
      <header className="rotation-toolbar">
        <button className="rotation-exit" type="button" aria-label="Exit Rotation Studio" onClick={() => navigate('/')}>⌂</button>
        <div className="rotation-title">
          <span>Rotation Studio · Formation Sequences</span>
          <h2>{plan?.name ?? 'Create a rotation plan'}</h2>
          <p>{workspace.activeTeam?.name ?? 'No team'} · {workspace.activeSeason?.name ?? 'No season'} · {plan ? SYSTEM_OPTIONS.find((item) => item.id === plan.system)?.label : 'Setup'}</p>
        </div>
        <div className="rotation-toolbar-actions">
          <button type="button" onClick={() => openSetup(Boolean(plan))}>{plan ? 'Edit Plan' : 'New Plan'}</button>
          <button type="button" onClick={previewTransition} disabled={!plan || Boolean(preview)}>Preview</button>
          <button type="button" onClick={playSequence} disabled={!plan || Boolean(preview)}>Play Sequence</button>
        </div>
      </header>

      <div className="rotation-workspace">
        <section className="panel rotation-court-card">
          <div className="rotation-court-heading">
            <div>
              <p className="eyebrow">Perspective court</p>
              <h3>R{rotationNumber} · {FORMATION_SEQUENCE.find((item) => item.type === formationType)?.name}</h3>
            </div>
            <span className="rotation-status"><i /> {preview ? 'Previewing movement' : 'Editing formations'}</span>
          </div>

          <div
            className={`rotation-court perspective-court${preview ? ' is-running' : ''}`}
            ref={courtRef}
            onPointerMove={onCourtPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerLeave={endDrag}
          >
            <div className="court-floor" aria-hidden="true" />
            <div className="court-grid" aria-hidden="true" />
            <div className="rotation-net"><span>NET</span></div>
            <div className="rotation-attack-line" aria-hidden="true" />
            <div className="rotation-home-label">{workspace.activeTeam?.abbreviation ?? 'HOME'}</div>
            <div className="rotation-opponent-label">OPP</div>

            {preview && fromFormation && toFormation && fromFormation.playerPositions.map((start) => {
              const dest = toFormation.playerPositions.find((item) => item.playerId === start.playerId);
              if (!dest) return null;
              const a = logicalToScreen(start.point);
              const b = logicalToScreen(dest.point);
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              if (length < 1) return null;
              const shorten = Math.min(8, length * 0.18);
              const ratio = (length - shorten) / length;
              const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
              return (
                <span
                  key={`path-${start.playerId}`}
                  className="studio-path is-preview"
                  style={{ left: `${a.x}%`, top: `${a.y}%`, width: `${length * ratio}%`, transform: `rotate(${angle}deg)` }}
                >
                  <i />
                </span>
              );
            })}

            {visiblePositions.map((position) => {
              if (!position.playerId) return null;
              const player = playerMap.get(position.playerId);
              if (!player) return null;
              const screen = logicalToScreen(position.point);
              const scale = depthScale(position.point.y);
              const selected = selectedId === player.id;
              return (
                <div key={player.id}>
                  {position.showGhost && (
                    <button
                      type="button"
                      className="rotation-player ghost"
                      style={{ left: `${logicalToScreen(position.ghost).x}%`, top: `${logicalToScreen(position.ghost).y}%`, transform: `translate(-50%, -50%) scale(${depthScale(position.ghost.y) * 0.92})` }}
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <PlayerCopy player={player} zone={position.zone} />
                    </button>
                  )}
                  <button
                    type="button"
                    className={`rotation-player solid${selected ? ' is-selected' : ''}${formation?.serverPlayerId === player.id ? ' is-server' : ''}`}
                    style={{ left: `${screen.x}%`, top: `${screen.y}%`, transform: `translate(-50%, -50%) scale(${scale})`, zIndex: Math.round(20 + position.point.y * 20) }}
                    onClick={() => setSelectedId((current) => (current === player.id ? '' : player.id))}
                    onPointerDown={(event) => {
                      if (preview) return;
                      event.currentTarget.setPointerCapture(event.pointerId);
                      setSelectedId(player.id);
                      setDragTarget({ kind: 'player', playerId: player.id });
                    }}
                  >
                    {player.photoUrl ? <img src={player.photoUrl} alt="" /> : null}
                    <PlayerCopy player={player} zone={position.zone} role={position.role} />
                    {(player.captain || player.libero) && (
                      <span className="rotation-player-badges">
                        {player.captain && <i className="captain">C</i>}
                        {player.libero && <i className="libero">L</i>}
                      </span>
                    )}
                    <em>#{player.number || '—'}</em>
                    {formation?.serverPlayerId === player.id && <span className="server-badge">SERVER</span>}
                  </button>
                  {selected && !preview && (
                    <div className="rotation-radial" style={{ left: `${screen.x}%`, top: `${screen.y}%` }}>
                      <button type="button" onClick={() => markServer(player.id)}>Mark Server</button>
                      <button type="button" onClick={() => showFlash('Libero replace comes in Phase B.')}>Libero Replace</button>
                      <button type="button" onClick={() => resetPlayer(player.id)}>Reset Position</button>
                      <button type="button" onClick={() => setSelectedId('')}>Close</button>
                    </div>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              className="rotation-ball"
              aria-label="Move ball"
              style={{ left: `${logicalToScreen(ballPoint).x}%`, top: `${logicalToScreen(ballPoint).y}%`, transform: `translate(-50%, -50%) scale(${depthScale(ballPoint.y)})` }}
              onPointerDown={(event) => {
                if (preview) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                setDragTarget({ kind: 'ball' });
              }}
            />
          </div>
        </section>

        <aside className="panel rotation-controls">
          <div className="rotation-control-heading">
            <div>
              <p className="eyebrow">Sequence</p>
              <h3>Formations</h3>
            </div>
            <strong>R{rotationNumber}</strong>
          </div>

          <div className="formation-tabs" role="tablist" aria-label="Formation sequence">
            {FORMATION_SEQUENCE.map((item) => (
              <button
                key={item.type}
                type="button"
                role="tab"
                aria-selected={formationType === item.type}
                className={formationType === item.type ? 'is-active' : undefined}
                onClick={() => {
                  if (preview) return;
                  setFormationType(item.type);
                  setSelectedId('');
                }}
              >
                {item.short}
              </button>
            ))}
          </div>

          <div className="formation-nav">
            <button type="button" onClick={() => stepFormation(-1)} disabled={Boolean(preview)}>Prev</button>
            <button type="button" onClick={() => stepFormation(1)} disabled={Boolean(preview)}>Next</button>
          </div>

          <div className="rotation-stepper">
            <button type="button" aria-label="Previous rotation" onClick={() => changeRotation(rotationNumber - 1)}>‹</button>
            <div>
              {([1, 2, 3, 4, 5, 6] as const).map((value) => (
                <button key={value} type="button" className={rotationNumber === value ? 'is-active' : undefined} onClick={() => changeRotation(value)}>
                  R{value}
                </button>
              ))}
            </div>
            <button type="button" aria-label="Next rotation" onClick={() => changeRotation(rotationNumber + 1)}>›</button>
          </div>

          <div className="rotation-lineup-list">
            <header>
              <span>Role assignments</span>
              <small>{plan ? SYSTEM_OPTIONS.find((item) => item.id === plan.system)?.label : 'No plan'}</small>
            </header>
            {(plan ? rolesForSystem(plan.system) : []).map((role) => {
              const playerId = plan?.roleAssignments[role] ?? '';
              const player = playerMap.get(playerId);
              return (
                <article key={role}>
                  <span>{roleLabel(role).slice(0, 2).toUpperCase()}</span>
                  <div>
                    <strong>{player ? displayName(player) : 'Unassigned'}</strong>
                    <small>{roleLabel(role)}{player?.number ? ` · #${player.number}` : ''}</small>
                  </div>
                  <em>{player?.position || '—'}</em>
                </article>
              );
            })}
          </div>

          <div className="rotation-note">
            <span>Formation notes</span>
            <textarea
              value={formation?.notes ?? ''}
              placeholder="Coach notes for this formation"
              onChange={(event) => patchFormation((current) => ({ ...current, notes: event.target.value }))}
              disabled={!formation || Boolean(preview)}
            />
          </div>

          {warnings.length > 0 && <p className="rotation-warning">{warnings[0]}</p>}

          <div className="rotation-share-actions">
            <button type="button" onClick={() => window.print()} disabled={!plan}>Export</button>
            <button type="button" onClick={() => openSetup(true)} disabled={!plan}>Roles</button>
          </div>
        </aside>
      </div>

      {setupOpen && (
        <div className="rotation-setup-overlay" role="dialog" aria-modal="true" aria-label="Rotation plan setup">
          <div className="rotation-setup-card panel">
            <div className="rotation-control-heading">
              <div>
                <p className="eyebrow">Rotation plan</p>
                <h3>{plan ? 'Edit plan & roles' : 'Create formation plan'}</h3>
              </div>
              {plan && <button type="button" onClick={() => setSetupOpen(false)}>Close</button>}
            </div>
            <label className="rotation-note">
              <span>Plan name</span>
              <input value={draftName} onChange={(event) => setDraftName(event.target.value)} />
            </label>
            <label className="rotation-note">
              <span>System</span>
              <select
                value={draftSystem}
                onChange={(event) => {
                  const system = event.target.value as RotationSystem;
                  setDraftSystem(system);
                  setDraftAssignments(
                    suggestRoleAssignments(
                      system,
                      roster.map((player) => ({
                        id: player.id,
                        position: player.position,
                        primaryPosition: player.primaryPosition,
                        libero: player.libero,
                        starter: player.starter
                      }))
                    )
                  );
                }}
              >
                {SYSTEM_OPTIONS.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </label>
            <div className="rotation-role-grid">
              {rolesForSystem(draftSystem).map((role) => (
                <label key={role} className="rotation-note">
                  <span>{roleLabel(role)}</span>
                  <select
                    value={draftAssignments[role] ?? ''}
                    onChange={(event) => setDraftAssignments((current) => ({ ...current, [role]: event.target.value }))}
                  >
                    <option value="">Unassigned</option>
                    {roster.map((player) => (
                      <option key={player.id} value={player.id}>
                        #{player.number || '—'} {displayName(player)} · {player.position}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <div className="rotation-share-actions">
              {plan ? (
                <button type="button" onClick={rebuildFromRoles}>Rebuild formations</button>
              ) : (
                <button type="button" onClick={createPlan}>Create plan</button>
              )}
              <button type="button" onClick={() => setSetupOpen(false)} disabled={!plan}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {flash && <div className="rotation-flash">{flash}</div>}
    </div>
  );

  function changeRotation(next: number) {
    const value = (next < 1 ? 6 : next > 6 ? 1 : next) as 1 | 2 | 3 | 4 | 5 | 6;
    setRotationNumber(value);
    setSelectedId('');
  }

  function stepFormation(delta: number) {
    const index = FORMATION_SEQUENCE.findIndex((item) => item.type === formationType);
    const next = FORMATION_SEQUENCE[(index + delta + FORMATION_SEQUENCE.length) % FORMATION_SEQUENCE.length];
    setFormationType(next.type);
    setSelectedId('');
  }
}

function toStudioPlayer(membership: RosterMembership, player: Player): StudioPlayer {
  return {
    id: player.id,
    name: player.preferredName || player.firstName,
    number: membership.jerseyNumber,
    position: membership.position || player.primaryPosition,
    captain: membership.captain,
    libero: membership.libero,
    photoUrl: player.photoUrl,
    primaryPosition: player.primaryPosition,
    starter: membership.starter
  };
}

function displayName(player: StudioPlayer) {
  return player.name;
}

function PlayerCopy({ player, zone, role }: { player: StudioPlayer; zone: number; role?: SystemRole | 'custom' }) {
  return (
    <span className="rotation-player-copy">
      <b>{zone}</b>
      <strong>{player.name}</strong>
      <small>{role ? roleLabel(role) : player.position}</small>
    </span>
  );
}
