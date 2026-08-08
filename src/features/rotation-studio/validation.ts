import type { Formation, FormationPlayerPosition, LogicalPoint } from './types';

export function clampPoint(point: LogicalPoint): LogicalPoint {
  return {
    x: Math.min(0.98, Math.max(0.02, point.x)),
    y: Math.min(0.96, Math.max(0.02, point.y))
  };
}

/** Lightweight left/right neighbor warning for same-row players. Not a hard rule engine. */
export function overlapWarnings(positions: FormationPlayerPosition[]): string[] {
  const warnings: string[] = [];
  const front = positions.filter((item) => item.zone === 2 || item.zone === 3 || item.zone === 4);
  const back = positions.filter((item) => item.zone === 1 || item.zone === 5 || item.zone === 6);

  const checkRow = (row: FormationPlayerPosition[], label: string) => {
    const sorted = [...row].sort((a, b) => a.point.x - b.point.x);
    for (let index = 0; index < sorted.length - 1; index += 1) {
      if (sorted[index].point.x > sorted[index + 1].point.x + 0.001) {
        warnings.push(`${label} overlap risk between zone ${sorted[index].zone} and ${sorted[index + 1].zone}`);
      }
    }
  };

  checkRow(front, 'Front row');
  checkRow(back, 'Back row');
  return warnings;
}

export function updatePlayerPoint(formation: Formation, playerId: string, point: LogicalPoint): Formation {
  return {
    ...formation,
    playerPositions: formation.playerPositions.map((item) =>
      item.playerId === playerId ? { ...item, point: clampPoint(point) } : item
    )
  };
}

export function updateBallPoint(formation: Formation, point: LogicalPoint): Formation {
  return { ...formation, ballPosition: clampPoint(point) };
}
