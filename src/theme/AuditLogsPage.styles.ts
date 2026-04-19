export const styles = {
    // --- Hlavní layout ---
    container: { maxWidth: '1400px', mx: 'auto', p: { xs: 1, sm: 3 } },

    headerCard: { p: 2, mb: 3, borderRadius: 3, border: '1px solid #eaeaea', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#ffffff' },
    headerLeft: { display: 'flex', alignItems: 'center', gap: 2 },
    backButton: { bgcolor: 'rgba(0,0,0,0.03)', '&:hover': { bgcolor: 'rgba(0,0,0,0.08)' } },
    pageTitle: { fontWeight: 700, color: '#2c3e50', fontSize: '1.4rem' },
    headerIcon: { fontSize: 42, color: '#3498db', opacity: 0.8 },

    mainCard: { borderRadius: 3, p: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #f0f0f0' },

    // --- Ovládací prvky (VRÁCENO ZPĚT) ---
    controlsContainer: { mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 },
    searchInput: { width: { xs: '100%', sm: '320px' }, '& .MuiOutlinedInput-root': { borderRadius: 2 } },
    filterContainer: { display: 'flex', gap: 1, alignItems: 'center', overflowX: 'auto' },

    // --- Tabulka ---
    tableContainer: { position: 'relative', border: '1px solid #f0f0f0', borderRadius: 2, overflow: 'hidden' },
    loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(255,255,255,0.6)', zIndex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' },

    tableHeaderCell: { fontWeight: 600, py: 1.5, bgcolor: '#fafafa', color: '#555', borderBottom: '1px solid #eaeaea' },
    tableRow: { '&:last-child td, &:last-child th': { borderBottom: 0 } },
    tableCell: { py: 2, verticalAlign: 'middle', borderBottom: '1px solid #f5f5f5' },

    dateCell: { whiteSpace: 'nowrap', color: '#555' },
    userCell: { fontWeight: 600, color: '#2c3e50' },
    moduleCell: { color: '#666', fontWeight: 500 },
    detailsCell: { maxWidth: '400px', color: '#555', lineHeight: 1.5, fontSize: '0.875rem' },

    // --- Akční Tagy (Chips) ---
    getActionChipStyle: (action: string) => {
        const baseStyle = { fontWeight: 600, borderRadius: 1.5, border: 'none', height: '24px', fontSize: '0.75rem' };

        if (action.includes('DELETE') || action.includes('REMOVE')) {
            return { ...baseStyle, bgcolor: '#ffebee', color: '#c62828' };
        }
        if (action.includes('CREATE') || action.includes('ASSIGN') || action.includes('REGISTER')) {
            return { ...baseStyle, bgcolor: '#e8f5e9', color: '#2e7d32' };
        }
        if (action.includes('UPDATE') || action.includes('EDIT')) {
            return { ...baseStyle, bgcolor: '#e3f2fd', color: '#1565c0' };
        }

        return { ...baseStyle, bgcolor: '#f5f5f5', color: '#616161' };
    },

    emptyTableState: { textAlign: 'center', py: 6 },
    emptySearchIcon: { fontSize: 48, color: '#e0e0e0', mb: 1.5, display: 'block', mx: 'auto' },
};