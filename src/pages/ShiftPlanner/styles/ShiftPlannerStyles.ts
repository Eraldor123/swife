// src/pages/ShiftPlanner/styles/ShiftPlannerStyles.ts

export const plannerStyles = {
    mainWrapper: {
        display: 'flex', height: 'calc(100vh - 70px)', width: '100%',
        background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
        overflow: 'hidden', gap: { xs: 1, md: 1.5, lg: 2 }, p: { xs: 1, md: 1.5, lg: 2 }, boxSizing: 'border-box'
    },
    contentColumn: {
        flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        gap: { xs: 1, md: 1.5 }, height: '100%', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box'
    },
    sidebarPaper: {
        width: { xs: 240, md: 260, lg: 280 }, // Zúžený sidebar
        display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#ffffff',
        borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', overflow: 'hidden',
        border: 'none', position: 'relative', flexShrink: 0
    },
    sidebarHeader: {
        pt: 2.5, px: 2, pb: 1, bgcolor: '#ffffff', textAlign: 'center', flexShrink: 0,
        '& .MuiTypography-root': { color: '#1e293b', fontWeight: 700, fontSize: '1.1rem' }
    },
    sidebarTabs: {
        minHeight: 'auto', borderBottom: '1px solid #f1f5f9', mb: 2, flexShrink: 0,
        display: 'flex', justifyContent: 'center',
        '& .MuiTabs-flexContainer': { justifyContent: 'center' },
        '& .MuiTabs-indicator': { height: 3, backgroundColor: '#3b82f6', borderRadius: '3px 3px 0 0' },
        '& .MuiTab-root': { textTransform: 'none', minWidth: 0, fontWeight: 600, fontSize: '0.8rem', color: '#64748b', py: 1, '&:hover': { color: '#1e293b' }, '&.Mui-selected': { color: '#3b82f6' } }
    },
    autoPlanButtonWrapper: { mt: 'auto', p: 2, width: '100%', boxSizing: 'border-box', bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', flexShrink: 0, zIndex: 5 },
    autoPlanButton: { width: '100%', bgcolor: '#3b82f6', color: '#ffffff', borderRadius: '8px', textTransform: 'none', fontWeight: 600, py: 1, boxShadow: 'none', '&:hover': { bgcolor: '#2563eb', boxShadow: 'none' } },

    // --- HORNÍ LIŠTA (EXTRÉMNĚ KOMPAKTNÍ) ---
    headerPaper: {
        display: 'flex', flexDirection: 'row', alignItems: 'center',
        gap: { xs: 0.5, md: 1, lg: 1.5 }, px: { xs: 1, md: 1.5, lg: 2 },
        bgcolor: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        flexWrap: 'nowrap', overflowX: 'auto', overflowY: 'hidden',
        minHeight: { xs: '56px', md: '64px' }, maxHeight: { xs: '56px', md: '64px' }, // Snížená výška
        '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none',
        width: '100%', boxSizing: 'border-box', flexShrink: 0
    },
    headerTitleGroup: { display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1 } },
    backButton: { width: { xs: 32, md: 36 }, height: { xs: 32, md: 36 }, borderRadius: '50%', bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } },
    headerTextContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    headerTitle: { fontWeight: 700, color: '#1e293b', fontSize: { xs: '1rem', md: '1.1rem' }, lineHeight: 1.2 },
    headerSubtitle: { color: '#64748b', fontSize: '0.8rem', fontWeight: 400, lineHeight: 1.2, mt: 0.5 },

    gridWrapper: { flexGrow: 1, position: 'relative', width: '100%', minWidth: 0, minHeight: 0, boxSizing: 'border-box', bgcolor: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' },

    // --- AKČNÍ TLAČÍTKA ---
    buttons: {
        primary: { bgcolor: '#3b82f6', color: '#ffffff', borderRadius: '6px', textTransform: 'none', fontWeight: 600, boxShadow: 'none', fontSize: { xs: '0.75rem', md: '0.8rem' }, px: { xs: 1, md: 1.5 }, py: 0.5, whiteSpace: 'nowrap', '&:hover': { bgcolor: '#2563eb', boxShadow: 'none' }, minWidth: 'auto' },
        danger: { bgcolor: '#ef4444', color: '#ffffff', borderRadius: '6px', textTransform: 'none', fontWeight: 600, boxShadow: 'none', fontSize: { xs: '0.75rem', md: '0.8rem' }, px: { xs: 1, md: 1.5 }, py: 0.5, whiteSpace: 'nowrap', '&:hover': { bgcolor: '#dc2626', boxShadow: 'none' }, minWidth: 'auto' }
    },

    // --- PŘEPÍNAČ TÝDEN/DEN ---
    toggleGroup: {
        height: { xs: 28, md: 32 }, // Výrazně nižší
        '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 600, border: '1px solid #e2e8f0', color: '#64748b', fontSize: { xs: '0.75rem', md: '0.8rem' }, px: { xs: 1, md: 1.5 }, py: 0.25, whiteSpace: 'nowrap', '&.Mui-selected': { bgcolor: '#3b82f6', color: '#ffffff', '&:hover': { bgcolor: '#2563eb' } }, '&:hover': { bgcolor: '#f8fafc' } }
    },

    // --- DROPDOWN ---
    dropdownControl: {
        minWidth: { xs: 100, md: 120 }, // Velmi úzké
        '& .MuiOutlinedInput-root': { borderRadius: '6px', bgcolor: '#ffffff', height: { xs: 28, md: 32 }, fontSize: { xs: '0.75rem', md: '0.85rem' }, '& fieldset': { borderColor: '#e2e8f0', borderWidth: '1px' }, '&:hover fieldset': { borderColor: '#cbd5e1' }, '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: '2px' } },
        '& .MuiInputLabel-root': { fontSize: { xs: '0.75rem', md: '0.85rem' }, transform: 'translate(14px, 6px) scale(1)', '&.MuiInputLabel-shrink': { transform: 'translate(14px, -9px) scale(0.85)' } }
    },

    // --- DATUMOVKA ---
    dateNavigator: { display: 'flex', alignItems: 'center', gap: 0, bgcolor: '#ffffff', p: 0.25, borderRadius: '6px', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' },

    modalPaper: { borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', p: 2, bgcolor: '#ffffff', backgroundImage: 'none' },
    modalTitle: { color: '#0f172a', fontWeight: 700, fontSize: '1.5rem', mb: 2, pb: 2, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 },
    closeButton: { color: '#94a3b8', '&:hover': { color: '#475569', bgcolor: 'transparent' } },
    modalLabel: { fontSize: '0.75rem', fontWeight: 600, color: '#64748b', mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' },
    modalButtons: {
        primary: { bgcolor: '#3b82f6', color: '#ffffff', borderRadius: '8px', textTransform: 'none', fontWeight: 600, px: 3, py: 1, '&:hover': { bgcolor: '#2563eb' } },
        danger: { bgcolor: '#ef4444', color: '#ffffff', borderRadius: '8px', textTransform: 'none', fontWeight: 600, px: 3, py: 1, '&:hover': { bgcolor: '#dc2626' } },
        special: { bgcolor: '#f59e0b', color: '#ffffff', borderRadius: '8px', textTransform: 'none', fontWeight: 600, px: 3, py: 1, '&:hover': { bgcolor: '#d97706' } },
        secondary: { bgcolor: '#f1f5f9', color: '#475569', borderRadius: '8px', textTransform: 'none', fontWeight: 600, px: 3, py: 1, '&:hover': { bgcolor: '#e2e8f0' } },
        textAction: { bgcolor: 'transparent', fontWeight: 600, textTransform: 'none', px: 2, py: 1, borderRadius: '8px', '&:hover': { bgcolor: '#f1f5f9' } }
    }
};