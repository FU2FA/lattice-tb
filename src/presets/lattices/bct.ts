import type { Lattice } from "../../core/lattice/types";
import { bodyCenteredTetragonalKPath } from "../../core/kpath/standardKPoints";

export function bctLattice(): Lattice {
  const a0 = 1;
  const c0 = 1.6;
  const kPath = bodyCenteredTetragonalKPath(a0, c0);

  return {
    id: "bct",
    name: "Body-centered tetragonal",
    dim: 3,

    // Setyawan-Curtarolo body-centered tetragonal primitive vectors.
    // Conventional cell: a=b=a0, c=c0.
    a: [-a0 / 2, a0 / 2, c0 / 2],
    b: [a0 / 2, -a0 / 2, c0 / 2],
    c: [a0 / 2, a0 / 2, -c0 / 2],

    // Guide cell: tetragonal conventional prism with a body-center motif.
    conventionalBasis: {
      a: [a0, 0, 0],
      b: [0, a0, 0],
      c: [0, 0, c0],
    },
    visualSites: [
      { id: 0, element: "X", position: [0, 0, 0], type: "Corner", color: 0x60a5fa },
      { id: 1, element: "X", position: [0.5, 0.5, 0.5], type: "Body", color: 0xf97316 },
    ],

    sites: [{ id: 0, element: "X", position: [0, 0, 0], type: "X", color: 0x60a5fa }],
    highSymmetry: kPath.highSymmetry,
    defaultPath: kPath.defaultPath,
    kPathConvention: kPath.kPathConvention,
    kPathNotes: kPath.kPathNotes,
    visualBondCutoff: 0.9,
  };
}
