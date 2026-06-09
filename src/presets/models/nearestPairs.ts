import type { Int3, Vec3 } from "../../core/math/vec";
import type { Lattice } from "../../core/lattice/types";
import { fracToCart, norm } from "../../core/math/vec";

export interface NearestPair {
  fromSite: number;
  toSite: number;
  R: Int3;
  distance: number;
}

export interface NearestPairOptions {
  searchRange?: number;
  toleranceRatio?: number;
  includeSameType?: boolean;
}

function siteCart(lattice: Lattice, siteId: number): Vec3 {
  const site = lattice.sites.find((s) => s.id === siteId);
  if (!site) throw new Error(`Site ${siteId} not found`);
  return fracToCart(site.position, lattice.a, lattice.b, lattice.c);
}

function displacement(lattice: Lattice, fromSite: number, toSite: number, R: Int3): Vec3 {
  const from = siteCart(lattice, fromSite);
  const to = siteCart(lattice, toSite);
  const cell = fracToCart([R[0], R[1], R[2]], lattice.a, lattice.b, lattice.c);
  return [
    cell[0] + to[0] - from[0],
    cell[1] + to[1] - from[1],
    cell[2] + to[2] - from[2],
  ];
}

export function genericNearestPairs(lattice: Lattice, options: NearestPairOptions = {}): NearestPair[] {
  const searchRange = options.searchRange ?? 1;
  const toleranceRatio = options.toleranceRatio ?? 0.08;
  const includeSameType = options.includeSameType ?? true;

  const candidates: NearestPair[] = [];
  let dMin = Number.POSITIVE_INFINITY;

  for (const from of lattice.sites) {
    for (const to of lattice.sites) {
      if (!includeSameType && from.type && to.type && from.type === to.type) continue;

      for (let i = -searchRange; i <= searchRange; i++) {
        for (let j = -searchRange; j <= searchRange; j++) {
          const zMin = lattice.dim === 2 ? 0 : -searchRange;
          const zMax = lattice.dim === 2 ? 0 : searchRange;

          for (let k = zMin; k <= zMax; k++) {
            const R: Int3 = [i, j, k];
            if (from.id === to.id && i === 0 && j === 0 && k === 0) continue;

            const d = norm(displacement(lattice, from.id, to.id, R));
            if (d < 1e-8) continue;

            candidates.push({ fromSite: from.id, toSite: to.id, R, distance: d });
            if (d < dMin) dMin = d;
          }
        }
      }
    }
  }

  const threshold = dMin * (1 + toleranceRatio);
  const unique = new Map<string, NearestPair>();

  for (const p of candidates) {
    if (p.distance > threshold) continue;

    const reverseKey = `${p.toSite}:${p.fromSite}:${-p.R[0]},${-p.R[1]},${-p.R[2]}`;
    if (unique.has(reverseKey)) continue;

    unique.set(`${p.fromSite}:${p.toSite}:${p.R.join(",")}`, p);
  }

  return Array.from(unique.values());
}


export interface NeighborShell {
  shell: number;
  distance: number;
  pairs: NearestPair[];
}

export function genericNeighborShells(
  lattice: Lattice,
  shellCount = 3,
  options: NearestPairOptions = {},
): NeighborShell[] {
  const searchRange = options.searchRange ?? 2;
  const includeSameType = options.includeSameType ?? true;
  const toleranceRatio = options.toleranceRatio ?? 0.04;

  const candidates: NearestPair[] = [];

  for (const from of lattice.sites) {
    for (const to of lattice.sites) {
      if (!includeSameType && from.type && to.type && from.type === to.type) continue;

      for (let i = -searchRange; i <= searchRange; i++) {
        for (let j = -searchRange; j <= searchRange; j++) {
          const zMin = lattice.dim === 2 ? 0 : -searchRange;
          const zMax = lattice.dim === 2 ? 0 : searchRange;

          for (let k = zMin; k <= zMax; k++) {
            const R: Int3 = [i, j, k];
            if (from.id === to.id && i === 0 && j === 0 && k === 0) continue;

            const d = norm(displacement(lattice, from.id, to.id, R));
            if (d < 1e-8) continue;

            const reverseKey = `${to.id}:${from.id}:${-R[0]},${-R[1]},${-R[2]}`;
            const selfKey = `${from.id}:${to.id}:${R.join(",")}`;
            if (candidates.some((p) => `${p.fromSite}:${p.toSite}:${p.R.join(",")}` === reverseKey || `${p.fromSite}:${p.toSite}:${p.R.join(",")}` === selfKey)) {
              continue;
            }

            candidates.push({ fromSite: from.id, toSite: to.id, R, distance: d });
          }
        }
      }
    }
  }

  candidates.sort((a, b) => a.distance - b.distance);

  const shells: NeighborShell[] = [];

  for (const pair of candidates) {
    let shell = shells.find((s) => Math.abs(pair.distance - s.distance) <= Math.max(1e-8, s.distance * toleranceRatio));

    if (!shell) {
      if (shells.length >= shellCount) continue;
      shell = {
        shell: shells.length + 1,
        distance: pair.distance,
        pairs: [],
      };
      shells.push(shell);
    }

    shell.pairs.push(pair);
  }

  return shells;
}
