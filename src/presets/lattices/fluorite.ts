import type { Lattice } from "../../core/lattice/types";

export function fluoriteLattice(): Lattice {
  return {
    id: "fluorite",
    name: "Fluorite CaF2",
    dim: 3,
    a: [0, 0.5, 0.5],
    b: [0.5, 0, 0.5],
    c: [0.5, 0.5, 0],
    conventionalBasis: {
      a: [1, 0, 0],
      b: [0, 1, 0],
      c: [0, 0, 1],
    },
    sites: [
      { id: 0, element: "Ca", position: [0, 0, 0], type: "Ca", color: 0x60a5fa },
      { id: 1, element: "F", position: [0.25, 0.25, 0.25], type: "F", color: 0xf97316 },
      { id: 2, element: "F", position: [0.75, 0.75, 0.75], type: "F", color: 0xf97316 },
    ],
    highSymmetry: {
      G: { label: "Γ", kFrac: [0, 0, 0] },
      X: { label: "X", kFrac: [0, 0.5, 0.5] },
      L: { label: "L", kFrac: [0.5, 0.5, 0.5] },
      W: { label: "W", kFrac: [0.25, 0.75, 0.5] },
    },
    defaultPath: ["G", "X", "W", "G", "L"],
    visualBondCutoff: 0.5,
  };
}
