// Importujeme NÁŠ bezpečný klient, nikoliv čistý axios!
import apiClient from '../api/axiosConfig';
import type { WeeklyScheduleResponse, PlannerUser } from '../pages/ShiftPlanner/types/ShiftPlannerTypes.ts';

export interface AutoPlanRequest {
    fairnessWeight: number;
    trainingWeight: number;
    startDate?: string;
    endDate?: string;
    targetDate?: string;
    categoryId?: number;
}

export const ScheduleService = {
    getWeeklySchedule: async (startDate: string, endDate: string): Promise<WeeklyScheduleResponse> => {
        // apiClient už obsahuje baseURL (http://localhost:8080/api/v1) i hlavičky
        const response = await apiClient.get('/schedule/week-view', {
            params: { startDate, endDate }
        });
        return response.data;
    },

    getAvailableUsers: async (startDate: string, endDate: string): Promise<PlannerUser[]> => {
        const response = await apiClient.get('/schedule/available-users', {
            params: { startDate, endDate, size: 5000 }
        });
        return response.data.content || response.data;
    },

    generateShifts: async (startDate: string, endDate: string, templateId: number): Promise<void> => {
        await apiClient.post('/shift-generation/from-template', {
            startDate, endDate, templateId
        });
    },

    copyWeek: async (sourceWeekStart: string, targetWeekStart: string): Promise<void> => {
        await apiClient.post('/shift-generation/copy-week', {
            sourceWeekStart, targetWeekStart
        });
    },

    clearWeek: async (startDate: string, endDate: string): Promise<void> => {
        await apiClient.delete('/shift-generation/clear-week', {
            params: { startDate, endDate }
        });
    },

    assignUserToShift: async (shiftId: string, userId: string): Promise<void> => {
        await apiClient.post('/shift-assignments', null, {
            params: { shiftId, userId }
        });
    },

    removeUserFromShift: async (shiftId: string, userId: string): Promise<void> => {
        await apiClient.delete('/shift-assignments', {
            params: { shiftId, userId }
        });
    },

    updateShift: async (shiftId: string, data: { startTime: string; endTime: string; requiredCapacity: number; description?: string }): Promise<void> => {
        await apiClient.put(`/shifts/${shiftId}`, data);
    },

    splitShift: async (shiftId: string): Promise<void> => {
        await apiClient.post(`/shifts/${shiftId}/split`);
    },

    generateCustomShifts: async (data: {
        stationId: number;
        startDate: string;
        endDate: string;
        startTime?: string;
        endTime?: string;
        requiredCapacity: number;
        useOpeningHours?: boolean;
        hasDopo?: boolean;
        hasOdpo?: boolean;
        description?: string;
    }): Promise<void> => {
        await apiClient.post('/shift-generation/custom', data);
    },

    deleteShift: async (shiftId: string): Promise<void> => {
        await apiClient.delete(`/shifts/${shiftId}`);
    },

    runAutoPlan: async (config: AutoPlanRequest): Promise<void> => {
        await apiClient.post('/schedule/auto-plan', config);
    }
};