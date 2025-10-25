import axios from 'axios';


const baseURL = import.meta.env.VITE_API_URL || 'https://inventoryappbackend-hgjf.onrender.com';


const instance = axios.create({ baseURL });


// attach token
instance.interceptors.request.use((config) => {
const token = localStorage.getItem('userJwtToken');
if (token) config.headers['x-auth-token'] = token;
return config;
});


export default instance;