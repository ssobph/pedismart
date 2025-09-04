import Config from '@/constants/Config';
import type { Point } from 'geojson';

const MAPBOX_ACCESS_TOKEN =
  Config.mapboxAccessToken ||
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ||
  process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

const MAPBOX_BASE = 'https://api.mapbox.com/directions/v5/mapbox';

const DEFAULT_TIMEOUT_MS = 10000;
const MAX_COORDS = 12; // includes driver start point
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

export interface Waypoint {
  id: number;
  location: Point;
  passenger_id: string;
  kind: 'pickup' | 'dropoff';
  passenger_name?: string;
  address?: string | null;
}

export interface RouteResponse {
  polyline?: string;
  coordinates?: [number, number][];
  duration: number; // in seconds
  distance: number; // in meters
  orderedWaypoints: Waypoint[];
  legs?: Array<{
    steps: Array<{
      distance: number;
      duration: number;
      name?: string;
      maneuver: {
        instruction?: string;
        type?: string;
        modifier?: string;
        location: [number, number];
      };
      geometry?: { coordinates: [number, number][] };
    }>;
    distance: number;
    duration: number;
  }>;
}

class HttpError extends Error {
  status?: number;
  requestId?: string;
  code?: string;
  body?: any;

  constructor(message: string, status?: number, requestId?: string, code?: string, body?: any) {
    super(`Mapbox error: ${message}${status ? ` (status=${status})` : ''}${code ? ` code=${code}` : ''}${requestId ? ` request_id=${requestId}` : ''}`);
    this.name = 'HttpError';
    this.status = status;
    this.requestId = requestId;
    this.code = code;
    this.body = body;
  }
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const requestOnce = async (url: string, timeoutMs: number = DEFAULT_TIMEOUT_MS) => {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: ctrl.signal,
    });

    const reqId = res.headers.get('x-request-id') || undefined;
    const text = await res.text();

    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new HttpError('Invalid JSON in response', res.status, reqId, undefined, text);
    }

    const code = data?.code;
    if (!res.ok || (code && code !== 'Ok')) {
      const msg = data?.message || data?.error || res.statusText || 'Unknown Mapbox error';
      throw new HttpError(msg, res.status, reqId, code, data);
    }

    return { data, res };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error(`Mapbox request aborted after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(to);
  }
};

const fetchJsonWithRetry = async (url: string, opts?: { timeoutMs?: number; maxRetries?: number }) => {
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = opts?.maxRetries ?? 2;

  let lastErr: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestOnce(url, timeoutMs);
    } catch (err: any) {
      lastErr = err;
      const status = err?.status as number | undefined;
      const isRetryable =
        (status !== undefined && RETRYABLE_STATUSES.has(status)) ||
        (status === undefined && err?.name !== 'AbortError'); // network errors without status

      if (attempt < maxRetries && isRetryable) {
        const backoff = Math.min(1000 * Math.pow(2, attempt), 4000) + Math.floor(Math.random() * 250);
        await delay(backoff);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
};

export const routingService = {
  /**
   * Optimize a route starting from the driver's current location across multiple waypoints.
   * Uses Mapbox Optimization API with geojson geometry and optional traffic profile.
   * - Start is fixed to the driver's current location
   * - Destination is allowed to be any (API chooses best last stop)
   * - Pickup/Dropoff precedence is enforced via distributions when possible
   */
  optimizeRoute: async (
    driverLocation: Point,
    waypoints: Waypoint[],
    options?: { traffic?: boolean }
  ): Promise<RouteResponse> => {
    if (!MAPBOX_ACCESS_TOKEN) {
      throw new Error('Mapbox access token is not configured.');
    }
    if (waypoints.length === 0) {
      return { polyline: '', duration: 0, distance: 0, orderedWaypoints: [] };
    }

    if (1 + waypoints.length > MAX_COORDS) {
      console.warn(
        `Optimization skipped: ${1 + waypoints.length} coordinates exceed limit ${MAX_COORDS}. Falling back to non-optimized route.`
      );
      return routingService.buildMultiStopRoute(driverLocation, waypoints, options);
    }

    // build list: driver first, then all waypoints
    const allCoords = [driverLocation, ...waypoints.map((w) => w.location)]
      .map((pt) => pt.coordinates.join(','))
      .join(';');

    // build distributions to enforce pickup before dropoff per passenger
    // indices are based on coordinates array above (driver at 0, waypoints start at 1)
    const pickupIndexByPassenger = new Map<string, number>();
    const dropoffIndexByPassenger = new Map<string, number>();
    waypoints.forEach((wp, idx) => {
      const coordIndex = idx + 1;
      if (wp.kind === 'pickup') pickupIndexByPassenger.set(wp.passenger_id, coordIndex);
      if (wp.kind === 'dropoff') dropoffIndexByPassenger.set(wp.passenger_id, coordIndex);
    });

    const distributionsPairs: string[] = [];
    pickupIndexByPassenger.forEach((pickupIdx, pid) => {
      const dropIdx = dropoffIndexByPassenger.get(pid);
      if (typeof dropIdx === 'number') {
        distributionsPairs.push(`${pickupIdx},${dropIdx}`);
      }
    });

    const profile = options?.traffic ? 'driving-traffic' : 'driving';
    const approaches = ['unrestricted', ...waypoints.map(() => 'curb')].join(';');

    const params = new URLSearchParams({
      source: 'first',
      destination: 'any',
      roundtrip: 'false',
      overview: 'full',
      steps: 'true',
      geometries: 'geojson',
      annotations: 'distance,duration',
      access_token: MAPBOX_ACCESS_TOKEN,
    });
    params.set('approaches', approaches);
    if (distributionsPairs.length > 0) {
      params.set('distributions', distributionsPairs.join(';')); // semicolon-separated pickup,dropoff pairs
    }

    const url = `https://api.mapbox.com/optimized-trips/v1/mapbox/${profile}/${allCoords}?${params.toString()}`;

    try {
      const { data } = await fetchJsonWithRetry(url);

      const trip = data.trips?.[0];
      if (!trip) {
        throw new Error('No optimized trip returned by Mapbox.');
      }

      // unassigned waypoints occur when constraints can’t be satisfied or points are off-road.
      if (Array.isArray(data.unassigned) && data.unassigned.length > 0) {
        console.warn(
          `Optimization returned ${data.unassigned.length} unassigned waypoint(s). Falling back to ordered route.`
        );
        return routingService.buildMultiStopRoute(driverLocation, waypoints, options);
      }

      // build ordered waypoints using waypoint_index from the optimization result.
      // data.waypoints is aligned with input coordinates; driver is at index 0.
      const inputWaypointsWithIndices = waypoints.map((wp, i) => ({ wp, inputIndex: i + 1 }));

      const ordered = inputWaypointsWithIndices
        .map(({ wp, inputIndex }) => {
          const info = data.waypoints?.[inputIndex];
          const order =
            typeof info?.waypoint_index === 'number' ? info.waypoint_index : Number.MAX_SAFE_INTEGER;
          return { order, wp };
        })
        .sort((a, b) => a.order - b.order)
        .map(({ wp }) => wp);

      return {
        coordinates: trip.geometry?.coordinates,
        duration: trip.duration,
        distance: trip.distance,
        orderedWaypoints: ordered,
        legs: trip.legs?.map((leg: any) => ({
          distance: leg.distance,
          duration: leg.duration,
          steps: (leg.steps || []).map((s: any) => ({
            distance: s.distance,
            duration: s.duration,
            name: s.name,
            maneuver: {
              instruction: s.maneuver?.instruction,
              type: s.maneuver?.type,
              modifier: s.maneuver?.modifier,
              location: s.maneuver?.location,
            },
            geometry: s.geometry,
          })),
        })),
      };
    } catch (error) {
      console.error('Error optimizing multi-stop route:', error);
      throw error;
    }
  },

  buildMultiStopRoute: async (
    driverLocation: Point,
    waypoints: Waypoint[],
    options?: { traffic?: boolean }
  ): Promise<RouteResponse> => {
    if (!MAPBOX_ACCESS_TOKEN) {
      throw new Error('Mapbox access token is not configured.');
    }
    if (waypoints.length === 0) {
      return { polyline: '', duration: 0, distance: 0, orderedWaypoints: [] };
    }

    // coordinates in 'longitude,latitude'
    const coordinates = [
      driverLocation.coordinates.join(','),
      ...waypoints.map((wp) => wp.location.coordinates.join(',')),
    ].join(';');

    const profile = options?.traffic ? 'driving-traffic' : 'driving';
    const approaches = ['unrestricted', ...waypoints.map(() => 'curb')].join(';');

    const params = new URLSearchParams({
      overview: 'full',
      steps: 'true',
      geometries: 'geojson',
      annotations: 'distance,duration',
      access_token: MAPBOX_ACCESS_TOKEN,
    });
    params.set('approaches', approaches);

    const url = `${MAPBOX_BASE}/${profile}/${coordinates}?${params.toString()}`;

    try {
      const { data } = await fetchJsonWithRetry(url);

      if (!Array.isArray(data.routes) || data.routes.length === 0) {
        throw new Error('Mapbox directions returned no routes.');
      }

      const route = data.routes[0];
      return {
        coordinates: route.geometry?.coordinates,
        duration: route.duration,
        distance: route.distance,
        orderedWaypoints: waypoints, // preserves input order
        legs: route.legs?.map((leg: any) => ({
          distance: leg.distance,
          duration: leg.duration,
          steps: (leg.steps || []).map((s: any) => ({
            distance: s.distance,
            duration: s.duration,
            name: s.name,
            maneuver: {
              instruction: s.maneuver?.instruction,
              type: s.maneuver?.type,
              modifier: s.maneuver?.modifier,
              location: s.maneuver?.location,
            },
            geometry: s.geometry,
          })),
        })),
      };
    } catch (error) {
      console.error('Error building multi-stop route:', error);
      throw error;
    }
  },
};