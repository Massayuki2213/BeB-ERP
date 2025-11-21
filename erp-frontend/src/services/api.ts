import axios from 'axios';

// Detecta automaticamente se estamos em modo DEV (npm run dev) ou PROD (npm run build)
// import.meta.env.DEV é uma variável especial do Vite (React)
const isDev = import.meta.env.DEV;

// Define a URL base correta para cada ambiente
const baseURL = isDev ? 'http://localhost:8080/api' : '/api';

// Configuração base do Axios
const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Erro na requisição:', error?.message);
    if (error?.response) {
      console.error('Status:', error.response.status);
      console.error('Data da resposta:', error.response.data);
    }
    return Promise.reject(error);
  }
);

export default api;