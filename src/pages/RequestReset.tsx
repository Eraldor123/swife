import React, { useState, type SyntheticEvent } from 'react';
import { Box, Typography, Button, InputBase, CircularProgress } from '@mui/material';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import { Link } from 'react-router-dom';
import { authStyles } from '../theme/auth.styles';

// Technické importy
import apiClient from '../api/axiosConfig';

const RequestReset: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    // OPRAVA: Použití SyntheticEvent pro odstranění deprecace FormEvent
    const handleSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            // NÁHRADA: Použití apiClient (URL je nyní relativní k baseURL)
            await apiClient.post('/auth/password-reset/request', { email });

            setMessage({
                text: 'Pokud je e-mail v našem systému zaregistrován, odeslali jsme na něj instrukce k obnově hesla.',
                isError: false
            });
        } catch (error: unknown) {
            // I při chybě sítě zachováme tvou bezpečnostní logiku
            console.error("Technická chyba při požadavku na reset:", error);
            setMessage({
                text: 'Pokud je e-mail v našem systému zaregistrován, odeslali jsme na něj instrukce k obnově hesla.',
                isError: false
            });
        } finally {
            setLoading(false);
            setEmail('');
        }
    };

    return (
        <Box sx={authStyles.pageContainer}>

            <Box sx={authStyles.header}>
                <Typography sx={authStyles.logoText}>CompanyApp</Typography>
            </Box>

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

            <Box sx={authStyles.footer}>
                <Typography sx={authStyles.footerText}>
                    © {new Date().getFullYear()} Made by: Štěpán Ralenovský
                </Typography>
            </Box>

        </Box>
    );
};

export default RequestReset;