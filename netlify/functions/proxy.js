const fetch = require('node-fetch');
const { verify } = require('@tsndr/cloudflare-worker-jwt');

exports.handler = async function(event, context) {
  // CORS Preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    };
  }
  
  // --- ШАГ 1: Проверка "пропуска" от Auth0 ---
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { statusCode: 401, body: 'Missing Authorization Header' };
  }
  const token = authHeader.split(' ')[1];

  const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
  if (!AUTH0_DOMAIN) {
      return { statusCode: 500, body: 'Server Error: AUTH0_DOMAIN is not configured.' };
  }

  try {
    const isValid = await verify(token, `https://${AUTH0_DOMAIN}/.well-known/jwks.json`);
    if (!isValid) {
      return { statusCode: 401, body: 'Invalid Auth0 Token' };
    }
  } catch (err) {
    return { statusCode: 401, body: `Token verification error: ${err.message}` };
  }
  
  // --- ШАГ 2: Работа с GitHub ---
  const GITHUB_PAT = process.env.GITHUB_PAT;
  if (!GITHUB_PAT) {
    return { statusCode: 500, body: 'Server Error: GITHUB_PAT is not configured.' };
  }
  
  const path = event.queryStringParameters.path;
  if (!path) {
    return { statusCode: 400, body: 'Missing "path" parameter in request.' };
  }
  
  // ↓↓↓ ЗАМЕНИ НА ПРАВИЛЬНОЕ ИМЯ ТВОЕГО РЕПОЗИТОРИЯ ↓↓↓
  const repo = 'SSSergiy/netlify-aucho-hugo'; 
  const url = `https://api.github.com/repos/${repo}/contents/${path.replace(/^\//, '')}`;

  try {
    const response = await fetch(url, {
      method: event.httpMethod,
      headers: {
        'Authorization': `token ${GITHUB_PAT}`,
        'User-Agent': 'DecapCMS-Proxy-Netlify',
      },
      body: event.body,
    });
    
    const data = await response.text();

    return {
      statusCode: response.status,
      body: data,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: `Failed to fetch from GitHub: ${error.message}` }),
    };
  }
};