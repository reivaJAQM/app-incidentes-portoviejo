// api/axiosInstance.ts
import axios from 'axios';

// Asegúrate de que esta IP sea la tuya
export const API_URL = 'http://192.168.100.21:4000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
});

export default axiosInstance;