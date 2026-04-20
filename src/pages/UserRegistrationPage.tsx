import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, MenuItem, FormControlLabel, Checkbox, ListItemText, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CalculateIcon from '@mui/icons-material/Calculate';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonAddIcon from '@mui/icons-material/PersonAddAlt1';

// Importy pro bezpečnost a notifikace
import apiClient from '../api/axiosConfig';
import { useNotification } from '../context/NotificationContext';
import { isAxiosError } from 'axios';

// Import tvých stylů
import { styles } from '../theme/UserRegistrationPage.styles';

const accessLevelsOptions = [
    { value: 'BASIC', label: 'Brigádník (BASIC)' },
    { value: 'PLANNER', label: 'Plánovač (PLANNER)' },
    { value: 'MANAGEMENT', label: 'Manažer (MANAGEMENT)' },
    { value: 'ADMIN', label: 'Administrátor (ADMIN)' },
];

// Rozhraní pro chybu z backendu
interface BackendError {
    message?: string;
}

const UserRegistrationPage: React.FC = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        const finalValue = type === 'checkbox' ? checked : value;

        setFormData(prev => ({
            ...prev,
            [name]: finalValue
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

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        let calculatedContractSize: number | null = null;
        if (formData.contractType === 'HPP') {
            if (formData.employmentWorkload === 'FULL_TIME') calculatedContractSize = 1.0;
            else if (formData.employmentWorkload === 'PART_TIME_HALF') calculatedContractSize = 0.5;
            else if (formData.employmentWorkload === 'PART_TIME_QUARTER') calculatedContractSize = 0.25;
            else if (formData.employmentWorkload === 'CUSTOM') calculatedContractSize = parseFloat(formData.customWorkload);
        }

        try {
            const response = await apiClient.post('/auth/register', {
                ...formData,
                hourlyWage: formData.hourlyWage ? parseFloat(formData.hourlyWage) : null,
                monthlyWage: formData.monthlyWage ? parseFloat(formData.monthlyWage) : null,
                fixedReward: formData.fixedReward ? parseFloat(formData.fixedReward) : null,
                contractSize: calculatedContractSize,
                ico: formData.ico || null
            });

            if (response.status === 201 || response.status === 200) {
                console.log("Uživatel zaregistrován. Vygenerovaný PIN:", response.data.pin);
                showNotification('Uživatel byl úspěšně zaregistrován!', 'success');

                setFormData({
                    firstName: '', lastName: '', email: '', phone: '',
                    contractType: 'DPP', accessLevels: ['BASIC'],
                    hourlyWage: '', monthlyWage: '', ico: '', paymentType: 'HODINOVA_SAZBA', fixedReward: '',
                    employmentWorkload: 'FULL_TIME', customWorkload: '',
                    sendPassword: true
                });
            }
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                const errorData = err.response?.data as BackendError;
                showNotification(errorData?.message || 'Chyba při registraci uživatele.', 'error');
            } else {
                showNotification('Chyba serveru. Je backend spuštěný?', 'error');
            }
        }
    };

    return (
        <Box sx={styles.container}>
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

            <Paper elevation={0} sx={styles.mainCard}>
                <Box component="form" onSubmit={handleSubmit} sx={styles.formContainer}>
                    <Box sx={styles.row}>
                        <TextField
                            id="firstNameInput"
                            sx={styles.textField}
                            label="Jméno *"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                        />
                        <TextField
                            id="lastNameInput"
                            sx={styles.textField}
                            label="Příjmení *"
                            name="lastName"
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
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        <TextField
                            id="phoneInput"
                            sx={styles.textField}
                            label="Telefon"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </Box>

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
                                    accessLevels: Array.isArray(value) ? value : [value]
                                }));
                            }}
                            required
                            slotProps={{
                                select: {
                                    multiple: true,
                                    renderValue: (selected) => (selected as string[])
                                        .map(val => accessLevelsOptions.find(o => o.value === val)?.label)
                                        .join(', ')
                                }
                            }}
                        >
                            {accessLevelsOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    <Checkbox
                                        sx={styles.checkbox}
                                        checked={formData.accessLevels.indexOf(option.value) > -1}
                                    />
                                    <ListItemText primary={option.label} />
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>

                    <Box sx={styles.wageSection}>
                        {formData.contractType === 'DPP' && (
                            <TextField
                                id="dppHourlyWage"
                                sx={styles.textField}
                                label="Hodinová mzda (Kč)" name="hourlyWage" type="number"
                                value={formData.hourlyWage} onChange={handleChange}
                            />
                        )}

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
                                            label="Velikost úvazku *" name="customWorkload" type="number"
                                            value={formData.customWorkload} onChange={handleChange} required
                                            slotProps={{ htmlInput: { step: "0.1", min: "0.1", max: "1.0" } }}
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

                        {formData.contractType === 'OSVC' && (
                            <Box sx={styles.columnGroup}>
                                <TextField
                                    id="osvcIco"
                                    sx={styles.textField}
                                    label="IČO *" name="ico" value={formData.ico}
                                    onChange={handleChange} required
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
                        control={
                            <Checkbox
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
        </Box>
    );
};

export default UserRegistrationPage;