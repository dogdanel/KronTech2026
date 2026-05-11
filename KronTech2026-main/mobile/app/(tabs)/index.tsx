import { StyleSheet, Text, View } from 'react-native';

export default function ExampleTab() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Index</Text>
      <Text style={styles.hint}>Ma32p</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6f7fb', padding: 24, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#0b1220' },
  hint: { marginTop: 8, fontSize: 15, color: '#5b667a' },
});
