import React, { useState } from 'react';
import { Box, Typography, Button, InputBase, CircularProgress } from '@mui/material';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { authStyles } from '../theme/auth.styles';

const RequestReset: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            // Backend nyní vrací 200 OK, i když mail neexistuje
            await axios.post('http://localhost:8080/api/v1/auth/password-reset/request', { email });

            // Vždy ukážeme tuto zprávu
            setMessage({
                text: 'Pokud je e-mail v našem systému zaregistrován, odeslali jsme na něj instrukce k obnově hesla.',
                isError: false
            });
        } catch (error) {
            // I při chybě sítě nebo serveru nebudeme útočníkovi napovídat
            console.error("Technická chyba při požadavku na reset:", error);
            setMessage({
                text: 'Pokud je e-mail v našem systému zaregistrován, odeslali jsme na něj instrukce k obnově hesla.',
                isError: false
            });
        } finally {
            setLoading(false);
            setEmail(''); // Vymažeme pole pro profesionální dojem
        }
    };

    return (
        <Box sx={authStyles.pageContainer}>

            {/* 1. TMAVÁ SKLENĚNÁ HLAVIČKA S LOGEM */}
            <Box sx={authStyles.header}>
                <Typography sx={authStyles.logoText}>CompanyApp</Typography>
            </Box>

            {/* 2. VYCENTROVANÁ HLAVNÍ SKLENĚNÁ KARTA */}
            <Box sx={authStyles.mainContent}>
                <Box component="form" onSubmit={handleSubmit} sx={authStyles.formBox}>
                    <Typography variant="h5" sx={authStyles.formTitle}>
                        Obnova hesla
                    </Typography>

                    <Typography component="label" htmlFor="reset-email-input" sx={authStyles.inputLabel}>
                        E-mailová adresa
                    </Typography>
                    <InputBase
                        id="reset-email-input"
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

                    {message && (
                        <Typography sx={message.isError ? authStyles.errorMessage : authStyles.successMessage}>
                            {message.text}
                        </Typography>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        variant="contained"
                        sx={{ ...authStyles.submitButton, mb: 3, mt: 1 }}
                    >
                        {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Odeslat odkaz'}
                    </Button>

                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Link to="/" style={authStyles.link}>
                            &larr; Zpět na přihlášení
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

export default RequestReset;