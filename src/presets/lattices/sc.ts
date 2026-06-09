import type { Lattice } from "../../core/lattice/types";

export function scLattice(): Lattice {
  return {
    id: "sc",
    name: "Simple cubic",
    dim: 3,
    a: [1, 0, 0],
    b: [0, 1, 0],
    c: [0, 0, 1],
    conventionalBasis: {
      a: [1, 0, 0],
      b: [0, 1, 0],
      c: [0, 0, 1],
    },
    sites: [{ id: 0, element: "X", position: [0, 0, 0], type: "X", color: 0x60a5fa }],
    visualSites: [{ id: 0, element: "X", position: [0, 0, 0], type: "X", color: 0x60a5fa }],
    highSymmetry: {
      G: { label: "Γ", kFrac: [0, 0, 0] },
      X: { label: "X", kFrac: [0.5, 0, 0] },
      M: { label: "M", kFrac: [0.5, 0.5, 0] },
      R: { label: "R", kFrac: [0.5, 0.5, 0.5] },
    },
    defaultPath: ["G", "X", "M", "G", "R", "X"],
    visualBondCutoff: 1.05,
  };
}
