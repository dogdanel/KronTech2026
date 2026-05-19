import { useState } from 'react';
import { Alert, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../contexts/auth-context';
import { createBooking, deleteSpot, type Booking, type ParkingSpot } from '../lib/parking';

type Props = {
  spot: ParkingSpot;
  bookings: Booking[];
  currentUserId: string | undefined;
  onClose: () => void;
  onDone: () => void;
};

function fmtDate(d: Date) {
  return d.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
}

type PickerState = { field: 'start' | 'end'; mode: 'date' | 'time' } | null;

export default function RentSheet({ spot, bookings, currentUserId, onClose, onDone }: Props) {
  const { user } = useAuth();
  const now = new Date();
  const oneHrLater = new Date(now.getTime() + 60 * 60 * 1000);
  const [startTime, setStartTime] = useState(now);
  const [endTime, setEndTime] = useState(oneHrLater);
  const [busy, setBusy] = useState(false);
  const [picker, setPicker] = useState<PickerState>(null);

  const isOwner = spot.user_id === currentUserId;
  const hours = Math.max(0, (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));
  const totalPrice = (hours * spot.price_per_hour).toFixed(2);

  const onPickerChange = (_: any, selected?: Date) => {
    if (Platform.OS === 'android') setPicker(null);
    if (!picker || !selected) return;
    const setFn = picker.field === 'start' ? setStartTime : setEndTime;
    const current = picker.field === 'start' ? startTime : endTime;
    if (picker.mode === 'date') {
      const merged = new Date(selected);
      merged.setHours(current.getHours(), current.getMinutes(), 0, 0);
      setFn(merged);
    } else {
      const merged = new Date(current);
      merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setFn(merged);
    }
  };

  const togglePicker = (field: 'start' | 'end', mode: 'date' | 'time') => {
    if (picker?.field === field && picker?.mode === mode) setPicker(null);
    else setPicker({ field, mode });
  };

  const handlePay = async () => {
    if (hours <= 0) {
      Alert.alert('Eroare', 'Selectează un interval valid.');
      return;
    }
    if (!user) return;
    setBusy(true);
    try {
      await createBooking({
        spot_id: spot.id,
        user_id: user.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        total_price: parseFloat(totalPrice),
        paid: true,
      });
      Alert.alert('Succes', 'Parcarea a fost rezervată!');
      onDone();
    } catch (e: any) {
      Alert.alert('Eroare', e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Șterge parcarea', 'Sigur vrei să ștergi acest loc de parcare?', [
      { text: 'Anulează', style: 'cancel' },
      {
        text: 'Șterge', style: 'destructive', onPress: async () => {
          setBusy(true);
          try {
            await deleteSpot(spot.id);
            Alert.alert('Șters', 'Locul de parcare a fost șters.');
            onDone();
          } catch (e: any) {
            Alert.alert('Eroare', e.message);
          } finally {
            setBusy(false);
          }
        }
      },
    ]);
  };

  const renderDateTimeRow = (label: string, field: 'start' | 'end', value: Date) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.dtRow}>
        <Pressable
          style={[styles.dtBtn, picker?.field === field && picker?.mode === 'date' && styles.dtBtnActive]}
          onPress={() => togglePicker(field, 'date')}
        >
          <Image source={require('../assets/icons/calendar.png')} style={styles.dtBtnIcon} />
          <Text style={styles.dtBtnText}>{fmtDate(value)}</Text>
        </Pressable>
        <Pressable
          style={[styles.dtBtn, picker?.field === field && picker?.mode === 'time' && styles.dtBtnActive]}
          onPress={() => togglePicker(field, 'time')}
        >
          <Image source={require('../assets/icons/clock.png')} style={styles.dtBtnIcon} />
          <Text style={styles.dtBtnText}>{fmtTime(value)}</Text>
        </Pressable>
      </View>
      {picker?.field === field && (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={value}
            mode={picker.mode}
            display="spinner"
            onChange={onPickerChange}
            minimumDate={new Date()}
            is24Hour
            themeVariant="light"
            textColor="#0b1220"
          />
        </View>
      )}
    </>
  );

  return (
    <Pressable style={styles.backdrop} onPress={() => { setPicker(null); onClose(); }}>
      <Pressable style={styles.sheet} onPress={() => setPicker(null)}>
        <View style={styles.handle} />
        <Text style={styles.title}>{spot.street_name} {spot.street_number}</Text>
        <Text style={styles.sub}>Loc #{spot.parking_number}</Text>
        <Text style={styles.price}>{spot.price_per_hour} RON / oră</Text>
        <Text style={styles.avail}>
          Disponibil: {new Date(spot.available_from).toLocaleString('ro-RO')} — {new Date(spot.available_to).toLocaleString('ro-RO')}
        </Text>

        {isOwner ? (
          <>
            <Text style={styles.ownerText}>Acesta este locul tău de parcare.</Text>
            <Pressable style={styles.deleteBtn} onPress={handleDelete} disabled={busy}>
              <Text style={styles.deleteText}>{busy ? 'Se șterge...' : 'Șterge parcarea'}</Text>
            </Pressable>
          </>
        ) : (
          <>
            {renderDateTimeRow('De la', 'start', startTime)}
            {renderDateTimeRow('Până la', 'end', endTime)}

            {hours > 0 && (
              <View style={styles.summary}>
                <Text style={styles.summaryText}>{hours.toFixed(1)} ore × {spot.price_per_hour} RON = {totalPrice} RON</Text>
              </View>
            )}

            <Pressable style={styles.payBtn} onPress={handlePay} disabled={busy}>
              <Text style={styles.payText}>{busy ? 'Se procesează...' : `Plătește ${totalPrice} RON`}</Text>
            </Pressable>
          </>
        )}

        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>Închide</Text>
        </Pressable>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 10,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#ddd', alignSelf: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '800', color: '#0b1220' },
  sub: { fontSize: 14, color: '#5b667a', marginTop: 2 },
  price: { fontSize: 16, fontWeight: '700', color: '#1e6bff', marginTop: 8 },
  avail: { fontSize: 12, color: '#999', marginTop: 4 },
  ownerText: { fontSize: 14, color: '#5b667a', marginTop: 16, fontStyle: 'italic' },
  label: { fontSize: 13, fontWeight: '600', color: '#5b667a', marginTop: 12, marginBottom: 4 },
  dtRow: { flexDirection: 'row', gap: 8 },
  dtBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#e7e9ef', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#f6f7fb',
  },
  dtBtnActive: { borderColor: '#1e6bff', backgroundColor: '#e8f0ff' },
  dtBtnIcon: { width: 16, height: 16, resizeMode: 'contain' },
  dtBtnText: { fontSize: 15, color: '#0b1220', fontWeight: '600' },
  pickerWrap: {
    backgroundColor: '#f6f7fb', borderRadius: 10, marginTop: 4,
    borderWidth: 1, borderColor: '#e7e9ef', overflow: 'hidden',
  },
  summary: { backgroundColor: '#e8f5e9', borderRadius: 10, padding: 12, marginTop: 12 },
  summaryText: { fontSize: 15, fontWeight: '700', color: '#2e7d32' },
  payBtn: { backgroundColor: '#43a047', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  payText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  deleteBtn: { backgroundColor: '#e53935', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  deleteText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  closeBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  closeText: { color: '#5b667a', fontSize: 15, fontWeight: '600' },
});
