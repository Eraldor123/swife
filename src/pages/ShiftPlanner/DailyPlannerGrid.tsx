// src/components/shifts/Planner/DailyPlannerGrid.tsx

import React, { useMemo } from 'react'; // PŘIDÁNO: useMemo
import { Box, Typography, Paper, Tooltip } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import type {
    WeeklyScheduleResponse,
    ScheduleShift,
    HierarchyData,
    PlannerUser,
    HierarchyCategory,
    HierarchyStation
} from '../../types/schedule';

interface Props {
    hierarchy: HierarchyData | null;
    scheduleData: WeeklyScheduleResponse | null;
    users: PlannerUser[];
    selectedUserId: string | null;
    selectedDate: string;
    onAssignUser: (shiftId: string) => void;
    onRemoveUser: (shiftId: string, userId: string) => void;
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

const formatTime = (isoString: string) => {
    if (!isoString) return '';
    return isoString.substring(11, 16);
};

const getHour = (isoString: string) => {
    if (!isoString) return 0;
    return parseInt(isoString.substring(11, 13), 10);
};

const getMinute = (isoString: string) => {
    if (!isoString) return 0;
    return parseInt(isoString.substring(14, 16), 10);
};

const DailyPlannerGrid: React.FC<Props> = ({ hierarchy, scheduleData, users, selectedUserId, selectedDate, onAssignUser, onRemoveUser, onShiftClick }) => {
    const { userRoles, userId: loggedInUserId } = useAuth();

    /**
     * ROBUSTNÍ KONTROLA ROLÍ:
     * Stejná logika jako v ShiftPlanner.tsx pro zajištění přístupu Plánovačům.
     */
    const isManagerial = useMemo(() => {
        const managerialRoles = ['ADMIN', 'PLANNER', 'MANAGEMENT', 'MANAGER'];
        return userRoles.some((role: string) => {
            const cleanRole = role.replace('ROLE_', '').toUpperCase();
            return managerialRoles.includes(cleanRole);
        });
    }, [userRoles]);

    if (!hierarchy || !scheduleData) return null;

    // PŘIDÁNA POJISTKA: u && u.userId
    const selectedUser = Array.isArray(users) ? users.find(u => u && u.userId === selectedUserId) : null;
    const shiftsForDay = scheduleData.shifts?.filter(s => s.shiftDate === selectedDate) || [];

    const getGridColumn = (timeStr: string) => {
        if (!timeStr) return 1;
        const h = getHour(timeStr);
        const m = getMinute(timeStr);

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
        const isMeAssigned = shift.assignedUsers?.some(u => u.userId === loggedInUserId);

        let bgColor = isFull ? '#4caf50' : '#ef5350';

        if (selectedUser) {
            const isQualified = !stat.needsQualification || selectedUser.qualifiedStationIds?.includes(stat.id);
            const avail = selectedUser.weekAvailability?.[selectedDate];
            const shiftStartH = getHour(shift.startTime);

            let hasTime = false;
            if (avail === 'CELÝ DEN') hasTime = true;
            else if (avail === 'DOP' && shiftStartH < 13) hasTime = true;
            else if (avail === 'ODP' && shiftStartH >= 12) hasTime = true;

            if (isAlreadyAssigned) bgColor = '#9e9e9e';
            else if (!hasTime) bgColor = '#ef5350';
            else if (!isQualified) bgColor = '#ffb300';
            else bgColor = '#4caf50';
        }

        return (
            <Tooltip
                key={shift.id}
                arrow
                title={
                    <Box sx={{ p: 1, fontSize: '0.75rem' }}>
                        <Typography variant="body2">Čas: {formatTime(shift.startTime)} — {formatTime(shift.endTime)}</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mt: 0.5 }}>
                            Lidé: {shift.assignedUsers?.map(u => u.name).join(', ') || 'Nikdo'}
                        </Typography>
                        {shift.description && <Typography variant="body2" sx={{ color: '#ffb74d', mt: 0.5 }}>📝 {shift.description}</Typography>}
                    </Box>
                }
            >
                <Box
                    onClick={() => {
                        if (!isManagerial) return;
                        if (selectedUserId) {
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
                        borderRadius: 1,
                        height: '42px',
                        px: 1.5,
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: isManagerial ? (selectedUserId ? 'pointer' : 'pointer') : 'default',
                        border: isMeAssigned ? '2px solid white' : 'none',
                        boxShadow: isMeAssigned ? '0 0 10px rgba(255,255,255,0.5)' : '0 2px 4px rgba(0,0,0,0.15)',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        transition: 'transform 0.1s',
                        zIndex: 2,
                        '&:hover': {
                            transform: isManagerial ? 'scale(1.01)' : 'none',
                            zIndex: 3
                        }
                    }}
                >
                    <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', gap: 0.5 }}>
                        {shift.assignedUsers.map((u, i) => (
                            <span key={u.userId} style={{
                                textDecoration: u.userId === loggedInUserId ? 'underline' : 'none',
                                fontWeight: u.userId === loggedInUserId ? '900' : 'bold'
                            }}>
                                {getSurname(u.name)}{i < shift.assignedUsers.length - 1 ? ',' : ''}
                            </span>
                        ))}
                        {shift.assignedUsers.length === 0 && <span>Volno</span>}
                    </Box>
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