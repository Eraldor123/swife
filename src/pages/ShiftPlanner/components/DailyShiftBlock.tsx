// src/pages/ShiftPlanner/components/DailyShiftBlock.tsx

import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import type { ScheduleShift, HierarchyStation, PlannerUser } from '../types/ShiftPlannerTypes';

interface DailyShiftBlockProps {
    shift: ScheduleShift;
    station: HierarchyStation;
    users: PlannerUser[]; // Přidáno pro detekci kvalifikace
    selectedUser: PlannerUser | null | undefined;
    selectedUserId: string | null;
    loggedInUserId: string;
    selectedDate: string;
    isManagerial: boolean;
    startCol: number;
    endCol: number;
    onAssignUser: (shiftId: string) => void;
    onRemoveUser: (shiftId: string, userId: string) => void;
    onShiftClick: (shift: ScheduleShift) => void;
}

const getSurname = (fullName: string) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(' ');
    return parts.length > 1 ? parts[parts.length - 1] : fullName;
};

const formatTime = (isoString: string) => {
    if (!isoString) return '';
    return isoString.substring(11, 16);
};

const DailyShiftBlock: React.FC<DailyShiftBlockProps> = ({
                                                             shift, station, users, selectedUser, selectedUserId, loggedInUserId,
                                                             isManagerial, startCol, endCol, onAssignUser, onRemoveUser, onShiftClick
                                                         }) => {
    const currentAssignments = shift.assignedUsers ?? [];
    const assignedCount = currentAssignments.length;
    const isFull = assignedCount >= shift.requiredCapacity;
    const isAlreadyAssigned = selectedUserId && currentAssignments.some(u => u.userId === selectedUserId);
    const isMeAssigned = currentAssignments.some(u => u.userId === loggedInUserId);

    // Příprava dat o přiřazených lidech (logika z WeeklyShiftPill)
    const assignedData = currentAssignments.map(u => {
        const surname = getSurname(u.name);
        const fullUserObj = (users ?? []).find(user => user && user.userId === u.userId);

        // Kontrola kvalifikace
        const isUnqualified = fullUserObj && station.needsQualification
            ? !(fullUserObj.qualifiedStationIds ?? []).includes(station.id)
            : false;

        const isMe = u.userId === loggedInUserId;
        const isCollision = u.isCollision === true;

        return { surname, name: u.name, isUnqualified, isMe, isCollision, userId: u.userId };
    });

    // Barva pilulky (Stav naplnění)
    let bgColor = isFull ? '#10b981' : '#ef4444';
    if (selectedUser && isAlreadyAssigned) {
        bgColor = '#94a3b8'; // Vybraný uživatel už tu je -> šedá
    }

    return (
        <Tooltip
            arrow
            title={
                <Box sx={{ p: 0.5, fontSize: '0.75rem' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {formatTime(shift.startTime)} — {formatTime(shift.endTime)}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                        {assignedData.map((u, idx) => (
                            <Typography key={idx} variant="caption" sx={{ display: 'block', color: u.isCollision ? '#f87171' : 'white' }}>
                                • {u.name} {u.isUnqualified ? '(Zaučení)' : ''} {u.isCollision ? '(KOLIZE)' : ''}
                            </Typography>
                        ))}
                    </Box>
                    {shift.description && (
                        <Typography variant="body2" sx={{ color: '#fbbf24', mt: 0.5 }}>📝 {shift.description}</Typography>
                    )}
                </Box>
            }
        >
            <Box
                onClick={() => {
                    if (!isManagerial) return;
                    if (selectedUserId) {
                        if (isAlreadyAssigned) onRemoveUser(shift.id, selectedUserId);
                        else if (!isFull) onAssignUser(shift.id);
                    } else {
                        onShiftClick(shift);
                    }
                }}
                sx={{
                    gridColumn: `${startCol} / ${endCol}`,
                    bgcolor: bgColor,
                    color: 'white',
                    borderRadius: '6px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    height: '40px',
                    px: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: isManagerial ? 'pointer' : 'default',
                    transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                    zIndex: 2,
                    border: isMeAssigned ? '1px solid rgba(255,255,255,0.7)' : 'none',
                    '&:hover': {
                        transform: isManagerial ? 'translateY(-1px)' : 'none',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
                    }
                }}
            >
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', overflow: 'hidden' }}>
                    {assignedData.map((u) => {
                        // Dynamický styl štítku podle stavu uživatele
                        let pillBg = 'white';
                        let pillColor = '#1e293b';

                        if (u.isCollision) {
                            pillBg = '#fee2e2'; pillColor = '#b91c1c';
                        } else if (u.isUnqualified) {
                            pillBg = '#fef3c7'; pillColor = '#b45309';
                        } else if (u.isMe) {
                            pillBg = '#ffffff'; pillColor = '#1976d2';
                        }

                        return (
                            <Box
                                key={u.userId}
                                sx={{
                                    bgcolor: pillBg,
                                    color: pillColor,
                                    px: 0.6,
                                    py: 0.2,
                                    borderRadius: '4px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.3,
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {u.isCollision && <ErrorOutlineIcon sx={{ fontSize: '0.8rem' }} />}
                                {u.isUnqualified && !u.isCollision && <WarningAmberIcon sx={{ fontSize: '0.8rem' }} />}
                                {u.surname}
                            </Box>
                        );
                    })}

                    {assignedData.length === 0 && (
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.8, pl: 0.5 }}>
                            Volno
                        </Typography>
                    )}
                </Box>

                <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, ml: 1 }}>
                    {assignedCount}/{shift.requiredCapacity}
                </Typography>
            </Box>
        </Tooltip>
    );
};

export default DailyShiftBlock;