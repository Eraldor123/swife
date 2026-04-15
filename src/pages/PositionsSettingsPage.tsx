import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Tabs, Tab, List, ListItem,
    ListItemButton, ListItemText, IconButton, Button, Divider, Stack,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress,
    FormControlLabel, Switch, RadioGroup, Radio, Checkbox, Alert, Chip
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    ArrowBack as ArrowBackIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Warning as WarningIcon,
    EventNote as EventNoteIcon,
    AccessTime as AccessTimeIcon,
    Timer as TimerIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// =======================================================
// --- ROZHRANÍ (INTERFACES) ODPPOVÍDAJÍCÍ BACKENDU ---
// =======================================================

interface HierarchyTemplate {
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

interface HierarchyStation {
    id: number;
    name: string;
    isActive: boolean;
    needsQualification: boolean;
    capacityLimit: number;
    sortOrder: number;
    templates: HierarchyTemplate[];
}

interface HierarchyCategory {
    id: number;
    name: string;
    color: string;
    isActive: boolean;
    sortOrder: number;
    stations: HierarchyStation[];
}

interface HierarchyResponse {
    categories?: HierarchyCategory[];
}

interface SeasonMode {
    id: number | null;
    name: string;
    startDate: string;
    endDate: string;
    dopoStart: string;
    dopoEnd: string;
    odpoStart: string;
    odpoEnd: string;
}

interface DeactivationPayload {
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

interface TemplatePayload {
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

const PositionsSettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // --- STAVY: HIERARCHIE ---
    const [categories, setCategories] = useState<HierarchyCategory[]>([]);
    const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
    const [selectedStatId, setSelectedStatId] = useState<number | null>(null);

    const [showInactiveCats, setShowInactiveCats] = useState(false);
    const [showInactiveStats, setShowInactiveStats] = useState(false);
    const [showInactiveTmpls, setShowInactiveTmpls] = useState(false);

    const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
    const [isStatDialogOpen, setIsStatDialogOpen] = useState(false);
    const [isTmplDialogOpen, setIsTmplDialogOpen] = useState(false);

    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean, type: 'category' | 'station' | 'template' | 'season', id: number | null, name: string }>({
        open: false, type: 'category', id: null, name: ''
    });
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const [catForm, setCatForm] = useState({ id: null as number | null, name: '', color: '#2e7d32', order: 1, active: true });
    const [statForm, setStatForm] = useState({ id: null as number | null, name: '', capacityLimit: 1, order: 1, active: true, needsQualification: false });
    const [tmplForm, setTmplForm] = useState({
        id: null as number | null, name: '', shiftType: 'full', workersNeeded: 1, order: 1, active: true, useOpeningHours: false,
        fullStartTime: '08:00', fullEndTime: '16:00', hasDopo: true, dopoStartTime: '08:00', dopoEndTime: '12:00',
        hasOdpo: true, odpoStartTime: '13:00', odpoEndTime: '17:00'
    });

    // --- STAVY: PROVOZ AREÁLU ---
    const [isHoursDialogOpen, setIsHoursDialogOpen] = useState(false);
    const [isPauseDialogOpen, setIsPauseDialogOpen] = useState(false);
    const [isSeasonDialogOpen, setIsSeasonDialogOpen] = useState(false);

    const [standardHours, setStandardHours] = useState({
        weekDopoStart: '08:00', weekDopoEnd: '12:00', weekOdpoStart: '12:30', weekOdpoEnd: '16:00',
        weekendSame: false,
        weekendDopoStart: '08:00', weekendDopoEnd: '12:00', weekendOdpoStart: '12:30', weekendOdpoEnd: '16:00'
    });
    const [pauseRule, setPauseRule] = useState({ triggerHours: 6, pauseMinutes: 30 });
    const [seasons, setSeasons] = useState<SeasonMode[]>([]);

    const [hoursForm, setHoursForm] = useState(standardHours);
    const [pauseForm, setPauseForm] = useState(pauseRule);
    const [seasonForm, setSeasonForm] = useState<SeasonMode>({
        id: null, name: '', startDate: '', endDate: '',
        dopoStart: '10:00', dopoEnd: '14:00', odpoStart: '14:00', odpoEnd: '22:00'
    });

    // =======================================================
    // --- NAČÍTÁNÍ DAT ZE SERVERU ---
    // =======================================================

