// Cloudflare Worker — publicação do dataset.json da Copa SP Open
// Recebe { password, dataset } do painel admin, confere a senha e grava
// dataset.json no repositório do GitHub Pages. A chave do GitHub fica em
// segredo NO WORKER (env), nunca na página.
//
// Variáveis (definir no painel do Cloudflare em Settings > Variables):
//   GITHUB_TOKEN    (Secret)  -> token fine-grained com Contents: Read and write no repo
//   ADMIN_PASSWORD  (Secret)  -> mesma senha do login do painel (ex.: a6509j)
//   GH_REPO         (Text)    -> "luizrocco-max/copa-sp-open-2026"
//   GH_BRANCH       (Text)    -> "main"   (opcional; default main)
//   ALLOW_ORIGIN    (Text)    -> "https://copasaopaulodetiroahelice.com.br" (opcional)

const DEFAULT_ALLOW = 'https://copasaopaulodetiroahelice.com.br';

export default {
  async fetch(req, env) {
    const allow = env.ALLOW_ORIGIN || DEFAULT_ALLOW;
    const cors = {
      'Access-Control-Allow-Origin': allow,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST') return json({ error: 'Use POST' }, 405, cors);

    let body;
    try { body = await req.json(); } catch { return json({ error: 'JSON inválido' }, 400, cors); }

    const { password, dataset } = body || {};
    if (!password || password !== env.ADMIN_PASSWORD) return json({ error: 'Senha incorreta' }, 401, cors);
    if (!dataset || !Array.isArray(dataset.athletes) || dataset.athletes.length === 0)
      return json({ error: 'dataset inválido ou vazio' }, 400, cors);

    const repo = env.GH_REPO;
    const branch = env.GH_BRANCH || 'main';
    if (!repo || !env.GITHUB_TOKEN) return json({ error: 'Worker sem GITHUB_TOKEN/GH_REPO configurados' }, 500, cors);

    const api = `https://api.github.com/repos/${repo}/contents/dataset.json`;
    const ghHeaders = {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'copa-publish-worker',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    // pega o SHA atual (necessário para atualizar arquivo existente)
    let sha;
    const cur = await fetch(`${api}?ref=${branch}`, { headers: ghHeaders });
    if (cur.status === 200) { sha = (await cur.json()).sha; }
    else if (cur.status !== 404) {
      return json({ error: 'GitHub (leitura): ' + cur.status + ' ' + (await cur.text()).slice(0, 300) }, 502, cors);
    }

    const content = b64utf8(JSON.stringify(dataset, null, 1));
    const put = await fetch(api, {
      method: 'PUT',
      headers: { ...ghHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Atualiza dataset.json via painel admin',
        content, sha, branch,
      }),
    });
    if (!put.ok) return json({ error: 'GitHub (gravação): ' + put.status + ' ' + (await put.text()).slice(0, 300) }, 502, cors);

    return json({ ok: true, atiradores: dataset.athletes.length, etapas: (dataset.stages || []).length }, 200, cors);
  },
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}
// base64 de string UTF-8 (nomes com acento)
function b64utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
