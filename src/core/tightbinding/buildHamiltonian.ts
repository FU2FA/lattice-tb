import type { Vec3 } from "../math/vec";
import type { ComplexMatrix } from "../math/matrix";
import type { OrbitalRef, TBModel } from "./tbTypes";
import { fracToCart, intToCart, dot, vadd, vsub } from "../math/vec";
import { addTo, zerosComplex } from "../math/matrix";
import { c, cmul, cconj, expi } from "../math/complex";

function orbitalKey(ref: OrbitalRef): string {
  return `${ref.site}:${ref.orbital}`;
}

export function orbitalIndexMap(model: TBModel): Map<string, number> {
  const map = new Map<string, number>();

  model.orbitals.forEach((orb, index) => {
    map.set(orbitalKey({ site: orb.site, orbital: orb.kind }), index);
  });

  return map;
}

function sitePositionCart(model: TBModel, siteId: number): Vec3 {
  const site = model.lattice.sites.find((s) => s.id === siteId);
  if (!site) throw new Error(`Site ${siteId} not found.`);

  return fracToCart(site.position, model.lattice.a, model.lattice.b, model.lattice.c);
}

export function hoppingDisplacement(model: TBModel, fromSite: number, toSite: number, R: [number, number, number]): Vec3 {
  const cell = intToCart(R, model.lattice.a, model.lattice.b, model.lattice.c);
  const from = sitePositionCart(model, fromSite);
  const to = sitePositionCart(model, toSite);

  return vadd(cell, vsub(to, from));
}

export function buildHamiltonian(model: TBModel, k: Vec3): ComplexMatrix {
  const n = model.orbitals.length;
  const H = zerosComplex(n, n);
  const index = orbitalIndexMap(model);

  for (const onsite of model.onsites) {
    const i = index.get(orbitalKey(onsite.orbital));
    if (i === undefined) throw new Error(`Unknown onsite orbital ${orbitalKey(onsite.orbital)}`);
    addTo(H, i, i, onsite.energy);
  }

  for (const hop of model.hoppings) {
    const i = index.get(orbitalKey(hop.from));
    const j = index.get(orbitalKey(hop.to));

    if (i === undefined) throw new Error(`Unknown from orbital ${orbitalKey(hop.from)}`);
    if (j === undefined) throw new Error(`Unknown to orbital ${orbitalKey(hop.to)}`);

    const d = hoppingDisplacement(model, hop.from.site, hop.to.site, hop.R);
    const phase = expi(dot(k, d));
    const value = cmul(hop.value, phase);

    addTo(H, i, j, value);

    // Add Hermitian conjugate automatically.
    // For self-hopping with nonzero R this correctly produces +R and -R terms.
    const isSameOrbital = i === j && hop.R[0] === 0 && hop.R[1] === 0 && hop.R[2] === 0;
    if (!isSameOrbital) {
      addTo(H, j, i, cconj(value));
    }
  }

  return H;
}
