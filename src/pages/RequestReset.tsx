import React, { useState } from 'react';
import { Box, Typography, Button, InputBase, CircularProgress } from '@mui/material';
import LandscapeIcon from '@mui/icons-material/Landscape';
import { Link } from 'react-router-dom';
import axios from 'axios';

const RequestReset: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            await axios.post('http://localhost:8080/api/v1/auth/password-reset/request', { email });
            setMessage({ text: 'Pokud e-mail existuje, odeslali jsme instrukce k obnově.', isError: false });
        } catch (error) {
            console.error(error);
            setMessage({ text: 'Chyba při odesílání požadavku.', isError: true });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            {/* POZADÍ JAKO V LOGINU */}
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
                        width: '350px',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: 3
                    }}
                >
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center', mb: 3 }}>
                        Obnova hesla
                    </Typography>

                    <Typography sx={{ color: 'white', textAlign: 'center', mb: 1, fontSize: '14px' }}>E-mailová adresa</Typography>
                    <InputBase
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        sx={{ bgcolor: 'white', borderRadius: '20px', px: 2, py: 0.5, mb: 2 }}
                        required
                        type="email"
                        placeholder="Zadejte svůj e-mail"
                    />

                    {message && (
                        <Typography sx={{
                            fontSize: '13px',
                            textAlign: 'center',
                            mb: 2,
                            color: message.isError ? '#ef5350' : '#81c784',
                            fontWeight: 'bold'
                        }}>
                            {message.text}
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
                        {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Odeslat odkaz'}
                    </Button>

                    <Link to="/" style={{ fontSize: '13px', color: '#9cb3d4', textDecoration: 'none', textAlign: 'center' }}>
                        &larr; Zpět na přihlášení
                    </Link>
                </Box>
            </Box>

            {/* PATIČKA */}
            <Box sx={{ height: '80px', bgcolor: '#3e3535' }} />
        </Box>
    );
};

export default RequestReset;