// app/perfil.tsx
import { useAuth } from '@/context/AuthContext'; // (Asegúrate que la ruta sea correcta)
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function PerfilModalScreen() {
  const { logout } = useAuth();
  const router = useRouter(); // 1. Obtenemos el router para navegar

  const handleLogout = () => {
    logout();
    if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi Perfil</Text>
      
      {/* --- 2. NUEVO BOTÓN "MIS REPORTES" --- */}
      <Pressable 
        style={({ pressed }) => [styles.menuButton, pressed && styles.buttonPressedPrimary]} 
        // 3. Navegamos a la nueva pantalla que crearemos
        onPress={() => router.push('/mis-reportes')} 
      >
        <Ionicons name="document-text-outline" size={22} color="#FFFFFF" />
        <Text style={styles.menuButtonText}>Mis Reportes</Text>
      </Pressable>
      {/* --- FIN DEL NUEVO BOTÓN --- */}
      
      {/* (Dejamos espacio para futuros botones...) */}

      {/* Botón de Cerrar Sesión (con estilo de "peligro" actualizado) */}
      <Pressable 
        style={({ pressed }) => [styles.logoutButton, pressed && styles.buttonPressedDanger]} 
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={22} color="#DC3545" />
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </Pressable>
    </View>
  );
}

// --- 4. ESTILOS ACTUALIZADOS ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F0F2F5',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1C1E21',
    marginBottom: 30,
  },
  // Estilo para botones de menú (como "Mis Reportes")
  menuButton: {
    backgroundColor: '#007AFF', // Azul primario
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15, // Espacio entre botones
  },
  menuButtonText: {
    color: '#FFFFFF', // Texto blanco
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  // Estilo para el botón de cerrar sesión
  logoutButton: {
    backgroundColor: '#FFFFFF', // Botón blanco
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DC3545', // Borde rojo
    marginTop: 'auto', // 5. Empuja el botón de salir al fondo
  },
  logoutButtonText: {
    color: '#DC3545', // Texto rojo
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  // Efectos de opacidad al presionar
  buttonPressedPrimary: {
    opacity: 0.8,
  },
  buttonPressedDanger: {
    backgroundColor: '#f8f9fa',
  },
});