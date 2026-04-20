// src/pages/ShiftPlanner/components/PlannerGrid.tsx

import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useAuth } from '../../../context/AuthContext';
import type {
    WeeklyScheduleResponse, ScheduleShift, HierarchyData,
    PlannerUser, HierarchyCategory, HierarchyStation, DailyHours
} from '../types/ShiftPlannerTypes';

import WeeklyShiftPill from './WeeklyShiftPill';

interface Props {
    hierarchy: HierarchyData | null;
    scheduleData: WeeklyScheduleResponse | null;
    users: PlannerUser[];
    selectedUserId: string | null;
    onAssignUser: (shiftId: string) => void;
    onRemoveUser: (shiftId: string, userId: string) => void;
    onShiftClick: (shift: ScheduleShift) => void;
}

const hexToRgba = (hex: string, opacity: number) => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const formatDateShort = (dateStr: string) => {
    try {
        const d = new Date(dateStr);
        const days = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
        return { date: `${d.getDate()}.${d.getMonth() + 1}.`, dayName: days[d.getDay()] };
    } catch {
        return { date: '?', dayName: '?' };
    }
};

const formatTime = (isoString: string) => isoString ? isoString.substring(11, 16) : '';
const getHour = (isoString: string) => isoString ? parseInt(isoString.substring(11, 13), 10) : 0;

