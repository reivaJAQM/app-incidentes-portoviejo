// app/login.tsx
import { useAuth } from '@/context/AuthContext';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image // 1. Importamos el componente 'Image'
  ,



  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    // ... (esta función no cambia)
    if (!email || !password) {
      Alert.alert('Error', 'Por favor, completa todos los campos.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Error al iniciar sesión', error.response?.data?.message || 'Algo salió mal');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        
        {/* 2. REEMPLAZAMOS EL TÍTULO DE TEXTO POR LA IMAGEN DEL LOGO */}
        <Image
          source={require('../assets/images/Portoviejo.png')} // <-- 3. Ruta a tu logo
          style={styles.logo}
        />
        
        <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#888"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#888"
        />
        
        <Pressable 
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </Pressable>

        <View style={styles.linkContainer}>
          <Text style={styles.linkText}>¿No tienes una cuenta? </Text>
          <Link href="/register">
            <Text style={styles.link}>Regístrate aquí</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// --- 4. ACTUALIZAMOS LOS ESTILOS ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 25,
  },
  logo: { // <--- NUEVO ESTILO PARA EL LOGO
    width: 150,     // Ajusta el ancho según tu logo
    height: 150,    // Ajusta el alto según tu logo
    resizeMode: 'contain', // 'contain' es mejor para logos
    alignSelf: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#65676B',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderColor: '#CCD0D5',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    fontSize: 16,
    color: '#1C1E21',
  },
  button: {
    width: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  linkText: {
    fontSize: 14,
    color: '#65676B',
  },
  link: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});