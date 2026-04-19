export const styles = {
    // Hlavní kontejner, který vše vycentruje
    container: {
        p: { xs: 2, sm: 4 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        minHeight: '90vh',
    },

    // --- NOVÁ TMAVÁ HLAVIČKA (Header Card) ---
    headerCard: {
        width: '100%',
        maxWidth: '1200px', // Musí lícovat s šířkou gridu dlaždic
        bgcolor: '#1a1a1a', // Stejná barva jako dlaždice
        borderRadius: '16px',
        p: '16px 24px',
        mb: '32px', // Mezera pod lištou, aby layout dýchal
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)', // Jemný hluboký stín
        border: '1px solid #2a2a2a', // Decentní ohraničení
    },

    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 2
    },

    pageTitle: {
        color: '#ffffff',
        fontWeight: 700,
        fontSize: { xs: '1.1rem', sm: '1.4rem' },
        letterSpacing: '0.5px'
    },

    headerIcon: {
        color: '#3498db',
        fontSize: '28px'
    },

    // Upravte v sekci logoutButton v DashboardMenu.styles.ts
    logoutButton: {
        color: '#ffffff', // Změna na čistě bílou pro vysoký kontrast
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '15px', // Mírně větší písmo
        borderRadius: '8px',
        px: 2.5, // Větší horizontální padding pro robustnější vzhled
        py: 1,   // Větší vertikální padding
        transition: 'all 0.2s ease-in-out',
        '& .MuiButton-startIcon': {
            fontSize: '22px', // Zvětšení ikony
            color: '#ffffff',
        },
        '&:hover': {
            color: '#ff4d4d', // Při najetí zčervená
            bgcolor: 'rgba(255, 77, 77, 0.12)', // Jemné červené prosvětlení pozadí
            '& .MuiButton-startIcon': {
                color: '#ff4d4d'
            }
        }
    },

    // --- GRID PRO KARTY ---
    cardsGrid: {
        display: 'flex',
        gap: '24px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '1200px'
    },

    // --- STYL SAMOTNÉ KARTY (MenuCard) ---
    cardPaper: {
        width: { xs: '100%', sm: '280px' },
        height: '200px',
        bgcolor: '#1a1a1a',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease-in-out',
        border: '1px solid #2a2a2a',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        '&:hover': {
            transform: 'translateY(-6px)',
            boxShadow: '0 15px 40px rgba(0,0,0,0.7)',
            borderColor: '#3498db'
        }
    },
    cardIcon: {
        fontSize: '50px',
        color: '#ffffff',
        mb: 2,
        opacity: 0.9
    },
    cardText: {
        color: '#ffffff',
        fontWeight: 600,
        fontSize: '1.1rem',
        textAlign: 'center',
        px: 2
    },

    emptyMessage: {
        color: 'rgba(255,255,255,0.5)',
        fontStyle: 'italic',
        mt: 4
    }
};