import type { Lattice } from "../../core/lattice/types";

export function perovskiteLattice(): Lattice {
  return {
    id: "perovskite",
    name: "Perovskite ABO3",
    dim: 3,
    a: [1, 0, 0],
    b: [0, 1, 0],
    c: [0, 0, 1],
    conventionalBasis: {
      a: [1, 0, 0],
      b: [0, 1, 0],
      c: [0, 0, 1],
    },
    sites: [
      { id: 0, element: "A", position: [0, 0, 0], type: "A", color: 0x60a5fa },
      { id: 1, element: "B", position: [0.5, 0.5, 0.5], type: "B", color: 0xf97316 },
      { id: 2, element: "O", position: [0.5, 0.5, 0], type: "O", color: 0x22c55e },
      { id: 3, element: "O", position: [0.5, 0, 0.5], type: "O", color: 0x22c55e },
      { id: 4, element: "O", position: [0, 0.5, 0.5], type: "O", color: 0x22c55e },
    ],
    highSymmetry: {
      G: { label: "Γ", kFrac: [0, 0, 0] },
      X: { label: "X", kFrac: [0.5, 0, 0] },
      M: { label: "M", kFrac: [0.5, 0.5, 0] },
      R: { label: "R", kFrac: [0.5, 0.5, 0.5] },
    },
    defaultPath: ["G", "X", "M", "G", "R", "X"],
    visualBondCutoff: 0.55,
  };
}
