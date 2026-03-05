import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const backendPort = Constants.expoConfig?.extra?.backendPort || 5001;
const DEFAULT_API_BASE_URL = `http://10.196.201.93:${backendPort}/api`;
const DEFAULT_IMAGE_BASE_URL = `http://10.196.201.93:${backendPort}`;
const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoClient?.hostUri;
const expoHost = hostUri ? hostUri.split(':')[0] : null;
const canInferLanHost = expoHost && /^(\d{1,3}\.){3}\d{1,3}$/.test(expoHost);
const inferredApiBaseUrl = canInferLanHost ? `http://${expoHost}:${backendPort}/api` : null;
const inferredImageBaseUrl = canInferLanHost ? `http://${expoHost}:${backendPort}` : null;
const BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || inferredApiBaseUrl || DEFAULT_API_BASE_URL;
const IMAGE_BASE_URL = Constants.expoConfig?.extra?.imageBaseUrl || inferredImageBaseUrl || DEFAULT_IMAGE_BASE_URL;

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add the auth token
api.interceptors.request.use(
    async (config) => {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
    }
);

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },
};

export const securityService = {
    getApprovedPasses: async (search = '') => {
        const encodedSearch = search ? `?search=${encodeURIComponent(search)}` : '';
        const response = await api.get(`/security/approved-passes${encodedSearch}`);
        return response.data;
    },
    markStudentOut: async (gatepass_id) => {
        const response = await api.post('/security/mark-out', { gatepass_id });
        return response.data;
    },
    markStudentIn: async (gatepass_id) => {
        const response = await api.post('/security/mark-in', { gatepass_id });
        return response.data;
    },
};

export const buildImageUrl = (path) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    const normalizedBase = IMAGE_BASE_URL.replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
};

export { BASE_URL, IMAGE_BASE_URL };
export default api;
