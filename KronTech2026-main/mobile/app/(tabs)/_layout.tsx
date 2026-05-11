import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      
      {/* Tab-ul principal cu Harta */}
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Map',
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />
        }} 
      />
      
      {/* Tab-urile de test (le poți șterge pe viitor dacă nu mai ai nevoie de ele) */}
      <Tabs.Screen 
        name="example" 
        options={{ 
          title: 'Examples',
          tabBarIcon: ({ color, size }) => <Ionicons name="bulb-outline" size={size} color={color} />
        }} 
      />
      
      <Tabs.Screen 
        name="test" 
        options={{ 
          title: 'Test',
          tabBarIcon: ({ color, size }) => <Ionicons name="construct-outline" size={size} color={color} />
        }} 
      />

      {/* Tab-ul de Rezervări */}
      <Tabs.Screen 
        name="bookings" 
        options={{ 
          title: 'Rezervări',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />
        }} 
      />

    </Tabs>
  );
}