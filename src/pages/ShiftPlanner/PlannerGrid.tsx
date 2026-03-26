import React from 'react';

interface Props {
    hierarchy: HierarchyData | null;
    scheduleData: WeeklyScheduleResponse | null;
}

const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
};
};

    if (!hierarchy || !scheduleData) return null;

    const daysCount = scheduleData.days.length;

        if (!shift) return null;
        return (
                <Box
                    sx={{
                        transition: 'transform 0.1s', '&:hover': { transform: 'scale(1.05)' },
                    }}
                >
                </Box>
        );
    };

    return (
        <Paper elevation={4} sx={{ flexGrow: 1, overflow: 'auto', borderRadius: 4, border: '1px solid rgba(0,0,0,0.1)', bgcolor: 'white' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: `180px repeat(${daysCount * 2}, minmax(60px, 1fr)) 180px` }}>


                {scheduleData.days.map((day, idx) => {
                    const formatted = formatDateShort(day.date);
                    return (
                        <Box key={idx} sx={{ gridColumn: 'span 2', borderBottom: '2px solid #f0f0f0', borderLeft: '1px solid #f0f0f0', bgcolor: '#fafafa' }}>
                            <Box sx={{ textAlign: 'center', py: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#3e3535', display: 'block' }}>{formatted.dayName}</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#3e3535' }}>{formatted.date}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', bgcolor: '#e3f2fd', fontSize: '0.65rem', color: '#1976d2', borderTop: '1px solid #f0f0f0' }}>
                            </Box>
                        </Box>
                    );
                })}


                {hierarchy.categories.map((cat) => (
                    <React.Fragment key={cat.id}>
                        {cat.stations.map((stat) => (
                            <React.Fragment key={stat.id}>

                                {scheduleData.days.map((day) => {
                                    const shiftsForDay = scheduleData.shifts.filter(s => s.stationId === stat.id && s.shiftDate === day.date);


                                    shiftsForDay.forEach(s => {

                                    });

                                    if (fullDayShifts.length > 0) {
                                        return (
                                                {fullDayShifts.map(renderShiftPill)}
                                            </Box>
                                        );
                                    }

                                    return (
                                        <React.Fragment key={`${stat.id}-${day.date}`}>
                                                {morningShifts.map(renderShiftPill)}
                                            </Box>
                                                {afternoonShifts.map(renderShiftPill)}
                                            </Box>
                                        </React.Fragment>
                                    );
                                })}

                            </React.Fragment>
                        ))}
                    </React.Fragment>
                ))}
            </Box>
        </Paper>
    );
};

export default PlannerGrid;