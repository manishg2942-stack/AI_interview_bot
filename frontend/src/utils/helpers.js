export function getErrorMessage(error, fallback) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function createUserIdentity(profile) {
  const source = profile?.email || profile?.name || '';
  return source
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
