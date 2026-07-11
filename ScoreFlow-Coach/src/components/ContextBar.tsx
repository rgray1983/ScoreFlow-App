import { NavLink } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';

type ContextBarProps = {
  label?: string;
  showManageLink?: boolean;
};

export default function ContextBar({ label = 'Working context', showManageLink = true }: ContextBarProps) {
  const workspace = useWorkspace();
  const organizations = workspace.organizations.filter((item) => !item.archived);
  const teams = workspace.teams.filter(
    (item) => !item.archived && item.organizationId === workspace.activeOrganizationId
  );
  const seasons = workspace.seasons.filter(
    (item) => !item.archived && item.teamId === workspace.activeTeamId
  );

  return (
    <section className="context-bar panel" aria-label="Organization, team, and season context">
      <div className="context-bar-heading">
        <p className="eyebrow">{label}</p>
        <span>Changes apply immediately</span>
      </div>

      <div className="context-controls">
        <ContextControl
          label="Organization"
          value={workspace.activeOrganizationId}
          fallback={workspace.activeOrganization?.name ?? 'No organization'}
          options={organizations.map((item) => ({ value: item.id, label: item.name }))}
          onChange={workspace.setActiveOrganization}
        />
        <ContextControl
          label="Team"
          value={workspace.activeTeamId}
          fallback={workspace.activeTeam ? `${workspace.activeTeam.name} · ${workspace.activeTeam.level}` : 'No team'}
          options={teams.map((item) => ({ value: item.id, label: `${item.name} · ${item.level}` }))}
          onChange={workspace.setActiveTeam}
          disabled={!workspace.activeOrganizationId}
        />
        <ContextControl
          label="Season"
          value={workspace.activeSeasonId}
          fallback={workspace.activeSeason?.name ?? 'No season'}
          options={seasons.map((item) => ({ value: item.id, label: item.name }))}
          onChange={workspace.setActiveSeason}
          disabled={!workspace.activeTeamId}
        />
      </div>

      {showManageLink ? <NavLink className="context-manage-link" to="/teams">Manage</NavLink> : null}
    </section>
  );
}

function ContextControl({
  label,
  value,
  fallback,
  options,
  onChange,
  disabled = false
}: {
  label: string;
  value: string;
  fallback: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const canSwitch = options.length > 1;

  return (
    <label className={`context-control${canSwitch ? ' is-switchable' : ''}`}>
      <span>{label}</span>
      {canSwitch ? (
        <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : (
        <strong title={fallback}>{fallback}</strong>
      )}
    </label>
  );
}
