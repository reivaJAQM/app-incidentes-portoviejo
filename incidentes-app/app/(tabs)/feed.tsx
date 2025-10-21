// app/(tabs)/feed.tsx
import { useAuth } from '@/context/AuthContext'; // (Asegúrate que la ruta sea correcta)
import { Ionicons } from '@expo/vector-icons';
import axios, { isAxiosError } from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView // 1. Importamos ScrollView para la barra de categorías
  ,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Asegúrate de que esta IP sea la tuya
const API_URL = 'http://192.168.100.21:4000/api/incidentes'; 

// 2. Definimos las categorías (copiadas de index.tsx + "Todos")
const CATEGORIAS = [
  { label: 'Todos', value: 'Todos' },
  { label: 'Bache', value: 'Bache' },
  { label: 'Fuga de Agua', value: 'Fuga de Agua' },
  { label: 'Poste Dañado', value: 'Poste Dañado' },
  { label: 'Semáforo Dañado', value: 'Semáforo Dañado' },
  { label: 'Acumulación de Basura', value: 'Acumulación de Basura' },
  { label: 'Otro', value: 'Otro' },
];

// --- Interfaces (sin cambios) ---
interface Autor { username: string; }
interface Incidente {
  _id: string;
  descripcion: string;
  tipoIncidente: string;
  createdAt: string;
  imageUrl?: string;
  autor: Autor;
  likes: string[];
}

// --- IncidenteCard (sin cambios) ---
const IncidenteCard = ({ item, onLikePress }: { item: Incidente, onLikePress: () => void }) => {
  // ... (Tu componente IncidenteCard completo va aquí, no cambia nada)
  // (Pega aquí el código de tu IncidenteCard)
  const { authState } = useAuth();
  const hasLiked = authState.userId && item.likes.includes(authState.userId);
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `hace ${Math.floor(interval)} años`;
    interval = seconds / 2592000;
    if (interval > 1) return `hace ${Math.floor(interval)} meses`;
    interval = seconds / 86400;
    if (interval > 1) return `hace ${Math.floor(interval)} días`;
    interval = seconds / 3600;
    if (interval > 1) return `hace ${Math.floor(interval)} horas`;
    interval = seconds / 60;
    if (interval > 1) return `hace ${Math.floor(interval)} min`;
    return 'justo ahora';
  };
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="person-circle-outline" size={32} color="#444" style={styles.authorIcon} />
        <View style={styles.authorInfo}>
          <Text style={styles.cardAuthor}>{item.autor.username}</Text>
          <Text style={styles.cardFecha}>{formatRelativeTime(item.createdAt)}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTipo}>{item.tipoIncidente}</Text>
        <Text style={styles.cardDescripcion}>{item.descripcion}</Text>
      </View>
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      )}
      <View style={styles.cardFooter}>
        <TouchableOpacity 
          style={styles.footerButton} 
          onPress={onLikePress}
          disabled={!authState.isAuthenticated}
        >
          <Ionicons 
            name={hasLiked ? "thumbs-up" : "thumbs-up-outline"}
            size={20} 
            color={hasLiked ? "#007AFF" : "#65676B"}
          />
          <Text style={[styles.footerButtonText, hasLiked && { color: "#007AFF" }]}>
            {item.likes.length} Me Gusta
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- Pantalla del Feed ---
export default function FeedScreen() {
  const [incidentes, setIncidentes] = useState<Incidente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // 3. Nuevo estado para guardar la categoría seleccionada
  const [categoriaActual, setCategoriaActual] = useState('Todos');
  
  const { authState } = useAuth();
  const router = useRouter();

  // 4. Modificamos fetchIncidentes para que acepte la categoría
  const fetchIncidentes = async (categoria: string, isRefresh = false) => {
    if (!isRefresh) setLoading(true); // Solo muestra el loader grande si NO es un pull-to-refresh
    try {
      // 5. Enviamos la categoría como un 'param' a axios
      const response = await axios.get(API_URL, {
        params: { tipo: categoria }
      });
      setIncidentes(response.data);
    } catch (error) {
      console.error("Error al cargar incidentes:", error);
    } finally {
      if (!isRefresh) setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  // 6. Actualizamos onRefresh para que use la categoría actual
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    fetchIncidentes(categoriaActual, true); // Llama a fetch con la categoría actual
  }, [categoriaActual]); // Depende de la categoría actual

  // 7. Actualizamos useFocusEffect para que se re-ejecute si la categoría cambia
  useFocusEffect(
    React.useCallback(() => {
      fetchIncidentes(categoriaActual, false); // Llama a fetch con la categoría actual
    }, [categoriaActual]) // Se re-ejecuta si 'categoriaActual' cambia
  );

  // --- (handleLikePress no cambia) ---
  const handleLikePress = async (incidenteId: string) => {
    // ... (Pega tu función handleLikePress aquí, no cambia)
    if (!authState.isAuthenticated) {
      return Alert.alert("Inicia sesión", "Debes iniciar sesión para dar Me Gusta.");
    }
    try {
      const response = await axios.post<Incidente>(`${API_URL}/${incidenteId}/like`);
      setIncidentes(currentIncidentes => 
        currentIncidentes.map(inc => 
          inc._id === incidenteId ? response.data : inc
        )
      );
    } catch (error) {
      if (isAxiosError(error)) {
        console.error("Error al dar like:", error.response?.data);
        Alert.alert("Error", "No se pudo procesar tu Me Gusta.");
      } else {
        console.error("Error inesperado:", error);
        Alert.alert("Error", "Ocurrió un error inesperado.");
      }
    }
  };

  // 8. Componente de la Barra de Categorías
  const CategoriaSelector = () => (
    <View style={styles.categoryContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {CATEGORIAS.map((cat) => (
          <Pressable
            key={cat.value}
            // Cambiamos el estado al presionar
            onPress={() => setCategoriaActual(cat.value)}
            // Aplicamos estilo activo o inactivo
            style={[
              styles.chip,
              categoriaActual === cat.value && styles.chipActive
            ]}
          >
            <Text
              style={[
                styles.chipText,
                categoriaActual === cat.value && styles.chipTextActive
              ]}
            >
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 9. Añadimos la barra de categorías encima de la lista */}
      <CategoriaSelector />

      {loading ? ( // 10. Mostramos el loader si está en carga inicial
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <FlatList
          data={incidentes}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <Pressable 
                onPress={() => router.push({ 
                  pathname: '/detalles',
                  params: { incidenteId: item._id }
                })}
              >
                <IncidenteCard item={item} onLikePress={() => handleLikePress(item._id)} />
              </Pressable>
            </View>
          )}
          keyExtractor={item => item._id}
          // Quitamos el padding de aquí para ponerlo en el 'cardWrapper'
          // contentContainerStyle={{ padding: 10 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#007AFF"]}
            />
          }
        />
      )}
    </View>
  );
}

