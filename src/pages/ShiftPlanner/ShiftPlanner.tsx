// src/components/shifts/Planner/ShiftPlanner.tsx

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Typography, CircularProgress, Button,
    Select, MenuItem, FormControl, InputLabel,
    ToggleButton, ToggleButtonGroup, IconButton, Paper,
    type SelectChangeEvent, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { ArrowBack, ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ScheduleService } from '../../services/ScheduleService';
import { useAuth } from '../../context/AuthContext';

import type { WeeklyScheduleResponse, PlannerUser, HierarchyData, ScheduleShift } from '../../types/schedule';

import PlannerSidebar from './PlannerSidebar';
import PlannerGrid from './PlannerGrid';
import DailyPlannerGrid from './DailyPlannerGrid';
import CopyWeekModal, { type CopyFormValues } from './modals/CopyWeekModal';
import GenerateShiftsModal, { type GenerateFormValues } from './modals/GenerateShiftsModal';
import ShiftDetailModal from './modals/ShiftDetailModal';
import AutoPlanModal, { type AutoPlanConfig } from './modals/AutoPlanModal';

const formatDateLocal = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getStartOfWeek = (date: Date | string = new Date()) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return formatDateLocal(d);
};

const getEndOfWeek = (startStr: string) => {
    const d = new Date(startStr);
    d.setDate(d.getDate() + 6);
    return formatDateLocal(d);
};

const addWeeks = (dateStr: string, weeks: number) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + (weeks * 7));
    return formatDateLocal(d);
};

