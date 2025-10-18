// Initialize environment compatibility layer first
import './utils/env.js';

import './index.css';
import './styles/themes.css';
import App from './App.svelte';

const app = new App({
  target: document.getElementById('root')
});

export default app;
