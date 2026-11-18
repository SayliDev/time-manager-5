export const pad = (n: number) => String(n).padStart(2, '0');
export const toHHMM = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
