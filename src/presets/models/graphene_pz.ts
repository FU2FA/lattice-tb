import type { TBModel } from "../../core/tightbinding/tbTypes";
import { c } from "../../core/math/complex";
import { honeycombLattice } from "../lattices/graphene";

export interface HoneycombPzParams {
  epsilon: number;
  t: number;
}

export function honeycombPzModel(params: HoneycombPzParams = { epsilon: 0, t: -2.7 }): TBModel {
  const lattice = honeycombLattice();

  return {
    id: "honeycomb_pz",
    name: "Honeycomb pz nearest-neighbor",
    lattice,
    orbitals: [
      { id: 0, site: 0, kind: "pz", label: "A pz" },
      { id: 1, site: 1, kind: "pz", label: "B pz" },
    ],
    onsites: [
      { orbital: { site: 0, orbital: "pz" }, energy: c(params.epsilon) },
      { orbital: { site: 1, orbital: "pz" }, energy: c(params.epsilon) },
    ],
    hoppings: [
      { from: { site: 0, orbital: "pz" }, to: { site: 1, orbital: "pz" }, R: [0, 0, 0], value: c(params.t), label: "δ1" },
      { from: { site: 0, orbital: "pz" }, to: { site: 1, orbital: "pz" }, R: [0, -1, 0], value: c(params.t), label: "δ2" },
      { from: { site: 0, orbital: "pz" }, to: { site: 1, orbital: "pz" }, R: [1, -1, 0], value: c(params.t), label: "δ3" },
    ],
    defaultPath: lattice.defaultPath,
  };
}

export function graphenePzModel(params: HoneycombPzParams = { epsilon: 0, t: -2.7 }): TBModel {
  return honeycombPzModel(params);
}
