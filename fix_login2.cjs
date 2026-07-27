const fs = require('fs');
let content = fs.readFileSync('src/components/Login.tsx', 'utf8');

const target = `<div className="hidden">            <div className="relative rounded-xl overflow-hidden shadow-md shadow-[#3E2723]/10">`;

content = content.replace('<div className="hidden">            <div className="relative rounded-xl overflow-hidden shadow-md shadow-[#3E2723]/10">', '<div className="relative rounded-xl overflow-hidden shadow-md shadow-[#3E2723]/10">');
fs.writeFileSync('src/components/Login.tsx', content);
