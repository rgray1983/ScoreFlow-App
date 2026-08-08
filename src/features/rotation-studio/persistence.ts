import type { Formation, LogicalPoint, RotationPlan } from './types';
import { FORMATION_SEQUENCE, SYSTEM_OPTIONS } from './types';

const STORAGE_KEY = 'scoreflow-rotation-plans-v1';
const LEGACY_KEY = 'scoreflow-rotation-studio-v2';

type StoreShape = {
  version: 1;
  plans: RotationPlan[];
  activePlanId: string;
};

function emptyStore(): StoreShape {
  return { version: 1, plans: [], activePlanId: '' };
}

function isPoint(value: unknown): value is LogicalPoint {
  if (!value || typeof value !== 'object') return false;
  const point = value as LogicalPoint;
  return typeof point.x === 'number' && typeof point.y === 'number';
}

function isFormation(value: unknown): value is Formation {
  if (!value || typeof value !== 'object') return false;
  const formation = value as Formation;
  return (
    typeof formation.id === 'string' &&
    typeof formation.type === 'string' &&
    typeof formation.name === 'string' &&
    Array.isArray(formation.playerPositions) &&
    isPoint(formation.ballPosition)
  );
}

function isPlan(value: unknown): value is RotationPlan {
  if (!value || typeof value !== 'object') return false;
  const plan = value as RotationPlan;
  return (
    typeof plan.id === 'string' &&
    typeof plan.teamId === 'string' &&
    typeof plan.seasonId === 'string' &&
    typeof plan.system === 'string' &&
    Array.isArray(plan.rotations) &&
    plan.rotations.length === 6 &&
    SYSTEM_OPTIONS.some((item) => item.id === plan.system)
  );
}

/** Discard unfinished experimental ghost-path data safely. */
export function discardLegacyGhostPlans(): void {
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // Ignore quota / privacy errors.
  }
}

export function readRotationStore(): StoreShape {
  discardLegacyGhostPlans();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<StoreShape>;
    const plans = Array.isArray(parsed.plans) ? parsed.plans.filter(isPlan) : [];
    return {
      version: 1,
      plans,
      activePlanId: typeof parsed.activePlanId === 'string' ? parsed.activePlanId : plans[0]?.id ?? ''
    };
  } catch {
    return emptyStore();
  }
}

export function writeRotationStore(store: StoreShape): void {
  const payload: StoreShape = {
    version: 1,
    plans: store.plans.filter(isPlan),
    activePlanId: store.activePlanId
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function plansForContext(
  store: StoreShape,
  teamId: string,
  seasonId: string
): RotationPlan[] {
  return store.plans.filter((plan) => plan.teamId === teamId && plan.seasonId === seasonId);
}

export function upsertPlan(store: StoreShape, plan: RotationPlan): StoreShape {
  const exists = store.plans.some((item) => item.id === plan.id);
  return {
    version: 1,
    activePlanId: plan.id,
    plans: exists
      ? store.plans.map((item) => (item.id === plan.id ? plan : item))
      : [...store.plans, plan]
  };
}

export function formationByType(plan: RotationPlan, rotationNumber: number, type: Formation['type']): Formation | undefined {
  const rotation = plan.rotations.find((item) => item.number === rotationNumber);
  return rotation?.formations.find((item) => item.type === type);
}

export function ensureFormationSequence(plan: RotationPlan): RotationPlan {
  return {
    ...plan,
    rotations: plan.rotations.map((rotation) => {
      const byType = new Map(rotation.formations.filter(isFormation).map((item) => [item.type, item]));
      return {
        ...rotation,
        formations: FORMATION_SEQUENCE.map((item) => {
          const existing = byType.get(item.type);
          if (existing) return existing;
          return {
            id: `${plan.id}-${rotation.number}-${item.type}`,
            type: item.type,
            name: item.name,
            playerPositions: [],
            ballPosition: { x: 0.5, y: 0.5 },
            serverPlayerId: '',
            liberoReplacement: null,
            substitutions: [],
            annotations: [],
            notes: ''
          };
        })
      };
    })
  };
}
