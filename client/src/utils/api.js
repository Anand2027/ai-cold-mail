import axios from 'axios';

const api = axios.create({
    baseURL: 'https://ai-cold-email-server.onrender.com/api'
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;