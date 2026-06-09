export type Vec3 = [number, number, number];
export type Int3 = [number, number, number];

export function vadd(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function vsub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function vscale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

export function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function norm(a: Vec3): number {
  return Math.sqrt(dot(a, a));
}

export function normalize(a: Vec3): Vec3 {
  const n = norm(a);
  if (n < 1e-12) return [0, 0, 0];
  return vscale(a, 1 / n);
}

export function fracToCart(frac: Vec3, a: Vec3, b: Vec3, c: Vec3): Vec3 {
  return vadd(vadd(vscale(a, frac[0]), vscale(b, frac[1])), vscale(c, frac[2]));
}

export function intToCart(cell: Int3, a: Vec3, b: Vec3, c: Vec3): Vec3 {
  return fracToCart([cell[0], cell[1], cell[2]], a, b, c);
}

export function lerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}
