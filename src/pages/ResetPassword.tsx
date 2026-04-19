import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Box, Typography, Button, InputBase, CircularProgress } from '@mui/material';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import axios from 'axios';
import { authStyles } from '../theme/auth.styles';

const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const isPasswordValid = (pass: string) => {
        return pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!isPasswordValid(newPassword)) {
            setError('Heslo nesplňuje minimální požadavky.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Zadaná hesla se neshodují!');
            return;
        }

        if (!token) {
            setError('Chybí ověřovací token v adrese.');
            return;
        }

        setLoading(true);
        try {
            await axios.post('http://localhost:8080/api/v1/auth/password-reset/confirm', {
                token,
                newPassword
            });
            alert('Heslo bylo úspěšně změněno! Nyní se můžete přihlásit.');
            navigate('/');
        } catch (err) {
            console.error(err);
            setError('Odkaz je neplatný nebo již vypršel.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={authStyles.pageContainer}>

            <Box sx={authStyles.header}>
                <Typography sx={authStyles.logoText}>CompanyApp</Typography>
            </Box>

            {/* 2. VYCENTROVANÁ HLAVNÍ SKLENĚNÁ KARTA */}
            <Box sx={authStyles.mainContent}>
                <Box component="form" onSubmit={handleSubmit} sx={authStyles.formBox}>
                    <Typography variant="h5" sx={authStyles.formTitle}>
                        Nové heslo
                    </Typography>

                    <Typography component="label" htmlFor="new-password-input" sx={authStyles.inputLabel}>
                        Nové heslo
                    </Typography>
                    <InputBase
                        id="new-password-input"
                        name="newPassword"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        sx={{ ...authStyles.inputField, mb: 1 }}
                        placeholder="Zadejte nové heslo"
                        required
                        type="password"
                        startAdornment={<VpnKeyIcon sx={authStyles.inputIcon} />}
                    />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 3, ml: 1 }}>
                        <Typography sx={{ fontSize: '12px', color: newPassword.length >= 8 ? '#4ade80' : '#a0aec0', transition: 'color 0.3s' }}>
                            {newPassword.length >= 8 ? '✓' : '○'} Alespoň 8 znaků
                        </Typography>
                        <Typography sx={{ fontSize: '12px', color: /[A-Z]/.test(newPassword) ? '#4ade80' : '#a0aec0', transition: 'color 0.3s' }}>
                            {/[A-Z]/.test(newPassword) ? '✓' : '○'} Obsahuje velké písmeno
                        </Typography>
                        <Typography sx={{ fontSize: '12px', color: /[0-9]/.test(newPassword) ? '#4ade80' : '#a0aec0', transition: 'color 0.3s' }}>
                            {/[0-9]/.test(newPassword) ? '✓' : '○'} Obsahuje číslici
                        </Typography>
                    </Box>

                    <Typography component="label" htmlFor="confirm-password-input" sx={authStyles.inputLabel}>
                        Potvrzení hesla
                    </Typography>
                    <InputBase
                        id="confirm-password-input"
                        name="confirmPassword"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        sx={authStyles.inputField}
                        placeholder="Zopakujte heslo"
                        required
                        type="password"
                        startAdornment={<VpnKeyIcon sx={authStyles.inputIcon} />}
                    />

                    {error && <Typography sx={authStyles.errorMessage}>{error}</Typography>}

                    <Button
                        type="submit"
                        disabled={loading}
                        variant="contained"
                        sx={{ ...authStyles.submitButton, mb: 3, mt: 1 }}
                    >
                        {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Uložit heslo'}
                    </Button>

                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Link to="/" style={authStyles.link}>
                            Zrušit a vrátit se na přihlášení
                        </Link>
                    </Box>
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

export default ResetPassword;