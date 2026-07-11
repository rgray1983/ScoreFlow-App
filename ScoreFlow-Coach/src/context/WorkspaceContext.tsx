import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  Organization,
  OrganizationInput,
  Season,
  SeasonInput,
  Team,
  TeamInput,
  WorkspaceData
} from '../types/workspace';

const STORAGE_KEY = 'scoreflow-coach-workspace-v1';

const seedWorkspace: WorkspaceData = {
  organizations: [
    {
      id: 'org-hartsville',
      name: 'Hartsville High School',
      type: 'school',
      city: 'Hartsville',
      state: 'SC',
      archived: false,
      createdAt: new Date().toISOString()
    }
  ],
  teams: [
    {
      id: 'team-varsity',
      organizationId: 'org-hartsville',
      name: 'Hartsville Red Foxes',
      level: 'Varsity',
      abbreviation: 'HF',
      primaryColor: '#ef3340',
      secondaryColor: '#f4c95d',
      homeCourt: 'Hartsville High School Gym',
      archived: false,
      createdAt: new Date().toISOString()
    }
  ],
  seasons: [
    {
      id: 'season-2026',
      teamId: 'team-varsity',
      name: '2026 School Season',
      startDate: '2026-08-01',
      endDate: '2026-11-15',
      status: 'active',
      archived: false,
      createdAt: new Date().toISOString()
    }
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
  setActiveOrganization: (id: string) => void;
  setActiveTeam: (id: string) => void;
  setActiveSeason: (id: string) => void;
  archiveOrganization: (id: string) => void;
  archiveTeam: (id: string) => void;
  archiveSeason: (id: string) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readWorkspace(): WorkspaceData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as WorkspaceData) : seedWorkspace;
  } catch {
    return seedWorkspace;
  }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<WorkspaceData>(readWorkspace);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  }, [workspace]);

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
        const organization: Organization = {
          ...input,
          id: makeId('org'),
          archived: false,
          createdAt: new Date().toISOString()
        };
        setWorkspace((current) => ({
          ...current,
          organizations: [...current.organizations, organization],
          activeOrganizationId: organization.id,
          activeTeamId: '',
          activeSeasonId: ''
        }));
      },
      addTeam: (input) => {
        const team: Team = {
          ...input,
          id: makeId('team'),
          archived: false,
          createdAt: new Date().toISOString()
        };
        setWorkspace((current) => ({
          ...current,
          teams: [...current.teams, team],
          activeOrganizationId: team.organizationId,
          activeTeamId: team.id,
          activeSeasonId: ''
        }));
      },
      addSeason: (input) => {
        const season: Season = {
          ...input,
          id: makeId('season'),
          archived: false,
          createdAt: new Date().toISOString()
        };
        setWorkspace((current) => ({
          ...current,
          seasons: [...current.seasons, season],
          activeTeamId: season.teamId,
          activeSeasonId: season.id
        }));
      },
      setActiveOrganization: (id) => {
        const nextTeam = workspace.teams.find((team) => team.organizationId === id && !team.archived);
        const nextSeason = nextTeam
          ? workspace.seasons.find((season) => season.teamId === nextTeam.id && !season.archived)
          : undefined;
        setWorkspace((current) => ({
          ...current,
          activeOrganizationId: id,
          activeTeamId: nextTeam?.id ?? '',
          activeSeasonId: nextSeason?.id ?? ''
        }));
      },
      setActiveTeam: (id) => {
        const team = workspace.teams.find((item) => item.id === id);
        const nextSeason = workspace.seasons.find((season) => season.teamId === id && !season.archived);
        setWorkspace((current) => ({
          ...current,
          activeOrganizationId: team?.organizationId ?? current.activeOrganizationId,
          activeTeamId: id,
          activeSeasonId: nextSeason?.id ?? ''
        }));
      },
      setActiveSeason: (id) => setWorkspace((current) => ({ ...current, activeSeasonId: id })),
      archiveOrganization: (id) => setWorkspace((current) => ({
        ...current,
        organizations: current.organizations.map((item) => item.id === id ? { ...item, archived: true } : item),
        activeOrganizationId: current.activeOrganizationId === id ? '' : current.activeOrganizationId,
        activeTeamId: current.activeOrganizationId === id ? '' : current.activeTeamId,
        activeSeasonId: current.activeOrganizationId === id ? '' : current.activeSeasonId
      })),
      archiveTeam: (id) => setWorkspace((current) => ({
        ...current,
        teams: current.teams.map((item) => item.id === id ? { ...item, archived: true } : item),
        activeTeamId: current.activeTeamId === id ? '' : current.activeTeamId,
        activeSeasonId: current.activeTeamId === id ? '' : current.activeSeasonId
      })),
      archiveSeason: (id) => setWorkspace((current) => ({
        ...current,
        seasons: current.seasons.map((item) => item.id === id ? { ...item, archived: true, status: 'archived' } : item),
        activeSeasonId: current.activeSeasonId === id ? '' : current.activeSeasonId
      }))
    };
  }, [workspace]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return context;
}
