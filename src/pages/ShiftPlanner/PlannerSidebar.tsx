// src/components/shifts/Planner/PlannerSidebar.tsx

import React, { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Avatar, List, ListItem, ListItemAvatar,
    ListItemText, ListItemButton, Tabs, Tab, Button
} from '@mui/material';
import type {
    PlannerUser,
    WeeklyScheduleResponse,
    HierarchyCategory,
    ScheduleShift
} from '../../types/schedule';

interface SidebarProps {
    users: PlannerUser[];
    selectedUserId: string | null;
    onSelectUser: (userId: string | null) => void;
    currentWeekDays: WeeklyScheduleResponse['days'];
    allStations: HierarchyCategory['stations'];
    shifts: ScheduleShift[];
    viewMode: 'week' | 'day';
    selectedDate: string;
    onAutoPlan?: () => void;
}

const PlannerSidebar: React.FC<SidebarProps> = ({
                                                    users, selectedUserId, onSelectUser, shifts, viewMode, selectedDate, onAutoPlan
                                                }) => {
    const [tabIndex, setTabIndex] = useState(0);

    const processedUsers = useMemo(() => {
        // 1. BEZPEČNOSTNÍ POJISTKA: Zkontrolujeme, že users je pole
        if (!Array.isArray(users)) return [];

        // 2. BEZPEČNOSTNÍ POJISTKA: Vyhodíme všechny null/undefined záznamy
        const validUsers = users.filter(user => user !== null && user !== undefined);

        return validUsers.map(user => {
            let offeredSlots = 0;
            let workedSlots = 0;

            if (viewMode === 'day') {
                // 3. BEZPEČNOSTNÍ POJISTKA: Přidán otazník u user?.weekAvailability
                const avail = user?.weekAvailability?.[selectedDate];
                if (avail === 'CELÝ DEN') offeredSlots = 2;
                else if (avail === 'DOP' || avail === 'ODP') offeredSlots = 1;

                const shiftsToday = shifts.filter(s =>
                    s.shiftDate === selectedDate &&
                    s.assignedUsers.some(au => au.userId === user.userId)
                );

                let hasMorning = false;
                let hasAfternoon = false;

                shiftsToday.forEach(s => {
                    const startH = parseInt(s.startTime?.substring(11, 13) || '0', 10);
                    const endH = parseInt(s.endTime?.substring(11, 13) || '0', 10);
                    if (startH < 12 && endH >= 15) { hasMorning = true; hasAfternoon = true; }
                    else if (startH >= 12) { hasAfternoon = true; }
                    else { hasMorning = true; }
                });

                if (hasMorning) workedSlots += 1;
                if (hasAfternoon) workedSlots += 1;

            } else {
                Object.values(user?.weekAvailability || {}).forEach(avail => {
                    if (avail === 'CELÝ DEN') offeredSlots += 2;
                    else if (avail === 'DOP' || avail === 'ODP') offeredSlots += 1;
                });

                const userShiftsByDate = new Map<string, ScheduleShift[]>();

                shifts.forEach(shift => {
                    if (shift.assignedUsers.some(au => au.userId === user.userId)) {
                        const arr = userShiftsByDate.get(shift.shiftDate) || [];
                        arr.push(shift);
                        userShiftsByDate.set(shift.shiftDate, arr);
                    }
                });

                userShiftsByDate.forEach((shiftsOnDate) => {
                    let hasMorning = false;
                    let hasAfternoon = false;
                    shiftsOnDate.forEach(s => {
                        const startH = parseInt(s.startTime?.substring(11, 13) || '0', 10);
                        const endH = parseInt(s.endTime?.substring(11, 13) || '0', 10);
                        if (startH < 12 && endH >= 15) { hasMorning = true; hasAfternoon = true; }
                        else if (startH >= 12) { hasAfternoon = true; }
                        else { hasMorning = true; }
                    });
                    if (hasMorning) workedSlots += 1;
                    if (hasAfternoon) workedSlots += 1;
                });
            }

            const isFullyBooked = offeredSlots === 0 || workedSlots >= offeredSlots;
            return { ...user, isFullyBooked };
        });
    }, [users, shifts, viewMode, selectedDate]);

    const availableUsersList = processedUsers.filter(u => !u.isFullyBooked);
    const bookedUsersList = processedUsers.filter(u => u.isFullyBooked);
    const displayedUsers = tabIndex === 0 ? availableUsersList : bookedUsersList;

    return (
        <Paper elevation={2} sx={{ width: 280, display: 'flex', flexDirection: 'column', height: '100%', zIndex: 10 }}>
            <Box sx={{ bgcolor: '#3e3535', color: 'white', pt: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', px: 2, pb: 1 }}>Zaměstnanci</Typography>

                <Tabs
                    value={tabIndex}
                    onChange={(_, newValue) => {
                        setTabIndex(newValue);
                        onSelectUser(null);
                    }}
                    variant="fullWidth"
                    sx={{
                        minHeight: 40,
                        '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)', minHeight: 40, textTransform: 'none', fontWeight: 'bold' },
                        '& .Mui-selected': { color: '#fff !important' },
                        '& .MuiTabs-indicator': { backgroundColor: '#4caf50' }
                    }}
                >
                    <Tab label={`Dostupní (${availableUsersList.length})`} />
                    <Tab label={`Obsazení (${bookedUsersList.length})`} sx={{ '&.Mui-selected': { color: '#ff9800 !important' } }} />
                </Tabs>
            </Box>

            <List sx={{ flexGrow: 1, overflow: 'auto', p: 0, bgcolor: tabIndex === 1 ? '#fafafa' : 'white' }}>
                {displayedUsers.length === 0 && (
                    <Typography variant="body2" sx={{ p: 3, textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
                        Žádní zaměstnanci v této kategorii.
                    </Typography>
                )}

                {displayedUsers.map((user) => {
                    const isSelected = user.userId === selectedUserId;
                    return (
                        <React.Fragment key={user.userId}>
                            <ListItem disablePadding>
                                <ListItemButton
                                    selected={isSelected}
                                    onClick={() => onSelectUser(isSelected ? null : user.userId)}
                                    sx={{
                                        borderBottom: '1px solid #eee',
                                        '&.Mui-selected': { bgcolor: '#e3f2fd' },
                                        '&.Mui-selected:hover': { bgcolor: '#bbdefb' },
                                        opacity: tabIndex === 1 ? 0.7 : 1
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: isSelected ? '#1976d2' : (tabIndex === 1 ? '#e0e0e0' : '#bdbdbd') }}>
                                            {user.name ? user.name.charAt(0) : '?'}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={<Typography sx={{ fontWeight: isSelected ? 'bold' : 'normal', color: '#3e3535' }}>{user.name || 'Neznámý'}</Typography>}
                                    />
                                </ListItemButton>
                            </ListItem>

                            {isSelected && (
                                <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderBottom: '1px solid #ddd' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">Naplánováno v měsíci:</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', bgcolor: '#3e3535', color: 'white', px: 1, py: 0.2, borderRadius: 1 }}>
                                            {user.plannedShiftsThisMonth || 0}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">Splněno v měsíci:</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', border: '1px solid #3e3535', px: 1, py: 0.2, borderRadius: 1 }}>
                                            {user.completedShiftsThisMonth || 0}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                        </React.Fragment>
                    );
                })}
            </List>

            <Box sx={{ p: 2, borderTop: '1px solid #eee', bgcolor: '#fafafa', display: 'flex' }}>
                <Button
                    variant="contained"
                    onClick={onAutoPlan}
                    fullWidth
                    sx={{
                        bgcolor: '#ff9800',
                        color: 'white',
                        fontWeight: 'bold',
                        textTransform: 'none',
                        borderRadius: 2,
                        py: 1.5,
                        '&:hover': { bgcolor: '#e68a00' }
                    }}
                >
                    ✨ Automaticky obsadit
                </Button>
            </Box>
        </Paper>
    );
};

export default PlannerSidebar;