import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, TextField, MenuItem, Select, FormControl, InputLabel,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
    IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider,
    Avatar, Chip, Stack, FormControlLabel, Checkbox, InputAdornment, CircularProgress
} from '@mui/material';
import {
    Edit as EditIcon,
    ArrowBack as ArrowBackIcon,
    Search as SearchIcon,
    Close as CloseIcon,
    School as SchoolIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

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
}

interface HierarchyCategory {
    stations: HierarchyStation[];
}

const EmployeeQualificationsPage: React.FC = () => {
    const navigate = useNavigate();

    // Stavy pro reálná data z databáze
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [stations, setStations] = useState<Station[]>([]);
    const [loading, setLoading] = useState(true);

    // Filtry a stránkování
    const [searchQuery, setSearchQuery] = useState('');
    const [contractFilter, setContractFilter] = useState('VŠE');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Modal
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [tempQualifications, setTempQualifications] = useState<number[]>([]);

    // --- NAČTENÍ VŠECH DAT Z BACKENDU NAJEDNOU ---
    const fetchData = async () => {
        setLoading(true);
        try {
            // ZMĚNA: Smazáno tahání tokenu z localStorage a hlavička, přidáno odesílání cookies

            // 1. Stáhneme zaměstnance
            const empRes = await fetch('http://localhost:8080/api/v1/qualifications/employees', {
                credentials: 'include'
            });
            if (empRes.ok) {
                setEmployees(await empRes.json());
            }

            // 2. Stáhneme stanoviště a vyfiltrujeme jen ta, co chtějí kvalifikaci
            const hierRes = await fetch('http://localhost:8080/api/v1/position-settings/hierarchy', {
                credentials: 'include'
            });
            if (hierRes.ok) {
                const hierData = await hierRes.json();
                const qualStations: Station[] = [];

                hierData.categories.forEach((cat: HierarchyCategory) => {
                    cat.stations.forEach((stat: HierarchyStation) => {
                        if (stat.needsQualification) {
                            qualStations.push({
                                id: stat.id,
                                name: stat.name,
                                needsQualification: true
                            });
                        }
                    });
                });
                setStations(qualStations);
            }
        } catch (error) {
            console.error("Chyba při načítání dat:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchData();
    }, []);

    // --- FILTROVÁNÍ ---
    const filteredEmployees = employees.filter(emp => {
        const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
        const matchesSearch = fullName.includes(searchQuery.toLowerCase());
        const matchesContract = contractFilter === 'VŠE' || emp.contractType === contractFilter;
        return matchesSearch && matchesContract;
    });

    // --- STRÁNKOVÁNÍ ---
    const handleChangePage = (_e: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const paginatedEmployees = filteredEmployees.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    // --- OVLÁDÁNÍ MODALU ---
    const handleOpenEdit = (employee: Employee) => {
        setSelectedEmployee(employee);
        setTempQualifications([...employee.qualifiedStationIds]);
        setIsDialogOpen(true);
    };

    const handleToggleQualification = (stationId: number) => {
        setTempQualifications(prev =>
            prev.includes(stationId) ? prev.filter(id => id !== stationId) : [...prev, stationId]
        );
    };

    // --- ULOŽENÍ DO DATABÁZE ---
    const handleSaveQualifications = async () => {
        if (!selectedEmployee) return;

        try {
            // ZMĚNA: Smazáno tahání tokenu z localStorage a hlavička, přidáno odesílání cookies
            const response = await fetch(`http://localhost:8080/api/v1/qualifications/users/${selectedEmployee.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ qualificationIds: tempQualifications })
            });

            if (response.ok) {
                setEmployees(prev => prev.map(emp =>
                    emp.id === selectedEmployee.id ? { ...emp, qualifiedStationIds: tempQualifications } : emp
                ));
                setIsDialogOpen(false);
            } else {
                alert("Nepodařilo se uložit data na server.");
            }
        } catch (error) {
            console.error("Chyba při ukládání kvalifikace:", error);
        }
    };

    const getStationNames = (ids: number[]) => {
        return ids.map(id => stations.find(s => s.id === id)?.name).filter(Boolean).join(', ');
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ maxWidth: '1400px', mx: 'auto', p: 3 }}>
            {/* HLAVIČKA */}
            <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid #eaeaea', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => navigate('/dashboard/shifts')} sx={{ bgcolor: 'rgba(0,0,0,0.05)' }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#3e3535' }}>
                            Kvalifikace zaměstnanců
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Správa oprávnění pro obsluhu kvalifikovaných stanovišť
                        </Typography>
                    </Box>
                </Box>
                <SchoolIcon sx={{ fontSize: 50, color: '#eaeaea' }} />
            </Paper>

            <Paper elevation={3} sx={{ borderRadius: 3, p: 3 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }} justifyContent="space-between">
                    <TextField
                        label="Hledat podle jména nebo příjmení"
                        variant="outlined"
                        size="small"
                        sx={{ width: { xs: '100%', sm: '400px' } }}
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                        InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>) }}
                    />

                    <FormControl size="small" sx={{ minWidth: 200, width: { xs: '100%', sm: 'auto' } }}>
                        <InputLabel>Filtrovat podle úvazku</InputLabel>
                        <Select
                            value={contractFilter}
                            label="Filtrovat podle úvazku"
                            onChange={(e) => { setContractFilter(e.target.value); setPage(0); }}
                        >
                            <MenuItem value="VŠE"><em>Všechny úvazky</em></MenuItem>
                            <MenuItem value="HPP">HPP</MenuItem>
                            <MenuItem value="DPP">DPP</MenuItem>
                            <MenuItem value="OSVC">OSVČ</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>

                <Divider sx={{ mb: 1 }} />

                <TableContainer>
                    <Table sx={{ minWidth: 650 }} size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Fotka</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Jméno a příjmení</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Typ úvazku</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Kvalifikace</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Upravit</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedEmployees.length > 0 ? (
                                paginatedEmployees.map((emp) => (
                                    <TableRow key={emp.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Avatar src={emp.photoUrl} sx={{ width: 40, height: 40, bgcolor: '#3e3535', fontSize: '1rem' }}>
                                                {emp.firstName[0]}{emp.lastName[0]}
                                            </Avatar>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{emp.firstName} {emp.lastName}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={emp.contractType !== 'N/A' ? emp.contractType : 'Bez smlouvy'}
                                                size="small"
                                                variant="outlined"
                                                color={emp.contractType === 'DPP' ? 'primary' : 'default'}
                                                sx={{ fontWeight: 'bold' }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="textSecondary" sx={{ maxWidth: '300px' }}>
                                                {emp.qualifiedStationIds.length > 0
                                                    ? getStationNames(emp.qualifiedStationIds)
                                                    : <em style={{ color: '#bbb' }}>Žádná kvalifikace</em>
                                                }
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>
                                            <IconButton color="primary" onClick={() => handleOpenEdit(emp)} size="small">
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                                        <SearchIcon sx={{ fontSize: 40, color: '#eee', mb: 1, display: 'block', mx: 'auto' }} />
                                        Nenalezeni žádní zaměstnanci. Zkuste někoho zaregistrovat.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Divider />

                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredEmployees.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Zobrazit řádků:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} z ${count}`}
                />
            </Paper>

            <Dialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    Upravit kvalifikace
                    <IconButton onClick={() => setIsDialogOpen(false)} size="small">
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2, mb: 1, border: '1px solid #eaeaea', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={selectedEmployee?.photoUrl} sx={{ width: 45, height: 45, bgcolor: '#3e3535' }}>
                            {selectedEmployee ? `${selectedEmployee.firstName[0]}${selectedEmployee.lastName[0]}` : ''}
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                                {selectedEmployee?.firstName} {selectedEmployee?.lastName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                Úvazek: {selectedEmployee?.contractType !== 'N/A' ? selectedEmployee?.contractType : 'Bez smlouvy'}
                            </Typography>
                        </Box>
                    </Box>

                    <Typography variant="body2" color="textSecondary" sx={{ px: 1, mt: 1, fontWeight: 'bold' }}>
                        Přiřazená stanoviště:
                    </Typography>

                    <Divider sx={{ mb: 1 }} />

                    <Stack spacing={0.5} sx={{ px: 1, maxHeight: '300px', overflowY: 'auto' }}>
                        {stations.length > 0 ? stations.map(station => (
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
                                    '& .MuiFormControlLabel-label': {
                                        fontSize: '0.95rem',
                                        fontWeight: tempQualifications.includes(station.id) ? 'bold' : 'normal',
                                        color: tempQualifications.includes(station.id) ? 'primary.main' : 'text.primary'
                                    }
                                }}
                            />
                        )) : (
                            <Typography variant="body2" color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
                                V systému nejsou žádná stanoviště vyžadující kvalifikaci. Vytvořte je v "Nastavení pozic".
                            </Typography>
                        )}
                    </Stack>
                </DialogContent>

                <Divider sx={{ mt: 2 }} />

                <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
                    <Button onClick={() => setIsDialogOpen(false)} color="inherit" variant="outlined" sx={{ borderRadius: 2 }}>
                        ZRUŠIT
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveQualifications}
                        disabled={stations.length === 0}
                        sx={{
                            bgcolor: '#3e3535',
                            color: 'white',
                            fontWeight: 'bold',
                            borderRadius: 2,
                            px: 3,
                            '&:hover': { bgcolor: '#2c2525' }
                        }}
                    >
                        ULOŽIT ZMĚNY
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EmployeeQualificationsPage;