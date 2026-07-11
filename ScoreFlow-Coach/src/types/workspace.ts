export type OrganizationType = 'school' | 'club' | 'independent';
export type SeasonStatus = 'active' | 'upcoming' | 'completed' | 'archived';
export type PlayerStatus = 'active' | 'limited' | 'injured' | 'away' | 'inactive' | 'graduated' | 'guest';
export type DominantHand = 'right' | 'left' | 'ambidextrous';
export type ScheduleEventType = 'match' | 'practice' | 'tournament' | 'scrimmage' | 'team-event';
export type ScheduleEventStatus = 'draft' | 'scheduled' | 'changed' | 'cancelled' | 'completed';
export type ScheduleLocationType = 'home' | 'away' | 'neutral';

export type Organization = { id:string; name:string; type:OrganizationType; city:string; state:string; archived:boolean; createdAt:string };
export type Team = { id:string; organizationId:string; name:string; level:string; abbreviation:string; primaryColor:string; secondaryColor:string; homeCourt:string; archived:boolean; createdAt:string };
export type Season = { id:string; teamId:string; name:string; startDate:string; endDate:string; status:SeasonStatus; archived:boolean; createdAt:string };
export type Player = { id:string; organizationId:string; firstName:string; lastName:string; preferredName:string; graduationYear:string; height:string; dominantHand:DominantHand; primaryPosition:string; secondaryPosition:string; notes:string; archived:boolean; createdAt:string };
export type RosterMembership = { id:string; playerId:string; teamId:string; seasonId:string; jerseyNumber:string; position:string; status:PlayerStatus; captain:boolean; libero:boolean; starter:boolean; notes:string; createdAt:string };
export type ScheduleEvent = { id:string; teamId:string; seasonId:string; type:ScheduleEventType; title:string; date:string; startTime:string; arrivalTime:string; endTime:string; opponent:string; locationType:ScheduleLocationType; venue:string; address:string; court:string; travelNotes:string; notes:string; status:ScheduleEventStatus; createdAt:string; updatedAt:string };

export type WorkspaceData = { organizations:Organization[]; teams:Team[]; seasons:Season[]; players:Player[]; rosterMemberships:RosterMembership[]; scheduleEvents:ScheduleEvent[]; activeOrganizationId:string; activeTeamId:string; activeSeasonId:string };
export type OrganizationInput = Pick<Organization,'name'|'type'|'city'|'state'>;
export type TeamInput = Pick<Team,'organizationId'|'name'|'level'|'abbreviation'|'primaryColor'|'secondaryColor'|'homeCourt'>;
export type SeasonInput = Pick<Season,'teamId'|'name'|'startDate'|'endDate'|'status'>;
export type PlayerInput = Pick<Player,'organizationId'|'firstName'|'lastName'|'preferredName'|'graduationYear'|'height'|'dominantHand'|'primaryPosition'|'secondaryPosition'|'notes'>;
export type RosterMembershipInput = Pick<RosterMembership,'playerId'|'teamId'|'seasonId'|'jerseyNumber'|'position'|'status'|'captain'|'libero'|'starter'|'notes'>;
export type ScheduleEventInput = Pick<ScheduleEvent,'teamId'|'seasonId'|'type'|'title'|'date'|'startTime'|'arrivalTime'|'endTime'|'opponent'|'locationType'|'venue'|'address'|'court'|'travelNotes'|'notes'|'status'>;