import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/auth-context';

export default function TabLayout() {
  const { entered } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!entered) router.replace('/(auth)');
  }, [entered, router]);

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Hartă' }} />
      <Tabs.Screen name="bookings" options={{ title: 'Rezervări' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
      <Tabs.Screen name="example" options={{ href: null }} />
      <Tabs.Screen name="test" options={{ href: null }} />
    </Tabs>
  );
}
