import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import MenuCard from '../components/MenuCard';
import { useAuth } from '../context/AuthContext'; // Import pro přístup k rolím

const AdminUsersDashboard: React.FC = () => {
    const { userRoles } = useAuth(); // Získání rolí přihlášeného uživatele

    /**
     * Logika pro zobrazení administrátorských karet.
     * Karty uvidí pouze role ADMIN nebo MANAGEMENT.
     */
    const isAdminOrManagement = useMemo(() => {
        if (!userRoles) return false;
        // Očištění rolí od prefixu ROLE_ pro konzistenci[cite: 1]
        const cleanUserRoles = userRoles.map(r => r.replace('ROLE_', '').toUpperCase());
        return cleanUserRoles.some(role => ['ADMIN', 'MANAGEMENT'].includes(role));
    }, [userRoles]);

    return (
        <Box>
            <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 'bold', mb: 4, ml: 2 }}>
                Uživatelé - Hlavní menu
            </Typography>

            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', ml: 2 }}>
                {isAdminOrManagement ? (
                    <>
                        {/* Tyto karty se zobrazí pouze Adminovi a Managementu */}
                        <MenuCard title="Registrace nového uživatele" navigateTo="/dashboard/users/register" />
                        <MenuCard title="Nastavení uživatelů" navigateTo="/dashboard/users/settings" />
                        <MenuCard title="Osobní údaje" navigateTo="/dashboard/users/profile" />
                        <MenuCard title="Historie změn (Logy)" navigateTo="/dashboard/audit-logs" />
                    </>
                ) : (
                    /* Zpráva pro Plánovače a Brigádníky, dokud nebudou mít vlastní funkce */
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', ml: 1 }}>
                        V této sekci momentálně nemáte dostupné žádné funkce.
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default AdminUsersDashboard;