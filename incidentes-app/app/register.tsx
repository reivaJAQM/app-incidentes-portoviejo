// app/register.tsx
import { useAuth } from '@/context/AuthContext';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image // 1. Importamos 'Image'
  ,


  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

export default function RegisterScreen() {
  // ... (toda la lógica de 'useState' y 'handleRegister' no cambia) ...
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'Por favor, completa todos los campos.');
      return;
    }
    setLoading(true);
    try {
      await register(username, email, password);
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Error al registrarse', error.response?.data?.message || 'Algo salió mal');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.innerContainer}>
        
        {/* 2. REEMPLAZAMOS EL TÍTULO POR EL LOGO */}
        <Image
          source={require('../assets/images/Portoviejo.png')} // <-- 3. Ruta a tu logo
          style={styles.logo}
        />
        
        <Text style={styles.subtitle}>Únete a la comunidad de reportes</Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre de usuario"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          placeholderTextColor="#888"
        />
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
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Registrarme</Text>
          )}
        </Pressable>

        <View style={styles.linkContainer}>
          <Text style={styles.linkText}>¿Ya tienes una cuenta? </Text>
          <Link href="/login">
            <Text style={styles.link}>Inicia sesión</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// 4. USAMOS LOS MISMOS ESTILOS (CON EL NUEVO 'styles.logo')
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  innerContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 25,
  },
  logo: { // <--- NUEVO ESTILO PARA EL LOGO
    width: 150,
    height: 150,
    resizeMode: 'contain',
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
    paddingBottom: 20,
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