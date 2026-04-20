import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Tabs, Tab, List, ListItem, ListItemButton, ListItemText,
    IconButton, Button, Divider, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, CircularProgress, FormControlLabel, Switch, RadioGroup, Radio, Checkbox, Alert, Chip
} from '@mui/material';
import {
    Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, ArrowBack as ArrowBackIcon,
    Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon, Warning as WarningIcon,
    EventNote as EventNoteIcon, AccessTime as AccessTimeIcon, Timer as TimerIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Technické importy
import apiClient from '../api/axiosConfig';
import { useNotification } from '../context/NotificationContext';
import { isAxiosError } from 'axios';

// STYLY
import {
    pageContainerStyle, headerPaperStyle, titleBoxStyle, columnPaperStyle, scrollBoxStyle,
    templateColumnStyle, columnHeaderStyle, emptyStateStyle, templateItemStyle,
    templateSplitBoxStyle, settingsCardStyle, settingsCardHeaderStyle, hoursInfoBoxStyle,
    pauseInfoBoxStyle, seasonGridStyle, seasonCardStyle, dialogContentStyle, dialogTitleStyle,
    dialogTitleErrorStyle, dialogActionsStyle, sectionTitleStyle, primaryButtonStyle,
    addButtonStyle, lightDividerStyle, modernInputStyle, modernDialogProps,
    ghostButtonStyle, neutralButtonStyle, dangerButtonStyle
} from '../theme/PositionsSettingsStyles';

// TYPY
import type { HierarchyTemplate, HierarchyStation, HierarchyCategory, SeasonMode, DeactivationPayload, TemplatePayload } from '../types/PositionsTypes';
import { INITIAL_CAT_FORM, INITIAL_STAT_FORM, INITIAL_TMPL_FORM, INITIAL_SEASON_FORM } from '../types/PositionsTypes';

// LOGIKA
import { usePositionSettingsLogic } from '../types/usePositionSettingsLogic';

interface BackendError { message?: string; }

const PositionsSettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [activeTab, setActiveTab] = useState(0);

    const {
        loading, errorMessage, categories, standardHours, pauseRule, seasons,
        loadAllData, fetchHierarchy, fetchOperatingHoursData, formatTimeForServer, getTodayOpeningHoursText
    } = usePositionSettingsLogic();

    const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
    const [selectedStatId, setSelectedStatId] = useState<number | null>(null);

    const [showInactiveCats, setShowInactiveCats] = useState(false);
    const [showInactiveStats, setShowInactiveStats] = useState(false);
    const [showInactiveTmpls, setShowInactiveTmpls] = useState(false);
    const [showInactiveSeasons, setShowInactiveSeasons] = useState(false);

    const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
    const [isStatDialogOpen, setIsStatDialogOpen] = useState(false);
    const [isTmplDialogOpen, setIsTmplDialogOpen] = useState(false);

    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean, type: 'category' | 'station' | 'template' | 'season', id: number | null, name: string }>({ open: false, type: 'category', id: null, name: '' });
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const [catForm, setCatForm] = useState(INITIAL_CAT_FORM);
    const [statForm, setStatForm] = useState(INITIAL_STAT_FORM);
    const [tmplForm, setTmplForm] = useState(INITIAL_TMPL_FORM);
    const [hoursForm, setHoursForm] = useState(standardHours);
    const [pauseForm, setPauseForm] = useState(pauseRule);
    const [seasonForm, setSeasonForm] = useState<SeasonMode>(INITIAL_SEASON_FORM);

    const [isHoursDialogOpen, setIsHoursDialogOpen] = useState(false);
    const [isPauseDialogOpen, setIsPauseDialogOpen] = useState(false);
    const [isSeasonDialogOpen, setIsSeasonDialogOpen] = useState(false);

    useEffect(() => { void loadAllData(); }, [loadAllData]);

    const openEditCategory = (cat: HierarchyCategory) => {
        setCatForm({ id: cat.id, name: cat.name, color: cat.color, order: cat.sortOrder, active: cat.isActive });
        setIsCatDialogOpen(true);
    };

    const openEditStation = (stat: HierarchyStation) => {
        setStatForm({
            id: stat.id, name: stat.name, capacityLimit: stat.capacityLimit, order: stat.sortOrder,
            active: stat.isActive, needsQualification: stat.needsQualification, useDefaultSplitTime: !stat.afternoonStartTime,
            afternoonStartTime: stat.afternoonStartTime?.substring(0, 5) || standardHours.weekOdpoStart?.substring(0, 5) || '14:00'
        });
        setIsStatDialogOpen(true);
    };

    const openEditTemplate = (tmpl: HierarchyTemplate) => {
        // OPRAVA 1: Zjednodušení logického výrazu podle linteru
        const isSplit = tmpl.useOpeningHours || !!tmpl.startTime2;
        setTmplForm({
            id: tmpl.id, name: tmpl.name, shiftType: isSplit ? 'split' : 'full', workersNeeded: tmpl.workersNeeded, order: tmpl.sortOrder, active: tmpl.isActive, useOpeningHours: tmpl.useOpeningHours,
            fullStartTime: tmpl.startTime?.substring(0, 5) || '08:00', fullEndTime: tmpl.endTime?.substring(0, 5) || '16:00', hasDopo: tmpl.hasDopo, dopoStartTime: tmpl.startTime?.substring(0, 5) || '08:00', dopoEndTime: tmpl.endTime?.substring(0, 5) || '12:00',
            hasOdpo: tmpl.hasOdpo, odpoStartTime: tmpl.startTime2?.substring(0, 5) || '13:00', odpoEndTime: tmpl.endTime2?.substring(0, 5) || '17:00'
        });
        setIsTmplDialogOpen(true);
    };

    const handleSaveCategory = async () => {
        if (!catForm.name.trim()) return;
        const url = catForm.id ? `/position-settings/categories/${catForm.id}` : `/position-settings/categories`;
        try {
            const payload = { name: catForm.name, hexColor: catForm.color, sortOrder: catForm.order, isActive: catForm.active };
            if (catForm.id) await apiClient.put(url, payload); else await apiClient.post(url, payload);
            showNotification('Kategorie úspěšně uložena', 'success');
            setIsCatDialogOpen(false); await fetchHierarchy();
        } catch (error: unknown) {
            const msg = isAxiosError(error) ? (error.response?.data as BackendError)?.message : 'Chyba serveru';
            showNotification(msg || 'Chyba při ukládání kategorie', 'error');
        }
    };

    const handleSaveStation = async () => {
        if (!statForm.name.trim() || !selectedCatId) return;
        const url = statForm.id ? `/position-settings/stations/${statForm.id}` : `/position-settings/stations`;
        try {
            const payload = { name: statForm.name, categoryId: selectedCatId, capacityLimit: statForm.capacityLimit, sortOrder: statForm.order, isActive: statForm.active, needsQualification: statForm.needsQualification, afternoonStartTime: statForm.useDefaultSplitTime ? null : formatTimeForServer(statForm.afternoonStartTime) };
            if (statForm.id) await apiClient.put(url, payload); else await apiClient.post(url, payload);
            showNotification('Stanoviště úspěšně uloženo', 'success');
            setIsStatDialogOpen(false); await fetchHierarchy();
        } catch (error: unknown) {
            const msg = isAxiosError(error) ? (error.response?.data as BackendError)?.message : 'Chyba serveru';
            showNotification(msg || 'Chyba při ukládání stanoviště', 'error');
        }
    };

    const handleSaveTemplate = async () => {
        if (!tmplForm.name.trim() || !selectedStatId) return;
        const url = tmplForm.id ? `/position-settings/templates/${tmplForm.id}` : `/position-settings/templates`;
        const payload: TemplatePayload = { name: tmplForm.name, stationId: selectedStatId, workersNeeded: tmplForm.workersNeeded, sortOrder: tmplForm.order, isActive: tmplForm.active, useOpeningHours: tmplForm.shiftType === 'split' ? tmplForm.useOpeningHours : false, hasDopo: tmplForm.shiftType === 'split' ? tmplForm.hasDopo : true, hasOdpo: tmplForm.shiftType === 'split' ? tmplForm.hasOdpo : false };
        if (tmplForm.shiftType === 'full') { payload.startTime = formatTimeForServer(tmplForm.fullStartTime); payload.endTime = formatTimeForServer(tmplForm.fullEndTime); }
        else if (!tmplForm.useOpeningHours) {
            if (tmplForm.hasDopo) { payload.startTime = formatTimeForServer(tmplForm.dopoStartTime); payload.endTime = formatTimeForServer(tmplForm.dopoEndTime); }
            if (tmplForm.hasOdpo) { payload.startTime2 = formatTimeForServer(tmplForm.odpoStartTime); payload.endTime2 = formatTimeForServer(tmplForm.odpoEndTime); }
        }
        try {
            if (tmplForm.id) await apiClient.put(url, payload); else await apiClient.post(url, payload);
            showNotification('Šablona úspěšně uložena', 'success');
            setIsTmplDialogOpen(false); await fetchHierarchy();
        } catch (error: unknown) {
            const msg = isAxiosError(error) ? (error.response?.data as BackendError)?.message : 'Chyba serveru';
            showNotification(msg || 'Chyba při ukládání šablony', 'error');
        }
    };

    const executeDeleteOrDeactivate = async (action: 'deactivate' | 'hard_delete') => {
        if (!deleteDialog.id) return;
        try {
            if (deleteDialog.type === 'season') {
                const url = `/operating-hours/seasons/${deleteDialog.id}`;
                if (action === 'hard_delete') { await apiClient.delete(url); } else {
                    const sToDeactivate = seasons.find(s => s.id === deleteDialog.id);
                    if (sToDeactivate) await apiClient.put(url, { ...sToDeactivate, isActive: false });
                }
            } else {
                const endpoint = deleteDialog.type === 'category' ? 'categories' : (deleteDialog.type === 'station' ? 'stations' : 'templates');
                const url = `/position-settings/${endpoint}/${deleteDialog.id}`;
                if (action === 'hard_delete') { await apiClient.delete(url); } else {
                    let payload: DeactivationPayload = { isActive: false };
                    if (deleteDialog.type === 'category') payload = { name: deleteDialog.name, isActive: false };
                    else if (deleteDialog.type === 'station') payload = { name: deleteDialog.name, categoryId: selectedCatId, isActive: false };
                    else if (deleteDialog.type === 'template') payload = { name: deleteDialog.name, stationId: selectedStatId, isActive: false };
                    await apiClient.put(url, payload);
                }
            }
            showNotification('Akce proběhla úspěšně', 'success');
            if (deleteDialog.type === 'category') { setSelectedCatId(null); setSelectedStatId(null); }
            else if (deleteDialog.type === 'station') { setSelectedStatId(null); }
            setDeleteDialog({ open: false, type: 'category', id: null, name: '' }); setDeleteConfirmText(''); await fetchHierarchy(); await fetchOperatingHoursData();
        } catch (error: unknown) {
            const msg = isAxiosError(error) ? (error.response?.data as BackendError)?.message : 'Chyba serveru';
            showNotification(msg || 'Nepodařilo se smazat položku', 'error');
        }
    };

    const handleOpenHoursEdit = () => { setHoursForm(standardHours); setIsHoursDialogOpen(true); };
    const handleOpenPauseEdit = () => { setPauseForm(pauseRule); setIsPauseDialogOpen(true); };
    const handleOpenSeasonEdit = (season?: SeasonMode) => { setSeasonForm(season ? {...season} : INITIAL_SEASON_FORM); setIsSeasonDialogOpen(true); };

    // OPRAVA 2: Odchytávání a zpracování chyb v nastavení časů
    const handleSaveHours = async () => {
        try {
            await apiClient.put('/operating-hours/standard', hoursForm);
            showNotification('Otevírací doba uložena', 'success');
            setIsHoursDialogOpen(false);
            await fetchOperatingHoursData();
        }
        catch (error: unknown) {
            const msg = isAxiosError(error) ? (error.response?.data as BackendError)?.message : 'Chyba serveru';
            showNotification(msg || 'Chyba při ukládání otevírací doby', 'error');
        }
    };

    const handleSavePause = async () => {
        try {
            await apiClient.put('/operating-hours/pause-rule', { triggerHours: pauseForm.triggerHours, pauseMinutes: pauseForm.pauseMinutes });
            showNotification('Pravidla pauz uložena', 'success');
            setIsPauseDialogOpen(false);
            await fetchOperatingHoursData();
        }
        catch (error: unknown) {
            const msg = isAxiosError(error) ? (error.response?.data as BackendError)?.message : 'Chyba serveru';
            showNotification(msg || 'Chyba při ukládání pravidel pauz', 'error');
        }
    };

    const handleSaveSeason = async () => {
        if (!seasonForm.name.trim() || !seasonForm.startDate || !seasonForm.endDate) return;
        const url = seasonForm.id ? `/operating-hours/seasons/${seasonForm.id}` : `/operating-hours/seasons`;
        try {
            if (seasonForm.id) await apiClient.put(url, seasonForm); else await apiClient.post(url, seasonForm);
            showNotification('Sezónní režim uložen', 'success');
            setIsSeasonDialogOpen(false);
            await fetchOperatingHoursData();
        }
        catch (error: unknown) {
            const msg = isAxiosError(error) ? (error.response?.data as BackendError)?.message : 'Chyba serveru';
            showNotification(msg || 'Chyba při ukládání sezónního režimu', 'error');
        }
    };

    const visibleCategories = (categories ?? []).filter(c => showInactiveCats || c.isActive);
    const currentCategory = (categories ?? []).find(c => c.id === selectedCatId);
    const stationsRaw = currentCategory?.stations ?? [];
    const visibleStations = stationsRaw.filter(s => showInactiveStats || s.isActive);
    const currentStation = stationsRaw.find(s => s.id === selectedStatId);
    const templatesRaw = currentStation?.templates ?? [];
    const visibleTemplates = templatesRaw.filter(t => showInactiveTmpls || t.isActive);

    const visibleSeasons = seasons.filter(s => showInactiveSeasons || s.isActive !== false);
    const today = new Date().toISOString().split('T')[0];
    const activeSeason = visibleSeasons.find(s => s.isActive !== false && s.startDate <= today && s.endDate >= today);
    const hasActiveSeason = !!activeSeason;

    if (loading && (categories ?? []).length === 0) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
    if (errorMessage) return <Box sx={{ p: 5 }}><Alert severity="error">{errorMessage}</Alert></Box>;

    return (
        <Box sx={pageContainerStyle}>
            {/* HLAVIČKA */}
            <Paper elevation={0} sx={headerPaperStyle}>
                <Box sx={titleBoxStyle}>
                    <IconButton onClick={() => navigate('/dashboard/shifts')} sx={{ bgcolor: '#f1f5f9' }}><ArrowBackIcon sx={{ color: '#64748b' }} /></IconButton>
                    <Box><Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b' }}>Nastavení pozic</Typography></Box>
                </Box>
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v as number)} textColor="primary" indicatorColor="primary" sx={{ minHeight: '48px', '& .MuiTab-root': { textTransform: 'none', fontWeight: 'bold', fontSize: '1rem', color: '#64748b' } }}>
                    <Tab label="Atrakce a šablony" />
                    <Tab label="Provoz areálu" />
                </Tabs>
            </Paper>

            {activeTab === 0 && (
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} sx={{ alignItems: 'flex-start' }}>
                    {/* KATEGORIE */}
                    <Paper elevation={0} sx={columnPaperStyle}>
                        <Box sx={columnHeaderStyle}><Typography variant="h6" fontWeight="bold" color="#1e293b">Kategorie</Typography><IconButton onClick={() => setShowInactiveCats(!showInactiveCats)}>{showInactiveCats ? <VisibilityIcon color="primary" /> : <VisibilityOffIcon sx={{ color: '#cbd5e1' }} />}</IconButton></Box>
                        <Divider sx={lightDividerStyle} />
                        <Box sx={scrollBoxStyle}>
                            <List sx={{ p: 1 }}>
                                {visibleCategories.map((cat) => (
                                    <ListItem key={cat.id} disablePadding secondaryAction={<Stack direction="row" spacing={0.5}><IconButton size="small" onClick={() => openEditCategory(cat)} sx={{ color: '#94a3b8' }}><EditIcon fontSize="small" /></IconButton><IconButton size="small" onClick={() => setDeleteDialog({ open: true, type: 'category', id: cat.id, name: cat.name })} sx={{ color: '#f87171' }}><DeleteIcon fontSize="small" /></IconButton></Stack>} sx={{ mb: 0.5, borderRadius: '10px', overflow: 'hidden', borderLeft: selectedCatId === cat.id ? `4px solid ${cat.color}` : '4px solid transparent', opacity: cat.isActive ? 1 : 0.5 }}>
                                        <ListItemButton selected={selectedCatId === cat.id} onClick={() => { setSelectedCatId(cat.id); setSelectedStatId(null); }} sx={{ '&.Mui-selected': { bgcolor: '#f1f5f9' } }}>
                                            <ListItemText primary={cat.name} secondary={`Pořadí: ${cat.sortOrder}`} slotProps={{ primary: { sx: { fontWeight: selectedCatId === cat.id ? 'bold' : '500', color: '#1e293b' } }, secondary: { sx: { fontSize: '0.8rem', color: '#64748b', mt: 0.2 } } }} />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                        <Divider sx={lightDividerStyle} /><Button startIcon={<AddIcon />} sx={addButtonStyle} onClick={() => { setCatForm({ ...INITIAL_CAT_FORM, order: visibleCategories.length + 1 }); setIsCatDialogOpen(true); }}>přidat kategorii</Button>
                    </Paper>

                    {/* STANOVIŠTĚ */}
                    <Paper elevation={0} sx={columnPaperStyle}>
                        <Box sx={columnHeaderStyle}><Typography variant="h6" fontWeight="bold" color="#1e293b">Stanoviště</Typography><IconButton disabled={!selectedCatId} onClick={() => setShowInactiveStats(!showInactiveStats)}>{showInactiveStats ? <VisibilityIcon color="primary" /> : <VisibilityOffIcon sx={{ color: '#cbd5e1' }} />}</IconButton></Box>
                        <Divider sx={lightDividerStyle} />
                        <Box sx={scrollBoxStyle}>
                            <List sx={{ p: 1 }}>
                                {!selectedCatId ? (<Box sx={emptyStateStyle}>Vyberte kategorii vlevo.</Box>) : visibleStations.map((stat) => (
                                    <ListItem key={stat.id} disablePadding secondaryAction={<Stack direction="row" spacing={0.5}><IconButton size="small" onClick={() => openEditStation(stat)} sx={{ color: '#94a3b8' }}><EditIcon fontSize="small" /></IconButton><IconButton size="small" onClick={() => setDeleteDialog({ open: true, type: 'station', id: stat.id, name: stat.name })} sx={{ color: '#f87171' }}><DeleteIcon fontSize="small" /></IconButton></Stack>} sx={{ mb: 0.5, borderRadius: '10px', overflow: 'hidden', opacity: stat.isActive ? 1 : 0.5 }}>
                                        <ListItemButton selected={selectedStatId === stat.id} onClick={() => setSelectedStatId(stat.id)} sx={{ '&.Mui-selected': { bgcolor: '#f1f5f9' } }}>
                                            <ListItemText primary={stat.name} secondary={`Kapacita: ${stat.capacityLimit}`} slotProps={{ primary: { sx: { fontWeight: selectedStatId === stat.id ? 'bold' : '500', color: '#1e293b' } }, secondary: { sx: { fontSize: '0.8rem', color: '#64748b', mt: 0.2 } } }} />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                        <Divider sx={lightDividerStyle} /><Button startIcon={<AddIcon />} disabled={!selectedCatId} sx={addButtonStyle} onClick={() => { setStatForm({ ...INITIAL_STAT_FORM, order: visibleStations.length + 1, afternoonStartTime: standardHours.weekOdpoStart?.substring(0, 5) || '14:00' }); setIsStatDialogOpen(true); }}>přidat stanoviště</Button>
                    </Paper>

                    {/* ŠABLONY */}
                    <Paper elevation={0} sx={templateColumnStyle}>
                        <Box sx={columnHeaderStyle}><Typography variant="h6" fontWeight="bold" color="#1e293b">Šablony směn</Typography><IconButton disabled={!selectedStatId} onClick={() => setShowInactiveTmpls(!showInactiveTmpls)}>{showInactiveTmpls ? <VisibilityIcon color="primary" /> : <VisibilityOffIcon sx={{ color: '#cbd5e1' }} />}</IconButton></Box>
                        <Divider sx={lightDividerStyle} />
                        <Box sx={scrollBoxStyle}><Box sx={{ p: 2 }}>
                            {!selectedStatId ? (<Box sx={emptyStateStyle}>Vyberte stanoviště vlevo.</Box>) : visibleTemplates.map((tmpl) => (
                                <Paper key={tmpl.id} elevation={0} sx={{ ...templateItemStyle, opacity: tmpl.isActive ? 1 : 0.5 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}><Typography fontWeight="bold" color="#1e293b">{tmpl.name}</Typography><Stack direction="row" spacing={0.5}><IconButton size="small" onClick={() => openEditTemplate(tmpl)} sx={{ color: '#94a3b8' }}><EditIcon fontSize="small" /></IconButton><IconButton size="small" onClick={() => setDeleteDialog({ open: true, type: 'template', id: tmpl.id, name: tmpl.name })} sx={{ color: '#f87171' }}><DeleteIcon fontSize="small" /></IconButton></Stack></Box>
                                    <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}><strong>Čas:</strong> {tmpl.useOpeningHours ? "Dle otevírací doby" : `${tmpl.startTime?.substring(0,5)} - ${tmpl.endTime?.substring(0,5)}`}</Typography>
                                    {tmpl.useOpeningHours && (<Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 'bold', display: 'block', mb: 0.5 }}>→ Dnes: {getTodayOpeningHoursText(tmpl.hasDopo, tmpl.hasOdpo)}</Typography>)}
                                    <Typography variant="body2" sx={{ color: '#64748b' }}><strong>Lidí:</strong> {tmpl.workersNeeded}</Typography>
                                </Paper>
                            ))}</Box></Box>
                        <Divider sx={lightDividerStyle} /><Button startIcon={<AddIcon />} disabled={!selectedStatId} sx={addButtonStyle} onClick={() => { setTmplForm({ ...INITIAL_TMPL_FORM, order: visibleTemplates.length + 1 }); setIsTmplDialogOpen(true); }}>přidat šablonu</Button>
                    </Paper>
                </Stack>
            )}

            {/* ZÁLOŽKA 2: PROVOZ AREÁLU */}
            {activeTab === 1 && (
                <Stack spacing={4}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
                        <Paper elevation={0} sx={{ ...settingsCardStyle, border: hasActiveSeason ? '2px solid #10b981' : 'none' }}>
                            <Box sx={settingsCardHeaderStyle}><Box><Typography variant="h6" fontWeight="bold" color="#1e293b"><AccessTimeIcon sx={{ verticalAlign: 'middle', mr: 1, color: hasActiveSeason ? '#10b981' : '#3b82f6' }} />Standardní otevírací doba</Typography>{hasActiveSeason && (<Chip label={`Aktivní sezónní režim: ${activeSeason.name}`} size="small" sx={{ mt: 1, bgcolor: '#d1fae5', color: '#047857', fontWeight: 'bold' }} />)}</Box><IconButton onClick={handleOpenHoursEdit} sx={{ color: '#94a3b8' }}><EditIcon /></IconButton></Box>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ ...hoursInfoBoxStyle, flex: 1, borderColor: hasActiveSeason ? '#d1fae5' : '#f1f5f9', bgcolor: hasActiveSeason ? '#f0fdf4' : '#f8fafc' }}><Typography fontWeight="bold" color={hasActiveSeason ? '#047857' : '#3b82f6'} mb={1}>Po-Pá</Typography><Stack spacing={1}><Box><Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Dopolední směna</Typography><Typography variant="body1" sx={{ color: '#334155', fontWeight: 'bold' }}>{hasActiveSeason ? `${activeSeason.dopoStart.substring(0,5)} - ${activeSeason.dopoEnd.substring(0,5)}` : `${standardHours.weekDopoStart.substring(0,5)} - ${standardHours.weekDopoEnd.substring(0,5)}`}</Typography></Box><Box><Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Odpolední směna</Typography><Typography variant="body1" sx={{ color: '#334155', fontWeight: 'bold' }}>{hasActiveSeason ? `${activeSeason.odpoStart.substring(0,5)} - ${activeSeason.odpoEnd.substring(0,5)}` : `${standardHours.weekOdpoStart.substring(0,5)} - ${standardHours.weekOdpoEnd.substring(0,5)}`}</Typography></Box></Stack></Box>
                                <Box sx={{ ...hoursInfoBoxStyle, flex: 1, borderColor: hasActiveSeason ? '#d1fae5' : '#f1f5f9', bgcolor: hasActiveSeason ? '#f0fdf4' : '#f8fafc' }}><Typography fontWeight="bold" color={hasActiveSeason ? '#047857' : '#3b82f6'} mb={1}>So-Ne</Typography>{(!hasActiveSeason && standardHours.weekendSame) ? (<Typography variant="body2" sx={{ color: '#64748b', fontStyle: 'italic', mt: 2 }}>Stejné jako v týdnu</Typography>) : (<Stack spacing={1}><Box><Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Dopolední směna</Typography><Typography variant="body1" sx={{ color: '#334155', fontWeight: 'bold' }}>{hasActiveSeason ? `${activeSeason.dopoStart.substring(0,5)} - ${activeSeason.dopoEnd.substring(0,5)}` : `${standardHours.weekendDopoStart.substring(0,5)} - ${standardHours.weekendDopoEnd.substring(0,5)}`}</Typography></Box><Box><Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Odpolední směna</Typography><Typography variant="body1" sx={{ color: '#334155', fontWeight: 'bold' }}>{hasActiveSeason ? `${activeSeason.odpoStart.substring(0,5)} - ${activeSeason.odpoEnd.substring(0,5)}` : `${standardHours.weekendOdpoStart.substring(0,5)} - ${standardHours.weekendOdpoEnd.substring(0,5)}`}</Typography></Box></Stack>)}</Box>
                            </Box>
                        </Paper>
                        <Paper elevation={0} sx={settingsCardStyle}><Box sx={settingsCardHeaderStyle}><Typography variant="h6" fontWeight="bold" color="#1e293b"><TimerIcon sx={{ verticalAlign: 'middle', mr: 1, color: '#f59e0b' }} /> Pravidla pauz</Typography><IconButton onClick={handleOpenPauseEdit} sx={{ color: '#94a3b8' }}><EditIcon /></IconButton></Box><Box sx={pauseInfoBoxStyle}><Typography variant="h3" color="#3b82f6" fontWeight="bold" mb={1}>{pauseRule.pauseMinutes} min</Typography><Typography variant="body1" color="#475569">Po {pauseRule.triggerHours} hodinách práce</Typography></Box></Paper>
                    </Stack>
                    <Paper elevation={0} sx={{ borderRadius: '16px', p: 3.5, bgcolor: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}><Box sx={settingsCardHeaderStyle}><Typography variant="h6" fontWeight="bold" color="#1e293b"><EventNoteIcon sx={{ verticalAlign: 'middle', mr: 1, color: '#10b981' }} /> Sezónní režimy</Typography><Stack direction="row" spacing={1} alignItems="center"><IconButton onClick={() => setShowInactiveSeasons(!showInactiveSeasons)}>{showInactiveSeasons ? <VisibilityIcon color="primary" /> : <VisibilityOffIcon sx={{ color: '#cbd5e1' }} />}</IconButton><Button startIcon={<AddIcon />} variant="contained" sx={primaryButtonStyle} onClick={() => handleOpenSeasonEdit()}>Nová sezóna</Button></Stack></Box>
                        <Box sx={seasonGridStyle}>{visibleSeasons.map(s => (<Paper key={s.id} elevation={0} sx={{...seasonCardStyle, opacity: s.isActive !== false ? 1 : 0.5}}><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Typography fontWeight="bold" color="#1e293b" fontSize="1.1rem">{s.name}</Typography><Stack direction="row" spacing={0.5}><IconButton size="small" onClick={() => handleOpenSeasonEdit(s)} sx={{ color: '#94a3b8' }}><EditIcon fontSize="small" /></IconButton><IconButton size="small" onClick={() => setDeleteDialog({ open: true, type: 'season', id: s.id, name: s.name })} sx={{ color: '#f87171' }}><DeleteIcon fontSize="small" /></IconButton></Stack></Box><Chip icon={<EventNoteIcon fontSize="small" />} label={`${s.startDate} - ${s.endDate}`} size="small" sx={{ mt: 1.5, bgcolor: '#f1f5f9', color: '#475569', fontWeight: 'bold' }} /></Paper>))}</Box>
                    </Paper>
                </Stack>
            )}

            {/* DIALOGY */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ ...deleteDialog, open: false })} maxWidth="sm" fullWidth slotProps={modernDialogProps}>
                <DialogTitle sx={dialogTitleErrorStyle}><WarningIcon sx={{ verticalAlign: 'bottom', mr: 1 }} /> Odstranění položky</DialogTitle>
                <DialogContent sx={dialogContentStyle}>
                    <Typography>Opravdu si přejete smazat položku: <strong>{deleteDialog.name}</strong>?</Typography>
                    <TextField fullWidth size="small" label="Napište SMAZAT pro trvalý výmaz" sx={{ mt: 3, ...modernInputStyle }} value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} slotProps={{ htmlInput: { style: { textAlign: 'center', letterSpacing: '2px', fontWeight: 'bold' } } }} />
                </DialogContent>
                <DialogActions sx={dialogActionsStyle}><Button onClick={() => setDeleteDialog({ ...deleteDialog, open: false })} sx={ghostButtonStyle}>Zrušit</Button><Button color="error" variant="contained" disabled={deleteConfirmText !== 'SMAZAT'} onClick={() => void executeDeleteOrDeactivate('hard_delete')} sx={dangerButtonStyle}>Trvale smazat</Button><Button color="success" variant="contained" onClick={() => void executeDeleteOrDeactivate('deactivate')} sx={neutralButtonStyle}>Pouze deaktivovat</Button></DialogActions>
            </Dialog>

            <Dialog open={isCatDialogOpen} onClose={() => setIsCatDialogOpen(false)} fullWidth maxWidth="xs" slotProps={modernDialogProps}>
                <DialogTitle sx={dialogTitleStyle}>{catForm.id ? 'Upravit' : 'Nová'} kategorie</DialogTitle>
                <DialogContent sx={dialogContentStyle}>
                    <TextField fullWidth label="Název" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} sx={modernInputStyle} />
                    <Box sx={{ mt: 1 }}><Typography variant="caption" sx={{ color: '#64748b', ml: 1, mb: 0.5, display: 'block' }}>Barva kategorie</Typography><input type="color" value={catForm.color} onChange={e => setCatForm({ ...catForm, color: e.target.value })} style={{ width: '100%', height: '48px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', padding: '2px', backgroundColor: '#ffffff' }} /></Box>
                    <Stack direction="row" spacing={2} sx={{ mt: 1 }}><TextField label="Pořadí" type="number" value={catForm.order} onChange={e => setCatForm({ ...catForm, order: Number(e.target.value) })} sx={modernInputStyle} /><FormControlLabel control={<Switch checked={catForm.active} onChange={e => setCatForm({ ...catForm, active: e.target.checked })} />} label={<Typography fontWeight="500" color="#334155">Aktivní</Typography>} /></Stack>
                </DialogContent>
                <DialogActions sx={dialogActionsStyle}><Button onClick={() => setIsCatDialogOpen(false)} sx={ghostButtonStyle}>Zrušit</Button><Button variant="contained" onClick={() => void handleSaveCategory()} sx={primaryButtonStyle}>Uložit</Button></DialogActions>
            </Dialog>

            <Dialog open={isStatDialogOpen} onClose={() => setIsStatDialogOpen(false)} fullWidth maxWidth="sm" slotProps={modernDialogProps}>
                <DialogTitle sx={dialogTitleStyle}>{statForm.id ? 'Upravit' : 'Nové'} stanoviště</DialogTitle>
                <DialogContent sx={dialogContentStyle}>
                    <TextField fullWidth label="Název" value={statForm.name} onChange={e => setStatForm({ ...statForm, name: e.target.value })} sx={modernInputStyle} />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}><TextField fullWidth label="Kapacita" type="number" value={statForm.capacityLimit} onChange={e => setStatForm({ ...statForm, capacityLimit: Number(e.target.value) })} sx={modernInputStyle} /><TextField fullWidth label="Pořadí" type="number" value={statForm.order} onChange={e => setStatForm({ ...statForm, order: Number(e.target.value) })} sx={modernInputStyle} /></Stack>
                    <Stack direction="row" justifyContent="space-around" alignItems="center" sx={{ mt: 2, mb: 1, p: 2, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}><FormControlLabel control={<Switch checked={statForm.active} onChange={e => setStatForm({ ...statForm, active: e.target.checked })} />} label={<Typography fontWeight="500" color="#334155">Aktivní</Typography>} /><FormControlLabel control={<Switch checked={statForm.needsQualification} onChange={e => setStatForm({ ...statForm, needsQualification: e.target.checked })} />} label={<Typography fontWeight="500" color="#334155">Vyžaduje kvalifikaci</Typography>} /></Stack>
                    <Box sx={{ mt: 2, mb: 1 }}><Typography sx={sectionTitleStyle}>Zlom směn</Typography><Divider sx={lightDividerStyle} /></Box>
                    <FormControlLabel control={<Switch checked={statForm.useDefaultSplitTime} onChange={e => setStatForm({ ...statForm, useDefaultSplitTime: e.target.checked })} />} label={<Typography variant="body2" sx={{ fontWeight: 'bold', color: '#3b82f6' }}>Dle otevírací doby</Typography>} />
                    {!statForm.useDefaultSplitTime && (<TextField label="Odpolední směna začíná od" type="time" fullWidth size="small" value={statForm.afternoonStartTime} onChange={e => setStatForm({ ...statForm, afternoonStartTime: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} sx={{ mt: 1, ...modernInputStyle }} />)}
                </DialogContent>
                <DialogActions sx={dialogActionsStyle}><Button onClick={() => setIsStatDialogOpen(false)} sx={ghostButtonStyle}>Zrušit</Button><Button variant="contained" onClick={() => void handleSaveStation()} sx={primaryButtonStyle}>Uložit</Button></DialogActions>
            </Dialog>

            <Dialog open={isTmplDialogOpen} onClose={() => setIsTmplDialogOpen(false)} fullWidth maxWidth="sm" slotProps={modernDialogProps}>
                <DialogTitle sx={dialogTitleStyle}>{tmplForm.id ? 'Upravit' : 'Nová'} šablona</DialogTitle>
                <DialogContent sx={dialogContentStyle}>
                    <TextField fullWidth label="Název" value={tmplForm.name} onChange={e => setTmplForm({ ...tmplForm, name: e.target.value })} sx={modernInputStyle} />
                    <RadioGroup row value={tmplForm.shiftType} onChange={e => setTmplForm({ ...tmplForm, shiftType: e.target.value as 'full' | 'split' })} sx={{ my: 1, px: 1 }}><FormControlLabel value="full" control={<Radio color="primary" />} label={<Typography fontWeight="500" color="#334155">V kuse</Typography>} /><FormControlLabel value="split" control={<Radio color="primary" />} label={<Typography fontWeight="500" color="#334155" sx={{ ml: 2 }}>Dělená</Typography>} /></RadioGroup>
                    <Stack direction="row" spacing={3} alignItems="center" mb={2}><TextField label="Potřeba lidí" type="number" value={tmplForm.workersNeeded} onChange={e => setTmplForm({ ...tmplForm, workersNeeded: Number(e.target.value) })} sx={modernInputStyle} /><FormControlLabel control={<Switch checked={tmplForm.active} onChange={e => setTmplForm({ ...tmplForm, active: e.target.checked })} />} label={<Typography fontWeight="500" color="#334155">Aktivní</Typography>} /></Stack>
                    {tmplForm.shiftType === 'full' ? (
                        <Box sx={{ mt: 1 }}><Typography sx={sectionTitleStyle}>Časové rozmezí</Typography><Divider sx={{ ...lightDividerStyle, mb: 3 }} /><Stack direction="row" spacing={2}><TextField label="Od" type="time" fullWidth value={tmplForm.fullStartTime} onChange={e => setTmplForm({ ...tmplForm, fullStartTime: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} sx={modernInputStyle} /><TextField label="Do" type="time" fullWidth value={tmplForm.fullEndTime} onChange={e => setTmplForm({ ...tmplForm, fullEndTime: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} sx={modernInputStyle} /></Stack></Box>
                    ) : (
                        <Box sx={{ ...templateSplitBoxStyle, mt: 1 }}>
                            <FormControlLabel control={<Switch checked={tmplForm.useOpeningHours} onChange={e => setTmplForm({ ...tmplForm, useOpeningHours: e.target.checked })} />} label={<Typography fontWeight="bold" color="#3b82f6">Dle otevírací doby</Typography>} />
                            <Box sx={{ opacity: tmplForm.hasDopo ? 1 : 0.4, mt: 1 }}><FormControlLabel control={<Checkbox checked={tmplForm.hasDopo} onChange={e => setTmplForm({ ...tmplForm, hasDopo: e.target.checked })} />} label={<Typography fontWeight="bold">Dopoledne</Typography>} /><Stack direction="row" spacing={2} sx={{ mt: 1 }}><TextField disabled={!tmplForm.hasDopo || tmplForm.useOpeningHours} label="Od" type="time" fullWidth size="small" value={tmplForm.dopoStartTime} onChange={e => setTmplForm({ ...tmplForm, dopoStartTime: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} sx={modernInputStyle} /><TextField disabled={!tmplForm.hasDopo || tmplForm.useOpeningHours} label="Do" type="time" fullWidth size="small" value={tmplForm.dopoEndTime} onChange={e => setTmplForm({ ...tmplForm, dopoEndTime: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} sx={modernInputStyle} /></Stack></Box>
                            <Divider sx={lightDividerStyle} /><Box sx={{ opacity: tmplForm.hasOdpo ? 1 : 0.4 }}><FormControlLabel control={<Checkbox checked={tmplForm.hasOdpo} onChange={e => setTmplForm({ ...tmplForm, hasOdpo: e.target.checked })} />} label={<Typography fontWeight="bold">Odpoledne</Typography>} /><Stack direction="row" spacing={2} sx={{ mt: 1 }}><TextField disabled={!tmplForm.hasOdpo || tmplForm.useOpeningHours} label="Od" type="time" fullWidth size="small" value={tmplForm.odpoStartTime} onChange={e => setTmplForm({ ...tmplForm, odpoStartTime: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} sx={modernInputStyle} /><TextField disabled={!tmplForm.hasOdpo || tmplForm.useOpeningHours} label="Do" type="time" fullWidth size="small" value={tmplForm.odpoEndTime} onChange={e => setTmplForm({ ...tmplForm, odpoEndTime: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} sx={modernInputStyle} /></Stack></Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={dialogActionsStyle}><Button onClick={() => setIsTmplDialogOpen(false)} sx={ghostButtonStyle}>Zrušit</Button><Button variant="contained" onClick={() => void handleSaveTemplate()} sx={primaryButtonStyle}>Uložit</Button></DialogActions>
            </Dialog>

            <Dialog open={isHoursDialogOpen} onClose={() => setIsHoursDialogOpen(false)} fullWidth maxWidth="sm" slotProps={modernDialogProps}>
                <DialogTitle sx={dialogTitleStyle}>Otevírací doba</DialogTitle>
                <DialogContent sx={dialogContentStyle}>
                    <Box><Typography fontWeight="bold" color="#3b82f6" mb={2}>Týden (Po-Pá)</Typography><Stack direction="row" spacing={2} mb={3}><TextField label="Dopo od" type="time" size="small" fullWidth value={hoursForm.weekDopoStart?.substring(0,5) || ''} onChange={e => setHoursForm({...hoursForm, weekDopoStart: formatTimeForServer(e.target.value) || ''})} slotProps={{ inputLabel: { shrink: true } }} sx={modernInputStyle} /><TextField label="Dopo do" type="time" size="small" fullWidth value={hoursForm.weekDopoEnd?.substring(0,5) || ''} onChange={e => setHoursForm({...hoursForm, weekDopoEnd: formatTimeForServer(e.target.value) || ''})} slotProps={{ inputLabel: { shrink: true } }} sx={modernInputStyle} /></Stack><Stack direction="row" spacing={2}><TextField label="Odpo od" type="time" size="small" fullWidth value={hoursForm.weekOdpoStart?.substring(0,5) || ''} onChange={e => setHoursForm({...hoursForm, weekOdpoStart: formatTimeForServer(e.target.value) || ''})} slotProps={{ inputLabel: { shrink: true } }} sx={modernInputStyle} /><TextField label="Odpo do" type="time" size="small" fullWidth value={hoursForm.weekOdpoEnd?.substring(0,5) || ''} onChange={e => setHoursForm({...hoursForm, weekOdpoEnd: formatTimeForServer(e.target.value) || ''})} slotProps={{ inputLabel: { shrink: true } }} sx={modernInputStyle} /></Stack></Box>
                    <Divider sx={{ ...lightDividerStyle, my: 1 }} /><Box><Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}><Typography fontWeight="bold" color="#3b82f6">Víkend</Typography><FormControlLabel control={<Switch size="small" checked={hoursForm.weekendSame} onChange={e => setHoursForm({...hoursForm, weekendSame: e.target.checked})} />} label={<Typography fontWeight="500">Stejné jako v týdnu</Typography>} /></Stack><Box sx={{ opacity: hoursForm.weekendSame ? 0.4 : 1, pointerEvents: hoursForm.weekendSame ? 'none' : 'auto' }}><Stack direction="row" spacing={2} mb={3}><TextField label="Dopo od" type="time" size="small" fullWidth value={hoursForm.weekendSame ? (hoursForm.weekDopoStart?.substring(0,5) || '') : (hoursForm.weekendDopoStart?.substring(0,5) || '')} onChange={e => setHoursForm({...hoursForm, weekendDopoStart: formatTimeForServer(e.target.value) || ''})} slotProps={{ inputLabel: { shrink: true } }} sx={modernInputStyle} /><TextField label="Dopo do" type="time" size="small" fullWidth value={hoursForm.weekendSame ? (hoursForm.weekDopoEnd?.substring(0,5) || '') : (hoursForm.weekendDopoEnd?.substring(0,5) || '')} onChange={e => setHoursForm({...hoursForm, weekendDopoEnd: formatTimeForServer(e.target.value) || ''})} slotProps={{ inputLabel: { shrink: true } }} sx={modernInputStyle} /></Stack><Stack direction="row" spacing={2}><TextField label="Odpo od" type="time" size="small" fullWidth value={hoursForm.weekendSame ? (hoursForm.weekOdpoStart?.substring(0,5) || '') : (hoursForm.weekendOdpoStart?.substring(0,5) || '')} onChange={e => setHoursForm({...hoursForm, weekendOdpoStart: formatTimeForServer(e.target.value) || ''})} slotProps={{ inputLabel: { shrink: true } }} sx={modernInputStyle} /><TextField label="Odpo do" type="time" size="small" fullWidth value={hoursForm.weekendSame ? (hoursForm.weekOdpoEnd?.substring(0,5) || '') : (hoursForm.weekendOdpoEnd?.substring(0,5) || '')} onChange={e => setHoursForm({...hoursForm, weekendOdpoEnd: formatTimeForServer(e.target.value) || ''})} slotProps={{ inputLabel: { shrink: true } }} sx={modernInputStyle} /></Stack></Box></Box>
                </DialogContent>
                <DialogActions sx={dialogActionsStyle}><Button onClick={() => setIsHoursDialogOpen(false)} sx={ghostButtonStyle}>Zrušit</Button><Button variant="contained" onClick={() => void handleSaveHours()} sx={primaryButtonStyle}>Uložit</Button></DialogActions>
            </Dialog>

            <Dialog open={isPauseDialogOpen} onClose={() => setIsPauseDialogOpen(false)} fullWidth maxWidth="xs" slotProps={modernDialogProps}>
                <DialogTitle sx={dialogTitleStyle}>Pravidla pauz</DialogTitle>
                <DialogContent sx={dialogContentStyle}><TextField label="Pauza po (hod)" type="number" fullWidth value={pauseForm.triggerHours} onChange={e => setPauseForm({...pauseForm, triggerHours: Number(e.target.value)})} sx={modernInputStyle} /><TextField label="Délka (min)" type="number" fullWidth value={pauseForm.pauseMinutes} onChange={e => setPauseForm({...pauseForm, pauseMinutes: Number(e.target.value)})} sx={modernInputStyle} /></DialogContent>
                <DialogActions sx={dialogActionsStyle}><Button onClick={() => setIsPauseDialogOpen(false)} sx={ghostButtonStyle}>Zrušit</Button><Button variant="contained" onClick={() => void handleSavePause()} sx={primaryButtonStyle}>Uložit</Button></DialogActions>
            </Dialog>

            <Dialog open={isSeasonDialogOpen} onClose={() => setIsSeasonDialogOpen(false)} fullWidth maxWidth="sm" slotProps={modernDialogProps}>
                <DialogTitle sx={dialogTitleStyle}>{seasonForm.id ? 'Úprava sezóny' : 'Nová sezóna'}</DialogTitle>
                <DialogContent sx={dialogContentStyle}><Stack direction="row" spacing={2} mb={1}><TextField label="Název" fullWidth value={seasonForm.name} onChange={e => setSeasonForm({...seasonForm, name: e.target.value})} sx={modernInputStyle} /><FormControlLabel control={<Switch checked={seasonForm.isActive !== false} onChange={e => setSeasonForm({ ...seasonForm, isActive: e.target.checked })} />} label={<Typography fontWeight="500">Aktivní</Typography>} /></Stack><Stack direction="row" spacing={2} mb={1}><TextField label="Od" type="date" fullWidth value={seasonForm.startDate} onChange={e => setSeasonForm({...seasonForm, startDate: e.target.value})} slotProps={{ inputLabel: { shrink: true } }} sx={modernInputStyle} /><TextField label="Do" type="date" fullWidth value={seasonForm.endDate} onChange={e => setSeasonForm({...seasonForm, endDate: e.target.value})} slotProps={{ inputLabel: { shrink: true } }} sx={modernInputStyle} /></Stack><Box sx={{ mt: 1, mb: 1 }}><Typography sx={sectionTitleStyle}>Provozní doba</Typography><Divider sx={lightDividerStyle} /></Box><Stack direction="row" spacing={2} mb={1}><TextField label="Dopo od" type="time" fullWidth size="small" value={seasonForm.dopoStart?.substring(0,5) || ''} onChange={e => setSeasonForm({...seasonForm, dopoStart: formatTimeForServer(e.target.value) || ''})} slotProps={{ inputLabel: { shrink: true } }} sx={modernInputStyle} /><TextField label="Dopo do" type="time" fullWidth size="small" value={seasonForm.dopoEnd?.substring(0,5) || ''} onChange={e => setSeasonForm({...seasonForm, dopoEnd: formatTimeForServer(e.target.value) || ''})} slotProps={{ inputLabel: { shrink: true } }} sx={modernInputStyle} /></Stack><Stack direction="row" spacing={2}><TextField label="Odpo od" type="time" fullWidth size="small" value={seasonForm.odpoStart?.substring(0,5) || ''} onChange={e => setSeasonForm({...seasonForm, odpoStart: formatTimeForServer(e.target.value) || ''})} slotProps={{ inputLabel: { shrink: true } }} sx={modernInputStyle} /><TextField label="Odpo do" type="time" fullWidth size="small" value={seasonForm.odpoEnd?.substring(0,5) || ''} onChange={e => setSeasonForm({...seasonForm, odpoEnd: formatTimeForServer(e.target.value) || ''})} slotProps={{ inputLabel: { shrink: true } }} sx={modernInputStyle} /></Stack></DialogContent>
                <DialogActions sx={dialogActionsStyle}><Button onClick={() => setIsSeasonDialogOpen(false)} sx={ghostButtonStyle}>Zrušit</Button><Button variant="contained" onClick={() => void handleSaveSeason()} sx={primaryButtonStyle}>Uložit</Button></DialogActions>
            </Dialog>
        </Box>
    );
};

export default PositionsSettingsPage;