const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

content = content.replace(
`                          <GameCard 
                            name={rec.name}
                            appId={rec.appId}
                            reason={rec.reason}
                            match={rec.estimatedMatch}
                            genres={rec.genres}
                            onDiscard={() => handleRestore(i)}`,
`                          <GameCard 
                            name={rec.name}
                            appId={rec.appId}
                            reason={rec.reason}
                            match={rec.estimatedMatch}
                            genres={rec.genres}
                            timeToBeat={rec.timeToBeat}
                            onDiscard={() => handleRestore(i)}`
);

fs.writeFileSync('src/components/Dashboard.tsx', content);
