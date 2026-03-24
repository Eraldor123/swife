import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    userEmail: string | null;
    userId: string | null; // NOVÉ
    userRoles: string[];
    // NOVÉ: Přidáno userId do parametrů
    login: (token: string, email: string, roles: string[], userId: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null); // NOVÉ
    const [userRoles, setUserRoles] = useState<string[]>([]);

    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem('token');
            const email = localStorage.getItem('userEmail');
            const id = localStorage.getItem('userId'); // NOVÉ
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
                    setUserId(id); // NOVÉ
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

        void verifyToken();
    }, []);

    const login = (token: string, email: string, roles: string[], id: string) => {
        localStorage.setItem('token', token);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userId', id); // NOVÉ
        localStorage.setItem('userRoles', JSON.stringify(roles));
        setIsAuthenticated(true);
        setUserEmail(email);
        setUserId(id); // NOVÉ
        setUserRoles(roles);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userId'); // NOVÉ
        localStorage.removeItem('userRoles');
        setIsAuthenticated(false);
        setUserEmail(null);
        setUserId(null); // NOVÉ
        setUserRoles([]);
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