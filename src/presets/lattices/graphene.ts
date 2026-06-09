import type { Lattice } from "../../core/lattice/types";

export function honeycombLattice(): Lattice {
  const sqrt3 = Math.sqrt(3);

  return {
    id: "honeycomb",
    name: "Honeycomb",
    dim: 2,

    // Honeycomb = triangular Bravais lattice + two-site basis.
    // Nearest-neighbor distance is 1.
    //
    // Previous versions used a 2:sqrt(3) rectangular guide tile. That made the
    // displayed cells look like a rectangular supercell rather than the actual
    // primitive honeycomb cell. The guide cell is now the primitive Bravais
    // parallelogram, matching the TB/reciprocal primitive cell.
    a: [sqrt3, 0, 0],
    b: [sqrt3 / 2, 1.5, 0],
    c: [0, 0, 20],
    simpleCellBasis: {
      a: [sqrt3, 0, 0],
      b: [sqrt3 / 2, 1.5, 0],
      c: [0, 0, 20],
    },

    sites: [
      { id: 0, element: "X", position: [0, 0, 0], type: "A", color: 0x60a5fa },
      { id: 1, element: "X", position: [-1 / 3, 2 / 3, 0], type: "B", color: 0xf97316 },
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

export function grapheneLattice(): Lattice {
  return honeycombLattice();
}
