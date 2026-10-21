export const SITE_URL = {
  roxie: (id) => `https://roxiestreams.su/${id}`,
  streamed: (id) => `https://streamed.pk/watch/${id}`,
  timst: (id) => `https://timst.top/watch/${id}`,
  ppv: (id) => `https://ppv.st/live/${id}`,
};

export const PLAYABLE = new Set(['roxie', 'streamed', 'timst']);

export const SITE_NAME = {
  roxie: 'Roxiestreams',
  streamed: 'streamed.pk',
  timst: 'timst.top',
  ppv: 'ppv.st',
};

export const SITE_SHORT = {
  roxie: 'Roxie',
  streamed: 'streamed',
  timst: 'timst',
  ppv: 'ppv',
};

export const sortSites = (sites = []) =>
  [...sites].sort((a, b) => Number(PLAYABLE.has(b.site)) - Number(PLAYABLE.has(a.site)));
