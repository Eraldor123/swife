// src/pages/ShiftPlanner/modals/AutoPlanModal.tsx

import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, Slider, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// Import sjednocených stylů
import { plannerStyles } from '../styles/ShiftPlannerStyles';

interface Props {
    open: boolean;
    onClose: () => void;
    onConfirm: (config: AutoPlanConfig) => void;
    viewMode: 'week' | 'day';
    selectedDate: string;
}

export interface AutoPlanConfig {
    fairnessWeight: number; // 0 - 100
    trainingWeight: number; // 0 - 100
    targetDate?: string;    // Pokud je viewMode 'day', pošleme konkrétní den
}

const AutoPlanModal: React.FC<Props> = ({ open, onClose, onConfirm, viewMode, selectedDate }) => {
    // Výchozí hodnoty zůstávají: 80% spravedlnost, 10% zaučování
    const [fairness, setFairness] = useState<number>(80);
    const [training, setTraining] = useState<number>(10);

    const handleConfirm = () => {
        onConfirm({
            fairnessWeight: fairness,
            trainingWeight: training,
            targetDate: viewMode === 'day' ? selectedDate : undefined
        });
    };

    // Pomocné texty pro admina (odstraněny emoji)
    const getFairnessText = (val: number) => {
        if (val < 30) return "Hlavně zaplnit kapacity, na spravedlnost se nehledí.";
        if (val < 70) return "Vyvážený přístup (snaha o rovnoměrné dělení).";
        return "Přísná spravedlnost! Přednost mají ti s největší rezervou času.";
    };

    const getTrainingText = (val: number) => {
        if (val === 0) return "Striktní provoz (Pouze lidé s kvalifikací).";
        if (val < 40) return "Běžný provoz (Zaučení jen při nedostatku lidí).";
        if (val < 80) return "Zvýšené zaučování nových lidí na stanovištích.";
        return "Školicí nastavení! Lidé půjdou primárně tam, kde se zaučují.";
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
                Automatické plánování
                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{ ml: 'auto', color: '#94a3b8' }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                {/* Informační box o rozsahu */}
                <Box sx={plannerStyles.infoBox}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        Rozsah plánování:
                        {viewMode === 'day'
                            ? ` Pouze pro vybraný den (${new Date(selectedDate).toLocaleDateString('cs-CZ')})`
                            : ' Celý aktuální týden'}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}>
                        Algoritmus analyzuje dostupnost všech zaměstnanců a obsadí volné sloty podle nastavených priorit.
                    </Typography>
                </Box>

                {/* 1. SLIDER - SPRAVEDLNOST */}
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1 }}>
                        <Typography sx={plannerStyles.modalLabel}>Férovost rozdělení</Typography>
                        <Typography sx={{ fontWeight: 800, color: '#2563eb', fontSize: '1.1rem' }}>
                            {fairness} %
                        </Typography>
                    </Box>
                    <Slider
                        value={fairness}
                        onChange={(_, val) => setFairness(val as number)}
                        step={10}
                        min={0}
                        max={100}
                        sx={{
                            color: '#2563eb',
                            height: 6,
                            '& .MuiSlider-thumb': { width: 16, height: 16 }
                        }}
                    />
                    <Typography variant="caption" sx={{ color: '#64748b', fontStyle: 'italic', display: 'block', mt: 1 }}>
                        Informace: {getFairnessText(fairness)}
                    </Typography>
                </Box>

                {/* 2. SLIDER - ZAUČOVÁNÍ */}
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1 }}>
                        <Typography sx={plannerStyles.modalLabel}>Míra zaučování</Typography>
                        <Typography sx={{ fontWeight: 800, color: '#f59e0b', fontSize: '1.1rem' }}>
                            {training} %
                        </Typography>
                    </Box>
                    <Slider
                        value={training}
                        onChange={(_, val) => setTraining(val as number)}
                        step={10}
                        min={0}
                        max={100}
                        sx={{
                            color: '#f59e0b',
                            height: 6,
                            '& .MuiSlider-thumb': { width: 16, height: 16 }
                        }}
                    />
                    <Typography variant="caption" sx={{ color: '#64748b', fontStyle: 'italic', display: 'block', mt: 1 }}>
                        Status: {getTrainingText(training)}
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, gap: 1 }}>
                <Button
                    onClick={onClose}
                    sx={plannerStyles.modalButtons.secondary}
                >
                    Zrušit
                </Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    sx={plannerStyles.modalButtons.special}

                >
                    Spustit algoritmus
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AutoPlanModal;