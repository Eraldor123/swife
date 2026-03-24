import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Tabs, Tab, List, ListItem,
    ListItemButton, ListItemText, IconButton, Button, Divider, Stack,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress,
    FormControlLabel, Switch
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// --- DEFINICE TYPŮ PODLE BACKENDU ---
interface Template {
    id: number;
    name: string;
    timeRange: string;
    workersNeeded: number;
}

interface Station {
    id: number;
    name: string;
    templates: Template[];
    isActive: boolean;
    capacityLimit?: number;
    needsQualification?: boolean; // Přidáno pro true/false logiku
}

interface Category {
    id: number;
    name: string;
    color: string;
    stations: Station[];
}

const PositionsSettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);

    // --- STAV PRO DATA Z DB ---
    const [categories, setCategories] = useState<Category[]>([]);

    // --- STAVY PRO VÝBĚR ---
    const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
    const [selectedStatId, setSelectedStatId] = useState<number | null>(null);

    // --- STAVY PRO DIALOGY ---
    const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
    const [isStatDialogOpen, setIsStatDialogOpen] = useState(false);

    // --- STAVY PRO FORMULÁŘE ---
    const [catForm, setCatForm] = useState({
        name: '',
        color: '#2e7d32',
        order: 1,
        active: true
    });

    const [statForm, setStatForm] = useState({
        name: '',
        capacityLimit: 1,
        active: true,
        needsQualification: false // Změněno na boolean
    });

    // --- NAČTENÍ DAT Z BACKENDU ---
    const fetchHierarchy = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/v1/position-settings/hierarchy', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCategories(data.categories || []);
                if (data.categories?.length > 0 && selectedCatId === null) {
                    setSelectedCatId(data.categories[0].id);
                }
            }
        } catch (error) {
            console.error("Chyba při načítání pozic:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchHierarchy();
    }, []);

    // --- FUNKCE PRO ULOŽENÍ KATEGORIE ---
    const handleAddCategory = async () => {
        if (!catForm.name.trim()) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/v1/position-settings/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: catForm.name,
                    hexColor: catForm.color,
                    sortOrder: catForm.order,
                    isActive: catForm.active
                })
            });

            if (response.ok) {
                setIsCatDialogOpen(false);
                setCatForm({ name: '', color: '#2e7d32', order: 1, active: true });
                await fetchHierarchy();
            }
        } catch (error) {
            console.error("Chyba při ukládání:", error);
        }
    };

    // --- FUNKCE PRO ULOŽENÍ STANOVIŠTĚ ---
    const handleAddStation = async () => {
        if (!statForm.name.trim() || !selectedCatId) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/v1/position-settings/stations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: statForm.name,
                    categoryId: selectedCatId,
                    capacityLimit: statForm.capacityLimit,
                    isActive: statForm.active,
                    needsQualification: statForm.needsQualification // Posíláme boolean
                })
            });

            if (response.ok) {
                setIsStatDialogOpen(false);
                setStatForm({ name: '', capacityLimit: 1, active: true, needsQualification: false });
                await fetchHierarchy();
            }
        } catch (error) {
            console.error("Chyba při ukládání stanoviště:", error);
        }
    };

    const currentCategory = categories.find(c => c.id === selectedCatId);
    const stations = currentCategory?.stations || [];
    const currentStation = stations.find(s => s.id === selectedStatId);
    const templates = currentStation?.templates || [];

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: '1400px', mx: 'auto', p: 3 }}>
            {/* HLAVIČKA */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => navigate('/dashboard/shifts')} sx={{ bgcolor: 'rgba(0,0,0,0.05)' }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#3e3535' }}>
                        Nastavení pozic
                    </Typography>
                </Box>
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                    <Tab label="Atrakce a šablony" sx={{ fontWeight: 'bold' }} />
                    <Tab label="Provoz areálu" sx={{ fontWeight: 'bold' }} />
                </Tabs>
            </Box>

            {activeTab === 0 && (
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} sx={{ alignItems: 'flex-start' }}>

                    {/* 1. PANEL: KATEGORIE */}
                    <Paper elevation={3} sx={{ borderRadius: 3, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
                        <Box sx={{ p: 2 }}><Typography variant="h6" fontWeight="bold">Hlavní Kategorie</Typography></Box>
                        <Divider />
                        <List sx={{ flexGrow: 1 }}>
                            {categories.map(cat => (
                                <ListItem key={cat.id} disablePadding secondaryAction={
                                    <Box>
                                        <IconButton size="small"><EditIcon fontSize="small"/></IconButton>
                                        <IconButton size="small" color="error"><DeleteIcon fontSize="small"/></IconButton>
                                    </Box>
                                } sx={{
                                    borderLeft: selectedCatId === cat.id ? `6px solid ${cat.color || '#2e7d32'}` : '6px solid transparent',
                                }}>
                                    <ListItemButton selected={selectedCatId === cat.id} onClick={() => { setSelectedCatId(cat.id); setSelectedStatId(null); }}>
                                        <ListItemText primary={cat.name} primaryTypographyProps={{ fontWeight: selectedCatId === cat.id ? 'bold' : 'normal' }} />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                        <Divider />
                        <Button startIcon={<AddIcon />} sx={{ p: 2, fontWeight: 'bold' }} onClick={() => setIsCatDialogOpen(true)}>
                            přidat kategorii
                        </Button>
                    </Paper>

                    {/* 2. PANEL: STANOVIŠTĚ */}
                    <Paper elevation={3} sx={{ borderRadius: 3, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
                        <Box sx={{ p: 2 }}><Typography variant="h6" fontWeight="bold">Stanoviště</Typography></Box>
                        <Divider />
                        <List sx={{ flexGrow: 1 }}>
                            {stations.length === 0 ? (
                                <Typography sx={{ p: 3, color: 'text.secondary', fontStyle: 'italic' }}>Žádná stanoviště</Typography>
                            ) : (
                                stations.map(stat => (
                                    <ListItem key={stat.id} disablePadding secondaryAction={
                                        <Box><IconButton size="small"><EditIcon fontSize="small"/></IconButton></Box>
                                    }>
                                        <ListItemButton selected={selectedStatId === stat.id} onClick={() => setSelectedStatId(stat.id)}>
                                            <ListItemText
                                                primary={stat.name}
                                                secondary={!stat.isActive ? "Neaktivní" : `Kapacita: ${stat.capacityLimit || 1}`}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))
                            )}
                        </List>
                        <Divider />
                        <Button startIcon={<AddIcon />} disabled={!selectedCatId} sx={{ p: 2, fontWeight: 'bold' }} onClick={() => setIsStatDialogOpen(true)}>
                            přidat stanoviště
                        </Button>
                    </Paper>

                    {/* 3. PANEL: ŠABLONY */}
                    <Paper elevation={3} sx={{ borderRadius: 3, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '600px', bgcolor: '#f8f9fa' }}>
                        <Box sx={{ p: 2 }}><Typography variant="h6" fontWeight="bold">Šablony směn</Typography></Box>
                        <Divider />
                        <Box sx={{ p: 2, flexGrow: 1 }}>
                            {templates.length === 0 ? (
                                <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>Vyberte stanoviště</Typography>
                            ) : (
                                templates.map(tmpl => (
                                    <Paper key={tmpl.id} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: 'white' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography fontWeight="bold">{tmpl.name}</Typography>
                                            <IconButton size="small"><EditIcon fontSize="small"/></IconButton>
                                        </Box>
                                        <Typography variant="body2" color="textSecondary"><strong>Čas:</strong> {tmpl.timeRange}</Typography>
                                        <Typography variant="body2" color="textSecondary"><strong>Lidí:</strong> {tmpl.workersNeeded}</Typography>
                                    </Paper>
                                ))
                            )}
                        </Box>
                        <Divider />
                        <Button startIcon={<AddIcon />} disabled={!selectedStatId} sx={{ p: 2, fontWeight: 'bold' }}>
                            přidat šablonu
                        </Button>
                    </Paper>
                </Stack>
            )}

            {/* --- DIALOG PRO KATEGORII --- */}
            <Dialog open={isCatDialogOpen} onClose={() => setIsCatDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 'bold' }}>Přidání nové hlavní kategorie</DialogTitle>
                <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                        fullWidth
                        label="Název kategorie"
                        variant="outlined"
                        value={catForm.name}
                        onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                        autoFocus
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, border: '1px solid #ccc', borderRadius: 2 }}>
                        <input
                            type="color"
                            value={catForm.color}
                            onChange={(e) => setCatForm({ ...catForm, color: e.target.value })}
                            style={{ width: '50px', height: '50px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                        />
                        <Box>
                            <Typography variant="caption" color="textSecondary">Barva (HEX)</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold', color: catForm.color }}>
                                {catForm.color.toUpperCase()}
                            </Typography>
                        </Box>
                    </Box>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <TextField
                            label="Pořadí"
                            type="number"
                            sx={{ width: '100px' }}
                            value={catForm.order}
                            onChange={(e) => setCatForm({ ...catForm, order: parseInt(e.target.value) || 0 })}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={catForm.active}
                                    onChange={(e) => setCatForm({ ...catForm, active: e.target.checked })}
                                />
                            }
                            label="Aktivní kategorie"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setIsCatDialogOpen(false)} color="inherit">ZRŮŠIT</Button>
                    <Button onClick={handleAddCategory} variant="contained" sx={{ bgcolor: '#3e3535', borderRadius: '8px', px: 3 }}>
                        ULOŽIT KATEGORII
                    </Button>
                </DialogActions>
            </Dialog>

            {/* --- DIALOG PRO STANOVIŠTĚ --- */}
            <Dialog open={isStatDialogOpen} onClose={() => setIsStatDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 'bold' }}>Přidání nové stanoviště</DialogTitle>
                <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                        fullWidth
                        label="Název stanoviště"
                        variant="outlined"
                        value={statForm.name}
                        onChange={(e) => setStatForm({ ...statForm, name: e.target.value })}
                        autoFocus
                    />
                    <Stack direction="row" spacing={2} alignItems="center">
                        <TextField
                            label="Kapacitní limit"
                            type="number"
                            sx={{ width: '130px' }}
                            value={statForm.capacityLimit}
                            onChange={(e) => setStatForm({ ...statForm, capacityLimit: parseInt(e.target.value) || 1 })}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={statForm.active}
                                    onChange={(e) => setStatForm({ ...statForm, active: e.target.checked })}
                                />
                            }
                            label="Aktivní stanoviště"
                        />
                    </Stack>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={statForm.needsQualification}
                                onChange={(e) => setStatForm({ ...statForm, needsQualification: e.target.checked })}
                            />
                        }
                        label="Potřeba kvalifikace"
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setIsStatDialogOpen(false)} color="inherit">ZRŮŠIT</Button>
                    <Button onClick={handleAddStation} variant="contained" sx={{ bgcolor: '#3e3535', borderRadius: '8px', px: 3 }}>
                        ULOŽIT STANOVIŠTĚ
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PositionsSettingsPage;