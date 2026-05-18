import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Mapbox, {
  Camera,
  FillExtrusionLayer,
  FillLayer,
  MapView,
  ShapeSource,
} from '@rnmapbox/maps';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '';
const styleURL =
  process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL ??
  'https://api.mapbox.com/styles/v1/mapbox/streets-v12';

Mapbox.setAccessToken(MAPBOX_TOKEN);

const center: [number, number] = [25.5887, 45.6427];
const maxBounds = { ne: [25.69, 45.71] as [number, number], sw: [25.49, 45.56] as [number, number] };

function square(lng: number, lat: number) {
  const dLng = 0.00016;
  const dLat = 0.0001;
  return [
    [lng - dLng, lat - dLat],
    [lng + dLng, lat - dLat],
    [lng + dLng, lat + dLat],
    [lng - dLng, lat + dLat],
    [lng - dLng, lat - dLat],
  ];
}

function inBounds(lng: number, lat: number) {
  return lng >= 25.49 && lng <= 25.69 && lat >= 45.56 && lat <= 45.71;
}

function toFeatureCollection(rings: number[][][]) {
  return {
    type: 'FeatureCollection' as const,
    features: rings.map((ring, i) => ({
      type: 'Feature' as const,
      properties: { id: i + 1, height: 4 + (i % 5) },
      geometry: { type: 'Polygon' as const, coordinates: [ring] },
    })),
  };
}

export default function MapNative() {
  const [spots, setSpots] = useState<number[][][]>(() => [square(25.5882, 45.6444)]);
  const shape = useMemo(() => toFeatureCollection(spots), [spots]);

  return (
    <View style={styles.root}>
      <MapView
        style={styles.map}
        styleURL={styleURL}
        localizeLabels={{ locale: 'ro' }}
        compassEnabled
        onPress={(e) => {
          const [lng, lat] = e.geometry.coordinates;
          if (!inBounds(lng, lat)) return;
          setSpots((prev) => {
            const next = [square(lng, lat), ...prev];
            return next.length > 30 ? next.slice(0, 30) : next;
          });
        }}>
        <Camera
          defaultSettings={{
            centerCoordinate: center,
            zoomLevel: 14,
            pitch: 55,
            heading: -12,
          }}
          maxBounds={maxBounds}
        />
        <ShapeSource id="parking-spots" shape={shape}>
          <FillLayer id="parking-fill" style={{ fillColor: '#1e6bff', fillOpacity: 0.28 }} />
          <FillExtrusionLayer
            id="parking-extrusion"
            minZoomLevel={0}
            maxZoomLevel={24}
            style={{
              fillExtrusionColor: '#2b86ff',
              fillExtrusionHeight: ['get', 'height'] as unknown as number,
              fillExtrusionBase: 0,
              fillExtrusionOpacity: 0.75,
            }}
          />
        </ShapeSource>
      </MapView>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Zone parcare Brasov</Text>
        <Text style={styles.panelText}>Brasov</Text>
        <Text style={styles.panelText}>Poly: {spots.length}</Text>
      </View>
      <Pressable style={styles.clear} onPress={() => setSpots([])}>
        <Text style={styles.clearText}>Sterge</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f7fb' },
  map: { flex: 1 },
  panel: {
    position: 'absolute',
    top: 52,
    left: 12,
    right: 12,
    backgroundColor: '#ffffffee',
    borderRadius: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d0d7e1',
  },
  panelTitle: { fontSize: 16, fontWeight: '800', color: '#0b1220' },
  panelText: { marginTop: 4, fontSize: 13, color: '#4f5f78' },
  clear: {
    position: 'absolute',
    bottom: 18,
    right: 12,
    borderRadius: 8,
    backgroundColor: '#1e6bff',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  clearText: { color: '#fff', fontWeight: '700' },
});
