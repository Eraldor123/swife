export const authStyles = {
    // 1. Hlavní kontejner se SVĚTLÝM POZADÍM
    pageContainer: {
        width: '100vw',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #e3c5d5 0%, #b8a3c9 50%, #9cb3d4 100%)',
    },

    // 2. Tmavá skleněná hlavička
    header: {
        width: '100%',
        padding: { xs: '16px 24px', sm: '24px 40px' },
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(26, 26, 26, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        zIndex: 10,
    },
    logoIcon: {
        color: '#ffffff',
        fontSize: 34,
        mr: 1.5,
    },
    logoText: {
        color: '#ffffff',
        fontWeight: 800,
        fontSize: '24px',
        letterSpacing: '1px',
    },

    // 3. Středová část
    mainContent: {
        flexGrow: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        padding: 2
    },

    // 4. Tmavá skleněná patička
    footer: {
        width: '100%',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(26, 26, 26, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.1)',
        zIndex: 10,
    },
    footerText: {
        color: '#cbd5e1',
        fontSize: '13px',
        textAlign: 'center' as const,
        letterSpacing: '0.5px'
    },

    // 5. Hlavní skleněná karta
    formBox: {
        bgcolor: 'rgba(26, 26, 26, 0.75)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.4), 0 10px 20px rgba(0, 0, 0, 0.2)',
        p: { xs: 4, sm: 5 },
        width: { xs: '100%', sm: '420px' },
        display: 'flex',
        flexDirection: 'column',
    },

    // --- 6. VYLADĚNÁ TYPOGRAFIE A VSTUPY ---

    formTitle: {
        color: '#ffffff',
        fontWeight: 700,
        textAlign: 'center' as const,
        mb: 4,
        fontSize: '1.6rem',
    },
    inputLabel: {
        // Změna: Čistě bílá (nebo velmi světlá šedá), větší a tučnější
        color: '#f8fafc',
        mb: 1,
        fontSize: '14px', // Zvětšeno z 13px
        fontWeight: 600,  // Pevnější řez písma
        ml: 1,
        display: 'block',
        letterSpacing: '0.3px' // Jemné prostrkání pro lepší čitelnost
    },
    inputField: {
        bgcolor: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        color: '#ffffff',
        px: 2,
        py: 1,
        mb: 3,
        transition: 'all 0.3s ease',
        '&:focus-within': {
            bgcolor: 'rgba(255, 255, 255, 0.06)',
            borderColor: '#3498db',
            boxShadow: '0 0 0 3px rgba(52, 152, 219, 0.25)'
        },
        '& .MuiInputBase-input': {
            color: '#ffffff', // Vyplněný text je zářivě bílý
            fontSize: '15px',
            // Placeholder středně šedý, aby byl čitelný, ale nerušil
            '&::placeholder': { color: '#94a3b8', opacity: 1 }
        }
    },
    inputIcon: {
        color: '#94a3b8',
        mr: 1.5,
        fontSize: '20px'
    },

    // 7. Modré tlačítko a odkazy
    submitButton: {
        bgcolor: '#3498db',
        color: '#ffffff',
        borderRadius: '12px',
        py: 1.5,
        mt: 1,
        textTransform: 'none',
        // Zajištěno tučné, dominantní písmo na tlačítku
        fontWeight: 700,
        fontSize: '16px', // Zvětšeno z 15px
        letterSpacing: '0.5px',
        boxShadow: '0 8px 20px rgba(52, 152, 219, 0.3)',
        transition: 'all 0.2s ease',
        '&:hover': {
            bgcolor: '#2980b9',
            boxShadow: '0 12px 28px rgba(52, 152, 219, 0.5)',
            transform: 'translateY(-2px)'
        }
    },
    link: {
        // Změna: Větší písmo a barva primární modré jako u tlačítka
        fontSize: '14px',
        color: '#3498db',
        textDecoration: 'none',
        textAlign: 'center' as const,
        fontWeight: 500, // Mírně tučnější
        transition: 'all 0.2s ease',
        '&:hover': {
            color: '#60a5fa', // Světlejší modrá při najetí
            textDecoration: 'underline'
        }
    },

    // 8. Oznámení
    errorMessage: {
        fontSize: '14px',
        textAlign: 'center' as const,
        mb: 3,
        color: '#ff4d4d',
        fontWeight: 600,
        bgcolor: 'rgba(255, 77, 77, 0.15)',
        border: '1px solid rgba(255, 77, 77, 0.3)',
        p: 1.5,
        borderRadius: '8px'
    },
    successMessage: {
        fontSize: '14px',
        textAlign: 'center' as const,
        mb: 3,
        color: '#4ade80',
        fontWeight: 600,
        bgcolor: 'rgba(74, 222, 128, 0.15)',
        border: '1px solid rgba(74, 222, 128, 0.3)',
        p: 1.5,
        borderRadius: '8px'
    },
    fullScreenLoading: {
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #e3c5d5 0%, #b8a3c9 50%, #9cb3d4 100%)'
    }
};