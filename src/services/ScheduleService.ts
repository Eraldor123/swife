import axios from 'axios';
import type { WeeklyScheduleResponse, PlannerUser } from '../types/schedule';

const API_URL = 'http://localhost:8080/api/v1/schedule';

const getAuthHeader = () => ({
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
});

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
            params: { startDate, endDate },
            ...getAuthHeader()
        });
        return response.data;
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
    // Tato metoda chybí a způsobuje tu chybu v ShiftPlanneru
    updateShift: async (shiftId: string, data: { startTime: string, endTime: string, requiredCapacity: number }): Promise<void> => {
        const token = localStorage.getItem('token');
        await axios.put(`http://localhost:8080/api/v1/shifts/${shiftId}`, data, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },
};