// Weekly availability (FR-4.2): slots like { day: 1, start: '18:00', end: '21:00' } in the mentor's timezone.

export interface Availability {
  acceptingDoubts: boolean;
  timezone: string;
  slots: { day: number; start: string; end: string }[]; // day: 0 = Sunday … 6 = Saturday
}

const minutesOf = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// The day of week and minutes since midnight at `date` in `timezone`.
export const localTime = (date: Date, timezone: string): { day: number; minutes: number } => {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  } catch {
    parts = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  }
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { day, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
};

// A slot whose end is before its start runs past midnight into the next day.
export const isWithinSlots = (a: Pick<Availability, 'timezone' | 'slots'> | undefined, at = new Date()): boolean => {
  if (!a?.slots?.length) return false;
  const { day, minutes } = localTime(at, a.timezone || 'Asia/Kolkata');
  return a.slots.some((s) => {
    const start = minutesOf(s.start);
    const end = minutesOf(s.end);
    if (start <= end) return s.day === day && minutes >= start && minutes < end;
    return (s.day === day && minutes >= start) || ((s.day + 1) % 7 === day && minutes < end);
  });
};
