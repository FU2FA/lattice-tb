import type { TBModel } from "../../core/tightbinding/tbTypes";
import { c } from "../../core/math/complex";
import { diamondLattice } from "../lattices/diamond";

export interface DiamondSParams {
  epsilon: number;
  t: number;
}

export function diamondSModel(params: DiamondSParams = { epsilon: 0, t: -1 }): TBModel {
  const lattice = diamondLattice();

  return {
    id: "diamond_s",
    name: "Diamond s-orbital",
    lattice,
    orbitals: [
      { id: 0, site: 0, kind: "s", label: "A s" },
      { id: 1, site: 1, kind: "s", label: "B s" },
    ],
    onsites: [
      { orbital: { site: 0, orbital: "s" }, energy: c(params.epsilon) },
      { orbital: { site: 1, orbital: "s" }, energy: c(params.epsilon) },
    ],
    hoppings: [
      { from: { site: 0, orbital: "s" }, to: { site: 1, orbital: "s" }, R: [0, 0, 0], value: c(params.t), label: "bond 1" },
      { from: { site: 0, orbital: "s" }, to: { site: 1, orbital: "s" }, R: [-1, 0, 0], value: c(params.t), label: "bond 2" },
      { from: { site: 0, orbital: "s" }, to: { site: 1, orbital: "s" }, R: [0, -1, 0], value: c(params.t), label: "bond 3" },
      { from: { site: 0, orbital: "s" }, to: { site: 1, orbital: "s" }, R: [0, 0, -1], value: c(params.t), label: "bond 4" },
    ],
    defaultPath: lattice.defaultPath,
  };
}
