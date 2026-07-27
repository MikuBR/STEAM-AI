const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Replace all game.name.toLowerCase() with (game.name || '').toLowerCase()
content = content.replace(/game\.name\.toLowerCase\(\)/g, "(game.name || '').toLowerCase()");

// Replace localGame.name.toLowerCase()
content = content.replace(/localGame\.name\.toLowerCase\(\)/g, "(localGame.name || '').toLowerCase()");

// Replace app.name.toLowerCase()
content = content.replace(/app\.name\.toLowerCase\(\)/g, "(app.name || '').toLowerCase()");

// Replace manualGameName.toLowerCase()
content = content.replace(/manualGameName\.toLowerCase\(\)/g, "(manualGameName || '').toLowerCase()");

// Replace librarySearchFilter.toLowerCase()
content = content.replace(/librarySearchFilter\.toLowerCase\(\)/g, "(librarySearchFilter || '').toLowerCase()");

// Replace manualLibrarySearchFilter.toLowerCase()
content = content.replace(/manualLibrarySearchFilter\.toLowerCase\(\)/g, "(manualLibrarySearchFilter || '').toLowerCase()");

// In getGamerArchetype:
content = content.replace(/const name = game\.name\.toLowerCase\(\);/g, "const name = (game.name || '').toLowerCase();");

fs.writeFileSync('src/components/Dashboard.tsx', content);
