import type { HoppingTerm, OrbitalKind, TBModel } from "../../core/tightbinding/tbTypes";
import type { Lattice } from "../../core/lattice/types";
import { c } from "../../core/math/complex";
import { genericNearestPairs } from "./nearestPairs";
import { sp3HoppingByDirection, type SP3Params } from "../../core/tightbinding/slaterKoster";
import { hoppingDisplacement } from "../../core/tightbinding/buildHamiltonian";

const ORBS: OrbitalKind[] = ["s", "px", "py", "pz"];

export function genericSP3Model(
  id: string,
  name: string,
  lattice: Lattice,
  params: SP3Params = {
    Es: -5,
    Ep: 2,
    Vss_sigma: -1.2,
    Vsp_sigma: 1.7,
    Vpp_sigma: 2.2,
    Vpp_pi: -0.6,
  },
): TBModel {
  const orbitals = lattice.sites.flatMap((site) =>
    ORBS.map((kind, oi) => ({
      id: site.id * ORBS.length + oi,
      site: site.id,
      kind,
      label: `${site.type ?? site.element}${site.id} ${kind}`,
    })),
  );

  const onsites = orbitals.map((orb) => ({
    orbital: { site: orb.site, orbital: orb.kind },
    energy: c(orb.kind === "s" ? params.Es : params.Ep),
  }));

  const shell: TBModel = {
    id,
    name,
    lattice,
    orbitals,
    onsites,
    hoppings: [],
    defaultPath: lattice.defaultPath,
  };

  const pairs = genericNearestPairs(lattice, { searchRange: 1, toleranceRatio: 0.08 });
  const hoppings: HoppingTerm[] = [];

  for (const pair of pairs) {
    const direction = hoppingDisplacement(shell, pair.fromSite, pair.toSite, pair.R);
    const mat = sp3HoppingByDirection(direction, params);

    for (let i = 0; i < ORBS.length; i++) {
      for (let j = 0; j < ORBS.length; j++) {
        hoppings.push({
          from: { site: pair.fromSite, orbital: ORBS[i] },
          to: { site: pair.toSite, orbital: ORBS[j] },
          R: pair.R,
          value: c(mat[i][j]),
          label: `sp3 d=${pair.distance.toFixed(3)}`,
        });
      }
    }
  }

  return {
    ...shell,
    hoppings,
  };
}
