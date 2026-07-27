const fs = require('fs');
let eb = fs.readFileSync('src/components/ErrorBoundary.tsx', 'utf8');

eb = eb.replace('export class ErrorBoundary extends Component<Props, State>', 'export class ErrorBoundary extends React.Component<Props, State>');

fs.writeFileSync('src/components/ErrorBoundary.tsx', eb);
