import axios from 'axios';
const api = axios.create({
  baseURL: 'https://shipyardbackend-production.up.railway.app',
  timeout: 0,  // 2 minutes
});
export default api;