// minutes:seconds from a number of seconds
export const mmss = (s) => `${String(Math.floor(Math.abs(s) / 60)).padStart(2, '0')}:${String(Math.floor(Math.abs(s) % 60)).padStart(2, '0')}`;
