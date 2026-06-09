import type { TBModel } from "../../core/tightbinding/tbTypes";
import { c } from "../../core/math/complex";
import { scLattice } from "../lattices/sc";

export interface ScSParams {
  epsilon: number;
  t: number;
}

export function scSModel(params: ScSParams = { epsilon: 0, t: -1 }): TBModel {
  const lattice = scLattice();

  return {
    id: "sc_s",
    name: "SC s-orbital",
    lattice,
    orbitals: [{ id: 0, site: 0, kind: "s", label: "s" }],
    onsites: [{ orbital: { site: 0, orbital: "s" }, energy: c(params.epsilon) }],
    hoppings: [
      { from: { site: 0, orbital: "s" }, to: { site: 0, orbital: "s" }, R: [1, 0, 0], value: c(params.t), label: "x" },
      { from: { site: 0, orbital: "s" }, to: { site: 0, orbital: "s" }, R: [0, 1, 0], value: c(params.t), label: "y" },
      { from: { site: 0, orbital: "s" }, to: { site: 0, orbital: "s" }, R: [0, 0, 1], value: c(params.t), label: "z" },
    ],
    defaultPath: lattice.defaultPath,
  };
}
