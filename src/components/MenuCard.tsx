import React from 'react';
import { Paper, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface MenuCardProps {
    title: string;
    navigateTo: string;
}

const MenuCard: React.FC<MenuCardProps> = ({ title, navigateTo }) => {
    const navigate = useNavigate();

    return (
        <Paper
            elevation={4}
            onClick={() => navigate(navigateTo)}
            sx={{
                width: '160px',
                height: '160px',
                bgcolor: '#2a2d34',
                color: 'white',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                p: 2,
                cursor: 'pointer',
                transition: 'transform 0.2s, background-color 0.2s',
                '&:hover': {
                    bgcolor: '#1e2025',
                    transform: 'scale(1.05)',
                },
            }}
        >
            <Typography sx={{ fontWeight: 'bold', fontSize: '16px' }}>
                {title}
            </Typography>
        </Paper>
    );
};

export default MenuCard;