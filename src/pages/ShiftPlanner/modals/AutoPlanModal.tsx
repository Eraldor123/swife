import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, Slider, IconButton, Divider
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';

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
    // Výchozí hodnoty: 80% spravedlnost (chceme odměňovat dříče), 10% zaučování (občas někoho šoupnout na nové)
    const [fairness, setFairness] = useState<number>(80);
    const [training, setTraining] = useState<number>(10);

    const handleConfirm = () => {
        onConfirm({
            fairnessWeight: fairness,
            trainingWeight: training,
            targetDate: viewMode === 'day' ? selectedDate : undefined
        });
    };

    // Pomocné texty, aby admin věděl, co to procento dělá
    const getFairnessText = (val: number) => {
        if (val < 30) return "Hlavně zaplnit kapacity, na spravedlnost se nehledí.";
        if (val < 70) return "Vyvážený přístup (snaží se to trochu dělit).";
        return "Přísná spravedlnost! Přednost mají ti, co nabídli hodně času a zatím nemají směny.";
    };

    const getTrainingText = (val: number) => {
        if (val === 0) return "0 % – Striktní provoz (Pouze lidé s kvalifikací).";
        if (val < 40) return "Běžný provoz (Sem tam někdo na zaučení, když chybí lidi).";
        if (val < 80) return "Zvýšené zaučování nových lidí na stanovištích.";
        return "100 % – ŠKOLICÍ DEN! Lidé půjdou primárně tam, kde to ještě neumí.";
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8f9fa', pb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoAwesomeIcon sx={{ color: '#ff9800' }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#3e3535' }}>
                        Automatické plánování směn
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 4, mt: 1 }}>
                <Box sx={{ bgcolor: '#e3f2fd', p: 1.5, borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                        Rozsah plánování: {viewMode === 'day' ? `Pouze pro vybraný den (${new Date(selectedDate).toLocaleDateString('cs-CZ')})` : 'Celý aktuální týden'}
                    </Typography>
                </Box>

                {/* 1. SLIDER - SPRAVEDLNOST */}
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography sx={{ fontWeight: 'bold', color: '#3e3535' }}>Férovost rozdělení (Odměna pro dříče)</Typography>
                        <Typography sx={{ fontWeight: 'bold', color: '#1976d2' }}>{fairness} %</Typography>
                    </Box>
                    <Slider
                        value={fairness}
                        onChange={(_, val) => setFairness(val as number)}
                        step={10}
                        marks
                        min={0}
                        max={100}
                        sx={{ color: '#1976d2' }}
                    />
                    <Typography variant="caption" sx={{ color: '#666', fontStyle: 'italic', display: 'block', mt: 0.5 }}>
                        💡 {getFairnessText(fairness)}
                    </Typography>
                </Box>

                <Divider />

                {/* 2. SLIDER - ZAUČOVÁNÍ */}
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography sx={{ fontWeight: 'bold', color: '#3e3535' }}>Míra zaučování</Typography>
                        <Typography sx={{ fontWeight: 'bold', color: '#ff9800' }}>{training} %</Typography>
                    </Box>
                    <Slider
                        value={training}
                        onChange={(_, val) => setTraining(val as number)}
                        step={10}
                        marks
                        min={0}
                        max={100}
                        sx={{ color: '#ff9800' }}
                    />
                    <Typography variant="caption" sx={{ color: '#666', fontStyle: 'italic', display: 'block', mt: 0.5 }}>
                        🎓 {getTrainingText(training)}
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none' }}>Zrušit</Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    sx={{ bgcolor: '#ff9800', color: 'white', borderRadius: '10px', textTransform: 'none', fontWeight: 'bold', px: 3, '&:hover': { bgcolor: '#e68a00' } }}
                    startIcon={<AutoAwesomeIcon />}
                >
                    Spustit algoritmus
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AutoPlanModal;