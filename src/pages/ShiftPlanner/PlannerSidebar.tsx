import React from 'react';
import { Box, Typography, Paper, Avatar, List, ListItem, ListItemAvatar, ListItemText, ListItemButton } from '@mui/material';
import type {
    PlannerUser,
    WeeklyScheduleResponse,
    HierarchyCategory
} from '../../types/schedule';

interface SidebarProps {
    users: PlannerUser[];
    selectedUserId: string | null;
    onSelectUser: (userId: string | null) => void;
    currentWeekDays: WeeklyScheduleResponse['days'];
    // Typ vytažený z HierarchyCategory pro stanoviště
    allStations: HierarchyCategory['stations'];
}

const PlannerSidebar: React.FC<SidebarProps> = ({ users, selectedUserId, onSelectUser }) => {
    return (
        <Paper elevation={2} sx={{ width: 280, display: 'flex', flexDirection: 'column', height: '100%', zIndex: 10 }}>
            <Box sx={{ p: 2, bgcolor: '#3e3535', color: 'white' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Zaměstnanci</Typography>
            </Box>
            <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
                {users.map((user: PlannerUser) => {
                    const isSelected = user.userId === selectedUserId;
                    return (
                        <React.Fragment key={user.userId}>
                            <ListItem disablePadding>
                                <ListItemButton
                                    selected={isSelected}
                                    onClick={() => onSelectUser(isSelected ? null : user.userId)}
                                    sx={{
                                        borderBottom: '1px solid #eee',
                                        '&.Mui-selected': { bgcolor: '#e3f2fd' },
                                        '&.Mui-selected:hover': { bgcolor: '#bbdefb' }
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: isSelected ? '#1976d2' : '#bdbdbd' }}>
                                            {user.name.charAt(0)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={<Typography sx={{ fontWeight: isSelected ? 'bold' : 'normal', color: '#3e3535' }}>{user.name}</Typography>}
                                    />
                                </ListItemButton>
                            </ListItem>

                            {isSelected && (
                                <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderBottom: '1px solid #ddd' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">Naplánováno:</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', bgcolor: '#3e3535', color: 'white', px: 1, py: 0.2, borderRadius: 1 }}>
                                            {user.plannedShiftsThisMonth}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">Splněno:</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', border: '1px solid #3e3535', px: 1, py: 0.2, borderRadius: 1 }}>
                                            {user.completedShiftsThisMonth}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                        </React.Fragment>
                    );
                })}
            </List>
        </Paper>
    );
};

export default PlannerSidebar;