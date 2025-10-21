// app/(tabs)/_layout.tsx
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Tabs, useRouter } from 'expo-router'; // 1. Importamos useRouter
import React from 'react';
import { Pressable } from 'react-native'; // 2. Importamos Pressable
// Importamos los íconos (¡asegúrate que ya esté!)
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const router = useRouter(); // 3. Obtenemos el router para navegar

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF', // Azul (más coherente)
      }}>
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Incidentes',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'list' : 'list-outline'} color={color} />
          ),

          // --- 4. REEMPLAZAMOS EL BOTÓN "SALIR" ---
          headerRight: () => (
            <Pressable 
              onPress={() => router.push('/perfil')} // Abre la pantalla modal
              style={({ pressed }) => ({
                opacity: pressed ? 0.5 : 1,
                marginRight: 15, // Espacio a la derecha
              })}
            >
              <Ionicons 
                name="person-circle" // Ícono de perfil
                size={30} // Tamaño del ícono
                color="#007AFF" // Color azul
              />
            </Pressable>
          ),
          // --- FIN DEL CAMBIO ---
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Reportar',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'add-circle' : 'add-circle-outline'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}