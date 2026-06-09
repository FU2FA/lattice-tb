import type { Lattice } from "../../core/lattice/types";

export function rhombohedralLattice(): Lattice {
  return {
    id: "rhombohedral",
    name: "Rhombohedral / trigonal",
    dim: 3,
    a: [1, 0, 0],
    b: [0.35, 0.936, 0],
    c: [0.35, 0.25, 0.902],

    // Guide cell: rhombohedral primitive cell.
    simpleCellBasis: {
      a: [1, 0, 0],
      b: [0.35, 0.936, 0],
      c: [0.35, 0.25, 0.902],
    },

    sites: [{ id: 0, element: "X", position: [0, 0, 0], type: "X", color: 0x60a5fa }],
    highSymmetry: {
      G: { label: "Γ", kFrac: [0, 0, 0] },
      L: { label: "L", kFrac: [0.5, 0, 0] },
      F: { label: "F", kFrac: [0.5, 0.5, 0] },
      Z: { label: "Z", kFrac: [0.5, 0.5, 0.5] },
    },
    defaultPath: ["G", "L", "F", "G", "Z"],
    visualBondCutoff: 1.05,
  };
}
