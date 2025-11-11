import axios from 'axios';

// Configuração base do Axios
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
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
