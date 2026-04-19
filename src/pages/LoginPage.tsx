import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Typography, Button, InputBase, CircularProgress } from '@mui/material';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { useAuth } from '../context/AuthContext';
import { authStyles } from '../theme/auth.styles';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState<string>('');
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
                credentials: 'include',
                body: JSON.stringify({ email: email, password: password }),
            });

            if (response.ok) {
                const data = await response.json();
                login(data.email, data.roles, data.userId);

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
            <Box sx={authStyles.fullScreenLoading}>
                <CircularProgress sx={{ color: '#3498db' }} />
            </Box>
        );
    }

    return (
        <Box sx={authStyles.pageContainer}>
            {/* 1. TMAVÁ SKLENĚNÁ HLAVIČKA */}
            <Box sx={authStyles.header}>
                <Typography sx={authStyles.logoText}>CompanyApp</Typography>
            </Box>

            {/* 2. VYCENTROVANÁ HLAVNÍ SKLENĚNÁ KARTA */}
            <Box sx={authStyles.mainContent}>
                <Box component="form" onSubmit={handleLogin} sx={authStyles.formBox}>
                    <Typography variant="h5" sx={authStyles.formTitle}>
                        Přihlášení do aplikace
                    </Typography>

                    <Typography component="label" htmlFor="email-input" sx={authStyles.inputLabel}>
                        E-mail
                    </Typography>
                    <InputBase
                        id="email-input"
                        name="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        sx={authStyles.inputField}
                        placeholder="Zadejte svůj e-mail"
                        required
                        type="email"
                        startAdornment={<AlternateEmailIcon sx={authStyles.inputIcon} />}
                    />

                    <Typography component="label" htmlFor="password-input" sx={authStyles.inputLabel}>
                        Heslo / PIN
                    </Typography>
                    <InputBase
                        id="password-input"
                        name="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        sx={{ ...authStyles.inputField, mb: 1 }}
                        placeholder="••••••••"
                        required
                        type="password"
                        startAdornment={<VpnKeyIcon sx={authStyles.inputIcon} />}
                    />

                    {error && <Typography sx={authStyles.errorMessage}>{error}</Typography>}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                        <Link to="/forgot-password" style={authStyles.link}>
                            Zapomenuté heslo?
                        </Link>
                    </Box>

                    <Button type="submit" variant="contained" sx={authStyles.submitButton}>
                        Přihlásit se
                    </Button>
                </Box>
            </Box>

            {/* 3. TMAVÁ SKLENĚNÁ PATIČKA */}
            <Box sx={authStyles.footer}>
                <Typography sx={authStyles.footerText}>
                    © {new Date().getFullYear()} Made by: Štěpán Ralenovský
                </Typography>
            </Box>
        </Box>
    );
};

export default LoginPage;