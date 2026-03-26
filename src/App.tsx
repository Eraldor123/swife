import React, { type JSX } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import WelcomePage from './pages/WelcomePage';
import TerminalKiosk from './pages/TerminalKiosk';
import DashboardLayout from './layouts/DashboardLayout';
import AdminUsersDashboard from './pages/AdminUsersDashboard';
import AdminShiftsDashboard from './pages/AdminShiftsDashboard';
import UserRegistrationPage from './pages/UserRegistrationPage';
import PositionsSettingsPage from './pages/PositionsSettingsPage';
import AvailabilityCalendarPage from './pages/AvailabilityCalendarPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import EmployeeQualificationsPage from './pages/EmployeeQualificationsPage'; // Uprav cestu podle sebe

const ProtectedRoute = ({ children, allowedRoles }: { children: JSX.Element, allowedRoles?: string[] }) => {
    const { isAuthenticated, isLoading, userRoles } = useAuth();

    if (isLoading) return null;
    if (!isAuthenticated) return <Navigate to="/" replace />;

    if (allowedRoles && userRoles && userRoles.length > 0) {
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
                    {/* Veřejné cesty */}
                    <Route path="/" element={<LoginPage />} />

                    {/* Cesty vyžadující přihlášení, ale mimo hlavní dashboard */}
                    <Route path="/welcome" element={<ProtectedRoute><WelcomePage /></ProtectedRoute>} />
                    <Route path="/terminal" element={<ProtectedRoute allowedRoles={['TERMINAL']}><TerminalKiosk /></ProtectedRoute>} />

                    {/* HLAVNÍ DASHBOARD (Všechny pod-cesty se píšou bez úvodního lomítka) */}
                    <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>} >
                        <Route index element={<Navigate to="/dashboard/users" replace />} />

                        <Route path="users" element={<AdminUsersDashboard />} />

                        <Route path="users/register" element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGEMENT']}><UserRegistrationPage /></ProtectedRoute>
                        } />

                        <Route path="settings/positions" element={<PositionsSettingsPage />} />

                        <Route path="shifts" element={<AdminShiftsDashboard />} />

                        {/* OPRAVENO: Bez úvodního lomítka a sjednoceno s tlačítkem */}
                        <Route path="shifts/qualifications" element={<EmployeeQualificationsPage />} />

                        <Route path="calendar" element={<AvailabilityCalendarPage />} />
                    </Route>

                    {/* Ochrana proti neexistujícím adresám */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;