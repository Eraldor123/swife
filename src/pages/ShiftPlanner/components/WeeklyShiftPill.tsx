// src/pages/ShiftPlanner/components/WeeklyShiftPill.tsx

import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import type { ScheduleShift, PlannerUser } from '../types/ShiftPlannerTypes';

interface WeeklyShiftPillProps {
    shift: ScheduleShift;
    users: PlannerUser[];
    selectedUserId: string | null;
    loggedInUserId: string;
    isManagerial: boolean;
    requiresQual: boolean;
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

const WeeklyShiftPill: React.FC<WeeklyShiftPillProps> = ({
                                                             shift, users, selectedUserId, loggedInUserId, isManagerial, requiresQual,
                                                             onAssignUser, onRemoveUser, onShiftClick
                                                         }) => {
    const currentAssignments = shift.assignedUsers ?? [];
    const assignedCount = currentAssignments.length;
    const isFull = assignedCount >= shift.requiredCapacity;
    const isAlreadyAssigned = selectedUserId && currentAssignments.some(u => u.userId === selectedUserId);

    const assignedData = currentAssignments.map(u => {
        const surname = getSurname(u.name);
        const fullUserObj = (users ?? []).find(user => user && user.userId === u.userId);
        const isUnqualified = fullUserObj && requiresQual ? !(fullUserObj.qualifiedStationIds ?? []).includes(shift.stationId) : false;
        const isMe = u.userId === loggedInUserId;
        const isCollision = u.isCollision === true;

        return { surname, name: u.name, isUnqualified, isMe, isCollision };
    });

    return (
        <Tooltip
            arrow
            title={
                <Box sx={{ p: 0.5, fontSize: '0.75rem' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                        {assignedData.length > 0
                            ? assignedData.map(u => {
                                let label = u.name;
                                if (u.isUnqualified) label += ' (Zaučení)';
                                if (u.isCollision) label += ' (KOLIZE!)';
                                return label;
                            }).join(', ')
                            : 'Žádný zaměstnanec'}
                    </Typography>
                    <Typography variant="body2">Čas: {formatTime(shift.startTime)} — {formatTime(shift.endTime)}</Typography>
                    {shift.description && (
                        <Typography variant="body2" sx={{ color: '#fbbf24', mt: 0.5, fontWeight: 'bold' }}>📝 {shift.description}</Typography>
                    )}
                </Box>
            }
        >
            <Box
                onClick={() => {
                    if (!isManagerial) return;
                    if (selectedUserId) {
                        if (isAlreadyAssigned) {
                            onRemoveUser(shift.id, selectedUserId);
                        } else if (!isFull) {
                            onAssignUser(shift.id);
                        }
                    } else {
                        onShiftClick(shift);
                    }
                }}
                sx={{
                    width: '100%',
                    height: '100%',
                    boxSizing: 'border-box',
                    minHeight: '52px',
                    borderRadius: '8px',
                    bgcolor: isFull ? '#10b981' : '#ef4444',
                    cursor: isManagerial ? (selectedUserId ? (isAlreadyAssigned ? 'pointer' : (isFull ? 'not-allowed' : 'cell')) : 'pointer') : 'default',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: '2px',
                    color: 'white',
                    px: '4px',
                    pt: '6px',
                    pb: '22px', // Pevně vymezený prostor pro kapacitu dole
                    position: 'relative',
                    overflow: 'hidden',
                    zIndex: 1,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    transition: 'all 0.15s ease-in-out',
                    '&:hover': {
                        transform: isManagerial ? 'scale(1.02)' : 'none',
                        zIndex: 2,
                        boxShadow: isManagerial ? '0 4px 6px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.15)'
                    }
                }}
            >
                {/* Seznam jmen */}
                {assignedData.map((userObj, idx) => {
                    let pillBg = 'transparent';
                    let pillColor = '#ffffff';
                    let isPill = false;

                    if (userObj.isCollision) {
                        pillBg = '#fee2e2';
                        pillColor = '#b91c1c';
                        isPill = true;
                    } else if (userObj.isUnqualified) {
                        pillBg = '#fef3c7';
                        pillColor = '#b45309';
                        isPill = true;
                    } else if (userObj.isMe) {
                        pillBg = '#ffffff';
                        pillColor = '#0f172a';
                        isPill = true;
                    }

                    return (
                        <Typography key={idx} sx={{
                            flexShrink: 0,
                            fontSize: '0.65rem',
                            letterSpacing: '-0.01em',
                            lineHeight: 1.1,
                            fontWeight: isPill ? '700' : '600',
                            textAlign: 'center',
                            width: '100%',
                            boxSizing: 'border-box',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'clip',
                            bgcolor: pillBg,
                            color: pillColor,
                            borderRadius: isPill ? '4px' : '0',
                            px: '2px',
                            py: isPill ? '2px' : '1px',
                            display: 'block',
                        }}>
                            {userObj.surname}
                        </Typography>
                    );
                })}

                {/* Kapacita - nyní má díky pb: 22px svůj vlastní prostor a nekryje jména */}
                <Typography sx={{
                    fontSize: '0.65rem',
                    position: 'absolute',
                    bottom: '4px',
                    right: '6px',
                    fontWeight: 800,
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    lineHeight: 1,
                    pointerEvents: 'none'
                }}>
                    {assignedCount}/{shift.requiredCapacity}
                </Typography>
            </Box>
        </Tooltip>
    );
};

export default WeeklyShiftPill;