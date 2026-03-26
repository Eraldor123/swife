import React, { useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography } from '@mui/material';
import { useForm, Controller, type ControllerRenderProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

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

    // Udržujeme zdrojový týden aktuální podle toho, kde se uživatel v kalendáři zrovna nachází
    useEffect(() => {
        setValue('sourceWeekStart', currentWeekStart);
    }, [currentWeekStart, setValue]);

    const handleClose = () => {
        reset({ sourceWeekStart: currentWeekStart, targetWeekStart: '' });
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
            <DialogTitle sx={{ fontWeight: 'bold', color: '#3e3535', display: 'flex', alignItems: 'center', gap: 1 }}>
                <ContentCopyIcon /> Kopírování týdne
            </DialogTitle>
            <form onSubmit={handleSubmit(onConfirm)}>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography variant="body2" color="textSecondary">
                        Zkopíruje všechny směny ze zobrazeného týdne do nového cílového týdne. (Lidé přiřazení na směnách se nekopírují, vytvoří se prázdné směny).
                    </Typography>

                    <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, border: '1px solid #eee' }}>
                        <Controller
                            name="sourceWeekStart"
                            control={control}
                            render={({ field }: { field: ControllerRenderProps<CopyFormValues, 'sourceWeekStart'> }) => (
                                <TextField
                                    {...field}
                                    label="Zdrojový týden (Od pondělí)"
                                    type="date"
                                    fullWidth
                                    slotProps={{ inputLabel: { shrink: true } }}
                                    disabled // Tohle pole je jen pro čtení
                                />
                            )}
                        />
                    </Box>

                    <Controller
                        name="targetWeekStart"
                        control={control}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                label="Cílový týden (Vyberte pondělí)"
                                type="date"
                                fullWidth
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        )}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={handleClose} color="inherit">Zrušit</Button>
                    <Button type="submit" variant="contained" sx={{ bgcolor: '#3e3535', borderRadius: '20px' }}>
                        Kopírovat
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default CopyWeekModal;