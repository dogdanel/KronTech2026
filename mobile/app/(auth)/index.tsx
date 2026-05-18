import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    signIn,
    signUp,
    continueWithSavedAccount,
    rememberEnabled,
    savedAccount,
    hasStoredSession,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [quickMode, setQuickMode] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const showQuick = rememberEnabled && !!savedAccount && hasStoredSession;
    setQuickMode(showQuick);
    if (savedAccount?.email) setEmail(savedAccount.email);
    if (savedAccount?.displayName) setDisplayName(savedAccount.displayName);
    setRemember(rememberEnabled);
  }, [rememberEnabled, savedAccount, hasStoredSession]);

  function goToApp() {
    router.replace('/(tabs)');
  }

  async function onQuickEnter() {
    setError(null);
    setBusy(true);
    const err = await continueWithSavedAccount();
    setBusy(false);
    if (err) {
      setError(err);
      setQuickMode(false);
      return;
    }
    goToApp();
  }

  async function submit() {
    setError(null);
    setInfo(null);
    setBusy(true);
    if (mode === 'login') {
      const err = await signIn(email.trim(), password, remember);
      setBusy(false);
      if (err) {
        setError(err);
        return;
      }
      goToApp();
      return;
    }
    if (!displayName.trim()) {
      setBusy(false);
      setError('Introdu numele afișat.');
      return;
    }
    const result = await signUp(email.trim(), password, displayName.trim());
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.confirmEmail) {
      setInfo('Ți-am trimis un email de confirmare. Deschide linkul, apoi autentifică-te.');
      setMode('login');
      setPassword('');
      setDisplayName('');
      return;
    }
    goToApp();
  }

  function toggleMode() {
    setError(null);
    setInfo(null);
    setQuickMode(false);
    setMode(mode === 'login' ? 'register' : 'login');
  }

  function useOtherAccount() {
    setQuickMode(false);
    setError(null);
    setPassword('');
  }

  const label = savedAccount?.displayName || savedAccount?.email || 'contul tău';

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.title}>ParkShare</Text>
        <Text style={styles.sub}>
          {quickMode ? 'Bine ai revenit' : mode === 'login' ? 'Autentificare' : 'Înregistrare'}
        </Text>
      </View>

      {quickMode ? (
        <View style={styles.card}>
          <Text style={styles.quickHello}>Salut, {label}</Text>
          <Text style={styles.quickEmail}>{savedAccount?.email}</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            style={[styles.button, busy && styles.buttonDisabled]}
            onPress={onQuickEnter}
            disabled={busy}>
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Intră în contul meu</Text>
            )}
          </Pressable>
          <Pressable onPress={useOtherAccount} style={styles.otherAccount}>
            <Text style={styles.switchText}>Alt cont sau autentificare manuală</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.card}>
          {mode === 'register' && (
            <TextInput
              style={styles.input}
              placeholder="Nume afișat"
              placeholderTextColor={muted}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <PasswordInput
            value={password}
            onChangeText={setPassword}
            autoComplete={mode === 'login' ? 'password' : 'new-password'}
          />
          {mode === 'login' && (
            <Pressable style={styles.rememberRow} onPress={() => setRemember((r) => !r)}>
              <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                {remember ? <Text style={styles.checkMark}>✓</Text> : null}
              </View>
              <Text style={styles.rememberText}>Ține minte contul</Text>
            </Pressable>
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {info ? <Text style={styles.info}>{info}</Text> : null}
          <Pressable
            style={[styles.button, busy && styles.buttonDisabled]}
            onPress={submit}
            disabled={busy}>
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {mode === 'login' ? 'Intră în cont' : 'Creează cont'}
              </Text>
            )}
          </Pressable>
        </View>
      )}

      {!quickMode && (
        <Pressable onPress={toggleMode} style={styles.switch}>
          <Text style={styles.switchText}>
            {mode === 'login'
              ? 'Nu ai cont? Înregistrează-te'
              : 'Ai deja cont? Autentifică-te'}
          </Text>
        </Pressable>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: bg, paddingHorizontal: 20 },
  header: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: '800', color: text },
  sub: { marginTop: 6, fontSize: 15, color: muted },
  card: {
    backgroundColor: card,
    borderRadius: 14,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: line,
  },
  quickHello: { fontSize: 18, fontWeight: '700', color: text },
  quickEmail: { marginTop: 4, fontSize: 14, color: muted, marginBottom: 8 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: line,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: text,
    marginBottom: 12,
    backgroundColor: bg,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: bg,
  },
  checkboxOn: { backgroundColor: accent, borderColor: accent },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '800' },
  rememberText: { fontSize: 15, color: text },
  error: { marginTop: 12, fontSize: 14, color: '#c62828' },
  info: { marginTop: 12, fontSize: 14, color: '#2e7d32', lineHeight: 20 },
  button: {
    marginTop: 16,
    backgroundColor: accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  otherAccount: { marginTop: 14, alignItems: 'center' },
  switch: { marginTop: 20, alignItems: 'center' },
  switchText: { fontSize: 14, color: accent, fontWeight: '600' },
});
