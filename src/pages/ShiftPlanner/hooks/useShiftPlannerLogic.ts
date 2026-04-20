import { useState, useEffect, useCallback, useMemo } from 'react';
import { ScheduleService } from '../../../services/ScheduleService'; // Uprav cestu podle reálného umístění!
import { useAuth } from '../../../context/AuthContext';            // Uprav cestu podle reálného umístění!

// Technické importy pro bezpečnost a notifikace
import apiClient from '../../../api/axiosConfig';                  // Uprav cestu podle reálného umístění!
import { useNotification } from '../../../context/NotificationContext'; // Uprav cestu podle reálného umístění!
import { isAxiosError } from 'axios';

// Importujeme lokální typy
import type { WeeklyScheduleResponse, PlannerUser, HierarchyData, ScheduleShift } from '../types/ShiftPlannerTypes';
import type { GenerateFormValues } from '../modals/GenerateShiftsModal';
import type { CopyFormValues } from '../modals/CopyWeekModal';
import type { AutoPlanConfig } from '../modals/AutoPlanModal';

interface BackendError {
    message?: string;
}

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

export const useShiftPlannerLogic = () => {
    const { userRoles, userId: loggedInUserId } = useAuth();
    const { showNotification } = useNotification();

    // --- 1. STAVY (STATE) ---
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
    const [selectedDate, setSelectedDate] = useState<string>(currentWeekStart);

    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);
    const [isAutoPlanModalOpen, setIsAutoPlanModalOpen] = useState(false);

    // --- 2. MEMOIZACE A KONTROLY ---
    const isManagerial = useMemo(() => {
        const managerialRoles = ['ADMIN', 'PLANNER', 'MANAGEMENT', 'MANAGER'];
        return (userRoles ?? []).some((role: string) => {
            const cleanRole = role.replace('ROLE_', '').toUpperCase();
            return managerialRoles.includes(cleanRole);
        });
    }, [userRoles]);

    const activeHierarchy = useMemo(() => {
        if (!hierarchy || !scheduleData) return null;
        const currentWeekStationIds = new Set((scheduleData.shifts || []).map(s => s.stationId));

        return {
            categories: (hierarchy.categories || [])
                .map(cat => ({
                    ...cat,
                    stations: (cat.stations || []).filter(stat => stat.isActive || currentWeekStationIds.has(stat.id))
                }))
                .filter(cat => (cat.stations || []).length > 0)
        };
    }, [hierarchy, scheduleData]);

    const allStations = useMemo(() => {
        if (!activeHierarchy) return [];
        return (activeHierarchy.categories || []).flatMap(cat => cat.stations || []);
    }, [activeHierarchy]);

    // --- 3. EFEKTY ---
    useEffect(() => {
        setSelectedDate(currentWeekStart);
    }, [currentWeekStart]);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Nahrazeno natvrdo zapsané URL voláním přes apiClient
            const [scheduleRes, usersRes, hierarchyRes] = await Promise.all([
                ScheduleService.getWeeklySchedule(currentWeekStart, endDate),
                ScheduleService.getAvailableUsers(currentWeekStart, endDate),
                apiClient.get('/position-settings/hierarchy').then(res => res.data)
            ]);

            setScheduleData(scheduleRes);

            const usersData = usersRes as unknown as { content?: PlannerUser[] } | PlannerUser[];
            const extractedUsers = Array.isArray(usersData) ? usersData : (usersData?.content || []);
            const validUsers = extractedUsers.filter((u): u is PlannerUser => u !== null && u !== undefined);

            setAvailableUsers(validUsers);
            setHierarchy(hierarchyRes);
        } catch (error: unknown) {
            const msg = isAxiosError(error) ? (error.response?.data as BackendError)?.message : 'Chyba při načítání dat';
            showNotification(msg || "Nepodařilo se načíst data pro Směnář.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [currentWeekStart, endDate, showNotification]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    // --- 4. AKCE (HANDLERY) ---
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
            showNotification("Směny byly úspěšně vygenerovány.", "success");
            setIsGenerateModalOpen(false);
            await loadData();
        } catch (error: unknown) {
            const msg = isAxiosError(error) ? (error.response?.data as BackendError)?.message : 'Chyba generování';
            showNotification(msg || "Nepodařilo se vygenerovat směny.", "error");
        }
    };

    const handleCopyConfirm = async (data: CopyFormValues) => {
        if (!isManagerial) return;
        try {
            await ScheduleService.copyWeek(data.sourceWeekStart, data.targetWeekStart);
            showNotification("Týden byl úspěšně zkopírován.", "success");
            setIsCopyModalOpen(false);
            setCurrentWeekStart(data.targetWeekStart);
        } catch (error: unknown) {
            const msg = isAxiosError(error) ? (error.response?.data as BackendError)?.message : 'Chyba kopírování';
            showNotification(msg || "Nepodařilo se zkopírovat týden.", "error");
        }
    };

    const handleClearConfirm = async () => {
        if (!isManagerial) return;
        try {
            await ScheduleService.clearWeek(currentWeekStart, endDate);
            showNotification("Týden byl úspěšně vyčištěn.", "success");
            setIsClearModalOpen(false);
            await loadData();
        } catch (error: unknown) {
            const msg = isAxiosError(error) ? (error.response?.data as BackendError)?.message : 'Chyba mazání';
            showNotification(msg || "Nepodařilo se vyčistit týden.", "error");
        }
    };

    const handleAutoPlanConfirm = async (config: AutoPlanConfig) => {
        if (!isManagerial) return;
        try {
            setIsLoading(true);
            await ScheduleService.runAutoPlan({
                fairnessWeight: config.fairnessWeight, trainingWeight: config.trainingWeight, targetDate: config.targetDate,
                startDate: currentWeekStart, endDate: endDate, categoryId: selectedCategory === 'all' ? undefined : selectedCategory
            });
            showNotification("Automatické plánování proběhlo úspěšně.", "success");
            await loadData();
            setIsAutoPlanModalOpen(false);
        } catch (error: unknown) {
            const msg = isAxiosError(error) ? (error.response?.data as BackendError)?.message : 'Chyba algoritmu';
            showNotification(msg || "Automatické plánování selhalo.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssignUser = async (shiftId: string) => {
        if (!isManagerial || !selectedUserId) return;
        try {
            await ScheduleService.assignUserToShift(shiftId, selectedUserId);
            showNotification("Uživatel byl úspěšně přiřazen.", "success");
            await loadData();
        } catch (error: unknown) {
            const msg = isAxiosError(error) ? (error.response?.data as BackendError)?.message : 'Přiřazení selhalo';
            showNotification(msg || "Nepodařilo se přiřadit uživatele.", "error");
        }
    };

    const handleRemoveUser = async (shiftId: string, userId: string) => {
        if (!isManagerial) return;
        try {
            await ScheduleService.removeUserFromShift(shiftId, userId);
            showNotification("Uživatel byl odebrán ze směny.", "success");
            await loadData();
            setSelectedShiftForDetail(prev => prev ? { ...prev, assignedUsers: prev.assignedUsers.filter(u => u.userId !== userId) } : null);
        } catch (error: unknown) {
            const msg = isAxiosError(error) ? (error.response?.data as BackendError)?.message : 'Odebrání selhalo';
            showNotification(msg || "Nepodařilo se odebrat uživatele.", "error");
        }
    };

    const handleUpdateShift = async (shiftId: string, startTime: string, endTime: string, capacity: number, description?: string) => {
        if (!isManagerial) return;
        try {
            await ScheduleService.updateShift(shiftId, { startTime, endTime, requiredCapacity: capacity, description });
            showNotification("Směna byla aktualizována.", "success");
            await loadData();
            setSelectedShiftForDetail(null);
        } catch (error: unknown) {
            const msg = isAxiosError(error) ? (error.response?.data as BackendError)?.message : 'Aktualizace selhala';
            showNotification(msg || "Nepodařilo se uložit změny směny.", "error");
        }
    };

    const handleSplitShift = async (shiftId: string) => {
        if (!isManagerial) return;
        try {
            await ScheduleService.splitShift(shiftId);
            showNotification("Směna byla úspěšně rozdělena.", "success");
            await loadData();
            setSelectedShiftForDetail(null);
        } catch (error: unknown) {
            const msg = isAxiosError(error) ? (error.response?.data as BackendError)?.message : 'Rozdělení selhalo';
            showNotification(msg || "Nepodařilo se rozdělit směnu.", "error");
        }
    };

    const handleDeleteShift = async (shiftId: string) => {
        if (!isManagerial) return;
        if (!window.confirm("Opravdu chcete tuto směnu smazat?")) return; // window.confirm je zde v pořádku
        try {
            await ScheduleService.deleteShift(shiftId);
            showNotification("Směna byla smazána.", "success");
            await loadData();
            setSelectedShiftForDetail(null);
        } catch (error: unknown) {
            const msg = isAxiosError(error) ? (error.response?.data as BackendError)?.message : 'Smazání selhalo';
            showNotification(msg || "Nepodařilo se smazat směnu.", "error");
        }
    };

    // --- RETURN OBJECT ---
    return {
        state: {
            viewMode, selectedCategory, currentWeekStart, endDate, scheduleData, availableUsers,
            hierarchy, isLoading, selectedUserId, selectedShiftForDetail, selectedDate,
            isGenerateModalOpen, isCopyModalOpen, isClearModalOpen, isAutoPlanModalOpen,
            isManagerial, activeHierarchy, allStations, loggedInUserId
        },
        actions: {
            setViewMode, setSelectedCategory, setCurrentWeekStart, setSelectedUserId,
            setSelectedShiftForDetail, setSelectedDate, setIsGenerateModalOpen,
            setIsCopyModalOpen, setIsClearModalOpen, setIsAutoPlanModalOpen,
            handleGenerateConfirm, handleCopyConfirm, handleClearConfirm, handleAutoPlanConfirm,
            handleAssignUser, handleRemoveUser, handleUpdateShift, handleSplitShift, handleDeleteShift,
            handlePrevWeek: () => setCurrentWeekStart(prev => addWeeks(prev, -1)),
            handleNextWeek: () => setCurrentWeekStart(prev => addWeeks(prev, 1))
        }
    };
};