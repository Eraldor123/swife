// src/pages/ShiftPlanner/modals/CopyWeekModal.tsx

import React, { useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Box, Typography, IconButton
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';

import { plannerStyles } from '../styles/ShiftPlannerStyles';

// Pomocná funkce: Pokud uživatel vybere jiný den, vrátí to pondělí toho týdne
const ensureMonday = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const day = d.getDay(); // 0 = Neděle, 1 = Pondělí...
    if (day === 1) return dateString; // Už je to pondělí

    // Výpočet posunu na pondělí
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));

    // Formátování zpět na YYYY-MM-DD pro TextField
    return monday.toISOString().split('T')[0];
};

const copySchema = z.object({
    sourceWeekStart: z.string().min(1, "Zdrojový týden je povinný"),
    targetWeekStart: z.string().min(1, "Cílový týden je povinný"),
});

export type CopyFormValues = z.infer<typeof copySchema>;

interface Props {
    open: boolean;
    onClose: () => void;
    onConfirm: (data: CopyFormValues) => void;
    currentWeekStart: string;
}

const CopyWeekModal: React.FC<Props> = ({ open, onClose, onConfirm, currentWeekStart }) => {
    const { control, handleSubmit, reset, setValue } = useForm<CopyFormValues>({
        resolver: zodResolver(copySchema),
        defaultValues: {
            sourceWeekStart: currentWeekStart,
            targetWeekStart: ''
        }
    });

    useEffect(() => {
        setValue('sourceWeekStart', currentWeekStart);
    }, [currentWeekStart, setValue]);

    const handleClose = () => {
        reset({ sourceWeekStart: currentWeekStart, targetWeekStart: '' });
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{ sx: plannerStyles.modalPaper }}
        >
            <DialogTitle sx={plannerStyles.modalTitle}>
                <ContentCopyIcon sx={{ color: '#2563eb' }} />
                Kopírování týdne
                <IconButton onClick={handleClose} size="small" sx={{ ml: 'auto', color: '#94a3b8' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit(onConfirm)}>
                <DialogContent sx={{ p: 3 }}>
                    <Box sx={plannerStyles.infoBox}>
                        Zkopíruje směny do nového týdne.
                        <strong> Výběr data se automaticky zarovná na pondělí.</strong>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <Typography sx={plannerStyles.modalLabel}>Zdrojový týden</Typography>
                        <Controller
                            name="sourceWeekStart"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    type="date"
                                    fullWidth
                                    disabled
                                    sx={plannerStyles.dropdownControl}
                                />
                            )}
                        />
                    </Box>

                    <Box sx={{ mb: 1 }}>
                        <Typography sx={plannerStyles.modalLabel}>Cílový týden</Typography>
                        <Controller
                            name="targetWeekStart"
                            control={control}
                            render={({ field, fieldState }) => (
                                <TextField
                                    {...field}
                                    type="date"
                                    fullWidth
                                    // TADY JE TA ZMĚNA: Interceptujeme změnu a opravíme ji na pondělí
                                    onChange={(e) => {
                                        const correctedDate = ensureMonday(e.target.value);
                                        field.onChange(correctedDate);
                                    }}
                                    error={!!fieldState.error}
                                    helperText={fieldState.error ? fieldState.error.message : "Výběr bude automaticky upraven na pondělí"}
                                    sx={plannerStyles.dropdownControl}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                            )}
                        />
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3, gap: 1 }}>
                    <Button onClick={handleClose} sx={plannerStyles.modalButtons.secondary}>Zrušit</Button>
                    <Button type="submit" variant="contained" sx={plannerStyles.modalButtons.primary}>
                        Kopírovat týden
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default CopyWeekModal;