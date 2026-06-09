import type { Lattice } from "../../core/lattice/types";

export function dice2DLattice(): Lattice {
  const sqrt3 = Math.sqrt(3);

  return {
    id: "dice2d",
    name: "Dice / T3",
    dim: 2,

    // Dice / T3 = triangular Bravais lattice + three-site basis.
    // Guide cell = primitive rhombus of the underlying triangular Bravais lattice.
    a: [sqrt3, 0, 0],
    b: [sqrt3 / 2, 1.5, 0],
    c: [0, 0, 20],
    simpleCellBasis: {
      a: [sqrt3, 0, 0],
      b: [sqrt3 / 2, 1.5, 0],
      c: [0, 0, 20],
    },

    sites: [
      { id: 0, element: "X", position: [0, 0, 0], type: "Hub", color: 0xfacc15 },
      { id: 1, element: "X", position: [-1 / 3, 2 / 3, 0], type: "RimA", color: 0x60a5fa },
      { id: 2, element: "X", position: [1 / 3, 1 / 3, 0], type: "RimB", color: 0xf97316 },
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
