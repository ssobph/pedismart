import { Point } from 'geojson';

const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_DIRECTIONS_API = 'https://api.mapbox.com/directions/v5/mapbox/driving';

export interface Waypoint {
  id: number;
  location: Point;
  passenger_id: string;
  kind: 'pickup' | 'dropoff';
  passenger_name?: string;
  address?: string | null;
}

export interface RouteResponse {
  polyline: string;
  duration: number; // in seconds
  distance: number; // in meters
  orderedWaypoints: Waypoint[];
}

export const routingService = {
  buildMultiStopRoute: async (
    driverLocation: Point,
    waypoints: Waypoint[]
  ): Promise<RouteResponse> => {
    if (!MAPBOX_ACCESS_TOKEN) {
      throw new Error('Mapbox access token is not configured.');
    }
    if (waypoints.length === 0) {
      return { polyline: '', duration: 0, distance: 0, orderedWaypoints: [] };
    }

    // Mapbox expects coordinates in 'longitude,latitude' format
    const coordinates = [
      driverLocation.coordinates.join(','),
      ...waypoints.map((wp) => wp.location.coordinates.join(',')),
    ].join(';');

    const url = `${MAPBOX_DIRECTIONS_API}/${coordinates}?overview=full&steps=true&geometries=polyline6&access_token=${MAPBOX_ACCESS_TOKEN}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.code !== 'Ok') {
        throw new Error(`Mapbox API Error: ${data.message}`);
      }

      const route = data.routes[0];
      return {
        polyline: route.geometry,
        duration: route.duration,
        distance: route.distance,
        orderedWaypoints: waypoints, // Note: Mapbox Directions API returns waypoints in the order they were passed. For optimization, use the Optimization API.
      };
    } catch (error) {
      console.error('Error building multi-stop route:', error);
      throw error;
    }
  },
};
