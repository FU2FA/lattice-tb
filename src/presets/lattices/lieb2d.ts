import type { Lattice } from "../../core/lattice/types";

export function lieb2DLattice(): Lattice {
  return {
    id: "lieb2d",
    name: "Lieb",
    dim: 2,

    // Lieb = line-centered square lattice with a three-site basis.
    // Guide cell = primitive square tile.
    a: [1, 0, 0],
    b: [0, 1, 0],
    c: [0, 0, 20],
    simpleCellBasis: {
      a: [1, 0, 0],
      b: [0, 1, 0],
      c: [0, 0, 20],
    },

    sites: [
      { id: 0, element: "X", position: [0, 0, 0], type: "A", color: 0x60a5fa },
      { id: 1, element: "X", position: [0.5, 0, 0], type: "B", color: 0xf97316 },
      { id: 2, element: "X", position: [0, 0.5, 0], type: "C", color: 0x22c55e },
    ],
    highSymmetry: {
      G: { label: "Γ", kFrac: [0, 0, 0] },
      X: { label: "X", kFrac: [0.5, 0, 0] },
      M: { label: "M", kFrac: [0.5, 0.5, 0] },
    },
    defaultPath: ["G", "X", "M", "G"],
    visualBondCutoff: 0.55,
  };
}
