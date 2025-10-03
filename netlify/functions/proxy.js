const fetch = require('node-fetch');

exports.handler = async function(event) {
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

  // --- ШАГ 1: Проверка "пропуска" от Auth0 (ВРЕМЕННО ОТКЛЮЧЕНА) ---
  // const authHeader = event.headers.authorization;
  // if (!authHeader || !authHeader.startsWith('Bearer ')) {
  //   return { statusCode: 401, body: 'Missing Authorization Header' };
  // }
  
  // --- ШАГ 2: Работа с GitHub ---
  const GITHUB_PAT = process.env.GITHUB_PAT;
  const path = event.queryStringParameters.path;
  const repo = 'SSSergiy/netlify-aucho-hugo'; // Убедись, что имя правильное
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