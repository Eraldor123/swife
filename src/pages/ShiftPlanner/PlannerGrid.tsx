import React from 'react';
import { Box, Typography, Paper, Tooltip } from '@mui/material';
import type { WeeklyScheduleResponse, ScheduleShift, AssignedUser, HierarchyData } from '../../types/schedule';

interface Props {
    hierarchy: HierarchyData | null;
    scheduleData: WeeklyScheduleResponse | null;
    selectedUserId: string | null;
    onAssignUser: (shiftId: string) => void;
    onShiftClick: (shift: ScheduleShift) => void; // Napojení pro Detail směny
}

const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
    return { date: `${d.getDate()}.${d.getMonth() + 1}.`, dayName: days[d.getDay()] };
};

// Pomocná funkce pro získání příjmení
const getSurname = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    return parts.length > 1 ? parts[parts.length - 1] : fullName;
};

const PlannerGrid: React.FC<Props> = ({ hierarchy, scheduleData, selectedUserId, onAssignUser, onShiftClick }) => {
    if (!hierarchy || !scheduleData) return null;

    const daysCount = scheduleData.days.length;

    // Vykreslení konkrétní směny (červená nebo zelená pilulka s PŘÍJMENÍM)
    const renderShiftPill = (shift: ScheduleShift) => {
        if (!shift) return null;
        const assignedCount = shift.assignedUsers.length;
        const isFull = assignedCount >= shift.requiredCapacity;
        const isAlreadyAssigned = selectedUserId && shift.assignedUsers.some((u: AssignedUser) => u.userId === selectedUserId);

        const assignedSurnames = shift.assignedUsers.map((u: AssignedUser) => getSurname(u.name));

        return (
            <Tooltip
                key={shift.id}
                arrow
                title={
                    <Box sx={{ p: 1, fontSize: '0.75rem' }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{shift.assignedUsers.map(u => u.name).join(', ')}</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>Čas: {shift.startTime.substring(11, 16)} — {shift.endTime.substring(11, 16)}</Typography>
                        <Typography variant="body2" sx={{ color: isAlreadyAssigned ? '#ff9800' : (isFull ? '#66bb6a' : '#ef5350') }}>
                            {isAlreadyAssigned ? "Uživatel už na této směně je" : (isFull ? "Směna je plná" : "Kliknutím otevřete detail")}
                        </Typography>
                    </Box>
                }
            >
                <Box
                    onClick={() => {
                        if (selectedUserId) {
                            if (!isAlreadyAssigned && !isFull) onAssignUser(shift.id);
                        } else {
                            onShiftClick(shift); // Otevře modál s detailem směny
                        }
                    }}
                    sx={{
                        width: '100%', height: '100%', minHeight: '38px', borderRadius: 2,
                        bgcolor: isFull ? '#4caf50' : '#ef5350',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        cursor: selectedUserId ? (isAlreadyAssigned || isFull ? 'not-allowed' : 'cell') : 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        color: 'white', px: 0.5,
                        transition: 'transform 0.1s', '&:hover': { transform: 'scale(1.05)' },
                        m: 0.25,
                        position: 'relative', overflow: 'hidden'
                    }}
                >
                    {/* ZOBRAZENÍ PŘÍJMENÍ - Zobrazíme první dvě */}
                    {assignedSurnames.slice(0, 2).map((surname, idx) => (
                        <Typography
                            key={idx}
                            sx={{ fontSize: '0.7rem', lineHeight: 1.1, fontWeight: 'bold', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '90%' }}
                        >
                            {surname}
                        </Typography>
                    ))}

                    {/* Ukazatel kapacity */}
                    <Typography sx={{ fontSize: '0.6rem', position: 'absolute', bottom: 1, right: 3, opacity: 0.7, fontWeight: 'bold' }}>
                        [{assignedCount}/{shift.requiredCapacity}]
                    </Typography>
                </Box>
            </Tooltip>
        );
    };

    return (
        <Paper elevation={4} sx={{ flexGrow: 1, overflow: 'auto', borderRadius: 4, border: '1px solid rgba(0,0,0,0.1)', bgcolor: 'white' }}>
            <style>{`
                .grid-cell-day { transition: background-color 0.1s ease; } 
                .highlight-green { background-color: rgba(76, 175, 80, 0.2) !important; }
                .highlight-orange { background-color: rgba(255, 152, 0, 0.2) !important; }
                .highlight-red { background-color: rgba(244, 67, 54, 0.2) !important; }
            `}</style>
            <Box sx={{ display: 'grid', gridTemplateColumns: `180px repeat(${daysCount * 2}, minmax(60px, 1fr)) 180px` }}>

                <Box sx={{ p: 2, fontWeight: 'bold', color: '#3e3535', borderBottom: '2px solid #f0f0f0', display: 'flex', alignItems: 'center', bgcolor: '#fafafa' }}>Stanoviště</Box>

                {scheduleData.days.map((day, idx) => {
                    const formatted = formatDateShort(day.date);
                    return (
                        <Box key={idx} sx={{ gridColumn: 'span 2', borderBottom: '2px solid #f0f0f0', borderLeft: '1px solid #f0f0f0', bgcolor: '#fafafa' }}>
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

                <Box sx={{ p: 2, fontWeight: 'bold', color: '#3e3535', borderBottom: '2px solid #f0f0f0', borderLeft: '1px solid #f0f0f0', bgcolor: '#fafafa', display: 'flex', alignItems: 'center' }}>Stanoviště</Box>

                {hierarchy.categories.map((cat) => (
                    <React.Fragment key={cat.id}>
                        <Box sx={{ gridColumn: '1 / -1', bgcolor: '#f5f5f5', p: 1.5, pl: 3, fontWeight: 'bold', color: '#3e3535', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #eee' }}>{cat.name}</Box>
                        {cat.stations.map((stat) => (
                            <React.Fragment key={stat.id}>
                                <Box sx={{ borderRight: '1px solid #eee', borderBottom: '1px solid #eee', p: 1.5, fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', color: '#555' }}>{stat.name}</Box>

                                {scheduleData.days.map((day) => {
                                    const shiftsForDay = scheduleData.shifts.filter(s => s.stationId === stat.id && s.shiftDate === day.date);

                                    const fullDayShifts: ScheduleShift[] = [];
                                    const morningShifts: ScheduleShift[] = [];
                                    const afternoonShifts: ScheduleShift[] = [];

                                    shiftsForDay.forEach(s => {
                                        // Extrahujeme hodiny přímo z textu od backendu (ignorujeme DST)
                                        const timePartStart = s.startTime.includes('T') ? s.startTime.split('T')[1] : s.startTime;
                                        const timePartEnd = s.endTime.includes('T') ? s.endTime.split('T')[1] : s.endTime;

                                        const startHour = parseInt(timePartStart.substring(0, 2), 10);
                                        const endHour = parseInt(timePartEnd.substring(0, 2), 10);

                                        if (startHour < 12 && endHour >= 15) fullDayShifts.push(s);
                                        else if (startHour >= 12) afternoonShifts.push(s);
                                        else morningShifts.push(s);
                                    });

                                    // PŘIDÁNY ATRIBUTY: data-station-id a data-date na buňky
                                    const cellBaseSx = { minHeight: '44px', borderBottom: '1px solid #eee', p: 0.25, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };

                                    if (fullDayShifts.length > 0) {
                                        return (
                                            <Box
                                                key={`${stat.id}-${day.date}`}
                                                className="grid-cell-day"
                                                data-station-id={stat.id}
                                                data-date={day.date}
                                                sx={{ gridColumn: 'span 2', borderRight: '1px solid #eee', ...cellBaseSx, flexDirection: 'row', p: 0.5 }}
                                            >
                                                {fullDayShifts.map(renderShiftPill)}
                                            </Box>
                                        );
                                    }

                                    return (
                                        <React.Fragment key={`${stat.id}-${day.date}`}>
                                            <Box
                                                className="grid-cell-day"
                                                data-station-id={stat.id}
                                                data-date={day.date}
                                                sx={{ gridColumn: 'span 1', borderRight: '1px dashed #e0e0e0', ...cellBaseSx }}
                                            >
                                                {morningShifts.map(renderShiftPill)}
                                            </Box>
                                            <Box
                                                className="grid-cell-day"
                                                data-station-id={stat.id}
                                                data-date={day.date}
                                                sx={{ gridColumn: 'span 1', borderRight: '1px solid #eee', ...cellBaseSx }}
                                            >
                                                {afternoonShifts.map(renderShiftPill)}
                                            </Box>
                                        </React.Fragment>
                                    );
                                })}

                                <Box sx={{ borderLeft: '1px solid #eee', borderBottom: '1px solid #eee', p: 1.5, fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', color: '#555' }}>{stat.name}</Box>
                            </React.Fragment>
                        ))}
                    </React.Fragment>
                ))}
            </Box>
        </Paper>
    );
};

export default PlannerGrid;