// --- 11. AÑADIMOS LOS NUEVOS ESTILOS ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9EBEE',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // --- Estilos de la Barra de Categorías ---
  categoryContainer: {
    paddingVertical: 10,
    backgroundColor: '#FFFFFF', // Fondo blanco para la barra
    borderBottomWidth: 1,
    borderBottomColor: '#CCD0D5',
  },
  chip: {
    backgroundColor: '#E9EBEE', // Gris claro
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 6,
  },
  chipActive: {
    backgroundColor: '#007AFF', // Azul activo
  },
  chipText: {
    color: '#1C1E21', // Texto oscuro
    fontWeight: 'bold',
    fontSize: 14,
  },
  chipTextActive: {
    color: '#FFFFFF', // Texto blanco
  },
  // --- Estilos de la Tarjeta (Wrapper) ---
  cardWrapper: {
    paddingHorizontal: 10, // Movemos el padding aquí
    paddingTop: 12, // Espacio entre tarjetas
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    // marginBottom: 12, // Ya no es necesario por el 'cardWrapper'
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  // --- (El resto de tus estilos de Card, Header, Body, Footer... no cambian) ---
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  authorIcon: {
    marginRight: 8,
  },
  authorInfo: {
    flex: 1,
  },
  cardAuthor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1E21',
  },
  cardFecha: {
    fontSize: 12,
    color: '#65676B',
  },
  cardBody: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  cardTipo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1E21',
    marginBottom: 8,
  },
  cardDescripcion: {
    fontSize: 16,
    color: '#1C1E21',
    lineHeight: 22,
  },
  cardImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#E9EBEE',
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  footerButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#65676B',
    fontWeight: 'bold',
  },
});