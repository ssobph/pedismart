import Mapbox, { Camera, LineLayer, LocationPuck, MapView, ShapeSource, SymbolLayer } from '@rnmapbox/maps';
import Config from '../constants/Config';

if (Config.mapboxAccessToken) {
  Mapbox.setAccessToken(Config.mapboxAccessToken);
} else {
  console.warn('Mapbox access token not found. Map functionality will be limited.');
}

export const DEFAULT_CAMERA_CONFIG = {
  zoomLevel: 15,
  animationDuration: 1000,
  animationMode: 'flyTo' as const,
};

export const MAP_STYLES = {
  STREET: 'mapbox://styles/mapbox/streets-v11',
  NAVIGATION: 'mapbox://styles/mapbox/navigation-day-v1',
  SATELLITE: 'mapbox://styles/mapbox/satellite-streets-v11',
};

export const DRIVER_MARKER_STYLE = {
  iconImage: 'pedicab-icon',
  iconSize: 0.8,
  iconAllowOverlap: true,
  iconIgnorePlacement: true,
  textField: ['get', 'name'],
  textFont: ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
  textSize: 12,
  textColor: '#000000',
  textHaloColor: '#FFFFFF',
  textHaloWidth: 1,
  textOffset: [0, 2],
  textAnchor: 'top',
};

// Passenger location puck configuration
export const USER_LOCATION_CONFIG = {
  visible: true,
  showsUserHeadingIndicator: true,
  pulsing: {
    isEnabled: true,
    color: '#007AFF',
    radius: 15,
  },
};


export const MAP_PERFORMANCE_CONFIG = {
  maxRenderableMarkers: 50,
  clusterMaxZoom: 15,
  clusterRadius: 50,
};

export { Camera, LineLayer, LocationPuck, Mapbox, MapView, ShapeSource, SymbolLayer };

