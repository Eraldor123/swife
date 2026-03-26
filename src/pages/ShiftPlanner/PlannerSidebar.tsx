import React from 'react';
import { Box, Paper, Typography, Button, Divider, Avatar } from '@mui/material';
import type { PlannerUser } from '../../types/schedule';

interface Props {
    users: PlannerUser[];
}

const PlannerSidebar: React.FC<Props> = ({ users }) => {
    const handleMouseEnter = (user: PlannerUser) => {
        document.querySelectorAll('.grid-row-station').forEach(el => {
            el.classList.remove('highlight-green', 'highlight-orange');
        });
        user.qualifiedStationIds.forEach(stationId => {
            const rowElements = document.querySelectorAll(`[data-station-id="${stationId}"]`);
            rowElements.forEach(el => el.classList.add('highlight-green'));
        });
    };

    const handleMouseLeave = () => {
        document.querySelectorAll('.grid-row-station').forEach(el => {
            el.classList.remove('highlight-green', 'highlight-orange');
        });
    };

    return (
        <Paper
            elevation={0}
            sx={{
                width: 320,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'rgba(255, 255, 255, 0.6)', // Průhlednější, aby vynikl tvůj gradient pozadí
                backdropFilter: 'blur(10px)',
                borderRadius: 0,
                p: 2,
                borderRight: '1px solid rgba(0,0,0,0.1)'
            }}
        >
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#3e3535', mb: 2, textAlign: 'center' }}>
                Zaměstnanci
            </Typography>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
                {users.map(user => (
                    <Paper
                        key={user.userId}
                        elevation={1}
                        onMouseEnter={() => handleMouseEnter(user)}
                        onMouseLeave={handleMouseLeave}
                        sx={{
                            p: 2,
                            mb: 2,
                            borderRadius: 3,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            border: '1px solid transparent',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: 3,
                                borderColor: '#3e3535'
                            }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                            <Avatar sx={{ bgcolor: '#3e3535', width: 32, height: 32, fontSize: '0.9rem' }}>
                                {user.name.charAt(0)}
                            </Avatar>
                            <Typography sx={{ fontWeight: 'bold', color: '#3e3535' }}>{user.name}</Typography>
                        </Box>

                        <Divider sx={{ mb: 1.5 }} />

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" color="textSecondary">Naplánováno:</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 'bold', bgcolor: '#3e3535', color: 'white', px: 1, borderRadius: 1 }}>
                                    {user.plannedShiftsThisMonth}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" color="textSecondary">Splněno:</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 'bold', border: '1px solid #3e3535', color: '#3e3535', px: 1, borderRadius: 1 }}>
                                    {user.completedShiftsThisMonth}
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                ))}
            </Box>

            <Button
                variant="contained"
                fullWidth
                sx={{
                    mt: 2,
                    bgcolor: '#3e3535',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#000' }
                }}
            >
                Rozházet směny
            </Button>
        </Paper>
    );
};

export default PlannerSidebar;