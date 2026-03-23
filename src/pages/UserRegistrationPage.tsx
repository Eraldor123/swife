import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, MenuItem, FormControlLabel, Checkbox, Alert, ListItemText, Snackbar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CalculateIcon from '@mui/icons-material/Calculate';

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

    // OPRAVA: Funkce už vůbec neřeší 'event', bere si jen textový 'reason'
    const handleCloseSnackbar = (reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
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
            const token = localStorage.getItem('token');

            const response = await fetch('http://localhost:8080/api/v1/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
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
        <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
            <Button onClick={() => navigate('/dashboard/users')} sx={{ mb: 2, color: '#3e3535' }}>
                &larr; Zpět na přehled uživatelů
            </Button>

            <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 4, color: '#3e3535' }}>
                    Registrace nového uživatele
                </Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField label="Jméno *" name="firstName" value={formData.firstName} onChange={handleChange} required fullWidth />
                        <TextField label="Příjmení *" name="lastName" value={formData.lastName} onChange={handleChange} required fullWidth />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField label="E-mail *" name="email" type="email" value={formData.email} onChange={handleChange} required fullWidth />
                        <TextField label="Telefon" name="phone" value={formData.phone} onChange={handleChange} fullWidth />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            select label="Smluvní vztah *" name="contractType"
                            value={formData.contractType} onChange={handleChange} required fullWidth
                        >
                            <MenuItem value="DPP">DPP</MenuItem>
                            <MenuItem value="HPP">HPP</MenuItem>
                            <MenuItem value="OSVC">OSVČ</MenuItem>
                        </TextField>

                        <TextField
                            select
                            label="Úroveň přístupu *"
                            name="accessLevels"
                            value={formData.accessLevels}
                            onChange={(e) => {
                                const value = e.target.value;
                                setFormData(prev => ({
                                    ...prev,
                                    accessLevels: typeof value === 'string' ? value.split(',') : value as string[]
                                }));
                            }}
                            required
                            fullWidth
                            SelectProps={{
                                multiple: true,
                                renderValue: (selected) => (selected as string[])
                                    .map(val => accessLevelsOptions.find(o => o.value === val)?.label)
                                    .join(', ')
                            }}
                        >
                            {accessLevelsOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    <Checkbox checked={formData.accessLevels.indexOf(option.value) > -1} />
                                    <ListItemText primary={option.label} />
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>

                    <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                        {formData.contractType === 'DPP' && (
                            <TextField
                                label="Hodinová mzda (Kč)" name="hourlyWage" type="number"
                                value={formData.hourlyWage} onChange={handleChange} fullWidth
                            />
                        )}

                        {formData.contractType === 'HPP' && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField
                                        select label="Typ úvazku *" name="employmentWorkload"
                                        value={formData.employmentWorkload} onChange={handleChange} required fullWidth
                                    >
                                        <MenuItem value="FULL_TIME">Plný úvazek (1.0)</MenuItem>
                                        <MenuItem value="PART_TIME_HALF">Poloviční úvazek (0.5)</MenuItem>
                                        <MenuItem value="PART_TIME_QUARTER">Čtvrteční úvazek (0.25)</MenuItem>
                                        <MenuItem value="CUSTOM">Vlastní ...</MenuItem>
                                    </TextField>

                                    {formData.employmentWorkload === 'CUSTOM' && (
                                        <TextField
                                            label="Velikost úvazku (např. 0.8) *" name="customWorkload" type="number"
                                            inputProps={{ step: "0.1", min: "0.1", max: "1.0" }}
                                            value={formData.customWorkload} onChange={handleChange} required fullWidth
                                        />
                                    )}
                                </Box>

                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                    <TextField
                                        label="Měsíční mzda (Kč)" name="monthlyWage" type="number"
                                        value={formData.monthlyWage} onChange={handleChange} fullWidth
                                    />

                                    <Button
                                        variant="outlined"
                                        onClick={calculateHourlyWage}
                                        startIcon={<CalculateIcon />}
                                        sx={{ minWidth: '160px', height: '56px', borderColor: '#3e3535', color: '#3e3535' }}
                                    >
                                        Vypočítat hodinovku
                                    </Button>

                                    <TextField
                                        label="Průměrná hodinová mzda (Kč)" name="hourlyWage" type="number"
                                        value={formData.hourlyWage} onChange={handleChange} fullWidth
                                    />
                                </Box>
                            </Box>
                        )}

                        {formData.contractType === 'OSVC' && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <TextField
                                    label="IČO *" name="ico" value={formData.ico}
                                    onChange={handleChange} required={formData.contractType === 'OSVC'} fullWidth
                                />

                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField
                                        select label="Typ odměňování" name="paymentType"
                                        value={formData.paymentType} onChange={handleChange} fullWidth
                                    >
                                        <MenuItem value="HODINOVA_SAZBA">Hodinová sazba</MenuItem>
                                        <MenuItem value="FIXNI_ODMENA">Fixní odměna (měsíčně)</MenuItem>
                                    </TextField>

                                    {formData.paymentType === 'HODINOVA_SAZBA' ? (
                                        <TextField
                                            label="Hodinová sazba (Kč)" name="hourlyWage" type="number"
                                            value={formData.hourlyWage} onChange={handleChange} fullWidth
                                        />
                                    ) : (
                                        <TextField
                                            label="Fixní odměna (Kč)" name="fixedReward" type="number"
                                            value={formData.fixedReward} onChange={handleChange} fullWidth
                                        />
                                    )}
                                </Box>
                            </Box>
                        )}
                    </Box>

                    <FormControlLabel
                        control={<Checkbox name="sendPassword" checked={formData.sendPassword} onChange={handleChange} />}
                        label="Zaslat uživateli vygenerovaný PIN a přístupy na e-mail"
                    />

                    <Button
                        type="submit" variant="contained"
                        sx={{ mt: 2, height: '50px', bgcolor: '#3e3535', '&:hover': { bgcolor: '#1e1a1a' }, fontWeight: 'bold' }}
                    >
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
                    sx={{ width: '100%', fontSize: '16px', fontWeight: 'bold' }}
                    variant="filled"
                >
                    {status.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default UserRegistrationPage;