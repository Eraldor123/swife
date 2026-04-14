import { useEffect, useState } from 'react';
import { Typography, Table, TableHead, TableBody, TableRow, TableCell, Paper } from '@mui/material';
import '../App.css'

// Definice rozhraní pro TypeScript, aby WebStorm napovídal pole
interface User {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    age: number;
}

const UserList = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // ZMĚNA: Přidáno odesílání HttpOnly cookies
        fetch('http://localhost:8080/api/test/users', {
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                setUsers(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Chyba:", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <Typography>Načítám uživatele...</Typography>;

    const columns = [ "id", "username", "firstName",  "lastName", "email", "age" ];

    return (
        <div style={{ marginTop: '2rem', overflowX: 'auto' }}>
            <Typography variant="h4" gutterBottom>Seznam uživatelů</Typography>
            <Paper elevation={3} sx={{ width: '99%', overflow: 'hidden', backgroundColor: 'transparent', border: '1px solid #ccc' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            {columns.map(col => (
                                <TableCell key={col} sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                                    {col.charAt(0).toUpperCase() + col.slice(1)}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map(user => (
                            <TableRow key={user.id}>
                                {columns.map(col => (
                                    <TableCell key={col} sx={{ color: '#ccc' }}>
                                        {user[col as keyof User]}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>
        </div>
    );
};

export default UserList;