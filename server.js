import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { getConfig } from './config.js';
const files = {'/':['index.html','text/html'], '/build/app.js':['build/app.js','text/javascript'], '/style.css':['style.css','text/css']};
let config;
try { config = getConfig(process.env); }
catch (error) { console.error(error.message); process.exit(1); }
const csp = `default-src 'self'; connect-src 'self'${config.mode === 'cloud' ? ' '+config.url : ''}; style-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'`;
const server = http.createServer(async (req,res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  const headers = {'X-Content-Type-Options':'nosniff','Content-Security-Policy':csp,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'};
  if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
  if (path === '/config.json' || path === '/health') {
    const body = JSON.stringify(path === '/health' ? {status:'ok', mode:config.mode} : config);
    res.writeHead(200, {...headers, 'Content-Type':'application/json; charset=utf-8'}); res.end(req.method === 'HEAD' ? undefined : body); return;
  }
  const file = files[path];
  if (!file) { res.writeHead(404); res.end('Não encontrado'); return; }
  try {
    const body = await readFile(new URL(`./public/${file[0]}`,import.meta.url));
    res.writeHead(200,{...headers, 'Content-Type':`${file[1]}; charset=utf-8`}); res.end(req.method === 'HEAD' ? undefined : body);
  } catch {res.writeHead(500); res.end('Não foi possível carregar a página. Execute npm run build.');}
});
server.listen(Number(process.env.PORT || 3000),process.env.HOST || (config.mode === 'cloud' ? '0.0.0.0' : '127.0.0.1'), () => console.log('Minhas Finanças iniciado na porta', server.address().port, '— modo', config.mode));
