import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    userEmail: string | null;
    userRoles: string[];
    login: (token: string, email: string, roles: string[]) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userRoles, setUserRoles] = useState<string[]>([]);

    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem('token');
            const email = localStorage.getItem('userEmail');
            const rolesString = localStorage.getItem('userRoles');
            const roles = rolesString ? JSON.parse(rolesString) : [];

            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch('http://localhost:8080/api/v1/users/verify', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    setIsAuthenticated(true);
                    setUserEmail(email);
                    setUserRoles(roles);
                } else {
                    logout();
                }
            } catch (error) {
                console.error("Chyba při ověřování tokenu:", error);
            } finally {
                setIsLoading(false);
            }
        };

        // OPRAVA: Přidáno klíčové slovo "void" pro uklidnění ESLintu
        void verifyToken();
    }, []);

    const login = (token: string, email: string, roles: string[]) => {
        localStorage.setItem('token', token);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userRoles', JSON.stringify(roles));
        setIsAuthenticated(true);
        setUserEmail(email);
        setUserRoles(roles);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRoles');
        setIsAuthenticated(false);
        setUserEmail(null);
        setUserRoles([]);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, userEmail, userRoles, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// OPRAVA: Tento komentář vypne přísné pravidlo Vite pouze pro následující řádek
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth musí být použit uvnitř AuthProvider');
    return context;
};