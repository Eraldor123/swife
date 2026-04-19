import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import type { PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import dayjs from 'dayjs';

export interface BackendAvailabilityDto {
    id?: string;
    availableDate?: string;
    date?: string;
    hasMorningShift?: boolean;
    hasAfternoonShift?: boolean;
    morning?: boolean;
    afternoon?: boolean;
    isConfirmed?: boolean;
    confirmed?: boolean;
}

export interface UiAvailabilityDayDto {
    date: string;
    morning: boolean;
    afternoon: boolean;
}

export function AvailabilityStyledDay(
    props: PickersDayProps & {
        backendAvailabilities?: BackendAvailabilityDto[];
        uiAvailabilities?: UiAvailabilityDayDto[];
    }
) {
    const { day, outsideCurrentMonth, backendAvailabilities = [], uiAvailabilities = [], ...other } = props;

    if (outsideCurrentMonth) {
        return <PickersDay day={day} outsideCurrentMonth={outsideCurrentMonth} {...other} />;
    }

    const dateStr = day.format('YYYY-MM-DD');

    const uiData = uiAvailabilities.find((d: UiAvailabilityDayDto) => d.date === dateStr);
    const backendData = backendAvailabilities.find((a: BackendAvailabilityDto) => {
        const dbDate = a.availableDate || a.date;
        return dbDate ? dayjs(dbDate).format('YYYY-MM-DD') === dateStr : false;
    });

    // 1. Zjistíme, co PŘESNĚ naplánoval manažer (Zamyká se na Modrou)
    const morningAssigned = backendData?.hasMorningShift || false;
    const afternoonAssigned = backendData?.hasAfternoonShift || false;

    // 2. Zjistíme, jaká je celková dostupnost pro dané poloviny
    const isMorning = uiData ? uiData.morning : (backendData?.morning || false);
    const isAfternoon = uiData ? uiData.afternoon : (backendData?.afternoon || false);

    // 3. BARVÍCÍ LOGIKA - Každá půlka se barví zcela nezávisle!
    const getHalfColor = (isAssigned: boolean, isAvailable: boolean) => {
        if (isAssigned) return '#93c5fd';   // Modrá (Mám tam přiřazenou směnu)
        if (isAvailable) return '#86efac';  // Zelená (Mám čas, ale směnu zatím nemám)
        return 'transparent';               // Bílá (Nemám čas)
    };

    const morningColor = getHalfColor(morningAssigned, isMorning);
    const afternoonColor = getHalfColor(afternoonAssigned, isAfternoon);

    const isAvailable = isMorning || isAfternoon;

    return (
        <PickersDay
            day={day}
            outsideCurrentMonth={outsideCurrentMonth}
            {...other}
            sx={{
                // Nyní se tvoří diagonála přesně podle nezávislých barev!
                background: `linear-gradient(135deg, ${morningColor} 50%, ${afternoonColor} 50%)`,
                color: isAvailable ? '#1e293b' : 'inherit',
                fontWeight: isAvailable ? 'bold' : 'normal',
                '&:hover': {
                    background: `linear-gradient(135deg, ${morningColor === 'transparent' ? '#f1f5f9' : morningColor} 50%, ${afternoonColor === 'transparent' ? '#f1f5f9' : afternoonColor} 50%)`
                },
                ...(isAvailable && {
                    '&.Mui-selected': {
                        background: `linear-gradient(135deg, ${morningColor} 50%, ${afternoonColor} 50%)`,
                        color: '#1e293b',
                        border: '2px solid #334155'
                    },
                    '&.Mui-selected:hover': {
                        background: `linear-gradient(135deg, ${morningColor === 'transparent' ? '#f1f5f9' : morningColor} 50%, ${afternoonColor === 'transparent' ? '#f1f5f9' : afternoonColor} 50%)`
                    },
                    '&.Mui-selected:focus': {
                        background: `linear-gradient(135deg, ${morningColor} 50%, ${afternoonColor} 50%)`
                    }
                })
            }}
        />
    );
}