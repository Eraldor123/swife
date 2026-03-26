import axios from 'axios';
import type { WeeklyScheduleResponse, PlannerUser } from '../types/schedule';

const API_URL = 'http://localhost:8080/api/v1/schedule';

// Pomocná funkce pro získání konfigurace s tokenem
const getAuthHeader = () => ({
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
});

export const ScheduleService = {
    getWeeklySchedule: async (startDate: string, endDate: string): Promise<WeeklyScheduleResponse> => {
        // OPRAVA: Přidán třetí parametr s hlavičkami
        const response = await axios.get(`${API_URL}/week-view`, {
            params: { startDate, endDate },
            ...getAuthHeader()
        });
        return response.data;
    },

    getAvailableUsers: async (startDate: string, endDate: string): Promise<PlannerUser[]> => {
        // OPRAVA: Přidán třetí parametr s hlavičkami
        const response = await axios.get(`${API_URL}/available-users`, {
            params: { startDate, endDate },
            ...getAuthHeader()
        });
        return response.data;
    },

    generateShifts: async (startDate: string, endDate: string, templateId: number): Promise<void> => {
        // Zde už to bylo správně, ale sjednotíme to pro čistotu
        await axios.post(`http://localhost:8080/api/v1/shift-generation/from-template`, {
            startDate,
            endDate,
            templateId
        }, getAuthHeader());
    },

    copyWeek: async (sourceWeekStart: string, targetWeekStart: string): Promise<void> => {
        await axios.post(`http://localhost:8080/api/v1/shift-generation/copy-week`, {
            sourceWeekStart,
            targetWeekStart
        }, getAuthHeader());
    },

    clearWeek: async (startDate: string, endDate: string): Promise<void> => {
        await axios.delete(`http://localhost:8080/api/v1/shift-generation/clear-week`, {
            params: { startDate, endDate },
            ...getAuthHeader()
        });
    },
};