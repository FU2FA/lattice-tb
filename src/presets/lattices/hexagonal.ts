import type { Lattice } from "../../core/lattice/types";

export function hexagonalLattice(): Lattice {
  const sqrt3 = Math.sqrt(3);
  const c = 1.6;

  return {
    id: "hexagonal",
    name: "Hexagonal",
    dim: 3,
    a: [1, 0, 0],
    b: [0.5, sqrt3 / 2, 0],
    c: [0, 0, c],

    // Guide cell: hexagonal prism. Atom rendering is clipped to this actual hexagonal prism, not to the parallelogram of the center translations.
    simpleCellBasis: {
      a: [1.5, sqrt3 / 2, 0],
      b: [0, sqrt3, 0],
      c: [0, 0, c],
    },
    displayCellShape: "hex_prism",

    sites: [{ id: 0, element: "X", position: [0, 0, 0], type: "X", color: 0x60a5fa }],
    highSymmetry: {
      G: { label: "Γ", kFrac: [0, 0, 0] },
      M: { label: "M", kFrac: [0.5, 0, 0] },
      K: { label: "K", kFrac: [2 / 3, 1 / 3, 0] },
      A: { label: "A", kFrac: [0, 0, 0.5] },
      L: { label: "L", kFrac: [0.5, 0, 0.5] },
      H: { label: "H", kFrac: [2 / 3, 1 / 3, 0.5] },
    },
    defaultPath: ["G", "M", "K", "G", "A", "L", "H", "A"],
    visualBondCutoff: 1.05,
  };
}
