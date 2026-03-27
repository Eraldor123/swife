// src/types/schedule.ts

/**
 * Rozhraní pro otevírací dobu areálu v konkrétní den
 */
export interface DailyHours {
    date: string; // formát "2026-03-30"
    dopoStart: string | null;
    dopoEnd: string | null;
    odpoStart: string | null;
    odpoEnd: string | null;
    isSeasonal: boolean;
}

/**
 * Zjednodušený objekt uživatele přiřazeného ke směně
 */
export interface AssignedUser {
    userId: string;
    name: string;
}

/**
 * Rozhraní pro konkrétní vygenerovanou směnu v kalendáři
 */
export interface ScheduleShift {
    id: string;
    stationId: number;
    templateId?: number;
    shiftDate: string;
    startTime: string;
    endTime: string;
    requiredCapacity: number;
    description?: string;
    assignedUsers: AssignedUser[];
}

/**
 * Hlavní odpověď backendu pro týdenní zobrazení směnáře
 */
export interface WeeklyScheduleResponse {
    days: DailyHours[];
    shifts: ScheduleShift[];
}

/**
 * Rozhraní pro zaměstnance zobrazeného v levém panelu (sidebar)
 */
export interface PlannerUser {
    userId: string;
    name: string;
    qualifiedStationIds: number[];
    weekAvailability: Record<string, string>; // např. { "2026-03-30": "DOP" }
    plannedShiftsThisMonth: number;
    completedShiftsThisMonth: number;
}

/**
 * Rozhraní pro šablonu směny v rámci hierarchie
 */
export interface HierarchyTemplate {
    id: number;
    name: string;
}

/**
 * Rozhraní pro stanoviště v rámci hierarchie
 */
export interface HierarchyStation {
    id: number;
    name: string;
    needsQualification: boolean;
    templates: HierarchyTemplate[];
}

/**
 * Rozhraní pro hlavní kategorii v rámci hierarchie
 */
export interface HierarchyCategory {
    id: number;
    name: string;
    color: string | null; // <--- DOPLNĚNO, aby fungovalo podbarvení
    stations: HierarchyStation[];
}

/**
 * Kompletní datová struktura hierarchie pozic
 */
export interface HierarchyData {
    categories: HierarchyCategory[];
}