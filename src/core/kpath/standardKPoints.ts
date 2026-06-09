import type { Vec3 } from "../math/vec";
import { dot, norm } from "../math/vec";

export interface StandardKPath {
  highSymmetry: Record<string, { label: string; kFrac: Vec3 }>;
  defaultPath: string[];
  kPathConvention: "standard" | "schematic" | "parameter-dependent";
  kPathNotes?: string[];
}

export function bodyCenteredTetragonalKPath(a: number, c: number): StandardKPath {
  if (c <= 0 || a <= 0) {
    throw new Error("BCT lattice constants must be positive.");
  }

  if (c < a) {
    const eta = (1 + (c * c) / (a * a)) / 4;

    return {
      highSymmetry: {
        G: { label: "Γ", kFrac: [0, 0, 0] },
        X: { label: "X", kFrac: [0, 0, 0.5] },
        M: { label: "M", kFrac: [-0.5, 0.5, 0.5] },
        N: { label: "N", kFrac: [0, 0.5, 0] },
        P: { label: "P", kFrac: [0.25, 0.25, 0.25] },
        Z: { label: "Z", kFrac: [eta, eta, -eta] },
        Z1: { label: "Z₁", kFrac: [-eta, 1 - eta, eta] },
      },
      defaultPath: ["G", "X", "M", "G", "Z", "P", "N", "Z1", "M", "X", "P"],
      kPathConvention: "standard",
      kPathNotes: [
        "BCT1 path selected because c/a < 1.",
        "Coordinates follow the reciprocal primitive-basis convention.",
      ],
    };
  }

  const eta = (1 + (a * a) / (c * c)) / 4;
  const zeta = (a * a) / (2 * c * c);

  return {
    highSymmetry: {
      G: { label: "Γ", kFrac: [0, 0, 0] },
      X: { label: "X", kFrac: [0, 0, 0.5] },
      N: { label: "N", kFrac: [0, 0.5, 0] },
      P: { label: "P", kFrac: [0.25, 0.25, 0.25] },
      Y: { label: "Y", kFrac: [-zeta, zeta, 0.5] },
      Y1: { label: "Y₁", kFrac: [0.5, 0.5, -zeta] },
      S: { label: "Σ", kFrac: [-eta, eta, eta] },
      S1: { label: "Σ₁", kFrac: [eta, 1 - eta, -eta] },
      Z: { label: "Z", kFrac: [0.5, 0.5, -0.5] },
    },
    defaultPath: ["G", "X", "Y", "S", "G", "Z", "S1", "N", "P", "Y1", "Z", "X", "P"],
    kPathConvention: "standard",
    kPathNotes: [
      "BCT2 path selected because c/a >= 1.",
      "Coordinates follow the reciprocal primitive-basis convention.",
    ],
  };
}

export function rhombohedralKPath(a1: Vec3, a2: Vec3, a3: Vec3): StandardKPath {
  const a = norm(a1);
  const cosAlpha = dot(a1, a2) / (norm(a1) * norm(a2));
  const alphaDeg = Math.acos(Math.max(-1, Math.min(1, cosAlpha))) * 180 / Math.PI;

  if (alphaDeg < 90) {
    const eta = (1 + 4 * cosAlpha) / (2 + 4 * cosAlpha);
    const nu = 0.75 - eta / 2;

    return {
      highSymmetry: {
        G: { label: "Γ", kFrac: [0, 0, 0] },
        L: { label: "L", kFrac: [0.5, 0, 0] },
        L1: { label: "L₁", kFrac: [0, 0, -0.5] },
        B: { label: "B", kFrac: [eta, 0.5, 1 - eta] },
        B1: { label: "B₁", kFrac: [0.5, 1 - eta, eta - 1] },
        F: { label: "F", kFrac: [0.5, 0.5, 0] },
        P: { label: "P", kFrac: [eta, nu, nu] },
        P1: { label: "P₁", kFrac: [1 - nu, 1 - nu, 1 - eta] },
        P2: { label: "P₂", kFrac: [nu, nu, eta - 1] },
        Q: { label: "Q", kFrac: [1 - nu, nu, 0] },
        X: { label: "X", kFrac: [nu, 0, -nu] },
        Z: { label: "Z", kFrac: [0.5, 0.5, 0.5] },
      },
      defaultPath: ["G", "L", "B1", "B", "Z", "G", "X", "Q", "F", "P1", "Z", "L", "P"],
      kPathConvention: "standard",
      kPathNotes: [
        `RHL1 path selected because alpha ≈ ${alphaDeg.toFixed(1)}° < 90°.`,
        "Coordinates follow the reciprocal primitive-basis convention.",
      ],
    };
  }

  const tanHalf = Math.tan((Math.acos(cosAlpha)) / 2);
  const eta = 1 / (2 * tanHalf * tanHalf);
  const nu = 0.75 - eta / 2;

  return {
    highSymmetry: {
      G: { label: "Γ", kFrac: [0, 0, 0] },
      F: { label: "F", kFrac: [0.5, -0.5, 0] },
      L: { label: "L", kFrac: [0.5, 0, 0] },
      P: { label: "P", kFrac: [1 - nu, -nu, 1 - nu] },
      P1: { label: "P₁", kFrac: [nu, nu - 1, nu - 1] },
      Q: { label: "Q", kFrac: [eta, eta, eta] },
      Q1: { label: "Q₁", kFrac: [1 - eta, -eta, -eta] },
      Z: { label: "Z", kFrac: [0.5, -0.5, 0.5] },
    },
    defaultPath: ["G", "P", "Z", "Q", "G", "F", "P1", "Q1", "L", "Z"],
    kPathConvention: "standard",
    kPathNotes: [
      `RHL2 path selected because alpha ≈ ${alphaDeg.toFixed(1)}° >= 90°.`,
      "Coordinates follow the reciprocal primitive-basis convention.",
    ],
  };
}
