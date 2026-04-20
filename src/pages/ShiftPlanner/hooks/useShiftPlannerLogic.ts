// src/pages/ShiftPlanner/hooks/useShiftPlannerLogic.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ScheduleService } from '../../../services/ScheduleService'; // Uprav cestu podle reálného umístění!
import { useAuth } from '../../../context/AuthContext';            // Uprav cestu podle reálného umístění!

// Importujeme naše nové, lokální typy
import type {
    WeeklyScheduleResponse, PlannerUser, HierarchyData, ScheduleShift
} from '../types/ShiftPlannerTypes';

// Tyto typy pro modály budeme muset importovat z jejich souborů (až je přesuneš)
import type { GenerateFormValues } from '../modals/GenerateShiftsModal';
import type { CopyFormValues } from '../modals/CopyWeekModal';
import type { AutoPlanConfig } from '../modals/AutoPlanModal';

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

    // Stavy Modálních oken
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
            const [scheduleRes, usersRes, hierarchyRes] = await Promise.all([
                ScheduleService.getWeeklySchedule(currentWeekStart, endDate),
                ScheduleService.getAvailableUsers(currentWeekStart, endDate),
                fetch('http://localhost:8080/api/v1/position-settings/hierarchy', { credentials: 'include' }).then(res => res.json())
            ]);
            setScheduleData(scheduleRes);

            // ----------------------------------------------------------------------
            // OPRAVA TYPŮ: Ochrana proti přísnému TS a ESLintu
            // ----------------------------------------------------------------------
            const usersData = usersRes as unknown as { content?: PlannerUser[] } | PlannerUser[];
            const extractedUsers = Array.isArray(usersData) ? usersData : (usersData?.content || []);

            // Type guard "u is PlannerUser" vyřeší ESLint any error
            const validUsers = extractedUsers.filter((u): u is PlannerUser => u !== null && u !== undefined);

            setAvailableUsers(validUsers);
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
                fairnessWeight: config.fairnessWeight, trainingWeight: config.trainingWeight, targetDate: config.targetDate,
                startDate: currentWeekStart, endDate: endDate, categoryId: selectedCategory === 'all' ? undefined : selectedCategory
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
            alert(err.response?.data?.message || "Nepodařilo se přiřadit uživatele.");
        }
    };

    const handleRemoveUser = async (shiftId: string, userId: string) => {
        if (!isManagerial) return;
        try {
            await ScheduleService.removeUserFromShift(shiftId, userId);
            await loadData();
            setSelectedShiftForDetail(prev => prev ? { ...prev, assignedUsers: prev.assignedUsers.filter(u => u.userId !== userId) } : null);
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
            alert(err.response?.data?.message || "Nepodařilo se smazat směnu.");
        }
    };

    // --- RETURN OBJECT (Rozhraní pro UI) ---
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