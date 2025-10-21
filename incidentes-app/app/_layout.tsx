// app/_layout.tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';

// 1. Importamos nuestro AuthProvider y el hook useAuth
import { AuthProvider, useAuth } from '../context/AuthContext';

// 2. Creamos el layout principal "Stack"
// Este componente SÍ estará envuelto por el AuthProvider
const RootLayoutNav = () => {
  const { authState } = useAuth(); // Obtenemos el estado de autenticación
  const segments = useSegments(); // Nos dice en qué "parte" de la app estamos
  const router = useRouter(); // Nos permite redirigir

  useEffect(() => {
    const inTabsGroup = segments[0] === '(tabs)'; // ¿Estamos en la app principal?

    if (authState.isAuthenticated && !inTabsGroup) {
      // 3. Si el usuario ESTÁ autenticado pero NO está en las pestañas,
      // lo mandamos a la pantalla de 'feed'
      router.replace('/(tabs)/feed');
    } else if (!authState.isAuthenticated && inTabsGroup) {
      // 4. Si el usuario NO está autenticado pero INTENTA entrar a las pestañas,
      // lo expulsamos a la pantalla de 'login'
      router.replace('/login');
    }
  }, [authState.isAuthenticated]); // 5. Este efecto se ejecuta CADA VEZ que el estado de auth cambia

  return (
    <Stack>
      {/* 6. Configuramos las pantallas de la app */}

      {/* Las pantallas de Login y Registro no tienen encabezado */}
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />

      {/* El grupo de pestañas principal */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* La pantalla de detalles (la dejamos como estaba) */}
      <Stack.Screen 
        name="detalles" 
        options={{ 
          title: 'Detalles del Incidente',
          headerBackTitle: 'Volver'
        }} 
      />

      {/* --- AÑADE ESTE BLOQUE --- */}
      <Stack.Screen 
        name="perfil" 
        options={{ 
          presentation: 'modal', // <-- Esto hace que se deslice desde abajo
          title: 'Mi Perfil',
          headerBackTitle: 'Cerrar'
        }} 
      />
      {/* --- FIN DEL BLOQUE NUEVO --- */}

      {/* --- AÑADE ESTE BLOQUE --- */}
          <Stack.Screen 
            name="mis-reportes" // El nombre del archivo que crearemos
            options={{ 
              title: 'Mis Reportes', // Título en la cabecera
              headerBackTitle: 'Perfil' // Botón de regreso
            }} 
          />
          {/* --- FIN DEL BLOQUE NUEVO --- */}
    </Stack>
  );
};

// --- Este es el componente raíz de TODA la app ---
export default function RootLayout() {
  return (
    // 7. Envolvemos toda la navegación en nuestro AuthProvider
    // Ahora, todas las pantallas (incluida RootLayoutNav)
    // pueden usar el hook 'useAuth()'
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
