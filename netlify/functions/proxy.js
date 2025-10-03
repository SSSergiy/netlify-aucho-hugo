const fetch = require('node-fetch');

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') { /* ... код для CORS ... */ }

  // ... остальной код ...
  const repo = 'SSSergiy/netlify-anchor-hugo'; // <-- ТВОЙ НОВЫЙ РЕПОЗИТОРИЙ
  // ... остальной код ...
};