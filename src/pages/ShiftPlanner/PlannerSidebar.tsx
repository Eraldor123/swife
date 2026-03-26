import React from 'react';
import { Box, Paper, Typography, Button, Divider, Avatar } from '@mui/material';
import type { PlannerUser, DailyHours, HierarchyStation } from '../../types/schedule';

interface Props {
    users: PlannerUser[];
    selectedUserId: string | null;
    onSelectUser: (userId: string | null) => void;
    currentWeekDays: DailyHours[]; // PŘIDÁNO: Seznam dní v týdnu
    allStations: HierarchyStation[]; // PŘIDÁNO: Seznam všech stanovišť
}

const PlannerSidebar: React.FC<Props> = ({ users, selectedUserId, onSelectUser, currentWeekDays, allStations }) => {

    const handleMouseEnter = (user: PlannerUser) => {
        // 1. Reset: Odstranit všechny zvýrazňující třídy
        document.querySelectorAll('.grid-cell-day').forEach(el => {
            el.classList.remove('highlight-green', 'highlight-orange', 'highlight-red');
        });

        const qualifiedStationIds = new Set(user.qualifiedStationIds);
        const availability = user.weekAvailability; // Record<string, string> -> date:status

        // 2. Projdeme všechny stanoviště a všechny dny
        allStations.forEach(station => {

            // --- TADY JE TA OPRAVA ---
            // Pokud stanoviště nevyžaduje kvalifikaci, projde automaticky každý.
            // Jinak se podíváme, jestli má uživatel konkrétní certifikát.
            const isQualified = !station.needsQualification || qualifiedStationIds.has(station.id);

            currentWeekDays.forEach(day => {
                const dateStr = day.date;
                const userStatus = availability[dateStr] || 'NONE';
                const hasTime = userStatus !== 'NONE'; // Má čas aspoň na část dne

                // Kombinace logiky:
                let colorClass = 'highlight-red'; // Základ: nemá čas ani kvalifikaci

                if (isQualified && hasTime) {
                    colorClass = 'highlight-green'; // Má kvalifikaci i čas (nejlepší kombinace)
                } else if (hasTime) {
                    colorClass = 'highlight-orange'; // Má čas, ale nemá kvalifikaci (oranžové varování)
                }

                // Najít buňky odpovídající stanovišti a datu
                const cells = document.querySelectorAll(`.grid-cell-day[data-station-id="${station.id}"][data-date="${dateStr}"]`);
                cells.forEach(el => el.classList.add(colorClass));
            });
        });
    };
    const handleMouseLeave = () => {
        // Reset: Odstranit všechny zvýrazňující třídy
        document.querySelectorAll('.grid-cell-day').forEach(el => {
            el.classList.remove('highlight-green', 'highlight-orange', 'highlight-red');
        });
    };

    return (
        <Paper
            elevation={0}
            sx={{ width: 320, display: 'flex', flexDirection: 'column', bgcolor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(10px)', borderRadius: 0, p: 2, borderRight: '1px solid rgba(0,0,0,0.1)' }}
        >
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#3e3535', mb: 2, textAlign: 'center' }}> Zaměstnanci </Typography>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
                {users.map(user => {
                    const isSelected = selectedUserId === user.userId;

                    return (
                        <Paper
                            key={user.userId}
                            elevation={isSelected ? 6 : 1}
                            onMouseEnter={() => handleMouseEnter(user)}
                            onMouseLeave={handleMouseLeave}
                            onClick={() => onSelectUser(isSelected ? null : user.userId)}
                            sx={{
                                p: 2, mb: 2, borderRadius: 3, cursor: 'pointer', transition: 'all 0.2s',
                                border: isSelected ? '2px solid #1976d2' : '2px solid transparent',
                                bgcolor: isSelected ? '#f0f8ff' : 'white',
                                transform: isSelected ? 'translateY(-2px)' : 'none',
                                '&:hover': { transform: 'translateY(-2px)', boxShadow: 3, borderColor: isSelected ? '#1976d2' : '#3e3535' }
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                <Avatar sx={{ bgcolor: isSelected ? '#1976d2' : '#3e3535', width: 32, height: 32, fontSize: '0.9rem' }}> {user.name.charAt(0)} </Avatar>
                                <Typography sx={{ fontWeight: 'bold', color: isSelected ? '#1976d2' : '#3e3535' }}>{user.name}</Typography>
                            </Box>
                            <Divider sx={{ mb: 1.5 }} />
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" color="textSecondary">Naplánováno:</Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold', bgcolor: '#3e3535', color: 'white', px: 1, borderRadius: 1 }}> {user.plannedShiftsThisMonth} </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" color="textSecondary">Splněno:</Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold', border: '1px solid #3e3535', color: '#3e3535', px: 1, borderRadius: 1 }}> {user.completedShiftsThisMonth} </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    );
                })}
            </Box>
            <Button variant="contained" fullWidth sx={{ mt: 2, bgcolor: '#3e3535', borderRadius: '20px', fontWeight: 'bold', textTransform: 'none', '&:hover': { bgcolor: '#000' } }}>
                Rozházet směny automaticky
            </Button>
        </Paper>
    );
};

export default PlannerSidebar;