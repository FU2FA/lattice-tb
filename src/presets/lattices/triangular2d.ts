import type { Lattice } from "../../core/lattice/types";

export function triangular2DLattice(): Lattice {
  const sqrt3 = Math.sqrt(3);

  return {
    id: "triangular2d",
    name: "Triangular",
    dim: 2,

    // 2D triangular Bravais lattice.
    // Guide cell = primitive 60-degree rhombus.
    a: [1, 0, 0],
    b: [0.5, sqrt3 / 2, 0],
    c: [0, 0, 20],
    simpleCellBasis: {
      a: [1, 0, 0],
      b: [0.5, sqrt3 / 2, 0],
      c: [0, 0, 20],
    },

    sites: [{ id: 0, element: "X", position: [0, 0, 0], type: "X", color: 0x60a5fa }],
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
