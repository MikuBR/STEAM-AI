const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetAuth = `const checkAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const user = activeSessions.get(token);
    if (user) {
      req.user = user;
      return next();
    }
  }
  res.status(401).json({ error: 'Unauthorized' });
};`;

const goodAuth = `const checkAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === 'mock_token') {
      req.user = {
        id: "mock",
        displayName: "Visitante (Mock)",
        photos: [{ value: "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg" }]
      };
      return next();
    }
    const user = activeSessions.get(token);
    if (user) {
      req.user = user;
      return next();
    }
  }
  res.status(401).json({ error: 'Unauthorized' });
};`;

content = content.replace(targetAuth, goodAuth);

const targetOwned = `  // Steam Data fetching
  app.get('/api/steam/owned-games', checkAuth, async (req: any, res: any) => {
    const user: any = req.user;
    const steamId = user.id;
    const apiKey = process.env.STEAM_API_KEY;

    try {`;

const goodOwned = `  // Steam Data fetching
  app.get('/api/steam/owned-games', checkAuth, async (req: any, res: any) => {
    const user: any = req.user;
    const steamId = user.id;
    const apiKey = process.env.STEAM_API_KEY;

    if (steamId === 'mock') {
      return res.json({
        game_count: 3,
        games: [
          { appid: 413150, name: "Stardew Valley", playtime_forever: 6000 },
          { appid: 289070, name: "Civilization VI", playtime_forever: 12000 },
          { appid: 1145360, name: "Hades", playtime_forever: 3000 }
        ]
      });
    }

    try {`;

content = content.replace(targetOwned, goodOwned);

const targetRecent = `  app.get('/api/steam/recent-games', checkAuth, async (req: any, res: any) => {
    const user: any = req.user;
    const steamId = user.id;
    const apiKey = process.env.STEAM_API_KEY;

    try {`;

const goodRecent = `  app.get('/api/steam/recent-games', checkAuth, async (req: any, res: any) => {
    const user: any = req.user;
    const steamId = user.id;
    const apiKey = process.env.STEAM_API_KEY;

    if (steamId === 'mock') {
      return res.json({
        total_count: 1,
        games: [
          { appid: 413150, name: "Stardew Valley", playtime_forever: 6000 }
        ]
      });
    }

    try {`;

content = content.replace(targetRecent, goodRecent);

fs.writeFileSync('server.ts', content);
