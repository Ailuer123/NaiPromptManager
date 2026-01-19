
// Add missing D1 type definitions locally
interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  error?: string;
  meta: any;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec<T = unknown>(query: string): Promise<D1Result<T>>;
}

// Pages Advanced Mode 自动注入 ASSETS fetcher
interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  DB: D1Database;
  NAI_API_KEY: string;
  MASTER_KEY: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Master-Key',
};

const json = (data: any, status = 200) => 
  new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', ...corsHeaders }, status });

const error = (msg: string, status = 500) => 
  new Response(JSON.stringify({ error: msg }), { headers: { 'Content-Type': 'application/json', ...corsHeaders }, status });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // 1. 如果不是 API 请求，直接返回静态资源 (Frontend)
    // Cloudflare Pages Advanced Mode 约定：_worker.js 接管所有请求
    // 我们只拦截 /api/ 开头的请求，其余交给 ASSETS
    if (!path.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }

    // 2. 处理 API CORS Preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // --- Auth Check (Admin Only Routes) ---
      if (['PUT', 'DELETE'].includes(method) || (path.startsWith('/api/artists') && method === 'POST') || (path.startsWith('/api/inspirations') && method === 'POST')) {
         const authHeader = request.headers.get('X-Master-Key');
         if (authHeader !== env.MASTER_KEY) {
           return error('Unauthorized', 401);
         }
      }
      
      // --- Auth Verification Endpoint ---
      if (path === '/api/verify-key' && method === 'POST') {
        const { key } = await request.json() as any;
        if (key === env.MASTER_KEY) return json({ success: true });
        return error('Invalid Key', 401);
      }

      // --- NovelAI Proxy ---
      if (path === '/api/generate' && method === 'POST') {
        const body = await request.json();
        const naiRes = await fetch("https://image.novelai.net/ai/generate-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.NAI_API_KEY}`
          },
          body: JSON.stringify(body)
        });

        if (!naiRes.ok) {
           const errText = await naiRes.text();
           return error(`NAI API Error: ${errText}`, naiRes.status);
        }
        
        const blob = await naiRes.blob();
        return new Response(blob, {
          headers: { ...corsHeaders, 'Content-Type': 'application/zip' }
        });
      }

      // --- Chains ---
      if (path === '/api/chains' && method === 'GET') {
        const chainsResult = await env.DB.prepare('SELECT * FROM chains ORDER BY updated_at DESC').all();
        const chains = chainsResult.results;

        const versionsResult = await env.DB.prepare(`
          SELECT v.* FROM versions v
          INNER JOIN (
            SELECT chain_id, MAX(version) as max_ver FROM versions GROUP BY chain_id
          ) grouped ON v.chain_id = grouped.chain_id AND v.version = grouped.max_ver
        `).all();
        
        const versionMap = new Map();
        versionsResult.results.forEach((v: any) => {
           v.modules = JSON.parse(v.modules || '[]');
           v.params = JSON.parse(v.params || '{}');
           versionMap.set(v.chain_id, v);
        });

        const data = chains.map((c: any) => ({
          ...c,
          tags: JSON.parse(c.tags || '[]'),
          latestVersion: versionMap.get(c.id) || null
        }));
        
        return json(data);
      }

      if (path === '/api/chains' && method === 'POST') {
        const { name, description } = await request.json() as any;
        const id = crypto.randomUUID();
        const now = Date.now();
        
        await env.DB.prepare(
          'INSERT INTO chains (id, name, description, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(id, name, description, '[]', now, now).run();

        const vId = crypto.randomUUID();
        const defaultModules = JSON.stringify([{ id: crypto.randomUUID(), name: "光照", content: "cinematic lighting", isActive: true }]);
        const defaultParams = JSON.stringify({ width: 832, height: 1216, steps: 28, scale: 5, sampler: 'k_euler_ancestral' });
        
        await env.DB.prepare(
          'INSERT INTO versions (id, chain_id, version, base_prompt, negative_prompt, modules, params, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(vId, id, 1, 'masterpiece, best quality, {character}', 'lowres, bad anatomy', defaultModules, defaultParams, now).run();

        return json({ id });
      }

      const chainIdMatch = path.match(/^\/api\/chains\/([^\/]+)$/);
      if (chainIdMatch && method === 'PUT') {
        const id = chainIdMatch[1];
        const updates = await request.json() as any;
        const fields = [];
        const values = [];
        if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
        if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
        if (updates.previewImage !== undefined) { fields.push('preview_image = ?'); values.push(updates.previewImage); }
        
        if (fields.length > 0) {
           fields.push('updated_at = ?');
           values.push(Date.now());
           values.push(id);
           await env.DB.prepare(`UPDATE chains SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
        }
        return json({ success: true });
      }

      if (chainIdMatch && method === 'DELETE') {
        const id = chainIdMatch[1];
        await env.DB.prepare('DELETE FROM chains WHERE id = ?').bind(id).run();
        return json({ success: true });
      }

      // --- Versions ---
      if (path.match(/^\/api\/chains\/[^\/]+\/versions$/) && method === 'POST') {
        const match = path.match(/^\/api\/chains\/([^\/]+)\/versions$/);
        if (!match) return error('Invalid ID');
        const chainId = match[1];
        const body = await request.json() as any;

        const maxVerResult = await env.DB.prepare('SELECT MAX(version) as max_v FROM versions WHERE chain_id = ?').bind(chainId).first<{ max_v: number }>();
        const nextVer = ((maxVerResult?.max_v) || 0) + 1;

        const newId = crypto.randomUUID();
        await env.DB.prepare(
          'INSERT INTO versions (id, chain_id, version, base_prompt, negative_prompt, modules, params, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          newId, 
          chainId, 
          nextVer, 
          body.basePrompt || '', 
          body.negativePrompt || '', 
          JSON.stringify(body.modules || []), 
          JSON.stringify(body.params || {}), 
          Date.now()
        ).run();

        await env.DB.prepare('UPDATE chains SET updated_at = ? WHERE id = ?').bind(Date.now(), chainId).run();

        return json({ id: newId, version: nextVer });
      }

      // --- Artists ---
      if (path === '/api/artists' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM artists ORDER BY name ASC').all();
        return json(results);
      }
      if (path === '/api/artists' && method === 'POST') {
        const body = await request.json() as any;
        await env.DB.prepare('INSERT OR REPLACE INTO artists (id, name, image_url) VALUES (?, ?, ?)').bind(body.id, body.name, body.imageUrl).run();
        return json({ success: true });
      }
      const artistIdMatch = path.match(/^\/api\/artists\/([^\/]+)$/);
      if (artistIdMatch && method === 'DELETE') {
        await env.DB.prepare('DELETE FROM artists WHERE id = ?').bind(artistIdMatch[1]).run();
        return json({ success: true });
      }

      // --- Inspirations ---
      if (path === '/api/inspirations' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM inspirations ORDER BY created_at DESC').all();
        return json(results);
      }
      if (path === '/api/inspirations' && method === 'POST') {
        const body = await request.json() as any;
        await env.DB.prepare('INSERT OR REPLACE INTO inspirations (id, title, image_url, prompt, created_at) VALUES (?, ?, ?, ?, ?)').bind(body.id, body.title, body.imageUrl, body.prompt, body.createdAt).run();
        return json({ success: true });
      }
      const inspIdMatch = path.match(/^\/api\/inspirations\/([^\/]+)$/);
      if (inspIdMatch && method === 'DELETE') {
        await env.DB.prepare('DELETE FROM inspirations WHERE id = ?').bind(inspIdMatch[1]).run();
        return json({ success: true });
      }

      // Fallback for unknown API routes
      if (path.startsWith('/api/')) {
        return error('Not Found', 404);
      }
      
      // Should effectively be unreachable due to first check, but safe guard
      return env.ASSETS.fetch(request);

    } catch (e: any) {
      return error(e.message, 500);
    }
  }
};
