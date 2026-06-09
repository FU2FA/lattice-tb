import type { Lattice } from "../../core/lattice/types";

export function bccLattice(): Lattice {
  return {
    id: "bcc",
    name: "Body-centered cubic",
    dim: 3,
    // Primitive vectors in conventional cubic coordinates with a0 = 1.
    a: [0.5, 0.5, -0.5],
    b: [0.5, -0.5, 0.5],
    c: [-0.5, 0.5, 0.5],
    conventionalBasis: {
      a: [1, 0, 0],
      b: [0, 1, 0],
      c: [0, 0, 1],
    },
    // TB primitive site collection.
    sites: [{ id: 0, element: "X", position: [0, 0, 0], type: "corner", color: 0x60a5fa }],
    // Conventional visual motif.
    visualSites: [
      { id: 0, element: "X", position: [0, 0, 0], type: "corner", color: 0x60a5fa },
      { id: 1, element: "X", position: [0.5, 0.5, 0.5], type: "body", color: 0xf97316 },
    ],
    highSymmetry: {
      G: { label: "Γ", kFrac: [0, 0, 0] },
      H: { label: "H", kFrac: [0.5, -0.5, 0.5] },
      N: { label: "N", kFrac: [0, 0, 0.5] },
      P: { label: "P", kFrac: [0.25, 0.25, 0.25] },
    },
    defaultPath: ["G", "H", "N", "G", "P", "H"],
    visualBondCutoff: 0.9,
  };
}
