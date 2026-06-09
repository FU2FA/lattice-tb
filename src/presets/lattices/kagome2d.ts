import type { Lattice } from "../../core/lattice/types";

export function kagome2DLattice(): Lattice {
  const sqrt3 = Math.sqrt(3);

  return {
    id: "kagome2d",
    name: "Kagome",
    dim: 2,

    // Kagome = triangular Bravais lattice + three-site basis.
    // Guide cell = primitive rhombus of the underlying triangular Bravais lattice.
    a: [2, 0, 0],
    b: [1, sqrt3, 0],
    c: [0, 0, 20],
    simpleCellBasis: {
      a: [2, 0, 0],
      b: [1, sqrt3, 0],
      c: [0, 0, 20],
    },

    sites: [
      { id: 0, element: "X", position: [0, 0, 0], type: "A", color: 0x60a5fa },
      { id: 1, element: "X", position: [0.5, 0, 0], type: "B", color: 0xf97316 },
      { id: 2, element: "X", position: [0, 0.5, 0], type: "C", color: 0x22c55e },
    ],
    highSymmetry: {
      G: { label: "Γ", kFrac: [0, 0, 0] },
      M: { label: "M", kFrac: [0.5, 0, 0] },
      K: { label: "K", kFrac: [2 / 3, 1 / 3, 0] },
    },
    defaultPath: ["G", "M", "K", "G"],
    kPathConvention: "standard",
    visualBondCutoff: 1.05,
  };
}
