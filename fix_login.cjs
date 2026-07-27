const fs = require('fs');
let content = fs.readFileSync('src/components/Login.tsx', 'utf8');

const target = `<button
            onClick={onLogin}
            className="w-full flex items-center justify-center hover:opacity-95 transition-all active:scale-[0.98] duration-150 group"
          >`;

const replacement = `<button
            onClick={onLogin}
            className="w-full flex items-center justify-center hover:opacity-95 transition-all active:scale-[0.98] duration-150 group"
          >
            <div className="relative rounded-xl overflow-hidden shadow-md shadow-[#3E2723]/10">
              <img 
                src="https://community.akamai.steamstatic.com/public/images/signinthroughsteam/sits_02.png" 
                alt="Entrar com a Steam"
                className="group-hover:shadow-[0_0_20px_rgba(139,69,19,0.15)] rounded-lg transition-all duration-300"
              />
            </div>
          </button>
          
          <div className="text-center mt-3 bg-amber-50/50 p-2 rounded-xl border border-amber-200/50">
            <p className="text-[10px] text-amber-800 font-medium">
              ⚠️ Se o login não abrir (comum no Firefox), tente <strong>clicar com o botão direito</strong> e abrir o aplicativo em uma nova guia, ou desative a proteção de rastreamento (escudo do navegador) para esta página.
            </p>
          </div>
          
          <div className="hidden">`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/Login.tsx', content);
