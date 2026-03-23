import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, InputBase, Link, CircularProgress } from '@mui/material';
import LandscapeIcon from '@mui/icons-material/Landscape';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [pin, setPin] = useState<string>('');
    const [error, setError] = useState<string>('');

    // Nyní si vytáhneme z kontextu i userRole
    const { isAuthenticated, isLoading, login, userRole } = useAuth();
    const navigate = useNavigate();

    // 1. SCÉNÁŘ: Automatické přesměrování ověřeného uživatele (po F5 nebo otevření indexu)
    useEffect(() => {
        if (isAuthenticated) {
            // Rozhodujeme se podle role
            switch (userRole) {
                case 'TERMINAL':
                    navigate('/terminal');
                    break;
                default:
                    navigate('/dashboard');
            }
        }
    }, [isAuthenticated, userRole, navigate]);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:8080/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: pin }),
            });

            if (response.ok) {
                const data = await response.json(); // data obsahuje token, email, userId a roli

                // 2. SCÉNÁŘ: Uložíme do kontextu včetně role získané z backendu
                login(data.token, data.email, data.role);

                // Bezprostřední přesměrování po kliknutí na "Přihlásit"
                if (data.role === 'TERMINAL') {
                    navigate('/terminal');
                } else {
                    navigate('/welcome');
                }
            } else {
                setError('Neplatný email nebo heslo (PIN).');
            }
        } catch (err) {
            console.log(err);
            setError('Chyba při komunikaci se serverem.');
        }
    };

    // Zatímco AuthContext ověřuje na pozadí token, ukážeme hezký načítací spinner
    if (isLoading) {
        return (
            <Box sx={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#3e3535' }}>
                <CircularProgress sx={{ color: 'white' }} />
            </Box>
        );
    }


    return (
        <Box sx={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

            {/* POZADÍ */}
            <Box sx={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1,
                background: 'linear-gradient(135deg, #e3c5d5 0%, #b8a3c9 50%, #9cb3d4 100%)'
            }}>
                {/*
        <video
          autoPlay loop muted playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        >
          <source src="/pozadi-video.mp4" type="video/mp4" />
        </video>
        */}
            </Box>

            {/* HLAVIČKA */}
            <Box sx={{ height: '80px', bgcolor: '#3e3535', display: 'flex', alignItems: 'center', px: 4 }}>
                <LandscapeIcon sx={{ color: 'white', fontSize: 40, mr: 1 }} />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mt: 1 }}>
                    skalkAPP
                </Typography>
            </Box>

            {/* HLAVNÍ OBSAH */}
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>

                {/* PŘIHLAŠOVACÍ FORMULÁŘ */}
                <Box
                    component="form"
                    onSubmit={handleLogin}
                    sx={{
                        bgcolor: '#3e3535',
                        borderRadius: 4,
                        p: 4,
                        width: '320px',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: 3
                    }}
                >
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center', mb: 3 }}>
                        Přihlášení
                    </Typography>

                    <Typography sx={{ color: 'white', textAlign: 'center', mb: 1, fontSize: '14px' }}>Email</Typography>
                    <InputBase
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        sx={{ bgcolor: 'white', borderRadius: '20px', px: 2, py: 0.5, mb: 3 }}
                        required
                        type="email"
                    />

                    <Typography sx={{ color: 'white', textAlign: 'center', mb: 1, fontSize: '14px' }}>Heslo</Typography>
                    <InputBase
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        sx={{ bgcolor: 'white', borderRadius: '20px', px: 2, py: 0.5, mb: 1 }}
                        required
                        type="password"
                    />

                    {error && <Typography color="error" sx={{ fontSize: '12px', textAlign: 'center', mb: 2 }}>{error}</Typography>}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <Link href="#" underline="none" sx={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                            zapomenuté heslo?
                        </Link>
                        <Button
                            type="submit"
                            variant="contained"
                            sx={{
                                bgcolor: '#1e1a1a',
                                color: 'white',
                                borderRadius: '20px',
                                textTransform: 'none',
                                fontWeight: 'bold',
                                '&:hover': { bgcolor: '#000000' }
                            }}
                        >
                            Přihlásit se
                        </Button>
                    </Box>
                </Box>
            </Box>

            {/* PATIČKA */}
            <Box sx={{ height: '80px', bgcolor: '#3e3535' }} />
        </Box>
    );
};

export default LoginPage;