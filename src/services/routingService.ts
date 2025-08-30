import Config from '@/constants/Config';
import { LineString } from 'geojson';

type Coordinate = [number, number]; // [longitude, latitude]

export interface Route {
  geometry: LineString;
  duration: number; // seconds
  distance: number; // meters
}

export const routingService = {
  getRoute: async (coordinates: Coordinate[]): Promise<Route> => {
    if (coordinates.length < 2) {
      throw new Error('At least two coordinates are required for a route.');
    }

    const coordsString = coordinates.map(c => c.join(',')).join(';');
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsString}?geometries=geojson&overview=full&access_token=${Config.mapboxAccessToken}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.message || `HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      if (json.code !== 'Ok' || !json.routes || json.routes.length === 0) {
        throw new Error(json.message || 'No routes found.');
      }

      const route = json.routes[0];
      return {
        geometry: route.geometry,
        duration: route.duration,
        distance: route.distance,
      };
    } catch (error) {
      console.error('Error fetching route from Mapbox:', error);
      throw error;
    }
  },
};
