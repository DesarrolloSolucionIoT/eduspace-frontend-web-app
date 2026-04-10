import axios from "axios";
import store from "../../store/index.js";
import router from "../../router/index.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const http = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Interceptor para añadir el token de autenticación
http.interceptors.request.use(
    (config) => {
        const token = store.getters["user/userToken"];

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor de respuesta para manejo global de errores
http.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            console.error('Network error:', error);
            const networkError = new Error('Error de red. Verifica tu conexión a internet.');
            networkError.isNetworkError = true;
            return Promise.reject(networkError);
        }

        const { status, data } = error.response;
        let userMessage = 'Error desconocido';

        if (data) {
            if (data.detail) {
                userMessage = data.detail;
            }
            else if (data.errors) {
                const errors = Object.values(data.errors).flat();
                userMessage = errors.join(', ');
            }
            else if (data.title) {
                userMessage = data.title;
            }
            else if (data.message) {
                userMessage = data.message;
            }
        }

        switch (status) {
            case 400:
                console.warn('Bad Request:', userMessage);
                break;

            case 401:
                console.error('Unauthorized');
                store.dispatch('user/signOut');
                if (router.currentRoute.value.name !== 'login') {
                    router.push('/login');
                }
                userMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
                break;

            case 403:
                console.error('Forbidden:', userMessage);
                userMessage = userMessage || 'No tienes permisos para realizar esta acción.';
                break;

            case 404:
                console.error('Not Found:', userMessage);
                userMessage = userMessage || 'Recurso no encontrado.';
                break;

            case 409:
                console.error('Conflict:', userMessage);
                userMessage = userMessage || 'Conflicto: El recurso ya existe.';
                break;

            case 500:
                console.error('Server Error:', userMessage);
                userMessage = 'Error del servidor. Por favor, intenta más tarde.';
                break;

            default:
                console.error(`HTTP Error (${status}):`, data);
                userMessage = userMessage || `Error ${status}: ${error.message}`;
        }

        error.userMessage = userMessage;

        return Promise.reject(error);
    }
);

export default http;
