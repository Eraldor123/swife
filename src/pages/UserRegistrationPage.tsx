import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, MenuItem, FormControlLabel, Checkbox, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const UserRegistrationPage: React.FC = () => {
    const navigate = useNavigate();

    // Stav pro data formuláře (inicializace výchozích hodnot)
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        contractType: 'DPP', // Výchozí hodnota pro select
        accessLevel: 'BASIC', // Výchozí hodnota pro select
        hourlyWage: '',
        sendPassword: true // Zaškrtnuto ve výchozím stavu
    });

    // Stav pro zobrazení zprávy o úspěchu nebo chybě
    const [status, setStatus] = useState<{ type: 'success' | 'error' | undefined; message: string }>({ type: undefined, message: '' });

    // Funkce pro obsluhu změn ve všech textových polích a checkoboxech
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | React.ChangeEvent<{ name?: string | undefined; value: unknown; }>) => {
        // Musíme ošetřit různé typy eventů pro TextField a Select
        const { name, value, type, checked } = e.target as HTMLInputElement; // Typování pro TextField/Checkbox
        const finalValue = type === 'checkbox' ? checked : value;

        setFormData(prev => ({
            ...prev,
            // Pokud event přišel ze Selectu (nemá type), vezmeme value
            [name]: type ? finalValue : e.target.value
        }));
    };

    // Odeslání formuláře na backend
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus({ type: undefined, message: '' }); // OPRAVA: resetujeme na undefined

        try {
            const token = localStorage.getItem('token'); // OPRAVA: Získáme token přímo ze storage

            const response = await fetch('http://localhost:8080/api/v1/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` // Zde použijeme náš token
                    },
                body: JSON.stringify({
                    ...formData,
                    // Převedeme hodinovou mzdu z textu na číslo, nebo null
                    hourlyWage: formData.hourlyWage ? parseFloat(formData.hourlyWage) : null
                }),
            });

            if (response.ok) {
                // Úspěšně zaregistrováno (Status 201 Created)
                const data = await response.json();
                // V logu uvidíš vygenerovaný PIN z backendu
                console.log("Uživatel zaregistrován. Vygenerovaný PIN:", data.pin);

                setStatus({ type: 'success', message: 'Uživatel byl úspěšně zaregistrován! PIN byl vygenerován a vypsán do logu konzole Spring Bootu.' });

                // Vyčistíme formulář
                setFormData({
                    firstName: '', lastName: '', email: '', phone: '',
                    contractType: 'DPP', accessLevel: 'BASIC', hourlyWage: '', sendPassword: true
                });
            } else {
                // Backend vrátil chybu (např. email již existuje)
                const errorData = await response.json().catch(() => null);
                setStatus({ type: 'error', message: errorData?.message || 'Chyba při registraci uživatele. Zkontrolujte údaje.' });
            }
        } catch (err) {
            // Chyba při síťovém volání
            console.log(err);
            setStatus({ type: 'error', message: 'Chyba serveru. Je backend spuštěný?' });
        }
    };

    return (
        <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
            {/* Tlačítko zpět, podle tvého návrhu z Figmy */}
            <Button onClick={() => navigate('/dashboard/users')} sx={{ mb: 2, color: '#3e3535' }}>
                &larr; Zpět na přehled uživatelů
            </Button>

            {/* Centrální karta s formulářem, podle wireframu */}
            <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>

                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 4, color: '#3e3535' }}>
                    Registrace nového uživatele
                </Typography>

                {/* Zobrazení zprávy o výsledku operace */}
                {status.message && (
                    <Alert severity={status.type} sx={{ mb: 3 }}>
                        {status.message}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                    {/* ŘÁDEK 1: Jméno a Příjmení */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField label="Jméno" name="firstName" value={formData.firstName} onChange={handleChange} required fullWidth />
                        <TextField label="Příjmení" name="lastName" value={formData.lastName} onChange={handleChange} required fullWidth />
                    </Box>

                    {/* ŘÁDEK 2: E-mail a Telefon */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField label="E-mail" name="email" type="email" value={formData.email} onChange={handleChange} required fullWidth />
                        <TextField label="Telefon" name="phone" value={formData.phone} onChange={handleChange} fullWidth />
                    </Box>

                    {/* ŘÁDEK 3: Smluvní vztah a Úroveň přístupu (Selecty) */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            select label="Smluvní vztah" name="contractType"
                            value={formData.contractType} onChange={handleChange} required fullWidth
                        >
                            {/* Možnosti pro select Smluvní vztah. Je nutné ověřit, že odpovídají enumům na backendu. */}
                            <MenuItem value="DPP">DPP</MenuItem>
                            <MenuItem value="HPP">HPP</MenuItem>
                            <MenuItem value="OSVC">OSVČ</MenuItem>
                            <MenuItem value="TERMINAL">Kiosk (Terminál)</MenuItem>
                        </TextField>

                        <TextField
                            select label="Úroveň přístupu" name="accessLevel"
                            value={formData.accessLevel} onChange={handleChange} required fullWidth
                        >
                            {/* Možnosti pro select Úroveň přístupu. Odpovídají enumům, které jsme dříve definovali. */}
                            <MenuItem value="BASIC">Brigádník (BASIC)</MenuItem>
                            <MenuItem value="PLANNER">Plánovač (PLANNER)</MenuItem>
                            <MenuItem value="MANAGEMENT">Manažer (MANAGEMENT)</MenuItem>
                            <MenuItem value="ADMIN">Administrátor (ADMIN)</MenuItem>
                            <MenuItem value="TERMINAL">Terminál (TERMINAL)</MenuItem>
                        </TextField>
                    </Box>

                    {/* ŘÁDEK 4: Hodinová mzda (Numeric) */}
                    <TextField
                        label="Hodinová mzda (Kč)" name="hourlyWage" type="number"
                        value={formData.hourlyWage} onChange={handleChange} fullWidth
                    />

                    {/* ŘÁDEK 5: Zaslat heslo (Checkbox) */}
                    <FormControlLabel
                        control={<Checkbox name="sendPassword" checked={formData.sendPassword} onChange={handleChange} />}
                        label="Zaslat uživateli vygenerovaný PIN a přístupy na e-mail"
                    />

                    {/* TLAČÍTKO Vytvořit, podle návrhu */}
                    <Button
                        type="submit" variant="contained"
                        sx={{ mt: 2, height: '50px', bgcolor: '#3e3535', '&:hover': { bgcolor: '#1e1a1a' }, fontWeight: 'bold' }}
                    >
                        Vytvořit uživatele
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default UserRegistrationPage;