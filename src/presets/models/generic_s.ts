import type { Lattice } from "../../core/lattice/types";
import type { HoppingTerm, TBModel } from "../../core/tightbinding/tbTypes";
import { c } from "../../core/math/complex";
import { fracToCart, norm, vsub, type Int3, type Vec3 } from "../../core/math/vec";

export interface GenericSParams {
  epsilon: number;
  t: number;
  searchRange?: number;
  toleranceRatio?: number;
  includeSameSublattice?: boolean;
}

interface CandidatePair {
  fromSite: number;
  toSite: number;
  R: Int3;
  distance: number;
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

/**
 * Build a simple one-orbital-per-site nearest-neighbor TB model.
 *
 * This is meant as a first-pass model for visualization/education.
 * It automatically finds the shortest nonzero pair shell inside the primitive cell.
 */
export function genericNearestSModel(
  id: string,
  name: string,
  lattice: Lattice,
  params: GenericSParams = { epsilon: 0, t: -1 },
): TBModel {
  const searchRange = params.searchRange ?? 1;
  const toleranceRatio = params.toleranceRatio ?? 0.08;
  const includeSameSublattice = params.includeSameSublattice ?? true;

  const candidates: CandidatePair[] = [];
  let dMin = Number.POSITIVE_INFINITY;

  for (const from of lattice.sites) {
    for (const to of lattice.sites) {
      if (!includeSameSublattice && from.type && to.type && from.type === to.type) continue;

      for (let i = -searchRange; i <= searchRange; i++) {
        for (let j = -searchRange; j <= searchRange; j++) {
          for (let k = lattice.dim === 2 ? 0 : -searchRange; k <= (lattice.dim === 2 ? 0 : searchRange); k++) {
            const R: Int3 = [i, j, k];

            const same = from.id === to.id && i === 0 && j === 0 && k === 0;
            if (same) continue;

            const d = norm(displacement(lattice, from.id, to.id, R));
            if (d < 1e-8) continue;

            candidates.push({
              fromSite: from.id,
              toSite: to.id,
              R,
              distance: d,
            });

            if (d < dMin) dMin = d;
          }
        }
      }
    }
  }

  const threshold = dMin * (1 + toleranceRatio);
  const unique = new Map<string, CandidatePair>();

  for (const p of candidates) {
    if (p.distance > threshold) continue;

    // Keep one direction only. buildHamiltonian adds Hermitian conjugate.
    const reverseKey = `${p.toSite}:${p.fromSite}:${-p.R[0]},${-p.R[1]},${-p.R[2]}`;
    if (unique.has(reverseKey)) continue;

    const key = `${p.fromSite}:${p.toSite}:${p.R.join(",")}`;
    unique.set(key, p);
  }

  const hoppings: HoppingTerm[] = Array.from(unique.values()).map((p) => ({
    from: { site: p.fromSite, orbital: "s" },
    to: { site: p.toSite, orbital: "s" },
    R: p.R,
    value: c(params.t),
    label: `d=${p.distance.toFixed(3)}`,
  }));

  return {
    id,
    name,
    lattice,
    orbitals: lattice.sites.map((site, index) => ({
      id: index,
      site: site.id,
      kind: "s",
      label: `${site.type ?? site.element}${site.id} s`,
    })),
    onsites: lattice.sites.map((site) => ({
      orbital: { site: site.id, orbital: "s" },
      energy: c(params.epsilon),
    })),
    hoppings,
    defaultPath: lattice.defaultPath,
  };
}
