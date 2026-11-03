import axios from 'axios';

// The API server connects to MongoDB. Keep Atlas credentials on that server;
// the browser should only know the server's URL.
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
});

export default api;
