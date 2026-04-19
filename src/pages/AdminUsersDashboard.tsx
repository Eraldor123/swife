import React, { useMemo } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import MenuCard from '../components/MenuCard';
import { useAuth } from '../context/AuthContext';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // Ikona uživatele do hlavičky
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HistoryIcon from '@mui/icons-material/History';
import { styles } from '../theme/DashboardMenu.styles';

const AdminUsersDashboard: React.FC = () => {
    const { userRoles, logout } = useAuth();

    const isAdminOrManagement = useMemo(() => {
        if (!userRoles) return false;
        const cleanUserRoles = userRoles.map(r => r.replace('ROLE_', '').toUpperCase());
        return cleanUserRoles.some(role => ['ADMIN', 'MANAGEMENT'].includes(role));
    }, [userRoles]);

    return (
        <Box sx={styles.container}>
            {/* NOVÁ TMAVÁ HLAVIČKA */}
            <Paper elevation={0} sx={styles.headerCard}>
                <Box sx={styles.headerLeft}>
                    <AccountCircleIcon sx={styles.headerIcon} />
                    <Typography variant="h5" sx={styles.pageTitle}>
                        Uživatelé - Hlavní menu
                    </Typography>
                </Box>

                <Button
                    variant="text"
                    onClick={logout}
                    startIcon={<LogoutIcon />}
                    sx={styles.logoutButton}
                >
                    Odhlásit
                </Button>
            </Paper>

            <Box sx={styles.cardsGrid}>
                {isAdminOrManagement ? (
                    <>
                        <MenuCard
                            title="Registrace nového uživatele"
                            navigateTo="/dashboard/users/register"
                            icon={<PersonAddIcon sx={{ fontSize: 'inherit' }} />}
                        />
                        <MenuCard
                            title="Historie změn (Logy)"
                            navigateTo="/dashboard/audit-logs"
                            icon={<HistoryIcon sx={{ fontSize: 'inherit' }} />}
                        />
                    </>
                ) : (
                    <Typography sx={styles.emptyMessage}>
                        V této sekci momentálně nemáte dostupné žádné funkce.
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default AdminUsersDashboard;