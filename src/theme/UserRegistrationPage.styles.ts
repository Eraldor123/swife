export const styles = {
    // --- Hlavní layout ---
    container: { maxWidth: '1000px', mx: 'auto', p: { xs: 1, sm: 3 } },

    // --- Horní karta (Záhlaví) ---
    headerCard: {
        p: 2,
        mb: 3,
        borderRadius: 3,
        border: '1px solid #eaeaea',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: '#ffffff'
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: 2 },
    backButton: { bgcolor: 'rgba(0,0,0,0.03)', '&:hover': { bgcolor: 'rgba(0,0,0,0.08)' } },
    backText: {
        fontWeight: 600,
        color: '#555',
        cursor: 'pointer',
        display: { xs: 'none', sm: 'block' },
        '&:hover': { color: '#3498db' }
    },
    pageTitle: { fontWeight: 700, color: '#2c3e50', fontSize: '1.4rem', m: 0 },
    headerIcon: { fontSize: 36, color: '#3498db', opacity: 0.8 },

    // --- Dolní karta (Formulář) ---
    mainCard: {
        p: { xs: 3, sm: 4 },
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
        border: '1px solid #f0f0f0',
        bgcolor: '#ffffff'
    },

    // --- Rozložení formuláře ---
    formContainer: { display: 'flex', flexDirection: 'column', gap: 3 },
    row: { display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'flex-start' },
    columnGroup: { display: 'flex', flexDirection: 'column', gap: 3, flex: 1, width: '100%' },

    // --- Jednotný vzhled textových polí (Inputs) ---
    textField: {
        width: '100%',
        '& .MuiOutlinedInput-root': {
            borderRadius: 2, // Jemné zaoblení (odpovídá cca 8px)
            '&.Mui-focused fieldset': {
                borderColor: '#3498db', // Sjednocená modrá při focusu
                borderWidth: '2px'
            }
        },
        '& .MuiInputLabel-root.Mui-focused': {
            color: '#3498db', // Modrý popisek při focusu
        }
    },

    // --- Dynamické bloky (Mzdová sekce) ---
    wageSection: {
        p: 3,
        bgcolor: '#f8f9fa', // Velmi jemná světle šedá
        borderRadius: 3,
        border: '1px solid #e0e0e0' // Zjemněný rámeček
    },

    // --- Tlačítka ---
    calcRow: { display: 'flex', gap: 2, alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' } },
    calcButton: {
        minWidth: { xs: '100%', sm: '180px' },
        height: '56px',
        border: '1px solid #e0e0e0',
        color: '#555',
        bgcolor: '#ffffff',
        borderRadius: 2,
        fontWeight: 600,
        textTransform: 'none',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        '&:hover': {
            borderColor: '#3498db',
            color: '#3498db',
            bgcolor: '#f4f9fc'
        }
    },
    submitButton: {
        mt: 2,
        height: '54px',
        bgcolor: '#3498db', // Primární modrá
        color: 'white',
        fontWeight: 'bold',
        fontSize: '1rem',
        borderRadius: 2,
        textTransform: 'none',
        boxShadow: '0 4px 14px rgba(52, 152, 219, 0.3)',
        '&:hover': {
            bgcolor: '#2980b9',
            boxShadow: '0 6px 20px rgba(52, 152, 219, 0.4)'
        }
    },

    // --- Checkbox ---
    checkbox: {
        '&.Mui-checked': {
            color: '#3498db', // Modrá barva při zaškrtnutí
        }
    },

    // --- Upozornění (Snackbar) ---
    alert: { width: '100%', fontSize: '16px', fontWeight: 'bold', borderRadius: 2 }
};