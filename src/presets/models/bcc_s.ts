import type { Lattice } from "../../core/lattice/types";
import type { TBModel } from "../../core/tightbinding/tbTypes";
import { c } from "../../core/math/complex";

export interface BccSParams {
  epsilon: number;
  t: number;
}

function bccPrimitiveTBLattice(): Lattice {
  return {
    id: "bcc",
    name: "BCC primitive TB",
    dim: 3,
    // BCC primitive vectors in conventional cubic coordinates with a0 = 1.
    a: [0.5, 0.5, -0.5],
    b: [0.5, -0.5, 0.5],
    c: [-0.5, 0.5, 0.5],
    sites: [{ id: 0, element: "X", position: [0, 0, 0] }],
    highSymmetry: {
      G: { label: "Γ", kFrac: [0, 0, 0] },
      H: { label: "H", kFrac: [0.5, -0.5, 0.5] },
      N: { label: "N", kFrac: [0, 0, 0.5] },
      P: { label: "P", kFrac: [0.25, 0.25, 0.25] },
    },
    defaultPath: ["G", "H", "N", "G", "P", "H"],
    visualBondCutoff: 0.9,
  };
}

export function bccSModel(params: BccSParams = { epsilon: 0, t: -1 }): TBModel {
  const lattice = bccPrimitiveTBLattice();

  return {
    id: "bcc_s",
    name: "BCC primitive s-orbital",
    lattice,
    orbitals: [{ id: 0, site: 0, kind: "s", label: "s" }],
    onsites: [{ orbital: { site: 0, orbital: "s" }, energy: c(params.epsilon) }],
    // Primitive-lattice nearest translations. Hermitian conjugates are added automatically.
    hoppings: [
      { from: { site: 0, orbital: "s" }, to: { site: 0, orbital: "s" }, R: [1, 0, 0], value: c(params.t), label: "a1" },
      { from: { site: 0, orbital: "s" }, to: { site: 0, orbital: "s" }, R: [0, 1, 0], value: c(params.t), label: "a2" },
      { from: { site: 0, orbital: "s" }, to: { site: 0, orbital: "s" }, R: [0, 0, 1], value: c(params.t), label: "a3" },
      { from: { site: 0, orbital: "s" }, to: { site: 0, orbital: "s" }, R: [1, 1, 0], value: c(params.t), label: "a1+a2" },
    ],
    defaultPath: lattice.defaultPath,
  };
}
