// TODO: Boot entry point.
// 1. Create PhaserGame instance (attaches canvas to document.body)
// 2. Mount React <App /> into #app div (HTML overlay above canvas)
// 3. Wire ProgressionSystem events → React screen transitions

import { createPhaserGame } from './game/PhaserGame';
import { mountReactApp } from './ui/App';

createPhaserGame();
mountReactApp(document.getElementById('app')!);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
