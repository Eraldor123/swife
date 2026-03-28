import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, FormControlLabel, Radio, RadioGroup, Snackbar, Alert,
    ToggleButton, ToggleButtonGroup, Divider, CircularProgress, Badge
} from '@mui/material';
import { LocalizationProvider, DateCalendar, PickersDay } from '@mui/x-date-pickers';
import type { PickersDayProps } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/cs';
import { useAuth } from '../context/AuthContext';

dayjs.locale('cs');

interface BackendAvailabilityDto {
    id?: string;
    availableDate?: string;
    date?: string;
    morning: boolean;
    afternoon: boolean;
    isConfirmed?: boolean;
    confirmed?: boolean;
    hoursWorked?: number;
    positionName?: string;
    note?: string;
    startTime?: string; // PŘIDÁNO: Připraveno pro backend
    endTime?: string;   // PŘIDÁNO: Připraveno pro backend
}

interface UiAvailabilityDayDto {
    date: string;
    morning: boolean;
    afternoon: boolean;
}

// FUNKCE PRO VÝPOČET HODIN (Včetně pauzy)
const calculateShiftHours = (startTimeStr?: string, endTimeStr?: string): string => {
    if (!startTimeStr || !endTimeStr) return "0";
    const start = new Date(startTimeStr);
    const end = new Date(endTimeStr);

    // Vypočítáme rozdíl v milisekundách a převedeme na hodiny
    let diffInHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    // Pokud je směna delší než 6 hodin, automaticky odečteme 30 minut (0.5h) pauzu
    if (diffInHours > 6) {
        diffInHours -= 0.5;
    }

    // Zajistíme, že hodiny nebudou záporné, a zaokrouhlíme na 1 desetinné místo
    return Math.max(0, diffInHours).toFixed(1);
};

const getAvailabilityGradient = (data: BackendAvailabilityDto | UiAvailabilityDayDto | undefined, isUiOnly = false): string => {
    if (!data) return '#ffebee';

    const backendData = data as BackendAvailabilityDto;
    const isConf = backendData.isConfirmed === true || backendData.confirmed === true;

    const morningColor = isUiOnly ? '#81c784' : (isConf ? '#64b5f6' : '#81c784');
    const afternoonColor = isUiOnly ? '#81c784' : (isConf ? '#64b5f6' : '#81c784');
    const unsetColor = '#ffebee';

    const isMorning = data.morning;
    const isAfternoon = data.afternoon;

    if (isMorning && isAfternoon) {
        return `linear-gradient(90deg, ${morningColor} 50%, ${afternoonColor} 50%)`;
    } else if (isMorning) {
        return `linear-gradient(90deg, ${morningColor} 50%, ${unsetColor} 50%)`;
    } else if (isAfternoon) {
        return `linear-gradient(90deg, ${unsetColor} 50%, ${afternoonColor} 50%)`;
    }

    return '#ffebee';
};

const AvailabilityStyledDay = (props: PickersDayProps & { backendAvailabilities?: BackendAvailabilityDto[], uiAvailabilities?: UiAvailabilityDayDto[] }) => {
    const { backendAvailabilities = [], uiAvailabilities = [], day, outsideCurrentMonth, ...other } = props;
    const dateStr = day.format('YYYY-MM-DD');

    const uiAvail = uiAvailabilities.find((a: UiAvailabilityDayDto) => a.date === dateStr);
    const backendAvail = backendAvailabilities.find((a: BackendAvailabilityDto) => {
        const dbDate = a.availableDate || a.date;
        return dbDate ? dayjs(dbDate).format('YYYY-MM-DD') === dateStr : false;
    });

    const background = outsideCurrentMonth ? 'transparent' : getAvailabilityGradient(uiAvail || backendAvail, !!uiAvail);
    const isConf = backendAvail ? (backendAvail.isConfirmed === true || backendAvail.confirmed === true) : false;

    return (
        <Badge
            key={dateStr}
            overlap="circular"
            invisible={outsideCurrentMonth || (!backendAvail && !uiAvail)}
            badgeContent={isConf ? "✔️" : undefined}
            color="primary"
            sx={{ '& .MuiBadge-badge': { fontSize: '10px', right: 2, top: 2, bgcolor: '#1976d2' } }}
        >
            <PickersDay
                {...other}
                outsideCurrentMonth={outsideCurrentMonth}
                day={day}
                disableMargin
                sx={{
                    background: `${background} !important`,
                    borderRadius: '6px',
                    width: '100% !important',
                    height: '100% !important',
                    margin: '0 !important',
                    color: outsideCurrentMonth ? '#ccc' : '#3e3535 !important',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    border: outsideCurrentMonth ? 'none' : '1px solid #cfcfcf',
                    transition: 'all 0.1s',
                    '&:hover': {
                        border: '2px solid #3e3535 !important',
                        background: `${background} !important`
                    },
                    '&.Mui-selected': {
                        border: '3px solid #3e3535 !important',
                        background: `${background} !important`,
                    },
                    '&.MuiPickersDay-today': {
                        border: '2px dashed #1976d2 !important',
                    }
                }}
            />
        </Badge>
    );
};

