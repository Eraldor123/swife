import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, FormControlLabel, Snackbar, Alert,
    Switch, IconButton, CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { LocalizationProvider, DateCalendar } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import type { PickersDayProps } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/cs';
import { useAuth } from '../context/AuthContext';

import { AvailabilityStyledDay } from '../components/AvailabilityStyledDay';
import type { BackendAvailabilityDto, UiAvailabilityDayDto } from '../components/AvailabilityStyledDay';

// IMPORT EXTRHOVANÝCH STYLŮ
import {
    pageContainerStyle, headerPaperStyle, calendarCardStyle,
    changesCardStyle, changesListStyle, calendarStyles
} from '../theme/AvailabilityCalendarStyles';

dayjs.locale('cs');

const AvailabilityCalendarPage: React.FC = () => {
    const { userId, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [status, setStatus] = useState<{ type: 'success' | 'error' | undefined; message: string }>({ type: undefined, message: '' });
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
    const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [shiftMorning, setShiftMorning] = useState(false);
    const [shiftAfternoon, setShiftAfternoon] = useState(false);

    const [savedAvailabilities, setSavedAvailabilities] = useState<BackendAvailabilityDto[]>([]);
    const [uiChanges, setUiChanges] = useState<UiAvailabilityDayDto[]>([]);

    const [loading, setLoading] = useState(true);

    const fetchAvailabilities = useCallback(async (month: Dayjs) => {
        if (!userId) return;
        setLoading(true);
        try {
            const monthStr = month.format('YYYY-MM');
            const response = await fetch(`http://localhost:8080/api/v1/availabilities/monthly/${userId}/${monthStr}?t=${new Date().getTime()}`, {
                method: 'GET',
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setSavedAvailabilities(data);
            }
        } catch (error) {
            console.error("❌ Chyba sítě:", error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (authLoading) return;
        if (!userId) {
            setLoading(false);
            return;
        }
        void fetchAvailabilities(currentMonth);
    }, [currentMonth, userId, authLoading, fetchAvailabilities]);

    useEffect(() => {
        if (!selectedDate) return;
        const dateStr = selectedDate.format('YYYY-MM-DD');
        const existingUi = uiChanges.find(d => d.date === dateStr);
        const existingBackend = savedAvailabilities.find(a => {
            const dbDate = a.availableDate || a.date;
            return dbDate ? dayjs(dbDate).format('YYYY-MM-DD') === dateStr : false;
        });
        const data = existingUi || existingBackend;

        setShiftMorning(data?.morning ?? false);
        setShiftAfternoon(data?.afternoon ?? false);
    }, [selectedDate, savedAvailabilities, uiChanges]);

    const handleDateChange = (newDate: Dayjs | null) => {
        if (!newDate) return;
        setSelectedDate(newDate);
        setIsDialogOpen(true);
    };

    const handleAddAvailabilityToList = () => {
        if (!selectedDate) return;
        const dateStr = selectedDate.format('YYYY-MM-DD');
        const newDay: UiAvailabilityDayDto = {
            date: dateStr,
            morning: shiftMorning,
            afternoon: shiftAfternoon,
        };
        setUiChanges(prev => [...prev.filter(d => d.date !== dateStr), newDay]);
        setIsDialogOpen(false);
    };

    const handleSubmitToBackend = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const monthStr = currentMonth.format('YYYY-MM');
            const finalDaysMap = new Map<string, UiAvailabilityDayDto>();

            savedAvailabilities.forEach(day => {
                const dStr = day.availableDate || day.date;
                if (dStr) {
                    finalDaysMap.set(dStr, {
                        date: dStr, morning: day.morning ?? false, afternoon: day.afternoon ?? false
                    });
                }
            });

            uiChanges.forEach(day => {
                if (!day.morning && !day.afternoon) {
                    finalDaysMap.delete(day.date);
                } else {
                    finalDaysMap.set(day.date, {
                        date: day.date, morning: day.morning, afternoon: day.afternoon
                    });
                }
            });

            const payloadDays = Array.from(finalDaysMap.values());

            const response = await fetch('http://localhost:8080/api/v1/availabilities/monthly', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ userId: userId, month: monthStr, availableDays: payloadDays })
            });

            if (response.ok) {
                setStatus({ type: 'success', message: 'Změny byly úspěšně uloženy!' });
                setUiChanges([]);
                await fetchAvailabilities(currentMonth);
            } else {
                setStatus({ type: 'error', message: 'Chyba při ukládání na server.' });
            }
        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', message: 'Chyba spojení se serverem.' });
        } finally {
            setLoading(false);
            setSnackbarOpen(true);
        }
    };

    const currentBackendDay = savedAvailabilities.find(a => {
        const dbDate = a.availableDate || a.date;
        return dbDate ? dayjs(dbDate).format('YYYY-MM-DD') === selectedDate?.format('YYYY-MM-DD') : false;
    });

    const isConfirmedByManager = currentBackendDay?.isConfirmed || currentBackendDay?.confirmed === true;
    const morningAssigned = isConfirmedByManager && currentBackendDay?.hasMorningShift;
    const afternoonAssigned = isConfirmedByManager && currentBackendDay?.hasAfternoonShift;
    const isFullyAssigned = morningAssigned && afternoonAssigned;

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
            <Box sx={pageContainerStyle}>
                <Box sx={{ width: '100%', maxWidth: '1400px', minHeight: 'fit-content', display: 'flex', flexDirection: 'column' }}>
                    <Paper elevation={1} sx={headerPaperStyle}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton onClick={() => navigate(-1)} sx={{ mr: 2.5, bgcolor: '#f1f5f9', p: 1.5 }}>
                                <ArrowBackIcon sx={{ color: '#64748b', fontSize: '1.4rem' }} />
                            </IconButton>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b', lineHeight: 1.2, fontSize: '1.4rem' }}>
                                    Můj Kalendář Směn
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.95rem', mt: 0.2 }}>
                                    Správa osobní dostupnosti a plánování
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ color: '#1976d2', pr: 1 }}>
                            <EventAvailableIcon sx={{ fontSize: '2.5rem' }} />
                        </Box>
                    </Paper>

                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 3, flex: 1, minHeight: 0, alignItems: 'stretch', pb: 2 }}>
                        <Paper elevation={3} sx={calendarCardStyle}>
                            {loading && <CircularProgress size={24} sx={{ position: 'absolute', top: 15, right: 15, zIndex: 10 }} />}

                            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
                                <DateCalendar
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    onMonthChange={(month) => setCurrentMonth(month)}
                                    slots={{ day: AvailabilityStyledDay }}
                                    showDaysOutsideCurrentMonth={false}
                                    slotProps={{ day: { backendAvailabilities: savedAvailabilities, uiAvailabilities: uiChanges } as unknown as Partial<PickersDayProps> }}
                                    sx={calendarStyles}
                                />
                            </Box>
                        </Paper>

                        <Paper elevation={3} sx={changesCardStyle}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1e293b', textAlign: 'center', fontSize: '1.1rem' }}>
                                SEZNAM ZMĚN ({uiChanges.length})
                            </Typography>

                            <Box sx={changesListStyle}>
                                {uiChanges.length === 0 ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                        <Typography color="textSecondary" sx={{ fontStyle: 'italic', fontSize: '0.9rem' }}>
                                            Zatím jsi nevybral žádné nové dny.
                                        </Typography>
                                    </Box>
                                ) : (
                                    uiChanges.map(day => (
                                        <Box key={day.date} sx={{ p: 1.5, mb: 1.2, bgcolor: 'white', borderRadius: 2, border: '1px solid #f1f5f9' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{dayjs(day.date).format('D. MMMM YYYY')}</Typography>
                                            <Typography variant="caption" sx={{ color: (!day.morning && !day.afternoon) ? '#ef4444' : '#64748b', fontWeight: 'bold' }}>
                                                {day.morning && day.afternoon ? 'Celý den' : (day.morning ? 'Dopoledne' : (day.afternoon ? 'Odpoledne' : 'Zrušeno'))}
                                            </Typography>
                                        </Box>
                                    ))
                                )}
                            </Box>

                            <Button
                                variant="contained" color="primary" fullWidth onClick={handleSubmitToBackend} disabled={uiChanges.length === 0 || loading}
                                sx={{ py: 1.5, fontWeight: 'bold', borderRadius: '12px', textTransform: 'none', flexShrink: 0 }}
                            >
                                Odeslat požadavky
                            </Button>
                        </Paper>
                    </Box>
                </Box>

                <Dialog
                    open={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    fullWidth
                    maxWidth="xs"
                    slotProps={{ paper: { sx: { borderRadius: '20px' } } }}
                >
                    <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center', pt: 3 }}>{selectedDate?.format('D. MMMM YYYY')}</DialogTitle>
                    <DialogContent sx={{ pt: '10px !important' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {[
                                { label: 'Dopoledne', state: shiftMorning, set: setShiftMorning, isAssigned: morningAssigned },
                                { label: 'Odpoledne', state: shiftAfternoon, set: setShiftAfternoon, isAssigned: afternoonAssigned }
                            ].map((row) => (
                                <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#f8fafc', borderRadius: '15px', border: '1px solid #f1f5f9' }}>
                                    <Typography variant="body2" fontWeight="bold">{row.label}</Typography>
                                    {row.isAssigned ? (
                                        <Typography color="primary" fontWeight="bold" fontSize="0.8rem">✅ Směna</Typography>
                                    ) : (
                                        <FormControlLabel
                                            control={<Switch color="primary" checked={row.state} onChange={(e) => row.set(e.target.checked)} />}
                                            label={<Typography variant="caption" fontWeight="bold">{row.state ? "Ano" : "Ne"}</Typography>}
                                            sx={{ m: 0 }}
                                        />
                                    )}
                                </Box>
                            ))}
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, pt: 1, justifyContent: 'space-between' }}>
                        <Button onClick={() => setIsDialogOpen(false)} sx={{ color: '#64748b', textTransform: 'none' }}>Zrušit</Button>
                        <Button onClick={handleAddAvailabilityToList} disabled={isFullyAssigned} variant="contained" color="primary" sx={{ borderRadius: '10px', fontWeight: 'bold', px: 3 }}>
                            Uložit
                        </Button>
                    </DialogActions>
                </Dialog>

                <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
                    <Alert severity={status.type} variant="filled" sx={{ borderRadius: '8px' }}>{status.message}</Alert>
                </Snackbar>
            </Box>
        </LocalizationProvider>
    );
};

export default AvailabilityCalendarPage;