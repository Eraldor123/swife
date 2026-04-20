import axios from 'axios';
import type { WeeklyScheduleResponse, PlannerUser } from '../pages/ShiftPlanner/types/ShiftPlannerTypes.ts';

const API_URL = 'http://localhost:8080/api/v1/schedule';

export interface AutoPlanRequest {
    fairnessWeight: number;
    trainingWeight: number;
    startDate?: string;
    endDate?: string;
    targetDate?: string;
    categoryId?: number;
}

const getAuthHeader = () => {
    return {
        withCredentials: true
    };
};

export const ScheduleService = {
    getWeeklySchedule: async (startDate: string, endDate: string): Promise<WeeklyScheduleResponse> => {
        const response = await axios.get(`${API_URL}/week-view`, {
            params: { startDate, endDate },
            ...getAuthHeader()
        });
        return response.data;
    },

    getAvailableUsers: async (startDate: string, endDate: string): Promise<PlannerUser[]> => {
        const response = await axios.get(`${API_URL}/available-users`, {
            // PŘIDÁNO: size: 100 zajistí, že nám backend pošle dostatek uživatelů pro sidebar (výchozí je jen 20)
            params: { startDate, endDate, size: 100 },
            ...getAuthHeader()
        });

        // OPRAVA: Zpracování Spring Page objektu (vrátíme pouze pole 'content')
        return response.data.content || response.data;
    },

    generateShifts: async (startDate: string, endDate: string, templateId: number): Promise<void> => {
        await axios.post(`http://localhost:8080/api/v1/shift-generation/from-template`, {
            startDate, endDate, templateId
        }, getAuthHeader());
    },

    copyWeek: async (sourceWeekStart: string, targetWeekStart: string): Promise<void> => {
        await axios.post(`http://localhost:8080/api/v1/shift-generation/copy-week`, {
            sourceWeekStart, targetWeekStart
        }, getAuthHeader());
    },

    clearWeek: async (startDate: string, endDate: string): Promise<void> => {
        await axios.delete(`http://localhost:8080/api/v1/shift-generation/clear-week`, {
            params: { startDate, endDate },
            ...getAuthHeader()
        });
    },

    assignUserToShift: async (shiftId: string, userId: string): Promise<void> => {
        await axios.post(`http://localhost:8080/api/v1/shift-assignments`, null, {
            params: { shiftId, userId },
            ...getAuthHeader()
        });
    },

    removeUserFromShift: async (shiftId: string, userId: string): Promise<void> => {
        await axios.delete(`http://localhost:8080/api/v1/shift-assignments`, {
            params: { shiftId, userId },
            ...getAuthHeader()
        });
    },

    updateShift: async (shiftId: string, data: { startTime: string; endTime: string; requiredCapacity: number; description?: string }): Promise<void> => {
        await axios.put(`http://localhost:8080/api/v1/shifts/${shiftId}`, data, getAuthHeader());
    },

    splitShift: async (shiftId: string): Promise<void> => {
        await axios.post(`http://localhost:8080/api/v1/shifts/${shiftId}/split`, {}, getAuthHeader());
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
        await axios.post(`http://localhost:8080/api/v1/shift-generation/custom`, data, getAuthHeader());
    },

    deleteShift: async (shiftId: string): Promise<void> => {
        await axios.delete(`http://localhost:8080/api/v1/shifts/${shiftId}`, getAuthHeader());
    },

    runAutoPlan: async (config: AutoPlanRequest): Promise<void> => {
        await axios.post(`${API_URL}/auto-plan`, config, getAuthHeader());
    }
};