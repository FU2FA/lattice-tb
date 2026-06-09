import type { Lattice } from "../../core/lattice/types";
import { scLattice } from "./sc";
import { bccLattice } from "./bcc";
import { fccLattice } from "./fcc";
import { tetragonalLattice } from "./tetragonal";
import { bctLattice } from "./bct";
import { orthorhombicLattice } from "./orthorhombic";
import { hexagonalLattice } from "./hexagonal";
import { rhombohedralLattice } from "./rhombohedral";

import { hcpLattice } from "./hcp";
import { diamondLattice } from "./diamond";
import { octahedralTwoSublatticeLattice } from "./octahedral2sublattice";
import { cubicABX3Lattice } from "./cubicABX3";
import { cubicAX2Lattice } from "./cubicAX2";
import { hexagonalTwoSublatticeLattice } from "./hexagonal2sublattice";

import { square2DLattice } from "./square2d";
import { triangular2DLattice } from "./triangular2d";
import { honeycombLattice } from "./graphene";
import { kagome2DLattice } from "./kagome2d";
import { lieb2DLattice } from "./lieb2d";
import { dice2DLattice } from "./dice2d";

export function allLattices(): Lattice[] {
  return [
    // 3D Bravais lattices
    scLattice(),
    bccLattice(),
    fccLattice(),
    tetragonalLattice(),
    bctLattice(),
    orthorhombicLattice(),
    hexagonalLattice(),
    rhombohedralLattice(),

    // 3D structures with characteristic basis / framework
    hcpLattice(),
    diamondLattice(),
    octahedralTwoSublatticeLattice(),
    cubicABX3Lattice(),
    cubicAX2Lattice(),
    hexagonalTwoSublatticeLattice(),

    // 2D lattices
    square2DLattice(),
    triangular2DLattice(),
    honeycombLattice(),
    kagome2DLattice(),
    lieb2DLattice(),
    dice2DLattice(),
  ];
}

export function latticeById(id: string): Lattice {
  const lattice = allLattices().find((item) => item.id === id);
  if (!lattice) throw new Error(`Unknown lattice ${id}`);
  return lattice;
}
