import type { Lattice } from "../../core/lattice/types";
import type { TBModel } from "../../core/tightbinding/tbTypes";
import { c } from "../../core/math/complex";

export interface FccSParams {
  epsilon: number;
  t: number;
}

function fccPrimitiveTBLattice(): Lattice {
  return {
    id: "fcc",
    name: "FCC primitive TB",
    dim: 3,
    // FCC primitive vectors in conventional cubic coordinates with a0 = 1.
    a: [0, 0.5, 0.5],
    b: [0.5, 0, 0.5],
    c: [0.5, 0.5, 0],
    sites: [{ id: 0, element: "X", position: [0, 0, 0] }],
    highSymmetry: {
      G: { label: "Γ", kFrac: [0, 0, 0] },
      X: { label: "X", kFrac: [0, 0.5, 0.5] },
      L: { label: "L", kFrac: [0.5, 0.5, 0.5] },
      W: { label: "W", kFrac: [0.25, 0.75, 0.5] },
      K: { label: "K", kFrac: [0.375, 0.75, 0.375] },
    },
    defaultPath: ["G", "X", "W", "K", "G", "L"],
    visualBondCutoff: 0.73,
  };
}

export function fccSModel(params: FccSParams = { epsilon: 0, t: -1 }): TBModel {
  const lattice = fccPrimitiveTBLattice();

  return {
    id: "fcc_s",
    name: "FCC primitive s-orbital",
    lattice,
    orbitals: [{ id: 0, site: 0, kind: "s", label: "s" }],
    onsites: [{ orbital: { site: 0, orbital: "s" }, energy: c(params.epsilon) }],
    // FCC nearest-neighbor shell represented in primitive translations.
    hoppings: [
      { from: { site: 0, orbital: "s" }, to: { site: 0, orbital: "s" }, R: [1, 0, 0], value: c(params.t), label: "a1" },
      { from: { site: 0, orbital: "s" }, to: { site: 0, orbital: "s" }, R: [0, 1, 0], value: c(params.t), label: "a2" },
      { from: { site: 0, orbital: "s" }, to: { site: 0, orbital: "s" }, R: [0, 0, 1], value: c(params.t), label: "a3" },
      { from: { site: 0, orbital: "s" }, to: { site: 0, orbital: "s" }, R: [1, -1, 0], value: c(params.t), label: "a1-a2" },
      { from: { site: 0, orbital: "s" }, to: { site: 0, orbital: "s" }, R: [1, 0, -1], value: c(params.t), label: "a1-a3" },
      { from: { site: 0, orbital: "s" }, to: { site: 0, orbital: "s" }, R: [0, 1, -1], value: c(params.t), label: "a2-a3" },
    ],
    defaultPath: lattice.defaultPath,
  };
}
