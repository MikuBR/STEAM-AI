const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('ErrorBoundary')) {
  content = content.replace('import Dashboard from ', "import { ErrorBoundary } from './components/ErrorBoundary';\nimport Dashboard from ");
  content = content.replace('return user ? <Dashboard user={user} /> : <Login onLogin={handleLogin} />;', 'return <ErrorBoundary>{user ? <Dashboard user={user} /> : <Login onLogin={handleLogin} />}</ErrorBoundary>;');
  fs.writeFileSync('src/App.tsx', content);
}
