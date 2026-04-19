// AvailabilityCalendarStyles.ts

export const customScrollbar = {
    '&::-webkit-scrollbar': { width: '6px' },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
    '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '10px' },
    '&::-webkit-scrollbar-thumb:hover': { background: '#94a3b8' },
    scrollbarWidth: 'thin',
    scrollbarColor: '#cbd5e1 transparent',
};

// Hlavní obal celé stránky (pozadí, centrování)
export const pageContainerStyle = {
    height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
    p: { xs: 1, md: 2 }, boxSizing: 'border-box', overflowY: 'auto', overflowX: 'hidden',
    ...customScrollbar
};

// Bílý pruh nahoře (Hlavička s názvem)
export const headerPaperStyle = {
    p: 2, px: 4, mb: 3, borderRadius: '16px', bgcolor: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
};

// Karta pro samotný Kalendář vlevo
export const calendarCardStyle = {
    p: 2, pt: 1, borderRadius: '16px', flex: 6.5, display: 'flex', flexDirection: 'column', position: 'relative',
    overflowY: 'auto', overflowX: 'hidden', height: { xs: 'auto', md: '680px' },
    ...customScrollbar
};

// Karta pro Seznam změn vpravo
export const changesCardStyle = {
    p: 3, pt: 1.5, borderRadius: '16px', flex: 3.5, display: 'flex', flexDirection: 'column', bgcolor: '#fafafa',
    height: { xs: 'auto', md: '680px' }
};

// Blok pro listování změnami (s rolovátkem) uvnitř pravé karty
export const changesListStyle = {
    flex: 1, overflowY: 'auto', pr: 1, mb: 2, ...customScrollbar
};

export const calendarStyles = {
    width: 'auto !important',
    maxWidth: 'none',
    height: 'auto !important',
    maxHeight: 'none !important',
    margin: 0,
    '& .MuiPickersCalendarHeader-root': {
        px: 2, mt: 1, mb: 1, minHeight: '60px',
        '& .MuiPickersCalendarHeader-label': { fontSize: '1.35rem', fontWeight: 'bold', color: '#1e293b' },
        '& .MuiIconButton-root': { transform: 'scale(1.3)', margin: '0 8px' }
    },
    '& .MuiDayCalendar-root': { width: 'auto !important', minWidth: '586px !important' },
    '& .MuiDayCalendar-header': { display: 'flex !important', justifyContent: 'center !important', gap: '16px !important', mb: '12px !important' },
    '& .MuiDayCalendar-weekDayLabel': { width: '70px !important', height: '40px', fontWeight: 'bold', fontSize: '1rem', color: '#1e293b', margin: '0 !important' },
    '& .MuiDayCalendar-monthContainer': { display: 'flex !important', flexDirection: 'column !important', gap: '16px !important' },
    '& .MuiDayCalendar-weekContainer': { display: 'flex !important', justifyContent: 'center !important', gap: '16px !important', margin: '0 !important' },
    '& .MuiDayCalendar-weekContainer > *': { width: '70px !important', height: '70px !important', fontSize: '1.3rem', borderRadius: '14px', margin: '0 !important' },
    '& .MuiDayCalendar-slideTransition': { minHeight: '520px !important', overflowX: 'hidden' }
};