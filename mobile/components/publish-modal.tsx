import { useEffect, useState } from 'react';
import { Alert, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../contexts/auth-context';
import { createSpot, reverseGeocode } from '../lib/parking';

const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '';

type Props = {
  visible: boolean;
  coords: [number, number] | null;
  onClose: () => void;
  onDone: () => void;
};

function fmtDate(d: Date) {
  return d.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
}

type PickerState = { field: 'from' | 'to'; mode: 'date' | 'time' } | null;

export default function PublishModal({ visible, coords, onClose, onDone }: Props) {
  const { user } = useAuth();
  const [streetName, setStreetName] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [parkingNumber, setParkingNumber] = useState('');
  const now = new Date();
  const later = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const [fromDate, setFromDate] = useState(now);
  const [toDate, setToDate] = useState(later);
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [picker, setPicker] = useState<PickerState>(null);

  useEffect(() => {
    if (!visible || !coords) return;
    (async () => {
      try {
        const addr = await reverseGeocode(coords[0], coords[1], TOKEN);
        if (addr.street) setStreetName(addr.street);
        if (addr.number) setStreetNumber(addr.number);
      } catch {}
    })();
  }, [visible, coords]);

  const onPickerChange = (_: any, selected?: Date) => {
    if (Platform.OS === 'android') setPicker(null);
    if (!picker || !selected) return;
    const setFn = picker.field === 'from' ? setFromDate : setToDate;
    const current = picker.field === 'from' ? fromDate : toDate;
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

  const togglePicker = (field: 'from' | 'to', mode: 'date' | 'time') => {
    if (picker?.field === field && picker?.mode === mode) setPicker(null);
    else setPicker({ field, mode });
  };

  const handleSubmit = async () => {
    if (!streetName || !streetNumber || !parkingNumber || !price || !coords) {
      Alert.alert('Eroare', 'Completează toate câmpurile.');
      return;
    }
    if (!user) return;
    setBusy(true);
    try {
      await createSpot({
        user_id: user.id,
        street_name: streetName,
        street_number: streetNumber,
        parking_number: parkingNumber,
        longitude: coords[0],
        latitude: coords[1],
        available_from: fromDate.toISOString(),
        available_to: toDate.toISOString(),
        price_per_hour: parseFloat(price),
      });
      Alert.alert('Succes', 'Locul de parcare a fost publicat.');
      setStreetName(''); setStreetNumber(''); setParkingNumber(''); setPrice('');
      onDone();
    } catch (e: any) {
      Alert.alert('Eroare', e.message);
    } finally {
      setBusy(false);
    }
  };

  const renderDateTimeRow = (label: string, field: 'from' | 'to', value: Date) => (
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
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.overlay} onPress={() => setPicker(null)}>
        <Pressable style={styles.modal} onPress={() => {}}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Publică loc de parcare</Text>

            {coords && (
              <View style={styles.coordsRow}>
                <Image source={require('../assets/icons/location.png')} style={styles.coordsIcon} />
                <Text style={styles.coordsText}>{coords[1].toFixed(5)}, {coords[0].toFixed(5)}</Text>
              </View>
            )}

            <Text style={styles.label}>Nume stradă</Text>
            <TextInput style={styles.input} value={streetName} onChangeText={setStreetName} placeholder="ex: Strada Republicii" placeholderTextColor="#999" />

            <Text style={styles.label}>Număr stradă</Text>
            <TextInput style={styles.input} value={streetNumber} onChangeText={setStreetNumber} placeholder="ex: 15" placeholderTextColor="#999" />

            <Text style={styles.label}>Număr parcare</Text>
            <TextInput style={styles.input} value={parkingNumber} onChangeText={setParkingNumber} placeholder="ex: A3" placeholderTextColor="#999" />

            {renderDateTimeRow('Disponibil de la', 'from', fromDate)}
            {renderDateTimeRow('Disponibil până la', 'to', toDate)}

            <Text style={styles.label}>Preț per oră (RON)</Text>
            <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="5" placeholderTextColor="#999" keyboardType="numeric" />

            <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={busy}>
              <Text style={styles.submitText}>{busy ? 'Se publică...' : 'Publică'}</Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Anulează</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  title: { fontSize: 20, fontWeight: '800', color: '#0b1220', marginBottom: 16 },
  coordsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  coordsIcon: { width: 24, height: 24, resizeMode: 'contain' },
  coordsText: { fontSize: 13, color: '#43a047', fontWeight: '600' },
  dtBtnIcon: { width: 16, height: 16, resizeMode: 'contain' },
  label: { fontSize: 13, fontWeight: '600', color: '#5b667a', marginBottom: 4, marginTop: 10 },
  input: {
    borderWidth: 1, borderColor: '#e7e9ef', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#0b1220', backgroundColor: '#f6f7fb',
  },
  dtRow: { flexDirection: 'row', gap: 8 },
  dtBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#e7e9ef', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#f6f7fb',
  },
  dtBtnActive: { borderColor: '#1e6bff', backgroundColor: '#e8f0ff' },
  dtBtnText: { fontSize: 15, color: '#0b1220', fontWeight: '600' },
  pickerWrap: {
    backgroundColor: '#f6f7fb', borderRadius: 10, marginTop: 4,
    borderWidth: 1, borderColor: '#e7e9ef', overflow: 'hidden',
  },
  submitBtn: { backgroundColor: '#43a047', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  cancelText: { color: '#5b667a', fontSize: 15, fontWeight: '600' },
});
