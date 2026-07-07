// Morph-target generators. Every function fills an existing Float32Array of
// length count*3 so all shapes share one particle count and can be lerped
// against each other in the vertex shader. The set tells the story arc:
//
//   sphere   → genesis / the self          (HELLO_WORLD)
//   lattice  → structure / the machine      (TERMINAL)
//   knot     → interwoven systems           (PROJECTS)
//   diamond  → the peak / achievement       (AWARDS)
//   galaxy   → dispersal / spreading out     (ARTICLES → the void)

const GOLDEN = Math.PI * (3 - Math.sqrt(5));

function gaussianDir(): [number, number, number] {
  // Uniform direction on the unit sphere.
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const s = Math.sin(phi);
  return [s * Math.cos(theta), Math.cos(phi), s * Math.sin(theta)];
}

/** Clean shell of points via the Fibonacci sphere — a round silhouette. */
export function sphere(out: Float32Array, count: number, R = 2.6) {
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const y = 1 - 2 * t;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const az = i * GOLDEN;
    const rr = R * (0.97 + Math.random() * 0.04);
    out[i * 3] = Math.cos(az) * r * rr;
    out[i * 3 + 1] = y * rr;
    out[i * 3 + 2] = Math.sin(az) * r * rr;
  }
  return out;
}

/** Points on the SURFACE of a cube — a hard square silhouette, the "structure"
 *  beat. Hollow (not filled) so it reads as a box, unmistakably not the sphere. */
export function lattice(out: Float32Array, count: number, size = 4.6) {
  const s = size / 2;
  const j = 0.04;
  for (let i = 0; i < count; i++) {
    const face = i % 6;
    const u = (Math.random() * 2 - 1) * s;
    const v = (Math.random() * 2 - 1) * s;
    let x = 0,
      y = 0,
      z = 0;
    if (face === 0) (x = s), (y = u), (z = v);
    else if (face === 1) (x = -s), (y = u), (z = v);
    else if (face === 2) (x = u), (y = s), (z = v);
    else if (face === 3) (x = u), (y = -s), (z = v);
    else if (face === 4) (x = u), (y = v), (z = s);
    else (x = u), (y = v), (z = -s);
    out[i * 3] = x + (Math.random() - 0.5) * j;
    out[i * 3 + 1] = y + (Math.random() - 0.5) * j;
    out[i * 3 + 2] = z + (Math.random() - 0.5) * j;
  }
  return out;
}

/** (p,q) torus knot — a thin bright curve so the knot's holes read clearly. */
export function torusKnot(
  out: Float32Array,
  count: number,
  scale = 1.05,
  p = 3,
  q = 2,
  tube = 0.22
) {
  for (let i = 0; i < count; i++) {
    const u = (i / count) * Math.PI * 2;
    const r = Math.cos(q * u) + 2;
    const x = r * Math.cos(p * u);
    const y = r * Math.sin(p * u);
    const z = -Math.sin(q * u);
    const [ox, oy, oz] = gaussianDir();
    const tr = tube * Math.pow(Math.random(), 0.5);
    out[i * 3] = x * scale + ox * tr;
    out[i * 3 + 1] = y * scale + oy * tr;
    out[i * 3 + 2] = z * scale + oz * tr;
  }
  return out;
}

/** Octahedron surface, stretched vertically — a pointed rhombus, the peak. */
export function diamond(out: Float32Array, count: number, R = 2.7) {
  for (let i = 0; i < count; i++) {
    const [x, y, z] = gaussianDir();
    const l1 = Math.abs(x) + Math.abs(y) + Math.abs(z) || 1;
    out[i * 3] = (x / l1) * R;
    out[i * 3 + 1] = (y / l1) * R * 1.7;
    out[i * 3 + 2] = (z / l1) * R;
  }
  return out;
}

/** Spiral galaxy — the final dispersal into the cosmos. */
export function galaxy(out: Float32Array, count: number, R = 5, arms = 4) {
  for (let i = 0; i < count; i++) {
    const rr = Math.pow(Math.random(), 0.55) * R;
    const branch = ((i % arms) / arms) * Math.PI * 2;
    const spin = rr * 0.55;
    const angle = branch + spin;
    // Scatter tightens toward the core, loosens at the rim.
    const scat = () => (Math.random() - 0.5) * (0.25 + rr * 0.16);
    out[i * 3] = Math.cos(angle) * rr + scat();
    out[i * 3 + 1] = (Math.random() - 0.5) * (0.7 * (1 - rr / R) + 0.15);
    out[i * 3 + 2] = Math.sin(angle) * rr + scat();
  }
  return out;
}

/** Per-particle randoms (vec3 in 0..1): size, brightness, color mix / phase. */
export function randoms(count: number) {
  const a = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) a[i] = Math.random();
  return a;
}
