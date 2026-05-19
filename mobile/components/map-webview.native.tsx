import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/auth-context';
import { fetchAllSpots, fetchAllBookings, getSpotColor, BRASOV_BOUNDS, type ParkingSpot, type Booking, type PinColor } from '../lib/parking';
import PublishModal from './publish-modal';
import RentSheet from './rent-sheet';

const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '';
const styleURL = process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL ?? 'https://api.mapbox.com/styles/v1/mapbox/streets-v12';
const PIN_COLORS: Record<PinColor, string> = { red: '#e53935', yellow: '#fdd835', green: '#43a047', blue: '#1e88e5' };

function buildHtml(t: string, s: string) {
  const sw = BRASOV_BOUNDS.sw, ne = BRASOV_BOUNDS.ne;
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<link href="https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.css" rel="stylesheet"/>
<style>html,body,#map{margin:0;padding:0;height:100%;width:100%}.mapboxgl-ctrl-bottom-left,.mapboxgl-ctrl-bottom-right{display:none}
.user-marker{width:18px;height:18px;border-radius:50%;background:#1e6bff;border:3px solid #fff;box-shadow:0 0 8px rgba(30,107,255,.5)}
.pin{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2.5px solid #fff;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.3);font-weight:900;font-size:14px;color:#fff;font-family:sans-serif}
.temp-pin{width:40px;height:40px;border-radius:50%;background:#1e88e5;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.4);font-size:18px;font-weight:900;color:#fff;font-family:sans-serif}
</style></head><body><div id="map"></div>
<script src="https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.js"></script>
<script>
mapboxgl.accessToken=${JSON.stringify(t)};var userMarker=null,spotMarkers=[],tempMarker=null,pinMode=false;
var map=new mapboxgl.Map({container:'map',style:${JSON.stringify(s)},center:[25.5887,45.6427],zoom:14,pitch:55,bearing:-12,attributionControl:false,maxBounds:[[${sw[0]},${sw[1]}],[${ne[0]},${ne[1]}]]});
window.setUserLocation=function(a,b){if(userMarker)userMarker.setLngLat([a,b]);else{var e=document.createElement('div');e.className='user-marker';userMarker=new mapboxgl.Marker(e).setLngLat([a,b]).addTo(map)}};
window.flyToLocation=function(a,b){window.setUserLocation(a,b);map.flyTo({center:[a,b],zoom:15,pitch:55,duration:1000})};
window.setSpots=function(j){spotMarkers.forEach(function(m){m.remove()});spotMarkers=[];var spots=JSON.parse(j);spots.forEach(function(s){var e=document.createElement('div');e.className='pin';e.style.backgroundColor=s.color;e.innerText='P';e.onclick=function(ev){ev.stopPropagation();window.ReactNativeWebView.postMessage(JSON.stringify({type:'spotTap',id:s.id}))};var m=new mapboxgl.Marker(e).setLngLat([s.lng,s.lat]).addTo(map);spotMarkers.push(m)})};
window.setPinMode=function(v){pinMode=v};
window.clearTempPin=function(){if(tempMarker){tempMarker.remove();tempMarker=null}};
map.on('click',function(e){if(!pinMode)return;var lng=e.lngLat.lng,lat=e.lngLat.lat;if(tempMarker)tempMarker.setLngLat([lng,lat]);else{var el=document.createElement('div');el.className='temp-pin';el.innerText='P';tempMarker=new mapboxgl.Marker(el).setLngLat([lng,lat]).addTo(map)}window.ReactNativeWebView.postMessage(JSON.stringify({type:'pinPlaced',lng:lng,lat:lat}))});
</script></body></html>`;
}

export default function MapWebView() {
  const ref = useRef<WebView>(null);
  const source = useMemo(() => ({ html: buildHtml(token, styleURL) }), []);
  const [ready, setReady] = useState(false);
  const { user } = useAuth();
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [showPublish, setShowPublish] = useState(false);
  const [publishCoords, setPublishCoords] = useState<[number, number] | null>(null);
  const [placingPin, setPlacingPin] = useState(false);
  const [pinReady, setPinReady] = useState(false);

  const loadData = useCallback(async () => {
    try { const [s, b] = await Promise.all([fetchAllSpots(), fetchAllBookings()]); setSpots(s); setBookings(b); } catch {}
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!ready || !ref.current || spots.length === 0) return;
    const d = spots.map(s => ({ id: s.id, lng: s.longitude, lat: s.latitude, color: PIN_COLORS[getSpotColor(s, bookings, user?.id)] }));
    ref.current.injectJavaScript(`window.setSpots(${JSON.stringify(JSON.stringify(d))}); true;`);
  }, [ready, spots, bookings, user?.id]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        let loc = await Location.getCurrentPositionAsync({}).catch(() => null);
        if (!loc) loc = await Location.getLastKnownPositionAsync().catch(() => null);
        if (!loc) return;
        if (ready && ref.current) ref.current.injectJavaScript(`window.setUserLocation(${loc.coords.longitude},${loc.coords.latitude}); true;`);
      } catch {}
    })();
  }, [ready]);

  const goToMyLocation = async () => {
    try {
      let loc = await Location.getCurrentPositionAsync({}).catch(() => null);
      if (!loc) loc = await Location.getLastKnownPositionAsync().catch(() => null);
      if (!loc) return;
      ref.current?.injectJavaScript(`window.flyToLocation(${loc.coords.longitude},${loc.coords.latitude}); true;`);
    } catch {}
  };

  const startPinMode = () => { setPlacingPin(true); setPinReady(false); setPublishCoords(null); ref.current?.injectJavaScript('window.clearTempPin();window.setPinMode(true);true;'); };
  const cancelPinMode = () => { setPlacingPin(false); setPinReady(false); setPublishCoords(null); ref.current?.injectJavaScript('window.clearTempPin();window.setPinMode(false);true;'); };
  const confirmPin = () => { if (!publishCoords) return; setPlacingPin(false); setPinReady(false); ref.current?.injectJavaScript('window.setPinMode(false);true;'); setShowPublish(true); };

  const onMessage = (e: any) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'spotTap') { const spot = spots.find(s => s.id === msg.id); if (spot) setSelectedSpot(spot); }
      else if (msg.type === 'pinPlaced') { setPublishCoords([msg.lng, msg.lat]); setPinReady(true); }
    } catch {}
  };

  return (
    <View style={S.root}>
      <WebView ref={ref} originWhitelist={['*']} source={source} onLoadEnd={() => setReady(true)} onMessage={onMessage} />
      <View style={S.overlay} pointerEvents="box-none">
        {placingPin && <View style={S.banner}><Text style={S.bannerText}>{pinReady ? 'Confirmă sau mută pinul' : 'Apasă pe hartă'}</Text><Pressable onPress={cancelPinMode}><Image source={require('../assets/icons/close.png')} style={S.bannerXIcon} /></Pressable></View>}
        {placingPin && pinReady && <><Pressable style={S.confirmBtn} onPress={confirmPin}><Image source={require('../assets/icons/check.png')} style={S.confirmIcon} /><Text style={S.confirmText}>Confirmă locul</Text></Pressable><Pressable style={S.cancelBtn} onPress={cancelPinMode}><Text style={S.cancelText}>Anulează</Text></Pressable></>}
        {!placingPin && <Pressable style={S.addBtn} onPress={startPinMode}><Image source={require('../assets/icons/plus.png')} style={S.addIcon} /></Pressable>}
        <Pressable style={S.locateBtn} onPress={goToMyLocation}><Image source={require('../assets/icons/location.png')} style={S.locateIcon} /></Pressable>
      </View>
      <PublishModal visible={showPublish} coords={publishCoords} onClose={() => { setShowPublish(false); setPublishCoords(null); ref.current?.injectJavaScript('window.clearTempPin();true;'); }} onDone={() => { setShowPublish(false); setPublishCoords(null); ref.current?.injectJavaScript('window.clearTempPin();true;'); loadData(); }} />
      {selectedSpot && <RentSheet spot={selectedSpot} bookings={bookings.filter(b => b.spot_id === selectedSpot.id)} currentUserId={user?.id} onClose={() => setSelectedSpot(null)} onDone={() => { setSelectedSpot(null); loadData(); }} />}
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f7fb' },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 10, elevation: 10 },
  banner: { position: 'absolute', top: 110, left: 12, right: 12, backgroundColor: '#e53935', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 6 },
  bannerText: { color: '#fff', fontSize: 13, fontWeight: '700', flex: 1 },
  bannerXIcon: { width: 20, height: 20, resizeMode: 'contain', marginLeft: 12 },
  confirmBtn: { position: 'absolute', bottom: 80, left: 16, right: 16, backgroundColor: 'rgba(67,160,71,0.75)', borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  confirmIcon: { width: 20, height: 20, resizeMode: 'contain' },
  confirmText: { color: '#fff', fontSize: 17, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.15)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  cancelBtn: { position: 'absolute', bottom: 24, left: 16, right: 16, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 16, paddingVertical: 16, alignItems: 'center', elevation: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  cancelText: { color: '#e53935', fontSize: 16, fontWeight: '700' },
  addBtn: { position: 'absolute', bottom: 84, right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: '#43a047', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  addIcon: { width: 24, height: 24, resizeMode: 'contain' },
  locateBtn: { position: 'absolute', bottom: 24, right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: '#1e6bff', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  locateIcon: { width: 38, height: 38, resizeMode: 'contain' },
});
