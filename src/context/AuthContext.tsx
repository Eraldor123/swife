import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    userEmail: string | null;
    userRole: string | null;
    login: (token: string, email: string, role: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem('token');
            const email = localStorage.getItem('userEmail');
            const role = localStorage.getItem('userRole');

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
                    setUserRole(role);
                } else {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userEmail');
                    localStorage.removeItem('userRole');
                }
            } catch (error) {
                console.error("Chyba při ověřování tokenu:", error);
            } finally {
                setIsLoading(false);
            }
        };

        verifyToken();
    }, []);

    const login = (token: string, email: string, role: string) => {
        localStorage.setItem('token', token);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userRole', role);
        setIsAuthenticated(true);
        setUserEmail(email);
        setUserRole(role);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        setIsAuthenticated(false);
        setUserEmail(null);
        setUserRole(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, userEmail, userRole, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth musí být použit uvnitř AuthProvider');
    }
    return context;
};