const PlannerGrid: React.FC<Props> = ({
                                          hierarchy, scheduleData, users, selectedUserId,
                                          onAssignUser, onRemoveUser, onShiftClick
                                      }) => {
    const { userRoles, userId: loggedInUserId } = useAuth();

    const isManagerial = useMemo(() => {
        const managerialRoles = ['ADMIN', 'PLANNER', 'MANAGEMENT', 'MANAGER'];
        return (userRoles ?? []).some((role: string) => {
            const cleanRole = role.replace('ROLE_', '').toUpperCase();
            return managerialRoles.includes(cleanRole);
        });
    }, [userRoles]);

    if (!hierarchy || !scheduleData || !scheduleData.days) return null;

    const daysCount = (scheduleData.days ?? []).length;
    const selectedUser = Array.isArray(users) ? users.find(u => u && u.userId === selectedUserId) : null;

    const getStationCustomTimes = (stationId: number) => {
        const stationShifts = (scheduleData.shifts ?? []).filter(s => s.stationId === stationId);
        if (stationShifts.length === 0) return null;

        const uniqueCustomRanges = new Set<string>();
        stationShifts.forEach(shift => {
            const sTime = formatTime(shift.startTime);
            const eTime = formatTime(shift.endTime);
            if (!sTime || !eTime) return;

            const dayConfig = (scheduleData.days ?? []).find(d => d.date === shift.shiftDate);
            if (dayConfig) {
                const areaMorningStart = dayConfig.dopoStart?.substring(0, 5);
                const areaMorningEnd = dayConfig.dopoEnd?.substring(0, 5);
                const areaAfternoonStart = dayConfig.odpoStart?.substring(0, 5);
                const areaAfternoonEnd = dayConfig.odpoEnd?.substring(0, 5);

                if (sTime !== areaMorningStart || eTime !== areaMorningEnd) {
                    if (sTime !== areaAfternoonStart || eTime !== areaAfternoonEnd) {
                        uniqueCustomRanges.add(`${sTime}-${eTime}`);
                    }
                }
            }
        });
        return uniqueCustomRanges.size > 0 ? Array.from(uniqueCustomRanges).join(', ') : null;
    };

    return (
        // 1. ZÁKLADNÍ OBAL: Zde je ta klíčová změna na absolutní pozici
        <Box sx={{
            position: 'absolute', // <-- MAGIE: Zakáže kontejneru přetéct přes obrazovku
            top: 0, left: 0, right: 0, bottom: 0,
            overflow: 'auto',

            // Webkit Scrollbar styly
            '&::-webkit-scrollbar': {
                width: '10px',
                height: '10px',
            },
            '&::-webkit-scrollbar-track': {
                background: '#f8fafc',
                borderRadius: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#cbd5e1',
                borderRadius: '8px',
                border: '2px solid #f8fafc'
            },
            '&::-webkit-scrollbar-thumb:hover': {
                backgroundColor: '#94a3b8'
            }
        }}>
            <style>{`
                .highlight-booked { 
                    background: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 20px) !important; 
                }
            `}</style>

            {/* 2. VNITŘNÍ MŘÍŽKA */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: `180px repeat(${daysCount * 2}, minmax(60px, 1fr)) 180px`,
                minWidth: '1400px', // Natvrdo vynucená šířka
                pb: 1
            }}>

                {/* HLAVIČKA GRIDU (Sticky top) */}
                <Box sx={{
                    p: 2, fontWeight: 'bold', borderBottom: '1px solid #e2e8f0',
                    bgcolor: '#f8fafc', display: 'flex', alignItems: 'center',
                    position: 'sticky', top: 0, zIndex: 10, color: '#1e293b'
                }}>
                    Stanoviště
                </Box>

                {(scheduleData.days ?? []).map((day: DailyHours, idx: number) => {
                    const formatted = formatDateShort(day.date);
                    return (
                        <Box key={idx} sx={{
                            gridColumn: 'span 2', borderBottom: '1px solid #e2e8f0', borderLeft: '1px solid #f1f5f9',
                            bgcolor: '#f8fafc', position: 'sticky', top: 0, zIndex: 10
                        }}>
                            <Box sx={{ textAlign: 'center', py: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#1e293b', display: 'block', fontSize: '0.75rem' }}>
                                    {formatted.dayName}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                                    {formatted.date}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', bgcolor: '#f1f5f9', borderTop: '1px solid #e2e8f0' }}>
                                <Box sx={{ flex: 1, textAlign: 'center', p: 0.5, borderRight: '1px solid #e2e8f0', fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>
                                    {day.dopoStart?.substring(0,5)} - {day.dopoEnd?.substring(0,5)}
                                </Box>
                                <Box sx={{ flex: 1, textAlign: 'center', p: 0.5, fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>
                                    {day.odpoStart?.substring(0,5)} - {day.odpoEnd?.substring(0,5)}
                                </Box>
                            </Box>
                        </Box>
                    );
                })}

                <Box sx={{
                    p: 2, fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', borderLeft: '1px solid #f1f5f9',
                    bgcolor: '#f8fafc', display: 'flex', alignItems: 'center',
                    position: 'sticky', top: 0, zIndex: 10, color: '#1e293b'
                }}>
                    Stanoviště
                </Box>

                {/* TĚLO GRIDU: KATEGORIE A STANOVIŠTĚ */}
                {(hierarchy.categories ?? []).map((cat: HierarchyCategory) => (
                    <React.Fragment key={cat.id}>
                        <Box sx={{
                            gridColumn: '1 / -1',
                            bgcolor: cat.color ? hexToRgba(cat.color, 0.08) : '#f8fafc',
                            borderLeft: `8px solid ${cat.color || '#cbd5e1'}`,
                            p: 1.2,
                            pl: 2.5,
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

                        {(cat.stations ?? []).map((stat: HierarchyStation) => {
                            const customTimes = getStationCustomTimes(stat.id);

                            const StationLabel = (
                                <Box sx={{
                                    borderRight: '1px solid #e2e8f0', borderLeft: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0',
                                    p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', bgcolor: 'white'
                                }}>
                                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                                        {stat.name}
                                    </Typography>
                                    {customTimes && (
                                        <Typography sx={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500, mt: 0.3 }}>
                                            ({customTimes})
                                        </Typography>
                                    )}
                                </Box>
                            );

                            return (
                                <React.Fragment key={stat.id}>
                                    {StationLabel}

                                    {(scheduleData.days ?? []).map((day: DailyHours) => {
                                        const shiftsForDay = (scheduleData.shifts ?? []).filter(s => s.stationId === stat.id && s.shiftDate === day.date);
                                        const fullDayShifts: ScheduleShift[] = [];
                                        const morningShifts: ScheduleShift[] = [];
                                        const afternoonShifts: ScheduleShift[] = [];

                                        shiftsForDay.forEach(s => {
                                            const hour = getHour(s.startTime);
                                            const endHour = getHour(s.endTime);
                                            if (hour < 12 && endHour >= 15) fullDayShifts.push(s);
                                            else if (hour >= 12) afternoonShifts.push(s);
                                            else morningShifts.push(s);
                                        });

                                        let highlightClass = '';
                                        let dynamicBackground = undefined;

                                        if (selectedUser) {
                                            const isQualified = !stat.needsQualification || (selectedUser.qualifiedStationIds ?? []).includes(stat.id);
                                            const avail = selectedUser.weekAvailability?.[day.date];
                                            const userShiftsToday = (scheduleData.shifts ?? []).filter(s => s.shiftDate === day.date && (s.assignedUsers ?? []).some(au => au.userId === selectedUser.userId));

                                            let hasMorning = false;
                                            let hasAfternoon = false;

                                            userShiftsToday.forEach(s => {
                                                const startH = getHour(s.startTime);
                                                const endH = getHour(s.endTime);
                                                if (startH < 12 && endH >= 15) { hasMorning = true; hasAfternoon = true; }
                                                else if (startH >= 12) { hasAfternoon = true; }
                                                else { hasMorning = true; }
                                            });

                                            let morningStatus = 'red';
                                            let afternoonStatus = 'red';

                                            if (avail === 'CELÝ DEN' || avail === 'DOP') {
                                                if (hasMorning) morningStatus = 'booked';
                                                else morningStatus = isQualified ? 'green' : 'orange';
                                            }

                                            if (avail === 'CELÝ DEN' || avail === 'ODP') {
                                                if (hasAfternoon) afternoonStatus = 'booked';
                                                else afternoonStatus = isQualified ? 'green' : 'orange';
                                            }

                                            const getColor = (status: string) => {
                                                if (status === 'green') return 'rgba(16, 185, 129, 0.1)';
                                                if (status === 'orange') return 'rgba(245, 158, 11, 0.1)';
                                                if (status === 'red') return 'rgba(239, 68, 68, 0.1)';
                                                if (status === 'booked') return 'rgba(0, 0, 0, 0.03)';
                                                return 'transparent';
                                            };

                                            if (morningStatus === afternoonStatus) {
                                                if (morningStatus === 'booked') highlightClass = 'highlight-booked';
                                                else dynamicBackground = getColor(morningStatus);
                                            } else {
                                                dynamicBackground = `linear-gradient(to right, ${getColor(morningStatus)} 50%, ${getColor(afternoonStatus)} 50%)`;
                                            }
                                        }

                                        return (
                                            <Box key={`${stat.id}-${day.date}`} className={highlightClass} sx={{
                                                gridColumn: 'span 2', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', p: 0.5,
                                                display: 'flex', flexDirection: 'column', gap: 1, position: 'relative', minHeight: '56px',
                                                background: dynamicBackground
                                            }}>
                                                <Box sx={{ position: 'absolute', top: 0, bottom: 0, left: '50%', borderLeft: '1px dashed #e2e8f0', zIndex: 0 }} />

                                                {fullDayShifts.map(s => (
                                                    <Box key={s.id} sx={{ zIndex: 1 }}>
                                                        <WeeklyShiftPill
                                                            shift={s} users={users} selectedUserId={selectedUserId} loggedInUserId={loggedInUserId || ''}
                                                            isManagerial={isManagerial} requiresQual={stat.needsQualification}
                                                            onAssignUser={onAssignUser} onRemoveUser={onRemoveUser} onShiftClick={onShiftClick}
                                                        />
                                                    </Box>
                                                ))}

                                                {(morningShifts.length > 0 || afternoonShifts.length > 0) && (
                                                    <Box sx={{ display: 'flex', gap: 1, zIndex: 1 }}>
                                                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                            {morningShifts.map(s => (
                                                                <WeeklyShiftPill
                                                                    key={s.id} shift={s} users={users} selectedUserId={selectedUserId} loggedInUserId={loggedInUserId || ''}
                                                                    isManagerial={isManagerial} requiresQual={stat.needsQualification}
                                                                    onAssignUser={onAssignUser} onRemoveUser={onRemoveUser} onShiftClick={onShiftClick}
                                                                />
                                                            ))}
                                                        </Box>
                                                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                            {afternoonShifts.map(s => (
                                                                <WeeklyShiftPill
                                                                    key={s.id} shift={s} users={users} selectedUserId={selectedUserId} loggedInUserId={loggedInUserId || ''}
                                                                    isManagerial={isManagerial} requiresQual={stat.needsQualification}
                                                                    onAssignUser={onAssignUser} onRemoveUser={onRemoveUser} onShiftClick={onShiftClick}
                                                                />
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                )}
                                            </Box>
                                        );
                                    })}
                                    {StationLabel}
                                </React.Fragment>
                            );
                        })}
                    </React.Fragment>
                ))}
            </Box>
        </Box>
    );
};

export default PlannerGrid;