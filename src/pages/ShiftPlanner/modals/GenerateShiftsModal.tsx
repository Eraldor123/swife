import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Box, Select, MenuItem,
    FormControl, InputLabel, Typography, ToggleButtonGroup, ToggleButton,
    RadioGroup, FormControlLabel, Radio, Checkbox, FormGroup, Divider
} from '@mui/material';
import type { HierarchyData } from '../../../types/schedule';

export interface GenerateFormValues {
    mode: 'template' | 'custom';
    startDate: string;
    endDate: string;
    templateId?: number;
    stationId?: number;

    // Custom data
    customShiftType?: 'halfDay' | 'fullDay';
    customTimeMode?: 'exact' | 'openingHours';

    // Časy pro různé scénáře
    startTime?: string;
    endTime?: string;
    dopoStartTime?: string;
    dopoEndTime?: string;
    odpoStartTime?: string;
    odpoEndTime?: string;

    capacity?: number;
    useOpeningHours?: boolean;
    hasDopo?: boolean;
    hasOdpo?: boolean;
    description?: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    onConfirm: (data: GenerateFormValues) => void;
    hierarchy: HierarchyData | null;
    currentWeekStart: string;
    currentWeekEnd: string;
}

const GenerateShiftsModal: React.FC<Props> = ({ open, onClose, onConfirm, hierarchy, currentWeekStart, currentWeekEnd }) => {
    const [mode, setMode] = useState<'template' | 'custom'>('template');
    const [startDate, setStartDate] = useState(currentWeekStart);
    const [endDate, setEndDate] = useState(currentWeekEnd);

    const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
    const [selectedStation, setSelectedStation] = useState<number | ''>('');
    const [selectedTemplate, setSelectedTemplate] = useState<number | ''>('');

    // Vlastní směna - stavové proměnné
    const [customShiftType, setCustomShiftType] = useState<'halfDay' | 'fullDay'>('halfDay');
    const [customTimeMode, setCustomTimeMode] = useState<'exact' | 'openingHours'>('openingHours');

    const [customStartTime, setCustomStartTime] = useState('08:00');
    const [customEndTime, setCustomEndTime] = useState('16:00');

    // Nové časy pro oddělené Dopo/Odpo (Řešení B)
    const [dopoStartTime, setDopoStartTime] = useState('08:00');
    const [dopoEndTime, setDopoEndTime] = useState('12:00');
    const [odpoStartTime, setOdpoStartTime] = useState('12:30');
    const [odpoEndTime, setOdpoEndTime] = useState('16:00');

    const [customCapacity, setCustomCapacity] = useState<number>(1);
    const [description, setDescription] = useState('');
    const [hasDopo, setHasDopo] = useState(true);
    const [hasOdpo, setHasOdpo] = useState(false);

    useEffect(() => {
        if (open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setStartDate(currentWeekStart);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setEndDate(currentWeekEnd);
        }
    }, [open, currentWeekStart, currentWeekEnd]);

    const allCategories = hierarchy?.categories || [];
    const allStationsFlat = useMemo(() => allCategories.flatMap(c => c.stations.map(s => ({ ...s, parentCatId: c.id }))), [allCategories]);
    const allTemplatesFlat = useMemo(() => allStationsFlat.flatMap(s => s.templates.map(t => ({ ...t, parentStationId: s.id, parentCatId: s.parentCatId }))), [allStationsFlat]);

    const handleTemplateChange = (templateId: number) => {
        setSelectedTemplate(templateId);
        const t = allTemplatesFlat.find(tmpl => tmpl.id === templateId);
        if (t) {
            setSelectedStation(t.parentStationId);
            setSelectedCategory(t.parentCatId);
        }
    };

    const handleStationChange = (stationId: number) => {
        setSelectedStation(stationId);
        setSelectedTemplate('');
        const s = allStationsFlat.find(st => st.id === stationId);
        if (s) {
            setSelectedCategory(s.parentCatId);
        }
    };

    const handleCategoryChange = (catId: number) => {
        setSelectedCategory(catId);
        setSelectedStation('');
        setSelectedTemplate('');
    };

    const availableStations = selectedCategory !== '' ? allStationsFlat.filter(s => s.parentCatId === selectedCategory) : allStationsFlat;
    const availableTemplates = selectedStation !== '' ? allTemplatesFlat.filter(t => t.parentStationId === selectedStation)
        : (selectedCategory !== '' ? allTemplatesFlat.filter(t => t.parentCatId === selectedCategory) : allTemplatesFlat);

    const handleGenerate = () => {
        const isOpeningHours = customShiftType === 'halfDay' && customTimeMode === 'openingHours';

        onConfirm({
            mode, startDate, endDate,
            templateId: selectedTemplate !== '' ? Number(selectedTemplate) : undefined,
            stationId: selectedStation !== '' ? Number(selectedStation) : undefined,

            customShiftType,
            customTimeMode,

            // Pro celodenní
            startTime: customShiftType === 'fullDay' ? customStartTime : undefined,
            endTime: customShiftType === 'fullDay' ? customEndTime : undefined,

            // Pro oddělené dopo/odpo
            dopoStartTime, dopoEndTime,
            odpoStartTime, odpoEndTime,

            capacity: customCapacity,
            useOpeningHours: isOpeningHours,
            hasDopo: customShiftType === 'halfDay' ? hasDopo : undefined,
            hasOdpo: customShiftType === 'halfDay' ? hasOdpo : undefined,
            description: description.trim() !== '' ? description.trim() : undefined
        });
    };

    const isFormValid = () => {
        if (!startDate || !endDate) return false;
        if (mode === 'template') {
            return selectedTemplate !== '';
        } else {
            if (selectedStation === '' || customCapacity < 1) return false;

            if (customShiftType === 'fullDay') return !!customStartTime && !!customEndTime;

            if (customShiftType === 'halfDay') {
                if (!hasDopo && !hasOdpo) return false;
                if (customTimeMode === 'openingHours') return true;
                if (customTimeMode === 'exact') {
                    if (hasDopo && (!dopoStartTime || !dopoEndTime)) return false;
                    if (hasOdpo && (!odpoStartTime || !odpoEndTime)) return false;
                    return true;
                }
            }
            return false;
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
            <DialogTitle sx={{ bgcolor: '#f8f9fa', pb: 2, fontWeight: 'bold' }}>
                Hromadné generování směn
            </DialogTitle>

            <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>

                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <ToggleButtonGroup
                        color="primary"
                        value={mode}
                        exclusive
                        onChange={(_, val) => { if(val) { setMode(val); setSelectedTemplate(''); } }}
                        size="small"
                        sx={{ mb: 1 }}
                    >
                        <ToggleButton value="template" sx={{ px: 3, textTransform: 'none', fontWeight: 'bold' }}>Ze šablony</ToggleButton>
                        <ToggleButton value="custom" sx={{ px: 3, textTransform: 'none', fontWeight: 'bold' }}>Vlastní (bez šablony)</ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField label="Od" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth size="small" />
                    <TextField label="Do" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth size="small" />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">Zvolte umístění</Typography>

                    {/* VIZUÁLNÍ OPRAVA: Logické pořadí od největšího po nejmenší */}
                    <FormControl fullWidth size="small">
                        <InputLabel>Kategorie (Hlavní typ)</InputLabel>
                        <Select value={selectedCategory} label="Kategorie (Hlavní typ)" onChange={(e) => handleCategoryChange(e.target.value as number)}>
                            {allCategories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                        <InputLabel>Stanoviště</InputLabel>
                        <Select value={selectedStation} label="Stanoviště" onChange={(e) => handleStationChange(e.target.value as number)}>
                            {availableStations.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                        </Select>
                    </FormControl>

                    {mode === 'template' && (
                        <FormControl fullWidth size="small" disabled={!selectedStation}>
                            <InputLabel>Vybrat šablonu</InputLabel>
                            <Select value={selectedTemplate} label="Vybrat šablonu" onChange={(e) => handleTemplateChange(e.target.value as number)}>
                                {availableTemplates.map(t => (
                                    <MenuItem key={t.id} value={t.id}>
                                        {t.name} ({(t as { timeRange?: string }).timeRange || 'Dle šablony'})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </Box>

                {mode === 'custom' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, border: '1px solid #eee', borderRadius: 2 }}>

                        <RadioGroup row value={customShiftType} onChange={(e) => setCustomShiftType(e.target.value as 'halfDay' | 'fullDay')}>
                            <FormControlLabel value="halfDay" control={<Radio size="small" />} label="Dopo/Odpo směna" />
                            <FormControlLabel value="fullDay" control={<Radio size="small" />} label="Celodenní směna" />
                        </RadioGroup>

                        {/* Pokud je vybráno Dopo/Odpo, zobrazíme přepínač Otevírací doba / Vlastní a checkboxy */}
                        {customShiftType === 'halfDay' && (
                            <>
                                <RadioGroup row value={customTimeMode} onChange={(e) => setCustomTimeMode(e.target.value as 'exact' | 'openingHours')} sx={{ pl: 2, borderLeft: '3px solid #1976d2', mb: 1 }}>
                                    <FormControlLabel value="openingHours" control={<Radio size="small" />} label="Dle otevírací doby" />
                                    <FormControlLabel value="exact" control={<Radio size="small" />} label="Vlastní časy" />
                                </RadioGroup>

                                <FormGroup row sx={{ ml: 1 }}>
                                    <FormControlLabel control={<Checkbox checked={hasDopo} onChange={(e) => setHasDopo(e.target.checked)} />} label="Dopoledne" />
                                    <FormControlLabel control={<Checkbox checked={hasOdpo} onChange={(e) => setHasOdpo(e.target.checked)} />} label="Odpoledne" />
                                </FormGroup>
                            </>
                        )}

                        {/* Časová pole pro Celodenní směnu */}
                        {customShiftType === 'fullDay' && (
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField label="Čas Od" type="time" value={customStartTime} onChange={(e) => setCustomStartTime(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth size="small" />
                                <TextField label="Čas Do" type="time" value={customEndTime} onChange={(e) => setCustomEndTime(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth size="small" />
                            </Box>
                        )}

                        {/* Časová pole pro Dopo/Odpo Vlastní časy (Řešení B) */}
                        {customShiftType === 'halfDay' && customTimeMode === 'exact' && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pl: 2, mt: 1 }}>
                                {hasDopo && (
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <TextField label="Dopoledne - Od" type="time" value={dopoStartTime} onChange={(e) => setDopoStartTime(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth size="small" />
                                        <TextField label="Dopoledne - Do" type="time" value={dopoEndTime} onChange={(e) => setDopoEndTime(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth size="small" />
                                    </Box>
                                )}
                                {hasOdpo && (
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <TextField label="Odpoledne - Od" type="time" value={odpoStartTime} onChange={(e) => setOdpoStartTime(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth size="small" />
                                        <TextField label="Odpoledne - Do" type="time" value={odpoEndTime} onChange={(e) => setOdpoEndTime(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth size="small" />
                                    </Box>
                                )}
                            </Box>
                        )}

                        <Divider sx={{ my: 1 }} />

                        <TextField
                            label="Popisek směny (např. Školní výlet, Svatba)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            fullWidth
                            size="small"
                            placeholder="Zobrazí se v detailu směny"
                        />
                        <TextField
                            label="Potřebný počet lidí"
                            type="number"
                            value={customCapacity}
                            onChange={(e) => setCustomCapacity(parseInt(e.target.value) || 1)}
                            InputProps={{ inputProps: { min: 1 } }}
                            fullWidth
                            size="small"
                        />
                    </Box>
                )}

            </DialogContent>

            <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none' }}>Zrušit</Button>
                <Button onClick={handleGenerate} disabled={!isFormValid()} variant="contained" sx={{ bgcolor: '#3e3535', borderRadius: '10px', textTransform: 'none' }}>
                    Generovat
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default GenerateShiftsModal;