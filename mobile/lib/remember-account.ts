import AsyncStorage from '@react-native-async-storage/async-storage';

const REMEMBER_KEY = 'parkshare_remember';
const EMAIL_KEY = 'parkshare_email';
const NAME_KEY = 'parkshare_display_name';

export type SavedAccount = {
  email: string;
  displayName: string;
};

export async function getRememberEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(REMEMBER_KEY)) === '1';
}

export async function setRememberEnabled(on: boolean): Promise<void> {
  if (on) await AsyncStorage.setItem(REMEMBER_KEY, '1');
  else await AsyncStorage.removeItem(REMEMBER_KEY);
}

export async function getSavedAccount(): Promise<SavedAccount | null> {
  const email = await AsyncStorage.getItem(EMAIL_KEY);
  if (!email) return null;
  const displayName = (await AsyncStorage.getItem(NAME_KEY)) ?? '';
  return { email, displayName };
}

export async function setSavedAccount(account: SavedAccount): Promise<void> {
  await AsyncStorage.multiSet([
    [EMAIL_KEY, account.email],
    [NAME_KEY, account.displayName],
  ]);
}

export async function clearSavedAccount(): Promise<void> {
  await AsyncStorage.multiRemove([EMAIL_KEY, NAME_KEY]);
}

export async function clearRememberAll(): Promise<void> {
  await AsyncStorage.multiRemove([REMEMBER_KEY, EMAIL_KEY, NAME_KEY]);
}
