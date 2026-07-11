export type OrganizationType = 'school' | 'club' | 'independent';
export type SeasonStatus = 'active' | 'upcoming' | 'completed' | 'archived';

export type Organization = {
  id: string;
  name: string;
  type: OrganizationType;
  city: string;
  state: string;
  archived: boolean;
  createdAt: string;
};

export type Team = {
  id: string;
  organizationId: string;
  name: string;
  level: string;
  abbreviation: string;
  primaryColor: string;
  secondaryColor: string;
  homeCourt: string;
  archived: boolean;
  createdAt: string;
};

export type Season = {
  id: string;
  teamId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: SeasonStatus;
  archived: boolean;
  createdAt: string;
};

export type WorkspaceData = {
  organizations: Organization[];
  teams: Team[];
  seasons: Season[];
  activeOrganizationId: string;
  activeTeamId: string;
  activeSeasonId: string;
};

export type OrganizationInput = Pick<Organization, 'name' | 'type' | 'city' | 'state'>;
export type TeamInput = Pick<Team, 'organizationId' | 'name' | 'level' | 'abbreviation' | 'primaryColor' | 'secondaryColor' | 'homeCourt'>;
export type SeasonInput = Pick<Season, 'teamId' | 'name' | 'startDate' | 'endDate' | 'status'>;
