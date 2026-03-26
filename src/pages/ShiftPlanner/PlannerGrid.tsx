import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import type { WeeklyScheduleResponse } from '../../types/schedule';

interface HierarchyStation { id: number; name: string; }
interface HierarchyCategory { id: number; name: string; stations: HierarchyStation[]; }
interface HierarchyData { categories: HierarchyCategory[]; }

interface Props {
    hierarchy: HierarchyData | null;
    scheduleData: WeeklyScheduleResponse | null;
}

const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
    return {
        date: `${d.getDate()}.${d.getMonth() + 1}.`,
        dayName: days[d.getDay()]
    };
};

const PlannerGrid: React.FC<Props> = ({ hierarchy, scheduleData }) => {
    if (!hierarchy || !scheduleData) return null;

    const daysCount = scheduleData.days.length;

    // Pomocná komponenta pro vykreslení "pilulky" směny
    const renderShiftPill = (shift: any) => {
        if (!shift) return null;
        const isFull = shift.assignedUsers.length >= shift.requiredCapacity;
        return (
            <Box
                key={shift.id}
                onClick={() => alert(`Tady bude detail směny: ${shift.id}`)}
                sx={{
                    width: '100%', height: '100%', minHeight: '30px',
                    borderRadius: 1.5, bgcolor: isFull ? '#4caf50' : '#ef5350',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '0.7rem', fontWeight: 'bold',
                    transition: 'transform 0.1s', '&:hover': { transform: 'scale(1.05)' },
                    m: 0.25
                }}
            >
                {shift.assignedUsers.length} / {shift.requiredCapacity}
            </Box>
        );
    };

    return (
        <Paper elevation={4} sx={{ flexGrow: 1, overflow: 'auto', borderRadius: 4, border: '1px solid rgba(0,0,0,0.1)', bgcolor: 'white' }}>
            <style>
                {`
                    .grid-row-station { transition: background-color 0.1s ease; }
                    .highlight-green { background-color: rgba(76, 175, 80, 0.15) !important; }
                `}
            </style>

            <Box sx={{ display: 'grid', gridTemplateColumns: `180px repeat(${daysCount * 2}, minmax(60px, 1fr)) 180px` }}>

                {/* HEADER */}
                <Box sx={{ p: 2, fontWeight: 'bold', color: '#3e3535', borderBottom: '2px solid #f0f0f0', display: 'flex', alignItems: 'center', bgcolor: '#fafafa' }}>
                    Stanoviště
                </Box>

                {scheduleData.days.map((day, idx) => {
                    const formatted = formatDateShort(day.date);
                    return (
                        <Box key={idx} sx={{ gridColumn: 'span 2', borderBottom: '2px solid #f0f0f0', borderLeft: '1px solid #f0f0f0', bgcolor: '#fafafa' }}>
                            <Box sx={{ textAlign: 'center', py: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#3e3535', display: 'block' }}>{formatted.dayName}</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#3e3535' }}>{formatted.date}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', bgcolor: '#e3f2fd', fontSize: '0.65rem', color: '#1976d2', borderTop: '1px solid #f0f0f0' }}>
                                {/* OPRAVA: Formát hlavičky přesně podle Excelu */}
                                <Box sx={{ flex: 1, textAlign: 'center', p: 0.5, borderRight: '1px solid rgba(0,0,0,0.05)', fontWeight: 'bold' }}>
                                    {day.dopoStart?.substring(0,5)} - {day.dopoEnd?.substring(0,5)}
                                </Box>
                                <Box sx={{ flex: 1, textAlign: 'center', p: 0.5, fontWeight: 'bold' }}>
                                    {day.odpoStart?.substring(0,5)} - {day.odpoEnd?.substring(0,5)}
                                </Box>
                            </Box>
                        </Box>
                    );
                })}

                <Box sx={{ p: 2, fontWeight: 'bold', color: '#3e3535', borderBottom: '2px solid #f0f0f0', borderLeft: '1px solid #f0f0f0', bgcolor: '#fafafa', display: 'flex', alignItems: 'center' }}>
                    Stanoviště
                </Box>

                {/* TĚLO MŘÍŽKY */}
                {hierarchy.categories.map((cat) => (
                    <React.Fragment key={cat.id}>
                        <Box sx={{ gridColumn: '1 / -1', bgcolor: '#f5f5f5', p: 1.5, pl: 3, fontWeight: 'bold', color: '#3e3535', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #eee' }}>
                            {cat.name}
                        </Box>

                        {cat.stations.map((stat) => (
                            <React.Fragment key={stat.id}>
                                <Box className="grid-row-station" data-station-id={stat.id} sx={{ borderRight: '1px solid #eee', borderBottom: '1px solid #eee', p: 1.5, fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', color: '#555' }}>
                                    {stat.name}
                                </Box>

                                {scheduleData.days.map((day) => {
                                    const shiftsForDay = scheduleData.shifts.filter(s => s.stationId === stat.id && s.shiftDate === day.date);

                                    // Chytře si roztřídíme směny podle hodin
                                    const fullDayShifts: any[] = [];
                                    const morningShifts: any[] = [];
                                    const afternoonShifts: any[] = [];

                                    shiftsForDay.forEach(s => {
                                        const startHour = new Date(s.startTime).getHours();
                                        const endHour = new Date(s.endTime).getHours();

                                        if (startHour < 12 && endHour >= 15) {
                                            fullDayShifts.push(s);
                                        } else if (startHour >= 12) {
                                            afternoonShifts.push(s);
                                        } else {
                                            morningShifts.push(s);
                                        }
                                    });

                                    // Celodenní směna zabere oba sloupce (span 2)
                                    if (fullDayShifts.length > 0) {
                                        return (
                                            <Box key={`${stat.id}-${day.date}`} sx={{ gridColumn: 'span 2', borderRight: '1px solid #eee', borderBottom: '1px solid #eee', p: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {fullDayShifts.map(renderShiftPill)}
                                            </Box>
                                        );
                                    }

                                    // Jinak vykreslíme striktně dva boxy vedle sebe (1 pro Dopo, 1 pro Odpo)
                                    return (
                                        <React.Fragment key={`${stat.id}-${day.date}`}>
                                            <Box sx={{ gridColumn: 'span 1', borderRight: '1px dashed #e0e0e0', borderBottom: '1px solid #eee', p: 0.25, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                {morningShifts.map(renderShiftPill)}
                                            </Box>
                                            <Box sx={{ gridColumn: 'span 1', borderRight: '1px solid #eee', borderBottom: '1px solid #eee', p: 0.25, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                {afternoonShifts.map(renderShiftPill)}
                                            </Box>
                                        </React.Fragment>
                                    );
                                })}

                                <Box className="grid-row-station" data-station-id={stat.id} sx={{ borderLeft: '1px solid #eee', borderBottom: '1px solid #eee', p: 1.5, fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', color: '#555' }}>
                                    {stat.name}
                                </Box>
                            </React.Fragment>
                        ))}
                    </React.Fragment>
                ))}
            </Box>
        </Paper>
    );
};

export default PlannerGrid;