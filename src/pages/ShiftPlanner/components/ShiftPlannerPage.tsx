import React from 'react';
import {
    Box, Typography, CircularProgress, Button,
    Select, MenuItem, FormControl, InputLabel,
    ToggleButton, ToggleButtonGroup, IconButton, Paper,
    type SelectChangeEvent, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { ArrowBack, ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// --- IMPORTY LOGIKY A STYLŮ ---
import { useShiftPlannerLogic } from '../hooks/useShiftPlannerLogic';
import { plannerStyles } from '../styles/ShiftPlannerStyles';

// --- IMPORTY KOMPONENT ---
import PlannerSidebar from '../components/PlannerSidebar';
import PlannerGrid from '../components/PlannerGrid';
import DailyPlannerGrid from '../components/DailyPlannerGrid';
import CopyWeekModal from '../modals/CopyWeekModal';
import GenerateShiftsModal from '../modals/GenerateShiftsModal';
import ShiftDetailModal from '../modals/ShiftDetailModal';
import AutoPlanModal from '../modals/AutoPlanModal';

const ShiftPlannerPage: React.FC = () => {
    const navigate = useNavigate();

    // Logika zůstává oddělena v hooku
    const { state, actions } = useShiftPlannerLogic();

    const {
        viewMode, selectedCategory, currentWeekStart, endDate, scheduleData, availableUsers,
        isLoading, selectedUserId, selectedShiftForDetail, selectedDate,
        isGenerateModalOpen, isCopyModalOpen, isClearModalOpen, isAutoPlanModalOpen,
        isManagerial, activeHierarchy, allStations
    } = state;

    const {
        setViewMode, setSelectedCategory, setSelectedUserId, setSelectedShiftForDetail,
        setIsGenerateModalOpen, setIsCopyModalOpen, setIsClearModalOpen, setIsAutoPlanModalOpen,
        handleGenerateConfirm, handleCopyConfirm, handleClearConfirm, handleAutoPlanConfirm,
        handleAssignUser, handleRemoveUser, handleUpdateShift, handleSplitShift, handleDeleteShift,
        handlePrevWeek, handleNextWeek, setSelectedDate
    } = actions;

    const handleCategoryChange = (event: SelectChangeEvent<number | 'all'>) => {
        setSelectedCategory(event.target.value as number | 'all');
    };

    if (isLoading && !scheduleData) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)' }}>
                <CircularProgress sx={{ color: '#1976d2' }} />
            </Box>
        );
    }

    return (
        <Box sx={plannerStyles.mainWrapper}>
            {/* SIDEBAR: Levý panel */}
            {isManagerial && (
                <PlannerSidebar
                    users={availableUsers}
                    selectedUserId={selectedUserId}
                    onSelectUser={setSelectedUserId}
                    currentWeekDays={scheduleData?.days || []}
                    allStations={allStations}
                    shifts={scheduleData?.shifts || []}
                    viewMode={viewMode}
                    selectedDate={selectedDate}
                    onAutoPlan={() => setIsAutoPlanModalOpen(true)}
                />
            )}

            {/* HLAVNÍ OBSAH: Hlavička + Mřížka */}
            <Box sx={plannerStyles.contentColumn}>

                {/* 1. HORNÍ OVLÁDACÍ LIŠTA */}
                <Paper elevation={0} sx={plannerStyles.headerPaper}>

                    {/* Skupina A: Zpět + Nadpis */}
                    <Box sx={plannerStyles.headerTitleGroup}>
                        <IconButton onClick={() => navigate('/dashboard/shifts')} sx={plannerStyles.backButton}>
                            <ArrowBack sx={{ color: '#475569', fontSize: 24 }} />
                        </IconButton>
                        <Box sx={plannerStyles.headerTextContainer}>
                            <Typography sx={plannerStyles.headerTitle}>Směnář</Typography>
                        </Box>
                    </Box>

                    {/* Skupina B: AKČNÍ LIŠTA */}
                    {isManagerial && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button onClick={() => setIsGenerateModalOpen(true)} variant="contained" sx={plannerStyles.buttons.primary}>Generovat</Button>
                            <Button onClick={() => setIsCopyModalOpen(true)} variant="contained" sx={plannerStyles.buttons.primary}>Kopírovat</Button>
                            <Button onClick={() => setIsClearModalOpen(true)} variant="contained" sx={plannerStyles.buttons.danger}>Vyčistit</Button>
                        </Box>
                    )}

                    {/* Skupina C: PŘEPÍNAČ ZOBRAZENÍ */}
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(_, val: 'week' | 'day') => val && setViewMode(val)}
                        sx={plannerStyles.toggleGroup}
                    >
                        <ToggleButton value="week">Týden</ToggleButton>
                        <ToggleButton value="day">Den</ToggleButton>
                    </ToggleButtonGroup>

                    {/* Skupina D: DROPDOWN FILTR */}
                    <FormControl size="small" sx={plannerStyles.dropdownControl}>
                        <InputLabel>Hlavní typ</InputLabel>
                        <Select value={selectedCategory} label="Hlavní typ" onChange={handleCategoryChange}>
                            <MenuItem value="all">Všechny typy</MenuItem>
                            {activeHierarchy?.categories.map((cat) => (
                                <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box sx={{ flexGrow: 1 }} />

                    {/* Skupina E: VÝBĚR DATA */}
                    <Box sx={plannerStyles.dateNavigator}>
                        <IconButton onClick={handlePrevWeek} size="small" sx={{ color: '#64748b' }}><ArrowBackIos sx={{ fontSize: 12, ml: 0.5 }} /></IconButton>
                        <Box sx={{ textAlign: 'center', minWidth: 160 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1e293b', fontSize: '0.9rem' }}>
                                {new Date(currentWeekStart).toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })}
                            </Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>{currentWeekStart} — {endDate}</Typography>
                        </Box>
                        <IconButton onClick={handleNextWeek} size="small" sx={{ color: '#64748b' }}><ArrowForwardIos sx={{ fontSize: 12 }} /></IconButton>
                    </Box>
                </Paper>

                {/* 2. MŘÍŽKA SMĚN */}
                <Box sx={plannerStyles.gridWrapper}>
                    {viewMode === 'week' ? (
                        <PlannerGrid
                            hierarchy={selectedCategory === 'all' ? activeHierarchy : activeHierarchy ? { categories: activeHierarchy.categories.filter(c => c.id === selectedCategory) } : null}
                            scheduleData={scheduleData}
                            users={availableUsers}
                            selectedUserId={selectedUserId}
                            onAssignUser={handleAssignUser}
                            onRemoveUser={handleRemoveUser}
                            onShiftClick={(shift) => setSelectedShiftForDetail(shift)}
                        />
                    ) : (
                        <DailyPlannerGrid
                            hierarchy={selectedCategory === 'all' ? activeHierarchy : activeHierarchy ? { categories: activeHierarchy.categories.filter(c => c.id === selectedCategory) } : null}
                            scheduleData={scheduleData}
                            users={availableUsers}
                            selectedUserId={selectedUserId}
                            selectedDate={selectedDate}
                            onAssignUser={handleAssignUser}
                            onRemoveUser={handleRemoveUser}
                            onShiftClick={(shift) => setSelectedShiftForDetail(shift)}
                            onDateChange={setSelectedDate}
                        />
                    )}
                </Box>

                {/* MODÁLNÍ OKNA */}
                {isManagerial && (
                    <>
                        <GenerateShiftsModal open={isGenerateModalOpen} onClose={() => setIsGenerateModalOpen(false)} onConfirm={handleGenerateConfirm} hierarchy={activeHierarchy} currentWeekStart={currentWeekStart} currentWeekEnd={endDate} />
                        <CopyWeekModal open={isCopyModalOpen} onClose={() => setIsCopyModalOpen(false)} onConfirm={handleCopyConfirm} currentWeekStart={currentWeekStart} />
                        <AutoPlanModal open={isAutoPlanModalOpen} onClose={() => setIsAutoPlanModalOpen(false)} onConfirm={handleAutoPlanConfirm} viewMode={viewMode} selectedDate={selectedDate} />

                        {/* MUI v6 OPRAVA: PaperProps nahrazeno slotProps */}
                        <Dialog open={isClearModalOpen} onClose={() => setIsClearModalOpen(false)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: '24px', p: 1 } } }}>
                            <DialogTitle sx={{ fontWeight: 'bold', color: '#ef4444' }}>Vyčištění týdne</DialogTitle>
                            <DialogContent>
                                <Typography>Opravdu chcete smazat <strong>VŠECHNY</strong> směny v tomto týdnu ({currentWeekStart} — {endDate})?</Typography>
                                <Typography variant="body2" color="error" sx={{ mt: 2, fontWeight: 'bold' }}>Tato akce smaže i všechna přiřazení zaměstnanců na tyto směny a nelze ji vzít zpět!</Typography>
                            </DialogContent>
                            <DialogActions sx={{ p: 2 }}>
                                <Button onClick={() => setIsClearModalOpen(false)} sx={{ color: '#64748b', textTransform: 'none', fontWeight: 'bold' }}>Zrušit</Button>
                                <Button onClick={() => void handleClearConfirm()} sx={plannerStyles.buttons.danger}>Ano, vyčistit</Button>
                            </DialogActions>
                        </Dialog>
                    </>
                )}

                <ShiftDetailModal
                    key={selectedShiftForDetail?.id || 'empty'}
                    open={!!selectedShiftForDetail}
                    onClose={() => setSelectedShiftForDetail(null)}
                    shift={selectedShiftForDetail}
                    onRemoveUser={handleRemoveUser}
                    onUpdateShift={handleUpdateShift}
                    onSplitShift={handleSplitShift}
                    onDeleteShift={handleDeleteShift}
                />
            </Box>
        </Box>
    );
};

export default ShiftPlannerPage;