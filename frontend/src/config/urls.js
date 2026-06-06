const DEFAULT_API_ORIGIN = 'https://api.codingace.online';
const API_PATH_PREFIX = '/api';

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

const apiOrigin = trimTrailingSlash(import.meta.env.VITE_API_ORIGIN || DEFAULT_API_ORIGIN);

export const API_BASE_URL = `${apiOrigin}${API_PATH_PREFIX}`;
