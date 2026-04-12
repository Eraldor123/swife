import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Box, Typography, Button, InputBase, CircularProgress } from '@mui/material';
import LandscapeIcon from '@mui/icons-material/Landscape';
import axios from 'axios';

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
        <Box sx={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            {/* POZADÍ */}
            <Box sx={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1,
                background: 'linear-gradient(135deg, #e3c5d5 0%, #b8a3c9 50%, #9cb3d4 100%)'
            }} />

            {/* HLAVIČKA */}
            <Box sx={{ height: '80px', bgcolor: '#3e3535', display: 'flex', alignItems: 'center', px: 4 }}>
                <LandscapeIcon sx={{ color: 'white', fontSize: 40, mr: 1 }} />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mt: 1 }}>
                    skalkAPP
                </Typography>
            </Box>

            {/* HLAVNÍ OBSAH */}
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{
                        bgcolor: '#3e3535',
                        borderRadius: 4,
                        p: 4,
                        width: '380px',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: 3
                    }}
                >
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center', mb: 3 }}>
                        Nové heslo
                    </Typography>

                    <Typography sx={{ color: 'white', textAlign: 'center', mb: 1, fontSize: '14px' }}>Zadejte nové heslo</Typography>
                    <InputBase
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        sx={{ bgcolor: 'white', borderRadius: '20px', px: 2, py: 0.5, mb: 1 }}
                        required
                        type="password"
                    />

                    {/* Vizuální nápověda pro pravidla hesla */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2, px: 2 }}>
                        <Typography sx={{ fontSize: '12px', color: newPassword.length >= 8 ? '#81c784' : '#ffb74d', transition: 'color 0.3s' }}>
                            {newPassword.length >= 8 ? '✓' : '○'} Alespoň 8 znaků
                        </Typography>
                        <Typography sx={{ fontSize: '12px', color: /[A-Z]/.test(newPassword) ? '#81c784' : '#ffb74d', transition: 'color 0.3s' }}>
                            {/[A-Z]/.test(newPassword) ? '✓' : '○'} Obsahuje velké písmeno
                        </Typography>
                        <Typography sx={{ fontSize: '12px', color: /[0-9]/.test(newPassword) ? '#81c784' : '#ffb74d', transition: 'color 0.3s' }}>
                            {/[0-9]/.test(newPassword) ? '✓' : '○'} Obsahuje číslici
                        </Typography>
                    </Box>

                    <Typography sx={{ color: 'white', textAlign: 'center', mb: 1, fontSize: '14px' }}>Potvrzení hesla</Typography>
                    <InputBase
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        sx={{ bgcolor: 'white', borderRadius: '20px', px: 2, py: 0.5, mb: 3 }}
                        required
                        type="password"
                    />

                    {error && (
                        <Typography sx={{ fontSize: '13px', textAlign: 'center', mb: 2, color: '#ef5350', fontWeight: 'bold' }}>
                            {error}
                        </Typography>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        variant="contained"
                        sx={{
                            bgcolor: '#1e1a1a',
                            color: 'white',
                            borderRadius: '20px',
                            textTransform: 'none',
                            fontWeight: 'bold',
                            '&:hover': { bgcolor: '#000000' },
                            mb: 2
                        }}
                    >
                        {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Uložit heslo'}
                    </Button>

                    <Link to="/" style={{ fontSize: '13px', color: '#9cb3d4', textDecoration: 'none', textAlign: 'center' }}>
                        Zrušit a vrátit se na přihlášení
                    </Link>
                </Box>
            </Box>

            {/* PATIČKA */}
            <Box sx={{ height: '80px', bgcolor: '#3e3535' }} />
        </Box>
    );
};

export default ResetPassword;