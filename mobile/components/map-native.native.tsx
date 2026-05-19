import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Mapbox, { Camera, LocationPuck, MapView, PointAnnotation } from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/auth-context';
import { fetchAllSpots, fetchAllBookings, getSpotColor, BRASOV_BOUNDS, type ParkingSpot, type Booking, type PinColor } from '../lib/parking';
import PublishModal from './publish-modal';
import RentSheet from './rent-sheet';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '';
const styleURL = process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL ?? 'https://api.mapbox.com/styles/v1/mapbox/streets-v12';
Mapbox.setAccessToken(MAPBOX_TOKEN);
const PIN_COLORS: Record<PinColor, string> = { red: '#e53935', yellow: '#fdd835', green: '#43a047', blue: '#1e88e5' };

export default function MapNative() {
  const cameraRef = useRef<Camera>(null);
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
  useEffect(() => { (async () => { await Location.requestForegroundPermissionsAsync(); })(); }, []);

  const goToMyLocation = async () => {
    try {
      let loc = await Location.getCurrentPositionAsync({}).catch(() => null);
      if (!loc) loc = await Location.getLastKnownPositionAsync().catch(() => null);
      if (!loc) return;
      cameraRef.current?.setCamera({ centerCoordinate: [loc.coords.longitude, loc.coords.latitude], zoomLevel: 16, pitch: 55, animationDuration: 1000 });
    } catch {}
  };

  const startPinMode = () => { setPlacingPin(true); setPinReady(false); setPublishCoords(null); };
  const cancelPinMode = () => { setPlacingPin(false); setPinReady(false); setPublishCoords(null); };
  const confirmPin = () => { if (!publishCoords) return; setPlacingPin(false); setPinReady(false); setShowPublish(true); };

  const handleMapPress = (e: any) => {
    if (!placingPin) return;
    const [lng, lat] = e.geometry.coordinates;
    setPublishCoords([lng, lat]);
    setPinReady(true);
  };

  return (
    <View style={S.root}>
      <MapView style={S.map} styleURL={styleURL} localizeLabels={{ locale: 'ro' }} compassEnabled onPress={handleMapPress}>
        <Camera ref={cameraRef} defaultSettings={{ centerCoordinate: [25.5887, 45.6427], zoomLevel: 14, pitch: 55, heading: -12 }} maxBounds={{ ne: BRASOV_BOUNDS.ne, sw: BRASOV_BOUNDS.sw }} />
        <LocationPuck puckBearing="heading" pulsing={{ isEnabled: true }} />
        {spots.map(spot => {
          const color = getSpotColor(spot, bookings, user?.id);
          return (<PointAnnotation key={spot.id} id={`spot-${spot.id}`} coordinate={[spot.longitude, spot.latitude]} onSelected={() => setSelectedSpot(spot)}>
            <View style={[S.pin, { backgroundColor: PIN_COLORS[color] }]}><Text style={S.pinText}>P</Text></View>
          </PointAnnotation>);
        })}
        {placingPin && publishCoords && (
          <PointAnnotation key="temp-pin" id="temp-pin" coordinate={publishCoords}>
            <View style={S.tempPin}><Text style={S.tempPinText}>P</Text></View>
          </PointAnnotation>
        )}
      </MapView>

      {placingPin && <View style={S.banner}><Text style={S.bannerText}>{pinReady ? 'Confirmă sau mută pinul' : 'Apasă pe hartă'}</Text><Pressable onPress={cancelPinMode}><Image source={require('../assets/icons/close.png')} style={S.bannerXIcon} /></Pressable></View>}
      {placingPin && pinReady && <><Pressable style={S.confirmBtn} onPress={confirmPin}><Image source={require('../assets/icons/check.png')} style={S.confirmIcon} /><Text style={S.confirmText}>Confirmă locul</Text></Pressable><Pressable style={S.cancelBtn} onPress={cancelPinMode}><Text style={S.cancelText}>Anulează</Text></Pressable></>}
      {!placingPin && <Pressable style={S.addBtn} onPress={startPinMode}><Image source={require('../assets/icons/plus.png')} style={S.addIcon} /></Pressable>}
      <Pressable style={S.locateBtn} onPress={goToMyLocation}><Image source={require('../assets/icons/location.png')} style={S.locateIcon} /></Pressable>

      <PublishModal visible={showPublish} coords={publishCoords} onClose={() => { setShowPublish(false); setPublishCoords(null); }} onDone={() => { setShowPublish(false); setPublishCoords(null); loadData(); }} />
      {selectedSpot && <RentSheet spot={selectedSpot} bookings={bookings.filter(b => b.spot_id === selectedSpot.id)} currentUserId={user?.id} onClose={() => setSelectedSpot(null)} onDone={() => { setSelectedSpot(null); loadData(); }} />}
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f7fb' },
  map: { flex: 1 },
  banner: { position: 'absolute', top: 110, left: 12, right: 12, backgroundColor: '#e53935', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 6, zIndex: 15 },
  bannerText: { color: '#fff', fontSize: 13, fontWeight: '700', flex: 1 },
  bannerXIcon: { width: 20, height: 20, resizeMode: 'contain', marginLeft: 12 },
  confirmBtn: { position: 'absolute', bottom: 80, left: 16, right: 16, backgroundColor: 'rgba(67,160,71,0.75)', borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 6, zIndex: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  confirmIcon: { width: 20, height: 20, resizeMode: 'contain' },
  confirmText: { color: '#fff', fontSize: 17, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.15)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  cancelBtn: { position: 'absolute', bottom: 24, left: 16, right: 16, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 16, paddingVertical: 16, alignItems: 'center', elevation: 6, zIndex: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  cancelText: { color: '#e53935', fontSize: 16, fontWeight: '700' },
  pin: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: '#fff', elevation: 4 },
  pinText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  tempPin: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e88e5', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff', elevation: 6 },
  tempPinText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  addBtn: { position: 'absolute', bottom: 84, right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: '#43a047', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  addIcon: { width: 24, height: 24, resizeMode: 'contain' },
  locateBtn: { position: 'absolute', bottom: 24, right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: '#1e6bff', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  locateIcon: { width: 38, height: 38, resizeMode: 'contain' },
});
