const LIVE_MS = 150 * 60 * 1000;
const MIN = 60 * 1000;

// Where an event is in time, for the kickoff column and the list filters.
export function whenOf(ms, now) {
  const d = new Date(ms);
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (now >= ms && now < ms + LIVE_MS) return { state: 'live', time, label: 'Live' };
  if (now >= ms + LIVE_MS) return { state: 'ended', time, label: 'Finished' };
  const diff = ms - now;
  if (diff < 60 * MIN) return { state: 'soon', time, label: `in ${Math.max(1, Math.ceil(diff / MIN))} min` };
  const dayStart = (x) => new Date(x).setHours(0, 0, 0, 0);
  const days = Math.round((dayStart(ms) - dayStart(now)) / 86400000);
  return { state: 'later', time, label: days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : d.toLocaleDateString([], { weekday: 'short' }) };
}
