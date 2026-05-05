import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Map' }} />
      <Tabs.Screen name="example" options={{ title: 'Examples' }} />
      <Tabs.Screen name="test" options={{ title: 'Test' }} />
    </Tabs>
  );
}
