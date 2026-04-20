// src/pages/ShiftPlanner/components/PlannerSidebar.tsx

import React, { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Avatar, List, ListItem, ListItemAvatar,
    ListItemText, ListItemButton, Tabs, Tab, Button, TextField
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

// Import nového prémiového designu
import { plannerStyles } from '../styles/ShiftPlannerStyles';

import type {
    PlannerUser,
    WeeklyScheduleResponse,
    HierarchyCategory,
    ScheduleShift
} from '../types/ShiftPlannerTypes';

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
    const [search, setSearch] = useState('');

    // =========================================================================
    // LOGIKA - ZŮSTÁVÁ NAPROSTO NEDOTČENA
    // =========================================================================
    const processedUsers = useMemo(() => {
        if (!Array.isArray(users)) return [];

        const validUsers = users.filter(user => user !== null && user !== undefined);

        return validUsers.map(user => {
            let offeredSlots = 0;
            let workedSlots = 0;

            if (viewMode === 'day') {
                const avail = user?.weekAvailability?.[selectedDate];
                if (avail === 'CELÝ DEN') offeredSlots = 2;
                else if (avail === 'DOP' || avail === 'ODP') offeredSlots = 1;

                const shiftsToday = (shifts || []).filter(s =>
                    s.shiftDate === selectedDate &&
                    (s.assignedUsers || []).some(au => au.userId === user.userId)
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

                (shifts || []).forEach(shift => {
                    if ((shift.assignedUsers || []).some(au => au.userId === user.userId)) {
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

            const isFullyBooked = offeredSlots > 0 && workedSlots >= offeredSlots;
            return { ...user, isFullyBooked };
        });
    }, [users, shifts, viewMode, selectedDate]);

    // Filtrace uživatelů podle záložky a vyhledávání
    const availableUsersList = processedUsers.filter(u => !u.isFullyBooked);
    const bookedUsersList = processedUsers.filter(u => u.isFullyBooked);
    let displayedUsers = tabIndex === 0 ? availableUsersList : bookedUsersList;

    if (search.trim() !== '') {
        displayedUsers = displayedUsers.filter(u =>
            (u.name || '').toLowerCase().includes(search.toLowerCase())
        );
    }

    // =========================================================================
    // VIZUÁL (JSX) - OPRAVENÝ FLEXBOX LAYOUT
    // =========================================================================
    return (
        <Paper elevation={0} sx={plannerStyles.sidebarPaper}>

            {/* 1. HLAVIČKA PANELU */}
            <Box sx={plannerStyles.sidebarHeader}>
                <Typography>Zaměstnanci</Typography>
            </Box>

            {/* 2. ZÁLOŽKY */}
            <Tabs
                value={tabIndex}
                onChange={(_, newValue) => {
                    setTabIndex(newValue);
                    onSelectUser(null);
                }}
                centered
                sx={plannerStyles.sidebarTabs}
            >
                <Tab label={`Dostupní (${availableUsersList.length})`} />
                <Tab label={`Obsazení (${bookedUsersList.length})`} />
            </Tabs>

            {/* VYHLEDÁVÁNÍ */}
            <Box sx={{ px: 2, pb: 1, flexShrink: 0 }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Hledat..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 20 }} />,
                        sx: { borderRadius: '8px', bgcolor: '#f8fafc' }
                    }}
                />
            </Box>

            {/* 3. SEZNAM ZAMĚSTNANCŮ (Scrollovatelná část) */}
            <List sx={{
                flexGrow: 1,
                overflowY: 'auto',
                p: 1,
                bgcolor: '#ffffff',
                minHeight: 0 // Klíčové pro správné scrollování ve flexu
            }}>

                {displayedUsers.length === 0 && (
                    <Typography variant="body2" sx={{ p: 3, textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                        {search ? 'Žádní zaměstnanci neodpovídají hledání.' : 'Žádní zaměstnanci v této kategorii.'}
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
                                        borderRadius: '8px',
                                        mb: 0.5,
                                        '&.Mui-selected': { bgcolor: '#eff6ff' },
                                        '&.Mui-selected:hover': { bgcolor: '#dbeafe' },
                                        opacity: tabIndex === 1 ? 0.7 : 1
                                    }}
                                >
                                    <ListItemAvatar sx={{ minWidth: 40 }}>
                                        <Avatar sx={{
                                            width: 32, height: 32, fontSize: '0.85rem',
                                            bgcolor: isSelected ? '#1976d2' : (tabIndex === 1 ? '#f1f5f9' : '#e2e8f0'),
                                            color: isSelected ? '#ffffff' : (tabIndex === 1 ? '#94a3b8' : '#64748b')
                                        }}>
                                            {user.name ? user.name.charAt(0) : '?'}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={<Typography sx={{ fontSize: '0.9rem', fontWeight: isSelected ? 600 : 500, color: isSelected ? '#1e293b' : '#334155' }}>{user.name || 'Neznámý'}</Typography>}
                                    />
                                </ListItemButton>
                            </ListItem>

                            {isSelected && (
                                <Box sx={{ p: 1.5, mx: 1, mb: 1, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                                        <Typography variant="caption" color="#64748b">Naplánováno v měsíci:</Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 'bold', bgcolor: '#1976d2', color: 'white', px: 1, py: 0.2, borderRadius: '4px' }}>
                                            {user.plannedShiftsThisMonth || 0}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="caption" color="#64748b">Splněno v měsíci:</Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 'bold', border: '1px solid #cbd5e1', color: '#475569', px: 1, py: 0.2, borderRadius: '4px' }}>
                                            {user.completedShiftsThisMonth || 0}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                        </React.Fragment>
                    );
                })}
            </List>

            {/* 4. PATIČKA (Vždy viditelná dospod) */}
            <Box sx={plannerStyles.autoPlanButtonWrapper}>
                <Button
                    variant="contained"
                    onClick={onAutoPlan}
                    sx={plannerStyles.autoPlanButton}
                >
                    Automaticky obsadit
                </Button>
            </Box>
        </Paper>
    );
};

export default PlannerSidebar;