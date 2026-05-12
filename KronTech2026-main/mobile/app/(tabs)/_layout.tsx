import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2980B9',
        tabBarInactiveTintColor: '#95A5A6',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      {/* 1. Tab-ul pentru Hartă */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hartă',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "map" : "map-outline"} size={size} color={color} />
          ),
        }}
      />

      {/* 2. Tab-ul pentru Rezervări */}
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Rezervări',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "calendar" : "calendar-outline"} size={size} color={color} />
          ),
        }}
      />

      {/* 3. Tab-ul pentru Profil */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
          ),
        }}
      />

      {/* Dacă fișierele example.tsx sau test.tsx încă există în folder, 
          dar nu vrei să apară în meniul de jos, poți să le ascunzi astfel:
      */}
      <Tabs.Screen
        name="example"
        options={{
          href: null, // Aceasta ascunde tab-ul din bara de jos
        }}
      />
      <Tabs.Screen
        name="test"
        options={{
          href: null, // Aceasta ascunde tab-ul din bara de jos
        }}
      />
    </Tabs>
  );
}