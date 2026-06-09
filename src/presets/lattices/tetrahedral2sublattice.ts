import type { Lattice } from "../../core/lattice/types";

export function tetrahedralTwoSublatticeLattice(): Lattice {
  return {
    id: "tetrahedral2",
    name: "Tetrahedral two-sublattice",
    dim: 3,
    a: [0, 0.5, 0.5],
    b: [0.5, 0, 0.5],
    c: [0.5, 0.5, 0],

    // Guide cell: cubic conventional cell, because tetrahedral coordination is easiest to see this way.
    conventionalBasis: { a: [1, 0, 0], b: [0, 1, 0], c: [0, 0, 1] },

    sites: [
      { id: 0, element: "A", position: [0, 0, 0], type: "A", color: 0x60a5fa },
      { id: 1, element: "B", position: [0.25, 0.25, 0.25], type: "B", color: 0xf97316 },
    ],
    visualSites: [
      { id: 0, element: "A", position: [0, 0, 0], type: "A", color: 0x60a5fa },
      { id: 1, element: "A", position: [0, 0.5, 0.5], type: "A", color: 0x60a5fa },
      { id: 2, element: "A", position: [0.5, 0, 0.5], type: "A", color: 0x60a5fa },
      { id: 3, element: "A", position: [0.5, 0.5, 0], type: "A", color: 0x60a5fa },
      { id: 4, element: "B", position: [0.25, 0.25, 0.25], type: "B", color: 0xf97316 },
      { id: 5, element: "B", position: [0.25, 0.75, 0.75], type: "B", color: 0xf97316 },
      { id: 6, element: "B", position: [0.75, 0.25, 0.75], type: "B", color: 0xf97316 },
      { id: 7, element: "B", position: [0.75, 0.75, 0.25], type: "B", color: 0xf97316 },
    ],
    highSymmetry: {
      G: { label: "Γ", kFrac: [0, 0, 0] },
      X: { label: "X", kFrac: [0, 0.5, 0.5] },
      L: { label: "L", kFrac: [0.5, 0.5, 0.5] },
      W: { label: "W", kFrac: [0.25, 0.75, 0.5] },
      K: { label: "K", kFrac: [0.375, 0.75, 0.375] },
    },
    defaultPath: ["G", "X", "W", "K", "G", "L"],
    visualBondCutoff: 0.45,
  };
}
