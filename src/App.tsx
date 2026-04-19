import React, { type JSX } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import WelcomePage from './pages/WelcomePage';
import TerminalKiosk from './pages/TerminalKiosk';
import DashboardLayout from './components/DashboardLayout.tsx';
import AdminUsersDashboard from './pages/AdminUsersDashboard';
import AdminShiftsDashboard from './pages/AdminShiftsDashboard';
import UserRegistrationPage from './pages/UserRegistrationPage';
import PositionsSettingsPage from './pages/PositionsSettingsPage';
import AvailabilityCalendarPage from './pages/AvailabilityCalendarPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import EmployeeQualificationsPage from './pages/EmployeeQualificationsPage';
import ShiftPlanner from './pages/ShiftPlanner/ShiftPlanner';
import AuditLogsPage from './pages/AuditLogsPage'; // PŘIDÁNO: Import pro Audit logy
import RequestReset from "./pages/RequestReset.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";

/**
 * VYLEPŠENÝ PROTECTED ROUTE
 * Automaticky čistí role od prefixu ROLE_ a kontroluje oprávnění.
 */
const ProtectedRoute = ({ children, allowedRoles }: { children: JSX.Element, allowedRoles?: string[] }) => {
    const { isAuthenticated, isLoading, userRoles } = useAuth();

    if (isLoading) return null;
    if (!isAuthenticated) return <Navigate to="/" replace />;

    if (allowedRoles && userRoles) {
        // Normalizujeme role (odstraníme ROLE_ a převedeme na velká písmena)
        const cleanUserRoles = userRoles.map(r => r.replace('ROLE_', '').toUpperCase());
        const hasRequiredRole = allowedRoles.some(role => cleanUserRoles.includes(role.toUpperCase()));

        if (!hasRequiredRole) {
            // Pokud nemá právo, pošleme ho na základní dashboard
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
                    {/* VEŘEJNÉ CESTY */}
                    <Route path="/" element={<LoginPage />} />

                    {/* CESTY MIMO DASHBOARD */}
                    <Route path="/welcome" element={<ProtectedRoute><WelcomePage /></ProtectedRoute>} />
                    <Route path="/terminal" element={<ProtectedRoute allowedRoles={['TERMINAL']}><TerminalKiosk /></ProtectedRoute>} />

                    {/* HLAVNÍ DASHBOARD */}
                    <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>} >

                        {/* Výchozí stránka dashboardu */}
                        <Route index element={<Navigate to="/dashboard/users" replace />} />

                        {/* SEKCE UŽIVATELÉ */}
                        <Route path="users" element={<AdminUsersDashboard />} />
                        <Route path="users/register" element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGEMENT']}>
                                <UserRegistrationPage />
                            </ProtectedRoute>
                        } />

                        {/* SEKCE AUDIT LOGY - Zabezpečeno pro vedení */}
                        <Route path="audit-logs" element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGEMENT']}>
                                <AuditLogsPage />
                            </ProtectedRoute>
                        } />

                        {/* SEKCE NASTAVENÍ - Zabezpečeno pro vedení a plánovače */}
                        <Route path="settings/positions" element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'PLANNER', 'MANAGEMENT']}>
                                <PositionsSettingsPage />
                            </ProtectedRoute>
                        } />

                        {/* SEKCE SMĚNY */}
                        <Route path="shifts" element={<AdminShiftsDashboard />} />

                        {/* Směnář vidí všichni, ale jeho vnitřek se mění podle role (již jsme upravili v ShiftPlanner.tsx) */}
                        <Route path="shifts/generator" element={<ShiftPlanner />} />

                        {/* Kvalifikace - Zabezpečeno pro vedení a plánovače */}
                        <Route path="shifts/qualifications" element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'PLANNER', 'MANAGEMENT']}>
                                <EmployeeQualificationsPage />
                            </ProtectedRoute>
                        } />

                        {/* Kalendář dostupnosti vidí všichni */}
                        <Route path="calendar" element={<AvailabilityCalendarPage />} />
                    </Route>

                    <Route path="/forgot-password" element={<RequestReset />} />
                    <Route path="/reset-hesla" element={<ResetPassword />} />

                    {/* OCHRANA PROTI NEEXISTUJÍCÍM ADRESÁM */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;