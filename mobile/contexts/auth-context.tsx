import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  clearRememberAll,
  clearSavedAccount,
  getRememberEnabled,
  getSavedAccount,
  setRememberEnabled,
  setSavedAccount,
  type SavedAccount,
} from '../lib/remember-account';

type SignUpResult = { error: string | null; confirmEmail: boolean };

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  entered: boolean;
  rememberEnabled: boolean;
  savedAccount: SavedAccount | null;
  hasStoredSession: boolean;
  signIn: (email: string, password: string, remember: boolean) => Promise<string | null>;
  signUp: (email: string, password: string, displayName: string) => Promise<SignUpResult>;
  continueWithSavedAccount: () => Promise<string | null>;
  signOut: () => Promise<void>;
  forgetSavedAccount: () => Promise<void>;
  updateEmail: (email: string) => Promise<string | null>;
  updatePassword: (password: string) => Promise<string | null>;
  updateDisplayName: (displayName: string) => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function roAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email sau parolă greșită.';
  if (m.includes('email not confirmed')) return 'Confirmă emailul înainte de autentificare.';
  if (m.includes('user already registered')) return 'Există deja un cont cu acest email.';
  if (m.includes('password should be at least')) return 'Parola trebuie să aibă minimum 6 caractere.';
  if (m.includes('unable to validate email')) return 'Adresa de email nu este validă.';
  if (m.includes('same as the old password')) return 'Parola nouă trebuie să fie diferită.';
  return message;
}

function displayNameFromUser(user: User | null): string {
  if (!user) return '';
  const meta = user.user_metadata?.display_name;
  return typeof meta === 'string' ? meta : '';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [entered, setEntered] = useState(false);
  const [rememberEnabled, setRememberEnabledState] = useState(false);
  const [savedAccount, setSavedAccountState] = useState<SavedAccount | null>(null);

  useEffect(() => {
    async function boot() {
      const remember = await getRememberEnabled();
      const saved = await getSavedAccount();
      setRememberEnabledState(remember);
      setSavedAccountState(saved);

      const { data: { session: s } } = await supabase.auth.getSession();
      if (!remember && s) {
        await supabase.auth.signOut();
        setSession(null);
      } else {
        setSession(s);
      }
      setEntered(false);
      setLoading(false);
    }
    boot();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function persistRemember(user: User, remember: boolean) {
    if (remember) {
      await setRememberEnabled(true);
      const account = {
        email: user.email ?? '',
        displayName: displayNameFromUser(user),
      };
      await setSavedAccount(account);
      setRememberEnabledState(true);
      setSavedAccountState(account);
    } else {
      await setRememberEnabled(false);
      await clearSavedAccount();
      setRememberEnabledState(false);
      setSavedAccountState(null);
    }
  }

  async function signIn(email: string, password: string, remember: boolean) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return roAuthError(error.message);
    if (data.user) await persistRemember(data.user, remember);
    setEntered(true);
    return null;
  }

  async function signUp(email: string, password: string, displayName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) return { error: roAuthError(error.message), confirmEmail: false };
    if (!data.session) return { error: null, confirmEmail: true };
    if (data.user) await persistRemember(data.user, true);
    setEntered(true);
    return { error: null, confirmEmail: false };
  }

  async function continueWithSavedAccount() {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (!s) return 'Sesiunea a expirat. Autentifică-te din nou.';
    setEntered(true);
    return null;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setEntered(false);
    setSession(null);
  }

  async function forgetSavedAccount() {
    await clearRememberAll();
    setRememberEnabledState(false);
    setSavedAccountState(null);
    await signOut();
  }

  async function updateEmail(email: string) {
    const { error } = await supabase.auth.updateUser({ email });
    return error ? roAuthError(error.message) : null;
  }

  async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    return error ? roAuthError(error.message) : null;
  }

  async function updateDisplayName(displayName: string) {
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName },
    });
    if (error) return roAuthError(error.message);
    if (session?.user) {
      const email = session.user.email ?? '';
      if (rememberEnabled) {
        await setSavedAccount({ email, displayName });
        setSavedAccountState({ email, displayName });
      }
    }
    return null;
  }

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    loading,
    entered,
    rememberEnabled,
    savedAccount,
    hasStoredSession: !!session,
    signIn,
    signUp,
    continueWithSavedAccount,
    signOut,
    forgetSavedAccount,
    updateEmail,
    updatePassword,
    updateDisplayName,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
