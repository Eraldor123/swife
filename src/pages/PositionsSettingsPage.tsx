import React, { useState, useEffect } from 'react';
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

// --- ROZHRANÍ (INTERFACES) ---
interface Template {
    id: number; name: string; timeRange?: string; startTime?: string; endTime?: string;
    startTime2?: string; endTime2?: string; workersNeeded: number; isActive?: boolean; sortOrder?: number;
    useOpeningHours?: boolean; hasDopo?: boolean; hasOdpo?: boolean;
}
interface Station {
    id: number; name: string; templates: Template[]; isActive?: boolean;
    capacityLimit?: number; needsQualification?: boolean; sortOrder?: number;
}
interface Category {
    id: number; name: string; color: string; sortOrder?: number; isActive?: boolean; stations: Station[];
}
interface DeactivationPayload {
    name?: string; hexColor?: string; isActive: boolean; categoryId?: number | null;
    stationId?: number | null; workersNeeded?: number; startTime?: string; endTime?: string; sortOrder?: number;
}
interface SeasonMode {
    id: number | null; name: string; startDate: string; endDate: string;
    dopoStart: string; dopoEnd: string; odpoStart: string; odpoEnd: string;
}

// PŘIDÁNO: Typová definice pro ukládání šablony
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
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
    const [selectedStatId, setSelectedStatId] = useState<number | null>(null);

    const [showInactiveCats, setShowInactiveCats] = useState(false);
    const [showInactiveStats, setShowInactiveStats] = useState(false);
    const [showInactiveTmpls, setShowInactiveTmpls] = useState(false);

    const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
    const [isStatDialogOpen, setIsStatDialogOpen] = useState(false);
    const [isTmplDialogOpen, setIsTmplDialogOpen] = useState(false);

    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean, type: 'category' | 'station' | 'template' | 'season', id: number | null, name: string }>({ open: false, type: 'category', id: null, name: '' });
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

    // --- NAČÍTÁNÍ DAT ZE SERVERU ---
    const fetchHierarchy = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/v1/position-settings/hierarchy', {
                headers: { 'Cache-Control': 'no-cache', 'Accept': 'application/json' },
                credentials: 'include'
            });

            if (response.ok) {
                // Definujeme, že data obsahují pole kategorií podle našeho rozhraní
                const data: { categories: Category[] } = await response.json();

                // Sanitizace s využitím konkrétních typů Category a Station
                const sanitizedCategories: Category[] = (data.categories || []).map((cat: Category) => ({
                    ...cat,
                    // Zajišťujeme, že stations je pole, a mapujeme každé stanoviště
                    stations: (cat.stations || []).map((stat: Station) => ({
                        ...stat,
                        // Zajišťujeme, že templates je pole (využívá interface Template)
                        templates: stat.templates || []
                    }))
                }));

                setCategories(sanitizedCategories);
                setErrorMessage(null);
            } else {
                throw new Error("Přístup odepřen nebo API není dostupné.");
            }
        } catch (error) {
            console.error("Chyba při načítání hierarchie:", error);
            setErrorMessage("Nepodařilo se připojit k serveru.");
        }
    };

    const fetchOperatingHoursData = async () => {
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
    };

    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            await fetchHierarchy();
            await fetchOperatingHoursData();
            setLoading(false);
        };
        void loadAll();
    }, []);

    const formatTime = (timeStr?: string): string | undefined => {
        if (!timeStr) return undefined;
        if (timeStr.length === 5) return `${timeStr}:00`;
        return timeStr;
    }

    const getTodayOpeningHoursText = (hasDopo?: boolean, hasOdpo?: boolean) => {
        const today = new Date();
        const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
        const activeSeason = seasons.find(s => s.startDate <= todayStr && s.endDate >= todayStr);

        let dopoStr = "";
        let odpoStr = "";

        if (activeSeason) {
            dopoStr = `${activeSeason.dopoStart?.substring(0, 5)} - ${activeSeason.dopoEnd?.substring(0, 5)}`;
            odpoStr = `${activeSeason.odpoStart?.substring(0, 5)} - ${activeSeason.odpoEnd?.substring(0, 5)}`;
        } else {
            const isWeekend = today.getDay() === 0 || today.getDay() === 6;
            if (isWeekend && !standardHours.weekendSame) {
                dopoStr = `${standardHours.weekendDopoStart?.substring(0, 5)} - ${standardHours.weekendDopoEnd?.substring(0, 5)}`;
                odpoStr = `${standardHours.weekendOdpoStart?.substring(0, 5)} - ${standardHours.weekendOdpoEnd?.substring(0, 5)}`;
            } else {
                dopoStr = `${standardHours.weekDopoStart?.substring(0, 5)} - ${standardHours.weekDopoEnd?.substring(0, 5)}`;
                odpoStr = `${standardHours.weekOdpoStart?.substring(0, 5)} - ${standardHours.weekOdpoEnd?.substring(0, 5)}`;
            }
        }

        if (hasDopo && hasOdpo) return `${dopoStr} a ${odpoStr}`;
        if (hasDopo) return dopoStr;
        if (hasOdpo) return odpoStr;
        return "";
    };

    const openEditCategory = (cat: Category) => { setCatForm({ id: cat.id, name: cat.name, color: cat.color || '#2e7d32', order: cat.sortOrder || 1, active: cat.isActive !== false }); setIsCatDialogOpen(true); };
    const openEditStation = (stat: Station) => { setStatForm({ id: stat.id, name: stat.name, capacityLimit: stat.capacityLimit || 1, order: stat.sortOrder || 1, active: stat.isActive !== false, needsQualification: stat.needsQualification || false }); setIsStatDialogOpen(true); };
    const openEditTemplate = (tmpl: Template) => {
        const isSplit = !!tmpl.useOpeningHours || !!tmpl.startTime2 || (tmpl.hasOdpo && !tmpl.hasDopo);

        setTmplForm({
            id: tmpl.id, name: tmpl.name,
            shiftType: isSplit ? 'split' : 'full',
            workersNeeded: tmpl.workersNeeded,
            order: tmpl.sortOrder || 1,
            active: tmpl.isActive !== false,
            useOpeningHours: !!tmpl.useOpeningHours,
            fullStartTime: !isSplit ? tmpl.startTime?.substring(0, 5) || '08:00' : '08:00',
            fullEndTime: !isSplit ? tmpl.endTime?.substring(0, 5) || '16:00' : '16:00',
            hasDopo: tmpl.hasDopo !== undefined ? tmpl.hasDopo : true,
            dopoStartTime: tmpl.startTime?.substring(0, 5) || '08:00',
            dopoEndTime: tmpl.endTime?.substring(0, 5) || '12:00',
            hasOdpo: tmpl.hasOdpo !== undefined ? tmpl.hasOdpo : !!tmpl.startTime2,
            odpoStartTime: tmpl.startTime2?.substring(0, 5) || '13:00',
            odpoEndTime: tmpl.endTime2?.substring(0, 5) || '17:00'
        });
        setIsTmplDialogOpen(true);
    };

    const handleSaveCategory = async () => {
        if (!catForm.name.trim()) return;
        const method = catForm.id ? 'PUT' : 'POST';
        const url = catForm.id ? `http://localhost:8080/api/v1/position-settings/categories/${catForm.id}` : 'http://localhost:8080/api/v1/position-settings/categories';
        try {
            await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ name: catForm.name, hexColor: catForm.color, sortOrder: Number(catForm.order), isActive: Boolean(catForm.active) }) });
            setIsCatDialogOpen(false); await fetchHierarchy();
        } catch (error) { console.error(error); }
    };

    const handleSaveStation = async () => {
        if (!statForm.name.trim() || !selectedCatId) return;
        const method = statForm.id ? 'PUT' : 'POST';
        const url = statForm.id ? `http://localhost:8080/api/v1/position-settings/stations/${statForm.id}` : 'http://localhost:8080/api/v1/position-settings/stations';
        try {
            await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ name: statForm.name, categoryId: Number(selectedCatId), capacityLimit: Number(statForm.capacityLimit), sortOrder: Number(statForm.order), isActive: Boolean(statForm.active), needsQualification: Boolean(statForm.needsQualification) }) });
            setIsStatDialogOpen(false); await fetchHierarchy();
        } catch (error) { console.error(error); }
    };

    const handleSaveTemplate = async () => {
        if (!tmplForm.name.trim() || !selectedStatId) return;
        const method = tmplForm.id ? 'PUT' : 'POST';
        const url = tmplForm.id ? `http://localhost:8080/api/v1/position-settings/templates/${tmplForm.id}` : 'http://localhost:8080/api/v1/position-settings/templates';

        // POUŽITÍ NOVÉHO TYPU MÍSTO "any"
        const payload: TemplatePayload = {
            name: tmplForm.name,
            stationId: Number(selectedStatId),
            workersNeeded: Number(tmplForm.workersNeeded),
            sortOrder: Number(tmplForm.order),
            isActive: Boolean(tmplForm.active),
            useOpeningHours: tmplForm.shiftType === 'split' ? tmplForm.useOpeningHours : false,
            hasDopo: tmplForm.shiftType === 'split' ? tmplForm.hasDopo : true,
            hasOdpo: tmplForm.shiftType === 'split' ? tmplForm.hasOdpo : false,
        };

        if (tmplForm.shiftType === 'full') {
            payload.startTime = formatTime(tmplForm.fullStartTime);
            payload.endTime = formatTime(tmplForm.fullEndTime);
        } else if (!tmplForm.useOpeningHours) {
            if (tmplForm.hasDopo && tmplForm.hasOdpo) {
                payload.startTime = formatTime(tmplForm.dopoStartTime);
                payload.endTime = formatTime(tmplForm.dopoEndTime);
                payload.startTime2 = formatTime(tmplForm.odpoStartTime);
                payload.endTime2 = formatTime(tmplForm.odpoEndTime);
            }
            else if (tmplForm.hasDopo) {
                payload.startTime = formatTime(tmplForm.dopoStartTime);
                payload.endTime = formatTime(tmplForm.dopoEndTime);
            }
            else if (tmplForm.hasOdpo) {
                payload.startTime = formatTime(tmplForm.odpoStartTime);
                payload.endTime = formatTime(tmplForm.odpoEndTime);
            }
        }

        try {
            await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
            setIsTmplDialogOpen(false); await fetchHierarchy();
        } catch (error) { console.error(error); }
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

    const executeDeleteOrDeactivate = async (action: 'deactivate' | 'hard_delete') => {
        if (!deleteDialog.id) return;
        try {
            if (deleteDialog.type === 'season') {
                await fetch(`http://localhost:8080/api/v1/operating-hours/seasons/${deleteDialog.id}`, { method: 'DELETE', credentials: 'include' });
                setDeleteDialog({ open: false, type: 'category', id: null, name: '' });
                await fetchOperatingHoursData();
                return;
            }

            let endpoint = '';
            if (deleteDialog.type === 'category') endpoint = 'categories';
            else if (deleteDialog.type === 'station') endpoint = 'stations';
            else if (deleteDialog.type === 'template') endpoint = 'templates';

            const url = `http://localhost:8080/api/v1/position-settings/${endpoint}/${deleteDialog.id}`;

            if (action === 'hard_delete') {
                await fetch(url, { method: 'DELETE', credentials: 'include' });
            } else {
                let itemData: DeactivationPayload = { isActive: false };
                if (deleteDialog.type === 'category') itemData = { name: deleteDialog.name, hexColor: '#000000', sortOrder: 1, isActive: false };
                else if (deleteDialog.type === 'station') itemData = { name: deleteDialog.name, categoryId: selectedCatId, sortOrder: 1, isActive: false };
                else if (deleteDialog.type === 'template') itemData = { name: deleteDialog.name, stationId: selectedStatId, workersNeeded: 1, sortOrder: 1, startTime: "08:00:00", endTime: "16:00:00", isActive: false };
                await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(itemData) });
            }

            if (deleteDialog.type === 'category') { setSelectedCatId(null); setSelectedStatId(null); }
            else if (deleteDialog.type === 'station') { setSelectedStatId(null); }
            setDeleteDialog({ open: false, type: 'category', id: null, name: '' }); setDeleteConfirmText('');
            await fetchHierarchy();
        } catch (error) { console.error(error); alert("Akce se nezdařila."); }
    };

    const handleOpenHoursEdit = () => { setHoursForm(standardHours); setIsHoursDialogOpen(true); };
    const handleOpenPauseEdit = () => { setPauseForm(pauseRule); setIsPauseDialogOpen(true); };
    const handleOpenSeasonEdit = (season?: SeasonMode) => {
        if(season) setSeasonForm({...season});
        else setSeasonForm({ id: null, name: '', startDate: '', endDate: '', dopoStart: '10:00', dopoEnd: '14:00', odpoStart: '14:00', odpoEnd: '22:00' });
        setIsSeasonDialogOpen(true);
    };

    const visibleCategories = categories.filter(c => showInactiveCats || c.isActive !== false);
    const currentCategory = categories.find(c => c.id === selectedCatId);
    const stationsRaw = currentCategory?.stations || [];
    const visibleStations = (stationsRaw || []).filter(s => showInactiveStats || s.isActive !== false);
    const currentStation = (stationsRaw || []).find(s => s.id === selectedStatId);
    const templatesRaw = currentStation?.templates || [];
    const visibleTemplates = (templatesRaw || []).filter(t => showInactiveTmpls || t.isActive !== false);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
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
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEditCategory(cat); }}><EditIcon fontSize="small" /></IconButton>
                                        <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, type: 'category', id: cat.id, name: cat.name }); }}><DeleteIcon fontSize="small" /></IconButton>
                                    </Stack>
                                } sx={{ borderLeft: selectedCatId === cat.id ? `6px solid ${cat.color}` : '6px solid transparent', opacity: cat.isActive === false ? 0.5 : 1 }}>
                                    <ListItemButton selected={selectedCatId === cat.id} onClick={() => { setSelectedCatId(cat.id); setSelectedStatId(null); }}>
                                        <ListItemText primary={cat.name} secondary={cat.isActive === false ? "Neaktivní" : `Pořadí: ${cat.sortOrder}`} primaryTypographyProps={{ fontWeight: selectedCatId === cat.id ? 'bold' : 'normal' }} />
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
                            {visibleStations.map((stat) => (
                                <ListItem key={stat.id} disablePadding secondaryAction={
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEditStation(stat); }}><EditIcon fontSize="small" /></IconButton>
                                        <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, type: 'station', id: stat.id, name: stat.name }); }}><DeleteIcon fontSize="small" /></IconButton>
                                    </Stack>
                                } sx={{ opacity: stat.isActive === false ? 0.5 : 1 }}>
                                    <ListItemButton selected={selectedStatId === stat.id} onClick={() => setSelectedStatId(stat.id)}>
                                        <ListItemText primary={stat.name} secondary={stat.isActive === false ? "Neaktivní" : `Kapacita: ${stat.capacityLimit || 1}`} />
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
                            {visibleTemplates.map((tmpl) => (
                                <Paper key={tmpl.id} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: 'white', opacity: tmpl.isActive === false ? 0.5 : 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography fontWeight="bold">
                                            {tmpl.name} {tmpl.isActive === false && <Typography component="span" variant="caption" color="error">(Neaktivní)</Typography>}
                                        </Typography>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <IconButton size="small" onClick={() => openEditTemplate(tmpl)}><EditIcon fontSize="small" /></IconButton>
                                            <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, type: 'template', id: tmpl.id, name: tmpl.name })}><DeleteIcon fontSize="small" /></IconButton>
                                        </Stack>
                                    </Box>

                                    <Box mb={1}>
                                        <Typography variant="body2" color="textSecondary">
                                            <strong>Čas:</strong> {
                                            tmpl.useOpeningHours
                                                ? `Dle otevírací doby (${tmpl.hasDopo && tmpl.hasOdpo ? 'Celý den' : tmpl.hasDopo ? 'Dopoledne' : 'Odpoledne'})`
                                                : (tmpl.timeRange || (tmpl.startTime2 ? `${tmpl.startTime?.substring(0, 5)} - ${tmpl.endTime?.substring(0, 5)} a ${tmpl.startTime2?.substring(0, 5)} - ${tmpl.endTime2?.substring(0, 5)}` : `${tmpl.startTime?.substring(0, 5)} - ${tmpl.endTime?.substring(0, 5)}`))
                                        }
                                        </Typography>
                                        {tmpl.useOpeningHours && (
                                            <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5, fontWeight: 'bold' }}>
                                                → Dnes by to bylo: {getTodayOpeningHoursText(tmpl.hasDopo, tmpl.hasOdpo)}
                                            </Typography>
                                        )}
                                    </Box>

                                    <Typography variant="body2" color="textSecondary"><strong>Lidí:</strong> {tmpl.workersNeeded}</Typography>
                                    <Typography variant="body2" color="textSecondary"><strong>Pořadí:</strong> {tmpl.sortOrder}</Typography>
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

                    {/* HORNÍ ŘADA: Otevírací doba a Pauzy */}
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} sx={{ alignItems: 'stretch' }}>

                        {/* 1. OTEVÍRACÍ DOBA */}
                        <Paper elevation={3} sx={{ borderRadius: 3, flex: 1, p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><AccessTimeIcon /> Standardní otevírací doba</Typography>
                                <IconButton onClick={handleOpenHoursEdit} size="small"><EditIcon /></IconButton>
                            </Box>
                            <Divider sx={{ mb: 3 }} />
                            <Box sx={{ bgcolor: '#f8f9fa', p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                                <Stack direction="row" justifyContent="space-between" mb={2}>
                                    <Box>
                                        <Typography fontWeight="bold" color="primary" mb={1}>Týden (Po-Pá)</Typography>
                                        <Typography variant="body2">Dopoledne: {standardHours.weekDopoStart?.substring(0,5)} - {standardHours.weekDopoEnd?.substring(0,5)}</Typography>
                                        <Typography variant="body2">Odpoledne: {standardHours.weekOdpoStart?.substring(0,5)} - {standardHours.weekOdpoEnd?.substring(0,5)}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography fontWeight="bold" color="primary" mb={1}>Víkend (So-Ne)</Typography>
                                        <Typography variant="body2">Dopoledne: {standardHours.weekendSame ? standardHours.weekDopoStart?.substring(0,5) : standardHours.weekendDopoStart?.substring(0,5)} - {standardHours.weekendSame ? standardHours.weekDopoEnd?.substring(0,5) : standardHours.weekendDopoEnd?.substring(0,5)}</Typography>
                                        <Typography variant="body2">Odpoledne: {standardHours.weekendSame ? standardHours.weekOdpoStart?.substring(0,5) : standardHours.weekendOdpoStart?.substring(0,5)} - {standardHours.weekendSame ? standardHours.weekOdpoEnd?.substring(0,5) : standardHours.weekendOdpoEnd?.substring(0,5)}</Typography>
                                    </Box>
                                </Stack>
                            </Box>
                            {(() => {
                                const today = new Date();
                                const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

                                const activeSeason = seasons.find(s => s.startDate <= todayStr && s.endDate >= todayStr);

                                if (activeSeason) {
                                    return (
                                        <Box sx={{ mt: 3, p: 2, bgcolor: '#fff3e0', borderRadius: 2, border: '1px dashed #ff9800' }}>
                                            <Typography variant="body2" color="warning.dark" fontWeight="bold" mb={1}>
                                                ⚠️ Aktuálně aktivní režim: {activeSeason.name}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary" display="block">
                                                Platí od {activeSeason.startDate} do {activeSeason.endDate}
                                            </Typography>
                                            <Typography variant="caption" color="warning.dark" display="block" sx={{ mt: 0.5 }}>
                                                Dnes je otevřeno: {activeSeason.dopoStart?.substring(0, 5)} - {activeSeason.dopoEnd?.substring(0, 5)} a {activeSeason.odpoStart?.substring(0, 5)} - {activeSeason.odpoEnd?.substring(0, 5)}
                                            </Typography>
                                        </Box>
                                    );
                                } else {
                                    return (
                                        <Box sx={{ mt: 3, p: 2, bgcolor: '#e8f5e9', borderRadius: 2, border: '1px dashed #4caf50' }}>
                                            <Typography variant="body2" color="success.main" fontWeight="bold">
                                                Aktuálně aktivní režim: Žádný (Běžný provoz)
                                            </Typography>
                                        </Box>
                                    );
                                }
                            })()}
                        </Paper>

                        {/* 2. PAUZY */}
                        <Paper elevation={3} sx={{ borderRadius: 3, flex: 1, p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><TimerIcon /> Pravidla pauz</Typography>
                                <IconButton onClick={handleOpenPauseEdit} size="small"><EditIcon /></IconButton>
                            </Box>
                            <Divider sx={{ mb: 3 }} />
                            <Box sx={{ bgcolor: '#f8f9fa', p: 4, borderRadius: 2, border: '1px solid #e0e0e0', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '60%' }}>
                                <Typography variant="h3" color="primary" fontWeight="bold" mb={1}>{pauseRule.pauseMinutes} min</Typography>
                                <Typography variant="subtitle1" fontWeight="bold">Délka povinné pauzy</Typography>
                                <Divider sx={{ my: 3, mx: 'auto', width: '50%' }} />
                                <Typography variant="body2" color="textSecondary">
                                    Pauza se automaticky odečte z docházky, pokud zaměstnanec odpracuje více než <strong>{pauseRule.triggerHours} hodin</strong>.
                                </Typography>
                            </Box>
                        </Paper>
                    </Stack>

                    {/* SPODNÍ ŘADA: Sezónní režimy */}
                    <Paper elevation={3} sx={{ borderRadius: 3, p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><EventNoteIcon /> Sezónní režimy</Typography>
                            <Button startIcon={<AddIcon />} variant="contained" sx={{ bgcolor: '#3e3535' }} onClick={() => handleOpenSeasonEdit()}>Nová sezóna</Button>
                        </Box>
                        <Divider sx={{ mb: 3 }} />

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
                            {seasons.map((season) => (
                                <Paper key={season.id} variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: '#90caf9', bgcolor: '#f3f8fd', display: 'flex', flexDirection: 'column' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography fontWeight="bold" color="primary.dark" variant="subtitle1">{season.name}</Typography>
                                        <Stack direction="row">
                                            <IconButton size="small" onClick={() => handleOpenSeasonEdit(season)}><EditIcon fontSize="small" /></IconButton>
                                            <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, type: 'season', id: season.id, name: season.name })}><DeleteIcon fontSize="small" /></IconButton>
                                        </Stack>
                                    </Box>
                                    <Chip icon={<EventNoteIcon />} label={`${season.startDate} - ${season.endDate}`} size="small" sx={{ mb: 2, alignSelf: 'flex-start', bgcolor: 'white', fontWeight: 'bold' }} />
                                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.7)', p: 1.5, borderRadius: 1 }}>
                                        <Typography variant="body2" color="textSecondary"><strong>Dopo:</strong> {season.dopoStart?.substring(0,5)} - {season.dopoEnd?.substring(0,5)}</Typography>
                                        <Typography variant="body2" color="textSecondary"><strong>Odpo:</strong> {season.odpoStart?.substring(0,5)} - {season.odpoEnd?.substring(0,5)}</Typography>
                                    </Box>
                                </Paper>
                            ))}
                            {seasons.length === 0 && (
                                <Typography color="textSecondary" sx={{ py: 2 }}>Zatím nemáte nastavené žádné speciální sezónní režimy.</Typography>
                            )}
                        </Box>
                    </Paper>

                </Stack>
            )}

            {/* ======================================================= */}
            {/* DIALOGY PRO ZÁLOŽKU 1 */}
            {/* ======================================================= */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ ...deleteDialog, open: false })} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#d32f2f', fontWeight: 'bold' }}>
                    <WarningIcon /> Bezpečné odstranění položky
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" mb={2}>
                        Chystáte se smazat položku: <strong>{deleteDialog.name}</strong>.
                    </Typography>

                    {deleteDialog.type !== 'season' && (
                        <Alert severity="warning" sx={{ mb: 3 }}>
                            <strong>DŮRAZNĚ DOPORUČUJEME POLOŽKU POUZE DEAKTIVOVAT (SKRÝT).</strong>
                            <br />
                            Pokud tuto položku natvrdo smažete z databáze a historicky už na ni byla navázána nějaká směna nebo docházka, systém může smazat i tyto historické záznamy.
                        </Alert>
                    )}

                    <Typography variant="body2" color="textSecondary" mb={1}>
                        Pokud opravdu trváte na tvrdém smazání z databáze, napište slovo <strong>SMAZAT</strong> do pole níže:
                    </Typography>
                    <TextField fullWidth size="small" variant="outlined" placeholder="SMAZAT" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} />
                </DialogContent>
                <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Button onClick={() => { setDeleteDialog({ ...deleteDialog, open: false }); setDeleteConfirmText(''); }} color="inherit">ZRŮŠIT</Button>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button onClick={() => void executeDeleteOrDeactivate('hard_delete')} disabled={deleteConfirmText !== 'SMAZAT'} color="error" variant="outlined">TRVALE SMAZAT</Button>
                        {deleteDialog.type !== 'season' && (
                            <Button onClick={() => void executeDeleteOrDeactivate('deactivate')} variant="contained" color="success">DEAKTIVOVAT</Button>
                        )}
                    </Box>
                </DialogActions>
            </Dialog>

            <Dialog open={isCatDialogOpen} onClose={() => setIsCatDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 'bold' }}>{catForm.id ? 'Úprava kategorie' : 'Přidání nové kategorie'}</DialogTitle>
                <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField fullWidth label="Název kategorie" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} autoFocus />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, border: '1px solid #ccc', borderRadius: 2 }}>
                        <input type="color" value={catForm.color} onChange={e => setCatForm({ ...catForm, color: e.target.value })} style={{ width: 50, height: 50, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
                        <Box><Typography variant="caption" color="textSecondary">Barva (HEX)</Typography><Typography variant="body1" sx={{ fontWeight: 'bold', color: catForm.color }}>{catForm.color.toUpperCase()}</Typography></Box>
                    </Box>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <TextField label="Pořadí" type="number" sx={{ width: 100 }} value={catForm.order} onChange={e => setCatForm({ ...catForm, order: parseInt(e.target.value) || 0 })} />
                        <FormControlLabel control={<Switch checked={catForm.active} onChange={e => setCatForm({ ...catForm, active: e.target.checked })} />} label="Aktivní" />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}><Button onClick={() => setIsCatDialogOpen(false)} color="inherit">ZRUŠIT</Button><Button onClick={handleSaveCategory} variant="contained" sx={{ bgcolor: '#3e3535' }}>ULOŽIT</Button></DialogActions>
            </Dialog>

            <Dialog open={isStatDialogOpen} onClose={() => setIsStatDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 'bold' }}>{statForm.id ? 'Úprava stanoviště' : 'Přidání nového stanoviště'}</DialogTitle>
                <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField fullWidth label="Název stanoviště" value={statForm.name} onChange={e => setStatForm({ ...statForm, name: e.target.value })} autoFocus />
                    <Stack direction="row" spacing={2} alignItems="center">
                        <TextField label="Kapacita" type="number" sx={{ width: 130 }} value={statForm.capacityLimit} onChange={e => setStatForm({ ...statForm, capacityLimit: parseInt(e.target.value) || 1 })} />
                        <TextField label="Pořadí" type="number" sx={{ width: 100 }} value={statForm.order} onChange={e => setStatForm({ ...statForm, order: parseInt(e.target.value) || 0 })} />
                    </Stack>
                    <FormControlLabel control={<Switch checked={statForm.active} onChange={e => setStatForm({ ...statForm, active: e.target.checked })} />} label="Aktivní" />
                    <FormControlLabel control={<Switch checked={statForm.needsQualification} onChange={e => setStatForm({ ...statForm, needsQualification: e.target.checked })} />} label="Potřeba kvalifikace" />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}><Button onClick={() => setIsStatDialogOpen(false)} color="inherit">ZRUŠIT</Button><Button onClick={handleSaveStation} variant="contained" sx={{ bgcolor: '#3e3535' }}>ULOŽIT</Button></DialogActions>
            </Dialog>

            <Dialog open={isTmplDialogOpen} onClose={() => setIsTmplDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 'bold' }}>{tmplForm.id ? 'Úprava Šablony' : 'Nová Šablona Směny'}</DialogTitle>
                <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <TextField fullWidth label="Název šablony" value={tmplForm.name} onChange={e => setTmplForm({ ...tmplForm, name: e.target.value })} autoFocus />
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography fontWeight="bold">Typ směny:</Typography>
                        <RadioGroup row value={tmplForm.shiftType} onChange={e => setTmplForm({ ...tmplForm, shiftType: e.target.value })}>
                            <FormControlLabel value="full" control={<Radio />} label="V kuse" />
                            <FormControlLabel value="split" control={<Radio />} label="Dělená" />
                        </RadioGroup>
                    </Stack>
                    <Stack direction="row" spacing={3} alignItems="center">
                        <TextField label="Pracovníků" type="number" sx={{ width: 120 }} value={tmplForm.workersNeeded} onChange={e => setTmplForm({ ...tmplForm, workersNeeded: parseInt(e.target.value) || 1 })} />
                        <TextField label="Pořadí" type="number" sx={{ width: 100 }} value={tmplForm.order} onChange={e => setTmplForm({ ...tmplForm, order: parseInt(e.target.value) || 0 })} />
                        <FormControlLabel control={<Switch checked={tmplForm.active} onChange={e => setTmplForm({ ...tmplForm, active: e.target.checked })} />} label="Aktivní" />
                    </Stack>
                    {tmplForm.shiftType === 'full' ? (
                        <Stack direction="row" spacing={2}>
                            <TextField label="Od" type="time" fullWidth value={tmplForm.fullStartTime} onChange={e => setTmplForm({ ...tmplForm, fullStartTime: e.target.value })} InputLabelProps={{ shrink: true }} inputProps={{ step: 300 }} />
                            <TextField label="Do" type="time" fullWidth value={tmplForm.fullEndTime} onChange={e => setTmplForm({ ...tmplForm, fullEndTime: e.target.value })} InputLabelProps={{ shrink: true }} inputProps={{ step: 300 }} />
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
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setIsTmplDialogOpen(false)} color="inherit">ZRUŠIT</Button>
                    <Button onClick={handleSaveTemplate} disabled={tmplForm.shiftType === 'split' && !tmplForm.hasDopo && !tmplForm.hasOdpo} variant="contained" sx={{ bgcolor: '#3e3535' }}>ULOŽIT</Button>
                </DialogActions>
            </Dialog>

            {/* ======================================================= */}
            {/* DIALOGY PRO ZÁLOŽKU 2 */}
            {/* ======================================================= */}
            <Dialog open={isHoursDialogOpen} onClose={() => setIsHoursDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 'bold' }}>Nastavení otevírací doby</DialogTitle>
                <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box>
                        <Typography fontWeight="bold" color="primary" mb={1}>Týden (Po-Pá)</Typography>
                        <Stack direction="row" spacing={2} mb={2}>
                            <TextField label="Dopo od" type="time" size="small" value={hoursForm.weekDopoStart?.substring(0,5) || ''} onChange={e => setHoursForm({...hoursForm, weekDopoStart: formatTime(e.target.value) || ''})} InputLabelProps={{ shrink: true }} />
                            <TextField label="Dopo do" type="time" size="small" value={hoursForm.weekDopoEnd?.substring(0,5) || ''} onChange={e => setHoursForm({...hoursForm, weekDopoEnd: formatTime(e.target.value) || ''})} InputLabelProps={{ shrink: true }} />
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <TextField label="Odpo od" type="time" size="small" value={hoursForm.weekOdpoStart?.substring(0,5) || ''} onChange={e => setHoursForm({...hoursForm, weekOdpoStart: formatTime(e.target.value) || ''})} InputLabelProps={{ shrink: true }} />
                            <TextField label="Odpo do" type="time" size="small" value={hoursForm.weekOdpoEnd?.substring(0,5) || ''} onChange={e => setHoursForm({...hoursForm, weekOdpoEnd: formatTime(e.target.value) || ''})} InputLabelProps={{ shrink: true }} />
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
                                <TextField label="Dopo od" type="time" size="small" value={hoursForm.weekendSame ? (hoursForm.weekDopoStart?.substring(0,5) || '') : (hoursForm.weekendDopoStart?.substring(0,5) || '')} onChange={e => setHoursForm({...hoursForm, weekendDopoStart: formatTime(e.target.value) || ''})} InputLabelProps={{ shrink: true }} />
                                <TextField label="Dopo do" type="time" size="small" value={hoursForm.weekendSame ? (hoursForm.weekDopoEnd?.substring(0,5) || '') : (hoursForm.weekendDopoEnd?.substring(0,5) || '')} onChange={e => setHoursForm({...hoursForm, weekendDopoEnd: formatTime(e.target.value) || ''})} InputLabelProps={{ shrink: true }} />
                            </Stack>
                            <Stack direction="row" spacing={2}>
                                <TextField label="Odpo od" type="time" size="small" value={hoursForm.weekendSame ? (hoursForm.weekOdpoStart?.substring(0,5) || '') : (hoursForm.weekendOdpoStart?.substring(0,5) || '')} onChange={e => setHoursForm({...hoursForm, weekendOdpoStart: formatTime(e.target.value) || ''})} InputLabelProps={{ shrink: true }} />
                                <TextField label="Odpo do" type="time" size="small" value={hoursForm.weekendSame ? (hoursForm.weekOdpoEnd?.substring(0,5) || '') : (hoursForm.weekendOdpoEnd?.substring(0,5) || '')} onChange={e => setHoursForm({...hoursForm, weekendOdpoEnd: formatTime(e.target.value) || ''})} InputLabelProps={{ shrink: true }} />
                            </Stack>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setIsHoursDialogOpen(false)} color="inherit">ZRUŠIT</Button>
                    <Button variant="contained" onClick={handleSaveHours} sx={{ bgcolor: '#3e3535' }}>ULOŽIT</Button>
                </DialogActions>
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
                        <TextField label="Dopo od" type="time" fullWidth size="small" value={seasonForm.dopoStart?.substring(0,5) || ''} onChange={e => setSeasonForm({...seasonForm, dopoStart: formatTime(e.target.value) || ''})} InputLabelProps={{ shrink: true }} />
                        <TextField label="Dopo do" type="time" fullWidth size="small" value={seasonForm.dopoEnd?.substring(0,5) || ''} onChange={e => setSeasonForm({...seasonForm, dopoEnd: formatTime(e.target.value) || ''})} InputLabelProps={{ shrink: true }} />
                    </Stack>
                    <Stack direction="row" spacing={2}>
                        <TextField label="Odpo od" type="time" fullWidth size="small" value={seasonForm.odpoStart?.substring(0,5) || ''} onChange={e => setSeasonForm({...seasonForm, odpoStart: formatTime(e.target.value) || ''})} InputLabelProps={{ shrink: true }} />
                        <TextField label="Odpo do" type="time" fullWidth size="small" value={seasonForm.odpoEnd?.substring(0,5) || ''} onChange={e => setSeasonForm({...seasonForm, odpoEnd: formatTime(e.target.value) || ''})} InputLabelProps={{ shrink: true }} />
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