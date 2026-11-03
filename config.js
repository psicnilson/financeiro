export function getConfig(env) {
  const rawUrl = env.SUPABASE_URL || '';
  const key = env.SUPABASE_PUBLISHABLE_KEY || '';
  if (!rawUrl && !key && env.RENDER !== 'true' && env.APP_MODE !== 'cloud') return {mode:'local'};
  let url;
  try { url = new URL(rawUrl); } catch { throw new Error('Configure SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY no ambiente.'); }
  if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) || url.username || url.password || url.port || url.search || url.hash || !['','/'].includes(url.pathname)) throw new Error('SUPABASE_URL deve ser a Project URL HTTPS do Supabase.');
  let isPublic = /^sb_publishable_[A-Za-z0-9_-]+$/.test(key);
  try {
    const parts = key.split('.');
    isPublic ||= parts.length === 3 && JSON.parse(Buffer.from(parts[1], 'base64url').toString()).role === 'anon';
  } catch { /* Chaves secretas nunca são publicadas no navegador. */ }
  if (!isPublic) throw new Error('Use a chave publishable ou anon do Supabase; nunca secret ou service_role.');
  return {mode:'cloud', url:url.origin, key};
}
