import React from 'react';
import { createRoot } from 'react-dom/client';
import 'monaco-editor/min/vs/editor/editor.main.css';
import App from './App';
import './styles/style.css';
import './styles/override.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(<App />);
