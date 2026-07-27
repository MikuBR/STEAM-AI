const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const replacement = `if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Quota')) {
          res.status(429).json({ error: "O limite de uso da API corporativa do Gemini foi excedido. Por favor, acesse as configurações (ícone de engrenagem no menu) e insira sua própria chave de API do Gemini para continuar." });
        } else {
          res.status(500).json({ error: "Ocorreu um erro ao gerar recomendações. Tente novamente mais tarde." });
        }`;

content = content.replace(/res.status\(500\)\.json\(\{ error: "Ocorreu um erro ao gerar recomendações\. Tente novamente mais tarde\." \}\);/g, replacement);

fs.writeFileSync('server.ts', content);