export const ShiftPlanner = () => {
    const navigate = useNavigate();
    const { userRoles } = useAuth();

    /**
     * ROBUSTNÍ KONTROLA ROLÍ:
     * Očišťuje role od prefixu 'ROLE_' a kontroluje, zda uživatel patří do manažerské skupiny.
     */
    const isManagerial = useMemo(() => {
        const managerialRoles = ['ADMIN', 'PLANNER', 'MANAGEMENT', 'MANAGER'];
        return userRoles.some((role: string) => {
            const cleanRole = role.replace('ROLE_', '').toUpperCase();
            return managerialRoles.includes(cleanRole);
        });
    }, [userRoles]);

    const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
    const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
    const [currentWeekStart, setCurrentWeekStart] = useState<string>(getStartOfWeek());
    const endDate = getEndOfWeek(currentWeekStart);

    const [scheduleData, setScheduleData] = useState<WeeklyScheduleResponse | null>(null);
    const [availableUsers, setAvailableUsers] = useState<PlannerUser[]>([]);
    const [hierarchy, setHierarchy] = useState<HierarchyData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedShiftForDetail, setSelectedShiftForDetail] = useState<ScheduleShift | null>(null);

    const activeHierarchy = useMemo(() => {
        if (!hierarchy || !scheduleData) return null;
        const currentWeekStationIds = new Set(scheduleData.shifts.map(s => s.stationId));

        return {
            categories: hierarchy.categories
                .map(cat => ({
                    ...cat,
                    stations: cat.stations.filter(stat => stat.isActive !== false || currentWeekStationIds.has(stat.id))
                }))
                .filter(cat => cat.stations.length > 0)
        };
    }, [hierarchy, scheduleData]);

    const allStations = useMemo(() => {
        if (!activeHierarchy) return [];
        return activeHierarchy.categories.flatMap(cat => cat.stations);
    }, [activeHierarchy]);

    const [selectedDate, setSelectedDate] = useState<string>(currentWeekStart);

    useEffect(() => {
        setSelectedDate(currentWeekStart);
    }, [currentWeekStart]);

    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);
    const [isAutoPlanModalOpen, setIsAutoPlanModalOpen] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const [scheduleRes, usersRes, hierarchyRes] = await Promise.all([
                ScheduleService.getWeeklySchedule(currentWeekStart, endDate),
                ScheduleService.getAvailableUsers(currentWeekStart, endDate),
                fetch('http://localhost:8080/api/v1/position-settings/hierarchy', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(res => res.json())
            ]);

            setScheduleData(scheduleRes);
            setAvailableUsers(usersRes);
            setHierarchy(hierarchyRes);
        } catch (error) {
            console.error("Chyba při načítání Směnáře:", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentWeekStart, endDate]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const handleGenerateConfirm = async (data: GenerateFormValues) => {
        if (!isManagerial) return;
        try {
            if (data.mode === 'template' && data.templateId !== undefined) {
                await ScheduleService.generateShifts(data.startDate, data.endDate, data.templateId);
            } else if (data.mode === 'custom' && data.stationId !== undefined) {
                if (data.customShiftType === 'halfDay' && data.customTimeMode === 'exact') {
                    if (data.hasDopo && data.dopoStartTime && data.dopoEndTime) {
                        await ScheduleService.generateCustomShifts({
                            stationId: data.stationId, startDate: data.startDate, endDate: data.endDate,
                            startTime: data.dopoStartTime, endTime: data.dopoEndTime,
                            requiredCapacity: data.capacity!, useOpeningHours: false, description: data.description
                        });
                    }
                    if (data.hasOdpo && data.odpoStartTime && data.odpoEndTime) {
                        await ScheduleService.generateCustomShifts({
                            stationId: data.stationId, startDate: data.startDate, endDate: data.endDate,
                            startTime: data.odpoStartTime, endTime: data.odpoEndTime,
                            requiredCapacity: data.capacity!, useOpeningHours: false, description: data.description
                        });
                    }
                } else {
                    await ScheduleService.generateCustomShifts({
                        stationId: data.stationId, startDate: data.startDate, endDate: data.endDate,
                        startTime: data.startTime, endTime: data.endTime,
                        requiredCapacity: data.capacity!, useOpeningHours: data.useOpeningHours,
                        hasDopo: data.hasDopo, hasOdpo: data.hasOdpo, description: data.description
                    });
                }
            }
            setIsGenerateModalOpen(false);
            await loadData();
        } catch (error) {
            console.error("Chyba generování:", error);
            alert("Nepodařilo se vygenerovat směny.");
        }
    };

    const handleCopyConfirm = async (data: CopyFormValues) => {
        if (!isManagerial) return;
        try {
            await ScheduleService.copyWeek(data.sourceWeekStart, data.targetWeekStart);
            setIsCopyModalOpen(false);
            setCurrentWeekStart(data.targetWeekStart);
        } catch (error) {
            console.error("Chyba při kopírování:", error);
            alert("Nepodařilo se zkopírovat týden.");
        }
    };

    const handleClearConfirm = async () => {
        if (!isManagerial) return;
        try {
            await ScheduleService.clearWeek(currentWeekStart, endDate);
            setIsClearModalOpen(false);
            await loadData();
        } catch (error) {
            console.error("Chyba při mazání týdne:", error);
            alert("Nepodařilo se vyčistit týden.");
        }
    };

    const handleAutoPlanConfirm = async (config: AutoPlanConfig) => {
        if (!isManagerial) return;
        try {
            setIsLoading(true);
            await ScheduleService.runAutoPlan({
                fairnessWeight: config.fairnessWeight,
                trainingWeight: config.trainingWeight,
                targetDate: config.targetDate,
                startDate: currentWeekStart,
                endDate: endDate,
                categoryId: selectedCategory === 'all' ? undefined : selectedCategory
            });
            await loadData();
            setIsAutoPlanModalOpen(false);
        } catch (error) {
            console.error("Chyba algoritmu:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssignUser = async (shiftId: string) => {
        if (!isManagerial || !selectedUserId) return;
        try {
            await ScheduleService.assignUserToShift(shiftId, selectedUserId);
            await loadData();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            const errorMsg = err.response?.data?.message || "Nepodařilo se přiřadit uživatele.";
            alert(errorMsg);
        }
    };

    const handleRemoveUser = async (shiftId: string, userId: string) => {
        if (!isManagerial) return;
        try {
            await ScheduleService.removeUserFromShift(shiftId, userId);
            await loadData();
            setSelectedShiftForDetail(prev => {
                if (!prev) return null;
                return { ...prev, assignedUsers: prev.assignedUsers.filter(u => u.userId !== userId) };
            });
        } catch (error) {
            console.error("Chyba při odebírání uživatele:", error);
            alert("Nepodařilo se odebrat uživatele.");
        }
    };

    const handleUpdateShift = async (shiftId: string, startTime: string, endTime: string, capacity: number, description?: string) => {
        if (!isManagerial) return;
        try {
            await ScheduleService.updateShift(shiftId, { startTime, endTime, requiredCapacity: capacity, description });
            await loadData();
            setSelectedShiftForDetail(null);
        } catch (error) {
            console.error("Chyba při aktualizaci směny:", error);
            alert("Nepodařilo se uložit změny směny.");
        }
    };

    const handleSplitShift = async (shiftId: string) => {
        if (!isManagerial) return;
        try {
            await ScheduleService.splitShift(shiftId);
            await loadData();
            setSelectedShiftForDetail(null);
        } catch (error) {
            console.error("Chyba při rozdělování směny:", error);
            alert("Nepodařilo se rozdělit směnu.");
        }
    };

    const handleDeleteShift = async (shiftId: string) => {
        if (!isManagerial) return;
        if (!window.confirm("Opravdu chcete tuto směnu smazat?")) return;
        try {
            await ScheduleService.deleteShift(shiftId);
            await loadData();
            setSelectedShiftForDetail(null);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            const errorMsg = err.response?.data?.message || "Nepodařilo se smazat směnu.";
            alert(errorMsg);
        }
    };

    const handleCategoryChange = (event: SelectChangeEvent<number | 'all'>) => {
        setSelectedCategory(event.target.value as number | 'all');
    };

    const handlePrevWeek = () => setCurrentWeekStart(prev => addWeeks(prev, -1));
    const handleNextWeek = () => setCurrentWeekStart(prev => addWeeks(prev, 1));

    if (isLoading && !scheduleData) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f2ece4' }}>
                <CircularProgress sx={{ color: '#3e3535' }} />
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', height: '92vh', backgroundColor: '#f2ece4', overflow: 'hidden' }}>
            {/* SIDEBAR: Vidí manažeři a plánovači */}
            {isManagerial && (
                <PlannerSidebar
                    users={availableUsers}
                    selectedUserId={selectedUserId}
                    onSelectUser={setSelectedUserId}
                    currentWeekDays={scheduleData?.days || []}
                    allStations={allStations}
                    shifts={scheduleData?.shifts || []}
                    viewMode={viewMode}
                    selectedDate={selectedDate}
                    onAutoPlan={() => setIsAutoPlanModalOpen(true)}
                />
            )}

            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 1.5, overflow: 'hidden', height: '92vh' }}>
                <Paper elevation={0} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1.5, mb: 1, p: 1, bgcolor: 'white', borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    <IconButton onClick={() => navigate('/dashboard/shifts')} size="small" sx={{ border: '1px solid #eee' }}>
                        <ArrowBack sx={{ color: '#3e3535', fontSize: 20 }} />
                    </IconButton>

                    {/* AKČNÍ LIŠTA: Vidí manažeři a plánovači */}
                    {isManagerial && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Button onClick={() => setIsGenerateModalOpen(true)} size="small" variant="contained" sx={{ bgcolor: '#d3d3d3', color: 'black', borderRadius: 2, fontWeight: 'bold', textTransform: 'none' }}>Generování</Button>
                            <Button onClick={() => setIsCopyModalOpen(true)} size="small" variant="contained" sx={{ bgcolor: '#d3d3d3', color: 'black', borderRadius: 2, fontWeight: 'bold', textTransform: 'none' }}>Kopírování</Button>
                            <Button onClick={() => setIsClearModalOpen(true)} size="small" variant="contained" color="error" sx={{ borderRadius: 2, fontWeight: 'bold', textTransform: 'none' }}>Vyčistit</Button>
                        </Box>
                    )}

                    <ToggleButtonGroup value={viewMode} exclusive onChange={(_, val) => val && setViewMode(val)} size="small" sx={{ height: 32, bgcolor: '#f5f5f5' }}>
                        <ToggleButton value="week" sx={{ px: 1.5, textTransform: 'none', fontWeight: 'bold' }}>Týden</ToggleButton>
                        <ToggleButton value="day" sx={{ px: 1.5, textTransform: 'none', fontWeight: 'bold' }}>Den</ToggleButton>
                    </ToggleButtonGroup>

                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Hlavní typ</InputLabel>
                        <Select value={selectedCategory} label="Hlavní typ" onChange={handleCategoryChange} sx={{ borderRadius: 2, height: 32 }}>
                            <MenuItem value="all">Všechny typy</MenuItem>
                            {activeHierarchy?.categories.map((cat) => (
                                <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box sx={{ flexGrow: 1 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconButton onClick={handlePrevWeek} size="small" sx={{ border: '1px solid #eee' }}><ArrowBackIos sx={{ fontSize: 10, ml: 0.5 }} /></IconButton>
                        <Box sx={{ textAlign: 'center', minWidth: 150 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#3e3535', fontSize: '0.85rem', lineHeight: 1 }}>{new Date(currentWeekStart).toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })}</Typography>
                            <Typography sx={{ fontSize: '0.65rem', color: '#888' }}>{currentWeekStart} — {endDate}</Typography>
                        </Box>
                        <IconButton onClick={handleNextWeek} size="small" sx={{ border: '1px solid #eee' }}><ArrowForwardIos sx={{ fontSize: 10 }} /></IconButton>
                    </Box>
                </Paper>

                {viewMode === 'day' && scheduleData?.days && (
                    <Paper elevation={0} sx={{ display: 'flex', mb: 1, borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }}>
                        {scheduleData.days.map((day) => {
                            const d = new Date(day.date);
                            const dayName = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'][d.getDay()];
                            const isSelected = selectedDate === day.date;
                            return (
                                <Button
                                    key={day.date}
                                    onClick={() => setSelectedDate(day.date)}
                                    sx={{ flex: 1, borderRadius: 0, py: 0.5, bgcolor: isSelected ? '#3e3535' : 'transparent', color: isSelected ? 'white' : '#555', fontWeight: isSelected ? 'bold' : 'normal', borderRight: '1px solid #eee', '&:hover': { bgcolor: isSelected ? '#3e3535' : '#f0f0f0' } }}
                                >
                                    {dayName} {d.getDate()}.{d.getMonth() + 1}.
                                </Button>
                            );
                        })}
                    </Paper>
                )}

                <Box sx={{ flexGrow: 1, position: 'relative', width: '100%', minHeight: 0 }}>
                    {viewMode === 'week' ? (
                        <PlannerGrid
                            hierarchy={selectedCategory === 'all' ? activeHierarchy : activeHierarchy ? { categories: activeHierarchy.categories.filter(c => c.id === selectedCategory) } : null}
                            scheduleData={scheduleData}
                            users={availableUsers}
                            selectedUserId={selectedUserId}
                            onAssignUser={handleAssignUser}
                            onRemoveUser={handleRemoveUser}
                            onShiftClick={(shift) => setSelectedShiftForDetail(shift)}
                        />
                    ) : (
                        <DailyPlannerGrid
                            hierarchy={selectedCategory === 'all' ? activeHierarchy : activeHierarchy ? { categories: activeHierarchy.categories.filter(c => c.id === selectedCategory) } : null}
                            scheduleData={scheduleData}
                            users={availableUsers}
                            selectedUserId={selectedUserId}
                            selectedDate={selectedDate}
                            onAssignUser={handleAssignUser}
                            onRemoveUser={handleRemoveUser}
                            onShiftClick={(shift) => setSelectedShiftForDetail(shift)}
                        />
                    )}
                </Box>

                {isManagerial && (
                    <>
                        <GenerateShiftsModal open={isGenerateModalOpen} onClose={() => setIsGenerateModalOpen(false)} onConfirm={handleGenerateConfirm} hierarchy={activeHierarchy} currentWeekStart={currentWeekStart} currentWeekEnd={endDate} />
                        <CopyWeekModal open={isCopyModalOpen} onClose={() => setIsCopyModalOpen(false)} onConfirm={handleCopyConfirm} currentWeekStart={currentWeekStart} />
                        <Dialog open={isClearModalOpen} onClose={() => setIsClearModalOpen(false)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
                            <DialogTitle sx={{ fontWeight: 'bold', color: '#d32f2f' }}>Varování: Vyčištění týdne</DialogTitle>
                            <DialogContent>
                                <Typography>Opravdu chcete smazat <strong>VŠECHNY</strong> směny v tomto týdnu ({currentWeekStart} — {endDate})?</Typography>
                                <Typography variant="body2" color="error" sx={{ mt: 2, fontWeight: 'bold' }}>Tato akce smaže i všechna přiřazení zaměstnanců na tyto směny a nelze ji vzít zpět!</Typography>
                            </DialogContent>
                            <DialogActions sx={{ p: 2 }}>
                                <Button onClick={() => setIsClearModalOpen(false)} color="inherit">Zrušit</Button>
                                <Button onClick={handleClearConfirm} variant="contained" color="error" sx={{ borderRadius: '20px' }}>Ano, vyčistit</Button>
                            </DialogActions>
                        </Dialog>
                        <AutoPlanModal open={isAutoPlanModalOpen} onClose={() => setIsAutoPlanModalOpen(false)} onConfirm={handleAutoPlanConfirm} viewMode={viewMode} selectedDate={selectedDate} />
                    </>
                )}

                <ShiftDetailModal key={selectedShiftForDetail?.id || 'empty'} open={!!selectedShiftForDetail} onClose={() => setSelectedShiftForDetail(null)} shift={selectedShiftForDetail} onRemoveUser={handleRemoveUser} onUpdateShift={handleUpdateShift} onSplitShift={handleSplitShift} onDeleteShift={handleDeleteShift} />
            </Box>
        </Box>
    );
};

export default ShiftPlanner;