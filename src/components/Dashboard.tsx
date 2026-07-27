import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Loader2, 
  Gamepad2, 
  LogOut, 
  ChevronRight, 
  History, 
  Settings, 
  Key, 
  AlertTriangle, 
  Music, 
  Search, 
  Plus, 
  Volume2, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Clock, 
  Compass, 
  Layers,
  Database,
  Crown,
  Play,
  Pause,
  Download,
  Upload,
  Coffee
} from "lucide-react";
import GameCard from './GameCard';

interface User {
  id: string;
  displayName: string;
  photos: { value: string }[];
}

interface Game {
  appid: number;
  name: string;
  playtime_forever: number; // in minutes
  img_icon_url: string;
  playtime_2weeks?: number;
  isManual?: boolean;
}

interface Recommendation {
  name: string;
  reason: string;
  genres: string[];
  estimatedMatch: number;
  appId?: number;
}

export default function Dashboard({ user }: { user: User }) {
  // Primary States
  const [ownedGames, setOwnedGames] = useState<Game[]>([]);
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [discardedRecommendations, setDiscardedRecommendations] = useState<Recommendation[]>([]);
  
  // Tab configuration
  const [activeTab, setActiveTab] = useState<'recommendations' | 'library' | 'manual' | 'discarded' | 'cozy_space'>('recommendations');
  
  // Cozy audio tracks configurations
  const cozyTracks = [
    { name: "Café de Canela (Jazzy Lofi)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", desc: "Batidas suaves com notas de saxofone para acompanhar um macchiato de caramelo e farmar itens de boa." },
    { name: "Chuva na Cabana (Soft Rhodes)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", desc: "Clima chuvoso lá fora, mas o teclado elétrico te aquece por dentro. Perfeito para jogos narrativos e point-n-click." },
    { name: "Fogo na Lareira (Acoustic Chord)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", desc: "Violão acústico amadeirado. Aquele som gostoso de taverna para planejar a próxima dungeon tomando um capuccino." },
    { name: "Estrela Guia (Ambient Synth)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", desc: "Sintetizadores etéreos e espaciais. A trilha ideal para extrair o máximo de foco numa estratégia sci-fi." }
  ];

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [musicVolume, setMusicVolume] = useState(0.25);
  const [isRainPlaying, setIsRainPlaying] = useState(false);
  const [rainVolume, setRainVolume] = useState(0.12);

  // Audio refs
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const rainAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(localStorage.getItem('custom_gemini_api_key') || '');
  const [isProfilePrivate, setIsProfilePrivate] = useState(false);
  const [prefsMoreOf, setPrefsMoreOf] = useState('');
  const [prefsLessOf, setPrefsLessOf] = useState('');
  const [generationError, setGenerationError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [librarySearchFilter, setLibrarySearchFilter] = useState('');
  const [manualLibrarySearchFilter, setManualLibrarySearchFilter] = useState('');

  // Manual Games Persistence State
  const [manualGames, setManualGames] = useState<Game[]>(() => {
    try {
      const saved = localStorage.getItem('manual_games');
      return saved && saved !== 'undefined' ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse manual_games from localStorage", e);
      return [];
    }
  });

  // Manual game form input states
  const [manualGameName, setManualGameName] = useState('');
  const [manualGameHours, setManualGameHours] = useState('');
  const [manualAppId, setManualAppId] = useState<number | undefined>(undefined);
  const [isSearchingManual, setIsSearchingManual] = useState(false);
  const [manualSearchResults, setManualSearchResults] = useState<any[]>([]);
  const [manualSearchQuery, setManualSearchQuery] = useState('');

  // Backup & Import States
  const [backupString, setBackupString] = useState('');
  const [showBackupAlert, setShowBackupAlert] = useState(false);
  const [backupAlertMsg, setBackupAlertMsg] = useState('');

  // Save manual games to localStorage and server replica
  const saveManualGamesToServer = async (games: Game[]) => {
    try {
      const token = localStorage.getItem('steam_auth_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch('/api/steam/manual-games', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ games })
      });
    } catch (err) {
      console.error("Failed to save manual games replica to server:", err);
    }
  };

  useEffect(() => {
    localStorage.setItem('manual_games', JSON.stringify(manualGames));
    saveManualGamesToServer(manualGames);
  }, [manualGames]);

  // Cozy Space audio controller hooks
  useEffect(() => {
    if (!musicAudioRef.current) {
      musicAudioRef.current = new Audio(cozyTracks[currentTrackIdx].url);
      musicAudioRef.current.loop = true;
    } else {
      musicAudioRef.current.src = cozyTracks[currentTrackIdx].url;
    }
    musicAudioRef.current.volume = musicVolume;
    
    if (isPlaying) {
      musicAudioRef.current.play().catch(err => console.log("Audio play error:", err));
    } else {
      musicAudioRef.current.pause();
    }
  }, [currentTrackIdx]);

  useEffect(() => {
    if (musicAudioRef.current) {
      if (isPlaying) {
        musicAudioRef.current.play().catch(err => console.log("Audio play error:", err));
      } else {
        musicAudioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (musicAudioRef.current) {
      musicAudioRef.current.volume = musicVolume;
    }
  }, [musicVolume]);

  useEffect(() => {
    if (!rainAudioRef.current) {
      rainAudioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2433/2433-84.wav");
      rainAudioRef.current.loop = true;
    }
    rainAudioRef.current.volume = rainVolume;

    if (isRainPlaying) {
      rainAudioRef.current.play().catch(err => console.log("Rain play error:", err));
    } else {
      rainAudioRef.current.pause();
    }
  }, [isRainPlaying]);

  useEffect(() => {
    if (rainAudioRef.current) {
      rainAudioRef.current.volume = rainVolume;
    }
  }, [rainVolume]);

  useEffect(() => {
    return () => {
      if (musicAudioRef.current) {
        musicAudioRef.current.pause();
        musicAudioRef.current = null;
      }
      if (rainAudioRef.current) {
        rainAudioRef.current.pause();
        rainAudioRef.current = null;
      }
    };
  }, []);

  // Synchronize manual games from server on mount (safe merging, never overwriting if server is empty but client has games)
  useEffect(() => {
    async function fetchManualGames() {
      try {
        const token = localStorage.getItem('steam_auth_token');
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/steam/manual-games', { headers, credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const serverGames = data.games || [];
          
          if (serverGames.length > 0) {
            setManualGames(prevLocal => {
              const merged = [...serverGames];
              prevLocal.forEach(localGame => {
                const exists = merged.some(g => g.appid === localGame.appid || g.name.toLowerCase() === (localGame.name || '').toLowerCase());
                if (!exists) {
                  merged.push({ ...localGame, isManual: true });
                }
              });
              
              if (merged.length !== serverGames.length) {
                saveManualGamesToServer(merged);
              }
              return merged;
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch manual games from server replica:", err);
      }
    }
    fetchManualGames();
  }, []);

  // Fetch Steam Library
  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem('steam_auth_token');
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const [ownedRes, recentRes] = await Promise.all([
          fetch('/api/steam/owned-games', { headers, credentials: 'include' }),
          fetch('/api/steam/recent-games', { headers, credentials: 'include' })
        ]);
        
        const ownedData = await ownedRes.json();
        const recentData = await recentRes.json();
        
        if (ownedData.error || recentData.error) {
          console.error("Steam API error:", ownedData.error || recentData.error);
        }
        
        const owned = ownedData.games || [];
        const recent = recentData.games || [];
        
        setOwnedGames(owned);
        setRecentGames(recent);

        if (!ownedData.error && !recentData.error && typeof ownedData.game_count === 'undefined' && owned.length === 0) {
          setIsProfilePrivate(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSaveApiKey = (key: string) => {
    setCustomApiKey(key);
    if (key) {
      localStorage.setItem('custom_gemini_api_key', key);
    } else {
      localStorage.removeItem('custom_gemini_api_key');
    }
  };

  // Generate recommendations merging Steam and manual library
  const generateRecommendations = async () => {
    setGenerating(true);
    setGenerationError('');
    try {
      const token = localStorage.getItem('steam_auth_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const combinedLibrary = [...manualGames, ...ownedGames];

      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          ownedGames: combinedLibrary.slice(0, 50), 
          recentGames: recentGames,
          customGeminiKey: customApiKey || undefined,
          preferences: {
            moreOf: prefsMoreOf,
            lessOf: prefsLessOf
          }
        })
      });
      const data = await res.json();
      if (res.ok) {
        setRecommendations(data.recommendations || []);
        setGenerationError('');
      } else {
        setGenerationError(data.error || 'Ocorreu um erro ao gerar recomendações.');
      }
    } catch (err) {
      console.error(err);
      setGenerationError('Erro de conexão ao gerar recomendações.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDiscard = (index: number) => {
    const item = recommendations[index];
    if (!item) return;

    setRecommendations(prev => prev.filter((_, i) => i !== index));
    setDiscardedRecommendations(prev => {
      if (prev.some(x => x.name === item.name)) return prev;
      return [...prev, item];
    });
  };

  const handleRestore = (index: number) => {
    const item = discardedRecommendations[index];
    if (!item) return;

    setDiscardedRecommendations(prev => prev.filter((_, i) => i !== index));
    setRecommendations(prev => {
      if (prev.some(x => x.name === item.name)) return prev;
      return [...prev, item];
    });
  };

  const handleSearchGames = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/search-games?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  // Add Steam game to own library (Steam search addition)
  const handleAddGame = (app: any) => {
    const exists = manualGames.some(g => g.appid === app.id || g.name.toLowerCase() === (app.name || '').toLowerCase());
    if (!exists) {
      const newGame: Game = {
        appid: app.id,
        name: app.name,
        playtime_forever: 0,
        img_icon_url: '',
        isManual: true
      };
      setManualGames(prev => [newGame, ...prev]);
    }
    setSearchQuery('');
    setSearchResults([]);
    setActiveTab('manual');
  };

  // Manual Addition Controls
  const handleSearchManualGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSearchQuery) return;
    setIsSearchingManual(true);
    try {
      const res = await fetch(`/api/search-games?q=${encodeURIComponent(manualSearchQuery)}`);
      const data = await res.json();
      setManualSearchResults(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingManual(false);
    }
  };

  const handleSelectManualSearchResult = (app: any) => {
    setManualGameName(app.name);
    setManualAppId(app.id);
    setManualSearchResults([]);
    setManualSearchQuery('');
  };

  const handleAddManualGameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualGameName) return;

    const hours = parseFloat(manualGameHours) || 0;
    const playtime_forever = Math.round(hours * 60);

    const exists = manualGames.some(g => 
      g.name.toLowerCase() === (manualGameName || '').toLowerCase() || 
      (manualAppId && g.appid === manualAppId)
    );

    if (exists) {
      triggerBackupAlert('Este grão de café (jogo) já está na sua estante manual!');
      return;
    }

    const newGame: Game = {
      appid: manualAppId || Math.floor(Math.random() * -1000000), // unique negative key
      name: manualGameName,
      playtime_forever,
      img_icon_url: '',
      isManual: true
    };

    setManualGames(prev => [newGame, ...prev]);
    
    // Clear fields
    setManualGameName('');
    setManualGameHours('');
    setManualAppId(undefined);
  };

  const handleRemoveManualGame = (idOrName: number | string) => {
    setManualGames(prev => prev.filter(g => g.appid !== idOrName && g.name !== idOrName));
  };

  const handleEditManualPlaytime = (idOrName: number | string, minutes: number) => {
    setManualGames(prev => prev.map(g => {
      if (g.appid === idOrName || g.name === idOrName) {
        return { ...g, playtime_forever: minutes };
      }
      return g;
    }));
  };

  const triggerBackupAlert = (msg: string) => {
    setBackupAlertMsg(msg);
    setShowBackupAlert(true);
    setTimeout(() => setShowBackupAlert(false), 5000);
  };

  // --- COFFEE COFRE: EXPORT & IMPORT BACKUP CONTROLS ---
  const handleExportBackup = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(manualGames, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `cofre_cafeteria_backup.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      triggerBackupAlert("Backup de grãos baixado com sucesso! Guarde-o com amor ☕💾");
    } catch (e) {
      triggerBackupAlert("Erro ao torrar seu arquivo de backup.");
    }
  };

  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            setManualGames(prev => {
              const merged = [...prev];
              parsed.forEach(game => {
                if (game.name) {
                  const exists = merged.some(g => g.appid === game.appid || g.name.toLowerCase() === (game.name || '').toLowerCase());
                  if (!exists) {
                    merged.push({
                      appid: game.appid || Math.floor(Math.random() * -1000000),
                      name: game.name,
                      playtime_forever: game.playtime_forever || 0,
                      img_icon_url: game.img_icon_url || '',
                      isManual: true
                    });
                  }
                }
              });
              return merged;
            });
            triggerBackupAlert("Grãos de backup moídos e importados! Seus dados foram restaurados ☕📂");
          } else {
            triggerBackupAlert("O arquivo de backup não parece um blend válido de jogos.");
          }
        } catch (err) {
          triggerBackupAlert("Erro ao ler as notas de sabor desse backup. Arquivo corrompido?");
        }
      };
    }
  };

  // Helper metrics
  const combinedTotalGames = ownedGames.length + manualGames.length;
  const totalPlaytimeMinutes = ownedGames.reduce((acc, g) => acc + g.playtime_forever, 0) + 
                               manualGames.reduce((acc, g) => acc + g.playtime_forever, 0);
  const totalPlaytimeHours = Math.round(totalPlaytimeMinutes / 60);
  
  const recentPlaytimeHours = (recentGames.reduce((acc, g) => acc + (g.playtime_2weeks || 0), 0) / 60).toFixed(1);

  // Dynamic coffee shop announcements
  const getCoreMessage = () => {
    if (generating) {
      return "Passando a água no filtro de papel e moendo grãos de ideias... Sintonizando as notas de aroma com o Google Gemini. Espere só um tiquinho!";
    }
    if (generationError) {
      return `Xiii! A prensa francesa deu uma travada: "${generationError}". Adicione um pouquinho de água quente (recarregue) ou tente de novo!`;
    }
    if (recommendations.length > 0) {
      return `Café servido com sucesso! Sintonizamos ${recommendations.length} jogos quentinhos perfeitos para o seu paladar gamer hoje. Aproveite cada gole!`;
    }
    if (combinedTotalGames === 0) {
      return "Sua xícara está vazia! Como sua conta Steam é reservada ou privada, adicione alguns grãos jogados na aba 'Adicionados Manuais' para podermos passar o seu blend!";
    }
    return `Moedor pronto! Temos ${combinedTotalGames} jogos na sua estante de aromas (sendo ${manualGames.length} grãos manuais). Ajuste o tom e peça sua recomendação!`;
  };

  // Dynamic Coffee-Gamer Archetypes - Highly funny & personalized!
  const getGamerArchetype = () => {
    const allGames = [...ownedGames, ...manualGames];
    if (allGames.length === 0) {
      return {
        title: "Água Quente sem Grão (A xícara vazia)",
        description: "Sua caneca está vazia! Adicione alguns jogos manualmente ou torne sua conta Steam pública para que nosso barista decifre suas notas de sabor.",
        metrics: { focus: 25, tactic: 25, explore: 25, cozy: 25 },
        colorClass: "from-[#8B4513] via-[#A0522D] to-[#CD853F]",
        accentText: "text-[#8B4513]"
      };
    }

    let rpgFocus = 0;
    let strategyTactics = 0;
    let actionAdventure = 0;
    let cozyCasual = 0;

    allGames.forEach(game => {
      const name = (game.name || '').toLowerCase();
      const weight = Math.max(1, Math.log10(game.playtime_forever / 60 || 1) * 2.5);

      if (name.includes("elden") || name.includes("ring") || name.includes("souls") || name.includes("witcher") || name.includes("scrolls") || name.includes("skyrim") || name.includes("fantasy") || name.includes("cyberpunk") || name.includes("rpg") || name.includes("dragon") || name.includes("monster") || name.includes("persona") || name.includes("fallout") || name.includes("baldurs") || name.includes("gate") || name.includes("final") || name.includes("diablo")) {
        rpgFocus += 10 * weight;
      }
      if (name.includes("civilization") || name.includes("total war") || name.includes("crusader") || name.includes("hearts of") || name.includes("age of") || name.includes("starcraft") || name.includes("dota") || name.includes("league") || name.includes("tactics") || name.includes("chess") || name.includes("manager") || name.includes("sim") || name.includes("tycoon") || name.includes("factorio") || name.includes("cities") || name.includes("rimworld")) {
        strategyTactics += 10 * weight;
      }
      if (name.includes("counter") || name.includes("strike") || name.includes("cs:") || name.includes("call of") || name.includes("duty") || name.includes("halo") || name.includes("doom") || name.includes("borderlands") || name.includes("grand theft") || name.includes("gta") || name.includes("resident") || name.includes("evil") || name.includes("dead") || name.includes("hades") || name.includes("dead cells") || name.includes("cyber") || name.includes("combat") || name.includes("battlefield") || name.includes("apex") || name.includes("fortnite")) {
        actionAdventure += 10 * weight;
      }
      if (name.includes("stardew") || name.includes("valley") || name.includes("animal") || name.includes("crossing") || name.includes("minecraft") || name.includes("terrar") || name.includes("cozy") || name.includes("sims") || name.includes("lego") || name.includes("overcooked") || name.includes("fall guys") || name.includes("subnautica") || name.includes("portal") || name.includes("slay the spire") || name.includes("farm") || name.includes("harvest") || name.includes("slime")) {
        cozyCasual += 10 * weight;
      }
    });

    const totalPoints = rpgFocus + strategyTactics + actionAdventure + cozyCasual;
    
    let rPct = 25, sPct = 25, aPct = 25, cPct = 25;
    if (totalPoints > 0) {
      rPct = Math.round((rpgFocus / totalPoints) * 100);
      sPct = Math.round((strategyTactics / totalPoints) * 100);
      aPct = Math.round((actionAdventure / totalPoints) * 100);
      cPct = Math.round((cozyCasual / totalPoints) * 100);
    }

    const maxVal = Math.max(rPct, sPct, aPct, cPct);

    if (maxVal === rPct) {
      return {
        title: "Blend Arábica Épico (Espresso RPG Duplo) ☕⚔️",
        description: "Você passa 45 minutos lendo a embalagem do grão e decidindo a proporção exata de água só pra dar um gole. Mergulha fundo na lore da fazenda. Prefere uma torra incrivelmente rica, com notas místicas de dragões e 300 horas de degustação (side-quests) antes da missão principal.",
        metrics: { focus: rPct, tactic: sPct, explore: aPct, cozy: cPct },
        colorClass: "from-[#8B4513] via-[#D2691E] to-[#CD853F]",
        accentText: "text-[#8B4513]"
      };
    } else if (maxVal === sPct) {
      return {
        title: "Moagem Fina Tática (Prensa Francesa Metódica) ⏳🧠",
        description: "Sua xícara é calculada na balança de precisão. Se cair 1 grama a mais de açúcar, você reinicia todo o save da logística. Gosta de café que exige paciência, gerenciamento rigoroso de recursos e a satisfação ímpar de ver seu império funcionar em perfeita harmonia matemática.",
        metrics: { focus: rPct, tactic: sPct, explore: aPct, cozy: cPct },
        colorClass: "from-[#2C1B14] via-[#5C4D45] to-[#8B4513]",
        accentText: "text-[#5C4D45]"
      };
    } else if (maxVal === aPct) {
      return {
        title: "Torra Extra-Forte Termogênica (Café Sem Açúcar 500ml) ⚡🔥",
        description: "Você não quer relaxar, você quer o soco puro e cru da cafeína! Seu coração bate a 190 bpm enquanto desvia de tiros e executa combos frenéticos. Café frio? Sem problema, você bebe correndo pelos corredores enquanto rusha o Ponto B.",
        metrics: { focus: rPct, tactic: sPct, explore: aPct, cozy: cPct },
        colorClass: "from-[#B15310] via-[#D2691E] to-[#8B4513]",
        accentText: "text-[#D2691E]"
      };
    } else {
      return {
        title: "Cappuccino de Gatinho com Espuma (Zen Cozy) 🌸🐱",
        description: "Você joga enrolado no edredom, bebericando uma espuma doce de leite com canela e muito marshmallow. Planta batatas virtuais, decora casinhas e faz carinho em todos os cachorros pixelados. Se a música ficar minimamente tensa, você pausa, respira e vai fazer um chazinho.",
        metrics: { focus: rPct, tactic: sPct, explore: aPct, cozy: cPct },
        colorClass: "from-[#CD853F] via-[#E6C29D] to-[#FAF6F0]",
        accentText: "text-[#CD853F]"
      };
    }
  };

  const archetype = getGamerArchetype();

  const steamLibraryGames = ownedGames.map(g => ({ ...g, isManual: false }));

  const filteredLibraryGames = steamLibraryGames.filter(game => 
    (game.name || '').toLowerCase().includes((librarySearchFilter || '').toLowerCase())
  );

  const filteredManualGames = manualGames.filter(game => 
    (game.name || '').toLowerCase().includes((manualLibrarySearchFilter || '').toLowerCase())
  );

  const handleLogout = () => {
    localStorage.removeItem('steam_auth_token');
    window.location.href = '/api/auth/logout';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-[#CD853F] border-t-transparent rounded-full animate-spin" />
          <Coffee className="w-6 h-6 text-[#8B4513] absolute animate-bounce" />
        </div>
        <p className="text-[#8B4513] font-bold text-sm tracking-wide animate-pulse">Servindo as mesas, passando o café e abrindo o sistema... ☕✨</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#2C1B14] font-sans pb-16 relative">
      {/* Decorative Warm Coffee Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,69,19,0.02),transparent_70%)] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#CD853F]/5 via-[#A0522D]/5 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#D2691E]/5 via-[#FAF6F0] to-transparent rounded-full blur-[120px] pointer-events-none" />

      {/* Floating Cofre Alert Toast */}
      <AnimatePresence>
        {showBackupAlert && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm bg-[#FFFDF9] border border-[#CD853F] p-4 rounded-2xl shadow-xl flex items-center gap-3"
          >
            <Coffee className="w-6 h-6 text-[#8B4513] shrink-0" />
            <p className="text-xs font-bold text-[#3E2723]">{backupAlertMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header */}
      <header className="border-b border-[#EAE2D8] bg-[#FFFDF9]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-tr from-[#8B4513] via-[#D2691E] to-[#CD853F] rounded-xl flex items-center justify-center shadow-md">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-[#2C1B14] font-serif">
                Steam Synapse
              </h1>
              <p className="text-[10px] text-[#8B4513] font-bold uppercase tracking-wider -mt-0.5">Canto Confortável de Curadoria ☕</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Profile */}
            <div className="flex items-center gap-2.5 bg-[#FAF6F0] border border-[#EAE2D8] px-3.5 py-1.5 rounded-full">
              {user.photos && user.photos[0] ? (
                <img src={user.photos[0].value} alt={user.displayName} className="w-5.5 h-5.5 rounded-full border border-[#EAE2D8]" />
              ) : (
                <div className="w-5.5 h-5.5 rounded-full bg-[#CD853F]/10 flex items-center justify-center">
                  <Gamepad2 className="w-3.5 h-3.5 text-[#CD853F]" />
                </div>
              )}
              <span className="text-xs font-bold text-[#3E2723] hidden sm:inline">{user.displayName}</span>
            </div>

            {/* Config & Logout Buttons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${showSettings ? 'bg-[#CD853F]/15 border-[#CD853F] text-[#8B4513]' : 'bg-[#FFFDF9] border-[#EAE2D8] text-[#6D5C54] hover:text-[#8B4513]'}`}
                title="Ajustar Chave do Barista (API)"
              >
                <Settings className="w-4 h-4" />
              </button>
              
              <button 
                onClick={handleLogout}
                className="p-2 rounded-xl bg-[#FFFDF9] border border-red-200 text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                title="Sair do Canto"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8 relative z-10">
        
        {/* Hidden File Input for Backup Import */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImportBackupFile} 
          accept=".json" 
          className="hidden" 
        />

        {/* API Settings Panel inside collapsing space */}
        <AnimatePresence>
          {showSettings && (
            <motion.section 
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="bg-[#FFFDF9] border border-[#EAE2D8] rounded-3xl p-6 shadow-md space-y-4 overflow-hidden"
            >
              <div className="flex items-center gap-2 border-b border-[#F2EDE4] pb-3">
                <Key className="w-5 h-5 text-[#CD853F]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#3E2723]">Moagem Pessoal de API (Google Gemini)</h3>
              </div>
              
              <div className="max-w-xl space-y-3">
                <p className="text-xs text-[#6D5C54] leading-relaxed font-medium">
                  Por padrão, usamos a chave da nossa cafeteria corporativa. Caso encontre limites ou queira usar sua própria cota privada, digite sua chave do Gemini abaixo. Ela fica gravada de forma 100% segura apenas no seu navegador.
                </p>
                <div className="flex gap-2">
                  <input 
                    type="password" 
                    value={customApiKey}
                    onChange={(e) => handleSaveApiKey(e.target.value)}
                    placeholder="Sua chave Gemini (AI_KEY)..."
                    className="flex-1 bg-[#FAF6F0] border border-[#EAE2D8] rounded-xl px-4 py-2.5 text-xs text-[#3E2723] placeholder-stone-400 focus:outline-none focus:border-[#CD853F] font-bold"
                  />
                  {customApiKey && (
                    <button 
                      onClick={() => handleSaveApiKey('')}
                      className="px-4 py-2 bg-red-100 hover:bg-red-500 hover:text-white rounded-xl text-red-600 text-xs font-bold transition-all cursor-pointer"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Cafe Value Proposition Hero Banner */}
        <section className="relative overflow-hidden bg-[#FFFDF9] border border-[#EAE2D8] rounded-[32px] p-6 sm:p-8 shadow-md">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12">
            <div className="space-y-4 max-w-3xl text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#8B4513]/5 border border-[#8B4513]/10 rounded-full text-xs font-bold text-[#8B4513] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#CD853F] animate-pulse" />
                Grãos Selecionados e Aroma Gamer
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#2C1B14] leading-tight font-serif">
                Sua estante de jogos servida com o <span className="text-[#D2691E] italic">blend mais aconchegante</span> do mundo
              </h2>
              <p className="text-xs sm:text-sm text-[#5C4D45] leading-relaxed font-medium">
                O <strong className="text-[#8B4513]">Steam Synapse</strong> lê com carinho seu tempo de jogo e catalogação para traçar seu aroma gamer. Se sua conta Steam for reservada ou se você tem consoles (Switch, PlayStation, etc.), use nossa aba de <span className="font-bold underline text-[#CD853F]">Adicionados Manuais</span> para catalogar e calibrar nosso motor inteligente de IA.
              </p>
              
              {/* Quick Pillars Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left font-sans">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[#CD853F]/10 flex items-center justify-center border border-[#CD853F]/10 text-[#8B4513] shrink-0 mt-0.5">
                    <Coffee className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-bold text-[#3E2723] uppercase tracking-wider">Zero Pressa</h5>
                    <p className="text-[10px] text-[#6D5C54] font-medium">Encontre as melhores recomendações relaxando no balcão.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[#D2691E]/10 flex items-center justify-center border border-[#D2691E]/10 text-[#D2691E] shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-bold text-[#3E2723] uppercase tracking-wider">Moagem Fina</h5>
                    <p className="text-[10px] text-[#6D5C54] font-medium">Sugestões inteligentes com base real no seu tempo de diversão.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center border border-green-200 text-green-700 shrink-0 mt-0.5">
                    <Database className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-bold text-[#3E2723] uppercase tracking-wider">Multiplataforma</h5>
                    <p className="text-[10px] text-[#6D5C54] font-medium">Registre jogos de qualquer lugar com total liberdade local.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Retro Cafe Radio visualizer */}
            <div className="relative shrink-0 w-36 h-36 rounded-full flex items-center justify-center pointer-events-none hidden md:flex border border-[#EAE2D8] bg-[#FFFDF9] shadow-inner shadow-[#3E2723]/5">
              <div className="text-center p-3">
                <Coffee className="w-7 h-7 text-[#8B4513] mx-auto animate-bounce" style={{ animationDuration: '3s' }} />
                <span className="text-[10px] font-extrabold text-[#8B4513] mt-2 block tracking-wider">BULE QUENTE</span>
                <span className="text-[8px] text-[#8D7B70] uppercase font-bold mt-0.5 block">Moedor IA</span>
              </div>
            </div>
          </div>
        </section>

        {/* Private Warning Banner */}
        {isProfilePrivate && (
          <div className="p-5 bg-amber-50 border border-amber-200 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <h4 className="text-sm font-bold text-amber-800">Sua conta Steam parece reservada ou sem jogos públicos</h4>
                <p className="text-xs text-amber-700 leading-relaxed mt-0.5">
                  Não conseguimos moer sua biblioteca de jogos automaticamente. Torne seus "Detalhes dos Jogos" públicos nas preferências de privacidade da Steam ou <span className="font-extrabold underline text-amber-800 cursor-pointer" onClick={() => setActiveTab('manual')}>adicione seus jogos preferidos manualmente</span> para calibrar nossa IA!
                </p>
              </div>
            </div>
            <a 
              href="https://help.steampowered.com/pt-br/faqs/view/4F0A-111A-2324-85F0" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 px-4 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors"
            >
              Como Liberar
            </a>
          </div>
        )}

        {/* Primary Tab Navigation */}
        <div className="flex border-b border-[#EAE2D8] overflow-x-auto pb-px gap-2 scrollbar-none font-sans font-bold text-xs sm:text-sm">
          <button 
            onClick={() => setActiveTab('recommendations')}
            className={`relative py-3.5 px-5 transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'recommendations' ? 'text-[#8B4513]' : 'text-stone-500 hover:text-[#8B4513]'}`}
          >
            <span className="relative z-10 flex items-center gap-2 font-extrabold">
              <Compass className="w-4 h-4 text-[#8B4513]" />
              Recomendações
            </span>
            {activeTab === 'recommendations' && (
              <motion.div 
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.75 bg-gradient-to-r from-[#8B4513] via-[#D2691E] to-[#CD853F]"
              />
            )}
          </button>
 
          <button 
            onClick={() => setActiveTab('library')}
            className={`relative py-3.5 px-5 transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'library' ? 'text-[#D2691E]' : 'text-stone-500 hover:text-[#D2691E]'}`}
          >
            <span className="relative z-10 flex items-center gap-2 font-extrabold">
              <Layers className="w-4 h-4 text-[#D2691E]" />
              Grãos Steam ({ownedGames.length})
            </span>
            {activeTab === 'library' && (
              <motion.div 
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.75 bg-gradient-to-r from-[#D2691E] via-[#CD853F] to-[#8B4513]"
              />
            )}
          </button>
 
          <button 
            onClick={() => setActiveTab('manual')}
            className={`relative py-3.5 px-5 transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'manual' ? 'text-[#CD853F]' : 'text-stone-500 hover:text-[#CD853F]'}`}
          >
            <span className="relative z-10 flex items-center gap-2 font-extrabold">
              <Database className="w-4 h-4 text-[#CD853F]" />
              Biblioteca Manual ({manualGames.length})
            </span>
            {activeTab === 'manual' && (
              <motion.div 
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.75 bg-gradient-to-r from-[#CD853F] via-[#8B4513] to-[#D2691E]"
              />
            )}
          </button>
 
          <button 
            onClick={() => setActiveTab('discarded')}
            className={`relative py-3.5 px-5 transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'discarded' ? 'text-amber-800' : 'text-stone-500 hover:text-amber-800'}`}
          >
            <span className="relative z-10 flex items-center gap-2 font-extrabold">
              <History className="w-4 h-4 text-amber-700" />
              Café Gelado ({discardedRecommendations.length})
            </span>
            {activeTab === 'discarded' && (
              <motion.div 
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.75 bg-gradient-to-r from-amber-700 via-[#CD853F] to-amber-900"
              />
            )}
          </button>

          <button 
            onClick={() => setActiveTab('cozy_space')}
            className={`relative py-3.5 px-5 transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'cozy_space' ? 'text-[#8B4513]' : 'text-stone-500 hover:text-[#8B4513]'}`}
          >
            <span className="relative z-10 flex items-center gap-2 font-extrabold">
              <Coffee className="w-4 h-4 text-[#CD853F] animate-pulse" />
              Canto Barista ☕
            </span>
            {activeTab === 'cozy_space' && (
              <motion.div 
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.75 bg-gradient-to-r from-[#8B4513] via-[#CD853F] to-[#FAF6F0]"
              />
            )}
          </button>
        </div>

        {/* Tab contents wrapped with beautiful fluid transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="space-y-10 focus:outline-none"
          >
            {/* RECOMMENDATIONS TAB */}
            {activeTab === 'recommendations' && (
              <div className="space-y-10">
                
                {/* Visual Novel Style Coffee Announcement Box */}
                <div className="bg-[#FFFDF9] p-6 rounded-3xl border border-[#EAE2D8] flex flex-col md:flex-row items-center md:items-start gap-6 shadow-md relative overflow-hidden">
                  {/* Cozy fireplace / candle glow */}
                  <div className="relative group shrink-0">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#8B4513] to-[#CD853F] rounded-full blur opacity-20 group-hover:opacity-30 transition" />
                    <div className="relative w-16 h-16 bg-[#FAF6F0] rounded-full border border-[#EAE2D8] flex items-center justify-center">
                      <Coffee className="w-7 h-7 text-[#8B4513] animate-bounce" style={{ animationDuration: '4s' }} />
                    </div>
                  </div>

                  <div className="flex-1 space-y-3 text-center md:text-left">
                    <div className="space-y-1">
                      <div className="flex flex-col sm:flex-row items-center gap-2 justify-center md:justify-start">
                        <span className="font-extrabold text-base text-[#3E2723] uppercase tracking-wide font-serif">Aviso do Barista de IA ☕</span>
                        <div className="px-2.5 py-0.5 bg-[#8B4513]/5 border border-[#8B4513]/10 rounded-md text-[10px] text-[#8B4513] font-bold flex items-center gap-1 uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#CD853F] animate-pulse" />
                          Blend Fresco Extraído ✨
                        </div>
                      </div>
                      
                      {/* Dynamic Core message */}
                      <p className="text-sm font-semibold text-[#5C4D45] leading-relaxed italic">
                        "{getCoreMessage()}"
                      </p>
                    </div>

                    {/* Quick core metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      <div className="bg-[#FAF6F0] p-2.5 rounded-2xl border border-[#EAE2D8]">
                        <span className="text-[10px] text-[#8D7B70] block uppercase font-bold tracking-wide">Café Saboreado</span>
                        <span className="text-xs font-extrabold text-[#8B4513]">{totalPlaytimeHours}h de vida jogadas</span>
                      </div>
                      <div className="bg-[#FAF6F0] p-2.5 rounded-2xl border border-[#EAE2D8]">
                        <span className="text-[10px] text-[#8D7B70] block uppercase font-bold tracking-wide">Jogatina Recente</span>
                        <span className="text-xs font-extrabold text-[#D2691E]">{recentPlaytimeHours}h / 2sem</span>
                      </div>
                      <div className="bg-[#FAF6F0] p-2.5 rounded-2xl border border-[#EAE2D8]">
                        <span className="text-[10px] text-[#8D7B70] block uppercase font-bold tracking-wide">Grãos Steam</span>
                        <span className="text-xs font-extrabold text-[#3E2723]">{ownedGames.length} Moagens</span>
                      </div>
                      <div className="bg-[#FAF6F0] p-2.5 rounded-2xl border border-[#EAE2D8]">
                        <span className="text-[10px] text-[#8D7B70] block uppercase font-bold tracking-wide">Blend Manual</span>
                        <span className="text-xs font-extrabold text-[#CD853F]">{manualGames.length} Pacotes</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gamer Archetype card: Coffee Addiction style! */}
                <section className="bg-gradient-to-r from-[#FAF6F0] via-[#FFFDF9] to-[#FAF6F0] border border-[#EAE2D8] rounded-[24px] p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-[#CD853F]/10 flex items-center justify-center shrink-0 border border-[#CD853F]/10">
                    <Crown className="w-6 h-6 text-[#CD853F]" />
                  </div>
                  <div className="space-y-1.5 text-center md:text-left flex-1">
                    <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-[#CD853F]">Seu Perfil de Paladar Gamer</h4>
                    <h3 className="text-lg font-black font-serif text-[#3E2723]">{archetype.title}</h3>
                    <p className="text-xs text-[#6D5C54] font-medium leading-relaxed">{archetype.description}</p>
                  </div>
                  {/* Simple visual sliders of traits */}
                  <div className="w-full md:w-64 space-y-2 text-xs font-bold text-[#5C4D45]">
                    <div className="space-y-0.5">
                      <div className="flex justify-between"><span>Notas RPG:</span><span>{archetype.metrics.focus}%</span></div>
                      <div className="h-1.5 bg-[#FAF6F0] rounded-full overflow-hidden border border-[#EAE2D8]"><div className="bg-[#8B4513] h-full" style={{ width: `${archetype.metrics.focus}%` }} /></div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex justify-between"><span>Moagem Estratégica:</span><span>{archetype.metrics.tactic}%</span></div>
                      <div className="h-1.5 bg-[#FAF6F0] rounded-full overflow-hidden border border-[#EAE2D8]"><div className="bg-[#5C4D45] h-full" style={{ width: `${archetype.metrics.tactic}%` }} /></div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex justify-between"><span>Café Amargo Ação:</span><span>{archetype.metrics.explore}%</span></div>
                      <div className="h-1.5 bg-[#FAF6F0] rounded-full overflow-hidden border border-[#EAE2D8]"><div className="bg-[#D2691E] h-full" style={{ width: `${archetype.metrics.explore}%` }} /></div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex justify-between"><span>Doçura Cozy Zen:</span><span>{archetype.metrics.cozy}%</span></div>
                      <div className="h-1.5 bg-[#FAF6F0] rounded-full overflow-hidden border border-[#EAE2D8]"><div className="bg-[#CD853F] h-full" style={{ width: `${archetype.metrics.cozy}%` }} /></div>
                    </div>
                  </div>
                </section>

                {/* Cozy Clima calibrator */}
                <section className="relative rounded-3xl overflow-hidden bg-[#FFFDF9] border border-[#EAE2D8] p-8 sm:p-10 shadow-md">
                  <div className="relative z-10 max-w-2xl space-y-6">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1 px-3 py-1 bg-[#8B4513]/5 text-[#8B4513] border border-[#8B4513]/10 rounded-full text-xs font-bold font-sans uppercase tracking-wider">
                        <Volume2 className="w-3.5 h-3.5 text-[#CD853F]" />
                        Adicionais no Café 🕯️
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2C1B14] font-serif">O que o barista deve sintonizar hoje?</h2>
                      <p className="text-xs sm:text-sm text-[#6D5C54] leading-relaxed font-medium">
                        Diga o que você quer acrescentar ao seu blend e o que quer filtrar. O moedor de IA analisará suas escolhas para criar recomendações impecáveis!
                      </p>
                    </div>
                    
                    <div className="space-y-4 bg-[#FAF6F0] p-5 rounded-2xl border border-[#EAE2D8]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2 font-sans">
                          <label className="block text-xs font-bold text-[#8B4513] uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#CD853F] animate-pulse shrink-0" />
                            Mais doçura / Grãos parecidos com:
                          </label>
                          <input 
                            type="text" 
                            placeholder="Ex: RPG medieval de turnos, exploração fofinha, Metroidvania"
                            value={prefsMoreOf}
                            onChange={(e) => setPrefsMoreOf(e.target.value)}
                            className="w-full bg-[#FFFDF9] border border-[#EAE2D8] rounded-xl px-4 py-3 text-xs text-[#3E2723] placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#CD853F] focus:border-[#CD853F] transition-all font-bold"
                          />
                          <p className="text-[10px] text-[#8D7B70] leading-normal font-medium">Acrescente gêneros ou vibes que está desejando agora.</p>
                        </div>
                        <div className="space-y-2 font-sans">
                          <label className="block text-xs font-bold text-[#D2691E] uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D2691E] animate-pulse shrink-0" />
                            Café descafeinado / Evitar grãos como:
                          </label>
                          <input 
                            type="text" 
                            placeholder="Ex: FPS competitivo estressante, horror extremo, pay-to-win"
                            value={prefsLessOf}
                            onChange={(e) => setPrefsLessOf(e.target.value)}
                            className="w-full bg-[#FFFDF9] border border-[#EAE2D8] rounded-xl px-4 py-3 text-xs text-[#3E2723] placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#CD853F] focus:border-[#CD853F] transition-all font-bold"
                          />
                          <p className="text-[10px] text-[#8D7B70] leading-normal font-medium">Filtre amargor competitivo ou jogos estressantes do seu cardápio.</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <button
                        onClick={generateRecommendations}
                        disabled={generating || (combinedTotalGames === 0 && !prefsMoreOf)}
                        className="flex items-center gap-2.5 bg-gradient-to-r from-[#8B4513] via-[#D2691E] to-[#CD853F] hover:opacity-95 text-white font-black py-3.5 px-8 rounded-xl transition-all disabled:opacity-40 active:scale-95 shadow-md shadow-[#8B4513]/10 cursor-pointer text-sm"
                      >
                        {generating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Extraindo a xícara de jogos... ☕</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-white animate-pulse" />
                            <span>Passar Blend de Recomendações! ☕</span>
                          </>
                        )}
                      </button>

                      {generating && (
                        <div className="flex items-center gap-1 h-6 px-4 bg-[#8B4513]/5 border border-[#8B4513]/10 rounded-xl">
                          <span className="w-1 bg-[#8B4513] rounded-full animate-bounce h-3" style={{ animationDelay: '0.1s', animationDuration: '0.6s' }} />
                          <span className="w-1 bg-[#D2691E] rounded-full animate-bounce h-5" style={{ animationDelay: '0.3s', animationDuration: '0.5s' }} />
                          <span className="w-1 bg-[#CD853F] rounded-full animate-bounce h-4" style={{ animationDelay: '0.2s', animationDuration: '0.7s' }} />
                          <span className="text-[10px] font-semibold text-[#8B4513] ml-2">Moendo grãos de ideias...</span>
                        </div>
                      )}
                    </div>

                    {generationError && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700 leading-normal font-bold">{generationError}</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Recommendations List Container */}
                <AnimatePresence mode="wait">
                  {recommendations.length > 0 && (
                    <motion.section
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between border-b border-[#EAE2D8] pb-2">
                        <h3 className="text-base font-bold flex items-center gap-2 font-serif tracking-wide text-[#3E2723]">
                          <Sparkles className="w-5 h-5 text-[#CD853F] animate-spin" style={{ animationDuration: '10s' }} />
                          Sua Seleção de Cafés Customizada (Jogos Sugeridos)
                        </h3>
                        <span className="text-[11px] text-[#CD853F] font-bold tracking-wider uppercase">Menu Servido</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                        <AnimatePresence>
                          {recommendations.map((rec: any, i) => (
                            <motion.div key={rec.name} layout>
                              <GameCard 
                                name={rec.name}
                                appId={rec.appId}
                                reason={rec.reason}
                                match={rec.estimatedMatch}
                                genres={rec.genres}
                                timeToBeat={rec.timeToBeat}
                                onDiscard={() => handleDiscard(i)}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* STEAM LIBRARY TAB */}
            {activeTab === 'library' && (
              <div className="space-y-6">
                <div className="bg-[#FFFDF9] border border-[#EAE2D8] p-6 rounded-3xl space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold font-serif text-[#3E2723] flex items-center gap-1.5">
                        <Layers className="w-5 h-5 text-[#D2691E]" />
                        Sua Estante de Grãos Steam
                      </h3>
                      <p className="text-xs text-[#6D5C54] mt-0.5 font-medium leading-relaxed">
                        Sua prateleira oficial. Alguns grãos você já moeu e degustou até o fim, outros estão guardados no vácuo há 3 anos esperando o "momento ideal" que nunca chega.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        onClick={() => setActiveTab('recommendations')}
                        className="px-4 py-2.5 bg-gradient-to-r from-[#8B4513] to-[#CD853F] hover:opacity-90 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer whitespace-nowrap"
                      >
                        <Sparkles className="w-4 h-4" />
                        Gerar Blend!
                      </button>
                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text" 
                          placeholder="Buscar grão na biblioteca..."
                          value={librarySearchFilter}
                          onChange={(e) => setLibrarySearchFilter(e.target.value)}
                          className="w-full bg-[#FAF6F0] border border-[#EAE2D8] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#3E2723] placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#CD853F] font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {filteredLibraryGames.length === 0 ? (
                  <div className="p-12 text-center bg-[#FFFDF9] border border-[#EAE2D8] rounded-3xl space-y-3">
                    <Coffee className="w-8 h-8 text-stone-300 mx-auto animate-pulse" />
                    <p className="text-sm font-bold text-[#6D5C54]">Nenhum grão com esse nome foi encontrado na prateleira.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                    {filteredLibraryGames.map((game) => (
                      <GameCard 
                        key={`${game.isManual ? 'm' : 's'}-${game.appid}`}
                        name={game.name}
                        appId={game.appid > 0 ? game.appid : undefined}
                        playtime={game.playtime_forever}
                        isManual={game.isManual}
                        onEditPlaytime={game.isManual ? (min) => handleEditManualPlaytime(game.appid, min) : undefined}
                        onRemoveManual={game.isManual ? () => handleRemoveManualGame(game.appid) : undefined}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}


            {/* MANUAL LIBRARY TAB */}
            {activeTab === 'manual' && (
              <div className="space-y-6">
                
                {/* Coffee Cofre: Backup & Restore controls */}
                <div className="bg-[#FFFDF9] border border-[#CD853F]/30 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                  <div className="flex items-center gap-4 text-center md:text-left">
                    <div className="w-12 h-12 rounded-full bg-[#CD853F]/10 flex items-center justify-center shrink-0 border border-[#CD853F]/20 text-[#8B4513]">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-[#3E2723] uppercase tracking-wide flex items-center gap-1.5 justify-center md:justify-start">
                        Cofre de Café da Cafeteria ☕💾
                      </h4>
                      <p className="text-xs text-[#6D5C54] mt-0.5 leading-relaxed font-medium">
                        Como nosso servidor de demonstração na nuvem reinicia a cada atualização do site, seus grãos manuais correm o risco de se perderem. <strong className="text-[#8B4513]">Garanta 100% de persistência</strong> baixando um arquivo de backup ou restaurando seus dados do seu computador!
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2.5 shrink-0">
                    <button
                      onClick={() => setActiveTab('recommendations')}
                      className="px-4 py-2.5 bg-gradient-to-r from-[#8B4513] to-[#CD853F] hover:opacity-90 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      Gerar Blend!
                    </button>
                    <button
                      onClick={handleExportBackup}
                      className="flex items-center gap-2 bg-[#FFFDF9] hover:bg-[#FAF6F0] text-[#8B4513] border border-[#CD853F] px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      <Download className="w-4 h-4 text-[#CD853F]" />
                      <span>Exportar Cópia (Backup JSON)</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 bg-[#8B4513] hover:bg-[#72380F] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      <Upload className="w-4 h-4 text-[#E6C29D]" />
                      <span>Restaurar do Computador</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column Form */}
                  <div className="bg-[#FFFDF9] border border-[#EAE2D8] p-6 rounded-3xl h-fit space-y-6">
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-base font-serif text-[#3E2723]">Importar Nova Receita</h3>
                      <p className="text-xs text-[#6D5C54] leading-relaxed font-medium">
                        Adicione jogos do seu Nintendo Switch, PlayStation, Xbox, ou daquele launcher alternativo que "não devemos citar". A IA vai tratá-los como grãos nobres na hora de moer suas recomendações!
                      </p>
                    </div>

                    <form onSubmit={handleAddManualGameSubmit} className="space-y-4 font-sans text-xs font-bold text-[#5C4D45]">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-[#8B4513] uppercase tracking-wider">Buscar por Nome na Steam (Auto-preencher):</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Ex: Stardew Valley"
                            value={manualSearchQuery}
                            onChange={(e) => setManualSearchQuery(e.target.value)}
                            className="flex-1 bg-[#FAF6F0] border border-[#EAE2D8] rounded-xl px-3 py-2 text-xs text-[#3E2723] focus:outline-none focus:border-[#CD853F] font-bold"
                          />
                          <button 
                            type="button"
                            onClick={handleSearchManualGame}
                            disabled={isSearchingManual}
                            className="px-4 bg-[#CD853F]/10 hover:bg-[#CD853F] hover:text-white border border-[#CD853F]/20 text-[#CD853F] rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                          >
                            {isSearchingManual ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Buscar"}
                          </button>
                        </div>
                      </div>

                      {manualSearchResults.length > 0 && (
                        <div className="bg-[#FAF6F0] border border-[#EAE2D8] rounded-2xl p-2.5 max-h-40 overflow-y-auto space-y-1">
                          <span className="text-[9px] uppercase font-bold text-[#CD853F] block pb-1 border-b border-[#EAE2D8]">Selecione um Grão Encontrado:</span>
                          {manualSearchResults.map(item => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelectManualSearchResult(item)}
                              className="w-full text-left px-2 py-1.5 hover:bg-[#FFFDF9] rounded-lg transition-colors text-xs text-[#3E2723] flex justify-between items-center cursor-pointer"
                            >
                              <span className="font-bold truncate">{item.name}</span>
                              <span className="text-[10px] text-stone-400">ID: {item.id}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-[#8B4513] uppercase tracking-wider">Nome exato do Jogo:</label>
                        <input 
                          type="text" 
                          required
                          value={manualGameName}
                          onChange={(e) => setManualGameName(e.target.value)}
                          placeholder="Ex: Chrono Trigger"
                          className="w-full bg-[#FAF6F0] border border-[#EAE2D8] rounded-xl px-3.5 py-2.5 text-xs text-[#3E2723] focus:outline-none focus:border-[#CD853F] font-bold"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-[#D2691E] uppercase tracking-wider">Tempo Degustado (Horas Estimadas):</label>
                        <input 
                          type="number" 
                          value={manualGameHours}
                          onChange={(e) => setManualGameHours(e.target.value)}
                          placeholder="Ex: 85 (horas)"
                          className="w-full bg-[#FAF6F0] border border-[#EAE2D8] rounded-xl px-3.5 py-2.5 text-xs text-[#3E2723] focus:outline-none focus:border-[#CD853F] font-bold"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-[#8B4513] to-[#CD853F] text-white py-3 rounded-xl hover:opacity-95 text-xs font-extrabold shadow-md active:scale-95 transition-all cursor-pointer"
                      >
                        Despejar Grão na Estante! ☕✨
                      </button>
                    </form>
                  </div>

                  {/* Right Column List */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="bg-[#FFFDF9] border border-[#EAE2D8] p-5 rounded-3xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-base font-bold font-serif text-[#3E2723]">Seu Blend de Jogos Adicionados Manuais ({manualGames.length})</h3>
                          <p className="text-xs text-[#6D5C54] leading-relaxed mt-0.5 font-medium">
                            Estes são os seus pacotes adicionais. Para alterar o tempo jogado (horas) de qualquer um, clique no ícone de lápis correspondente.
                          </p>
                        </div>
                        <div className="relative w-full sm:w-64 shrink-0">
                          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input 
                            type="text" 
                            placeholder="Buscar grão manual..."
                            value={manualLibrarySearchFilter}
                            onChange={(e) => setManualLibrarySearchFilter(e.target.value)}
                            className="w-full bg-[#FAF6F0] border border-[#EAE2D8] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#3E2723] placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#CD853F] font-bold"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {filteredManualGames.length === 0 ? (
                      <div className="p-12 text-center bg-[#FFFDF9] border border-[#EAE2D8] rounded-3xl space-y-3">
                        <Coffee className="w-8 h-8 text-stone-300 mx-auto animate-pulse" />
                        <p className="text-sm font-bold text-[#6D5C54]">Sua moagem manual está vazia ou a busca não encontrou grãos.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence>
                          {filteredManualGames.map((game) => (
                            <motion.div key={game.appid || game.name} layout>
                              <GameCard 
                                name={game.name}
                                appId={game.appid > 0 ? game.appid : undefined}
                                playtime={game.playtime_forever}
                                isManual={true}
                                onEditPlaytime={(min) => handleEditManualPlaytime(game.appid, min)}
                                onRemoveManual={() => handleRemoveManualGame(game.appid)}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* DISCARDED RECOMMENDATIONS TAB */}
            {activeTab === 'discarded' && (
              <div className="space-y-6">
                <div className="bg-[#FFFDF9] border border-[#EAE2D8] p-6 rounded-3xl">
                  <h3 className="text-lg font-bold font-serif text-[#3E2723] flex items-center gap-1.5">
                    <History className="w-5 h-5 text-amber-700" />
                    Cemitério de Cafés Gelados (Recomendações Descartadas)
                  </h3>
                  <p className="text-xs text-[#6D5C54] mt-0.5 font-medium leading-relaxed">
                    Aqui descansam os cafés que você olhou e disse: "Hum, hoje não", ou que o bolso chorou só de ver o preço na loja. Se mudar de ideia e a xícara esquentar de novo, você pode clicar em "Restaurar" para devolvê-lo ao cardápio de recomendações!
                  </p>
                </div>

                {discardedRecommendations.length === 0 ? (
                  <div className="p-12 text-center bg-[#FFFDF9] border border-[#EAE2D8] rounded-3xl space-y-3">
                    <Coffee className="w-8 h-8 text-stone-300 mx-auto animate-pulse" />
                    <p className="text-sm font-bold text-[#6D5C54]">O cemitério está limpo. Nenhum café gelou ainda!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                    <AnimatePresence>
                      {discardedRecommendations.map((rec: any, i) => (
                        <motion.div key={rec.name} layout>
                          <GameCard 
                            name={rec.name}
                            appId={rec.appId}
                            reason={rec.reason}
                            match={rec.estimatedMatch}
                            genres={rec.genres}
                            timeToBeat={rec.timeToBeat}
                            onDiscard={() => handleRestore(i)}
                            discardIcon={<Plus className="w-3.5 h-3.5 text-green-500 hover:text-white" />}
                            discardLabel="Restaurar recomendação"
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}

            {/* COZY CANTO TAB (LOFI RADIO & BARISTA SPACE) */}
            {activeTab === 'cozy_space' && (
              <div className="space-y-6">
                
                {/* Visual novel / interactive board */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Radio Column */}
                  <div className="bg-[#FFFDF9] border border-[#EAE2D8] p-6 rounded-[32px] shadow-sm space-y-6">
                    <div className="space-y-2 border-b border-[#F2EDE4] pb-4 text-center md:text-left">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#8B4513]/5 border border-[#8B4513]/10 text-[#8B4513] rounded-full text-xs font-bold">
                        <Music className="w-3.5 h-3.5 text-[#CD853F] animate-pulse" />
                        Rádio Retro Lofi do Canto 📻
                      </div>
                      <h3 className="text-base font-extrabold font-serif text-[#3E2723]">Estação de Harmonização</h3>
                      <p className="text-xs text-[#6D5C54] font-medium leading-relaxed">
                        Ligue nossa rádio lofi de fita magnética e ative o som da chuva para criar o clima ideal de cafeteria parisiense debaixo de cobertores.
                      </p>
                    </div>

                    {/* Radio Screen */}
                    <div className="bg-[#FAF6F0] p-5 rounded-2xl border border-[#EAE2D8] text-center space-y-3">
                      <div className="h-2 w-full bg-[#EAE2D8] rounded-full overflow-hidden relative">
                        {isPlaying && (
                          <motion.div 
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                            className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-[#CD853F] to-transparent" 
                          />
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#8B4513] uppercase tracking-wider block">Sintonizado agora:</span>
                        <h4 className="text-sm font-extrabold text-[#3E2723] font-sans truncate">{cozyTracks[currentTrackIdx].name}</h4>
                        <p className="text-[11px] text-[#6D5C54] mt-0.5 italic">{cozyTracks[currentTrackIdx].desc}</p>
                      </div>
                      
                      {/* Audio Visualizer Waves */}
                      <div className="flex justify-center items-end gap-1 h-8">
                        {[4, 8, 2, 6, 9, 3, 7, 5, 8, 4, 6].map((h, index) => (
                          <motion.span
                            key={index}
                            animate={isPlaying ? { height: [`${h*10}%`, `${(12-h)*10}%`, `${h*10}%`] } : { height: "15%" }}
                            transition={{ repeat: Infinity, duration: 0.8 + index*0.1, ease: "easeInOut" }}
                            className="w-1.5 bg-[#CD853F] rounded-full"
                            style={{ height: `${h*10}%` }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Playback Controls */}
                    <div className="space-y-4 font-sans text-xs font-bold text-[#5C4D45]">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => setCurrentTrackIdx((prev) => (prev === 0 ? cozyTracks.length - 1 : prev - 1))}
                          className="p-3 bg-[#FAF6F0] hover:bg-[#EAE2D8] border border-[#EAE2D8] rounded-xl text-[#3E2723] transition-all cursor-pointer"
                          title="Faixa Anterior"
                        >
                          <ChevronRight className="w-4 h-4 transform rotate-180" />
                        </button>
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="p-4 bg-gradient-to-r from-[#8B4513] to-[#CD853F] hover:opacity-95 text-white rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center"
                          title={isPlaying ? "Pausar Harmonização" : "Sintonizar Música"}
                        >
                          {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
                        </button>
                        <button
                          onClick={() => setCurrentTrackIdx((prev) => (prev === cozyTracks.length - 1 ? 0 : prev + 1))}
                          className="p-3 bg-[#FAF6F0] hover:bg-[#EAE2D8] border border-[#EAE2D8] rounded-xl text-[#3E2723] transition-all cursor-pointer"
                          title="Próxima Faixa"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Music Volume Slider */}
                      <div className="space-y-1 bg-[#FAF6F0] p-3 rounded-2xl border border-[#EAE2D8]">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="flex items-center gap-1"><Music className="w-3.5 h-3.5 text-[#CD853F]" /> Volume Rádio</span>
                          <span>{Math.round(musicVolume * 100)}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="1" 
                          step="0.05"
                          value={musicVolume}
                          onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                          className="w-full accent-[#8B4513] bg-[#EAE2D8] h-1.5 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      {/* Rain Volume Slider */}
                      <div className="space-y-1 bg-[#FAF6F0] p-3 rounded-2xl border border-[#EAE2D8]">
                        <div className="flex justify-between items-center text-[11px]">
                          <button 
                            type="button" 
                            onClick={() => setIsRainPlaying(!isRainPlaying)}
                            className="flex items-center gap-1 cursor-pointer text-[#8B4513]"
                          >
                            {isRainPlaying ? <Pause className="w-3.5 h-3.5 animate-pulse text-[#CD853F]" /> : <Play className="w-3.5 h-3.5" />}
                            Chuva Ambientalista 🌧️
                          </button>
                          <span>{Math.round(rainVolume * 100)}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="1" 
                          step="0.05"
                          value={rainVolume}
                          onChange={(e) => setRainVolume(parseFloat(e.target.value))}
                          className="w-full accent-[#CD853F] bg-[#EAE2D8] h-1.5 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Coffee Menu / Recipes Board */}
                  <div className="md:col-span-2 bg-[#FFFDF9] border border-[#EAE2D8] p-6 sm:p-8 rounded-[32px] shadow-sm space-y-6">
                    <div className="border-b border-[#F2EDE4] pb-4 space-y-1">
                      <h3 className="text-lg font-bold font-serif text-[#3E2723]">Menu de Harmonização: Receitas para Jogar</h3>
                      <p className="text-xs text-[#6D5C54] font-medium leading-relaxed">
                        Escolha um blend de acordo com a sua jogatina atual! Nossos baristas mapearam harmonizações reais de cafés selecionados e gêneros.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-xs">
                      <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#EAE2D8] space-y-2">
                        <span className="text-[10px] bg-[#8B4513]/10 text-[#8B4513] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block">Espresso Curto Otimizado ⚡</span>
                        <h4 className="font-extrabold text-sm text-[#3E2723]">Casca-Grossa & Metroidvanias/RPG</h4>
                        <p className="text-stone-500 font-medium leading-normal">
                          Café forte, denso e rápido. Ideal para quando você está lutando contra chefes de Dark Souls ou tentando desvendar rotas secretas de Hollow Knight. Mantém o foco cirúrgico!
                        </p>
                      </div>
                      
                      <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#EAE2D8] space-y-2">
                        <span className="text-[10px] bg-[#D2691E]/10 text-[#D2691E] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block">Prensa Francesa Manual ⏳</span>
                        <h4 className="font-extrabold text-sm text-[#3E2723]">Estratégia & Automação</h4>
                        <p className="text-stone-500 font-medium leading-normal">
                          Uma infusão demorada e complexa. Ideal para planejar turnos no Civilization ou ajustar o fluxo de correias em Factorio. Exige paciência e raciocínio refinado.
                        </p>
                      </div>

                      <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#EAE2D8] space-y-2">
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block">Caffè Latte com Desenho 🌸</span>
                        <h4 className="font-extrabold text-sm text-[#3E2723]">Cozy Farming / Casual</h4>
                        <p className="text-stone-500 font-medium leading-normal">
                          Doce, cremoso e quentinho. Perfeito para colher nabos em Stardew Valley, pescar em Animal Crossing ou arrumar baús no Minecraft ouvindo música lofi suave.
                        </p>
                      </div>

                      <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#EAE2D8] space-y-2">
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block">Café Coado Clássico ☕</span>
                        <h4 className="font-extrabold text-sm text-[#3E2723]">Grandes Narrativas & Histórias</h4>
                        <p className="text-stone-500 font-medium leading-normal">
                          O café de todo dia, reconfortante e nostálgico. Ideal para sentar e assistir diálogos de The Witcher, Baldur's Gate ou desbravar as planícies de Red Dead Redemption.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 leading-relaxed font-bold">
                      ☕ "Quem não gosta de café, com certeza gosta de jogar debaixo da coberta fingindo que está em uma cafeteria aconchegante. Seja muito bem-vindo!"
                    </div>
                  </div>

                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
