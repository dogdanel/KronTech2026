import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/auth-context';
import PasswordInput from '../../components/password-input';

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
      <View style={styles.card}>{children}</View>
    </View>
  );
}

export default function ProfileTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut, forgetSavedAccount, updateEmail, updatePassword, updateDisplayName } =
    useAuth();

  const metaName =
    typeof user?.user_metadata?.display_name === 'string' ? user.user_metadata.display_name : '';

  const [displayName, setDisplayName] = useState(metaName);
  const [newEmail, setNewEmail] = useState(user?.email ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<string | null>, success: string) {
    setMsg(null);
    setErr(null);
    setBusy(true);
    const e = await action();
    setBusy(false);
    if (e) setErr(e);
    else setMsg(success);
  }

  async function onSignOut() {
    await signOut();
    router.replace('/(auth)');
  }

  async function onForget() {
    await forgetSavedAccount();
    router.replace('/(auth)');
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: bg }]}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 16,
      }}
      keyboardShouldPersistTaps="handled">
      <Text style={styles.pageTitle}>Profil</Text>
      <Text style={styles.pageSub}>{user?.email ?? ''}</Text>

      <Section title="Cont">
        <Text style={styles.label}>Nume afișat</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Nume afișat"
          placeholderTextColor={muted}
        />
        <Pressable
          style={styles.btn}
          disabled={busy}
          onPress={() =>
            run(() => updateDisplayName(displayName.trim()), 'Numele a fost actualizat.')
          }>
          <Text style={styles.btnText}>Salvează numele</Text>
        </Pressable>
      </Section>

      <Section title="Schimbă emailul">
        <Text style={styles.hint}>Vei primi un link de confirmare pe adresa nouă.</Text>
        <TextInput
          style={styles.input}
          value={newEmail}
          onChangeText={setNewEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email nou"
          placeholderTextColor={muted}
        />
        <Pressable
          style={styles.btn}
          disabled={busy}
          onPress={() =>
            run(() => updateEmail(newEmail.trim()), 'Verifică inboxul pentru confirmare.')
          }>
          <Text style={styles.btnText}>Actualizează emailul</Text>
        </Pressable>
      </Section>

      <Section title="Schimbă parola">
        <PasswordInput
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Parolă nouă"
          autoComplete="password-new"
        />
        <Pressable
          style={[styles.btn, styles.btnSpaced]}
          disabled={busy}
          onPress={() => {
            if (newPassword.length < 6) {
              setErr('Parola trebuie să aibă minimum 6 caractere.');
              return;
            }
            run(() => updatePassword(newPassword), 'Parola a fost actualizată.');
          }}>
          <Text style={styles.btnText}>Actualizează parola</Text>
        </Pressable>
      </Section>

      {err ? <Text style={styles.error}>{err}</Text> : null}
      {msg ? <Text style={styles.info}>{msg}</Text> : null}
      {busy ? <ActivityIndicator style={styles.spinner} color={accent} /> : null}

      <Pressable style={[styles.btn, styles.btnOutline]} onPress={onSignOut} disabled={busy}>
        <Text style={styles.btnOutlineText}>Deconectare</Text>
      </Pressable>
      <Pressable style={styles.forget} onPress={onForget} disabled={busy}>
        <Text style={styles.forgetText}>Șterge contul salvat pe acest dispozitiv</Text>
      </Pressable>
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
  label: { fontSize: 14, color: muted, marginBottom: 8 },
  hint: { fontSize: 13, color: muted, marginBottom: 10, lineHeight: 18 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: line,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: text,
    backgroundColor: bg,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnSpaced: { marginTop: 12 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnOutline: {
    marginTop: 8,
    backgroundColor: card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: line,
  },
  btnOutlineText: { color: text, fontSize: 15, fontWeight: '700' },
  error: { fontSize: 14, color: '#c62828', marginBottom: 8 },
  info: { fontSize: 14, color: '#2e7d32', marginBottom: 8 },
  spinner: { marginVertical: 8 },
  forget: { marginTop: 16, alignItems: 'center' },
  forgetText: { fontSize: 13, color: muted },
});
