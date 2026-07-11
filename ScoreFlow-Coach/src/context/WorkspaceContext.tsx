import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  Organization,
  OrganizationInput,
  Player,
  PlayerInput,
  RosterMembership,
  RosterMembershipInput,
  Season,
  SeasonInput,
  Team,
  TeamInput,
  WorkspaceData
} from '../types/workspace';

const STORAGE_KEY = 'scoreflow-coach-workspace-v1';
const now = new Date().toISOString();

const seedWorkspace: WorkspaceData = {
  organizations: [{ id: 'org-hartsville', name: 'Hartsville High School', type: 'school', city: 'Hartsville', state: 'SC', archived: false, createdAt: now }],
  teams: [{ id: 'team-varsity', organizationId: 'org-hartsville', name: 'Hartsville Red Foxes', level: 'Varsity', abbreviation: 'HF', primaryColor: '#ef3340', secondaryColor: '#f4c95d', homeCourt: 'Hartsville High School Gym', archived: false, createdAt: now }],
  seasons: [{ id: 'season-2026', teamId: 'team-varsity', name: '2026 School Season', startDate: '2026-08-01', endDate: '2026-11-15', status: 'active', archived: false, createdAt: now }],
  players: [
    { id: 'player-ava', organizationId: 'org-hartsville', firstName: 'Ava', lastName: 'Bennett', preferredName: '', graduationYear: '2027', height: '5′10″', dominantHand: 'right', primaryPosition: 'Outside Hitter', secondaryPosition: 'Defensive Specialist', notes: '', archived: false, createdAt: now },
    { id: 'player-mia', organizationId: 'org-hartsville', firstName: 'Mia', lastName: 'Coleman', preferredName: '', graduationYear: '2028', height: '5′8″', dominantHand: 'right', primaryPosition: 'Setter', secondaryPosition: '', notes: '', archived: false, createdAt: now },
    { id: 'player-zoe', organizationId: 'org-hartsville', firstName: 'Zoe', lastName: 'Ramirez', preferredName: '', graduationYear: '2027', height: '5′6″', dominantHand: 'left', primaryPosition: 'Libero', secondaryPosition: 'Defensive Specialist', notes: '', archived: false, createdAt: now }
  ],
  rosterMemberships: [
    { id: 'roster-ava', playerId: 'player-ava', teamId: 'team-varsity', seasonId: 'season-2026', jerseyNumber: '12', position: 'OH', status: 'active', captain: true, libero: false, starter: true, notes: '', createdAt: now },
    { id: 'roster-mia', playerId: 'player-mia', teamId: 'team-varsity', seasonId: 'season-2026', jerseyNumber: '4', position: 'S', status: 'active', captain: false, libero: false, starter: true, notes: '', createdAt: now },
    { id: 'roster-zoe', playerId: 'player-zoe', teamId: 'team-varsity', seasonId: 'season-2026', jerseyNumber: '7', position: 'L', status: 'active', captain: false, libero: true, starter: true, notes: '', createdAt: now }
  ],
  activeOrganizationId: 'org-hartsville',
  activeTeamId: 'team-varsity',
  activeSeasonId: 'season-2026'
};

