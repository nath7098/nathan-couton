/**
 * Obtains the Music User Token that lets GET /api/soundtrack read Nathan's
 * listening history.
 *
 * Apple only hands that token to MusicKit JS, in a browser, after the account
 * owner signs in and approves. So this serves a one-button page on localhost,
 * signed with the same MusicKit key as the site, and prints the token here
 * once the page sends it back. Paste it into NUXT_APPLE_MUSIC_USER_TOKEN in
 * Vercel, then redeploy. Apple lets it lapse after a few months: the function
 * logs a 401/403 when it does, and running this again renews it.
 *
 *   npm run apple-music:token
 *
 * Reads NUXT_APPLE_MUSIC_TEAM_ID, NUXT_APPLE_MUSIC_KEY_ID and either
 * NUXT_APPLE_MUSIC_PRIVATE_KEY or APPLE_MUSIC_KEY_FILE (a path to the .p8)
 * from the environment or from .env.
 *
 * The developer-token signer mirrors server/utils/apple-music.ts; it is
 * repeated here so this script runs with plain Node, without a TS loader.
 */
import { createServer } from 'node:http'
import { createPrivateKey, sign } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'

const PORT = 4321

// .env, without a dependency: KEY=value lines, optional quotes.
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2')
  }
}

const teamId = process.env.NUXT_APPLE_MUSIC_TEAM_ID
const keyId = process.env.NUXT_APPLE_MUSIC_KEY_ID
const keyFile = process.env.APPLE_MUSIC_KEY_FILE
const privateKey = keyFile ? readFileSync(keyFile, 'utf8') : process.env.NUXT_APPLE_MUSIC_PRIVATE_KEY

if (!teamId || !keyId || !privateKey) {
  console.error('✗ Set NUXT_APPLE_MUSIC_TEAM_ID, NUXT_APPLE_MUSIC_KEY_ID and NUXT_APPLE_MUSIC_PRIVATE_KEY (or APPLE_MUSIC_KEY_FILE=path/to/AuthKey.p8).')
  process.exit(1)
}

const base64url = input => Buffer.from(input).toString('base64url')
const now = Math.floor(Date.now() / 1000)
const header = base64url(JSON.stringify({ alg: 'ES256', kid: keyId }))
const payload = base64url(JSON.stringify({ iss: teamId, iat: now, exp: now + 3600 }))
const key = createPrivateKey(privateKey.trim().replace(/\\n/g, '\n'))
const developerToken = `${header}.${payload}.${base64url(sign('sha256', Buffer.from(`${header}.${payload}`), { key, dsaEncoding: 'ieee-p1363' }))}`

const page = `<!doctype html>
<html lang="fr">
<meta charset="utf-8">
<title>Apple Music — jeton utilisateur</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; max-width: 40rem; margin: 4rem auto; padding: 0 1rem; }
  button { font: inherit; padding: .6rem 1.2rem; cursor: pointer; }
  textarea { width: 100%; height: 8rem; font: 12px monospace; }
</style>
<h1>Bande-son Apple Music</h1>
<p>Connectez-vous avec le compte Apple Music dont l'historique doit apparaître sur le site.</p>
<button id="go" disabled>Chargement de MusicKit…</button>
<p id="status"></p>
<textarea id="out" readonly hidden></textarea>
<script src="https://js-cdn.music.apple.com/musickit/v3/musickit.js" data-web-components async></script>
<script>
  const go = document.getElementById('go')
  const status = document.getElementById('status')
  const out = document.getElementById('out')
  document.addEventListener('musickitloaded', async () => {
    const music = await MusicKit.configure({
      developerToken: ${JSON.stringify(developerToken)},
      app: { name: 'nathancouton.fr', build: '1.0.0' },
    })
    go.disabled = false
    go.textContent = 'Autoriser l\\'accès'
    go.onclick = async () => {
      try {
        const token = await music.authorize()
        out.value = token
        out.hidden = false
        await fetch('/token', { method: 'POST', body: token })
        status.textContent = 'Jeton reçu dans le terminal. Vous pouvez fermer cet onglet.'
      } catch (error) {
        status.textContent = 'Échec : ' + error
      }
    }
  })
</script>
</html>`

const server = createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/token') {
    let body = ''
    req.on('data', chunk => (body += chunk))
    req.on('end', () => {
      res.writeHead(204).end()
      console.log('\n✓ Music User Token :\n')
      console.log(body)
      console.log('\n→ À coller dans NUXT_APPLE_MUSIC_USER_TOKEN (Vercel → Settings → Environment Variables), puis redéployer.')
      server.close()
    })
    return
  }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(page)
})

server.listen(PORT, () => {
  console.log(`Ouvrez http://localhost:${PORT} et autorisez l'accès à Apple Music.`)
})
