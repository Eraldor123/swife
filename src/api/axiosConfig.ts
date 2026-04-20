// src/api/axiosConfig.ts

import axios from 'axios';
// Používáme "import type", abychom vyhověli pravidlu verbatimModuleSyntax
import type { InternalAxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';

// 1. Vytvoření centrální instance Axiosu
const apiClient = axios.create({
    baseURL: 'http://localhost:8080/api/v1',
    withCredentials: true, // Dovoluje prohlížeči posílat HttpOnly cookies
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// 2. Pomocná funkce pro přečtení obyčejné cookie (CSRF) z prohlížeče
const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
    }
    return null;
};

// 3. Request Interceptor: Před každým odesláním požadavku připojí CSRF hlavičku
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Backend nám posílá XSRF-TOKEN v nechráněné cookie
        const csrfToken = getCookie('XSRF-TOKEN');

        // Pokud máme CSRF token, přidáme ho do hlavičky (Spring Security ho vyžaduje pro POST/PUT/DELETE)
        if (csrfToken && config.headers) {
            config.headers['X-XSRF-TOKEN'] = csrfToken;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 4. Response Interceptor: Zachytává chyby ze serveru
apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        const isAuthMe = error.config?.url?.includes('/auth/me');

        if (error.response && error.response.status === 401) {
            // Varování vypíšeme JEN pokud to NENÍ kontrola identity /auth/me
            if (!isAuthMe) {
                console.warn('Relace vypršela nebo je neplatná (401).');
            }
        }

        if (error.response && error.response.status === 403) {
            console.error('Přístup odepřen (403).', error);
        }

        return Promise.reject(error);
    }
);

export default apiClient;