type WorkspaceContextValue = WorkspaceData & {
  activeOrganization?: Organization;
  activeTeam?: Team;
  activeSeason?: Season;
  addOrganization: (input: OrganizationInput) => void;
  addTeam: (input: TeamInput) => void;
  addSeason: (input: SeasonInput) => void;
  addPlayer: (input: PlayerInput) => string;
  updatePlayer: (id: string, input: PlayerInput) => void;
  addRosterMembership: (input: RosterMembershipInput) => void;
  updateRosterMembership: (id: string, input: RosterMembershipInput) => void;
  setActiveOrganization: (id: string) => void;
  setActiveTeam: (id: string) => void;
  setActiveSeason: (id: string) => void;
  archiveOrganization: (id: string) => void;
  archiveTeam: (id: string) => void;
  archiveSeason: (id: string) => void;
  archivePlayer: (id: string) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function readWorkspace(): WorkspaceData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return seedWorkspace;
    const parsed = JSON.parse(stored) as Partial<WorkspaceData>;
    return {
      ...seedWorkspace,
      ...parsed,
      organizations: parsed.organizations ?? seedWorkspace.organizations,
      teams: parsed.teams ?? seedWorkspace.teams,
      seasons: parsed.seasons ?? seedWorkspace.seasons,
      players: parsed.players ?? seedWorkspace.players,
      rosterMemberships: parsed.rosterMemberships ?? seedWorkspace.rosterMemberships
    };
  } catch {
    return seedWorkspace;
  }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<WorkspaceData>(readWorkspace);

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace)), [workspace]);

  const value = useMemo<WorkspaceContextValue>(() => {
    const activeOrganization = workspace.organizations.find((item) => item.id === workspace.activeOrganizationId);
    const activeTeam = workspace.teams.find((item) => item.id === workspace.activeTeamId);
    const activeSeason = workspace.seasons.find((item) => item.id === workspace.activeSeasonId);

    return {
      ...workspace,
      activeOrganization,
      activeTeam,
      activeSeason,
      addOrganization: (input) => {
        const organization: Organization = { ...input, id: makeId('org'), archived: false, createdAt: new Date().toISOString() };
        setWorkspace((current) => ({ ...current, organizations: [...current.organizations, organization], activeOrganizationId: organization.id, activeTeamId: '', activeSeasonId: '' }));
      },
      addTeam: (input) => {
        const team: Team = { ...input, id: makeId('team'), archived: false, createdAt: new Date().toISOString() };
        setWorkspace((current) => ({ ...current, teams: [...current.teams, team], activeOrganizationId: team.organizationId, activeTeamId: team.id, activeSeasonId: '' }));
      },
      addSeason: (input) => {
        const season: Season = { ...input, id: makeId('season'), archived: false, createdAt: new Date().toISOString() };
        setWorkspace((current) => ({ ...current, seasons: [...current.seasons, season], activeTeamId: season.teamId, activeSeasonId: season.id }));
      },
      addPlayer: (input) => {
        const player: Player = { ...input, id: makeId('player'), archived: false, createdAt: new Date().toISOString() };
        setWorkspace((current) => ({ ...current, players: [...current.players, player] }));
        return player.id;
      },
      updatePlayer: (id, input) => setWorkspace((current) => ({ ...current, players: current.players.map((player) => player.id === id ? { ...player, ...input } : player) })),
      addRosterMembership: (input) => {
        const membership: RosterMembership = { ...input, id: makeId('roster'), createdAt: new Date().toISOString() };
        setWorkspace((current) => ({ ...current, rosterMemberships: [...current.rosterMemberships, membership] }));
      },
      updateRosterMembership: (id, input) => setWorkspace((current) => ({ ...current, rosterMemberships: current.rosterMemberships.map((membership) => membership.id === id ? { ...membership, ...input } : membership) })),
      setActiveOrganization: (id) => {
        const nextTeam = workspace.teams.find((team) => team.organizationId === id && !team.archived);
        const nextSeason = nextTeam ? workspace.seasons.find((season) => season.teamId === nextTeam.id && !season.archived) : undefined;
        setWorkspace((current) => ({ ...current, activeOrganizationId: id, activeTeamId: nextTeam?.id ?? '', activeSeasonId: nextSeason?.id ?? '' }));
      },
      setActiveTeam: (id) => {
        const team = workspace.teams.find((item) => item.id === id);
        const nextSeason = workspace.seasons.find((season) => season.teamId === id && !season.archived);
        setWorkspace((current) => ({ ...current, activeOrganizationId: team?.organizationId ?? current.activeOrganizationId, activeTeamId: id, activeSeasonId: nextSeason?.id ?? '' }));
      },
      setActiveSeason: (id) => setWorkspace((current) => ({ ...current, activeSeasonId: id })),
      archiveOrganization: (id) => setWorkspace((current) => ({ ...current, organizations: current.organizations.map((item) => item.id === id ? { ...item, archived: true } : item), activeOrganizationId: current.activeOrganizationId === id ? '' : current.activeOrganizationId, activeTeamId: current.activeOrganizationId === id ? '' : current.activeTeamId, activeSeasonId: current.activeOrganizationId === id ? '' : current.activeSeasonId })),
      archiveTeam: (id) => setWorkspace((current) => ({ ...current, teams: current.teams.map((item) => item.id === id ? { ...item, archived: true } : item), activeTeamId: current.activeTeamId === id ? '' : current.activeTeamId, activeSeasonId: current.activeTeamId === id ? '' : current.activeSeasonId })),
      archiveSeason: (id) => setWorkspace((current) => ({ ...current, seasons: current.seasons.map((item) => item.id === id ? { ...item, archived: true, status: 'archived' } : item), activeSeasonId: current.activeSeasonId === id ? '' : current.activeSeasonId })),
      archivePlayer: (id) => setWorkspace((current) => ({ ...current, players: current.players.map((player) => player.id === id ? { ...player, archived: true } : player) }))
    };
  }, [workspace]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return context;
}