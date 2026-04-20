// src/pages/ShiftPlanner/components/DailyPlannerGrid.tsx

import React, { useMemo } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import { useAuth } from '../../../context/AuthContext';
import type {
    WeeklyScheduleResponse, ScheduleShift, HierarchyData,
    PlannerUser, HierarchyCategory, HierarchyStation
} from '../types/ShiftPlannerTypes';

// Import naší vyčleněné "hloupé" komponenty
import DailyShiftBlock from '../components/DailyShiftBlock';

interface Props {
    hierarchy: HierarchyData | null;
    scheduleData: WeeklyScheduleResponse | null;
    users: PlannerUser[];
    selectedUserId: string | null;
    selectedDate: string;
    onAssignUser: (shiftId: string) => void;
    onRemoveUser: (shiftId: string, userId: string) => void;
    onShiftClick: (shift: ScheduleShift) => void;
    onDateChange: (date: string) => void;
}

/**
 * POMOCNÉ FUNKCE
 */
const hexToRgba = (hex: string, opacity: number) => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const MIN_HOUR = 6;
const MAX_HOUR = 22;
const TOTAL_HALF_HOURS = (MAX_HOUR - MIN_HOUR) * 2;

const getHour = (isoString: string) => parseInt(isoString.substring(11, 13), 10);
const getMinute = (isoString: string) => parseInt(isoString.substring(14, 16), 10);

