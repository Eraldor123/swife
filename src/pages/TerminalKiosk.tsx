import React, { useState } from 'react';
import { Box, Typography, Button, Grid, Paper } from '@mui/material';
import BackspaceIcon from '@mui/icons-material/Backspace';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useAuth } from '../context/AuthContext';

const TerminalKiosk: React.FC = () => {
    const [pin, setPin] = useState<string>('');
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Využijeme token terminálu (tabletu), který už je přihlášený
    const { isAuthenticated } = useAuth();

    const handleNumberClick = (num: string) => {
        if (pin.length < 4) {
            setPin((prev) => prev + num);
            setMessage({ text: '', type: '' }); // Skryjeme předchozí zprávy při novém zadávání
        }
    };

    const handleDelete = () => {
        setPin((prev) => prev.slice(0, -1));
    };

    const handleClear = () => {
        setPin('');
        setMessage({ text: '', type: '' });
    };

    const handleSubmit = async () => {
        if (pin.length !== 4) {
            setMessage({ text: 'PIN musí mít 4 číslice.', type: 'error' });
            return;
        }

        setIsLoading(true);
        try {
            // Voláme endpoint pro autentizaci terminálu, který očekává JSON s "pin"
            const response = await fetch('http://localhost:8080/api/v1/terminal/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // ZMĚNA: Přidáno odesílání HttpOnly cookies
                body: JSON.stringify({ pin: pin }),
            });

            if (response.ok) {
                const data = await response.json();
                // Backend nám vrátil UUID uživatele, kterému patří tento PIN
                console.log("Přihlášený zaměstnanec ID:", data.userId);

                setMessage({ text: 'Ověřuji směnu...', type: 'success' });

                // Pípnutí směny
                const actionResponse = await fetch('http://localhost:8080/api/v1/terminal/action', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include', // ZMĚNA: Přidáno odesílání HttpOnly cookies
                    body: JSON.stringify({ userId: data.userId }),
                });

                if (actionResponse.ok) {
                    const actionData = await actionResponse.json();
                    // Frontend pozná příchod od odchodu podle toho, jestli má clockOutTime hodnotu
                    const isClockOut = actionData.clockOutTime !== null;
                    setMessage({
                        text: isClockOut ? 'Odchod zaznamenán!' : 'Příchod zaznamenán!',
                        type: 'success'
                    });
                } else {
                    // Backend vrátil chybu (např. "Nemáte momentálně naplánovanou směnu")
                    const errorData = await actionResponse.json().catch(() => null);
                    setMessage({ text: errorData?.message || 'Nemáte naplánovanou směnu.', type: 'error' });
                }

                // Po 3 vteřinách vyčistíme obrazovku pro dalšího zaměstnance
                setTimeout(() => {
                    setPin('');
                    setMessage({ text: '', type: '' });
                }, 3000);

            } else {
                setMessage({ text: 'Neznámý PIN.', type: 'error' });
                setPin(''); // Vymažeme PIN při chybě
            }
        } catch (err) {
            console.log(err);
            setMessage({ text: 'Chyba serveru.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    // Vykreslení klávesnice
    const renderKeypad = () => {
        const keys = [
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['C', '0', 'DEL']
        ];

        return (
            <Grid container spacing={2} sx={{ maxWidth: '300px', mx: 'auto' }}>
                {keys.flat().map((key) => (
                    <Grid size={4} key={key}>
                        <Button
                            variant={key === 'C' || key === 'DEL' ? 'outlined' : 'contained'}
                            onClick={() => {
                                if (key === 'C') handleClear();
                                else if (key === 'DEL') handleDelete();
                                else handleNumberClick(key);
                            }}
                            sx={{
                                width: '100%',
                                height: '80px',
                                fontSize: '24px',
                                fontWeight: 'bold',
                                borderRadius: '16px',
                                bgcolor: key === 'C' || key === 'DEL' ? 'transparent' : '#3e3535',
                                color: key === 'C' || key === 'DEL' ? '#3e3535' : 'white',
                                borderColor: '#3e3535',
                                '&:hover': {
                                    bgcolor: key === 'C' || key === 'DEL' ? '#f0f0f0' : '#1e1a1a',
                                }
                            }}
                        >
                            {key === 'DEL' ? <BackspaceIcon fontSize="large" /> : key}
                        </Button>
                    </Grid>
                ))}
            </Grid>
        );
    };

    if (!isAuthenticated) {
        return <Typography sx={{ p: 4 }}>Terminál není přihlášen. Přihlaste se jako administrátor.</Typography>;
    }

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
            <Paper elevation={4} sx={{ p: 5, borderRadius: 4, width: '400px', textAlign: 'center', bgcolor: 'white' }}>

                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: '#3e3535' }}>
                    Docházkový Terminál
                </Typography>
                <Typography sx={{ color: 'text.secondary', mb: 4 }}>
                    Zadejte svůj unikátní PIN
                </Typography>

                {/* Vizuální zobrazení zadaného PINu (puntíky místo čísel pro bezpečnost) */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4, height: '40px' }}>
                    {[0, 1, 2, 3].map((index) => (
                        <Box
                            key={index}
                            sx={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                bgcolor: index < pin.length ? '#3e3535' : '#e0e0e0',
                                transition: 'background-color 0.2s'
                            }}
                        />
                    ))}
                </Box>

                {/* Zprávy o úspěchu nebo chybě */}
                <Box sx={{ height: '30px', mb: 2 }}>
                    {message.text && (
                        <Typography sx={{
                            color: message.type === 'success' ? 'green' : 'red',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1
                        }}>
                            {message.type === 'success' && <CheckCircleOutlineIcon />}
                            {message.text}
                        </Typography>
                    )}
                </Box>

                {/* Numerická klávesnice */}
                {renderKeypad()}

                <Button
                    variant="contained"
                    fullWidth
                    disabled={pin.length !== 4 || isLoading}
                    onClick={handleSubmit}
                    sx={{
                        mt: 4,
                        height: '60px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        borderRadius: '16px',
                        bgcolor: '#4caf50', // Zelené potvrzovací tlačítko
                        '&:hover': { bgcolor: '#388e3c' },
                        '&:disabled': { bgcolor: '#a5d6a7', color: 'white' }
                    }}
                >
                    {isLoading ? 'Ověřuji...' : 'Ověřit PIN'}
                </Button>
            </Paper>
        </Box>
    );
};

export default TerminalKiosk;