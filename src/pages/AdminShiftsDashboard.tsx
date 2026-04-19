import React, { useMemo } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import MenuCard from '../components/MenuCard';
import { useAuth } from '../context/AuthContext';
import LogoutIcon from '@mui/icons-material/Logout';
import GridViewIcon from '@mui/icons-material/GridView'; // Ikona mřížky do hlavičky
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventIcon from '@mui/icons-material/Event';
import SettingsIcon from '@mui/icons-material/Settings';
import GroupIcon from '@mui/icons-material/Group';
import { styles } from '../theme/DashboardMenu.styles';

const AdminShiftsDashboard: React.FC = () => {
    const { userRoles, logout } = useAuth();

    const isManagerial = useMemo(() =>
        userRoles.some((role: string) =>
            ['ADMIN', 'PLANNER', 'MANAGEMENT'].includes(role.replace('ROLE_', '').toUpperCase())
        ), [userRoles]);

    return (
        <Box sx={styles.container}>
            {/* NOVÁ TMAVÁ HLAVIČKA */}
            <Paper elevation={0} sx={styles.headerCard}>
                <Box sx={styles.headerLeft}>
                    <GridViewIcon sx={styles.headerIcon} />
                    <Typography variant="h5" sx={styles.pageTitle}>
                        Směny - Hlavní menu
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

            {/* MŘÍŽKA DLAŽDIC */}
            <Box sx={styles.cardsGrid}>
                <MenuCard
                    title="Směnář / náhled směn"
                    navigateTo="/dashboard/shifts/generator"
                    icon={<CalendarMonthIcon sx={{ fontSize: 'inherit' }} />}
                />
                <MenuCard
                    title="Moje směny / moje dostupnost"
                    navigateTo="/dashboard/calendar"
                    icon={<EventIcon sx={{ fontSize: 'inherit' }} />}
                />

                {isManagerial && (
                    <>
                        <MenuCard
                            title="Nastavení pozic"
                            navigateTo="/dashboard/settings/positions"
                            icon={<SettingsIcon sx={{ fontSize: 'inherit' }} />}
                        />
                        <MenuCard
                            title="Kvalifikace zaměstnanců"
                            navigateTo="/dashboard/shifts/qualifications"
                            icon={<GroupIcon sx={{ fontSize: 'inherit' }} />}
                        />
                    </>
                )}
            </Box>
        </Box>
    );
};

export default AdminShiftsDashboard;