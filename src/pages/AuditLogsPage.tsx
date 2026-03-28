import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, CircularProgress,
    TablePagination // PŘIDÁN IMPORT PRO STRÁNKOVÁNÍ
} from '@mui/material';

// Definice typu pro Log
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

    // NOVÉ STAVY PRO STRÁNKOVÁNÍ
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15); // Výchozí počet řádků na stránku

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const token = localStorage.getItem('token');

                const response = await fetch('http://localhost:8080/api/v1/audit-logs', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setLogs(data);
                } else {
                    setError("Nemáte oprávnění k prohlížení logů nebo nastala chyba.");
                }
            } catch (err) {
                console.error("Chyba při načítání logů", err);
                setError("Nepodařilo se načíst historii změn ze serveru.");
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    // POMOCNÉ FUNKCE PRO STRÁNKOVÁNÍ
    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0); // Při změně počtu řádků se vrátíme na první stránku
    };

    // Pomocná funkce pro hezké formátování data a času
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('cs-CZ', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    if (loading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;
    if (error) return <Typography color="error" sx={{ p: 3 }}>{error}</Typography>;

    // ROZŘÍZNUTÍ POLE LOGŮ PODLE AKTUÁLNÍ STRÁNKY
    const paginatedLogs = logs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#3e3535' }}>
                Historie systémových změn (Audit Log)
            </Typography>

            <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <TableContainer>
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
                            {logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 3, fontStyle: 'italic' }}>
                                        Zatím nebyly zaznamenány žádné události.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedLogs.map((log) => (
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

                {/* KOMPONENTA PRO STRÁNKOVÁNÍ */}
                <TablePagination
                    rowsPerPageOptions={[10, 15, 25, 50]}
                    component="div"
                    count={logs.length}
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