const DailyPlannerGrid: React.FC<Props> = ({
                                               hierarchy, scheduleData, users, selectedUserId,
                                               selectedDate, onAssignUser, onRemoveUser, onShiftClick, onDateChange
                                           }) => {
    const { userRoles, userId: loggedInUserId } = useAuth();

    const isManagerial = useMemo(() => {
        const managerialRoles = ['ADMIN', 'PLANNER', 'MANAGEMENT', 'MANAGER'];
        return (userRoles ?? []).some((role: string) => {
            const cleanRole = role.replace('ROLE_', '').toUpperCase();
            return managerialRoles.includes(cleanRole);
        });
    }, [userRoles]);

    if (!hierarchy || !scheduleData) return null;

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

    // LOGIKA PŘEPÍNAČE DNŮ
    const days = scheduleData.days || [];
    const currentDayIndex = days.findIndex(d => d.date === selectedDate);
    const prevDay = currentDayIndex > 0 ? days[currentDayIndex - 1].date : null;
    const nextDay = currentDayIndex >= 0 && currentDayIndex < days.length - 1 ? days[currentDayIndex + 1].date : null;

    const dObj = new Date(selectedDate);
    const dayNames = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
    const formattedDayName = dayNames[dObj.getDay()];
    const formattedDate = `${dObj.getDate()}.${dObj.getMonth() + 1}.`;

    return (
        <Box sx={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'auto' }}>
            {/* HLAVIČKA S ČASY A PŘEPÍNAČEM */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: `180px repeat(${TOTAL_HALF_HOURS}, minmax(30px, 1fr))`,
                position: 'sticky', top: 0, zIndex: 10,
                bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
                {/* LEVÝ HORNÍ ROH: Přepínač dnů */}
                <Box sx={{
                    p: 1,
                    borderRight: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: '#ffffff'
                }}>
                    <IconButton size="small" onClick={() => prevDay && onDateChange(prevDay)} disabled={!prevDay} sx={{ color: '#64748b' }}>
                        <ArrowBackIos sx={{ fontSize: 14, ml: 0.5 }} />
                    </IconButton>

                    <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                            {formattedDayName}
                        </Typography>
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>
                            {formattedDate}
                        </Typography>
                    </Box>

                    <IconButton size="small" onClick={() => nextDay && onDateChange(nextDay)} disabled={!nextDay} sx={{ color: '#64748b' }}>
                        <ArrowForwardIos sx={{ fontSize: 14 }} />
                    </IconButton>
                </Box>

                {/* ČASOVÁ OSA */}
                {Array.from({ length: MAX_HOUR - MIN_HOUR }).map((_, i) => (
                    <Box key={i} sx={{
                        gridColumn: 'span 2',
                        textAlign: 'center',
                        py: 1.5,
                        borderRight: '1px solid #e2e8f0',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#64748b'
                    }}>
                        {String(MIN_HOUR + i).padStart(2, '0')}:00
                    </Box>
                ))}
            </Box>

            {/* TĚLO MŘÍŽKY: KATEGORIE A STANOVIŠTĚ */}
            {hierarchy.categories.map((cat: HierarchyCategory) => (
                <React.Fragment key={cat.id}>
                    {/* MODERNIZOVANÝ ODDĚLOVAČ KATEGORIE */}
                    <Box sx={{
                        gridColumn: '1 / -1',
                        bgcolor: cat.color ? hexToRgba(cat.color, 0.08) : '#f8fafc',
                        borderLeft: `8px solid ${cat.color || '#cbd5e1'}`,
                        p: 1.2,
                        pl: 3,
                        display: 'flex',
                        alignItems: 'center',
                        borderBottom: '1px solid #e2e8f0',
                        minHeight: '44px'
                    }}>
                        <Typography sx={{
                            color: cat.color || '#64748b',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em'
                        }}>
                            {cat.name}
                        </Typography>
                    </Box>

                    {/* Řádky Stanovišť */}
                    {cat.stations.map((stat: HierarchyStation) => {
                        const stationShifts = shiftsForDay.filter(s => s.stationId === stat.id);

                        let rowDynamicBackground = 'transparent';
                        if (selectedUser) {
                            const isQualified = !stat.needsQualification || (selectedUser.qualifiedStationIds ?? []).includes(stat.id);
                            const avail = selectedUser.weekAvailability?.[selectedDate];

                            const getBgColor = (status: string) => {
                                if (status === 'green') return 'rgba(16, 185, 129, 0.08)';
                                if (status === 'orange') return 'rgba(245, 158, 11, 0.08)';
                                if (status === 'red') return 'rgba(239, 68, 68, 0.05)';
                                return 'transparent';
                            };

                            if (avail === 'CELÝ DEN' || avail === 'DOP' || avail === 'ODP') {
                                rowDynamicBackground = getBgColor(isQualified ? 'green' : 'orange');
                            } else {
                                rowDynamicBackground = getBgColor('red');
                            }
                        }

                        return (
                            <Box key={stat.id} sx={{
                                display: 'grid',
                                gridTemplateColumns: `180px 1fr`,
                                borderBottom: '1px solid #e2e8f0',
                                minHeight: '56px'
                            }}>
                                {/* Název stanoviště (Levý sloupec) */}
                                <Box sx={{
                                    p: 2,
                                    borderRight: '1px solid #e2e8f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    bgcolor: 'white',
                                    zIndex: 2
                                }}>
                                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                                        {stat.name}
                                    </Typography>
                                </Box>

                                {/* Časová osa (Pravý sloupec) */}
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${TOTAL_HALF_HOURS}, 1fr)`,
                                    position: 'relative',
                                    p: 0.5,
                                    alignItems: 'center',
                                    bgcolor: rowDynamicBackground,
                                    transition: 'background-color 0.2s ease'
                                }}>

                                    {/* Svislé vodící linky */}
                                    <Box sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        display: 'grid',
                                        gridTemplateColumns: `repeat(${MAX_HOUR - MIN_HOUR}, 1fr)`,
                                        pointerEvents: 'none',
                                        zIndex: 1
                                    }}>
                                        {Array.from({ length: MAX_HOUR - MIN_HOUR }).map((_, i) => (
                                            <Box key={i} sx={{ borderRight: '1px dashed #e2e8f0', height: '100%' }} />
                                        ))}
                                    </Box>

                                    {/* Samotné směny */}
                                    {stationShifts.map(shift => (
                                        <DailyShiftBlock
                                            key={shift.id}
                                            shift={shift}
                                            station={stat}
                                            users={users} // <-- PŘIDÁNO: Předáváme seznam uživatelů pro logiku varování
                                            selectedUser={selectedUser}
                                            selectedUserId={selectedUserId}
                                            loggedInUserId={loggedInUserId || ''}
                                            selectedDate={selectedDate}
                                            isManagerial={isManagerial}
                                            startCol={getGridColumn(shift.startTime)}
                                            endCol={getGridColumn(shift.endTime)}
                                            onAssignUser={onAssignUser}
                                            onRemoveUser={onRemoveUser}
                                            onShiftClick={onShiftClick}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        );
                    })}
                </React.Fragment>
            ))}
        </Box>
    );
};

export default DailyPlannerGrid;