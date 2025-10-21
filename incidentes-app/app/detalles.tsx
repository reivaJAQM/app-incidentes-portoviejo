// app/detalles.tsx
import { Ionicons } from '@expo/vector-icons'; // 2. Importamos Iconos
import axios from 'axios';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useAuth } from '../context/AuthContext';

// RECUERDA USAR LA MISMA IP DE TU SERVIDOR
const API_URL = 'http://192.168.100.21:4000/api/incidentes'; 

// --- Interfaces (sin cambios) ---
interface Autor {
  username: string;
}
interface Comentario {
  _id: string;
  texto: string;
  createdAt: string;
  autor: Autor;
}
interface IncidenteDetallado {
  _id: string;
  descripcion: string;
  tipoIncidente: string;
  createdAt: string;
  imageUrl?: string;
  ubicacion: {
    type: 'Point';
    coordinates: [number, number];
  };
  autor: Autor;
  comentarios: Comentario[];
}

// --- Componente de Tarjeta de Comentario (para un look más limpio) ---
const ComentarioCard = ({ comentario }: { comentario: Comentario }) => {
  return (
    <View style={styles.comentarioCard}>
      <Ionicons name="person-circle-outline" size={32} color="#444" style={styles.comentarioIcon} />
      <View style={styles.comentarioBody}>
        <View style={styles.comentarioHeader}>
          <Text style={styles.comentarioAutor}>{comentario.autor.username}</Text>
          <Text style={styles.comentarioFecha}>
            {new Date(comentario.createdAt).toLocaleDateString('es-EC')}
          </Text>
        </View>
        <Text style={styles.comentarioTexto}>{comentario.texto}</Text>
      </View>
    </View>
  );
};

export default function DetalleScreen() {
  // --- Lógica de la pantalla (sin cambios) ---
  const [incidente, setIncidente] = useState<IncidenteDetallado | null>(null);
  const [loading, setLoading] = useState(true);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { incidenteId } = useLocalSearchParams();
  const { authState } = useAuth();

  const fetchIncidente = async () => {
    if (!incidenteId) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/${incidenteId}`);
      setIncidente(response.data);
    } catch (error) {
      console.error("Error al cargar detalle:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidente();
  }, [incidenteId]);

  const handleEnviarComentario = async () => {
    if (!nuevoComentario.trim()) {
      Alert.alert('Error', 'No puedes enviar un comentario vacío.');
      return;
    }
    if (!incidenteId) return;

    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API_URL}/${incidenteId}/comentarios`, {
        texto: nuevoComentario,
      });
      setIncidente(incidenteActual => {
        if (!incidenteActual) return null;
        return {
          ...incidenteActual,
          comentarios: [response.data, ...incidenteActual.comentarios], // Añade el comentario al INICIO
        };
      });
      setNuevoComentario('');
    } catch (error) {
      console.error('Error al enviar comentario:', error);
      Alert.alert('Error', 'No se pudo enviar tu comentario.');
    } finally {
      setIsSubmitting(false);
    }
  };
  // --- Fin de la lógica ---

  if (loading) {
    return <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />;
  }

  if (!incidente) {
    return <View><Text>Error: Incidente no encontrado.</Text></View>;
  }

  const coords = {
    latitude: incidente.ubicacion.coordinates[1],
    longitude: incidente.ubicacion.coordinates[0],
  };

  // --- 3. RENDER REDISEÑADO ---
  return (
    <ScrollView style={styles.container}>
      {/* Imagen (sin cambios) */}
      {incidente.imageUrl && (
        <Image source={{ uri: incidente.imageUrl }} style={styles.image} />
      )}

      {/* Contenido principal */}
      <View style={styles.content}>
        <Text style={styles.title}>{incidente.tipoIncidente}</Text>
        
        {/* Encabezado del autor (como en el feed) */}
        <View style={styles.authorHeader}>
          <Ionicons name="person-circle-outline" size={32} color="#444" style={styles.authorIcon} />
          <View>
            <Text style={styles.authorName}>{incidente.autor.username}</Text>
            <Text style={styles.date}>
              {new Date(incidente.createdAt).toLocaleString('es-EC')}
            </Text>
          </View>
        </View>

        <Text style={styles.description}>{incidente.descripcion}</Text>

        {/* Mapa */}
        <Text style={styles.sectionTitle}>Ubicación del Reporte</Text>
        <MapView
          style={styles.map}
          initialRegion={{ ...coords, latitudeDelta: 0.005, longitudeDelta: 0.005 }}
        >
          <Marker coordinate={coords} title={incidente.tipoIncidente} />
        </MapView>
      </View>

      {/* Sección de Comentarios */}
      <View style={styles.comentariosContainer}>
        <Text style={styles.sectionTitle}>Comentarios</Text>

        {/* Formulario de nuevo comentario (rediseñado) */}
        {authState.isAuthenticated ? (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputComentario}
              placeholder="Escribe un comentario..."
              value={nuevoComentario}
              onChangeText={setNuevoComentario}
              multiline
              placeholderTextColor="#888"
            />
            <Pressable 
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} 
              onPress={handleEnviarComentario}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Enviar</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <Text style={styles.loginParaComentar}>
            Inicia sesión para poder comentar.
          </Text>
        )}

        {/* Lista de comentarios */}
        {incidente.comentarios.length === 0 ? (
          <Text style={styles.sinComentarios}>Sé el primero en comentar.</Text>
        ) : (
          incidente.comentarios.map(comentario => (
            <ComentarioCard key={comentario._id} comentario={comentario} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

// --- 4. ESTILOS COMPLETAMENTE REDISEÑADOS ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Fondo blanco para el contenido
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1C1E21',
    marginBottom: 15,
  },
  authorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  authorIcon: {
    marginRight: 8,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1E21',
  },
  date: {
    fontSize: 14,
    color: '#65676B',
  },
  description: {
    fontSize: 18,
    color: '#1C1E21',
    lineHeight: 26, // Más espacio para leer
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1E21',
    marginBottom: 15,
  },
  map: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    marginBottom: 20,
  },
  // --- Estilos de Comentarios ---
  comentariosContainer: {
    backgroundColor: '#F0F2F5', // Fondo gris claro para la sección
    padding: 20,
  },
  loginParaComentar: {
    fontSize: 16,
    color: '#65676B',
    textAlign: 'center',
    marginVertical: 20,
    fontStyle: 'italic',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputComentario: {
    width: '100%',
    backgroundColor: '#FFFFFF', // Fondo blanco
    borderColor: '#CCD0D5', // Borde gris claro
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 80, // Más alto para multilínea
    marginBottom: 10,
    fontSize: 16,
    color: '#1C1E21',
    paddingTop: 12, // Alineación vertical
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sinComentarios: {
    fontSize: 14,
    color: '#65676B',
    textAlign: 'center',
    marginVertical: 10,
  },
  // --- Estilos de la Tarjeta de Comentario ---
  comentarioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
  },
  comentarioIcon: {
    marginRight: 8,
  },
  comentarioBody: {
    flex: 1,
  },
  comentarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  comentarioAutor: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1C1E21',
  },
  comentarioFecha: {
    fontSize: 12,
    color: '#65676B',
  },
  comentarioTexto: {
    fontSize: 15,
    color: '#1C1E21',
    lineHeight: 20,
  },
});