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

const filterOptions = ["VŠE", "HPP", "DPP", "OSVC"];

const EmployeeQualificationsPage: React.FC = () => {
    const navigate = useNavigate();

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

    // 1. OPRAVENÝ FETCH - POSÍLÁ PARAMETRY NA BACKEND
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Sestavíme URL s novými parametry pro serverové filtrování
            const searchParam = encodeURIComponent(searchQuery);
            const url = `http://localhost:8080/api/v1/qualifications/employees?page=${page}&size=${rowsPerPage}&search=${searchParam}&contractType=${contractFilter}`;

            const empRes = await fetch(url, {
                credentials: 'include'
            });

            if (empRes.ok) {
                const data = await empRes.json();
                setEmployees(data.content || []);
                setTotalElements(data.totalElements || 0);
            }

            // Načtení stanovišť (stačí načítat jen když je pole prázdné, ale ponechávám tvou logiku)
            if (stations.length === 0) {
                const hierRes = await fetch('http://localhost:8080/api/v1/position-settings/hierarchy', {
                    credentials: 'include'
                });
                if (hierRes.ok) {
                    const hierData = await hierRes.json();
                    const qualStations: Station[] = [];
                    (hierData?.categories || []).forEach((cat: HierarchyCategory) => {
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
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, searchQuery, contractFilter, stations.length]); // ZÁVISLOSTI AKTUALIZOVÁNY

    // 2. DEBOUNCE (Ochrana proti spamování serveru)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            void fetchData();
        }, 500); // Počká 500ms od posledního stisku klávesy

        return () => clearTimeout(timeoutId);
    }, [fetchData]);

    const handleChangePage = (_e: unknown, newPage: number) => setPage(newPage);
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // 3. Pomocné funkce pro reset stránky při změně filtru
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setSearchQuery(event.target.value);
        setPage(0); // Při novém hledání skočíme na první stránku
    };

    const handleFilterChange = (option: string) => {
        setContractFilter(option);
        setPage(0); // Při změně úvazku skočíme na první stránku
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

    const handleSaveQualifications = async () => {
        if (!selectedEmployee) return;
        try {
            const response = await fetch(`http://localhost:8080/api/v1/qualifications/users/${selectedEmployee.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ qualificationIds: tempQualifications })
            });

            if (response.ok) {
                setEmployees(prev => prev.map(emp =>
                    emp.id === selectedEmployee.id ? { ...emp, qualifiedStationIds: tempQualifications } : emp
                ));
                setIsDialogOpen(false);
            } else {
                console.error("Backend vrátil chybu:", response.status);
            }
        } catch (error) {
            console.error("Chyba při ukládání kvalifikace:", error);
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
                        onChange={handleSearchChange} // ZDE JE ZMĚNA
                        InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon color="action" fontSize="small" /></InputAdornment>) }}
                    />

                    <Box sx={styles.filterContainer}>
                        <Typography variant="body2" color="textSecondary" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
                            Filtr úvazků:
                        </Typography>
                        {filterOptions.map(option => (
                            <Chip
                                key={option}
                                label={option}
                                onClick={() => handleFilterChange(option)} // ZDE JE ZMĚNA
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
                            {/* ZDE UŽ MAPUJEME ROVNOU POLE EMPLOYEES */}
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

            <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: styles.dialogPaper }}>
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