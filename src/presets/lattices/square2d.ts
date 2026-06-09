import type { Lattice } from "../../core/lattice/types";

export function square2DLattice(): Lattice {
  return {
    id: "square2d",
    name: "Square",
    dim: 2,

    // 2D square Bravais lattice.
    // Guide cell = primitive square tile.
    a: [1, 0, 0],
    b: [0, 1, 0],
    c: [0, 0, 20],
    simpleCellBasis: {
      a: [1, 0, 0],
      b: [0, 1, 0],
      c: [0, 0, 20],
    },

    sites: [{ id: 0, element: "X", position: [0, 0, 0], type: "X", color: 0x60a5fa }],
    highSymmetry: {
      G: { label: "Γ", kFrac: [0, 0, 0] },
      X: { label: "X", kFrac: [0.5, 0, 0] },
      M: { label: "M", kFrac: [0.5, 0.5, 0] },
    },
    defaultPath: ["G", "X", "M", "G"],
    kPathConvention: "standard",
    visualBondCutoff: 1.05,
  };
}
