// src/pages/ShiftPlanner/modals/GenerateShiftsModal.tsx

import React, { useState, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Box, Select, MenuItem,
    FormControl, InputLabel, Typography, ToggleButtonGroup, ToggleButton,
    RadioGroup, FormControlLabel, Radio, Checkbox, FormGroup, Divider, IconButton
} from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CloseIcon from '@mui/icons-material/Close';

import { plannerStyles } from '../styles/ShiftPlannerStyles';
import type { HierarchyData } from '../types/ShiftPlannerTypes.ts';

export interface GenerateFormValues {
    mode: 'template' | 'custom';
    startDate: string;
    endDate: string;
    templateId?: number;
    stationId?: number;
    customShiftType?: 'halfDay' | 'fullDay';
    customTimeMode?: 'exact' | 'openingHours';
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

    const [customShiftType, setCustomShiftType] = useState<'halfDay' | 'fullDay'>('halfDay');
    const [customTimeMode, setCustomTimeMode] = useState<'exact' | 'openingHours'>('openingHours');

    const [customStartTime, setCustomStartTime] = useState('08:00');
    const [customEndTime, setCustomEndTime] = useState('16:00');

    const [dopoStartTime, setDopoStartTime] = useState('08:00');
    const [dopoEndTime, setDopoEndTime] = useState('12:00');
    const [odpoStartTime, setOdpoStartTime] = useState('12:30');
    const [odpoEndTime, setOdpoEndTime] = useState('16:00');

    const [customCapacity, setCustomCapacity] = useState<number>(1);
    const [description, setDescription] = useState('');
    const [hasDopo, setHasDopo] = useState(true);
    const [hasOdpo, setHasOdpo] = useState(false);

    // =========================================================================
    // ŘEŠENÍ ESLINT ERRORU: Derived State Pattern
    // Místo použití 'useEffect' sledujeme změny props přímo během renderu.
    // Tímto se vyhneme chybě "setState synchronously within an effect".
    // =========================================================================

    // 1. Sledování změn týdne (zajistí načtení správného data)
    const [prevWeekStart, setPrevWeekStart] = useState(currentWeekStart);
    if (currentWeekStart !== prevWeekStart) {
        setPrevWeekStart(currentWeekStart);
        setStartDate(currentWeekStart);
        setEndDate(currentWeekEnd);
    }

    // 2. Sledování zavření/otevření (zajistí vyčištění formuláře)
    const [prevOpen, setPrevOpen] = useState(open);
    if (open !== prevOpen) {
        setPrevOpen(open);
        if (!open) {
            setSelectedTemplate('');
            setDescription('');
        }
    }
    // =========================================================================

    const allCategories = useMemo(() => hierarchy?.categories || [], [hierarchy]);

    const allStationsFlat = useMemo(() =>
            allCategories.flatMap(c => c.stations.map(s => ({ ...s, parentCatId: c.id }))),
        [allCategories]);

    const allTemplatesFlat = useMemo(() =>
            allStationsFlat.flatMap(s => s.templates.map(t => ({
                ...t,
                parentStationId: s.id,
                parentCatId: s.parentCatId
            }))),
        [allStationsFlat]);

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

    const availableStations = selectedCategory !== ''
        ? allStationsFlat.filter(s => s.parentCatId === selectedCategory)
        : allStationsFlat;

    const availableTemplates = selectedStation !== ''
        ? allTemplatesFlat.filter(t => t.parentStationId === selectedStation)
        : (selectedCategory !== '' ? allTemplatesFlat.filter(t => t.parentCatId === selectedCategory) : allTemplatesFlat);

