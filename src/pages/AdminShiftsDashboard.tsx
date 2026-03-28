import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import MenuCard from '../components/MenuCard';
import { useAuth } from '../context/AuthContext';

const AdminShiftsDashboard: React.FC = () => {
    const { userRoles } = useAuth();

    // Robustní kontrola managementu
    const isManagerial = useMemo(() =>
        userRoles.some((role: string) =>
            ['ADMIN', 'PLANNER', 'MANAGEMENT'].includes(role.replace('ROLE_', '').toUpperCase())
        ), [userRoles]);

    return (
        <Box>
            <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 'bold', mb: 4, ml: 2 }}>
                Směny - Hlavní menu
            </Typography>

            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', ml: 2 }}>
                {/* TYTO KARTY VIDÍ VŠICHNI */}
                <MenuCard title="Směnář / náhled směn" navigateTo="/dashboard/shifts/generator" />
                <MenuCard title="Moje směny / moje dostupnost" navigateTo="/dashboard/calendar" />

                {/* TYTO KARTY VIDÍ JEN VEDENÍ A PLÁNOVAČ */}
                {isManagerial && (
                    <>
                        <MenuCard title="Nastavení pozic" navigateTo="/dashboard/settings/positions" />
                        <MenuCard title="Kvalifikace zaměstnanců" navigateTo="/dashboard/shifts/qualifications" />

                        {/* Tyto cesty zatím nemáš vytvořené v App.tsx, ale menu už na ně bude připravené */}
                        <MenuCard title="Výkazy a reporty" navigateTo="/dashboard/shifts/reports" />
                        <MenuCard title="Žádosti / Neobvyklé směny" navigateTo="/dashboard/shifts/requests" />
                    </>
                )}
            </Box>
        </Box>
    );
};

export default AdminShiftsDashboard;