import type { VisualAtom } from "./supercell";
import { norm, vsub } from "../math/vec";

export interface VisualBond {
  from: VisualAtom;
  to: VisualAtom;
  distance: number;
}

export interface NearestBondOptions {
  toleranceRatio?: number;
  absoluteTolerance?: number;
  includeSameType?: boolean;
}

/**
 * Find actual nearest-neighbor bonds among currently rendered visual atoms.
 *
 * This does not use TB hopping terms.
 * This also does not use lattice.visualBondCutoff.
 *
 * Algorithm:
 * 1. Measure all nonzero atom-atom distances in the rendered visual set.
 * 2. Find the shortest nonzero distance d_min.
 * 3. Connect all pairs with d <= d_min * (1 + toleranceRatio) + absoluteTolerance.
 */
export function findVisualBonds(
  atoms: VisualAtom[],
  _unusedCutoff?: number,
  options: NearestBondOptions = {},
): VisualBond[] {
  const toleranceRatio = options.toleranceRatio ?? 0.08;
  const absoluteTolerance = options.absoluteTolerance ?? 1e-6;
  const includeSameType = options.includeSameType ?? true;

  const pairs: VisualBond[] = [];
  let minDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < atoms.length; i++) {
    for (let j = i + 1; j < atoms.length; j++) {
      if (!includeSameType && atoms[i].type === atoms[j].type) continue;

      const d = norm(vsub(atoms[i].position, atoms[j].position));
      if (d <= 1e-8) continue;

      pairs.push({ from: atoms[i], to: atoms[j], distance: d });
      if (d < minDistance) minDistance = d;
    }
  }

  if (!Number.isFinite(minDistance)) return [];

  const threshold = minDistance * (1 + toleranceRatio) + absoluteTolerance;
  return pairs.filter((pair) => pair.distance <= threshold);
}
