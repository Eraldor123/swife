export const styles = {
    // --- Hlavní layout ---
    container: { maxWidth: '1400px', mx: 'auto', p: { xs: 1, sm: 3 } },
    headerCard: { p: 2, mb: 3, borderRadius: 3, border: '1px solid #eaeaea', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#ffffff' },
    headerLeft: { display: 'flex', alignItems: 'center', gap: 2 },
    backButton: { bgcolor: 'rgba(0,0,0,0.03)', '&:hover': { bgcolor: 'rgba(0,0,0,0.08)' } },
    pageTitle: { fontWeight: 700, color: '#2c3e50', fontSize: '1.4rem' },
    headerIcon: { fontSize: 42, color: '#3498db', opacity: 0.8 },
    mainCard: { borderRadius: 3, p: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #f0f0f0' },

    // --- Ovládací prvky (Filtry, Hledání) ---
    controlsContainer: { mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 },
    searchInput: { width: { xs: '100%', sm: '280px' }, '& .MuiOutlinedInput-root': { borderRadius: 2 } },
    filterContainer: { display: 'flex', gap: 1, alignItems: 'center', overflowX: 'auto' },

    // --- Tabulka ---
    tableContainer: { position: 'relative', border: '1px solid #f0f0f0', borderRadius: 2, overflow: 'hidden' },
    loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(255,255,255,0.6)', zIndex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    tableHeaderCell: { fontWeight: 600, py: 1.5, bgcolor: '#fafafa', color: '#555' },
    tableHeaderCellCenter: { fontWeight: 600, textAlign: 'center', bgcolor: '#fafafa', color: '#555' },
    tableRow: { '&:last-child td, &:last-child th': { border: 0 } },
    avatarCell: { py: 1.5, width: '60px' },
    avatar: { width: 40, height: 40, bgcolor: '#f0f4f8', color: '#2c3e50', fontSize: '0.9rem', fontWeight: 600, boxShadow: '0 2px 5px rgba(0,0,0,0.06)' },
    nameCell: { fontWeight: 600, color: '#2c3e50' },

    // --- Úvazky (Nové pastelové styly) ---
    // Funkce vrací specifický styl na základě typu úvazku
    getContractChipStyle: (type: string) => {
        const baseStyle = { fontWeight: 600, borderRadius: 1.5, border: 'none' };
        switch (type) {
            case 'HPP':
                return { ...baseStyle, bgcolor: '#e3f2fd', color: '#1976d2' }; // Pastelově modrá
            case 'DPP':
                return { ...baseStyle, bgcolor: '#e8f5e9', color: '#0288d1' }; // Světlejší pastelová modrá/zelená
            case 'OSVC':
                return { ...baseStyle, bgcolor: '#fff3e0', color: '#f57c00' }; // Pastelově oranžová
            default:
                return { ...baseStyle, bgcolor: '#f5f5f5', color: '#757575' }; // Šedá (Bez smlouvy)
        }
    },

    // --- Kvalifikace ---
    qualificationsWrapper: { display: 'flex', flexWrap: 'wrap', gap: 0.75 },
    qualificationChip: { bgcolor: '#f4f6f8', color: '#476582', fontWeight: 500, borderRadius: 1.5, border: '1px solid #e2e8f0', '& .MuiChip-label': { px: 1.5 } },
    emptyQualText: { color: '#999', fontStyle: 'italic', fontSize: '0.875rem' },

    // --- Tlačítka tabulky ---
    // Změněno na variantu bez rámečku, jen s jemným šedým podbarvením na hover
    editButton: {
        textTransform: 'none',
        borderRadius: 2,
        fontWeight: 600,
        color: '#3498db',
        '&:hover': { bgcolor: 'rgba(52, 152, 219, 0.08)' }
    },

    // --- Prázdný stav ---
    emptyTableState: { textAlign: 'center', py: 6 },
    emptySearchIcon: { fontSize: 48, color: '#e0e0e0', mb: 1.5, display: 'block', mx: 'auto' },

    // --- Modální okno (Dialog) ---
    dialogPaper: { borderRadius: 3, p: 0, overflow: 'hidden' },
    dialogTitle: { fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#fafafa', borderBottom: '1px solid #eee', fontSize: '1.1rem' },
    dialogContent: { p: 3, display: 'flex', flexDirection: 'column', gap: 2 },
    dialogEmployeeInfo: { display: 'flex', alignItems: 'center', gap: 2, mb: 1 },
    dialogAvatar: { width: 48, height: 48, bgcolor: '#f0f4f8', color: '#2c3e50', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    dialogSubtitle: { fontWeight: 600, color: '#555', mb: 0.5 },
    checkboxGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 1, maxHeight: '40vh', overflowY: 'auto', p: 0.5 },
    checkboxLabel: { '& .MuiFormControlLabel-label': { fontSize: '0.9rem' } },
    dialogActions: { p: 2, bgcolor: '#fafafa', borderTop: '1px solid #eee', gap: 1, px: 3 },
    cancelButton: { borderRadius: 2, textTransform: 'none', fontWeight: 600, color: '#666', borderColor: '#ccc' },
    saveButton: { borderRadius: 2, textTransform: 'none', fontWeight: 600, bgcolor: '#3498db', boxShadow: 'none', px: 3, '&:hover': { bgcolor: '#2980b9', boxShadow: 'none' } }
};