    const fetchHierarchy = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:8080/api/v1/position-settings/hierarchy', {
                headers: { 'Cache-Control': 'no-cache', 'Accept': 'application/json' },
                credentials: 'include'
            });

            if (response.ok) {
                const data = (await response.json()) as HierarchyResponse | HierarchyCategory[];
                const rawCategories: HierarchyCategory[] = Array.isArray(data) ? data : (data.categories ?? []);

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
                setErrorMessage("Nemáte dostatečná oprávnění (vyžadována role ADMIN/MANAGEMENT/PLANNER).");
            } else {
                throw new Error("Nepodařilo se načíst hierarchii.");
            }
        } catch (error) {
            console.error("Chyba při načítání hierarchie:", error);
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
        } catch (err) {
            console.error("Chyba načítání dat provozu:", err);
        }
    }, []);

    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            await Promise.all([fetchHierarchy(), fetchOperatingHoursData()]);
            setLoading(false);
        };
        void loadAll();
    }, [fetchHierarchy, fetchOperatingHoursData]);

    // =======================================================
    // --- POMOCNÉ FUNKCE ---
    // =======================================================

    const formatTimeForServer = (timeStr?: string | null): string | undefined => {
        if (!timeStr) return undefined;
        return timeStr.length === 5 ? `${timeStr}:00` : timeStr;
    }

    const getTodayOpeningHoursText = (hasDopo?: boolean, hasOdpo?: boolean) => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const activeSeason = seasons.find(s => s.startDate <= todayStr && s.endDate >= todayStr);

        let dStr = "";
        let oStr = "";

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

    // =======================================================
    // --- HANDLERY (CREATE / UPDATE / DELETE) ---
    // =======================================================

    const openEditCategory = (cat: HierarchyCategory) => {
        setCatForm({ id: cat.id, name: cat.name, color: cat.color, order: cat.sortOrder, active: cat.isActive });
        setIsCatDialogOpen(true);
    };

    const openEditStation = (stat: HierarchyStation) => {
        setStatForm({ id: stat.id, name: stat.name, capacityLimit: stat.capacityLimit, order: stat.sortOrder, active: stat.isActive, needsQualification: stat.needsQualification });
        setIsStatDialogOpen(true);
    };

    const openEditTemplate = (tmpl: HierarchyTemplate) => {
        const isSplit = !!tmpl.useOpeningHours || !!tmpl.startTime2 || (tmpl.hasOdpo && !tmpl.hasDopo);
        setTmplForm({
            id: tmpl.id, name: tmpl.name,
            shiftType: isSplit ? 'split' : 'full',
            workersNeeded: tmpl.workersNeeded,
            order: tmpl.sortOrder,
            active: tmpl.isActive,
            useOpeningHours: tmpl.useOpeningHours,
            fullStartTime: tmpl.startTime?.substring(0, 5) || '08:00',
            fullEndTime: tmpl.endTime?.substring(0, 5) || '16:00',
            hasDopo: tmpl.hasDopo,
            dopoStartTime: tmpl.startTime?.substring(0, 5) || '08:00',
            dopoEndTime: tmpl.endTime?.substring(0, 5) || '12:00',
            hasOdpo: tmpl.hasOdpo,
            odpoStartTime: tmpl.startTime2?.substring(0, 5) || '13:00',
            odpoEndTime: tmpl.endTime2?.substring(0, 5) || '17:00'
        });
        setIsTmplDialogOpen(true);
    };

    const handleSaveCategory = async () => {
        if (!catForm.name.trim()) return;
        const url = catForm.id ? `http://localhost:8080/api/v1/position-settings/categories/${catForm.id}` : 'http://localhost:8080/api/v1/position-settings/categories';
        try {
            const response = await fetch(url, {
                method: catForm.id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name: catForm.name, hexColor: catForm.color, sortOrder: catForm.order, isActive: catForm.active })
            });
            if (!response.ok) {
                const errText = await response.text();
                alert(`Chyba uložení kategorie: ${response.status} - ${errText}`);
                return;
            }
            setIsCatDialogOpen(false); await fetchHierarchy();
        } catch (error) { console.error(error); }
    };

    const handleSaveStation = async () => {
        if (!statForm.name.trim() || !selectedCatId) return;
        const url = statForm.id ? `http://localhost:8080/api/v1/position-settings/stations/${statForm.id}` : 'http://localhost:8080/api/v1/position-settings/stations';
        try {
            const response = await fetch(url, {
                method: statForm.id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name: statForm.name, categoryId: selectedCatId, capacityLimit: statForm.capacityLimit, sortOrder: statForm.order, isActive: statForm.active, needsQualification: statForm.needsQualification })
            });
            if (!response.ok) {
                const errText = await response.text();
                alert(`Chyba uložení stanoviště: ${response.status} - ${errText}`);
                return;
            }
            setIsStatDialogOpen(false); await fetchHierarchy();
        } catch (error) { console.error(error); }
    };

    const handleSaveTemplate = async () => {
        if (!tmplForm.name.trim() || !selectedStatId) return;
        const url = tmplForm.id ? `http://localhost:8080/api/v1/position-settings/templates/${tmplForm.id}` : 'http://localhost:8080/api/v1/position-settings/templates';

        const payload: TemplatePayload = {
            name: tmplForm.name,
            stationId: selectedStatId,
            workersNeeded: tmplForm.workersNeeded,
            sortOrder: tmplForm.order,
            isActive: tmplForm.active,
            useOpeningHours: tmplForm.shiftType === 'split' ? tmplForm.useOpeningHours : false,
            hasDopo: tmplForm.shiftType === 'split' ? tmplForm.hasDopo : true,
            hasOdpo: tmplForm.shiftType === 'split' ? tmplForm.hasOdpo : false,
        };

        if (tmplForm.shiftType === 'full') {
            payload.startTime = formatTimeForServer(tmplForm.fullStartTime);
            payload.endTime = formatTimeForServer(tmplForm.fullEndTime);
        } else if (!tmplForm.useOpeningHours) {
            if (tmplForm.hasDopo) {
                payload.startTime = formatTimeForServer(tmplForm.dopoStartTime);
                payload.endTime = formatTimeForServer(tmplForm.dopoEndTime);
            }
            if (tmplForm.hasOdpo) {
                payload.startTime2 = formatTimeForServer(tmplForm.odpoStartTime);
                payload.endTime2 = formatTimeForServer(tmplForm.odpoEndTime);
            }
        }

        try {
            const response = await fetch(url, {
                method: tmplForm.id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errText = await response.text();
                alert(`Chyba uložení šablony: ${response.status} - ${errText}`);
                return;
            }
            setIsTmplDialogOpen(false); await fetchHierarchy();
        } catch (error) { console.error(error); }
    };

    const executeDeleteOrDeactivate = async (action: 'deactivate' | 'hard_delete') => {
        if (!deleteDialog.id) return;
        try {
            if (deleteDialog.type === 'season') {
                await fetch(`http://localhost:8080/api/v1/operating-hours/seasons/${deleteDialog.id}`, { method: 'DELETE', credentials: 'include' });
            } else {
                const endpoint = deleteDialog.type === 'category' ? 'categories' : (deleteDialog.type === 'station' ? 'stations' : 'templates');
                const url = `http://localhost:8080/api/v1/position-settings/${endpoint}/${deleteDialog.id}`;

                if (action === 'hard_delete') {
                    await fetch(url, { method: 'DELETE', credentials: 'include' });
                } else {
                    let payload: DeactivationPayload = { isActive: false };
                    if (deleteDialog.type === 'category') payload = { name: deleteDialog.name, isActive: false };
                    else if (deleteDialog.type === 'station') payload = { name: deleteDialog.name, categoryId: selectedCatId, isActive: false };
                    else if (deleteDialog.type === 'template') payload = { name: deleteDialog.name, stationId: selectedStatId, isActive: false };
                    await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
                }
            }

            if (deleteDialog.type === 'category') { setSelectedCatId(null); setSelectedStatId(null); }
            else if (deleteDialog.type === 'station') { setSelectedStatId(null); }

            setDeleteDialog({ open: false, type: 'category', id: null, name: '' });
            setDeleteConfirmText('');
            await fetchHierarchy();
            await fetchOperatingHoursData();
        } catch (error) { console.error(error); }
    };

    const handleOpenHoursEdit = () => {
        setHoursForm(standardHours);
        setIsHoursDialogOpen(true);
    };

    const handleOpenPauseEdit = () => {
        setPauseForm(pauseRule);
        setIsPauseDialogOpen(true);
    };

    const handleOpenSeasonEdit = (season?: SeasonMode) => {
        if(season) setSeasonForm({...season});
        else setSeasonForm({ id: null, name: '', startDate: '', endDate: '', dopoStart: '10:00', dopoEnd: '14:00', odpoStart: '14:00', odpoEnd: '22:00' });
        setIsSeasonDialogOpen(true);
    };

    const handleSaveHours = async () => {
        try {
            await fetch('http://localhost:8080/api/v1/operating-hours/standard', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                body: JSON.stringify(hoursForm)
            });
            setIsHoursDialogOpen(false);
            await fetchOperatingHoursData();
        } catch (err) { console.error(err); }
    };

    const handleSavePause = async () => {
        try {
            await fetch('http://localhost:8080/api/v1/operating-hours/pause-rule', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                body: JSON.stringify({ triggerHours: pauseForm.triggerHours, pauseMinutes: pauseForm.pauseMinutes })
            });
            setIsPauseDialogOpen(false);
            await fetchOperatingHoursData();
        } catch (err) { console.error(err); }
    };

    const handleSaveSeason = async () => {
        if (!seasonForm.name.trim() || !seasonForm.startDate || !seasonForm.endDate) return;
        const method = seasonForm.id ? 'PUT' : 'POST';
        const url = seasonForm.id ? `http://localhost:8080/api/v1/operating-hours/seasons/${seasonForm.id}` : `http://localhost:8080/api/v1/operating-hours/seasons`;
        try {
            await fetch(url, {
                method, headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                body: JSON.stringify(seasonForm)
            });
            setIsSeasonDialogOpen(false);
            await fetchOperatingHoursData();
        } catch (err) { console.error(err); }
    };

    // =======================================================
    // --- FILTROVÁNÍ A STAVY PRO RENDER ---
    // =======================================================

    const visibleCategories = (categories ?? []).filter(c => showInactiveCats || c.isActive);
    const currentCategory = (categories ?? []).find(c => c.id === selectedCatId);

    const stationsRaw = currentCategory?.stations ?? [];
    const visibleStations = stationsRaw.filter(s => showInactiveStats || s.isActive);
    const currentStation = stationsRaw.find(s => s.id === selectedStatId);

    const templatesRaw = currentStation?.templates ?? [];
    const visibleTemplates = templatesRaw.filter(t => showInactiveTmpls || t.isActive);

    if (loading && (categories ?? []).length === 0) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
    if (errorMessage) return <Box sx={{ p: 5 }}><Alert severity="error">{errorMessage}</Alert></Box>;

    return (
        <Box sx={{ maxWidth: '1400px', mx: 'auto', p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => navigate('/dashboard/shifts')} sx={{ bgcolor: 'rgba(0,0,0,0.05)' }}><ArrowBackIcon /></IconButton>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#3e3535' }}>Nastavení pozic</Typography>
                </Box>
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                    <Tab label="Atrakce a šablony" sx={{ fontWeight: 'bold' }} />
                    <Tab label="Provoz areálu" sx={{ fontWeight: 'bold' }} />
                </Tabs>
            </Box>

            {/* ======================================================= */}
            {/* ZÁLOŽKA 1: ATRAKCE A ŠABLONY */}
            {/* ======================================================= */}
            {activeTab === 0 && (
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} sx={{ alignItems: 'flex-start' }}>

                    {/* 1. KATEGORIE */}
                    <Paper elevation={3} sx={{ borderRadius: 3, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
                        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight="bold">Hlavní Kategorie</Typography>
                            <IconButton onClick={() => setShowInactiveCats(!showInactiveCats)}>
                                {showInactiveCats ? <VisibilityIcon color="primary" /> : <VisibilityOffIcon />}
                            </IconButton>
                        </Box>
                        <Divider />
                        <List sx={{ flexGrow: 1 }}>
                            {visibleCategories.map((cat) => (
                                <ListItem key={cat.id} disablePadding secondaryAction={
                                    <Stack direction="row" spacing={1}>
                                        <IconButton size="small" onClick={() => openEditCategory(cat)}><EditIcon fontSize="small" /></IconButton>
                                        <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, type: 'category', id: cat.id, name: cat.name })}><DeleteIcon fontSize="small" /></IconButton>
                                    </Stack>
                                } sx={{ borderLeft: selectedCatId === cat.id ? `6px solid ${cat.color}` : '6px solid transparent', opacity: cat.isActive ? 1 : 0.5 }}>
                                    <ListItemButton selected={selectedCatId === cat.id} onClick={() => { setSelectedCatId(cat.id); setSelectedStatId(null); }}>
                                        <ListItemText primary={cat.name} secondary={`Pořadí: ${cat.sortOrder}`} primaryTypographyProps={{ fontWeight: selectedCatId === cat.id ? 'bold' : 'normal' }} />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                        <Divider />
                        <Button startIcon={<AddIcon />} sx={{ p: 2, fontWeight: 'bold' }} onClick={() => { setCatForm({ id: null, name: '', color: '#2e7d32', order: visibleCategories.length + 1, active: true }); setIsCatDialogOpen(true); }}>přidat kategorii</Button>
                    </Paper>

                    {/* 2. STANOVIŠTĚ */}
                    <Paper elevation={3} sx={{ borderRadius: 3, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
                        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight="bold">Stanoviště</Typography>
                            <IconButton disabled={!selectedCatId} onClick={() => setShowInactiveStats(!showInactiveStats)}>
                                {showInactiveStats ? <VisibilityIcon color="primary" /> : <VisibilityOffIcon />}
                            </IconButton>
                        </Box>
                        <Divider />
                        <List sx={{ flexGrow: 1 }}>
                            {!selectedCatId ? (
                                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>Vyberte kategorii vlevo.</Box>
                            ) : visibleStations.map((stat) => (
                                <ListItem key={stat.id} disablePadding secondaryAction={
                                    <Stack direction="row" spacing={1}>
                                        <IconButton size="small" onClick={() => openEditStation(stat)}><EditIcon fontSize="small" /></IconButton>
                                        <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, type: 'station', id: stat.id, name: stat.name })}><DeleteIcon fontSize="small" /></IconButton>
                                    </Stack>
                                } sx={{ opacity: stat.isActive ? 1 : 0.5 }}>
                                    <ListItemButton selected={selectedStatId === stat.id} onClick={() => setSelectedStatId(stat.id)}>
                                        <ListItemText primary={stat.name} secondary={`Kapacita: ${stat.capacityLimit}`} />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                        <Divider />
                        <Button startIcon={<AddIcon />} disabled={!selectedCatId} sx={{ p: 2, fontWeight: 'bold' }} onClick={() => { setStatForm({ id: null, name: '', capacityLimit: 1, order: visibleStations.length + 1, active: true, needsQualification: false }); setIsStatDialogOpen(true); }}>přidat stanoviště</Button>
                    </Paper>

                    {/* 3. ŠABLONY */}
                    <Paper elevation={3} sx={{ borderRadius: 3, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '600px', bgcolor: '#f8f9fa' }}>
                        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight="bold">Šablony směn</Typography>
                            <IconButton disabled={!selectedStatId} onClick={() => setShowInactiveTmpls(!showInactiveTmpls)}>
                                {showInactiveTmpls ? <VisibilityIcon color="primary" /> : <VisibilityOffIcon />}
                            </IconButton>
                        </Box>
                        <Divider />
                        <Box sx={{ p: 2, flexGrow: 1 }}>
                            {!selectedStatId ? (
                                <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>Vyberte stanoviště.</Box>
                            ) : visibleTemplates.map((tmpl) => (
                                <Paper key={tmpl.id} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: 'white', opacity: tmpl.isActive ? 1 : 0.5 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography fontWeight="bold">{tmpl.name}</Typography>
                                        <Stack direction="row" spacing={1}>
                                            <IconButton size="small" onClick={() => openEditTemplate(tmpl)}><EditIcon fontSize="small" /></IconButton>
                                            <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, type: 'template', id: tmpl.id, name: tmpl.name })}><DeleteIcon fontSize="small" /></IconButton>
                                        </Stack>
                                    </Box>
                                    <Typography variant="body2" color="textSecondary">
                                        <strong>Čas:</strong> {tmpl.useOpeningHours ? "Dle otevírací doby" : `${tmpl.startTime?.substring(0,5)} - ${tmpl.endTime?.substring(0,5)}`}
                                    </Typography>
                                    {tmpl.useOpeningHours && (
                                        <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold', display: 'block' }}>
                                            → Dnes: {getTodayOpeningHoursText(tmpl.hasDopo, tmpl.hasOdpo)}
                                        </Typography>
                                    )}
                                    <Typography variant="body2" color="textSecondary"><strong>Lidí:</strong> {tmpl.workersNeeded}</Typography>
                                </Paper>
                            ))}
                        </Box>
                        <Divider />
                        <Button startIcon={<AddIcon />} disabled={!selectedStatId} sx={{ p: 2, fontWeight: 'bold' }} onClick={() => { setTmplForm({ id: null, name: '', shiftType: 'full', workersNeeded: 1, order: visibleTemplates.length + 1, active: true, useOpeningHours: false, fullStartTime: '08:00', fullEndTime: '16:00', hasDopo: true, dopoStartTime: '08:00', dopoEndTime: '12:00', hasOdpo: true, odpoStartTime: '13:00', odpoEndTime: '17:00' }); setIsTmplDialogOpen(true); }}>přidat šablonu</Button>
                    </Paper>
                </Stack>
            )}

            {/* ======================================================= */}
            {/* ZÁLOŽKA 2: PROVOZ AREÁLU */}
            {/* ======================================================= */}
            {activeTab === 1 && (
                <Stack spacing={4}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
                        {/* Standardní hodiny */}
                        <Paper elevation={3} sx={{ borderRadius: 3, flex: 1, p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h6" fontWeight="bold"><AccessTimeIcon /> Standardní otevírací doba</Typography>
                                <IconButton onClick={handleOpenHoursEdit}><EditIcon /></IconButton>
                            </Box>
                            <Box sx={{ bgcolor: '#f8f9fa', p: 2, borderRadius: 2, border: '1px solid #eee' }}>
                                <Typography fontWeight="bold" color="primary">Po-Pá:</Typography>
                                <Typography variant="body2">{standardHours.weekDopoStart.substring(0,5)} - {standardHours.weekOdpoEnd.substring(0,5)}</Typography>
                                <Typography fontWeight="bold" color="primary" sx={{ mt: 1 }}>So-Ne:</Typography>
                                <Typography variant="body2">{standardHours.weekendSame ? "Stejné" : `${standardHours.weekendDopoStart.substring(0,5)} - ${standardHours.weekendOdpoEnd.substring(0,5)}`}</Typography>
                            </Box>
                        </Paper>

                        {/* Pauzy */}
                        <Paper elevation={3} sx={{ borderRadius: 3, flex: 1, p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h6" fontWeight="bold"><TimerIcon /> Pravidla pauz</Typography>
                                <IconButton onClick={handleOpenPauseEdit}><EditIcon /></IconButton>
                            </Box>
                            <Box sx={{ textAlign: 'center', p: 2 }}>
                                <Typography variant="h4" color="primary" fontWeight="bold">{pauseRule.pauseMinutes} min</Typography>
                                <Typography variant="body2">Po {pauseRule.triggerHours} hodinách práce</Typography>
                            </Box>
                        </Paper>
                    </Stack>

                    {/* Sezóny */}
                    <Paper elevation={3} sx={{ borderRadius: 3, p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6" fontWeight="bold"><EventNoteIcon /> Sezónní režimy</Typography>
                            <Button startIcon={<AddIcon />} variant="contained" sx={{ bgcolor: '#3e3535' }} onClick={() => handleOpenSeasonEdit()}>Nová sezóna</Button>
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                            {seasons.map(s => (
                                <Paper key={s.id} variant="outlined" sx={{ p: 2, bgcolor: '#f3f8fd' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography fontWeight="bold">{s.name}</Typography>
                                        <Stack direction="row">
                                            <IconButton size="small" onClick={() => handleOpenSeasonEdit(s)}><EditIcon fontSize="small" /></IconButton>
                                            <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, type: 'season', id: s.id, name: s.name })}><DeleteIcon fontSize="small" /></IconButton>
                                        </Stack>
                                    </Box>
                                    <Chip icon={<EventNoteIcon />} label={`${s.startDate} - ${s.endDate}`} size="small" sx={{ mt: 1, alignSelf: 'flex-start', bgcolor: 'white', fontWeight: 'bold' }} />
                                </Paper>
                            ))}
                        </Box>
                    </Paper>
                </Stack>
            )}

            {/* ======================================================= */}
            {/* DIALOGY (KATEGORIE / STANOVIŠTĚ / ŠABLONY) */}
            {/* ======================================================= */}

            {/* Mazání */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ ...deleteDialog, open: false })} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ color: '#d32f2f', fontWeight: 'bold' }}><WarningIcon /> Odstranění položky</DialogTitle>
                <DialogContent>
                    <Typography>Smazat: <strong>{deleteDialog.name}</strong>?</Typography>
                    <Alert severity="warning" sx={{ mt: 2 }}>Smazáním z databáze dojde k nevratnému odstranění i historických dat.</Alert>
                    <TextField fullWidth size="small" label="Napište SMAZAT" sx={{ mt: 2 }} value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}>Zrušit</Button>
                    <Button color="error" variant="contained" disabled={deleteConfirmText !== 'SMAZAT'} onClick={() => void executeDeleteOrDeactivate('hard_delete')}>Trvale smazat</Button>
                    <Button color="success" variant="contained" onClick={() => void executeDeleteOrDeactivate('deactivate')}>Pouze deaktivovat</Button>
                </DialogActions>
            </Dialog>

            {/* Editace Kategorie */}
            <Dialog open={isCatDialogOpen} onClose={() => setIsCatDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>{catForm.id ? 'Upravit' : 'Nová'} kategorie</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    <TextField fullWidth label="Název" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} />
                    <input type="color" value={catForm.color} onChange={e => setCatForm({ ...catForm, color: e.target.value })} style={{ width: '100%', height: 40 }} />
                    <Stack direction="row" spacing={2}>
                        <TextField label="Pořadí" type="number" value={catForm.order} onChange={e => setCatForm({ ...catForm, order: Number(e.target.value) })} />
                        <FormControlLabel control={<Switch checked={catForm.active} onChange={e => setCatForm({ ...catForm, active: e.target.checked })} />} label="Aktivní" />
                    </Stack>
                </DialogContent>
                <DialogActions><Button onClick={() => setIsCatDialogOpen(false)}>Zrušit</Button><Button variant="contained" onClick={handleSaveCategory}>Uložit</Button></DialogActions>
            </Dialog>

            {/* Editace Stanoviště */}
            <Dialog open={isStatDialogOpen} onClose={() => setIsStatDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>{statForm.id ? 'Upravit' : 'Nové'} stanoviště</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    <TextField fullWidth label="Název" value={statForm.name} onChange={e => setStatForm({ ...statForm, name: e.target.value })} />
                    <Stack direction="row" spacing={2}>
                        <TextField label="Kapacita" type="number" value={statForm.capacityLimit} onChange={e => setStatForm({ ...statForm, capacityLimit: Number(e.target.value) })} />
                        <TextField label="Pořadí" type="number" value={statForm.order} onChange={e => setStatForm({ ...statForm, order: Number(e.target.value) })} />
                    </Stack>
                    <FormControlLabel control={<Switch checked={statForm.active} onChange={e => setStatForm({ ...statForm, active: e.target.checked })} />} label="Aktivní" />
                    <FormControlLabel control={<Switch checked={statForm.needsQualification} onChange={e => setStatForm({ ...statForm, needsQualification: e.target.checked })} />} label="Potřeba kvalifikace" />
                </DialogContent>
                <DialogActions><Button onClick={() => setIsStatDialogOpen(false)}>Zrušit</Button><Button variant="contained" onClick={handleSaveStation}>Uložit</Button></DialogActions>
            </Dialog>

            {/* Editace Šablony */}
            <Dialog open={isTmplDialogOpen} onClose={() => setIsTmplDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>{tmplForm.id ? 'Upravit' : 'Nová'} šablona</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    <TextField fullWidth label="Název" value={tmplForm.name} onChange={e => setTmplForm({ ...tmplForm, name: e.target.value })} />
                    <RadioGroup row value={tmplForm.shiftType} onChange={e => setTmplForm({ ...tmplForm, shiftType: e.target.value as 'full' | 'split' })}>
                        <FormControlLabel value="full" control={<Radio />} label="V kuse" />
                        <FormControlLabel value="split" control={<Radio />} label="Dělená" />
                    </RadioGroup>
                    <Stack direction="row" spacing={2}>
                        <TextField label="Lidí" type="number" value={tmplForm.workersNeeded} onChange={e => setTmplForm({ ...tmplForm, workersNeeded: Number(e.target.value) })} />
                        <FormControlLabel control={<Switch checked={tmplForm.active} onChange={e => setTmplForm({ ...tmplForm, active: e.target.checked })} />} label="Aktivní" />
                    </Stack>
                    {tmplForm.shiftType === 'full' ? (
                        <Stack direction="row" spacing={2}>
                            <TextField label="Od" type="time" fullWidth value={tmplForm.fullStartTime} onChange={e => setTmplForm({ ...tmplForm, fullStartTime: e.target.value })} InputLabelProps={{ shrink: true }} />
                            <TextField label="Do" type="time" fullWidth value={tmplForm.fullEndTime} onChange={e => setTmplForm({ ...tmplForm, fullEndTime: e.target.value })} InputLabelProps={{ shrink: true }} />
                        </Stack>
                    ) : (
                        <Box sx={{ border: '1px solid #90caf9', borderRadius: 2, p: 2, bgcolor: '#f3f8fd', display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <FormControlLabel control={<Switch checked={tmplForm.useOpeningHours} onChange={e => setTmplForm({ ...tmplForm, useOpeningHours: e.target.checked })} />} label="Generovat podle otevírací doby areálu" />
                            <Box sx={{ opacity: tmplForm.hasDopo ? 1 : 0.5 }}>
                                <FormControlLabel control={<Checkbox checked={tmplForm.hasDopo} onChange={e => setTmplForm({ ...tmplForm, hasDopo: e.target.checked })} />} label={<Typography fontWeight="bold">Dopoledne</Typography>} />
                                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                                    <TextField disabled={!tmplForm.hasDopo || tmplForm.useOpeningHours} label="Od" type="time" fullWidth size="small" value={tmplForm.dopoStartTime} onChange={e => setTmplForm({ ...tmplForm, dopoStartTime: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ bgcolor: (tmplForm.hasDopo && !tmplForm.useOpeningHours) ? 'white' : 'transparent' }} />
                                    <TextField disabled={!tmplForm.hasDopo || tmplForm.useOpeningHours} label="Do" type="time" fullWidth size="small" value={tmplForm.dopoEndTime} onChange={e => setTmplForm({ ...tmplForm, dopoEndTime: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ bgcolor: (tmplForm.hasDopo && !tmplForm.useOpeningHours) ? 'white' : 'transparent' }} />
                                </Stack>
                            </Box>
                            <Divider />
                            <Box sx={{ opacity: tmplForm.hasOdpo ? 1 : 0.5 }}>
                                <FormControlLabel control={<Checkbox checked={tmplForm.hasOdpo} onChange={e => setTmplForm({ ...tmplForm, hasOdpo: e.target.checked })} />} label={<Typography fontWeight="bold">Odpoledne</Typography>} />
                                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                                    <TextField disabled={!tmplForm.hasOdpo || tmplForm.useOpeningHours} label="Od" type="time" fullWidth size="small" value={tmplForm.odpoStartTime} onChange={e => setTmplForm({ ...tmplForm, odpoStartTime: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ bgcolor: (tmplForm.hasOdpo && !tmplForm.useOpeningHours) ? 'white' : 'transparent' }} />
                                    <TextField disabled={!tmplForm.hasOdpo || tmplForm.useOpeningHours} label="Do" type="time" fullWidth size="small" value={tmplForm.odpoEndTime} onChange={e => setTmplForm({ ...tmplForm, odpoEndTime: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ bgcolor: (tmplForm.hasOdpo && !tmplForm.useOpeningHours) ? 'white' : 'transparent' }} />
                                </Stack>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions><Button onClick={() => setIsTmplDialogOpen(false)}>Zrušit</Button><Button variant="contained" onClick={handleSaveTemplate}>Uložit</Button></DialogActions>
            </Dialog>

            {/* Dialogy pro Otevírací dobu, Pauzy a Sezóny */}
            <Dialog open={isHoursDialogOpen} onClose={() => setIsHoursDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 'bold' }}>Nastavení otevírací doby</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                    <Box>
                        <Typography fontWeight="bold" color="primary" mb={1}>Týden (Po-Pá)</Typography>
                        <Stack direction="row" spacing={2} mb={2}>
                            <TextField label="Dopo od" type="time" size="small" value={hoursForm.weekDopoStart?.substring(0,5) || ''} onChange={e => setHoursForm({...hoursForm, weekDopoStart: formatTimeForServer(e.target.value) || ''})} InputLabelProps={{ shrink: true }} />
                            <TextField label="Dopo do" type="time" size="small" value={hoursForm.weekDopoEnd?.substring(0,5) || ''} onChange={e => setHoursForm({...hoursForm, weekDopoEnd: formatTimeForServer(e.target.value) || ''})} InputLabelProps={{ shrink: true }} />
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <TextField label="Odpo od" type="time" size="small" value={hoursForm.weekOdpoStart?.substring(0,5) || ''} onChange={e => setHoursForm({...hoursForm, weekOdpoStart: formatTimeForServer(e.target.value) || ''})} InputLabelProps={{ shrink: true }} />
                            <TextField label="Odpo do" type="time" size="small" value={hoursForm.weekOdpoEnd?.substring(0,5) || ''} onChange={e => setHoursForm({...hoursForm, weekOdpoEnd: formatTimeForServer(e.target.value) || ''})} InputLabelProps={{ shrink: true }} />
                        </Stack>
                    </Box>
                    <Divider />
                    <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography fontWeight="bold" color="primary">Víkend (So-Ne)</Typography>
                            <FormControlLabel control={<Switch size="small" checked={hoursForm.weekendSame} onChange={e => setHoursForm({...hoursForm, weekendSame: e.target.checked})} />} label="Stejné jako v týdnu" />
                        </Stack>
                        <Box sx={{ opacity: hoursForm.weekendSame ? 0.5 : 1, pointerEvents: hoursForm.weekendSame ? 'none' : 'auto' }}>
                            <Stack direction="row" spacing={2} mb={2}>
                                <TextField label="Dopo od" type="time" size="small" value={hoursForm.weekendSame ? (hoursForm.weekDopoStart?.substring(0,5) || '') : (hoursForm.weekendDopoStart?.substring(0,5) || '')} onChange={e => setHoursForm({...hoursForm, weekendDopoStart: formatTimeForServer(e.target.value) || ''})} InputLabelProps={{ shrink: true }} />
                                <TextField label="Dopo do" type="time" size="small" value={hoursForm.weekendSame ? (hoursForm.weekDopoEnd?.substring(0,5) || '') : (hoursForm.weekendDopoEnd?.substring(0,5) || '')} onChange={e => setHoursForm({...hoursForm, weekendDopoEnd: formatTimeForServer(e.target.value) || ''})} InputLabelProps={{ shrink: true }} />
                            </Stack>
                            <Stack direction="row" spacing={2}>
                                <TextField label="Odpo od" type="time" size="small" value={hoursForm.weekendSame ? (hoursForm.weekOdpoStart?.substring(0,5) || '') : (hoursForm.weekendOdpoStart?.substring(0,5) || '')} onChange={e => setHoursForm({...hoursForm, weekendOdpoStart: formatTimeForServer(e.target.value) || ''})} InputLabelProps={{ shrink: true }} />
                                <TextField label="Odpo do" type="time" size="small" value={hoursForm.weekendSame ? (hoursForm.weekOdpoEnd?.substring(0,5) || '') : (hoursForm.weekendOdpoEnd?.substring(0,5) || '')} onChange={e => setHoursForm({...hoursForm, weekendOdpoEnd: formatTimeForServer(e.target.value) || ''})} InputLabelProps={{ shrink: true }} />
                            </Stack>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions><Button onClick={() => setIsHoursDialogOpen(false)}>Zrušit</Button><Button variant="contained" onClick={handleSaveHours}>Uložit</Button></DialogActions>
            </Dialog>

            <Dialog open={isPauseDialogOpen} onClose={() => setIsPauseDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 'bold' }}>Pravidla pauz</DialogTitle>
                <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField label="Nárok na pauzu po (hodin)" type="number" fullWidth value={pauseForm.triggerHours} onChange={e => setPauseForm({...pauseForm, triggerHours: Number(e.target.value)})} />
                    <TextField label="Délka pauzy (minut)" type="number" fullWidth value={pauseForm.pauseMinutes} onChange={e => setPauseForm({...pauseForm, pauseMinutes: Number(e.target.value)})} />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setIsPauseDialogOpen(false)} color="inherit">ZRUŠIT</Button>
                    <Button variant="contained" onClick={handleSavePause} sx={{ bgcolor: '#3e3535' }}>ULOŽIT</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={isSeasonDialogOpen} onClose={() => setIsSeasonDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 'bold' }}>{seasonForm.id ? 'Úprava sezónního režimu' : 'Nový sezónní režim'}</DialogTitle>
                <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField label="Název režimu (např. Halloween)" fullWidth value={seasonForm.name} onChange={e => setSeasonForm({...seasonForm, name: e.target.value})} />
                    <Stack direction="row" spacing={2}>
                        <TextField label="Platnost od" type="date" fullWidth value={seasonForm.startDate} onChange={e => setSeasonForm({...seasonForm, startDate: e.target.value})} InputLabelProps={{ shrink: true }} />
                        <TextField label="Platnost do" type="date" fullWidth value={seasonForm.endDate} onChange={e => setSeasonForm({...seasonForm, endDate: e.target.value})} InputLabelProps={{ shrink: true }} />
                    </Stack>
                    <Divider><Chip label="Otevírací doba v tomto období" size="small" /></Divider>
                    <Stack direction="row" spacing={2}>
                        <TextField label="Dopo od" type="time" fullWidth size="small" value={seasonForm.dopoStart?.substring(0,5) || ''} onChange={e => setSeasonForm({...seasonForm, dopoStart: formatTimeForServer(e.target.value) || ''})} InputLabelProps={{ shrink: true }} />
                        <TextField label="Dopo do" type="time" fullWidth size="small" value={seasonForm.dopoEnd?.substring(0,5) || ''} onChange={e => setSeasonForm({...seasonForm, dopoEnd: formatTimeForServer(e.target.value) || ''})} InputLabelProps={{ shrink: true }} />
                    </Stack>
                    <Stack direction="row" spacing={2}>
                        <TextField label="Odpo od" type="time" fullWidth size="small" value={seasonForm.odpoStart?.substring(0,5) || ''} onChange={e => setSeasonForm({...seasonForm, odpoStart: formatTimeForServer(e.target.value) || ''})} InputLabelProps={{ shrink: true }} />
                        <TextField label="Odpo do" type="time" fullWidth size="small" value={seasonForm.odpoEnd?.substring(0,5) || ''} onChange={e => setSeasonForm({...seasonForm, odpoEnd: formatTimeForServer(e.target.value) || ''})} InputLabelProps={{ shrink: true }} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setIsSeasonDialogOpen(false)} color="inherit">ZRUŠIT</Button>
                    <Button variant="contained" onClick={handleSaveSeason} sx={{ bgcolor: '#3e3535' }}>ULOŽIT</Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default PositionsSettingsPage;