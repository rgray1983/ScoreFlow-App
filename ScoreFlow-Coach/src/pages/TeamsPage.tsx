import { useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import type { OrganizationType, SeasonStatus } from '../types/workspace';

const organizationTypes: OrganizationType[] = ['school', 'club', 'independent'];
const seasonStatuses: SeasonStatus[] = ['active', 'upcoming', 'completed'];
type FormMode = 'organization' | 'team' | 'season' | null;

export default function TeamsPage() {
  const workspace = useWorkspace();
  const [formMode, setFormMode] = useState<FormMode>(null);
  const organizations = workspace.organizations.filter((item) => !item.archived);
  const teams = workspace.teams.filter((item) => !item.archived && item.organizationId === workspace.activeOrganizationId);
  const seasons = workspace.seasons.filter((item) => !item.archived && item.teamId === workspace.activeTeamId);
  const counts = useMemo(() => ({
    organizations: organizations.length,
    teams: workspace.teams.filter((item) => !item.archived).length,
    seasons: workspace.seasons.filter((item) => !item.archived).length
  }), [organizations.length, workspace.seasons, workspace.teams]);

  return (
    <div className="team-workspace">
      <section className="team-summary panel">
        <div><p className="eyebrow">Program setup</p><h2>Organizations, teams & seasons</h2><p>Build the structure that future rosters, schedules, matches, rotations, and reports will use.</p></div>
        <div className="structure-counts" aria-label="Workspace totals">
          <div><strong>{counts.organizations}</strong><span>Programs</span></div>
          <div><strong>{counts.teams}</strong><span>Teams</span></div>
          <div><strong>{counts.seasons}</strong><span>Seasons</span></div>
        </div>
      </section>

      <div className="structure-grid">
        <StructureColumn title="Organizations" subtitle="School, club, or independent program" actionLabel="Add program" onAdd={() => setFormMode('organization')}>
          {organizations.length === 0 ? <EmptyState label="No programs yet" /> : organizations.map((organization) => (
            <button className={`structure-card${workspace.activeOrganizationId === organization.id ? ' is-selected' : ''}`} key={organization.id} onClick={() => workspace.setActiveOrganization(organization.id)} type="button">
              <span className="structure-mark">{organization.name.slice(0, 2).toUpperCase()}</span>
              <span className="structure-copy"><strong>{organization.name}</strong><small>{organization.type} · {organization.city}, {organization.state}</small></span>
              <span className="selection-dot" aria-hidden="true" />
            </button>
          ))}
        </StructureColumn>

        <StructureColumn title="Teams" subtitle={workspace.activeOrganization?.name ?? 'Select a program first'} actionLabel="Add team" disabled={!workspace.activeOrganizationId} onAdd={() => setFormMode('team')}>
          {!workspace.activeOrganizationId ? <EmptyState label="Select a program" /> : teams.length === 0 ? <EmptyState label="No teams in this program" /> : teams.map((team) => (
            <button className={`structure-card team-identity${workspace.activeTeamId === team.id ? ' is-selected' : ''}`} key={team.id} onClick={() => workspace.setActiveTeam(team.id)} style={{ '--team-primary': team.primaryColor, '--team-secondary': team.secondaryColor } as CSSProperties} type="button">
              <span className="structure-mark">{team.abbreviation}</span>
              <span className="structure-copy"><strong>{team.name}</strong><small>{team.level} · {team.homeCourt || 'Home court not set'}</small></span>
              <span className="selection-dot" aria-hidden="true" />
            </button>
          ))}
        </StructureColumn>

        <StructureColumn title="Seasons" subtitle={workspace.activeTeam?.name ?? 'Select a team first'} actionLabel="Add season" disabled={!workspace.activeTeamId} onAdd={() => setFormMode('season')}>
          {!workspace.activeTeamId ? <EmptyState label="Select a team" /> : seasons.length === 0 ? <EmptyState label="No seasons for this team" /> : seasons.map((season) => (
            <button className={`structure-card${workspace.activeSeasonId === season.id ? ' is-selected' : ''}`} key={season.id} onClick={() => workspace.setActiveSeason(season.id)} type="button">
              <span className={`season-status status-${season.status}`}>{season.status}</span>
              <span className="structure-copy"><strong>{season.name}</strong><small>{formatDate(season.startDate)} – {formatDate(season.endDate)}</small></span>
              <span className="selection-dot" aria-hidden="true" />
            </button>
          ))}
        </StructureColumn>
      </div>

      <section className="active-context panel">
        <div><p className="eyebrow">Active context</p><h3>{workspace.activeTeam?.name ?? 'No active team'}</h3></div>
        <div className="context-path"><span>{workspace.activeOrganization?.name ?? 'Program'}</span><b>›</b><span>{workspace.activeTeam?.level ?? 'Team'}</span><b>›</b><span>{workspace.activeSeason?.name ?? 'Season'}</span></div>
        <span className="sync-pill"><span /> Saved on device</span>
      </section>

      {formMode && <CreateDialog mode={formMode} onClose={() => setFormMode(null)} />}
    </div>
  );
}

function StructureColumn({ title, subtitle, actionLabel, onAdd, disabled = false, children }: { title: string; subtitle: string; actionLabel: string; onAdd: () => void; disabled?: boolean; children: ReactNode }) {
  return <section className="structure-column panel"><header><div><p className="eyebrow">{subtitle}</p><h3>{title}</h3></div><button className="add-structure-button" disabled={disabled} onClick={onAdd} type="button">＋<span>{actionLabel}</span></button></header><div className="structure-list">{children}</div></section>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="structure-empty"><span>◇</span><p>{label}</p></div>;
}

function CreateDialog({ mode, onClose }: { mode: Exclude<FormMode, null>; onClose: () => void }) {
  const workspace = useWorkspace();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (mode === 'organization') workspace.addOrganization({ name: String(data.get('name') ?? '').trim(), type: String(data.get('type')) as OrganizationType, city: String(data.get('city') ?? '').trim(), state: String(data.get('state') ?? '').trim().toUpperCase() });
    if (mode === 'team') workspace.addTeam({ organizationId: workspace.activeOrganizationId, name: String(data.get('name') ?? '').trim(), level: String(data.get('level') ?? '').trim(), abbreviation: String(data.get('abbreviation') ?? '').trim().toUpperCase().slice(0, 4), primaryColor: String(data.get('primaryColor') ?? '#ef3340'), secondaryColor: String(data.get('secondaryColor') ?? '#f4c95d'), homeCourt: String(data.get('homeCourt') ?? '').trim() });
    if (mode === 'season') workspace.addSeason({ teamId: workspace.activeTeamId, name: String(data.get('name') ?? '').trim(), startDate: String(data.get('startDate') ?? ''), endDate: String(data.get('endDate') ?? ''), status: String(data.get('status')) as SeasonStatus });
    onClose();
  }

  return (
    <div className="dialog-layer" role="presentation">
      <section className={`create-dialog panel mode-${mode}`} role="dialog" aria-modal="true" aria-labelledby="create-title">
        <header><div><p className="eyebrow">Program structure</p><h2 id="create-title">Add {mode}</h2></div><button onClick={onClose} type="button" aria-label="Close">×</button></header>
        <form onSubmit={submit}>
          {mode === 'organization' && <OrganizationFields />}
          {mode === 'team' && <TeamFields />}
          {mode === 'season' && <SeasonFields />}
          <div className="dialog-actions"><button className="button button-quiet" onClick={onClose} type="button">Cancel</button><button className="button button-primary" type="submit">Save {mode}</button></div>
        </form>
      </section>
    </div>
  );
}

