// https://stackoverflow.com/questions/37984670/how-to-calculate-location-different-from-distance

const R = 6371008.8; 

export type LngLat = [number, number]; // [lng, lat]

export function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistanceMeters(a: LngLat, b: LngLat): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const sLat1 = toRadians(lat1);
  const sLat2 = toRadians(lat2);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(sLat1) * Math.cos(sLat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

function lonLatToMercatorMeters([lng, lat]: LngLat): [number, number] {
  const x = (toRadians(lng) * R);
  const y = R * Math.log(Math.tan(Math.PI / 4 + toRadians(lat) / 2));
  return [x, y];
}

export function pointToSegmentDistanceMeters(p: LngLat, a: LngLat, b: LngLat): number {
  const P = lonLatToMercatorMeters(p);
  const A = lonLatToMercatorMeters(a);
  const B = lonLatToMercatorMeters(b);

  const APx = P[0] - A[0];
  const APy = P[1] - A[1];
  const ABx = B[0] - A[0];
  const ABy = B[1] - A[1];
  const ab2 = ABx * ABx + ABy * ABy;
  const t = ab2 === 0 ? 0 : Math.max(0, Math.min(1, (APx * ABx + APy * ABy) / ab2));
  const Cx = A[0] + ABx * t;
  const Cy = A[1] + ABy * t;
  const dx = P[0] - Cx;
  const dy = P[1] - Cy;
  return Math.sqrt(dx * dx + dy * dy);
}

export function pointToLineDistanceMeters(p: LngLat, line: LngLat[]): number {
  if (!line || line.length < 2) return Infinity;
  let min = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    const d = pointToSegmentDistanceMeters(p, line[i], line[i + 1]);
    if (d < min) min = d;
  }
  return min;
}
