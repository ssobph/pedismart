import { Images } from '@rnmapbox/maps';

export function MapboxImages() {
  // Custom pedicab marker as a simple green circle
  const pedicabMarker = require('../../../assets/images/pedicab-marker.png');

  return (
    <Images
      images={{
        'pedicab-marker': pedicabMarker,
      }}
    />
  );
}
