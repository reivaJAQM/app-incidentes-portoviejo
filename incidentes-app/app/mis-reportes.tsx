// app/mis-reportes.tsx
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
// 1. Importamos 'isAxiosError' para manejar errores de forma segura
import { useAuth } from '@/context/AuthContext'; // (Asegúrate que la ruta sea correcta)
import { Ionicons } from '@expo/vector-icons';
import axios, { isAxiosError } from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';

// 2. Definimos la URL base de la API
const API_URL = 'http://192.168.100.21:4000/api'; 

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

// --- Pantalla Principal ---
export default function MisReportesScreen() {
  const [reportes, setReportes] = useState<Incidente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { authState } = useAuth(); // Obtenemos el estado de autenticación
  const router = useRouter();

  // --- 5. FUNCIÓN DE CARGA (CORREGIDA) ---
  const fetchReportes = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    
    // 3. Obtenemos el token directamente del estado de auth
    const token = authState.token; 
    
    if (!token) {
      Alert.alert("Error de Sesión", "No pudimos verificar tu sesión. Intenta iniciar sesión de nuevo.");
      setLoading(false);
      setRefreshing(false);
      return; 
    }
  
    try {
      // 4. Enviamos el token manualmente en los headers
      const response = await axios.get(`${API_URL}/incidentes/mis-reportes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setReportes(response.data);
    } catch (error) {
      console.error("Error al cargar mis reportes:", error);
      Alert.alert("Error", "No se pudieron cargar tus reportes.");
    } finally {
      if (!isRefresh) setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReportes(true);
  }, [authState.token]); // <--- Añadimos 'authState.token' como dependencia

  useFocusEffect(
    useCallback(() => {
      // Solo intentamos cargar si ya tenemos el token
      if (authState.token) {
        fetchReportes(false);
      }
    }, [authState.token]) // <--- Se ejecutará cuando el token esté listo
  );

  // --- 8. FUNCIÓN "ME GUSTA" (CORREGIDA) ---
  const handleLikePress = async (incidenteId: string) => {
    if (!authState.isAuthenticated || !authState.token) return;
    
    try {
      // 5. Enviamos el token manualmente también aquí
      const response = await axios.post<Incidente>(
        `${API_URL}/incidentes/${incidenteId}/like`, 
        null, // No 'body'
        { 
          headers: {
            'Authorization': `Bearer ${authState.token}`
          }
        }
      );
      
      setReportes(currentReportes => 
        currentReportes.map(inc => 
          inc._id === incidenteId ? response.data : inc
        )
      );
    } catch (error) {
      if (isAxiosError(error)) {
        console.error("Error al dar like:", error.response?.data);
      } else {
        console.error("Error inesperado:", error);
      }
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      {reportes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aún no has creado ningún reporte.</Text>
          <Text style={styles.emptySubText}>¡Ve a la pestaña "Reportar" para crear el primero!</Text>
        </View>
      ) : (
        <FlatList
          data={reportes}
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

// --- Estilos (sin cambios) ---
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1E21',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 16,
    color: '#65676B',
    textAlign: 'center',
  },
  cardWrapper: {
    paddingHorizontal: 10,
    paddingTop: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
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