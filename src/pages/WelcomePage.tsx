import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { useAuth } from '../context/AuthContext'; // IMPORT

const WelcomePage: React.FC = () => {
    const navigate = useNavigate();
    // Získáme jméno a logout funkci přímo z kontextu
    const { userEmail, logout } = useAuth();

    const handleLogout = () => {
        logout(); // Zavolá globální odhlášení
        navigate('/');
    };

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', bgcolor: '#f5f5f5' }}>
            <Typography variant="h3" sx={{ mb: 2, color: '#3e3535', fontWeight: 'bold' }}>
                Vítejte zpět!
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, color: '#666' }}>
                Jste úspěšně přihlášeni jako {userEmail}.
            </Typography>
            <Button
                variant="contained"
                onClick={handleLogout}
                sx={{ bgcolor: '#3e3535', '&:hover': { bgcolor: '#1e1a1a' } }}
            >
                Odhlásit se
            </Button>
        </Box>
    );
};

export default WelcomePage;