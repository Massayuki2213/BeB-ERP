import axios from 'axios';

const api = axios.create({
  // Removi o /api do final para testar. 
  // Se o seu controller tiver @RequestMapping("/api"), você coloca de volta.
  baseURL: 'http://192.168.0.113:8080/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;