import type { Lattice } from "../../core/lattice/types";

export function fccLattice(): Lattice {
  return {
    id: "fcc",
    name: "Face-centered cubic",
    dim: 3,
    // Primitive vectors in conventional cubic coordinates with a0 = 1.
    a: [0, 0.5, 0.5],
    b: [0.5, 0, 0.5],
    c: [0.5, 0.5, 0],
    conventionalBasis: {
      a: [1, 0, 0],
      b: [0, 1, 0],
      c: [0, 0, 1],
    },
    sites: [{ id: 0, element: "X", position: [0, 0, 0], type: "fcc", color: 0x60a5fa }],
    visualSites: [
      { id: 0, element: "X", position: [0, 0, 0], type: "fcc", color: 0x60a5fa },
      { id: 1, element: "X", position: [0, 0.5, 0.5], type: "fcc", color: 0x60a5fa },
      { id: 2, element: "X", position: [0.5, 0, 0.5], type: "fcc", color: 0x60a5fa },
      { id: 3, element: "X", position: [0.5, 0.5, 0], type: "fcc", color: 0x60a5fa },
    ],
    highSymmetry: {
      G: { label: "Γ", kFrac: [0, 0, 0] },
      X: { label: "X", kFrac: [0, 0.5, 0.5] },
      L: { label: "L", kFrac: [0.5, 0.5, 0.5] },
      W: { label: "W", kFrac: [0.25, 0.75, 0.5] },
      K: { label: "K", kFrac: [0.375, 0.75, 0.375] },
    },
    defaultPath: ["G", "X", "W", "K", "G", "L"],
    visualBondCutoff: 0.73,
  };
}
