import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, MenuItem, FormControlLabel, Checkbox, Alert, ListItemText, Snackbar, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CalculateIcon from '@mui/icons-material/Calculate';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonAddIcon from '@mui/icons-material/PersonAddAlt1';

// Import stylů
import { styles } from '../theme/UserRegistrationPage.styles';

const accessLevelsOptions = [
    { value: 'BASIC', label: 'Brigádník (BASIC)' },
    { value: 'PLANNER', label: 'Plánovač (PLANNER)' },
    { value: 'MANAGEMENT', label: 'Manažer (MANAGEMENT)' },
    { value: 'ADMIN', label: 'Administrátor (ADMIN)' },
];

const UserRegistrationPage: React.FC = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        contractType: 'DPP',
        accessLevels: ['BASIC'],
        hourlyWage: '',
        monthlyWage: '',
        ico: '',
        paymentType: 'HODINOVA_SAZBA',
        fixedReward: '',
        employmentWorkload: 'FULL_TIME',
        customWorkload: '',
        sendPassword: true
    });

    const [status, setStatus] = useState<{ type: 'success' | 'error' | undefined; message: string }>({ type: undefined, message: '' });
    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | React.ChangeEvent<{ name?: string | undefined; value: unknown; }>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        const finalValue = type === 'checkbox' ? checked : value;

        setFormData(prev => ({
            ...prev,
            [name as string]: type ? finalValue : e.target.value
        }));
    };

    const calculateHourlyWage = () => {
        if (formData.monthlyWage) {
            const monthly = parseFloat(formData.monthlyWage);

            let workloadFactor = 1.0;
            if (formData.employmentWorkload === 'PART_TIME_HALF') workloadFactor = 0.5;
            if (formData.employmentWorkload === 'PART_TIME_QUARTER') workloadFactor = 0.25;
            if (formData.employmentWorkload === 'CUSTOM' && formData.customWorkload) {
                workloadFactor = parseFloat(formData.customWorkload);
            }

            const hourly = (monthly / (160 * workloadFactor)).toFixed(2);
            setFormData(prev => ({ ...prev, hourlyWage: hourly }));
        }
    };

    const handleCloseSnackbar = (reason?: string) => {
        if (reason === 'clickaway') return;
        setSnackbarOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let calculatedContractSize: number | null = null;
        if (formData.contractType === 'HPP') {
            if (formData.employmentWorkload === 'FULL_TIME') calculatedContractSize = 1.0;
            else if (formData.employmentWorkload === 'PART_TIME_HALF') calculatedContractSize = 0.5;
            else if (formData.employmentWorkload === 'PART_TIME_QUARTER') calculatedContractSize = 0.25;
            else if (formData.employmentWorkload === 'CUSTOM') calculatedContractSize = parseFloat(formData.customWorkload);
        }

        try {
            const response = await fetch('http://localhost:8080/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    ...formData,
                    hourlyWage: formData.hourlyWage ? parseFloat(formData.hourlyWage) : null,
                    monthlyWage: formData.monthlyWage ? parseFloat(formData.monthlyWage) : null,
                    fixedReward: formData.fixedReward ? parseFloat(formData.fixedReward) : null,
                    contractSize: calculatedContractSize,
                    ico: formData.ico || null
                }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Uživatel zaregistrován. Vygenerovaný PIN:", data.pin);

                setStatus({ type: 'success', message: 'Uživatel byl úspěšně zaregistrován!' });
                setSnackbarOpen(true);

                setFormData({
                    firstName: '', lastName: '', email: '', phone: '',
                    contractType: 'DPP', accessLevels: ['BASIC'],
                    hourlyWage: '', monthlyWage: '', ico: '', paymentType: 'HODINOVA_SAZBA', fixedReward: '',
                    employmentWorkload: 'FULL_TIME', customWorkload: '',
                    sendPassword: true
                });
            } else {
                const errorData = await response.json().catch(() => null);
                setStatus({ type: 'error', message: errorData?.message || 'Chyba při registraci uživatele.' });
                setSnackbarOpen(true);
            }
        } catch (err) {
            console.log(err);
            setStatus({ type: 'error', message: 'Chyba serveru. Je backend spuštěný?' });
            setSnackbarOpen(true);
        }
    };

    return (
        <Box sx={styles.container}>
            {/* 1. HORNÍ KARTA (Záhlaví) */}
            <Paper elevation={0} sx={styles.headerCard}>
                <Box sx={styles.headerLeft}>
                    <IconButton onClick={() => navigate('/dashboard/users')} sx={styles.backButton}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography sx={styles.backText} onClick={() => navigate('/dashboard/users')}>
                        Zpět na přehled
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h1" sx={styles.pageTitle}>
                        Registrace nového uživatele
                    </Typography>
                    <PersonAddIcon sx={styles.headerIcon} />
                </Box>
            </Paper>

            {/* 2. DOLNÍ KARTA (Samotný formulář) */}
            <Paper elevation={0} sx={styles.mainCard}>
                <Box component="form" onSubmit={handleSubmit} sx={styles.formContainer}>

                    {/* ZÁKLADNÍ ÚDAJE */}
                    <Box sx={styles.row}>
                        <TextField
                            id="firstNameInput"
                            sx={styles.textField}
                            label="Jméno *"
                            name="firstName"
                            autoComplete="given-name"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                        />
                        <TextField
                            id="lastNameInput"
                            sx={styles.textField}
                            label="Příjmení *"
                            name="lastName"
                            autoComplete="family-name"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                        />
                    </Box>

                    <Box sx={styles.row}>
                        <TextField
                            id="emailInput"
                            sx={styles.textField}
                            label="E-mail *"
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        <TextField
                            id="phoneInput"
                            sx={styles.textField}
                            label="Telefon"
                            name="phone"
                            autoComplete="tel"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </Box>

                    {/* SMLOUVA A PŘÍSTUP */}
                    <Box sx={styles.row}>
                        <TextField
                            id="contractTypeSelect"
                            sx={styles.textField}
                            select label="Smluvní vztah *" name="contractType"
                            value={formData.contractType} onChange={handleChange} required
                        >
                            <MenuItem value="DPP">DPP</MenuItem>
                            <MenuItem value="HPP">HPP</MenuItem>
                            <MenuItem value="OSVC">OSVČ</MenuItem>
                        </TextField>

                        <TextField
                            id="accessLevelsSelect"
                            sx={styles.textField}
                            select label="Úroveň přístupu *" name="accessLevels"
                            value={formData.accessLevels}
                            onChange={(e) => {
                                const value = e.target.value;
                                setFormData(prev => ({
                                    ...prev,
                                    accessLevels: typeof value === 'string' ? value.split(',') : value as string[]
                                }));
                            }}
                            required
                            SelectProps={{
                                multiple: true,
                                renderValue: (selected) => (selected as string[])
                                    .map(val => accessLevelsOptions.find(o => o.value === val)?.label)
                                    .join(', ')
                            }}
                        >
                            {accessLevelsOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    <Checkbox
                                        id={`checkbox-accessLevel-${option.value}`}
                                        name={`accessLevels-${option.value}`}
                                        sx={styles.checkbox}
                                        checked={formData.accessLevels.indexOf(option.value) > -1}
                                    />
                                    <ListItemText primary={option.label} />
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>

                    {/* MZDOVÁ ČÁST */}
                    <Box sx={styles.wageSection}>

                        {/* DPP */}
                        {formData.contractType === 'DPP' && (
                            <TextField
                                id="dppHourlyWage"
                                sx={styles.textField}
                                label="Hodinová mzda (Kč)" name="hourlyWage" type="number"
                                value={formData.hourlyWage} onChange={handleChange}
                            />
                        )}

                        {/* HPP */}
                        {formData.contractType === 'HPP' && (
                            <Box sx={styles.columnGroup}>
                                <Box sx={styles.row}>
                                    <TextField
                                        id="hppEmploymentWorkload"
                                        sx={styles.textField}
                                        select label="Typ úvazku *" name="employmentWorkload"
                                        value={formData.employmentWorkload} onChange={handleChange} required
                                    >
                                        <MenuItem value="FULL_TIME">Plný úvazek (1.0)</MenuItem>
                                        <MenuItem value="PART_TIME_HALF">Poloviční úvazek (0.5)</MenuItem>
                                        <MenuItem value="PART_TIME_QUARTER">Čtvrteční úvazek (0.25)</MenuItem>
                                        <MenuItem value="CUSTOM">Vlastní ...</MenuItem>
                                    </TextField>

                                    {formData.employmentWorkload === 'CUSTOM' && (
                                        <TextField
                                            id="hppCustomWorkload"
                                            sx={styles.textField}
                                            label="Velikost úvazku (např. 0.8) *" name="customWorkload" type="number"
                                            inputProps={{ step: "0.1", min: "0.1", max: "1.0" }}
                                            value={formData.customWorkload} onChange={handleChange} required
                                        />
                                    )}
                                </Box>

                                <Box sx={styles.calcRow}>
                                    <TextField
                                        id="hppMonthlyWage"
                                        sx={styles.textField}
                                        label="Měsíční mzda (Kč)" name="monthlyWage" type="number"
                                        value={formData.monthlyWage} onChange={handleChange}
                                    />

                                    <Button
                                        variant="outlined"
                                        onClick={calculateHourlyWage}
                                        startIcon={<CalculateIcon />}
                                        sx={styles.calcButton}
                                    >
                                        Vypočítat hodinovku
                                    </Button>

                                    <TextField
                                        id="hppHourlyWage"
                                        sx={styles.textField}
                                        label="Průměrná hodinová mzda (Kč)" name="hourlyWage" type="number"
                                        value={formData.hourlyWage} onChange={handleChange}
                                    />
                                </Box>
                            </Box>
                        )}

                        {/* OSVČ */}
                        {formData.contractType === 'OSVC' && (
                            <Box sx={styles.columnGroup}>
                                <TextField
                                    id="osvcIco"
                                    sx={styles.textField}
                                    label="IČO *" name="ico" value={formData.ico}
                                    onChange={handleChange} required={formData.contractType === 'OSVC'}
                                />

                                <Box sx={styles.row}>
                                    <TextField
                                        id="osvcPaymentType"
                                        sx={styles.textField}
                                        select label="Typ odměňování" name="paymentType"
                                        value={formData.paymentType} onChange={handleChange}
                                    >
                                        <MenuItem value="HODINOVA_SAZBA">Hodinová sazba</MenuItem>
                                        <MenuItem value="FIXNI_ODMENA">Fixní odměna (měsíčně)</MenuItem>
                                    </TextField>

                                    {formData.paymentType === 'HODINOVA_SAZBA' ? (
                                        <TextField
                                            id="osvcHourlyWage"
                                            sx={styles.textField}
                                            label="Hodinová sazba (Kč)" name="hourlyWage" type="number"
                                            value={formData.hourlyWage} onChange={handleChange}
                                        />
                                    ) : (
                                        <TextField
                                            id="osvcFixedReward"
                                            sx={styles.textField}
                                            label="Fixní odměna (Kč)" name="fixedReward" type="number"
                                            value={formData.fixedReward} onChange={handleChange}
                                        />
                                    )}
                                </Box>
                            </Box>
                        )}
                    </Box>

                    <FormControlLabel
                        htmlFor="sendPasswordCheckbox"
                        control={
                            <Checkbox
                                id="sendPasswordCheckbox"
                                name="sendPassword"
                                sx={styles.checkbox}
                                checked={formData.sendPassword}
                                onChange={handleChange}
                            />
                        }
                        label="Zaslat uživateli vygenerovaný PIN a přístupy na e-mail"
                        sx={{ mt: 1 }}
                    />

                    <Button type="submit" variant="contained" sx={styles.submitButton}>
                        Vytvořit uživatele
                    </Button>
                </Box>
            </Paper>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={(_, reason) => handleCloseSnackbar(reason)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => handleCloseSnackbar()}
                    severity={status.type}
                    sx={styles.alert}
                    variant="filled"
                >
                    {status.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default UserRegistrationPage;