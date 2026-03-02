import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:8080/api/test/users')
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

    if (loading) return <p>Načítám uživatele...</p>;

    return (
        <div style={{ marginTop: '2rem', overflowX: 'auto' }}>
            <button onClick={() => navigate('/')}>Zpět domů</button>
            <h2>Seznam uživatelů</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                <thead>
                <tr style={{ borderBottom: '2px solid #646cff' }}>
                    <th>ID</th>
                    <th>Jméno a příjmení</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Věk</th>
                </tr>
                </thead>
                <tbody>
                {users.map(user => (
                    <tr key={user.id} style={{ borderBottom: '1px   solid #444' }}>
                        <td>{user.id}</td>
                        <td>{user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : '-'}</td>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>{user.age ?? '-'}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserList;