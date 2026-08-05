import type { FormationType, LogicalPoint, SystemRole } from '../types';
import { ZONE_BASE } from '../types';

export type RoleZoneMap = Record<Exclude<SystemRole, 'libero'>, 1 | 2 | 3 | 4 | 5 | 6>;

/** Rotation 1 zone for each on-court role before clockwise advances. */
export const FIVE_ONE_BASE_ZONES: RoleZoneMap = {
  setter: 1,
  opposite: 2,
  middle1: 3,
  outside1: 4,
  middle2: 5,
  outside2: 6,
  setter1: 1,
  setter2: 2
};

export const FOUR_TWO_BASE_ZONES: RoleZoneMap = {
  setter1: 1,
  outside1: 2,
  middle1: 3,
  setter2: 4,
  outside2: 5,
  middle2: 6,
  setter: 1,
  opposite: 2
};

export const SIX_TWO_BASE_ZONES: RoleZoneMap = {
  setter1: 1,
  opposite: 2,
  middle1: 3,
  outside1: 4,
  middle2: 5,
  outside2: 6,
  setter: 1,
  setter2: 4
};

const ZONE_ORDER: Array<1 | 2 | 3 | 4 | 5 | 6> = [1, 2, 3, 4, 5, 6];

export function advanceZone(zone: 1 | 2 | 3 | 4 | 5 | 6, steps: number): 1 | 2 | 3 | 4 | 5 | 6 {
  const index = ZONE_ORDER.indexOf(zone);
  return ZONE_ORDER[(index + steps) % 6];
}

export function zoneForRole(
  base: RoleZoneMap,
  role: Exclude<SystemRole, 'libero'>,
  rotation: number
): 1 | 2 | 3 | 4 | 5 | 6 {
  return advanceZone(base[role], rotation - 1);
}

function offset(point: LogicalPoint, dx: number, dy: number): LogicalPoint {
  return {
    x: Math.min(0.96, Math.max(0.04, point.x + dx)),
    y: Math.min(0.94, Math.max(0.08, point.y + dy))
  };
}

/** Smart default offsets from legal zone centers. Fully editable by the coach. */
export function formationPoint(
  zone: 1 | 2 | 3 | 4 | 5 | 6,
  type: FormationType,
  role: SystemRole
): LogicalPoint {
  const base = ZONE_BASE[zone];
  const isSetter = role === 'setter' || role === 'setter1' || role === 'setter2';
  const isMiddle = role === 'middle1' || role === 'middle2';
  const isOutside = role === 'outside1' || role === 'outside2';
  const front = zone === 2 || zone === 3 || zone === 4;

  switch (type) {
    case 'home':
      return base;
    case 'receive':
      if (isSetter) return offset(base, front ? 0.04 : 0.08, front ? -0.08 : 0.18);
      if (isMiddle && !front) return offset(base, 0, 0.12);
      if (isMiddle && front) return offset(base, 0, 0.04);
      if (isOutside) return offset(base, zone === 4 || zone === 5 ? -0.02 : 0.02, front ? -0.2 : 0.02);
      return offset(base, 0, front ? -0.12 : 0.06);
    case 'attack-receive':
      if (isSetter) return { x: 0.72, y: 0.7 };
      if (role === 'outside1' || (isOutside && zone === 4)) return { x: 0.14, y: 0.82 };
      if (role === 'outside2' || (isOutside && zone === 2)) return { x: 0.86, y: 0.82 };
      if (isMiddle) return { x: 0.5, y: 0.84 };
      if (role === 'opposite') return front ? { x: 0.84, y: 0.8 } : { x: 0.78, y: 0.42 };
      return offset(base, 0, 0.1);
    case 'serve':
      if (zone === 1) return { x: 0.82, y: 0.1 };
      if (isSetter && !front) return offset(base, 0.05, 0.05);
      return offset(base, zone === 4 || zone === 5 ? 0.04 : zone === 2 ? -0.04 : 0, front ? -0.04 : 0.02);
    case 'defense':
      if (front) return offset(base, 0, -0.06);
      if (zone === 1) return { x: 0.78, y: 0.24 };
      if (zone === 5) return { x: 0.22, y: 0.24 };
      return { x: 0.5, y: 0.2 };
    case 'attack-defense':
      if (isSetter) return { x: 0.7, y: 0.68 };
      if (front && isOutside) return offset(base, zone === 4 ? -0.04 : 0.04, 0.04);
      if (front && isMiddle) return { x: 0.5, y: 0.82 };
      return offset(base, 0, 0.08);
    case 'defense-left':
      return offset(
        formationPoint(zone, 'defense', role),
        front ? -0.08 : -0.1,
        front ? 0 : 0.02
      );
    case 'defense-right':
      return offset(
        formationPoint(zone, 'defense', role),
        front ? 0.08 : 0.1,
        front ? 0 : 0.02
      );
    default:
      return base;
  }
}

export function ballForFormation(type: FormationType): LogicalPoint {
  switch (type) {
    case 'serve':
      return { x: 0.82, y: 0.04 };
    case 'receive':
      return { x: 0.5, y: 0.55 };
    case 'attack-receive':
    case 'attack-defense':
      return { x: 0.7, y: 0.72 };
    case 'defense':
    case 'defense-left':
    case 'defense-right':
      return { x: 0.5, y: 0.88 };
    default:
      return { x: 0.5, y: 0.55 };
  }
}
