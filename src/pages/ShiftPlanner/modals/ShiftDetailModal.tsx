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
import type { ScheduleShift } from '../../../types/schedule';

interface Props {
    open: boolean;
    onClose: () => void;
    shift: ScheduleShift | null;
    onRemoveUser: (shiftId: string, userId: string) => void;
    onUpdateShift: (shiftId: string, startTime: string, endTime: string, capacity: number) => void;
}

const ShiftDetailModal: React.FC<Props> = ({ open, onClose, shift, onRemoveUser, onUpdateShift }) => {
    const [isEditing, setIsEditing] = useState(false);

    // Inicializujeme stav přímo z props (díky 'key' v ShiftPlanneru se to samo resetuje)
    const [startTime, setStartTime] = useState(shift?.startTime.substring(11, 16) || '');
    const [endTime, setEndTime] = useState(shift?.endTime.substring(11, 16) || '');
    const [capacity, setCapacity] = useState<number>(shift?.requiredCapacity || 1);

    if (!shift) return null;

    const handleSave = () => {
        const datePart = shift.startTime.substring(0, 11);
        const newStart = `${datePart}${startTime}:00`;
        const newEnd = `${datePart}${endTime}:00`;

        onUpdateShift(shift.id, newStart, newEnd, capacity);
        setIsEditing(false);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
            <DialogTitle sx={{ bgcolor: '#f8f9fa', pb: 2 }}>
                <Typography component="div" variant="h6" sx={{ fontWeight: 'bold', color: '#3e3535' }}>
                    {isEditing ? 'Upravit parametry směny' : 'Detail směny'}
                </Typography>
                {!isEditing && (
                    <Typography variant="body2" color="text.secondary">
                        Čas: {startTime} — {endTime}
                    </Typography>
                )}
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                {isEditing ? (
                    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Začátek"
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                size="small"
                            />
                            <TextField
                                label="Konec"
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                size="small"
                            />
                        </Box>
                        <TextField
                            label="Potřebná kapacita (počet lidí)"
                            type="number"
                            value={capacity}
                            onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
                            inputProps={{ min: 1 }}
                            fullWidth
                            size="small"
                        />
                    </Box>
                ) : (
                    <>
                        <Box sx={{ px: 3, py: 2, bgcolor: '#e3f2fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                Obsazenost
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                {shift.assignedUsers.length} / {capacity}
                            </Typography>
                        </Box>
                        <Divider />
                        <List sx={{ px: 1, minHeight: 100 }}>
                            {shift.assignedUsers.length === 0 ? (
                                <Typography variant="body2" sx={{ textAlign: 'center', p: 4, color: '#aaa', fontStyle: 'italic' }}>
                                    Na tuto směnu zatím není nikdo přiřazen.
                                </Typography>
                            ) : (
                                shift.assignedUsers.map((user) => (
                                    <ListItem
                                        key={user.userId}
                                        secondaryAction={
                                            <IconButton edge="end" color="error" onClick={() => onRemoveUser(shift.id, user.userId)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        }
                                        sx={{ borderRadius: 2, mb: 0.5, '&:hover': { bgcolor: '#f5f5f5' } }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: '#3e3535', width: 32, height: 32, fontSize: '0.85rem' }}>
                                                {user.name.charAt(0)}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText primary={<Typography sx={{ fontWeight: 'bold', color: '#3e3535', fontSize: '0.9rem' }}>{user.name}</Typography>} />
                                    </ListItem>
                                ))
                            )}
                        </List>
                    </>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa', justifyContent: 'space-between' }}>
                {isEditing ? (
                    <>
                        <Button startIcon={<CloseIcon />} onClick={() => setIsEditing(false)} color="inherit" sx={{ textTransform: 'none' }}>Zrušit</Button>
                        <Button startIcon={<SaveIcon />} onClick={handleSave} variant="contained" color="primary" sx={{ borderRadius: '10px', textTransform: 'none', px: 3 }}>Uložit změny</Button>
                    </>
                ) : (
                    <>
                        <Button startIcon={<EditIcon />} onClick={() => setIsEditing(true)} sx={{ color: '#1976d2', textTransform: 'none', fontWeight: 'bold' }}>Upravit směnu</Button>
                        <Button onClick={onClose} variant="contained" sx={{ bgcolor: '#3e3535', borderRadius: '10px', textTransform: 'none', '&:hover': { bgcolor: '#000' } }}>Zavřít</Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ShiftDetailModal;