import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    userEmail: string | null;
    userId: string | null;
    userRoles: string[];
    login: (email: string, roles: string[], userId: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [userRoles, setUserRoles] = useState<string[]>([]);

    useEffect(() => {
        const verifyToken = async () => {
            const email = localStorage.getItem('userEmail');
            const id = localStorage.getItem('userId');
            const rolesString = localStorage.getItem('userRoles');
            const roles = rolesString ? JSON.parse(rolesString) : [];

            try {
                const response = await fetch('http://localhost:8080/api/v1/users/verify', {
                    method: 'GET',
                    credentials: 'include'
                });

                const data = await response.json();

                if (data.authenticated === true) {
                    setIsAuthenticated(true);
                    setUserEmail(email);
                    setUserId(id);
                    setUserRoles(roles);
                } else {
                    setIsAuthenticated(false);
                    setUserEmail(null);
                    setUserId(null);
                    setUserRoles([]);
                    localStorage.removeItem('userEmail');
                    localStorage.removeItem('userId');
                    localStorage.removeItem('userRoles');
                }
            } catch (error) {
                console.error("Chyba sítě při ověřování identity:", error);
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        void verifyToken();
    }, []);

    const login = (email: string, roles: string[], id: string) => {
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userId', id);
        localStorage.setItem('userRoles', JSON.stringify(roles));

        setIsAuthenticated(true);
        setUserEmail(email);
        setUserId(id);
        setUserRoles(roles);
    };

    const logout = () => {
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userId');
        localStorage.removeItem('userRoles');

        setIsAuthenticated(false);
        setUserEmail(null);
        setUserId(null);
        setUserRoles([]);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, userEmail, userId, userRoles, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// TENTO KOMENTÁŘ ŘEŠÍ TVOJI CHYBU:
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth musí být použit uvnitř AuthProvider');
    return context;
};