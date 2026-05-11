import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const bg = '#f6f7fb';
const card = '#fff';
const text = '#0b1220';
const muted = '#5b667a';
const line = '#e7e9ef';
const accent = '#1e6bff';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function ExampleTab() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: bg }]}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 32, paddingHorizontal: 16 }}>
      <Text style={styles.pageTitle}>UI examples</Text>
      <Text style={styles.pageSub}>One item per area · no data</Text>

      <Section title="1">
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>dsada</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>dasd</Text>
            </View>
          </View>
          <Text style={styles.cardMeta}>dasdas</Text>
        </View>
      </Section>

      <Section title="2">
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.thumb} />
            <View style={styles.flex1}>
              <Text style={styles.cardTitle}>dsada</Text>
              <Text style={styles.cardMeta}>dsadas</Text>
            </View>
          </View>
        </View>
      </Section>

      <Section title="3">
        <View style={styles.card}>
          <Text style={styles.cardTitle}>21das</Text>
          <Text style={styles.cardMeta}>dsa</Text>
          <View style={[styles.badge, styles.badgeMargin]}>
            <Text style={styles.badgeText}>dsadas</Text>
          </View>
        </View>
      </Section>

      <Section title="4">
        <View style={[styles.card, styles.rowBetween]}>
          <View>
            <Text style={styles.cardTitle}>sdadas</Text>
            <Text style={styles.cardMeta}>312312</Text>
          </View>
          <Text style={styles.statusDone}>321312</Text>
        </View>
      </Section>

      <Section title="5">
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.avatar} />
            <View>
              <Text style={styles.cardTitle}>fdsfs</Text>
              <Text style={styles.cardMeta}>fdsfsdfds</Text>
            </View>
          </View>
        </View>
      </Section>

      <Section title="6">
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Visa ···· 4242</Text>
          <Text style={styles.cardMeta}>Implicit · exp. 12/28</Text>
          <Text style={styles.walletHint}>Apple Pay / Google Pay aici la checkout</Text>
        </View>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: text },
  pageSub: { marginTop: 4, marginBottom: 20, fontSize: 14, color: muted },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: muted, marginBottom: 8, letterSpacing: 0.5 },
  card: {
    backgroundColor: card,
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: line,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flex1: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: text },
  cardMeta: { marginTop: 4, fontSize: 14, color: muted },
  badge: { backgroundColor: '#e8f0ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeMargin: { alignSelf: 'flex-start', marginTop: 10 },
  badgeText: { fontSize: 12, fontWeight: '700', color: accent },
  thumb: { width: 52, height: 52, borderRadius: 10, backgroundColor: '#dde1e8' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#dde1e8' },
  statusDone: { fontSize: 13, fontWeight: '600', color: muted },
  walletHint: { marginTop: 10, fontSize: 13, color: muted, fontStyle: 'italic' },
});
