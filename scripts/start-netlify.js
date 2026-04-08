const fs = require('fs');
const path = require('path');
const http = require('http');
const { URL } = require('url');
const { loadEnvFile } = require('./load-env');

const projectRoot = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 8888);

loadEnvFile(projectRoot);

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

function send(res, statusCode, body, headers = {}) {
  const finalHeaders = { ...headers };
  const contentTypeKey = Object.keys(finalHeaders).find((key) => key.toLowerCase() === 'content-type');

  if (!contentTypeKey && typeof body === 'string' && (body.startsWith('{') || body.startsWith('['))) {
    finalHeaders['Content-Type'] = 'application/json; charset=utf-8';
  } else if (contentTypeKey && /application\/json/i.test(finalHeaders[contentTypeKey]) && !/charset=/i.test(finalHeaders[contentTypeKey])) {
    finalHeaders[contentTypeKey] = `${finalHeaders[contentTypeKey]}; charset=utf-8`;
  }

  res.writeHead(statusCode, finalHeaders);
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function getStaticPath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split('?')[0]);
  const relativePath = cleanPath === '/' ? '/index.html' : cleanPath;
  const normalized = path.normalize(relativePath).replace(/^(\.\.[\\/])+/, '');
  return path.join(projectRoot, normalized);
}

async function serveStatic(req, res, urlPath) {
  const filePath = getStaticPath(urlPath);

  if (!filePath.startsWith(projectRoot)) {
    send(res, 403, 'Forbidden');
    return;
  }

  try {
    const stat = fs.statSync(filePath);
    const finalPath = stat.isDirectory() ? path.join(filePath, 'index.html') : filePath;
    const ext = path.extname(finalPath).toLowerCase();
    const data = fs.readFileSync(finalPath);

    send(res, 200, data, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
  } catch (error) {
    send(res, 404, 'Not Found');
  }
}

async function serveFunction(req, res, requestUrl) {
  const functionName = requestUrl.pathname.replace('/.netlify/functions/', '');
  const functionsRoot = path.join(projectRoot, 'netlify', 'functions');
  const functionPath = path.join(functionsRoot, `${functionName}.js`);

  if (!functionPath.startsWith(functionsRoot)) {
    send(res, 403, 'Forbidden');
    return;
  }

  if (!fs.existsSync(functionPath)) {
    send(res, 404, JSON.stringify({ error: 'Function not found' }), {
      'Content-Type': 'application/json; charset=utf-8'
    });
    return;
  }

  try {
    delete require.cache[require.resolve(functionPath)];
    const mod = require(functionPath);

    if (typeof mod.handler !== 'function') {
      send(res, 500, JSON.stringify({ error: 'Invalid function module' }), {
        'Content-Type': 'application/json; charset=utf-8'
      });
      return;
    }

    const body = await readBody(req);
    const queryStringParameters = {};
    requestUrl.searchParams.forEach((value, key) => {
      queryStringParameters[key] = value;
    });

    const event = {
      httpMethod: req.method,
      headers: req.headers,
      body,
      path: requestUrl.pathname,
      rawUrl: requestUrl.toString(),
      queryStringParameters
    };

    const result = await mod.handler(event, {});
    send(res, result?.statusCode || 200, result?.body || '', result?.headers || {});
  } catch (error) {
    console.error(`Function error in ${functionName}:`, error);
    send(res, 500, JSON.stringify({ error: 'Local function error', details: error.message }), {
      'Content-Type': 'application/json; charset=utf-8'
    });
  }
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || `localhost:${port}`}`);

  if (requestUrl.pathname.startsWith('/.netlify/functions/')) {
    await serveFunction(req, res, requestUrl);
    return;
  }

  await serveStatic(req, res, requestUrl.pathname);
});

server.listen(port, () => {
  console.log(`Local dev server running at http://localhost:${port}`);
});
