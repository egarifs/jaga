// Verifies Google ID token via Google's tokeninfo endpoint (checks signature+expiry server-side).
// ponytail: one network call per login; switch to local JWKS verify if login volume grows.
export async function verifyGoogle(idToken: string, clientId: string): Promise<{ sub: string; name?: string }> {
  const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken));
  if (!r.ok) throw new Error('token tidak valid');
  const t = (await r.json()) as { aud: string; sub: string; name?: string; email_verified?: string };
  if (t.aud !== clientId) throw new Error('audience salah');
  return { sub: t.sub, name: t.name };
}
