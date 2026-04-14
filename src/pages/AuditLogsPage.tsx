import React, { useEffect, useState, useCallback } from 'react';
import {
    Box, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, CircularProgress,
    TablePagination
} from '@mui/material';

interface AuditLog {
    id: string;
    action: string;
    entityName: string;
    entityId: string;
    performedBy: string;
    timestamp: string;
    details: string;
}

const AuditLogsPage: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // FÁZE 3: Stavy pro serverové stránkování
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [totalElements, setTotalElements] = useState(0);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            /**
             * FÁZE 3: Volání API s parametry stránkování.
             * Backend díky Pageable automaticky vrátí jen požadovaný výřez dat.
             */
            const response = await fetch(`http://localhost:8080/api/v1/audit-logs?page=${page}&size=${rowsPerPage}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                // SQL data jsou v 'content', metadata v 'totalElements'
                setLogs(data.content || []);
                setTotalElements(data.totalElements || 0);
            } else {
                setError("Nemáte oprávnění k prohlížení logů nebo nastala chyba.");
            }
        } catch (err) {
            console.error("Chyba při načítání logů", err);
            setError("Nepodařilo se načíst historii změn ze serveru.");
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage]);

    useEffect(() => {
        void fetchLogs();
    }, [fetchLogs]);

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('cs-CZ', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    if (loading && logs.length === 0) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;
    if (error) return <Typography color="error" sx={{ p: 3 }}>{error}</Typography>;

    /**
     * OPRAVA: Odstraněn logs.slice().
     * Backend nám nyní posílá přesně ty záznamy, které patří na aktuální stránku.
     */
    const displayedLogs = logs;

    return (
        <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#3e3535' }}>
                Historie systémových změn (Audit Log)
            </Typography>

            <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <TableContainer sx={{ position: 'relative' }}>
                    {loading && (
                        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(255,255,255,0.5)', zIndex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <CircularProgress size={24} />
                        </Box>
                    )}
                    <Table size="small">
                        <TableHead sx={{ backgroundColor: '#1976d2' }}>
                            <TableRow>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Datum a Čas</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Uživatel</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Akce</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Modul</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Detail</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {displayedLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 3, fontStyle: 'italic' }}>
                                        Zatím nebyly zaznamenány žádné události.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                displayedLogs.map((log) => (
                                    <TableRow key={log.id} hover>
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(log.timestamp)}</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{log.performedBy}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{
                                                backgroundColor: log.action.includes('DELETE') ? '#ffebee' : '#e3f2fd',
                                                color: log.action.includes('DELETE') ? '#c62828' : '#1565c0',
                                                padding: '2px 8px', borderRadius: 1, display: 'inline-block', fontWeight: 'bold', fontSize: '0.75rem'
                                            }}>
                                                {log.action}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{log.entityName}</TableCell>
                                        <TableCell>{log.details}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    rowsPerPageOptions={[10, 15, 25, 50]}
                    component="div"
                    // ZMĚNA: count nyní bere celkový počet záznamů z DB
                    count={totalElements}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Počet záznamů:"
                    labelDisplayedRows={({ from, to, count }) => `${from}–${to} z celkem ${count}`}
                />
            </Paper>
        </Box>
    );
};

export default AuditLogsPage;