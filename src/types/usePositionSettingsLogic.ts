// usePositionSettingsLogic.ts
import { useState, useCallback } from 'react';
import type { HierarchyCategory, HierarchyStation, HierarchyResponse, SeasonMode } from './PositionsTypes';
import { INITIAL_HOURS_FORM, INITIAL_PAUSE_FORM } from './PositionsTypes';

export const usePositionSettingsLogic = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [categories, setCategories] = useState<HierarchyCategory[]>([]);
    const [standardHours, setStandardHours] = useState(INITIAL_HOURS_FORM);
    const [pauseRule, setPauseRule] = useState(INITIAL_PAUSE_FORM);
    const [seasons, setSeasons] = useState<SeasonMode[]>([]);

    const fetchHierarchy = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:8080/api/v1/position-settings/hierarchy', {
                headers: { 'Cache-Control': 'no-cache', 'Accept': 'application/json' },
                credentials: 'include'
            });

            if (response.ok) {
                const data = (await response.json()) as HierarchyResponse | HierarchyCategory[];
                const rawCategories = Array.isArray(data) ? data : (data.categories ?? []);

                // OPRAVA: Odstraněno 'any', používáme přesné typy
                const sanitizedCategories: HierarchyCategory[] = rawCategories.map((cat: HierarchyCategory) => ({
                    ...cat,
                    stations: (cat.stations ?? []).map((stat: HierarchyStation) => ({
                        ...stat,
                        templates: stat.templates ?? []
                    }))
                }));
                setCategories(sanitizedCategories);
                setErrorMessage(null);
            } else if (response.status === 403) {
                setErrorMessage("Nemáte dostatečná oprávnění.");
            } else {
                // OPRAVA: Místo lokálního throw rovnou nastavíme zprávu
                setErrorMessage("Nepodařilo se načíst hierarchii.");
            }
        } catch (error) {
            // OPRAVA: Proměnná 'error' je nyní využita
            console.error("Chyba při stahování hierarchie:", error);
            setErrorMessage("Chyba spojení se serverem.");
        }
    }, []);

    const fetchOperatingHoursData = useCallback(async () => {
        try {
            const headers = { 'Cache-Control': 'no-cache', 'Accept': 'application/json' };
            const [stdRes, pauseRes, seasonRes] = await Promise.all([
                fetch('http://localhost:8080/api/v1/operating-hours/standard', { headers, credentials: 'include' }),
                fetch('http://localhost:8080/api/v1/operating-hours/pause-rule', { headers, credentials: 'include' }),
                fetch('http://localhost:8080/api/v1/operating-hours/seasons', { headers, credentials: 'include' })
            ]);

            if (stdRes.ok) setStandardHours(await stdRes.json());
            if (pauseRes.ok) setPauseRule(await pauseRes.json());
            if (seasonRes.ok) setSeasons(await seasonRes.json());
        } catch (error) {
            console.error("Chyba načítání dat provozu:", error);
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

        // OPRAVA: Odstraněna redundantní inicializace = ""
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