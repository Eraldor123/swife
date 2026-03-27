import React from 'react';
import { Box, Typography, Paper, Tooltip } from '@mui/material';
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

const PlannerGrid: React.FC<Props> = ({ hierarchy, scheduleData, users, selectedUserId, onAssignUser, onShiftClick }) => {
    if (!hierarchy || !scheduleData || !scheduleData.days) return null;

    const daysCount = scheduleData.days.length;
    const selectedUser = Array.isArray(users) ? users.find(u => u.userId === selectedUserId) : null;

    const getStationCustomTimes = (stationId: number) => {
        const stationShifts = scheduleData.shifts?.filter(s => s.stationId === stationId) || [];
        if (stationShifts.length === 0) return null;
        const uniqueCustomRanges = new Set<string>();
        stationShifts.forEach(shift => {
            const sTime = shift.startTime?.substring(11, 16);
            const eTime = shift.endTime?.substring(11, 16);
            if (!sTime || !eTime) return;
            const dayConfig = scheduleData.days.find(d => d.date === shift.shiftDate);
            if (dayConfig) {
                const areaMorningStart = dayConfig.dopoStart?.substring(0, 5);
                const areaMorningEnd = dayConfig.dopoEnd?.substring(0, 5);
                const areaAfternoonStart = dayConfig.odpoStart?.substring(0, 5);
                const areaAfternoonEnd = dayConfig.odpoEnd?.substring(0, 5);
                if (!((sTime === areaMorningStart && eTime === areaMorningEnd) || (sTime === areaAfternoonStart && eTime === areaAfternoonEnd))) {
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
        const assignedSurnames = shift.assignedUsers?.map((u: AssignedUser) => getSurname(u.name)) || [];

        return (
            <Tooltip key={shift.id} arrow title={
                <Box sx={{ p: 1, fontSize: '0.75rem' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                        {shift.assignedUsers?.length > 0 ? shift.assignedUsers.map(u => u.name).join(', ') : 'Žádný zaměstnanec'}
                    </Typography>
                    <Typography variant="body2">Čas: {shift.startTime?.substring(11, 16)} — {shift.endTime?.substring(11, 16)}</Typography>
                </Box>
            }>
                <Box onClick={() => selectedUserId ? (!isAlreadyAssigned && !isFull && onAssignUser(shift.id)) : onShiftClick(shift)}
                     sx={{
                         width: '100%', minHeight: '38px', borderRadius: 2,
                         bgcolor: isFull ? '#4caf50' : '#ef5350',
                         cursor: selectedUserId ? (isAlreadyAssigned || isFull ? 'not-allowed' : 'cell') : 'pointer',
                         display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                         color: 'white', px: 0.5, py: 0.5, position: 'relative', overflow: 'hidden', zIndex: 1
                     }}>
                    {assignedSurnames.slice(0, 2).map((surname, idx) => (
                        <Typography key={idx} sx={{ fontSize: '0.65rem', fontWeight: 'bold', textAlign: 'center', width: '100%', overflow: 'hidden' }}>{surname}</Typography>
                    ))}
                    <Typography sx={{ fontSize: '0.6rem', position: 'absolute', bottom: 1, right: 3, opacity: 0.8 }}>[{assignedCount}/{shift.requiredCapacity}]</Typography>
                </Box>
            </Tooltip>
        );
    };

    return (
        <Paper elevation={0} sx={{
            // KLÍČ K ODSTRANĚNÍ SCROLLBARU: Mřížka vyplní kontejner a nepustí scroll ven
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            overflow: 'auto', borderRadius: 4, bgcolor: 'white', border: '1px solid rgba(0,0,0,0.1)'
        }}>
            <style>{`
                /* VÝRAZNĚJŠÍ BARVY PRO HEAT MAPU */
                .highlight-green { background-color: rgba(76, 175, 80, 0.5) !important; }  /* Má čas i kvalifikaci */
                .highlight-orange { background-color: rgba(255, 152, 0, 0.5) !important; } /* Má čas, nemá kvalifikaci */
                .highlight-red { background-color: rgba(244, 67, 54, 0.4) !important; }     /* Nemá čas */
            `}</style>

            <Box sx={{ display: 'grid', gridTemplateColumns: `180px repeat(${daysCount * 2}, minmax(60px, 1fr)) 180px` }}>
                <Box sx={{ p: 2, fontWeight: 'bold', borderBottom: '2px solid #f0f0f0', bgcolor: '#fafafa', position: 'sticky', top: 0, zIndex: 10 }}>Stanoviště</Box>
                {scheduleData.days.map((day: DailyHours, idx: number) => {
                    const formatted = formatDateShort(day.date);
                    return (
                        <Box key={idx} sx={{ gridColumn: 'span 2', borderBottom: '2px solid #f0f0f0', borderLeft: '1px solid #f0f0f0', bgcolor: '#fafafa', position: 'sticky', top: 0, zIndex: 10 }}>
                            <Box sx={{ textAlign: 'center', py: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>{formatted.dayName}</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{formatted.date}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', bgcolor: '#e3f2fd', fontSize: '0.6rem', borderTop: '1px solid #f0f0f0' }}>
                                <Box sx={{ flex: 1, textAlign: 'center', p: 0.5, borderRight: '1px solid #ddd' }}>{day.dopoStart?.substring(0,5)} - {day.dopoEnd?.substring(0,5)}</Box>
                                <Box sx={{ flex: 1, textAlign: 'center', p: 0.5 }}>{day.odpoStart?.substring(0,5)} - {day.odpoEnd?.substring(0,5)}</Box>
                            </Box>
                        </Box>
                    );
                })}
                <Box sx={{ p: 2, fontWeight: 'bold', borderBottom: '2px solid #f0f0f0', borderLeft: '1px solid #f0f0f0', bgcolor: '#fafafa', position: 'sticky', top: 0, zIndex: 10 }}>Stanoviště</Box>

                {hierarchy.categories.map((cat: HierarchyCategory) => (
                    <React.Fragment key={cat.id}>
                        <Box sx={{ gridColumn: '1 / -1', bgcolor: cat.color || '#f5f5f5', p: 1, pl: 3, fontWeight: 'bold', fontSize: '0.85rem', textTransform: 'uppercase', borderBottom: '1px solid #eee' }}>
                            {cat.name}
                        </Box>

                        {cat.stations.map((stat: HierarchyStation) => {
                            const customTimes = getStationCustomTimes(stat.id);
                            const StationLabel = (
                                <Box sx={{ borderRight: '1px solid #eee', borderLeft: '1px solid #eee', borderBottom: '1px solid #eee', p: 1.5, display: 'flex', flexDirection: 'column', justifyContent: 'center', bgcolor: 'white' }}>
                                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{stat.name}</Typography>
                                    {customTimes && <Typography sx={{ fontSize: '0.6rem', color: '#d32f2f', fontWeight: 'bold' }}>({customTimes})</Typography>}
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
                                            const hour = parseInt(s.startTime?.substring(11, 13) || '0', 10);
                                            const endHour = parseInt(s.endTime?.substring(11, 13) || '0', 10);
                                            if (hour < 12 && endHour >= 15) fullDayShifts.push(s);
                                            else if (hour >= 12) afternoonShifts.push(s);
                                            else morningShifts.push(s);
                                        });

                                        // --- OPRAVENÁ LOGIKA BAREV ---
                                        let highlightClass = '';
                                        if (selectedUser) {
                                            const isQualified = selectedUser.qualifiedStationIds?.includes(stat.id);
                                            const avail = selectedUser.weekAvailability?.[day.date]; // např. "CELÝ DEN"

                                            if (!avail) {
                                                highlightClass = 'highlight-red'; // Nemá čas vůbec
                                            } else if (isQualified) {
                                                highlightClass = 'highlight-green'; // Má čas I kvalifikaci
                                            } else {
                                                highlightClass = 'highlight-orange'; // Má čas ALE NEMÁ kvalifikaci
                                            }
                                        }

                                        return (
                                            <Box key={`${stat.id}-${day.date}`} className={highlightClass} sx={{ gridColumn: 'span 2', borderRight: '1px solid #eee', borderBottom: '1px solid #eee', p: 0.4, display: 'flex', flexDirection: 'column', gap: 0.5, position: 'relative', minHeight: '48px' }}>
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