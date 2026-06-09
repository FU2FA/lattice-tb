import type { Lattice } from "../../core/lattice/types";
import type { HoppingTerm, TBModel } from "../../core/tightbinding/tbTypes";
import { c } from "../../core/math/complex";
import { genericNeighborShells } from "./nearestPairs";

export interface GenericShellSParams {
  epsilon: number;
  t1: number;
  t2: number;
  t3: number;
  shellCount?: number;
}

export function genericShellSModel(
  id: string,
  name: string,
  lattice: Lattice,
  params: GenericShellSParams = {
    epsilon: 0,
    t1: -1,
    t2: 0.25,
    t3: -0.1,
    shellCount: 3,
  },
): TBModel {
  const shellValues = [params.t1, params.t2, params.t3];
  const shells = genericNeighborShells(lattice, params.shellCount ?? 3, {
    searchRange: 2,
    toleranceRatio: 0.04,
  });

  const hoppings: HoppingTerm[] = [];

  for (const shell of shells) {
    const t = shellValues[shell.shell - 1] ?? 0;
    if (Math.abs(t) < 1e-12) continue;

    for (const pair of shell.pairs) {
      hoppings.push({
        from: { site: pair.fromSite, orbital: "s" },
        to: { site: pair.toSite, orbital: "s" },
        R: pair.R,
        value: c(t),
        label: `shell ${shell.shell}, d=${pair.distance.toFixed(3)}`,
      });
    }
  }

  return {
    id,
    name: `${name} · t1=${params.t1}, t2=${params.t2}, t3=${params.t3}`,
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
