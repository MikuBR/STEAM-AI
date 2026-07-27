const fs = require('fs');
let gc = fs.readFileSync('src/components/GameCard.tsx', 'utf8');

gc = gc.replace('  genres,\n  onDiscard', '  genres,\n  timeToBeat,\n  onDiscard');
fs.writeFileSync('src/components/GameCard.tsx', gc);

let eb = fs.readFileSync('src/components/ErrorBoundary.tsx', 'utf8');
eb = eb.replace('this.props.children', 'this.props.children as ReactNode');
fs.writeFileSync('src/components/ErrorBoundary.tsx', eb);

