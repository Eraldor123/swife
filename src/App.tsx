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
import { NotificationProvider } from './context/NotificationContext'; // PŘIDÁNO
import EmployeeQualificationsPage from './pages/EmployeeQualificationsPage';
import ShiftPlanner from './pages/ShiftPlanner/components/ShiftPlannerPage.tsx';
import AuditLogsPage from './pages/AuditLogsPage';
import RequestReset from "./pages/RequestReset.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";

/**
 * VYLEPŠENÝ PROTECTED ROUTE
 */
const ProtectedRoute = ({ children, allowedRoles }: { children: JSX.Element, allowedRoles?: string[] }) => {
    const { isAuthenticated, isLoading, userRoles } = useAuth();

    if (isLoading) return null;
    if (!isAuthenticated) return <Navigate to="/" replace />;

    if (allowedRoles && userRoles) {
        const cleanUserRoles = userRoles.map(r => r.replace('ROLE_', '').toUpperCase());
        const hasRequiredRole = allowedRoles.some(role => cleanUserRoles.includes(role.toUpperCase()));

        if (!hasRequiredRole) {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children;
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <NotificationProvider> {/* PŘIDÁNO: Obalení notifikacemi */}
                <Router>
                    <Routes>
                        <Route path="/" element={<LoginPage />} />
                        <Route path="/welcome" element={<ProtectedRoute><WelcomePage /></ProtectedRoute>} />
                        <Route path="/terminal" element={<ProtectedRoute allowedRoles={['TERMINAL']}><TerminalKiosk /></ProtectedRoute>} />

                        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>} >
                            <Route index element={<Navigate to="/dashboard/users" replace />} />
                            <Route path="users" element={<AdminUsersDashboard />} />
                            <Route path="users/register" element={
                                <ProtectedRoute allowedRoles={['ADMIN', 'MANAGEMENT']}>
                                    <UserRegistrationPage />
                                </ProtectedRoute>
                            } />
                            <Route path="audit-logs" element={
                                <ProtectedRoute allowedRoles={['ADMIN', 'MANAGEMENT']}>
                                    <AuditLogsPage />
                                </ProtectedRoute>
                            } />
                            <Route path="settings/positions" element={
                                <ProtectedRoute allowedRoles={['ADMIN', 'PLANNER', 'MANAGEMENT']}>
                                    <PositionsSettingsPage />
                                </ProtectedRoute>
                            } />
                            <Route path="shifts" element={<AdminShiftsDashboard />} />
                            <Route path="shifts/generator" element={<ShiftPlanner />} />
                            <Route path="shifts/qualifications" element={
                                <ProtectedRoute allowedRoles={['ADMIN', 'PLANNER', 'MANAGEMENT']}>
                                    <EmployeeQualificationsPage />
                                </ProtectedRoute>
                            } />
                            <Route path="calendar" element={<AvailabilityCalendarPage />} />
                        </Route>

                        <Route path="/forgot-password" element={<RequestReset />} />
                        <Route path="/reset-hesla" element={<ResetPassword />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            </NotificationProvider>
        </AuthProvider>
    );
};

export default App;