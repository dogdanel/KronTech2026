import { StyleSheet, Text, View } from 'react-native';

export default function MapScreen() {
  return (
    <View style={styles.web}>
      <Text style={styles.title}>Harta poligonala</Text>
      <Text style={styles.sub}>Deschide pe Android sau iOS.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  web: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#f6f7fb' },
  title: { fontSize: 22, fontWeight: '800', color: '#0b1220' },
  sub: { marginTop: 8, fontSize: 14, color: '#5b667a' },
});
