import type {
  Formation,
  FormationType,
  RoleAssignments,
  Rotation,
  RotationPlan,
  RotationSystem,
  SystemRole
} from '../types';
import { FORMATION_SEQUENCE, rolesForSystem, systemUsesLibero } from '../types';
import { fourTwoZones } from './fourTwo';
import { fiveOneZones } from './fiveOne';
import { sixTwoZones } from './sixTwo';
import {
  ballForFormation,
  formationPoint,
  zoneForRole,
  type RoleZoneMap
} from './layoutMath';

function zonesForSystem(system: RotationSystem): RoleZoneMap {
  switch (system) {
    case '4-2':
      return fourTwoZones;
    case '6-2':
    case '6-2-no-libero':
      return sixTwoZones;
    case '5-1':
    case '5-1-no-libero':
    case 'custom':
    default:
      return fiveOneZones;
  }
}

function courtRoles(system: RotationSystem): Array<Exclude<SystemRole, 'libero'>> {
  return rolesForSystem(system).filter((role): role is Exclude<SystemRole, 'libero'> => role !== 'libero');
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function buildFormation(
  system: RotationSystem,
  rotationNumber: number,
  type: FormationType,
  name: string,
  assignments: RoleAssignments
): Formation {
  const zones = zonesForSystem(system);
  const roles = courtRoles(system);
  const playerPositions = roles.map((role) => {
    const zone = zoneForRole(zones, role, rotationNumber);
    return {
      playerId: assignments[role] ?? '',
      role,
      zone,
      point: formationPoint(zone, type, role)
    };
  });

  const serverRole = roles.find((role) => zoneForRole(zones, role, rotationNumber) === 1) ?? roles[0];
  const liberoId = assignments.libero ?? '';
  const backMiddle = playerPositions.find((item) => item.zone === 5 || item.zone === 6 || item.zone === 1);
  const replaced = playerPositions.find((item) => item.role === 'middle1' || item.role === 'middle2');

  return {
    id: makeId(`formation-${type}`),
    type,
    name,
    playerPositions,
    ballPosition: ballForFormation(type),
    serverPlayerId: type === 'serve' ? (assignments[serverRole] ?? '') : '',
    liberoReplacement:
      systemUsesLibero(system) && liberoId && replaced
        ? {
            liberoPlayerId: liberoId,
            replacedPlayerId: replaced.playerId,
            active: type === 'receive' || type === 'defense' || type === 'defense-left' || type === 'defense-right'
          }
        : null,
    substitutions: buildSuggestedSubs(system, rotationNumber, assignments),
    annotations: [],
    notes: ''
  };
}

function buildSuggestedSubs(
  system: RotationSystem,
  rotationNumber: number,
  assignments: RoleAssignments
): Formation['substitutions'] {
  // 6-2 / 4-2 often look at setter specialist swaps around mid rotations.
  if ((system === '6-2' || system === '6-2-no-libero') && rotationNumber === 4) {
    const setterFront = assignments.setter2;
    const specialist = assignments.opposite || assignments.outside1;
    if (setterFront && specialist && setterFront !== specialist) {
      return [
        {
          inPlayerId: specialist,
          outPlayerId: setterFront,
          note: 'Suggested specialist for front-row setter slot',
          accepted: false
        }
      ];
    }
  }
  return [];
}

export function buildRotations(system: RotationSystem, assignments: RoleAssignments): Rotation[] {
  return ([1, 2, 3, 4, 5, 6] as const).map((number) => ({
    number,
    formations: FORMATION_SEQUENCE.map((item) =>
      buildFormation(system, number, item.type, item.name, assignments)
    )
  }));
}

export function createRotationPlan(input: {
  organizationId: string;
  teamId: string;
  seasonId: string;
  name: string;
  system: RotationSystem;
  roleAssignments: RoleAssignments;
}): RotationPlan {
  const stamp = new Date().toISOString();
  return {
    id: makeId('rotation-plan'),
    organizationId: input.organizationId,
    teamId: input.teamId,
    seasonId: input.seasonId,
    name: input.name,
    system: input.system,
    useLibero: systemUsesLibero(input.system),
    roleAssignments: input.roleAssignments,
    rotations: buildRotations(input.system, input.roleAssignments),
    createdAt: stamp,
    updatedAt: stamp
  };
}

export function rebuildPlanFormations(plan: RotationPlan): RotationPlan {
  return {
    ...plan,
    useLibero: systemUsesLibero(plan.system),
    rotations: buildRotations(plan.system, plan.roleAssignments),
    updatedAt: new Date().toISOString()
  };
}

export function suggestRoleAssignments(
  system: RotationSystem,
  roster: Array<{
    id: string;
    position: string;
    primaryPosition: string;
    libero: boolean;
    starter: boolean;
  }>
): RoleAssignments {
  const roles = rolesForSystem(system);
  const used = new Set<string>();
  const assignments: RoleAssignments = {};

  const take = (predicate: (row: (typeof roster)[number]) => boolean) => {
    const row = roster.find((item) => !used.has(item.id) && predicate(item));
    if (!row) return '';
    used.add(row.id);
    return row.id;
  };

  for (const role of roles) {
    if (role === 'libero') {
      assignments.libero = take((row) => row.libero || /libero/i.test(row.position) || /libero/i.test(row.primaryPosition));
      continue;
    }
    if (role === 'setter' || role === 'setter1') {
      assignments[role] = take((row) => /^s$/i.test(row.position) || /setter/i.test(row.primaryPosition));
      continue;
    }
    if (role === 'setter2') {
      assignments.setter2 = take((row) => /^s$/i.test(row.position) || /setter/i.test(row.primaryPosition));
      continue;
    }
    if (role === 'opposite') {
      assignments.opposite = take((row) => /opp|rs/i.test(row.position) || /opposite|right/i.test(row.primaryPosition));
      continue;
    }
    if (role === 'outside1' || role === 'outside2') {
      assignments[role] = take((row) => /oh|ds/i.test(row.position) || /outside|defensive/i.test(row.primaryPosition));
      continue;
    }
    if (role === 'middle1' || role === 'middle2') {
      assignments[role] = take((row) => /mb|m/i.test(row.position) || /middle/i.test(row.primaryPosition));
    }
  }

  // Fill remaining court roles with unused starters / players.
  for (const role of roles) {
    if (role === 'libero') continue;
    if (assignments[role]) continue;
    assignments[role] = take((row) => !row.libero && row.starter) || take((row) => !row.libero);
  }

  return assignments;
}
