// app/(tabs)/index.tsx
import { useAuth } from '@/context/AuthContext'; // (Asegúrate que la ruta sea correcta)
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

// RECUERDA USAR LA MISMA IP DE TU SERVIDOR
const API_URL = 'http://192.168.100.21:4000/api/incidentes'; 

const TIPO_INCIDENTES = [
  { label: 'Selecciona un tipo...', value: '' },
  { label: 'Bache', value: 'Bache' },
  { label: 'Fuga de Agua', value: 'Fuga de Agua' },
  { label: 'Poste Dañado', value: 'Poste Dañado' },
  { label: 'Semáforo Dañado', value: 'Semáforo Dañado' },
  { label: 'Acumulación de Basura', value: 'Acumulación de Basura' },
  { label: 'Otro', value: 'Otro' },
];

export default function HomeScreen() {
  const [tipoIncidente, setTipoIncidente] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { authState } = useAuth(); // 1. Obtenemos el estado de Auth

  // --- Lógica de Imagen (Galería) ---
  const pickImageFromGallery = async () => {
    let { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // --- Lógica de Imagen (Cámara) ---
  const takePhotoWithCamera = async () => {
    let { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu cámara.');
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // --- LÓGICA DE ENVÍO (CORREGIDA) ---
  const handleEnviarReporte = async () => {
    
    // 2. Obtenemos el token del estado
    const token = authState.token;

    if (!tipoIncidente) {
      Alert.alert('Error', 'Por favor, selecciona un tipo de incidente.');
      return;
    }
    if (!descripcion.trim()) {
      Alert.alert('Error', 'Por favor, añade una descripción.');
      return;
    }
    if (!imageUri) {
      Alert.alert('Error', 'Por favor, adjunta una foto del incidente.');
      return;
    }
    if (!token) { // Verificamos que el token exista
      Alert.alert('Error de Sesión', 'No pudimos verificar tu sesión. Inicia sesión de nuevo.');
      return;
    }

    setIsSubmitting(true);

    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación.');
      setIsSubmitting(false);
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
      const { latitude, longitude } = location.coords;

      const formData = new FormData();
      formData.append('descripcion', descripcion);
      formData.append('tipoIncidente', tipoIncidente);
      formData.append('latitud', String(latitude));
      formData.append('longitud', String(longitude));

      let filename = imageUri.split('/').pop() || 'image.jpg';
      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image`;
      formData.append('image', { uri: imageUri, name: filename, type } as any);
      
      // 3. AÑADIMOS EL TOKEN A LOS HEADERS DE LA PETICIÓN
      await axios.post(API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}` // <-- ¡LA LÍNEA QUE FALTABA!
        },
      });

      Alert.alert('Éxito', 'Tu reporte ha sido enviado correctamente.');
      setDescripcion('');
      setTipoIncidente('');
      setImageUri(null);

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo enviar el reporte. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- (El resto del archivo no cambia) ---

  if (!authState.isAuthenticated) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loginParaReportar}>Inicia sesión para poder reportar.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.innerContainer}>
        <Text style={styles.title}>Crear Nuevo Reporte</Text>
        
        <Text style={styles.label}>Tipo de Incidente</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={tipoIncidente}
            onValueChange={(itemValue, itemIndex) =>
              setTipoIncidente(itemValue)
            }
            style={styles.picker}
            prompt="Selecciona un tipo de incidente"
          >
            {TIPO_INCIDENTES.map((tipo) => (
              <Picker.Item 
                key={tipo.value} 
                label={tipo.label} 
                value={tipo.value}
                style={{ color: tipo.value === '' ? '#888' : '#1C1E21' }} 
              />
            ))}
          </Picker>
        </View>
        
        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={styles.inputMultiline}
          placeholder="Describe lo que sucedió..."
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
          placeholderTextColor="#888"
        />

        <Text style={styles.label}>Evidencia Fotográfica</Text>
        
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={50} color="#CCD0D5" />
            <Text style={styles.imagePlaceholderText}>Aún no has seleccionado una foto</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <Pressable style={({ pressed }) => [styles.buttonSecondary, pressed && styles.buttonPressed]} onPress={takePhotoWithCamera}>
            <Ionicons name="camera-outline" size={20} color="#007AFF" />
            <Text style={styles.buttonSecondaryText}>Tomar Foto</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.buttonSecondary, pressed && styles.buttonPressed]} onPress={pickImageFromGallery}>
            <Ionicons name="images-outline" size={20} color="#007AFF" />
            <Text style={styles.buttonSecondaryText}>Galería</Text>
          </Pressable>
        </View>

        <Pressable 
          style={({ pressed }) => [styles.buttonPrimary, pressed && styles.buttonPressed]} 
          onPress={handleEnviarReporte}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonPrimaryText}>Enviar Reporte</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- (Estilos no cambian) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  innerContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1C1E21',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1E21',
    marginBottom: 8,
  },
  pickerContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderColor: '#CCD0D5',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
    color: '#1C1E21',
    height: Platform.OS === 'android' ? 50 : undefined,
  },
  inputMultiline: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderColor: '#CCD0D5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    height: 120,
    marginBottom: 20,
    fontSize: 16,
    color: '#1C1E21',
    textAlignVertical: 'top',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderColor: '#CCD0D5',
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  imagePlaceholderText: {
    color: '#65676B',
    marginTop: 10,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#CCD0D5',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  buttonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#007AFF',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 5,
  },
  buttonSecondaryText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonPrimary: {
    width: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  loginParaReportar: {
    fontSize: 18,
    color: '#65676B',
    textAlign: 'center',
    padding: 20,
  },
});