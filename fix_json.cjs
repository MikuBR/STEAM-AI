const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const target = `  const [manualGames, setManualGames] = useState<Game[]>(() => {
    const saved = localStorage.getItem('manual_games');
    return saved ? JSON.parse(saved) : [];
  });`;

const replacement = `  const [manualGames, setManualGames] = useState<Game[]>(() => {
    try {
      const saved = localStorage.getItem('manual_games');
      return saved && saved !== 'undefined' ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse manual_games from localStorage", e);
      return [];
    }
  });`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/Dashboard.tsx', content);