const AvailabilityCalendarPage: React.FC = () => {
    const { userId, isLoading: authLoading } = useAuth();

    const [viewMode, setViewMode] = useState<'PLANNING' | 'INSPECT'>('PLANNING');
    const [status, setStatus] = useState<{ type: 'success' | 'error' | undefined; message: string }>({ type: undefined, message: '' });
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
    const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [shiftType, setShiftType] = useState('FULL_DAY');

    const [savedAvailabilities, setSavedAvailabilities] = useState<BackendAvailabilityDto[]>([]);
    const [uiChanges, setUiChanges] = useState<UiAvailabilityDayDto[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchAvailabilities = useCallback(async (month: Dayjs) => {
        if (!userId) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const monthStr = month.format('YYYY-MM');

            const response = await fetch(`http://localhost:8080/api/v1/availabilities/monthly/${userId}/${monthStr}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
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
        if (!authLoading && userId) {
            void fetchAvailabilities(currentMonth);
        }
    }, [currentMonth, userId, authLoading, fetchAvailabilities]);

    const handleDateChange = (newDate: Dayjs | null) => {
        if (!newDate) return;
        setSelectedDate(newDate);

        if (viewMode === 'PLANNING') {
            const dateStr = newDate.format('YYYY-MM-DD');
            const existingUi = uiChanges.find(d => d.date === dateStr);
            const existingBackend = savedAvailabilities.find(a => {
                const dbDate = a.availableDate || a.date;
                return dbDate ? dayjs(dbDate).format('YYYY-MM-DD') === dateStr : false;
            });

            const isConf = existingBackend ? (existingBackend.isConfirmed === true || existingBackend.confirmed === true) : false;
            if (isConf) {
                setStatus({ type: 'error', message: 'Na tento den už máte naplánovanou směnu, nelze jej změnit.' });
                setSnackbarOpen(true);
                return;
            }

            const data = existingUi || existingBackend;

            if (data) {
                if (data.morning && data.afternoon) setShiftType('FULL_DAY');
                else if (data.morning) setShiftType('MORNING');
                else if (data.afternoon) setShiftType('AFTERNOON');
                else setShiftType('NONE');
            } else {
                setShiftType('FULL_DAY');
            }
        }
        setIsDialogOpen(true);
    };

    const handleAddAvailabilityToList = () => {
        if (!selectedDate) return;
        const dateStr = selectedDate.format('YYYY-MM-DD');

        const newDay: UiAvailabilityDayDto = {
            date: dateStr,
            morning: shiftType === 'FULL_DAY' || shiftType === 'MORNING',
            afternoon: shiftType === 'FULL_DAY' || shiftType === 'AFTERNOON',
        };

        setUiChanges(prev => [...prev.filter(d => d.date !== dateStr), newDay]);
        setIsDialogOpen(false);
    };

    const handleSubmitToBackend = async () => {
        if (!userId) return;
        if (uiChanges.length === 0) {
            setStatus({ type: 'error', message: 'Nemáte vybrané žádné nové dny k odeslání.' });
            setSnackbarOpen(true);
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const monthStr = currentMonth.format('YYYY-MM');

            const mergedMap = new Map();

            savedAvailabilities.forEach(day => {
                const dStr = day.availableDate || day.date;
                if (dStr) mergedMap.set(dStr, { ...day, date: dStr, availableDate: dStr });
            });

            uiChanges.forEach(day => {
                if (!day.morning && !day.afternoon) {
                    mergedMap.delete(day.date);
                } else {
                    const existing = mergedMap.get(day.date) || {};
                    mergedMap.set(day.date, {
                        ...existing,
                        ...day,
                        availableDate: day.date,
                        date: day.date
                    });
                }
            });

            const payloadDays = Array.from(mergedMap.values());

            const response = await fetch('http://localhost:8080/api/v1/availabilities/monthly', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userId: userId, month: monthStr, availableDays: payloadDays })
            });

            if (response.ok) {
                setStatus({ type: 'success', message: 'Změny byly uloženy!' });

                setSavedAvailabilities(payloadDays);
                setUiChanges([]);

                await fetchAvailabilities(currentMonth);
            } else {
                setStatus({ type: 'error', message: 'Chyba při ukládání.' });
            }
        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', message: 'Chyba serveru. Zkontrolujte připojení.' });
        } finally {
            setLoading(false);
            setSnackbarOpen(true);
        }
    };

    const isInspectMode = viewMode === 'INSPECT';

    // === VÝPOČET DAT PRO MODAL ===
    const currentBackendDay = savedAvailabilities.find(a => {
        const dbDate = a.availableDate || a.date;
        return dbDate ? dayjs(dbDate).format('YYYY-MM-DD') === selectedDate?.format('YYYY-MM-DD') : false;
    });

    const displayHours = (currentBackendDay?.startTime && currentBackendDay?.endTime)
        ? calculateShiftHours(currentBackendDay.startTime, currentBackendDay.endTime)
        : currentBackendDay?.hoursWorked?.toString() || "8.5"; // Záložní fallback, dokud to nepropojíte

    const displayPosition = currentBackendDay?.positionName || "Skladník / Manipulant";
    const displayNote = currentBackendDay?.note || "Směna potvrzena systémem.";

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
            <Box sx={{ maxWidth: '1100px', mx: 'auto', p: 2 }}>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#3e3535' }}>
                        Můj Kalendář Směn
                    </Typography>

                    <ToggleButtonGroup color="primary" value={viewMode} exclusive onChange={(_, newMode) => { if (newMode !== null) setViewMode(newMode); }} sx={{ bgcolor: 'white' }}>
                        <ToggleButton value="PLANNING" sx={{ fontWeight: 'bold', px: 3 }}>Zadání dostupnosti</ToggleButton>
                        <ToggleButton value="INSPECT" sx={{ fontWeight: 'bold', px: 3 }}>Inspekce směn</ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'flex-start' }}>

                    <Paper elevation={3} sx={{ p: 3, borderRadius: 3, flex: '1 1 500px', display: 'flex', flexDirection: 'column', minHeight: '560px', position: 'relative' }}>
                        {loading && <CircularProgress sx={{ position: 'absolute', top: 20, right: 20 }} />}

                        <Box sx={{ minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                            <Box sx={{ transform: 'scale(1.25)', transformOrigin: 'center' }}>
                                <DateCalendar
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    onMonthChange={(month) => setCurrentMonth(month)}
                                    slots={{ day: AvailabilityStyledDay }}
                                    slotProps={{ day: { backendAvailabilities: savedAvailabilities, uiAvailabilities: uiChanges } as unknown as Partial<PickersDayProps> }}
                                    sx={{
                                        height: 'auto !important', minHeight: '420px',
                                        '& .MuiDayCalendar-header': { justifyContent: 'center' },
                                        '& .MuiDayCalendar-weekContainer': { justifyContent: 'center' },
                                        '& .MuiDayCalendar-weekDayLabel': { width: '42px !important', height: '42px !important', margin: '2px !important', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#3e3535' },
                                        '& .MuiDayCalendar-weekContainer > *': { width: '42px !important', height: '42px !important', margin: '2px !important', display: 'inline-flex', justifyContent: 'center', alignItems: 'center' },
                                        '& .MuiDayCalendar-slideTransition': { minHeight: '360px !important', overflow: 'visible !important' },
                                        '& .MuiDayCalendar-monthContainer': { overflow: 'visible !important' }
                                    }}
                                />
                            </Box>
                        </Box>

                        <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #e0e0e0', display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box sx={{ width: 16, height: 16, bgcolor: '#ffebee', borderRadius: '3px', border: '1px solid #e0e0e0' }} /> <Typography variant="caption">Základ (Nemám čas)</Typography></Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box sx={{ width: 16, height: 16, bgcolor: '#81c784', borderRadius: '3px' }} /> <Typography variant="caption">Mám čas (Zelená)</Typography></Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box sx={{ width: 16, height: 16, bgcolor: '#64b5f6', borderRadius: '3px' }} /> <Typography variant="caption">Naplánovaná směna</Typography></Box>
                        </Box>
                    </Paper>

                    {!isInspectMode && (
                        <Paper elevation={3} sx={{ p: 3, borderRadius: 3, flex: '1 1 350px', display: 'flex', flexDirection: 'column', minHeight: '560px' }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Nově naklikané dny ({uiChanges.length})</Typography>
                            <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2 }}>
                                {uiChanges.length === 0 ? (
                                    <Typography color="textSecondary" sx={{ fontStyle: 'italic' }}>Klikněte do kalendáře pro úpravu.</Typography>
                                ) : (
                                    uiChanges.map(day => (
                                        <Box key={day.date} sx={{ p: 1.5, mb: 1, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                                            <Typography variant="body2" fontWeight="bold">{dayjs(day.date).format('D. MMMM YYYY')}</Typography>
                                            <Typography variant="caption" color="textSecondary" sx={{ color: (!day.morning && !day.afternoon) ? 'red' : 'inherit' }}>
                                                {day.morning && day.afternoon ? 'Celý den' :
                                                    (day.morning ? 'Dopoledne' :
                                                        (day.afternoon ? 'Odpoledne' : 'Zrušeno (Nemám čas)'))}
                                            </Typography>
                                        </Box>
                                    ))
                                )}
                            </Box>
                            <Button variant="contained" onClick={handleSubmitToBackend} disabled={uiChanges.length === 0 || loading} sx={{ bgcolor: '#3e3535', '&:hover': { bgcolor: '#1e1a1a' }, py: 1.5, fontWeight: 'bold' }}>
                                Odeslat seznam
                            </Button>
                        </Paper>
                    )}
                </Box>

                <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} fullWidth maxWidth="sm">
                    <DialogTitle sx={{ fontWeight: 'bold', bgcolor: isInspectMode ? '#e3f2fd' : '#f8f4f0' }}>{selectedDate?.format('D. MMMM YYYY')}</DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                        {isInspectMode ? (
                            <Box sx={{ mt: 1 }}>
                                <Typography variant="h6" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>Detail odpracované směny</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography color="textSecondary">Odpracováno:</Typography>
                                        {/* TADY JE NAPOJENÁ NOVÁ PROMĚNNÁ */}
                                        <Typography fontWeight="bold">{displayHours} hodin</Typography>
                                    </Box>
                                    <Divider />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography color="textSecondary">Pozice:</Typography>
                                        <Typography fontWeight="bold">{displayPosition}</Typography>
                                    </Box>
                                    <Divider />
                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                        <Typography color="textSecondary" sx={{ mb: 0.5 }}>Poznámka:</Typography>
                                        <Typography variant="body2" sx={{ bgcolor: '#f5f5f5', p: 1.5, borderRadius: 1, fontStyle: 'italic' }}>
                                            "{displayNote}"
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ mt: 1 }}>
                                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Kdy máte v tento den čas?</Typography>
                                <RadioGroup value={shiftType} onChange={(e) => setShiftType(e.target.value)}>
                                    <FormControlLabel value="FULL_DAY" control={<Radio />} label="Celý den" />
                                    <FormControlLabel value="MORNING" control={<Radio />} label="Pouze dopoledne" />
                                    <FormControlLabel value="AFTERNOON" control={<Radio />} label="Pouze odpoledne" />
                                    <FormControlLabel value="NONE" control={<Radio sx={{ color: 'error.main', '&.Mui-checked': { color: 'error.main' } }} />} label={<Typography color="error">Zrušit (Nemám čas)</Typography>} />
                                </RadioGroup>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setIsDialogOpen(false)} color="inherit">{isInspectMode ? 'Zavřít' : 'Zrušit'}</Button>
                        {!isInspectMode && <Button onClick={handleAddAvailabilityToList} variant="contained" sx={{ bgcolor: '#3e3535' }}>Uložit do seznamu</Button>}
                    </DialogActions>
                </Dialog>

                <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
                    <Alert severity={status.type} variant="filled">{status.message}</Alert>
                </Snackbar>
            </Box>
        </LocalizationProvider>
    );
};

export default AvailabilityCalendarPage;