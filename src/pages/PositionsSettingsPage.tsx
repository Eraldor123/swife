import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Tabs, Tab, List, ListItem,
    ListItemButton, ListItemText, IconButton, Button, Divider, Stack,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress,
    FormControlLabel, Switch, RadioGroup, Radio, Checkbox, Alert
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    ArrowBack as ArrowBackIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Template {
    id: number; name: string; timeRange?: string; startTime?: string; endTime?: string;
    startTime2?: string; endTime2?: string; workersNeeded: number; isActive?: boolean;
}
interface Station {
    id: number; name: string; templates: Template[]; isActive?: boolean;
    capacityLimit?: number; needsQualification?: boolean;
}
interface Category {
    id: number; name: string; color: string; isActive?: boolean; stations: Station[];
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
}

const PositionsSettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);

    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
    const [selectedStatId, setSelectedStatId] = useState<number | null>(null);

    const [showInactiveCats, setShowInactiveCats] = useState(false);
    const [showInactiveStats, setShowInactiveStats] = useState(false);
    const [showInactiveTmpls, setShowInactiveTmpls] = useState(false);

    const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
    const [isStatDialogOpen, setIsStatDialogOpen] = useState(false);
    const [isTmplDialogOpen, setIsTmplDialogOpen] = useState(false);

    // --- STAVY PRO MAZÁNÍ ---
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean, type: 'category'|'station'|'template', id: number | null, name: string }>({ open: false, type: 'category', id: null, name: '' });
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    // --- FORMULÁŘE (Přidáno 'id' pro rozeznání Editace vs Nový) ---
    const [catForm, setCatForm] = useState({ id: null as number | null, name: '', color: '#2e7d32', order: 1, active: true });
    const [statForm, setStatForm] = useState({ id: null as number | null, name: '', capacityLimit: 1, active: true, needsQualification: false });
    const [tmplForm, setTmplForm] = useState({
        id: null as number | null, name: '', shiftType: 'full', workersNeeded: 1, active: true, useOpeningHours: false,
        fullStartTime: '08:00', fullEndTime: '16:00', hasDopo: true, dopoStartTime: '08:00', dopoEndTime: '12:00',
        hasOdpo: true, odpoStartTime: '13:00', odpoEndTime: '17:00'
    });

    const fetchHierarchy = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/v1/position-settings/hierarchy', { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) {
                const data = await response.json();
                setCategories(data.categories || []);
                // ODSTRANĚNO: Už se automaticky nevybere první kategorie
                // if (data.categories?.length > 0 && selectedCatId === null) setSelectedCatId(data.categories[0].id);
            }
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    useEffect(() => { void fetchHierarchy(); }, []);

    // ==========================================
    // SAVE FUNKCE (Zpracovávají POST i PUT)
    // ==========================================
    const handleSaveCategory = async () => {
        if (!catForm.name.trim()) return;
        const method = catForm.id ? 'PUT' : 'POST';
        const url = catForm.id ? `http://localhost:8080/api/v1/position-settings/categories/${catForm.id}` : 'http://localhost:8080/api/v1/position-settings/categories';

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: catForm.name, hexColor: catForm.color, sortOrder: catForm.order, isActive: catForm.active })
            });
            if (response.ok) { setIsCatDialogOpen(false); await fetchHierarchy(); }
        } catch (error) { console.error(error); }
    };

    const handleSaveStation = async () => {
        if (!statForm.name.trim() || !selectedCatId) return;
        const method = statForm.id ? 'PUT' : 'POST';
        const url = statForm.id ? `http://localhost:8080/api/v1/position-settings/stations/${statForm.id}` : 'http://localhost:8080/api/v1/position-settings/stations';

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: statForm.name, categoryId: selectedCatId, capacityLimit: statForm.capacityLimit, isActive: statForm.active, needsQualification: statForm.needsQualification })
            });
            if (response.ok) { setIsStatDialogOpen(false); await fetchHierarchy(); }
        } catch (error) { console.error(error); }
    };

    const handleSaveTemplate = async () => {
        if (!tmplForm.name.trim() || !selectedStatId) return;

        const method = tmplForm.id ? 'PUT' : 'POST';
        const url = tmplForm.id ? `http://localhost:8080/api/v1/position-settings/templates/${tmplForm.id}` : 'http://localhost:8080/api/v1/position-settings/templates';

        interface TemplatePayload { name: string; stationId: number; workersNeeded: number; isActive: boolean; startTime?: string; endTime?: string; startTime2?: string; endTime2?: string; }
        const payload: TemplatePayload = { name: tmplForm.name, stationId: selectedStatId, workersNeeded: tmplForm.workersNeeded, isActive: tmplForm.active };

        if (tmplForm.shiftType === 'full') {
            payload.startTime = tmplForm.fullStartTime; payload.endTime = tmplForm.fullEndTime;
        } else {
            if (!tmplForm.hasDopo && !tmplForm.hasOdpo) return;
            if (tmplForm.hasDopo && tmplForm.hasOdpo) {
                payload.startTime = tmplForm.dopoStartTime; payload.endTime = tmplForm.dopoEndTime;
                payload.startTime2 = tmplForm.odpoStartTime; payload.endTime2 = tmplForm.odpoEndTime;
            } else if (tmplForm.hasDopo) { payload.startTime = tmplForm.dopoStartTime; payload.endTime = tmplForm.dopoEndTime; }
            else if (tmplForm.hasOdpo) { payload.startTime = tmplForm.odpoStartTime; payload.endTime = tmplForm.odpoEndTime; }
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
            if (response.ok) { setIsTmplDialogOpen(false); await fetchHierarchy(); }
        } catch (error) { console.error(error); }
    };

    // ==========================================
    // DELETE A DEAKTIVACE
    // ==========================================
    const executeDeleteOrDeactivate = async (action: 'deactivate' | 'hard_delete') => {
        if (!deleteDialog.id) return;
        try {
            const token = localStorage.getItem('token');
            let url = `http://localhost:8080/api/v1/position-settings/`;
            if (deleteDialog.type === 'category') url += `categories/${deleteDialog.id}`;
            if (deleteDialog.type === 'station') url += `stations/${deleteDialog.id}`;
            if (deleteDialog.type === 'template') url += `templates/${deleteDialog.id}`;

            if (action === 'hard_delete') {
                await fetch(url, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            } else {
                let itemData: DeactivationPayload = { isActive: false };

                if (deleteDialog.type === 'category') {
                    itemData = { name: deleteDialog.name, hexColor: '#000000', isActive: false };
                } else if (deleteDialog.type === 'station') {
                    itemData = { name: deleteDialog.name, categoryId: selectedCatId, isActive: false };
                } else if (deleteDialog.type === 'template') {
                    itemData = { name: deleteDialog.name, stationId: selectedStatId, workersNeeded: 1, startTime: "08:00", endTime: "16:00", isActive: false };
                }
                await fetch(url, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(itemData)
                });
            }

            // --- ZDE JE MAGIE PRO RESET SLOUPCŮ ---
            if (deleteDialog.type === 'category') {
                setSelectedCatId(null);
                setSelectedStatId(null);
            } else if (deleteDialog.type === 'station') {
                setSelectedStatId(null);
            }

            setDeleteDialog({ open: false, type: 'category', id: null, name: '' });
            setDeleteConfirmText('');
            await fetchHierarchy();
        } catch (error) {
            console.error(error);
            alert("Akce se nezdařila.");
        }
    };

    // --- POMOCNÉ FUNKCE PRO OTEVŘENÍ EDITACE ---
    const openEditCategory = (cat: Category) => { setCatForm({ id: cat.id, name: cat.name, color: cat.color, order: 1, active: cat.isActive !== false }); setIsCatDialogOpen(true); };
    const openEditStation = (stat: Station) => { setStatForm({ id: stat.id, name: stat.name, capacityLimit: stat.capacityLimit || 1, active: stat.isActive !== false, needsQualification: stat.needsQualification || false }); setIsStatDialogOpen(true); };
    const openEditTemplate = (tmpl: Template) => {
        const isSplit = !!tmpl.startTime2;
        setTmplForm({
            id: tmpl.id, name: tmpl.name, shiftType: isSplit ? 'split' : 'full', workersNeeded: tmpl.workersNeeded, active: tmpl.isActive !== false, useOpeningHours: false,
            fullStartTime: isSplit ? '08:00' : (tmpl.startTime?.substring(0,5) || '08:00'), fullEndTime: isSplit ? '16:00' : (tmpl.endTime?.substring(0,5) || '16:00'),
            hasDopo: isSplit ? !!tmpl.startTime : true, dopoStartTime: tmpl.startTime?.substring(0,5) || '08:00', dopoEndTime: tmpl.endTime?.substring(0,5) || '12:00',
            hasOdpo: isSplit ? !!tmpl.startTime2 : true, odpoStartTime: tmpl.startTime2?.substring(0,5) || '13:00', odpoEndTime: tmpl.endTime2?.substring(0,5) || '17:00'
        });
        setIsTmplDialogOpen(true);
    };

    // --- FILTROVÁNÍ DAT PODLE "OČIČEK" ---
    const visibleCategories = categories.filter(c => showInactiveCats || c.isActive !== false);
    const currentCategory = categories.find(c => c.id === selectedCatId);
    const stationsRaw = currentCategory?.stations || [];
    const visibleStations = stationsRaw.filter(s => showInactiveStats || s.isActive !== false);
    const currentStation = stationsRaw.find(s => s.id === selectedStatId);
    const templatesRaw = currentStation?.templates || [];
    const visibleTemplates = templatesRaw.filter(t => showInactiveTmpls || t.isActive !== false);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

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
                            {visibleCategories.map(cat => (
                                <ListItem key={cat.id} disablePadding secondaryAction={<Box>
                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEditCategory(cat); }}><EditIcon fontSize="small"/></IconButton>
                                    <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, type: 'category', id: cat.id, name: cat.name }); }}><DeleteIcon fontSize="small"/></IconButton>
                                </Box>} sx={{ borderLeft: selectedCatId === cat.id ? `6px solid ${cat.color}` : '6px solid transparent', opacity: cat.isActive === false ? 0.5 : 1 }}>
                                    <ListItemButton selected={selectedCatId === cat.id} onClick={() => { setSelectedCatId(cat.id); setSelectedStatId(null); }}>
                                        <ListItemText primary={cat.name} secondary={cat.isActive === false && "Neaktivní"} primaryTypographyProps={{ fontWeight: selectedCatId === cat.id ? 'bold' : 'normal' }} />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                        <Divider />
                        <Button startIcon={<AddIcon />} sx={{ p: 2, fontWeight: 'bold' }} onClick={() => { setCatForm({ id: null, name: '', color: '#2e7d32', order: 1, active: true }); setIsCatDialogOpen(true); }}>přidat kategorii</Button>
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
                            {visibleStations.map(stat => (
                                <ListItem key={stat.id} disablePadding secondaryAction={<Box>
                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEditStation(stat); }}><EditIcon fontSize="small"/></IconButton>
                                    <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, type: 'station', id: stat.id, name: stat.name }); }}><DeleteIcon fontSize="small"/></IconButton>
                                </Box>} sx={{ opacity: stat.isActive === false ? 0.5 : 1 }}>
                                    <ListItemButton selected={selectedStatId === stat.id} onClick={() => setSelectedStatId(stat.id)}>
                                        <ListItemText primary={stat.name} secondary={stat.isActive === false ? "Neaktivní" : `Kapacita: ${stat.capacityLimit || 1}`} />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                        <Divider />
                        <Button startIcon={<AddIcon />} disabled={!selectedCatId} sx={{ p: 2, fontWeight: 'bold' }} onClick={() => { setStatForm({ id: null, name: '', capacityLimit: 1, active: true, needsQualification: false }); setIsStatDialogOpen(true); }}>přidat stanoviště</Button>
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
                            {visibleTemplates.map(tmpl => (
                                <Paper key={tmpl.id} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: 'white', opacity: tmpl.isActive === false ? 0.5 : 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography fontWeight="bold">
                                            {tmpl.name} {tmpl.isActive === false && <Typography component="span" variant="caption" color="error">(Neaktivní)</Typography>}
                                        </Typography>
                                        <Box>
                                            <IconButton size="small" onClick={() => openEditTemplate(tmpl)}><EditIcon fontSize="small"/></IconButton>
                                            <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, type: 'template', id: tmpl.id, name: tmpl.name })}><DeleteIcon fontSize="small"/></IconButton>
                                        </Box>
                                    </Box>
                                    <Typography variant="body2" color="textSecondary">
                                        <strong>Čas:</strong> {tmpl.timeRange || (tmpl.startTime2 ? `${tmpl.startTime?.substring(0,5)} - ${tmpl.endTime?.substring(0,5)} a ${tmpl.startTime2?.substring(0,5)} - ${tmpl.endTime2?.substring(0,5)}` : `${tmpl.startTime?.substring(0,5)} - ${tmpl.endTime?.substring(0,5)}`)}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary"><strong>Lidí:</strong> {tmpl.workersNeeded}</Typography>
                                </Paper>
                            ))}
                        </Box>
                        <Divider />
                        <Button startIcon={<AddIcon />} disabled={!selectedStatId} sx={{ p: 2, fontWeight: 'bold' }} onClick={() => { setTmplForm({ id: null, name: '', shiftType: 'full', workersNeeded: 1, active: true, useOpeningHours: false, fullStartTime: '08:00', fullEndTime: '16:00', hasDopo: true, dopoStartTime: '08:00', dopoEndTime: '12:00', hasOdpo: true, odpoStartTime: '13:00', odpoEndTime: '17:00' }); setIsTmplDialogOpen(true); }}>přidat šablonu</Button>
                    </Paper>
                </Stack>
            )}

            {/* --- VAROVNÝ DIALOG PRO MAZÁNÍ --- */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ ...deleteDialog, open: false })} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#d32f2f', fontWeight: 'bold' }}>
                    <WarningIcon /> Bezpečné odstranění položky
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" mb={2}>
                        Chystáte se smazat položku: <strong>{deleteDialog.name}</strong>.
                    </Typography>
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        <strong>DŮRAZNĚ DOPORUČUJEME POLOŽKU POUZE DEAKTIVOVAT (SKRÝT).</strong>
                        <br />
                        Pokud tuto položku natvrdo smažete z databáze a historicky už na ni byla navázána nějaká směna nebo docházka, systém může smazat i tyto historické záznamy. Deaktivací se položka skryje ze všech budoucích plánování, ale historie zůstane zachována.
                    </Alert>

                    <Typography variant="body2" color="textSecondary" mb={1}>
                        Pokud opravdu trváte na tvrdém smazání z databáze, napište slovo <strong>SMAZAT</strong> do pole níže:
                    </Typography>
                    <TextField fullWidth size="small" variant="outlined" placeholder="SMAZAT" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} />
                </DialogContent>
                <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Button onClick={() => { setDeleteDialog({ ...deleteDialog, open: false }); setDeleteConfirmText(''); }} color="inherit">
                        ZRŮŠIT
                    </Button>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button onClick={() => executeDeleteOrDeactivate('hard_delete')} disabled={deleteConfirmText !== 'SMAZAT'} color="error" variant="outlined">
                            TRVALE SMAZAT
                        </Button>
                        <Button onClick={() => executeDeleteOrDeactivate('deactivate')} variant="contained" color="success">
                            DEAKTIVOVAT (BEZPEČNÉ)
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>


            {/* --- DIALOGY KATEGORIE A STANOVIŠTĚ --- */}
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
                        <FormControlLabel control={<Switch checked={catForm.active} onChange={e => setCatForm({ ...catForm, active: e.target.checked })} />} label="Aktivní kategorie" />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}><Button onClick={() => setIsCatDialogOpen(false)} color="inherit">ZRUŠIT</Button><Button onClick={handleSaveCategory} variant="contained" sx={{ bgcolor: '#3e3535', borderRadius: 2, px: 3 }}>ULOŽIT</Button></DialogActions>
            </Dialog>

            <Dialog open={isStatDialogOpen} onClose={() => setIsStatDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 'bold' }}>{statForm.id ? 'Úprava stanoviště' : 'Přidání nového stanoviště'}</DialogTitle>
                <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField fullWidth label="Název stanoviště" value={statForm.name} onChange={e => setStatForm({ ...statForm, name: e.target.value })} autoFocus />
                    <Stack direction="row" spacing={2} alignItems="center">
                        <TextField label="Kapacitní limit" type="number" sx={{ width: 130 }} value={statForm.capacityLimit} onChange={e => setStatForm({ ...statForm, capacityLimit: parseInt(e.target.value) || 1 })} />
                        <FormControlLabel control={<Switch checked={statForm.active} onChange={e => setStatForm({ ...statForm, active: e.target.checked })} />} label="Aktivní stanoviště" />
                    </Stack>
                    <FormControlLabel control={<Switch checked={statForm.needsQualification} onChange={e => setStatForm({ ...statForm, needsQualification: e.target.checked })} />} label="Potřeba kvalifikace" />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}><Button onClick={() => setIsStatDialogOpen(false)} color="inherit">ZRUŠIT</Button><Button onClick={handleSaveStation} variant="contained" sx={{ bgcolor: '#3e3535', borderRadius: 2, px: 3 }}>ULOŽIT</Button></DialogActions>
            </Dialog>

            {/* --- VYLEPŠENÝ DIALOG: ŠABLONY --- */}
            <Dialog open={isTmplDialogOpen} onClose={() => setIsTmplDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 'bold' }}>{tmplForm.id ? 'Úprava Šablony' : 'Nová Šablona Směny'}</DialogTitle>
                <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                    <TextField fullWidth label="Název šablony (např. Varianta 1)" value={tmplForm.name} onChange={e => setTmplForm({ ...tmplForm, name: e.target.value })} autoFocus />

                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography fontWeight="bold">Typ směny:</Typography>
                        <RadioGroup row value={tmplForm.shiftType} onChange={e => setTmplForm({ ...tmplForm, shiftType: e.target.value })}>
                            <FormControlLabel value="full" control={<Radio />} label="V kuse (1 úsek)" />
                            <FormControlLabel value="split" control={<Radio />} label="Dopo / Odpo" />
                        </RadioGroup>
                    </Stack>

                    <Stack direction="row" spacing={3} alignItems="center">
                        <TextField label="Počet pracovníků" type="number" sx={{ width: 140 }} value={tmplForm.workersNeeded} onChange={e => setTmplForm({ ...tmplForm, workersNeeded: parseInt(e.target.value) || 1 })} />
                        <FormControlLabel control={<Switch checked={tmplForm.active} onChange={e => setTmplForm({ ...tmplForm, active: e.target.checked })} />} label="Aktivní šablona" />
                    </Stack>

                    {tmplForm.shiftType === 'full' ? (
                        <Stack direction="row" spacing={2}>
                            <TextField label="Od" type="time" fullWidth value={tmplForm.fullStartTime} onChange={e => setTmplForm({ ...tmplForm, fullStartTime: e.target.value })} InputLabelProps={{ shrink: true }} inputProps={{ step: 300 }} />
                            <TextField label="Do" type="time" fullWidth value={tmplForm.fullEndTime} onChange={e => setTmplForm({ ...tmplForm, fullEndTime: e.target.value })} InputLabelProps={{ shrink: true }} inputProps={{ step: 300 }} />
                        </Stack>
                    ) : (
                        <Box sx={{ border: '1px solid #90caf9', borderRadius: 2, p: 2, bgcolor: '#f3f8fd', display: 'flex', flexDirection: 'column', gap: 2 }}>

                            <FormControlLabel
                                control={<Switch checked={tmplForm.useOpeningHours} onChange={e => setTmplForm({ ...tmplForm, useOpeningHours: e.target.checked })} />}
                                label="Čas generovat podle otevírací doby areálu"
                            />

                            <Box sx={{ opacity: tmplForm.hasDopo ? 1 : 0.5 }}>
                                <FormControlLabel
                                    control={<Checkbox checked={tmplForm.hasDopo} onChange={e => setTmplForm({ ...tmplForm, hasDopo: e.target.checked })} />}
                                    label={<Typography fontWeight="bold">Dopolední část (Dopo)</Typography>}
                                />
                                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                                    <TextField disabled={!tmplForm.hasDopo || tmplForm.useOpeningHours} label="Od" type="time" fullWidth size="small" value={tmplForm.dopoStartTime} onChange={e => setTmplForm({ ...tmplForm, dopoStartTime: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ bgcolor: (tmplForm.hasDopo && !tmplForm.useOpeningHours) ? 'white' : 'transparent', borderRadius: 1 }} />
                                    <TextField disabled={!tmplForm.hasDopo || tmplForm.useOpeningHours} label="Do" type="time" fullWidth size="small" value={tmplForm.dopoEndTime} onChange={e => setTmplForm({ ...tmplForm, dopoEndTime: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ bgcolor: (tmplForm.hasDopo && !tmplForm.useOpeningHours) ? 'white' : 'transparent', borderRadius: 1 }} />
                                </Stack>
                            </Box>

                            <Divider />

                            <Box sx={{ opacity: tmplForm.hasOdpo ? 1 : 0.5 }}>
                                <FormControlLabel
                                    control={<Checkbox checked={tmplForm.hasOdpo} onChange={e => setTmplForm({ ...tmplForm, hasOdpo: e.target.checked })} />}
                                    label={<Typography fontWeight="bold">Odpolední část (Odpo)</Typography>}
                                />
                                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                                    <TextField disabled={!tmplForm.hasOdpo || tmplForm.useOpeningHours} label="Od" type="time" fullWidth size="small" value={tmplForm.odpoStartTime} onChange={e => setTmplForm({ ...tmplForm, odpoStartTime: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ bgcolor: (tmplForm.hasOdpo && !tmplForm.useOpeningHours) ? 'white' : 'transparent', borderRadius: 1 }} />
                                    <TextField disabled={!tmplForm.hasOdpo || tmplForm.useOpeningHours} label="Do" type="time" fullWidth size="small" value={tmplForm.odpoEndTime} onChange={e => setTmplForm({ ...tmplForm, odpoEndTime: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ bgcolor: (tmplForm.hasOdpo && !tmplForm.useOpeningHours) ? 'white' : 'transparent', borderRadius: 1 }} />
                                </Stack>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setIsTmplDialogOpen(false)} color="inherit">ZRUŠIT</Button>
                    <Button onClick={handleSaveTemplate} disabled={tmplForm.shiftType === 'split' && !tmplForm.hasDopo && !tmplForm.hasOdpo} variant="contained" sx={{ bgcolor: '#3e3535', borderRadius: 2, px: 3 }}>
                        ULOŽIT
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PositionsSettingsPage;