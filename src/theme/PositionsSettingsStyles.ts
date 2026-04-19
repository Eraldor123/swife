// PositionsSettingsStyles.ts

export const pageContainerStyle = {
    maxWidth: '1400px', mx: 'auto', p: { xs: 1, md: 3 }
};

export const headerPaperStyle = {
    p: { xs: 2, md: 2 }, px: { xs: 2, md: 4 }, mb: 4,
    borderRadius: '16px', bgcolor: 'white',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    display: 'flex', flexDirection: { xs: 'column', md: 'row' },
    justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2
};

export const titleBoxStyle = {
    display: 'flex', alignItems: 'center', gap: 2.5
};

export const columnPaperStyle = {
    borderRadius: '16px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 250px)', // FIXNÍ VÝŠKA PRO SCROLLBAR
    minHeight: '500px',
    bgcolor: 'white',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    overflow: 'hidden'
};

// Oblast se scrollbarem
export const scrollBoxStyle = {
    flexGrow: 1,
    overflowY: 'auto',
    px: 1,
    '&::-webkit-scrollbar': { width: '6px' },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
    '&::-webkit-scrollbar-thumb': { background: '#e2e8f0', borderRadius: '10px' },
    '&::-webkit-scrollbar-thumb:hover': { background: '#cbd5e1' }
};

export const templateColumnStyle = {
    ...columnPaperStyle
};

export const columnHeaderStyle = {
    p: 2.5, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
};

export const emptyStateStyle = {
    p: 4, textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.95rem'
};

export const templateItemStyle = {
    p: 2.5, mb: 2, borderRadius: '16px', bgcolor: 'white', border: '1px solid #f1f5f9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
};

export const templateSplitBoxStyle = {
    border: '1px solid #e2e8f0', borderRadius: '12px', p: 2.5, bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 2
};

export const settingsCardStyle = {
    borderRadius: '16px', flex: 1, p: 3.5, bgcolor: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden'
};

export const settingsCardHeaderStyle = {
    display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center'
};

export const hoursInfoBoxStyle = {
    bgcolor: '#f8fafc', p: 2.5, borderRadius: '12px', border: '1px solid #f1f5f9'
};

export const pauseInfoBoxStyle = {
    textAlign: 'center', p: 3.5, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9'
};

export const seasonGridStyle = {
    display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3
};

export const seasonCardStyle = {
    p: 2.5, bgcolor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
};

export const dialogTitleStyle = {
    fontWeight: 'bold', color: '#1e293b', pt: 3, px: 3, pb: 1.5
};

export const dialogContentStyle = {
    display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1, px: 3, pb: 3
};

export const dialogActionsStyle = {
    p: 3, pt: 1.5, justifyContent: 'flex-end'
};

export const dialogTitleErrorStyle = {
    ...dialogTitleStyle, color: '#ef4444'
};

export const sectionTitleStyle = {
    fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', mb: 1, mt: 1
};

export const primaryButtonStyle = {
    bgcolor: '#1976d2', color: 'white', borderRadius: '8px', textTransform: 'none', fontWeight: 'bold',
    px: 3, py: 1.2, boxShadow: 'none',
    '&:hover': { bgcolor: '#1565c0', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }
};

export const ghostButtonStyle = {
    color: '#64748b', fontWeight: 'bold', textTransform: 'none', px: 2,
    '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
};

export const neutralButtonStyle = {
    bgcolor: '#64748b', color: 'white', borderRadius: '8px', textTransform: 'none', fontWeight: 'bold',
    px: 3, py: 1.2, boxShadow: 'none',
    '&:hover': { bgcolor: '#475569', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }
};

export const dangerButtonStyle = {
    bgcolor: '#ef4444', color: 'white', borderRadius: '8px', textTransform: 'none', fontWeight: 'bold',
    px: 3, py: 1.2, boxShadow: 'none',
    '&:hover': { bgcolor: '#dc2626', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
    '&.Mui-disabled': { bgcolor: '#fca5a5', color: '#f8fafc' }
};

export const addButtonStyle = {
    p: 2.5, fontWeight: 'bold', textTransform: 'none', borderRadius: '0 0 16px 16px',
    color: '#1976d2', bgcolor: 'transparent',
    '&:hover': { bgcolor: '#f8fafc' }
};

export const lightDividerStyle = {
    borderColor: '#e2e8f0'
};

export const modernInputStyle = {
    '& .MuiOutlinedInput-root': {
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        '& fieldset': { borderColor: '#e2e8f0', borderWidth: '1px' },
        '&:hover fieldset': { borderColor: '#cbd5e1' },
        '&.Mui-focused fieldset': { borderColor: '#1976d2', borderWidth: '2px' }
    },
    '& .MuiInputLabel-root': { color: '#64748b', overflow: 'visible' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#1976d2' },
    '& .MuiInputLabel-shrink': { backgroundColor: '#ffffff', px: 0.5, marginLeft: '-4px' },
    '& .MuiInputLabel-shrink:not(.MuiInputLabel-sizeSmall)': { top: '10px' }
};

export const modernDialogProps = {
    paper: {
        sx: {
            borderRadius: '24px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            backgroundImage: 'none'
        }
    }
};