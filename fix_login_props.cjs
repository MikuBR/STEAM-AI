const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const targetApp = `  const handleLogin = () => {`;
const goodApp = `  const handleMockLogin = () => {
    localStorage.setItem('steam_auth_token', 'mock_token');
    checkAuth();
  };

  const handleLogin = () => {`;

app = app.replace(targetApp, goodApp);
app = app.replace('<Login onLogin={handleLogin} />', '<Login onLogin={handleLogin} onMockLogin={handleMockLogin} />');

fs.writeFileSync('src/App.tsx', app);

let login = fs.readFileSync('src/components/Login.tsx', 'utf8');

const targetLoginProps = `interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {`;

const goodLoginProps = `interface LoginProps {
  onLogin: () => void;
  onMockLogin?: () => void;
}

export default function Login({ onLogin, onMockLogin }: LoginProps) {`;

login = login.replace(targetLoginProps, goodLoginProps);

const targetLoginBtn = `          <button
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
          </button>`;

const goodLoginBtn = `          <div className="flex flex-col gap-3">
            <button
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

            {onMockLogin && (
              <button
                onClick={onMockLogin}
                className="w-full py-2.5 px-4 bg-[#FAF6F0] hover:bg-[#EAE2D8] border border-[#CD853F]/30 text-[#8B4513] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <Gamepad2 className="w-4 h-4" />
                Testar sem Steam (Modo Visitante)
              </button>
            )}
          </div>`;

login = login.replace(targetLoginBtn, goodLoginBtn);
fs.writeFileSync('src/components/Login.tsx', login);

