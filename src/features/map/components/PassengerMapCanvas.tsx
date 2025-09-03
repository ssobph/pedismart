import { Camera, DEFAULT_CAMERA_CONFIG, LocationPuck, MAP_STYLES, MapView, ShapeSource, SymbolLayer, USER_LOCATION_CONFIG } from '@/lib/mapbox';
import { useRef } from 'react';
import { StyleSheet } from 'react-native';

type FeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Point, { id: string; name: string; plateNumber?: string; distance?: number }>;

type AssignedDriver = {
  id: string;
  coordinate: [number, number]; // [lng, lat]
  name?: string;
};

interface Props {
  center: [number, number]; // [lng, lat]
  driversGeoJSON: FeatureCollection;
  onMapReady?: () => void;
  assignedDriver?: AssignedDriver | null;
}

export function PassengerMapCanvas({ center, driversGeoJSON, onMapReady, assignedDriver }: Props) {
  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<Camera>(null);

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFillObject}
      styleURL={MAP_STYLES.NAVIGATION}
      zoomEnabled
      scrollEnabled
      pitchEnabled={false}
      rotateEnabled={false}
      scaleBarEnabled={false}
      logoEnabled={false}
      attributionEnabled={false}
      onDidFinishLoadingMap={onMapReady}
    >
      <Camera
        ref={cameraRef}
        zoomLevel={DEFAULT_CAMERA_CONFIG.zoomLevel}
        centerCoordinate={center}
        animationMode={DEFAULT_CAMERA_CONFIG.animationMode}
        animationDuration={DEFAULT_CAMERA_CONFIG.animationDuration}
      />

      <LocationPuck visible={USER_LOCATION_CONFIG.visible} pulsing={USER_LOCATION_CONFIG.pulsing} />

      <ShapeSource
        id="drivers"
        shape={driversGeoJSON as any}
        cluster
        clusterRadius={50}
        clusterMaxZoomLevel={15}
        maxZoomLevel={20}
      >
        <SymbolLayer
          id="driver-symbols"
          filter={['!', ['has', 'point_count']]}
          style={{
            iconImage: 'bicycle-15',
            iconSize: 1.2,
            iconAllowOverlap: true,
            iconIgnorePlacement: true,
            textField: ['get', 'name'],
            textFont: ['Open Sans Regular', 'Arial Unicode MS Regular'],
            textSize: 12,
            textColor: '#000000',
            textHaloColor: '#FFFFFF',
            textHaloWidth: 1,
            textOffset: [0, 2],
            textAnchor: 'top',
          }}
        />

        <SymbolLayer
          id="driver-clusters"
          filter={['has', 'point_count']}
          style={{
            iconImage: 'circle-15',
            iconSize: 2,
            iconColor: '#4A90E2',
            textField: ['get', 'point_count'],
            textFont: ['Open Sans Bold', 'Arial Unicode MS Bold'],
            textSize: 14,
            textColor: '#FFFFFF',
          }}
        />
      </ShapeSource>

      {assignedDriver && (
        <ShapeSource
          id="assigned-driver"
          shape={{
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: assignedDriver.coordinate },
                properties: { id: assignedDriver.id, name: assignedDriver.name || 'Your Driver' },
              },
            ],
          }}
        >
          <SymbolLayer
            id="assigned-driver-symbol"
            style={{
              iconImage: 'car-15',
              iconSize: 1.4,
              iconColor: '#27AE60',
              iconAllowOverlap: true,
              iconIgnorePlacement: true,
              textField: ['get', 'name'],
              textFont: ['Open Sans Bold', 'Arial Unicode MS Bold'],
              textSize: 12,
              textColor: '#2C3E50',
              textHaloColor: '#FFFFFF',
              textHaloWidth: 1,
              textOffset: [0, 1.8],
              textAnchor: 'top',
            }}
          />
        </ShapeSource>
      )}
    </MapView>
  );
}
