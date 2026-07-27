import { motion } from "motion/react";
import { Coffee, Library, Heart, Sparkles, Gamepad2 } from "lucide-react";

interface LoginProps {
  onLogin: () => void;
  onMockLogin?: () => void;
}

export default function Login({ onLogin, onMockLogin }: LoginProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF6F0] text-[#3E2723] p-6 relative overflow-hidden font-sans">
      {/* Decorative Warm Coffee Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(160,82,45,0.03),transparent_70%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#CD853F]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-[#A0522D]/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full text-center space-y-8 relative z-10"
      >
        <div className="flex flex-col items-center">
          {/* Steaming Coffee Cup Icon Container */}
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-[#A0522D] via-[#CD853F] to-[#D2691E] rounded-full blur-lg opacity-20 group-hover:opacity-40 transition duration-1000" />
            <div className="relative w-24 h-24 bg-[#FFFDF9] rounded-full flex items-center justify-center border border-[#EAE2D8] shadow-lg shadow-[#3E2723]/5">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
                className="absolute inset-1.5 border border-dashed border-[#CD853F]/20 rounded-full"
              />
              <Coffee className="w-9 h-9 text-[#8B4513] group-hover:text-[#A0522D] transition-colors duration-300 relative z-10 animate-bounce" style={{ animationDuration: '3s' }} />
              
              {/* Hot coffee steam bubble */}
              <span className="absolute bottom-2 right-2 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#CD853F] opacity-40"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#8B4513]"></span>
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#8B4513]/5 text-[#8B4513] border border-[#8B4513]/10 text-[11px] font-bold tracking-wider uppercase font-sans">
            <Sparkles className="w-3.5 h-3.5 text-[#CD853F] animate-pulse" />
            Seu Cantinho de Café & Jogos ☕
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#2C1B14] font-serif">
            Steam Synapse
          </h1>
          <p className="text-[#6D5C54] max-w-sm mx-auto text-sm leading-relaxed font-medium">
            Sincronize sua conta Steam, puxe uma cadeira confortável e relaxe. Nosso barista de IA vai preparar as melhores sugestões para sua tarde de jogatina.
          </p>
        </div>

        <div className="bg-[#FFFDF9] p-8 rounded-[32px] border border-[#EAE2D8] space-y-6 shadow-xl shadow-[#3E2723]/4 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#FAF6F0] border border-[#EAE2D8] rounded-full text-[10px] text-[#8B4513] font-bold flex items-center gap-1.5 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#CD853F] animate-pulse" />
            Cafeteria Aberta 🍂
          </div>

          {/* Cozy Cafe Introduction */}
          <div className="bg-[#FAF6F0] border border-[#EAE2D8] rounded-2xl p-4 text-xs text-left text-[#5C4D45] leading-relaxed font-medium">
            <span className="text-[#8B4513] font-extrabold block mb-1 uppercase tracking-wide">Menu do Dia:</span>
            "Bem-vindo ao seu refúgio gamer! Esqueça a pressa do dia a dia. Aqui, nós moemos sua biblioteca de jogos para extrair as melhores recomendações com aroma de nostalgia e novidade. Aceita uma xícara?"
          </div>
          
          <div className="flex flex-col gap-3">
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
          </div>
          
          <div className="text-center mt-3 bg-amber-50/50 p-3 rounded-xl border border-amber-200/50">
            <p className="text-[10px] text-amber-800 font-medium">
              ⚠️ <strong>Usuários de Firefox/Safari:</strong> O popup pode ser bloqueado pelas proteções de rastreamento do navegador. Se isso ocorrer, desative o "Escudo" para o site ou <strong>abra o site em uma nova guia completa</strong> ao invés de iframe.
            </p>
          </div>
          
          <div className="pt-4 border-t border-[#F2EDE4] grid grid-cols-2 gap-4 text-left">
            <div className="space-y-1">
              <span className="text-[11px] uppercase font-bold text-[#8B4513] flex items-center gap-1">
                <Library className="w-3.5 h-3.5 text-[#CD853F]" />
                Biblioteca Cozy
              </span>
              <p className="text-[11px] text-[#8D7B70] leading-normal font-medium">
                Adicione jogos manuais de consoles ou launchers alternativos com total persistência local.
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] uppercase font-bold text-[#D2691E] flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-[#D2691E]" />
                Conexão Segura
              </span>
              <p className="text-[11px] text-[#8D7B70] leading-normal font-medium">
                Autenticação direta oficial Steam OpenID. Seus dados lidos com privacidade e sem complicações.
              </p>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
