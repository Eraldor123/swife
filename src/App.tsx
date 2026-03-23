import React, { type JSX } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import WelcomePage from './pages/WelcomePage';
import TerminalKiosk from './pages/TerminalKiosk';
import DashboardLayout from './layouts/DashboardLayout';
import AdminUsersDashboard from './pages/AdminUsersDashboard';
import AdminShiftsDashboard from './pages/AdminShiftsDashboard';
import UserRegistrationPage from './pages/UserRegistrationPage';
import { AuthProvider, useAuth } from './context/AuthContext';

// OPRAVA: Tady jsme změnili allowedRole (text) na allowedRoles (pole)
const ProtectedRoute = ({ children, allowedRoles }: { children: JSX.Element, allowedRoles?: string[] }) => {
    const { isAuthenticated, isLoading, userRoles } = useAuth();

    if (isLoading) return null;
    if (!isAuthenticated) return <Navigate to="/" replace />;

    // Bezpečná kontrola pro pole rolí
    if (allowedRoles && Array.isArray(userRoles) && userRoles.length > 0) {
        const hasRequiredRole = userRoles.some(role => allowedRoles.includes(role));
        if (!hasRequiredRole) {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children;
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<LoginPage />} />
                    <Route path="/welcome" element={<ProtectedRoute><WelcomePage /></ProtectedRoute>} />

                    {/* Předáváme pole s jednou rolí TERMINAL */}
                    <Route path="/terminal" element={<ProtectedRoute allowedRoles={['TERMINAL']}><TerminalKiosk /></ProtectedRoute>} />

                    <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>} >
                        <Route index element={<Navigate to="/dashboard/users" replace />} />
                        <Route path="users" element={<AdminUsersDashboard />} />

                        {/* Předáváme pole pro ADMIN a MANAGEMENT */}
                        <Route path="users/register" element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGEMENT']}><UserRegistrationPage /></ProtectedRoute>
                        } />

                        <Route path="shifts" element={<AdminShiftsDashboard />} />
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;