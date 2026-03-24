import React from 'react';
import { Box, Typography } from '@mui/material';
import MenuCard from '../components/MenuCard';

const AdminShiftsDashboard: React.FC = () => {
    return (
        <Box>
            <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 'bold', mb: 4, ml: 2 }}>
                Směnář - Hlavní menu
            </Typography>

            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', ml: 2 }}>
                <MenuCard title="Směnář / generování směn" navigateTo="/dashboard/shifts/generator" />
                <MenuCard title="Nastavení pozic" navigateTo="/dashboard/settings/positions" />

                {/* OPRAVENÁ CESTA NA KALENDÁŘ */}
                <MenuCard title="Moje směny / moje dostupnost" navigateTo="/dashboard/calendar" />

                <MenuCard title="Výkazy a reporty" navigateTo="/dashboard/shifts/reports" />
                <MenuCard title="Kvalifikace zaměstnanců" navigateTo="/dashboard/shifts/qualifications" />
                <MenuCard title="Žádosti / Neobvyklé směny" navigateTo="/dashboard/shifts/requests" />
            </Box>
        </Box>
    );
};

export default AdminShiftsDashboard;