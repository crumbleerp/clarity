import { Elysia } from 'elysia'
import { staticPlugin } from '@elysiajs/static'
import { extname, join } from 'path'
import { file as useFile } from 'bun'

const types: Record<string, string> = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
}

const app = new Elysia()

app.use(staticPlugin({ assets: './dist', prefix: '/' }))

app.get('*', async (context) => {
  const path = join('./dist', new URL(context.request.url).pathname)
  const file = useFile(path)

  if (await file.exists()) return new Response(file, { headers: { 'Content-Type': types[extname(path)] ?? 'application/octet-stream' } })

  return new Response(useFile('./dist/index.html'), { headers: { 'Content-Type': 'text/html' } })
})

app.listen(3333)

console.log('Listening on http://[::]:3333')
