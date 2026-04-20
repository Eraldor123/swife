// src/pages/ShiftPlanner/styles/ShiftPlannerStyles.ts

export const plannerStyles = {
    // 1. CELKOVÝ KONTEJNER A POZADÍ
    mainWrapper: {
        display: 'flex',
        height: 'calc(100vh - 70px)',
        width: '100%',
        background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
        overflow: 'hidden',
        gap: 3,
        p: 3,
        boxSizing: 'border-box'
    },

    contentColumn: {
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        gap: 2,
        height: '100%',
        minWidth: 0,
        maxWidth: '100%',
        boxSizing: 'border-box'
    },

    // 2. MODERNÍ BÍLÁ KARTA PRO SIDEBAR (Levý panel)
    sidebarPaper: {
        width: 300,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        border: 'none',
        position: 'relative',
        flexShrink: 0
    },

    sidebarHeader: {
        pt: 3,
        px: 2.5,
        pb: 1,
        bgcolor: '#ffffff',
        textAlign: 'center',
        flexShrink: 0,
        '& .MuiTypography-root': {
            color: '#1e293b',
            fontWeight: 700,
            fontSize: '1.2rem'
        }
    },

    sidebarTabs: {
        minHeight: 'auto',
        borderBottom: '1px solid #f1f5f9',
        mb: 2,
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'center',
        '& .MuiTabs-flexContainer': {
            justifyContent: 'center',
        },
        '& .MuiTabs-indicator': {
            height: 3,
            backgroundColor: '#3b82f6',
            borderRadius: '3px 3px 0 0'
        },
        '& .MuiTab-root': {
            textTransform: 'none',
            minWidth: 0,
            fontWeight: 600,
            fontSize: '0.85rem',
            color: '#64748b',
            py: 1.5,
            transition: 'color 0.2s',
            '&:hover': {
                color: '#1e293b'
            },
            '&.Mui-selected': {
                color: '#3b82f6',
            }
        }
    },

    autoPlanButtonWrapper: {
        mt: 'auto',
        p: 2.5,
        width: '100%',
        boxSizing: 'border-box',
        bgcolor: '#ffffff',
        borderTop: '1px solid #f1f5f9',
        flexShrink: 0,
        zIndex: 5
    },

    autoPlanButton: {
        width: '100%',
        bgcolor: '#3b82f6',
        color: '#ffffff',
        borderRadius: '8px',
        textTransform: 'none',
        fontWeight: 600,
        py: 1.5,
        boxShadow: 'none',
        transition: 'all 0.2s ease',
        '&:hover': {
            bgcolor: '#2563eb',
            boxShadow: 'none',
        }
    },

    // 3. HORNÍ LIŠTA (Top Bar)
    headerPaper: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        p: 1.5,
        px: 2.5,
        bgcolor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',

        // OPRAVA: Povolí se zalamování (Wrap) prvků na malých displejích
        flexWrap: 'wrap',
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        flexShrink: 0
    },

    headerTitleGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: 2,
    },

    backButton: {
        width: 48,
        height: 48,
        borderRadius: '50%',
        bgcolor: '#f1f5f9',
        transition: 'background-color 0.2s ease',
        '&:hover': { bgcolor: '#e2e8f0' }
    },

    headerTextContainer: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
    },

    headerTitle: {
        fontWeight: 700,
        color: '#1e293b',
        fontSize: '1.25rem',
        lineHeight: 1.2
    },

    headerSubtitle: {
        color: '#64748b',
        fontSize: '0.85rem',
        fontWeight: 400,
        lineHeight: 1.2,
        mt: 0.5
    },

    // 4. MŘÍŽKA (Grid Wrapper)
    gridWrapper: {
        flexGrow: 1,
        position: 'relative',
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        bgcolor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        height: '100%',
        overflow: 'hidden',
    },

    // 5. TLAČÍTKA A OVLÁDACÍ PRVKY V LIŠTĚ
    buttons: {
        primary: {
            bgcolor: '#3b82f6',
            color: '#ffffff',
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 'none',
            transition: 'background-color 0.2s ease',
            '&:hover': { bgcolor: '#2563eb', boxShadow: 'none' }
        },
        danger: {
            bgcolor: '#ef4444',
            color: '#ffffff',
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 'none',
            transition: 'background-color 0.2s ease',
            '&:hover': { bgcolor: '#dc2626', boxShadow: 'none' }
        }
    },

    toggleGroup: {
        height: 40,
        '& .MuiToggleButton-root': {
            textTransform: 'none',
            fontWeight: 600,
            border: '1px solid #e2e8f0',
            color: '#64748b',
            px: 2.5,
            transition: 'all 0.2s ease',
            '&.Mui-selected': {
                bgcolor: '#3b82f6',
                color: '#ffffff',
                '&:hover': { bgcolor: '#2563eb' }
            },
            '&:hover': { bgcolor: '#f8fafc' }
        }
    },

    dropdownControl: {
        minWidth: 160,
        '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            bgcolor: '#ffffff',
            height: 40,
            transition: 'all 0.2s ease',
            '& fieldset': {
                borderColor: '#e2e8f0',
                borderWidth: '1px'
            },
            '&:hover fieldset': {
                borderColor: '#cbd5e1'
            },
            '&.Mui-focused fieldset': {
                borderColor: '#3b82f6',
                borderWidth: '2px',
                boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
            }
        }
    },

    dateNavigator: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        bgcolor: '#ffffff',
        p: 0.5,
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
    },

    // 6. JEDNOTNÝ STYL MODÁLNÍCH OKEN (SOFT UI)
    modalPaper: {
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        p: 2,
        bgcolor: '#ffffff',
        backgroundImage: 'none'
    },

    modalTitle: {
        color: '#0f172a',
        fontWeight: 700,
        fontSize: '1.5rem',
        mb: 2,
        pb: 2,
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        '& .MuiSvgIcon-root': {
            fontSize: '1.8rem'
        }
    },

    closeButton: {
        color: '#94a3b8',
        transition: 'color 0.2s ease',
        '&:hover': {
            color: '#475569',
            bgcolor: 'transparent'
        }
    },

    modalLabel: {
        fontSize: '0.75rem',
        fontWeight: 600,
        color: '#64748b',
        mb: 1,
        display: 'block',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    },

    infoBox: {
        bgcolor: '#eff6ff',
        color: '#1e3a8a',
        p: 2,
        borderRadius: '8px',
        mb: 3,
        fontSize: '0.875rem',
        lineHeight: 1.5,
        border: 'none'
    },

    warningBox: {
        bgcolor: '#fef2f2',
        color: '#991b1b',
        p: 2,
        borderRadius: '8px',
        mb: 3,
        fontSize: '0.875rem',
        lineHeight: 1.5,
        border: 'none'
    },

    modalButtons: {
        primary: {
            bgcolor: '#3b82f6',
            color: '#ffffff',
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1,
            boxShadow: 'none',
            '&:hover': { bgcolor: '#2563eb', boxShadow: 'none' }
        },
        danger: {
            bgcolor: '#ef4444',
            color: '#ffffff',
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1,
            boxShadow: 'none',
            '&:hover': { bgcolor: '#dc2626', boxShadow: 'none' }
        },
        special: {
            bgcolor: '#f59e0b',
            color: '#ffffff',
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1,
            boxShadow: 'none',
            '&:hover': { bgcolor: '#d97706', boxShadow: 'none' }
        },
        secondary: {
            bgcolor: '#f1f5f9',
            color: '#475569',
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1,
            boxShadow: 'none',
            '&:hover': { bgcolor: '#e2e8f0', boxShadow: 'none' }
        },
        textAction: {
            bgcolor: 'transparent',
            fontWeight: 600,
            textTransform: 'none',
            px: 2,
            py: 1,
            borderRadius: '8px',
            '&:hover': { bgcolor: '#f1f5f9' }
        }
    },

    pillTabsContainer: {
        bgcolor: '#f8fafc',
        borderRadius: '8px',
        p: 0.5,
        display: 'inline-flex',
        minHeight: 'auto',
        '& .MuiTabs-indicator': {
            display: 'none',
        }
    },

    pillTab: {
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.875rem',
        color: '#64748b',
        borderRadius: '6px',
        minHeight: '36px',
        py: 0.5,
        px: 2,
        transition: 'all 0.2s ease',
        '&.Mui-selected': {
            color: '#3b82f6',
            bgcolor: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        },
        '&:hover:not(.Mui-selected)': {
            color: '#475569'
        }
    }
};