// src/pages/ShiftPlanner/modals/ShiftDetailModal.tsx

import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, List, ListItem, ListItemText, ListItemAvatar,
    Avatar, IconButton, Typography, Box, Divider, TextField
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import CallSplitIcon from '@mui/icons-material/CallSplit';

import { plannerStyles } from '../styles/ShiftPlannerStyles';
import type { ScheduleShift } from '../types/ShiftPlannerTypes.ts';

interface Props {
    open: boolean;
    onClose: () => void;
    shift: ScheduleShift | null;
    onRemoveUser: (shiftId: string, userId: string) => void;
    onUpdateShift: (shiftId: string, startTime: string, endTime: string, capacity: number, description?: string) => void;
    onSplitShift: (shiftId: string) => void;
    onDeleteShift: (shiftId: string) => void;
}

const ShiftDetailModal: React.FC<Props> = ({ open, onClose, shift, onRemoveUser, onUpdateShift, onSplitShift, onDeleteShift }) => {
    const [isEditing, setIsEditing] = useState(false);

    // Initial state setup. No need for useEffect due to key={shift?.id} v rodiči.
    const [startTime, setStartTime] = useState(shift?.startTime.substring(11, 16) || '');
    const [endTime, setEndTime] = useState(shift?.endTime.substring(11, 16) || '');
    const [capacity, setCapacity] = useState<number>(shift?.requiredCapacity || 1);
    const [description, setDescription] = useState<string>(shift?.description || '');

    if (!shift) return null;

    const startHour = parseInt(shift.startTime.substring(11, 13), 10);
    const endHour = parseInt(shift.endTime.substring(11, 13), 10);

    // OPRAVA: Tlačítko se ukáže, pokud směna trvá déle než 2 hodiny
    const isFullDay = (endHour - startHour) > 2;

    const isFull = shift.assignedUsers.length >= capacity;

    const handleSave = () => {
        const startDatePart = shift.startTime.substring(0, 11);
        const endDatePart = shift.endTime.substring(0, 11);

        const newStart = `${startDatePart}${startTime}:00`;
        const newEnd = `${endDatePart}${endTime}:00`;

        onUpdateShift(shift.id, newStart, newEnd, capacity, description.trim() !== '' ? description.trim() : undefined);
        setIsEditing(false);
    };

    const handleClose = () => {
        setIsEditing(false);
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
                <Box>
                    {isEditing ? 'Upravit parametry' : 'Detail směny'}
                    {!isEditing && (
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, mt: 0.5 }}>
                            Čas: {shift.startTime.substring(11, 16)} — {shift.endTime.substring(11, 16)}
                        </Typography>
                    )}
                </Box>
                <IconButton onClick={handleClose} sx={plannerStyles.closeButton} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                {isEditing ? (
                    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={plannerStyles.modalLabel}>Začátek</Typography>
                                <TextField
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    sx={plannerStyles.dropdownControl}
                                    fullWidth
                                />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={plannerStyles.modalLabel}>Konec</Typography>
                                <TextField
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    sx={plannerStyles.dropdownControl}
                                    fullWidth
                                />
                            </Box>
                        </Box>

                        <Box>
                            <Typography sx={plannerStyles.modalLabel}>Potřebná kapacita</Typography>
                            <TextField
                                type="number"
                                value={capacity}
                                onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
                                inputProps={{ min: 1 }}
                                sx={plannerStyles.dropdownControl}
                                fullWidth
                            />
                        </Box>

                        <Box>
                            <Typography sx={plannerStyles.modalLabel}>Popisek směny</Typography>
                            <TextField
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                sx={plannerStyles.dropdownControl}
                                fullWidth
                                placeholder="Např. Školní výlet"
                            />
                        </Box>
                    </Box>
                ) : (
                    <>
                        {shift.description && (
                            <Box sx={{ px: 2, py: 1.5, mx: 2, mb: 2, bgcolor: '#fffbeb', borderRadius: '8px', border: '1px solid #fef3c7' }}>
                                <Typography variant="body2" sx={{ color: '#d97706', fontWeight: 600 }}>
                                    📝 {shift.description}
                                </Typography>
                            </Box>
                        )}

                        {/* Nový zaoblený blok pro obsazenost (nahrazuje původní full-width pruh) */}
                        <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mx: 2 }}>
                            <Typography sx={{ fontWeight: 600, color: '#475569' }}>
                                Obsazenost
                            </Typography>
                            <Typography sx={{ fontWeight: 700, color: isFull ? '#10b981' : '#f59e0b', fontSize: '1.1rem' }}>
                                {shift.assignedUsers.length} / {capacity}
                            </Typography>
                        </Box>

                        <Divider sx={{ mx: 2, mb: 1, borderColor: '#f1f5f9' }} />

                        <List sx={{ px: 1, minHeight: 100 }}>
                            {shift.assignedUsers.length === 0 ? (
                                <Typography variant="body2" sx={{ textAlign: 'center', p: 4, color: '#94a3b8', fontStyle: 'italic' }}>
                                    Na tuto směnu zatím není nikdo přiřazen.
                                </Typography>
                            ) : (
                                shift.assignedUsers.map((user) => (
                                    <ListItem
                                        key={user.userId}
                                        secondaryAction={
                                            <IconButton edge="end" onClick={() => onRemoveUser(shift.id, user.userId)} sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fef2f2' } }}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        }
                                        sx={{ borderRadius: '8px', mb: 0.5, '&:hover': { bgcolor: '#f8fafc' } }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: '#eff6ff', color: '#3b82f6', width: 36, height: 36, fontSize: '0.9rem', fontWeight: 700 }}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>
                                                    {user.name}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                ))
                            )}
                        </List>
                    </>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, pt: 3, gap: 1, justifyContent: isEditing ? 'flex-end' : 'space-between' }}>
                {isEditing ? (
                    <>
                        <Button
                            onClick={() => setIsEditing(false)}
                            sx={plannerStyles.modalButtons.secondary}
                        >
                            Zrušit
                        </Button>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {isFullDay && (
                                <Button
                                    startIcon={<CallSplitIcon />}
                                    onClick={() => onSplitShift(shift.id)}
                                    sx={plannerStyles.modalButtons.special} // Plně oranžové tlačítko
                                >
                                    Rozdělit
                                </Button>
                            )}
                            <Button
                                startIcon={<SaveIcon />}
                                onClick={handleSave}
                                sx={plannerStyles.modalButtons.primary} // Plně modré
                            >
                                Uložit
                            </Button>
                        </Box>
                    </>
                ) : (
                    <>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {/* Tlačítka jako "Text action" podle zadání */}
                            <Button
                                startIcon={<DeleteIcon />}
                                onClick={() => onDeleteShift(shift.id)}
                                sx={{ ...plannerStyles.modalButtons.textAction, color: '#ef4444' }}
                            >
                                Smazat
                            </Button>
                            <Button
                                startIcon={<EditIcon />}
                                onClick={() => setIsEditing(true)}
                                sx={{ ...plannerStyles.modalButtons.textAction, color: '#3b82f6' }}
                            >
                                Upravit
                            </Button>
                        </Box>
                        <Button
                            onClick={handleClose}
                            sx={plannerStyles.modalButtons.secondary} // Světle šedé zavírací tlačítko
                        >
                            Zavřít
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ShiftDetailModal;