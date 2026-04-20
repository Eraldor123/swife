import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
    IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider,
    Avatar, Chip, FormControlLabel, Checkbox, InputAdornment, CircularProgress
} from '@mui/material';
import {
    Edit as EditIcon,
    ArrowBack as ArrowBackIcon,
    Search as SearchIcon,
    Close as CloseIcon,
    WorkspacePremium as WorkspacePremiumIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Technické importy
import apiClient from '../api/axiosConfig';
import { useNotification } from '../context/NotificationContext';
import { isAxiosError } from 'axios';

import { styles } from '../theme/EmployeeQualificationsPage.styles';

// --- ROZHRANÍ ---
interface Station {
    id: number;
    name: string;
    needsQualification: boolean;
}

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    contractType: string;
    photoUrl: string;
    qualifiedStationIds: number[];
}

interface HierarchyStation {
    id: number;
    name: string;
    needsQualification: boolean;
    isActive: boolean;
}

interface HierarchyCategory {
    stations: HierarchyStation[];
}

interface BackendError {
    message?: string;
}

const filterOptions = ["VŠE", "HPP", "DPP", "OSVC"];

const EmployeeQualificationsPage: React.FC = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [stations, setStations] = useState<Station[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [contractFilter, setContractFilter] = useState('VŠE');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [tempQualifications, setTempQualifications] = useState<number[]>([]);

    // 1. NAČÍTÁNÍ DAT PŘES API CLIENT
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Axios automaticky kóduje parametry, nemusíme používat encodeURIComponent
            const empRes = await apiClient.get('/qualifications/employees', {
                params: {
                    page: page,
                    size: rowsPerPage,
                    search: searchQuery,
                    contractType: contractFilter
                }
            });

            if (empRes.status === 200) {
                setEmployees(empRes.data.content || []);
                setTotalElements(empRes.data.totalElements || 0);
            }

            if (stations.length === 0) {
                const hierRes = await apiClient.get('/position-settings/hierarchy');
                if (hierRes.status === 200) {
                    const qualStations: Station[] = [];
                    (hierRes.data?.categories || []).forEach((cat: HierarchyCategory) => {
                        (cat?.stations || []).forEach((stat: HierarchyStation) => {
                            if (stat.needsQualification) {
                                qualStations.push({ id: stat.id, name: stat.name, needsQualification: true });
                            }
                        });
                    });
                    setStations(qualStations);
                }
            }
        } catch (error) {
            console.error("Chyba při načítání dat:", error);
            showNotification('Nepodařilo se načíst data zaměstnanců.', 'error');
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, searchQuery, contractFilter, stations.length, showNotification]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            void fetchData();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [fetchData]);

    const handleChangePage = (_e: unknown, newPage: number) => setPage(newPage);
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setSearchQuery(event.target.value);
        setPage(0);
    };

    const handleFilterChange = (option: string) => {
        setContractFilter(option);
        setPage(0);
    };

    const handleOpenEdit = (employee: Employee) => {
        setSelectedEmployee(employee);
        setTempQualifications([...(employee.qualifiedStationIds || [])]);
        setIsDialogOpen(true);
    };

    const handleToggleQualification = (stationId: number) => {
        setTempQualifications(prev =>
            prev.includes(stationId) ? prev.filter(id => id !== stationId) : [...prev, stationId]
        );
    };

    // 2. UKLÁDÁNÍ KVALIFIKACÍ PŘES API CLIENT
    const handleSaveQualifications = async () => {
        if (!selectedEmployee) return;
        try {
            const response = await apiClient.put(`/qualifications/users/${selectedEmployee.id}`, {
                qualificationIds: tempQualifications
            });

            if (response.status === 200) {
                setEmployees(prev => prev.map(emp =>
                    emp.id === selectedEmployee.id ? { ...emp, qualifiedStationIds: tempQualifications } : emp
                ));
                showNotification('Kvalifikace byly úspěšně aktualizovány.', 'success');
                setIsDialogOpen(false);
            }
        } catch (error: unknown) {
            console.error("Chyba při ukládání kvalifikace:", error);
            if (isAxiosError(error)) {
                const errorData = error.response?.data as BackendError;
                showNotification(errorData?.message || 'Chyba při ukládání změn.', 'error');
            } else {
                showNotification('Chyba spojení se serverem.', 'error');
            }
        }
    };

    const getEmployeeStations = (ids: number[]) => {
        return (ids || []).map(id => stations.find(s => s.id === id)).filter(Boolean) as Station[];
    };

    if (loading && employees.length === 0) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={styles.container}>
            <Paper elevation={0} sx={styles.headerCard}>
                <Box sx={styles.headerLeft}>
                    <IconButton onClick={() => navigate('/dashboard/shifts')} sx={styles.backButton}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Box>
                        <Typography variant="h1" sx={styles.pageTitle}>
                            Kvalifikace zaměstnanců
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Správa oprávnění pro obsluhu stanovišť
                        </Typography>
                    </Box>
                </Box>
                <WorkspacePremiumIcon sx={styles.headerIcon} />
            </Paper>

            <Paper elevation={0} sx={styles.mainCard}>
                <Box sx={styles.controlsContainer}>
                    <TextField
                        placeholder="Hledat jméno..."
                        variant="outlined"
                        size="small"
                        sx={styles.searchInput}
                        value={searchQuery}
                        onChange={handleSearchChange}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" fontSize="small" />
                                    </InputAdornment>
                                )
                            }
                        }}
                    />

                    <Box sx={styles.filterContainer}>
                        <Typography variant="body2" color="textSecondary" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
                            Filtr úvazků:
                        </Typography>
                        {filterOptions.map(option => (
                            <Chip
                                key={option}
                                label={option}
                                onClick={() => handleFilterChange(option)}
                                color={contractFilter === option ? "primary" : "default"}
                                variant={contractFilter === option ? "filled" : "outlined"}
                                sx={{ fontWeight: 600, borderRadius: 2 }}
                                clickable
                            />
                        ))}
                    </Box>
                </Box>

                <TableContainer sx={styles.tableContainer}>
                    {loading && (
                        <Box sx={styles.loadingOverlay}>
                            <CircularProgress size={24} />
                        </Box>
                    )}
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={styles.tableHeaderCell}>Zaměstnanec</TableCell>
                                <TableCell sx={styles.tableHeaderCell}>Úvazek</TableCell>
                                <TableCell sx={styles.tableHeaderCell}>Kvalifikace</TableCell>
                                <TableCell sx={styles.tableHeaderCellCenter}>Akce</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {employees.length > 0 ? (
                                employees.map((emp) => {
                                    const empStations = getEmployeeStations(emp.qualifiedStationIds);
                                    return (
                                        <TableRow key={emp.id} hover sx={styles.tableRow}>
                                            <TableCell sx={styles.avatarCell}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Avatar src={emp.photoUrl} sx={styles.avatar}>
                                                        {(emp.firstName?.[0] || '')}{(emp.lastName?.[0] || '')}
                                                    </Avatar>
                                                    <Typography sx={styles.nameCell}>{emp.firstName} {emp.lastName}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={emp.contractType !== 'N/A' ? emp.contractType : 'Bez smlouvy'}
                                                    size="small"
                                                    sx={styles.getContractChipStyle(emp.contractType)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {empStations.length > 0 ? (
                                                    <Box sx={styles.qualificationsWrapper}>
                                                        {empStations.map(station => (
                                                            <Chip key={station.id} label={station.name} size="small" sx={styles.qualificationChip} />
                                                        ))}
                                                    </Box>
                                                ) : (
                                                    <Typography sx={styles.emptyQualText}>Žádná kvalifikace</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Button
                                                    variant="text"
                                                    size="small"
                                                    startIcon={<EditIcon />}
                                                    onClick={() => handleOpenEdit(emp)}
                                                    sx={styles.editButton}
                                                >
                                                    Nastavit
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} sx={styles.emptyTableState}>
                                        <SearchIcon sx={styles.emptySearchIcon} />
                                        <Typography variant="body1" color="textSecondary">Nenalezeni žádní zaměstnanci.</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={totalElements}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Zobrazit řádků:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} z ${count}`}
                    sx={{ borderTop: '1px solid #f0f0f0' }}
                />
            </Paper>

            <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} fullWidth maxWidth="sm" slotProps={{ paper: { sx: styles.dialogPaper } }}>
                <DialogTitle sx={styles.dialogTitle}>
                    Upravit kvalifikace
                    <IconButton onClick={() => setIsDialogOpen(false)} size="small" sx={{ color: '#999' }}><CloseIcon fontSize="small" /></IconButton>
                </DialogTitle>

                <DialogContent sx={styles.dialogContent}>
                    <Box sx={styles.dialogEmployeeInfo}>
                        <Avatar src={selectedEmployee?.photoUrl} sx={styles.dialogAvatar}>
                            {selectedEmployee ? `${selectedEmployee.firstName?.[0] || ''}${selectedEmployee.lastName?.[0] || ''}` : ''}
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" color="#2c3e50">
                                {selectedEmployee?.firstName} {selectedEmployee?.lastName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                Úvazek: {selectedEmployee?.contractType !== 'N/A' ? selectedEmployee?.contractType : 'Bez smlouvy'}
                            </Typography>
                        </Box>
                    </Box>

                    <Divider />

                    <Typography variant="body2" sx={styles.dialogSubtitle}>Vyberte povolená stanoviště:</Typography>

                    <Box sx={styles.checkboxGrid}>
                        {(stations || []).length > 0 ? stations.map(station => (
                            <FormControlLabel
                                key={station.id}
                                control={
                                    <Checkbox
                                        checked={tempQualifications.includes(station.id)}
                                        onChange={() => handleToggleQualification(station.id)}
                                        color="primary"
                                        size="small"
                                    />
                                }
                                label={station.name}
                                sx={{
                                    ...styles.checkboxLabel,
                                    '& .MuiFormControlLabel-label': {
                                        fontWeight: tempQualifications.includes(station.id) ? 600 : 400,
                                        color: tempQualifications.includes(station.id) ? '#2c3e50' : '#666'
                                    }
                                }}
                            />
                        )) : (
                            <Typography variant="body2" color="textSecondary">Žádná stanoviště k dispozici.</Typography>
                        )}
                    </Box>
                </DialogContent>

                <DialogActions sx={styles.dialogActions}>
                    <Button onClick={() => setIsDialogOpen(false)} variant="outlined" sx={styles.cancelButton}>
                        Zrušit
                    </Button>
                    <Button variant="contained" onClick={handleSaveQualifications} disabled={(stations || []).length === 0} sx={styles.saveButton}>
                        Uložit změny
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EmployeeQualificationsPage;