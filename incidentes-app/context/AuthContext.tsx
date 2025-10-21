// context/AuthContext.tsx
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode'; // Importamos el decodificador
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState
} from 'react';

// RECUERDA USAR LA MISMA IP DE TU SERVIDOR
const API_URL = 'http://192.168.100.21:4000/api';
const TOKEN_KEY = 'my-jwt'; // Nombre de la llave en la "caja fuerte"

// --- Definimos la forma del payload del token (lo que hay dentro) ---
interface TokenPayload {
  user: {
    id: string;
  };
  // (también tiene 'iat' y 'exp', pero solo nos importa 'user')
}

// --- Definimos la forma exacta de nuestro estado ---
interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  userId: string | null; // <-- Incluimos el userId
}

// --- Definimos la forma de nuestro Context ---
interface AuthContextData {
  authState: AuthState; // <-- Usamos la interfaz AuthState
  register: (username: string, email: string, password: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
}

// --- Creamos el Context con un valor inicial ---
const AuthContext = createContext<AuthContextData>({
  authState: { token: null, isAuthenticated: false, userId: null },
  register: async () => {},
  login: async () => {},
  logout: () => {},
});

// Hook personalizado para usar el context fácilmente
export const useAuth = () => {
  return useContext(AuthContext);
};

// --- El Proveedor (El componente principal) ---
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  
  // Aplicamos la interfaz <AuthState> a useState
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    isAuthenticated: false,
    userId: null,
  });

  // Función para establecer la sesión (para no repetir código)
  const setSession = async (token: string) => {
    try {
      const decoded: TokenPayload = jwtDecode(token); // Decodificamos
      const userId = decoded.user.id; // Obtenemos el ID

      // Configuramos el header de Axios por defecto para TODAS las futuras peticiones
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Guardamos el token en la "caja fuerte" del teléfono
      await SecureStore.setItemAsync(TOKEN_KEY, token);

      // Actualizamos el estado global de la app
      setAuthState({
        token: token,
        isAuthenticated: true,
        userId: userId,
      });
    } catch (e) {
      console.error("Error al decodificar o guardar el token:", e);
      // Si el token está corrupto o es inválido, cerramos sesión
      await logout();
    }
  };

  // Efecto para cargar el token desde la "caja fuerte" al iniciar la app
  useEffect(() => {
    const loadToken = async () => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        // Si encontramos un token, intentamos establecer la sesión
        await setSession(token);
      }
    };
    loadToken();
  }, []);

  // Función de Registro
  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password,
      });
      const { token } = response.data;
      await setSession(token); // Usamos la nueva función
      return response.data;
    } catch (e: any) {
      console.error('Error en registro:', e.response?.data);
      throw e; // Lanzamos el error para que la pantalla de registro lo atrape
    }
  };

  // Función de Login
  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      const { token } = response.data;
      await setSession(token); // Usamos la nueva función
      return response.data;
    } catch (e: any) {
      console.error('Error en login:', e.response?.data);
      throw e; // Lanzamos el error para que la pantalla de login lo atrape
    }
  };

  // Función de Logout
  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    delete axios.defaults.headers.common['Authorization'];
    setAuthState({
      token: null,
      isAuthenticated: false,
      userId: null,
    });
  };

  // Valor que compartiremos con toda la app
  const value = {
    authState,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};