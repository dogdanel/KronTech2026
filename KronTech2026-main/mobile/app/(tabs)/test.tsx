import { StyleSheet, Text, View } from 'react-native';

export default function TestTab() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Index</Text>
      <Text style={styles.hint}>Ma32prsssrr</Text>
      <Text style={styles.test}>ParkShare</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6f7fb', padding: 24, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#0b1220' },
  hint: { marginTop: 8, fontSize: 15, color: '#5b667a' },
  test: { padding: 1, backgroundColor: 'red', color: 'black', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
});
