import React, { useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, MenuItem, Box, Typography, Divider
} from '@mui/material';
import { useForm, Controller, type ControllerRenderProps, type ControllerFieldState } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { HierarchyData } from '../../../types/schedule';

// 1. OPRAVA: Zod schéma využívající 'message', které tvůj kompilátor vyžaduje
const generateSchema = z.object({
    startDate: z.string().min(1, "Počáteční datum je povinné"),
    endDate: z.string().min(1, "Koncové datum je povinné"),
    templateId: z.number({ message: "Musíte vybrat šablonu" }).min(1, "Musíte vybrat šablonu"),
});

export type GenerateFormValues = z.infer<typeof generateSchema>;

interface Props {
    open: boolean;
    onClose: () => void;
    onConfirm: (data: GenerateFormValues) => void;
    hierarchy: HierarchyData | null;
    currentWeekStart: string;
    currentWeekEnd: string;
}

interface FlatTemplate {
    id: number;
    name: string;
    stationName: string;
    categoryName: string;
}

const GenerateShiftsModal: React.FC<Props> = ({ open, onClose, onConfirm, hierarchy, currentWeekStart, currentWeekEnd }) => {

    const allTemplates = useMemo(() => {
        if (!hierarchy) return [];
        const templates: FlatTemplate[] = [];
        hierarchy.categories.forEach((cat) => {
            cat.stations.forEach((stat) => {
                stat.templates.forEach((tmpl) => {
                    templates.push({
                        id: tmpl.id,
                        name: tmpl.name,
                        stationName: stat.name,
                        categoryName: cat.name
                    });
                });
            });
        });
        return templates;
    }, [hierarchy]);

    const { control, handleSubmit, reset } = useForm<GenerateFormValues>({
        resolver: zodResolver(generateSchema),
        defaultValues: {
            startDate: currentWeekStart,
            endDate: currentWeekEnd,
            templateId: 0
        }
    });

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="xs"
            fullWidth
            slotProps={{ paper: { sx: { borderRadius: 3 } } }}
        >
            <DialogTitle sx={{ fontWeight: 'bold', color: '#3e3535' }}>Hromadné generování směn</DialogTitle>
            <form onSubmit={handleSubmit(onConfirm)}>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Controller
                        name="templateId"
                        control={control}
                        render={({
                                     field,
                                     fieldState
                                 }: {
                            field: ControllerRenderProps<GenerateFormValues, 'templateId'>;
                            fieldState: ControllerFieldState
                        }) => (
                            <TextField
                                {...field}
                                select
                                label="Vybrat šablonu"
                                fullWidth
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                                value={field.value || ''}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                            >
                                {allTemplates.map((t) => (
                                    <MenuItem key={t.id} value={t.id}>
                                        <Box>
                                            <Typography variant="body2" fontWeight="bold">{t.name}</Typography>
                                            <Typography variant="caption" color="textSecondary">{t.categoryName} - {t.stationName}</Typography>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}
                    />
                    <Divider />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Controller
                            name="startDate"
                            control={control}
                            render={({ field }: { field: ControllerRenderProps<GenerateFormValues, 'startDate'> }) => (
                                <TextField
                                    {...field}
                                    label="Od"
                                    type="date"
                                    fullWidth
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                            )}
                        />
                        <Controller
                            name="endDate"
                            control={control}
                            render={({ field }: { field: ControllerRenderProps<GenerateFormValues, 'endDate'> }) => (
                                <TextField
                                    {...field}
                                    label="Do"
                                    type="date"
                                    fullWidth
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                            )}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={handleClose} color="inherit">Zrušit</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        sx={{ bgcolor: '#3e3535', borderRadius: '20px', '&:hover': { bgcolor: '#2c2525' } }}
                    >
                        Generovat
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default GenerateShiftsModal;