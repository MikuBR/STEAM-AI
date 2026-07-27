import express from "express";
import path from "path";
import fs from "fs";
import passport from "passport";
import { Strategy as SteamStrategy } from "passport-steam";
import session from "express-session";
import axios from "axios";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

const tempTokens = new Map<string, any>();
const activeSessions = new Map<string, any>();

const checkAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === 'mock_token') {
      req.user = { id: "mock", displayName: "Visitante (Mock)", photos: [{ value: "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg" }] };
      return next();
    }
    const user = activeSessions.get(token);
    if (user) { req.user = user; return next(); }
  }
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  res.status(401).json({ error: "Unauthorized" });
};

app.set('trust proxy', true);
const sessionSecret = process.env.SESSION_SECRET || "steam-recommender-secret-v3";

app.use(session({
  secret: sessionSecret, resave: false, saveUninitialized: false, proxy: true,
  name: 'steam.sid',
  cookie: { secure: true, sameSite: 'none', httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(passport.initialize());
app.use(passport.session());

let appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, "");
if (appUrl.includes('run.app') && !appUrl.startsWith('https://')) appUrl = appUrl.replace('http://', 'https://');

passport.use(new SteamStrategy({
  returnURL: `${appUrl}/auth/steam/return`,
  realm: `${appUrl}/`,
  apiKey: process.env.STEAM_API_KEY
}, (identifier: string, profile: any, done: any) => {
  profile.identifier = identifier;
  return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj: any, done) => done(null, obj));

app.use(express.json());

app.get('/api/auth/steam', passport.authenticate('steam', { failureRedirect: '/' }));

app.get('/auth/steam/return', passport.authenticate('steam', { failureRedirect: '/' }), (req: any, res: any) => {
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  tempTokens.set(token, req.user);
  setTimeout(() => tempTokens.delete(token), 5 * 60 * 1000);
  res.send(`<html><body><script>
    if (window.opener) { window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', token: '${token}' }, '*'); window.close(); }
    else { window.location.href = '/'; }
  </script><p>Autenticacao bem-sucedida!</p></body></html>`);
});

app.post('/api/auth/exchange', (req: any, res: any) => {
  const { token } = req.body;
  const user = tempTokens.get(token);
  if (user) {
    tempTokens.delete(token);
    const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    activeSessions.set(sessionToken, user);
    req.login(user, (err: any) => {
      if (err) return res.status(500).json({ error: 'Login failed' });
      req.session.save(() => res.json({ success: true, user, token: sessionToken }));
    });
  } else res.status(400).json({ error: 'Invalid token' });
});

app.get('/api/auth/user', checkAuth, (req: any, res: any) => res.json(req.user));
app.get('/api/auth/logout', (req: any, res: any) => { req.logout(() => res.redirect('/')); });

const MANUAL_GAMES_FILE = path.join(process.cwd(), "manual_games_store.json");

function readManualGamesStore(): Record<string, any[]> {
  try { if (fs.existsSync(MANUAL_GAMES_FILE)) return JSON.parse(fs.readFileSync(MANUAL_GAMES_FILE, 'utf-8')); } catch {}
  return {};
}
function writeManualGamesStore(store: Record<string, any[]>) {
  try { fs.writeFileSync(MANUAL_GAMES_FILE, JSON.stringify(store, null, 2), 'utf-8'); } catch {}
}

app.get('/api/steam/manual-games', checkAuth, (req: any, res: any) => {
  res.json({ games: readManualGamesStore()[req.user.id] || [] });
});

app.post('/api/steam/manual-games', checkAuth, (req: any, res: any) => {
  if (!Array.isArray(req.body.games)) return res.status(400).json({ error: "Invalid games format" });
  const store = readManualGamesStore();
  store[req.user.id] = req.body.games;
  writeManualGamesStore(store);
  res.json({ success: true });
});

app.get('/api/steam/owned-games', checkAuth, async (req: any, res: any) => {
  const steamId = req.user.id;
  if (steamId === 'mock') return res.json({ game_count: 3, games: [
    { appid: 413150, name: "Stardew Valley", playtime_forever: 6000 },
    { appid: 289070, name: "Civilization VI", playtime_forever: 12000 },
    { appid: 1145360, name: "Hades", playtime_forever: 3000 }
  ]});
  try {
    const response = await axios.get('http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/', {
      params: { key: process.env.STEAM_API_KEY, steamid: steamId, format: 'json', include_appinfo: true, include_played_free_games: true }
    });
    res.json(response.data.response);
  } catch { res.status(500).json({ error: "Failed to fetch Steam data" }); }
});

app.get('/api/steam/recent-games', checkAuth, async (req: any, res: any) => {
  const steamId = req.user.id;
  if (steamId === 'mock') return res.json({ total_count: 1, games: [{ appid: 413150, name: "Stardew Valley", playtime_forever: 6000 }] });
  try {
    const response = await axios.get('http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/', {
      params: { key: process.env.STEAM_API_KEY, steamid: steamId, format: 'json' }
    });
    res.json(response.data.response);
  } catch { res.status(500).json({ error: "Failed to fetch Steam data" }); }
});

app.get('/api/search-games', async (req: any, res: any) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  try {
    const searchRes = await axios.get(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q as string)}&l=english&cc=US`);
    res.json(searchRes.data?.items || []);
  } catch { res.status(500).json({ error: "Search failed" }); }
});

app.post('/api/recommendations', checkAuth, async (req: any, res: any) => {
  const { ownedGames, recentGames, customGeminiKey, preferences } = req.body;
  try {
    let activeAi = ai;
    if (customGeminiKey) activeAi = new GoogleGenAI({ apiKey: customGeminiKey });

    const prefsText = preferences ? `PREFERENCIAS:\n- Mais: ${preferences.moreOf || 'N/E'}\n- Menos: ${preferences.lessOf || 'N/E'}` : '';
    const gamesList = ownedGames.map((g: any) => `- ${g.name}: ${g.playtime_forever}min`).join('\n');
    const recentList = recentGames.map((g: any) => `- ${g.name}`).join('\n');

    const prompt = `Voce e um Barista Gamer. Recomende 5 jogos que o usuario NAO possui baseado em: ${gamesList}\nRecentemente: ${recentList}\n${prefsText}\nRetorne JSON com: name, appId (Steam ID), reason, genres, estimatedMatch (0-100), timeToBeat (horas).`;

    const generate = async (modelName: string) => activeAi.models.generateContent({
      model: modelName, contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING }, appId: { type: Type.INTEGER }, reason: { type: Type.STRING },
                  genres: { type: Type.ARRAY, items: { type: Type.STRING } },
                  estimatedMatch: { type: Type.NUMBER }, timeToBeat: { type: Type.NUMBER }
                },
                required: ["name", "appId", "reason", "genres", "estimatedMatch", "timeToBeat"]
              }
            }
          },
          required: ["recommendations"]
        }
      }
    });

    try {
      let responseText = "";
      try { responseText = (await generate("gemini-3.5-flash")).text; }
      catch (ge: any) {
        if (ge.status === 503 || ge.message?.includes('503')) responseText = (await generate("gemini-3.1-pro-preview")).text;
        else throw ge;
      }
      const result = JSON.parse(responseText);
      for (const rec of result.recommendations || []) {
        try {
          const sr = await axios.get(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(rec.name)}&l=english&cc=US`);
          if (sr.data?.items?.length > 0) { rec.appId = sr.data.items[0].id; rec.name = sr.data.items[0].name; }
        } catch {}
      }
      res.json(result);
    } catch (error: any) {
      if (error.status === 429 || error.message?.includes('429')) res.status(429).json({ error: "Limite Gemini. Use sua chave nas configuracoes." });
      else res.status(500).json({ error: "Erro ao gerar recomendacoes." });
    }
  } catch { res.status(500).json({ error: "Erro interno." }); }
});

