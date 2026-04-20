import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import apiClient from '../api/axiosConfig';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    userEmail: string | null;
    userId: string | null;
    userRoles: string[];
    login: (email: string, roles: string[], userId: string) => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [userRoles, setUserRoles] = useState<string[]>([]);

    // 1. ASYNCHRONNÍ HYDRATACE (Tichý check identity při startu aplikace)
    useEffect(() => {
        const verifySession = async () => {
            try {
                // apiClient automaticky pošle HttpOnly cookie
                const response = await apiClient.get('/auth/me');

                if (response.status === 200) {
                    setIsAuthenticated(true);
                    setUserEmail(response.data.email);
                    setUserId(response.data.userId);
                    setUserRoles(response.data.roles || []);
                }
            } catch (error) {
                console.log(error);
                // UMLČENO: Odstranili jsme console.error(error).
                // 401 je pro nepřihlášeného uživatele běžný stav, ne chyba k řešení.
                setIsAuthenticated(false);
                setUserEmail(null);
                setUserId(null);
                setUserRoles([]);
            } finally {
                setIsLoading(false);
            }
        };

        void verifySession();
    }, []);

    // 2. LOKÁLNÍ PŘIHLÁŠENÍ (Volá se z LoginPage po úspěšném API požadavku)
    const login = (email: string, roles: string[], id: string) => {
        setIsAuthenticated(true);
        setUserEmail(email);
        setUserId(id);
        setUserRoles(roles);
    };

    // 3. ODHLÁŠENÍ (Zavolá backend a vyčistí lokální stav)
    const logout = async () => {
        try {
            // Zavoláme logout na backendu, aby smazal HttpOnly cookie
            await apiClient.post('/auth/logout');
        } catch (error) {
            console.error("Chyba při odhlašování na backendu:", error);
        } finally {
            // Bez ohledu na výsledek backendu, vyčistíme frontend
            setIsAuthenticated(false);
            setUserEmail(null);
            setUserId(null);
            setUserRoles([]);

            // Přesun na login bez reloadu celého okna
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, userEmail, userId, userRoles, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth musí být použit uvnitř AuthProvider');
    return context;
};