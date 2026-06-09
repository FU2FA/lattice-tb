import type { Vec3 } from "../math/vec";

export interface AtomSite {
  id: number;
  element: string;
  position: Vec3; // fractional coordinate in the basis used by this site collection
  type?: string;
  color?: number;
}

export interface HighSymmetryPoint {
  label: string;
  kFrac: Vec3; // reciprocal fractional coordinate
}

export interface Lattice {
  id: string;
  name: string;
  dim: 2 | 3;

  // Primitive lattice vectors. These are used for primitive-cell drawing,
  // reciprocal lattice, Brillouin zone, and TB-oriented geometric operations.
  a: Vec3;
  b: Vec3;
  c: Vec3;

  // Primitive-basis sites, mainly used by TB presets.
  sites: AtomSite[];

  // Optional conventional/visual cell. Atom rendering, nearest bonds,
  // simple cubic/XYZ cells, and repeated cell placement use this when present.
  conventionalBasis?: {
    a: Vec3;
    b: Vec3;
    c: Vec3;
  };

  // Optional drawing-only cell basis for simple / XYZ guide cells.
  // This does not affect atom generation, nearest-bond geometry, or TB calculation.
  simpleCellBasis?: {
    a: Vec3;
    b: Vec3;
    c: Vec3;
  };

  // Optional shape used for the blue display/guide cell.
  // "parallelepiped" is the default. "hex_prism" is useful for HCP/hexagonal
  // structures where a hexagonal prism is the more intuitive repeating guide.
  displayCellShape?: "parallelepiped" | "hex_prism";

  // Optional visual basis in conventionalBasis fractional coordinates.
  // This keeps BCC/FCC/diamond visualization clean while TB can still use
  // compact primitive-basis models.
  visualSites?: AtomSite[];

  highSymmetry: Record<string, HighSymmetryPoint>;
  defaultPath: string[];
  visualBondCutoff: number;
}
