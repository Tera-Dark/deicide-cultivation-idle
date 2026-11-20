import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { installGlobalErrorTracking } from './platform/telemetry';
import './index.css';

installGlobalErrorTracking();

createRoot(document.getElementById('root')!).render(<App />);
