// PositionsTypes.ts

export interface HierarchyTemplate {
    id: number;
    name: string;
    isActive: boolean;
    workersNeeded: number;
    sortOrder: number;
    timeRange?: string;
    startTime: string | null;
    endTime: string | null;
    startTime2: string | null;
    endTime2: string | null;
    useOpeningHours: boolean;
    hasDopo: boolean;
    hasOdpo: boolean;
}

export interface HierarchyStation {
    id: number;
    name: string;
    isActive: boolean;
    needsQualification: boolean;
    capacityLimit: number;
    sortOrder: number;
    afternoonStartTime?: string | null; // <--- PŘIDÁNA NOVÁ FUNKCIONALITA
    templates: HierarchyTemplate[];
}

export interface HierarchyCategory {
    id: number;
    name: string;
    color: string;
    isActive: boolean;
    sortOrder: number;
    stations: HierarchyStation[];
}

export interface HierarchyResponse {
    categories?: HierarchyCategory[];
}

export interface SeasonMode {
    id: number | null;
    name: string;
    startDate: string;
    endDate: string;
    dopoStart: string;
    dopoEnd: string;
    odpoStart: string;
    odpoEnd: string;
    isActive?: boolean; // <--- PŘIDÁNO
}

export interface DeactivationPayload {
    name?: string;
    hexColor?: string;
    isActive: boolean;
    categoryId?: number | null;
    stationId?: number | null;
    workersNeeded?: number;
    startTime?: string;
    endTime?: string;
    sortOrder?: number;
}

export interface TemplatePayload {
    name: string;
    stationId: number;
    workersNeeded: number;
    sortOrder: number;
    isActive: boolean;
    useOpeningHours: boolean;
    hasDopo: boolean;
    hasOdpo: boolean;
    startTime?: string;
    endTime?: string;
    startTime2?: string;
    endTime2?: string;
}

// =======================================================
// --- VÝCHOZÍ STAVY FORMULÁŘŮ
// =======================================================

export const INITIAL_CAT_FORM = { id: null as number | null, name: '', color: '#2e7d32', order: 1, active: true };

export const INITIAL_STAT_FORM = {
    id: null as number | null,
    name: '',
    capacityLimit: 1,
    order: 1,
    active: true,
    needsQualification: false,
    useDefaultSplitTime: true,  // <--- PŘIDÁNO: Výchozí chování (14:00)
    afternoonStartTime: '14:00' // <--- PŘIDÁNO: Čas v paměti
};

export const INITIAL_TMPL_FORM = {
    id: null as number | null, name: '', shiftType: 'full', workersNeeded: 1, order: 1, active: true, useOpeningHours: false,
    fullStartTime: '08:00', fullEndTime: '16:00', hasDopo: true, dopoStartTime: '08:00', dopoEndTime: '12:00',
    hasOdpo: true, odpoStartTime: '13:00', odpoEndTime: '17:00'
};

export const INITIAL_HOURS_FORM = {
    weekDopoStart: '08:00', weekDopoEnd: '12:00', weekOdpoStart: '12:30', weekOdpoEnd: '16:00',
    weekendSame: false,
    weekendDopoStart: '08:00', weekendDopoEnd: '12:00', weekendOdpoStart: '12:30', weekendOdpoEnd: '16:00'
};

export const INITIAL_PAUSE_FORM = { triggerHours: 6, pauseMinutes: 30 };

export const INITIAL_SEASON_FORM: SeasonMode = {
    id: null, name: '', startDate: '', endDate: '',
    dopoStart: '10:00', dopoEnd: '14:00', odpoStart: '14:00', odpoEnd: '22:00',
    isActive: true // <--- PŘIDÁNO
};