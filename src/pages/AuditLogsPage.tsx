import React, { useEffect, useState, useCallback } from 'react';
import {
    Box, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, CircularProgress,
    TablePagination, IconButton, Chip, TextField, InputAdornment
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Search as SearchIcon,
    History as HistoryIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Technické importy
import apiClient from '../api/axiosConfig';
import { useNotification } from '../context/NotificationContext';
import { isAxiosError } from 'axios';

import { styles } from '../theme/AuditLogsPage.styles';

interface AuditLog {
    id: string;
    action: string;
    entityName: string;
    entityId: string;
    performedBy: string;
    timestamp: string;
    details: string;
}

interface BackendError {
    message?: string;
}

// 1. MAPOVÁNÍ
const moduleMapping: Record<string, string> = {
    "VŠE": "",
    "Zaměstnanci": "User",
    "Stanoviště": "Station",
    "Směny": "Shift",
    "Obsazování": "ShiftAssignment",
    "Přístupy": "Auth",
    "Nastavení provozu": "OperatingHours",
    "Dostupnosti": "Availability"
};

const filterOptions = Object.keys(moduleMapping);

const AuditLogsPage: React.FC = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [totalElements, setTotalElements] = useState(0);

    const [searchQuery, setSearchQuery] = useState('');
    const [moduleFilter, setModuleFilter] = useState('VŠE');

    // NAČÍTÁNÍ LOGŮ PŘES API CLIENT
    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const mappedModule = moduleMapping[moduleFilter] || "";

            const response = await apiClient.get('/audit-logs', {
                params: {
                    page: page,
                    size: rowsPerPage,
                    search: searchQuery,
                    module: mappedModule
                }
            });

            if (response.status === 200) {
                setLogs(response.data.content || []);
                setTotalElements(response.data.totalElements || 0);
                setError(null);
            }
        } catch (err: unknown) {
            console.error("Chyba při načítání logů", err);
            if (isAxiosError(err)) {
                const errorData = err.response?.data as BackendError;
                const message = errorData?.message || "Nemáte oprávnění k prohlížení logů nebo nastala chyba.";
                setError(message);
                showNotification(message, 'error');
            } else {
                setError("Nepodařilo se načíst historii změn ze serveru.");
            }
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, searchQuery, moduleFilter, showNotification]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            void fetchLogs();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [fetchLogs]);

    const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setSearchQuery(event.target.value);
        setPage(0);
    };

    const handleFilterChange = (option: string) => {
        setModuleFilter(option);
        setPage(0);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('cs-CZ', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    if (loading && logs.length === 0) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
    if (error) return <Typography color="error" sx={{ p: 3 }}>{error}</Typography>;

    return (
        <Box sx={styles.container}>
            <Paper elevation={0} sx={styles.headerCard}>
                <Box sx={styles.headerLeft}>
                    <IconButton onClick={() => navigate(-1)} sx={styles.backButton}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Box>
                        <Typography variant="h1" sx={styles.pageTitle}>
                            Historie systémových změn (Audit Log)
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Přehled veškeré aktivity a úprav v systému
                        </Typography>
                    </Box>
                </Box>
                <HistoryIcon sx={styles.headerIcon} />
            </Paper>

            <Paper elevation={0} sx={styles.mainCard}>
                <Box sx={styles.controlsContainer}>
                    <TextField
                        placeholder="Hledat (uživatel, akce, detail)..."
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
                            Modul:
                        </Typography>
                        {filterOptions.map(option => (
                            <Chip
                                key={option}
                                label={option}
                                onClick={() => handleFilterChange(option)}
                                color={moduleFilter === option ? "primary" : "default"}
                                variant={moduleFilter === option ? "filled" : "outlined"}
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
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={styles.tableHeaderCell}>Datum a čas</TableCell>
                                <TableCell sx={styles.tableHeaderCell}>Uživatel</TableCell>
                                <TableCell sx={styles.tableHeaderCell}>Akce</TableCell>
                                <TableCell sx={styles.tableHeaderCell}>Modul</TableCell>
                                <TableCell sx={styles.tableHeaderCell}>Detail</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} sx={styles.emptyTableState}>
                                        <SearchIcon sx={styles.emptySearchIcon} />
                                        <Typography variant="body1" color="textSecondary">Zadaným filtrům neodpovídají žádné záznamy.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id} hover sx={styles.tableRow}>
                                        <TableCell sx={{ ...styles.tableCell, ...styles.dateCell }}>
                                            {formatDate(log.timestamp)}
                                        </TableCell>
                                        <TableCell sx={{ ...styles.tableCell, ...styles.userCell }}>
                                            {log.performedBy}
                                        </TableCell>
                                        <TableCell sx={styles.tableCell}>
                                            <Chip
                                                label={log.action}
                                                size="small"
                                                sx={styles.getActionChipStyle(log.action)}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ ...styles.tableCell, ...styles.moduleCell }}>
                                            {log.entityName}
                                        </TableCell>
                                        <TableCell sx={{ ...styles.tableCell, ...styles.detailsCell }}>
                                            {log.details}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    rowsPerPageOptions={[10, 15, 25, 50]}
                    component="div"
                    count={totalElements}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Počet záznamů:"
                    labelDisplayedRows={({ from, to, count }) => `${from}–${to} z celkem ${count}`}
                    sx={{ borderTop: '1px solid #f0f0f0' }}
                />
            </Paper>
        </Box>
    );
};

export default AuditLogsPage;