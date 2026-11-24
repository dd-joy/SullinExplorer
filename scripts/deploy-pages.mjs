import { appendFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// Uses the same Pages deployment endpoint as actions/deploy-pages, but passes
// the upload step's artifact ID directly instead of listing artifacts via Twirp.
export async function deployPages({ env = process.env, request = fetch, wait = ms => new Promise(resolve => setTimeout(resolve, ms)), output = appendFile } = {}) {
  const { GITHUB_TOKEN:token, GITHUB_REPOSITORY:repository, GITHUB_SHA:sha, PAGES_ARTIFACT_ID:artifactId,
    ACTIONS_ID_TOKEN_REQUEST_URL:oidcUrl, ACTIONS_ID_TOKEN_REQUEST_TOKEN:oidcRequestToken } = env;
  if (!token || !/^[\w.-]+\/[\w.-]+$/.test(repository || '') || !/^[a-f0-9]{40}$/.test(sha || '')
      || !/^\d+$/.test(artifactId || '') || !Number.isSafeInteger(Number(artifactId)) || !oidcUrl || !oidcRequestToken) {
    throw new Error('Missing or invalid GitHub Actions deployment environment.');
  }
  const api = env.GITHUB_API_URL || 'https://api.github.com';
  const base = `${api}/repos/${repository}/pages/deployments`;
  const headers = { Authorization:`Bearer ${token}`, Accept:'application/vnd.github+json', 'Content-Type':'application/json', 'X-GitHub-Api-Version':'2022-11-28' };
  const oidcResponse = await request(oidcUrl, { headers:{ Authorization:`Bearer ${oidcRequestToken}` }, signal:AbortSignal.timeout(30000) });
  if (!oidcResponse.ok) throw new Error(`OIDC request failed (HTTP ${oidcResponse.status}).`);
  const oidc = await oidcResponse.json();
  if (!oidc.value) throw new Error('OIDC token was not returned.');
  const createdResponse = await request(base, {
    method:'POST', headers,
    body:JSON.stringify({ artifact_id:Number(artifactId), pages_build_version:sha, oidc_token:oidc.value }),
    signal:AbortSignal.timeout(30000),
  });
  if (!createdResponse.ok) throw new Error(`Pages deployment creation failed (HTTP ${createdResponse.status}). Check Pages permissions and settings.`);
  const deployment = await createdResponse.json();
  const id = deployment.id || deployment.status_url?.split('/').pop();
  if (!id || !/^[\w-]+$/.test(String(id))) throw new Error('Pages deployment ID was not returned.');
  if (env.GITHUB_OUTPUT && deployment.page_url) await output(env.GITHUB_OUTPUT, `page_url=${deployment.page_url}\n`);
  const failed = new Set(['deployment_failed','deployment_perms_error','deployment_cancelled','deployment_lost']);
  let consecutiveErrors = 0;
  for (let attempt = 0; attempt < 72; attempt++) {
    await wait(5000);
    let response;
    try { response = await request(`${base}/${encodeURIComponent(id)}`, { headers, signal:AbortSignal.timeout(20000) }); }
    catch { if (++consecutiveErrors >= 5) throw new Error('Pages status checks repeatedly failed.'); continue; }
    if (!response.ok) {
      if (++consecutiveErrors >= 5) throw new Error(`Pages status checks failed (HTTP ${response.status}).`);
      continue;
    }
    consecutiveErrors = 0;
    const status = await response.json();
    if (status.status === 'succeed') return deployment.page_url;
    if (failed.has(status.status)) throw new Error(`Pages deployment failed: ${status.status}`);
  }
  throw new Error('Pages deployment did not finish within six minutes.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { const url = await deployPages(); console.log(`Pages deployment completed${url ? `: ${url}` : '.'}`); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
