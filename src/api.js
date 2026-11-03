import axios from 'axios';

// The API server connects to MongoDB. Keep Atlas credentials on that server;
// the browser should only know the server's URL.
const apiBaseUrl =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://backend-1vkv.onrender.com'
    : 'http://localhost:5000');

const api = axios.create({
  baseURL: apiBaseUrl,
});

export default api;
