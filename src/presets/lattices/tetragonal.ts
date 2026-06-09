import type { Lattice } from "../../core/lattice/types";

export function tetragonalLattice(): Lattice {
  return {
    id: "tetragonal",
    name: "Simple tetragonal",
    dim: 3,
    a: [1, 0, 0],
    b: [0, 1, 0],
    c: [0, 0, 1.6],

    // Guide cell: tetragonal prism.
    conventionalBasis: {
      a: [1, 0, 0],
      b: [0, 1, 0],
      c: [0, 0, 1.6],
    },

    sites: [{ id: 0, element: "X", position: [0, 0, 0], type: "X", color: 0x60a5fa }],
    highSymmetry: {
      G: { label: "Γ", kFrac: [0, 0, 0] },
      X: { label: "X", kFrac: [0.5, 0, 0] },
      M: { label: "M", kFrac: [0.5, 0.5, 0] },
      Z: { label: "Z", kFrac: [0, 0, 0.5] },
      R: { label: "R", kFrac: [0.5, 0, 0.5] },
      A: { label: "A", kFrac: [0.5, 0.5, 0.5] },
    },
    defaultPath: ["G", "X", "M", "G", "Z", "R", "A", "Z"],
    visualBondCutoff: 1.05,
  };
}
