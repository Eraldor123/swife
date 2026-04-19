import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import EventNoteIcon from '@mui/icons-material/EventNote';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const DashboardLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Sjednocená barva pro sidebar, karty a hlavičky
    const DARK_THEME_COLOR = '#1a1a1a';
    const ACTIVE_BLUE = '#3498db';

    const isActive = (path: string) => location.pathname.includes(path);

    return (
        <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', bgcolor: '#111' }}>

            {/* SIDEBAR - Nyní sjednocený do prémiové tmavé */}
            <Box sx={{
                width: '100px',
                bgcolor: DARK_THEME_COLOR, // PŘIDÁNO: Sjednocená barva
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 4,
                gap: 5,
                borderRight: '1px solid #2a2a2a', // Decentní oddělení od obsahu
                boxShadow: '4px 0 15px rgba(0,0,0,0.3)',
                zIndex: 10
            }}>

                {/* Ikona Uživatelé */}
                <Tooltip title="Správa uživatelů" placement="right">
                    <Box
                        onClick={() => navigate('/dashboard/users')}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            color: isActive('/dashboard/users') ? ACTIVE_BLUE : '#7a808f',
                            '&:hover': {
                                color: 'white',
                                transform: 'scale(1.1)'
                            }
                        }}
                    >
                        <ManageAccountsIcon sx={{ fontSize: 38, mb: 0.5 }} />
                        <Typography sx={{
                            fontSize: '11px',
                            textAlign: 'center',
                            fontWeight: isActive('/dashboard/users') ? 700 : 400,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            Uživatelé
                        </Typography>
                        {/* Indikátor aktivní stránky */}
                        {isActive('/dashboard/users') && (
                            <Box sx={{ width: '4px', height: '20px', bgcolor: ACTIVE_BLUE, position: 'absolute', left: 0, borderRadius: '0 4px 4px 0' }} />
                        )}
                    </Box>
                </Tooltip>

                {/* Ikona Směny */}
                <Tooltip title="Plánování směn" placement="right">
                    <Box
                        onClick={() => navigate('/dashboard/shifts')}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            color: isActive('/dashboard/shifts') ? ACTIVE_BLUE : '#7a808f',
                            '&:hover': {
                                color: 'white',
                                transform: 'scale(1.1)'
                            }
                        }}
                    >
                        <EventNoteIcon sx={{ fontSize: 38, mb: 0.5 }} />
                        <Typography sx={{
                            fontSize: '11px',
                            textAlign: 'center',
                            fontWeight: isActive('/dashboard/shifts') ? 700 : 400,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            Směny
                        </Typography>
                        {/* Indikátor aktivní stránky */}
                        {isActive('/dashboard/shifts') && (
                            <Box sx={{ width: '4px', height: '20px', bgcolor: ACTIVE_BLUE, position: 'absolute', left: 0, borderRadius: '0 4px 4px 0' }} />
                        )}
                    </Box>
                </Tooltip>
            </Box>

            {/* HLAVNÍ OBSAHOVÁ ČÁST - Ponecháváme tvůj gradient, na něm ty černé karty krásně vyniknou */}
            <Box sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                background: 'linear-gradient(135deg, #8ba8c4 0%, #aebdd6 50%, #d4c2d4 100%)',
                position: 'relative'
            }}>
                <Box sx={{ p: 4, flexGrow: 1, overflowY: 'auto' }}>
                    <Outlet />
                </Box>
            </Box>

        </Box>
    );
};

export default DashboardLayout;