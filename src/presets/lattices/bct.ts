import type { Lattice } from "../../core/lattice/types";

export function bctLattice(): Lattice {
  return {
    id: "bct",
    name: "Body-centered tetragonal",
    dim: 3,
    a: [0.5, -0.5, 0.8],
    b: [0.5, 0.5, 0.8],
    c: [-0.5, -0.5, 0.8],

    // Guide cell: tetragonal conventional prism with a body-center motif.
    conventionalBasis: {
      a: [1, 0, 0],
      b: [0, 1, 0],
      c: [0, 0, 1.6],
    },
    visualSites: [
      { id: 0, element: "X", position: [0, 0, 0], type: "Corner", color: 0x60a5fa },
      { id: 1, element: "X", position: [0.5, 0.5, 0.5], type: "Body", color: 0xf97316 },
    ],

    sites: [{ id: 0, element: "X", position: [0, 0, 0], type: "X", color: 0x60a5fa }],
    highSymmetry: {
      G: { label: "Γ", kFrac: [0, 0, 0] },
      X: { label: "X", kFrac: [0.5, 0, 0] },
      M: { label: "M", kFrac: [0.5, 0.5, 0] },
      Z: { label: "Z", kFrac: [0, 0, 0.5] },
    },
    defaultPath: ["G", "X", "M", "G", "Z", "X"],
    visualBondCutoff: 0.9,
  };
}
