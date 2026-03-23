import React from 'react';
import { Box, Typography } from '@mui/material';
import MenuCard from '../components/MenuCard';

const AdminUsersDashboard: React.FC = () => {
    return (
        <Box>
            <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 'bold', mb: 4, ml: 2 }}>
                Uživatelé - Hlavní menu
            </Typography>

            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', ml: 2 }}>
                <MenuCard title="Registrace nového uživatele" navigateTo="/dashboard/users/register" />
                <MenuCard title="Nastavení uživatelů" navigateTo="/dashboard/users/settings" />
                <MenuCard title="Osobní údaje" navigateTo="/dashboard/users/profile" />
            </Box>
        </Box>
    );
};

export default AdminUsersDashboard;