export type CourtPoint = { x: number; y: number };

/** Normalized logical court space: x 0=left … 1=right, y 0=near/back … 1=far/net */
export type LogicalPoint = CourtPoint;

export type RotationSystem =
  | '4-2'
  | '5-1'
  | '5-1-no-libero'
  | '6-2'
  | '6-2-no-libero'
  | 'custom';

export type FormationType =
  | 'home'
  | 'receive'
  | 'attack-receive'
  | 'serve'
  | 'defense'
  | 'attack-defense'
  | 'defense-left'
  | 'defense-right';

export type SystemRole =
  | 'setter'
  | 'setter1'
  | 'setter2'
  | 'opposite'
  | 'outside1'
  | 'outside2'
  | 'middle1'
  | 'middle2'
  | 'libero';

export type FormationPlayerPosition = {
  playerId: string;
  role: SystemRole | 'custom';
  zone: 1 | 2 | 3 | 4 | 5 | 6;
  point: LogicalPoint;
};

export type FormationSubstitution = {
  inPlayerId: string;
  outPlayerId: string;
  note: string;
  accepted: boolean;
};

export type LiberoReplacement = {
  liberoPlayerId: string;
  replacedPlayerId: string;
  active: boolean;
};

export type FormationAnnotation = {
  id: string;
  label: string;
  point: LogicalPoint;
};

export type Formation = {
  id: string;
  type: FormationType;
  name: string;
  playerPositions: FormationPlayerPosition[];
  ballPosition: LogicalPoint;
  serverPlayerId: string;
  liberoReplacement: LiberoReplacement | null;
  substitutions: FormationSubstitution[];
  annotations: FormationAnnotation[];
  notes: string;
};

export type Rotation = {
  number: 1 | 2 | 3 | 4 | 5 | 6;
  formations: Formation[];
};

export type RoleAssignments = Partial<Record<SystemRole, string>>;

export type RotationPlan = {
  id: string;
  organizationId: string;
  teamId: string;
  seasonId: string;
  name: string;
  system: RotationSystem;
  useLibero: boolean;
  roleAssignments: RoleAssignments;
  rotations: Rotation[];
  createdAt: string;
  updatedAt: string;
};

export type StudioPlayer = {
  id: string;
  name: string;
  number: string;
  position: string;
  captain: boolean;
  libero: boolean;
  photoUrl: string;
  primaryPosition: string;
  starter: boolean;
};

export const FORMATION_SEQUENCE: { type: FormationType; name: string; short: string }[] = [
  { type: 'home', name: 'Home / Base', short: 'HOME' },
  { type: 'receive', name: 'Serve Receive', short: 'RECEIVE' },
  { type: 'attack-receive', name: 'Attack after Receive', short: 'ATTACK' },
  { type: 'serve', name: 'Serve / Stack', short: 'SERVE' },
  { type: 'defense', name: 'Defense / Base', short: 'DEFENSE' },
  { type: 'attack-defense', name: 'Attack after Defense', short: 'ATTACK' },
  { type: 'defense-left', name: 'Defense Left', short: 'LEFT' },
  { type: 'defense-right', name: 'Defense Right', short: 'RIGHT' }
];

export const SYSTEM_OPTIONS: { id: RotationSystem; label: string; useLibero: boolean }[] = [
  { id: '4-2', label: '4–2', useLibero: true },
  { id: '5-1', label: '5–1', useLibero: true },
  { id: '5-1-no-libero', label: '5–1 without Libero', useLibero: false },
  { id: '6-2', label: '6–2', useLibero: true },
  { id: '6-2-no-libero', label: '6–2 without Libero', useLibero: false },
  { id: 'custom', label: 'Custom', useLibero: true }
];

export const ZONE_BASE: Record<1 | 2 | 3 | 4 | 5 | 6, LogicalPoint> = {
  4: { x: 0.18, y: 0.78 },
  3: { x: 0.5, y: 0.78 },
  2: { x: 0.82, y: 0.78 },
  5: { x: 0.18, y: 0.28 },
  6: { x: 0.5, y: 0.28 },
  1: { x: 0.82, y: 0.22 }
};

export function systemUsesLibero(system: RotationSystem): boolean {
  return system === '4-2' || system === '5-1' || system === '6-2' || system === 'custom';
}

export function rolesForSystem(system: RotationSystem): SystemRole[] {
  switch (system) {
    case '4-2':
      return ['setter1', 'setter2', 'outside1', 'outside2', 'middle1', 'middle2', 'libero'];
    case '5-1':
    case '5-1-no-libero':
      return system === '5-1'
        ? ['setter', 'opposite', 'outside1', 'outside2', 'middle1', 'middle2', 'libero']
        : ['setter', 'opposite', 'outside1', 'outside2', 'middle1', 'middle2'];
    case '6-2':
    case '6-2-no-libero':
      return system === '6-2'
        ? ['setter1', 'setter2', 'outside1', 'outside2', 'middle1', 'middle2', 'libero']
        : ['setter1', 'setter2', 'outside1', 'outside2', 'middle1', 'middle2'];
    default:
      return ['setter', 'opposite', 'outside1', 'outside2', 'middle1', 'middle2', 'libero'];
  }
}

export function roleLabel(role: SystemRole | 'custom'): string {
  const labels: Record<SystemRole | 'custom', string> = {
    setter: 'Setter',
    setter1: 'Setter 1',
    setter2: 'Setter 2',
    opposite: 'Opposite',
    outside1: 'Outside 1',
    outside2: 'Outside 2',
    middle1: 'Middle 1',
    middle2: 'Middle 2',
    libero: 'Libero',
    custom: 'Custom'
  };
  return labels[role];
}
