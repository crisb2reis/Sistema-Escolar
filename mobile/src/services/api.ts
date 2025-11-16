import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANTE: Altere para o IP da sua máquina na rede local
// Não use localhost, pois o celular precisa acessar pela rede
// Porta padrão: 9080 (altere se necessário)
const API_BASE_URL = 'http://192.168.15.9:9080/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos de timeout
});

// Interceptor para adicionar token JWT
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log de requisições em desenvolvimento
    if (__DEV__) {
      console.log('API Request:', config.method?.toUpperCase(), config.url);
      if (config.data) {
        console.log('API Data:', typeof config.data === 'string' ? config.data.substring(0, 100) : config.data);
      }
    }
    
    return config;
  },
  (error) => {
    if (__DEV__) {
      console.error('API Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Interceptor para refresh token e logs
api.interceptors.response.use(
  (response) => {
    // Log de resposta em desenvolvimento
    if (__DEV__) {
      console.log('API Response:', response.status, response.config.url);
    }
    return response;
  },
  async (error) => {
    // Log de erro em desenvolvimento
    if (__DEV__) {
      console.error('API Response Error:', error.response?.status || 'Network Error', error.config?.url);
      if (error.response?.data) {
        console.error('API Error Data:', error.response.data);
      }
      if (error.message) {
        console.error('API Error Message:', error.message);
      }
    }

    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token } = response.data;
          await AsyncStorage.setItem('access_token', access_token);

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        await AsyncStorage.removeItem('access_token');
        await AsyncStorage.removeItem('refresh_token');
        // Navegar para login
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;



