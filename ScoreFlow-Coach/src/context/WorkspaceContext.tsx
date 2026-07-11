import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  Organization, OrganizationInput, Player, PlayerInput, RosterMembership, RosterMembershipInput,
  ScheduleEvent, ScheduleEventInput, Season, SeasonInput, Team, TeamInput, WorkspaceData
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
  scheduleEvents: [
    { id: 'event-home-match', teamId: 'team-varsity', seasonId: 'season-2026', type: 'match', title: 'Home vs. Camden', date: '2026-08-20', startTime: '18:00', arrivalTime: '16:45', endTime: '', opponent: 'Camden Bulldogs', locationType: 'home', venue: 'Hartsville High School Gym', address: '', court: 'Main Court', travelNotes: '', notes: '', status: 'scheduled', createdAt: now, updatedAt: now },
    { id: 'event-practice', teamId: 'team-varsity', seasonId: 'season-2026', type: 'practice', title: 'Serve receive practice', date: '2026-08-18', startTime: '15:30', arrivalTime: '15:15', endTime: '17:30', opponent: '', locationType: 'home', venue: 'Hartsville High School Gym', address: '', court: 'Main Court', travelNotes: '', notes: 'Focus on rotations 2 and 5.', status: 'scheduled', createdAt: now, updatedAt: now }
  ],
  activeOrganizationId: 'org-hartsville', activeTeamId: 'team-varsity', activeSeasonId: 'season-2026'
};

