// src/components/shifts/Planner/DailyPlannerGrid.tsx

import React from 'react';
import { Box, Typography, Paper, Tooltip } from '@mui/material';
import type {
    WeeklyScheduleResponse,
    ScheduleShift,
    HierarchyData,
    PlannerUser,
    HierarchyCategory,
    HierarchyStation
} from '../../types/schedule';

// 1. PŘIDÁNO: onRemoveUser
interface Props {
    hierarchy: HierarchyData | null;
    scheduleData: WeeklyScheduleResponse | null;
    users: PlannerUser[];
    selectedUserId: string | null;
    selectedDate: string;
    onAssignUser: (shiftId: string) => void;
    onRemoveUser: (shiftId: string, userId: string) => void; // <--- PŘIDÁNO
    onShiftClick: (shift: ScheduleShift) => void;
}

const MIN_HOUR = 6;
const MAX_HOUR = 22;
const TOTAL_HALF_HOURS = (MAX_HOUR - MIN_HOUR) * 2;

const getSurname = (fullName: string) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(' ');
    return parts.length > 1 ? parts[parts.length - 1] : fullName;
};

// 2. PŘIDÁNO: onRemoveUser do destrukce parametrů
const DailyPlannerGrid: React.FC<Props> = ({ hierarchy, scheduleData, users, selectedUserId, selectedDate, onAssignUser, onRemoveUser, onShiftClick }) => {
    if (!hierarchy || !scheduleData) return null;

    const selectedUser = Array.isArray(users) ? users.find(u => u.userId === selectedUserId) : null;
    const shiftsForDay = scheduleData.shifts?.filter(s => s.shiftDate === selectedDate) || [];

    const getGridColumn = (timeStr: string) => {
        if (!timeStr) return 1;
        const h = parseInt(timeStr.substring(11, 13), 10);
        const m = parseInt(timeStr.substring(14, 16), 10);

        let segment = (h - MIN_HOUR) * 2 + (m >= 30 ? 1 : 0) + 1;
        if (segment < 1) segment = 1;
        if (segment > TOTAL_HALF_HOURS + 1) segment = TOTAL_HALF_HOURS + 1;
        return segment;
    };

    const renderShiftBlock = (shift: ScheduleShift, stat: HierarchyStation) => {
        const startCol = getGridColumn(shift.startTime);
        const endCol = getGridColumn(shift.endTime);
        const assignedCount = shift.assignedUsers?.length || 0;
        const isFull = assignedCount >= shift.requiredCapacity;
        const isAlreadyAssigned = selectedUserId && shift.assignedUsers?.some(u => u.userId === selectedUserId);

        let bgColor = isFull ? '#4caf50' : '#ef5350';


        if (selectedUser) {
            // <--- OPRAVA: Pokud nevyžaduje kvalifikaci, bereme ho jako kvalifikovaného --->
            const isQualified = !stat.needsQualification || selectedUser.qualifiedStationIds?.includes(stat.id);
            const avail = selectedUser.weekAvailability?.[selectedDate];
            const shiftStartH = parseInt(shift.startTime.substring(11, 13), 10);

            // ... (zbytek zůstává)

            let hasTime = false;
            if (avail === 'CELÝ DEN') hasTime = true;
            else if (avail === 'DOP' && shiftStartH < 13) hasTime = true;
            else if (avail === 'ODP' && shiftStartH >= 12) hasTime = true;

            if (isAlreadyAssigned) bgColor = '#9e9e9e'; // Šedá - už zde dělá
            else if (!hasTime) bgColor = '#ef5350';     // Červená - nemá čas
            else if (!isQualified) bgColor = '#ffb300'; // Oranžová - nemá kvalifikaci
            else bgColor = '#4caf50';                   // Zelená - může dělat
        }

        const assignedNames = shift.assignedUsers?.map(u => getSurname(u.name)).join(', ');

        return (
            <Tooltip
                key={shift.id}
                arrow
                title={
                    <Box sx={{ p: 1, fontSize: '0.75rem' }}>
                        <Typography variant="body2">Čas: {shift.startTime?.substring(11, 16)} — {shift.endTime?.substring(11, 16)}</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mt: 0.5 }}>
                            Lidé: {assignedNames || 'Nikdo'}
                        </Typography>
                        {shift.description && <Typography variant="body2" sx={{ color: '#ffb74d', mt: 0.5 }}>📝 {shift.description}</Typography>}
                    </Box>
                }
            >
                <Box
                    onClick={() => {
                        if (selectedUserId) {
                            // 3. OPRAVA LOGIKY: Pokud je přiřazený, odebereme ho
                            if (isAlreadyAssigned) {
                                onRemoveUser(shift.id, selectedUserId);
                            } else if (!isFull) {
                                onAssignUser(shift.id);
                            }
                        } else {
                            onShiftClick(shift);
                        }
                    }}
                    sx={{
                        gridColumn: `${startCol} / ${endCol}`,
                        bgcolor: bgColor,
                        color: 'white',
                        borderRadius: 1, // Ostřejší hrany jako v ukázce
                        height: '42px', // Roztažení bloku po celé výšce řádku
                        px: 1.5,
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        // 4. OPRAVA KURZORU: Umožní kliknout na odebrání
                        cursor: selectedUserId ? (isAlreadyAssigned ? 'pointer' : (isFull ? 'not-allowed' : 'cell')) : 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)', // Lehce výraznější stín
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        transition: 'transform 0.1s',
                        zIndex: 2, // Tohle zabrání prosvítání čar!
                        '&:hover': { transform: 'scale(1.01)', zIndex: 3 }
                    }}
                >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{assignedNames || 'Volno'}</span>
                    <span>[{assignedCount}/{shift.requiredCapacity}]</span>
                </Box>
            </Tooltip>
        );
    };

    return (
        <Paper elevation={0} sx={{
            borderRadius: 4, bgcolor: 'white', position: 'absolute', inset: 0, overflow: 'auto', border: '1px solid rgba(0,0,0,0.1)'
        }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: `180px repeat(${TOTAL_HALF_HOURS}, minmax(30px, 1fr))`, position: 'sticky', top: 0, zIndex: 10, bgcolor: '#fafafa', borderBottom: '2px solid #eee' }}>
                <Box sx={{ p: 2, fontWeight: 'bold', borderRight: '1px solid #eee', display: 'flex', alignItems: 'center' }}>
                    {new Date(selectedDate).toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'numeric' })}
                </Box>
                {Array.from({ length: MAX_HOUR - MIN_HOUR }).map((_, i) => (
                    <Box key={i} sx={{ gridColumn: 'span 2', textAlign: 'center', py: 1, borderRight: '1px solid #eee', fontSize: '0.75rem', fontWeight: 'bold', color: '#555' }}>
                        {String(MIN_HOUR + i).padStart(2, '0')}:00
                    </Box>
                ))}
            </Box>

            {hierarchy.categories.map((cat: HierarchyCategory) => (
                <React.Fragment key={cat.id}>
                    <Box sx={{ bgcolor: cat.color || '#f5f5f5', p: 1, pl: 3, fontWeight: 'bold', fontSize: '0.85rem', textTransform: 'uppercase', borderBottom: '1px solid #eee', gridColumn: '1 / -1' }}>
                        {cat.name}
                    </Box>

                    {cat.stations.map((stat: HierarchyStation) => {
                        const stationShifts = shiftsForDay.filter(s => s.stationId === stat.id);

                        return (
                            <Box key={stat.id} sx={{ display: 'grid', gridTemplateColumns: `180px 1fr`, borderBottom: '1px solid #f0f0f0', minHeight: '52px' }}>
                                <Box sx={{ p: 1.5, borderRight: '1px solid #eee', display: 'flex', alignItems: 'center', bgcolor: 'white', zIndex: 2 }}>
                                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#444' }}>{stat.name}</Typography>
                                </Box>

                                <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${TOTAL_HALF_HOURS}, 1fr)`, position: 'relative', p: 0.5, alignItems: 'center' }}>
                                    {/* Pozadí s čarami */}
                                    <Box sx={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: `repeat(${MAX_HOUR - MIN_HOUR}, 1fr)`, pointerEvents: 'none', zIndex: 1 }}>
                                        {Array.from({ length: MAX_HOUR - MIN_HOUR }).map((_, i) => (
                                            <Box key={i} sx={{ borderRight: '1px dashed #e0e0e0', height: '100%' }} />
                                        ))}
                                    </Box>

                                    {stationShifts.map(shift => renderShiftBlock(shift, stat))}
                                </Box>
                            </Box>
                        );
                    })}
                </React.Fragment>
            ))}
        </Paper>
    );
};

export default DailyPlannerGrid;