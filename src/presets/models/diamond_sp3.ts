import type { TBModel, OrbitalKind, HoppingTerm } from "../../core/tightbinding/tbTypes";
import { c } from "../../core/math/complex";
import { diamondLattice } from "../lattices/diamond";
import { hoppingDisplacement } from "../../core/tightbinding/buildHamiltonian";
import { sp3HoppingByDirection, type SP3Params } from "../../core/tightbinding/slaterKoster";

const SP3_ORBITALS: OrbitalKind[] = ["s", "px", "py", "pz"];

export function diamondSP3Model(
  params: SP3Params = {
    Es: -5.0,
    Ep: 3.0,
    Vss_sigma: -1.8,
    Vsp_sigma: 2.2,
    Vpp_sigma: 3.0,
    Vpp_pi: -0.75,
  },
): TBModel {
  const lattice = diamondLattice();

  const orbitals = [
    ...SP3_ORBITALS.map((kind, i) => ({ id: i, site: 0, kind, label: `A ${kind}` })),
    ...SP3_ORBITALS.map((kind, i) => ({ id: i + 4, site: 1, kind, label: `B ${kind}` })),
  ];

  const onsites = orbitals.map((orb) => ({
    orbital: { site: orb.site, orbital: orb.kind },
    energy: c(orb.kind === "s" ? params.Es : params.Ep),
  }));

  const modelShell: TBModel = {
    id: "diamond_sp3",
    name: "Diamond sp3 Slater-Koster",
    lattice,
    orbitals,
    onsites,
    hoppings: [],
    defaultPath: lattice.defaultPath,
  };

  const neighborCells: [number, number, number][] = [
    [0, 0, 0],
    [-1, 0, 0],
    [0, -1, 0],
    [0, 0, -1],
  ];

  const hoppings: HoppingTerm[] = [];

  for (const R of neighborCells) {
    const direction = hoppingDisplacement(modelShell, 0, 1, R);
    const mat = sp3HoppingByDirection(direction, params);

    for (let i = 0; i < SP3_ORBITALS.length; i++) {
      for (let j = 0; j < SP3_ORBITALS.length; j++) {
        hoppings.push({
          from: { site: 0, orbital: SP3_ORBITALS[i] },
          to: { site: 1, orbital: SP3_ORBITALS[j] },
          R,
          value: c(mat[i][j]),
          label: `sp3 ${R.join(",")}`,
        });
      }
    }
  }

  return {
    ...modelShell,
    hoppings,
  };
}
