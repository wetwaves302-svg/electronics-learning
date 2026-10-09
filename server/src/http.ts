import type { IncomingMessage, ServerResponse } from 'node:http'

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

export interface Ctx {
  req: IncomingMessage
  res: ServerResponse
  params: Record<string, string>
  query: URLSearchParams
  body: unknown
}
export type Handler = (ctx: Ctx) => unknown | Promise<unknown>
interface Route { method: string; re: RegExp; keys: string[]; handler: Handler }

export class Router {
  routes: Route[] = []
  add(method: string, path: string, handler: Handler) {
    const keys: string[] = []
    const re = new RegExp('^' + path.replace(/:([a-zA-Z]+)/g, (_, k) => { keys.push(k); return '([^/]+)' }) + '/?$')
    this.routes.push({ method, re, keys, handler })
  }
  get = (p: string, h: Handler) => this.add('GET', p, h)
  post = (p: string, h: Handler) => this.add('POST', p, h)
  put = (p: string, h: Handler) => this.add('PUT', p, h)
  del = (p: string, h: Handler) => this.add('DELETE', p, h)
  match(method: string, pathname: string) {
    for (const r of this.routes) {
      if (r.method !== method) continue
      const m = r.re.exec(pathname)
      if (m) return { route: r, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) }
    }
    return null
  }
  pathExists(pathname: string) { return this.routes.some((r) => r.re.test(pathname)) }
}

const MAX_BODY = 2 * 1024 * 1024

export async function readJson(req: IncomingMessage): Promise<unknown> {
  if (req.method === 'GET' || req.method === 'DELETE' || req.method === 'HEAD') return undefined
  const chunks: Buffer[] = []
  let size = 0
  for await (const c of req) {
    size += (c as Buffer).length
    if (size > MAX_BODY) throw new HttpError(413, '資料太大')
    chunks.push(c as Buffer)
  }
  if (size === 0) return undefined
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { throw new HttpError(400, 'JSON 格式錯誤') }
}

export function sendJson(res: ServerResponse, status: number, data: unknown, extra: Record<string, string> = {}) {
  const body = JSON.stringify(data)
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra })
  res.end(body)
}

/** 輸入驗證小工具 */
export const str = (v: unknown, name: string, min = 1, max = 5000): string => {
  if (typeof v !== 'string') throw new HttpError(400, `${name} 必須是文字`)
  const s = v.trim()
  if (s.length < min || s.length > max) throw new HttpError(400, `${name} 長度需介於 ${min}~${max}`)
  return s
}
export const optStr = (v: unknown, name: string, max = 20000): string | null => (v === undefined || v === null || v === '' ? null : str(v, name, 0, max))
export const int = (v: unknown, name: string): number => {
  if (typeof v !== 'number' || !Number.isInteger(v)) throw new HttpError(400, `${name} 必須是整數`)
  return v
}
