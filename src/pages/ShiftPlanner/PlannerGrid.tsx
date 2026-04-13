// src/components/shifts/Planner/PlannerGrid.tsx

import React, { useMemo } from 'react';
import { Box, Typography, Paper, Tooltip } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import type {
    WeeklyScheduleResponse,
    ScheduleShift,
    AssignedUser,
    HierarchyData,
    PlannerUser,
    HierarchyCategory,
    HierarchyStation,
    DailyHours
} from '../../types/schedule';

interface Props {
    hierarchy: HierarchyData | null;
    scheduleData: WeeklyScheduleResponse | null;
    users: PlannerUser[];
    selectedUserId: string | null;
    onAssignUser: (shiftId: string) => void;
    onRemoveUser: (shiftId: string, userId: string) => void;
    onShiftClick: (shift: ScheduleShift) => void;
}

const formatDateShort = (dateStr: string) => {
    try {
        const d = new Date(dateStr);
        const days = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
        return { date: `${d.getDate()}.${d.getMonth() + 1}.`, dayName: days[d.getDay()] };
    } catch {
        return { date: '?', dayName: '?' };
    }
};

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

const PlannerGrid: React.FC<Props> = ({ hierarchy, scheduleData, users, selectedUserId, onAssignUser, onRemoveUser, onShiftClick }) => {
    const { userRoles, userId: loggedInUserId } = useAuth();

    /**
     * ROBUSTNÍ KONTROLA ROLÍ:
     * Očištění rolí pro správné fungování "Plánovače".
     */
    const isManagerial = useMemo(() => {
        const managerialRoles = ['ADMIN', 'PLANNER', 'MANAGEMENT', 'MANAGER'];
        return userRoles.some((role: string) => {
            const cleanRole = role.replace('ROLE_', '').toUpperCase();
            return managerialRoles.includes(cleanRole);
        });
    }, [userRoles]);

    if (!hierarchy || !scheduleData || !scheduleData.days) return null;

    const daysCount = scheduleData.days.length;
    const selectedUser = Array.isArray(users) ? users.find(u => u.userId === selectedUserId) : null;

    const getStationCustomTimes = (stationId: number) => {
        const stationShifts = scheduleData.shifts?.filter(s => s.stationId === stationId) || [];
        if (stationShifts.length === 0) return null;
        const uniqueCustomRanges = new Set<string>();
        stationShifts.forEach(shift => {
            const sTime = formatTime(shift.startTime);
            const eTime = formatTime(shift.endTime);
            if (!sTime || !eTime) return;
            const dayConfig = scheduleData.days.find(d => d.date === shift.shiftDate);
            if (dayConfig) {
                const areaMorningStart = dayConfig.dopoStart?.substring(0, 5);
                const areaMorningEnd = dayConfig.dopoEnd?.substring(0, 5);
                const areaAfternoonStart = dayConfig.odpoStart?.substring(0, 5);
                const areaAfternoonEnd = dayConfig.odpoEnd?.substring(0, 5);
                const isStandardMorning = sTime === areaMorningStart && eTime === areaMorningEnd;
                const isStandardAfternoon = sTime === areaAfternoonStart && eTime === areaAfternoonEnd;
                if (!isStandardMorning && !isStandardAfternoon) {
                    uniqueCustomRanges.add(`${sTime}-${eTime}`);
                }
            }
        });
        return uniqueCustomRanges.size > 0 ? Array.from(uniqueCustomRanges).join(', ') : null;
    };

    const renderShiftPill = (shift: ScheduleShift) => {
        const assignedCount = shift.assignedUsers?.length || 0;
        const isFull = assignedCount >= shift.requiredCapacity;
        const isAlreadyAssigned = selectedUserId && shift.assignedUsers?.some((u: AssignedUser) => u.userId === selectedUserId);

        const stationObj = hierarchy?.categories.flatMap(c => c.stations).find(s => s.id === shift.stationId);
        const requiresQual = stationObj?.needsQualification === true;

        const assignedData = shift.assignedUsers?.map((u: AssignedUser) => {
            const surname = getSurname(u.name);
            const fullUserObj = users.find(user => user.userId === u.userId);
            const isUnqualified = fullUserObj && requiresQual ? !fullUserObj.qualifiedStationIds?.includes(shift.stationId) : false;
            const isMe = u.userId === loggedInUserId;
            // Nová vlastnost vytažená z DTO
            const isCollision = u.isCollision === true;

            return { surname, name: u.name, isUnqualified, isMe, isCollision };
        }) || [];

        return (
            <Tooltip key={shift.id} arrow title={
                <Box sx={{ p: 1, fontSize: '0.75rem' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                        {assignedData.length > 0
                            ? assignedData.map(u => {
                                let label = u.name;
                                if (u.isUnqualified) label += ' ⚠️ (Zaučení)';
                                if (u.isCollision) label += ' ⛔ (KOLIZE - Jiná směna!)';
                                return label;
                            }).join(', ')
                            : 'Žádný zaměstnanec'}
                    </Typography>
                    <Typography variant="body2">Čas: {formatTime(shift.startTime)} — {formatTime(shift.endTime)}</Typography>
                    {shift.description && (
                        <Typography variant="body2" sx={{ color: '#ffb74d', mt: 0.5, fontWeight: 'bold' }}>📝 {shift.description}</Typography>
                    )}
                </Box>
            }>
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
                        width: '100%', minHeight: '38px', borderRadius: 2,
                        bgcolor: isFull ? '#4caf50' : '#ef5350',
                        cursor: isManagerial ? (selectedUserId ? (isAlreadyAssigned ? 'pointer' : (isFull ? 'not-allowed' : 'cell')) : 'pointer') : 'default',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        color: 'white', px: 0.5, py: 0.5, position: 'relative', overflow: 'hidden', zIndex: 1,
                        transition: 'transform 0.1s',
                        '&:hover': { transform: isManagerial ? 'scale(1.02)' : 'none' }
                    }}
                >
                    {assignedData.slice(0, 2).map((userObj, idx) => (
                        <Typography key={idx} sx={{
                            fontSize: '0.65rem',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            width: '100%',
                            overflow: 'hidden',
                            // Upravené zobrazení při kolizi
                            bgcolor: userObj.isCollision ? '#ffebee' : (userObj.isMe ? 'white' : 'transparent'),
                            color: userObj.isCollision ? '#d32f2f' : (userObj.isMe ? 'black' : (userObj.isUnqualified ? '#ffeb3b' : 'white')),
                            border: userObj.isCollision ? '1px solid #d32f2f' : 'none',
                            borderRadius: (userObj.isMe || userObj.isCollision) ? '4px' : '0',
                            px: (userObj.isMe || userObj.isCollision) ? 0.5 : 0,
                            mb: 0.2,
                            textShadow: (userObj.isMe || userObj.isCollision) ? 'none' : '0px 0px 3px rgba(0,0,0,0.8)'
                        }}>
                            {userObj.isCollision && '⚠️ '}
                            {userObj.surname}
                            {userObj.isUnqualified && !userObj.isCollision && '⚠️'}
                        </Typography>
                    ))}
                    <Typography sx={{ fontSize: '0.6rem', position: 'absolute', bottom: 1, right: 3, opacity: 0.8 }}>
                        [{assignedCount}/{shift.requiredCapacity}]
                    </Typography>
                </Box>
            </Tooltip>
        );
    };

    return (
        <Paper elevation={0} sx={{
            borderRadius: 4, bgcolor: 'white',
            position: 'absolute', inset: 0, overflow: 'auto',
            border: '1px solid rgba(0,0,0,0.1)'
        }}>
            <style>{`
                .highlight-booked { 
                    background: repeating-linear-gradient(45deg, rgba(0,0,0,0.02), rgba(0,0,0,0.02) 10px, rgba(0,0,0,0.08) 10px, rgba(0,0,0,0.08) 20px) !important; 
                }
            `}</style>

            <Box sx={{ display: 'grid', gridTemplateColumns: `180px repeat(${daysCount * 2}, minmax(60px, 1fr)) 180px` }}>
                <Box sx={{ p: 2, fontWeight: 'bold', borderBottom: '2px solid #f0f0f0', bgcolor: '#fafafa', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>Stanoviště</Box>
                {scheduleData.days.map((day: DailyHours, idx: number) => {
                    const formatted = formatDateShort(day.date);
                    return (
                        <Box key={idx} sx={{ gridColumn: 'span 2', borderBottom: '2px solid #f0f0f0', borderLeft: '1px solid #f0f0f0', bgcolor: '#fafafa', position: 'sticky', top: 0, zIndex: 10 }}>
                            <Box sx={{ textAlign: 'center', py: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#3e3535', display: 'block' }}>{formatted.dayName}</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#3e3535' }}>{formatted.date}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', bgcolor: '#e3f2fd', fontSize: '0.65rem', color: '#1976d2', borderTop: '1px solid #f0f0f0' }}>
                                <Box sx={{ flex: 1, textAlign: 'center', p: 0.5, borderRight: '1px solid rgba(0,0,0,0.05)', fontWeight: 'bold' }}>{day.dopoStart?.substring(0,5)} - {day.dopoEnd?.substring(0,5)}</Box>
                                <Box sx={{ flex: 1, textAlign: 'center', p: 0.5, fontWeight: 'bold' }}>{day.odpoStart?.substring(0,5)} - {day.odpoEnd?.substring(0,5)}</Box>
                            </Box>
                        </Box>
                    );
                })}
                <Box sx={{ p: 2, fontWeight: 'bold', borderBottom: '2px solid #f0f0f0', borderLeft: '1px solid #f0f0f0', bgcolor: '#fafafa', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>Stanoviště</Box>

                {hierarchy.categories.map((cat: HierarchyCategory) => (
                    <React.Fragment key={cat.id}>
                        <Box sx={{ gridColumn: '1 / -1', bgcolor: cat.color || '#f5f5f5', p: 1, pl: 3, fontWeight: 'bold', color: '#3e3535', fontSize: '0.85rem', textTransform: 'uppercase', borderBottom: '1px solid #eee' }}>
                            {cat.name}
                        </Box>

                        {cat.stations.map((stat: HierarchyStation) => {
                            const customTimes = getStationCustomTimes(stat.id);
                            const StationLabel = (
                                <Box sx={{ borderRight: '1px solid #eee', borderLeft: '1px solid #eee', borderBottom: '1px solid #eee', p: 1.5, display: 'flex', flexDirection: 'column', justifyContent: 'center', bgcolor: 'white' }}>
                                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#444' }}>{stat.name}</Typography>
                                    {customTimes && <Typography sx={{ fontSize: '0.65rem', color: '#d32f2f', fontWeight: 'bold', mt: 0.5 }}>({customTimes})</Typography>}
                                </Box>
                            );

                            return (
                                <React.Fragment key={stat.id}>
                                    {StationLabel}
                                    {scheduleData.days.map((day: DailyHours) => {
                                        const shiftsForDay = scheduleData.shifts?.filter(s => s.stationId === stat.id && s.shiftDate === day.date) || [];
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
                                            const isQualified = !stat.needsQualification || selectedUser.qualifiedStationIds?.includes(stat.id);
                                            const avail = selectedUser.weekAvailability?.[day.date];

                                            const userShiftsToday = scheduleData.shifts?.filter(s =>
                                                s.shiftDate === day.date &&
                                                s.assignedUsers.some(au => au.userId === selectedUser.userId)
                                            ) || [];

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
                                                if (status === 'green') return 'rgba(76, 175, 80, 0.4)';
                                                if (status === 'orange') return 'rgba(255, 152, 0, 0.4)';
                                                if (status === 'red') return 'rgba(244, 67, 54, 0.2)';
                                                if (status === 'booked') return 'rgba(0, 0, 0, 0.08)';
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
                                                gridColumn: 'span 2', borderRight: '1px solid #eee', borderBottom: '1px solid #eee', p: 0.4,
                                                display: 'flex', flexDirection: 'column', gap: 0.5, position: 'relative', minHeight: '48px',
                                                background: dynamicBackground
                                            }}>
                                                <Box sx={{ position: 'absolute', top: 0, bottom: 0, left: '50%', borderLeft: '1px dashed #eee', zIndex: 0 }} />
                                                {fullDayShifts.map(s => <Box key={s.id} sx={{ zIndex: 1 }}>{renderShiftPill(s)}</Box>)}
                                                {(morningShifts.length > 0 || afternoonShifts.length > 0) && (
                                                    <Box sx={{ display: 'flex', gap: 0.5, zIndex: 1 }}>
                                                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>{morningShifts.map(renderShiftPill)}</Box>
                                                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>{afternoonShifts.map(renderShiftPill)}</Box>
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
        </Paper>
    );
};

export default PlannerGrid;