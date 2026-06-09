export interface Complex {
  re: number;
  im: number;
}

export const C0: Complex = { re: 0, im: 0 };

export function c(re: number, im = 0): Complex {
  return { re, im };
}

export function cadd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function csub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

export function cmul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

export function cscale(a: Complex, s: number): Complex {
  return { re: a.re * s, im: a.im * s };
}

export function cconj(a: Complex): Complex {
  return { re: a.re, im: -a.im };
}

export function cabs(a: Complex): number {
  return Math.hypot(a.re, a.im);
}

export function expi(theta: number): Complex {
  return { re: Math.cos(theta), im: Math.sin(theta) };
}
