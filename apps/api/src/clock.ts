export interface Clock {
  today(): string;
}

export function createSystemClock(timeZone: string, now: () => Date = () => new Date()): Clock {
  // The en-CA locale formats dates as YYYY-MM-DD. An invalid timeZone throws here, at startup.
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return { today: () => formatter.format(now()) };
}
