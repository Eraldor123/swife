import { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import UserList from './components/UserList'

function App() {

    const [count, setCount] = useState(0)
    const [backendMessage, setBackendMessage] = useState('Načítám data z backendu...')

    useEffect(() => {
        fetch('http://localhost:8080/api/test')
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then((data) => {
                setBackendMessage(data);
            })
            .catch((error) => {
                console.error('Došlo k chybě:', error);
                setBackendMessage('Chyba: Nepodařilo se připojit k backendu.');
            });
    }, []);

    const handleCreateTest = () => {
        fetch('http://localhost:8080/api/test/users/createtest')
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then((data) => {
                alert(data);
            })
            .catch((error) => {
                console.error('Došlo k chybě:', error);
                alert('Chyba: ' + error.message);
            });
    };

    return (
        <>
            {/* Jednoduchá navigace, abyste se mezi stránkami mohli přepínat */}
            <nav style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <Link to="/">Domů</Link>
                <Link to="/users">Seznam uživatelů</Link>
            </nav>

            <Routes>
                {/* HLAVNÍ STRÁNKA */}
                <Route path="/" element={
                    <>
                        <div>
                            <a href="https://vite.dev" target="_blank"><img src={viteLogo} className="logo" alt="Vite logo" /></a>
                            <a href="https://react.dev" target="_blank"><img src={reactLogo} className="logo react" alt="React logo" /></a>
                        </div>
                        <h1>Vite + React</h1>
                        <div className="card">
                            <h2>Odpověď z backendu:</h2>
                            <p style={{ fontWeight: 'bold', color: '#646cff' }}>{backendMessage}</p>
                        </div>
                        <div className="card">
                            <button onClick={() => setCount((count) => count + 1)}>count is {count}</button>
                            <button onClick={handleCreateTest} style={{ marginLeft: '1rem' }}>Vytvořit test</button>
                        </div>
                    </>
                } />

                {/* NOVÁ STRÁNKA S TABULKOU */}
                <Route path="/users" element={<UserList />} />
            </Routes>
        </>
    )
}

export default App
