import axios from 'axios';

// Configuração base do Axios
// A URL vem da variável de ambiente VITE_API_BASE_URL (definida no .env / build do Docker).
// Fallback para localhost no dev fora do Docker.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para tratamento de erros global (opcional)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log mais detalhado
    console.error('Erro na requisição:', error?.message);
    if (error?.response) {
      console.error('Status:', error.response.status);
      console.error('Data da resposta:', error.response.data);
    }
    return Promise.reject(error);
  }
);

export default api;
