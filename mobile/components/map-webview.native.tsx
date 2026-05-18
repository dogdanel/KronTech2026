import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '';
const styleURL =
  process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL ??
  'https://api.mapbox.com/styles/v1/mapbox/streets-v12';

function buildHtml(accessToken: string, style: string) {
  const safeToken = JSON.stringify(accessToken);
  const safeStyle = JSON.stringify(style);
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
  <link href="https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.css" rel="stylesheet" />
  <style>
    html, body, #map { margin:0; padding:0; height:100%; width:100%; }
    .mapboxgl-ctrl-bottom-left, .mapboxgl-ctrl-bottom-right { display:none; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.js"></script>
  <script>
    mapboxgl.accessToken = ${safeToken};
    const brasovCenter = [25.5887, 45.6427];
    const maxBounds = [[25.49, 45.56], [25.69, 45.71]];
    const sourceId = 'parking-spots';
    const spots = [];

    const map = new mapboxgl.Map({
      container: 'map',
      style: ${safeStyle},
      center: brasovCenter,
      zoom: 14,
      pitch: 55,
      bearing: -12,
      maxBounds,
      attributionControl: false
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    function square(lng, lat) {
      const dLng = 0.00016;
      const dLat = 0.0001;
      return [[lng-dLng,lat-dLat],[lng+dLng,lat-dLat],[lng+dLng,lat+dLat],[lng-dLng,lat+dLat],[lng-dLng,lat-dLat]];
    }

    function updateSource() {
      const fc = {
        type: 'FeatureCollection',
        features: spots.map((s, i) => ({
          type: 'Feature',
          properties: { id: i + 1, height: 4 + (i % 5) },
          geometry: { type: 'Polygon', coordinates: [s] }
        }))
      };
      const src = map.getSource(sourceId);
      if (src) src.setData(fc);
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(String(spots.length));
    }

    map.on('load', () => {
      map.addSource(sourceId, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
      map.addLayer({
        id: 'parking-fill',
        type: 'fill',
        source: sourceId,
        paint: { 'fill-color': '#1e6bff', 'fill-opacity': 0.28 }
      });
      map.addLayer({
        id: 'parking-extrusion',
        type: 'fill-extrusion',
        source: sourceId,
        paint: {
          'fill-extrusion-color': '#2b86ff',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.75
        }
      });
      spots.push(square(25.5882, 45.6444));
      updateSource();
    });

    map.on('click', (e) => {
      const lng = e.lngLat.lng;
      const lat = e.lngLat.lat;
      if (lng < 25.49 || lng > 25.69 || lat < 45.56 || lat > 45.71) return;
      spots.unshift(square(lng, lat));
      if (spots.length > 30) spots.pop();
      updateSource();
    });

    window.clearPolygons = function () {
      spots.length = 0;
      updateSource();
    };
  </script>
</body>
</html>`;
}

export default function MapWebView() {
  const ref = useRef<WebView>(null);
  const [count, setCount] = useState(1);
  const source = useMemo(() => ({ html: buildHtml(token, styleURL) }), []);

  return (
    <View style={styles.root}>
      <WebView
        ref={ref}
        originWhitelist={['*']}
        source={source}
        onMessage={(e) => {
          const value = Number(e.nativeEvent.data);
          if (Number.isFinite(value)) setCount(value);
        }}
      />
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Zone parcare Brasov</Text>
        <Text style={styles.panelText}>Brasov</Text>
        <Text style={styles.panelText}>Poly: {count}</Text>
      </View>
      <Pressable
        style={styles.clear}
        onPress={() => {
          ref.current?.injectJavaScript('window.clearPolygons && window.clearPolygons(); true;');
          setCount(0);
        }}>
        <Text style={styles.clearText}>Sterge</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f7fb' },
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
