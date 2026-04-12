import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Typography, Button, InputBase, CircularProgress } from '@mui/material';
import LandscapeIcon from '@mui/icons-material/Landscape';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    // ZMĚNĚNO: Z 'pin' na 'password'
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');

    const { isAuthenticated, isLoading, login, userRoles } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated && userRoles) {
            if (userRoles.includes('TERMINAL')) {
                navigate('/terminal');
            } else {
                navigate('/dashboard');
            }
        }
    }, [isAuthenticated, userRoles, navigate]);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:8080/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // ZMĚNĚNO: Posíláme 'password', ne 'pin'
                body: JSON.stringify({ email: email, password: password }),
            });

            if (response.ok) {
                const data = await response.json();
                login(data.token, data.email, data.roles, data.userId);

                if (data.roles && data.roles.includes('TERMINAL')) {
                    navigate('/terminal');
                } else {
                    navigate('/dashboard');
                }
            } else {
                setError('Neplatný e-mail nebo heslo.');
            }
        } catch (err) {
            console.log(err);
            setError('Chyba při komunikaci se serverem.');
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#3e3535' }}>
                <CircularProgress sx={{ color: 'white' }} />
            </Box>
        );
    }


    return (
        <Box sx={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1,
                background: 'linear-gradient(135deg, #e3c5d5 0%, #b8a3c9 50%, #9cb3d4 100%)'
            }}>
            </Box>

            <Box sx={{ height: '80px', bgcolor: '#3e3535', display: 'flex', alignItems: 'center', px: 4 }}>
                <LandscapeIcon sx={{ color: 'white', fontSize: 40, mr: 1 }} />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mt: 1 }}>
                    skalkAPP
                </Typography>
            </Box>

            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
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

                    <Typography sx={{ color: 'white', textAlign: 'center', mb: 1, fontSize: '14px' }}>E-mail</Typography>
                    <InputBase
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        sx={{ bgcolor: 'white', borderRadius: '20px', px: 2, py: 0.5, mb: 3 }}
                        required
                        type="email"
                    />

                    {/* ZMĚNĚNO: Text a vazba na state 'password' */}
                    <Typography sx={{ color: 'white', textAlign: 'center', mb: 1, fontSize: '14px' }}>Heslo</Typography>
                    <InputBase
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        sx={{ bgcolor: 'white', borderRadius: '20px', px: 2, py: 0.5, mb: 1 }}
                        required
                        type="password"
                    />

                    {error && <Typography color="error" sx={{ fontSize: '12px', textAlign: 'center', mb: 2 }}>{error}</Typography>}

                    {/* PŘIDÁNO: Odkaz na reset hesla */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <Link
                            to="/forgot-password"
                            style={{ fontSize: '12px', color: '#9cb3d4', textDecoration: 'none' }}
                        >
                            Zapomněli jste heslo?
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

            <Box sx={{ height: '80px', bgcolor: '#3e3535' }} />
        </Box>
    );
};

export default LoginPage;