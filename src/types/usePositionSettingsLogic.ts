import { useState, useCallback } from 'react';
import type { HierarchyCategory, HierarchyStation, HierarchyResponse, SeasonMode } from './PositionsTypes';
import { INITIAL_HOURS_FORM, INITIAL_PAUSE_FORM } from './PositionsTypes';

// Technické importy
import apiClient from '../api/axiosConfig';
import { isAxiosError } from 'axios';

interface BackendError {
    message?: string;
}

export const usePositionSettingsLogic = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [categories, setCategories] = useState<HierarchyCategory[]>([]);
    const [standardHours, setStandardHours] = useState(INITIAL_HOURS_FORM);
    const [pauseRule, setPauseRule] = useState(INITIAL_PAUSE_FORM);
    const [seasons, setSeasons] = useState<SeasonMode[]>([]);

    const fetchHierarchy = useCallback(async () => {
        try {
            // Místo fetch a ručních hlaviček použijeme čistý apiClient
            const response = await apiClient.get('/position-settings/hierarchy');

            if (response.status === 200) {
                const data = response.data as HierarchyResponse | HierarchyCategory[];
                const rawCategories = Array.isArray(data) ? data : (data.categories ?? []);

                const sanitizedCategories: HierarchyCategory[] = rawCategories.map((cat: HierarchyCategory) => ({
                    ...cat,
                    stations: (cat.stations ?? []).map((stat: HierarchyStation) => ({
                        ...stat,
                        templates: stat.templates ?? []
                    }))
                }));

                setCategories(sanitizedCategories);
                setErrorMessage(null);
            }
        } catch (error: unknown) {
            console.error("Chyba při stahování hierarchie:", error);

            if (isAxiosError(error)) {
                if (error.response?.status === 403) {
                    setErrorMessage("Nemáte dostatečná oprávnění.");
                } else {
                    const data = error.response?.data as BackendError;
                    setErrorMessage(data?.message || "Nepodařilo se načíst hierarchii.");
                }
            } else {
                setErrorMessage("Chyba spojení se serverem.");
            }
        }
    }, []);

    const fetchOperatingHoursData = useCallback(async () => {
        try {
            // Promise.all s apiClientem je mnohem čistší, axios si credentials a hlavičky řeší sám
            const [stdRes, pauseRes, seasonRes] = await Promise.all([
                apiClient.get('/operating-hours/standard'),
                apiClient.get('/operating-hours/pause-rule'),
                apiClient.get('/operating-hours/seasons')
            ]);

            // U Axiosu jsou data rovnou naparsovaná v response.data
            if (stdRes.status === 200) setStandardHours(stdRes.data);
            if (pauseRes.status === 200) setPauseRule(pauseRes.data);
            if (seasonRes.status === 200) setSeasons(seasonRes.data);

        } catch (error: unknown) {
            console.error("Chyba načítání dat provozu:", error);
            // Zde nenastavujeme errorMessage plošně, aby nespadla celá stránka, pokud se nenačte jen pauza
        }
    }, []);

    const loadAllData = useCallback(async () => {
        setLoading(true);
        await Promise.all([fetchHierarchy(), fetchOperatingHoursData()]);
        setLoading(false);
    }, [fetchHierarchy, fetchOperatingHoursData]);

    const formatTimeForServer = (timeStr?: string | null): string | undefined => {
        if (!timeStr) return undefined;
        return timeStr.length === 5 ? `${timeStr}:00` : timeStr;
    };

    const getTodayOpeningHoursText = (hasDopo?: boolean, hasOdpo?: boolean) => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const activeSeason = seasons.find(s => s.startDate <= todayStr && s.endDate >= todayStr);

        let dStr: string;
        let oStr: string;

        if (activeSeason) {
            dStr = `${activeSeason.dopoStart.substring(0, 5)} - ${activeSeason.dopoEnd.substring(0, 5)}`;
            oStr = `${activeSeason.odpoStart.substring(0, 5)} - ${activeSeason.odpoEnd.substring(0, 5)}`;
        } else {
            const isWeekend = today.getDay() === 0 || today.getDay() === 6;
            if (isWeekend && !standardHours.weekendSame) {
                dStr = `${standardHours.weekendDopoStart.substring(0, 5)} - ${standardHours.weekendDopoEnd.substring(0, 5)}`;
                oStr = `${standardHours.weekendOdpoStart.substring(0, 5)} - ${standardHours.weekendOdpoEnd.substring(0, 5)}`;
            } else {
                dStr = `${standardHours.weekDopoStart.substring(0, 5)} - ${standardHours.weekDopoEnd.substring(0, 5)}`;
                oStr = `${standardHours.weekOdpoStart.substring(0, 5)} - ${standardHours.weekOdpoEnd.substring(0, 5)}`;
            }
        }

        if (hasDopo && hasOdpo) return `${dStr} a ${oStr}`;
        return hasDopo ? dStr : (hasOdpo ? oStr : "");
    };

    return {
        loading, errorMessage, categories, standardHours, pauseRule, seasons,
        loadAllData, fetchHierarchy, fetchOperatingHoursData,
        formatTimeForServer, getTodayOpeningHoursText
    };
};