    const handleGenerate = () => {
        const isOpeningHours = customShiftType === 'halfDay' && customTimeMode === 'openingHours';
        onConfirm({
            mode, startDate, endDate,
            templateId: selectedTemplate !== '' ? Number(selectedTemplate) : undefined,
            stationId: selectedStation !== '' ? Number(selectedStation) : undefined,
            customShiftType,
            customTimeMode,
            startTime: customShiftType === 'fullDay' ? customStartTime : undefined,
            endTime: customShiftType === 'fullDay' ? customEndTime : undefined,
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
        if (mode === 'template') return selectedTemplate !== '';

        if (selectedStation === '' || customCapacity < 1) return false;
        if (customShiftType === 'fullDay') return !!customStartTime && !!customEndTime;

        if (!hasDopo && !hasOdpo) return false;
        if (customTimeMode === 'openingHours') return true;

        const dopoValid = !hasDopo || (!!dopoStartTime && !!dopoEndTime);
        const odpoValid = !hasOdpo || (!!odpoStartTime && !!odpoEndTime);

        return dopoValid && odpoValid;
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: plannerStyles.modalPaper }}
        >
            <DialogTitle sx={plannerStyles.modalTitle}>
                <RocketLaunchIcon sx={{ color: '#2563eb' }} />
                Hromadné generování směn
                <IconButton onClick={onClose} size="small" sx={{ ml: 'auto', color: '#94a3b8' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <ToggleButtonGroup
                        value={mode}
                        exclusive
                        onChange={(_, val) => { if(val) { setMode(val); setSelectedTemplate(''); } }}
                        sx={plannerStyles.toggleGroup}
                    >
                        <ToggleButton value="template" sx={{ px: 4 }}>Ze šablony</ToggleButton>
                        <ToggleButton value="custom" sx={{ px: 4 }}>Vlastní rozpis</ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                <Box>
                    <Typography sx={plannerStyles.modalLabel}>Období pro generování</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} sx={plannerStyles.dropdownControl} fullWidth />
                        <TextField type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} sx={plannerStyles.dropdownControl} fullWidth />
                    </Box>
                </Box>

                <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                    <Typography sx={plannerStyles.modalLabel}>Umístění a stanoviště</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControl fullWidth size="small" sx={plannerStyles.dropdownControl}>
                            <InputLabel>Kategorie</InputLabel>
                            <Select value={selectedCategory} label="Kategorie" onChange={(e) => handleCategoryChange(e.target.value as number)}>
                                {allCategories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small" sx={plannerStyles.dropdownControl}>
                            <InputLabel>Stanoviště</InputLabel>
                            <Select value={selectedStation} label="Stanoviště" onChange={(e) => handleStationChange(e.target.value as number)}>
                                {availableStations.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                            </Select>
                        </FormControl>

                        {mode === 'template' && (
                            <FormControl fullWidth size="small" disabled={!selectedStation} sx={plannerStyles.dropdownControl}>
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
                </Box>

                {mode === 'custom' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, p: 2.5, border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                        <Box>
                            <Typography sx={plannerStyles.modalLabel}>Typ směny</Typography>
                            <RadioGroup row value={customShiftType} onChange={(e) => setCustomShiftType(e.target.value as 'halfDay' | 'fullDay')}>
                                <FormControlLabel value="halfDay" control={<Radio size="small" sx={{ color: '#2563eb' }} />} label="Dopo / Odpo" />
                                <FormControlLabel value="fullDay" control={<Radio size="small" sx={{ color: '#2563eb' }} />} label="Celodenní" />
                            </RadioGroup>
                        </Box>

                        {customShiftType === 'halfDay' && (
                            <Box sx={{ pl: 2, borderLeft: '3px solid #2563eb' }}>
                                <RadioGroup value={customTimeMode} onChange={(e) => setCustomTimeMode(e.target.value as 'exact' | 'openingHours')}>
                                    <FormControlLabel value="openingHours" control={<Radio size="small" />} label="Dle otevírací doby areálu" />
                                    <FormControlLabel value="exact" control={<Radio size="small" />} label="Vlastní časy pro bloky" />
                                </RadioGroup>

                                <FormGroup row sx={{ mt: 1 }}>
                                    <FormControlLabel control={<Checkbox checked={hasDopo} onChange={(e) => setHasDopo(e.target.checked)} sx={{ color: '#2563eb' }} />} label="Dopoledne" />
                                    <FormControlLabel control={<Checkbox checked={hasOdpo} onChange={(e) => setHasOdpo(e.target.checked)} sx={{ color: '#2563eb' }} />} label="Odpoledne" />
                                </FormGroup>
                            </Box>
                        )}

                        {customShiftType === 'fullDay' && (
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField label="Od" type="time" value={customStartTime} onChange={(e) => setCustomStartTime(e.target.value)} sx={plannerStyles.dropdownControl} fullWidth />
                                <TextField label="Do" type="time" value={customEndTime} onChange={(e) => setCustomEndTime(e.target.value)} sx={plannerStyles.dropdownControl} fullWidth />
                            </Box>
                        )}

                        {customShiftType === 'halfDay' && customTimeMode === 'exact' && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pl: 2 }}>
                                {hasDopo && (
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <TextField label="Dopoledne - Od" type="time" value={dopoStartTime} onChange={(e) => setDopoStartTime(e.target.value)} sx={plannerStyles.dropdownControl} fullWidth />
                                        <TextField label="Dopoledne - Do" type="time" value={dopoEndTime} onChange={(e) => setDopoEndTime(e.target.value)} sx={plannerStyles.dropdownControl} fullWidth />
                                    </Box>
                                )}
                                {hasOdpo && (
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <TextField label="Odpoledne - Od" type="time" value={odpoStartTime} onChange={(e) => setOdpoStartTime(e.target.value)} sx={plannerStyles.dropdownControl} fullWidth />
                                        <TextField label="Odpoledne - Do" type="time" value={odpoEndTime} onChange={(e) => setOdpoEndTime(e.target.value)} sx={plannerStyles.dropdownControl} fullWidth />
                                    </Box>
                                )}
                            </Box>
                        )}

                        <Divider />

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box>
                                <Typography sx={plannerStyles.modalLabel}>Popis a Kapacita</Typography>
                                <TextField
                                    placeholder="Např. Akce, Úklid..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    fullWidth
                                    sx={plannerStyles.dropdownControl}
                                />
                            </Box>
                            <TextField
                                label="Počet potřebných zaměstnanců"
                                type="number"
                                value={customCapacity}
                                onChange={(e) => setCustomCapacity(parseInt(e.target.value) || 1)}
                                inputProps={{ min: 1 }}
                                fullWidth
                                sx={plannerStyles.dropdownControl}
                            />
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 3, gap: 1 }}>
                <Button onClick={onClose} sx={plannerStyles.modalButtons.secondary}>Zrušit</Button>
                <Button
                    onClick={handleGenerate}
                    disabled={!isFormValid()}
                    variant="contained"
                    sx={plannerStyles.modalButtons.primary}
                >
                    Generovat směny
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default GenerateShiftsModal;