type WorkspaceContextValue = WorkspaceData & {
  activeOrganization?: Organization; activeTeam?: Team; activeSeason?: Season;
  addOrganization: (input: OrganizationInput) => void; addTeam: (input: TeamInput) => void; addSeason: (input: SeasonInput) => void;
  addPlayer: (input: PlayerInput) => string; updatePlayer: (id: string, input: PlayerInput) => void;
  addRosterMembership: (input: RosterMembershipInput) => void; updateRosterMembership: (id: string, input: RosterMembershipInput) => void;
  addScheduleEvent: (input: ScheduleEventInput) => string; updateScheduleEvent: (id: string, input: ScheduleEventInput) => void; deleteScheduleEvent: (id: string) => void;
  setActiveOrganization: (id: string) => void; setActiveTeam: (id: string) => void; setActiveSeason: (id: string) => void;
  archiveOrganization: (id: string) => void; archiveTeam: (id: string) => void; archiveSeason: (id: string) => void; archivePlayer: (id: string) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function readWorkspace(): WorkspaceData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return seedWorkspace;
    const parsed = JSON.parse(stored) as Partial<WorkspaceData>;
    return { ...seedWorkspace, ...parsed,
      organizations: parsed.organizations ?? seedWorkspace.organizations,
      teams: parsed.teams ?? seedWorkspace.teams,
      seasons: parsed.seasons ?? seedWorkspace.seasons,
      players: parsed.players ?? seedWorkspace.players,
      rosterMemberships: parsed.rosterMemberships ?? seedWorkspace.rosterMemberships,
      scheduleEvents: parsed.scheduleEvents ?? seedWorkspace.scheduleEvents
    };
  } catch { return seedWorkspace; }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<WorkspaceData>(readWorkspace);
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace)), [workspace]);

  const value = useMemo<WorkspaceContextValue>(() => {
    const activeOrganization = workspace.organizations.find((item) => item.id === workspace.activeOrganizationId);
    const activeTeam = workspace.teams.find((item) => item.id === workspace.activeTeamId);
    const activeSeason = workspace.seasons.find((item) => item.id === workspace.activeSeasonId);
    return { ...workspace, activeOrganization, activeTeam, activeSeason,
      addOrganization: (input) => { const item: Organization = { ...input, id: makeId('org'), archived: false, createdAt: new Date().toISOString() }; setWorkspace((c) => ({ ...c, organizations: [...c.organizations, item], activeOrganizationId: item.id, activeTeamId: '', activeSeasonId: '' })); },
      addTeam: (input) => { const item: Team = { ...input, id: makeId('team'), archived: false, createdAt: new Date().toISOString() }; setWorkspace((c) => ({ ...c, teams: [...c.teams, item], activeOrganizationId: item.organizationId, activeTeamId: item.id, activeSeasonId: '' })); },
      addSeason: (input) => { const item: Season = { ...input, id: makeId('season'), archived: false, createdAt: new Date().toISOString() }; setWorkspace((c) => ({ ...c, seasons: [...c.seasons, item], activeTeamId: item.teamId, activeSeasonId: item.id })); },
      addPlayer: (input) => { const item: Player = { ...input, id: makeId('player'), archived: false, createdAt: new Date().toISOString() }; setWorkspace((c) => ({ ...c, players: [...c.players, item] })); return item.id; },
      updatePlayer: (id, input) => setWorkspace((c) => ({ ...c, players: c.players.map((x) => x.id === id ? { ...x, ...input } : x) })),
      addRosterMembership: (input) => { const item: RosterMembership = { ...input, id: makeId('roster'), createdAt: new Date().toISOString() }; setWorkspace((c) => ({ ...c, rosterMemberships: [...c.rosterMemberships, item] })); },
      updateRosterMembership: (id, input) => setWorkspace((c) => ({ ...c, rosterMemberships: c.rosterMemberships.map((x) => x.id === id ? { ...x, ...input } : x) })),
      addScheduleEvent: (input) => { const stamp = new Date().toISOString(); const item: ScheduleEvent = { ...input, id: makeId('event'), createdAt: stamp, updatedAt: stamp }; setWorkspace((c) => ({ ...c, scheduleEvents: [...c.scheduleEvents, item] })); return item.id; },
      updateScheduleEvent: (id, input) => setWorkspace((c) => ({ ...c, scheduleEvents: c.scheduleEvents.map((x) => x.id === id ? { ...x, ...input, updatedAt: new Date().toISOString() } : x) })),
      deleteScheduleEvent: (id) => setWorkspace((c) => ({ ...c, scheduleEvents: c.scheduleEvents.filter((x) => x.id !== id) })),
      setActiveOrganization: (id) => { const nextTeam = workspace.teams.find((x) => x.organizationId === id && !x.archived); const nextSeason = nextTeam ? workspace.seasons.find((x) => x.teamId === nextTeam.id && !x.archived) : undefined; setWorkspace((c) => ({ ...c, activeOrganizationId: id, activeTeamId: nextTeam?.id ?? '', activeSeasonId: nextSeason?.id ?? '' })); },
      setActiveTeam: (id) => { const team = workspace.teams.find((x) => x.id === id); const nextSeason = workspace.seasons.find((x) => x.teamId === id && !x.archived); setWorkspace((c) => ({ ...c, activeOrganizationId: team?.organizationId ?? c.activeOrganizationId, activeTeamId: id, activeSeasonId: nextSeason?.id ?? '' })); },
      setActiveSeason: (id) => setWorkspace((c) => ({ ...c, activeSeasonId: id })),
      archiveOrganization: (id) => setWorkspace((c) => ({ ...c, organizations: c.organizations.map((x) => x.id === id ? { ...x, archived: true } : x), activeOrganizationId: c.activeOrganizationId === id ? '' : c.activeOrganizationId, activeTeamId: c.activeOrganizationId === id ? '' : c.activeTeamId, activeSeasonId: c.activeOrganizationId === id ? '' : c.activeSeasonId })),
      archiveTeam: (id) => setWorkspace((c) => ({ ...c, teams: c.teams.map((x) => x.id === id ? { ...x, archived: true } : x), activeTeamId: c.activeTeamId === id ? '' : c.activeTeamId, activeSeasonId: c.activeTeamId === id ? '' : c.activeSeasonId })),
      archiveSeason: (id) => setWorkspace((c) => ({ ...c, seasons: c.seasons.map((x) => x.id === id ? { ...x, archived: true, status: 'archived' } : x), activeSeasonId: c.activeSeasonId === id ? '' : c.activeSeasonId })),
      archivePlayer: (id) => setWorkspace((c) => ({ ...c, players: c.players.map((x) => x.id === id ? { ...x, archived: true } : x) }))
    };
  }, [workspace]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() { const context = useContext(WorkspaceContext); if (!context) throw new Error('useWorkspace must be used inside WorkspaceProvider'); return context; }
