import React, { type JSX } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import WelcomePage from './pages/WelcomePage';
import TerminalKiosk from './pages/TerminalKiosk';
import DashboardLayout from './layouts/DashboardLayout'; // Nezapomeň mít tento soubor vytvořený
import AdminUsersDashboard from './pages/AdminUsersDashboard'; // Nezapomeň vytvořit
import AdminShiftsDashboard from './pages/AdminShiftsDashboard'; // Nezapomeň vytvořit
import UserRegistrationPage from './pages/UserRegistrationPage';
import { AuthProvider, useAuth } from './context/AuthContext';

// Upravená komponenta ProtectedRoute, která teď umí hlídat i role
const ProtectedRoute = ({ children, allowedRoles }: { children: JSX.Element, allowedRoles?: string[] }) => {
    const { isAuthenticated, isLoading, userRole } = useAuth();

    if (isLoading) return null; // Zde může být nějaký globální spinner

    // Není přihlášen -> zpět na login
    if (!isAuthenticated) return <Navigate to="/" replace />;

    // Je přihlášen, ale zkoušíme omezit role a on tu požadovanou nemá -> hodíme ho jinam
    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
        return <Navigate to="/welcome" replace />; // Zatím ho hodíme na welcome, pokud nemá práva
    }

    return children;
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<LoginPage />} />

                    <Route
                        path="/welcome"
                        element={
                            <ProtectedRoute>
                                <WelcomePage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Terminál omezíme jen pro roli TERMINAL */}
                    <Route
                        path="/terminal"
                        element={
                            <ProtectedRoute allowedRoles={['TERMINAL']}>
                                <TerminalKiosk />
                            </ProtectedRoute>
                        }
                    />

                    {/* NOVÝ HLAVNÍ DASHBOARD LAYOUT */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }
                    >
                        {/* Když uživatel zadá jen /dashboard, rovnou ho to hodí na uživatele */}
                        <Route index element={<Navigate to="/dashboard/users" replace />} />

                        {/* Vnořené stránky, které se vykreslí místo <Outlet /> v layoutu */}
                        <Route path="users" element={<AdminUsersDashboard />} />
                        <Route path="shifts" element={<AdminShiftsDashboard />} />
                        <Route path="users/register" element={<UserRegistrationPage />} />
                    </Route>

                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;