function OrganizationFields() {
  return <div className="form-grid"><label className="field-wide"><span>Program name</span><input autoFocus name="name" required placeholder="Hartsville High School" /></label><label><span>Program type</span><select name="type" defaultValue="school">{organizationTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label><label><span>City</span><input name="city" required placeholder="Hartsville" /></label><label><span>State</span><input name="state" required maxLength={2} placeholder="SC" /></label></div>;
}

function TeamFields() {
  return <div className="form-grid"><label className="field-wide"><span>Team name</span><input autoFocus name="name" required placeholder="Hartsville Red Foxes" /></label><label><span>Level / age group</span><input name="level" required placeholder="Varsity" /></label><label><span>Abbreviation</span><input name="abbreviation" required maxLength={4} placeholder="HF" /></label><label className="field-wide"><span>Home court</span><input name="homeCourt" placeholder="Main gym" /></label><label><span>Primary color</span><input name="primaryColor" type="color" defaultValue="#ef3340" /></label><label><span>Secondary color</span><input name="secondaryColor" type="color" defaultValue="#f4c95d" /></label></div>;
}

function SeasonFields() {
  return <div className="form-grid"><label className="field-wide"><span>Season name</span><input autoFocus name="name" required placeholder="2026 School Season" /></label><label><span>Start date</span><input name="startDate" type="date" required /></label><label><span>End date</span><input name="endDate" type="date" required /></label><label className="field-wide season-status-field"><span>Status</span><select name="status" defaultValue="active">{seasonStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label></div>;
}

function formatDate(value: string) {
  if (!value) return 'Date not set';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}