app.post('/api/recommend-similar', checkAuth, async (req: any, res: any) => {
  const { gameName, customGeminiKey } = req.body;
  try {
    let activeAi = ai;
    if (customGeminiKey) activeAi = new GoogleGenAI({ apiKey: customGeminiKey });

    const prompt = `Recomende 5 jogos similares a "${gameName}" em genero, estilo ou mecanicas. Retorne JSON com: name, appId, reason, genres, estimatedMatch, timeToBeat.`;

    const generate = async (modelName: string) => activeAi.models.generateContent({
      model: modelName, contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING }, appId: { type: Type.INTEGER }, reason: { type: Type.STRING },
                  genres: { type: Type.ARRAY, items: { type: Type.STRING } },
                  estimatedMatch: { type: Type.NUMBER }, timeToBeat: { type: Type.NUMBER }
                },
                required: ["name", "appId", "reason", "genres", "estimatedMatch", "timeToBeat"]
              }
            }
          },
          required: ["recommendations"]
        }
      }
    });

    try {
      let responseText = "";
      try { responseText = (await generate("gemini-3.5-flash")).text; }
      catch (ge: any) {
        if (ge.status === 503 || ge.message?.includes('503')) responseText = (await generate("gemini-3.1-pro-preview")).text;
        else throw ge;
      }
      res.json(JSON.parse(responseText));
    } catch (error: any) {
      if (error.status === 429) res.status(429).json({ error: "Limite Gemini." });
      else res.status(500).json({ error: "Erro." });
    }
  } catch { res.status(500).json({ error: "Erro interno." }); }
});

export default app;
