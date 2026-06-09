import type { Lattice } from "../../core/lattice/types";

export function orthorhombicLattice(): Lattice {
  return {
    id: "orthorhombic",
    name: "Simple orthorhombic",
    dim: 3,
    a: [1, 0, 0],
    b: [0, 1.35, 0],
    c: [0, 0, 1.75],

    // Guide cell: orthorhombic rectangular prism.
    conventionalBasis: {
      a: [1, 0, 0],
      b: [0, 1.35, 0],
      c: [0, 0, 1.75],
    },

    sites: [{ id: 0, element: "X", position: [0, 0, 0], type: "X", color: 0x60a5fa }],
    highSymmetry: {
      G: { label: "Γ", kFrac: [0, 0, 0] },
      X: { label: "X", kFrac: [0.5, 0, 0] },
      Y: { label: "Y", kFrac: [0, 0.5, 0] },
      Z: { label: "Z", kFrac: [0, 0, 0.5] },
      S: { label: "S", kFrac: [0.5, 0.5, 0] },
      U: { label: "U", kFrac: [0.5, 0, 0.5] },
      T: { label: "T", kFrac: [0, 0.5, 0.5] },
      R: { label: "R", kFrac: [0.5, 0.5, 0.5] },
    },
    defaultPath: ["G", "X", "S", "Y", "G", "Z", "U", "R", "T", "Z", "Y", "T", "U", "X", "S", "R"],
    kPathConvention: "standard",
    visualBondCutoff: 1.1,
  };
}
