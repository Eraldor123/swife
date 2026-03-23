import React from 'react';
import { Box, Typography } from '@mui/material';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import EventNoteIcon from '@mui/icons-material/EventNote';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const DashboardLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname.includes(path);

    return (
        <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>

            {/* SIDEBAR */}
            <Box sx={{
                width: '100px',
                bgcolor: '#20232a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 4,
                gap: 4
            }}>
                {/* Ikona Uživatelé */}
                <Box
                    onClick={() => navigate('/dashboard/users')}
                    sx={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
                        color: isActive('/dashboard/users') ? 'white' : '#7a808f',
                        '&:hover': { color: 'white' }
                    }}
                >
                    <ManageAccountsIcon sx={{ fontSize: 40, mb: 0.5 }} />
                    <Typography sx={{ fontSize: '12px', textAlign: 'center' }}>Uživatelé</Typography>
                </Box>

                {/* Ikona Směny */}
                <Box
                    onClick={() => navigate('/dashboard/shifts')}
                    sx={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
                        color: isActive('/dashboard/shifts') ? 'white' : '#7a808f',
                        '&:hover': { color: 'white' }
                    }}
                >
                    <EventNoteIcon sx={{ fontSize: 40, mb: 0.5 }} />
                    <Typography sx={{ fontSize: '12px', textAlign: 'center' }}>Směny</Typography>
                </Box>
            </Box>

            {/* HLAVNÍ OBSAHOVÁ ČÁST S GRADIENTEM */}
            <Box sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                background: 'linear-gradient(135deg, #8ba8c4 0%, #aebdd6 50%, #d4c2d4 100%)'
            }}>
                <Box sx={{ p: 4, flexGrow: 1, overflowY: 'auto' }}>
                    <Outlet />
                </Box>
            </Box>

        </Box>
    );
};

export default DashboardLayout;