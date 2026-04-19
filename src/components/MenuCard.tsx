import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { styles } from '../theme/DashboardMenu.styles'; // Uprav cestu podle svého projektu

interface MenuCardProps {
    title: string;
    navigateTo: string;
    icon: React.ReactNode; // Tato vlastnost umožní vkládat ikony (např. <SettingsIcon />)
}

const MenuCard: React.FC<MenuCardProps> = ({ title, navigateTo, icon }) => {
    const navigate = useNavigate();

    return (
        <Paper
            elevation={0}
            sx={styles.cardPaper}
            onClick={() => navigate(navigateTo)}
        >
            {/* Box pro ikonu - styluje se centrálně v DashboardMenu.styles.ts */}
            <Box sx={styles.cardIcon}>
                {icon}
            </Box>

            <Typography sx={styles.cardText}>
                {title}
            </Typography>
        </Paper>
    );
};

export default MenuCard;