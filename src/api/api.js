import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

console.log('🌐 Super Admin API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token y debug
api.interceptors.request.use(config => {
  const token = localStorage.getItem("super_token");
  
  console.log(`📤 Request a ${config.method?.toUpperCase()} ${config.url}`);
  console.log('🔑 Token presente:', !!token);
  
  if (token) {
    // Mostrar primeros 20 caracteres del token para debug
    console.log('🔐 Token (primeros 20 chars):', token.substring(0, 20) + '...');
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
  response => {
    console.log(`✅ Respuesta ${response.status} de ${response.config.url}`);
    return response;
  },
  error => {
    console.error(`❌ Error ${error.response?.status} en ${error.config?.url}`);
    console.error('Detalle:', error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('🚫 Token inválido, redirigiendo a login');
      localStorage.removeItem("super_token");
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

export default api;