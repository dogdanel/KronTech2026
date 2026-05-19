import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/auth-context';
import { fetchUserBookings, fetchUserSpots, deleteSpot, type Booking, type ParkingSpot } from '../../lib/parking';

export default function BookingsTab() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [mySpots, setMySpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    try {
      const [b, s] = await Promise.all([fetchUserBookings(user.id), fetchUserSpots(user.id)]);
      setBookings(b);
      setMySpots(s);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const now = new Date();
  const active = bookings.filter(b => new Date(b.start_time) <= now && new Date(b.end_time) > now);
  const upcoming = bookings.filter(b => new Date(b.start_time) > now);
  const past = bookings.filter(b => new Date(b.end_time) <= now);

  const handleDeleteSpot = (spot: ParkingSpot) => {
    Alert.alert('Șterge parcarea', `Sigur vrei să ștergi ${spot.street_name} ${spot.street_number}?`, [
      { text: 'Anulează', style: 'cancel' },
      {
        text: 'Șterge', style: 'destructive', onPress: async () => {
          try {
            await deleteSpot(spot.id);
            load();
          } catch (e: any) {
            Alert.alert('Eroare', e.message);
          }
        }
      },
    ]);
  };

  const renderBooking = (b: Booking, status: string, statusColor: string) => {
    const spot = b.parking_spots;
    return (
      <View key={b.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{spot?.street_name ?? 'N/A'} {spot?.street_number ?? ''}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor + '22' }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{status}</Text>
          </View>
        </View>
        <Text style={styles.cardSub}>Loc #{spot?.parking_number ?? '?'}</Text>
        <Text style={styles.cardTime}>
          {new Date(b.start_time).toLocaleString('ro-RO')} — {new Date(b.end_time).toLocaleString('ro-RO')}
        </Text>
        <Text style={styles.cardPrice}>{b.total_price} RON</Text>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 16,
      }}
    >
      <Text style={styles.pageTitle}>Rezervări</Text>

      {loading && <Text style={styles.loadingText}>Se încarcă...</Text>}

      {!loading && bookings.length === 0 && mySpots.length === 0 && (
        <Text style={styles.emptyText}>Nu ai nicio rezervare sau parcare.</Text>
      )}

      {mySpots.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>PARCĂRILE MELE</Text>
          {mySpots.map(spot => (
            <View key={spot.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{spot.street_name} {spot.street_number}</Text>
                <View style={[styles.badge, { backgroundColor: '#43a04722' }]}>
                  <Text style={[styles.badgeText, { color: '#43a047' }]}>Publicat</Text>
                </View>
              </View>
              <Text style={styles.cardSub}>Loc #{spot.parking_number} · {spot.price_per_hour} RON/oră</Text>
              <Text style={styles.cardTime}>
                {new Date(spot.available_from).toLocaleString('ro-RO')} — {new Date(spot.available_to).toLocaleString('ro-RO')}
              </Text>
              <Pressable style={styles.deleteBtn} onPress={() => handleDeleteSpot(spot)}>
                <Text style={styles.deleteText}>Șterge</Text>
              </Pressable>
            </View>
          ))}
        </>
      )}

      {active.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>ACTIVE</Text>
          {active.map(b => renderBooking(b, 'Activ', '#43a047'))}
        </>
      )}

      {upcoming.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>VIITOARE</Text>
          {upcoming.map(b => renderBooking(b, 'Viitor', '#1e88e5'))}
        </>
      )}

      {past.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>TRECUTE</Text>
          {past.map(b => renderBooking(b, 'Trecut', '#999'))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f7fb' },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#0b1220', marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#5b667a', marginBottom: 8, marginTop: 16, letterSpacing: 0.5 },
  loadingText: { fontSize: 14, color: '#5b667a', marginTop: 20 },
  emptyText: { fontSize: 14, color: '#999', marginTop: 40, textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth, borderColor: '#e7e9ef',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0b1220' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardSub: { fontSize: 13, color: '#5b667a', marginTop: 2 },
  cardTime: { fontSize: 12, color: '#999', marginTop: 6 },
  cardPrice: { fontSize: 15, fontWeight: '700', color: '#1e6bff', marginTop: 6 },
  deleteBtn: {
    marginTop: 10, backgroundColor: '#ffebee', borderRadius: 8,
    paddingVertical: 8, alignItems: 'center',
  },
  deleteText: { color: '#e53935', fontSize: 13, fontWeight: '700' },
});
